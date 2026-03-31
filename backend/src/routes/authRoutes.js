const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const protect = require('../middleware/authMiddleware');
const User    = require('../models/User');

const sign = id => jwt.sign({ userId: id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: 'Username and password required' });
    if (password.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    if (await User.findOne({ username: username.toLowerCase().trim() }))
      return res.status(400).json({ success: false, message: 'Username already taken' });
    const user = await User.create({ username: username.toLowerCase().trim(), password: await bcrypt.hash(password, 12) });
    res.status(201).json({ success: true, token: sign(user._id), user: { _id: user._id, username: user.username, hasPin: false } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username: username?.toLowerCase().trim() });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    res.json({ success: true, token: sign(user._id), user: { _id: user._id, username: user.username, hasPin: !!user.pin } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: { _id: user._id, username: user.username, hasPin: !!user.pin } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/set-pin', protect, async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin || !/^\d{4}$/.test(pin)) return res.status(400).json({ success: false, message: 'PIN must be exactly 4 digits' });
    await User.findByIdAndUpdate(req.userId, { pin: await bcrypt.hash(pin, 10) });
    res.json({ success: true, message: 'PIN set' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/verify-pin', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const ok = user.pin ? await bcrypt.compare(req.body.pin, user.pin) : false;
    res.json({ success: ok, message: ok ? 'Verified' : 'Wrong PIN' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
