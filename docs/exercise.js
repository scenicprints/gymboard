// ─────────────────────────────────────────────────────────────────────
// EXERCISE ART
//
// Drawn, not filmed. Nothing to license, nothing to download, it themes
// itself, and it can move at the tempo the movement is actually done at.
//
// Red is the muscle doing the work. Everything not working drops to half
// strength so the eye goes where it should. Same idea as GymFolio.
//
// Each movement is a short list of poses that get interpolated. A pose is
// joint positions in a 200x200 box with the ground at y=178.
// ─────────────────────────────────────────────────────────────────────

const NS = 'http://www.w3.org/2000/svg';
const INK = '#dfe5ec', DIM = 'rgba(223,229,236,0.42)', MUS = '#ff4438';

// Standing, side on, facing right.
const STAND = {
  head: [101, 46], sh: [100, 66], hip: [100, 110],
  kn: [103, 142], an: [100, 176], el: [99, 90], ha: [99, 114],
  fkn: [97, 142], fan: [95, 176], fel: [101, 90], fha: [103, 114],
};

const bob = (d) => {
  const o = {};
  for (const k of Object.keys(STAND)) o[k] = [STAND[k][0], STAND[k][1] + d];
  return o;
};

/// Not every movement is drawn yet. The ones that are not get a figure
/// standing and breathing, which reads as a person rather than a gap.
const FALLBACK = { ms: 3600, muscles: [], poses: [STAND, bob(2.5), STAND] };

const MOVES = {
  'squat': {
    ms: 2200, muscles: [['thigh', 0.1, 0.9], ['torso', 0.05, 0.4]],
    poses: [STAND, { head: [98, 68], sh: [96, 88], hip: [92, 126],
      kn: [118, 146], an: [100, 176], el: [104, 108], ha: [116, 100],
      fkn: [112, 146], fan: [95, 176], fel: [100, 108], fha: [112, 102] }, STAND],
  },
  'jump-squat': {
    ms: 1500, muscles: [['thigh', 0.1, 0.9], ['torso', 0.05, 0.4]],
    poses: [STAND,
      { head: [98, 68], sh: [96, 88], hip: [92, 126], kn: [118, 146], an: [100, 176],
        el: [106, 108], ha: [118, 98], fkn: [112, 146], fan: [95, 176], fel: [102, 108], fha: [114, 100] },
      { head: [101, 26], sh: [100, 46], hip: [100, 90], kn: [102, 124], an: [100, 158],
        el: [96, 70], ha: [92, 48], fkn: [96, 124], fan: [94, 158], fel: [104, 70], fha: [108, 48] },
      STAND],
  },
  'jumping-lunge': {
    ms: 1300, muscles: [['thigh', 0.1, 0.9]],
    poses: [
      { head: [101, 50], sh: [100, 70], hip: [100, 114], kn: [128, 140], an: [126, 176],
        el: [96, 94], ha: [84, 112], fkn: [74, 146], fan: [66, 176], fel: [106, 94], fha: [118, 108] },
      { head: [101, 34], sh: [100, 54], hip: [100, 96], kn: [112, 124], an: [108, 156],
        el: [96, 78], ha: [88, 96], fkn: [88, 128], fan: [84, 158], fel: [104, 78], fha: [112, 96] },
      { head: [101, 50], sh: [100, 70], hip: [100, 114], kn: [72, 142], an: [68, 176],
        el: [106, 94], ha: [118, 110], fkn: [126, 142], fan: [128, 176], fel: [94, 94], fha: [82, 110] },
      { head: [101, 34], sh: [100, 54], hip: [100, 96], kn: [90, 126], an: [86, 158],
        el: [104, 78], ha: [112, 96], fkn: [110, 126], fan: [112, 158], fel: [96, 78], fha: [88, 96] },
    ],
  },
  'run': {
    ms: 620, muscles: [['thigh', 0.1, 0.85], ['shin', 0.1, 0.7]],
    poses: [
      { head: [103, 44], sh: [100, 66], hip: [100, 110], kn: [124, 132], an: [136, 160],
        el: [90, 92], ha: [78, 108], fkn: [80, 138], fan: [66, 158], fel: [112, 90], fha: [124, 104] },
      { head: [103, 40], sh: [100, 62], hip: [100, 106], kn: [104, 138], an: [100, 172],
        el: [100, 88], ha: [100, 110], fkn: [98, 136], fan: [96, 170], fel: [100, 88], fha: [100, 110] },
      { head: [103, 44], sh: [100, 66], hip: [100, 110], kn: [78, 138], an: [64, 158],
        el: [112, 90], ha: [124, 104], fkn: [122, 132], fan: [134, 160], fel: [90, 92], fha: [78, 108] },
      { head: [103, 40], sh: [100, 62], hip: [100, 106], kn: [102, 138], an: [98, 172],
        el: [100, 88], ha: [100, 110], fkn: [100, 136], fan: [98, 170], fel: [100, 88], fha: [100, 110] },
    ],
  },
  'burpee': {
    ms: 2600, muscles: [['thigh', 0.1, 0.85], ['torso', 0.6, 0.95], ['upperarm', 0.2, 0.86]],
    poses: [
      STAND,
      { head: [96, 74], sh: [94, 94], hip: [92, 130], kn: [118, 148], an: [102, 176],
        el: [100, 120], ha: [104, 160], fkn: [112, 148], fan: [97, 176], fel: [96, 120], fha: [100, 160] },
      { head: [40, 128], sh: [62, 136], hip: [116, 150], kn: [152, 160], an: [182, 168],
        el: [58, 156], ha: [62, 172], fkn: [148, 162], fan: [178, 170], fel: [56, 156], fha: [60, 172] },
      { head: [96, 74], sh: [94, 94], hip: [92, 130], kn: [118, 148], an: [102, 176],
        el: [100, 120], ha: [104, 160], fkn: [112, 148], fan: [97, 176], fel: [96, 120], fha: [100, 160] },
      { head: [101, 24], sh: [100, 44], hip: [100, 88], kn: [102, 122], an: [100, 154],
        el: [96, 24], ha: [94, 6], fkn: [96, 122], fan: [94, 154], fel: [104, 24], fha: [106, 6] },
      STAND,
    ],
  },
  'reverse-lunge': {
    ms: 2000, muscles: [['thigh', 0.1, 0.9]],
    poses: [STAND,
      { head: [101, 54], sh: [100, 74], hip: [100, 118], kn: [126, 142], an: [124, 176],
        el: [96, 98], ha: [86, 114], fkn: [76, 148], fan: [68, 176], fel: [106, 98], fha: [116, 112] },
      STAND],
  },
  'arm-circle': {
    ms: 1800, muscles: [['upperarm', 0.1, 0.9]],
    poses: [STAND,
      Object.assign({}, STAND, { el: [112, 70], ha: [128, 58], fel: [88, 70], fha: [72, 58] }),
      Object.assign({}, STAND, { el: [108, 48], ha: [116, 28], fel: [92, 48], fha: [84, 28] }),
      Object.assign({}, STAND, { el: [90, 68], ha: [78, 56], fel: [110, 68], fha: [122, 56] }),
      STAND],
  },
};

