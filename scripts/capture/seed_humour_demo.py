#!/usr/bin/env python3
"""Seed deterministic, synthetic HumouR data without calling external services."""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import sys
from typing import Any, Sequence


DEFAULT_BACKEND_ROOT = Path("backend")
DEFAULT_USERNAME = "portfolio-demo-humour"
DEMO_USERNAME_PREFIX = "portfolio-demo-"
DEMO_JOB_NAME = "AI 서비스 백엔드 엔지니어"
DEMO_RESUME_NAME = "데모 지원자"
DEMO_REPORT_VERSION = "portfolio-demo-v1"
DEMO_REVIEWED_AT = datetime(2026, 8, 10, 0, 0, tzinfo=timezone.utc)
DEMO_CREDIT = 500
DEMO_SUBSCRIPTION_EXPIRATION = datetime(2030, 8, 10, 0, 0, tzinfo=timezone.utc)


def configured_backend_root() -> Path:
    return Path(os.environ.get("HUMOUR_BACKEND_ROOT", str(DEFAULT_BACKEND_ROOT)))


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Create or refresh one synthetic HumouR demo dataset in local SQLite. "
            "The helper never creates an AuthKey or prints credentials."
        )
    )
    parser.add_argument(
        "--backend-root",
        type=Path,
        default=configured_backend_root(),
        help=(
            "Path containing HumouR manage.py (defaults to HUMOUR_BACKEND_ROOT "
            "or ./backend)."
        ),
    )
    parser.add_argument(
        "--username",
        default=DEFAULT_USERNAME,
        help=f"Synthetic account name; must start with {DEMO_USERNAME_PREFIX!r}.",
    )
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument(
        "--reset",
        action="store_true",
        help="Delete only the named synthetic account and its cascading demo data.",
    )
    mode.add_argument(
        "--require-existing-account",
        action="store_true",
        help=(
            "Seed related demo data only when the account already exists, preserving "
            "the password established through the browser signup flow."
        ),
    )
    return parser.parse_args(argv)


def validate_demo_username(username: str) -> str:
    normalized = username.strip()
    if not normalized.startswith(DEMO_USERNAME_PREFIX) or normalized == DEMO_USERNAME_PREFIX:
        raise ValueError(
            f"Username must use the synthetic demo prefix {DEMO_USERNAME_PREFIX!r}."
        )
    return normalized


