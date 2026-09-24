import type { ProductFaq } from '@/types';

function pickWeighted(items: ProductFaq[], random: () => number): ProductFaq | undefined {
  if (!items.length) return undefined;
  const total = items.reduce((sum, item) => sum + Math.max(1, item.weight || 1), 0);
  let cursor = random() * total;
  return items.find((item) => (cursor -= Math.max(1, item.weight || 1)) <= 0) || items[0];
}

export function weightedFaqSample(items: ProductFaq[], preferredIds: string[], count: number, random = Math.random) {
  const available = [...items];
  const preferred = new Set(preferredIds);
  const owned = available.filter((item) => preferred.has(item.productId));
  const other = available.filter((item) => !preferred.has(item.productId));
  if (!owned.length) return take(other, Math.min(count, other.length), random);
  if (!other.length) return take(owned, Math.min(count, owned.length), random);

  const desiredOwned = Math.round(Math.min(count, available.length) * 0.7);
  const selectedOwned = takeBalancedByProduct(owned, Math.min(desiredOwned, owned.length), random);
  const selectedOther = take(other, Math.min(count - selectedOwned.length, other.length), random);
  const selected = [...selectedOwned, ...selectedOther];
  if (selected.length < count) {
    const remaining = [...owned, ...other].filter((item) => !selected.some((picked) => picked.id === item.id));
    selected.push(...take(remaining, Math.min(count - selected.length, remaining.length), random));
  }
  return selected.sort(() => random() - 0.5);
}

function takeBalancedByProduct(items: ProductFaq[], count: number, random: () => number) {
  const available = [...items];
  const picked: ProductFaq[] = [];
  const counts = new Map<string, number>();
  while (available.length && picked.length < count) {
    const products = Array.from(new Set(available.map((item) => item.productId)));
    const minimum = Math.min(...products.map((productId) => counts.get(productId) || 0));
    const balancedProducts = products.filter((productId) => (counts.get(productId) || 0) === minimum);
    const productId = balancedProducts[Math.floor(random() * balancedProducts.length)] || products[0];
    const group = available.filter((item) => item.productId === productId);
    const selected = pickWeighted(group, random);
    if (!selected) break;
    picked.push(selected);
    counts.set(productId, (counts.get(productId) || 0) + 1);
    available.splice(available.findIndex((item) => item.id === selected.id), 1);
  }
  return picked;
}

function take(items: ProductFaq[], count: number, random: () => number) {
  const available = [...items];
  const picked: ProductFaq[] = [];
  while (available.length && picked.length < count) {
    const selected = pickWeighted(available, random);
    if (!selected) break;
    picked.push(selected);
    available.splice(available.findIndex((item) => item.id === selected.id), 1);
  }
  return picked;
}
