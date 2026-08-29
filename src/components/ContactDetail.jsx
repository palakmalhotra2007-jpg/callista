import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Phone, Mail, MapPin, Star, Edit2, Trash2, MessageSquare, Calendar,
         ExternalLink, Plus, CheckCircle2, Clock, Tag, Trash, Navigation, Map } from 'lucide-react';
import { addReminder, updateReminder, deleteReminder, addFollowup, deleteFollowup } from '../services/api';
import { toast } from 'react-toastify';
import './ContactDetail.css';

var CAT_COLORS = { Personal:'#1c4e8a', Work:'#6d28d9', Family:'#be185d', Emergency:'#b91c1c', Other:'#15803d' };
var AV_COLORS  = ['#1c4e8a','#374151','#6d28d9','#be185d','#15803d','#b45309'];

function initials(name) { return name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2); }
function avColor(name)  { return AV_COLORS[name.charCodeAt(0)%AV_COLORS.length]; }
function fmtLong(d)     { return new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}); }
function fmtShort(d)    { return new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}); }

function bdayCountdown(birthday) {
  if (!birthday) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const b = new Date(birthday);
  const next = new Date(today.getFullYear(), b.getMonth(), b.getDate());
  if (next < today) next.setFullYear(today.getFullYear()+1);
  const days = Math.ceil((next-today)/86400000);
  if (days === 0) return { label:'🎂 Birthday is TODAY!', color:'#c2410c' };
  if (days === 1) return { label:'🎂 Birthday is TOMORROW!', color:'#c2410c' };
  if (days <= 7)  return { label:`🎂 Birthday in ${days} days`, color:'#b45309' };
  return { label:`🎂 ${days} days until birthday`, color:'#15803d' };
}

