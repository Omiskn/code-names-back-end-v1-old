import { shuffleArray } from "../utils/shuffle.js";
import { CARD_TYPES } from "../constants.js";

export function createBoard(allWords) {
  if (!allWords || allWords.length < 25) {
    throw new Error("Not enough words to create board");
  }

  // 1️⃣ اختر 25 كلمة عشوائية
  const selectedWords = shuffleArray(allWords).slice(0, 25);

  // 2️⃣ حدد الفريق الذي يبدأ عشوائيًا
  const startingTeam = Math.random() > 0.5 ? CARD_TYPES.RED : CARD_TYPES.BLUE;

  const redCount = startingTeam === CARD_TYPES.RED ? 9 : 8;
  const blueCount = startingTeam === CARD_TYPES.BLUE ? 9 : 8;

  // 3️⃣ أنشئ مصفوفة أنواع الكروت
  const cardTypes = [
    ...Array(redCount).fill(CARD_TYPES.RED),
    ...Array(blueCount).fill(CARD_TYPES.BLUE),
    ...Array(7).fill(CARD_TYPES.NEUTRAL),
    CARD_TYPES.ASSASSIN,
  ];

  // 4️⃣ اخلط الأنواع
  const shuffledTypes = shuffleArray(cardTypes);

  // 5️⃣ أنشئ الكروت
  const cards = selectedWords.map((word, index) => ({
    id: index,
    word,
    type: shuffledTypes[index],
    revealed: false,
  }));

  return {
    startingTeam,
    cards,
  };
}
