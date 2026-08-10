import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest


RUNNER_PATH = Path(__file__).with_name("run_bank_churners_demo.py")
SEED_HELPER_PATH = Path(__file__).with_name("seed_bank_churners_demo.py")
PORTFOLIO_ROOT = Path(__file__).resolve().parents[2]
SOURCE_PROJECT = Path(
    os.environ.get(
        "BANK_CHURNERS_SOURCE_ROOT",
        PORTFOLIO_ROOT.parent / "skn26_projects" / "2nd_project",
    )
)
METRIC_EVIDENCE_FILES = (
    Path(
        "mlflow/artifacts/1/3447f53a0f4245edb3186075bdfb70be/"
        "artifacts/best_model/best_model_summary.json"
    ),
    Path("notebooks/JoDongHwi/libght_gbm.ipynb"),
    Path("notebooks/JeonJongHyeok/easy_ensemble.ipynb"),
    Path("notebooks/JeongYoungIl/logisticregression.ipynb"),
    Path("notebooks/YounJeongYeon/XGBoost.ipynb"),
)


def load_runner():
    if not RUNNER_PATH.is_file():
        raise AssertionError("Bank Churners capture runner has not been implemented.")
    spec = importlib.util.spec_from_file_location("run_bank_churners_demo", RUNNER_PATH)
    if spec is None or spec.loader is None:
        raise AssertionError("Could not load the Bank Churners capture runner.")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def load_seed_helper():
    spec = importlib.util.spec_from_file_location(
        "seed_bank_churners_demo_for_runner_tests",
        SEED_HELPER_PATH,
    )
    if spec is None or spec.loader is None:
        raise AssertionError("Could not load the Bank Churners seed helper.")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def dispose_mlflow_test_engines() -> None:
    from mlflow.store.tracking.sqlalchemy_store import SqlAlchemyStore

    with SqlAlchemyStore._engine_map_lock:
        for engine in SqlAlchemyStore._engine_map.values():
            engine.dispose()
        SqlAlchemyStore._engine_map.clear()


def seed_valid_tracking_store(tracking_root: Path):
    helper = load_seed_helper()
    bundle = helper.collect_metric_evidence(SOURCE_PROJECT)
    helper.seed_tracking_store(
        bundle=bundle,
        tracking_root=tracking_root,
        source_commit=helper.EXPECTED_SOURCE_COMMIT,
    )
    return helper, bundle


