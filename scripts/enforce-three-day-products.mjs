// One-time, repeatable production migration. Dry run by default; use --apply to write.
// A local backup contains only changed fields and document IDs, never key strings.
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { initializeApp } from 'firebase/app';
import { collection, doc, getDoc, getDocs, getFirestore, query, where, writeBatch } from 'firebase/firestore';

const PROJECT_ID = 'tnnn-aa170';
const PRODUCT_IDS = ['prod-fortnite', 'prod-hwid-master'];
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const apply = process.argv.includes('--apply');
const db = getFirestore(initializeApp({
  apiKey: 'AIzaSyDrMw5gxptqdancpaoSu2Mg0_C1DcSVqn8',
  projectId: PROJECT_ID,
}));

const changes = [];
const missingDates = [];
const nowMs = Date.now();
const counts = {};

function plan(ref, current, updates) {
  const changed = Object.fromEntries(Object.entries(updates).filter(([field, value]) => current[field] !== value));
  if (!Object.keys(changed).length) return;
  changes.push({ ref, changed, previous: Object.fromEntries(Object.keys(changed).map((field) => [field, current[field] ?? null])) });
}

for (const productId of PRODUCT_IDS) {
  const snapshots = Object.fromEntries(await Promise.all(
    ['keys', 'userProducts', 'giveawayKeys', 'giveaways'].map(async (name) => [name, await getDocs(query(collection(db, name), where('productId', '==', productId)))])
  ));
  counts[productId] = Object.fromEntries(Object.entries(snapshots).map(([name, snapshot]) => [name, snapshot.size]));
  const licenseByKeyId = new Map();
  for (const licenseDoc of snapshots.userProducts.docs) {
    const license = licenseDoc.data();
    if (license.keyId) licenseByKeyId.set(license.keyId, license);
    const activatedMs = Date.parse(license.activatedAt || '');
    if (!Number.isFinite(activatedMs)) {
      missingDates.push(`userProducts/${licenseDoc.id}`);
      continue;
    }
    const expiresAt = new Date(activatedMs + THREE_DAYS_MS).toISOString();
    plan(licenseDoc.ref, license, {
      licenseDuration: '3 Days',
      startedAt: license.activatedAt,
      expiresAt,
      ...(license.status === 'Active' && activatedMs + THREE_DAYS_MS <= nowMs ? { status: 'Expired' } : {}),
    });
  }

  for (const keyDoc of snapshots.keys.docs) {
    const key = keyDoc.data();
    const updates = { duration: '3 Days' };
    if (key.isUsed && !key.isArchived && !key.isDisabled && !key.isRevoked) {
      const license = licenseByKeyId.get(keyDoc.id);
      const usedMs = Date.parse(license?.activatedAt || key.usedAt || '');
      if (Number.isFinite(usedMs)) updates.status = usedMs + THREE_DAYS_MS <= nowMs ? 'expired' : 'active';
      else missingDates.push(`keys/${keyDoc.id}`);
    }
    plan(keyDoc.ref, key, updates);
  }

  for (const keyDoc of snapshots.giveawayKeys.docs) plan(keyDoc.ref, keyDoc.data(), { duration: '3 Days' });
  for (const giveawayDoc of snapshots.giveaways.docs) plan(giveawayDoc.ref, giveawayDoc.data(), { duration: '3 Days' });

  const productRef = doc(db, 'products', productId);
  const productSnapshot = await getDoc(productRef);
  if (productSnapshot.exists()) {
    const product = productSnapshot.data();
    const durationNotice = 'مدة المفتاح 3 أيام من وقت التفعيل.';
    if (!String(product.description || '').includes(durationNotice)) {
      plan(productRef, product, { description: `${durationNotice}\n\n${String(product.description || '').replace(/ترخيص مدى الحياة|ترخيص دائم|مدى الحياة/g, 'ترخيص 3 أيام').replace('الاحترافي الدائم', 'الاحترافي')}`.trim() });
    }
  }
}

const summary = changes.reduce((result, item) => {
  const name = item.ref.parent.id;
  result[name] = (result[name] || 0) + 1;
  if (name === 'userProducts' && item.changed.status === 'Expired') result.expiredLicenses = (result.expiredLicenses || 0) + 1;
  return result;
}, {});
console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', sourceCounts: counts, plannedChanges: summary, missingDates: missingDates.length }, null, 2));
if (missingDates.length) throw new Error(`Missing activation dates in ${missingDates.length} records; no writes were made.`);
if (!apply || !changes.length) process.exit(0);

const backupDir = join(tmpdir(), 't3n-duration-migration');
mkdirSync(backupDir, { recursive: true });
const backupPath = join(backupDir, `before-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
writeFileSync(backupPath, JSON.stringify({ projectId: PROJECT_ID, capturedAt: new Date().toISOString(), changes: changes.map(({ ref, previous }) => ({ collection: ref.parent.id, id: ref.id, previous })) }, null, 2), { flag: 'wx', mode: 0o600 });

for (let start = 0; start < changes.length; start += 250) {
  const batch = writeBatch(db);
  for (const item of changes.slice(start, start + 250)) batch.update(item.ref, item.changed);
  await batch.commit();
  console.log(`Committed ${Math.min(start + 250, changes.length)}/${changes.length} changes`);
}
console.log(JSON.stringify({ applied: changes.length, backupPath }));
process.exit(0);
