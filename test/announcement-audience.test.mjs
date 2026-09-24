import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../lib/announcement-audience.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { hasRecentAnnouncementActivity, isEligibleAnnouncementRecipient, shouldCountAnnouncementRead } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

test('broadcast eligibility excludes banned and archived accounts', () => {
  assert.equal(isEligibleAnnouncementRecipient({}), true);
  assert.equal(isEligibleAnnouncementRecipient({ isBanned: true }), false);
  assert.equal(isEligibleAnnouncementRecipient({ isArchived: true }), false);
});

test('active audience uses a bounded rolling 30-day window and rejects future dates', () => {
  const now = Date.parse('2026-09-24T12:00:00.000Z');
  assert.equal(hasRecentAnnouncementActivity({ lastLogin: '2026-09-10T12:00:00.000Z' }, now), true);
  assert.equal(hasRecentAnnouncementActivity({ lastLogin: '2026-08-20T11:59:59.999Z' }, now), false);
  assert.equal(hasRecentAnnouncementActivity({ lastLogin: '2026-09-25T12:00:00.000Z' }, now), false);
  assert.equal(hasRecentAnnouncementActivity({ lastLogin: 'not-a-date' }, now), false);
});

test('announcement read receipts increment once for each updated version', () => {
  assert.equal(shouldCountAnnouncementRead(null, 'version-1'), true);
  assert.equal(shouldCountAnnouncementRead({ announcementId: 'a1', announcementUpdatedAt: 'version-1', readAt: '2026-01-01' }, 'version-1'), false);
  assert.equal(shouldCountAnnouncementRead({ announcementId: 'a1', announcementUpdatedAt: 'version-1', readAt: '2026-01-01' }, 'version-2'), true);
  assert.equal(shouldCountAnnouncementRead({ announcementId: 'a1', announcementUpdatedAt: 'version-1', readAt: null }, 'version-1'), true);
});
