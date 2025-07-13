// src/sendProjectsForPM.ts
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const db = new DynamoDBClient({});

export const handler = async (event) => {
  // 1️⃣ Get the PM’s email from the authenticated user (if you have Cognito authorizers set up)
  //    or fall back to a query string param:
  const pmEmail =
    event.requestContext?.authorizer?.claims?.email ||
    event.queryStringParameters?.pm_email;

  if (!pmEmail) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing pm_email' }),
    };
  }

  // 2️⃣ Query your DynamoDB table via a GSI on pm_email (you must create this index):
  const out = await db.send(
    new QueryCommand({
      TableName: process.env.TABLE,
      IndexName: process.env.PM_EMAIL_INDEX ?? 'pm_email-index',
      KeyConditionExpression: 'pm_email = :email',
      ExpressionAttributeValues: {
        ':email': { S: pmEmail },
      },
      ProjectionExpression:
        'project_id, #proj.title, pm_name, pm_email, approval_status',
      ExpressionAttributeNames: { '#proj': 'project' },
      ScanIndexForward: true, // oldest first; false = newest first
      // remove Limit completely so you get *all* projects
    })
  );

  // 3️⃣ If no items found, return an empty array
  const items = (out.Items ?? []).map((i) => unmarshall(i));

  // 4️⃣ Shape your response
  const projects = items.map((i) => ({
    project_id: i.project_id,
    project_name: i.project?.title ?? '(unnamed)',
    pm_name: i.pm_name,
    pm_email: i.pm_email,
    status: i.approval_status ?? 'n/a',
  }));

  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(projects),
  };
};
