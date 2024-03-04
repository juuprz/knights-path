import { v4 as uuidv4 } from 'uuid';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

// Get the DynamoDB table name from environment variables
const tableName = process.env.SAMPLE_TABLE;


const lambdaClient = new LambdaClient({ region: 'REGION' });
const invokeCompute = async (payload) => {

  console.log('>>>> Invoking second Lambda function with payload:', payload)
  const params = {
    FunctionName: 'computeShortestPathFunction', 
    InvocationType: 'Event',
    Payload: JSON.stringify(payload)
  };

  try {
    const response = await lambdaClient.send(new InvokeCommand(params));
    console.log('Second Lambda function invoked:', response);
  } catch (error) {
    console.error('Error invoking second Lambda function:', error);
  }
};


/**
 * Handler for HTTP Get - receives a source and target coordinate and returns an operationId
 */
export const getOperationId = async (event) => {
  if (event.httpMethod !== 'GET') {
    throw new Error(`getOperationId only accepts GET method, you tried: ${event.httpMethod} method.`);
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
    throw new Error('Missing source or target parameters.');
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
        status: "in-progress", 
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

      invokeCompute(item);
  
      console.log("Success - item created");
    }

  } catch (err) {
    console.error("Error", err.stack);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Operation Id ${item.operationId} was created. Please query it to find your results.`,
    })
  };
};

