import { getState } from "../state.js";
import { revealMatchup, nextMatchup } from "../game.js";
import { showToast } from "../../shared/components.js";

let initialized = false;

export function init() {
  if (initialized) return;
  initialized = true;

  document.getElementById("btn-reveal-matchup").addEventListener("click", async (e) => {
    const { roomId } = getState();
    e.target.disabled = true;
    try {
      await revealMatchup(roomId);
    } catch {
      showToast("Could not reveal the results.", true);
    } finally {
      e.target.disabled = false;
    }
  });

  document.getElementById("btn-next-matchup").addEventListener("click", async (e) => {
    const { roomId } = getState();
    e.target.disabled = true;
    try {
      await nextMatchup(roomId);
    } catch {
      showToast("Could not advance.", true);
    } finally {
      e.target.disabled = false;
    }
  });
}

export function render(state) {
  if (state.phase !== "voting") return;

  const i = state.public?.matchupIndex ?? 0;
  const matchup = state.matchups?.[i];
  if (!matchup) return;

  const answers = state.answers?.[i] || {};
  const votes = state.votes?.[i] || {};
  const nameA = state.players?.[matchup.playerA]?.name || "Player A";
  const nameB = state.players?.[matchup.playerB]?.name || "Player B";

  document.getElementById("voting-eyebrow").textContent =
    `Matchup ${i + 1} of ${state.public?.matchupCount ?? 1}`;
  document.getElementById("voting-prompt").textContent = matchup.promptText;
  document.getElementById("answer-a-text").textContent = answers[matchup.playerA] || "(no answer submitted)";
  document.getElementById("answer-b-text").textContent = answers[matchup.playerB] || "(no answer submitted)";

  let votesA = 0;
  let votesB = 0;
  Object.values(votes).forEach((v) => {
    if (v === "A") votesA += 1;
    else if (v === "B") votesB += 1;
  });
  const total = votesA + votesB;

  document.getElementById("fill-a").style.width = `${total ? (votesA / total) * 100 : 0}%`;
  document.getElementById("fill-b").style.width = `${total ? (votesB / total) * 100 : 0}%`;
  document.getElementById("votes-a-count").textContent = `${votesA} vote${votesA === 1 ? "" : "s"}`;
  document.getElementById("votes-b-count").textContent = `${votesB} vote${votesB === 1 ? "" : "s"}`;

  const cardA = document.getElementById("card-a");
  const cardB = document.getElementById("card-b");
  cardA.classList.toggle("winner", matchup.revealed && votesA > votesB);
  cardB.classList.toggle("winner", matchup.revealed && votesB > votesA);

  document.getElementById("voting-hint").textContent = matchup.revealed
    ? `${nameA} wrote "${answers[matchup.playerA] || ""}" — ${nameB} wrote "${answers[matchup.playerB] || ""}"`
    : "Everyone but this pair is voting now.";

  document.getElementById("btn-reveal-matchup").hidden = matchup.revealed;
  document.getElementById("btn-next-matchup").hidden = !matchup.revealed;
}
