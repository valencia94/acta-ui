import json

def lambda_handler(event, context):
    path = event.get("resource") or event.get("rawPath")
    method = event.get("httpMethod")

    if path == "/approve" and method == "GET":
        return {
            "statusCode": 200,
            "body": json.dumps({"message": "approve"})
        }

    if path and path.startswith("/project-summary/") and method == "GET":
        project_id = event.get("pathParameters", {}).get("id")
        if not project_id:
            # fallback to rawPath when path parameters are absent
            project_id = event.get("rawPath", path).split("/", 2)[-1]
        return {
            "statusCode": 200,
            "body": json.dumps({
                "project_id": project_id,
                "project_name": f"Project {project_id}",
            }),
        }

    if path == "/send-approval-email" and method == "POST":
        return {
            "statusCode": 200,
            "body": json.dumps({"message": "email sent"})
        }

    if path == "/generateDocument" and method == "POST":
        return {
            "statusCode": 200,
            "body": json.dumps({"message": "generate"})
        }

    return {
        "statusCode": 400,
        "body": json.dumps({"error": "Invalid request"})
    }
