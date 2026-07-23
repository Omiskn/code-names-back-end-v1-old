// export const SOCKET_EVENTS = {
//   JOIN_ROOM: "join_room",
//   LEAVE_ROOM: "leave_room",
//   CREATE_ROOM: "create_room",
//   START_GAME: "start_game",
//   SEND_CLUE: "send_clue",
//   SELECT_WORD: "select_word",
//   UPDATE_GAME: "update_game",
//   ROOM_UPDATE: "room_update",
// };

export const SOCKET_EVENTS = {
  CREATE_ROOM: "create_room",
  SEND_ROOM_STATE: "send_room_state",
  GET_ROOM_STATE: "GET_ROOM_STATE",
  JOIN_ROOM: "join_room",
  LEAVE_ROOM: "leave_room",
  ROOM_UPDATE: "room_update",
  SELECT_TEAM: "select_team",
  SELECT_ROLE: "select_role",
  TOGGLE_READY: "toggle_ready",
  START_GAME: "start_game",
  SEND_CLUE: "send_clue",
  SELECT_WORD: "select_word",
  GAME_UPDATE: "game_update",
  END_TURN: "end_turn",
  UPDATE_PLAYERS: "UPDATE_PLAYERS", // البورد و الحالة أثناء اللعب
};
