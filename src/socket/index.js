import { Server } from "socket.io";

let io;

export function initSocket(server) {
  const allowedOrigin = process.env.CLIENT_URL || "*";
  io = new Server(server, {
    cors: {
      origin: allowedOrigin,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
}
