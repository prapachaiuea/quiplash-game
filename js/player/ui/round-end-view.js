import { getState } from "../state.js";
import { t, onLangChange } from "../../shared/i18n.js";

export function init() {
  onLangChange(() => render(getState()));
}

export function render(state) {
  if (state.phase !== "round-end") return;
  const myScore = state.scores?.[state.uid] ?? 0;
  document.getElementById("my-score").textContent = t("roundEnd.myScore", { n: myScore });
}
