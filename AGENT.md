# CLICKER CO project guide

## Product and structure
CLICKER CO is a black-themed browser clicker with four original flat 2D SVG animals and four user-supplied 2D cartoon portraits, animated in CSS. Always spell currency **TOCKENS**. Default companions: dog, cat, panda and monkey. Shop portraits (2,500 TOCKENS each, available during their featured week): Mark (blue hoodie), Pavly (Nike hoodie, left person in supplied pair), John (light-colored top, right person in supplied pair), and Emmanuel (green zip hoodie). Companion selection updates the picture and accessible label. Every TOCKEN always uses the same small red apple illustration, independent of the companion. The top-right dropdowns are **Game** and **Settings**.

Named local profiles work on static hosting including GitHub Pages. No account backend or passwords are used by the interface. npm start provides an optional local preview. No third-party packages or build step. The welcome screen appears before the game on every visit.
- index.html: game-first play view, dedicated How To Play the Game view with Back to game buttons, dropdowns and settings dialog.
- style.css: responsive black/purple theme, animation and reduced motion.
- model.js: shared companions, economy data, 1,000 milestones, save schema and migration.
- game.js: gameplay, rolling speed measurement, settings, paginated stable market rows and explicit session lifecycle.
- auth.js: welcome/guest/name/continue flow, localStorage profiles, local shop purchases and stale-tab conflict detection.
- server.mjs: account API and public asset server; salted password hashes, HTTP-only sessions and durable account saves.
- controls.js: arrow-key / TV remote focus movement and dialog fallback.
- data/: private account records, excluded from Git and never served as static files.
- assets/: four flat SVG animal illustrations (cat.svg, dog.svg, panda.svg, monkey.svg) sharing a 400×400 viewBox, plus mooncat-logo.svg for the fixed top-left brand and apple-token.svg, a flat red apple with a green leaf and brown stem. Display it as a full-color image background, never a monochrome mask. Animal SVGs use solid fills and vector paths; no 3D renders, embedded raster images, gradients or filters. User-supplied human characters are separate transparent PNG portraits: mark.png, pavly.png, john.png and emmanuel.png. Do not combine the two people into one character or change their assigned names. Original source files in Downloads must remain untouched.
- npm test runs game, server and auth tests. Game/auth use DOM adapters; server tests exercise real HTTP routes and temporary account storage. These are not physical device or visual browser checks.

## Exact click rules
Base click value is always **1 TOCKEN**. Use performance.now() to count clicks in the rolling interval (now - 1000ms, now]. Include the current click before paying it. Never interpolate between tiers.

| Clicks in last second | Multiplier | TOCKENS per click |
| --- | --- | --- |
| 0–4 | 1× | 1 |
| 5–9 | 1.2× | 1.2 |
| 10–14 | 1.4× | 1.4 |
| 15–19 | 1.6× | 1.6 |
| 20–24 | 1.8× | 1.8 |
| 25+ | 2× | 2 |

The multiplier falls as old clicks expire. Refresh the display without new clicks. Never persist speed timestamps or award an offline speed bonus. Clear speed on import, reset and hiding the page. The rhythm multiplier remains capped at 2×. Click power upgrades add flat TOCKENS: manual payout = (1 + sum of owned count × clickAdd) × (1 + summed crew boosts) × level multiplier × rhythm, so the total payout may exceed 2 TOCKENS. Automatic clicks retain their 1-TOCKEN base and do not receive Click power. Purrstorm is removed.

## Progression
- Each click adds 1 XP. Level L starts at 25 * (L - 1) * L lifetime clicks.
- Level gifts award L * 50 TOCKENS separately from click payouts. Each level adds 5 percentage points to both manual click and crew production.
- Crew: sidekick +1 TOCKEN/s; baker +10 TOCKENS/s; courier +50 automatic clicks/s; orchestra +100 automatic clicks/s. Automatic clicks earn 1 base TOCKEN each, with crew/level boosts, and never increase manual clicks, XP, or measured click speed.
- Click power upgrades: Click spark +1 TOCKEN/click (100 starting TOCKENS), Click surge +5 (500), Click nova +25 (2,500). Add to the base click value, then multiply by the same crew/level production multiplier as Night Shift and by rhythm. Preserve existing IDs and owned counts; old percentage purchases become flat additions at the new per-item values. Keep IDs distinct from legacy crew boosts. All three use 15% successive rounded-up pricing and save/import with owned counts defaulting to zero.
- Crew boosts per purchase: Velvet Paws +1%, Moonbeam Collar +5%, Midnight Treats +7.5%, Crown of the Cosmos +10%. Apply equally to manual clicks and Night Shift: combine additively, then multiply by the level bonus.
- Boost starting prices are 25, 50, 100 and 200 TOCKENS, doubling between items. Every boost and crew item costs 15% more than its previous purchase, rounding up after every step: next = ceil(previous * 115 / 100). Keep the existing starting prices.
- The repeatable friendship quest card and its rewards are removed; retain the legacy quest save field for import compatibility. Exactly 1,000 milestone gifts are each claimable once. Original 31 IDs and thresholds remain valid. Add 969 progressively harder chapter gifts, with strictly increasing targets per track. Final targets: 10,000,000 manual clicks, 1,000,000,000,000,000 lifetime TOCKENS, 600 crew, 600 boosts, level 500 and 10,000,000 TOCKENS/s. Chapter lifetime rewards are only 0.5% of the goal to avoid reward-driven completion chains. Render 25 per page, with an explicit Ready gifts filter. Existing claimed IDs remain claimed.
- Gifts count toward lifetime earnings but never grant XP. Speed multipliers affect only manual clicks.
- Offline crew earnings use the normal crew rate, capped at 5 hours.

