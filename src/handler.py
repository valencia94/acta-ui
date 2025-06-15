import json

def lambda_handler(event, context):
    path = event.get("resource") or event.get("rawPath")
    method = event.get("httpMethod")

    if path == "/approve" and method == "GET":
        return {
            "statusCode": 200,
            "body": json.dumps({"message": "approve"})
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
