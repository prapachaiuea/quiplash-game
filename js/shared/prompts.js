import { getLang } from "./i18n.js";

// The raw bilingual payload is only ever fetched once — loadPrompts() itself is safe to call
// on every language switch since it's just a cheap lookup into the already-cached data.
let rawCache = null;

async function loadRaw() {
  if (rawCache) return rawCache;
  const res = await fetch(new URL("../../prompts.json", import.meta.url));
  rawCache = await res.json();
  return rawCache;
}

export async function loadPrompts() {
  const raw = await loadRaw();
  return raw[getLang()] || raw.en;
}
