"""Configurable AI provider adapter for LLM JSON generation, embeddings, and cosine similarity.

Supports:
1. Google Gemini API (when GEMINI_API_KEY is configured)
2. OpenAI API (when OPENAI_API_KEY is configured)
3. Transparent deterministic local fallback (clearly labeled as 'deterministic_rule_assisted'
   so unconfigured environments never fake cloud LLM calls).
"""

import hashlib
import json
import math
import re
from typing import Any
import httpx

from app.core.config import settings


def compute_deterministic_embedding(text: str, dim: int = 64) -> list[float]:
    """Generate a normalized deterministic token-hash embedding vector for local semantic search."""
    vec = [0.0] * dim
    tokens = re.findall(r"[a-zA-Z0-9_]+", (text or "").lower())
    if not tokens:
        return vec
    for tok in tokens:
        digest = hashlib.sha256(tok.encode("utf-8")).digest()
        idx = digest[0] % dim
        sign = 1.0 if (digest[1] % 2 == 0) else -1.0
        weight = 1.5 if tok.isdigit() or len(tok) > 4 else 1.0
        vec[idx] += sign * weight
    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [round(v / norm, 6) for v in vec]


def generate_embedding(text: str) -> list[float]:
    """Generate an embedding vector using the active provider or local deterministic tokenizer."""
    provider = settings.active_llm_provider
    if provider == "gemini" and settings.GEMINI_API_KEY:
        try:
            url = (
                f"https://generativelanguage.googleapis.com/v1beta/"
                f"{settings.GEMINI_EMBEDDING_MODEL}:embedContent?key={settings.GEMINI_API_KEY}"
            )
            payload = {
                "model": settings.GEMINI_EMBEDDING_MODEL,
                "content": {"parts": [{"text": text[:4000]}]},
            }
            with httpx.Client(timeout=10.0) as client:
                resp = client.post(url, json=payload)
                if resp.status_code == 200:
                    values = resp.json().get("embedding", {}).get("values")
                    if isinstance(values, list) and values:
                        return values
        except Exception:
            pass

    if provider == "openai" and settings.OPENAI_API_KEY:
        try:
            url = "https://api.openai.com/v1/embeddings"
            headers = {"Authorization": f"Bearer {settings.OPENAI_API_KEY}"}
            payload = {"model": settings.OPENAI_EMBEDDING_MODEL, "input": text[:4000]}
            with httpx.Client(timeout=10.0) as client:
                resp = client.post(url, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json().get("data", [])
                    if data and "embedding" in data[0]:
                        return data[0]["embedding"]
        except Exception:
            pass

    return compute_deterministic_embedding(text)


def cosine_similarity(vec_a: list[float] | None, vec_b: list[float] | None) -> float:
    """Compute cosine similarity between two embedding vectors."""
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot / (norm_a * norm_b)


def call_llm_json(system_prompt: str, user_prompt: str) -> tuple[dict[str, Any] | None, str]:
    """Call configured cloud LLM expecting JSON output.

    Returns:
        (parsed_json_or_none, provider_used)
    """
    provider = settings.active_llm_provider

    if provider == "gemini" and settings.GEMINI_API_KEY:
        try:
            url = (
                f"https://generativelanguage.googleapis.com/v1beta/models/"
                f"{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
            )
            payload = {
                "systemInstruction": {"parts": [{"text": system_prompt}]},
                "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
                "generationConfig": {
                    "temperature": 0.1,
                    "responseMimeType": "application/json",
                },
            }
            with httpx.Client(timeout=20.0) as client:
                resp = client.post(url, json=payload)
                if resp.status_code == 200:
                    candidates = resp.json().get("candidates", [])
                    if candidates:
                        raw_text = (
                            candidates[0]
                            .get("content", {})
                            .get("parts", [{}])[0]
                            .get("text", "")
                        )
                        return json.loads(raw_text), "gemini"
        except Exception:
            pass

    if provider == "openai" and settings.OPENAI_API_KEY:
        try:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {"Authorization": f"Bearer {settings.OPENAI_API_KEY}"}
            payload = {
                "model": settings.OPENAI_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.1,
                "response_format": {"type": "json_object"},
            }
            with httpx.Client(timeout=20.0) as client:
                resp = client.post(url, headers=headers, json=payload)
                if resp.status_code == 200:
                    raw_text = (
                        resp.json()
                        .get("choices", [{}])[0]
                        .get("message", {})
                        .get("content", "")
                    )
                    return json.loads(raw_text), "openai"
        except Exception:
            pass

    return None, "deterministic_rule_assisted"
