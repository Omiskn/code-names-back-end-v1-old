import { createBoard } from "./createBoard.js";
import { GAME_PHASES } from "../constants.js";

export function createGame(words) {
  const boardData = createBoard(words);

  const { startingTeam, cards } = boardData;

  const redRemaining = cards.filter((c) => c.type === "red").length;
  const blueRemaining = cards.filter((c) => c.type === "blue").length;

  return {
    board: {
      startingTeam,
      cards,
    },

    currentTurn: startingTeam,

    phase: GAME_PHASES.SPYMASTER,

    clue: null,

    guessesLeft: 0,

    winner: null,

    remaining: {
      red: redRemaining,
      blue: blueRemaining,
    },

    logs: [],
  };
}
