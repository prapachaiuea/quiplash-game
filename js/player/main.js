import { initAuth } from "../shared/auth.js";
import { getState, setState, subscribe } from "./state.js";
import {
  getRoomIdFromUrl, ensureAnswerVoteSubscriptions, ensureVotingAnswerSubscriptions, rejoinLastRoomIfAny, leaveRoom,
} from "./room.js";
import { renderRoute } from "./router.js";
import { watchServerOffset } from "../shared/utils/timer.js";
import { getLastRoom, getLastName } from "../shared/utils/storage.js";
import { showToast } from "../shared/components.js";
import { unlockAudio, isMuted, setMuted, playClick } from "../shared/audio.js";
import { t, applyStaticTranslations, mountLangToggle } from "../shared/i18n.js";

import * as landingView from "./ui/landing-view.js";
import * as lobbyView from "./ui/lobby-view.js";
import * as answeringView from "./ui/answering-view.js";
import * as votingView from "./ui/voting-view.js";
import * as roundEndView from "./ui/round-end-view.js";
import * as finalView from "./ui/final-view.js";

const views = [landingView, lobbyView, answeringView, votingView, roundEndView, finalView];

async function boot() {
  views.forEach((v) => v.init());
  subscribe((state) => {
    renderRoute(state);
    views.forEach((v) => v.render(state));
    ensureAnswerVoteSubscriptions();
    ensureVotingAnswerSubscriptions();
  });
  applyStaticTranslations();
  mountLangToggle();
  setupMusicToggle();
  setupClickSfx();
  setupLeaveRoom();
  renderRoute(getState());

  watchServerOffset();

  try {
    const uid = await initAuth();
    setState({ uid });

    const roomFromUrl = getRoomIdFromUrl();
    const savedRoom = getLastRoom("player");
    const lastName = getLastName();
    if (roomFromUrl && savedRoom === roomFromUrl && lastName) {
      await rejoinLastRoomIfAny(roomFromUrl, lastName);
    } else if (!roomFromUrl && savedRoom && lastName) {
      await rejoinLastRoomIfAny(savedRoom, lastName);
    }
  } catch (err) {
    console.error(err);
    showToast(t("shared.toastFirebaseFailed"), true);
  }
}

// One delegated listener covers every button in the console — including ones views build
// later via render() — with a soft click tick, and doubles as the audio-unlock gesture.
// No looping ambient bed on the player side: every phone in the room independently playing
// the same background music out of sync with each other and the host's screen would be a
// mess, so players only get these one-shot sounds (see js/shared/audio.js).
function setupClickSfx() {
  document.addEventListener("click", (e) => {
    const control = e.target.closest("button");
    if (!control || control.disabled) return;
    unlockAudio();
    playClick();
  });
}

function setupLeaveRoom() {
  document.getElementById("btn-leave-room").addEventListener("click", async () => {
    try {
      await leaveRoom();
    } catch (err) {
      console.error(err);
      showToast(t("shared.toastLeaveFailed"), true);
    }
  });
}

// Reflects the persisted mute preference on the header button and wires its toggle.
function setupMusicToggle() {
  const btn = document.getElementById("btn-mute-music");
  function render() {
    const mutedNow = isMuted();
    btn.textContent = mutedNow ? "🔇" : "🔊";
    btn.setAttribute("aria-pressed", String(mutedNow));
  }
  btn.addEventListener("click", () => {
    unlockAudio();
    setMuted(!isMuted());
    render();
  });
  render();
}

boot().catch((err) => {
  console.error(err);
  showToast(t("shared.toastConnectFailed"), true);
});
