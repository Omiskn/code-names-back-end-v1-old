import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createGame } from "../src/game-engine/createGame.js";
import { applyClue } from "../src/game-engine/applyClue.js";
import { selectWord } from "../src/game-engine/selectWord.js";
import { endTurn } from "../src/game-engine/endTurn.js";
import { buildSafeRoom } from "../src/socket/handlers/gameHandlers.js";
import RoomManager from "../src/rooms/RoomManager.js";
import ar_words from "../src/words/ar-words.js";
import { GAME_PHASES } from "../src/constants.js";

describe("Codenames Core Game Engine & Rules", () => {
  test("creates standard 25-card board with correct distribution", () => {
    const game = createGame(ar_words);
    assert.equal(game.board.cards.length, 25);

    const startingTeam = game.board.startingTeam;
    assert.ok(startingTeam === "red" || startingTeam === "blue");

    const redCards = game.board.cards.filter((c) => c.type === "red");
    const blueCards = game.board.cards.filter((c) => c.type === "blue");
    const neutralCards = game.board.cards.filter((c) => c.type === "neutral");
    const assassinCards = game.board.cards.filter((c) => c.type === "assassin");

    assert.equal(startingTeam === "red" ? redCards.length : blueCards.length, 9);
    assert.equal(startingTeam === "red" ? blueCards.length : redCards.length, 8);
    assert.equal(neutralCards.length, 7);
    assert.equal(assassinCards.length, 1);
    assert.equal(game.phase, GAME_PHASES.SPYMASTER);
  });

  test("information security: operatives do not see hidden card types", () => {
    const room = RoomManager.createRoom("test-room-1", { id: "host-1", name: "Host" });
    const p1 = room.addPlayer({ playerId: "spy-red", socketId: "s1", name: "Red Spy" });
    const p2 = room.addPlayer({ playerId: "op-red", socketId: "s2", name: "Red Op" });
    p1.team = "red";
    p1.role = "spymaster";
    p2.team = "red";
    p2.role = "operative";
    room.game = createGame(ar_words);

    // Operative safe projection
    const opView = buildSafeRoom(room, p2.id);
    const unrevealedCards = opView.game.board.cards.filter((c) => !c.revealed);
    for (const card of unrevealedCards) {
      assert.equal(card.type, null, "Operative must not see unrevealed card types!");
    }

    // Spymaster view sees all types
    const spyView = buildSafeRoom(room, p1.id);
    for (const card of spyView.game.board.cards) {
      assert.ok(card.type !== null, "Spymaster must see all card types");
    }
  });

  test("authorization: only current turn spymaster can give clue", () => {
    let game = createGame(ar_words);
    const turn = game.currentTurn;
    const oppTeam = turn === "red" ? "blue" : "red";

    const validSpymaster = { id: "p1", name: "Spy", team: turn, role: "spymaster" };
    const invalidSpymaster = { id: "p2", name: "OppSpy", team: oppTeam, role: "spymaster" };
    const operativePlayer = { id: "p3", name: "Op", team: turn, role: "operative" };

    // Wrong team spymaster cannot give clue
    let updated = applyClue(game, invalidSpymaster, "hint", 2);
    assert.equal(updated.phase, GAME_PHASES.SPYMASTER);
    assert.equal(updated.clue, null);

    // Operative cannot give clue
    updated = applyClue(game, operativePlayer, "hint", 2);
    assert.equal(updated.phase, GAME_PHASES.SPYMASTER);
    assert.equal(updated.clue, null);

    // Current turn spymaster gives clue
    updated = applyClue(game, validSpymaster, "forest", 2);
    assert.equal(updated.phase, GAME_PHASES.GUESSING);
    assert.equal(updated.clue, "forest");
    assert.equal(updated.guessesLeft, 3); // 2 + 1
  });

  test("guessing rules: correct guess, neutral switch, assassin loss", () => {
    let game = createGame(ar_words);
    const turn = game.currentTurn;
    const oppTeam = turn === "red" ? "blue" : "red";
    const spy = { id: "spy", name: "Spy", team: turn, role: "spymaster" };
    const op = { id: "op", name: "Op", team: turn, role: "operative" };

    game = applyClue(game, spy, "animals", 2);
    assert.equal(game.phase, GAME_PHASES.GUESSING);

    const ownCard = game.board.cards.find((c) => c.type === turn);
    const initialRemaining = game.remaining[turn];

    // Correct guess
    game = selectWord(game, op, ownCard.id);
    assert.equal(game.remaining[turn], initialRemaining - 1);
    assert.equal(game.guessesLeft, 2);
    assert.equal(game.phase, GAME_PHASES.GUESSING);

    // Neutral card ends turn and switches team
    const neutralCard = game.board.cards.find((c) => c.type === "neutral");
    game = selectWord(game, op, neutralCard.id);
    assert.equal(game.currentTurn, oppTeam);
    assert.equal(game.phase, GAME_PHASES.SPYMASTER);

    // Now test Assassin immediate loss
    const oppSpy = { id: "oppSpy", name: "OppSpy", team: oppTeam, role: "spymaster" };
    const oppOp = { id: "oppOp", name: "OppOp", team: oppTeam, role: "operative" };
    game = applyClue(game, oppSpy, "danger", 1);
    const assassinCard = game.board.cards.find((c) => c.type === "assassin");
    game = selectWord(game, oppOp, assassinCard.id);

    assert.equal(game.winner, turn, "Assassin guess must immediately give win to opposing team");
    assert.equal(game.phase, GAME_PHASES.FINISHED);
  });

  test("voluntary turn end resets phase and swaps turn", () => {
    let game = createGame(ar_words);
    const turn = game.currentTurn;
    const oppTeam = turn === "red" ? "blue" : "red";
    const spy = { id: "spy", name: "Spy", team: turn, role: "spymaster" };
    const op = { id: "op", name: "Op", team: turn, role: "operative" };

    game = applyClue(game, spy, "water", 1);
    game = endTurn(game, op);

    assert.equal(game.currentTurn, oppTeam);
    assert.equal(game.phase, GAME_PHASES.SPYMASTER);
    assert.equal(game.clue, null);
    assert.equal(game.guessesLeft, 0);
  });

  test("room safety: non-existent room cannot be retrieved or joined", () => {
    const nonExistent = RoomManager.getRoom("invalid-room-999");
    assert.equal(nonExistent, undefined);

    const added = RoomManager.addPlayer("invalid-room-999", {
      playerId: "p1",
      socketId: "s1",
      name: "Player 1",
    });
    assert.equal(added, undefined);
  });
});
