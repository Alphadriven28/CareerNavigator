from __future__ import annotations

import io
import re
from collections import Counter

import pdfplumber
import requests

TECHNICAL_KEYWORDS = [
    "python",
    "java",
    "c++",
    "react",
    "node",
    "sql",
    "mongodb",
    "docker",
    "aws",
    "tensorflow",
    "pandas",
    "fastapi",
]

SOFT_KEYWORDS = [
    "communication",
    "leadership",
    "teamwork",
    "problem solving",
    "critical thinking",
    "adaptability",
]

YEARS_PATTERN = re.compile(r"\b([2-9]\d*)\s*\+?\s*(years|yrs)\b")


def _extract_resume_text(resume_bytes: bytes) -> str:
    with pdfplumber.open(io.BytesIO(resume_bytes)) as pdf:
        pages = [page.extract_text() or "" for page in pdf.pages]
    return "\n".join(pages).lower()


def _detect_keywords(text: str, keywords: list[str]) -> list[str]:
    return [keyword for keyword in keywords if keyword in text]


def _infer_experience_level(text: str) -> str:
    if "senior" in text or "lead" in text:
        return "advanced"
    if "engineer" in text and YEARS_PATTERN.search(text):
        return "intermediate"
    if "intern" in text or "student" in text:
        return "beginner"
    return "beginner"


def analyze_resume(resume_bytes: bytes | None) -> dict:
    if not resume_bytes:
        return {
            "technical_skills": [],
            "soft_skills": [],
            "experience_level": "beginner",
        }

    text = _extract_resume_text(resume_bytes)
    technical_skills = _detect_keywords(text, TECHNICAL_KEYWORDS)
    soft_skills = _detect_keywords(text, SOFT_KEYWORDS)
    experience_level = _infer_experience_level(text)

    return {
        "technical_skills": technical_skills,
        "soft_skills": soft_skills,
        "experience_level": experience_level,
    }


def analyze_github(username: str | None) -> dict:
    if not username:
        return {"repo_count": 0, "primary_languages": []}

    url = f"https://api.github.com/users/{username}/repos"
    try:
        response = requests.get(
            url,
            timeout=10,
            headers={"Accept": "application/vnd.github+json"},
        )
    except requests.RequestException:
        return {"repo_count": 0, "primary_languages": []}

    if response.status_code != 200:
        return {"repo_count": 0, "primary_languages": []}

    repos = response.json()
    if not isinstance(repos, list):
        return {"repo_count": 0, "primary_languages": []}

    languages = [repo.get("language") for repo in repos if repo.get("language")]
    counts = Counter(languages)
    primary_languages = [name for name, _ in counts.most_common(3)]

    return {"repo_count": len(repos), "primary_languages": primary_languages}


def analyze_profile(resume_bytes: bytes | None, github_username: str | None) -> dict:
    resume_result = analyze_resume(resume_bytes)
    github_result = analyze_github(github_username)
    return {
        "technical_skills": resume_result["technical_skills"],
        "soft_skills": resume_result["soft_skills"],
        "experience_level": resume_result["experience_level"],
        "github_analysis": github_result,
    }
