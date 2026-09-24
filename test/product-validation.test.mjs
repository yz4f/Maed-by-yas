import test from 'node:test';
import assert from 'node:assert/strict';
import { productCreateSchema, productUpdateSchema } from '../lib/product-validation.mjs';

test('product creation validates required data and defaults optional fields', () => {
  const result = productCreateSchema.safeParse({
    id: 'prod-new', name: 'New product', image: '/products/new.png', category: 'Utility',
    version: '1.0', fileUrl: '/downloads/new.zip',
  });
  assert.equal(result.success, true);
  assert.equal(result.data.description, '');
  assert.equal(result.data.cardColor, 'blue');
  assert.equal(result.data.lowStockThreshold, 5);
  assert.equal(result.data.downloadsCount, undefined);
});

test('product creation rejects missing required fields and invalid colors', () => {
  assert.equal(productCreateSchema.safeParse({ id: 'prod-x', name: 'X' }).success, false);
  assert.equal(productCreateSchema.safeParse({
    id: 'prod-x', name: 'Product X', image: '/x.png', category: 'Tool', version: '1', fileUrl: '/x.zip', cardColor: 'red',
  }).success, false);
  assert.equal(productCreateSchema.safeParse({
    id: 'prod-x', name: 'Product X', image: '/x.png', category: 'Tool', version: '1', fileUrl: '/x.zip', lowStockThreshold: -1,
  }).success, false);
});

test('product update accepts only editable fields and rejects empty or protected fields', () => {
  assert.equal(productUpdateSchema.safeParse({ name: 'Renamed product' }).success, true);
  assert.equal(productUpdateSchema.safeParse({ lowStockThreshold: 0 }).success, true);
  assert.equal(productUpdateSchema.safeParse({}).success, false);
  assert.equal(productUpdateSchema.safeParse({ isArchived: true }).success, false);
});
