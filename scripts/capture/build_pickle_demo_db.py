#!/usr/bin/env python3
"""Build PICKLE's local SQLite evidence database without external API calls."""

from __future__ import annotations

import argparse
from contextlib import closing
import csv
import json
import os
from pathlib import Path
import sqlite3
import sys
import tempfile
from typing import Any, Callable, Mapping, Sequence


PORTFOLIO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_PROJECT_ROOT = Path(
    os.environ.get(
        "PICKLE_PROJECT_ROOT",
        PORTFOLIO_ROOT.parent / "skn26_projects" / "3rd_project",
    )
)
SOURCE_RELATIVE_PATH = Path("database") / "processed" / "db_csv_tablewise"
DATABASE_RELATIVE_PATH = Path("database") / "sql" / "restaurant.db"
BUILDER_ID = "portfolio-pickle-demo-db-v1"

TABLE_ORDER = (
    "users",
    "restaurant",
    "food",
    "menu",
    "category",
    "tag",
    "review",
    "rel_restaurant_category",
    "rel_restaurant_tag",
    "rel_review_tag",
)

EXPECTED_COUNTS = {
    "users": 171,
    "restaurant": 100,
    "food": 0,
    "menu": 2008,
    "category": 123,
    "tag": 143,
    "review": 422,
    "rel_restaurant_category": 176,
    "rel_restaurant_tag": 625,
    "rel_review_tag": 2336,
}

REQUIRED_FILES = {
    "users": "user.csv",
    "restaurant": "restaurant.csv",
    "menu": "menu.csv",
    "category": "category.csv",
    "tag": "tag.csv",
    "review": "review.csv",
    "rel_restaurant_category": "rel_res_cat.csv",
    "rel_restaurant_tag": "rel_res_tag.csv",
    "rel_review_tag": "rel_rev_tag.csv",
}

SCHEMA_SQL = """
CREATE TABLE capture_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE users (
    user_code TEXT PRIMARY KEY,
    name TEXT,
    avg_score REAL,
    review_cnt INTEGER,
    follower_cnt INTEGER
);

CREATE TABLE restaurant (
    restaurant_code TEXT PRIMARY KEY,
    name TEXT,
    img_link TEXT,
    region TEXT,
    address TEXT,
    lat REAL,
    lng REAL,
    open_time TEXT,
    close_time TEXT,
    tel_no TEXT
);

CREATE TABLE food (
    food_code TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    embedding TEXT
);

CREATE TABLE menu (
    menu_code TEXT PRIMARY KEY,
    restaurant_code TEXT,
    food_code TEXT,
    name TEXT,
    price INTEGER,
    description TEXT,
    prompted_description TEXT,
    embedding TEXT,
    FOREIGN KEY (restaurant_code) REFERENCES restaurant(restaurant_code),
    FOREIGN KEY (food_code) REFERENCES food(food_code)
);

CREATE TABLE category (
    category_code TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    embedding TEXT
);

CREATE TABLE tag (
    tag_code TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    embedding TEXT
);

CREATE TABLE review (
    review_code TEXT PRIMARY KEY,
    restaurant_code TEXT,
    user_code TEXT,
    score REAL,
    taste_level INTEGER,
    price_level INTEGER,
    service_level INTEGER,
    content TEXT,
    menu TEXT,
    embedding TEXT,
    FOREIGN KEY (restaurant_code) REFERENCES restaurant(restaurant_code),
    FOREIGN KEY (user_code) REFERENCES users(user_code)
);

CREATE TABLE rel_restaurant_category (
    restaurant_code TEXT,
    category_code TEXT,
    PRIMARY KEY (restaurant_code, category_code),
    FOREIGN KEY (restaurant_code) REFERENCES restaurant(restaurant_code),
    FOREIGN KEY (category_code) REFERENCES category(category_code)
);

CREATE TABLE rel_restaurant_tag (
    restaurant_code TEXT,
    tag_code TEXT,
    PRIMARY KEY (restaurant_code, tag_code),
    FOREIGN KEY (restaurant_code) REFERENCES restaurant(restaurant_code),
    FOREIGN KEY (tag_code) REFERENCES tag(tag_code)
);

CREATE TABLE rel_review_tag (
    review_code TEXT,
    tag_code TEXT,
    PRIMARY KEY (review_code, tag_code),
    FOREIGN KEY (review_code) REFERENCES review(review_code),
    FOREIGN KEY (tag_code) REFERENCES tag(tag_code)
);
"""


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Rebuild PICKLE's ignored local SQLite database from committed CSVs. "
            "No OpenAI, embedding, map, or crawler request is made."
        )
    )
    parser.add_argument(
        "--project-root",
        type=Path,
        default=DEFAULT_PROJECT_ROOT,
        help="PICKLE repository root containing database/processed/db_csv_tablewise.",
    )
    return parser.parse_args(argv)


