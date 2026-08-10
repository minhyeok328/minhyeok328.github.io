# Project Demo Capture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run the five local team-project repositories with local data, capture trustworthy portfolio screenshots and short silent demos, and place reusable artifacts under the portfolio repository without exposing secrets or inflating API cost.

**Architecture:** Treat every repository as a separate runtime and keep its tracked source unchanged. Build ignored runtime state in place where the project requires it, generate demo data through reproducible helper scripts owned by this portfolio repository, drive the UI through the supported browser surface, and copy only reviewed media into `public/media/projects/<project-id>/`.

**Tech Stack:** PowerShell, Python 3.12, Streamlit, Django, Vite/React, SQLite, MySQL-compatible local service where unavoidable, Docker-compatible services where available, browser automation, PNG/WebM media.

## Global Constraints

- Never print, copy, commit, screenshot, or otherwise expose `.env` values, API keys, passwords, session cookies, or generated access keys.
- Keep all five external repositories' tracked source files unchanged. Runtime-only `.venv`, `node_modules`, SQLite DB, build output, and logs may be created when ignored by that repository.
- Prefer committed/precomputed data and mocked UI evidence before paid API calls.
- Maximum paid calls for the first capture pass: TCO 0, card churn 0, PICKLE 0, LG Home AI 0, HumouR 0. A later pass may use one rehearsed user query per AI app only if the zero-cost evidence is insufficient.
- Do not run crawlers, bulk embedding notebooks, full PICKLE 50-case evaluation, HumouR resume analysis, or LG manual-RAG ingestion during capture preparation.
- Do not claim a live app for a project when only an evaluation/report artifact could be reproduced; label that artifact as precomputed evidence.
- Default desktop capture is 1440x900. Default mobile capture is 390x844. Short demos are silent and normally 30-60 seconds. The independently reviewed HumouR assembly is an explicit 24-second exception; a longer HumouR cut may be up to 90 seconds.
- Do not commit generated assets until the user reviews them.

---

### Task 1: Create the capture workspace and manifest

**Files:**
- Create: `public/media/projects/humour/`
- Create: `public/media/projects/lg-home-ai/`
- Create: `public/media/projects/pickle/`
- Create: `public/media/projects/bank-churners/`
- Create: `public/media/projects/vehicle-tco/`
- Create: `docs/portfolio-evidence/project-capture-manifest.md`

**Interfaces:**
- Consumes: the five absolute repository paths supplied by the user.
- Produces: one stable output directory per existing portfolio project id and a manifest recording source, viewport, capture date, live/precomputed status, and known limitations.

- [x] **Step 1: Create the five output directories with neutral placeholder-free names.**
- [x] **Step 2: Record repository path, commit SHA, git cleanliness, and intended capture flow in the manifest without recording environment values.**
- [x] **Step 3: Verify `git status --short` in the portfolio only shows the new plan/manifest structure.**

### Task 2: Prepare and verify the HumouR runtime

