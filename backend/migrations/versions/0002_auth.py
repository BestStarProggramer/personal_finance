from uuid import uuid4

from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("email", sa.String(254), nullable=False),
        sa.Column("name", sa.String(80), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_users"),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )
    op.create_table(
        "refresh_sessions",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("token_hash", sa.String(64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_refresh_sessions"),
        sa.UniqueConstraint("token_hash", name="uq_refresh_sessions_token_hash"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_refresh_sessions_user_id_users", ondelete="CASCADE"),
    )
    op.create_index("ix_refresh_sessions_user_id", "refresh_sessions", ["user_id"])
    op.add_column("categories", sa.Column("owner_id", sa.Uuid(), nullable=True))
    connection = op.get_bind()
    if connection.scalar(sa.text("SELECT EXISTS (SELECT 1 FROM categories)")):
        legacy_id = uuid4()
        connection.execute(sa.text(
            "INSERT INTO users (id, email, name, password_hash, is_active) VALUES (:id, :email, :name, :hash, false)"
        ), {"id": legacy_id, "email": f"legacy-{legacy_id.hex}@example.invalid", "name": "Архив до регистрации", "hash": "!disabled-account"})
        connection.execute(sa.text("UPDATE categories SET owner_id = :id"), {"id": legacy_id})
    op.alter_column("categories", "owner_id", nullable=False)
    op.create_foreign_key("fk_categories_owner_id_users", "categories", "users", ["owner_id"], ["id"], ondelete="RESTRICT")
    op.create_index("ix_categories_owner_id", "categories", ["owner_id"])
    op.drop_constraint("uq_categories_name_type", "categories", type_="unique")
    op.create_unique_constraint("uq_categories_owner_name_type", "categories", ["owner_id", "name", "type"])


def downgrade() -> None:
    op.drop_constraint("uq_categories_owner_name_type", "categories", type_="unique")
    op.create_unique_constraint("uq_categories_name_type", "categories", ["name", "type"])
    op.drop_column("categories", "owner_id")
    op.drop_table("refresh_sessions")
    op.drop_table("users")
