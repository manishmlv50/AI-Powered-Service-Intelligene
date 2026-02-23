# Local Agent Testing

This project exposes the master agent over HTTP.

## Start the API

From the repository root:

```bash
cd sourcecode
python -m uvicorn app.main:app --reload
```

## Call the master agent

### Example: Intake request with structured fields

```bash
curl -X POST http://127.0.0.1:8000/api/agents/master \
  -H "Content-Type: application/json" \
  -d "{\"vehicle_id\":\"VH-1023\",\"customer_complaint\":\"brake noise when stopping\",\"obd_report_text\":\"P0500 vehicle speed sensor malfunction\"}"
```

### Expected shape

```json
{
  "workflow": "auto_body_shop",
  "result": {
    "intake": {
      "agent": "intake_agent",
      "vehicle_id": "...",
      "customer_complaint": "...",
      "obd_report_summary": "...",
      "job_details": "..."
    }
  }
}
```

## Notes

- The intake agent uses strict structured output via `response_format=IntakeResponse`.
- The service layer assembles a prompt from `vehicle_id`, `customer_complaint`, and `obd_report_text` before calling the master agent.
