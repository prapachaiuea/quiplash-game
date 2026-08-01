import { getState } from "../state.js";
import { startRound, setTotalRounds, MIN_PLAYERS, MAX_PLAYERS } from "../game.js";
import { showToast } from "../../shared/components.js";

let initialized = false;

export function init() {
  if (initialized) return;
  initialized = true;

  const btnStart = document.getElementById("btn-start-game");
  const selectRounds = document.getElementById("select-total-rounds");

  btnStart.addEventListener("click", async () => {
    const { roomId } = getState();
    btnStart.disabled = true;
    try {
      await startRound(roomId);
    } catch (err) {
      const messages = {
        NOT_ENOUGH_PLAYERS: `Need at least ${MIN_PLAYERS} players to start.`,
        TOO_MANY_PLAYERS: `Max ${MAX_PLAYERS} players per room.`,
      };
      showToast(messages[err.message] || "Could not start the game.", true);
    } finally {
      btnStart.disabled = false;
    }
  });

  selectRounds.addEventListener("change", async () => {
    const { roomId } = getState();
    try {
      await setTotalRounds(roomId, Number(selectRounds.value));
    } catch {
      showToast("Could not update round count.", true);
    }
  });
}

export function render(state) {
  if (!state.roomId || state.phase !== "lobby") return;

  document.getElementById("lobby-room-code").textContent = state.roomId;
  document.getElementById("join-hint").textContent = `${window.location.origin}${window.location.pathname.replace("host.html", "player.html")}`;

  const playerList = document.getElementById("player-list");
  const players = Object.entries(state.players || {});
  playerList.innerHTML = "";
  players.forEach(([, p]) => {
    const li = document.createElement("li");
    li.textContent = p.name;
    playerList.appendChild(li);
  });

  const selectRounds = document.getElementById("select-total-rounds");
  if (state.public?.totalRounds) selectRounds.value = String(state.public.totalRounds);

  const btnStart = document.getElementById("btn-start-game");
  const hint = document.getElementById("lobby-hint");
  const count = players.length;

  btnStart.hidden = false;
  if (count < MIN_PLAYERS) {
    btnStart.disabled = true;
    hint.textContent = `Waiting for players (${count}/${MIN_PLAYERS} minimum)...`;
  } else if (count > MAX_PLAYERS) {
    btnStart.disabled = true;
    hint.textContent = `Too many players — max ${MAX_PLAYERS}.`;
  } else {
    btnStart.disabled = false;
    hint.textContent = `Ready! ${count} players in the room.`;
  }
}