## Persistence and working agreements
- Guest games never persist or export progress. Named profiles save gameplay and owned shop skins in localStorage, separated by case-insensitive names (1-24 letters, digits, spaces, underscores or hyphens). Welcome choices: Create player, Returning player, continue remembered profile, guest. No password or account API calls. Names are not globally unique or authenticated. Explain device/browser-only saves and clearing-data loss; provide backups.
- Import versions 1 and 2. Named players can explicitly bring over clicker-co-save-v2 or mooncat-save-v1 browser data in Settings; never silently attach an old save to an local profile. Preserve balances, clicks, purchases and rewards. Old click upgrades become crew boosts and Purrstorm fields are discarded. Retired fox, bunny, frog and penguin selections fall back to luna (cat), preserving all other progress.
- Validate imports, keep user-controlled content out of innerHTML, and recheck purchase/claim eligibility inside handlers.
- Settings includes Full Screen / Exit Full Screen with feature detection, fullscreenchange updates and graceful failure; unsupported browsers show an unavailable option.
- Keep assets local and dependencies minimal. Preserve system font fallbacks, keyboard activation, touch support, visible focus and reduced motion. Sound is opt-in: a real recorded apple bite from assets/apple-bite.wav (CC0, credits in assets/audio-credits.md) with capped audio overlap, never an oscillator beep. Each manual click creates exactly one small apple using assets/apple-token.svg, at a fresh random position around the character rather than at the pointer. Keep the apple within the stage. The companion stage has no surrounding card border or background. Apples hold briefly and fade in place over 1,300ms, including with reduced motion, without moving into the character. Reserve stage space and keep each 22px apple center 22–32px outside the character rectangle in a narrow nearby band. Remove all effect nodes after display.
- Verify threshold boundaries, decay, exact payouts, cap after levels/upgrades, independent crew earnings, gifts, saves/migration, companion selection and the invariant apple token shape and menu actions after relevant changes.
- Keep market rows and claim button DOM nodes stable across live earnings updates. Update progress, disabled state and labels in place; never replace the list every timer tick. Rebuild only when switching market tabs or explicitly changing a milestone page/filter. Never reorder ready gifts on a timer. One delegated click must claim an eligible milestone immediately and only once.
- The clickable companion occupies a full-width stage. Keep the empire panel closed by default; open its modal side drawer using the castle icon. Provide Crew boosts, Click power, Night shift, Item shop and Milestones tabs and an accessible close button. Game menu shortcuts open the drawer at the requested tab. Preserve live progress and stable claim buttons in the drawer.
- Show welcome choices first. Once a guest/account is selected, default to the play view. Use a How To Play the Game navigation with a dedicated guide and back buttons. Preserve progress and idle earnings while reading.
- Use black/neutral surfaces with restrained purple accents. No green UI highlights; the red apple may keep its green leaf.
- Report browser verification limits explicitly. Support touch targets of at least 44px, safe areas, narrow/landscape phones, tablets, desktop, and large screens; arrow keys and OK/Select move/activate controls for TV browsers. Universal hardware support cannot be assumed.
- The legacy Node account server remains optional and unused by the interface. Do not publish its private data directory. Local saves must report storage failures and avoid knowingly overwriting newer progress from another tab.

## Inspiration
Main reference: [Cookie Clicker](https://orteil.dashnet.org/cookieclicker/). Use its broad idle economy, escalating prices, milestones and save controls as inspiration. Fixed rhythm tiers, apple-shaped currency and friendship chapters are CLICKER CO mechanics. No source code or artwork was copied.

## Weekly skins and access
- The item shop rotates through four groups: four portraits, fox/rabbit/frog, penguin/koala/red panda, then otter/Mario/Spider-Man. The fixed epoch is October 26, 2026, featuring the portraits that week; the cycle repeats every four weeks. Each week has only its featured group: four portrait offers or three SVG offers. Monday 00:00 UTC refresh, based on a shared fixed epoch and device time. No speed or production perks. Prices are fixed per skin, 1,500 / 2,000 / 2,500 TOCKENS.
- Local shop purchases require a named profile, current offer, sufficient balance and no duplicate ownership. Write balance and ownership together in one localStorage profile before updating gameplay. Preserve ownership after reset; save imports cannot grant skins. Browser storage is user-editable and provides no anti-cheat guarantee.
- Mark, Emmanuel, Pavly and John are regular shop skins costing 2,500 TOCKENS each, offered only during the portrait week of the rotation. Purchase is required before selection. Names, save imports and legacy grants do not grant ownership.
- Guests may browse offers but cannot purchase. Locally owned skins remain selectable after rotation. Imported saves cannot grant ownership or unpurchased portraits.

Previously purchased recolored skins remain selectable and valid in saves, but are retired from new weekly offers. New shop animals use shop-prefixed IDs so legacy retired animal selections still migrate correctly. Mario and Spider-Man are new flat SVG character illustrations; the shop features four portraits or three SVG skins according to the weekly cycle and all cosmetics use the existing prices and purchase rules.