def _none_if_blank(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped if stripped else None


def _float_or_none(value: str | None, *, suffix: str = "") -> float | None:
    normalized = _none_if_blank(value)
    if normalized is None:
        return None
    if suffix and normalized.endswith(suffix):
        normalized = normalized[: -len(suffix)]
    return float(normalized)


def _int_or_none(value: str | None) -> int | None:
    normalized = _float_or_none(value)
    if normalized is None:
        return None
    if not normalized.is_integer():
        raise ValueError("Expected an integer-compatible numeric field.")
    return int(normalized)


def _read_csv(
    source_directory: Path,
    filename: str,
    required_columns: Sequence[str],
) -> list[dict[str, str]]:
    path = source_directory / filename
    if not path.is_file():
        raise FileNotFoundError(f"Required PICKLE CSV is missing: {filename}")

    with path.open("r", newline="", encoding="utf-8-sig") as stream:
        reader = csv.DictReader(stream)
        fieldnames = set(reader.fieldnames or ())
        missing_columns = sorted(set(required_columns) - fieldnames)
        if missing_columns:
            missing_text = ", ".join(missing_columns)
            raise RuntimeError(f"{filename} is missing required columns: {missing_text}")
        return [dict(row) for row in reader]


def _insert_rows(
    connection: sqlite3.Connection,
    table: str,
    columns: Sequence[str],
    rows: Sequence[Sequence[Any]],
) -> None:
    if not rows:
        return
    placeholders = ", ".join("?" for _ in columns)
    column_sql = ", ".join(columns)
    connection.executemany(
        f"INSERT INTO {table} ({column_sql}) VALUES ({placeholders})",
        rows,
    )


def _load_tables(connection: sqlite3.Connection, source_directory: Path) -> None:
    user_rows = _read_csv(
        source_directory,
        REQUIRED_FILES["users"],
        ("user_code", "name", "avg_score", "rv_cnt", "follower_cnt"),
    )
    _insert_rows(
        connection,
        "users",
        ("user_code", "name", "avg_score", "review_cnt", "follower_cnt"),
        [
            (
                row["user_code"],
                _none_if_blank(row["name"]),
                _float_or_none(row["avg_score"]),
                _int_or_none(row["rv_cnt"]),
                _int_or_none(row["follower_cnt"]),
            )
            for row in user_rows
        ],
    )

    restaurant_rows = _read_csv(
        source_directory,
        REQUIRED_FILES["restaurant"],
        (
            "restaurant_code",
            "name",
            "img_link",
            "region",
            "address",
            "lat",
            "lng",
            "open_time",
            "close_time",
            "tel_no",
        ),
    )
    _insert_rows(
        connection,
        "restaurant",
        (
            "restaurant_code",
            "name",
            "img_link",
            "region",
            "address",
            "lat",
            "lng",
            "open_time",
            "close_time",
            "tel_no",
        ),
        [
            (
                row["restaurant_code"],
                _none_if_blank(row["name"]),
                _none_if_blank(row["img_link"]),
                _none_if_blank(row["region"]),
                _none_if_blank(row["address"]),
                _float_or_none(row["lat"]),
                _float_or_none(row["lng"]),
                _none_if_blank(row["open_time"]),
                _none_if_blank(row["close_time"]),
                _none_if_blank(row["tel_no"]),
            )
            for row in restaurant_rows
        ],
    )

    category_rows = _read_csv(
        source_directory,
        REQUIRED_FILES["category"],
        ("category_code", "category_name"),
    )
    _insert_rows(
        connection,
        "category",
        ("category_code", "name", "description", "embedding"),
        [
            (row["category_code"], _none_if_blank(row["category_name"]), None, None)
            for row in category_rows
        ],
    )

    tag_rows = _read_csv(
        source_directory,
        REQUIRED_FILES["tag"],
        ("tag_code", "name"),
    )
    _insert_rows(
        connection,
        "tag",
        ("tag_code", "name", "description", "embedding"),
        [
            (row["tag_code"], _none_if_blank(row["name"]), None, None)
            for row in tag_rows
        ],
    )

    menu_rows = _read_csv(
        source_directory,
        REQUIRED_FILES["menu"],
        ("menu_code", "restaurant_code", "name", "price", "description"),
    )
    _insert_rows(
        connection,
        "menu",
        (
            "menu_code",
            "restaurant_code",
            "food_code",
            "name",
            "price",
            "description",
            "prompted_description",
            "embedding",
        ),
        [
            (
                row["menu_code"],
                row["restaurant_code"],
                None,
                _none_if_blank(row["name"]),
                _int_or_none(row["price"]),
                _none_if_blank(row["description"]),
                None,
                None,
            )
            for row in menu_rows
        ],
    )

    review_rows = _read_csv(
        source_directory,
        REQUIRED_FILES["review"],
        (
            "review_code",
            "restaurant_code",
            "user_code",
            "score",
            "taste_level",
            "price_level",
            "service_level",
            "content",
            "menu",
        ),
    )
    _insert_rows(
        connection,
        "review",
        (
            "review_code",
            "restaurant_code",
            "user_code",
            "score",
            "taste_level",
            "price_level",
            "service_level",
            "content",
            "menu",
            "embedding",
        ),
        [
            (
                row["review_code"],
                row["restaurant_code"],
                row["user_code"],
                _float_or_none(row["score"], suffix="점"),
                _int_or_none(row["taste_level"]),
                _int_or_none(row["price_level"]),
                _int_or_none(row["service_level"]),
                _none_if_blank(row["content"]),
                _none_if_blank(row["menu"]),
                None,
            )
            for row in review_rows
        ],
    )

    relation_specs: tuple[
        tuple[str, tuple[str, str], Callable[[dict[str, str]], tuple[str, str]]],
        ...,
    ] = (
        (
            "rel_restaurant_category",
            ("restaurant_code", "category_code"),
            lambda row: (row["restaurant_code"], row["category_code"]),
        ),
        (
            "rel_restaurant_tag",
            ("restaurant_code", "tag_code"),
            lambda row: (row["restaurant_code"], row["tag_code"]),
        ),
        (
            "rel_review_tag",
            ("review_code", "tag_code"),
            lambda row: (row["review_code"], row["tag_code"]),
        ),
    )
    for table, columns, transform in relation_specs:
        rows = _read_csv(source_directory, REQUIRED_FILES[table], columns)
        _insert_rows(connection, table, columns, [transform(row) for row in rows])


def _database_was_created_by_helper(database_path: Path) -> bool:
    try:
        with closing(sqlite3.connect(database_path)) as connection:
            row = connection.execute(
                "SELECT value FROM capture_metadata WHERE key = 'builder'"
            ).fetchone()
    except sqlite3.Error:
        return False
    return row == (BUILDER_ID,)


def verify_database(
    connection: sqlite3.Connection,
    expected_counts: Mapping[str, int],
) -> dict[str, int]:
    counts = {
        table: int(connection.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0])
        for table in TABLE_ORDER
    }
    expected = {table: int(expected_counts[table]) for table in TABLE_ORDER}
    if counts != expected:
        raise RuntimeError(
            f"PICKLE database row-count validation failed: expected {expected}, got {counts}."
        )

    foreign_key_issues = connection.execute("PRAGMA foreign_key_check").fetchall()
    if foreign_key_issues:
        raise RuntimeError(
            f"PICKLE database foreign-key validation failed ({len(foreign_key_issues)} issue(s))."
        )
    return counts


