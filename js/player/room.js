import {
  ref, set, get, remove, onValue, onDisconnect,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";
import { db } from "../shared/firebase-init.js";
import { getState, setState } from "./state.js";
import { saveLastRoom, saveLastName, clearLastRoom } from "../shared/utils/storage.js";

let subscribedRoomId = null;
let roomUnsubscribers = [];
let answerUnsub = null;
let voteUnsub = null;
let votingAnswerUnsubs = [];
let subscribedAnswerPath = null;
let subscribedVotePath = null;
let subscribedVotingAnswersKey = null;

export function getRoomIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const room = params.get("room");
  return room ? room.toUpperCase() : null;
}

function setRoomInUrl(roomId) {
  const url = new URL(window.location.href);
  url.searchParams.set("room", roomId);
  window.history.replaceState({}, "", url);
}

export async function joinRoom(roomId, name) {
  const { uid } = getState();
  saveLastName(name);

  const publicSnap = await get(ref(db, `rooms/${roomId}/public`));
  if (!publicSnap.exists()) {
    throw new Error("ROOM_NOT_FOUND");
  }
  const publicData = publicSnap.val();

  const playerRef = ref(db, `rooms/${roomId}/players/${uid}`);
  const existingSnap = await get(playerRef);
  if (!existingSnap.exists() && publicData.phase !== "lobby") {
    throw new Error("ROOM_IN_PROGRESS");
  }

  await set(playerRef, {
    name,
    joinedAt: existingSnap.exists() ? existingSnap.val().joinedAt : Date.now(),
    online: true,
  });
  onDisconnect(ref(db, `rooms/${roomId}/players/${uid}/online`)).set(false);

  saveLastRoom("player", roomId);
  setRoomInUrl(roomId);
  setState({ roomId, name });
  subscribeToRoom(roomId);
  return roomId;
}

function unsubscribeFromRoom() {
  roomUnsubscribers.forEach((unsub) => unsub());
  roomUnsubscribers = [];
  if (answerUnsub) answerUnsub();
  if (voteUnsub) voteUnsub();
  votingAnswerUnsubs.forEach((unsub) => unsub());
  votingAnswerUnsubs = [];
  answerUnsub = null;
  voteUnsub = null;
  subscribedAnswerPath = null;
  subscribedVotePath = null;
  subscribedVotingAnswersKey = null;
  subscribedRoomId = null;
}

export function subscribeToRoom(roomId) {
  if (subscribedRoomId === roomId) return;
  if (subscribedRoomId !== null) unsubscribeFromRoom();
  subscribedRoomId = roomId;

  roomUnsubscribers.push(onValue(ref(db, `rooms/${roomId}/public`), (snap) => {
    const publicData = snap.val() || {};
    setState({ public: publicData, phase: publicData.phase || "lobby" });
  }));

  roomUnsubscribers.push(onValue(ref(db, `rooms/${roomId}/players`), (snap) => {
    setState({ players: snap.val() || {} });
  }));

  roomUnsubscribers.push(onValue(ref(db, `rooms/${roomId}/scores`), (snap) => {
    setState({ scores: snap.val() || {} });
  }));

  roomUnsubscribers.push(onValue(ref(db, `rooms/${roomId}/matchups`), (snap) => {
    setState({ matchups: snap.val() || {} });
  }));
}

// The player's own matchup index changes every round, and the vote path changes on every
// matchup — both depend on state that only settles after the listeners above fire. Called
// again on every render; each branch is a no-op once already subscribed to the right path.
export function ensureAnswerVoteSubscriptions() {
  const { roomId, uid, matchups, public: pub } = getState();
  if (!roomId || !uid) return;

  const myMatchupIndex = Object.entries(matchups || {}).find(
    ([, m]) => m.playerA === uid || m.playerB === uid
  )?.[0];

  const answerPath = myMatchupIndex !== undefined ? `rooms/${roomId}/answers/${myMatchupIndex}/${uid}` : null;
  if (answerPath !== subscribedAnswerPath) {
    if (answerUnsub) answerUnsub();
    subscribedAnswerPath = answerPath;
    answerUnsub = answerPath
      ? onValue(ref(db, answerPath), (snap) => setState({ myAnswer: snap.val() }))
      : null;
    if (!answerPath) setState({ myAnswer: null });
  }

  const currentMatchupIndex = pub?.matchupIndex;
  const votePath = currentMatchupIndex !== undefined
    ? `rooms/${roomId}/votes/${currentMatchupIndex}/${uid}`
    : null;
  if (votePath !== subscribedVotePath) {
    if (voteUnsub) voteUnsub();
    subscribedVotePath = votePath;
    voteUnsub = votePath
      ? onValue(ref(db, votePath), (snap) => setState({ myVote: snap.val() }))
      : null;
    if (!votePath) setState({ myVote: null });
  }
}

// Both answers in the current matchup are only readable while phase === 'voting' and this
// is the matchup being voted on (see firebase-rules.json) — re-subscribe whenever that
// matchup changes, and drop the listeners the moment it's no longer readable.
export function ensureVotingAnswerSubscriptions() {
  const { roomId, phase, public: pub, matchups } = getState();
  const i = pub?.matchupIndex;
  const matchup = i !== undefined ? matchups?.[i] : null;
  const key = phase === "voting" && matchup ? `${roomId}:${i}` : null;

  if (key === subscribedVotingAnswersKey) return;
  votingAnswerUnsubs.forEach((unsub) => unsub());
  votingAnswerUnsubs = [];
  subscribedVotingAnswersKey = key;

  if (!key) {
    setState({ votingAnswers: null });
    return;
  }

  const answers = { A: null, B: null };
  const publish = () => setState({ votingAnswers: { ...answers } });

  votingAnswerUnsubs.push(onValue(ref(db, `rooms/${roomId}/answers/${i}/${matchup.playerA}`), (snap) => {
    answers.A = snap.val();
    publish();
  }));
  votingAnswerUnsubs.push(onValue(ref(db, `rooms/${roomId}/answers/${i}/${matchup.playerB}`), (snap) => {
    answers.B = snap.val();
    publish();
  }));
}

// Reloads afterward rather than resetting state in place — the landing form's "joining room
// X" mode is a one-time check made at init(), not reactive, so a same-page reset would leave
// the join form stuck pointed at the room just left.
export async function leaveRoom() {
  const { roomId, uid } = getState();
  if (!roomId) return;

  try {
    await onDisconnect(ref(db, `rooms/${roomId}/players/${uid}/online`)).cancel();
    await remove(ref(db, `rooms/${roomId}/players/${uid}`));
  } catch {
    // Best-effort — still leave locally even if the write fails (e.g. offline).
  }

  clearLastRoom("player");
  window.location.href = window.location.pathname;
}

export async function rejoinLastRoomIfAny(roomId, name) {
  if (!roomId || !name) return null;
  try {
    return await joinRoom(roomId, name);
  } catch {
    clearLastRoom("player");
    return null;
  }
}