def build_demo_records() -> dict[str, Any]:
    checklist_contents = [
        "Python과 Django 기반 REST API를 설계하고 운영한 경험",
        "관계형 데이터베이스 모델링과 쿼리 최적화 경험",
        "React 프론트엔드 팀과 API 계약을 협업한 경험",
        "테스트 자동화와 코드 리뷰를 통한 품질 관리 경험",
        "AI 기능의 비용·보안·실패 상황을 고려한 서비스 운영 경험",
    ]

    return {
        "company": {
            "company_name": "데모랩",
            "employee_count": 48,
            "team_composition": ["백엔드 5명", "프론트엔드 4명", "AI 3명", "제품 2명"],
            "company_description": (
                "데모랩은 반복 업무를 줄이는 B2B AI 협업 도구를 만드는 합성 데모 기업입니다. "
                "고객 데이터 보호와 검증 가능한 제품 품질을 중요하게 생각합니다."
            ),
            "employ_style": ["근거 중심 의사소통", "작은 단위의 빠른 실험", "문서화와 동료 리뷰"],
        },
        "job": {
            "job_name": DEMO_JOB_NAME,
            "education_level": "학사 이상 또는 동등한 실무 역량",
            "major": "컴퓨터공학 또는 관련 전공",
            "career_level": "경력 2~5년",
            "required_skill": ["Python", "Django", "REST API", "SQL", "Git"],
            "preferred_skill": ["React", "Docker", "AWS", "LLM 애플리케이션 운영"],
            "main_task": (
                "채용 보조 서비스의 Django API와 데이터 모델을 설계하고, 프론트엔드 팀과 "
                "안정적인 API 계약을 운영합니다. 테스트와 관측 지표를 바탕으로 품질을 개선합니다."
            ),
            "hiring_reason": "고객사 확대에 맞춰 핵심 백엔드와 AI 연동 경계를 안정화하기 위한 충원입니다.",
            "work_type": "정규직 · 하이브리드",
            "status": "on_going",
            "checklist_status": "done",
        },
        "checklists": checklist_contents,
        "resume": {
            "name": DEMO_RESUME_NAME,
            "skill": ["Python", "Django", "PostgreSQL", "React", "Docker", "Pytest"],
            "education_level": {
                "final_degree": "bachelor",
                "bachelor": "가상대학교 소프트웨어학부",
                "master": "",
                "doctoral": "",
            },
            "experience": [
                {
                    "company_name": "샘플테크",
                    "length": "2년 8개월",
                    "position": "백엔드 엔지니어",
                    "experience_description": (
                        "Django 기반 업무 자동화 API를 설계하고 쿼리 개선으로 주요 목록 응답 시간을 "
                        "약 40% 단축했습니다."
                    ),
                },
                {
                    "company_name": "프로젝트 스튜디오",
                    "length": "10개월",
                    "position": "소프트웨어 엔지니어",
                    "experience_description": (
                        "React 팀과 OpenAPI 계약을 정리하고 회귀 테스트를 도입해 배포 전 오류를 줄였습니다."
                    ),
                },
            ],
            "self_intoduction": [
                {
                    "question": "지원 동기와 입사 후 기여하고 싶은 점을 설명해 주세요.",
                    "answer": (
                        "사용자의 반복 업무를 줄이는 제품을 안정적으로 운영해 온 경험을 바탕으로, "
                        "데모랩의 채용 보조 서비스가 신뢰할 수 있는 판단 근거를 제공하도록 기여하고 싶습니다."
                    ),
                },
                {
                    "question": "가장 의미 있었던 문제 해결 경험을 설명해 주세요.",
                    "answer": (
                        "느린 목록 API를 측정 가능한 쿼리 단위로 나누고 인덱스와 조회 전략을 개선했습니다. "
                        "변경 전후 성능을 테스트로 남겨 팀이 동일한 기준으로 검토할 수 있게 했습니다."
                    ),
                },
            ],
            "certification": ["SQL 개발자 자격(샘플)", "클라우드 기초 인증(샘플)"],
            "language": [
                {"language_name": "영어", "test_name": "업무 회화", "score": "중상"},
            ],
            "award": [
                {"award_name": "사내 개선 제안 우수상(샘플)", "award_from": "샘플테크", "time": "2025"},
            ],
            "training": [
                {
                    "education_name": "AI 서비스 엔지니어링 과정",
                    "education_from": "가상 교육기관",
                    "education_description": "검색 증강 생성, 평가, 개인정보 보호를 포함한 팀 프로젝트 수행",
                    "start": "2024-03",
                    "end": "2024-08",
                },
            ],
            "other_activity": [
                {
                    "activity_name": "개발 문서 개선 모임",
                    "activity_description": "신규 참여자를 위한 API 실행 및 장애 대응 문서를 정리했습니다.",
                    "start": "2025-01",
                    "end": "2025-12",
                },
            ],
            "reviewed": True,
        },
        "report": {
            "version": DEMO_REPORT_VERSION,
            "user_feedback": 5,
            "review_text": "데모 검토용 합성 리포트입니다.",
            "overall_grade": "A",
            "overall_summary": (
                "필수 백엔드 역량과 협업 경험이 고르게 확인되며, 서비스 품질을 수치와 테스트로 "
                "관리한 경험이 돋보입니다."
            ),
            "candidate_summary": (
                "Django API 개발, SQL 최적화, 프론트엔드 협업 경험을 갖춘 합성 지원자입니다. "
                "AI 기능 운영 경험은 면접에서 구체적인 장애 대응 사례를 추가로 확인할 필요가 있습니다."
            ),
            "checklist": [
                {"content": checklist_contents[0], "result": True},
                {"content": checklist_contents[1], "result": True},
                {"content": checklist_contents[2], "result": True},
                {"content": checklist_contents[3], "result": True},
                {"content": checklist_contents[4], "result": False},
            ],
            "competency_analysis": [
                "Django ORM과 REST API 설계 경험을 프로젝트 성과와 함께 설명했습니다.",
                "응답 시간 개선을 측정하고 회귀 테스트로 유지한 점에서 문제 해결 과정이 구체적입니다.",
                "프론트엔드 팀과 API 계약을 문서화한 경험이 협업 환경에 적합합니다.",
            ],
            "fit_analysis": (
                "핵심 기술 스택과 실무 방식이 JD에 높은 수준으로 부합합니다.\n"
                "작은 단위의 개선과 문서화를 선호해 데모랩의 협업 문화와도 잘 맞습니다."
            ),
            "motive": (
                "반복 업무를 줄이는 B2B 제품에 대한 관심과 백엔드 안정성 개선 경험을 연결해 "
                "지원 동기를 설명했습니다."
            ),
            "collaboration": (
                "API 계약과 성능 기준을 문서로 공유하고 변경 전후 결과를 동료 리뷰에 제시한 경험이 있습니다."
            ),
            "strength": [
                "문제를 측정 가능한 지표로 정의하고 개선 결과를 검증합니다.",
                "백엔드와 프론트엔드 사이의 API 계약을 명확히 관리합니다.",
                "테스트와 문서화를 개발 완료 기준에 포함합니다.",
            ],
            "concern": [
                "대규모 트래픽 환경의 운영 범위는 제출 자료만으로 충분히 확인되지 않습니다.",
                "LLM 비용 및 품질 평가 경험의 깊이는 면접에서 추가 확인이 필요합니다.",
            ],
            "check_point": [
                "성능 개선에서 본인이 직접 내린 기술적 판단과 대안을 질문합니다.",
                "외부 AI 서비스 장애 시 폴백과 사용자 안내 방식을 확인합니다.",
                "API 계약 변경을 팀에 전파하고 호환성을 지킨 사례를 확인합니다.",
            ],
            "interview_question": [
                {
                    "question": "목록 API 응답 시간을 개선할 때 병목을 어떻게 확인했고 어떤 대안을 비교했나요?",
                    "answer": (
                        "쿼리 수와 실행 계획을 먼저 측정하고, 인덱스 추가와 조회 구조 변경을 비교한 뒤 "
                        "회귀 테스트로 개선 효과를 검증했다고 설명하는 답변을 기대합니다."
                    ),
                    "purpose": "성과 수치 뒤의 문제 정의와 기술적 의사결정 과정을 확인합니다.",
                },
                {
                    "question": "프론트엔드와 API 계약이 충돌했을 때 어떻게 조율했나요?",
                    "answer": (
                        "사용 시나리오와 호환성 범위를 합의하고, 계약 테스트와 단계적 배포로 위험을 줄인 "
                        "구체 사례를 기대합니다."
                    ),
                    "purpose": "직군 간 협업과 변경 관리 역량을 확인합니다.",
                },
                {
                    "question": "외부 AI API가 느리거나 실패할 때 사용자 경험을 어떻게 보호하겠습니까?",
                    "answer": (
                        "타임아웃, 재시도 제한, 비동기 처리, 상태 표시, 안전한 폴백과 비용 상한을 함께 "
                        "설계하는 답변을 기대합니다."
                    ),
                    "purpose": "AI 기능을 실제 서비스로 운영하는 관점을 확인합니다.",
                },
                {
                    "question": "테스트 자동화의 우선순위를 정하는 기준은 무엇인가요?",
                    "answer": (
                        "사용자 영향, 변경 빈도, 실패 비용이 높은 경계부터 계약·통합 테스트를 배치하고 "
                        "핵심 로직은 단위 테스트로 보완한다고 설명하는 답변을 기대합니다."
                    ),
                    "purpose": "품질 전략과 현실적인 우선순위 판단을 확인합니다.",
                },
                {
                    "question": "입사 후 첫 90일 동안 가장 먼저 파악하고 싶은 것은 무엇인가요?",
                    "answer": (
                        "제품의 핵심 사용자 흐름, 장애 이력, 데이터 민감도, 배포·관측 체계를 파악한 뒤 "
                        "작은 개선을 제안하는 답변을 기대합니다."
                    ),
                    "purpose": "온보딩 접근법과 제품 중심 사고를 확인합니다.",
                },
            ],
            "final_comment": (
                "핵심 직무 역량과 협업 방식이 명확해 다음 면접 단계 진행을 권장합니다. "
                "면접에서는 AI 서비스 운영 범위와 대규모 트래픽 경험을 근거 중심으로 확인하세요."
            ),
            "status": "done",
        },
    }


