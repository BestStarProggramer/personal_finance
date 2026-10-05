from datetime import timedelta
import unittest
from uuid import UUID, uuid4
from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import decode_access, hash_refresh, password_hasher, utcnow
from app.db.session import get_engine, get_session
from app.main import create_app
from app.models import RefreshSession, User


class AuthApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.connection = get_engine().connect()
        self.addCleanup(self.connection.close)
        self.outer = self.connection.begin()
        self.addCleanup(self.outer.rollback)
        self.app = create_app()

        def test_session():
            with Session(self.connection, join_transaction_mode="create_savepoint", expire_on_commit=False) as session:
                yield session

        self.app.dependency_overrides[get_session] = test_session
        self.client = self.new_client()

    def new_client(self):
        client = TestClient(self.app)
        self.addCleanup(client.close)
        return client

    def register(self, client=None, **changes):
        client = client or self.client
        data = {"name": "Проверка", "email": f"auth-{uuid4()}@example.com", "password": "TestPassword123"} | changes
        response = client.post("/api/auth/register", json=data)
        self.assertEqual(response.status_code, 201, response.text)
        client.headers["Authorization"] = f"Bearer {response.json()['access_token']}"
        return response.json(), data

    def database(self):
        return Session(self.connection, join_transaction_mode="create_savepoint")

    def test_registration_hash_cookie_and_me(self):
        result, data = self.register(email=f"UPPER-{uuid4()}@EXAMPLE.COM")
        self.assertEqual(result["user"]["email"], data["email"].lower())
        self.assertEqual(set(result["user"]), {"id", "email", "name"})
        self.assertEqual(result["expires_in"], 900)
        self.assertGreater(result["refresh_expires_in"], 604790)
        self.assertEqual(self.client.get("/api/auth/me").json(), result["user"])
        raw = self.client.cookies.get("finance_refresh")
        with self.database() as session:
            user = session.get(User, UUID(result["user"]["id"]))
            self.assertTrue(user.password_hash.startswith("$argon2id$"))
            self.assertNotEqual(user.password_hash, data["password"])
            self.assertTrue(password_hasher.verify(data["password"], user.password_hash))
            record = session.scalar(select(RefreshSession).where(RefreshSession.user_id == user.id))
            self.assertEqual(record.token_hash, hash_refresh(raw))
            self.assertNotEqual(record.token_hash, raw)
        login = self.client.post("/api/auth/login", json={"email": data["email"], "password": data["password"]})
        self.assertEqual(login.status_code, 200)
        cookie = login.headers["set-cookie"].lower()
        for part in ["httponly", "samesite=lax", "path=/api/auth"]:
            self.assertIn(part, cookie)
        self.assertEqual(login.headers["cache-control"], "no-store")

    def test_duplicate_and_validation(self):
        _, data = self.register()
        self.assertEqual(self.client.post("/api/auth/register", json=data | {"email": data["email"].upper()}).status_code, 409)
        for changes in ({"email": "bad"}, {"password": "short"}, {"password": "x" * 129}, {"name": " "}, {"extra": True}):
            response = self.client.post("/api/auth/register", json=data | changes)
            self.assertEqual(response.status_code, 422)
            self.assertTrue(all(set(problem) == {"loc", "msg", "type"} for problem in response.json()["detail"]))
            self.assertNotIn('"input"', response.text)

    def test_wrong_credentials_and_disabled_user(self):
        result, data = self.register()
        for credentials in ({"email": data["email"], "password": "wrong"}, {"email": "missing@example.com", "password": "wrong"}):
            response = self.client.post("/api/auth/login", json=credentials)
            self.assertEqual(response.status_code, 401)
            self.assertEqual(response.json()["detail"], "Неверный email или пароль.")
        with self.database() as session:
            session.get(User, UUID(result["user"]["id"])).is_active = False
            session.commit()
        self.assertEqual(self.client.get("/api/auth/me").status_code, 401)
        self.assertEqual(self.client.post("/api/auth/refresh").status_code, 401)

    def test_private_routes_require_access(self):
        _, data = self.register()
        anonymous = self.new_client()
        for resource in ("categories", "transactions", "budgets"):
            for method, path in (("GET", f"/api/{resource}"), ("POST", f"/api/{resource}"), ("GET", f"/api/{resource}/{uuid4()}"), ("PUT", f"/api/{resource}/{uuid4()}"), ("DELETE", f"/api/{resource}/{uuid4()}")):
                self.assertEqual(anonymous.request(method, path, json={}).status_code, 401)
        self.assertEqual(anonymous.get("/api/auth/me").status_code, 401)
        self.assertEqual(anonymous.get("/api/health").status_code, 200)
        self.assertEqual(anonymous.get("/docs").status_code, 200)

    def test_invalid_and_expired_access(self):
        result, _ = self.register()
        user_id, session_id = decode_access(result["access_token"])
        from app.core.security import encode_access
        with patch("app.core.security.utcnow", return_value=utcnow() - timedelta(seconds=1000)):
            expired = encode_access(user_id, session_id)
        for token in ("bad", result["access_token"][:-8] + "tampered", expired, self.client.cookies.get("finance_refresh")):
            self.assertEqual(self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"}).status_code, 401)
        self.assertEqual(self.client.post("/api/auth/refresh").status_code, 200)

    def test_refresh_rotation_rejects_replay_and_does_not_extend_deadline(self):
        self.register()
        original = self.client.cookies.get("finance_refresh")
        with self.database() as session:
            deadline = session.scalar(select(RefreshSession).where(RefreshSession.token_hash == hash_refresh(original))).expires_at
        refreshed = self.client.post("/api/auth/refresh")
        self.assertEqual(refreshed.status_code, 200)
        current = self.client.cookies.get("finance_refresh")
        self.assertNotEqual(original, current)
        replay = self.new_client()
        replay.cookies.set("finance_refresh", original, path="/api/auth")
        self.assertEqual(replay.post("/api/auth/refresh").status_code, 401)
        with self.database() as session:
            self.assertEqual(session.scalar(select(RefreshSession).where(RefreshSession.token_hash == hash_refresh(current))).expires_at, deadline)

    def test_missing_invalid_and_expired_refresh(self):
        anonymous = self.new_client()
        self.assertEqual(anonymous.post("/api/auth/refresh").status_code, 401)
        anonymous.cookies.set("finance_refresh", "invalid", path="/api/auth")
        self.assertEqual(anonymous.post("/api/auth/refresh").status_code, 401)
        self.register()
        raw = self.client.cookies.get("finance_refresh")
        with self.database() as session:
            session.scalar(select(RefreshSession).where(RefreshSession.token_hash == hash_refresh(raw))).expires_at = utcnow() - timedelta(seconds=1)
            session.commit()
        self.assertEqual(self.client.post("/api/auth/refresh").status_code, 401)

    def test_logout_revokes_refresh_and_access_but_keeps_another_session(self):
        original, data = self.register()
        raw = self.client.cookies.get("finance_refresh")
        other = self.new_client()
        login = other.post("/api/auth/login", json={"email": data["email"], "password": data["password"]})
        self.assertEqual(login.status_code, 200)
        other.headers["Authorization"] = f"Bearer {login.json()['access_token']}"
        response = self.client.post("/api/auth/logout")
        self.assertEqual(response.status_code, 204)
        self.assertEqual(response.content, b"")
        self.assertIsNone(self.client.cookies.get("finance_refresh"))
        self.assertEqual(self.client.get("/api/auth/me").status_code, 401)
        replay = self.new_client()
        replay.cookies.set("finance_refresh", raw, path="/api/auth")
        self.assertEqual(replay.post("/api/auth/refresh").status_code, 401)
        self.assertEqual(other.get("/api/auth/me").status_code, 200)
        self.assertEqual(other.post("/api/auth/refresh").status_code, 200)
        self.assertEqual(self.client.post("/api/auth/logout").status_code, 204)

    def test_logout_with_rotated_cookie_and_expired_access(self):
        result, _ = self.register()
        user_id, sid = decode_access(result["access_token"])
        old_refresh = self.client.cookies.get("finance_refresh")
        self.assertEqual(self.client.post("/api/auth/refresh").status_code, 200)
        from app.core.security import encode_access
        with patch("app.core.security.utcnow", return_value=utcnow() - timedelta(seconds=1000)):
            expired = encode_access(user_id, sid)
        stale = self.new_client()
        stale.cookies.set("finance_refresh", old_refresh, path="/api/auth")
        self.assertEqual(stale.post("/api/auth/logout", headers={"Authorization": f"Bearer {expired}"}).status_code, 204)
        self.assertEqual(self.client.post("/api/auth/refresh").status_code, 401)

    def test_ownership_of_every_resource_and_category_assignment(self):
        self.register()
        category = self.client.get("/api/categories").json()[0]
        expense = next(item for item in self.client.get("/api/categories").json() if item["type"] == "expense")
        tx_data = {"category_id": expense["id"], "amount_kopecks": 100, "date": "2026-10-02"}
        budget_data = {"category_id": expense["id"], "month": "2026-10-01", "limit_kopecks": 500}
        tx = self.client.post("/api/transactions", json=tx_data).json()
        budget = self.client.post("/api/budgets", json=budget_data).json()
        other = self.new_client()
        self.register(other)
        for resource, record, body in (("categories", category, {"name": "Foreign", "type": "expense"}), ("transactions", tx, tx_data), ("budgets", budget, budget_data)):
            path = f"/api/{resource}/{record['id']}"
            for method in ("GET", "PUT", "DELETE"):
                self.assertEqual(other.request(method, path, json=body).status_code, 404)
            self.assertNotIn(record["id"], [item["id"] for item in other.get(f"/api/{resource}").json()])
        for resource, body in (("transactions", tx_data), ("budgets", budget_data)):
            self.assertEqual(other.post(f"/api/{resource}", json=body).status_code, 404)
        own_cat = next(item for item in other.get('/api/categories').json() if item['type'] == 'expense')
        own_tx = other.post('/api/transactions', json=tx_data | {'category_id': own_cat['id']}).json()
        self.assertEqual(other.put(f"/api/transactions/{own_tx['id']}", json=tx_data).status_code, 404)
        self.assertEqual(other.get(f"/api/transactions/{own_tx['id']}").json()['category_id'], own_cat['id'])

    def test_origin_and_cookie_secure_setting(self):
        _, data = self.register()
        self.assertEqual(self.client.post("/api/auth/refresh", headers={"Origin": "https://evil.example"}).status_code, 403)
        self.assertEqual(self.client.post("/api/auth/logout", headers={"Sec-Fetch-Site": "cross-site"}).status_code, 403)
        self.assertEqual(self.client.post("/api/auth/refresh", headers={"Origin": "http://localhost:5173"}).status_code, 200)
        from app.core.config import get_settings
        settings = get_settings().model_copy(update={"cookie_secure": True})
        with patch("app.api.auth.get_settings", return_value=settings):
            response = self.client.post('/api/auth/login', json={'email': data['email'], 'password': data['password']})
        self.assertIn('Secure', response.headers['set-cookie'])


def tearDownModule():
    get_engine().dispose()
