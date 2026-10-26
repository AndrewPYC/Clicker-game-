# CLICKER CO

A black-and-purple companion clicker. The welcome screen offers **Create player**, **Returning player**, **Continue**, or **Play as guest**. Named profiles save progress and purchased skins in localStorage on this browser and device. No password, cookies or account server is required. Guest games never save.

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

The multiplier falls as clicks expire. There is no interpolation, and the rhythm bonus always caps at 2×. Click power adds flat TOCKENS to each manual click. Crew boosts and levels multiply both manual clicks and Night Shift output. Manual payout = (1 + purchased flat click additions) × crew boost multiplier × level multiplier × rhythm, so payouts can exceed 2 TOCKENS. Gifts are separate rewards.

## Included
- Four original flat 2D vector animals and four supplied cartoon portraits with gentle animation.
- Four default companions (dog, cat, panda and monkey), nine rotating animal/character SVG shop skins, and purchasable Mark, Pavly, John and Emmanuel portraits. All TOCKENS share one apple shape.
- Click power upgrades: +1 / +5 / +25 TOCKENS per click per purchase, starting at 100 / 500 / 2,500 TOCKENS. Flat additions stack, then receive the same crew and level bonuses as Night Shift, plus the manual rhythm bonus. Existing purchased counts carry over. Click power never boosts automatic crew earnings. Prices rise 15% per purchase.
- Character clicks have no apple visual effect. The companion sits on the page without a surrounding card. Opt-in Apple bite sounds use a real apple-bite recording (CC0; see assets/audio-credits.md).
- Full Screen / Exit Full Screen in Settings, with an unavailable label on unsupported browsers.
- Live clicks/s meter, tier highlights and fractional TOCKEN payouts.
- Four automatic crew types: +1 TOCKEN/s sidekicks, +10 TOCKENS/s bakers, +50 automatic clicks/s couriers, +100 automatic clicks/s orchestras. Automatic clicks earn one base TOCKEN each, without affecting manual speed or XP.
- Crew boosts: +1%, +5%, +7.5%, +10% to manual click and Night Shift output per purchase. Start at 25 / 50 / 100 / 200 TOCKENS, with 15% price growth per purchase for every boost and crew item. Round up each successive price: 25 → 29 → 34 → 40 TOCKENS.
- 1,000 long-term milestones, including the original IDs so claimed gifts remain claimed. Browse 25 per page or filter for Ready gifts. Stable claim buttons award each eligible gift with one click.
- Mooncat brand logo, full-width companion stage, and a castle side button opening Crew boosts, Click power, Night shift and Milestones in a dismissible drawer.
- Game-first layout with a large companion and How To Play the Game navigation. Instructions open in a dedicated view with Back to game buttons. Game dropdown: guide, milestones and night crew. Choose companion has its own top-right header button beside Settings. Settings dropdown: backups and manual save.
- Local profile autosave, five-hour offline earnings cap, validated JSON import/export and reset confirmation.
- Phone/tablet portrait and landscape layouts, large touch targets, safe-area spacing, large-screen layouts and keyboard/TV remote focus navigation. Optional sound and reduced motion.

## Run locally

Use Node.js 20 or newer. No package install or build step is required.

```powershell
npm start
```

Open **http://localhost:8000**, or use any static web server including GitHub Pages. No backend deployment is needed for local profiles. Opening index.html directly may also work, but browser storage behavior for file URLs varies; use a hosted URL for reliable saves.

Names use 1-24 letters, numbers, spaces, underscores or hyphens. Names are case-insensitive within this browser, not globally unique or password protected. Anyone using this browser can resume a named profile. Other browsers/devices have independent saves. Clearing site data or ending private browsing can erase progress. Export a backup in Settings regularly.

Each profile keeps gameplay, settings, milestone claims and purchased skins. Offline crew earnings remain capped at five hours. Use Settings to import/export gameplay backups or explicitly bring over an older browser save. Gameplay exports do not transfer shop ownership; ownership stays with the local profile. Guest games do not persist or export. Older server accounts are not automatically migrated. The legacy Node account API remains in server.mjs but is unused by the current interface.

## Phones, tablets and TVs

Open the hosted game URL on each device; local profiles remain separate on each browser/device. Touch the companion on phones/iPads; use Space or Enter on keyboards. Arrow keys move focus and OK/Select activates the focused control for TV browsers. Escape/Back closes dialogs. Modern browsers are required. Actual iPhone, iPad, Android and smart-TV hardware has not been tested in this workspace.

For a home-network preview, set the origin to this computer's LAN address (replace the example), then open that URL on another device on the same network:

```powershell
$env:HOST = '0.0.0.0'
$env:APP_ORIGIN = 'http://192.168.1.50:8000'
npm start
```

## Public hosting

Publish the HTML, CSS, JavaScript and assets to GitHub Pages or another static host. Local profiles work without server APIs. Never publish the private data/ directory or environment files. This local change has not been published yet.

## Development

Read AGENT.md (also linked from AGENTS.md). Run `npm test` for game logic, real HTTP account integration and welcome/save-flow checks. Tests use temporary account data and DOM adapters. Browser rendering and physical-device verification are separate.

## Inspiration and art
The main reference is [Cookie Clicker](https://orteil.dashnet.org/cookieclicker/), especially its idle economy, upgrades, milestones and save controls. Fixed rhythm tiers and friendship chapters are original implementations. All four animals are original SVG illustrations with solid colors and matching outlines. Mark, Pavly, John and Emmanuel are separate portraits prepared from user-supplied images, with checkerboard backgrounds removed. The apple TOCKEN is a shared red SVG illustration. All artwork loads locally.

## Item shop and portraits
The Item shop in Empire (also in the Game menu) shows three rotating cosmetic skins, priced at 1,500 / 2,000 / 2,500 TOCKENS, plus four permanent portraits at 2,500 TOCKENS each. Offers change each Monday at **00:00 UTC** through a nine-skin catalog: fox, rabbit, frog, penguin, koala, red panda, otter, Mario and Spider-Man. Enter your name to purchase; owned skins stay available in Settings permanently, including after the shop rotates or game progress is reset. Skins do not affect payouts.

Mark, Pavly, John and Emmanuel are regular shop skins. Each must be purchased for 2,500 TOCKENS before selection. All four stay available every week. Purchases use the same local profile storage and ownership rules as other skins; names and imported saves never grant ownership.

Previously purchased recolored skins remain selectable and valid in saves, but are retired from new weekly offers. New shop animals use shop-prefixed IDs so legacy retired animal selections still migrate correctly. Mario and Spider-Man are new flat SVG character illustrations; the shop has three rotating offers plus four permanent portraits and all cosmetics use the existing prices and purchase rules.
