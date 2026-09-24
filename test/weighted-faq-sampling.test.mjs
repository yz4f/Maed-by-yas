import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../lib/weighted-faq-sampling.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { weightedFaqSample } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const faqs = [
  ...Array.from({ length: 8 }, (_, index) => ({ id: `owned-${index}`, productId: 'owned', weight: 1 })),
  ...Array.from({ length: 8 }, (_, index) => ({ id: `other-${index}`, productId: 'other', weight: 1 })),
];

test('FAQ selection targets a 70/30 owned-product mix without duplicates', () => {
  const sample = weightedFaqSample(faqs, ['owned'], 10, () => 0.25);
  assert.equal(sample.length, 10);
  assert.equal(sample.filter((faq) => faq.productId === 'owned').length, 7);
  assert.equal(new Set(sample.map((faq) => faq.id)).size, sample.length);
});

test('FAQ selection fills from available products when one pool is empty', () => {
  const sample = weightedFaqSample(faqs.slice(0, 3), ['owned'], 10, () => 0.5);
  assert.equal(sample.length, 3);
  assert.equal(new Set(sample.map((faq) => faq.id)).size, 3);
});

test('FAQ selection distributes owned-product questions across the products', () => {
  const multiProductFaqs = [
    ...Array.from({ length: 10 }, (_, index) => ({ id: `a-${index}`, productId: 'owned-a', weight: 1 })),
    ...Array.from({ length: 10 }, (_, index) => ({ id: `b-${index}`, productId: 'owned-b', weight: 1 })),
    ...Array.from({ length: 10 }, (_, index) => ({ id: `other-${index}`, productId: 'other', weight: 1 })),
  ];
  const sample = weightedFaqSample(multiProductFaqs, ['owned-a', 'owned-b'], 20, () => 0.5);
  const countA = sample.filter((faq) => faq.productId === 'owned-a').length;
  const countB = sample.filter((faq) => faq.productId === 'owned-b').length;
  assert.equal(countA + countB, 14);
  assert.equal(Math.abs(countA - countB), 0);
});
