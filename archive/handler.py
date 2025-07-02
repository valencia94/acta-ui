import json


def _get_path_param(event: dict, name: str) -> str | None:
    """Return a path parameter, falling back to raw path parsing."""
    param = event.get("pathParameters", {}).get(name)
    if param:
        return param
    raw = event.get("rawPath") or event.get("resource", "")
    parts = raw.split("/")
    return parts[-1] if len(parts) > 1 else None


def lambda_handler(event, context):
    path = event.get("resource") or event.get("rawPath")
    method = event.get("httpMethod")

    if path and path.startswith("/timeline/") and method == "GET":
        project_id = _get_path_param(event, "id")
        return {
            "statusCode": 200,
            "body": json.dumps([
                {
                    "hito": "Kickoff",
                    "actividades": "Setup",
                    "desarrollo": "Init",
                    "fecha": "2024-01-01",
                }
            ]),
        }

    if path and path.startswith("/download-acta/") and method == "GET":
        project_id = _get_path_param(event, "id")
        fmt = event.get("queryStringParameters", {}).get("format", "pdf")
        url = f"https://example.com/{project_id}.{fmt}"
        return {"statusCode": 200, "body": json.dumps({"url": url})}

    if path and path.startswith("/project-summary/") and method == "GET":
        project_id = _get_path_param(event, "id")
        return {
            "statusCode": 200,
            "body": json.dumps(
                {"project_id": project_id, "project_name": f"Project {project_id}"}
            ),
        }

    if path == "/send-approval-email" and method == "POST":
        return {"statusCode": 200, "body": json.dumps({"message": "email sent"})}

    if path and path.startswith("/extract-project-place/") and method == "POST":
        project_id = _get_path_param(event, "id")
        return {
            "statusCode": 200,
            "body": json.dumps({"started": True, "project_id": project_id}),
        }

    return {"statusCode": 400, "body": json.dumps({"error": "Invalid request"})}
