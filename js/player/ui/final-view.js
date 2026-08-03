import { getState } from "../state.js";
import { t, onLangChange } from "../../shared/i18n.js";

export function init() {
  onLangChange(() => render(getState()));
}

export function render(state) {
  if (state.phase !== "final") return;
  const myScore = state.scores?.[state.uid] ?? 0;
  document.getElementById("final-score").textContent = t("final.myScore", { n: myScore });
}
