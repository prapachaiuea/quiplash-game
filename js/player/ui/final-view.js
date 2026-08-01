export function init() {}

export function render(state) {
  if (state.phase !== "final") return;
  const myScore = state.scores?.[state.uid] ?? 0;
  document.getElementById("final-score").textContent = `Your final score: ${myScore}`;
}
