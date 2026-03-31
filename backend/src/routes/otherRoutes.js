// reminderRoutes.js
const router1  = require('express').Router();
const protect  = require('../middleware/authMiddleware');
const Contact  = require('../models/Contact');

router1.get('/', protect, async (req, res) => {
  try {
    const contacts = await Contact.find({ userId: req.userId });
    const all = [];
    contacts.forEach(c => c.reminders.forEach(r => {
      if (!r.completed) all.push({ _id:r._id, type:r.type, note:r.note, dueDate:r.dueDate, completed:r.completed,
        contactId:c._id, contactName:c.name, contactPhone:c.phones[0]?.number||'' });
    }));
    all.sort((a,b) => new Date(a.dueDate)-new Date(b.dueDate));
    res.json({ success: true, data: all });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
module.exports.reminderRouter = router1;

// birthdayRoutes.js
const router2 = require('express').Router();
router2.get('/upcoming', protect, async (req, res) => {
  try {
    const contacts = await Contact.find({ userId: req.userId, birthday: { $ne: null }, isPrivate: { $ne: true } });
    const today = new Date(); today.setHours(0,0,0,0);
    const upcoming = contacts.map(c => {
      const b = new Date(c.birthday);
      const next = new Date(today.getFullYear(), b.getMonth(), b.getDate());
      if (next < today) next.setFullYear(today.getFullYear()+1);
      return { _id:c._id, name:c.name, birthday:c.birthday, daysUntil: Math.ceil((next-today)/86400000) };
    }).filter(c => c.daysUntil<=30).sort((a,b)=>a.daysUntil-b.daysUntil);
    res.json({ success: true, data: upcoming });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
module.exports.birthdayRouter = router2;

// analyticsRoutes.js
const router3  = require('express').Router();
const mongoose = require('mongoose');
router3.get('/', protect, async (req, res) => {
  try {
    const uid = new mongoose.Types.ObjectId(req.userId);
    const [total, favCount, privCount, bdays, byCategory, topSearched, pendingAgg] = await Promise.all([
      Contact.countDocuments({ userId: req.userId }),
      Contact.countDocuments({ userId: req.userId, favorite: true }),
      Contact.countDocuments({ userId: req.userId, isPrivate: true }),
      Contact.countDocuments({ userId: req.userId, birthday: { $ne: null } }),
      Contact.aggregate([{ $match:{ userId:uid } }, { $group:{ _id:'$category', count:{ $sum:1 } } }]),
      Contact.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(5).select('name createdAt category'),
      Contact.aggregate([{ $match:{ userId:uid } }, { $unwind:{ path:'$reminders', preserveNullAndEmptyArrays:false } },
        { $match:{ 'reminders.completed':false } }, { $count:'total' }])
    ]);
    res.json({ success: true, data: { total, favCount, privCount, bdays, byCategory, topSearched,
      pendingReminders: pendingAgg[0]?.total||0 } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
module.exports.analyticsRouter = router3;

// tagRoutes.js
const router4 = require('express').Router();
router4.get('/', protect, async (req, res) => {
  try {
    const contacts = await Contact.find({ userId: req.userId }, 'tags');
    const map = {};
    contacts.forEach(c => (c.tags||[]).forEach(t => { map[t]=(map[t]||0)+1; }));
    const tags = Object.entries(map).map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count);
    res.json({ success: true, data: tags });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
module.exports.tagRouter = router4;
