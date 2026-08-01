import { ref, set, update } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";
import { db } from "../shared/firebase-init.js";
import { getState } from "./state.js";
import { shuffle } from "../shared/utils/id.js";

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 8;
export const ANSWER_DURATION_MS = 60000;
const VOTE_POINT = 1;
const WINNER_BONUS = 2;

let promptsCache = null;
async function loadPrompts() {
  if (promptsCache) return promptsCache;
  const res = await fetch(new URL("../../prompts.json", import.meta.url));
  promptsCache = await res.json();
  return promptsCache;
}

// Pairs everyone up for this round. Odd headcount gets one bye — steered away from
// whoever sat out last round when possible, so the same person isn't benched twice running.
function pairPlayers(uids, lastByeUid) {
  const pool = shuffle(uids);
  let byeUid = null;
  if (pool.length % 2 !== 0) {
    let idx = pool.findIndex((u) => u !== lastByeUid);
    if (idx === -1) idx = 0;
    byeUid = pool.splice(idx, 1)[0];
  }
  const matchups = [];
  for (let i = 0; i < pool.length; i += 2) {
    matchups.push({ playerA: pool[i], playerB: pool[i + 1] });
  }
  return { matchups, byeUid };
}

export async function setTotalRounds(roomId, totalRounds) {
  await update(ref(db, `rooms/${roomId}/public`), { totalRounds });
}

export async function startRound(roomId) {
  const { players, public: pub, scores } = getState();
  const uids = Object.keys(players);
  if (uids.length < MIN_PLAYERS) throw new Error("NOT_ENOUGH_PLAYERS");
  if (uids.length > MAX_PLAYERS) throw new Error("TOO_MANY_PLAYERS");

  const prompts = await loadPrompts();
  const used = pub?.usedPromptIndices || [];
  const available = prompts.map((_, i) => i).filter((i) => !used.includes(i));
  // Once every prompt has been used once, start reusing the full set rather than erroring out.
  const pool = shuffle(available.length > 0 ? available : prompts.map((_, i) => i));

  const { matchups, byeUid } = pairPlayers(uids, pub?.lastByeUid ?? null);

  const matchupsData = {};
  const newlyUsed = [];
  matchups.forEach((m, i) => {
    const promptIdx = pool[i % pool.length];
    newlyUsed.push(promptIdx);
    matchupsData[i] = {
      promptText: prompts[promptIdx],
      playerA: m.playerA,
      playerB: m.playerB,
      revealed: false,
    };
  });

  const scoreUpdates = {};
  uids.forEach((uid) => {
    if (scores[uid] === undefined) scoreUpdates[`rooms/${roomId}/scores/${uid}`] = 0;
  });

  await set(ref(db, `rooms/${roomId}/matchups`), matchupsData);
  await set(ref(db, `rooms/${roomId}/answers`), null);
  await set(ref(db, `rooms/${roomId}/votes`), null);
  if (Object.keys(scoreUpdates).length > 0) await update(ref(db), scoreUpdates);

  await update(ref(db, `rooms/${roomId}/public`), {
    phase: "answering",
    roundNumber: (pub?.roundNumber || 0) + 1,
    matchupIndex: 0,
    matchupCount: matchups.length,
    usedPromptIndices: [...used, ...newlyUsed],
    lastByeUid: byeUid ?? null,
    timer: { startAt: Date.now(), durationMs: pub?.answerDurationMs || ANSWER_DURATION_MS },
  });
}

export async function advanceToVoting(roomId) {
  await update(ref(db, `rooms/${roomId}/public`), { phase: "voting", timer: null });
}

// Tallies votes for the current matchup, awards points (1 per vote received, +2 bonus
// for whichever answer got more votes), and locks the matchup's answers open for everyone.
export async function revealMatchup(roomId) {
  const { public: pub, matchups, votes, scores } = getState();
  const i = pub.matchupIndex;
  const matchup = matchups[i];
  const matchupVotes = votes[i] || {};

  let votesA = 0;
  let votesB = 0;
  Object.values(matchupVotes).forEach((v) => {
    if (v === "A") votesA += 1;
    else if (v === "B") votesB += 1;
  });

  const bonusA = votesA > votesB ? WINNER_BONUS : 0;
  const bonusB = votesB > votesA ? WINNER_BONUS : 0;
  const scoreUpdates = {
    [`rooms/${roomId}/scores/${matchup.playerA}`]: (scores[matchup.playerA] || 0) + votesA * VOTE_POINT + bonusA,
    [`rooms/${roomId}/scores/${matchup.playerB}`]: (scores[matchup.playerB] || 0) + votesB * VOTE_POINT + bonusB,
  };

  await update(ref(db), scoreUpdates);
  await update(ref(db, `rooms/${roomId}/matchups/${i}`), { revealed: true });
}

export async function nextMatchup(roomId) {
  const { public: pub } = getState();
  const next = pub.matchupIndex + 1;
  if (next < pub.matchupCount) {
    await update(ref(db, `rooms/${roomId}/public`), { matchupIndex: next });
  } else {
    await update(ref(db, `rooms/${roomId}/public`), { phase: "round-end" });
  }
}

export async function proceedAfterRoundEnd(roomId) {
  const { public: pub } = getState();
  if (pub.roundNumber < pub.totalRounds) {
    await startRound(roomId);
  } else {
    await update(ref(db, `rooms/${roomId}/public`), { phase: "final" });
  }
}

// "New Game" previously just called location.reload(), which reconnects to the SAME room —
// still sitting in phase:'final' — so it silently reloaded back onto the finished scoreboard
// instead of actually starting anything new. answers/votes/matchups/scores all have parent-
// level write rules for the host (see firebase-rules.json), so nulling each directly here is
// safe — same pattern startRound() already uses for answers/votes. totalRounds and
// usedPromptIndices are deliberately left alone: the round-count setting should persist, and
// keeping the used-prompt history means a second game with the same group won't immediately
// repeat prompts from the first one.
export async function backToLobby(roomId) {
  await set(ref(db, `rooms/${roomId}/answers`), null);
  await set(ref(db, `rooms/${roomId}/votes`), null);
  await set(ref(db, `rooms/${roomId}/matchups`), null);
  await set(ref(db, `rooms/${roomId}/scores`), null);
  await update(ref(db, `rooms/${roomId}/public`), {
    phase: "lobby",
    roundNumber: 0,
    matchupIndex: 0,
    matchupCount: 0,
    lastByeUid: null,
    timer: null,
  });
}
