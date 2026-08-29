import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

let db;

try {
  if (!admin.apps.length) {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    if (serviceAccountPath && fs.existsSync(path.resolve(serviceAccountPath))) {
      const fileContent = JSON.parse(fs.readFileSync(path.resolve(serviceAccountPath), 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(fileContent),
      });
      console.log('✅ Firebase Admin initialized using Service Account JSON file.');
    } else if (serviceAccountJson) {
      const parsed = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(parsed),
      });
      console.log('✅ Firebase Admin initialized using FIREBASE_SERVICE_ACCOUNT JSON string.');
    } else if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log('✅ Firebase Admin initialized using environment variables.');
    } else if (projectId) {
      admin.initializeApp({
        projectId,
      });
      console.log('ℹ️ Firebase Admin initialized with Project ID:', projectId);
    } else {
      console.warn('\n⚠️ WARNING: Firebase credentials not found in .env!');
      console.warn('Please add serviceAccountKey.json or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env.\n');
      // Initialize with default or placeholder so app doesn't crash on boot
      admin.initializeApp({
        projectId: 'callista-demo',
      });
    }
  }

  db = admin.firestore();
} catch (err) {
  console.error('❌ Error initializing Firebase Admin:', err.message);
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
