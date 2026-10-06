// ─────────────────────────────────────────────────────────────────────
// STORE — one document, `gymboard/session`, holding what is happening.
//
// The phone writes it, the TV reads it. The state is DECLARATIVE: it
// says what started when, never what time it is now. Rest ending and a
// circuit starting need no write, because both surfaces work them out
// from the clock. A sleeping phone cannot stall the board.
// ─────────────────────────────────────────────────────────────────────

const SDK = 'https://www.gstatic.com/firebasejs/10.12.2';
let _db = null, _refs = null;

async function connect() {
  if (_db) return _db;
  const [appMod, authMod, fs] = await Promise.all([
    import(`${SDK}/firebase-app.js`),
    import(`${SDK}/firebase-auth.js`),
    import(`${SDK}/firebase-firestore.js`),
  ]);
  const app = appMod.initializeApp({
    apiKey: 'AIzaSyC2bOtXmNLzwJy3QsDkk1tQRBD_wMdhzcM',
    authDomain: 'foos-6ecf3.firebaseapp.com',
    projectId: 'foos-6ecf3',
    storageBucket: 'foos-6ecf3.firebasestorage.app',
    messagingSenderId: '730132593509',
    appId: '1:730132593509:web:6379dde4e6a92be09d7f8c',
  });
  _db = fs.initializeFirestore(app, {
    localCache: fs.persistentLocalCache({ tabManager: fs.persistentSingleTabManager() }),
  });
  await authMod.signInAnonymously(authMod.getAuth(app));
  // History lives in a sibling DOCUMENT, not a subcollection, because the
  // published rules match gymboard/{doc} one level deep. One less thing to
  // republish in the console.
  _refs = { fs, session: fs.doc(_db, 'gymboard', 'session'),
            history: fs.doc(_db, 'gymboard', 'history') };
  return _db;
}

export async function setSession(state) {
  await connect();
  const { fs, session } = _refs;
  await fs.setDoc(session, state);
}

export async function watchSession(onChange) {
  await connect();
  const { fs, session } = _refs;
  return fs.onSnapshot(session, (snap) => {
    onChange(snap.exists() ? snap.data() : null);
  }, () => { /* keep the last state on screen */ });
}

/// A finished workout, kept so the lifetime numbers have something to add up.
export async function recordWorkout(rec) {
  await connect();
  const { fs, history } = _refs;
  await fs.setDoc(history, { done: fs.arrayUnion({ ...rec, at: Date.now() }) }, { merge: true });
}

/// Which routines are behind you, so the app can offer the next one.
export async function getDone() {
  await connect();
  const { fs, history } = _refs;
  const snap = await fs.getDoc(history);
  const done = (snap.exists() && snap.data().done) || [];
  return done.map((d) => d.routineId);
}

export async function lifetime() {
  await connect();
  const { fs, history } = _refs;
  const snap = await fs.getDoc(history);
  const done = (snap.exists() && snap.data().done) || [];
  return done.reduce((a, v) => ({ workouts: a.workouts + 1, ms: a.ms + (v.ms || 0),
    reps: a.reps + (v.reps || 0) }), { workouts: 0, ms: 0, reps: 0 });
}
