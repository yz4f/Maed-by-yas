import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../lib/product-faq-filter.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { filterProductFaqRecords } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

const faqs = [
  { id: 'a1', productId: 'active', enabled: true },
  { id: 'a2', productId: 'active', enabled: false },
  { id: 'archived', productId: 'archived', enabled: true },
];

test('public FAQs include enabled questions only for available products', () => {
  assert.deepEqual(filterProductFaqRecords(faqs, { productIds: ['active'] }).map(({ id }) => id), ['a1']);
  assert.deepEqual(filterProductFaqRecords(faqs, { productIds: [] }), []);
});

test('admin FAQ view can include disabled records while retaining product scope', () => {
  assert.deepEqual(filterProductFaqRecords(faqs, { includeDisabled: true, productIds: ['active'] }).map(({ id }) => id), ['a1', 'a2']);
  assert.deepEqual(filterProductFaqRecords(faqs, { includeDisabled: true }).map(({ id }) => id), ['a1', 'a2', 'archived']);
});
