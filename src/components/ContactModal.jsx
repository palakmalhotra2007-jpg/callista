import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, User, Phone, Mail, MapPin, Tag, FileText, Loader, Plus, Trash2, Calendar, Lock, AlertTriangle } from 'lucide-react';
import { createContact, createContactForce, updateContact } from '../services/api';
import './ContactModal.css';

var PHONE_LABELS = ['Mobile', 'Home', 'Work', 'Other'];
var CATEGORIES = ['Personal', 'Work', 'Family', 'Emergency', 'Other'];

var EMPTY_FORM = {
  name: '', email: '', category: 'Personal', notes: '', birthday: '', isPrivate: false, tags: [],
  phones: [{ label: 'Mobile', number: '' }],
  address: { street: '', city: '', state: '', country: '', zip: '', lat: '', lng: '' }
};

function digitCount(num) { return num.replace(/\D/g, '').length; }

export default function ContactModal({ contact, onClose, onSaved }) {
  var [form, setForm] = useState(EMPTY_FORM);
  
  var [errors, setErrors] = useState({});
  var [loading, setLoading] = useState(false);
  var [tab, setTab] = useState('basic');
  var [tagInput, setTagInput] = useState('');
  var [duplicate, setDuplicate] = useState(null);
  var isEdit = Boolean(contact);

  useEffect(function() {
    if (!contact) return;
    setForm({
      name: contact.name || '',
      email: contact.email || '',
      category: contact.category || 'Personal',
      notes: contact.notes || '',
      birthday: contact.birthday ? contact.birthday.split('T')[0] : '',
      isPrivate: contact.isPrivate || false,
      tags: contact.tags || [],
      phones: contact.phones && contact.phones.length > 0
        ? contact.phones.map(function(p) { return { label: p.label || 'Mobile', number: p.number || '' }; })
        : [{ label: 'Mobile', number: '' }],
      address: {
        street: (contact.address && contact.address.street) || '',
        city: (contact.address && contact.address.city) || '',
        state: (contact.address && contact.address.state) || '',
        country: (contact.address && contact.address.country) || '',
        zip: (contact.address && contact.address.zip) || '',
        lat: (contact.address && contact.address.lat) || '',
        lng: (contact.address && contact.address.lng) || ''
      }
    });
  }, [contact]);

  function addPhone() {
    if (form.phones.length >= 5) return;
    setForm(function(prev) { return Object.assign({}, prev, { phones: prev.phones.concat([{ label: 'Mobile', number: '' }]) }); });
  }

  function removePhone(i) {
    setForm(function(prev) { return Object.assign({}, prev, { phones: prev.phones.filter(function(_, x) { return x !== i; }) }); });
    setErrors(function(prev) { var n = Object.assign({}, prev); delete n['ph_' + i]; return n; });
  }

  function updatePhone(i, field, value) {
    setForm(function(prev) {
      var phones = prev.phones.map(function(p, x) { return x === i ? Object.assign({}, p, { [field]: value }) : p; });
      return Object.assign({}, prev, { phones: phones });
    });
    if (field === 'number') setErrors(function(prev) { return Object.assign({}, prev, { ['ph_' + i]: '' }); });
  }

  function addTag() {
    var t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t) && form.tags.length < 10) {
      setForm(function(prev) { return Object.assign({}, prev, { tags: prev.tags.concat([t]) }); });
      setTagInput('');
    }
  }

  function removeTag(t) {
    setForm(function(prev) { return Object.assign({}, prev, { tags: prev.tags.filter(function(x) { return x !== t; }) }); });
  }

  function handleField(e) {
    var name = e.target.name;
    var value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(function(prev) { return Object.assign({}, prev, { [name]: value }); });
    if (errors[name]) setErrors(function(prev) { return Object.assign({}, prev, { [name]: '' }); });
  }

  function handleAddress(e) {
    var name = e.target.name;
    var value = e.target.value;
    setForm(function(prev) { return Object.assign({}, prev, { address: Object.assign({}, prev.address, { [name]: value }) }); });
  }

  function validate() {
    var errs = {};
    if (!form.name.trim() || form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    if (form.name.trim().length > 50) errs.name = 'Name cannot exceed 50 characters';
    form.phones.forEach(function(p, i) {
      if (!p.number.trim()) { errs['ph_' + i] = 'Phone number is required'; return; }
      var d = digitCount(p.number);
      if (d < 7) errs['ph_' + i] = 'Too short — minimum 7 digits';
      else if (d > 15) errs['ph_' + i] = 'Too long — maximum 15 digits';
    });
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email address';
    if (form.address.lat && (isNaN(Number(form.address.lat)) || Number(form.address.lat) < -90 || Number(form.address.lat) > 90)) errs.lat = 'Must be between -90 and 90';
    if (form.address.lng && (isNaN(Number(form.address.lng)) || Number(form.address.lng) < -180 || Number(form.address.lng) > 180)) errs.lng = 'Must be between -180 and 180';
    if (form.notes.length > 500) errs.notes = 'Max 500 characters';
    return errs;
  }

  function buildPayload() {
    return {
      name: form.name,
      email: form.email,
      category: form.category,
      notes: form.notes,
      birthday: form.birthday || undefined,
      isPrivate: form.isPrivate,
      tags: form.tags,
      phones: form.phones.filter(function(p) { return p.number.trim(); }),
      address: {
        street: form.address.street,
        city: form.address.city,
        state: form.address.state,
        country: form.address.country,
        zip: form.address.zip,
        lat: form.address.lat ? Number(form.address.lat) : undefined,
        lng: form.address.lng ? Number(form.address.lng) : undefined
      }
    };
  }

async function handleSubmit(e) {
  e.preventDefault();

  const errs = validate();
  if (Object.keys(errs).length > 0) {
    setErrors(errs);
    return;
  }

  setLoading(true);
  setDuplicate(null);

  try {
    let res;

    if (isEdit) {
      res = await updateContact(contact._id, buildPayload());
    } else {
      res = await createContact(buildPayload());
    }

    console.log("SUCCESS:", res);
    onSaved(res.data?.data || {}, !isEdit);

  } catch (err) {
    console.log("ERROR:", err);

    if (err?.response?.status === 409) {
      setDuplicate(err.response.data);
    } else {
      setErrors({
        submit: err?.response?.data?.message || "Failed to save contact"
      });
    }

  } finally {
    setLoading(false);   
  }
}

  function handleForce() {
    setLoading(true);
    setDuplicate(null);
    createContactForce(buildPayload())
      .then(function(res) { onSaved(res.data.data, true); })
      .catch(function(err) { setErrors({ submit: (err.response && err.response.data && err.response.data.message) || 'Failed' }); })
      .finally(function() { setLoading(false); });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal-box"
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.18 }}
        onClick={function(e) { e.stopPropagation(); }}
      >
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Contact' : 'New Contact'}</h2>
          <button className="modal-close-btn" onClick={onClose}><X size={15} /></button>
        </div>

        <div className="modal-tabs">
          <button className={'modal-tab' + (tab === 'basic' ? ' active' : '')} type="button" onClick={function() { setTab('basic'); }}>Basic Info</button>
          <button className={'modal-tab' + (tab === 'address' ? ' active' : '')} type="button" onClick={function() { setTab('address'); }}>Address</button>
          <button className={'modal-tab' + (tab === 'extra' ? ' active' : '')} type="button" onClick={function() { setTab('extra'); }}>Tags & Privacy</button>
        </div>

        {duplicate && (
          <div className="modal-dup-warning">
            <AlertTriangle size={15} />
            <div className="dup-text">
              <strong>Possible Duplicate Detected</strong>
              <p>"{duplicate.duplicate && duplicate.duplicate.name}" already exists in your directory.</p>
              <div className="dup-actions">
                <button type="button" className="dup-back-btn" onClick={function() { setDuplicate(null); }}>Go Back</button>
                <button type="button" className="dup-save-btn" onClick={handleForce} disabled={loading}>
                  {loading && <Loader size={12} className="spin" />} Save Anyway
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {tab === 'basic' && (
              <div className="form-section">
                <div className="form-group">
                  <label className="form-label"><User size={11} />Full Name <span className="req">*</span></label>
                  <input name="name" value={form.name} onChange={handleField} placeholder="e.g. Priya Sharma" maxLength={50} className={'form-input' + (errors.name ? ' has-error' : '')} />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <div className="phone-header">
                    <label className="form-label"><Phone size={11} />Phone Numbers <span className="req">*</span></label>
                    {form.phones.length < 5 && <button type="button" className="add-phone-btn" onClick={addPhone}><Plus size={11} />Add</button>}
                  </div>
                  <div className="phones-list">
                    {form.phones.map(function(p, i) {
                      var dc = digitCount(p.number);
                      var dcClass = p.number && dc >= 7 && dc <= 15 ? 'ok' : p.number && dc > 0 ? 'bad' : '';
                      return (
                        <div key={i}>
                          <div className="phone-row">
                            <select className="phone-label-select" value={p.label} onChange={function(e) { updatePhone(i, 'label', e.target.value); }}>
                              {PHONE_LABELS.map(function(l) { return <option key={l}>{l}</option>; })}
                            </select>
                            <div className="phone-input-wrap">
                              <input
                                type="tel"
                                value={p.number}
                                onChange={function(e) { if (/^[+\d\s\-().]*$/.test(e.target.value)) updatePhone(i, 'number', e.target.value); }}
                                placeholder="+91 98765 43210"
                                maxLength={20}
                                className={'form-input' + (errors['ph_' + i] ? ' has-error' : '')}
                              />
                              {p.number && <span className={'digit-count ' + dcClass}>{dc}</span>}
                            </div>
                            {form.phones.length > 1 && <button type="button" className="remove-phone-btn" onClick={function() { removePhone(i); }}><Trash2 size={12} /></button>}
                          </div>
                          {errors['ph_' + i] && <span className="form-error">{errors['ph_' + i]}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label"><Mail size={11} />Email Address</label>
                  <input name="email" type="email" value={form.email} onChange={handleField} placeholder="email@example.com" className={'form-input' + (errors.email ? ' has-error' : '')} />
                  {errors.email && <span className="form-error">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label"><Calendar size={11} />Date of Birth</label>
                  <input name="birthday" type="date" value={form.birthday} onChange={handleField} className="form-input" />
                </div>

                <div className="form-group">
                  <label className="form-label"><Tag size={11} />Category</label>
                  <div className="cat-options">
                    {CATEGORIES.map(function(cat) {
                      return <button key={cat} type="button" className={'cat-option' + (form.category === cat ? ' active' : '')} onClick={function() { setForm(function(p) { return Object.assign({}, p, { category: cat }); }); }}>{cat}</button>;
                    })}
                  </div>
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <label className="form-label" style={{ marginBottom: 0 }}><FileText size={11} />Notes</label>
                    <span style={{ fontSize: 11, color: form.notes.length > 450 ? 'var(--danger)' : 'var(--text-light)' }}>{form.notes.length}/500</span>
                  </div>
                  <textarea name="notes" value={form.notes} onChange={handleField} placeholder="Additional information…" maxLength={500} rows={4} className={'form-input form-textarea' + (errors.notes ? ' has-error' : '')} />
                  {errors.notes && <span className="form-error">{errors.notes}</span>}
                </div>
              </div>
            )}

            {tab === 'address' && (
              <div className="form-section">
                <div className="form-group">
                  <label className="form-label"><MapPin size={11} />Street Address</label>
                  <input name="street" value={form.address.street} onChange={handleAddress} placeholder="123 MG Road" className="form-input" />
                </div>
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input name="city" value={form.address.city} onChange={handleAddress} placeholder="Mumbai" className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input name="state" value={form.address.state} onChange={handleAddress} placeholder="Maharashtra" className="form-input" />
                  </div>
                </div>
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Country</label>
                    <input name="country" value={form.address.country} onChange={handleAddress} placeholder="India" className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">ZIP / PIN</label>
                    <input name="zip" value={form.address.zip} onChange={handleAddress} placeholder="400001" className="form-input" />
                  </div>
                </div>
                {(form.address.city || form.address.street) && (
                  <button
                    type="button"
                    className="modal-map-preview-btn"
                    onClick={function() {
                      var q = encodeURIComponent([form.address.street, form.address.city, form.address.country].filter(Boolean).join(', '));
                      window.open('https://maps.google.com/?q=' + q, '_blank');
                    }}
                  >
                    🗺️ Preview on Google Maps
                  </button>
                )}
                <div className="coord-box">
                  <p className="coord-hint">📍 Optional: Enter coordinates for map pin</p>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label className="form-label">Latitude</label>
                      <input name="lat" type="number" step="any" value={form.address.lat} onChange={handleAddress} placeholder="19.0760" className={'form-input' + (errors.lat ? ' has-error' : '')} />
                      {errors.lat && <span className="form-error">{errors.lat}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Longitude</label>
                      <input name="lng" type="number" step="any" value={form.address.lng} onChange={handleAddress} placeholder="72.8777" className={'form-input' + (errors.lng ? ' has-error' : '')} />
                      {errors.lng && <span className="form-error">{errors.lng}</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'extra' && (
              <div className="form-section">
                <div className="form-group">
                  <label className="form-label"><Tag size={11} />Tags</label>
                  <div className="tag-input-row">
                    <input value={tagInput} onChange={function(e) { setTagInput(e.target.value); }} onKeyDown={function(e) { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} placeholder="Type tag and press Enter" className="form-input" maxLength={20} />
                    <button type="button" className="tag-add-btn" onClick={addTag}><Plus size={13} /></button>
                  </div>
                  {form.tags.length > 0 && (
                    <div className="tags-list">
                      {form.tags.map(function(t) {
                        return <span key={t} className="tag-chip">{t}<button type="button" onClick={function() { removeTag(t); }}>×</button></span>;
                      })}
                    </div>
                  )}
                  <p className="form-hint">Tags help organise and filter your contacts</p>
                </div>

                <div className="form-group">
                  <label className="form-label"><Lock size={11} />Privacy</label>
                  <label className="privacy-row">
                    <input type="checkbox" name="isPrivate" checked={form.isPrivate} onChange={handleField} />
                    <div className="privacy-label">
                      <strong>Mark as Private</strong>
                      <small>Private contacts are hidden and require a PIN to view.</small>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {errors.submit && <div className="submit-error">{errors.submit}</div>}
          </div>
          <div className="modal-footer">
  <button className="cancel-btn" type="button" onClick={onClose}>
    Cancel
  </button>

  <button className="save-btn" type="submit" disabled={loading}>
    {loading && <Loader size={13} />}
    Save
  </button>
</div>
        </form>
      </motion.div>
    </div>
  );
}
