export function normalizeFaqImage(value: unknown): string {
  if (typeof value !== 'string') throw new Error('أضف صورة توضيحية للسؤال.');
  const image = value.trim();
  if (!image) throw new Error('أضف صورة توضيحية للسؤال.');
  if (/^data:image\/(jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(image) && image.length <= 700_000) return image;
  if (image.length <= 2000) {
    try {
      const url = new URL(image);
      if (url.protocol === 'https:') return url.toString();
    } catch {}
  }
  throw new Error('استخدم رابط HTTPS للصورة أو ارفع صورة PNG أو JPG أو WebP بحجم أصغر.');
}
