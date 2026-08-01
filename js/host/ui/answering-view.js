import { getState } from "../state.js";
import { advanceToVoting } from "../game.js";
import { serverNow, formatCountdown } from "../../shared/utils/timer.js";
import { showToast } from "../../shared/components.js";

let initialized = false;
let hasAutoAdvanced = false;

export function init() {
  if (initialized) return;
  initialized = true;

  document.getElementById("btn-skip-timer").addEventListener("click", async (e) => {
    const { roomId } = getState();
    e.target.disabled = true;
    try {
      await advanceToVoting(roomId);
    } catch {
      showToast("Could not skip ahead.", true);
    } finally {
      e.target.disabled = false;
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

  if (remaining <= 0 && !hasAutoAdvanced) {
    hasAutoAdvanced = true;
    advanceToVoting(state.roomId).catch(() => {});
  }
}

export function render(state) {
  if (state.phase !== "answering") {
    hasAutoAdvanced = false;
    return;
  }

  document.getElementById("answering-round-number").textContent = state.public?.roundNumber ?? "";

  const matchups = state.matchups || {};
  const answers = state.answers || {};
  const list = document.getElementById("answering-status-list");
  list.innerHTML = "";

  Object.values(matchups).forEach((m, i) => {
    [m.playerA, m.playerB].forEach((uid) => {
      const li = document.createElement("li");
      const name = state.players?.[uid]?.name || "?";
      const done = Boolean(answers[i]?.[uid]);
      li.textContent = name;
      li.className = done ? "status-done" : "";
      list.appendChild(li);
    });
  });

  const byeUid = state.public?.lastByeUid;
  if (byeUid && state.players?.[byeUid]) {
    const li = document.createElement("li");
    li.textContent = `${state.players[byeUid].name} (sitting out)`;
    list.appendChild(li);
  }
}
