export function checkWinCondition(game) {
  const { remaining, board } = game;

  // الفوز الطبيعي
  if (remaining.red === 0) return "red";
  if (remaining.blue === 0) return "blue";

  // كشف القاتل
  const assassinRevealed = board.cards.find(
    (c) => c.type === "assassin" && c.revealed
  );

  if (assassinRevealed) {
    // الفريق الذي كشف القاتل يخسر
    return game.currentTurn === "red" ? "blue" : "red";
  }

  // لا يوجد فائز بعد
  return null;
}
