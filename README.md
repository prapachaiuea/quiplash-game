# Quiplash (web)

A browser version of the party game **Quiplash** (originally by Jackbox Games): two players get the same absurd prompt, answer privately, and everyone else votes on the funnier answer. Static site + Firebase Realtime Database, deployable on GitHub Pages for free.

Two separate pages, on purpose:

- **`host.html`** &mdash; the shared screen. Put it on a TV, laptop, or iPad where everyone can see it. Nobody types into it once the game starts.
- **`player.html`** &mdash; what each player opens on their own phone. This is where answers and votes are typed &mdash; kept private from the shared screen so the reveal actually lands.

## How it works

1. Open `host.html` on the shared screen and tap **Open a Room** to get a room code.
2. Everyone else opens `player.html` on their phone, enters the code and their name.
3. The host starts the game (3&ndash;8 players). Every round, players are paired up; each pair gets the same prompt and privately writes an answer.
4. Once everyone's answered, the host screen reveals each matchup one at a time. Everyone *not* in that matchup votes for the funnier answer, live on their phone.
5. Points: 1 per vote received, +2 bonus for whichever answer got more votes.
6. After the configured number of rounds, the host screen shows the final scoreboard.

## Known limitation: host trust

This app runs on Firebase's free plan with no server-side code (no Cloud Functions). The host's own browser drives round pairing, prompt selection, and score tallying, then writes results to paths that Security Rules gate by phase and matchup. A technically savvy host could inspect their own network traffic to see answers slightly before the official reveal.

For a casual game with friends this is an acceptable trade-off &mdash; it's no different from trusting whoever's running a physical game &mdash; but it's not cryptographically secure, so don't use it for anything with real stakes.

## Setup

### 1. Create a Firebase project

1. Go to the [Firebase Console](https://console.firebase.google.com) and create a new project (free **Spark** plan is enough).
2. **Build &rarr; Authentication &rarr; Sign-in method** &rarr; enable **Anonymous**.
3. **Build &rarr; Realtime Database &rarr; Create Database** &rarr; pick a region &rarr; start in **locked mode**.
4. **Realtime Database &rarr; Rules** tab &rarr; paste the contents of [`firebase-rules.json`](firebase-rules.json) &rarr; **Publish**.
5. **Project settings &rarr; Add app &rarr; Web app (`</>`)** &rarr; copy the generated config object into [`firebase-config.js`](firebase-config.js), replacing the `REPLACE_ME` placeholders.
6. **Authentication &rarr; Settings &rarr; Authorized domains** &rarr; add `<your-github-username>.github.io` (needed once you deploy to Pages).

### 2. Run locally

No build step &mdash; just serve the folder statically (opening the HTML files directly via `file://` won't work because ES modules and fetch require an HTTP origin):

```bash
npx serve .
# or: python -m http.server 8080
```

Then open `host.html` on one device/tab and `player.html` on others to test.

### 3. Deploy

Push this folder to a GitHub repo and enable **GitHub Pages** (Settings &rarr; Pages &rarr; deploy from branch). Share the `player.html` URL (or the room code, once the host has one) with your group.

## Editing the prompt bank

[`prompts.json`](prompts.json) is a flat array of strings, picked at random each round without repeats until the list runs out (then it starts reusing). Add, remove, or translate prompts freely &mdash; no code changes needed.

## Project structure

```
host.html / host.css        the shared screen
player.html / player.css    each player's phone
tokens.css                  shared color/type tokens for both screens
prompts.json                the prompt bank
firebase-config.js          your Firebase project config (paste after setup)
firebase-rules.json         Realtime Database security rules (paste into Firebase console)
js/shared/                  firebase init, auth, room-code + storage utils, toast
js/host/                    host-only state, room/round orchestration, views
js/player/                  player-only state, join/answer/vote actions, views
```
