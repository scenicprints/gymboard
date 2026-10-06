# Gymboard — Roadmap & Continuity Guide

> **Purpose:** single source of truth for picking this up cold, in a new chat or
> on another computer. Read this top to bottom and you can continue without the
> original conversation.
>
> Owner: GitHub user **scenicprints**. Repo: **scenicprints/gymboard**.
> Started 2026-10-05.

---

## 1. The requirement, in his words

> "I want to be able to pick a workout on my phone and it shows on the TV."

Plus, from the same conversation:

- The gym screen is a **Vizio SmartCast** TV.
- He does **not** want to hold or babysit his phone during the workout.
- He does **not** want to "get into a browser" to use it.
- **No new equipment purchases.**
- Everything on GitHub, so it can be continued from another machine.
- **OTA updates matter most.** He wants an update button that downloads and
  installs new versions, the way BodyComp does with signed APKs.

---

## 2. What it is

Two web pages and one shared value.

| Surface | What it does |
|---|---|
| `docs/tv.html` | The board. The Pi's kiosk opens this at boot and never leaves. Shows the selected workout in type readable across a room. |
| `docs/index.html` | The picker. Installs to his phone home screen as a PWA. A list of workouts, tap one. |
| Firestore `gymboard/tv` | Holds `selected`, the session id currently on screen. Phone writes, TV listens. |

Tap a workout on the phone, the TV changes within a second, the phone locks and
goes in his pocket. The TV keeps the workout up because the board is driving it,
not the phone.

With nothing selected, the TV **follows the week** from `program.js`, so walking
in on a Tuesday already shows Tuesday without touching anything.

---

## 3. Decisions already made, do not relitigate

Six turns of the original conversation went into ruling these out.

| Option | Why not |
|---|---|
| **Native app on the Vizio** | SmartCast is closed. No sideloading, no developer options, no public SDK. Only Vizio ships apps to it. Not possible at any effort. |
| **Phone screen mirroring** | Works, but the phone must stay awake and unlocked the whole session, and a Pixel is 20:9 into a 16:9 panel so it fills about 80 percent of the screen in landscape and 25 percent in portrait. He rejected it outright on the awake requirement. |
| **Google Cast receiver** | Would work and needs nothing in the HDMI port. Costs a 5 dollar Cast Developer Console registration, a receiver page, and a native Android platform channel for the sender since Flutter has no real Cast support. Rejected as far more work for the same result. |
| **Cast to a Raspberry Pi** | Not possible. There is no Google Cast receiver for Linux or Pi. `catt` and `pychromecast` are senders, not receivers. The old projects that tried (leapcast) are dead. |
| **HDMI-CEC, drive the kiosk with the Vizio remote** | Viable but moot now that the phone is the control. |
| **State server on the Pi** | Rejected because it puts code on the board, which then needs deploying. Hosting both pages on GitHub Pages means updates arrive by `git push` and the board never gets touched again. |

---

## 4. Current status

**v0.1.0 live. The board is built and running. The program is still a placeholder.**

Verified end to end on 2026-10-06:

- GitHub Pages live, Firestore rules published.
- The Pi appliance, section 8. It powers on showing the board with no input from
  anyone, survives a reboot, and restarts itself if the browser dies.
- A pick on the phone moves the Pi's screen. Confirmed by screenshotting the Pi's
  own display output while picking from a separate machine, not by assuming.

Not done:

- [ ] **The program.** `docs/program.js` is still the flagged placeholder. He is
      building his own, in the app. Section 6.
- [ ] Picker installed to his phone home screen. His step.
- [ ] The Pi hung on the gym TV and powered on at home. His step, and the only
      thing that has never been tested, because his home Wi-Fi is not in range of
      the work PC this was built from.

---

## 5. How OTA works

There is no app store and no APK. The pages are static on GitHub Pages, so a
`git push` is the release. Three things make that land immediately rather than in
ten minutes:

1. **`sw.js` is network first**, and fetches navigations with `cache: 'no-store'`
   to get past the GitHub Pages ten minute `max-age`.
2. **`?v=` stamps** on every script and stylesheet reference bust the rest.
3. **`docs/version.json`** is the published version number.

**The phone** has a *Check for updates* button in the footer, the same shape as
BodyComp's updater: it fetches `version.json` past the cache, and if the version
differs from the `VERSION` constant in `pick.js` it clears the caches, unregisters
the service worker and reloads. It also peeks quietly on open, so the button reads
"Update to v0.2.0" before he presses anything.

**The TV** has no keyboard and nobody standing at it, so `tv.js` polls
`version.json` every five minutes and reloads itself when it changes.

### Shipping a version

Bump all five together or the update button lies:

1. `docs/version.json`, the `version` field
2. `VERSION` in `docs/pick.js`
3. `BOOT_VERSION` in `docs/tv.js`
4. Every `?v=0.1.0` in `docs/index.html`, `docs/tv.html`, `docs/pick.js`, `docs/tv.js`
5. `CACHE` in `docs/sw.js`, to `gymboard-v2`

