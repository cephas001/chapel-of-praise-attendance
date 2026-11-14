// backend/sseHub.js
// Shared in-memory registry for all open SSE streams.
// Key = user_id, Value = Set of Express response objects (one per tab/device).
const connectedClients = new Map();

const getOrCreateConnections = (userId) => {
  if (!connectedClients.has(userId)) {
    connectedClients.set(userId, new Set());
  }

  return connectedClients.get(userId);
};

const writeEvent = (res, serializedPayload) => {
  if (res.writableEnded || res.destroyed) return;

  try {
    res.write(`data: ${serializedPayload}\n\n`);
  } catch {
    // A broken pipe is cleaned up by the stream's close handler.
  }
};

const registerClient = (userId, res) => {
  getOrCreateConnections(userId).add(res);
};

const unregisterClient = (userId, res) => {
  const connections = connectedClients.get(userId);
  if (!connections) return;

  connections.delete(res);

  if (connections.size === 0) {
    connectedClients.delete(userId);
  }
};

const sendToUser = (userId, payload) => {
  const connections = connectedClients.get(userId);
  if (!connections || connections.size === 0) return;

  const serializedPayload = JSON.stringify(payload);
  connections.forEach((res) => writeEvent(res, serializedPayload));
};

// Used when an account is deleted/disabled so an already-open stream cannot
// keep receiving broadcasts after the user record is gone.
const closeUserConnections = (userId) => {
  const connections = connectedClients.get(userId);
  if (!connections) return;

  connectedClients.delete(userId);
  connections.forEach((res) => {
    try {
      res.end();
    } catch {
      // The connection may already be closed by the client.
    }
  });
};

// Used for application-wide events such as EVENT_STATUS transitions.
const broadcastToAll = (payload) => {
  if (connectedClients.size === 0) return;

  const serializedPayload = JSON.stringify(payload);

  connectedClients.forEach((connections) => {
    connections.forEach((res) => writeEvent(res, serializedPayload));
  });
};

module.exports = {
  registerClient,
  unregisterClient,
  sendToUser,
  broadcastToAll,
  closeUserConnections,
};
