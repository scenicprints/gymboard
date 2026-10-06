# Gymboard

Pick a workout on your phone, it shows on the gym TV.

The TV is a Vizio SmartCast, which cannot run apps, so a Raspberry Pi in its HDMI
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
| `docs/routines.js` | **The routines.** A list you work down. See ROUTINE-FORMAT.md. |
| `docs/exercise.js` | The drawn exercise animations. Red is the muscle working. |
| `docs/store.js` | The session, Firestore `gymboard/session`. |
| `docs/version.json` | The published version, which drives the update button. |
| `firestore.rules` | The rules block to publish in the Firebase console. |
| `pi/` | The Pi that drives the TV, and a `setup.sh` that builds one. |
| `ROADMAP.md` | Continuity guide. Read this first in a new session. |

## URLs

| | |
|---|---|
| Phone | `https://scenicprints.github.io/gymboard/` |
| TV | `https://scenicprints.github.io/gymboard/tv.html` |

Pages serves `/docs` from `main`. There is no build step, so pushing to `main`
deploys.

## Updating

Edit `docs/routines.js`, push, and the TV picks it up within five minutes on its
own. On the phone, hit **Check for updates** in the footer, or just reopen it.

Shipping a code change means bumping the version in five places. `ROADMAP.md`
section 5 lists them.

## Setup

Pages, the Firestore rules and the Pi are all done. What is left is physical:

1. Open the phone URL and add it to your home screen.
2. Power the Pi on at home. It joins the house Wi-Fi and comes up on the TV by
   itself.
3. On the Vizio, turn off the sleep timer and no-signal auto power off.

The program itself is not a file to replace. It gets built in the app. See
`ROADMAP.md` section 6.
