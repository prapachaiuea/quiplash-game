import { getState } from "../state.js";
import { revealMatchup, nextMatchup } from "../game.js";
import { showToast } from "../../shared/components.js";
import { playSuccess } from "../../shared/audio.js";
import { t, onLangChange } from "../../shared/i18n.js";
import { loadPrompts } from "../../shared/prompts.js";

let initialized = false;
let prompts = [];

export function init() {
  if (initialized) return;
  initialized = true;

  loadPrompts().then((data) => { prompts = data; });

  document.getElementById("btn-reveal-matchup").addEventListener("click", async (e) => {
    const { roomId } = getState();
    e.target.disabled = true;
    try {
      await revealMatchup(roomId);
      playSuccess();
    } catch {
      showToast(t("voting.toastRevealFailed"), true);
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
      showToast(t("voting.toastAdvanceFailed"), true);
    } finally {
      e.target.disabled = false;
    }
  });

  onLangChange(async () => {
    prompts = await loadPrompts();
    render(getState());
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
    t("voting.matchup", { i: i + 1, count: state.public?.matchupCount ?? 1 });
  document.getElementById("voting-prompt").textContent = prompts[matchup.promptIndex] || "";
  document.getElementById("answer-a-text").textContent = answers[matchup.playerA] || t("voting.noAnswer");
  document.getElementById("answer-b-text").textContent = answers[matchup.playerB] || t("voting.noAnswer");

  let votesA = 0;
  let votesB = 0;
  Object.values(votes).forEach((v) => {
    if (v === "A") votesA += 1;
    else if (v === "B") votesB += 1;
  });
  const total = votesA + votesB;

  document.getElementById("fill-a").style.width = `${total ? (votesA / total) * 100 : 0}%`;
  document.getElementById("fill-b").style.width = `${total ? (votesB / total) * 100 : 0}%`;
  document.getElementById("votes-a-count").textContent = t("voting.votes", { n: votesA, s: votesA === 1 ? "" : "s" });
  document.getElementById("votes-b-count").textContent = t("voting.votes", { n: votesB, s: votesB === 1 ? "" : "s" });

  const cardA = document.getElementById("card-a");
  const cardB = document.getElementById("card-b");
  cardA.classList.toggle("winner", matchup.revealed && votesA > votesB);
  cardB.classList.toggle("winner", matchup.revealed && votesB > votesA);

  document.getElementById("voting-hint").textContent = matchup.revealed
    ? t("voting.revealedHint", {
        nameA,
        answerA: answers[matchup.playerA] || "",
        nameB,
        answerB: answers[matchup.playerB] || "",
      })
    : t("voting.hintOpen");

  document.getElementById("btn-reveal-matchup").hidden = matchup.revealed;
  document.getElementById("btn-next-matchup").hidden = !matchup.revealed;
}
