export function generateCurrentLog(player, cardOrclue) {
  if (player.role === "operative")
    return {
      message: `${player.name} selects word ${cardOrclue?.word}`,
      team: player.team,
      cardType: cardOrclue.type,
    };

  return {
    message: `${player.name} gives clue ${cardOrclue}`,
    team: player.team,
    cardType: null,
  };
}
