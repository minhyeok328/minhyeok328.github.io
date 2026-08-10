#!/usr/bin/env python3
"""Rebuild a local, precomputed MLflow leaderboard for Bank Churners.

Only metrics already present in valid, conflict-free committed project
artifacts are restored. The helper does not load model pickle files, run
inference, call a pipeline, or use the network. EasyEnsemble and XGBoost churn
metrics are deliberately omitted because their committed notebooks contain
unresolved merge conflicts.
"""

from __future__ import annotations

import argparse
import json
import math
import os
from pathlib import Path
import re
import subprocess
from typing import Any, Mapping, NamedTuple, Sequence


PORTFOLIO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SOURCE_ROOT = Path(
    os.environ.get(
        "BANK_CHURNERS_SOURCE_ROOT",
        PORTFOLIO_ROOT.parent / "skn26_projects" / "2nd_project",
    )
)
DEFAULT_TRACKING_ROOT = (
    Path(__file__).resolve().parents[2]
    / ".superpowers"
    / "bank-churners-runtime"
    / "mlruns-v2"
)
EXPECTED_SOURCE_COMMIT = "a55aafc58e82fed9495682c7857af1e4e1ca955f"
EXPERIMENT_NAME = "ccrm_experiment"
SEED_ID = "bank-churners-precomputed-v2"
SEED_ID_TAG = "portfolio.capture.seed_id"
EVIDENCE_MODE_TAG = "portfolio.evidence_mode"
SOURCE_FILE_TAG = "portfolio.source_file"
SOURCE_COMMIT_TAG = "portfolio.source_commit"
RUN_NAME_TAG = "mlflow.runName"

ALLOWED_METRICS = {
    "accuracy",
    "precision",
    "recall",
    "f1_score",
    "roc_auc",
    "pr_auc",
}

HIST_SUMMARY = Path(
    "mlflow/artifacts/1/3447f53a0f4245edb3186075bdfb70be/"
    "artifacts/best_model/best_model_summary.json"
)
LIGHTGBM_NOTEBOOK = Path("notebooks/JoDongHwi/libght_gbm.ipynb")
EASY_ENSEMBLE_NOTEBOOK = Path("notebooks/JeonJongHyeok/easy_ensemble.ipynb")
LOGISTIC_NOTEBOOK = Path("notebooks/JeongYoungIl/logisticregression.ipynb")
XGBOOST_NOTEBOOK = Path("notebooks/YounJeongYeon/XGBoost.ipynb")


class RunEvidence(NamedTuple):
    run_name: str
    model_name: str
    source_file: str
    metrics: dict[str, float]


class OmittedEvidence(NamedTuple):
    run_name: str
    source_file: str
    reason: str


class EvidenceBundle(NamedTuple):
    runs: tuple[RunEvidence, ...]
    omissions: tuple[OmittedEvidence, ...]


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Restore a local MLflow leaderboard from committed, precomputed "
            "Bank Churners evidence. No inference or external service is used."
        )
    )
    parser.add_argument(
        "--source-root",
        type=Path,
        default=DEFAULT_SOURCE_ROOT,
        help="Path to the unchanged Bank Churners source repository.",
    )
    parser.add_argument(
        "--tracking-root",
        type=Path,
        default=DEFAULT_TRACKING_ROOT,
        help="Local MLflow file-store directory outside the source repository.",
    )
    return parser.parse_args(argv)


def validate_metrics(metrics: Mapping[str, float]) -> dict[str, float]:
    if not metrics:
        raise ValueError("At least one committed metric is required.")

    unknown = sorted(set(metrics) - ALLOWED_METRICS)
    if unknown:
        raise ValueError("Unsupported metric names: " + ", ".join(unknown))

    validated: dict[str, float] = {}
    for name, raw_value in metrics.items():
        value = float(raw_value)
        if not math.isfinite(value) or value < 0.0 or value > 1.0:
            raise ValueError(
                f"Metric {name!r} must be a finite value between 0 and 1."
            )
        validated[name] = value
    return validated


