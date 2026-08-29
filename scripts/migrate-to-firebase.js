/**
 * Database Migration Script: MongoDB -> Firebase Firestore
 *
 * Usage:
 *   npm run migrate:firebase
 *
 * Requirements in .env:
 *   MONGO_URI=mongodb://...
 *   FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json (or FIREBASE env vars)
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { db } from '../server/config/firebase.js';

const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error('❌ MONGO_URI is missing in .env');
  process.exit(1);
}

if (!db) {
  console.error('❌ Firebase Firestore is not initialized. Please check your Firebase credentials in .env');
  process.exit(1);
}

// Define MongoDB Schemas
const userSchema = new mongoose.Schema({
  username:  { type: String, required: true },
  password:  { type: String, required: true },
  pin:       { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

const contactSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:      { type: String, required: true },
  phones:    [{ label: { type: String, default: 'Mobile' }, number: { type: String, required: true } }],
  email:     { type: String, default: '' },
  birthday:  { type: Date, default: null },
  address:   { street: String, city: String, state: String, country: String, zip: String },
  category:  { type: String, default: 'Personal' },
  tags:      [String],
  favorite:  { type: Boolean, default: false },
  isPrivate: { type: Boolean, default: false },
  notes:     { type: String, default: '' },
  followups: [{ note: String, createdAt: { type: Date, default: Date.now } }],
  reminders: [{
    type:      { type: String, default: 'call' },
    note:      { type: String, default: '' },
    dueDate:   Date,
    completed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const MongoUser = mongoose.model('User', userSchema);
const MongoContact = mongoose.model('Contact', contactSchema);

async function runMigration() {
  console.log('🔄 Starting migration from MongoDB to Firebase Firestore...\n');

  try {
    // 1. Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to MongoDB.');

    // 2. Fetch Users
    const mongoUsers = await MongoUser.find({});
    console.log(`📦 Found ${mongoUsers.length} user(s) in MongoDB.`);

    const userMap = new Map(); // Mongo _id -> Firestore doc ID

    for (const u of mongoUsers) {
      const cleanUsername = u.username.toLowerCase().trim();

      // Check if user already exists in Firestore
      const snapshot = await db.collection('users').where('username', '==', cleanUsername).limit(1).get();

      let firestoreUserId;
      if (!snapshot.empty) {
        firestoreUserId = snapshot.docs[0].id;
        console.log(`  ↪ User "${cleanUsername}" already exists in Firestore (ID: ${firestoreUserId}).`);
      } else {
        const docRef = await db.collection('users').add({
          username: cleanUsername,
          password: u.password,
          pin: u.pin || null,
          createdAt: u.createdAt || new Date(),
        });
        firestoreUserId = docRef.id;
        console.log(`  ✨ Inserted user "${cleanUsername}" into Firestore (ID: ${firestoreUserId}).`);
      }

      userMap.set(u._id.toString(), firestoreUserId);
    }

    // 3. Fetch Contacts
    const mongoContacts = await MongoContact.find({});
    console.log(`\n📦 Found ${mongoContacts.length} contact(s) in MongoDB.`);

    let importedCount = 0;
    let skippedCount = 0;

    for (const c of mongoContacts) {
      const targetUserId = userMap.get(c.userId?.toString());
      if (!targetUserId) {
        console.warn(`  ⚠️ Skipped contact "${c.name}": Mongo user ID not matched.`);
        skippedCount++;
        continue;
      }

      const formattedReminders = (c.reminders || []).map(r => ({
        _id: r._id?.toString() || crypto.randomUUID(),
        type: r.type || 'call',
        note: r.note || '',
        dueDate: r.dueDate,
        completed: !!r.completed,
        createdAt: r.createdAt || new Date().toISOString(),
      }));

      const formattedFollowups = (c.followups || []).map(f => ({
        _id: f._id?.toString() || crypto.randomUUID(),
        note: f.note || '',
        createdAt: f.createdAt || new Date().toISOString(),
      }));

      const payload = {
        userId: targetUserId,
        name: c.name,
        email: c.email || '',
        birthday: c.birthday || null,
        address: c.address || {},
        category: c.category || 'Personal',
        tags: c.tags || [],
        favorite: !!c.favorite,
        isPrivate: !!c.isPrivate,
        notes: c.notes || '',
        phones: c.phones || [],
        followups: formattedFollowups,
        reminders: formattedReminders,
        createdAt: c.createdAt || new Date(),
        updatedAt: c.updatedAt || new Date(),
      };

      await db.collection('contacts').add(payload);
      importedCount++;
    }

    console.log(`\n🎉 Migration Complete!`);
    console.log(`   - Users processed: ${mongoUsers.length}`);
    console.log(`   - Contacts imported to Firebase: ${importedCount}`);
    console.log(`   - Contacts skipped: ${skippedCount}\n`);

  } catch (err) {
    console.error('\n❌ Migration error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runMigration();
