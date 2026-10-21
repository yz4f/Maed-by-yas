import 'server-only';
import { cert, getApp as getAdminApp, getApps as getAdminApps, initializeApp as initializeAdminApp } from 'firebase-admin/app';
import { FieldValue, getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { getApp as getClientApp, getApps as getClientApps, initializeApp as initializeClientApp } from 'firebase/app';
import * as client from 'firebase/firestore';

const PROJECT_ID = 'tnnn-aa170';
const publicConfig = {
  apiKey: 'AIzaSyDrMw5gxptqdancpaoSu2Mg0_C1DcSVqn8',
  authDomain: 'tnnn-aa170.firebaseapp.com',
  projectId: PROJECT_ID,
  storageBucket: 'tnnn-aa170.firebasestorage.app',
  messagingSenderId: '540085648299',
  appId: '1:540085648299:web:9451081f61c38cf45270ee',
};

let database: any;

export function getServerFirestore(): any {
  if (database) return database;
  const credential = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (credential) {
    const serviceAccount = JSON.parse(credential);
    if (serviceAccount.project_id !== PROJECT_ID || !serviceAccount.client_email || !serviceAccount.private_key) {
      throw new Error('Firebase service account does not match the configured project');
    }
    const app = getAdminApps().length ? getAdminApp() : initializeAdminApp({ credential: cert(serviceAccount) });
    database = getAdminFirestore(app);
  } else {
    const app = getClientApps().length ? getClientApp() : initializeClientApp(publicConfig);
    database = client.getFirestore(app);
  }
  return database;
}

const adminMode = () => Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
const raw = (value: any) => value?.__raw || value;

function documentSnapshot(snapshot: any): any {
  return adminMode() ? {
    __raw: snapshot,
    id: snapshot.id,
    ref: snapshot.ref,
    exists: () => snapshot.exists,
    data: () => snapshot.data(),
  } : snapshot;
}

function querySnapshot(snapshot: any): any {
  return adminMode() ? {
    docs: snapshot.docs.map(documentSnapshot),
    empty: snapshot.empty,
    size: snapshot.size,
  } : snapshot;
}

export function collection(db: any, ...segments: string[]): any {
  return adminMode() ? db.collection(segments.join('/')) : (client.collection as any)(db, ...segments);
}

export function doc(db: any, ...segments: string[]): any {
  return adminMode() ? db.doc(segments.join('/')) : (client.doc as any)(db, ...segments);
}

export const where = (field: string, operator: any, value: unknown): any =>
  adminMode() ? { kind: 'where', field, operator, value } : client.where(field, operator, value);
export const orderBy = (field: string, direction?: any): any =>
  adminMode() ? { kind: 'orderBy', field, direction } : client.orderBy(field, direction);
export const limit = (count: number): any => adminMode() ? { kind: 'limit', count } : client.limit(count);
export const startAfter = (snapshot: any): any => adminMode() ? { kind: 'startAfter', snapshot } : client.startAfter(snapshot);

export function query(reference: any, ...constraints: any[]): any {
  if (!adminMode()) return client.query(reference, ...constraints);
  return constraints.reduce((current, constraint) => {
    if (constraint.kind === 'where') return current.where(constraint.field, constraint.operator, constraint.value);
    if (constraint.kind === 'orderBy') return current.orderBy(constraint.field, constraint.direction || 'asc');
    if (constraint.kind === 'limit') return current.limit(constraint.count);
    if (constraint.kind === 'startAfter') return current.startAfter(raw(constraint.snapshot));
    throw new Error('Unsupported Firestore query constraint');
  }, reference);
}

export async function getDoc(reference: any): Promise<any> {
  return adminMode() ? documentSnapshot(await reference.get()) : client.getDoc(reference);
}

export async function getDocs(reference: any): Promise<{ docs: any[]; empty: boolean; size: number }> {
  return adminMode() ? querySnapshot(await reference.get()) : client.getDocs(reference);
}

export async function getCountFromServer(reference: any): Promise<{ data: () => { count: number } }> {
  return adminMode() ? reference.count().get() : client.getCountFromServer(reference);
}

export async function setDoc(reference: any, data: any, options?: any): Promise<void> {
  if (adminMode()) {
    if (options) await reference.set(data, options);
    else await reference.set(data);
  }
  else if (options) await client.setDoc(reference, data, options);
  else await client.setDoc(reference, data);
}

export async function updateDoc(reference: any, data: any): Promise<void> {
  if (adminMode()) await reference.update(data);
  else await client.updateDoc(reference, data);
}

export async function deleteDoc(reference: any): Promise<void> {
  if (adminMode()) await reference.delete();
  else await client.deleteDoc(reference);
}

export const increment = (value: number): any => adminMode() ? FieldValue.increment(value) : client.increment(value);
export const writeBatch = (db: any): any => adminMode() ? db.batch() : client.writeBatch(db);

export async function runTransaction<T>(db: any, update: (transaction: any) => Promise<T>): Promise<T> {
  if (!adminMode()) return client.runTransaction(db, update);
  return db.runTransaction((transaction: any) => update({
    get: async (reference: any) => documentSnapshot(await transaction.get(reference)),
    set: (reference: any, data: any, options?: any) => options ? transaction.set(reference, data, options) : transaction.set(reference, data),
    update: (reference: any, data: any) => transaction.update(reference, data),
    delete: (reference: any) => transaction.delete(reference),
  }));
}