def _read_notebook_output_text(path: Path) -> str:
    try:
        notebook = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        raise ValueError(f"Notebook is not valid JSON: {path}") from error

    text_parts: list[str] = []
    for cell in notebook.get("cells", []):
        for output in cell.get("outputs", []):
            text = output.get("text")
            if isinstance(text, list):
                text_parts.extend(str(part) for part in text)
            elif isinstance(text, str):
                text_parts.append(text)

            plain_text = output.get("data", {}).get("text/plain")
            if isinstance(plain_text, list):
                text_parts.extend(str(part) for part in plain_text)
            elif isinstance(plain_text, str):
                text_parts.append(plain_text)
    return "".join(text_parts)


def _extract_required_metrics(text: str, metric_names: Sequence[str]) -> dict[str, float]:
    metrics: dict[str, float] = {}
    for name in metric_names:
        match = re.search(
            rf"(?m)^\s*{re.escape(name)}\s+([0-9]+(?:\.[0-9]+)?)\s*$",
            text,
        )
        if match is None:
            raise ValueError(f"Committed output is missing metric {name!r}.")
        metrics[name] = float(match.group(1))
    return validate_metrics(metrics)


def _collect_hist_gradient_boosting(source_root: Path) -> RunEvidence:
    path = source_root / HIST_SUMMARY
    payload = json.loads(path.read_text(encoding="utf-8"))
    metrics_payload = payload.get("metrics")
    if not isinstance(metrics_payload, dict):
        raise ValueError("HistGradientBoosting summary has no metrics object.")
    metric_names = (
        "accuracy",
        "precision",
        "recall",
        "f1_score",
        "roc_auc",
        "pr_auc",
    )
    missing = [name for name in metric_names if name not in metrics_payload]
    if missing:
        raise ValueError("HistGradientBoosting summary is missing: " + ", ".join(missing))
    return RunEvidence(
        run_name="hist_gradient_boosting",
        model_name="HistGradientBoosting",
        source_file=HIST_SUMMARY.as_posix(),
        metrics=validate_metrics({name: metrics_payload[name] for name in metric_names}),
    )


def _collect_lightgbm(source_root: Path) -> RunEvidence:
    text = _read_notebook_output_text(source_root / LIGHTGBM_NOTEBOOK)
    metrics = _extract_required_metrics(
        text,
        ("accuracy", "precision", "recall", "f1_score", "roc_auc", "pr_auc"),
    )
    return RunEvidence(
        run_name="lightgbm_baseline",
        model_name="LightGBM",
        source_file=LIGHTGBM_NOTEBOOK.as_posix(),
        metrics=metrics,
    )


def _easy_ensemble_omission(source_root: Path) -> OmittedEvidence:
    raw_text = (source_root / EASY_ENSEMBLE_NOTEBOOK).read_text(encoding="utf-8")
    conflict_markers = tuple(
        marker for marker in ("<<<<<<<", "=======", ">>>>>>>") if marker in raw_text
    )
    if len(conflict_markers) == 3:
        reason = (
            "The committed EasyEnsemble notebook is invalid JSON with unresolved "
            "merge conflicts across code and result cells, so its displayed metrics "
            "are excluded."
        )
    else:
        reason = (
            "No canonical conflict-free EasyEnsemble notebook is committed, so no "
            "leaderboard run is reconstructed."
        )
    return OmittedEvidence(
        run_name="easy_ensemble_baseline",
        source_file=EASY_ENSEMBLE_NOTEBOOK.as_posix(),
        reason=reason,
    )


def _collect_logistic_regression(source_root: Path) -> RunEvidence:
    text = _read_notebook_output_text(source_root / LOGISTIC_NOTEBOOK)
    match = re.search(
        r"Logistic Regression Accuracy:\s*([0-9]+(?:\.[0-9]+)?)",
        text,
    )
    if match is None:
        raise ValueError("Logistic Regression committed accuracy was not found.")
    return RunEvidence(
        run_name="logistic_regression_baseline",
        model_name="Logistic Regression",
        source_file=LOGISTIC_NOTEBOOK.as_posix(),
        metrics=validate_metrics({"accuracy": float(match.group(1))}),
    )


