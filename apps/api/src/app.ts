/* eslint-disable @typescript-eslint/no-explicit-any */
import { createNodeWebSocket } from "@hono/node-ws";
import type { WSContext } from "hono/ws";
import createApp from "@/lib/create-app";

const app = createApp();

export const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({
  app,
});

const rooms = new Map<string, Map<string, WSContext<WebSocket>>>();

app.get("/", (c) => {
  return c.json({ message: "Welcome to Hey Odama API!" });
});

app.get(
  "/ws",
  upgradeWebSocket((c) => {
    const roomId = c.req.query("room")?.trim() || "default";
    const clientId = crypto.randomUUID();

    // Initialize room if not exists
    let clientMap = rooms.get(roomId);
    if (!clientMap) {
      clientMap = new Map();
      rooms.set(roomId, clientMap);
    }

    return {
      onOpen(_evt, ws) {
        clientMap!.set(clientId, ws);
        console.log(`Client ${clientId} joined room ${roomId}`);

        // 1. Tell the new client who is already here
        ws.send(
          JSON.stringify({
            type: "joined",
            clientId,
            roomId,
            peers: [...clientMap!.keys()].filter((id) => id !== clientId),
          }),
        );

        // 2. Tell everyone else a new peer joined
        broadcastToRoom(roomId, clientId, {
          type: "peer-joined",
          peerId: clientId,
        });
      },

      onMessage(evt, ws) {
        try {
          const msg = JSON.parse(evt.data.toString());

          // Heartbeat
          if (msg.type === "ping") {
            ws.send(JSON.stringify({ type: "pong" }));
            return;
          }

          // Signaling relay
          if (msg.targetId) {
            const targetWs = clientMap!.get(msg.targetId);
            if (targetWs && targetWs.readyState === 1) {
              // Forward the message, attaching the sender's ID
              targetWs.send(JSON.stringify({ ...msg, fromId: clientId }));
            }
          }
        } catch (e) {
          console.error("Error parsing message", e);
        }
      },

      onClose() {
        console.log(`Client ${clientId} left room ${roomId}`);
        clientMap!.delete(clientId);

        // Notify others
        broadcastToRoom(roomId, clientId, {
          type: "peer-left",
          peerId: clientId,
        });

        if (clientMap!.size === 0) {
          rooms.delete(roomId);
        }
      },
    };
  }),
);

// Helper to broadcast to everyone except sender
function broadcastToRoom(roomId: string, senderId: string, message: any) {
  const clientMap = rooms.get(roomId);
  if (!clientMap) return;

  clientMap.forEach((ws, cid) => {
    if (cid !== senderId && ws.readyState === 1) {
      ws.send(JSON.stringify(message));
    }
  });
}

export default app;
