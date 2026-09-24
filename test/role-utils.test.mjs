import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../lib/role-utils.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { normalizeRole, canManageRole, resolveCurrentRole } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

test('maps legacy and current privileged role names', () => {
  assert.equal(normalizeRole('Boss'), 'Owner');
  assert.equal(normalizeRole('Owner'), 'Owner');
  assert.equal(normalizeRole('Co-Boss'), 'Admin');
  assert.equal(normalizeRole('Admin'), 'Admin');
});

test('preserves staff roles and defaults unknown roles to Customer', () => {
  assert.equal(normalizeRole('Moderator'), 'Moderator');
  assert.equal(normalizeRole('Staff'), 'Staff');
  assert.equal(normalizeRole('Customer'), 'Customer');
  assert.equal(normalizeRole('unexpected'), 'Customer');
  assert.equal(normalizeRole(null), 'Customer');
});

test('role hierarchy prevents peers and lower roles from managing higher roles or Owner', () => {
  assert.equal(canManageRole('Owner', 'Admin'), true);
  assert.equal(canManageRole('Admin', 'Moderator'), true);
  assert.equal(canManageRole('Moderator', 'Staff'), true);
  assert.equal(canManageRole('Staff', 'Customer'), true);
  assert.equal(canManageRole('Admin', 'Admin'), false);
  assert.equal(canManageRole('Staff', 'Moderator'), false);
  assert.equal(canManageRole('Admin', 'Owner'), false);
  assert.equal(canManageRole('Boss', 'Boss'), false);
});

test('uses the latest database role while preserving Discord-managed privileged roles', () => {
  assert.equal(resolveCurrentRole('Admin', 'Staff'), 'Staff');
  assert.equal(resolveCurrentRole('Staff', 'Admin'), 'Admin');
  assert.equal(resolveCurrentRole('Boss', 'Customer'), 'Owner');
  assert.equal(resolveCurrentRole('Co-Boss', 'Customer'), 'Admin');
  assert.equal(resolveCurrentRole('Customer', 'Owner'), 'Customer');
});