def create_divergent_metric_source(source_root: Path) -> None:
    for relative_path in METRIC_EVIDENCE_FILES:
        destination = source_root / relative_path
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(SOURCE_PROJECT / relative_path, destination)

    summary_path = source_root / METRIC_EVIDENCE_FILES[0]
    summary = json.loads(summary_path.read_text(encoding="utf-8"))
    summary["metrics"]["accuracy"] = 0.971234
    summary_path.write_text(
        json.dumps(summary, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def git(root: Path, *args: str) -> str:
    completed = subprocess.run(
        ["git", "-C", str(root), *args],
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    return completed.stdout.strip()


def create_source_repository(root: Path) -> str:
    required_files = (
        "README.md",
        "model_evaluation.md",
        "streamlit/app.py",
        "streamlit/pages/dashboard.py",
        "streamlit/pages/strategy.py",
        "streamlit/pages/eda.py",
        "streamlit/assets/eda/eda1.png",
        "notebooks/SeoMinHyeok/creditcard_income_analysis_report.ipynb",
    )
    for relative_path in required_files:
        path = root / relative_path
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("fixture\n", encoding="utf-8")

    git(root, "init")
    git(root, "config", "user.email", "capture-tests@example.invalid")
    git(root, "config", "user.name", "Capture Tests")
    git(root, "add", ".")
    git(root, "commit", "-m", "fixture")
    return git(root, "rev-parse", "HEAD")


class CaptureRunnerContractTests(unittest.TestCase):
    def test_tracking_root_can_be_selected_from_the_environment(self):
        with tempfile.TemporaryDirectory(prefix="bank-churn-config-") as directory:
            previous = os.environ.get("BANK_CHURNERS_TRACKING_ROOT")
            os.environ["BANK_CHURNERS_TRACKING_ROOT"] = directory
            try:
                runner = load_runner()
            finally:
                if previous is None:
                    os.environ.pop("BANK_CHURNERS_TRACKING_ROOT", None)
                else:
                    os.environ["BANK_CHURNERS_TRACKING_ROOT"] = previous

        self.assertEqual(runner.DEFAULT_TRACKING_ROOT, Path(directory))

    @unittest.skipUnless(
        os.environ.get("BANK_CHURNERS_INTEGRATION") == "1",
        "requires the reviewed Bank Churners checkout",
    )
    def test_environment_uses_local_sqlite_and_a_loopback_non_service_url(self):
        runner = load_runner()
        with tempfile.TemporaryDirectory(prefix="bank-churn-runner-") as directory:
            temporary_root = Path(directory)
            source_root = temporary_root / "source"
            tracking_root = temporary_root / "tracking"
            try:
                create_divergent_metric_source(source_root)
                helper = load_seed_helper()
                bundle = helper.collect_metric_evidence(source_root)
                helper.seed_tracking_store(
                    bundle=bundle,
                    tracking_root=tracking_root,
                    source_commit=helper.EXPECTED_SOURCE_COMMIT,
                )
                environment = runner.build_capture_environment(
                    tracking_root,
                    source_root=source_root,
                )
                cache_directory_exists = Path(environment["MPLCONFIGDIR"]).is_dir()
            finally:
                dispose_mlflow_test_engines()

        self.assertTrue(environment["MLFLOW_TRACKING_URI"].startswith("sqlite:///"))
        self.assertEqual(
            environment["PIPELINE_API_BASE_URL"],
            "http://127.0.0.1:9",
        )
        self.assertEqual(environment["BANK_CHURNERS_EVIDENCE_MODE"], "precomputed")
        self.assertEqual(
            Path(environment["MPLCONFIGDIR"]),
            tracking_root.resolve() / "matplotlib",
        )
        self.assertTrue(cache_directory_exists)
        self.assertFalse(
            any(
                sensitive in key.upper()
                for key in environment
                for sensitive in ("PASSWORD", "SECRET", "TOKEN", "API_KEY")
            )
        )

    def test_missing_tracking_database_is_rejected_before_rendering(self):
        runner = load_runner()
        with tempfile.TemporaryDirectory(prefix="bank-churn-runner-") as directory:
            with self.assertRaisesRegex(FileNotFoundError, "seed_bank_churners_demo"):
                runner.build_capture_environment(Path(directory))

    def test_only_reviewed_evidence_views_are_accepted(self):
        runner = load_runner()

        accepted = []
        for view in ("leaderboard", "strategy", "eda"):
            try:
                accepted.append(runner.validate_view(view))
            except ValueError:
                pass
        self.assertEqual(accepted, ["leaderboard", "strategy", "eda"])
        for forbidden_view in ("dashboard", "prediction", "income-report"):
            with self.subTest(view=forbidden_view):
                with self.assertRaisesRegex(
                    ValueError,
                    "leaderboard, strategy, eda",
                ):
                    runner.validate_view(forbidden_view)

    def test_capture_source_guard_rejects_a_changed_head(self):
        runner = load_runner()
        with tempfile.TemporaryDirectory(prefix="bank-churn-source-") as directory:
            source_root = Path(directory)
            reviewed_commit = create_source_repository(source_root)
            runner.EXPECTED_SOURCE_COMMIT = reviewed_commit
            (source_root / "README.md").write_text("changed\n", encoding="utf-8")
            git(source_root, "add", "README.md")
            git(source_root, "commit", "-m", "changed revision")

            with self.assertRaisesRegex(RuntimeError, "source commit does not match"):
                runner.validate_source_ui(source_root)

    def test_capture_source_guard_rejects_tracked_and_untracked_changes(self):
        runner = load_runner()
        for change_type in ("tracked", "untracked"):
            with self.subTest(change_type=change_type):
                with tempfile.TemporaryDirectory(
                    prefix="bank-churn-source-"
                ) as directory:
                    source_root = Path(directory)
                    reviewed_commit = create_source_repository(source_root)
                    runner.EXPECTED_SOURCE_COMMIT = reviewed_commit
                    if change_type == "tracked":
                        (source_root / "README.md").write_text(
                            "dirty\n",
                            encoding="utf-8",
                        )
                    else:
                        (source_root / "untracked.txt").write_text(
                            "dirty\n",
                            encoding="utf-8",
                        )

                    with self.assertRaisesRegex(RuntimeError, "working tree"):
                        runner.validate_source_ui(source_root)

    @unittest.skipUnless(
        os.environ.get("BANK_CHURNERS_INTEGRATION") == "1",
        "requires the reviewed Bank Churners checkout",
    )
    def test_tracking_guard_rejects_an_extra_run(self):
        runner = load_runner()
        with tempfile.TemporaryDirectory(prefix="bank-churn-extra-") as directory:
            tracking_root = Path(directory)
            try:
                helper, _ = seed_valid_tracking_store(tracking_root)
                client = helper.make_mlflow_client(tracking_root)
                experiment = client.get_experiment_by_name("Default")
                extra = client.create_run(
                    experiment.experiment_id,
                    tags={"mlflow.runName": "unapproved_newer_run"},
                )
                client.set_terminated(extra.info.run_id, status="FINISHED")

                with self.assertRaisesRegex(RuntimeError, "exactly.*approved"):
                    runner.build_capture_environment(tracking_root)
            finally:
                dispose_mlflow_test_engines()

    @unittest.skipUnless(
        os.environ.get("BANK_CHURNERS_INTEGRATION") == "1",
        "requires the reviewed Bank Churners checkout",
    )
    def test_tracking_guard_rejects_a_tampered_metric(self):
        runner = load_runner()
        with tempfile.TemporaryDirectory(prefix="bank-churn-tampered-") as directory:
            tracking_root = Path(directory)
            try:
                helper, _ = seed_valid_tracking_store(tracking_root)
                client = helper.make_mlflow_client(tracking_root)
                experiment = client.get_experiment_by_name(helper.EXPERIMENT_NAME)
                runs = client.search_runs([experiment.experiment_id])
                target = next(
                    run
                    for run in runs
                    if run.data.tags.get("mlflow.runName")
                    == "hist_gradient_boosting"
                )
                client.log_metric(target.info.run_id, "accuracy", 0.123)

                with self.assertRaisesRegex(RuntimeError, "metric mismatch"):
                    runner.build_capture_environment(tracking_root)
            finally:
                dispose_mlflow_test_engines()

    @unittest.skipUnless(
        os.environ.get("BANK_CHURNERS_INTEGRATION") == "1",
        "requires the reviewed Bank Churners checkout",
    )
    def test_tracking_guard_rejects_a_deleted_approved_run(self):
        runner = load_runner()
        with tempfile.TemporaryDirectory(prefix="bank-churn-deleted-run-") as directory:
            tracking_root = Path(directory)
            try:
                helper, _ = seed_valid_tracking_store(tracking_root)
                client = helper.make_mlflow_client(tracking_root)
                experiment = client.get_experiment_by_name(helper.EXPERIMENT_NAME)
                runs = client.search_runs([experiment.experiment_id])
                client.delete_run(runs[0].info.run_id)

                with self.assertRaisesRegex(RuntimeError, "run lifecycle.*active"):
                    runner.build_capture_environment(tracking_root)
            finally:
                dispose_mlflow_test_engines()

    @unittest.skipUnless(
        os.environ.get("BANK_CHURNERS_INTEGRATION") == "1",
        "requires the reviewed Bank Churners checkout",
    )
    def test_tracking_guard_rejects_a_deleted_approved_experiment(self):
        runner = load_runner()
        with tempfile.TemporaryDirectory(
            prefix="bank-churn-deleted-experiment-"
        ) as directory:
            tracking_root = Path(directory)
            try:
                helper, _ = seed_valid_tracking_store(tracking_root)
                client = helper.make_mlflow_client(tracking_root)
                experiment = client.get_experiment_by_name(helper.EXPERIMENT_NAME)
                client.delete_experiment(experiment.experiment_id)

                with self.assertRaisesRegex(
                    RuntimeError,
                    "experiment lifecycle.*active",
                ):
                    runner.build_capture_environment(tracking_root)
            finally:
                dispose_mlflow_test_engines()


@unittest.skipUnless(
    os.environ.get("BANK_CHURNERS_INTEGRATION") == "1",
    "requires the reviewed Bank Churners checkout and seeded tracking store",
)
class LiveEvidenceViewTests(unittest.TestCase):
    def test_leaderboard_view_has_no_prediction_surface_or_conflicted_models(self):
        from streamlit.testing.v1 import AppTest

        previous_view = os.environ.get("BANK_CHURNERS_CAPTURE_VIEW")
        os.environ["BANK_CHURNERS_CAPTURE_VIEW"] = "leaderboard"
        try:
            app = AppTest.from_file(RUNNER_PATH, default_timeout=60).run()
        finally:
            if previous_view is None:
                os.environ.pop("BANK_CHURNERS_CAPTURE_VIEW", None)
            else:
                os.environ["BANK_CHURNERS_CAPTURE_VIEW"] = previous_view

        rendered_text = "\n".join(
            str(element.value)
            for collection in (app.title, app.info, app.markdown, app.caption)
            for element in collection
        )
        self.assertEqual(list(app.exception), [])
        self.assertEqual(len(list(app.dataframe)), 1)
        leaderboard = app.dataframe[0].value
        self.assertEqual(
            set(leaderboard["모델명(Model)"].tolist()),
            {"HistGradientBoosting", "LightGBM", "Logistic Regression"},
        )
        self.assertEqual(len(list(app.button)), 0)
        self.assertEqual(len(list(app.number_input)), 0)
        self.assertEqual(len(list(app.selectbox)), 0)
        self.assertEqual(len(list(app.slider)), 0)
        for forbidden_text in (
            "0.0%",
            "CHURN RISK STATUS",
            "최신 MLflow artifact로 예측합니다",
            "EasyEnsemble",
            "XGBoost",
        ):
            with self.subTest(text=forbidden_text):
                self.assertNotIn(forbidden_text, rendered_text)

    def test_eda_view_persists_on_two_consecutive_reruns(self):
        from streamlit.testing.v1 import AppTest

        previous_view = os.environ.get("BANK_CHURNERS_CAPTURE_VIEW")
        os.environ["BANK_CHURNERS_CAPTURE_VIEW"] = "eda"
        try:
            app = AppTest.from_file(RUNNER_PATH, default_timeout=60)
            app.run()
            first_result = (
                list(app.exception),
                [title.value for title in app.title],
                sum(
                    "고객 이탈 분석을 위한 주요 탐색적 데이터 분석" in item.value
                    for item in app.markdown
                ),
            )
            app.run()
            second_result = (
                list(app.exception),
                [title.value for title in app.title],
                sum(
                    "고객 이탈 분석을 위한 주요 탐색적 데이터 분석" in item.value
                    for item in app.markdown
                ),
            )
        finally:
            if previous_view is None:
                os.environ.pop("BANK_CHURNERS_CAPTURE_VIEW", None)
            else:
                os.environ["BANK_CHURNERS_CAPTURE_VIEW"] = previous_view

        for run_number, (exceptions, titles, intro_count) in enumerate(
            (first_result, second_result),
            start=1,
        ):
            with self.subTest(run=run_number):
                self.assertEqual(exceptions, [])
                self.assertEqual(
                    titles,
                    ["📊 Credit Card Customer EDA"],
                )
                self.assertEqual(intro_count, 1)

    def test_strategy_view_is_precomputed_and_has_no_prediction_surface(self):
        from streamlit.testing.v1 import AppTest

        previous_view = os.environ.get("BANK_CHURNERS_CAPTURE_VIEW")
        os.environ["BANK_CHURNERS_CAPTURE_VIEW"] = "strategy"
        try:
            app = AppTest.from_file(RUNNER_PATH, default_timeout=60).run()
        finally:
            if previous_view is None:
                os.environ.pop("BANK_CHURNERS_CAPTURE_VIEW", None)
            else:
                os.environ["BANK_CHURNERS_CAPTURE_VIEW"] = previous_view

        self.assertEqual(list(app.exception), [])
        self.assertTrue(any("Precomputed" in title.value for title in app.title))
        self.assertEqual(len(list(app.button)), 0)
        self.assertEqual(len(list(app.number_input)), 0)
        self.assertEqual(len(list(app.selectbox)), 0)


if __name__ == "__main__":
    unittest.main()
