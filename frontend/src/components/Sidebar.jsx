import React from 'react';
import { Phone, Users, Star, Bell, BarChart2, Tag, LogOut, Settings, Upload, Download, X, Search, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const CAT_DOTS = {
  Personal: '#6366f1', Work: '#14b8a6', Family: '#f43f5e',
  Emergency: '#ef4444', Other: '#f59e0b'
};
const CATS = ['Personal', 'Work', 'Family', 'Emergency', 'Other'];

function Item({ active, icon, label, badge, onClick, dot, extra }) {
  return (
    <button className={`sb-item${active ? ' active' : ''}${extra ? ' ' + extra : ''}`} onClick={onClick}>
      {dot
        ? <span className="sb-dot" style={{ background: dot }} />
        : <span className="sb-ico">{icon}</span>}
      <span className="sb-label">{label}</span>
      {badge !== undefined && <span className="sb-badge">{badge}</span>}
    </button>
  );
}

export default function Sidebar({ page, setPage, search, setSearch, category, setCategory, showFavorites, setShowFavorites, contactCount, onImport, onExportPDF, tags, activeTag, setActiveTag }) {
  const { user, logout } = useAuth();

  const go = p => { setPage(p); setCategory(''); setShowFavorites(false); setActiveTag(''); };

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sb-brand">
        <div className="sb-brand-mark"><Phone size={17} strokeWidth={2.5} /></div>
        <div style={{ minWidth: 0 }}>
          <div className="sb-brand-name">Callista</div>
          <div className="sb-brand-user">@{user?.username}</div>
        </div>
      </div>

      {/* Search */}
      <div className="sb-search">
        <Search size={13} className="sb-search-ico" />
        <input placeholder="Search contacts…" value={search} onChange={e => setSearch(e.target.value)} />
        {search && <button className="sb-search-x" onClick={() => setSearch('')}><X size={11} /></button>}
      </div>

      <nav className="sb-nav">
        <p className="sb-sec">Directory</p>
        <Item active={page === 'contacts' && !showFavorites && !category && !activeTag}
          icon={<Users size={14} />} label="All Contacts" badge={contactCount}
          onClick={() => go('contacts')} />
        <Item active={showFavorites && page === 'contacts'}
          icon={<Star size={14} />} label="Favourites"
          onClick={() => { setPage('contacts'); setShowFavorites(true); setCategory(''); setActiveTag(''); }} />

        <p className="sb-sec" style={{ marginTop: 6 }}>Categories</p>
        {CATS.map(cat => (
          <Item key={cat}
            active={category === cat && page === 'contacts' && !showFavorites}
            dot={CAT_DOTS[cat]} label={cat}
            onClick={() => { setPage('contacts'); setCategory(cat === category ? '' : cat); setShowFavorites(false); setActiveTag(''); }} />
        ))}

        {tags?.length > 0 && <>
          <p className="sb-sec" style={{ marginTop: 6 }}>Tags</p>
          {tags.slice(0, 8).map(t => (
            <Item key={t.name} active={activeTag === t.name && page === 'contacts'}
              icon={<Tag size={13} />} label={t.name} badge={t.count}
              onClick={() => { setActiveTag(t.name === activeTag ? '' : t.name); setPage('contacts'); setCategory(''); setShowFavorites(false); }} />
          ))}
        </>}

        <p className="sb-sec" style={{ marginTop: 6 }}>Tools</p>
        <Item active={page === 'nearby'} icon={<MapPin size={14} />} label="Find Nearby" onClick={() => go('nearby')} extra="nearby-item" />
        <Item active={page === 'reminders'} icon={<Bell size={14} />} label="Reminders" onClick={() => go('reminders')} />
        <Item active={page === 'analytics'} icon={<BarChart2 size={14} />} label="Analytics" onClick={() => go('analytics')} />
      </nav>

      {/* Bottom */}
      <div className="sb-bottom">
        <div className="sb-tools">
          <button className="sb-tool" onClick={onImport}><Upload size={12} />Import CSV</button>
          <button className="sb-tool" onClick={onExportPDF}><Download size={12} />Export PDF</button>
        </div>
        <div className="sb-footer">
          <button className="sb-foot" onClick={() => go('settings')}><Settings size={13} />Settings</button>
          <button className="sb-foot danger" onClick={logout}><LogOut size={13} />Sign Out</button>
        </div>
      </div>
    </aside>
  );
}
