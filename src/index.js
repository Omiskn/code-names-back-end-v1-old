import express from "express";
import http from "http";
import { initSocket } from "./socket/index.js";
import { gameSocketHandlers } from "./socket/handlers/gameHandlers.js";
import { roomSocketHandlers } from "./socket/handlers/roomHandlers.js";

const app = express();
const server = http.createServer(app);
const io = initSocket(server);

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  roomSocketHandlers(socket);
  gameSocketHandlers(socket);
});

server.listen(3001, "0.0.0.0", () =>
  console.log("Server running on port 3000"),
);
