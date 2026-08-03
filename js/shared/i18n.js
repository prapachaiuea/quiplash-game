// Language is stored under one shared key so a visitor's choice carries across every
// party-games title hosted on prapachaiuea.github.io (same origin, different paths).
const STORAGE_KEY = "pg-lang";

let lang = "en";
try {
  lang = localStorage.getItem(STORAGE_KEY) || "en";
} catch {
  // Private browsing / storage disabled — fall back to English silently.
}

const listeners = new Set();

const translations = {
  en: {
    "nav.menu": "Menu",
    "nav.home": "Home",
    "nav.leave": "Leave",
    "landing.eyebrowHost": "On the shared screen",
    "landing.taglineHost": "Open a room, put this on the TV, laptop, or iPad everyone can see.",
    "landing.ctaHost": "Host a Room →",
    "landing.eyebrowPlayer": "On your phone",
    "landing.taglinePlayer": "Got a room code from the big screen? Grab your phone and join in.",
    "landing.ctaPlayer": "Join a Room →",
    "room.prefix": "Room",
    "mute.music": "Toggle music",
    "mute.sound": "Toggle sound",
    "setup.tagline": "The comedy answer-battle. Grab an iPad, put it where everyone can see it.",
    "setup.createRoom": "Open a Room",
    "setup.createError": "Could not open a room. Check firebase-config.js and try again.",
    "lobby.instruction": "Players join at {link} using this code",
    "lobby.rounds": "Rounds",
    "lobby.startGame": "Start Game",
    "lobby.hintWaiting": "Waiting for players ({count}/{min} minimum)...",
    "lobby.hintTooMany": "Too many players — max {max}.",
    "lobby.hintReady": "Ready! {count} players in the room.",
    "lobby.toastNotEnough": "Need at least {min} players to start.",
    "lobby.toastTooMany": "Max {max} players per room.",
    "lobby.toastStartFailed": "Could not start the game.",
    "lobby.toastRoundsFailed": "Could not update round count.",
    "answering.eyebrow": "Round {n} — writing answers",
    "answering.hint": "Everyone's answering their own prompt on their phone right now.",
    "answering.skip": "Everyone's Done — Skip to Voting",
    "answering.sittingOut": "(sitting out)",
    "answering.toastSkipFailed": "Could not skip ahead.",
    "answering.yourPrompt": "Your prompt",
    "answering.placeholder": "Type the funniest thing you've got…",
    "answering.submit": "Submit Answer",
    "answering.locked": "Answer locked in.",
    "answering.waitingOthers": "Waiting for everyone else to finish writing…",
    "answering.spectatorTitle": "You're not in this matchup.",
    "answering.spectatorHint": "Watch the big screen — you'll vote once everyone's answers are in.",
    "answering.toastSubmitFailed": "Could not submit your answer — try again.",
    "voting.matchup": "Matchup {i} of {count}",
    "voting.hintOpen": "Everyone but this pair is voting now.",
    "voting.noAnswer": "(no answer submitted)",
    "voting.votes": "{n} vote{s}",
    "voting.revealedHint": "{nameA} wrote “{answerA}” — {nameB} wrote “{answerB}”",
    "voting.reveal": "Reveal Winner",
    "voting.next": "Next Matchup",
    "voting.toastRevealFailed": "Could not reveal the results.",
    "voting.toastAdvanceFailed": "Could not advance.",
    "voting.which": "Which is funnier?",
    "voting.locked": "Vote locked in!",
    "voting.lookUp": "Look up at the screen for the results.",
    "voting.aboutYou": "This one's about you.",
    "voting.watchWinner": "Watch the screen to see who wins.",
    "voting.toastVoteFailed": "Could not submit your vote — try again.",
    "roundEnd.title": "Scoreboard",
    "roundEnd.nextRound": "Start Next Round",
    "roundEnd.seeFinal": "See Final Results",
    "roundEnd.toastFailed": "Could not continue.",
    "roundEnd.playerHint": "Round over — check the big screen for the scoreboard.",
    "roundEnd.myScore": "Your score: {n}",
    "final.eyebrow": "Final Results",
    "final.winnerName": "{name} wins!",
    "final.gameOver": "Game over",
    "final.newGame": "New Game",
    "final.toastFailed": "Could not start a new game — check your connection.",
    "final.playerHint": "Thanks for playing — look up for the final results.",
    "final.myScore": "Your final score: {n}",
    "player.yourName": "Your name",
    "player.namePlaceholder": "e.g. Beam",
    "player.joiningRoom": "Joining room {code}",
    "player.roomCode": "Room code",
    "player.joinRoom": "Join Room",
    "player.errorRoomNotFound": "That room code doesn't exist.",
    "player.errorRoomInProgress": "That game has already started — wait for it to finish.",
    "player.errorGeneric": "Something went wrong. Please try again.",
    "player.lobbyWaiting": "You're in! Waiting for the host to start…",
    "player.you": "(you)",
    "shared.toastFirebaseFailed": "Failed to connect to Firebase — check firebase-config.js.",
    "shared.toastLeaveFailed": "Could not leave the room — check your connection.",
    "shared.toastConnectFailed": "Failed to connect. Check your Firebase config and connection.",
    "shared.toastRoomClosed": "The host closed this room.",
  },
  th: {
    "nav.menu": "เมนู",
    "nav.home": "หน้าแรก",
    "nav.leave": "ออก",
    "landing.eyebrowHost": "หน้าจอรวม เปิดให้ทุกคนดู",
    "landing.taglineHost": "เปิดห้อง แล้วเอาไปเปิดที่จอทีวี โน้ตบุ๊ก หรือ iPad ที่ทุกคนเห็นได้",
    "landing.ctaHost": "เป็นเจ้าของห้อง →",
    "landing.eyebrowPlayer": "เล่นจากมือถือคุณ",
    "landing.taglinePlayer": "มีรหัสห้องจากจอใหญ่แล้วใช่ไหม? หยิบมือถือมาเข้าร่วมกันได้เลย",
    "landing.ctaPlayer": "เข้าร่วมห้อง →",
    "room.prefix": "ห้อง",
    "mute.music": "เปิด/ปิดเพลง",
    "mute.sound": "เปิด/ปิดเสียง",
    "setup.tagline": "เกมประชันมุกฮา หยิบ iPad มาวางให้ทุกคนเห็นจอ",
    "setup.createRoom": "เปิดห้อง",
    "setup.createError": "เปิดห้องไม่สำเร็จ ลองเช็ค firebase-config.js แล้วลองใหม่อีกครั้ง",
    "lobby.instruction": "ผู้เล่นเข้าร่วมได้ที่ {link} โดยใช้รหัสนี้",
    "lobby.rounds": "จำนวนรอบ",
    "lobby.startGame": "เริ่มเกม",
    "lobby.hintWaiting": "รอผู้เล่นอยู่ ({count}/{min} คนขั้นต่ำ)...",
    "lobby.hintTooMany": "ผู้เล่นเยอะไปหน่อย — สูงสุด {max} คน",
    "lobby.hintReady": "พร้อมแล้ว! มีผู้เล่น {count} คนในห้อง",
    "lobby.toastNotEnough": "ต้องมีผู้เล่นอย่างน้อย {min} คนถึงจะเริ่มได้",
    "lobby.toastTooMany": "ห้องนึงรับได้สูงสุด {max} คน",
    "lobby.toastStartFailed": "เริ่มเกมไม่สำเร็จ",
    "lobby.toastRoundsFailed": "อัปเดตจำนวนรอบไม่สำเร็จ",
    "answering.eyebrow": "รอบที่ {n} — กำลังพิมพ์คำตอบ",
    "answering.hint": "ตอนนี้ทุกคนกำลังตอบโจทย์ของตัวเองในมือถืออยู่",
    "answering.skip": "ทุกคนตอบครบแล้ว — ข้ามไปโหวตเลย",
    "answering.sittingOut": "(พักรอบนี้)",
    "answering.toastSkipFailed": "ข้ามไปไม่สำเร็จ",
    "answering.yourPrompt": "โจทย์ของคุณ",
    "answering.placeholder": "พิมพ์มุกฮาที่สุดที่คุณมีเลย...",
    "answering.submit": "ส่งคำตอบ",
    "answering.locked": "ส่งคำตอบเรียบร้อย",
    "answering.waitingOthers": "รอคนอื่นพิมพ์ให้เสร็จก่อนนะ...",
    "answering.spectatorTitle": "รอบนี้คุณไม่ได้ลงแข่ง",
    "answering.spectatorHint": "ดูจอใหญ่ไว้นะ — พอทุกคนส่งคำตอบครบแล้วคุณจะได้โหวต",
    "answering.toastSubmitFailed": "ส่งคำตอบไม่สำเร็จ ลองใหม่อีกครั้ง",
    "voting.matchup": "คู่ที่ {i} จาก {count}",
    "voting.hintOpen": "ทุกคนยกเว้นคู่นี้กำลังโหวตอยู่",
    "voting.noAnswer": "(ยังไม่ได้ส่งคำตอบ)",
    "voting.votes": "{n} โหวต",
    "voting.revealedHint": "{nameA} ตอบว่า “{answerA}” — {nameB} ตอบว่า “{answerB}”",
    "voting.reveal": "เปิดเผยผู้ชนะ",
    "voting.next": "คู่ต่อไป",
    "voting.toastRevealFailed": "เปิดเผยผลไม่สำเร็จ",
    "voting.toastAdvanceFailed": "ไปต่อไม่สำเร็จ",
    "voting.which": "อันไหนฮากว่ากัน?",
    "voting.locked": "โหวตเรียบร้อยแล้ว!",
    "voting.lookUp": "เงยหน้าไปดูผลที่จอใหญ่ได้เลย",
    "voting.aboutYou": "คู่นี้เป็นคำตอบของคุณเอง",
    "voting.watchWinner": "ดูจอใหญ่เพื่อดูว่าใครชนะ",
    "voting.toastVoteFailed": "โหวตไม่สำเร็จ ลองใหม่อีกครั้ง",
    "roundEnd.title": "ตารางคะแนน",
    "roundEnd.nextRound": "เริ่มรอบต่อไป",
    "roundEnd.seeFinal": "ดูผลสรุป",
    "roundEnd.toastFailed": "ไปต่อไม่สำเร็จ",
    "roundEnd.playerHint": "จบรอบแล้ว — ดูตารางคะแนนที่จอใหญ่ได้เลย",
    "roundEnd.myScore": "คะแนนของคุณ: {n}",
    "final.eyebrow": "ผลสรุปสุดท้าย",
    "final.winnerName": "{name} ชนะ!",
    "final.gameOver": "จบเกมแล้ว",
    "final.newGame": "เกมใหม่",
    "final.toastFailed": "เริ่มเกมใหม่ไม่สำเร็จ — ลองเช็กการเชื่อมต่อดูนะ",
    "final.playerHint": "ขอบคุณที่เล่นด้วยกันนะ — เงยหน้าไปดูผลสรุปได้เลย",
    "final.myScore": "คะแนนสุดท้ายของคุณ: {n}",
    "player.yourName": "ชื่อของคุณ",
    "player.namePlaceholder": "เช่น บีม",
    "player.joiningRoom": "กำลังเข้าร่วมห้อง {code}",
    "player.roomCode": "รหัสห้อง",
    "player.joinRoom": "เข้าร่วมห้อง",
    "player.errorRoomNotFound": "ไม่พบรหัสห้องนี้",
    "player.errorRoomInProgress": "เกมนี้เริ่มไปแล้ว — รอให้จบก่อนนะ",
    "player.errorGeneric": "มีบางอย่างผิดพลาด ลองใหม่อีกครั้งนะ",
    "player.lobbyWaiting": "เข้าห้องสำเร็จแล้ว! รอโฮสต์เริ่มเกม...",
    "player.you": "(คุณ)",
    "shared.toastFirebaseFailed": "เชื่อมต่อ Firebase ไม่สำเร็จ — ลองเช็ค firebase-config.js ดูนะ",
    "shared.toastLeaveFailed": "ออกจากห้องไม่สำเร็จ — ลองเช็คการเชื่อมต่อดูนะ",
    "shared.toastConnectFailed": "เชื่อมต่อไม่สำเร็จ ลองเช็คการตั้งค่า Firebase และการเชื่อมต่อดูนะ",
    "shared.toastRoomClosed": "โฮสต์ปิดห้องนี้แล้ว",
  },
};

