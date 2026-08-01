const state = {
  uid: null,
  name: "",
  roomId: null,
  phase: "landing", // landing | lobby | answering | voting | round-end | final
  public: null,
  players: {},
  scores: {},
  matchups: {},
  myAnswer: null,
  myVote: null,
  votingAnswers: null,
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
