#!/usr/bin/env python3
"""Load TCO Insight's committed CSV evidence into a guarded local MariaDB."""

from __future__ import annotations

import argparse
import csv
from collections.abc import Mapping
import json
import os
from pathlib import Path
import re
import sys
from typing import Any

import mysql.connector
from mysql.connector import MySQLConnection
from mysql.connector.cursor import MySQLCursor
from dotenv import load_dotenv


PORTFOLIO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_PROJECT_ROOT = Path(
    os.environ.get(
        "TCO_PROJECT_ROOT",
        PORTFOLIO_ROOT.parent / "skn26_projects" / "1st_project",
    )
)
DEFAULT_EXPECTED_COUNTS = {"car_oil": 506, "car_price": 268, "parts": 10}
SOURCE_DIRECTORY = Path("DB_Side")
BUILDER_ID = "portfolio-tco-demo-db-v1"

FINAL_TABLES = ("capture_metadata", "parts", "car_price", "car_oil")
STAGE_TABLES = {
    table: f"{table}__capture_new" for table in FINAL_TABLES
}
BACKUP_TABLES = {
    table: f"{table}__capture_old" for table in FINAL_TABLES
}


class ConnectionSettings:
    """Validated connection settings for the task-owned TCO database."""

    __slots__ = ("host", "port", "user", "password", "database")

    def __init__(
        self,
        *,
        host: str,
        port: int,
        user: str,
        password: str,
        database: str,
    ) -> None:
        self.host = host
        self.port = port
        self.user = user
        self.password = password
        self.database = database

    @classmethod
    def from_mapping(cls, values: Mapping[str, Any]) -> "ConnectionSettings":
        host = str(values.get("host", ""))
        user = str(values.get("user", ""))
        password = str(values.get("password", ""))
        database = str(values.get("database", ""))
        try:
            port = int(values.get("port", 0))
        except (TypeError, ValueError) as error:
            raise ValueError("TCO database port must be 3306.") from error

        if host != "127.0.0.1":
            raise ValueError("TCO database host must be the IPv4 loopback address.")
        if port != 3306:
            raise ValueError("TCO database port must be 3306.")
        if user != "tco_capture":
            raise ValueError("TCO database user must be the capture-only account.")
        if not password:
            raise ValueError("TCO database password must be non-empty.")
        if database != "tco_system":
            raise ValueError("TCO database name must be tco_system.")

        return cls(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database,
        )


class SourceBundle:
    """Validated source rows plus the repository's maintenance schema SQL."""

    __slots__ = ("car_oil_rows", "car_price_rows", "database_setup_sql")

    def __init__(
        self,
        *,
        car_oil_rows: list[tuple[str | None, ...]],
        car_price_rows: list[tuple[str | None, ...]],
        database_setup_sql: str,
    ) -> None:
        self.car_oil_rows = car_oil_rows
        self.car_price_rows = car_price_rows
        self.database_setup_sql = database_setup_sql


def _normalize_csv_value(value: str) -> str | None:
    if not value.strip() or value.strip().upper() == "NULL":
        return None
    return value


def _read_fixed_width_csv(
    path: Path,
    *,
    expected_width: int,
    expected_count: int,
) -> list[tuple[str | None, ...]]:
    if not path.is_file():
        raise FileNotFoundError(f"Required TCO source file is missing: {path.name}")

    rows: list[tuple[str | None, ...]] = []
    with path.open("r", newline="", encoding="utf-8-sig") as stream:
        for line_number, raw_row in enumerate(csv.reader(stream), start=1):
            if len(raw_row) != expected_width:
                raise RuntimeError(
                    f"{path.name} row {line_number} must contain exactly "
                    f"{expected_width} columns."
                )
            rows.append(tuple(_normalize_csv_value(value) for value in raw_row))

    if len(rows) != expected_count:
        raise RuntimeError(
            f"{path.name} row-count validation failed: expected "
            f"{expected_count}, got {len(rows)}."
        )
    return rows


