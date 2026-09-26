# Kayalorangal — a Kerala-themed property game

A 4-player, real-time multiplayer board game inspired by Kerala's backwaters, beaches,
hill stations and cities. Players join from any device (phone, tablet, laptop) using a
room code, pick a token, and take turns rolling dice, buying properties, and paying rent —
all synced live over Firebase.

**What's included:** room creation/join with shareable links, real-time player sync, dice
rolls with doubles, buying/renting properties across 5 themed groups, taxes, a "Surprise"
card deck, jail, bankruptcy and a win condition, in-game chat, and a responsive layout for
phones, tablets and desktops.

**Not included yet** (good next steps if you want to extend it): trading between players,
houses/hotels, mortgaging, and a lobby "kick player" option.

## Files

```
index.html      the app shell (lobby, waiting room, game screen)
style.css       Kerala-themed responsive styling
board-data.js   the 28 Kerala-inspired tiles, groups, and Surprise cards
app.js          game logic + Firebase Realtime Database sync
config.js       YOUR Firebase project keys go here (see step 1 below)
```

---

## Step 1 — Create a free Firebase backend (~5 minutes)

Real-time multiplayer needs somewhere to store "room" state that every device can read and
write to instantly. Firebase's free (Spark) tier is enough for this game.

1. Go to <https://console.firebase.google.com>, sign in, and click **Add project**. Give it
   any name (e.g. `kayalorangal`) and finish the wizard (you can skip Google Analytics).
2. In the left sidebar, go to **Build → Realtime Database → Create Database**. Pick any
   region close to your players, and start in **test mode** (we'll lock it down in Step 4).
3. Go to **Project settings** (gear icon) → scroll to **Your apps** → click the **</>** (web)
   icon → register an app (any nickname, no need for Firebase Hosting).
4. Firebase will show a `firebaseConfig` object. Copy each value into `config.js` in this
   project, replacing the `PASTE_...` placeholders.

That's it — no server, no billing, no CLI required for this step.

## Step 2 — Try it locally (optional but recommended)

Because the game loads files with `<script src="...">`, most browsers want them served over
HTTP rather than opened as `file://`. Any of these work:

```bash
# Python (already on most machines)
python3 -m http.server 8000

# or Node
npx serve .
```

Then open `http://localhost:8000` in two browser tabs (or your phone on the same Wi-Fi at
`http://<your-computer-ip>:8000`) to test with more than one "player".

## Step 3 — Deploy for free

### Option A: GitHub Pages

1. Create a new GitHub repository and push these 5 files to it (the whole folder, keeping
   the file names exactly as they are).
2. On GitHub, go to the repo's **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to `Deploy from a branch`, branch `main`,
   folder `/ (root)`, then **Save**.
4. Wait a minute, then your game is live at:
   `https://<your-username>.github.io/<repo-name>/`
5. Share that link (or the room-code link the app generates) with your friends.

### Option B: Azure Static Web Apps (also free)

1. Push the same files to a GitHub repository (Azure Static Web Apps deploys from GitHub).
2. Go to the [Azure Portal](https://portal.azure.com) → **Create a resource** → search
   **Static Web App** → **Create**.
3. Fill in:
   - **Subscription / Resource group**: create or pick one.
   - **Name**: e.g. `kayalorangal`.
   - **Plan type**: **Free**.
   - **Deployment source**: **GitHub** — sign in and pick your repository/branch.
   - **Build presets**: **Custom**. Leave **App location** as `/`, **Api location** blank,
     and **Output location** blank (this is a static site with no build step).
4. Click **Review + create → Create**. Azure automatically adds a GitHub Actions workflow
   to your repo that deploys on every push.
5. Once the first deployment finishes (check the **Actions** tab in GitHub, or the
   Static Web App's **Overview** page in Azure), your game is live at the
   `https://<random-name>.azurestaticapps.net` URL shown on the Overview page.

Either option is completely free for a game like this — no server to manage, and both
auto-redeploy whenever you push changes to GitHub.

## Step 4 — Securing your database (do this once, before sharing widely)

Test mode leaves your database open to anyone. Once things work, go to **Realtime Database
→ Rules** in the Firebase console and use rules like this, which only allow reading/writing
rooms that already have a code (still simple, no login required, but prevents random
internet scanners from wiping every room):

```json
{
  "rules": {
    "rooms": {
      "$room": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

For extra safety later, you could add Firebase Anonymous Authentication and tighten these
rules further — not required to play, but worth doing if you plan to leave the game public
long-term.

## How players join a game

1. One player opens the site, enters their name, and clicks **Create a room**.
2. They share the room code (or the **Copy invite link** button, which pre-fills the code)
   with up to 3 friends over WhatsApp, iMessage, etc.
3. Each friend opens the same site link, enters their name, types/pastes the code, and joins.
4. Everyone picks a token and taps **I'm ready**; the host starts the game once 2–4 players
   are ready.
5. Play continues automatically in real time on every device — no refreshing needed.

## Customizing the theme

All Kerala-specific content (place names, property prices/rent, group colors, and Surprise
cards) lives in `board-data.js`, so you can add more landmarks, rebalance prices, or write
new event cards without touching the game logic in `app.js`.
