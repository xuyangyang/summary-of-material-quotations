import json

import httpx

from app.config import settings


def ai_match_materials(query: str, candidates: list[str]) -> list[dict]:
    if not candidates:
        return []

    payload = {
        "model": settings.deepseek_model,
        "messages": [
            {
                "role": "system",
                "content": "你是采购材料检索助手。只输出与查询最相关的材料名称 JSON 数组，按相关度降序。",
            },
            {
                "role": "user",
                "content": f"查询：{query}\n候选材料：{candidates}",
            },
        ],
        "temperature": 0,
    }
    response = httpx.post(
        f"{settings.deepseek_base_url}/chat/completions",
        headers={"Authorization": f"Bearer {settings.deepseek_api_key}"},
        json=payload,
        timeout=30,
    )
    response.raise_for_status()
    content = response.json()["choices"][0]["message"]["content"]
    names = json.loads(content)
    return [
        {"material_name": name, "score": max(0.0, 1.0 - i * 0.05)}
        for i, name in enumerate(names)
    ]


def test_connection() -> dict:
    response = httpx.get(
        f"{settings.deepseek_base_url}/models",
        headers={"Authorization": f"Bearer {settings.deepseek_api_key}"},
        timeout=15,
    )
    return {"ok": response.status_code < 400, "status_code": response.status_code}
