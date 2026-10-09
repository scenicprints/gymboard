#!/usr/bin/env python3
"""Generate docs/routines.js from routines.json.

routines.json is the hand-off format (see ROUTINE-FORMAT.md). The board
loads a plain script rather than fetching JSON, so the routines are there
on a cold boot with no network, which is the whole reason the schedule is
local. Run this after dropping in a new routines.json, then push.
"""
import io, json, sys

src = json.load(io.open('routines.json', encoding='utf-8'))
for r in src:
    r.setdefault('id', 'l%d-r%d' % (r['level'], r['order']))

out = io.StringIO()
out.write('''// ─────────────────────────────────────────────────────────────────────
// THE ROUTINES
//
// GENERATED from routines.json by tool/build-routines.py. Do not edit by
// hand: edit routines.json and run the script.
//
// A list you work down. No calendar, no days: levels get harder and the
// app offers the next one you have not done.
// ─────────────────────────────────────────────────────────────────────

window.ROUTINES = ''')
out.write(json.dumps(src, indent=1, ensure_ascii=False))
out.write(''';

/// `repeat` is sugar. Everything downstream sees a plain list of circuits.
window.expandRoutine = function (r) {
  const circuits = [];
  for (const c of r.circuits) {
    const n = c.repeat || 1;
    for (let i = 0; i < n; i++) {
      circuits.push({ movements: c.movements, note: c.note || null,
                      rest_after_seconds: c.rest_after_seconds || 0 });
    }
  }
  return Object.assign({}, r, { circuits: circuits });
};

/// The next one you have not finished, in level then order.
window.nextRoutine = function (doneIds) {
  const done = doneIds || [];
  const all = window.ROUTINES.slice().sort(
    (a, b) => (a.level - b.level) || (a.order - b.order));
  return all.find((r) => done.indexOf(r.id) < 0) || all[all.length - 1];
};
''')
io.open('docs/routines.js', 'w', encoding='utf-8', newline='\n').write(out.getvalue())
print('docs/routines.js written from %d routines' % len(src))