// ── the push-up keeps its own geometry ───────────────────────────────
// A rigid body pivoting on the toes with the hand planted, which is what
// a push-up is. Interpolating poses cannot hold a hand still.
const PU = (function () {
  const T = { x: 190, y: 170 }, HAND = [62, 170];
  const V = { x: -135.7, y: -64 }, L = Math.hypot(V.x, V.y);
  const u = { x: V.x / L, y: V.y / L }, n = { x: -V.y / L, y: V.x / L };
  const J = { an: [13, 15], kn: [62, 2], hip: [92, 0], ch: [126, 2],
              sh: [150, 1], nk: [160, 7], hd: [178, 11] };
  const rot = (v, p) => ({ x: v.x * Math.cos(p) - v.y * Math.sin(p),
                           y: v.x * Math.sin(p) + v.y * Math.cos(p) });
  const at = (k, p) => {
    const uu = rot(u, p), nn = rot(n, p), d = J[k][0], o = J[k][1];
    return [T.x + uu.x * d + nn.x * o, T.y + uu.y * d + nn.y * o];
  };
  const ik = (S, H, a, b, sg) => {
    const dx = H[0] - S[0], dy = H[1] - S[1], d = Math.hypot(dx, dy);
    const dc = Math.min(d, a + b - 0.01);
    const m = (a * a - b * b + dc * dc) / (2 * dc);
    const h = Math.sqrt(Math.max(0, a * a - m * m));
    const ux = dx / d, uy = dy / d;
    return [S[0] + ux * m + sg * -uy * h, S[1] + uy * m + sg * ux * h];
  };
  return (t) => {
    const p = -0.157 * t, sh = at('sh', p);
    return { head: at('hd', p), nk: at('nk', p), sh, ch: at('ch', p), hip: at('hip', p),
             kn: at('kn', p), an: at('an', p), toe: [T.x, T.y],
             el: ik(sh, HAND, 35, 33, -1), ha: HAND };
  };
})();

