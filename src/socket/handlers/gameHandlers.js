import { applyClue } from "../../game-engine/applyClue.js";
import { selectWord } from "../../game-engine/selectWord.js";
import { getIO } from "../index.js";
import RoomManager from "../../rooms/RoomManager.js";
import { SOCKET_EVENTS } from "../events.js";
import { createGame } from "../../game-engine/createGame.js";
import ar_words from "../../words/ar-words.js";
import { endTurn } from "../../game-engine/endTurn.js";

export function buildSafeRoom(room, playerId) {
  const player = room.players.find((p) => p.id === playerId);

  if (!room.game) return room;

  const safeBoard = room.game.board.cards.map((card) => {
    if (
      player.role?.toUpperCase() === "SPYMASTER" ||
      room.game.phase === "finished"
    ) {
      return card; // يشوف كل شيء
    }

    // Operative
    return {
      id: card.id,
      word: card.word,
      revealed: card.revealed,
      type: card.revealed ? card.type : null,
    };
  });

  return {
    ...room,
    game: {
      ...room.game,
      board: { startingTeam: room.game.board.startingTeam, cards: safeBoard },
    },
  };
}

function getPlayer(room, playerId) {
  return room.players.find((p) => p.id === playerId);
}

export function gameSocketHandlers(socket) {
  socket.on(SOCKET_EVENTS.START_GAME, (roomId) => {
    const room = RoomManager.getRoom(roomId);
    if (!room) return;

    // if (room.hoster.id !== playerId) {
    //   console.log("Only host can start the game!");
    //   return;
    // }

    const isTheGameStarted = RoomManager.canStartGame(roomId);
    if (!isTheGameStarted) return;

    room.game = createGame(ar_words);

    room.players.forEach((player) => {
      const safeRoom = buildSafeRoom(room, player.id);
      getIO().to(player.socketId).emit(SOCKET_EVENTS.GAME_UPDATE, safeRoom);
    });

    getIO().to(roomId).emit("isGameStarted", true);
  });

  socket.on(SOCKET_EVENTS.SEND_CLUE, ({ roomId, playerId, clue, number }) => {
    const room = RoomManager.getRoom(roomId);
    if (!room) return;

    const player = getPlayer(room, playerId);
    if (!player) return;

    room.game = applyClue(room.game, player, clue, number);

    room.players.forEach((player) => {
      const safeRoom = buildSafeRoom(room, player.id);
      getIO().to(player.socketId).emit(SOCKET_EVENTS.GAME_UPDATE, safeRoom);
    });
  });

  socket.on(SOCKET_EVENTS.SELECT_WORD, ({ roomId, playerId, cardId }) => {
    const room = RoomManager.getRoom(roomId);
    if (!room) return;

    const player = getPlayer(room, playerId);

    room.game = selectWord(room.game, player, cardId);

    room.players.forEach((player) => {
      const safeRoom = buildSafeRoom(room, player.id);
      getIO().to(player.socketId).emit(SOCKET_EVENTS.GAME_UPDATE, safeRoom);
    });
  });

  socket.on(SOCKET_EVENTS.END_TURN, ({ roomId, playerId }) => {
    const room = RoomManager.getRoom(roomId);
    if (!room) return;

    const player = getPlayer(room, playerId);

    if (
      room.game.currentTurn !== player.team ||
      player.role.toLowerCase() === "spymaster"
    )
      return;

    room.game = endTurn(room.game, player);

    const log = {
      message: `${player.name} ends turn`,
      team: player.team,
      cardType: null,
    };

    room.game.logs.push(log);
    console.log(room.game);

    room.players.forEach((player) => {
      const safeRoom = buildSafeRoom(room, player.id);
      getIO().to(player.socketId).emit(SOCKET_EVENTS.GAME_UPDATE, safeRoom);
    });
  });
}
