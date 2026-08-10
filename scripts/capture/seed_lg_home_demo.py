#!/usr/bin/env python3
"""Load local LG Home AI product CSVs and create synthetic capture data.

The helper performs no network or AI calls. It updates rows whose product codes
exist in the committed CSVs, preserves unrelated rows, and limits account
changes to a clearly prefixed synthetic user.
"""

from __future__ import annotations

import argparse
import csv
from decimal import Decimal, InvalidOperation
import json
import os
from pathlib import Path
import sys
from typing import Any, Sequence


PORTFOLIO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_PROJECT_ROOT = Path(
    os.environ.get(
        "LG_HOME_PROJECT_ROOT",
        PORTFOLIO_ROOT.parent / "skn26_projects" / "4th_project",
    )
)
DEFAULT_USERNAME = "portfolio-demo-lg-home"
DEMO_USERNAME_PREFIX = "portfolio-demo-"
DEFAULT_FAVORITE_CODE = "REF000"
DEFAULT_PASSWORD_ENV = "LG_HOME_DEMO_PASSWORD"

EXPECTED_PRODUCT_COUNTS = {
    "ProductAC": 234,
    "ProductFridge": 232,
    "ProductTV": 191,
    "ProductVAC": 34,
    "ProductWash": 156,
}
EXPECTED_RESOLUTION_COUNT = 3
LOAD_ORDER = (
    "ScreenResolution",
    "ProductAC",
    "ProductFridge",
    "ProductVAC",
    "ProductWash",
    "ProductTV",
)
PRODUCT_MODEL_BY_PREFIX = {
    "ACT": "ProductAC",
    "REF": "ProductFridge",
    "TVT": "ProductTV",
    "VAC": "ProductVAC",
    "WMT": "ProductWash",
}


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Idempotently load committed LG Home AI product CSVs into local "
            "SQLite and seed one synthetic account/favorite. No external API is called."
        )
    )
    parser.add_argument(
        "--project-root",
        type=Path,
        default=DEFAULT_PROJECT_ROOT,
        help="Path containing the LG Home AI manage.py file.",
    )
    parser.add_argument(
        "--username",
        default=DEFAULT_USERNAME,
        help=f"Synthetic account name; must start with {DEMO_USERNAME_PREFIX!r}.",
    )
    parser.add_argument(
        "--password-env",
        default=DEFAULT_PASSWORD_ENV,
        help=(
            "Environment variable containing an optional temporary demo password. "
            "The value is never printed."
        ),
    )
    parser.add_argument(
        "--favorite-product-code",
        default=DEFAULT_FAVORITE_CODE,
        help="Product code to attach to the synthetic account's favorites.",
    )
    return parser.parse_args(argv)


def validate_demo_username(username: str) -> str:
    normalized = username.strip()
    if not normalized.startswith(DEMO_USERNAME_PREFIX) or normalized == DEMO_USERNAME_PREFIX:
        raise ValueError(
            f"Username must use the synthetic demo prefix {DEMO_USERNAME_PREFIX!r}."
        )
    return normalized


def validate_demo_password(password: str | None) -> str | None:
    if password is not None and not password.strip():
        raise ValueError("Temporary demo password must not be empty.")
    return password


def validate_project_root(project_root: Path) -> Path:
    root = project_root.expanduser().resolve()
    required = [
        root / "manage.py",
        root / "config" / "settings.py",
        root / "products" / "models.py",
    ]
    required.extend(
        root / "products" / "data" / "database" / f"{model_name}.csv"
        for model_name in LOAD_ORDER
    )
    missing = [str(path) for path in required if not path.is_file()]
    if missing:
        raise FileNotFoundError(
            "Project root is missing required LG Home AI files: " + ", ".join(missing)
        )
    return root


def assert_local_sqlite_database(project_root: Path, database: dict[str, Any]) -> None:
    expected_name = (project_root / "db.sqlite3").resolve()
    configured_name = Path(database.get("NAME", "")).expanduser().resolve()
    if (
        database.get("ENGINE") != "django.db.backends.sqlite3"
        or configured_name != expected_name
    ):
        raise RuntimeError("Refusing to seed outside the expected local SQLite database.")


