const mongoose = require('mongoose');
const contactSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:      { type: String, required: true, trim: true },
  phones:    [{ label: { type: String, default: 'Mobile' }, number: { type: String, required: true } }],
  email:     { type: String, trim: true, default: '' },
  birthday:  { type: Date, default: null },
  address:   { street: String, city: String, state: String, country: String, zip: String },
  category:  { type: String, enum: ['Personal','Work','Family','Emergency','Other'], default: 'Personal' },
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
contactSchema.pre('save', function(next) { this.updatedAt = new Date(); next(); });
module.exports = mongoose.model('Contact', contactSchema);
