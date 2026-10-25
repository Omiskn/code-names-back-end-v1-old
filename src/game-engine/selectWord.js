import { GAME_PHASES } from "../constants.js";
import { generateCurrentLog } from "../utils/generateLogs.js";
import { endTurn } from "./endTurn.js";

export function selectWord(game, player, cardId) {
  // ❌ منع اللعب في مرحلة خاطئة
  if (
    !player ||
    game.phase !== GAME_PHASES.GUESSING ||
    player.team?.toLowerCase() !== game.currentTurn?.toLowerCase() ||
    player.role?.toLowerCase() === "spymaster"
  ) {
    return game;
  }

  const card = game.board.cards.find((c) => c.id === cardId);
  if (!card) return game;
  if (card.revealed) return game;

  // 🔓 كشف الكرت
  const revealedCard = { ...card, revealed: true };
  const updatedCards = game.board.cards.map((c) =>
    c.id === cardId ? revealedCard : c,
  );

  let updatedRemaining = { ...game.remaining };
  let winner = null;

  // 🔢 تحديث العدادات
  if (revealedCard.type === "red") updatedRemaining.red--;
  if (revealedCard.type === "blue") updatedRemaining.blue--;

  // 🏆 فحص الفوز
  if (updatedRemaining.red === 0) winner = "red";
  if (updatedRemaining.blue === 0) winner = "blue";

  if (revealedCard.type === "assassin") {
    winner = game.currentTurn === "red" ? "blue" : "red";
  }

  const log = generateCurrentLog(player, card);

  game.logs.push(log);

  let nextGame = {
    ...game,
    board: { ...game.board, cards: updatedCards },
    remaining: updatedRemaining,
    winner,
  };

  // إذا في فائز → إنهاء اللعبة
  if (winner) {
    return {
      ...nextGame,
      phase: GAME_PHASES.FINISHED,
    };
  }

  // 🎯 تقليل المحاولات
  let guessesLeft = game.guessesLeft - 1;

  const pickedOwnCard = revealedCard.type === game.currentTurn;

  // 🔁 تغيير الدور إذا:
  // - انتهت المحاولات
  // - أو لم يختر كرت فريقه
  if (guessesLeft <= 0 || !pickedOwnCard) {
    return endTurn({ ...nextGame, guessesLeft });
  }

  // ✅ يستمر الدور
  return {
    ...nextGame,
    guessesLeft,
  };
}
