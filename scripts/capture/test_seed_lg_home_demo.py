import importlib.util
import json
import os
from pathlib import Path
import shutil
import tempfile
import unittest
from unittest.mock import patch


HELPER_PATH = Path(__file__).with_name("seed_lg_home_demo.py")
PORTFOLIO_ROOT = Path(__file__).resolve().parents[2]
SOURCE_PROJECT = Path(
    os.environ.get(
        "LG_HOME_PROJECT_ROOT",
        PORTFOLIO_ROOT.parent / "skn26_projects" / "4th_project",
    )
)


def load_helper():
    if not HELPER_PATH.is_file():
        raise AssertionError("LG Home AI demo seed helper has not been implemented.")
    spec = importlib.util.spec_from_file_location("seed_lg_home_demo", HELPER_PATH)
    if spec is None or spec.loader is None:
        raise AssertionError("Could not load the LG Home AI demo seed helper.")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class SeedLGHomeDemoContractTests(unittest.TestCase):
    def test_default_project_root_reads_the_capture_environment(self):
        with patch.dict(os.environ, {"LG_HOME_PROJECT_ROOT": "portable-lg-source"}):
            helper = load_helper()

        self.assertEqual(helper.DEFAULT_PROJECT_ROOT, Path("portable-lg-source"))

    def test_csv_reader_normalizes_units_and_empty_values(self):
        helper = load_helper()
        with tempfile.TemporaryDirectory(prefix="lg-seed-csv-") as directory:
            path = Path(directory) / "ProductDemo.csv"
            path.write_text(
                "product_code,power_consum(W),color,price\n"
                'REF900,3500.0,"beige, green",\n',
                encoding="utf-8",
            )

            rows = helper.read_csv_rows(path)

        self.assertEqual(
            rows,
            [
                {
                    "product_code": "REF900",
                    "power_consum": "3500.0",
                    "color": "beige, green",
                    "price": None,
                }
            ],
        )

    def test_non_demo_username_is_rejected_before_database_access(self):
        helper = load_helper()

        with self.assertRaisesRegex(ValueError, "synthetic demo prefix"):
            helper.validate_demo_username("existing-user")

    def test_empty_temporary_password_is_rejected(self):
        helper = load_helper()
        validator = getattr(helper, "validate_demo_password", None)
        self.assertIsNotNone(validator, "Temporary password validation is missing.")

        with self.assertRaisesRegex(ValueError, "must not be empty"):
            validator("")

    def test_database_guard_rejects_any_other_sqlite_file(self):
        helper = load_helper()
        project_root = Path(tempfile.gettempdir()) / "lg-home-guard"

        with self.assertRaisesRegex(RuntimeError, "expected local SQLite database"):
            helper.assert_local_sqlite_database(
                project_root,
                {
                    "ENGINE": "django.db.backends.sqlite3",
                    "NAME": project_root / "other.sqlite3",
                },
            )


@unittest.skipUnless(
    os.environ.get("LG_HOME_CAPTURE_INTEGRATION") == "1",
    "requires the reviewed LG Home checkout",
)
class SeedLGHomeDemoIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls._temp_directory = tempfile.TemporaryDirectory(prefix="lg-home-seed-tests-")
        cls.project_root = Path(cls._temp_directory.name) / "4th_project"
        cls.project_root.mkdir()

        shutil.copy2(SOURCE_PROJECT / "manage.py", cls.project_root / "manage.py")
        for app_name in ("accounts", "chats", "config", "mainpage", "theme"):
            shutil.copytree(
                SOURCE_PROJECT / app_name,
                cls.project_root / app_name,
                ignore=shutil.ignore_patterns("__pycache__", "*.pyc", "node_modules"),
            )

        products_root = cls.project_root / "products"
        products_root.mkdir()
        for filename in ("__init__.py", "apps.py", "models.py"):
            shutil.copy2(SOURCE_PROJECT / "products" / filename, products_root / filename)
        shutil.copytree(
            SOURCE_PROJECT / "products" / "migrations",
            products_root / "migrations",
            ignore=shutil.ignore_patterns("__pycache__", "*.pyc"),
        )
        shutil.copytree(
            SOURCE_PROJECT / "products" / "data" / "database",
            products_root / "data" / "database",
        )

        cls.helper = load_helper()
        os.environ["DJANGO_SETTINGS_MODULE"] = "invalid.inherited.settings"
        cls.helper.bootstrap_django(cls.project_root)

        from django.conf import settings
        from django.core.management import call_command

        expected_database = (cls.project_root / "db.sqlite3").resolve()
        configured_database = Path(settings.DATABASES["default"]["NAME"]).resolve()
        if configured_database != expected_database:
            raise AssertionError("Integration tests must use only temporary SQLite.")
        call_command("migrate", interactive=False, verbosity=0)

        from accounts.models import Account, UserFavorite
        import products.models as product_models

        cls.Account = Account
        cls.UserFavorite = UserFavorite
        cls.product_models = product_models

    @classmethod
    def tearDownClass(cls):
        from django.db import connections

        connections.close_all()
        cls._temp_directory.cleanup()
        super().tearDownClass()

    def setUp(self):
        self.Account.objects.all().delete()
        for model_name in (
            "ProductTV",
            "ProductAC",
            "ProductFridge",
            "ProductVAC",
            "ProductWash",
            "ScreenResolution",
        ):
            getattr(self.product_models, model_name).objects.all().delete()

    def test_reseed_updates_dataset_and_preserves_unrelated_product(self):
        created = self.helper.seed_demo(
            self.project_root,
            self.helper.DEFAULT_USERNAME,
            password=None,
            favorite_product_code=self.helper.DEFAULT_FAVORITE_CODE,
        )
        account_id = created["demo_account"]["id"]
        favorite_id = created["demo_account"]["favorite_id"]

        self.product_models.ProductAC.objects.create(
            product_code="ACT999",
            name="Unrelated local fixture",
        )

        reseeded = self.helper.seed_demo(
            self.project_root,
            self.helper.DEFAULT_USERNAME,
            password=None,
            favorite_product_code=self.helper.DEFAULT_FAVORITE_CODE,
        )

        self.assertEqual(reseeded["dataset_counts"], self.helper.EXPECTED_PRODUCT_COUNTS)
        self.assertEqual(reseeded["demo_account"]["id"], account_id)
        self.assertEqual(reseeded["demo_account"]["favorite_id"], favorite_id)
        self.assertEqual(
            self.UserFavorite.objects.filter(
                account_id=account_id,
                product_code=self.helper.DEFAULT_FAVORITE_CODE,
            ).count(),
            1,
        )
        self.assertTrue(
            self.product_models.ProductAC.objects.filter(product_code="ACT999").exists()
        )
        self.assertEqual(reseeded["table_counts"]["ProductAC"], 235)

    def test_password_is_applied_without_appearing_in_result(self):
        password = "temporary-test-only-password"

        result = self.helper.seed_demo(
            self.project_root,
            self.helper.DEFAULT_USERNAME,
            password=password,
            favorite_product_code=self.helper.DEFAULT_FAVORITE_CODE,
        )
        account = self.Account.objects.get(username=self.helper.DEFAULT_USERNAME)

        self.assertTrue(account.check_password(password))
        self.assertTrue(result["demo_account"]["password_configured"])
        self.assertNotIn(password, json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    unittest.main()
