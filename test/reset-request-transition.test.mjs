import test from 'node:test';
import assert from 'node:assert/strict';
import { canTransitionResetRequest } from '../lib/reset-request-transition.mjs';

test('reset completion is permitted only after approval', () => {
  assert.equal(canTransitionResetRequest('APPROVED', 'complete'), true);
  assert.equal(canTransitionResetRequest('PENDING', 'complete'), false);
  assert.equal(canTransitionResetRequest('COMPLETED', 'complete'), false);
});

test('terminal reset requests cannot be approved or rejected again', () => {
  for (const status of ['REJECTED', 'COMPLETED', 'CANCELLED']) {
    assert.equal(canTransitionResetRequest(status, 'approve'), false);
    assert.equal(canTransitionResetRequest(status, 'reject'), false);
    assert.equal(canTransitionResetRequest(status, 'request_info'), false);
  }
});

test('pending and customer-response requests allow review transitions', () => {
  for (const status of ['PENDING', 'WAITING_FOR_CUSTOMER']) {
    assert.equal(canTransitionResetRequest(status, 'approve'), true);
    assert.equal(canTransitionResetRequest(status, 'reject'), true);
    assert.equal(canTransitionResetRequest(status, 'request_info'), true);
  }
  assert.equal(canTransitionResetRequest('APPROVED', 'request_info'), true);
  assert.equal(canTransitionResetRequest('APPROVED', 'reject'), false);
});
