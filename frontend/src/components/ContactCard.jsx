import React from 'react';
import { motion } from 'framer-motion';
import { Star, Edit2, Trash2, Phone, Mail, MapPin, Calendar, Lock, Tag } from 'lucide-react';
import './ContactCard.css';

const CAT_COLORS = {
  Personal: '#6366f1', Work: '#14b8a6', Family: '#f43f5e',
  Emergency: '#ef4444', Other: '#f59e0b'
};
const AV_COLORS = ['#6366f1', '#14b8a6', '#f43f5e', '#0ea5e9', '#84cc16', '#f59e0b'];

const initials = name => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
const avColor  = name  => AV_COLORS[name.charCodeAt(0) % AV_COLORS.length];
const fmtBday  = d     => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

export default function ContactCard({ contact, viewMode, isSelected, onClick, onEdit, onDelete, onToggleFavorite }) {
  const { name, phones = [], email, address = {}, category, favorite, birthday, tags = [], isPrivate } = contact;
  const color    = avColor(name);
  const catColor = CAT_COLORS[category] || '#6b6c9e';
  const primary  = phones[0]?.number || '—';
  const stop = fn => e => { e.stopPropagation(); fn(); };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.14 }}
      className={`card${viewMode === 'list' ? ' list' : ''}${isSelected ? ' selected' : ''}`}
      onClick={onClick}
    >
      <div className="card-top">
        <div className="card-avatar" style={{ background: color }}>
          {initials(name)}
          {isPrivate && <span className="card-priv-dot" title="Private" />}
        </div>
        <div className="card-info">
          <div className="card-header">
            <span className="card-name">{name}</span>
            <span className="card-cat" style={{ color: catColor, borderColor: catColor + '55', background: catColor + '15' }}>{category}</span>
          </div>
          <div className="card-row"><Phone size={11} />{primary}{phones.length > 1 && <span className="card-more">+{phones.length - 1}</span>}</div>
          {email && <div className="card-row"><Mail size={11} />{email}</div>}
          {address?.city && <div className="card-row"><MapPin size={11} />{address.city}{address.country ? ', ' + address.country : ''}</div>}
          {birthday && <div className="card-row card-bday"><Calendar size={11} />{fmtBday(birthday)}</div>}
          {tags.length > 0 && (
            <div className="card-tags">
              {tags.slice(0, 3).map(t => <span key={t} className="card-tag"><Tag size={9} />{t}</span>)}
              {tags.length > 3 && <span className="card-tag">+{tags.length - 3}</span>}
            </div>
          )}
        </div>
      </div>
      <div className="card-actions">
        {isPrivate && <Lock size={11} style={{ color: 'var(--teal)', opacity: 0.7, marginRight: 3 }} />}
        <button className={`card-btn fav-btn${favorite ? ' fav-on' : ''}`} onClick={stop(onToggleFavorite)} title="Favourite">
          <Star size={12} fill={favorite ? 'currentColor' : 'none'} />
        </button>
        <button className="card-btn edit-btn" onClick={stop(onEdit)} title="Edit"><Edit2 size={12} /></button>
        <button className="card-btn del-btn" onClick={stop(onDelete)} title="Delete"><Trash2 size={12} /></button>
      </div>
    </motion.div>
  );
}
