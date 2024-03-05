import { v4 as uuidv4 } from 'uuid';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

// Get the DynamoDB table name from environment variables
const tableName = process.env.SAMPLE_TABLE;
const lambdaClient = new LambdaClient({});

// Helper function to invoke the second Lambda function (computeShortestPathFunction) asynchronously
const invokeCompute = async (payload) => {
  const params = {
    FunctionName: 'arn:aws:lambda:us-west-1:818899096532:function:knights-path-computeShortestPathFunction-L8jof1XMnnzn', 
    InvocationType: 'Event',
    Payload: JSON.stringify(payload)
  };

  try {
    await lambdaClient.send(new InvokeCommand(params));
  } catch (error) {
    console.error('Error invoking second Lambda function:', error);
  }
};


/**
 * Handler for HTTP POST - receives a source and target coordinate and returns an operationId
 */
export const postOperationId = async (event) => {
  if (event.httpMethod !== 'POST') {
    throw new Error(`postOperationId only accepts GET method, you tried: ${event.httpMethod} method.`);
  }

  let source, target;

  // Check if pathParameters exists (i.e. when testing with local event)
  if (event.pathParameters) {
    ({ source, target } = event.pathParameters);
  } else {
    source = event.queryStringParameters?.source;
    target = event.queryStringParameters?.target;
  }

  if (!source || !target) {
    return {
      statusCode: 400,
      body: 'source and target are required'
    };
  }

  const pathId = `${source}:${target}`;
  let data, item;

  try {
    data = await ddbDocClient.send(new GetCommand({
      TableName: tableName,
      Key: { id: pathId }
    }));

    if (data.Item) {
      console.log("Success - item retrieved", data.Item);
      item = data.Item;
    } else {
      item = { 
        id: pathId, 
        operationStatus: "in-progress", 
        operationId: uuidv4(), 
        starting: source, 
        ending: target, 
        numberOfMoves: 0, 
        shortestPath: [] 
      };

      data = await ddbDocClient.send(new PutCommand({
        TableName: tableName,
        Item: item
      }));

      await invokeCompute(item);
      console.log("Success - item created");
    }

  } catch (err) {
    console.error("Error", err.stack);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "An error occurred while querying the database."
      })
    };
  }

  return {
    statusCode: 201,
    body: JSON.stringify({
      message: `Operation Id ${item.operationId} was created. Please query it to find your results.`,
    })
  };
};

