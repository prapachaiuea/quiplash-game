let initialized = false;

export function init() {
  if (initialized) return;
  initialized = true;

  document.getElementById("btn-new-game").addEventListener("click", () => {
    window.location.reload();
  });
}

export function render(state) {
  if (state.phase !== "final") return;

  const scores = state.scores || {};
  const players = state.players || {};
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  document.getElementById("winner-name").textContent = ranked.length
    ? `${players[ranked[0][0]]?.name || "?"} wins!`
    : "Game over";

  const list = document.getElementById("final-scoreboard");
  list.innerHTML = "";
  ranked.forEach(([uid, score], idx) => {
    const li = document.createElement("li");
    li.className = idx === 0 ? "leader" : "";
    li.innerHTML = `<span>${players[uid]?.name || "?"}</span><span>${score}</span>`;
    list.appendChild(li);
  });
}
