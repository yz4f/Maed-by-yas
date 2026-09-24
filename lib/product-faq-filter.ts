type FaqFilterRecord = { enabled: boolean; productId: string };

export function filterProductFaqRecords<T extends FaqFilterRecord>(faqs: T[], options: { includeDisabled?: boolean; productIds?: string[] }) {
  const allowedProducts = options.productIds === undefined ? null : new Set(options.productIds);
  return faqs.filter((faq) => (options.includeDisabled || faq.enabled) && (!allowedProducts || allowedProducts.has(faq.productId)));
}
