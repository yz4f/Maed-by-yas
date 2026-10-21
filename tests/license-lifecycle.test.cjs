const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../lib/license-duration.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
const api = {};
vm.runInNewContext(compiled.outputText, { exports: api, Date });
const now = Date.parse('2026-10-12T12:00:00Z');
const base = { id: 'new', userId: 'customer', productId: 'product', status: 'Active', activatedAt: '2026-10-12T10:00:00Z', startedAt: null, expiresAt: null };

test('first guide opening keeps a pending license usable and starts three days', () => {
  assert.equal(api.getLicenseState(base, now).isUsable, true);
  const timing = api.getGuideStartTiming(base, '3 Days', new Date(now).toISOString());
  assert.equal(timing.expiresAt, '2026-10-15T12:00:00.000Z');
  assert.equal(api.getLicenseState({ ...base, ...timing }, now).isUsable, true);
});

test('renewal selects the clicked license, never an old expired license', () => {
  const old = { ...base, id: 'old', startedAt: '2026-10-01T12:00:00Z', expiresAt: '2026-10-04T12:00:00Z' };
  assert.equal(api.selectGuideLicense([old, base], 'new', now).id, 'new');
  assert.equal(api.selectGuideLicense([old, base], 'old', now), undefined);
  assert.equal(api.selectGuideLicense([old, base], undefined, now).id, 'new');
  assert.equal(api.selectGuideLicense([old, base], 'someone-elses-license', now), undefined);
});

test('expiry wins over missing startedAt and the exact boundary is expired', () => {
  const legacy = { ...base, expiresAt: new Date(now).toISOString() };
  assert.equal(api.getLicenseState(legacy, now).isExpired, true);
  assert.equal(api.getLicenseState(legacy, now).isUsable, false);
  assert.equal(api.getLicenseState({ ...base, status: 'Expired' }, now).isExpired, true);
  assert.equal(api.getLicenseState({ ...base, status: 'Revoked' }, now).isUsable, false);
});

test('lifetime opening returns explicit null and stays active', () => {
  const timing = api.getGuideStartTiming({ ...base, expiresAt: '2026-10-15T12:00:00Z' }, 'Lifetime', new Date(now).toISOString());
  assert.equal(timing.expiresAt, null);
  assert.equal(api.getLicenseState({ ...base, ...timing }, now + 365 * 86400000).isUsable, true);
});

test('the two fixed-term products use three days even for legacy lifetime keys', () => {
  assert.equal(api.resolveProductKeyDuration('prod-hwid-master'), '3 Days');
  assert.equal(api.resolveProductKeyDuration('prod-hwid-master', 'Lifetime'), '3 Days');
  assert.equal(api.resolveProductKeyDuration('prod-fortnite', '3 Days'), '3 Days');
  const old = { ...base, startedAt: '2026-10-11T12:00:00Z', expiresAt: '2026-10-14T12:00:00Z' };
  assert.equal(api.getGuideStartTiming(old, api.resolveProductKeyDuration('prod-hwid-master', 'Lifetime'), new Date(now).toISOString()).expiresAt, old.expiresAt);
});

test('reopening and legacy finite licenses do not extend their deadline', () => {
  const started = { ...base, startedAt: '2026-10-11T12:00:00Z', expiresAt: '2026-10-14T12:00:00Z' };
  assert.equal(api.getGuideStartTiming(started, '3 Days', new Date(now).toISOString()).expiresAt, started.expiresAt);
  assert.equal(api.getGuideStartTiming({ ...started, startedAt: undefined }, '3 Days', new Date(now).toISOString()).expiresAt, started.expiresAt);
});
