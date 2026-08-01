import { initAuth } from "../shared/auth.js";
import { getState, setState, subscribe } from "./state.js";
import {
  getRoomIdFromUrl, ensureAnswerVoteSubscriptions, ensureVotingAnswerSubscriptions, rejoinLastRoomIfAny,
} from "./room.js";
import { renderRoute } from "./router.js";
import { watchServerOffset } from "../shared/utils/timer.js";
import { getLastRoom, getLastName } from "../shared/utils/storage.js";
import { showToast } from "../shared/components.js";

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
    showToast("Failed to connect to Firebase — check firebase-config.js.", true);
  }
}

boot().catch((err) => {
  console.error(err);
  showToast("Failed to connect. Check your Firebase config and connection.", true);
});
