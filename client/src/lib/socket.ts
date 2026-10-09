import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '@sail/shared';
import { io, type Socket } from 'socket.io-client';

export type SailSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const URL = import.meta.env.VITE_SERVER_URL ?? undefined;

let socket: SailSocket | null = null;

export function getSocket(): SailSocket {
  if (!socket) {
    socket = io(URL ?? '/', {
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}
