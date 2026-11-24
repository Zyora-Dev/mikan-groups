"""base: organisation and app_user

These two tables predate Alembic — in development they were created by
SQLModel.metadata.create_all, so no migration ever made them. On a fresh
database (a new deployment) the chain therefore failed immediately, with
`relation "organisation" does not exist`.

This migration creates them in the shape they had *before* the later
migrations alter them, so the rest of the chain applies unchanged.

Revision ID: a0000000base
Revises:
Create Date: 2026-11-24
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


revision: str = 'a0000000base'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Every enum used anywhere in the chain. PostgreSQL needs the type to
# exist before a column can reference it, and op.add_column does not
# create one — only op.create_table does. Later migrations add enum
# columns with add_column, so the types are all created here, up front.
ENUMS: dict[str, tuple[str, ...]] = {
    "userrole": ("ADMIN", "ENGINEER", "CLIENT_ADMIN", "CLIENT"),
    "clienttype": ("MAIN_CONTRACTOR", "FABRICATOR", "EPC", "DEVELOPER",
                   "CONSULTANCY", "AUTHORITY", "OTHER"),
    "clientstatus": ("PROSPECT", "ACTIVE", "DORMANT", "ARCHIVED"),
    "contractingentity": ("SINGAPORE", "IRELAND", "INDIA"),
    "projectstatus": ("PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"),
    "projectrole": ("LEAD", "ENGINEER", "DETAILER", "CHECKER",
                    "COORDINATOR", "SUPPORT"),
    "taskstatus": ("REQUESTED", "TODO", "IN_PROGRESS", "IN_REVIEW",
                   "SUBMITTED", "DONE"),
    "taskpriority": ("LOW", "NORMAL", "HIGH", "URGENT"),
    "clientverdict": ("NONE", "AWAITING", "APPROVED", "CHANGES_REQUESTED"),
    "attachmentkind": ("DRAWING", "MODEL", "MARKUP", "REFERENCE", "OTHER"),
    "auditaction": (
        "CREATED", "UPDATED", "DELETED", "STATUS_CHANGED", "SUBMITTED",
        "APPROVED", "CHANGES_REQUESTED", "ASSIGNED", "MEMBER_ADDED",
        "MEMBER_REMOVED", "FILE_ADDED", "FILE_REMOVED", "COMMENTED",
        "SIGNED_IN", "ACCESS_GRANTED", "ACCESS_REVOKED", "PASSWORD_RESET",
    ),
}


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing = set(inspector.get_table_names())

    # IF NOT EXISTS so an existing development database is untouched.
    for name, values in ENUMS.items():
        labels = ", ".join(f"'{v}'" for v in values)
        op.execute(
            sa.text(
                f"DO $$ BEGIN "
                f"CREATE TYPE {name} AS ENUM ({labels}); "
                f"EXCEPTION WHEN duplicate_object THEN null; "
                f"END $$;"
            )
        )

    # An existing development database already has these. Creating them
    # again would fail, so this migration is a no-op there.
    if 'organisation' not in existing:
        op.create_table(
            'organisation',
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('name', sqlmodel.sql.sqltypes.AutoString(length=200), nullable=False),
            sa.Column('slug', sqlmodel.sql.sqltypes.AutoString(length=120), nullable=False),
            sa.Column('country', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=True),
            # Widened to 4000 by the next migration; created at its
            # original width so that ALTER has something to change.
            sa.Column('notes', sa.VARCHAR(length=2000), nullable=True),
            sa.Column('is_internal', sa.Boolean(), nullable=False),
            sa.Column('is_active', sa.Boolean(), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index(op.f('ix_organisation_slug'), 'organisation',
                        ['slug'], unique=True)

    if 'app_user' not in existing:
        op.create_table(
            'app_user',
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('email', sqlmodel.sql.sqltypes.AutoString(length=254), nullable=False),
            sa.Column('hashed_password', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
            sa.Column('full_name', sqlmodel.sql.sqltypes.AutoString(length=150), nullable=False),
            sa.Column('job_title', sqlmodel.sql.sqltypes.AutoString(length=150), nullable=True),
            sa.Column('phone', sqlmodel.sql.sqltypes.AutoString(length=40), nullable=True),
            sa.Column(
                'role',
                sa.Enum('ADMIN', 'ENGINEER', 'CLIENT_ADMIN', 'CLIENT',
                        name='userrole', create_type=False),
                nullable=False,
            ),
            sa.Column('organisation_id', sa.Uuid(), nullable=False),
            sa.Column('is_active', sa.Boolean(), nullable=False),
            sa.Column('must_change_password', sa.Boolean(), nullable=False),
            sa.Column('failed_attempts', sa.Integer(), nullable=False),
            sa.Column('locked_until', sa.DateTime(timezone=True), nullable=True),
            sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(['organisation_id'], ['organisation.id'],
                                    name='fk_app_user_organisation'),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index(op.f('ix_app_user_email'), 'app_user', ['email'], unique=True)
        op.create_index(op.f('ix_app_user_role'), 'app_user', ['role'], unique=False)
        op.create_index(op.f('ix_app_user_organisation_id'), 'app_user',
                        ['organisation_id'], unique=False)


def downgrade() -> None:
    for name in ENUMS:
        op.execute(sa.text(f"DROP TYPE IF EXISTS {name} CASCADE"))
    op.drop_index(op.f('ix_app_user_organisation_id'), table_name='app_user')
    op.drop_index(op.f('ix_app_user_role'), table_name='app_user')
    op.drop_index(op.f('ix_app_user_email'), table_name='app_user')
    op.drop_table('app_user')
    op.drop_index(op.f('ix_organisation_slug'), table_name='organisation')
    op.drop_table('organisation')
