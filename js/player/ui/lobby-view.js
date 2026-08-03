import { getState } from "../state.js";
import { t, onLangChange } from "../../shared/i18n.js";

export function init() {
  onLangChange(() => render(getState()));
}

export function render(state) {
  if (state.phase !== "lobby" || !state.roomId) return;

  const list = document.getElementById("player-list");
  list.innerHTML = "";
  Object.entries(state.players || {}).forEach(([uid, p]) => {
    const li = document.createElement("li");
    li.textContent = uid === state.uid ? `${p.name} ${t("player.you")}` : p.name;
    list.appendChild(li);
  });
}
