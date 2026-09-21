from __future__ import annotations

from datetime import date as CalendarDate
from uuid import UUID, uuid4

from sqlalchemy import BigInteger, CheckConstraint, Date, ForeignKey, ForeignKeyConstraint, String, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Category(Base):
    __tablename__ = "categories"
    __table_args__ = (
        CheckConstraint("type IN ('income', 'expense')", name="valid_type"),
        CheckConstraint("length(btrim(name)) > 0", name="name_not_blank"),
        UniqueConstraint("name", "type", name="uq_categories_name_type"),
        UniqueConstraint("id", "type", name="uq_categories_id_type"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4, server_default=text("gen_random_uuid()"))
    name: Mapped[str] = mapped_column(String(80))
    type: Mapped[str] = mapped_column(String(7))
    transactions: Mapped[list[Transaction]] = relationship(back_populates="category", passive_deletes="all")
    budgets: Mapped[list[Budget]] = relationship(back_populates="category", passive_deletes="all")


class Transaction(Base):
    __tablename__ = "transactions"
    __table_args__ = (
        CheckConstraint("amount_kopecks BETWEEN 1 AND 99999999999", name="valid_amount"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4, server_default=text("gen_random_uuid()"))
    category_id: Mapped[UUID] = mapped_column(ForeignKey("categories.id", ondelete="RESTRICT"), index=True)
    amount_kopecks: Mapped[int] = mapped_column(BigInteger)
    date: Mapped[CalendarDate] = mapped_column(Date, index=True)
    comment: Mapped[str] = mapped_column(String(200), default="", server_default="")
    category: Mapped[Category] = relationship(back_populates="transactions")


class Budget(Base):
    __tablename__ = "budgets"
    __table_args__ = (
        CheckConstraint("limit_kopecks BETWEEN 1 AND 99999999999", name="valid_limit"),
        CheckConstraint("EXTRACT(DAY FROM month) = 1", name="month_first_day"),
        CheckConstraint("category_type = 'expense'", name="expense_only"),
        UniqueConstraint("category_id", "month", name="uq_budgets_category_month"),
        ForeignKeyConstraint(
            ["category_id", "category_type"], ["categories.id", "categories.type"],
            ondelete="RESTRICT", onupdate="RESTRICT",
        ),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4, server_default=text("gen_random_uuid()"))
    category_id: Mapped[UUID] = mapped_column()
    category_type: Mapped[str] = mapped_column(String(7), default="expense", server_default="expense")
    month: Mapped[CalendarDate] = mapped_column(Date, index=True)
    limit_kopecks: Mapped[int] = mapped_column(BigInteger)
    category: Mapped[Category] = relationship(back_populates="budgets")
