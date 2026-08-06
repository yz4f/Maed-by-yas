import { Router, Request, Response } from 'express';
import { getAllProducts, getProductById } from '../db';

const router = Router();

// ─── Get all active products (Public) ───
router.get('/', (req: Request, res: Response) => {
  try {
    const products = getAllProducts(false); // false = don't include hidden products
    return res.json({ success: true, products });
  } catch (err) {
    console.error('Error fetching products:', err);
    return res.status(500).json({ error: 'فشل في جلب قائمة المنتجات' });
  }
});

// ─── Get single product details (Public) ───
router.get('/:id', (req: Request, res: Response) => {
  try {
    const product = getProductById(req.params.id);
    if (!product || product.status !== 'active') {
      return res.status(404).json({ error: 'المنتج غير موجود أو غير متاح حالياً' });
    }
    return res.json({ success: true, product });
  } catch (err) {
    return res.status(500).json({ error: 'فشل في جلب تفاصيل المنتج' });
  }
});

export default router;
