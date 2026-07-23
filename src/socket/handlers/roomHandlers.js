// server/src/sockets/roomHandlers.js
import RoomManager, { rooms } from "../../rooms/RoomManager.js";
import { SOCKET_EVENTS } from "../events.js";
import { getIO } from "../index.js";
import { buildSafeRoom } from "./gameHandlers.js";

export function roomSocketHandlers(socket) {
  // إنشاء الغرفة
  socket.on(SOCKET_EVENTS.CREATE_ROOM, ({ playerId, roomId, playerName }) => {
    const room = RoomManager.createRoom(roomId, {
      id: playerId,
      socketId: socket.id,
      name: playerName,
    });

    // إضافة الهوستر كلاعب
    room.addPlayer({ playerId, socketId: socket.id, name: playerName });

    socket.join(roomId);

    // تحديث كل اللاعبين في الغرفة
    getIO().to(roomId).emit(SOCKET_EVENTS.ROOM_UPDATE, room.players);
  });

  socket.on(SOCKET_EVENTS.GET_ROOM_STATE, ({ roomId, playerId }) => {
    const room = RoomManager.getRoom(roomId);
    if (!room) return;

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return;

    // Join room
    socket.join(roomId);

    // Update socketId (reconnect handling)
    player.socketId = socket.id;

    if (room.hoster.id === playerId) {
      room.hoster.socketId = socket.id;
    }

    // Send safe state only to this player
    const safeRoom = buildSafeRoom(room, playerId);
    socket.emit(SOCKET_EVENTS.SEND_ROOM_STATE, safeRoom);

    // Update players list for everyone
    getIO().to(roomId).emit(SOCKET_EVENTS.ROOM_UPDATE, room.players);
  });

  socket.on(SOCKET_EVENTS.JOIN_ROOM, ({ playerId, roomId, playerName }) => {
    const room = RoomManager.getRoom(roomId);
    if (!room) {
      console.log("This room does not exist!");
      return;
    }

    room.addPlayer({ playerId, socketId: socket.id, name: playerName });
    socket.join(roomId);

    getIO().to(roomId).emit(SOCKET_EVENTS.ROOM_UPDATE, room.players);
  });

  // اختيار الفريق
  socket.on(SOCKET_EVENTS.SELECT_TEAM, ({ roomId, playerId, team }) => {
    const room = RoomManager.getRoom(roomId);
    if (!room) return;

    RoomManager.setPlayerTeam(roomId, playerId, team);

    getIO().to(roomId).emit(SOCKET_EVENTS.ROOM_UPDATE, room.players);
  });

  // اختيار الدور
  socket.on(SOCKET_EVENTS.SELECT_ROLE, ({ roomId, playerId, role }) => {
    const room = RoomManager.getRoom(roomId);
    if (!room) return;

    RoomManager.setPlayerRole(roomId, playerId, role);
    getIO().to(roomId).emit(SOCKET_EVENTS.ROOM_UPDATE, room.players);
  });

  // تغيير حالة الاستعداد
  socket.on(SOCKET_EVENTS.TOGGLE_READY, ({ roomId, playerId }) => {
    const room = RoomManager.getRoom(roomId);
    if (!room) return;

    RoomManager.toggleReady(roomId, playerId);
    getIO().to(roomId).emit(SOCKET_EVENTS.ROOM_UPDATE, room.players);
  });

  // بدء اللعبة (للhoster فقط)
  //   socket.on(SOCKET_EVENTS.START_GAME, ({ roomId, playerId }) => {
  //     const room = RoomManager.getRoom(roomId);
  //     if (!room) return;

  //     if (room.hoster.id !== playerId) {
  //       console.log("Only host can start the game!");
  //       return;
  //     }

  //     if (!room.canStartGame()) {
  //       console.log(
  //         "Cannot start game: not all players ready or missing Spymaster"
  //       );
  //       return;
  //     }

  //     // هنا يمكن إضافة منطق إنشاء البورد
  //     // room.game = generateBoard();
  //     room.status = "playing";

  //     getIO().to(roomId).emit(SOCKET_EVENTS.ROOM_UPDATE, room.players);
  //     getIO().to(roomId).emit(SOCKET_EVENTS.START_GAME, room.game);
  //     console.log(`Game started in room: ${roomId}`);
  //   });

  // قطع الاتصال
  socket.on("disconnect", () => {
    // const player = room.players.find((p) => p.socketId === socket.id);
    // if (player) {
    //   player.socketId = null; // فقط علّمه disconnected
    console.log("disconnect socket.id:", socket.id);

    for (const room of rooms.values()) {
      // for (const p of room.players) {
      //   console.log("player socket:", p.socketId);
      // }

      const player = room.getPlayer(socket.id);
      console.log("found player:", player);

      if (player) {
        // room.removePlayer(socket.id);
        if (room.hoster.socketId === socket.id) room.hoster.socketId = null;
        player.socketId = null;
        getIO().to(room.id).emit(SOCKET_EVENTS.ROOM_UPDATE, room.players);
      }
    }

    // }
    // for (const room of rooms.values()) {
    //   console.log(room);
    //   const player = room.getPlayer(socket.id);
    //   console.log(player, socket.id);
    //   if (player) {
    //     // room.removePlayer(socket.id);
    //     if (room.hoster.socketId === socket.id) room.hoster.socketId = null;
    //     player.socketId = null;
    //     getIO().to(room.id).emit(SOCKET_EVENTS.ROOM_UPDATE, room.players);
    //   }
    // }
  });
}
