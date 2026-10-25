// server/src/sockets/roomHandlers.js
import RoomManager, { rooms } from "../../rooms/RoomManager.js";
import { SOCKET_EVENTS } from "../events.js";
import { getIO } from "../index.js";
import { buildSafeRoom } from "./gameHandlers.js";

export function roomSocketHandlers(socket) {
  // Create room
  socket.on(SOCKET_EVENTS.CREATE_ROOM, ({ playerId, roomId, playerName }) => {
    if (!playerId || !roomId || !playerName) return;

    const room = RoomManager.createRoom(roomId, {
      id: playerId,
      socketId: socket.id,
      name: playerName,
    });

    room.addPlayer({ playerId, socketId: socket.id, name: playerName });
    socket.join(roomId);
    getIO().to(roomId).emit(SOCKET_EVENTS.ROOM_UPDATE, room.players);
  });

  socket.on(SOCKET_EVENTS.GET_ROOM_STATE, ({ roomId, playerId }) => {
    if (!roomId || !playerId) return;

    const room = RoomManager.getRoom(roomId);
    if (!room) {
      socket.emit("room_error", "Room not found");
      return;
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return;

    socket.join(roomId);

    player.socketId = socket.id;
    if (room.hoster && room.hoster.id === playerId) {
      room.hoster.socketId = socket.id;
    }

    const safeRoom = buildSafeRoom(room, playerId);
    socket.emit(SOCKET_EVENTS.SEND_ROOM_STATE, safeRoom);
    getIO().to(roomId).emit(SOCKET_EVENTS.ROOM_UPDATE, room.players);
  });

  socket.on(SOCKET_EVENTS.JOIN_ROOM, ({ playerId, roomId, playerName }) => {
    if (!roomId || !playerId || !playerName) return;

    const room = RoomManager.getRoom(roomId);
    if (!room) {
      socket.emit("room_error", "This room does not exist!");
      return;
    }

    room.addPlayer({ playerId, socketId: socket.id, name: playerName });
    socket.join(roomId);
    getIO().to(roomId).emit(SOCKET_EVENTS.ROOM_UPDATE, room.players);
  });

  // Select team
  socket.on(SOCKET_EVENTS.SELECT_TEAM, ({ roomId, playerId, team }) => {
    if (!roomId || !playerId) return;
    const room = RoomManager.getRoom(roomId);
    if (!room) return;

    RoomManager.setPlayerTeam(roomId, playerId, team);
    getIO().to(roomId).emit(SOCKET_EVENTS.ROOM_UPDATE, room.players);
  });

  // Select role
  socket.on(SOCKET_EVENTS.SELECT_ROLE, ({ roomId, playerId, role }) => {
    if (!roomId || !playerId) return;
    const room = RoomManager.getRoom(roomId);
    if (!room) return;

    RoomManager.setPlayerRole(roomId, playerId, role);
    getIO().to(roomId).emit(SOCKET_EVENTS.ROOM_UPDATE, room.players);
  });

  // Toggle ready status
  socket.on(SOCKET_EVENTS.TOGGLE_READY, ({ roomId, playerId }) => {
    if (!roomId || !playerId) return;
    const room = RoomManager.getRoom(roomId);
    if (!room) return;

    RoomManager.toggleReady(roomId, playerId);
    getIO().to(roomId).emit(SOCKET_EVENTS.ROOM_UPDATE, room.players);
  });

  // Disconnect handler
  socket.on("disconnect", () => {
    for (const room of rooms.values()) {
      const player = room.getPlayer(socket.id);
      if (player) {
        if (room.hoster && room.hoster.socketId === socket.id) {
          room.hoster.socketId = null;
        }
        player.socketId = null;
        getIO().to(room.id).emit(SOCKET_EVENTS.ROOM_UPDATE, room.players);
      }
    }
  });
}