const lerp = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
const ease = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

function poseAt(def, ms) {
  const n = def.poses.length - 1;
  const f = ((ms % def.ms) / def.ms) * n;
  const i = Math.floor(f), k = ease(f - i);
  const a = def.poses[i], b = def.poses[Math.min(n, i + 1)];
  const out = {};
  for (const key of Object.keys(a)) out[key] = lerp(a[key], b[key] || a[key], k);
  return out;
}

const mk = (p, t, at) => {
  const e = document.createElementNS(NS, t);
  for (const k in at) e.setAttribute(k, at[k]);
  p.appendChild(e);
  return e;
};
const line = (p, a, b, w, c) => mk(p, 'line',
  { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: c, 'stroke-width': w, 'stroke-linecap': 'round' });
const part = (a, b, f0, f1) => [lerp(a, b, f0), lerp(a, b, f1)];

/// Draws one movement into `g` at time `ms`. A movement with no art yet
/// gets a figure that breathes, which beats an empty panel.
export function drawMovement(g, id, ms) {
  while (g.firstChild) g.removeChild(g.firstChild);
  line(g, [26, 178], [174, 178], 2, '#20242a');

  if (id === 'push-up' || id === 'pushup') {
    const DN = 1100, HO = 140, UP = 850, TP = 280, C = DN + HO + UP + TP, m = ms % C;
    let t;
    if (m < DN) t = ease(m / DN);
    else if (m < DN + HO) t = 1;
    else if (m < DN + HO + UP) t = 1 - ease((m - DN - HO) / UP);
    else t = 0;
    const q = PU(t);
    line(g, q.hip, q.kn, 13, DIM); line(g, q.kn, q.an, 10, DIM); line(g, q.an, q.toe, 8, DIM);
    line(g, q.hip, q.nk, 19, INK); line(g, q.ch, q.sh, 21, INK); line(g, q.sh, q.nk, 10, INK);
    mk(g, 'circle', { cx: q.head[0], cy: q.head[1], r: 12, fill: INK });
    line(g, q.sh, q.el, 11, INK); line(g, q.el, q.ha, 9.5, INK);
    line(g, q.ha, [q.ha[0] - 11, q.ha[1]], 8, INK);
    const tri = part(q.sh, q.el, 0.2, 0.86); line(g, tri[0], tri[1], 6, MUS);
    const pec = part(q.hip, q.sh, 0.62, 0.95); line(g, pec[0], pec[1], 15, MUS);
    return;
  }

  const def = MOVES[id === 'jog' ? 'run' : id] || FALLBACK;

  const q = poseAt(def, id === 'jog' ? ms / 1.5 : ms);
  line(g, q.hip, q.fkn, 10, DIM); line(g, q.fkn, q.fan, 8, DIM);
  line(g, q.sh, q.fel, 8, DIM); line(g, q.fel, q.fha, 7, DIM);
  line(g, q.hip, q.kn, 13, INK); line(g, q.kn, q.an, 10, INK);
  line(g, q.hip, q.sh, 19, INK);
  mk(g, 'circle', { cx: q.head[0], cy: q.head[1], r: 11.5, fill: INK });
  line(g, q.sh, q.el, 10, INK); line(g, q.el, q.ha, 8.5, INK);

  const bone = { thigh: [q.hip, q.kn], shin: [q.kn, q.an], upperarm: [q.sh, q.el],
                 forearm: [q.el, q.ha], torso: [q.hip, q.sh] };
  for (const m2 of def.muscles) {
    const bb = bone[m2[0]];
    if (!bb) continue;
    const seg = part(bb[0], bb[1], m2[1], m2[2]);
    line(g, seg[0], seg[1], m2[0] === 'torso' ? 14 : 6, MUS);
  }
}

/// The tempo a movement runs at, so panels can be staggered rather than
/// all pulsing together.
export function cycleMs(id) {
  if (id === 'push-up' || id === 'pushup') return 2370;
  if (id === 'jog') return MOVES.run.ms * 1.5;
  return (MOVES[id] || { ms: 1400 }).ms;
}
