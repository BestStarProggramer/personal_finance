from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "categories",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("name", sa.String(80), nullable=False),
        sa.Column("type", sa.String(7), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_categories"),
        sa.CheckConstraint("type IN ('income', 'expense')", name=op.f("ck_categories_valid_type")),
        sa.CheckConstraint("length(btrim(name)) > 0", name=op.f("ck_categories_name_not_blank")),
        sa.UniqueConstraint("name", "type", name="uq_categories_name_type"),
        sa.UniqueConstraint("id", "type", name="uq_categories_id_type"),
    )
    op.create_table(
        "transactions",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("category_id", sa.Uuid(), nullable=False),
        sa.Column("amount_kopecks", sa.BigInteger(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("comment", sa.String(200), server_default="", nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_transactions"),
        sa.CheckConstraint("amount_kopecks BETWEEN 1 AND 99999999999", name=op.f("ck_transactions_valid_amount")),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"], name="fk_transactions_category_id_categories", ondelete="RESTRICT"),
    )
    op.create_index("ix_transactions_category_id", "transactions", ["category_id"])
    op.create_index("ix_transactions_date", "transactions", ["date"])
    op.create_table(
        "budgets",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("category_id", sa.Uuid(), nullable=False),
        sa.Column("category_type", sa.String(7), server_default="expense", nullable=False),
        sa.Column("month", sa.Date(), nullable=False),
        sa.Column("limit_kopecks", sa.BigInteger(), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_budgets"),
        sa.CheckConstraint("limit_kopecks BETWEEN 1 AND 99999999999", name=op.f("ck_budgets_valid_limit")),
        sa.CheckConstraint("EXTRACT(DAY FROM month) = 1", name=op.f("ck_budgets_month_first_day")),
        sa.CheckConstraint("category_type = 'expense'", name=op.f("ck_budgets_expense_only")),
        sa.UniqueConstraint("category_id", "month", name="uq_budgets_category_month"),
        sa.ForeignKeyConstraint(["category_id", "category_type"], ["categories.id", "categories.type"], name="fk_budgets_category_id_categories", ondelete="RESTRICT", onupdate="RESTRICT"),
    )
    op.create_index("ix_budgets_month", "budgets", ["month"])


def downgrade() -> None:
    op.drop_table("budgets")
    op.drop_table("transactions")
    op.drop_table("categories")
