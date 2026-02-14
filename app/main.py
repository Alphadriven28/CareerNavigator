import re

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.models import (
    AIInsightsRequest,
    AIInsightsResponse,
    AnalyzeRoleRequest,
    AnalyzeRoleResponse,
    GenerateCareerPlanRequest,
    GenerateCareerPlanResponse,
    GenerateRoadmapRequest,
    GenerateRoadmapResponse,
    MissingSkill,
    ProfileAnalysisResponse,
    SubmitTaskRequest,
    SubmitTaskResponse,
)
from app.services.profile_engine import analyze_profile
from app.services.roadmap_engine import generate_roadmap
from app.services.role_engine import analyze_role
from app.services.ai_engine import generate_ai_insights
from app.services.utils import update_metrics_on_task_submission

app = FastAPI(title="CareerOS")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


def _auto_quality_score(submission_text: str) -> int:
    words = submission_text.strip().split()
    word_count = len(words)
    if word_count < 30:
        score = 40
    elif word_count <= 80:
        score = 65
    else:
        score = 85

    code_like_pattern = re.compile(
        r"[;{}]|\b(def|class|return|import|for|while|if|else|elif)\b|=>|\bconst\b|\bfunction\b"
    )
    if code_like_pattern.search(submission_text):
        score += 10

    return min(score, 100)


@app.post("/submit-task", response_model=SubmitTaskResponse)
def submit_task(payload: SubmitTaskRequest) -> SubmitTaskResponse:
    quality_score = payload.quality_score
    if quality_score is None:
        quality_score = _auto_quality_score(payload.submission_text)

    updated = update_metrics_on_task_submission(
        payload.user_id,
        quality_score=quality_score,
    )

    return SubmitTaskResponse(
        xp=updated.xp,
        level=updated.level,
        rank=updated.rank,
        streak=updated.streak,
        execution_score=updated.execution_score,
    )


@app.post("/analyze-profile", response_model=ProfileAnalysisResponse)
def analyze_profile_endpoint(
    resume: UploadFile | None = File(None),
    github_username: str | None = Form(None),
) -> ProfileAnalysisResponse:
    resume_bytes = resume.file.read() if resume else None
    result = analyze_profile(resume_bytes, github_username)
    return ProfileAnalysisResponse(**result)


@app.post("/analyze-role", response_model=AnalyzeRoleResponse)
def analyze_role_endpoint(request: AnalyzeRoleRequest) -> AnalyzeRoleResponse:
    result = analyze_role(
        user_skills=request.user_skills,
        selected_role=request.selected_role,
    )
    return AnalyzeRoleResponse(**result)


@app.post("/generate-roadmap", response_model=GenerateRoadmapResponse)
def generate_roadmap_endpoint(request: GenerateRoadmapRequest) -> GenerateRoadmapResponse:
    missing_skills_list = [
        {"skill": skill.skill, "importance": skill.importance}
        for skill in request.missing_skills
    ]
    result = generate_roadmap(missing_skills_list)
    return GenerateRoadmapResponse(**result)


@app.post("/generate-career-plan", response_model=GenerateCareerPlanResponse)
def generate_career_plan_endpoint(
    request: GenerateCareerPlanRequest,
) -> GenerateCareerPlanResponse:
    role_result = analyze_role(
        user_skills=request.user_skills,
        selected_role=request.selected_role,
    )
    missing_skills = role_result.get("missing_skills", [])
    roadmap_result = generate_roadmap(missing_skills)

    return GenerateCareerPlanResponse(
        alignment_score=role_result.get("alignment_score", 0.0),
        missing_skills=[MissingSkill(**skill) for skill in missing_skills],
        roadmap=roadmap_result["roadmap"],
        capstone=roadmap_result["capstone"],
        review=roadmap_result["review"],
    )


@app.post("/ai-insights", response_model=AIInsightsResponse)
def ai_insights_endpoint(request: AIInsightsRequest) -> AIInsightsResponse:
    missing_skills_dicts = [
        {"skill": ms.skill, "importance": ms.importance}
        for ms in request.missing_skills
    ]
    result = generate_ai_insights(
        user_skills=request.user_skills,
        selected_role=request.selected_role,
        alignment_score=request.alignment_score,
        missing_skills=missing_skills_dicts,
    )
    return AIInsightsResponse(**result)
