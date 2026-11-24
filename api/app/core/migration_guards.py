"""Helpers that make table creation safe to retry.

A migration that fails partway leaves the tables it already made, but
alembic_version is not advanced — so the next attempt starts over and
dies on the first table that exists. That is recoverable by hand, but
it means a deploy cannot simply be retried, which is exactly what a
host does automatically.

These wrappers skip work that is already done, so running a migration
again finishes the part that did not complete.
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op


def _inspector() -> sa.Inspector:
    return sa.inspect(op.get_bind())


def table_exists(name: str) -> bool:
    return name in set(_inspector().get_table_names())


def index_exists(table: str, name: str) -> bool:
    if not table_exists(table):
        return False
    return any(i["name"] == name for i in _inspector().get_indexes(table))


def column_exists(table: str, column: str) -> bool:
    if not table_exists(table):
        return False
    return any(c["name"] == column for c in _inspector().get_columns(table))


def create_table(name: str, *columns, **kw) -> None:
    """op.create_table, skipped if the table is already there."""
    if not table_exists(name):
        op.create_table(name, *columns, **kw)


def create_index(name: str, table: str, columns, **kw) -> None:
    if not index_exists(table, name):
        op.create_index(name, table, columns, **kw)


def add_column(table: str, column, **kw) -> None:
    if not column_exists(table, column.name):
        op.add_column(table, column, **kw)
