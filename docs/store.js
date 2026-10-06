// ─────────────────────────────────────────────────────────────────────
// STORE — the one value the TV and the phone share.
//
// Firestore doc `gymboard/tv` holds which session is on screen. The phone
// writes it, the TV listens. That is the entire protocol.
//
// Reuses the foos-6ecf3 project that the foos league and Parchis already
// live in, with anonymous auth, so there is nothing new to administer.
// ─────────────────────────────────────────────────────────────────────

const SDK = 'https://www.gstatic.com/firebasejs/10.12.2';

let _db = null;
let _doc = null;

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
    localCache: fs.persistentLocalCache({
      tabManager: fs.persistentSingleTabManager(),
    }),
  });

  await authMod.signInAnonymously(authMod.getAuth(app));

  _doc = { fs, ref: fs.doc(_db, 'gymboard', 'tv') };
  return _db;
}

/// Phone side. Puts a session on the TV, or clears it with null.
export async function select(sessionId) {
  await connect();
  const { fs, ref } = _doc;
  await fs.setDoc(ref, {
    selected: sessionId,
    at: fs.serverTimestamp(),
  }, { merge: true });
}

/// TV side. Calls back with the session id every time it changes, and
/// once immediately with whatever is already there.
export async function watch(onChange) {
  await connect();
  const { fs, ref } = _doc;
  return fs.onSnapshot(ref, (snap) => {
    onChange(snap.exists() ? (snap.data().selected ?? null) : null);
  }, () => {
    // A dropped listener is not worth clearing the screen over. Firestore
    // reconnects on its own and the next snapshot repaints.
  });
}
