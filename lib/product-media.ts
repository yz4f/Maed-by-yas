import type { Product } from '@/types';

// Defaults for newly created products. Existing products keep their saved media
// so administrator edits remain persistent in Firestore.
export const CURRENT_PRODUCT_VIDEO_URL = '/videos/product-guide-1016.mp4';
export const CURRENT_PRODUCT_FILE_URL = '/perm-t3n.rar';
export const CURRENT_PRODUCT_FILE_SIZE = '38.5 MB';

export function withDefaultProductMedia(product: Product): Product {
  return {
    ...product,
    videoUrl: product.videoUrl?.trim() || CURRENT_PRODUCT_VIDEO_URL,
    fileUrl: product.fileUrl?.trim() || CURRENT_PRODUCT_FILE_URL,
    fileSize: product.fileSize?.trim() || CURRENT_PRODUCT_FILE_SIZE,
  };
}
