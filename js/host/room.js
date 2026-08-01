import {
  ref, set, update, onValue, onDisconnect,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";
import { db } from "../shared/firebase-init.js";
import { getState, setState } from "./state.js";
import { generateRoomCode } from "../shared/utils/id.js";
import { saveLastRoom, getLastRoom, clearLastRoom } from "../shared/utils/storage.js";

const MAX_CODE_ATTEMPTS = 5;
let subscribedRoomId = null;
let unsubscribers = [];

export async function createRoom() {
  const { uid } = getState();

  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const roomId = generateRoomCode();
    try {
      // First-writer-wins per security rules: claims the room code, or fails on collision.
      await set(ref(db, `rooms/${roomId}/public/host`), uid);
    } catch {
      continue;
    }
    await update(ref(db, `rooms/${roomId}/public`), {
      createdAt: Date.now(),
      phase: "lobby",
      roundNumber: 0,
      totalRounds: 3,
      matchupIndex: 0,
      matchupCount: 0,
      answerDurationMs: 60000,
      timer: null,
    });
    onDisconnect(ref(db, `rooms/${roomId}/public/hostOnline`)).set(false);
    await update(ref(db, `rooms/${roomId}/public`), { hostOnline: true });

    saveLastRoom("host", roomId);
    setState({ roomId, isHost: true });
    subscribeToRoom(roomId);
    return roomId;
  }
  throw new Error("COULD_NOT_CREATE_ROOM");
}

export async function rejoinLastRoom() {
  const roomId = getLastRoom("host");
  if (!roomId) return null;

  const { uid } = getState();
  return new Promise((resolve) => {
    onValue(
      ref(db, `rooms/${roomId}/public/host`),
      (snap) => {
        if (snap.val() === uid) {
          setState({ roomId });
          subscribeToRoom(roomId);
          resolve(roomId);
        } else {
          clearLastRoom("host");
          resolve(null);
        }
      },
      { onlyOnce: true }
    );
  });
}

function unsubscribeFromRoom() {
  unsubscribers.forEach((unsub) => unsub());
  unsubscribers = [];
  subscribedRoomId = null;
}

export function subscribeToRoom(roomId) {
  if (subscribedRoomId === roomId) return;
  if (subscribedRoomId !== null) unsubscribeFromRoom();
  subscribedRoomId = roomId;

  unsubscribers.push(onValue(ref(db, `rooms/${roomId}/public`), (snap) => {
    const publicData = snap.val() || {};
    setState({ public: publicData, phase: publicData.phase || "lobby" });
  }));

  unsubscribers.push(onValue(ref(db, `rooms/${roomId}/players`), (snap) => {
    setState({ players: snap.val() || {} });
  }));

  unsubscribers.push(onValue(ref(db, `rooms/${roomId}/scores`), (snap) => {
    setState({ scores: snap.val() || {} });
  }));

  unsubscribers.push(onValue(ref(db, `rooms/${roomId}/matchups`), (snap) => {
    setState({ matchups: snap.val() || {} });
  }));

  unsubscribers.push(onValue(ref(db, `rooms/${roomId}/answers`), (snap) => {
    setState({ answers: snap.val() || {} });
  }));

  unsubscribers.push(onValue(ref(db, `rooms/${roomId}/votes`), (snap) => {
    setState({ votes: snap.val() || {} });
  }));
}