def _xgboost_omission(source_root: Path) -> OmittedEvidence:
    raw_text = (source_root / XGBOOST_NOTEBOOK).read_text(encoding="utf-8")
    has_conflicts = all(
        marker in raw_text for marker in ("<<<<<<<", "=======", ">>>>>>>")
    )
    accuracy_values = set(
        re.findall(r"정확도\(Accuracy\):\s*([0-9]+(?:\.[0-9]+)?)", raw_text)
    )
    if not has_conflicts or len(accuracy_values) < 2:
        reason = (
            "No canonical full metric set is committed for the XGBoost churn run; "
            "the run is excluded rather than inferred."
        )
    else:
        reason = (
            "Conflicting committed XGBoost notebook outputs contain multiple accuracy "
            "values, so no churn leaderboard run is reconstructed."
        )
    return OmittedEvidence(
        run_name="xgboost_random_grid_search",
        source_file=XGBOOST_NOTEBOOK.as_posix(),
        reason=reason,
    )


def collect_metric_evidence(source_root: Path) -> EvidenceBundle:
    root = source_root.expanduser().resolve()
    required = (
        HIST_SUMMARY,
        LIGHTGBM_NOTEBOOK,
        EASY_ENSEMBLE_NOTEBOOK,
        LOGISTIC_NOTEBOOK,
        XGBOOST_NOTEBOOK,
    )
    missing = [path.as_posix() for path in required if not (root / path).is_file()]
    if missing:
        raise FileNotFoundError("Required committed evidence is missing: " + ", ".join(missing))

    runs = (
        _collect_hist_gradient_boosting(root),
        _collect_lightgbm(root),
        _collect_logistic_regression(root),
    )
    return EvidenceBundle(
        runs=runs,
        omissions=(
            _easy_ensemble_omission(root),
            _xgboost_omission(root),
        ),
    )


def validate_tracking_root(source_root: Path, tracking_root: Path) -> Path:
    source = source_root.expanduser().resolve()
    tracking = tracking_root.expanduser().resolve()
    if tracking == source or tracking.is_relative_to(source):
        raise ValueError("Tracking root must be outside the source repository.")
    if tracking == Path(tracking.anchor):
        raise ValueError("Refusing to use a filesystem root as the tracking store.")
    return tracking


def validate_source_commit(actual: str, expected: str) -> None:
    if actual.strip() != expected.strip():
        raise RuntimeError(
            "Bank Churners source commit does not match the reviewed revision: "
            f"expected {expected}, got {actual}."
        )


