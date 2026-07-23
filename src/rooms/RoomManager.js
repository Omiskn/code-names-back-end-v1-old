// server/src/rooms/RoomManager.js

class Player {
  constructor(playerId, socketId, name) {
    this.id = playerId;
    this.socketId = socketId;
    this.name = name;
    this.team = null; // RED | BLUE | null
    this.role = null; // SPYMASTER | OPERATIVE | null
    this.isReady = false;
  }
}

class Room {
  constructor(id, hoster) {
    this.id = id;
    this.hoster = hoster ?? null; // { id, name }
    this.players = [];
    this.game = null; // هنا نخزن Game State من shared/game-engine
  }

  addPlayer({ playerId, socketId, name }) {
    const existing = this.players.find((p) => p.id === playerId);

    if (existing) {
      // رجع حدث السوكيت فقط (إعادة اتصال)

      if (existing.socketId) {
        return existing;
      }

      existing.socketId = socketId;
      existing.name = name;
      return existing;
    }

    const newPlayer = new Player(playerId, socketId, name);
    this.players.push(newPlayer);
    return newPlayer;
  }

  removePlayer(playerId) {
    this.players = this.players.filter((p) => p.id !== playerId);
  }

  setPlayerTeam(playerId, team) {
    const player = this.players.find((p) => p.id === playerId);
    if (player) player.team = team;
  }

  setPlayerRole(playerId, role) {
    const player = this.players.find((p) => p.id === playerId);
    if (player) player.role = role;
  }

  toggleReady(playerId) {
    const player = this.players.find((p) => p.id === playerId);
    if (player) player.isReady = !player.isReady;
  }

  getPlayer(socketId) {
    return this.players.find((p) => {
      console.log("compare:", p.socketId, socketId, p.socketId === socketId);
      return p.socketId === socketId;
    });
  }

  canStartGame() {
    const allReady = this.players.every((p) => p.isReady);

    const redSpymaster = this.players.some(
      (p) => p.team === "red" && p.role === "spymaster"
    );
    const blueSpymaster = this.players.some(
      (p) => p.team === "blue" && p.role === "spymaster"
    );

    // && redSpymaster && blueSpymaster;

    return allReady;
  }

  // Optional: helper for teams
  getPlayersByTeam(team) {
    return this.players.filter((p) => p.team === team);
  }
}

const rooms = new Map();

const RoomManager = {
  createRoom(id, hoster) {
    rooms.set(id, new Room(id, hoster));
    return rooms.get(id);
  },

  getRoom(id) {
    return rooms.get(id);
  },

  deleteRoom(id) {
    rooms.delete(id);
  },

  addPlayer(roomId, player) {
    const room = rooms.get(roomId);
    if (room) return room.addPlayer(player);
  },

  removePlayer(roomId, playerId) {
    const room = rooms.get(roomId);
    if (room) room.removePlayer(playerId);
  },

  setPlayerTeam(roomId, playerId, team) {
    const room = rooms.get(roomId);
    if (room) room.setPlayerTeam(playerId, team);
  },

  setPlayerRole(roomId, playerId, role) {
    const room = rooms.get(roomId);
    if (room) room.setPlayerRole(playerId, role);
  },

  toggleReady(roomId, playerId) {
    const room = rooms.get(roomId);
    if (room) room.toggleReady(playerId);
  },

  canStartGame(roomId) {
    const room = rooms.get(roomId);
    if (!room) return false;
    return room.canStartGame();
  },
};

export { rooms };
export default RoomManager;
