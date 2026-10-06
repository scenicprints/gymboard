# Gymboard

Pick a workout on your phone, it shows on the gym TV.

The TV is a Vizio SmartCast, which cannot run apps, so a Tinker Board in its HDMI
port opens the board page on boot and never leaves it. The phone picker and the TV
board are the same site, hosted on GitHub Pages, sharing one value in Firestore.
Tap a workout, the TV changes, the phone locks and goes in your pocket.

With nothing picked, the TV follows the week, so walking in on a Tuesday already
shows Tuesday.

## Where things are

| Path | What |
|---|---|
| `docs/index.html` | The phone picker. Installs to the home screen as a PWA. |
| `docs/tv.html` | The TV board. This is the URL the kiosk opens. |
| `docs/program.js` | **Your program.** The only file you edit day to day. |
| `docs/store.js` | The one shared value, Firestore `gymboard/tv`. |
| `docs/version.json` | The published version, which drives the update button. |
| `firestore.rules` | The rules block to publish in the Firebase console. |
| `ROADMAP.md` | Continuity guide. Read this first in a new session. |

## URLs

| | |
|---|---|
| Phone | `https://scenicprints.github.io/gymboard/` |
| TV | `https://scenicprints.github.io/gymboard/tv.html` |

Pages serves `/docs` from `main`. There is no build step, so pushing to `main`
deploys.

## Updating

Edit `docs/program.js`, push, and the TV picks it up within five minutes on its
own. On the phone, hit **Check for updates** in the footer, or just reopen it.

Shipping a code change means bumping the version in five places. `ROADMAP.md`
section 5 lists them.

## Setup, one time

1. GitHub Pages on: Settings, Pages, branch `main`, folder `/docs`.
2. Publish `firestore.rules` in the Firebase console, or every pick fails.
3. Point the kiosk at the TV URL. `ROADMAP.md` section 8 has the two commands.
4. Open the phone URL and add it to your home screen.
5. On the Vizio, turn off the sleep timer and no-signal auto power off.
