"""Add auth columns to users, like support to shared_programs, retarget reactions.

Revision ID: 20260327_0004
Revises: 20260318_0003
Create Date: 2026-03-27
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20260327_0004"
down_revision: Union[str, None] = "20260318_0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- users: add auth columns ---
    op.add_column("users", sa.Column("username", sa.String(40), nullable=True))
    op.add_column("users", sa.Column("password_hash", sa.String(), nullable=True))
    op.add_column(
        "users",
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.create_unique_constraint("uq_users_username", "users", ["username"])
    op.create_index("ix_users_username", "users", ["username"], unique=True)

    # --- shared_programs: add sharer_user_id + like_count ---
    op.add_column(
        "shared_programs",
        sa.Column("sharer_user_id", sa.String(), nullable=True),
    )
    op.create_foreign_key(
        "fk_shared_programs_sharer_user_id",
        "shared_programs",
        "users",
        ["sharer_user_id"],
        ["id"],
    )
    op.create_index(
        "ix_shared_programs_sharer_user_id",
        "shared_programs",
        ["sharer_user_id"],
    )
    op.add_column(
        "shared_programs",
        sa.Column("like_count", sa.Integer(), nullable=False, server_default="0"),
    )

    # --- program_reactions: retarget FK from programs to shared_programs ---
    # Drop old constraints and indexes
    op.drop_constraint(
        "uq_program_reactions_user_program", "program_reactions", type_="unique"
    )
    op.drop_index("ix_program_reactions_program_id", table_name="program_reactions")

    # Rename column
    op.alter_column(
        "program_reactions", "program_id", new_column_name="shared_program_id"
    )

    # Drop old FK (PostgreSQL auto-generated name)
    op.drop_constraint(
        "program_reactions_program_id_fkey", "program_reactions", type_="foreignkey"
    )

    # Create new FK and constraints
    op.create_foreign_key(
        "fk_program_reactions_shared_program_id",
        "program_reactions",
        "shared_programs",
        ["shared_program_id"],
        ["id"],
    )
    op.create_unique_constraint(
        "uq_reactions_user_shared_program",
        "program_reactions",
        ["user_id", "shared_program_id"],
    )
    op.create_index(
        "ix_program_reactions_shared_program_id",
        "program_reactions",
        ["shared_program_id"],
    )


def downgrade() -> None:
    # --- program_reactions: revert to programs FK ---
    op.drop_index(
        "ix_program_reactions_shared_program_id", table_name="program_reactions"
    )
    op.drop_constraint(
        "uq_reactions_user_shared_program", "program_reactions", type_="unique"
    )
    op.drop_constraint(
        "fk_program_reactions_shared_program_id",
        "program_reactions",
        type_="foreignkey",
    )
    op.alter_column(
        "program_reactions", "shared_program_id", new_column_name="program_id"
    )
    op.create_foreign_key(
        "program_reactions_program_id_fkey",
        "program_reactions",
        "programs",
        ["program_id"],
        ["id"],
    )
    op.create_index(
        "ix_program_reactions_program_id", "program_reactions", ["program_id"]
    )
    op.create_unique_constraint(
        "uq_program_reactions_user_program",
        "program_reactions",
        ["user_id", "program_id"],
    )

    # --- shared_programs: remove columns ---
    op.drop_column("shared_programs", "like_count")
    op.drop_index("ix_shared_programs_sharer_user_id", table_name="shared_programs")
    op.drop_constraint(
        "fk_shared_programs_sharer_user_id", "shared_programs", type_="foreignkey"
    )
    op.drop_column("shared_programs", "sharer_user_id")

    # --- users: remove auth columns ---
    op.drop_index("ix_users_username", table_name="users")
    op.drop_constraint("uq_users_username", "users", type_="unique")
    op.drop_column("users", "is_verified")
    op.drop_column("users", "password_hash")
    op.drop_column("users", "username")