def read_source_bundle(
    project_root: Path,
    *,
    expected_counts: Mapping[str, int] | None = None,
) -> SourceBundle:
    counts = dict(DEFAULT_EXPECTED_COUNTS if expected_counts is None else expected_counts)
    if set(counts) != set(DEFAULT_EXPECTED_COUNTS):
        raise ValueError("Expected counts must name car_oil, car_price, and parts exactly.")
    if any(int(value) < 1 for value in counts.values()):
        raise ValueError("Every expected TCO row count must be positive.")

    source = project_root.expanduser().resolve() / SOURCE_DIRECTORY
    if not source.is_dir():
        raise FileNotFoundError(f"TCO source directory was not found: {source}")

    setup_path = source / "DBsetup.sql"
    if not setup_path.is_file():
        raise FileNotFoundError("Required TCO source file is missing: DBsetup.sql")
    setup_sql = setup_path.read_text(encoding="utf-8-sig")
    if not setup_sql.strip():
        raise RuntimeError("DBsetup.sql must not be empty.")

    return SourceBundle(
        car_oil_rows=_read_fixed_width_csv(
            source / "car_oil.csv",
            expected_width=12,
            expected_count=int(counts["car_oil"]),
        ),
        car_price_rows=_read_fixed_width_csv(
            source / "car_price.csv",
            expected_width=4,
            expected_count=int(counts["car_price"]),
        ),
        database_setup_sql=setup_sql,
    )


def _split_sql_statements(sql: str) -> list[str]:
    statements: list[str] = []
    buffer: list[str] = []
    quote: str | None = None
    escaped = False
    for character in sql:
        if escaped:
            buffer.append(character)
            escaped = False
            continue
        if character == "\\" and quote is not None:
            buffer.append(character)
            escaped = True
            continue
        if character in {"'", '"', "`"}:
            if quote is None:
                quote = character
            elif quote == character:
                quote = None
            buffer.append(character)
            continue
        if character == ";" and quote is None:
            statement = "".join(buffer).strip()
            if statement:
                statements.append(statement)
            buffer = []
            continue
        buffer.append(character)
    trailing = "".join(buffer).strip()
    if trailing:
        statements.append(trailing)
    return statements


def _parts_stage_statements(database_setup_sql: str) -> tuple[str, str]:
    statements = _split_sql_statements(database_setup_sql)
    normalized = [re.sub(r"\s+", " ", statement).strip() for statement in statements]
    if not any(
        re.fullmatch(r"CREATE DATABASE IF NOT EXISTS tco_system", statement, re.I)
        for statement in normalized
    ):
        raise RuntimeError("DBsetup.sql must target the tco_system database.")
    if not any(re.fullmatch(r"USE tco_system", statement, re.I) for statement in normalized):
        raise RuntimeError("DBsetup.sql must select the tco_system database.")

    create_statement = next(
        (
            statement
            for statement in statements
            if re.match(
                r"^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?parts`?\b",
                statement,
                re.I,
            )
        ),
        None,
    )
    insert_statement = next(
        (
            statement
            for statement in statements
            if re.match(r"^INSERT\s+INTO\s+`?parts`?\b", statement, re.I)
        ),
        None,
    )
    if create_statement is None or insert_statement is None:
        raise RuntimeError("DBsetup.sql must define and populate the parts table.")

    stage_name = STAGE_TABLES["parts"]
    create_stage = re.sub(
        r"(?i)(CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?)`?parts`?",
        rf"\1`{stage_name}`",
        create_statement,
        count=1,
    )
    insert_stage = re.sub(
        r"(?i)(INSERT\s+INTO\s+)`?parts`?",
        rf"\1`{stage_name}`",
        insert_statement,
        count=1,
    )
    return create_stage, insert_stage


def _connect(settings: ConnectionSettings) -> MySQLConnection:
    return mysql.connector.connect(
        host=settings.host,
        port=settings.port,
        user=settings.user,
        password=settings.password,
        database=settings.database,
        connection_timeout=5,
        ssl_disabled=True,
        autocommit=False,
    )


def _quoted(identifier: str) -> str:
    if not re.fullmatch(r"[a-z0-9_]+", identifier):
        raise ValueError("Unsafe generated table identifier.")
    return f"`{identifier}`"


def _table_names(cursor: MySQLCursor) -> set[str]:
    cursor.execute(
        "SELECT table_name FROM information_schema.tables "
        "WHERE table_schema = DATABASE()"
    )
    return {str(row[0]) for row in cursor.fetchall()}


