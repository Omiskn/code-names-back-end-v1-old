import { GAME_PHASES } from "../constants.js";

export function endTurn(game) {
  if (game.winner) {
    return {
      ...game,
      phase: GAME_PHASES.FINISHED,
    };
  }

  const nextTurn = game.currentTurn === "red" ? "blue" : "red";

  return {
    ...game,
    currentTurn: nextTurn,
    phase: GAME_PHASES.SPYMASTER,
    clue: null,
    guessesLeft: 0,
  };
}