def bootstrap_django(project_root: Path) -> Path:
    root = validate_project_root(project_root)
    root_text = str(root)
    if root_text not in sys.path:
        sys.path.insert(0, root_text)

    os.environ["DJANGO_SETTINGS_MODULE"] = "config.settings"

    import django

    django.setup()

    from django.conf import settings

    assert_local_sqlite_database(root, settings.DATABASES["default"])
    return root


def normalize_column_name(column_name: str) -> str:
    return column_name.split("(", 1)[0].strip()


def read_csv_rows(csv_path: Path) -> list[dict[str, str | None]]:
    with csv_path.open("r", encoding="utf-8-sig", newline="") as csv_file:
        reader = csv.DictReader(csv_file)
        if not reader.fieldnames:
            raise ValueError(f"CSV has no header: {csv_path}")

        normalized_headers = [normalize_column_name(name) for name in reader.fieldnames]
        if not all(normalized_headers) or len(set(normalized_headers)) != len(normalized_headers):
            raise ValueError(f"CSV headers are empty or collide after normalization: {csv_path}")

        rows: list[dict[str, str | None]] = []
        for line_number, source_row in enumerate(reader, start=2):
            if None in source_row:
                raise ValueError(f"CSV row {line_number} has unexpected extra fields: {csv_path}")

            normalized_row: dict[str, str | None] = {}
            for source_name, normalized_name in zip(reader.fieldnames, normalized_headers):
                value = source_row[source_name]
                if value is None or value.strip() == "":
                    normalized_row[normalized_name] = None
                else:
                    normalized_row[normalized_name] = value.strip()
            rows.append(normalized_row)

    return rows


def _coerce_field_value(field: Any, value: str | None) -> Any:
    if value is None:
        return None

    from django.db import models

    compare_field = field.target_field if isinstance(field, models.ForeignKey) else field
    if isinstance(compare_field, models.IntegerField) and not isinstance(
        compare_field, models.BooleanField
    ):
        try:
            number = Decimal(value)
        except InvalidOperation as error:
            raise ValueError(f"Invalid integer value for {field.name!r}: {value!r}") from error
        if not number.is_finite() or number != number.to_integral_value():
            raise ValueError(f"Non-integral value for {field.name!r}: {value!r}")
        return int(number)

    if isinstance(compare_field, models.FloatField):
        try:
            number = float(value)
        except ValueError as error:
            raise ValueError(f"Invalid float value for {field.name!r}: {value!r}") from error
        if number != number or number in (float("inf"), float("-inf")):
            raise ValueError(f"Non-finite value for {field.name!r}: {value!r}")
        return number

    return value


def coerce_model_row(model: Any, source_row: dict[str, str | None]) -> dict[str, Any]:
    fields = {
        field.name: field
        for field in model._meta.concrete_fields
        if not field.auto_created
    }
    unknown_columns = sorted(set(source_row) - set(fields))
    if unknown_columns:
        raise ValueError(
            f"CSV columns do not exist on {model.__name__}: {', '.join(unknown_columns)}"
        )

    result: dict[str, Any] = {}
    for name, value in source_row.items():
        field = fields[name]
        target_name = field.attname if field.many_to_one else name
        result[target_name] = _coerce_field_value(field, value)
    return result


def _upsert_csv_model(model: Any, csv_path: Path, expected_count: int) -> int:
    source_rows = read_csv_rows(csv_path)
    if len(source_rows) != expected_count:
        raise RuntimeError(
            f"{model.__name__} CSV row count changed: expected {expected_count}, "
            f"found {len(source_rows)}."
        )

    primary_key = model._meta.pk
    primary_key_name = primary_key.name
    primary_key_attribute = primary_key.attname
    imported_keys = []

    for source_row in source_rows:
        values = coerce_model_row(model, source_row)
        if primary_key_attribute not in values:
            raise ValueError(
                f"{model.__name__} CSV does not provide primary key {primary_key_name!r}."
            )
        primary_key_value = values.pop(primary_key_attribute)
        if primary_key_value is None:
            raise ValueError(f"{model.__name__} CSV contains an empty primary key.")
        model.objects.update_or_create(
            **{primary_key_name: primary_key_value},
            defaults=values,
        )
        imported_keys.append(primary_key_value)

    imported_count = model.objects.filter(
        **{f"{primary_key_name}__in": imported_keys}
    ).count()
    if imported_count != expected_count:
        raise RuntimeError(
            f"{model.__name__} verification failed: expected {expected_count}, "
            f"found {imported_count} imported rows."
        )
    return imported_count


