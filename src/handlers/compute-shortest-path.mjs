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
    const res = { x: algebraic.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0), y: parseInt(algebraic[1], 10) - 1 };
    return res
  }

  // Convert zero-based coordinates to algebraic notation
  function toAlgebraic(coords) {
    const res = String.fromCharCode('a'.charCodeAt(0) + coords.x) + (coords.y + 1);
    return res
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

  // Breadth-first search to find the shortest path from source to dest
  const start = toCoords(source);
  const startPos =`${start.x},${start.y}`;
  const end = toCoords(dest);
  const queue = [{ ...start, path: [toAlgebraic(start)] }];
  const visited = new Set();
  visited.add(startPos)

  while (queue.length > 0) {
    const current = queue.shift();

    if (current.x === end.x && current.y === end.y) {
      return { length: current.path.length - 1, path: current.path.join(':').toUpperCase() };
    }

    moves.forEach(move => {
      const next = {
        x: current.x + move.x,
        y: current.y + move.y,
        path: [...current.path, toAlgebraic({ x: current.x + move.x, y: current.y + move.y })]
      };
      const nextPos = `${next.x},${next.y}`
      if (isValid(next) && !visited.has(nextPos)) {
        queue.push(next);
        visited.add(nextPos)
      }
    });
  }
  return { length: -1, path: "" };
}

// handler for compute-shortest-path - invokes the shortestPath function and updates the DynamoDB table with the result
export const computeShortestPath = async (payload) => {
  const { length: numberOfMoves, path } = shortestPath(payload.starting, payload.ending);

  const params = {
    TableName: tableName,
    Key: { id: payload.id },
    UpdateExpression: 'set operationStatus = :s, numberOfMoves = :n, shortestPath = :p',
    ExpressionAttributeValues: {
      ':s': 'completed',
      ':n': numberOfMoves,
      ':p': path
    },
    ReturnValues: 'UPDATED_NEW'
  };
  try {
    await ddbDocClient.send(new UpdateCommand(params));
  } catch (err) {
    console.log("Error", err);
    return false
  }
  return true
}


