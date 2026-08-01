import { ref, set } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";
import { db } from "../shared/firebase-init.js";
import { getState } from "./state.js";

export async function submitAnswer(matchupIndex, text) {
  const { roomId, uid } = getState();
  await set(ref(db, `rooms/${roomId}/answers/${matchupIndex}/${uid}`), text.trim());
}

export async function submitVote(matchupIndex, choice) {
  const { roomId, uid } = getState();
  await set(ref(db, `rooms/${roomId}/votes/${matchupIndex}/${uid}`), choice);
}
