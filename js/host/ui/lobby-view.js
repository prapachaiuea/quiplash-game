import { getState } from "../state.js";
import { startRound, setTotalRounds, MIN_PLAYERS, MAX_PLAYERS } from "../game.js";
import { showToast } from "../../shared/components.js";
import { t, onLangChange } from "../../shared/i18n.js";

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
        NOT_ENOUGH_PLAYERS: t("lobby.toastNotEnough", { min: MIN_PLAYERS }),
        TOO_MANY_PLAYERS: t("lobby.toastTooMany", { max: MAX_PLAYERS }),
      };
      showToast(messages[err.message] || t("lobby.toastStartFailed"), true);
    } finally {
      btnStart.disabled = false;
    }
  });

  selectRounds.addEventListener("change", async () => {
    const { roomId } = getState();
    try {
      await setTotalRounds(roomId, Number(selectRounds.value));
    } catch {
      showToast(t("lobby.toastRoundsFailed"), true);
    }
  });

  // Language toggles don't re-fire render() on their own — re-render this view's dynamic
  // hint text (never touched by applyStaticTranslations()) whenever the language changes.
  onLangChange(() => render(getState()));
}

export function render(state) {
  if (!state.roomId || state.phase !== "lobby") return;

  document.getElementById("lobby-room-code").textContent = state.roomId;
  const joinLink = `${window.location.origin}${window.location.pathname.replace("host.html", "player.html")}`;
  document.getElementById("lobby-instruction").textContent = t("lobby.instruction", { link: joinLink });

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
    hint.textContent = t("lobby.hintWaiting", { count, min: MIN_PLAYERS });
  } else if (count > MAX_PLAYERS) {
    btnStart.disabled = true;
    hint.textContent = t("lobby.hintTooMany", { max: MAX_PLAYERS });
  } else {
    btnStart.disabled = false;
    hint.textContent = t("lobby.hintReady", { count });
  }
}
