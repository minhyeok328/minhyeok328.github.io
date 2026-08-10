#!/usr/bin/env python3
"""Render a guarded Bank Churners precomputed-evidence surface.

The capture wrapper deliberately exposes only the approved leaderboard,
static strategy guidance, and committed EDA. It never imports or renders the
source prediction page.
"""

from __future__ import annotations

import importlib
import os
from pathlib import Path
import sys
from typing import Mapping


PORTFOLIO_ROOT = Path(__file__).resolve().parents[2]
if str(PORTFOLIO_ROOT) not in sys.path:
    sys.path.insert(0, str(PORTFOLIO_ROOT))

from scripts.capture import seed_bank_churners_demo as evidence_seed


DEFAULT_SOURCE_ROOT = evidence_seed.DEFAULT_SOURCE_ROOT
DEFAULT_TRACKING_ROOT = Path(
    os.environ.get(
        "BANK_CHURNERS_TRACKING_ROOT",
        evidence_seed.DEFAULT_TRACKING_ROOT,
    )
)
EXPECTED_SOURCE_COMMIT = evidence_seed.EXPECTED_SOURCE_COMMIT
VIEW_ENV = "BANK_CHURNERS_CAPTURE_VIEW"
ALLOWED_VIEWS = ("leaderboard", "strategy", "eda")
DUMMY_PIPELINE_URL = "http://127.0.0.1:9"
APPROVED_MODEL_NAMES = {
    "HistGradientBoosting",
    "LightGBM",
    "Logistic Regression",
}


def validate_view(view: str) -> str:
    normalized = view.strip().lower()
    if normalized not in ALLOWED_VIEWS:
        raise ValueError("Evidence view must be one of: leaderboard, strategy, eda.")
    return normalized


def build_capture_environment(
    tracking_root: Path,
    source_root: Path = DEFAULT_SOURCE_ROOT,
) -> dict[str, str]:
    root = tracking_root.expanduser().resolve()
    evidence_source_root = source_root.expanduser().resolve()
    database_path = root / "mlflow.db"
    if not database_path.is_file():
        raise FileNotFoundError(
            "Local MLflow database is missing; run seed_bank_churners_demo.py first."
        )
    bundle = evidence_seed.collect_metric_evidence(evidence_source_root)
    evidence_seed.validate_tracking_store_integrity(
        bundle=bundle,
        tracking_root=root,
        source_commit=EXPECTED_SOURCE_COMMIT,
    )
    matplotlib_cache = root / "matplotlib"
    matplotlib_cache.mkdir(parents=True, exist_ok=True)
    return {
        "MLFLOW_TRACKING_URI": f"sqlite:///{database_path.as_posix()}",
        "PIPELINE_API_BASE_URL": DUMMY_PIPELINE_URL,
        "BANK_CHURNERS_EVIDENCE_MODE": "precomputed",
        "MPLCONFIGDIR": str(matplotlib_cache),
    }


def validate_source_ui(source_root: Path) -> Path:
    root = source_root.expanduser().resolve()
    evidence_seed.validate_source_repository(
        root,
        expected_commit=EXPECTED_SOURCE_COMMIT,
    )
    ui_root = root / "streamlit"
    required = (
        ui_root / "app.py",
        ui_root / "pages" / "eda.py",
        ui_root / "assets" / "eda" / "eda1.png",
        ui_root / "utils" / "data_loader.py",
    )
    missing = [str(path) for path in required if not path.is_file()]
    if missing:
        raise FileNotFoundError(
            "Bank Churners UI source is missing required files: " + ", ".join(missing)
        )
    return ui_root


def apply_environment(environment: Mapping[str, str]) -> None:
    for key, value in environment.items():
        os.environ[key] = value


def _load_approved_leaderboard():
    from utils.data_loader import get_leaderboard_data

    leaderboard = get_leaderboard_data()
    if leaderboard.empty:
        raise RuntimeError("Approved precomputed leaderboard is empty.")
    model_names = set(leaderboard["모델명(Model)"].tolist())
    if model_names != APPROVED_MODEL_NAMES:
        raise RuntimeError(
            "Rendered leaderboard models do not match the approved evidence set."
        )
    return leaderboard


def _render_leaderboard(st) -> None:
    leaderboard = _load_approved_leaderboard()
    st.title("Precomputed Model Leaderboard")
    st.caption(
        "커밋된 충돌 없는 결과만 로컬 SQLite 추적 저장소에서 재구성했습니다. "
        "실시간 학습·예측 결과가 아닙니다."
    )
    st.dataframe(leaderboard, width="stretch", hide_index=True)


def _render_strategy(st) -> None:
    from utils.data_loader import get_model_guides

    leaderboard = _load_approved_leaderboard()
    current_model = str(leaderboard.iloc[0]["모델명(Model)"])
    strength, weakness, recommendation = get_model_guides()[current_model]

    st.title("Precomputed Strategy Evidence")
    st.caption(
        "커밋된 정적 CRM 가이드를 승인된 사전 계산 리더보드의 최상위 모델과 "
        "연결해 표시합니다. 실시간 고객 분석은 수행하지 않습니다."
    )
    st.markdown(f"### {current_model} 정적 전략 가이드")
    st.markdown(f"- 강점: {strength}")
    st.markdown(f"- 보완점: {weakness}")
    st.markdown(f"- 추천: {recommendation}")


def render_capture_view(view: str, source_root: Path, tracking_root: Path) -> None:
    selected_view = validate_view(view)
    ui_root = validate_source_ui(source_root)
    environment = build_capture_environment(
        tracking_root,
        source_root=ui_root.parent,
    )
    apply_environment(environment)

    ui_root_text = str(ui_root)
    if ui_root_text not in sys.path:
        sys.path.insert(0, ui_root_text)

    import streamlit as st

    from common.config import PAGE_LAYOUT, PAGE_TITLE
    from common.styles import apply_global_styles

    st.set_page_config(page_title=f"{PAGE_TITLE} | Evidence", layout=PAGE_LAYOUT)
    apply_global_styles()
    st.info(
        "포트폴리오 사전 계산 증거 모드 · 유효하고 충돌 없는 커밋 증거로 "
        "검증된 리더보드, 정적 전략, EDA만 표시합니다. 예측 UI와 결과 영역은 "
        "이 재현 화면에 포함되지 않습니다."
    )

    if selected_view == "leaderboard":
        _render_leaderboard(st)
    elif selected_view == "strategy":
        _render_strategy(st)
    else:
        # The committed module renders as an import side effect. Contain and
        # clear that first-import output, then call its page function explicitly
        # on every Streamlit rerun. Its image paths are relative to /app.
        previous_directory = Path.cwd()
        try:
            os.chdir(ui_root)
            import_output = st.empty()
            with import_output.container():
                eda_page = importlib.import_module("pages.eda")
            import_output.empty()
            eda_page.render_eda_page()
        finally:
            os.chdir(previous_directory)

    st.caption("Evidence mode: precomputed · paid API calls: 0 · inference calls: 0")


def main() -> None:
    render_capture_view(
        view=os.getenv(VIEW_ENV, "leaderboard"),
        source_root=DEFAULT_SOURCE_ROOT,
        tracking_root=DEFAULT_TRACKING_ROOT,
    )


if __name__ == "__main__":
    main()
