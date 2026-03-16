"""Add shared_programs table.

Revision ID: 20260316_0002
Revises: 20260312_0001
Create Date: 2026-03-16
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20260316_0002"
down_revision: Union[str, None] = "20260312_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "shared_programs",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("program_id", sa.String(), nullable=True),
        sa.Column("sharer_name", sa.String(), nullable=False),
        sa.Column("modality", sa.String(), nullable=False),
        sa.Column("code", sa.Text(), nullable=False),
        sa.Column("lineage", sa.JSON(), nullable=True),
        sa.Column("llm_model", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["program_id"], ["programs.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_shared_programs_program_id"),
        "shared_programs",
        ["program_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_shared_programs_modality"),
        "shared_programs",
        ["modality"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_shared_programs_modality"), table_name="shared_programs")
    op.drop_index(op.f("ix_shared_programs_program_id"), table_name="shared_programs")
    op.drop_table("shared_programs")
