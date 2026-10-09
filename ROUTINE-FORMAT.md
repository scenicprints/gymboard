# Routine format

What a routine looks like so Gymboard can run it. Hand this document to whoever
is writing the routines. What comes back is JSON, and it drops straight in.

A routine is one session: a warm-up, then circuits. The board shows it on the TV,
the phone starts and ends each circuit.

There is no calendar and there are no days. Routines are a list you work down.
Each level holds a handful of routines and the levels get progressively harder,
so what the phone offers is simply the next one.

## The shape

```json
{
  "name": "4 circuits for time",
  "level": 1,
  "order": 3,
  "warmup": [
    { "movement": "jog",           "distance_m": 400, "note": "easy" },
    { "movement": "squat",         "reps": 20 },
    { "movement": "push-up",       "reps": 10 },
    { "movement": "reverse-lunge", "reps": 20, "note": "10 per side" },
    { "movement": "arm-circle",    "reps": 20 }
  ],
  "circuits": [
    {
      "repeat": 4,
      "rest_after_seconds": 90,
      "note": "Keep the runs honest. The jump squats are the part that decides this one.",
      "movements": [
        { "movement": "run",            "distance_m": 400, "note": "down the street and back" },
        { "movement": "jump-squat",     "reps": 15 },
        { "movement": "push-up",        "reps": 12 },
        { "movement": "jumping-lunge",  "reps": 20, "note": "10 per leg" },
        { "movement": "burpee",         "reps": 10 }
      ]
    }
  ],
  "cooldown": [
    { "movement": "hamstring-stretch", "seconds": 30 },
    { "movement": "hip-flexor-stretch", "seconds": 30, "note": "30 per side" },
    { "movement": "chest-stretch", "seconds": 30 }
  ]
}
```

That is his example workout, written out in full. Nothing else is required.

## Fields

| Field | Required | What |
|---|---|---|
| `name` | yes | Shown on the phone and on the TV. |
| `level` | yes | Which level it belongs to. Levels get harder. |
| `order` | yes | Where it sits inside that level. You work down the list. |
| `warmup` | no | A list of movements. No circuits, no rest, one tap to move on. |
| `cooldown` | no | The same shape as `warmup`, run after the last circuit. |
| `circuits` | yes | The work, in order. |

### Inside a circuit

| Field | Required | What |
|---|---|---|
| `movements` | yes | In the order they are done. |
| `rest_after_seconds` | no | Rest before the next circuit. Leave it out for no rest. |
| `repeat` | no | Write the circuit once and repeat it. `"repeat": 4` gives four. |
| `note` | no | One line about the circuit as a whole, shown under the movements. |

Circuits do not have to match each other. Write them out separately when they
differ, and use `repeat` only when they are genuinely the same work.

### Inside a movement

| Field | Required | What |
|---|---|---|
| `movement` | yes | Which movement. See below. |
| `reps` | one of these three | A count. |
| `distance_m` | | Metres. Use it for runs. |
| `seconds` | | A hold or a timed effort, like a plank. |
| `note` | no | Small text under the name, like "10 per leg". Keep it short, it goes on a TV. |

## Rules that come from how it runs

- **A run ends back at the TV.** Write runs as out and back, not one way.
- **`seconds` turns the circuit timer on.** If any movement in a circuit has
  `seconds`, that circuit shows a timer counting up and beeps every 30 seconds.
  No `seconds` anywhere in the circuit means no timer at all.
- **No per-person anything.** Two people run the same routine at their own pace
  and one person taps when both are done, so nothing can be written per person.
- **The TV shows a whole circuit at once**, every movement side by side, each
  with its own animation. Circuits beyond about six movements will be cramped.
- **The cooldown is off the clock.** The workout clock stops when the last
  circuit ends, and the session is recorded at that moment, so a cooldown that
  gets skipped costs nothing. It is one screen and one tap, like the warm-up.
- **A circuit `note` is for the circuit, not a movement.** It sits under the
  whole strip on the TV, so it is the place for pacing, or what to do if
  something is too hard. A movement's own `note` still goes beside that
  movement. Keep it to one line: it is read from across a room, mid-effort.
- **Rest runs itself.** Rest counts down, then five seconds of countdown, then
  the next circuit starts on its own. Nobody taps anything unless they want to
  cut the rest short.

## Movements

`movement` is an id, not free text, because each one has a drawn animation
behind it. Use lower case with hyphens: `jump-squat`, `push-up`, `burpee`.

A movement with no animation yet still works. It shows its name and reps on the
TV with an empty panel where the animation goes, and the animation gets drawn
and filled in later. So do not avoid a movement just because it may be missing.

Prefer the plain name people use. `push-up`, not `standard-push-up`.
