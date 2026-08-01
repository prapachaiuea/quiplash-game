// A link shared mid-game (e.g. from the host screen) carries ?room=CODE — skip the
// host/player choice entirely and drop that visitor straight into the join flow.
const room = new URLSearchParams(window.location.search).get("room");
if (room) {
  window.location.replace(`player.html?room=${encodeURIComponent(room.toUpperCase())}`);
}
