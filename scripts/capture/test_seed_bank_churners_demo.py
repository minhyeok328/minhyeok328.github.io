import importlib.util
import json
import math
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch


HELPER_PATH = Path(__file__).with_name("seed_bank_churners_demo.py")
PORTFOLIO_ROOT = Path(__file__).resolve().parents[2]
SOURCE_PROJECT = Path(
    os.environ.get(
        "BANK_CHURNERS_SOURCE_ROOT",
        PORTFOLIO_ROOT.parent / "skn26_projects" / "2nd_project",
    )
)


def load_helper():
    if not HELPER_PATH.is_file():
        raise AssertionError("Bank Churners evidence seed helper has not been implemented.")
    spec = importlib.util.spec_from_file_location("seed_bank_churners_demo", HELPER_PATH)
    if spec is None or spec.loader is None:
        raise AssertionError("Could not load the Bank Churners evidence seed helper.")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def write_fixture_source(root: Path) -> None:
    hist_summary = (
        root
        / "mlflow"
        / "artifacts"
        / "1"
        / "3447f53a0f4245edb3186075bdfb70be"
        / "artifacts"
        / "best_model"
        / "best_model_summary.json"
    )
    hist_summary.parent.mkdir(parents=True)
    hist_summary.write_text(
        json.dumps(
            {
                "best_params": {"max_iter": 150},
                "metrics": {
                    "accuracy": 0.9721407624633431,
                    "precision": 0.9371069182389937,
                    "recall": 0.8895522388059701,
                    "f1_score": 0.9127105666156202,
                    "roc_auc": 0.9913064717325122,
                    "pr_auc": 0.9705881028160636,
                },
            }
        ),
        encoding="utf-8",
    )

    lightgbm_notebook = root / "notebooks" / "JoDongHwi" / "libght_gbm.ipynb"
    lightgbm_notebook.parent.mkdir(parents=True)
    lightgbm_notebook.write_text(
        json.dumps(
            {
                "cells": [
                    {
                        "cell_type": "code",
                        "outputs": [
                            {
                                "output_type": "stream",
                                "name": "stdout",
                                "text": [
                                    "accuracy     0.962854\n",
                                    "precision    0.850949\n",
                                    "recall       0.937313\n",
                                    "f1_score     0.892045\n",
                                    "roc_auc      0.989780\n",
                                    "pr_auc       0.968125\n",
                                ],
                            }
                        ],
                        "source": [],
                    }
                ],
                "metadata": {},
                "nbformat": 4,
                "nbformat_minor": 5,
            }
        ),
        encoding="utf-8",
    )

    easy_notebook = root / "notebooks" / "JeonJongHyeok" / "easy_ensemble.ipynb"
    easy_notebook.parent.mkdir(parents=True)
    easy_notebook.write_text(
        "<" * 7
        + """ Updated upstream
### BankChurner 모델 결과 ###
Accuracy : 0.94
ROC-AUC  : 0.97
PR-AUC   : 0.89
[Classification Report]
              precision    recall  f1-score   support
           0       0.95      0.99      0.97      1709
           1       0.92      0.72      0.81       337
    accuracy                           0.94      2046
"""
        + "=" * 7
        + "\n"
        + ">" * 7
        + " Stashed changes\n",
        encoding="utf-8",
    )

    logistic_notebook = (
        root / "notebooks" / "JeongYoungIl" / "logisticregression.ipynb"
    )
    logistic_notebook.parent.mkdir(parents=True)
    logistic_notebook.write_text(
        json.dumps(
            {
                "cells": [
                    {
                        "cell_type": "code",
                        "outputs": [
                            {
                                "output_type": "stream",
                                "name": "stdout",
                                "text": [
                                    "Logistic Regression Accuracy: "
                                    "0.8761105626850938\n"
                                ],
                            }
                        ],
                        "source": [],
                    }
                ],
                "metadata": {},
                "nbformat": 4,
                "nbformat_minor": 5,
            }
        ),
        encoding="utf-8",
    )

    xgboost_notebook = root / "notebooks" / "YounJeongYeon" / "XGBoost.ipynb"
    xgboost_notebook.parent.mkdir(parents=True)
    xgboost_notebook.write_text(
        "<" * 7
        + """ HEAD
정확도(Accuracy): 0.9714
"""
        + "=" * 7
        + """
정확도(Accuracy): 0.9704
"""
        + ">" * 7
        + " upstream/develop\n",
        encoding="utf-8",
    )


