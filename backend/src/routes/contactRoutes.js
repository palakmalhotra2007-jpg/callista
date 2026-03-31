const router   = require('express').Router();
const multer   = require('multer');
const protect  = require('../middleware/authMiddleware');
const Contact  = require('../models/Contact');
const upload   = multer({ storage: multer.memoryStorage() });

// GET all contacts
router.get('/', protect, async (req, res) => {
  try {
    const { search, category, favorite, tag, showPrivate } = req.query;
    const q = { userId: req.userId };
    if (showPrivate !== 'true') q.isPrivate = { $ne: true };
    if (category)            q.category = category;
    if (favorite === 'true') q.favorite = true;
    if (tag)                 q.tags = { $in: [tag] };
    if (search) q.$or = [
      { name:            { $regex: search, $options: 'i' } },
      { 'phones.number': { $regex: search, $options: 'i' } },
      { email:           { $regex: search, $options: 'i' } },
      { tags:            { $in: [new RegExp(search, 'i')] } }
    ];
    res.json({ success: true, data: await Contact.find(q).sort({ name: 1 }) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Export PDF — MUST be before /:id
router.get('/export/pdf', protect, async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');
    const contacts = await Contact.find({ userId: req.userId, isPrivate: { $ne: true } }).sort({ name: 1 });
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=phonebook.pdf');
    doc.pipe(res);
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#1a1f2e').text('PhoneBook Pro', { align: 'center' });
    doc.fontSize(10).font('Helvetica').fillColor('#888')
       .text('Contact Directory — ' + new Date().toLocaleDateString('en-GB', { day:'numeric',month:'long',year:'numeric' }), { align:'center' });
    doc.moveDown(0.5).moveTo(50,doc.y).lineTo(545,doc.y).stroke('#ddd').moveDown(1);
    let letter = '';
    contacts.forEach((c, i) => {
      const L = (c.name[0]||'?').toUpperCase();
      if (L !== letter) { letter = L; if(i>0) doc.moveDown(0.4); doc.fontSize(13).font('Helvetica-Bold').fillColor('#1c4e8a').text(L); doc.moveDown(0.2); }
      if (doc.y > 720) doc.addPage();
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a1f2e').text(c.name);
      (c.phones||[]).forEach(p => doc.fontSize(10).font('Helvetica').fillColor('#444').text('  📞 '+p.label+': '+p.number));
      if (c.email) doc.fontSize(10).fillColor('#444').text('  ✉️  '+c.email);
      const loc = [c.address?.city, c.address?.country].filter(Boolean).join(', ');
      if (loc) doc.fontSize(10).fillColor('#444').text('  📍 '+loc);
      doc.moveDown(0.5);
    });
    doc.end();
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Import CSV — MUST be before /:id
router.post('/import/csv', protect, upload.single('file'), async (req, res) => {
  try {
    const { parse } = require('csv-parse/sync');
    if (!req.file) return res.status(400).json({ success: false, message: 'No file' });
    const rows = parse(req.file.buffer.toString('utf8'), { columns: true, skip_empty_lines: true, trim: true });
    let imported = 0, skipped = 0;
    for (const r of rows) {
      const name = r.name||r.Name, phone = r.phone||r.Phone||r.mobile||r.Mobile;
      if (!name||!phone) { skipped++; continue; }
      if (await Contact.findOne({ userId: req.userId, 'phones.number': phone.trim() })) { skipped++; continue; }
      await Contact.create({ userId: req.userId, name: name.trim(), phones:[{label:'Mobile',number:phone.trim()}],
        email:r.email||r.Email||'', category:r.category||r.Category||'Personal', notes:r.notes||r.Notes||'',
        address:{city:r.city||r.City||'', country:r.country||r.Country||''} });
      imported++;
    }
    res.json({ success: true, data: { imported, skipped } });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

// Force create (skip duplicate check)
router.post('/force', protect, async (req, res) => {
  try { res.status(201).json({ success: true, data: await Contact.create({ ...req.body, userId: req.userId }) }); }
  catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

// Create with duplicate detection
router.post('/', protect, async (req, res) => {
  try {
    const nums = (req.body.phones||[]).map(p=>p.number).filter(Boolean);
    const dup = await Contact.findOne({ userId: req.userId, $or: [
      { name: { $regex: '^'+req.body.name+'$', $options:'i' } },
      ...(nums.length?[{'phones.number':{$in:nums}}]:[])
    ]});
    if (dup) return res.status(409).json({ success:false, message:'Possible duplicate: "'+dup.name+'" already exists.', duplicate:dup });
    res.status(201).json({ success: true, data: await Contact.create({ ...req.body, userId: req.userId }) });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

// Get one
router.get('/:id', protect, async (req, res) => {
  try {
    const c = await Contact.findOne({ _id: req.params.id, userId: req.userId });
    if (!c) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: c });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Update
router.put('/:id', protect, async (req, res) => {
  try {
    const c = await Contact.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { ...req.body, updatedAt: new Date() }, { new: true }
    );
    if (!c) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: c });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

// Delete
router.delete('/:id', protect, async (req, res) => {
  try {
    const c = await Contact.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!c) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Toggle favourite
router.patch('/:id/favorite', protect, async (req, res) => {
  try {
    const c = await Contact.findOne({ _id: req.params.id, userId: req.userId });
    if (!c) return res.status(404).json({ success: false, message: 'Not found' });
    c.favorite = !c.favorite; await c.save();
    res.json({ success: true, data: c });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Reminders
router.post('/:id/reminders', protect, async (req, res) => {
  try {
    const c = await Contact.findOne({ _id: req.params.id, userId: req.userId });
    if (!c) return res.status(404).json({ success: false, message: 'Not found' });
    c.reminders.push(req.body); await c.save(); res.json({ success: true, data: c });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

router.patch('/:id/reminders/:rid', protect, async (req, res) => {
  try {
    const c = await Contact.findOne({ _id: req.params.id, userId: req.userId });
    if (!c) return res.status(404).json({ success: false, message: 'Not found' });
    const r = c.reminders.id(req.params.rid);
    if (!r) return res.status(404).json({ success: false, message: 'Reminder not found' });
    Object.assign(r, req.body); await c.save(); res.json({ success: true, data: c });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

router.delete('/:id/reminders/:rid', protect, async (req, res) => {
  try {
    const c = await Contact.findOne({ _id: req.params.id, userId: req.userId });
    if (!c) return res.status(404).json({ success: false, message: 'Not found' });
    c.reminders.pull({ _id: req.params.rid }); await c.save(); res.json({ success: true, data: c });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Follow-ups
router.post('/:id/followups', protect, async (req, res) => {
  try {
    const c = await Contact.findOne({ _id: req.params.id, userId: req.userId });
    if (!c) return res.status(404).json({ success: false, message: 'Not found' });
    c.followups.push({ note: req.body.note }); await c.save(); res.json({ success: true, data: c });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

router.delete('/:id/followups/:fid', protect, async (req, res) => {
  try {
    const c = await Contact.findOne({ _id: req.params.id, userId: req.userId });
    if (!c) return res.status(404).json({ success: false, message: 'Not found' });
    c.followups.pull({ _id: req.params.fid }); await c.save(); res.json({ success: true, data: c });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
