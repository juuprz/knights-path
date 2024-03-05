import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.SAMPLE_TABLE;

/**
 * Returns the shortest path response for a given operationId if available. Otherwise, returns a 202 status code.
 */

export const getKnightPath = async (event) => {
  if (event.httpMethod !== 'GET') {
    throw new Error(`getKnightPath only accept GET method, you tried: ${event.httpMethod}`);
  }

  let operationId;

  // Check if pathParameters exists (i.e. when testing with local event)
  if (event.pathParameters) {
    ({ operationId } = event.pathParameters);
  } else {
    operationId = event.queryStringParameters?.operationId;
  }

  if (!operationId) {
    return {
      statusCode: 400,
      body: 'operationId is required'
    };
  }

  let item;

  try {
    const params = {
      TableName: tableName,
      IndexName: 'OperationIdIndex',
      KeyConditionExpression: 'operationId = :operationId',
      ExpressionAttributeValues: {
        ':operationId': operationId
      }
    };

    const data = await ddbDocClient.send(new QueryCommand(params));
    item = data.Items[0];
  } catch (err) {
    console.log("Error", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "An error occurred while querying the database."
      })
    };
  }

  // return a 202 and the status if the operation is not completed
  if (item.operationStatus !== 'completed') {
    return {
      statusCode: 202,
      body: JSON.stringify({ operationId, operationStatus: item.operationStatus })
    };
  }

  const { starting, ending, shortestPath, numberOfMoves } = item;
  const response = {
    statusCode: 200,
    body: JSON.stringify({ starting, ending, shortestPath, numberOfMoves, operationId })
  };
  console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
  return response;
}
