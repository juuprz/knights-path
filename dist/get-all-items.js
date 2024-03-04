"use strict";
// Create clients and set shared const values outside of the handler.
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllItemsHandler = void 0;
// Create a DocumentClient that represents the query to add an item
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client = new client_dynamodb_1.DynamoDBClient({});
const ddbDocClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
// Get the DynamoDB table name from environment variables
const tableName = process.env.SAMPLE_TABLE;
/**
 * A simple example includes a HTTP get method to get all items from a DynamoDB table.
 */
const getAllItemsHandler = async (event) => {
    if (event.httpMethod !== 'GET') {
        throw new Error(`getAllItems only accept GET method, you tried: ${event.httpMethod}`);
    }
    // All log statements are written to CloudWatch
    console.info('received:', event);
    // get all items from the table (only first 1MB data, you can use `LastEvaluatedKey` to get the rest of data)
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#scan-property
    // https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Scan.html
    var params = {
        TableName: tableName
    };
    try {
        const data = await ddbDocClient.send(new lib_dynamodb_1.ScanCommand(params));
        var items = data.Items;
    }
    catch (err) {
        console.log("Error", err);
    }
    const response = {
        statusCode: 200,
        body: JSON.stringify(items)
    };
    // All log statements are written to CloudWatch
    console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
    return response;
};
exports.getAllItemsHandler = getAllItemsHandler;
