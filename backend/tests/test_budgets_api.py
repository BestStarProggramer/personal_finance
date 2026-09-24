import unittest
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.session import get_engine, get_session
from app.main import create_app


class BudgetApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.connection = get_engine().connect()
        self.addCleanup(self.connection.close)
        self.outer = self.connection.begin()
        self.addCleanup(self.outer.rollback)
        app = create_app()

        def test_session():
            with Session(self.connection, join_transaction_mode="create_savepoint", expire_on_commit=False) as session:
                yield session

        app.dependency_overrides[get_session] = test_session
        self.client = TestClient(app)
        self.addCleanup(self.client.close)
        self.category = self.create_category()
        self.data = {"category_id": self.category["id"], "month": "2026-09-01", "limit_kopecks": 500000}

    def create_category(self, category_type="expense") -> dict:
        response = self.client.post("/api/categories", json={"name": f"Budget-{uuid4()}", "type": category_type})
        self.assertEqual(response.status_code, 201, response.text)
        return response.json()

    def create_budget(self, **changes) -> dict:
        response = self.client.post("/api/budgets", json=self.data | changes)
        self.assertEqual(response.status_code, 201, response.text)
        self.assertNotIn("category_type", response.json())
        return response.json()

    def test_lifecycle(self) -> None:
        budget = self.create_budget(limit_kopecks=1)
        url = f'/api/budgets/{budget["id"]}'
        self.assertEqual(self.client.get(url).json(), budget)
        changed = self.data | {"limit_kopecks": 99999999999}
        response = self.client.put(url, json=changed)
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json(), changed | {"id": budget["id"]})
        other = self.create_category()
        changed = changed | {"category_id": other["id"], "month": "2027-01-01"}
        response = self.client.put(url, json=changed)
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(self.client.get(url).json(), changed | {"id": budget["id"]})
        self.assertEqual(self.client.delete(f'/api/categories/{self.category["id"]}').status_code, 204)
        response = self.client.delete(url)
        self.assertEqual(response.status_code, 204)
        self.assertEqual(response.content, b"")
        self.assertEqual(self.client.get(url).status_code, 404)
        self.assertEqual(self.client.delete(f'/api/categories/{other["id"]}').status_code, 204)

    def test_duplicate_and_conflicting_update(self) -> None:
        first = self.create_budget()
        response = self.client.post("/api/budgets", json=self.data | {"limit_kopecks": 1})
        self.assertEqual(response.status_code, 409, response.text)
        self.assertEqual(self.client.get(f'/api/budgets/{first["id"]}').json(), first)
        second = self.create_budget(month="2026-10-01")
        url = f'/api/budgets/{second["id"]}'
        self.assertEqual(self.client.put(url, json=self.data).status_code, 409)
        self.assertEqual(self.client.get(url).json(), second)
        other = self.create_category()
        self.create_budget(category_id=other["id"])
        self.assertEqual(self.client.put(url, json=self.data | {"category_id": other["id"]}).status_code, 409)
        self.assertEqual(self.client.get(url).json(), second)

    def test_income_category_rejected(self) -> None:
        income = self.create_category("income")
        data = self.data | {"category_id": income["id"]}
        self.assertEqual(self.client.post("/api/budgets", json=data).status_code, 422)
        budget = self.create_budget()
        url = f'/api/budgets/{budget["id"]}'
        self.assertEqual(self.client.put(url, json=data).status_code, 422)
        self.assertEqual(self.client.get(url).json(), budget)

    def test_invalid_payloads(self) -> None:
        budget = self.create_budget()
        url = f'/api/budgets/{budget["id"]}'
        invalid = [
            {"limit_kopecks": value} for value in (0, -1, 100000000000, 1.5, True, "100", None)
        ] + [
            {"month": "2026-09-02"}, {"month": "2026-02-30"}, {"month": "2026-09"},
            {"month": None}, {"category_id": "wrong"}, {"category_type": "income"}, {"extra": 1},
        ]
        for changes in invalid:
            with self.subTest(changes=changes):
                self.assertEqual(self.client.post("/api/budgets", json=self.data | changes).status_code, 422)
                self.assertEqual(self.client.put(url, json=self.data | changes).status_code, 422)
        for field in self.data:
            incomplete = {key: value for key, value in self.data.items() if key != field}
            self.assertEqual(self.client.post("/api/budgets", json=incomplete).status_code, 422)
            self.assertEqual(self.client.put(url, json=incomplete).status_code, 422)
        self.assertEqual(self.client.get(url).json(), budget)

    def test_missing_records(self) -> None:
        missing_url = f"/api/budgets/{uuid4()}"
        self.assertEqual(self.client.get(missing_url).status_code, 404)
        self.assertEqual(self.client.put(missing_url, json=self.data).status_code, 404)
        self.assertEqual(self.client.delete(missing_url).status_code, 404)
        self.assertEqual(self.client.get("/api/budgets/wrong").status_code, 422)
        data = self.data | {"category_id": str(uuid4())}
        self.assertEqual(self.client.post("/api/budgets", json=data).status_code, 404)
        budget = self.create_budget()
        url = f'/api/budgets/{budget["id"]}'
        self.assertEqual(self.client.put(url, json=data).status_code, 404)
        self.assertEqual(self.client.get(url).json(), budget)

    def test_filters_and_pagination(self) -> None:
        oldest = self.create_budget(month="2026-08-01")
        middle = self.create_budget()
        newest = self.create_budget(month="2026-10-01")
        other = self.create_category()
        self.create_budget(category_id=other["id"])
        params = {"category_id": self.category["id"]}
        self.assertEqual(self.client.get("/api/budgets", params=params).json(), [newest, middle, oldest])
        self.assertEqual(self.client.get("/api/budgets", params=params | {"month": "2026-09-01"}).json(), [middle])
        self.assertEqual(self.client.get("/api/budgets", params=params | {"limit": 1, "offset": 1}).json(), [middle])
        self.assertEqual(self.client.get("/api/budgets", params=params | {"month": "2027-01-01"}).json(), [])
        self.assertEqual(self.client.get("/api/budgets", params={"category_id": str(uuid4())}).json(), [])

    def test_invalid_filters(self) -> None:
        for params in (
            {"limit": 0}, {"limit": 101}, {"offset": -1}, {"category_id": "wrong"},
            {"month": "2026-09-02"}, {"month": "2026-02-30"}, {"month": "2026-09"},
        ):
            with self.subTest(params=params):
                self.assertEqual(self.client.get("/api/budgets", params=params).status_code, 422)

    def test_category_protected_until_budget_deleted(self) -> None:
        budget = self.create_budget()
        url = f'/api/categories/{self.category["id"]}'
        changed = {"name": self.category["name"], "type": "income"}
        self.assertEqual(self.client.delete(url).status_code, 409)
        self.assertEqual(self.client.put(url, json=changed).status_code, 409)
        self.assertEqual(self.client.delete(f'/api/budgets/{budget["id"]}').status_code, 204)
        self.assertEqual(self.client.put(url, json=changed).status_code, 200)

    def test_budget_deletion_preserves_transactions(self) -> None:
        response = self.client.post("/api/transactions", json={
            "category_id": self.category["id"], "amount_kopecks": 100, "date": "2026-09-20",
        })
        self.assertEqual(response.status_code, 201)
        transaction = response.json()
        budget = self.create_budget()
        self.assertEqual(self.client.delete(f'/api/budgets/{budget["id"]}').status_code, 204)
        self.assertEqual(self.client.get(f'/api/transactions/{transaction["id"]}').json(), transaction)
        self.assertEqual(self.client.delete(f'/api/categories/{self.category["id"]}').status_code, 409)

    def test_documentation(self) -> None:
        schema = self.client.get("/openapi.json").json()
        self.assertIn("201", schema["paths"]["/api/budgets"]["post"]["responses"])
        self.assertIn("204", schema["paths"]["/api/budgets/{budget_id}"]["delete"]["responses"])
        fields = schema["components"]["schemas"]["BudgetWrite"]["required"]
        self.assertEqual(set(fields), {"category_id", "month", "limit_kopecks"})


def tearDownModule() -> None:
    get_engine().dispose()


if __name__ == "__main__":
    unittest.main()
