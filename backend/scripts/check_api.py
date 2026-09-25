from contextlib import contextmanager
import json
from pathlib import Path
import socket
import subprocess
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.request import ProxyHandler, Request, build_opener
from uuid import uuid4

from sqlalchemy import delete, select
from sqlalchemy.exc import SQLAlchemyError

from app.db.session import get_engine
from app.models import Budget, Category, Transaction


def expect_equal(actual, expected, message: str) -> None:
    if actual != expected:
        raise AssertionError(message)


class Api:
    def __init__(self, port: int) -> None:
        self.base = f"http://127.0.0.1:{port}"
        self.opener = build_opener(ProxyHandler({}))

    def request(self, method: str, path: str, expected: int = 200, data: dict | None = None):
        body = None if data is None else json.dumps(data).encode("utf-8")
        request = Request(self.base + path, data=body, method=method, headers={"Content-Type": "application/json"})
        try:
            response = self.opener.open(request, timeout=10)
        except HTTPError as error:
            response = error
        with response:
            status = response.status
            payload = response.read()
        expect_equal(status, expected, f"{method} {path}: expected {expected}, received {status}")
        if status == 204:
            expect_equal(payload, b"", "DELETE response must be empty")
            return None
        return json.loads(payload)


@contextmanager
def running_server():
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 0))
        port = probe.getsockname()[1]
    process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", str(port)],
        cwd=Path(__file__).resolve().parents[1],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
    )
    api = Api(port)
    try:
        deadline = time.monotonic() + 20
        while time.monotonic() < deadline:
            if process.poll() is not None:
                raise RuntimeError("Uvicorn stopped before startup; check backend configuration")
            try:
                expect_equal(api.request("GET", "/api/health"), {"status": "ok"}, "API health failed")
                break
            except (URLError, TimeoutError):
                time.sleep(0.1)
        else:
            raise RuntimeError("Uvicorn startup timeout")
        yield api
    finally:
        if process.poll() is None:
            process.terminate()
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=5)


def cleanup(names: tuple[str, str]) -> None:
    engine = get_engine()
    try:
        with engine.begin() as connection:
            ids = list(connection.scalars(select(Category.id).where(Category.name.in_(names))))
            if ids:
                connection.execute(delete(Budget).where(Budget.category_id.in_(ids)))
                connection.execute(delete(Transaction).where(Transaction.category_id.in_(ids)))
                connection.execute(delete(Category).where(Category.id.in_(ids)))
    finally:
        engine.dispose()


def check_api() -> None:
    marker = uuid4().hex
    names = (f"Check-{marker}", f"Updated-{marker}")
    try:
        with running_server() as api:
            expect_equal(api.request("GET", "/api/health/db"), {"status": "ok"}, "Database health failed")
            schema = api.request("GET", "/openapi.json")
            for resource in ("categories", "transactions", "budgets"):
                if f"/api/{resource}" not in schema["paths"]:
                    raise AssertionError(f"Missing route: {resource}")
            category = api.request("POST", "/api/categories", 201, {"name": names[0], "type": "expense"})
            category_id = category["id"]
            transaction_data = {"category_id": category_id, "amount_kopecks": 125050, "date": "2026-09-21", "comment": "Check"}
            transaction = api.request("POST", "/api/transactions", 201, transaction_data)
            budget_data = {"category_id": category_id, "month": "2026-09-01", "limit_kopecks": 500000}
            budget = api.request("POST", "/api/budgets", 201, budget_data)
            api.request("POST", "/api/budgets", 409, budget_data)
            api.request("POST", "/api/transactions", 422, transaction_data | {"amount_kopecks": 0})
            api.request("DELETE", f"/api/categories/{category_id}", 409)
            print("PASS: creation, health, validation and linked category protection", flush=True)

        with running_server() as api:
            for resource, record in (("categories", category), ("transactions", transaction), ("budgets", budget)):
                loaded = api.request("GET", f'/api/{resource}/{record["id"]}')
                expect_equal(loaded, record, f"{resource}: data changed after restart")
            print("PASS: all three records survived backend restart", flush=True)
            category = api.request("PUT", f"/api/categories/{category_id}", data={"name": names[1], "type": "expense"})
            transaction_data |= {"amount_kopecks": 150000, "comment": "Updated"}
            transaction = api.request("PUT", f'/api/transactions/{transaction["id"]}', data=transaction_data)
            budget_data |= {"limit_kopecks": 600000}
            budget = api.request("PUT", f'/api/budgets/{budget["id"]}', data=budget_data)
            expect_equal(category["name"], names[1], "Category update failed")
            expect_equal(transaction["amount_kopecks"], 150000, "Transaction update failed")
            expect_equal(budget["limit_kopecks"], 600000, "Budget update failed")

        with running_server() as api:
            for resource, record in (("categories", category), ("transactions", transaction), ("budgets", budget)):
                expect_equal(api.request("GET", f'/api/{resource}/{record["id"]}'), record, f"{resource}: update not persisted")
            expect_equal(api.request("GET", f"/api/transactions?category_id={category_id}"), [transaction], "Transaction filter failed")
            expect_equal(api.request("GET", f"/api/budgets?category_id={category_id}&month=2026-09-01"), [budget], "Budget filter failed")
            for resource, record in (("budgets", budget), ("transactions", transaction), ("categories", category)):
                path = f'/api/{resource}/{record["id"]}'
                api.request("DELETE", path, 204)
                api.request("GET", path, 404)
            print("PASS: updates survived restart; filters and deletion work", flush=True)
    finally:
        cleanup(names)
        print("Temporary check records removed", flush=True)


if __name__ == "__main__":
    try:
        check_api()
    except SQLAlchemyError:
        raise SystemExit("Database check failed; verify PostgreSQL, backend/.env and migrations") from None
    except (AssertionError, RuntimeError, URLError, TimeoutError) as error:
        raise SystemExit(str(error)) from None
