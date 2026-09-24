import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAnnouncementRecord } from '../lib/announcement-normalize.mjs';

test('legacy announcements without sort and audience fields remain deliverable', () => {
  const record = normalizeAnnouncementRecord({
    title: 'تحديث مهم',
    content: 'تم تحديث المتجر',
    createdAt: '2026-09-20T12:00:00.000Z',
  }, 'legacy-announcement');

  assert.equal(record.id, 'legacy-announcement');
  assert.equal(record.titleAr, 'تحديث مهم');
  assert.equal(record.titleEn, 'تحديث مهم');
  assert.equal(record.contentAr, 'تم تحديث المتجر');
  assert.equal(record.contentEn, 'تم تحديث المتجر');
  assert.equal(record.audienceType, 'ALL');
  assert.equal(record.startsAt, '2026-09-20T12:00:00.000Z');
  assert.equal(record.priority, 0);
  assert.equal(record.status, 'ACTIVE');
  assert.equal(record.dismissible, true);
});

test('current announcements retain their targeting, bilingual fields and state', () => {
  const record = normalizeAnnouncementRecord({
    id: 'current',
    titleAr: 'العنوان',
    titleEn: 'Title',
    contentAr: 'المحتوى',
    contentEn: 'Content',
    audienceType: 'PRODUCT',
    audienceValue: 'product-1',
    startsAt: '2026-09-22T12:00:00.000Z',
    priority: 12,
    status: 'SCHEDULED',
    dismissible: false,
  }, 'document-id');

  assert.equal(record.id, 'current');
  assert.equal(record.audienceType, 'PRODUCT');
  assert.equal(record.audienceValue, 'product-1');
  assert.equal(record.titleEn, 'Title');
  assert.equal(record.status, 'SCHEDULED');
  assert.equal(record.priority, 12);
  assert.equal(record.dismissible, false);
});
