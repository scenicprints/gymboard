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
| `docs/tv.html` | The board. The Tinker Board's Chromium kiosk opens this and never leaves. Shows the selected workout in type readable across a room. |
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
| **HDMI-CEC, drive the kiosk with the Vizio remote** | Viable but moot now that the phone is the control. Also the Tinker Board is Rockchip and its CEC is unreliable; a real Pi's HDMI does CEC properly. |
| **State server on the Pi** | Rejected because it puts code on the board, which then needs deploying. Hosting both pages on GitHub Pages means updates arrive by `git push` and the board never gets touched again. |

---

## 4. Current status

**v0.1.0, first build, not yet live on the board.**

Done:

- Both pages, the shared store, the service worker, the manifest, the icons.
- OTA on both surfaces (section 5).
- The TV follows the week, handles rest days, rolls over at midnight.
- The picker tags today's scheduled session, shows which one is live, and has a
  "Follow the week" reset.

- **GitHub Pages is live** at `https://scenicprints.github.io/gymboard/`.
- **Firestore rules are published** (2026-10-06). Verified end to end from the
  live site: a pick writes, the listener fires back, and the picker flips from
  "Following the week" to "On the TV now".

Not done:

- [ ] **The real program.** `docs/program.js` is a flagged placeholder. Section 6.
- [ ] **The board pointed at the URL.** Section 8. The Tinker Board was powered
      off when this was built, so none of it was applied. He is doing this one.
- [ ] Picker installed to his phone home screen.

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

## 6. Job number one: the real program

`docs/program.js` is a generic upper/lower split with every `load` null and
`placeholder: true` set, which draws a banner on both surfaces. It is standing in
so the board renders. It is **not his program**.

**It is blocked on one answer: what equipment is in his gym.** Barbell and rack,
dumbbell range, cables, machines, bands. Exercise selection falls out of that
entirely. He was asked and the night ended before he answered. Ask once, then
write the program. Do not open a second round of questions.

Context worth reading first, all in `C:\Users\jkevi\bodycomp`:

- He runs. `lib/trainer.dart` is an adaptive 5K run/walk ladder, so leg days have
  to coexist with running days.
- It is a **body recomposition** project, not pure strength. Its `ROADMAP.md`
  explains the TDEE and goal weight math.
- His weight, height and body fat numbers live in app storage on the phone, not
  in the repo, so they cannot be read from disk. Ask or infer, do not invent.
- Pantry (`C:\Users\jkevi\pantry`) carries a **fatty liver** constraint alongside
  weight loss. Diet rather than training, but same person, same goal.

The data shape is documented in the header of `program.js`. Keep `id` values
stable: Firestore stores the id, and a rename silently blanks the TV.

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

Tinker Board, **192.168.1.173**, user `jkevin`. It was offline when this was built.
Its kiosk lives in `C:\Users\jkevi\tv-launcher`:

| File | What |
|---|---|
| `board/kiosk.sh` | Chromium full screen at `HOMEURL`, blanking off, cursor hidden |
| `board/kiosk.desktop` | Autostart entry |
| `board/12-autologin.conf` | Autologin |
| `board/tv-remote.service` | systemd unit for `remote_server.py` |
| `board/remote_server.py` | Phone trackpad remote, built for Marquee. Not needed here. |
| `ssh_config`, `board_key` | `ssh -F ssh_config board` |

**The entire hardware change is one line.** In `board/kiosk.sh`, this:

```
HOMEURL="http://192.168.1.103:8096"
```

becomes:

```
HOMEURL="https://scenicprints.github.io/gymboard/tv.html"
```

Then copy it up and restart the kiosk:

```bash
cd C:/Users/jkevi/tv-launcher
./pscp.exe -i board_key board/kiosk.sh jkevin@192.168.1.173:/home/jkevin/kiosk.sh
ssh -F ssh_config board 'chmod +x ~/kiosk.sh && pkill -f "chromium .*--kiosk"; nohup ~/kiosk.sh >/dev/null 2>&1 &'
```

On the Vizio itself, turn off the sleep timer and any no-signal auto power off, or
it will shut down mid-session.

Known from the Marquee work on this board: GPU acceleration was never resolved. A
static page of text does not care.

---

## 9. Next, in order

1. **Get the answer on gym equipment, then write the real program.** Section 6.
   This is the only thing standing between here and finished.
2. **Point the board at the TV URL** and confirm a pick on the phone moves it.
   Section 8. He said he would do this one himself.
3. **Install the picker** to his phone home screen.
4. **Write `publish.ps1`**, the way BodyComp has one: take a version and a note,
   bump all five places from section 5, commit, push.
5. **Logging, only if he asks.** He asked to see the workout, not to record it.
   Ticking sets off needs input and a write path and was never requested. Do not
   build it unprompted.

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
