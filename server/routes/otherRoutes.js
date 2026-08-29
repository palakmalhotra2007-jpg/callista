import { Router } from 'express';
import protect from '../middleware/authMiddleware.js';
import { db, formatContact } from '../config/firebase.js';

// ==========================================
// REMINDER ROUTER
// ==========================================
export const reminderRouter = Router();

reminderRouter.get('/', protect, async (req, res) => {
  try {
    const snapshot = await db.collection('contacts')
      .where('userId', '==', req.userId)
      .get();

    const all = [];
    snapshot.docs.forEach(doc => {
      const c = formatContact(doc);
      (c.reminders || []).forEach(r => {
        if (!r.completed) {
          all.push({
            _id: r._id || r.id,
            type: r.type || 'call',
            note: r.note || '',
            dueDate: r.dueDate,
            completed: !!r.completed,
            contactId: c._id,
            contactName: c.name,
            contactPhone: c.phones[0]?.number || '',
          });
        }
      });
    });

    all.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    res.json({ success: true, data: all });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ==========================================
// BIRTHDAY ROUTER
// ==========================================
export const birthdayRouter = Router();

birthdayRouter.get('/upcoming', protect, async (req, res) => {
  try {
    const snapshot = await db.collection('contacts')
      .where('userId', '==', req.userId)
      .get();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = snapshot.docs
      .map(formatContact)
      .filter(c => !c.isPrivate && c.birthday)
      .map(c => {
        const b = new Date(c.birthday);
        const next = new Date(today.getFullYear(), b.getMonth(), b.getDate());
        if (next < today) next.setFullYear(today.getFullYear() + 1);
        const daysUntil = Math.ceil((next - today) / 86400000);
        return {
          _id: c._id,
          name: c.name,
          birthday: c.birthday,
          daysUntil,
        };
      })
      .filter(c => c.daysUntil >= 0 && c.daysUntil <= 30)
      .sort((a, b) => a.daysUntil - b.daysUntil);

    res.json({ success: true, data: upcoming });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ==========================================
// ANALYTICS ROUTER
// ==========================================
export const analyticsRouter = Router();

analyticsRouter.get('/', protect, async (req, res) => {
  try {
    const snapshot = await db.collection('contacts')
      .where('userId', '==', req.userId)
      .get();

    let total = 0;
    let favCount = 0;
    let privCount = 0;
    let bdays = 0;
    let pendingReminders = 0;
    const catMap = {};

    const contacts = snapshot.docs.map(formatContact);

    contacts.forEach(c => {
      total++;
      if (c.favorite) favCount++;
      if (c.isPrivate) privCount++;
      if (c.birthday) bdays++;

      const cat = c.category || 'Other';
      catMap[cat] = (catMap[cat] || 0) + 1;

      (c.reminders || []).forEach(r => {
        if (!r.completed) pendingReminders++;
      });
    });

    const byCategory = Object.entries(catMap).map(([cat, count]) => ({
      _id: cat,
      count,
    }));

    // Top recent contacts
    const sortedRecent = [...contacts]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(c => ({
        _id: c._id,
        name: c.name,
        createdAt: c.createdAt,
        category: c.category,
      }));

    res.json({
      success: true,
      data: {
        total,
        favCount,
        privCount,
        bdays,
        byCategory,
        topSearched: sortedRecent,
        pendingReminders,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ==========================================
// TAG ROUTER
// ==========================================
export const tagRouter = Router();

tagRouter.get('/', protect, async (req, res) => {
  try {
    const snapshot = await db.collection('contacts')
      .where('userId', '==', req.userId)
      .get();

    const map = {};
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (Array.isArray(data.tags)) {
        data.tags.forEach(t => {
          if (t && typeof t === 'string') {
            map[t] = (map[t] || 0) + 1;
          }
        });
      }
    });

    const tags = Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    res.json({ success: true, data: tags });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});