def _git_output(source_root: Path, *args: str) -> str:
    safe_directory = source_root.resolve().as_posix()
    completed = subprocess.run(
        [
            "git",
            "-c",
            f"safe.directory={safe_directory}",
            "-C",
            str(source_root),
            *args,
        ],
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    return completed.stdout.strip()


def validate_source_repository(
    source_root: Path,
    expected_commit: str = EXPECTED_SOURCE_COMMIT,
) -> tuple[Path, str]:
    root = source_root.expanduser().resolve()
    required = (
        root / "README.md",
        root / "model_evaluation.md",
        root / "streamlit" / "app.py",
        root / "streamlit" / "assets" / "eda" / "eda1.png",
    )
    missing = [str(path) for path in required if not path.is_file()]
    if missing:
        raise FileNotFoundError(
            "Bank Churners source root is missing required files: " + ", ".join(missing)
        )

    commit = _git_output(root, "rev-parse", "HEAD")
    validate_source_commit(commit, expected_commit)
    status = _git_output(
        root,
        "status",
        "--porcelain=v1",
        "--untracked-files=all",
    )
    if status:
        raise RuntimeError("Bank Churners source working tree must remain clean.")
    return root, commit


def get_tracking_uri(tracking_root: Path) -> str:
    tracking_root.mkdir(parents=True, exist_ok=True)
    database_path = (tracking_root.resolve() / "mlflow.db").as_posix()
    return f"sqlite:///{database_path}"


def make_mlflow_client(tracking_root: Path):
    import mlflow
    from mlflow.tracking import MlflowClient

    uri = get_tracking_uri(tracking_root)
    mlflow.set_tracking_uri(uri)
    return MlflowClient(tracking_uri=uri)


def _omission_tag(run_name: str) -> str:
    return f"portfolio.omitted.{run_name}"


def _verify_existing_run(run: Any, evidence: RunEvidence, source_commit: str) -> None:
    if run.info.lifecycle_stage != "active":
        raise RuntimeError(
            f"Approved run lifecycle must be active: {evidence.run_name}"
        )
    if run.info.status != "FINISHED":
        raise RuntimeError(f"Existing seeded run is not FINISHED: {evidence.run_name}")
    expected_tags = {
        SEED_ID_TAG: SEED_ID,
        EVIDENCE_MODE_TAG: "precomputed",
        SOURCE_FILE_TAG: evidence.source_file,
        SOURCE_COMMIT_TAG: source_commit,
        RUN_NAME_TAG: evidence.run_name,
    }
    for key, expected in expected_tags.items():
        if run.data.tags.get(key) != expected:
            raise RuntimeError(
                f"Existing seeded run tag mismatch for {evidence.run_name}: {key}"
            )
    if run.data.params.get("model_name") != evidence.model_name:
        raise RuntimeError(f"Existing seeded model name mismatch: {evidence.run_name}")
    if set(run.data.metrics) != set(evidence.metrics):
        raise RuntimeError(f"Existing seeded metric keys mismatch: {evidence.run_name}")
    for name, expected in evidence.metrics.items():
        if not math.isclose(run.data.metrics[name], expected, rel_tol=0.0, abs_tol=1e-12):
            raise RuntimeError(
                f"Existing seeded metric mismatch for {evidence.run_name}: {name}"
            )


def validate_tracking_store_integrity(
    *,
    bundle: EvidenceBundle,
    tracking_root: Path,
    source_commit: str,
) -> None:
    from mlflow.entities import ViewType

    client = make_mlflow_client(tracking_root)
    experiment = client.get_experiment_by_name(EXPERIMENT_NAME)
    if experiment is None:
        raise RuntimeError("Approved precomputed MLflow experiment is missing.")
    if experiment.lifecycle_stage != "active":
        raise RuntimeError("Approved experiment lifecycle must be active.")
    if experiment.tags.get(SEED_ID_TAG) != SEED_ID:
        raise RuntimeError("MLflow experiment seed tag does not match the approved seed.")
    if experiment.tags.get(EVIDENCE_MODE_TAG) != "precomputed":
        raise RuntimeError("MLflow experiment evidence-mode tag is not precomputed.")
    for omission in bundle.omissions:
        if experiment.tags.get(_omission_tag(omission.run_name)) != omission.reason:
            raise RuntimeError(
                f"MLflow omission tag mismatch: {omission.run_name}"
            )

    experiments = client.search_experiments(
        view_type=ViewType.ALL,
        max_results=1000,
    )
    experiments_by_name = {item.name: item for item in experiments}
    expected_experiment_names = {"Default", EXPERIMENT_NAME}
    if set(experiments_by_name) != expected_experiment_names:
        raise RuntimeError(
            "MLflow tracking store experiment set does not match the approved capture set."
        )
    if experiments_by_name["Default"].lifecycle_stage != "active":
        raise RuntimeError("Default MLflow experiment lifecycle must be active.")
    runs = client.search_runs(
        experiment_ids=[item.experiment_id for item in experiments],
        run_view_type=ViewType.ALL,
        max_results=1000,
    )
    expected_by_name = {evidence.run_name: evidence for evidence in bundle.runs}
    if len(runs) != len(expected_by_name):
        raise RuntimeError(
            "MLflow tracking store must contain exactly "
            f"{len(expected_by_name)} approved seeded runs; found {len(runs)}."
        )

    actual_by_name: dict[str, list[Any]] = {}
    for run in runs:
        run_name = run.data.tags.get(RUN_NAME_TAG, "")
        actual_by_name.setdefault(run_name, []).append(run)
    if set(actual_by_name) != set(expected_by_name):
        raise RuntimeError(
            "MLflow tracking store run names do not match the approved seeded runs."
        )

    for run_name, evidence in expected_by_name.items():
        matching = actual_by_name[run_name]
        if len(matching) != 1:
            raise RuntimeError(f"Duplicate seeded runs found: {run_name}")
        _verify_existing_run(matching[0], evidence, source_commit)


def seed_tracking_store(
    *,
    bundle: EvidenceBundle,
    tracking_root: Path,
    source_commit: str,
) -> dict[str, int]:
    resolved_tracking_root = tracking_root.expanduser().resolve()
    database_path = resolved_tracking_root / "mlflow.db"
    if resolved_tracking_root.exists():
        existing_entries = tuple(resolved_tracking_root.iterdir())
        if existing_entries and not database_path.is_file():
            raise RuntimeError(
                "MLflow existing state is not an approved capture store; "
                "refusing to mutate it."
            )

    client = make_mlflow_client(tracking_root)
    from mlflow.entities import ViewType

    experiments = client.search_experiments(
        view_type=ViewType.ALL,
        max_results=1000,
    )
    existing_runs = client.search_runs(
        experiment_ids=[item.experiment_id for item in experiments],
        run_view_type=ViewType.ALL,
        max_results=1000,
    )
    non_default_experiments = [
        item for item in experiments if item.name != "Default"
    ]
    if non_default_experiments or existing_runs:
        try:
            validate_tracking_store_integrity(
                bundle=bundle,
                tracking_root=tracking_root,
                source_commit=source_commit,
            )
        except RuntimeError as error:
            raise RuntimeError(
                "MLflow existing state is not the exact approved capture store; "
                "refusing to mutate it."
            ) from error
        return {
            "created": 0,
            "reused": len(bundle.runs),
            "omitted": len(bundle.omissions),
        }

    experiment = client.get_experiment_by_name(EXPERIMENT_NAME)
    if experiment is None:
        experiment_id = client.create_experiment(
            EXPERIMENT_NAME,
            artifact_location=(tracking_root.resolve() / "artifacts").as_uri(),
        )
    else:
        experiment_id = experiment.experiment_id

    client.set_experiment_tag(experiment_id, EVIDENCE_MODE_TAG, "precomputed")
    client.set_experiment_tag(experiment_id, SEED_ID_TAG, SEED_ID)
    for omission in bundle.omissions:
        client.set_experiment_tag(
            experiment_id,
            _omission_tag(omission.run_name),
            omission.reason,
        )

    existing_runs = client.search_runs(
        experiment_ids=[experiment_id],
        max_results=1000,
    )
    seeded_by_name: dict[str, list[Any]] = {}
    for run in existing_runs:
        if run.data.tags.get(SEED_ID_TAG) != SEED_ID:
            continue
        run_name = run.data.tags.get(RUN_NAME_TAG, "")
        seeded_by_name.setdefault(run_name, []).append(run)

    created = 0
    reused = 0
    for evidence in bundle.runs:
        matching = seeded_by_name.get(evidence.run_name, [])
        if len(matching) > 1:
            raise RuntimeError(f"Duplicate seeded runs found: {evidence.run_name}")
        if matching:
            _verify_existing_run(matching[0], evidence, source_commit)
            reused += 1
            continue

        tags = {
            RUN_NAME_TAG: evidence.run_name,
            SEED_ID_TAG: SEED_ID,
            EVIDENCE_MODE_TAG: "precomputed",
            SOURCE_FILE_TAG: evidence.source_file,
            SOURCE_COMMIT_TAG: source_commit,
        }
        created_run = client.create_run(experiment_id=experiment_id, tags=tags)
        run_id = created_run.info.run_id
        try:
            client.log_param(run_id, "model_name", evidence.model_name)
            for metric_name, metric_value in evidence.metrics.items():
                client.log_metric(run_id, metric_name, metric_value)
            client.set_terminated(run_id, status="FINISHED")
        except Exception:
            client.set_terminated(run_id, status="FAILED")
            raise
        created += 1

    result = {
        "created": created,
        "reused": reused,
        "omitted": len(bundle.omissions),
    }
    validate_tracking_store_integrity(
        bundle=bundle,
        tracking_root=tracking_root,
        source_commit=source_commit,
    )
    return result


def build_safe_summary(
    *,
    result: Mapping[str, int],
    bundle: EvidenceBundle,
    tracking_root: Path,
) -> dict[str, Any]:
    return {
        **result,
        "evidence_mode": "precomputed",
        "experiment": EXPERIMENT_NAME,
        "tracking_uri": get_tracking_uri(tracking_root),
        "included_runs": [run.run_name for run in bundle.runs],
        "omissions": [omission._asdict() for omission in bundle.omissions],
        "paid_api_calls": 0,
        "model_inference_calls": 0,
    }


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    source_root, source_commit = validate_source_repository(args.source_root)
    tracking_root = validate_tracking_root(source_root, args.tracking_root)
    bundle = collect_metric_evidence(source_root)
    result = seed_tracking_store(
        bundle=bundle,
        tracking_root=tracking_root,
        source_commit=source_commit,
    )
    safe_summary = build_safe_summary(
        result=result,
        bundle=bundle,
        tracking_root=tracking_root,
    )
    print(json.dumps(safe_summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