def build_database(
    project_root: Path,
    *,
    expected_counts: Mapping[str, int] | None = None,
) -> dict[str, Any]:
    root = project_root.expanduser().resolve()
    source_directory = root / SOURCE_RELATIVE_PATH
    if not source_directory.is_dir():
        raise FileNotFoundError(
            f"PICKLE table-wise CSV directory was not found: {source_directory}"
        )

    database_path = root / DATABASE_RELATIVE_PATH
    database_path.parent.mkdir(parents=True, exist_ok=True)
    if database_path.exists() and not _database_was_created_by_helper(database_path):
        raise RuntimeError(
            "Refusing to replace a database that was not created by this helper."
        )

    target_counts = EXPECTED_COUNTS if expected_counts is None else expected_counts
    if set(target_counts) != set(TABLE_ORDER):
        raise ValueError("Expected row counts must name every PICKLE runtime table exactly once.")

    temporary_descriptor, temporary_name = tempfile.mkstemp(
        prefix=f"{database_path.name}.",
        suffix=".tmp",
        dir=database_path.parent,
    )
    os.close(temporary_descriptor)
    temporary_path = Path(temporary_name)

    try:
        with closing(sqlite3.connect(temporary_path)) as connection:
            connection.execute("PRAGMA foreign_keys = ON")
            connection.executescript(SCHEMA_SQL)
            connection.execute(
                "INSERT INTO capture_metadata (key, value) VALUES ('builder', ?)",
                (BUILDER_ID,),
            )
            try:
                _load_tables(connection, source_directory)
            except sqlite3.IntegrityError as error:
                raise RuntimeError(
                    "PICKLE database foreign-key validation failed during CSV loading."
                ) from error
            counts = verify_database(connection, target_counts)
            connection.commit()

        os.replace(temporary_path, database_path)
    except Exception:
        if temporary_path.exists():
            temporary_path.unlink()
        raise

    return {
        "database_path": str(database_path.resolve()),
        "counts": counts,
        "external_calls": 0,
    }


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    try:
        result = build_database(args.project_root)
    except (FileNotFoundError, RuntimeError, ValueError) as error:
        print(f"PICKLE DB builder error: {error}", file=sys.stderr)
        return 1

    print(json.dumps(result, ensure_ascii=False, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
