// Create clients and set shared const values outside of the handler.

// Create a DocumentClient that represents the query to add an item
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.SAMPLE_TABLE;

function shortestPath(source, dest) {
  // Convert algebraic notation to zero-based coordinates
  function toCoords(algebraic) {
    return { x: algebraic.charCodeAt(0) - 'a'.charCodeAt(0), y: parseInt(algebraic[1], 10) - 1 };
  }

  // Convert zero-based coordinates to algebraic notation
  function toAlgebraic(coords) {
    return String.fromCharCode('a'.charCodeAt(0) + coords.x) + (coords.y + 1);
  }

  // Check if the given coordinates are within the bounds of the chessboard
  function isValid({ x, y }) {
    return x >= 0 && x < 8 && y >= 0 && y < 8;
  }

  // Max of 8 moves from any position
  const moves = [
    { x: -2, y: -1 }, { x: -2, y: 1 },
    { x: -1, y: -2 }, { x: -1, y: 2 },
    { x: 1, y: -2 }, { x: 1, y: 2 },
    { x: 2, y: -1 }, { x: 2, y: 1 }
  ];

  const start = toCoords(source);
  const end = toCoords(dest);
  const queue = [{ ...start, path: [start] }];
  const visited = new Set();

  while (queue.length > 0) {
    const current = queue.shift();
    const currentPos = `${current.x},${current.y}`;

    if (visited.has(currentPos)) continue;
    visited.add(currentPos);

    if (current.x === end.x && current.y === end.y) {
      // Convert path to algebraic notation
      const path = current.path.map(toAlgebraic);
      return { length: path.length - 1, path };
    }

    moves.forEach(move => {
      const next = { x: current.x + move.x, y: current.y + move.y, path: [...current.path, { x: current.x + move.x, y: current.y + move.y }] };
      if (isValid(next) && !visited.has(`${next.x},${next.y}`)) {
        queue.push(next);
      }
    });
  }
  return { length: -1, path: [] };
}

// handler for compute-shortest-path - invokes the shortestPath function and updates the DynamoDB table with the result
export const computeShortestPath = async (payload) => {
  console.log('>>>> Invoking computeShortestPath function with payload:', payload);
  const { length: numberOfMoves, path } = shortestPath(payload.source, payload.target);

  const params = {
    TableName: tableName,
    Key: { id: payload.id },
    UpdateExpression: 'set status = :s, numberOfMoves = :n, shortestPath = :p',
    ExpressionAttributeValues: {
      ':s': 'completed',
      ':n': numberOfMoves,
      ':p': path
    },
    ReturnValues: 'UPDATED_NEW'
  };
  try {
    console.log('Updating the item...', params);
    await ddbDocClient.send(new UpdateCommand(params));
  } catch (err) {
    console.log("Error", err);
    return false
  }
  return true
}


