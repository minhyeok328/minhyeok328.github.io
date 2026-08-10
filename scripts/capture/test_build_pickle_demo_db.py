import csv
from contextlib import closing
import hashlib
import importlib.util
import os
from pathlib import Path
import sqlite3
import tempfile
import unittest
from unittest.mock import patch


HELPER_PATH = Path(__file__).with_name("build_pickle_demo_db.py")


def load_helper():
    if not HELPER_PATH.is_file():
        raise AssertionError("The PICKLE demo DB builder has not been implemented yet.")
    spec = importlib.util.spec_from_file_location("build_pickle_demo_db", HELPER_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError("Could not load the PICKLE demo DB builder.")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def write_csv(path: Path, fieldnames: list[str], rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as stream:
        writer = csv.DictWriter(stream, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def build_fixture_project(root: Path, *, invalid_tag_relation: bool = False) -> None:
    source = root / "database" / "processed" / "db_csv_tablewise"
    (root / "database" / "sql").mkdir(parents=True, exist_ok=True)

    write_csv(
        source / "restaurant.csv",
        [
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
        ],
        [
            {
                "restaurant_code": "RES0001",
                "name": "테스트 식당",
                "img_link": "https://example.test/restaurant.webp",
                "region": "신대방삼거리역",
                "address": "서울 동작구 테스트로 1",
                "lat": "37.5001",
                "lng": "126.9201",
                "open_time": "11:00",
                "close_time": "22:00",
                "tel_no": "",
            }
        ],
    )
    write_csv(
        source / "user.csv",
        ["user_code", "name", "avg_score", "rv_cnt", "follower_cnt"],
        [
            {
                "user_code": "USR0001",
                "name": "테스트 사용자",
                "avg_score": "4.3",
                "rv_cnt": "7",
                "follower_cnt": "2",
            }
        ],
    )
    write_csv(
        source / "category.csv",
        ["category_code", "category_name"],
        [{"category_code": "CAT0001", "category_name": "일식"}],
    )
    write_csv(
        source / "tag.csv",
        ["tag_code", "name"],
        [{"tag_code": "TAG0001", "name": "가성비"}],
    )
    write_csv(
        source / "menu.csv",
        ["menu_code", "restaurant_code", "name", "price", "description"],
        [
            {
                "menu_code": "MEN0001",
                "restaurant_code": "RES0001",
                "name": "회전초밥",
                "price": "1500",
                "description": "한 접시 가격",
            }
        ],
    )
    write_csv(
        source / "review.csv",
        [
            "review_code",
            "restaurant_code",
            "user_code",
            "score",
            "taste_level",
            "price_level",
            "service_level",
            "content",
            "menu",
        ],
        [
            {
                "review_code": "REV0001",
                "restaurant_code": "RES0001",
                "user_code": "USR0001",
                "score": "4.5점",
                "taste_level": "2.0",
                "price_level": "2.0",
                "service_level": "1.0",
                "content": "첫 줄\n둘째 줄",
                "menu": "회전초밥",
            }
        ],
    )
    write_csv(
        source / "rel_res_cat.csv",
        ["restaurant_code", "category_code"],
        [{"restaurant_code": "RES0001", "category_code": "CAT0001"}],
    )
    write_csv(
        source / "rel_res_tag.csv",
        ["restaurant_code", "tag_code"],
        [
            {
                "restaurant_code": "RES0001",
                "tag_code": "TAG9999" if invalid_tag_relation else "TAG0001",
            }
        ],
    )
    write_csv(
        source / "rel_rev_tag.csv",
        ["review_code", "tag_code"],
        [{"review_code": "REV0001", "tag_code": "TAG0001"}],
    )


FIXTURE_COUNTS = {
    "users": 1,
    "restaurant": 1,
    "food": 0,
    "menu": 1,
    "category": 1,
    "tag": 1,
    "review": 1,
    "rel_restaurant_category": 1,
    "rel_restaurant_tag": 1,
    "rel_review_tag": 1,
}


class BuildPickleDemoDatabaseTests(unittest.TestCase):
    def test_default_project_root_reads_the_capture_environment(self):
        with patch.dict(os.environ, {"PICKLE_PROJECT_ROOT": "portable-pickle-source"}):
            helper = load_helper()

        self.assertEqual(helper.DEFAULT_PROJECT_ROOT, Path("portable-pickle-source"))

    def setUp(self):
        self.temp_directory = tempfile.TemporaryDirectory(prefix="pickle-db-tests-")
        self.project_root = Path(self.temp_directory.name) / "pickle-project"
        build_fixture_project(self.project_root)

    def tearDown(self):
        self.temp_directory.cleanup()

    def test_builds_runtime_schema_and_normalizes_source_columns(self):
        helper = load_helper()

        result = helper.build_database(
            self.project_root,
            expected_counts=FIXTURE_COUNTS,
        )

        database_path = self.project_root / "database" / "sql" / "restaurant.db"
        self.assertEqual(result["database_path"], str(database_path.resolve()))
        self.assertEqual(result["counts"], FIXTURE_COUNTS)

        with closing(sqlite3.connect(database_path)) as connection:
            user = connection.execute(
                "SELECT review_cnt, avg_score FROM users WHERE user_code = 'USR0001'"
            ).fetchone()
            category = connection.execute(
                "SELECT name, description, embedding FROM category WHERE category_code = 'CAT0001'"
            ).fetchone()
            menu = connection.execute(
                "SELECT food_code, price, prompted_description, embedding FROM menu WHERE menu_code = 'MEN0001'"
            ).fetchone()
            review = connection.execute(
                "SELECT score, content, embedding FROM review WHERE review_code = 'REV0001'"
            ).fetchone()
            foreign_key_issues = connection.execute("PRAGMA foreign_key_check").fetchall()

        self.assertEqual(user, (7, 4.3))
        self.assertEqual(category, ("일식", None, None))
        self.assertEqual(menu, (None, 1500, None, None))
        self.assertEqual(review, (4.5, "첫 줄\n둘째 줄", None))
        self.assertEqual(foreign_key_issues, [])

    def test_rebuild_replaces_stale_generated_database_idempotently(self):
        helper = load_helper()
        first = helper.build_database(
            self.project_root,
            expected_counts=FIXTURE_COUNTS,
        )
        database_path = Path(first["database_path"])

        with closing(sqlite3.connect(database_path)) as connection:
            connection.execute("DELETE FROM menu")
            connection.commit()

        second = helper.build_database(
            self.project_root,
            expected_counts=FIXTURE_COUNTS,
        )

        with closing(sqlite3.connect(database_path)) as connection:
            menu_count = connection.execute("SELECT COUNT(*) FROM menu").fetchone()[0]

        self.assertEqual(second["counts"], FIXTURE_COUNTS)
        self.assertEqual(menu_count, 1)
        self.assertFalse(database_path.with_suffix(".db.tmp").exists())

    def test_build_preserves_an_unrelated_legacy_temp_file(self):
        helper = load_helper()
        database_path = self.project_root / "database" / "sql" / "restaurant.db"
        legacy_temp_path = database_path.with_suffix(".db.tmp")
        legacy_temp_path.parent.mkdir(parents=True, exist_ok=True)
        legacy_temp_path.write_text("unrelated temporary data", encoding="utf-8")

        helper.build_database(
            self.project_root,
            expected_counts=FIXTURE_COUNTS,
        )

        self.assertEqual(
            legacy_temp_path.read_text(encoding="utf-8"),
            "unrelated temporary data",
        )

    def test_invalid_foreign_key_preserves_the_previous_database(self):
        helper = load_helper()
        first = helper.build_database(
            self.project_root,
            expected_counts=FIXTURE_COUNTS,
        )
        database_path = Path(first["database_path"])
        original_digest = hashlib.sha256(database_path.read_bytes()).hexdigest()

        build_fixture_project(self.project_root, invalid_tag_relation=True)

        with self.assertRaisesRegex(RuntimeError, "foreign-key validation"):
            helper.build_database(
                self.project_root,
                expected_counts=FIXTURE_COUNTS,
            )

        preserved_digest = hashlib.sha256(database_path.read_bytes()).hexdigest()
        self.assertEqual(preserved_digest, original_digest)
        self.assertFalse(database_path.with_suffix(".db.tmp").exists())

    def test_existing_database_not_created_by_helper_is_never_overwritten(self):
        helper = load_helper()
        database_path = self.project_root / "database" / "sql" / "restaurant.db"
        with closing(sqlite3.connect(database_path)) as connection:
            connection.execute("CREATE TABLE unrelated (value TEXT)")
            connection.execute("INSERT INTO unrelated VALUES ('keep me')")
            connection.commit()
        original_digest = hashlib.sha256(database_path.read_bytes()).hexdigest()

        with self.assertRaisesRegex(RuntimeError, "not created by this helper"):
            helper.build_database(
                self.project_root,
                expected_counts=FIXTURE_COUNTS,
            )

        preserved_digest = hashlib.sha256(database_path.read_bytes()).hexdigest()
        self.assertEqual(preserved_digest, original_digest)

    def test_missing_tablewise_source_directory_is_rejected(self):
        helper = load_helper()
        empty_root = Path(self.temp_directory.name) / "empty-project"

        with self.assertRaisesRegex(FileNotFoundError, "table-wise CSV directory"):
            helper.build_database(empty_root, expected_counts=FIXTURE_COUNTS)


if __name__ == "__main__":
    unittest.main()