**Files:**
- Runtime only: `<local-projects>\Final_project\backend\.venv\`
- Runtime only: `<local-projects>\Final_project\backend\db.sqlite3`
- Runtime only: `<local-projects>\Final_project\frontend\node_modules\`
- Create: `scripts/capture/seed_humour_demo.py`
- Create: `scripts/capture/test_seed_humour_demo.py`

**Interfaces:**
- Consumes: HumouR Django models and existing frontend Vite proxy contract.
- Produces: a local account, company, JD, checklist, resume, completed analysis report, and reusable browser session backed by SQLite; no AI call is required.

- [x] **Step 1: Create the backend venv with bundled Python 3.12.13 and install `backend/requirements.txt`.**
- [x] **Step 2: Run `npm.cmd ci` in `frontend/`.**
- [x] **Step 3: Run `manage.py check` and `manage.py migrate` using local SQLite.**
- [x] **Step 4: Add a seed helper that idempotently creates one demo account and related CompanyInfo, JobDescription, Checklist, Resume, and status=`done` AnalysisReport with interview questions.**
- [x] **Step 5: Execute the seed helper and verify one row exists for each demo domain without printing credentials or generated keys.**
- [x] **Step 6: Run frontend Vitest plus `node scripts/verify-backend-contract.mjs`.**
- [x] **Step 7: Start Django on `127.0.0.1:8000` and Vite on `127.0.0.1:5173`; verify `/api/ping/` and the login page.**

### Task 3: Capture HumouR evidence

**Files:**
- Create: `public/media/projects/humour/poster.png`
- Create: `public/media/projects/humour/dashboard.png`
- Create: `public/media/projects/humour/jd-checklist.png`
- Create: `public/media/projects/humour/resume.png`
- Create: `public/media/projects/humour/analysis-report.png`
- Create: `public/media/projects/humour/analysis-evidence.png`
- Create: `public/media/projects/humour/interview-questions.png`
- Create: `public/media/projects/humour/external-sharing.png`
- Create: `public/media/projects/humour/document-chat-mobile.png`
- Create when supported: `public/media/projects/humour/demo.webm`

**Interfaces:**
- Consumes: the verified local HumouR session and seeded report.
- Produces: source-faithful visual evidence for the portfolio flagship project.

- [x] **Step 1: Capture the dashboard with JD/resume/report counts at 1440x900.**
- [x] **Step 2: Capture the analysis report showing original evidence, grade/summary, and interview questions.**
- [x] **Step 3: Capture the document-chat widget at 390x844 without submitting a query, so no OpenAI call is made (final capture uses live local UI; the existing mocked QA path remains reserved for mocked evidence only).**
- [x] **Step 4: Record or assemble the flow `dashboard -> JD/checklist -> resume -> analysis report -> external/shared boundary` in at most 90 seconds.**
- [x] **Step 5: Inspect every source still plus representative decoded video frames for credentials, API keys, personal data, console overlays, broken images, and loading skeletons.**

### Task 4: Prepare and capture LG Home AI

**Files:**
- Runtime only: `<local-projects>\4th_project\db.sqlite3`
- Runtime only: `<local-projects>\4th_project\theme\static_src\node_modules\`
- Runtime only: `<local-projects>\4th_project\theme\static\css\dist\styles.css`
- Create: `scripts/capture/seed_lg_home_demo.py`
- Create: `scripts/capture/test_seed_lg_home_demo.py`
- Create: `public/media/projects/lg-home-ai/poster.png`
- Create: `public/media/projects/lg-home-ai/search-filter.png`
- Create: `public/media/projects/lg-home-ai/product-detail.png`
- Create: `public/media/projects/lg-home-ai/chat.png`
- Create when supported: `public/media/projects/lg-home-ai/demo.webm`

**Interfaces:**
- Consumes: the five product CSV groups totaling 847 products and the repository's Django models.
- Produces: local searchable product data, a demo user/favorite, and a no-cost 45-60 second UI flow.

- [x] **Step 1: Install `requirements.txt` into the existing Python 3.12 `project_env`, including the missing `django-tailwind` dependency through that manifest.**
- [x] **Step 2: Install/build Tailwind from `theme/static_src` and verify the generated stylesheet exists.**
- [x] **Step 3: Run migrations against a new SQLite DB.**
- [x] **Step 4: Add and run an idempotent seed helper that loads the repository CSVs without executing the destructive notebook against an existing database.**
- [x] **Step 5: Verify product counts `[234, 232, 191, 34, 156]`, then start Django at `127.0.0.1:8000`.**
- [x] **Step 6: Capture main/category, URL-preserved filters, product detail, favorite flow, and a pre-seeded or zero-cost chat view.**
- [x] **Step 7: Verify external product images have loaded before final capture; use a local poster crop if an external source is unavailable.**

### Task 5: Reconstruct the minimum PICKLE evidence runtime

**Files:**
- Runtime only: `<local-projects>\3rd_project\.venv\`
- Runtime only: `<local-projects>\3rd_project\database\sql\restaurant.db`
- Create: `scripts/capture/build_pickle_demo_db.py`
- Create: `scripts/capture/test_build_pickle_demo_db.py`
- Create: `public/media/projects/pickle/poster.png`
- Create: `public/media/projects/pickle/search-map.png`
- Create: `public/media/projects/pickle/restaurant-overview.png`
- Create: `public/media/projects/pickle/restaurant-detail.png`
- Create: `public/media/projects/pickle/evaluation.png`
- Create when supported: `public/media/projects/pickle/demo.webm`

**Interfaces:**
- Consumes: committed table-wise CSVs and precomputed `src_test3` JSON/HTML reports.
- Produces: a SQLite DB sufficient for fixed search/detail/map plus a clearly labelled precomputed evaluation capture; no bulk embedding or evaluation rerun.

- [x] **Step 1: Create a Python 3.12 venv and install `requirements.txt`.**
- [x] **Step 2: Implement a DB builder from the committed table-wise CSVs using the schema read from `db_setup.ipynb`, without calling OpenAI.**
- [x] **Step 3: Validate row counts for restaurants, menus, reviews, users, categories, tags, and relation tables.**
- [x] **Step 4: Start `main.py` on `127.0.0.1:8501` and exercise only the fixed search path.**
- [x] **Step 5: Capture first screen, a fixed search + Kakao map, and restaurant detail with menu/review evidence.** Final media uses the restaurant-name fixed query; the menu-name fixed path was verified separately against the same SQLite database and is not presented as a captured UI interaction.
- [x] **Step 6: Capture the existing final evaluation report showing 41/50, 82%, and target hit 96%, labelled as a precomputed internal evaluation.**
- [x] **Step 7: Skip AI chat unless a single rehearsed call is demonstrably needed after the zero-cost artifacts are reviewed.**

### Task 6: Prepare TCO Insight with a local MySQL-compatible service

**Files:**
- Runtime only: `<portfolio>\.superpowers\tco-runtime\mariadb-data\`
- Runtime only: `<portfolio>\.superpowers\tco-runtime\venv\`
- Create: `scripts/capture/load_tco_demo_data.py`
- Create: `scripts/capture/test_load_tco_demo_data.py`
- Create: `public/media/projects/vehicle-tco/poster.png`
- Create: `public/media/projects/vehicle-tco/search-result.png`
- Create: `public/media/projects/vehicle-tco/cost-result.png`
- Create when supported: `public/media/projects/vehicle-tco/demo.webm`

**Interfaces:**
- Consumes: `DBsetup.sql`, `car_oil.csv` (506 rows), `car_price.csv` (268 rows), and the Streamlit app's existing DB contract.
- Produces: a local `tco_system` DB and a no-network TCO calculation flow.

- [x] **Step 1: Provision a local MySQL-compatible service without exposing a reusable password.**
- [x] **Step 2: Create a Python 3.12 venv and install imports inferred from the repository: Streamlit, pandas, mysql connector, python-dotenv, requests, and BeautifulSoup.**
- [x] **Step 3: Apply `DBsetup.sql`, then use the capture-owned loader instead of the repository loader whose INSERT path calls `fetchall()` on non-result statements.**
- [x] **Step 4: Verify 506 fuel rows, 268 price rows, and maintenance parts are queryable.**
- [x] **Step 5: Run Streamlit on a free local port with `OPINET_API_KEY` unset so the documented fixed fuel-price fallback is used.**
- [x] **Step 6: Capture `아반떼` search, model detail, monthly driving inputs, editable maintenance table, and monthly/annual cost result.**
- [x] **Step 7: Record the hard-coded public-data key finding in the manifest without copying the key and recommend rotation.**

### Task 7: Recover the card-churn demo without changing tracked Compose

**Files:**
- Create if Docker becomes available: `scripts/capture/bank-churners.compose.override.yaml`
- Create: `scripts/capture/bank_churners_requirements.txt`
- Create: `scripts/capture/seed_bank_churners_demo.py`
- Create: `scripts/capture/test_seed_bank_churners_demo.py`
- Create: `scripts/capture/run_bank_churners_demo.py`
- Create: `scripts/capture/test_run_bank_churners_demo.py`
- Create: `public/media/projects/bank-churners/poster.png`
- Do not create from the reviewed revision: `public/media/projects/bank-churners/prediction.png`
- Create: `public/media/projects/bank-churners/strategy-report.png`
- Create: `public/media/projects/bank-churners/model-evidence.png`
- Create when supported: `public/media/projects/bank-churners/demo.webm`

**Interfaces:**
- Consumes: original Compose file, 10,127-row CSV, 19 model artifact directories, and local service endpoints.
- Produces: an explicitly labelled precomputed leaderboard, static strategy, and EDA-only evidence set when the missing original MLflow tracking database and unavailable Docker/WSL runtime prevent an honest live prediction flow. The capture wrapper never imports or renders the prediction page.

- [x] **Step 1: Prefer a local Docker-compatible runtime; if installation requires a reboot or unavailable system feature, do not block the other four projects.** Docker and WSL are unavailable on this host, so the zero-network precomputed-evidence fallback was selected without creating an override or starting services.
- [x] **Step 2: Supply an external Compose override that corrects the MLflow volume reference and service ordering without editing the repository file.** Resolved as not applicable to the selected precomputed fallback; no override was created.
- [x] **Step 3: Start MySQL and MLflow first, then pipeline health at `18000/health/z`, then Streamlit at `18501`.** Resolved as not applicable to the selected precomputed fallback; none of the original MySQL, MLflow-server, pipeline, or source-dashboard services was started. Only the guarded capture-owned Streamlit wrapper ran later on loopback ports 8503-8505.
- [x] **Step 4: Verify the experiment/run metadata required by the app exists. If not, document that tracked artifacts alone are insufficient and avoid fabricating a run.** The original tracking database is absent; a capture-owned SQLite store reconstructs only three exact, conflict-free committed/precomputed metric sets with provenance tags. Integrity requires the approved experiment and every run to remain lifecycle=`active`, and searches include deleted state. EasyEnsemble and XGBoost are omitted because their committed notebooks are invalid JSON with unresolved merge conflicts.
- [x] **Step 5: Before showing a probability, verify whether `predict_proba()[0][0]` corresponds to class 0 or the attrition class.** The committed mapping assigns Existing Customer=`0` and Attrited Customer=`1`; therefore `[0][0]` is the existing-customer probability, although the UI treats it as churn risk. The capture wrapper does not import or render the prediction page, and no inference was run.
- [x] **Step 6: Capture only the guarded precomputed leaderboard, static strategy evidence, and real EDA.** Captured three true 1440x900 PNGs and a 900-frame, 25 fps silent VP9 assembly from the guarded local wrapper (36.000 seconds by frame-count playback interval; final frame PTS 35.960 seconds). The wrapper explicitly invoked `render_eda_page()` on every rerun; a live same-tab reload retained the EDA title and intro exactly once with no input widgets. The final media contains no prediction inputs, probability/status/results, feature influence, income-report rendering, conflicted model names, or wording that implies a latest artifact was executed. Full 900-frame decode, clean boundary/final-frame review after lossless keyframe remediation, and exact server/port cleanup passed.

### Task 8: Media review and portfolio handoff

**Files:**
- Modify after review only: `src/data/portfolio.ts`
- Modify after review only: project detail media components/types if videos are approved.
- Update: `docs/portfolio-evidence/project-capture-manifest.md`

**Interfaces:**
- Consumes: all approved screenshots, posters, demos, and manifest limitations.
- Produces: web-safe media ready for portfolio integration.

- [x] **Step 1: Visually inspect all generated media at original resolution.** All 24 PNGs plus representative, boundary, and final decoded frames from all five WebMs passed independent whole-capture review.
- [x] **Step 2: Verify no media contains secrets, real personal information, terminal output, broken images, or misleading live/precomputed claims.** The final independent review found no Critical, Important, or remaining Minor findings.
- [x] **Step 3: Check file sizes and preserve readable text; prefer WebM plus PNG poster and do not recompress until quality is reviewed.** All 29 ledger rows match the final files, and the reviewed media remains unrecompressed after approval except for the explicitly remediated Bank Churners video.
- [x] **Step 4: Run portfolio lint, tests, and production build after any approved data/component integration.** The approved integration adds project periods, repository links, evidence facts, posters, gallery/video surfaces, accurate evidence labels, and responsive loading behavior. The portfolio test suite, lint, and production build passed after integration.
- [x] **Step 5: Present the artifact directory and manifest to the user before staging or committing.** The user reviewed and approved the mockup and final portfolio integration, then explicitly authorized a detailed split commit and push on 2026-08-10.
