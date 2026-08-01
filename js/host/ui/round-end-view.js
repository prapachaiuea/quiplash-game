import { getState } from "../state.js";
import { proceedAfterRoundEnd } from "../game.js";
import { showToast } from "../../shared/components.js";

let initialized = false;

export function init() {
  if (initialized) return;
  initialized = true;

  document.getElementById("btn-next-round").addEventListener("click", async (e) => {
    const { roomId } = getState();
    e.target.disabled = true;
    try {
      await proceedAfterRoundEnd(roomId);
    } catch {
      showToast("Could not continue.", true);
    } finally {
      e.target.disabled = false;
    }
  });
}

export function render(state) {
  if (state.phase !== "round-end") return;

  const scores = state.scores || {};
  const players = state.players || {};
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  const list = document.getElementById("scoreboard-list");
  list.innerHTML = "";
  ranked.forEach(([uid, score], idx) => {
    const li = document.createElement("li");
    li.className = idx === 0 ? "leader" : "";
    const nameEl = document.createElement("span");
    nameEl.textContent = players[uid]?.name || "?";
    const scoreEl = document.createElement("span");
    scoreEl.textContent = score;
    li.append(nameEl, scoreEl);
    list.appendChild(li);
  });

  const btn = document.getElementById("btn-next-round");
  btn.hidden = false;
  btn.textContent =
    (state.public?.roundNumber ?? 0) < (state.public?.totalRounds ?? 0)
      ? "Start Next Round"
      : "See Final Results";
}
