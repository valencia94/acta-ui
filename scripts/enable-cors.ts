import {
  APIGatewayClient,
  GetResourcesCommand,
  PutMethodCommand,
  PutIntegrationCommand,
  PutMethodResponseCommand,
  PutIntegrationResponseCommand,
  CreateDeploymentCommand,
} from '@aws-sdk/client-api-gateway';

const restApiId = 'q2b9avfwv5';
const stageName = 'prod';

const allowedOrigin = 'https://d7t9x3j66yd8k.cloudfront.net';
const allowedMethods = 'GET,POST,PUT,DELETE,OPTIONS';
const allowedHeaders = 'Content-Type,Authorization';

const client = new APIGatewayClient({});

async function enableCors(): Promise<void> {
  const resources: any[] = [];
  let position: string | undefined;

  do {
    const res = await client.send(
      new GetResourcesCommand({
        restApiId,
        embed: ['methods'],
        position,
      })
    );
    if (res.items) resources.push(...res.items);
    position = res.position;
  } while (position);

  for (const resource of resources) {
    const resourceId = resource.id as string;
    const methods = Object.keys(resource.resourceMethods || {});
    const methodSet = new Set<string>([...methods, 'OPTIONS']);

    for (const method of methodSet) {
      if (method === 'OPTIONS') {
        await client.send(
          new PutMethodCommand({
            restApiId,
            resourceId,
            httpMethod: 'OPTIONS',
            authorizationType: 'NONE',
          })
        );

        await client.send(
          new PutIntegrationCommand({
            restApiId,
            resourceId,
            httpMethod: 'OPTIONS',
            type: 'MOCK',
            requestTemplates: { 'application/json': '{"statusCode": 200}' },
          })
        );
      }

      await client.send(
        new PutMethodResponseCommand({
          restApiId,
          resourceId,
          httpMethod: method,
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
            'method.response.header.Access-Control-Allow-Methods': true,
            'method.response.header.Access-Control-Allow-Headers': true,
          },
          responseModels: { 'application/json': 'Empty' },
        })
      );

      await client.send(
        new PutIntegrationResponseCommand({
          restApiId,
          resourceId,
          httpMethod: method,
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': `'${allowedOrigin}'`,
            'method.response.header.Access-Control-Allow-Methods': `'${allowedMethods}'`,
            'method.response.header.Access-Control-Allow-Headers': `'${allowedHeaders}'`,
          },
        })
      );
    }
  }

  await client.send(
    new CreateDeploymentCommand({
      restApiId,
      stageName,
      description: 'auto-cors-deploy',
    })
  );

  console.log('CORS enabled and deployment created');
}

enableCors().catch((err) => {
  console.error(err);
  process.exit(1);
});
