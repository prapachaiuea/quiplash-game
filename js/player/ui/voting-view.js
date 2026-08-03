import { getState } from "../state.js";
import { submitVote } from "../actions.js";
import { showToast } from "../../shared/components.js";
import { t, onLangChange } from "../../shared/i18n.js";
import { loadPrompts } from "../../shared/prompts.js";

let initialized = false;
let prompts = [];

export function init() {
  if (initialized) return;
  initialized = true;

  loadPrompts().then((data) => { prompts = data; });

  ["a", "b"].forEach((letter) => {
    document.getElementById(`vote-option-${letter}`).addEventListener("click", async () => {
      const { public: pub } = getState();
      const i = pub?.matchupIndex;
      if (i === undefined) return;
      try {
        await submitVote(i, letter.toUpperCase());
      } catch {
        showToast(t("voting.toastVoteFailed"), true);
      }
    });
  });

  onLangChange(async () => {
    prompts = await loadPrompts();
    render(getState());
  });
}

export function render(state) {
  if (state.phase !== "voting") return;

  const i = state.public?.matchupIndex;
  const matchup = i !== undefined ? state.matchups?.[i] : null;
  if (!matchup) return;

  const active = document.getElementById("voting-active");
  const voted = document.getElementById("voting-voted");
  const inMatchup = document.getElementById("voting-in-matchup");

  const isParticipant = matchup.playerA === state.uid || matchup.playerB === state.uid;
  if (isParticipant) {
    active.hidden = true;
    voted.hidden = true;
    inMatchup.hidden = false;
    return;
  }
  inMatchup.hidden = true;

  if (state.myVote) {
    active.hidden = true;
    voted.hidden = false;
    return;
  }
  voted.hidden = true;
  active.hidden = false;

  document.getElementById("voting-prompt").textContent = prompts[matchup.promptIndex] || "";
  document.getElementById("vote-option-a").textContent = state.votingAnswers?.A || "…";
  document.getElementById("vote-option-b").textContent = state.votingAnswers?.B || "…";
}
