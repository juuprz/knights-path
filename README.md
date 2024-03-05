# knights-path
knights-path

## Key Design Choices and Implementation
This project implements a serverless architecture using AWS Lambda, API Gateway, and DynamoDB to calculate and store the shortest path a knight can take on a chessboard. The key components of the system are two Lambda functions: `postOperationId` and `computeShortestPath`.

### 1. Asynchronous Processing
To ensure a responsive API, the path calculation is performed asynchronously. The `postOperationId` function initiates the process by storing the request in DynamoDB with a status of "in-progress" and then invokes the `computeShortestPath` function using an asynchronous Lambda invocation (`InvocationType: 'Event'`). This allows the API to quickly return a response to the client while the computation is performed in the background.

### 2. Secondary Index in DynamoDB
A global secondary index on the operationId attribute is used in the DynamoDB table. This allows for efficient querying of operation status and results based on the unique operationId, enabling clients to check the progress and outcome of their requests.

### 3. Modular Function Design
The system is designed with separate functions for initiating the path calculation and performing the computation. This modular approach enhances maintainability and scalability. The `computeShortestPath` function can be updated or replaced independently of the API interface, provided by the `postOperationId` function.

### 4. Error Handling
Both Lambda functions include error handling to manage exceptions during the database operations and the path computation. This ensures that any issues are logged and that the system can respond gracefully to errors.

### 5. Simple Table Schema
The DynamoDB table uses a simple schema with id as the primary key and operationId as the secondary index. This keeps the data model straightforward and aligned with the requirements of the application.