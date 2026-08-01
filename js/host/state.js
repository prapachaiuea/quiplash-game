const state = {
  uid: null,
  roomId: null,
  phase: "setup", // setup | lobby | answering | voting | round-end | final
  public: null,
  players: {},
  scores: {},
  matchups: {},
  answers: {},
  votes: {},
};

const listeners = new Set();

export function getState() {
  return state;
}

export function setState(patch) {
  Object.assign(state, patch);
  listeners.forEach((fn) => fn(state));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