def seed_product_data(project_root: Path) -> dict[str, Any]:
    from django.db import transaction
    import products.models as product_models

    database_root = project_root / "products" / "data" / "database"
    dataset_counts: dict[str, int] = {}

    with transaction.atomic():
        for model_name in LOAD_ORDER:
            model = getattr(product_models, model_name)
            expected_count = (
                EXPECTED_RESOLUTION_COUNT
                if model_name == "ScreenResolution"
                else EXPECTED_PRODUCT_COUNTS[model_name]
            )
            imported_count = _upsert_csv_model(
                model,
                database_root / f"{model_name}.csv",
                expected_count,
            )
            if model_name != "ScreenResolution":
                dataset_counts[model_name] = imported_count

    table_counts = {
        model_name: getattr(product_models, model_name).objects.count()
        for model_name in EXPECTED_PRODUCT_COUNTS
    }
    return {
        "dataset_counts": dataset_counts,
        "table_counts": table_counts,
        "resolution_count": product_models.ScreenResolution.objects.count(),
    }


def _verify_favorite_product(product_models: Any, product_code: str) -> str:
    normalized = product_code.strip()
    model_name = PRODUCT_MODEL_BY_PREFIX.get(normalized[:3])
    if model_name is None:
        raise ValueError(f"Unsupported favorite product code prefix: {normalized!r}")
    model = getattr(product_models, model_name)
    if not model.objects.filter(product_code=normalized).exists():
        raise ValueError(f"Favorite product code is not present in the local dataset: {normalized!r}")
    return normalized


def seed_demo_account(
    username: str,
    password: str | None,
    favorite_product_code: str,
) -> dict[str, Any]:
    from django.db import transaction
    from accounts.models import Account, UserFavorite
    import products.models as product_models

    username = validate_demo_username(username)
    password = validate_demo_password(password)
    favorite_product_code = _verify_favorite_product(
        product_models,
        favorite_product_code,
    )

    with transaction.atomic():
        account = Account.objects.filter(username=username).first()
        created = account is None
        if account is None:
            account = Account(username=username, nickname="LG Demo")
            if password is None:
                account.set_unusable_password()
            else:
                account.set_password(password)
            account.save()
        else:
            account.nickname = "LG Demo"
            if password is not None:
                account.set_password(password)
                account.save(update_fields=["nickname", "password"])
            else:
                account.save(update_fields=["nickname"])

        matching_favorites = UserFavorite.objects.filter(
            account=account,
            product_code=favorite_product_code,
        ).order_by("pk")
        favorite = matching_favorites.first()
        favorite_created = favorite is None
        if favorite is None:
            favorite = UserFavorite.objects.create(
                account=account,
                product_code=favorite_product_code,
            )
        else:
            matching_favorites.exclude(pk=favorite.pk).delete()

    favorite_count = UserFavorite.objects.filter(
        account=account,
        product_code=favorite_product_code,
    ).count()
    if favorite_count != 1:
        raise RuntimeError("Synthetic favorite verification did not produce exactly one row.")

    return {
        "mode": "created" if created else "updated",
        "id": account.pk,
        "username": account.username,
        "favorite_id": favorite.pk,
        "favorite_product_code": favorite_product_code,
        "favorite_created": favorite_created,
        "password_configured": account.has_usable_password(),
    }


def seed_demo(
    project_root: Path,
    username: str,
    password: str | None,
    favorite_product_code: str,
) -> dict[str, Any]:
    from django.conf import settings
    from django.db import transaction

    root = validate_project_root(project_root)
    assert_local_sqlite_database(root, settings.DATABASES["default"])

    with transaction.atomic():
        product_result = seed_product_data(root)
        account_result = seed_demo_account(
            username,
            password,
            favorite_product_code,
        )

    return {
        **product_result,
        "demo_account": account_result,
    }


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    try:
        username = validate_demo_username(args.username)
        root = bootstrap_django(args.project_root)
        password = validate_demo_password(
            os.environ.get(args.password_env) if args.password_env else None
        )
        result = seed_demo(
            root,
            username,
            password=password,
            favorite_product_code=args.favorite_product_code,
        )
    except (FileNotFoundError, RuntimeError, ValueError) as error:
        print(f"Seed helper error: {error}", file=sys.stderr)
        return 1

    print(json.dumps(result, ensure_ascii=False, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