def _has_builder_marker(cursor: MySQLCursor, existing: set[str]) -> bool:
    if "capture_metadata" not in existing:
        return False
    cursor.execute(
        "SELECT value FROM capture_metadata WHERE `key` = %s",
        ("builder",),
    )
    row = cursor.fetchone()
    return row == (BUILDER_ID,)


def _assert_runtime_identity(
    cursor: MySQLCursor,
    settings: ConnectionSettings,
) -> set[str]:
    cursor.execute("SELECT @@port, DATABASE(), CURRENT_USER()")
    port, database, current_user = cursor.fetchone()
    if int(port) != settings.port or database != settings.database:
        raise RuntimeError("Connected MariaDB runtime does not match the guarded target.")
    if str(current_user).lower() != "tco_capture@127.0.0.1":
        raise RuntimeError("Connected MariaDB account is not the loopback capture account.")

    existing = _table_names(cursor)
    final_existing = existing.intersection(FINAL_TABLES)
    if final_existing:
        if final_existing != set(FINAL_TABLES) or not _has_builder_marker(cursor, existing):
            raise RuntimeError(
                "Refusing to replace TCO tables not wholly owned by this capture helper."
            )
    unexpected_auxiliary = existing.intersection(
        set(STAGE_TABLES.values()) | set(BACKUP_TABLES.values())
    )
    if unexpected_auxiliary and not _has_builder_marker(cursor, existing):
        raise RuntimeError("Refusing to remove unverified capture-named tables.")
    return existing


def _drop_tables(cursor: MySQLCursor, table_names: list[str]) -> None:
    if not table_names:
        return
    table_sql = ", ".join(_quoted(name) for name in table_names)
    cursor.execute(f"DROP TABLE IF EXISTS {table_sql}")


def _create_staging_tables(
    cursor: MySQLCursor,
    bundle: SourceBundle,
) -> None:
    _drop_tables(cursor, list(reversed(STAGE_TABLES.values())))
    create_parts, insert_parts = _parts_stage_statements(bundle.database_setup_sql)

    cursor.execute(
        f"CREATE TABLE {_quoted(STAGE_TABLES['capture_metadata'])} ("
        "`key` VARCHAR(100) PRIMARY KEY, `value` VARCHAR(255) NOT NULL"
        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    )
    cursor.execute(
        f"INSERT INTO {_quoted(STAGE_TABLES['capture_metadata'])} (`key`, `value`) "
        "VALUES (%s, %s)",
        ("builder", BUILDER_ID),
    )
    cursor.execute(create_parts)
    cursor.execute(insert_parts)

    cursor.execute(
        f"CREATE TABLE {_quoted(STAGE_TABLES['car_price'])} ("
        "model_name VARCHAR(50) PRIMARY KEY, "
        "price_min VARCHAR(10), price_max VARCHAR(10), ref_link TEXT"
        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    )
    cursor.executemany(
        f"INSERT INTO {_quoted(STAGE_TABLES['car_price'])} "
        "(model_name, price_min, price_max, ref_link) VALUES (%s, %s, %s, %s)",
        bundle.car_price_rows,
    )

    cursor.execute(
        f"CREATE TABLE {_quoted(STAGE_TABLES['car_oil'])} ("
        "model_name VARCHAR(50) PRIMARY KEY, "
        "comp_name VARCHAR(20) NOT NULL, "
        "fuel_type VARCHAR(20) NOT NULL, "
        "fuel_eff_mix VARCHAR(20) NOT NULL, "
        "fuel_eff_cty VARCHAR(20) NOT NULL, "
        "fuel_eff_hw VARCHAR(20) NOT NULL, "
        "run_per_charge VARCHAR(20), "
        "estm_fuel_price VARCHAR(20) NOT NULL, "
        "car_class VARCHAR(10) NOT NULL, "
        "displacement VARCHAR(10), "
        "release_year VARCHAR(10) NOT NULL, "
        "price_model VARCHAR(50), "
        f"FOREIGN KEY (price_model) REFERENCES {_quoted(STAGE_TABLES['car_price'])}(model_name)"
        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    )
    cursor.executemany(
        f"INSERT INTO {_quoted(STAGE_TABLES['car_oil'])} ("
        "model_name, comp_name, fuel_type, fuel_eff_mix, fuel_eff_cty, "
        "fuel_eff_hw, run_per_charge, estm_fuel_price, car_class, "
        "displacement, release_year, price_model"
        ") VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
        bundle.car_oil_rows,
    )