export function getLang() {
  return lang;
}

export function setLang(next) {
  if (next !== "en" && next !== "th") return;
  if (next === lang) return;
  lang = next;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Ignore — the toggle still works for the rest of this session.
  }
  document.documentElement.lang = lang;
  applyStaticTranslations();
  listeners.forEach((fn) => fn(lang));
}

export function onLangChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function interpolate(str, vars) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (match, key) => (key in vars ? String(vars[key]) : match));
}

export function t(key, vars) {
  const dict = translations[lang] || translations.en;
  const str = dict[key] ?? translations.en[key] ?? key;
  return interpolate(str, vars);
}

// Static text marked up declaratively in HTML — anything set dynamically by a view's
// render() must instead call t() directly, since this only runs once per language switch.
export function applyStaticTranslations(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
  });
  root.querySelectorAll("[data-i18n-title]").forEach((el) => {
    el.title = t(el.getAttribute("data-i18n-title"));
  });
}

document.documentElement.lang = lang;

export function mountLangToggle() {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "lang-toggle";
  btn.setAttribute("aria-label", "Switch language / เปลี่ยนภาษา");
  function render() {
    btn.textContent = getLang() === "en" ? "ไทย" : "EN";
  }
  render();
  btn.addEventListener("click", () => {
    setLang(getLang() === "en" ? "th" : "en");
  });
  onLangChange(render);
  document.body.appendChild(btn);
  return btn;
}