Then commit and push to `main`. **Ask him before pushing**, except where he has
already said to.

A `publish.ps1` to do all of this is in section 9. Five hand edits per release is
a bug waiting to happen.

---

## 6. The program is his to build, in the app

**Do not hand write `docs/program.js` for him.** That was tried on 2026-10-06 and
it was wrong. His words: "I will be making my own program in the app, or have you
assist me in making it in the app."

The equipment question in the old version of this section is dead. He answered
"nothing" to it, and "what runs?" to the running. Do not open that round again.

So the program stops being a file someone edits and becomes something the phone
authors:

- the program moves into Firestore, the phone writes it, the TV reads it
- `docs/program.js` stays underneath as the offline fallback, which is what lets
  the TV render the week with no network
- the phone gets an editor: workouts, lifts, sets, reps, loads, and which workout
  each weekday defaults to

The published rules already cover `gymboard/{doc}`, so a second document needs no
rules change.

Keep `id` values stable whatever happens. Firestore stores the id, and a rename
silently blanks the TV.

---

## 7. Firestore

Reuses **foos-6ecf3**, the project the foos league and Parchís already live in.
Anonymous auth, same as Parchís. The config is inline in `docs/store.js` and is
the same public config already committed in `scenicprints/parchis`.

One document: `gymboard/tv`, holding `{ selected: string|null, at: serverTimestamp }`.

`firestore.rules` in this repo is the whole published ruleset, not a fragment.
**It was published on 2026-10-06** and reads and writes to `gymboard/tv` work.
The leagues and parchis blocks were preserved exactly; only the `gymboard` block
was added.

If it ever needs changing: Firebase Console, Firestore Database, Rules, paste,
publish. Old versions are kept in the left panel, so a bad publish is one click
to undo. With the rules missing, every pick fails with `permission-denied` and
the picker toasts "No connection".

---

## 8. The board

A **Raspberry Pi 3B+** in the TV's HDMI port. It was the foosball recorder until
2026-10-06; that software, its recordings and every trace of the FoosCam hotspot
were removed and it was rebuilt as a single purpose appliance.

Everything about it is in **`pi/`**, including a `setup.sh` that builds it from a
stock Raspberry Pi OS Lite. Read `pi/README.md` before touching it. The short
version:

- `cage` plus `chromium --kiosk` at the TV URL, started by `gymboard.service`.
- No console, no login, no desktop. `getty@tty1` is disabled.
- `ssh jkevin@gymboard.local`, from the same network only.
- `grim` is the only way to see what the board is showing without a TV attached.

**This board has no USB and no ethernet.** Both are dead at the chip: the LAN7800
half of the Microchip hub never enumerates, which takes the four USB ports with
it. Confirmed, not guessed. So there is no keyboard option, no dongle option and
no cable option, and Wi-Fi is the only interface it will ever have.

That is why it keeps a recovery access point at the lowest autoconnect priority.
If it cannot find a known network it raises the `Gymboard` network, and joining
that is the only way back in. Do not delete that profile.

On the Vizio itself, turn off the sleep timer and any no-signal auto power off.
The Pi holds its HDMI output on regardless, so the board is already drawn when
the TV wakes.

---

## 9. Next, in order

He set the phases himself:

**Phase 1, get the program on the phone and the Pi.** Done except for his two
physical steps: add the picker to his phone home screen, and power the Pi on at
home where it joins `Corona 2.4G` by itself.

**Phase 2, actually build the app.** The editor, section 6. This is where the
work goes next.

**Phase 3, polish.** Not before Phase 2. He has said so twice.

Not in any phase until he asks: logging. He asked to see the workout, not to
record it. Ticking sets off needs input and a write path and has never been
requested.

---

## 10. Gotchas

- **Session ids are load bearing.** Firestore holds the id. Renaming one in
  `program.js` without clearing the document leaves the TV blank, because the
  lookup misses and the TV quietly falls back to the week.
- **The `?v=` stamps are hand maintained.** Miss one and the phone runs new HTML
  against old JS.
- **`store.js` is imported with a `?v=` query too.** ES module specifiers cache
  separately from the HTML, so it needs the stamp like everything else.
- **GitHub Pages serves `/docs` from `main`.** No build step, no Actions workflow.
  Pushing to `main` deploys. That is deliberate.
- **The TV never shows an error.** Nobody is standing there to read it. A dropped
  Firestore listener is swallowed and the week keeps rendering from the local
  `program.js`, which is exactly why the schedule is local and not in the database.
- **His rules:** no emdashes anywhere, no narrator voice, no anachronisms. These
  apply to UI copy too.
- **Never commit or push to any repo without his explicit go-ahead.** He gave it
  for the initial push of this repo and nothing beyond that.