def assert_local_sqlite_database(backend_root: Path, database: dict[str, Any]) -> None:
    expected_name = (backend_root / "db.sqlite3").resolve()
    configured_name = Path(database.get("NAME", "")).expanduser().resolve()
    if (
        database.get("ENGINE") != "django.db.backends.sqlite3"
        or configured_name != expected_name
    ):
        raise RuntimeError("Refusing to seed outside the expected local SQLite database.")


def bootstrap_django(backend_root: Path) -> Path:
    root = backend_root.expanduser().resolve()
    if not (root / "manage.py").is_file() or not (root / "api" / "models.py").is_file():
        raise FileNotFoundError("Backend root must contain manage.py and api/models.py.")

    root_text = str(root)
    if root_text not in sys.path:
        sys.path.insert(0, root_text)

    # Capture preparation is intentionally local-only, even if the parent shell
    # happens to carry a deployment marker.
    os.environ.pop("IS_REMOTE_HOST", None)
    os.environ["DJANGO_SETTINGS_MODULE"] = "config.settings"

    import django

    django.setup()

    from django.conf import settings

    assert_local_sqlite_database(root, settings.DATABASES["default"])

    return root


def reset_demo(username: str) -> dict[str, int | bool]:
    from django.db import transaction
    from api.models import Account, AuthKey

    with transaction.atomic():
        account = Account.objects.filter(username=username).first()
        deleted = account is not None
        if account is not None:
            if AuthKey.objects.filter(account=account).exists():
                raise RuntimeError(
                    "The named synthetic account already has an AuthKey; refusing to delete it."
                )
            account.delete()

    return {
        "deleted": deleted,
        "remaining_demo_accounts": Account.objects.filter(username=username).count(),
    }


