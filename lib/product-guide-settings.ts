import { z } from 'zod';
import type { Product } from '@/types';
import { GUIDE_ARTICLES } from '@/lib/guide-library';

const guideSettingsSchema = z.object({
  notice: z.object({
    enabled: z.boolean(), title: z.string().trim().max(160), text: z.string().trim().max(3000),
    type: z.enum(['Information', 'Warning', 'Important', 'Error']),
    placements: z.array(z.enum(['beforePurchase', 'afterPurchase', 'guide', 'video'])).max(4).transform(items => [...new Set(items)]),
  }).optional(),
  guideSections: z.array(z.string().refine(id => GUIDE_ARTICLES.some(article => article.id === id), 'Unknown guide section')).max(30).transform(items => [...new Set(items)]).optional(),
});

export function validateProductGuideFields<T extends Partial<Product>>(product: T): T {
  return { ...product, ...guideSettingsSchema.parse(product) };
}
