import json
import logging

from fastapi.testclient import TestClient


def test_request_logging_adds_request_id_and_structured_log(client: TestClient, caplog) -> None:
    with caplog.at_level(logging.INFO, logger="budgii.api"):
        response = client.get("/v1/health", headers={"X-Request-ID": "req-test-1"})

    assert response.status_code == 200, response.text
    assert response.headers["X-Request-ID"] == "req-test-1"

    log_record = next(record for record in caplog.records if record.name == "budgii.api")
    payload = json.loads(log_record.getMessage())
    assert payload["event"] == "request_complete"
    assert payload["request_id"] == "req-test-1"
    assert payload["method"] == "GET"
    assert payload["path"] == "/v1/health"
    assert payload["status_code"] == 200
    assert payload["duration_ms"] >= 0
