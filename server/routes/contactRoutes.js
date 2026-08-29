import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import PDFDocument from 'pdfkit';
import { parse } from 'csv-parse/sync';
import protect from '../middleware/authMiddleware.js';
import { db, formatContact } from '../config/firebase.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET all contacts
router.get('/', protect, async (req, res) => {
  try {
    const { search, category, favorite, tag, showPrivate } = req.query;

    const snapshot = await db.collection('contacts')
      .where('userId', '==', req.userId)
      .get();

    let contacts = snapshot.docs.map(formatContact);

    // Filter private
    if (showPrivate !== 'true') {
      contacts = contacts.filter(c => !c.isPrivate);
    }
    // Filter category
    if (category) {
      contacts = contacts.filter(c => c.category === category);
    }
    // Filter favorite
    if (favorite === 'true') {
      contacts = contacts.filter(c => c.favorite);
    }
    // Filter tag
    if (tag) {
      contacts = contacts.filter(c => Array.isArray(c.tags) && c.tags.includes(tag));
    }
    // Search
    if (search) {
      const s = search.toLowerCase().trim();
      contacts = contacts.filter(c => {
        const nameMatch = c.name && c.name.toLowerCase().includes(s);
        const emailMatch = c.email && c.email.toLowerCase().includes(s);
        const phoneMatch = c.phones && c.phones.some(p => p.number && p.number.toLowerCase().includes(s));
        const tagMatch = c.tags && c.tags.some(t => t && t.toLowerCase().includes(s));
        return nameMatch || emailMatch || phoneMatch || tagMatch;
      });
    }

    // Sort by name
    contacts.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    res.json({ success: true, data: contacts });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Export PDF — MUST be before /:id
router.get('/export/pdf', protect, async (req, res) => {
  try {
    const snapshot = await db.collection('contacts')
      .where('userId', '==', req.userId)
      .get();

    let contacts = snapshot.docs.map(formatContact).filter(c => !c.isPrivate);
    contacts.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=phonebook.pdf');
    doc.pipe(res);

    doc.fontSize(24).font('Helvetica-Bold').fillColor('#1a1f2e').text('PhoneBook Pro', { align: 'center' });
    doc.fontSize(10).font('Helvetica').fillColor('#888')
       .text('Contact Directory — ' + new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), { align: 'center' });
    doc.moveDown(0.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke('#ddd').moveDown(1);

    let letter = '';
    contacts.forEach((c, i) => {
      const L = (c.name[0] || '?').toUpperCase();
      if (L !== letter) {
        letter = L;
        if (i > 0) doc.moveDown(0.4);
        doc.fontSize(13).font('Helvetica-Bold').fillColor('#1c4e8a').text(L);
        doc.moveDown(0.2);
      }
      if (doc.y > 720) doc.addPage();
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a1f2e').text(c.name);
      (c.phones || []).forEach(p => doc.fontSize(10).font('Helvetica').fillColor('#444').text('  📞 ' + p.label + ': ' + p.number));
      if (c.email) doc.fontSize(10).fillColor('#444').text('  ✉️  ' + c.email);
      const loc = [c.address?.city, c.address?.country].filter(Boolean).join(', ');
      if (loc) doc.fontSize(10).fillColor('#444').text('  📍 ' + loc);
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Import CSV — MUST be before /:id
router.post('/import/csv', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file' });
    const rows = parse(req.file.buffer.toString('utf8'), { columns: true, skip_empty_lines: true, trim: true });

    const snapshot = await db.collection('contacts').where('userId', '==', req.userId).get();
    const existingPhones = new Set();
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (Array.isArray(data.phones)) {
        data.phones.forEach(p => {
          if (p.number) existingPhones.add(p.number.trim());
        });
      }
    });

    let imported = 0, skipped = 0;
    const batch = db.batch();

    for (const r of rows) {
      const name = r.name || r.Name;
      const phone = r.phone || r.Phone || r.mobile || r.Mobile;
      if (!name || !phone) { skipped++; continue; }
      const cleanPhone = phone.trim();
      if (existingPhones.has(cleanPhone)) { skipped++; continue; }

      existingPhones.add(cleanPhone);
      const newDocRef = db.collection('contacts').doc();
      batch.set(newDocRef, {
        userId: req.userId,
        name: name.trim(),
        phones: [{ label: 'Mobile', number: cleanPhone }],
        email: r.email || r.Email || '',
        category: r.category || r.Category || 'Personal',
        notes: r.notes || r.Notes || '',
        address: { city: r.city || r.City || '', country: r.country || r.Country || '' },
        tags: [],
        reminders: [],
        followups: [],
        favorite: false,
        isPrivate: false,
        birthday: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      imported++;
    }

    if (imported > 0) {
      await batch.commit();
    }

    res.json({ success: true, data: { imported, skipped } });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// Force create (skip duplicate check)
router.post('/force', protect, async (req, res) => {
  try {
    const payload = {
      userId: req.userId,
      name: req.body.name?.trim(),
      email: req.body.email || '',
      birthday: req.body.birthday || null,
      address: req.body.address || {},
      category: req.body.category || 'Personal',
      tags: req.body.tags || [],
      favorite: !!req.body.favorite,
      isPrivate: !!req.body.isPrivate,
      notes: req.body.notes || '',
      phones: req.body.phones || [],
      followups: req.body.followups || [],
      reminders: req.body.reminders || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await db.collection('contacts').add(payload);
    const saved = await docRef.get();
    res.status(201).json({ success: true, data: formatContact(saved) });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// Create with duplicate detection
router.post('/', protect, async (req, res) => {
  try {
    const nums = (req.body.phones || []).map(p => p.number?.trim()).filter(Boolean);
    const cleanName = (req.body.name || '').trim();

    const snapshot = await db.collection('contacts').where('userId', '==', req.userId).get();
    const existing = snapshot.docs.map(formatContact);

    const dup = existing.find(c => {
      const sameName = c.name && c.name.toLowerCase() === cleanName.toLowerCase();
      const samePhone = Array.isArray(c.phones) && c.phones.some(p => nums.includes(p.number?.trim()));
      return sameName || samePhone;
    });

    if (dup) {
      return res.status(409).json({
        success: false,
        message: 'Possible duplicate: "' + dup.name + '" already exists.',
        duplicate: dup,
      });
    }

    const payload = {
      userId: req.userId,
      name: cleanName,
      email: req.body.email || '',
      birthday: req.body.birthday || null,
      address: req.body.address || {},
      category: req.body.category || 'Personal',
      tags: req.body.tags || [],
      favorite: !!req.body.favorite,
      isPrivate: !!req.body.isPrivate,
      notes: req.body.notes || '',
      phones: req.body.phones || [],
      followups: req.body.followups || [],
      reminders: req.body.reminders || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await db.collection('contacts').add(payload);
    const saved = await docRef.get();
    res.status(201).json({ success: true, data: formatContact(saved) });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// Get one
router.get('/:id', protect, async (req, res) => {
  try {
    const doc = await db.collection('contacts').doc(req.params.id).get();
    if (!doc.exists || doc.data().userId !== req.userId) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    res.json({ success: true, data: formatContact(doc) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Update
router.put('/:id', protect, async (req, res) => {
  try {
    const docRef = db.collection('contacts').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data().userId !== req.userId) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    const payload = { updatedAt: new Date() };
    if (req.body.name !== undefined) payload.name = req.body.name.trim();
    if (req.body.email !== undefined) payload.email = req.body.email;
    if (req.body.birthday !== undefined) payload.birthday = req.body.birthday || null;
    if (req.body.address !== undefined) payload.address = req.body.address;
    if (req.body.category !== undefined) payload.category = req.body.category;
    if (req.body.tags !== undefined) payload.tags = req.body.tags;
    if (req.body.favorite !== undefined) payload.favorite = req.body.favorite;
    if (req.body.isPrivate !== undefined) payload.isPrivate = req.body.isPrivate;
    if (req.body.notes !== undefined) payload.notes = req.body.notes;
    if (req.body.phones !== undefined) payload.phones = req.body.phones;
    if (req.body.followups !== undefined) payload.followups = req.body.followups;
    if (req.body.reminders !== undefined) payload.reminders = req.body.reminders;

    await docRef.update(payload);
    const updated = await docRef.get();
    res.json({ success: true, data: formatContact(updated) });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// Delete
router.delete('/:id', protect, async (req, res) => {
  try {
    const docRef = db.collection('contacts').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data().userId !== req.userId) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    await docRef.delete();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Toggle favourite
router.patch('/:id/favorite', protect, async (req, res) => {
  try {
    const docRef = db.collection('contacts').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data().userId !== req.userId) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    const currentFav = !!doc.data().favorite;
    await docRef.update({ favorite: !currentFav, updatedAt: new Date() });
    const updated = await docRef.get();
    res.json({ success: true, data: formatContact(updated) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Reminders
router.post('/:id/reminders', protect, async (req, res) => {
  try {
    const docRef = db.collection('contacts').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data().userId !== req.userId) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    const reminders = Array.isArray(doc.data().reminders) ? [...doc.data().reminders] : [];
    const newRem = {
      _id: randomUUID(),
      type: req.body.type || 'call',
      note: req.body.note || '',
      dueDate: req.body.dueDate,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    reminders.push(newRem);

    await docRef.update({ reminders, updatedAt: new Date() });
    const updated = await docRef.get();
    res.json({ success: true, data: formatContact(updated) });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

router.patch('/:id/reminders/:rid', protect, async (req, res) => {
  try {
    const docRef = db.collection('contacts').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data().userId !== req.userId) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    const reminders = Array.isArray(doc.data().reminders) ? [...doc.data().reminders] : [];
    const idx = reminders.findIndex(r => r._id === req.params.rid || r.id === req.params.rid);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Reminder not found' });

    reminders[idx] = { ...reminders[idx], ...req.body };
    await docRef.update({ reminders, updatedAt: new Date() });
    const updated = await docRef.get();
    res.json({ success: true, data: formatContact(updated) });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

router.delete('/:id/reminders/:rid', protect, async (req, res) => {
  try {
    const docRef = db.collection('contacts').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data().userId !== req.userId) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    const reminders = (Array.isArray(doc.data().reminders) ? doc.data().reminders : []).filter(
      r => r._id !== req.params.rid && r.id !== req.params.rid
    );

    await docRef.update({ reminders, updatedAt: new Date() });
    const updated = await docRef.get();
    res.json({ success: true, data: formatContact(updated) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Follow-ups
router.post('/:id/followups', protect, async (req, res) => {
  try {
    const docRef = db.collection('contacts').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data().userId !== req.userId) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    const followups = Array.isArray(doc.data().followups) ? [...doc.data().followups] : [];
    const newFu = {
      _id: randomUUID(),
      note: req.body.note,
      createdAt: new Date().toISOString(),
    };
    followups.push(newFu);

    await docRef.update({ followups, updatedAt: new Date() });
    const updated = await docRef.get();
    res.json({ success: true, data: formatContact(updated) });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

router.delete('/:id/followups/:fid', protect, async (req, res) => {
  try {
    const docRef = db.collection('contacts').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data().userId !== req.userId) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    const followups = (Array.isArray(doc.data().followups) ? doc.data().followups : []).filter(
      f => f._id !== req.params.fid && f.id !== req.params.fid
    );

    await docRef.update({ followups, updatedAt: new Date() });
    const updated = await docRef.get();
    res.json({ success: true, data: formatContact(updated) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;