def dispose_mlflow_test_engines() -> None:
    """Release SQLite handles that MLflow caches across client instances."""
    from mlflow.store.tracking.sqlalchemy_store import SqlAlchemyStore

    with SqlAlchemyStore._engine_map_lock:
        for engine in SqlAlchemyStore._engine_map.values():
            engine.dispose()
        SqlAlchemyStore._engine_map.clear()


class MetricEvidenceTests(unittest.TestCase):
    def test_default_source_root_reads_the_capture_environment(self):
        with patch.dict(os.environ, {"BANK_CHURNERS_SOURCE_ROOT": "portable-bank-source"}):
            helper = load_helper()

        self.assertEqual(helper.DEFAULT_SOURCE_ROOT, Path("portable-bank-source"))

    def test_collects_only_unambiguous_committed_churn_metrics(self):
        helper = load_helper()
        with tempfile.TemporaryDirectory(prefix="bank-churn-source-") as directory:
            source_root = Path(directory)
            write_fixture_source(source_root)

            bundle = helper.collect_metric_evidence(source_root)

        by_name = {run.run_name: run for run in bundle.runs}
        self.assertEqual(
            set(by_name),
            {
                "hist_gradient_boosting",
                "lightgbm_baseline",
                "logistic_regression_baseline",
            },
        )
        self.assertEqual(
            by_name["hist_gradient_boosting"].metrics,
            {
                "accuracy": 0.9721407624633431,
                "precision": 0.9371069182389937,
                "recall": 0.8895522388059701,
                "f1_score": 0.9127105666156202,
                "roc_auc": 0.9913064717325122,
                "pr_auc": 0.9705881028160636,
            },
        )
        self.assertEqual(
            by_name["lightgbm_baseline"].metrics,
            {
                "accuracy": 0.962854,
                "precision": 0.850949,
                "recall": 0.937313,
                "f1_score": 0.892045,
                "roc_auc": 0.98978,
                "pr_auc": 0.968125,
            },
        )
        self.assertEqual(
            by_name["logistic_regression_baseline"].metrics,
            {"accuracy": 0.8761105626850938},
        )
        omissions = {omission.run_name: omission for omission in bundle.omissions}
        self.assertEqual(
            set(omissions),
            {"easy_ensemble_baseline", "xgboost_random_grid_search"},
        )
        self.assertIn("conflict", omissions["easy_ensemble_baseline"].reason.lower())
        self.assertIn(
            "conflicting",
            omissions["xgboost_random_grid_search"].reason.lower(),
        )

    def test_metric_validation_rejects_nonfinite_and_out_of_range_values(self):
        helper = load_helper()

        for invalid_value in (math.nan, math.inf, -0.01, 1.01):
            with self.subTest(invalid_value=invalid_value):
                with self.assertRaisesRegex(ValueError, "finite value between 0 and 1"):
                    helper.validate_metrics({"accuracy": invalid_value})

    def test_safe_summary_identifies_the_sqlite_tracking_backend(self):
        helper = load_helper()
        bundle = helper.EvidenceBundle(
            runs=(
                helper.RunEvidence(
                    run_name="lightgbm_baseline",
                    model_name="LightGBM",
                    source_file="notebooks/example.ipynb",
                    metrics={"accuracy": 0.9},
                ),
            ),
            omissions=(),
        )
        with tempfile.TemporaryDirectory(prefix="bank-churn-summary-") as directory:
            summary = helper.build_safe_summary(
                result={"created": 1, "reused": 0, "omitted": 0},
                bundle=bundle,
                tracking_root=Path(directory),
            )

        self.assertTrue(summary["tracking_uri"].startswith("sqlite:///"))


class SafetyGuardTests(unittest.TestCase):
    def test_tracking_store_inside_source_repository_is_rejected(self):
        helper = load_helper()
        with tempfile.TemporaryDirectory(prefix="bank-churn-guard-") as directory:
            source_root = Path(directory) / "source"
            source_root.mkdir()

            with self.assertRaisesRegex(ValueError, "outside the source repository"):
                helper.validate_tracking_root(
                    source_root,
                    source_root / "mlruns",
                )

    def test_commit_guard_rejects_a_different_source_revision(self):
        helper = load_helper()

        with self.assertRaisesRegex(RuntimeError, "source commit does not match"):
            helper.validate_source_commit("different", "expected")

    @unittest.skipUnless(
        os.environ.get("BANK_CHURNERS_INTEGRATION") == "1",
        "requires the reviewed Bank Churners checkout",
    )
    def test_reviewed_external_repo_passes_commit_and_cleanliness_guard(self):
        helper = load_helper()

        source_root, commit = helper.validate_source_repository(SOURCE_PROJECT)

        self.assertEqual(source_root, SOURCE_PROJECT.resolve())
        self.assertEqual(commit, helper.EXPECTED_SOURCE_COMMIT)


