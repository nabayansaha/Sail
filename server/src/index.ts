import cors from 'cors';
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from '@sail/shared';
import { RoomManager } from './roomManager.js';
import { InMemoryRoomStore } from './roomStore.js';
import { registerSocketHandlers } from './socketHandlers.js';

const PORT = Number(process.env.PORT ?? 3001);

const app = express();
app.use(cors({ origin: true }));
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

const httpServer = createServer(app);
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: { origin: true },
});

const roomManager = new RoomManager(new InMemoryRoomStore());
registerSocketHandlers(io, roomManager);

httpServer.listen(PORT, () => {
  console.log(`Sail server listening on http://localhost:${PORT}`);
});
