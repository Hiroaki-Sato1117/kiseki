// ============================================================
// Cloud sync module (Firebase Auth + Firestore)
// Loads only when FIREBASE_CONFIG is filled in. The app works
// fully offline/local without it.
// ============================================================
const cfg = window.FIREBASE_CONFIG;
if (cfg && cfg.apiKey && !String(cfg.apiKey).includes('PASTE')) {
  try {
    const [{ initializeApp }, authMod, fsMod] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js')
    ]);
    const { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } = authMod;
    const { getFirestore, doc, getDoc, setDoc, onSnapshot } = fsMod;
    const app = initializeApp(cfg);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const userDoc = () => doc(db, 'users', auth.currentUser.uid, 'tracker', 'main');
    let unsub = null;
    window.CLOUD = {
      enabled: true,
      user: null,
      signIn: () => signInWithPopup(auth, new GoogleAuthProvider()),
      signOut: () => signOut(auth),
      save: (json, updatedAt) => setDoc(userDoc(), { data: json, updatedAt }),
      load: async () => { const s = await getDoc(userDoc()); return s.exists() ? s.data() : null; },
      subscribe: (cb) => { if (unsub) unsub(); unsub = onSnapshot(userDoc(), s => { if (s.exists() && !s.metadata.hasPendingWrites) cb(s.data()); }); },
      unsubscribe: () => { if (unsub) { unsub(); unsub = null; } },
      pushDoc: () => doc(db, 'users', auth.currentUser.uid, 'tracker', 'push'),
      pushSupported: async () => {
        const vk = window.FIREBASE_VAPID_KEY;
        if (!vk || String(vk).includes('PASTE') || !('Notification' in window) || !('serviceWorker' in navigator)) return false;
        try { const m = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js'); return await m.isSupported(); } catch (e) { return false; }
      },
      pushEnable: async (hour) => {
        const m = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js');
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') throw new Error('通知が許可されませんでした');
        const reg = await navigator.serviceWorker.ready;
        const token = await m.getToken(m.getMessaging(app), { vapidKey: window.FIREBASE_VAPID_KEY, serviceWorkerRegistration: reg });
        await setDoc(window.CLOUD.pushDoc(), { token, hour, tz: 'Asia/Tokyo', enabled: true, updatedAt: Date.now() });
        return token;
      },
      pushDisable: async () => { await setDoc(window.CLOUD.pushDoc(), { enabled: false, updatedAt: Date.now() }, { merge: true }); },
      pushStatus: async () => { const s = await getDoc(window.CLOUD.pushDoc()); return s.exists() ? s.data() : null; }
    };
    onAuthStateChanged(auth, u => { window.CLOUD.user = u; if (window.onCloudAuth) window.onCloudAuth(u); });
  } catch (e) { console.warn('Cloud sync unavailable:', e); window.CLOUD = { enabled: false }; if (window.onCloudAuth) window.onCloudAuth(null); }
} else {
  window.CLOUD = { enabled: false };
}