def _validate_staging(
    cursor: MySQLCursor,
    expected_counts: Mapping[str, int],
) -> tuple[dict[str, int], int]:
    counts: dict[str, int] = {}
    for table in ("car_oil", "car_price", "parts"):
        cursor.execute(f"SELECT COUNT(*) FROM {_quoted(STAGE_TABLES[table])}")
        actual = int(cursor.fetchone()[0])
        expected = int(expected_counts[table])
        if actual != expected:
            raise RuntimeError(
                f"{table} row-count validation failed: expected {expected}, got {actual}."
            )
        counts[table] = actual

    cursor.execute(
        f"SELECT COUNT(*) FROM {_quoted(STAGE_TABLES['car_oil'])} "
        "WHERE model_name LIKE %s",
        ("%아반떼%",),
    )
    avante_matches = int(cursor.fetchone()[0])
    if avante_matches < 1:
        raise RuntimeError("TCO source validation found no 아반떼 vehicle rows.")
    return counts, avante_matches


def _swap_staging_tables(cursor: MySQLCursor, existing: set[str]) -> None:
    had_final_tables = set(FINAL_TABLES).issubset(existing)
    if had_final_tables:
        _drop_tables(cursor, list(reversed(BACKUP_TABLES.values())))

    rename_pairs: list[tuple[str, str]] = []
    for table in FINAL_TABLES:
        if had_final_tables:
            rename_pairs.append((table, BACKUP_TABLES[table]))
        rename_pairs.append((STAGE_TABLES[table], table))
    rename_sql = ", ".join(
        f"{_quoted(source)} TO {_quoted(target)}" for source, target in rename_pairs
    )
    cursor.execute(f"RENAME TABLE {rename_sql}")

    if had_final_tables:
        _drop_tables(
            cursor,
            [
                BACKUP_TABLES["car_oil"],
                BACKUP_TABLES["car_price"],
                BACKUP_TABLES["parts"],
                BACKUP_TABLES["capture_metadata"],
            ],
        )


def load_database(
    project_root: Path,
    settings: ConnectionSettings,
    *,
    expected_counts: Mapping[str, int] | None = None,
) -> dict[str, Any]:
    counts_to_expect = dict(
        DEFAULT_EXPECTED_COUNTS if expected_counts is None else expected_counts
    )
    bundle = read_source_bundle(
        project_root,
        expected_counts=counts_to_expect,
    )

    connection = _connect(settings)
    try:
        with connection.cursor() as cursor:
            existing = _assert_runtime_identity(cursor, settings)
            try:
                _create_staging_tables(cursor, bundle)
                counts, avante_matches = _validate_staging(cursor, counts_to_expect)
                connection.commit()
                _swap_staging_tables(cursor, existing)
                connection.commit()
            except Exception:
                connection.rollback()
                _drop_tables(cursor, list(reversed(STAGE_TABLES.values())))
                connection.commit()
                raise
    finally:
        connection.close()

    return {
        "counts": counts,
        "avante_matches": avante_matches,
        "external_calls": 0,
    }


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Load TCO Insight's committed CSVs into the guarded local MariaDB. "
            "No public-data, OPINET, or crawler request is made."
        )
    )
    parser.add_argument(
        "--project-root",
        type=Path,
        default=DEFAULT_PROJECT_ROOT,
        help="TCO Insight repository root containing DB_Side.",
    )
    return parser.parse_args(argv)


def _settings_from_environment(project_root: Path) -> ConnectionSettings:
    load_dotenv(project_root / ".env", override=False)
    return ConnectionSettings.from_mapping(
        {
            "host": os.getenv("DB_HOST", "127.0.0.1"),
            "port": os.getenv("DB_PORT", "3306"),
            "user": os.getenv("DB_USER", ""),
            "password": os.getenv("DB_PASSWORD", ""),
            "database": os.getenv("DB_NAME", "tco_system"),
        }
    )


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    try:
        settings = _settings_from_environment(args.project_root)
        result = load_database(args.project_root, settings)
    except (FileNotFoundError, RuntimeError, ValueError, mysql.connector.Error) as error:
        print(f"TCO DB loader error: {error}", file=sys.stderr)
        return 1

    print(json.dumps(result, ensure_ascii=False, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
