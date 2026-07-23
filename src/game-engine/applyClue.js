import { GAME_PHASES } from "../constants.js";
import { generateCurrentLog } from "../utils/generateLogs.js";

export function applyClue(game, player, clueWord, number) {
  // تحقق من صحة المرحلة
  if (game.phase !== GAME_PHASES.SPYMASTER) {
    if (
      game.currentTurn !== player.team &&
      player.role.toUpperCase() !== "SPYMASTER"
    ) {
      console.log(
        "Cannot give clue in current phase : You are not spymaster Or not you team turn",
      );

      return game;
    }

    console.log("Cannot give clue in current phase");
    return game;
  }

  const log = generateCurrentLog(player, clueWord);
  game.logs.push(log);

  // تعديل immutable
  return {
    ...game,
    clue: clueWord,
    guessesLeft: Number(number) + 1, // +1 للقانون الرسمي
    phase: GAME_PHASES.GUESSING,
  };
}
