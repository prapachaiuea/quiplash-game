import { getState } from "../state.js";
import { backToLobby } from "../game.js";
import { showToast } from "../../shared/components.js";
import { t, onLangChange } from "../../shared/i18n.js";

let initialized = false;

export function init() {
  if (initialized) return;
  initialized = true;

  document.getElementById("btn-new-game").addEventListener("click", async (e) => {
    const { roomId } = getState();
    e.target.disabled = true;
    try {
      await backToLobby(roomId);
    } catch {
      showToast(t("final.toastFailed"), true);
    } finally {
      e.target.disabled = false;
    }
  });

  onLangChange(() => render(getState()));
}

export function render(state) {
  if (state.phase !== "final") return;

  const scores = state.scores || {};
  const players = state.players || {};
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  document.getElementById("winner-name").textContent = ranked.length
    ? t("final.winnerName", { name: players[ranked[0][0]]?.name || "?" })
    : t("final.gameOver");

  const list = document.getElementById("final-scoreboard");
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
}