// Google Maps iFrame embed — no API key needed
function GoogleMapEmbed({ address }) {
  const q = encodeURIComponent(address);
  const src = `https://maps.google.com/maps?q=${q}&output=embed&z=15`;
  return (
    <div className="det-gmap">
      <iframe
        title="Google Map"
        src={src}
        width="100%" height="200"
        style={{ border:0, borderRadius:6, display:'block' }}
        allowFullScreen loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}

var REM_TYPES = [
  { value:'call',     label:'📞 Call Reminder' },
  { value:'followup', label:'💬 Follow-up' },
  { value:'meeting',  label:'🕐 Meeting' }
];

export default function ContactDetail({ contact: init, onClose, onEdit, onDelete, onToggleFavorite, onUpdated }) {
  const [contact,  setContact]  = useState(init);
  const [showMap,  setShowMap]  = useState(false);
  const [tab,      setTab]      = useState('info');
  const [remType,  setRemType]  = useState('call');
  const [remNote,  setRemNote]  = useState('');
  const [remDate,  setRemDate]  = useState('');
  const [fuNote,   setFuNote]   = useState('');
  const [saving,   setSaving]   = useState(false);

  function upd(c) { setContact(c); onUpdated && onUpdated(c); }

  const { name, phones=[], email, address={}, category, favorite, notes, birthday, tags=[], isPrivate, followups=[], reminders=[], createdAt } = contact;
  const catColor    = CAT_COLORS[category]||'#374151';
  const fullAddress = [address.street, address.city, address.state, address.zip, address.country].filter(Boolean).join(', ');
  const pending     = reminders.filter(r=>!r.completed);
  const bday        = bdayCountdown(birthday);

  function openGoogleMaps() {
    const q = encodeURIComponent(fullAddress);
    window.open(`https://maps.google.com/?q=${q}`, '_blank');
  }
  function getDirections() {
    const q = encodeURIComponent(fullAddress);
    window.open(`https://maps.google.com/maps?daddr=${q}`, '_blank');
  }
  function callPhone(num) { window.location.href = 'tel:' + num; }
  function smsPhone(num)  { window.location.href = 'sms:' + num; }

  async function addRem() {
    if (!remDate) { toast.error('Please pick a date'); return; }
    setSaving(true);
    try {
      const res = await addReminder(contact._id, { type:remType, note:remNote, dueDate:remDate });
      upd(res.data.data); setRemNote(''); setRemDate('');
      toast.success('Reminder added ✓');
    } catch { toast.error('Failed'); } finally { setSaving(false); }
  }
  async function doneRem(rid) {
    try { const res = await updateReminder(contact._id, rid, { completed:true }); upd(res.data.data); toast.success('Done ✓'); }
    catch { toast.error('Failed'); }
  }
  async function delRem(rid) {
    try { const res = await deleteReminder(contact._id, rid); upd(res.data.data); }
    catch { toast.error('Failed'); }
  }
  async function addFu() {
    if (!fuNote.trim()) return;
    setSaving(true);
    try {
      const res = await addFollowup(contact._id, { note: fuNote });
      upd(res.data.data); setFuNote('');
      toast.success('Note saved ✓');
    } catch { toast.error('Failed'); } finally { setSaving(false); }
  }
  async function delFu(fid) {
    try { const res = await deleteFollowup(contact._id, fid); upd(res.data.data); }
    catch { toast.error('Failed'); }
  }

  return (
    <motion.aside className="det-panel"
      initial={{ x:'100%' }} animate={{ x:0 }} exit={{ x:'100%' }}
      transition={{ type:'spring', stiffness:300, damping:30 }}
    >
      {/* Top bar */}
      <div className="det-topbar">
        <button className="det-icon-btn" onClick={onClose}><X size={15}/></button>
        <div className="det-topbar-right">
          <button className={`det-icon-btn${favorite?' fav-on':''}`} onClick={onToggleFavorite}>
            <Star size={14} fill={favorite?'currentColor':'none'}/>
          </button>
          <button className="det-icon-btn" onClick={onEdit}><Edit2 size={14}/></button>
          <button className="det-icon-btn del" onClick={onDelete}><Trash2 size={14}/></button>
        </div>
      </div>

      {/* Hero */}
      <div className="det-hero">
        <div className="det-av" style={{ background: avColor(name) }}>
          {initials(name)}
          {isPrivate && <span className="det-priv-dot"/>}
        </div>
        <div className="det-name">{name}</div>
        <div className="det-badges">
          <span className="det-cat-badge" style={{ color:catColor, borderColor:catColor+'44', background:catColor+'18' }}>{category}</span>
          {isPrivate && <span className="det-priv-badge">🔒 Private</span>}
          {favorite  && <span className="det-fav-badge">★ Favourite</span>}
        </div>
        {bday && <div className="det-bday-pill" style={{ color:bday.color }}>{bday.label}</div>}
        {tags.length > 0 && (
          <div className="det-tags">
            {tags.map(t=><span key={t} className="det-tag"><Tag size={10}/>{t}</span>)}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="det-tabs">
        <button className={`det-tab${tab==='info'?' active':''}`} onClick={()=>setTab('info')}>Info</button>
        <button className={`det-tab${tab==='reminders'?' active':''}`} onClick={()=>setTab('reminders')}>
          Reminders{pending.length>0?` (${pending.length})`:''}
        </button>
        <button className={`det-tab${tab==='followups'?' active':''}`} onClick={()=>setTab('followups')}>
          Notes{followups.length>0?` (${followups.length})`:''}
        </button>
      </div>

      <div className="det-body">

        {/* ═══ INFO ══════════════════════════════════════ */}
        {tab === 'info' && (
          <div>
            {/* Phones */}
            {phones.length > 0 && (
              <div className="det-section">
                <div className="det-section-title">📞 Phone Numbers</div>
                {phones.map((p,i) => (
                  <div key={i} className="det-row">
                    <div className="det-row-left"><Phone size={12}/>{p.label}</div>
                    <div className="det-row-right">
                      <button className="det-link" onClick={()=>callPhone(p.number)}>{p.number}</button>
                      <button className="det-sms-btn" onClick={()=>smsPhone(p.number)} title="Send SMS">
                        <MessageSquare size={11}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Email */}
            {email && (
              <div className="det-section">
                <div className="det-section-title">✉️ Email</div>
                <div className="det-row">
                  <div className="det-row-left"><Mail size={12}/>Email</div>
                  <a href={`mailto:${email}`} className="det-link">{email}</a>
                </div>
              </div>
            )}

            {/* Birthday */}
            {birthday && (
              <div className="det-section">
                <div className="det-section-title">🎂 Birthday</div>
                <div className="det-bday-box">
                  <Calendar size={13} style={{ flexShrink:0 }}/>
                  <div>
                    <div className="det-bday-date">{fmtLong(birthday)}</div>
                    {bday && <div className="det-bday-countdown" style={{ color:bday.color }}>{bday.label}</div>}
                  </div>
                </div>
              </div>
            )}

            {/* Address + Google Maps */}
            {fullAddress && (
              <div className="det-section">
                <div className="det-section-title">📍 Address</div>
                <div className="det-addr-block">
                  <div className="det-addr-text"><MapPin size={12}/>{fullAddress}</div>
                  <div className="det-addr-btns">
                    <button className="det-map-btn" onClick={()=>setShowMap(v=>!v)}>
                      <Map size={12}/>{showMap?'Hide Map':'Preview Map'}
                    </button>
                    <button className="det-map-btn primary" onClick={openGoogleMaps}>
                      <ExternalLink size={12}/>Google Maps
                    </button>
                    <button className="det-map-btn" onClick={getDirections}>
                      <Navigation size={12}/>Directions
                    </button>
                  </div>
                  {showMap && <GoogleMapEmbed address={fullAddress}/>}
                </div>
              </div>
            )}

            {/* Notes */}
            {notes && (
              <div className="det-section">
                <div className="det-section-title">📝 Notes</div>
                <div className="det-notes">{notes}</div>
              </div>
            )}

            <div className="det-meta">Added {fmtLong(createdAt)}</div>
          </div>
        )}

        {/* ═══ REMINDERS ═════════════════════════════════ */}
        {tab === 'reminders' && (
          <div>
            <div className="det-add-box">
              <div className="det-section-title">Add New Reminder</div>
              <select className="det-select" value={remType} onChange={e=>setRemType(e.target.value)}>
                {REM_TYPES.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <input type="date" className="det-input" value={remDate} onChange={e=>setRemDate(e.target.value)}/>
              <input type="text" className="det-input" placeholder="Note (optional)" value={remNote} onChange={e=>setRemNote(e.target.value)}/>
              <button className="det-add-btn" onClick={addRem} disabled={saving}><Plus size={13}/>Add Reminder</button>
            </div>
            {pending.length===0 && <p className="det-empty">No pending reminders</p>}
            {pending.map(r => {
              const overdue = r.dueDate && new Date(r.dueDate) < new Date();
              return (
                <div key={r._id} className={`det-reminder-row${overdue?' overdue':''}`}>
                  <span className="det-rem-emoji">{r.type==='call'?'📞':r.type==='followup'?'💬':'🕐'}</span>
                  <div className="det-rem-body">
                    <div className="det-rem-type">{r.type}</div>
                    {r.note && <div className="det-rem-note">{r.note}</div>}
                    {r.dueDate && (
                      <div className={`det-rem-date${overdue?' overdue':''}`}>
                        <Clock size={10}/>{fmtShort(r.dueDate)}{overdue?' ⚠️ Overdue':''}
                      </div>
                    )}
                  </div>
                  <div className="det-rem-actions">
                    <button className="det-action-btn done" onClick={()=>doneRem(r._id)} title="Done"><CheckCircle2 size={13}/></button>
                    <button className="det-action-btn remove" onClick={()=>delRem(r._id)} title="Delete"><Trash size={11}/></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ FOLLOW-UPS / NOTES ════════════════════════ */}
        {tab === 'followups' && (
          <div>
            <div className="det-add-box">
              <div className="det-section-title">Add Follow-up Note</div>
              <textarea className="det-input" rows={3}
                placeholder="e.g. Discussed project, follow up next week…"
                value={fuNote} onChange={e=>setFuNote(e.target.value)}
                style={{ resize:'vertical' }}
              />
              <button className="det-add-btn" onClick={addFu} disabled={saving||!fuNote.trim()}>
                <Plus size={13}/>Save Note
              </button>
            </div>
            {followups.length===0 && <p className="det-empty">No notes yet</p>}
            {[...followups].reverse().map(f=>(
              <div key={f._id} className="det-followup-row">
                <div className="det-followup-text">{f.note}</div>
                <div className="det-followup-footer">
                  <span className="det-followup-date">{fmtShort(f.createdAt)}</span>
                  <button className="det-followup-del" onClick={()=>delFu(f._id)}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </motion.aside>
  );
}
