// KISEKI reminder sender — runs every 5 minutes via GitHub Actions.
// Users can pick any HH:MM in the UI; delivery lands within a 5-minute
// window of that time (GitHub Actions cron practically can't guarantee
// tighter granularity than ~5 min, so we match on 5-min "slots").
const admin = require('firebase-admin');

const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

function jstNow() {
  return new Date(Date.now() + 9 * 3600 * 1000); // UTC+9, read fields as UTC
}
function slotOf(hh, mm) {
  return Math.floor((hh * 60 + mm) / 5) * 5;
}

async function main() {
  const now = jstNow();
  const hour = now.getUTCHours(), minute = now.getUTCMinutes();
  const y = now.getUTCFullYear(), m = now.getUTCMonth() + 1, d = now.getUTCDate();
  const curK = `${y}-${String(m).padStart(2, '0')}`;
  const todayStr = `${curK}-${String(d).padStart(2, '0')}`;
  const nowSlot = slotOf(hour, minute);
  console.log(`JST ${todayStr} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} (slot ${nowSlot}) — checking users...`);

  const userRefs = await db.collection('users').listDocuments();
  let sent = 0, skipped = 0;

  for (const uref of userRefs) {
    try {
      const pushSnap = await uref.collection('tracker').doc('push').get();
      if (!pushSnap.exists) { skipped++; continue; }
      const p = pushSnap.data();
      if (!p.enabled || !p.token) { skipped++; continue; }
      const userSlot = slotOf(Number(p.hour) || 0, Number(p.minute) || 0);
      if (userSlot !== nowSlot) { skipped++; continue; }
      if (p.lastSent === todayStr) { skipped++; continue; }

      // Skip if the user already marked something today
      const mainSnap = await uref.collection('tracker').doc('main').get();
      if (mainSnap.exists) {
        try {
          const D = JSON.parse(mainSnap.data().data || '{}');
          const marks = (D[curK] && D[curK].marks) || {};
          const markedToday = Object.values(marks).some(row => row && row[d] != null);
          if (markedToday) { skipped++; continue; }
        } catch (e) { /* data parse failed — still send */ }
      }

      await admin.messaging().send({
        token: p.token,
        data: {
          title: 'KISEKI',
          body: '今日の記録がまだです。ストリークを守りましょう 🔥'
        },
        webpush: { headers: { Urgency: 'high', TTL: '3600' } }
      });
      await pushSnap.ref.set({ lastSent: todayStr }, { merge: true });
      sent++;
    } catch (err) {
      if (err.code === 'messaging/registration-token-not-registered') {
        await uref.collection('tracker').doc('push').set({ enabled: false }, { merge: true });
        console.log(`disabled stale token for ${uref.id}`);
      } else {
        console.error(`error for ${uref.id}:`, err.message);
      }
    }
  }
  console.log(`done. sent=${sent} skipped=${skipped}`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
