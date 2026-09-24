import { z } from 'zod';

const optionalLink = z.string().trim().max(2000).nullable().optional();

export const productCreateSchema = z.object({
  id: z.string().trim().min(3).max(160),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(3000).default(''),
  image: z.string().trim().min(1).max(2000),
  cardColor: z.enum(['blue', 'cyan', 'purple', 'gold']).default('blue'),
  category: z.string().trim().min(1).max(100),
  version: z.string().trim().min(1).max(80),
  fileSize: z.string().trim().max(80).default(''),
  fileUrl: z.string().trim().min(1).max(2000),
  videoUrl: optionalLink,
  guideUrl: optionalLink,
  downloadsCount: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).optional(),
  lowStockThreshold: z.number().int().min(0).max(100000).default(5),
});

export const productUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(3000).optional(),
  image: z.string().trim().min(1).max(2000).optional(),
  cardColor: z.enum(['blue', 'cyan', 'purple', 'gold']).optional(),
  category: z.string().trim().min(1).max(100).optional(),
  displayOrder: z.number().int().min(0).max(1000000).optional(),
  version: z.string().trim().min(1).max(80).optional(),
  fileSize: z.string().trim().max(80).optional(),
  fileUrl: z.string().trim().min(1).max(2000).optional(),
  videoUrl: optionalLink,
  guideUrl: optionalLink,
  downloadsCount: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).optional(),
  lowStockThreshold: z.number().int().min(0).max(100000).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one editable field is required');
