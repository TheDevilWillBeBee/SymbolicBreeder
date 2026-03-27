"""Add pending signups for OTP registration.

Revision ID: 20260327_0005
Revises: 20260327_0004
Create Date: 2026-03-27
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20260327_0005"
down_revision: Union[str, None] = "20260327_0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "pending_signups",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("username", sa.String(length=40), nullable=False),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column("otp_hash", sa.String(), nullable=False),
        sa.Column("otp_expires_at", sa.DateTime(), nullable=False),
        sa.Column("resend_available_at", sa.DateTime(), nullable=False),
        sa.Column("verify_attempt_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email", name="uq_pending_signups_email"),
    )
    op.create_index("ix_pending_signups_email", "pending_signups", ["email"], unique=True)
    op.create_index("ix_pending_signups_username", "pending_signups", ["username"], unique=False)
    op.create_index(
        "ix_pending_signups_otp_expires_at",
        "pending_signups",
        ["otp_expires_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_pending_signups_otp_expires_at", table_name="pending_signups")
    op.drop_index("ix_pending_signups_username", table_name="pending_signups")
    op.drop_index("ix_pending_signups_email", table_name="pending_signups")
    op.drop_table("pending_signups")
