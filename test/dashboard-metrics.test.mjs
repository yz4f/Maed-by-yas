import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../lib/dashboard-metrics.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { getDashboardMetrics, getRecentDashboardRecords } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

test('dashboard metrics count recent non-archived users and current licenses from records', () => {
  const now = Date.parse('2026-09-24T12:00:00.000Z');
  const metrics = getDashboardMetrics(
    [
      { lastLogin: '2026-09-20T12:00:00.000Z' },
      { lastLogin: '2026-08-01T12:00:00.000Z' },
      { lastLogin: '2026-09-23T12:00:00.000Z', isArchived: true },
      { lastLogin: '2026-09-25T12:00:00.000Z' },
    ],
    [
      { isUsed: true, usedAt: '2026-09-24T02:00:00.000Z' },
      { isUsed: false, usedAt: '2026-09-24T03:00:00.000Z' },
      { isUsed: true, usedAt: '2026-09-23T23:59:00.000Z' },
    ],
    [
      { status: 'Active', expiresAt: '2026-09-25T00:00:00.000Z' },
      { status: 'Active' },
      { status: 'Active', expiresAt: '2026-09-24T12:00:00.000Z' },
      { status: 'Expired' },
    ],
    now,
  );
  assert.deepEqual(metrics, { activeUsers: 1, activeKeys: 2, expiredKeys: 2, todayActivations: 1 });
});

test('dashboard recent lists use only real, dated records and do not expose license codes', () => {
  const records = getRecentDashboardRecords(
    [
      { id: 'u1', name: 'Latest', discordId: 'd1', createdAt: '2026-09-24T10:00:00.000Z' },
      { id: 'u2', name: 'Archived', discordId: 'd2', createdAt: '2026-09-24T11:00:00.000Z', isArchived: true },
    ],
    [
      { id: 'k1', key: 'SECRET-ONE', productId: 'p1', isUsed: true, usedAt: '2026-09-24T09:00:00.000Z', usedByUserId: 'u1' },
      { id: 'k2', key: 'SECRET-TWO', productId: 'p1', isUsed: true, usedAt: '2026-09-24T10:00:00.000Z', usedByUserName: 'Latest' },
      { id: 'k3', key: 'UNUSED', productId: 'p1', isUsed: false, usedAt: '2026-09-24T11:00:00.000Z' },
    ],
    [{ id: 'p1', name: 'Tool' }],
    1,
  );
  assert.deepEqual(records.recentUsers.map(({ name }) => name), ['Latest']);
  assert.deepEqual(records.recentActivations.map(({ userName, productName }) => ({ userName, productName })), [{ userName: 'Latest', productName: 'Tool' }]);
  assert.equal(JSON.stringify(records).includes('SECRET-'), false);
});
