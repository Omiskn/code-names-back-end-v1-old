import { GAME_PHASES } from "../constants.js";
import { generateCurrentLog } from "../utils/generateLogs.js";

export function applyClue(game, player, clueWord, number) {
  if (
    !player ||
    game.phase !== GAME_PHASES.SPYMASTER ||
    player.team?.toLowerCase() !== game.currentTurn?.toLowerCase() ||
    player.role?.toLowerCase() !== "spymaster"
  ) {
    console.log("Cannot give clue: unauthorized role, wrong turn, or wrong phase");
    return game;
  }

  const cleanClue = typeof clueWord === "string" ? clueWord.trim() : "";
  const num = Number(number);
  if (!cleanClue || isNaN(num) || num < 0 || num > 25) {
    console.log("Invalid clue word or number");
    return game;
  }

  const log = generateCurrentLog(player, cleanClue);
  game.logs.push(log);

  return {
    ...game,
    clue: cleanClue,
    guessesLeft: num + 1, // Official rules: clue number + 1 bonus guess
    phase: GAME_PHASES.GUESSING,
  };
}
