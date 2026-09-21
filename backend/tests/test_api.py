from datetime import date
import unittest
from unittest.mock import patch
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from app.db.session import get_engine, get_session
from app.main import create_app
from app.models import Budget


class ApiTests(unittest.TestCase):
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
        self.client = TestClient(self.app)
        self.addCleanup(self.client.close)

    def create_category(self, category_type="expense") -> dict:
        data = {"name": f"API-{uuid4()}", "type": category_type}
        response = self.client.post("/api/categories", json=data)
        self.assertEqual(response.status_code, 201, response.text)
        return response.json()

    def create_transaction(self, category_id: str, **changes) -> dict:
        data = {"category_id": category_id, "amount_kopecks": 125050, "date": "2026-09-20", "comment": "Test"}
        response = self.client.post("/api/transactions", json=data | changes)
        self.assertEqual(response.status_code, 201, response.text)
        return response.json()

    def test_category_lifecycle(self) -> None:
        category = self.create_category()
        url = f'/api/categories/{category["id"]}'
        self.assertEqual(self.client.get(url).json(), category)
        renamed = {"name": f'  Renamed-{uuid4()}  ', "type": "income"}
        response = self.client.put(url, json=renamed)
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["name"], renamed["name"].strip())
        self.assertEqual(response.json()["type"], "income")
        response = self.client.get("/api/categories", params={"type": "income", "limit": 1})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)
        self.assertTrue(all(item["type"] == "income" for item in response.json()))
        response = self.client.delete(url)
        self.assertEqual(response.status_code, 204)
        self.assertEqual(response.content, b"")
        self.assertEqual(self.client.get(url).status_code, 404)

    def test_category_conflicts_and_unchanged_record(self) -> None:
        first = self.create_category()
        second = self.create_category()
        duplicate = {"name": first["name"], "type": first["type"]}
        self.assertEqual(self.client.post("/api/categories", json=duplicate).status_code, 409)
        url = f'/api/categories/{second["id"]}'
        self.assertEqual(self.client.put(url, json=duplicate).status_code, 409)
        self.assertEqual(self.client.get(url).json(), second)
        self.assertEqual(self.client.post("/api/categories", json=duplicate | {"type": "income"}).status_code, 201)

    def test_invalid_categories(self) -> None:
        valid = {"name": "Test", "type": "expense"}
        for changes in ({"name": " \t\n"}, {"name": "x" * 81}, {"name": None}, {"type": "other"}, {"extra": 1}):
            with self.subTest(changes=changes):
                response = self.client.post("/api/categories", json=valid | changes)
                self.assertEqual(response.status_code, 422, response.text)
                self.assertIn("detail", response.json())
        self.assertEqual(self.client.post("/api/categories", json={}).status_code, 422)

    def test_transaction_lifecycle(self) -> None:
        category = self.create_category()
        transaction = self.create_transaction(category["id"])
        url = f'/api/transactions/{transaction["id"]}'
        self.assertEqual(self.client.get(url).json(), transaction)
        other = self.create_category("income")
        changed = {"category_id": other["id"], "amount_kopecks": 99999999999, "date": "2026-10-01"}
        response = self.client.put(url, json=changed)
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json(), changed | {"id": transaction["id"], "comment": ""})
        self.assertEqual(self.client.get(url).json(), response.json())
        response = self.client.delete(url)
        self.assertEqual(response.status_code, 204)
        self.assertEqual(response.content, b"")
        self.assertEqual(self.client.get(url).status_code, 404)
        self.assertEqual(self.client.delete(f'/api/categories/{other["id"]}').status_code, 204)

    def test_invalid_transactions(self) -> None:
        category = self.create_category()
        valid = {"category_id": category["id"], "amount_kopecks": 1, "date": "2026-09-20"}
        invalid = [
            {"amount_kopecks": value} for value in (0, -1, 100000000000, 1.5, True, "100", None)
        ] + [{"date": "2026-02-30"}, {"category_id": "wrong"}, {"comment": "x" * 201}, {"comment": None}, {"extra": 1}]
        for changes in invalid:
            with self.subTest(changes=changes):
                response = self.client.post("/api/transactions", json=valid | changes)
                self.assertEqual(response.status_code, 422, response.text)
        transaction = self.create_transaction(category["id"])
        url = f'/api/transactions/{transaction["id"]}'
        self.assertEqual(self.client.put(url, json={"comment": "partial"}).status_code, 422)
        self.assertEqual(self.client.get(url).json(), transaction)

    def test_missing_records(self) -> None:
        missing_id = str(uuid4())
        bodies = {
            "categories": {"name": "Missing", "type": "expense"},
            "transactions": {"category_id": missing_id, "amount_kopecks": 100, "date": "2026-09-20"},
        }
        for resource, body in bodies.items():
            url = f"/api/{resource}/{missing_id}"
            self.assertEqual(self.client.get(url).status_code, 404)
            self.assertEqual(self.client.put(url, json=body).status_code, 404)
            self.assertEqual(self.client.delete(url).status_code, 404)
            self.assertEqual(self.client.get(f"/api/{resource}/wrong").status_code, 422)
        self.assertEqual(self.client.post("/api/transactions", json=bodies["transactions"]).status_code, 404)
        category = self.create_category()
        transaction = self.create_transaction(category["id"])
        url = f'/api/transactions/{transaction["id"]}'
        self.assertEqual(self.client.put(url, json=bodies["transactions"]).status_code, 404)
        self.assertEqual(self.client.get(url).json(), transaction)

    def test_category_with_transaction_is_protected(self) -> None:
        category = self.create_category()
        self.create_transaction(category["id"])
        self.assert_category_protected(category)

    def test_category_with_budget_is_protected(self) -> None:
        category = self.create_category()
        with Session(self.connection, join_transaction_mode="create_savepoint") as session:
            session.add(Budget(category_id=category["id"], month=date(2026, 9, 1), limit_kopecks=100))
            session.commit()
        self.assert_category_protected(category)

    def assert_category_protected(self, category: dict) -> None:
        url = f'/api/categories/{category["id"]}'
        self.assertEqual(self.client.delete(url).status_code, 409)
        data = {"name": category["name"], "type": "income"}
        self.assertEqual(self.client.put(url, json=data).status_code, 409)
        self.assertEqual(self.client.get(url).json(), category)
        data = {"name": f'Renamed-{uuid4()}', "type": "expense"}
        self.assertEqual(self.client.put(url, json=data).status_code, 200)

    def test_transaction_filters_and_pagination(self) -> None:
        category = self.create_category()
        oldest = self.create_transaction(category["id"], date="2026-08-31")
        middle = self.create_transaction(category["id"], date="2026-09-01")
        newest = self.create_transaction(category["id"], date="2026-09-30")
        base = {"category_id": category["id"]}
        response = self.client.get("/api/transactions", params=base)
        self.assertEqual(response.json(), [newest, middle, oldest])
        response = self.client.get("/api/transactions", params=base | {"date_from": "2026-09-01", "date_to": "2026-09-30"})
        self.assertEqual(response.json(), [newest, middle])
        response = self.client.get("/api/transactions", params=base | {"limit": 1, "offset": 1})
        self.assertEqual(response.json(), [middle])
        response = self.client.get("/api/transactions", params=base | {"type": "income"})
        self.assertEqual(response.json(), [])
        response = self.client.get("/api/transactions", params={"category_id": str(uuid4())})
        self.assertEqual(response.json(), [])

    def test_invalid_filters(self) -> None:
        for resource in ("categories", "transactions"):
            for params in ({"limit": 0}, {"limit": 101}, {"offset": -1}, {"type": "other"}):
                self.assertEqual(self.client.get(f"/api/{resource}", params=params).status_code, 422)
        for params in (
            {"date_from": "2026-02-30"}, {"category_id": "wrong"},
            {"date_from": "2026-10-01", "date_to": "2026-09-01"},
        ):
            self.assertEqual(self.client.get("/api/transactions", params=params).status_code, 422)

    def test_database_conflict_rolls_back(self) -> None:
        category = self.create_category()
        data = {"name": category["name"], "type": category["type"]}
        with patch("app.services.categories.ensure_unique"):
            response = self.client.post("/api/categories", json=data)
        self.assertEqual(response.status_code, 409, response.text)
        self.assertEqual(set(response.json()), {"detail"})
        self.assertNotIn("INSERT", response.text)
        self.create_category()

    def test_database_unavailable(self) -> None:
        def unavailable_session():
            raise OperationalError("private SQL", {}, Exception("private connection details"))

        self.app.dependency_overrides[get_session] = unavailable_session
        response = self.client.get("/api/categories")
        self.assertEqual(response.status_code, 503)
        self.assertNotIn("private", response.text)

    def test_documentation(self) -> None:
        self.assertEqual(self.client.get("/docs").status_code, 200)
        schema = self.client.get("/openapi.json").json()
        for resource in ("categories", "transactions"):
            self.assertIn("201", schema["paths"][f"/api/{resource}"]["post"]["responses"])


def tearDownModule() -> None:
    get_engine().dispose()


if __name__ == "__main__":
    unittest.main()
