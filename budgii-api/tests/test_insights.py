from app.services.insights import deterministic_insight


def test_deterministic_insight_flags_fast_budget_spending() -> None:
    result = deterministic_insight(
        {
            "month_progress_percent": 25,
            "budget": 1000,
            "spent": 700,
            "remaining": 300,
            "categories": [{"category": "Groceries", "spent": 500}],
        }
    )

    assert "Groceries" in result["summary"]
    assert "70%" in result["actions"][1]
