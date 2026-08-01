import { initAuth } from "../shared/auth.js";
import { getState, setState, subscribe } from "./state.js";
import { rejoinLastRoom } from "./room.js";
import { renderRoute } from "./router.js";
import { watchServerOffset, serverNow } from "../shared/utils/timer.js";
import { showToast } from "../shared/components.js";
import { unlockAudio, updateForState, isMuted, setMuted, playClick } from "../shared/audio.js";

import * as setupView from "./ui/setup-view.js";
import * as lobbyView from "./ui/lobby-view.js";
import * as answeringView from "./ui/answering-view.js";
import * as votingView from "./ui/voting-view.js";
import * as roundEndView from "./ui/round-end-view.js";
import * as finalView from "./ui/final-view.js";

const views = [setupView, lobbyView, answeringView, votingView, roundEndView, finalView];

async function boot() {
  views.forEach((v) => v.init());
  subscribe((state) => {
    renderRoute(state);
    views.forEach((v) => v.render(state));
    updateForState(state, { serverNow });
  });
  setupMusicToggle();
  setupClickSfx();
  renderRoute(getState());

  watchServerOffset();

  try {
    const uid = await initAuth();
    setState({ uid });
    await rejoinLastRoom();
  } catch (err) {
    console.error(err);
    showToast("Failed to connect to Firebase — check firebase-config.js.", true);
  }
}

// One delegated listener covers every button on the host screen — including ones views
// build later via render() — with a soft click tick, and doubles as the audio-unlock
// gesture (the host has no landing form, so "Open a Room" is the first real click).
function setupClickSfx() {
  document.addEventListener("click", (e) => {
    const control = e.target.closest("button");
    if (!control || control.disabled) return;
    unlockAudio();
    playClick();
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
  showToast("Failed to connect. Check your Firebase config and connection.", true);
});
