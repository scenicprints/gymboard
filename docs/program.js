// ─────────────────────────────────────────────────────────────────────
// THE PROGRAM
//
// ⚠ PLACEHOLDER. This is a generic upper/lower split standing in so the
//   board has something to render. It is NOT Kevin's program. Loads are
//   deliberately null rather than invented.
//
//   Replacing this is job #1. See ROADMAP.md section 6. It is blocked on
//   one answer: what equipment is in the gym. Barbell and rack, dumbbell
//   range, cables, machines, bands. Exercise selection falls out of that.
//
// SHAPE
//   sessions[]  every workout, each with a stable `id` the TV is keyed on
//   week{}      which session each weekday defaults to, null for rest
//
// Each line of work:
//   name   what it is
//   sets   number of sets
//   reps   text, so "6-8" and "AMRAP" both work
//   load   null until known, then a number or text
//   note   optional, renders small and dim under the name
// ─────────────────────────────────────────────────────────────────────

window.PROGRAM = {
  version: '0.1.0',
  units: 'lb',
  placeholder: true,   // the TV draws a banner while this is true

  sessions: [
    {
      id: 'upper-a',
      name: 'Upper A',
      focus: 'Horizontal push and pull',
      work: [
        { name: 'Bench Press',      sets: 4, reps: '6-8',   load: null },
        { name: 'Barbell Row',      sets: 4, reps: '8-10',  load: null },
        { name: 'Overhead Press',   sets: 3, reps: '8-10',  load: null },
        { name: 'Lat Pulldown',     sets: 3, reps: '10-12', load: null },
        { name: 'Dumbbell Curl',    sets: 3, reps: '10-12', load: null },
        { name: 'Triceps Pushdown', sets: 3, reps: '10-12', load: null },
      ],
    },
    {
      id: 'lower-a',
      name: 'Lower A',
      focus: 'Squat pattern',
      work: [
        { name: 'Back Squat',        sets: 4, reps: '6-8',   load: null },
        { name: 'Romanian Deadlift', sets: 3, reps: '8-10',  load: null },
        { name: 'Leg Press',         sets: 3, reps: '10-12', load: null },
        { name: 'Leg Curl',          sets: 3, reps: '10-12', load: null },
        { name: 'Calf Raise',        sets: 4, reps: '12-15', load: null },
      ],
    },
    {
      id: 'upper-b',
      name: 'Upper B',
      focus: 'Vertical push, shoulders, arms',
      work: [
        { name: 'Incline Dumbbell Press', sets: 4, reps: '8-10',  load: null },
        { name: 'Chest Supported Row',    sets: 4, reps: '8-10',  load: null },
        { name: 'Lateral Raise',          sets: 3, reps: '12-15', load: null },
        { name: 'Face Pull',              sets: 3, reps: '12-15', load: null },
        { name: 'Hammer Curl',            sets: 3, reps: '10-12', load: null },
        { name: 'Overhead Extension',     sets: 3, reps: '10-12', load: null },
      ],
    },
    {
      id: 'lower-b',
      name: 'Lower B',
      focus: 'Hinge pattern',
      work: [
        { name: 'Deadlift',        sets: 3, reps: '5',     load: null },
        { name: 'Front Squat',     sets: 3, reps: '8-10',  load: null },
        { name: 'Hip Thrust',      sets: 3, reps: '10-12', load: null },
        { name: 'Leg Extension',   sets: 3, reps: '12-15', load: null },
        { name: 'Calf Raise',      sets: 4, reps: '12-15', load: null },
      ],
    },
  ],

  week: {
    sun: null,
    mon: 'upper-a',
    tue: 'lower-a',
    wed: null,
    thu: 'upper-b',
    fri: 'lower-b',
    sat: null,
  },
};
