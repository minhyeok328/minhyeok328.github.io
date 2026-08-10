import csv
import importlib.util
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import mysql.connector


HELPER_PATH = Path(__file__).with_name("load_tco_demo_data.py")


def load_helper():
    if not HELPER_PATH.is_file():
        raise AssertionError("The TCO demo loader has not been implemented yet.")
    spec = importlib.util.spec_from_file_location("load_tco_demo_data", HELPER_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError("Could not load the TCO demo loader.")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class TcoConnectionGuardTests(unittest.TestCase):
    def test_default_project_root_reads_the_capture_environment(self):
        with patch.dict(os.environ, {"TCO_PROJECT_ROOT": "portable-tco-source"}):
            helper = load_helper()

        self.assertEqual(helper.DEFAULT_PROJECT_ROOT, Path("portable-tco-source"))

    def test_only_accepts_the_task_owned_loopback_database_contract(self):
        helper = load_helper()
        valid = {
            "host": "127.0.0.1",
            "port": 3306,
            "user": "tco_capture",
            "password": "ephemeral-test-password",
            "database": "tco_system",
        }

        settings = helper.ConnectionSettings.from_mapping(valid)
        self.assertEqual(settings.host, "127.0.0.1")

        invalid_overrides = (
            {"host": "db.example.test"},
            {"port": 3307},
            {"user": "root"},
            {"password": ""},
            {"database": "production"},
        )
        for override in invalid_overrides:
            with self.subTest(override=override):
                candidate = {**valid, **override}
                with self.assertRaises(ValueError):
                    helper.ConnectionSettings.from_mapping(candidate)


def write_tco_fixture(root: Path, *, malformed_oil: bool = False) -> None:
    source = root / "DB_Side"
    source.mkdir(parents=True, exist_ok=True)
    oil_row = [
        "아반떼 1.6 테스트",
        "현대",
        "휘발유",
        "15.0",
        "13.0",
        "17.0",
        "NULL",
        "1200000",
        "1등급",
        "1598",
        "2025",
        "",
    ]
    if malformed_oil:
        oil_row.pop()
    with (source / "car_oil.csv").open("w", newline="", encoding="utf-8-sig") as stream:
        csv.writer(stream).writerow(oil_row)
    with (source / "car_price.csv").open(
        "w", newline="", encoding="utf-8-sig"
    ) as stream:
        csv.writer(stream).writerow(
            ["2025 현대 아반떼", "2000", "2600", "https://example.test/car.jpg"]
        )
    (source / "DBsetup.sql").write_text(
        """
CREATE DATABASE IF NOT EXISTS tco_system;
USE tco_system;
DROP TABLE IF EXISTS parts;
CREATE TABLE IF NOT EXISTS parts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  part_name VARCHAR(100) NOT NULL,
  cycle_km INT,
  price_tierA INT NOT NULL,
  price_tierB INT NOT NULL,
  price_tierC INT NOT NULL
);
INSERT INTO parts (part_name, cycle_km, price_tierA, price_tierB, price_tierC)
VALUES ('엔진오일', 7500, 75000, 130000, 350000);
SELECT * FROM parts;
COMMIT;
""".strip(),
        encoding="utf-8",
    )


class TcoSourceValidationTests(unittest.TestCase):
    def setUp(self):
        self.temp_directory = tempfile.TemporaryDirectory(prefix="tco-loader-tests-")
        self.project_root = Path(self.temp_directory.name) / "tco-project"
        write_tco_fixture(self.project_root)

    def tearDown(self):
        self.temp_directory.cleanup()

    def test_reads_fixed_width_csvs_and_normalizes_sql_null_sentinels(self):
        helper = load_helper()
        self.assertTrue(
            hasattr(helper, "read_source_bundle"),
            "The source bundle reader has not been implemented yet.",
        )

        bundle = helper.read_source_bundle(
            self.project_root,
            expected_counts={"car_oil": 1, "car_price": 1, "parts": 1},
        )

        self.assertEqual(len(bundle.car_oil_rows), 1)
        self.assertEqual(len(bundle.car_price_rows), 1)
        self.assertEqual(bundle.car_oil_rows[0][0], "아반떼 1.6 테스트")
        self.assertIsNone(bundle.car_oil_rows[0][6])
        self.assertIsNone(bundle.car_oil_rows[0][11])

    def test_rejects_a_csv_row_that_does_not_match_the_real_table_width(self):
        helper = load_helper()
        self.assertTrue(
            hasattr(helper, "read_source_bundle"),
            "The source bundle reader has not been implemented yet.",
        )
        write_tco_fixture(self.project_root, malformed_oil=True)

        with self.assertRaisesRegex(RuntimeError, "car_oil.csv.*12 columns"):
            helper.read_source_bundle(
                self.project_root,
                expected_counts={"car_oil": 1, "car_price": 1, "parts": 1},
            )

    def test_rejects_unexpected_source_row_counts_before_connecting(self):
        helper = load_helper()
        self.assertTrue(
            hasattr(helper, "read_source_bundle"),
            "The source bundle reader has not been implemented yet.",
        )

        with self.assertRaisesRegex(RuntimeError, "car_price.csv row-count validation"):
            helper.read_source_bundle(
                self.project_root,
                expected_counts={"car_oil": 1, "car_price": 2, "parts": 1},
            )


@unittest.skipUnless(
    os.getenv("TCO_TEST_DB") == "1",
    "Set TCO_TEST_DB=1 with the capture-only local DB environment to run.",
)
class TcoMariaDbIntegrationTests(unittest.TestCase):
    def setUp(self):
        self.temp_directory = tempfile.TemporaryDirectory(prefix="tco-db-tests-")
        self.project_root = Path(self.temp_directory.name) / "tco-project"
        write_tco_fixture(self.project_root)
        self.helper = load_helper()
        self.assertTrue(
            hasattr(self.helper, "load_database"),
            "The guarded MariaDB loader has not been implemented yet.",
        )
        self.settings = self.helper.ConnectionSettings.from_mapping(
            {
                "host": os.environ.get("DB_HOST", ""),
                "port": os.environ.get("DB_PORT", ""),
                "user": os.environ.get("DB_USER", ""),
                "password": os.environ.get("DB_PASSWORD", ""),
                "database": os.environ.get("DB_NAME", ""),
            }
        )

    def tearDown(self):
        self.temp_directory.cleanup()

    def connect(self):
        return mysql.connector.connect(
            host=self.settings.host,
            port=self.settings.port,
            user=self.settings.user,
            password=self.settings.password,
            database=self.settings.database,
            ssl_disabled=True,
        )

    def test_loads_real_schema_sources_and_supports_the_avante_query(self):
        result = self.helper.load_database(
            self.project_root,
            self.settings,
            expected_counts={"car_oil": 1, "car_price": 1, "parts": 1},
        )

        self.assertEqual(
            result["counts"], {"car_oil": 1, "car_price": 1, "parts": 1}
        )
        self.assertEqual(result["avante_matches"], 1)
        self.assertEqual(result["external_calls"], 0)
        with self.connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT model_name, run_per_charge, price_model "
                    "FROM car_oil WHERE model_name LIKE %s",
                    ("%아반떼%",),
                )
                row = cursor.fetchone()
                cursor.execute("SELECT part_name FROM parts")
                part = cursor.fetchone()

        self.assertEqual(row, ("아반떼 1.6 테스트", None, None))
        self.assertEqual(part, ("엔진오일",))

    def test_rebuild_is_idempotent_and_replaces_stale_capture_rows(self):
        self.helper.load_database(
            self.project_root,
            self.settings,
            expected_counts={"car_oil": 1, "car_price": 1, "parts": 1},
        )
        with self.connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute("DELETE FROM car_price")
            connection.commit()

        result = self.helper.load_database(
            self.project_root,
            self.settings,
            expected_counts={"car_oil": 1, "car_price": 1, "parts": 1},
        )

        self.assertEqual(result["counts"]["car_price"], 1)
        with self.connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT COUNT(*) FROM car_price")
                count = cursor.fetchone()[0]
        self.assertEqual(count, 1)

    def test_failed_staging_validation_preserves_the_previous_tables(self):
        self.helper.load_database(
            self.project_root,
            self.settings,
            expected_counts={"car_oil": 1, "car_price": 1, "parts": 1},
        )
        with self.connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT model_name FROM car_oil ORDER BY model_name")
                before = cursor.fetchall()

        with self.assertRaisesRegex(RuntimeError, "parts row-count validation"):
            self.helper.load_database(
                self.project_root,
                self.settings,
                expected_counts={"car_oil": 1, "car_price": 1, "parts": 2},
            )

        with self.connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT model_name FROM car_oil ORDER BY model_name")
                after = cursor.fetchall()
                cursor.execute(
                    "SELECT COUNT(*) FROM information_schema.tables "
                    "WHERE table_schema = DATABASE() "
                    "AND table_name LIKE %s",
                    ("%capture_new",),
                )
                staging_count = cursor.fetchone()[0]

        self.assertEqual(after, before)
        self.assertEqual(staging_count, 0)


if __name__ == "__main__":
    unittest.main()
