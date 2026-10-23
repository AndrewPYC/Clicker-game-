# CLICKER CO

A black-and-purple companion clicker. The welcome screen offers **Play as guest**, **Create user**, or **Sign in**. Guest games never save. Accounts keep separate progress on the game server.

## Exact speed bonuses
Each click starts at **1 TOCKEN**. Count clicks over the last one second, including the current click:

| Clicks/s | Multiplier |
| --- | --- |
| Below 5 | 1× |
| 5–9 | 1.2× |
| 10–14 | 1.4× |
| 15–19 | 1.6× |
| 20–24 | 1.8× |
| 25+ | 2× |

The multiplier falls as clicks expire. There is no interpolation, and the rhythm bonus always caps at 2×. Click power upgrades separately multiply manual payouts, which can exceed 2 TOCKENS. Crew boosts and levels affect automatic production only. Gifts are separate rewards.

## Included
- Four original flat 2D vector animals and four supplied cartoon portraits with gentle animation and a small apple effect on every click.
- Four default companions (dog, cat, panda and monkey), nine rotating animal/character SVG shop skins, and invite-only Mark, Pavly, John and Emmanuel portraits. All TOCKENS share one apple shape.
- Click power upgrades: +10%, +25%, +50% per purchase, starting at 100 / 500 / 2,500 TOCKENS. Bonuses add together, then multiply manual payouts by the rhythm bonus; they never boost automatic crew earnings. Prices rise 15% per purchase.
- One small apple per manual click at a random position outside the character with a gap, including keyboard taps. The companion sits on the page without a surrounding card. Apples stay visible briefly and fade out over 1.3 seconds, in a narrow band close to the character without touching it. Opt-in Apple bite sounds use a real apple-bite recording (CC0; see assets/audio-credits.md), replacing the synthesized effect.
- Full Screen / Exit Full Screen in Settings, with an unavailable label on unsupported browsers.
- Live clicks/s meter, tier highlights and fractional TOCKEN payouts.
- Four automatic crew types: +1 TOCKEN/s sidekicks, +10 TOCKENS/s bakers, +50 automatic clicks/s couriers, +100 automatic clicks/s orchestras. Automatic clicks earn one base TOCKEN each, without affecting manual speed or XP.
- Crew boosts: +1%, +5%, +7.5%, +10% per purchase. Start at 25 / 50 / 100 / 200 TOCKENS, with 15% price growth per purchase for every boost and crew item. Round up each successive price: 25 → 29 → 34 → 40 TOCKENS.
- 1,000 long-term milestones, including the original IDs so claimed gifts remain claimed. Browse 25 per page or filter for Ready gifts. Stable claim buttons award each eligible gift with one click.
- Mooncat brand logo, full-width companion stage, and a castle side button opening Crew boosts, Click power, Night shift and Milestones in a dismissible drawer.
- Game-first layout with a large companion and compact Play / How To Play the Game tabs. Instructions open in a dedicated view with Back to game buttons. Game dropdown: guide, milestones and night crew. Settings dropdown: companions/preferences, backups and manual save.
- Account autosave, five-hour offline earnings cap, validated JSON import/export and reset confirmation.
- Phone/tablet portrait and landscape layouts, large touch targets, safe-area spacing, large-screen layouts and keyboard/TV remote focus navigation. Optional sound and reduced motion.

## Run locally

Use Node.js 20 or newer. No package install or build step is required.

```powershell
npm start
```

Open **http://localhost:8000**. Keep the server running while playing. Opening index.html directly, or using a static-only web server, supports guest play; account actions explain that the account server is required.

Usernames are unique without regard to letter case, and use 3–24 letters, numbers, underscores or hyphens. Passwords must be exactly 8 characters with no whitespace, an uppercase letter, a lowercase letter and a special character. Passwords are stored as salted scrypt hashes, never plaintext. Sessions use HTTP-only, SameSite cookies and expire after seven days; restarting the server requires signing in again but preserves saved games.

The private `data/` directory stores accounts and saves. It is excluded from Git and cannot be fetched from the web server. Back it up privately. Run only one server process against each data directory. There is no password reset flow yet. Progress is client-authoritative, as in the original game; this is not an anti-cheat service.

Save requests are queued and use revisions. If another device saves newer progress, the older game pauses and asks you to export a backup and sign in again instead of overwriting it. A connection failure displays an unsaved message and retries. Use Settings to export a backup, import one, or explicitly bring over an older clicker-co-save-v2 / mooncat-save-v1 browser save. Older saves and claimed milestone IDs remain compatible. Guests cannot import or export saves.

## Phones, tablets and TVs

Use the same hosted game URL on each device to access the same accounts. Touch the companion on phones/iPads; use Space or Enter on keyboards. Arrow keys move focus and OK/Select activates the focused control for TV browsers. Escape/Back closes dialogs. Modern browsers are required. Actual iPhone, iPad, Android and smart-TV hardware has not been tested in this workspace.

For a home-network preview, set the origin to this computer's LAN address (replace the example), then open that URL on another device on the same network:

```powershell
$env:HOST = '0.0.0.0'
$env:APP_ORIGIN = 'http://192.168.1.50:8000'
npm start
```

## Public hosting

Accounts require hosting **server.mjs**, not just index.html. Configure a persistent private `DATA_DIR` and a single Node process behind an HTTPS reverse proxy. Set `NODE_ENV=production`, `APP_ORIGIN=https://your-game.example` (no path), and `PORT` / `HOST` for that host. Production cookies use Secure and the server sends HSTS. Do not publish the data directory, password hashes or environment files. This change does not deploy or create a public URL.

## Development

Read AGENT.md (also linked from AGENTS.md). Run `npm test` for game logic, real HTTP account integration and welcome/save-flow checks. Tests use temporary account data and DOM adapters. Browser rendering and physical-device verification are separate.

## Inspiration and art
The main reference is [Cookie Clicker](https://orteil.dashnet.org/cookieclicker/), especially its idle economy, upgrades, milestones and save controls. Fixed rhythm tiers and friendship chapters are original implementations. All four animals are original SVG illustrations with solid colors and matching outlines. Mark, Pavly, John and Emmanuel are separate portraits prepared from user-supplied images, with checkerboard backgrounds removed. The apple TOCKEN is a shared red SVG illustration. All artwork loads locally.

## Weekly item shop and invite-only portraits
The Item shop in Empire (also in the Game menu) shows exactly three cosmetic skins, priced at 1,500 / 2,000 / 2,500 TOCKENS. Offers change each Monday at **00:00 UTC** through a nine-skin catalog: fox, rabbit, frog, penguin, koala, red panda, otter, Mario and Spider-Man. Sign in to purchase; owned skins stay available in Settings permanently, including after the shop rotates or game progress is reset. Skins do not affect payouts.

Mark, Emmanuel, Pavly and John are now locked unless the account is explicitly granted access. Existing unauthorized portrait selections fall back to Luna; balances and other progress remain intact. The private server configuration `skin-access.json` starts empty. When recipients are named, add their usernames as keys and allowed IDs as arrays (IDs: `mark`, `emmanuel`, `pavly`, `john`). Usernames are matched without regard to case. No character-name-based grants are automatic. Re-sign in to load updated access; no server restart is needed for grant-file edits. Imports and client-supplied ownership fields cannot unlock restricted skins.

Previously purchased recolored skins remain selectable and valid in saves, but are retired from new weekly offers. New shop animals use shop-prefixed IDs so legacy retired animal selections still migrate correctly. Mario and Spider-Man are new flat SVG character illustrations; the shop still has exactly three offers and all cosmetics use the existing prices and purchase rules.
