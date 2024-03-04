"use strict";
// Create clients and set shared const values outside of the handler.
Object.defineProperty(exports, "__esModule", { value: true });
exports.putItemHandler = void 0;
// Create a DocumentClient that represents the query to add an item
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client = new client_dynamodb_1.DynamoDBClient({});
const ddbDocClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
// Get the DynamoDB table name from environment variables
const tableName = process.env.SAMPLE_TABLE;
/**
 * A simple example includes a HTTP post method to add one item to a DynamoDB table.
 */
const putItemHandler = async (event) => {
    if (event.httpMethod !== 'POST') {
        throw new Error(`postMethod only accepts POST method, you tried: ${event.httpMethod} method.`);
    }
    // All log statements are written to CloudWatch
    console.info('received:', event);
    // Get id and name from the body of the request
    const body = JSON.parse(event.body);
    const id = body.id;
    const name = body.name;
    // Creates a new item, or replaces an old item with a new item
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property
    var params = {
        TableName: tableName,
        Item: { id: id, name: name }
    };
    try {
        const data = await ddbDocClient.send(new lib_dynamodb_1.PutCommand(params));
        console.log("Success - item added or updated", data);
    }
    catch (err) {
        console.log("Error", err.stack);
    }
    const response = {
        statusCode: 200,
        body: JSON.stringify(body)
    };
    // All log statements are written to CloudWatch
    console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
    return response;
};
exports.putItemHandler = putItemHandler;
