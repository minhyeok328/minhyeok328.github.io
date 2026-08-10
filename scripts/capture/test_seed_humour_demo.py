import importlib.util
from datetime import datetime, timezone
import os
from pathlib import Path
import secrets
import shutil
import sys
import tempfile
import unittest
from unittest.mock import patch


HELPER_PATH = Path(__file__).with_name("seed_humour_demo.py")
PORTFOLIO_ROOT = Path(__file__).resolve().parents[2]
SOURCE_BACKEND = Path(
    os.environ.get(
        "HUMOUR_BACKEND_ROOT",
        PORTFOLIO_ROOT.parent / "skn26_projects" / "Final_project" / "backend",
    )
)


def load_helper():
    spec = importlib.util.spec_from_file_location("seed_humour_demo", HELPER_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError("Could not load the HumouR demo seed helper.")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class SeedHumourDemoContractTests(unittest.TestCase):
    def test_default_backend_root_does_not_embed_a_machine_specific_absolute_path(self):
        helper = load_helper()

        self.assertFalse(helper.DEFAULT_BACKEND_ROOT.is_absolute())

    def test_cli_reads_backend_root_from_the_capture_environment(self):
        helper = load_helper()

        with patch.dict(os.environ, {"HUMOUR_BACKEND_ROOT": "demo-backend"}):
            args = helper.parse_args([])

        self.assertEqual(args.backend_root, Path("demo-backend"))

    def test_non_demo_username_is_rejected_before_database_access(self):
        helper = load_helper()

        with self.assertRaisesRegex(ValueError, "synthetic demo prefix"):
            helper.validate_demo_username("existing-production-user")

    def test_demo_records_match_frontend_resume_and_report_shapes(self):
        helper = load_helper()
        records = helper.build_demo_records()

        resume = records["resume"]
        report = records["report"]

        self.assertEqual(resume["education_level"]["final_degree"], "bachelor")
        self.assertEqual(
            set(resume["experience"][0]),
            {"company_name", "length", "position", "experience_description"},
        )
        self.assertEqual(
            set(resume["training"][0]),
            {"education_name", "education_from", "education_description", "start", "end"},
        )
        self.assertTrue(all(set(item) == {"content", "result"} for item in report["checklist"]))
        self.assertTrue(all(isinstance(item, str) for item in report["competency_analysis"]))
        self.assertTrue(all(set(item) == {"question", "answer", "purpose"} for item in report["interview_question"]))
        self.assertEqual(report["status"], "done")

    def test_cli_supports_reset_and_existing_account_modes(self):
        helper = load_helper()

        reset_args = helper.parse_args(["--reset"])
        existing_args = helper.parse_args(["--require-existing-account"])

        self.assertTrue(reset_args.reset)
        self.assertTrue(existing_args.require_existing_account)
        self.assertEqual(reset_args.username, helper.DEFAULT_USERNAME)

    def test_database_target_guard_rejects_any_other_sqlite_file(self):
        helper = load_helper()
        backend_root = Path(tempfile.gettempdir()) / "humour-guard-backend"
        wrong_database = backend_root / "other.sqlite3"

        with self.assertRaisesRegex(RuntimeError, "expected local SQLite database"):
            helper.assert_local_sqlite_database(
                backend_root,
                {"ENGINE": "django.db.backends.sqlite3", "NAME": wrong_database},
            )


@unittest.skipUnless(
    os.environ.get("HUMOUR_CAPTURE_INTEGRATION") == "1",
    "requires the reviewed HumouR backend checkout",
)
class SeedHumourDemoIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls._temp_directory = tempfile.TemporaryDirectory(prefix="humour-seed-tests-")
        cls.backend_root = Path(cls._temp_directory.name) / "backend"
        cls.backend_root.mkdir()
        ignore = shutil.ignore_patterns("__pycache__", "*.pyc", "*.pyo")
        shutil.copytree(SOURCE_BACKEND / "api", cls.backend_root / "api", ignore=ignore)
        shutil.copytree(SOURCE_BACKEND / "config", cls.backend_root / "config", ignore=ignore)
        shutil.copy2(SOURCE_BACKEND / "manage.py", cls.backend_root / "manage.py")

        cls.helper = load_helper()
        os.environ["DJANGO_SETTINGS_MODULE"] = "invalid.review.inherited_settings"
        os.environ["IS_REMOTE_HOST"] = "test-marker"
        cls.helper.bootstrap_django(cls.backend_root)

        from django.conf import settings
        from django.core.management import call_command

        if os.environ["DJANGO_SETTINGS_MODULE"] != "config.settings":
            raise AssertionError("bootstrap_django must replace inherited Django settings.")
        if Path(settings.DATABASES["default"]["NAME"]).resolve() != (cls.backend_root / "db.sqlite3").resolve():
            raise AssertionError("Integration tests must use only temporary SQLite.")
        call_command("migrate", interactive=False, verbosity=0)

        from api.models import Account, AnalysisReport, AuthKey, Checklist, CompanyInfo, JobDescription, Resume

        cls.Account = Account
        cls.AnalysisReport = AnalysisReport
        cls.AuthKey = AuthKey
        cls.Checklist = Checklist
        cls.CompanyInfo = CompanyInfo
        cls.JobDescription = JobDescription
        cls.Resume = Resume

    @classmethod
    def tearDownClass(cls):
        from django.db import connections

        connections.close_all()
        cls._temp_directory.cleanup()
        super().tearDownClass()

    def setUp(self):
        self.Account.objects.all().delete()

    def create_account(self, username, *, usable_password=False):
        account = self.Account(username=username, name="합성 테스트 계정")
        if usable_password:
            account.set_password(secrets.token_urlsafe(24))
        else:
            account.set_unusable_password()
        account.save()
        return account

    def matching_counts(self, account):
        jobs = self.JobDescription.objects.filter(
            account=account,
            job_name=self.helper.DEMO_JOB_NAME,
        )
        resumes = self.Resume.objects.filter(
            job_description__account=account,
            job_description__job_name=self.helper.DEMO_JOB_NAME,
            name=self.helper.DEMO_RESUME_NAME,
        )
        reports = self.AnalysisReport.objects.filter(
            resume__job_description__account=account,
            resume__name=self.helper.DEMO_RESUME_NAME,
            version=self.helper.DEMO_REPORT_VERSION,
        )
        return {
            "account": self.Account.objects.filter(username=account.username).count(),
            "company_info": self.CompanyInfo.objects.filter(account=account).count(),
            "job_description": jobs.count(),
            "checklist": self.Checklist.objects.filter(job_description__in=jobs).count(),
            "resume": resumes.count(),
            "analysis_report": reports.count(),
            "auth_key": self.AuthKey.objects.filter(account=account).count(),
        }

    def test_create_then_reseed_keeps_ids_counts_and_fixed_review_timestamp(self):
        created = self.helper.seed_demo(self.helper.DEFAULT_USERNAME, False)
        reseeded = self.helper.seed_demo(self.helper.DEFAULT_USERNAME, False)
        account = self.Account.objects.get(username=self.helper.DEFAULT_USERNAME)
        resume = self.Resume.objects.get(job_description__account=account)

        self.assertEqual(created["mode"], "created")
        self.assertEqual(reseeded["mode"], "updated")
        self.assertEqual(created["ids"], reseeded["ids"])
        self.assertEqual(reseeded["counts"], self.matching_counts(account))
        self.assertEqual(resume.reviewed_at, self.helper.DEMO_REVIEWED_AT)

    def test_reset_deletes_only_named_account_and_its_cascade(self):
        seeded = self.helper.seed_demo(self.helper.DEFAULT_USERNAME, False)
        other = self.create_account("portfolio-demo-other")
        self.CompanyInfo.objects.create(account=other, company_name="별도 합성 회사")

        result = self.helper.reset_demo(self.helper.DEFAULT_USERNAME)

        self.assertTrue(result["deleted"])
        self.assertFalse(self.Account.objects.filter(pk=seeded["ids"]["account"]).exists())
        self.assertFalse(self.JobDescription.objects.filter(account__username=self.helper.DEFAULT_USERNAME).exists())
        self.assertFalse(self.Resume.objects.filter(job_description__account__username=self.helper.DEFAULT_USERNAME).exists())
        self.assertFalse(self.AnalysisReport.objects.filter(resume__job_description__account__username=self.helper.DEFAULT_USERNAME).exists())
        self.assertTrue(self.Account.objects.filter(pk=other.pk).exists())
        self.assertTrue(self.CompanyInfo.objects.filter(account=other).exists())

    def test_reset_refuses_an_account_with_an_auth_key(self):
        account = self.create_account(self.helper.DEFAULT_USERNAME)
        auth_key = self.AuthKey.objects.create(
            account=account,
            name="reset refusal fixture",
            value=secrets.token_hex(24),
        )

        with self.assertRaisesRegex(RuntimeError, "already has an AuthKey"):
            self.helper.reset_demo(self.helper.DEFAULT_USERNAME)

        self.assertTrue(self.Account.objects.filter(pk=account.pk).exists())
        self.assertTrue(self.AuthKey.objects.filter(pk=auth_key.pk).exists())

    def test_require_existing_account_preserves_password(self):
        account = self.create_account(self.helper.DEFAULT_USERNAME, usable_password=True)
        encoded_password_before = account.password

        result = self.helper.seed_demo(self.helper.DEFAULT_USERNAME, True)
        account.refresh_from_db()

        self.assertEqual(result["mode"], "updated")
        self.assertEqual(account.password, encoded_password_before)
        self.assertTrue(account.has_usable_password())

    def test_seeded_account_is_capture_ready_without_an_auth_key(self):
        self.helper.seed_demo(self.helper.DEFAULT_USERNAME, False)
        account = self.Account.objects.get(username=self.helper.DEFAULT_USERNAME)

        self.assertGreaterEqual(account.credit, 100)
        self.assertTrue(account.subscribe)
        self.assertIsNotNone(account.subscribe_expiration)
        self.assertGreater(account.subscribe_expiration, datetime.now(timezone.utc))
        self.assertFalse(self.AuthKey.objects.filter(account=account).exists())

    def test_auth_key_refusal_rolls_back_account_and_related_writes(self):
        account = self.create_account(self.helper.DEFAULT_USERNAME)
        original_name = account.name
        original_credit = account.credit
        self.AuthKey.objects.create(
            account=account,
            name="temporary refusal fixture",
            value=secrets.token_hex(24),
        )

        with self.assertRaisesRegex(RuntimeError, "already has an AuthKey"):
            self.helper.seed_demo(self.helper.DEFAULT_USERNAME, True)

        account.refresh_from_db()
        self.assertEqual(account.name, original_name)
        self.assertEqual(account.credit, original_credit)
        self.assertFalse(self.CompanyInfo.objects.filter(account=account).exists())
        self.assertFalse(self.JobDescription.objects.filter(account=account).exists())
        self.assertEqual(self.AuthKey.objects.filter(account=account).count(), 1)

    def test_duplicate_synthetic_rows_are_cleaned_only_inside_named_account(self):
        seeded = self.helper.seed_demo(self.helper.DEFAULT_USERNAME, False)
        account = self.Account.objects.get(pk=seeded["ids"]["account"])
        records = self.helper.build_demo_records()
        canonical_job = self.JobDescription.objects.get(pk=seeded["ids"]["job_description"])
        canonical_resume = self.Resume.objects.get(pk=seeded["ids"]["resume"])

        duplicate_job = self.JobDescription.objects.create(account=account, **records["job"])
        duplicate_resume = self.Resume.objects.create(
            job_description=canonical_job,
            **records["resume"],
        )
        self.AnalysisReport.objects.create(
            resume=canonical_resume,
            **records["report"],
        )
        self.Checklist.objects.create(
            job_description=canonical_job,
            content=records["checklists"][0],
        )

        other = self.create_account("portfolio-demo-other")
        other_job = self.JobDescription.objects.create(account=other, **records["job"])
        other_resume = self.Resume.objects.create(job_description=other_job, **records["resume"])
        other_report = self.AnalysisReport.objects.create(resume=other_resume, **records["report"])

        result = self.helper.seed_demo(self.helper.DEFAULT_USERNAME, True)

        self.assertEqual(result["ids"], seeded["ids"])
        self.assertEqual(result["counts"], self.matching_counts(account))
        self.assertEqual(result["counts"]["job_description"], 1)
        self.assertEqual(result["counts"]["resume"], 1)
        self.assertEqual(result["counts"]["analysis_report"], 1)
        self.assertEqual(result["counts"]["checklist"], 5)
        self.assertFalse(self.JobDescription.objects.filter(pk=duplicate_job.pk).exists())
        self.assertFalse(self.Resume.objects.filter(pk=duplicate_resume.pk).exists())
        self.assertTrue(self.JobDescription.objects.filter(pk=other_job.pk).exists())
        self.assertTrue(self.Resume.objects.filter(pk=other_resume.pk).exists())
        self.assertTrue(self.AnalysisReport.objects.filter(pk=other_report.pk).exists())


if __name__ == "__main__":
    unittest.main()
