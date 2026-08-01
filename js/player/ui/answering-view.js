import { getState } from "../state.js";
import { submitAnswer } from "../actions.js";
import { serverNow, formatCountdown } from "../../shared/utils/timer.js";
import { showToast } from "../../shared/components.js";
import { playSuccess } from "../../shared/audio.js";

let initialized = false;

// Tracks which round the answer input was last cleared for. The <input> is a single
// persistent DOM node (this view is only ever hidden, never recreated), so whatever text was
// last typed stays in it forever unless something explicitly clears it — previously nothing
// did, so a player would see their round-1 answer still sitting in the box the next time they
// were paired up in a later round.
let clearedForRound = null;

export function init() {
  if (initialized) return;
  initialized = true;

  document.getElementById("form-answer").addEventListener("submit", async (e) => {
    e.preventDefault();
    const { matchups, uid } = getState();
    const myIndex = Object.entries(matchups || {}).find(
      ([, m]) => m.playerA === uid || m.playerB === uid
    )?.[0];
    if (myIndex === undefined) return;

    const input = document.getElementById("input-answer");
    const text = input.value.trim();
    if (!text) return;

    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true;
    try {
      await submitAnswer(myIndex, text);
      input.value = "";
      playSuccess();
    } catch {
      showToast("Could not submit your answer — try again.", true);
    } finally {
      btn.disabled = false;
    }
  });

  setInterval(tick, 250);
}

function tick() {
  const state = getState();
  if (state.phase !== "answering" || !state.public?.timer) return;
  const { startAt, durationMs } = state.public.timer;
  const remaining = startAt + durationMs - serverNow();
  const el = document.getElementById("answering-countdown");
  if (el) el.textContent = formatCountdown(remaining);
}

export function render(state) {
  if (state.phase !== "answering") return;

  const { matchups, uid, myAnswer } = state;
  const myMatchup = Object.values(matchups || {}).find(
    (m) => m.playerA === uid || m.playerB === uid
  );

  const active = document.getElementById("answering-active");
  const waiting = document.getElementById("answering-waiting");
  const spectator = document.getElementById("answering-spectator");

  if (!myMatchup) {
    active.hidden = true;
    waiting.hidden = true;
    spectator.hidden = false;
    return;
  }
  spectator.hidden = true;

  if (myAnswer) {
    active.hidden = true;
    waiting.hidden = false;
  } else {
    active.hidden = false;
    waiting.hidden = true;
    document.getElementById("my-prompt").textContent = myMatchup.promptText;
    // Safety net alongside the post-submit clear in init(): if this player answered in an
    // earlier round and the field never got cleared for some reason (closed tab mid-type,
    // refreshed), this catches it. Only clears once per round so it never fights with
    // whatever they're actively typing right now.
    const roundNumber = state.public?.roundNumber;
    if (clearedForRound !== roundNumber) {
      clearedForRound = roundNumber;
      document.getElementById("input-answer").value = "";
    }
  }
}
