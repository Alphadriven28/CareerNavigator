from pydantic import BaseModel


class UserMetrics(BaseModel):
    user_id: str
    xp: int
    level: int
    rank: str
    streak: int
    total_completed_tasks: int
    total_assigned_tasks: int
    execution_score: float
    last_submission_date: str | None = None


class RoleGap(BaseModel):
    selected_role: str
    alignment_score: float
    skills: list[str]


class QuestTask(BaseModel):
    task_id: str
    skill: str
    task_type: str
    xp_reward: int
    completed: bool


class SubmitTaskRequest(BaseModel):
    user_id: str
    submission_text: str
    quality_score: int | None = None


class SubmitTaskResponse(BaseModel):
    xp: int
    level: int
    rank: str
    streak: int
    execution_score: float


class GithubAnalysis(BaseModel):
    repo_count: int
    primary_languages: list[str]


class ProfileAnalysisResponse(BaseModel):
    technical_skills: list[str]
    soft_skills: list[str]
    experience_level: str
    github_analysis: GithubAnalysis


class MissingSkill(BaseModel):
    skill: str
    importance: int
    why_this_skill_matters: str | None = None
    market_signal: str | None = None
    learning_resources: list[str] | None = None
    recommended_project: dict | None = None
    checkpoints: list[str] | None = None


class AnalyzeRoleRequest(BaseModel):
    user_skills: list[str]
    selected_role: str


class AnalyzeRoleResponse(BaseModel):
    alignment_score: float
    missing_skills: list[MissingSkill]


class DailyTask(BaseModel):
    day: int
    task: str
    description: str


class WeekPlan(BaseModel):
    week: int
    focus_skill: str
    importance: int
    days: list[DailyTask]


class CapstoneDay(BaseModel):
    day: int
    task: str
    description: str


class GenerateRoadmapRequest(BaseModel):
    missing_skills: list[MissingSkill]


class GenerateRoadmapResponse(BaseModel):
    roadmap: list[WeekPlan]
    capstone: CapstoneDay
    review: CapstoneDay
    total_days: int
    total_skills: int


class GenerateCareerPlanRequest(BaseModel):
    user_skills: list[str]
    selected_role: str


class GenerateCareerPlanResponse(BaseModel):
    alignment_score: float
    missing_skills: list[MissingSkill]
    roadmap: list[WeekPlan]
    capstone: CapstoneDay
    review: CapstoneDay


class AIInsightsRequest(BaseModel):
    user_skills: list[str]
    selected_role: str
    alignment_score: float
    missing_skills: list[MissingSkill]


class AIInsightsResponse(BaseModel):
    ai_generated: bool
    summary: str
    risk_score: int
    risk_level: str
    risk_factors: list[str]
    strengths: list[str]
    recommendations: list[str]
    career_narrative: str

