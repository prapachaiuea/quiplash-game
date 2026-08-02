const VIEW_IDS = {
  landing: "view-landing",
  lobby: "view-lobby",
  answering: "view-answering",
  voting: "view-voting",
  "round-end": "view-round-end",
  final: "view-final",
};

export function renderRoute(state) {
  const activeView = state.roomId ? state.phase : "landing";

  Object.entries(VIEW_IDS).forEach(([name, id]) => {
    const el = document.getElementById(id);
    if (el) el.hidden = name !== activeView;
  });

  const roomCodeDisplay = document.getElementById("room-code-display");
  const roomCodeValue = document.getElementById("room-code-value");
  if (roomCodeDisplay) {
    if (state.roomId) {
      roomCodeDisplay.hidden = false;
      roomCodeValue.textContent = state.roomId;
    } else {
      roomCodeDisplay.hidden = true;
    }
  }

  const btnLeaveRoom = document.getElementById("btn-leave-room");
  if (btnLeaveRoom) btnLeaveRoom.hidden = !state.roomId;
}
