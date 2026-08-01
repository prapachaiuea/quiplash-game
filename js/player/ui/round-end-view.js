export function init() {}

export function render(state) {
  if (state.phase !== "round-end") return;
  const myScore = state.scores?.[state.uid] ?? 0;
  document.getElementById("my-score").textContent = `Your score: ${myScore}`;
}
