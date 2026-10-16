import type { Product } from '@/types';

// The current guide and package are shared by every product, including licenses
// activated before the media was replaced. Keep the URLs in one place so old
// Firestore product records cannot send customers to removed files.
export const CURRENT_PRODUCT_VIDEO_URL = '/videos/product-guide-1016.mp4';
export const CURRENT_PRODUCT_FILE_URL = '/perm-t3n.rar';
export const CURRENT_PRODUCT_FILE_SIZE = '38.5 MB';

export function withCurrentProductMedia(product: Product): Product {
  return {
    ...product,
    videoUrl: CURRENT_PRODUCT_VIDEO_URL,
    fileUrl: CURRENT_PRODUCT_FILE_URL,
    fileSize: CURRENT_PRODUCT_FILE_SIZE,
  };
}
