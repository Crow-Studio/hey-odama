/* eslint-disable @typescript-eslint/no-explicit-any */
import { serve } from "@hono/node-server";
import { createNodeWebSocket } from "@hono/node-ws";
import { Hono } from "hono";
import type { WSContext } from "hono/ws";

const app = new Hono();

// Store clients: RoomID -> Map<ClientId, WebSocket>
const rooms = new Map<string, Map<string, WSContext<WebSocket>>>();

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

app.get("/", (c) => c.text("WebRTC Signaling Server Running"));

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

const server = serve(
  { fetch: app.fetch, port: 4000, hostname: "0.0.0.0" },
  (info) => {
    console.log(`Signaling Server listening on ws://${info.address}:4000/ws`);
  },
);
injectWebSocket(server);
