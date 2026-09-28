from unittest.mock import patch

from app.services.deepseek import ai_match_materials


@patch("app.services.deepseek.httpx.post")
def test_ai_match_returns_ranked_materials(mock_post):
    mock_post.return_value.json.return_value = {
        "choices": [{"message": {"content": '["镀锌钢管", "热镀锌钢管"]'}}]
    }
    result = ai_match_materials("消防钢管", ["镀锌钢管", "热镀锌钢管", "灭火器"])
    assert result[0]["material_name"] == "镀锌钢管"
