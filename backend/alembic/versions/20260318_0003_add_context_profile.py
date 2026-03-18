"""Add context_profile column to sessions table.

Revision ID: 20260318_0003
Revises: 20260316_0002
Create Date: 2026-03-18
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20260318_0003"
down_revision: Union[str, None] = "20260316_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "sessions",
        sa.Column("context_profile", sa.String(), nullable=True, server_default="intermediate"),
    )


def downgrade() -> None:
    op.drop_column("sessions", "context_profile")
