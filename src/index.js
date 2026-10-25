import express from "express";
import http from "http";
import { initSocket } from "./socket/index.js";
import { gameSocketHandlers } from "./socket/handlers/gameHandlers.js";
import { roomSocketHandlers } from "./socket/handlers/roomHandlers.js";

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const server = http.createServer(app);
const io = initSocket(server);

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  roomSocketHandlers(socket);
  gameSocketHandlers(socket);
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on port ${PORT}`),
);

process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
