"""
Roadmap engine: Generate 30-day learning roadmaps using Ollama AI.

Deterministic fallback if Ollama is unavailable.
"""

from __future__ import annotations

import json

import requests

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "qwen2.5:0.5b"
OLLAMA_TIMEOUT = 60

# Fallback templates if Ollama fails
DAILY_TASK_TEMPLATES = {
    1: "{skill} Fundamentals",
    2: "{skill} Core Concepts & Architecture",
    3: "{skill} Hands-on Practice",
    4: "{skill} Mini Project",
    5: "{skill} Advanced Concepts",
    6: "{skill} Real-world Use Cases",
    7: "{skill} Self-assessment & Checkpoint",
}

DAILY_DESCRIPTIONS = {
    1: "Learn the fundamentals and basics of {skill}.",
    2: "Study core concepts, architecture, and key design patterns.",
    3: "Write code, follow tutorials, and get hands-on experience.",
    4: "Build a small project to solidify understanding.",
    5: "Explore advanced topics and best practices.",
    6: "Study real-world applications and case studies.",
    7: "Test your knowledge with a self-assessment and review weak areas.",
}


def generate_ai_week_plan(skill: str, role_context: str) -> list[dict]:
    """
    Generate a 7-day learning plan using Ollama AI.

    Falls back to deterministic template if Ollama fails.

    Args:
        skill: The skill to learn
        role_context: The role context (e.g., "Backend Developer")

    Returns:
        List of daily tasks
    """
    prompt = (
        f"Generate a structured 7-day learning plan for mastering {skill} "
        f"as part of becoming a {role_context}. "
        f"Return ONLY valid JSON format with no additional text:\n"
        f"[\n"
        f'  {{ "day": 1, "task": "...", "description": "..." }},\n'
        f"  ...\n"
        f"]\n"
        f"Ensure the array contains exactly 7 objects."
    )

    try:
        resp = requests.post(
            OLLAMA_URL,
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "temperature": 0.3,
            },
            timeout=OLLAMA_TIMEOUT,
        )
        resp.raise_for_status()

        data = resp.json()

        # Ollama puts model output inside "response"
        raw_text = data.get("response", "").strip()

        print("Ollama raw response:", raw_text)

        # Extract JSON array safely
        start = raw_text.find("[")
        end = raw_text.rfind("]")

        if start == -1 or end == -1:
            raise ValueError("No JSON array found in Ollama response")

        extracted_json = raw_text[start : end + 1]
        print("AI JSON extracted:", extracted_json)

        week_plan = json.loads(extracted_json)

        # Validate structure and ensure description exists
        if not isinstance(week_plan, list):
            raise ValueError("Response is not a JSON array")

        if len(week_plan) < 7:
            raise ValueError(f"Expected at least 7 items, got {len(week_plan)}")

        # Ensure every day has a description (qwen sometimes omits it)
        final_plan = []
        for item in week_plan[:7]:
            if "description" not in item:
                item["description"] = f"Complete the task: {item.get('task', 'Learning activity')}"
            final_plan.append(item)

        return final_plan

    except (
        requests.RequestException,
        json.JSONDecodeError,
        KeyError,
        TypeError,
        ValueError,
    ) as e:
        print(f"Ollama parsing failed: {e}. Using fallback.")
        pass

    # Fallback to deterministic template
    return generate_deterministic_week_plan(skill)


def generate_deterministic_week_plan(skill: str) -> list[dict]:
    """
    Generate a deterministic 7-day learning plan (fallback).

    Args:
        skill: The skill to learn

    Returns:
        List of daily tasks
    """
    days = []
    for day_num in range(1, 8):
        task_title = DAILY_TASK_TEMPLATES[day_num].format(skill=skill)
        task_desc = DAILY_DESCRIPTIONS[day_num].format(skill=skill)

        days.append(
            {
                "day": day_num,
                "task": task_title,
                "description": task_desc,
            }
        )

    return days


def generate_roadmap(
    missing_skills: list[dict], role_context: str = "Backend Developer"
) -> dict:
    """
    Generate a 30-day learning roadmap using AI-generated weekly plans.

    Args:
        missing_skills: List of dicts with 'skill' and 'importance'
        role_context: The role context for AI generation

    Returns:
        Dict with 'roadmap' containing weekly plans
    """
    sorted_skills = sorted(
        missing_skills, key=lambda x: x.get("importance", 0), reverse=True
    )

    top_skills = sorted_skills[:4]

    roadmap = []

    for week_num, skill_dict in enumerate(top_skills, start=1):
        skill_name = skill_dict.get("skill", "Skill")
        importance = skill_dict.get("importance", 0)

        # Use AI for top 2 skills, deterministic for rest (saves time on small models)
        if week_num <= 2:
            days = generate_ai_week_plan(skill_name, role_context)
        else:
            days = generate_deterministic_week_plan(skill_name)

        roadmap.append(
            {
                "week": week_num,
                "focus_skill": skill_name,
                "importance": importance,
                "days": days,
            }
        )

    roadmap_summary = {
        "roadmap": roadmap,
        "capstone": {
            "day": 29,
            "task": "Capstone Project",
            "description": "Build a capstone project combining all learned skills.",
        },
        "review": {
            "day": 30,
            "task": "Mock Interview & Review",
            "description": "Conduct a mock interview and review all concepts.",
        },
        "total_days": 30,
        "total_skills": len(top_skills),
    }

    return roadmap_summary
