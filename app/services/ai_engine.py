"""
Central Ollama AI inference engine.

Provides shared LLM client and high-level analysis functions
for generating AI-powered career insights.

Strategy: Use multiple small, focused prompts instead of one large JSON prompt.
gemma3:1b is a small model — keep prompts under 100 tokens, responses short.
"""

from __future__ import annotations

import re
import requests

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "qwen2.5:0.5b"
OLLAMA_TIMEOUT = 120


def call_ollama(prompt: str, temperature: float = 0.3) -> str:
    """Send a short prompt to Ollama and return raw text."""
    resp = requests.post(
        OLLAMA_URL,
        json={
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
            "temperature": temperature,
        },
        timeout=OLLAMA_TIMEOUT,
    )
    resp.raise_for_status()
    return resp.json().get("response", "").strip()


def _clean_response(text: str) -> str:
    """Strip preamble and trailing filler from Gemma responses."""
    # Remove common preambles
    text = re.sub(
        r"^(Okay,?\s*(here('s| are))?|Sure,?\s*(here('s| are))?|Here('s| are))\s*",
        "",
        text,
        flags=re.IGNORECASE,
    )
    # Remove trailing questions / notes
    for marker in ["To help me", "Could you tell me", "---", "**Optional", "**Important Considerations"]:
        idx = text.find(marker)
        if idx > 50:  # only trim if there's substantial content before
            text = text[:idx]
    return text.strip().strip('"').strip()


def _safe_call(prompt: str, fallback: str) -> str:
    """Call Ollama with fallback on any error."""
    try:
        result = call_ollama(prompt)
        return _clean_response(result) if result else fallback
    except Exception as e:
        print(f"[ai_engine] Ollama call failed: {e}")
        return fallback


def generate_ai_insights(
    user_skills: list[str],
    selected_role: str,
    alignment_score: float,
    missing_skills: list[dict],
) -> dict:
    """
    Generate AI-powered career insights using multiple small Ollama calls.
    Falls back to deterministic data for any failed call.
    """
    skills_str = ", ".join(user_skills[:6]) if user_skills else "none"
    missing_str = ", ".join(s.get("skill", "") for s in missing_skills[:5])
    top_missing = missing_skills[0]["skill"] if missing_skills else "core skills"

    ai_generated = False

    # ── Call 1: Executive Summary (short) ──
    summary_fallback = (
        f"The candidate has {len(user_skills)} skills and targets "
        f"{selected_role} with {alignment_score:.0f}% alignment. "
        f"There are {len(missing_skills)} skill gaps to address."
    )
    summary_prompt = (
        f"A person knows {skills_str}. They want to become a {selected_role}. "
        f"Their alignment is {alignment_score:.0f}%. They lack {missing_str}. "
        f"Write a 3-sentence career assessment. Be specific and professional."
    )
    summary = _safe_call(summary_prompt, summary_fallback)
    if summary != summary_fallback:
        ai_generated = True

    # ── Call 2: Risk factors (very short) ──
    risk_fallback = [
        f"Missing {len(missing_skills)} key skills",
        f"{alignment_score:.0f}% alignment needs improvement",
        f"Top gap: {top_missing}",
    ]
    risk_prompt = (
        f"List exactly 3 career risk factors for someone with {skills_str} "
        f"who wants to be a {selected_role} but lacks {missing_str}. "
        f"One sentence each. No numbering."
    )
    risk_raw = _safe_call(risk_prompt, "")
    if risk_raw:
        lines = [l.strip().lstrip("•-123456789.") .strip() for l in risk_raw.split("\n") if l.strip()]
        risk_factors = lines[:3] if len(lines) >= 2 else risk_fallback
        if risk_factors != risk_fallback:
            ai_generated = True
    else:
        risk_factors = risk_fallback

    # ── Call 3: Strengths (very short) ──
    strengths_fallback = [
        f"Proficient in {', '.join(user_skills[:3])}",
        "Shows commitment to structured growth",
        "Has relevant technical foundation",
    ]
    strengths_prompt = (
        f"List 3 career strengths for someone who knows {skills_str} "
        f"and wants to become a {selected_role}. One sentence each. No numbering."
    )
    strengths_raw = _safe_call(strengths_prompt, "")
    if strengths_raw:
        lines = [l.strip().lstrip("•-123456789.").strip() for l in strengths_raw.split("\n") if l.strip()]
        strengths = lines[:3] if len(lines) >= 2 else strengths_fallback
        if strengths != strengths_fallback:
            ai_generated = True
    else:
        strengths = strengths_fallback

    # ── Call 4: Recommendations (very short) ──
    recs_fallback = [
        f"Focus on {top_missing} first",
        "Build portfolio projects for target role",
        "Follow a structured 30-day roadmap",
        "Practice system design weekly",
    ]
    recs_prompt = (
        f"Give 4 specific career recommendations for someone who knows {skills_str} "
        f"and wants to be a {selected_role}. They need to learn {missing_str}. "
        f"One sentence each. No numbering."
    )
    recs_raw = _safe_call(recs_prompt, "")
    if recs_raw:
        lines = [l.strip().lstrip("•-123456789.").strip() for l in recs_raw.split("\n") if l.strip()]
        recs = lines[:4] if len(lines) >= 3 else recs_fallback
        if recs != recs_fallback:
            ai_generated = True
    else:
        recs = recs_fallback

    # ── Call 5: Career narrative (the key differentiator) ──
    narrative_fallback = (
        f"Phase 1 — Foundational Architecture (Weeks 1–2): "
        f"Begin by solidifying fundamentals in {top_missing}. "
        f"Phase 2 — Core Integration (Weeks 3–4): "
        f"Build hands-on projects integrating multiple skills. "
        f"Phase 3 — Feature Expansion (Weeks 5–6): "
        f"Expand into adjacent technologies. "
        f"Phase 4 — Optimization & Scaling (Weeks 7–8): "
        f"Focus on production-quality code and testing. "
        f"Phase 5 — Production Readiness (Weeks 9–10): "
        f"Prepare interview materials and polish portfolio."
    )
    narrative_prompt = (
        f"Write a professional 5-phase career roadmap for someone becoming a {selected_role}. "
        f"They know {skills_str} and need to learn {missing_str}. "
        f"Phase 1: Foundational Architecture (weeks 1-2). "
        f"Phase 2: Core Integration (weeks 3-4). "
        f"Phase 3: Feature Expansion (weeks 5-6). "
        f"Phase 4: Optimization & Scaling (weeks 7-8). "
        f"Phase 5: Production Readiness (weeks 9-10). "
        f"Write 2-3 sentences per phase. Professional narrative tone."
    )
    narrative = _safe_call(narrative_prompt, narrative_fallback)
    if narrative != narrative_fallback:
        ai_generated = True

    # ── Compute risk score ──
    risk_score = max(0, min(100, 100 - int(alignment_score)))
    risk_level = (
        "Critical" if risk_score >= 75 else
        "High" if risk_score >= 50 else
        "Medium" if risk_score >= 25 else
        "Low"
    )

    return {
        "ai_generated": ai_generated,
        "summary": summary,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "risk_factors": risk_factors,
        "strengths": strengths,
        "recommendations": recs,
        "career_narrative": narrative,
    }


def generate_skill_narrative(skill: str, role: str) -> str:
    """AI-written explanation of why a specific skill matters."""
    return _safe_call(
        f"In 2 sentences, explain why {skill} matters for a {role}. Be specific.",
        f"{skill} is a key competency for {role} roles and appears frequently in job postings.",
    )
