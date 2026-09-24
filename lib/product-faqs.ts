import { collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, setDoc } from 'firebase/firestore';
import { db } from '@/lib/store-db';
import { StoreDB } from '@/lib/store-db';
import type { ProductFaq } from '@/types';
import { filterProductFaqRecords } from '@/lib/product-faq-filter';

const COLLECTION = 'productFaqs';

function database() {
  const value = db();
  if (!value) throw new Error('قاعدة بيانات الأسئلة غير متاحة حالياً.');
  return value;
}

export async function listProductFaqs(options: { includeDisabled?: boolean; productIds?: string[] } = {}) {
  const snapshot = await getDocs(query(collection(database(), COLLECTION), orderBy('priority', 'desc')));
  return filterProductFaqRecords(snapshot.docs.map((entry) => entry.data() as ProductFaq), options);
}

export async function saveProductFaq(input: Omit<ProductFaq, 'createdAt' | 'updatedAt'>) {
  const products = await StoreDB.getProducts();
  if (!products.some((product) => product.id === input.productId && !product.isArchived)) throw new Error('المنتج المحدد غير موجود.');
  const ref = doc(database(), COLLECTION, input.id);
  const previous = await getDoc(ref);
  const now = new Date().toISOString();
  const faq: ProductFaq = {
    ...input,
    questionAr: input.questionAr.trim(),
    questionEn: input.questionEn.trim(),
    answerAr: input.answerAr.trim(),
    answerEn: input.answerEn.trim(),
    category: input.category.trim(),
    createdAt: previous.exists() ? String(previous.data().createdAt || now) : now,
    updatedAt: now,
  };
  await setDoc(ref, faq);
  return faq;
}

export async function deleteProductFaq(id: string) {
  await deleteDoc(doc(database(), COLLECTION, id));
}