class SQLiteStoreIntegrationTests(unittest.TestCase):
    def test_extra_empty_experiment_is_rejected_without_mutating_seeded_runs(self):
        helper = load_helper()
        with tempfile.TemporaryDirectory(prefix="bank-churn-extra-experiment-") as directory:
            try:
                root = Path(directory)
                source_root = root / "source"
                source_root.mkdir()
                write_fixture_source(source_root)
                bundle = helper.collect_metric_evidence(source_root)
                tracking_root = root / "tracking"
                helper.seed_tracking_store(
                    bundle=bundle,
                    tracking_root=tracking_root,
                    source_commit="fixture-commit",
                )
                client = helper.make_mlflow_client(tracking_root)
                approved = client.get_experiment_by_name(helper.EXPERIMENT_NAME)
                before_run_ids = {
                    run.info.run_id
                    for run in client.search_runs([approved.experiment_id])
                }
                unrelated_id = client.create_experiment("unrelated-empty-experiment")
                client.set_experiment_tag(unrelated_id, "owner", "preserve-me")

                with self.assertRaisesRegex(RuntimeError, "existing state"):
                    helper.seed_tracking_store(
                        bundle=bundle,
                        tracking_root=tracking_root,
                        source_commit="fixture-commit",
                    )

                refreshed = helper.make_mlflow_client(tracking_root)
                unrelated = refreshed.get_experiment(unrelated_id)
                after_run_ids = {
                    run.info.run_id
                    for run in refreshed.search_runs([approved.experiment_id])
                }
            finally:
                dispose_mlflow_test_engines()

        self.assertEqual(unrelated.tags.get("owner"), "preserve-me")
        self.assertEqual(after_run_ids, before_run_ids)

    def test_unrelated_tracking_store_is_rejected_without_mutation(self):
        helper = load_helper()
        with tempfile.TemporaryDirectory(prefix="bank-churn-unrelated-") as directory:
            try:
                root = Path(directory)
                source_root = root / "source"
                source_root.mkdir()
                write_fixture_source(source_root)
                bundle = helper.collect_metric_evidence(source_root)
                tracking_root = root / "tracking"
                client = helper.make_mlflow_client(tracking_root)
                unrelated_id = client.create_experiment("unrelated-experiment")
                client.set_experiment_tag(unrelated_id, "owner", "preserve-me")

                with self.assertRaisesRegex(RuntimeError, "existing state"):
                    helper.seed_tracking_store(
                        bundle=bundle,
                        tracking_root=tracking_root,
                        source_commit="fixture-commit",
                    )

                refreshed = helper.make_mlflow_client(tracking_root)
                unrelated = refreshed.get_experiment(unrelated_id)
                approved = refreshed.get_experiment_by_name(helper.EXPERIMENT_NAME)
            finally:
                dispose_mlflow_test_engines()

        self.assertEqual(unrelated.tags.get("owner"), "preserve-me")
        self.assertIsNone(approved)

    def test_seeding_the_same_bundle_twice_reuses_exactly_three_runs(self):
        helper = load_helper()
        with tempfile.TemporaryDirectory(prefix="bank-churn-mlflow-") as directory:
            try:
                root = Path(directory)
                source_root = root / "source"
                source_root.mkdir()
                write_fixture_source(source_root)
                bundle = helper.collect_metric_evidence(source_root)
                tracking_root = root / "tracking"

                first = helper.seed_tracking_store(
                    bundle=bundle,
                    tracking_root=tracking_root,
                    source_commit="fixture-commit",
                )
                second = helper.seed_tracking_store(
                    bundle=bundle,
                    tracking_root=tracking_root,
                    source_commit="fixture-commit",
                )

                client = helper.make_mlflow_client(tracking_root)
                experiment = client.get_experiment_by_name(helper.EXPERIMENT_NAME)
                self.assertIsNotNone(experiment)
                runs = client.search_runs([experiment.experiment_id])

                self.assertTrue((tracking_root / "mlflow.db").is_file())
                self.assertTrue(
                    helper.get_tracking_uri(tracking_root).startswith("sqlite:///")
                )
            finally:
                dispose_mlflow_test_engines()

        self.assertEqual(first, {"created": 3, "reused": 0, "omitted": 2})
        self.assertEqual(second, {"created": 0, "reused": 3, "omitted": 2})
        self.assertEqual(len(runs), 3)
        self.assertTrue(
            all(run.data.tags[helper.EVIDENCE_MODE_TAG] == "precomputed" for run in runs)
        )


if __name__ == "__main__":
    unittest.main()
