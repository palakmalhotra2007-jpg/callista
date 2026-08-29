import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

let db;

try {
  if (!admin.apps.length) {
    // Resolve the service account key path relative to the project root,
    // not the file's own directory — important for local dev.
    const __filename = fileURLToPath(import.meta.url);
    const projectRoot = path.resolve(path.dirname(__filename), '../../');

    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
      ? path.resolve(projectRoot, process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
      : null;

    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    const projectId    = process.env.FIREBASE_PROJECT_ID;
    const clientEmail  = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey   = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
      // Local dev: read serviceAccountKey.json from disk
      const fileContent = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({ credential: admin.credential.cert(fileContent) });
      console.log('✅ Firebase Admin initialized using Service Account JSON file.');

    } else if (serviceAccountJson) {
      // Production option A: paste the entire JSON as a single env var
      const parsed = JSON.parse(serviceAccountJson);
      admin.initializeApp({ credential: admin.credential.cert(parsed) });
      console.log('✅ Firebase Admin initialized using FIREBASE_SERVICE_ACCOUNT JSON string.');

    } else if (projectId && clientEmail && privateKey) {
      // Production option B: three individual env vars
      admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      });
      console.log('✅ Firebase Admin initialized using individual environment variables.');

    } else {
      // No credentials found — throw so the server logs a clear error and
      // every API route returns 500 instead of silently hitting a dummy project.
      throw new Error(
        'Firebase credentials not configured. ' +
        'Set FIREBASE_SERVICE_ACCOUNT (full JSON string) or ' +
        'FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY ' +
        'in your environment variables.'
      );
    }
  }

  db = admin.firestore();
  console.log('✅ Firestore connected.');
} catch (err) {
  console.error('❌ Firebase init failed:', err.message);
  // Re-export db as null so route handlers can detect it and return 503
  db = null;
}

export { admin, db };

/**
 * Format Firestore contact doc to match frontend shape (_id, etc.)
 */
export function formatContact(doc) {
  if (!doc) return null;
  const data = typeof doc.data === 'function' ? doc.data() : doc;
  const id = doc.id || data.id || data._id;

  return {
    _id: id,
    userId: data.userId || '',
    name: data.name || '',
    email: data.email || '',
    birthday: data.birthday ? (data.birthday.toDate ? data.birthday.toDate().toISOString() : data.birthday) : null,
    address: data.address || {},
    category: data.category || 'Personal',
    tags: Array.isArray(data.tags) ? data.tags : [],
    favorite: !!data.favorite,
    isPrivate: !!data.isPrivate,
    notes: data.notes || '',
    phones: Array.isArray(data.phones) ? data.phones : [],
    followups: Array.isArray(data.followups) ? data.followups : [],
    reminders: Array.isArray(data.reminders) ? data.reminders : [],
    createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : new Date().toISOString(),
    updatedAt: data.updatedAt ? (data.updatedAt.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt) : new Date().toISOString(),
  };
}

export function formatUser(doc) {
  if (!doc) return null;
  const data = typeof doc.data === 'function' ? doc.data() : doc;
  const id = doc.id || data.id || data._id;

  return {
    _id: id,
    username: data.username,
    hasPin: !!data.pin,
    createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : new Date().toISOString(),
  };
}
