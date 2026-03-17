"""Initial PostgreSQL schema for Vercel deployment.

Revision ID: 20260312_0001
Revises:
Create Date: 2026-03-12
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20260312_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("external_id", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("display_name", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("external_id"),
    )
    op.create_index(op.f("ix_users_external_id"), "users", ["external_id"], unique=True)

    op.create_table(
        "sessions",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=True),
        sa.Column("modality", sa.String(), nullable=False),
        sa.Column("owner_user_id", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_sessions_owner_user_id"), "sessions", ["owner_user_id"], unique=False)

    op.create_table(
        "programs",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("code", sa.Text(), nullable=False),
        sa.Column("modality", sa.String(), nullable=False),
        sa.Column("generation", sa.Integer(), nullable=True),
        sa.Column("parent_ids", sa.JSON(), nullable=True),
        sa.Column("session_id", sa.String(), nullable=False),
        sa.Column("creator_user_id", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["creator_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["session_id"], ["sessions.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_programs_creator_user_id"), "programs", ["creator_user_id"], unique=False)
    op.create_index(op.f("ix_programs_session_id"), "programs", ["session_id"], unique=False)

    op.create_table(
        "program_reactions",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("program_id", sa.String(), nullable=False),
        sa.Column("reaction", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.CheckConstraint("reaction IN (-1, 1)", name="ck_program_reactions_reaction_value"),
        sa.ForeignKeyConstraint(["program_id"], ["programs.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "program_id", name="uq_program_reactions_user_program"),
    )
    op.create_index(op.f("ix_program_reactions_program_id"), "program_reactions", ["program_id"], unique=False)
    op.create_index(op.f("ix_program_reactions_user_id"), "program_reactions", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_program_reactions_user_id"), table_name="program_reactions")
    op.drop_index(op.f("ix_program_reactions_program_id"), table_name="program_reactions")
    op.drop_table("program_reactions")

    op.drop_index(op.f("ix_programs_session_id"), table_name="programs")
    op.drop_index(op.f("ix_programs_creator_user_id"), table_name="programs")
    op.drop_table("programs")

    op.drop_index(op.f("ix_sessions_owner_user_id"), table_name="sessions")
    op.drop_table("sessions")

    op.drop_index(op.f("ix_users_external_id"), table_name="users")
    op.drop_table("users")