def _update_model(instance: Any, values: dict[str, Any]) -> Any:
    for field, value in values.items():
        setattr(instance, field, value)
    instance.save()
    return instance


def _matching_domain_counts(account: Any) -> dict[str, int]:
    from api.models import AnalysisReport, AuthKey, Checklist, CompanyInfo, JobDescription, Resume

    jobs = JobDescription.objects.filter(account=account, job_name=DEMO_JOB_NAME)
    resumes = Resume.objects.filter(
        job_description__in=jobs,
        name=DEMO_RESUME_NAME,
    )
    reports = AnalysisReport.objects.filter(
        resume__in=resumes,
        version=DEMO_REPORT_VERSION,
    )
    return {
        "account": type(account).objects.filter(username=account.username).count(),
        "company_info": CompanyInfo.objects.filter(account=account).count(),
        "job_description": jobs.count(),
        "checklist": Checklist.objects.filter(job_description__in=jobs).count(),
        "resume": resumes.count(),
        "analysis_report": reports.count(),
        "auth_key": AuthKey.objects.filter(account=account).count(),
    }


def seed_demo(username: str, require_existing_account: bool) -> dict[str, Any]:
    from django.db import transaction
    from api.models import (
        Account,
        AnalysisReport,
        AuthKey,
        Checklist,
        CompanyInfo,
        JobDescription,
        Resume,
    )

    records = build_demo_records()

    with transaction.atomic():
        account = Account.objects.filter(username=username).first()
        account_created = account is None

        if account is None:
            if require_existing_account:
                raise RuntimeError("The named synthetic account does not exist.")
            account = Account(
                username=username,
                name="데모 채용팀",
                credit=DEMO_CREDIT,
                subscribe=True,
                subscribe_expiration=DEMO_SUBSCRIPTION_EXPIRATION,
            )
            account.set_unusable_password()
            account.save()
        else:
            if AuthKey.objects.filter(account=account).exists():
                raise RuntimeError(
                    "The named synthetic account already has an AuthKey; refusing to modify or expose it."
                )
            # Preserve password and recovery fields established through browser signup.
            account.name = "데모 채용팀"
            account.credit = DEMO_CREDIT
            account.subscribe = True
            account.subscribe_expiration = DEMO_SUBSCRIPTION_EXPIRATION
            account.save(update_fields=["name", "credit", "subscribe", "subscribe_expiration"])

        company, _ = CompanyInfo.objects.update_or_create(
            account=account,
            defaults=records["company"],
        )

        matching_jobs = JobDescription.objects.filter(
            account=account,
            job_name=DEMO_JOB_NAME,
        ).order_by("pk")
        job = matching_jobs.first()
        if job is None:
            job = JobDescription.objects.create(account=account, **records["job"])
        else:
            _update_model(job, records["job"])
            matching_jobs.exclude(pk=job.pk).delete()

        desired_checklists = set(records["checklists"])
        job.checklists.exclude(content__in=desired_checklists).delete()
        for content in records["checklists"]:
            matching_checklists = Checklist.objects.filter(
                job_description=job,
                content=content,
            ).order_by("pk")
            checklist = matching_checklists.first()
            if checklist is None:
                Checklist.objects.create(job_description=job, content=content)
            else:
                matching_checklists.exclude(pk=checklist.pk).delete()

        resume_defaults = dict(records["resume"])
        resume_defaults["reviewed_at"] = DEMO_REVIEWED_AT
        matching_resumes = Resume.objects.filter(
            job_description=job,
            name=DEMO_RESUME_NAME,
        ).order_by("pk")
        resume = matching_resumes.first()
        if resume is None:
            resume = Resume.objects.create(job_description=job, **resume_defaults)
        else:
            _update_model(resume, resume_defaults)
            matching_resumes.exclude(pk=resume.pk).delete()

        matching_reports = AnalysisReport.objects.filter(
            resume=resume,
            version=DEMO_REPORT_VERSION,
        ).order_by("pk")
        report = matching_reports.first()
        if report is None:
            report = AnalysisReport.objects.create(resume=resume, **records["report"])
        else:
            _update_model(report, records["report"])
            matching_reports.exclude(pk=report.pk).delete()

    counts = _matching_domain_counts(account)
    expected = {
        "account": 1,
        "company_info": 1,
        "job_description": 1,
        "checklist": len(records["checklists"]),
        "resume": 1,
        "analysis_report": 1,
        "auth_key": 0,
    }
    if counts != expected or report.status != AnalysisReport.STATUS_DONE:
        raise RuntimeError("Seed verification counts did not match the expected demo domains.")

    return {
        "mode": "created" if account_created else "updated",
        "ids": {
            "account": account.pk,
            "company_info": company.pk,
            "job_description": job.pk,
            "resume": resume.pk,
            "analysis_report": report.pk,
        },
        "counts": counts,
    }


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    try:
        username = validate_demo_username(args.username)
        bootstrap_django(args.backend_root)
        result = (
            reset_demo(username)
            if args.reset
            else seed_demo(username, args.require_existing_account)
        )
    except (FileNotFoundError, RuntimeError, ValueError) as error:
        print(f"Seed helper error: {error}", file=sys.stderr)
        return 1

    print(json.dumps(result, ensure_ascii=False, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
