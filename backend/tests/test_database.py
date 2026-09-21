from datetime import date
import unittest
from uuid import uuid4

from sqlalchemy import delete, inspect, select, text, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.session import get_engine
from app.models import Budget, Category, Transaction


class DatabaseTests(unittest.TestCase):
    def setUp(self) -> None:
        self.connection = get_engine().connect()
        self.addCleanup(self.connection.close)
        self.outer = self.connection.begin()
        self.addCleanup(self.outer.rollback)
        self.session = Session(self.connection, join_transaction_mode="create_savepoint")
        self.addCleanup(self.session.close)
        self.category = Category(name=f"Test-{uuid4()}", type="expense")
        self.session.add(self.category)
        self.session.flush()

    def assert_rejected(self, record, sqlstate: str) -> None:
        with self.assertRaises(IntegrityError) as caught:
            with self.session.begin_nested():
                self.session.add(record)
                self.session.flush()
        self.assertEqual(caught.exception.orig.sqlstate, sqlstate)

    def test_migration_and_read_write(self) -> None:
        self.assertEqual(self.session.execute(text("SELECT version_num FROM alembic_version")).scalar_one(), "0001")
        self.assertTrue({"categories", "transactions", "budgets"} <= set(inspect(self.connection).get_table_names()))
        record = Transaction(category=self.category, amount_kopecks=125050, date=date(2026, 9, 20), comment="Round trip")
        budget = Budget(category=self.category, month=date(2026, 9, 1), limit_kopecks=400000)
        self.session.add_all([record, budget])
        self.session.flush()
        record_id = record.id
        self.session.commit()
        self.session.expire_all()
        loaded = self.session.get(Transaction, record_id)
        self.assertEqual(loaded.amount_kopecks, 125050)
        self.assertEqual(loaded.category.type, "expense")
        self.assertEqual(budget.category_id, loaded.category_id)
        loaded.comment = "Updated"
        self.session.flush()
        self.session.expire_all()
        self.assertEqual(self.session.get(Transaction, record_id).comment, "Updated")
        self.session.delete(loaded)
        self.session.flush()
        self.assertIsNone(self.session.scalar(select(Transaction).where(Transaction.id == record_id)))

    def test_amounts_and_foreign_key(self) -> None:
        for amount in [0, -1, 100000000000]:
            self.assert_rejected(Transaction(category_id=self.category.id, amount_kopecks=amount, date=date.today()), "23514")
        self.assert_rejected(Transaction(category_id=uuid4(), amount_kopecks=100, date=date.today()), "23503")

    def test_category_constraints(self) -> None:
        self.assert_rejected(Category(name="   ", type="expense"), "23514")
        self.assert_rejected(Category(name="Invalid", type="other"), "23514")
        self.assert_rejected(Category(name=self.category.name, type="expense"), "23505")

    def test_budget_constraints(self) -> None:
        base = dict(category_id=self.category.id, month=date(2026, 9, 1), limit_kopecks=100)
        self.session.add(Budget(**base))
        self.session.flush()
        self.assert_rejected(Budget(**base), "23505")
        self.assert_rejected(Budget(**{**base, "month": date(2026, 10, 2)}), "23514")
        for amount in [0, -1, 100000000000]:
            self.assert_rejected(Budget(**{**base, "month": date(2026, 10, 1), "limit_kopecks": amount}), "23514")
        income = Category(name=f"Income-{uuid4()}", type="income")
        self.session.add(income)
        self.session.flush()
        self.assert_rejected(Budget(**{**base, "category_id": income.id}), "23503")
        self.assert_rejected(Budget(**{**base, "category_id": income.id, "category_type": "income"}), "23514")

    def test_referenced_category_cannot_be_deleted(self) -> None:
        self.session.add(Transaction(category_id=self.category.id, amount_kopecks=100, date=date.today()))
        self.session.flush()
        with self.assertRaises(IntegrityError) as caught:
            with self.session.begin_nested():
                self.session.execute(delete(Category).where(Category.id == self.category.id))
        self.assertEqual(caught.exception.orig.sqlstate, "23001")

    def test_budget_prevents_category_type_change(self) -> None:
        self.session.add(Budget(category_id=self.category.id, month=date(2026, 9, 1), limit_kopecks=100))
        self.session.flush()
        with self.assertRaises(IntegrityError) as caught:
            with self.session.begin_nested():
                self.session.execute(update(Category).where(Category.id == self.category.id).values(type="income"))
        self.assertEqual(caught.exception.orig.sqlstate, "23001")


if __name__ == "__main__":
    unittest.main()
