import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import protect from '../middleware/authMiddleware.js';
import { db, formatUser } from '../config/firebase.js';

const router = Router();

const sign = id => jwt.sign({ userId: id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const cleanUsername = username.toLowerCase().trim();

    // Check if user already exists
    const snapshot = await db.collection('users').where('username', '==', cleanUsername).limit(1).get();
    if (!snapshot.empty) {
      return res.status(400).json({ success: false, message: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userDocRef = await db.collection('users').add({
      username: cleanUsername,
      password: hashedPassword,
      pin: null,
      createdAt: new Date(),
    });

    const createdUser = await userDocRef.get();
    const formatted = formatUser(createdUser);

    res.status(201).json({
      success: true,
      token: sign(userDocRef.id),
      user: formatted,
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required' });
    }

    const cleanUsername = username.toLowerCase().trim();
    const snapshot = await db.collection('users').where('username', '==', cleanUsername).limit(1).get();

    if (snapshot.empty) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const formatted = formatUser(userDoc);
    res.json({
      success: true,
      token: sign(userDoc.id),
      user: formatted,
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/me', protect, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user: formatUser(userDoc) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/set-pin', protect, async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ success: false, message: 'PIN must be exactly 4 digits' });
    }

    const hashedPin = await bcrypt.hash(pin, 10);
    await db.collection('users').doc(req.userId).update({ pin: hashedPin });

    res.json({ success: true, message: 'PIN set' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/verify-pin', protect, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userData = userDoc.data();
    const ok = userData.pin ? await bcrypt.compare(req.body.pin, userData.pin) : false;
    res.json({ success: ok, message: ok ? 'Verified' : 'Wrong PIN' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;
