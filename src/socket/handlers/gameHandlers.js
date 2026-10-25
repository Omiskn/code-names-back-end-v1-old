import { applyClue } from "../../game-engine/applyClue.js";
import { selectWord } from "../../game-engine/selectWord.js";
import { getIO } from "../index.js";
import RoomManager from "../../rooms/RoomManager.js";
import { SOCKET_EVENTS } from "../events.js";
import { createGame } from "../../game-engine/createGame.js";
import ar_words from "../../words/ar-words.js";
import { endTurn } from "../../game-engine/endTurn.js";

export function buildSafeRoom(room, playerId) {
  if (!room) return null;
  const player = room.players.find((p) => p.id === playerId);

  if (!room.game) return room;

  const isSpymaster = player?.role?.toLowerCase() === "spymaster";
  const isFinished = room.game.phase === "finished";

  const safeBoard = room.game.board.cards.map((card) => {
    if (isSpymaster || isFinished) {
      return card;
    }

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
  return room?.players?.find((p) => p.id === playerId);
}

function broadcastSafeGame(room) {
  room.players.forEach((player) => {
    if (player.socketId) {
      const safeRoom = buildSafeRoom(room, player.id);
      getIO().to(player.socketId).emit(SOCKET_EVENTS.GAME_UPDATE, safeRoom);
    }
  });
}

export function gameSocketHandlers(socket) {
  socket.on(SOCKET_EVENTS.START_GAME, (payload) => {
    const roomId = typeof payload === "object" ? payload.roomId : payload;
    const playerId = typeof payload === "object" ? payload.playerId : null;

    const room = RoomManager.getRoom(roomId);
    if (!room) {
      socket.emit("game_error", "Room not found.");
      return;
    }

    if (playerId && room.hoster?.id && room.hoster.id !== playerId) {
      socket.emit("game_error", "Only the host can start the game.");
      return;
    }

    const startError = room.getStartGameError ? room.getStartGameError() : null;
    if (startError) {
      socket.emit("game_error", startError);
      return;
    }

    room.status = "playing";
    room.game = createGame(ar_words);

    broadcastSafeGame(room);
    getIO().to(roomId).emit("isGameStarted", true);
  });

  socket.on(SOCKET_EVENTS.SEND_CLUE, ({ roomId, playerId, clue, number }) => {
    const room = RoomManager.getRoom(roomId);
    if (!room || !room.game) return;

    const player = getPlayer(room, playerId);
    if (!player) return;

    room.game = applyClue(room.game, player, clue, number);
    broadcastSafeGame(room);
  });

  socket.on(SOCKET_EVENTS.SELECT_WORD, ({ roomId, playerId, cardId }) => {
    const room = RoomManager.getRoom(roomId);
    if (!room || !room.game) return;

    const player = getPlayer(room, playerId);
    if (!player) return;

    room.game = selectWord(room.game, player, cardId);
    broadcastSafeGame(room);
  });

  socket.on(SOCKET_EVENTS.END_TURN, ({ roomId, playerId }) => {
    const room = RoomManager.getRoom(roomId);
    if (!room || !room.game) return;

    const player = getPlayer(room, playerId);
    if (!player) return;

    if (
      room.game.phase !== "guessing" ||
      room.game.currentTurn?.toLowerCase() !== player.team?.toLowerCase() ||
      player.role?.toLowerCase() === "spymaster"
    ) {
      return;
    }

    room.game = endTurn(room.game, player);

    const log = {
      message: `${player.name} ended turn`,
      team: player.team,
      cardType: null,
    };

    room.game.logs.push(log);
    broadcastSafeGame(room);
  });
}
