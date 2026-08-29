import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { Grid, List, Plus, Lock, Unlock, RefreshCw } from 'lucide-react';
import { getContacts, deleteContact, toggleFavorite, getUpcomingBirthdays, getTags, importCSV, exportPDF } from './services/api';
import { useAuth } from './context/AuthContext';
import Sidebar        from './components/Sidebar';
import ContactCard    from './components/ContactCard';
import ContactModal   from './components/ContactModal';
import ContactDetail  from './components/ContactDetail';
import ConfirmDialog  from './components/ConfirmDialog';
import EmptyState     from './components/EmptyState';
import BirthdayBanner from './components/BirthdayBanner';
import PinModal       from './components/PinModal';
import LoginPage      from './pages/LoginPage';
import AnalyticsPage  from './pages/AnalyticsPage';
import RemindersPage  from './pages/RemindersPage';
import SettingsPage   from './pages/SettingsPage';
import NearbyPage     from './pages/NearbyPage';
import './App.css';

function notify(title, body) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') new Notification(title, { body, icon: '/favicon.ico' });
  else if (Notification.permission !== 'denied') Notification.requestPermission().then(p => { if (p === 'granted') new Notification(title, { body }); });
}

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const [contacts,      setContacts]      = useState([]);
  const [birthdays,     setBirthdays]     = useState([]);
  const [tags,          setTags]          = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [category,      setCategory]      = useState('');
  const [showFavorites, setShowFavorites] = useState(false);
  const [activeTag,     setActiveTag]     = useState('');
  const [selected,      setSelected]      = useState(null);
  const [editContact,   setEditContact]   = useState(null);
  const [showAdd,       setShowAdd]       = useState(false);
  const [toDelete,      setToDelete]      = useState(null);
  const [viewMode,      setViewMode]      = useState('grid');
  const [page,          setPage]          = useState('contacts');
  const [pinUnlocked,   setPinUnlocked]   = useState(sessionStorage.getItem('pb_pin_ok') === '1');
  const [showPin,       setShowPin]       = useState(false);
  const notified = useRef(false);
  const csvRef   = useRef(null);

  const fetchContacts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const p = {};
      if (search)        p.search      = search;
      if (category)      p.category    = category;
      if (showFavorites) p.favorite    = true;
      if (activeTag)     p.tag         = activeTag;
      if (pinUnlocked)   p.showPrivate = true;
      const res = await getContacts(p);
      setContacts(res.data.data);
    } catch { toast.error('Failed to load contacts'); }
    finally  { setLoading(false); }
  }, [user, search, category, showFavorites, activeTag, pinUnlocked]);

  const fetchBirthdays = useCallback(async () => {
    if (!user) return;
    try { const r = await getUpcomingBirthdays(); setBirthdays(r.data.data); } catch {}
  }, [user]);

  const fetchTags = useCallback(async () => {
    if (!user) return;
    try { const r = await getTags(); setTags(r.data.data); } catch {}
  }, [user]);

  useEffect(() => { const t = setTimeout(fetchContacts, 300); return () => clearTimeout(t); }, [fetchContacts]);
  useEffect(() => { fetchBirthdays(); fetchTags(); }, [fetchBirthdays, fetchTags]);

  useEffect(() => {
    if (!birthdays.length || notified.current) return;
    notified.current = true;
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    const today = birthdays.filter(b => b.daysUntil === 0);
    today.forEach(b => {
      toast.success(`🎂 Today is ${b.name}'s birthday!`, { autoClose: false });
      notify('🎂 Birthday Today!', `${b.name}'s birthday is today!`);
    });
    const week = birthdays.filter(b => b.daysUntil > 0 && b.daysUntil <= 7);
    if (week.length) {
      toast.info(`📅 Birthdays this week: ${week.map(b => `${b.name} (${b.daysUntil}d)`).join(', ')}`, { autoClose: 8000 });
    }
  }, [birthdays]);

  const handleDelete = async id => {
    try {
      await deleteContact(id);
      setContacts(p => p.filter(c => c._id !== id));
      if (selected?._id === id) setSelected(null);
      toast.success('Contact deleted');
      setToDelete(null);
      fetchBirthdays(); fetchTags();
    } catch { toast.error('Delete failed'); }
  };

  const handleFav = async id => {
    try {
      const r = await toggleFavorite(id);
      const u = r.data.data;
      setContacts(p => p.map(c => c._id === id ? u : c));
      if (selected?._id === id) setSelected(u);
    } catch { toast.error('Failed'); }
  };

  const handleSaved = (contact, isNew) => {
    if (isNew) {
      setContacts(p => [contact, ...p].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success('✅ Contact added!');
    } else {
      setContacts(p => p.map(c => c._id === contact._id ? contact : c));
      if (selected?._id === contact._id) setSelected(contact);
      toast.success('✅ Updated!');
    }
    setShowAdd(false); setEditContact(null);
    fetchBirthdays(); fetchTags();
  };

  const handleCSV = async e => {
    const file = e.target.files?.[0]; if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    try {
      const r = await importCSV(fd);
      const { imported, skipped } = r.data.data;
      toast.success(`📥 Imported ${imported}` + (skipped ? `, skipped ${skipped}` : ''));
      fetchContacts(); fetchTags();
    } catch (err) { toast.error(err.response?.data?.message || 'Import failed'); }
    e.target.value = '';
  };

  const handlePDF = async () => {
    try {
      toast.info('📄 Generating PDF…');
      const r = await exportPDF();
      const url = URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url; a.download = 'Dial-Directory.pdf';
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
      toast.success('📄 Downloaded!');
    } catch { toast.error('Export failed'); }
  };

  if (authLoading) return (
    <div className="app-loading">
      <div style={{ textAlign: 'center' }}>
        <div className="app-spin" style={{ margin: '0 auto 12px' }} />
        <p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>Loading Dial…</p>
      </div>
    </div>
  );

  if (!user) return <LoginPage />;

  const pageTitle = showFavorites ? 'Favourites' : category || activeTag ? (category || `#${activeTag}`) : 'All Contacts';

  return (
    <div className="app">
      <input ref={csvRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCSV} />

      <Sidebar
        page={page} setPage={setPage}
        search={search} setSearch={setSearch}
        category={category} setCategory={setCategory}
        showFavorites={showFavorites} setShowFavorites={setShowFavorites}
        contactCount={contacts.length}
        onImport={() => csvRef.current?.click()}
        onExportPDF={handlePDF}
        tags={tags} activeTag={activeTag} setActiveTag={setActiveTag}
      />

      <main className={`main${selected && page === 'contacts' ? ' panel-open' : ''}`}>
        {page === 'contacts' && <>
          <div className="topbar">
            <div className="topbar-left">
              <span className="topbar-title">{pageTitle}</span>
              {!loading && <span className="topbar-count">{contacts.length} contact{contacts.length !== 1 ? 's' : ''}</span>}
            </div>
            <div className="topbar-right">
              <button className="topbar-refresh" onClick={fetchContacts} title="Refresh"><RefreshCw size={13} /></button>
              {user.hasPin && (
                <button className={`private-btn${pinUnlocked ? ' active' : ''}`}
                  onClick={() => { if (pinUnlocked) { sessionStorage.removeItem('pb_pin_ok'); setPinUnlocked(false); } else setShowPin(true); }}>
                  {pinUnlocked ? <Unlock size={13} /> : <Lock size={13} />}
                  {pinUnlocked ? 'Hide Private' : 'Show Private'}
                </button>
              )}
              <div className="view-group">
                <button className={`view-btn${viewMode === 'grid' ? ' active' : ''}`} onClick={() => setViewMode('grid')}><Grid size={14} /></button>
                <button className={`view-btn${viewMode === 'list' ? ' active' : ''}`} onClick={() => setViewMode('list')}><List size={14} /></button>
              </div>
              <button className="add-btn" onClick={() => setShowAdd(true)}><Plus size={14} />New Contact</button>
            </div>
          </div>

          <div className="content">
            <BirthdayBanner birthdays={birthdays} />
            {loading ? (
              <div className="skel-grid">{[0, 1, 2, 3, 4, 5].map(i => <div key={i} className="skel-card" style={{ animationDelay: i * 0.08 + 's' }} />)}</div>
            ) : contacts.length === 0 ? (
              <EmptyState onAdd={() => setShowAdd(true)} search={search} />
            ) : (
              <div className={`contacts-grid${viewMode === 'list' ? ' list' : ''}`}>
                <AnimatePresence>
                  {contacts.map(c => (
                    <ContactCard key={c._id} contact={c} viewMode={viewMode}
                      isSelected={selected?._id === c._id}
                      onClick={() => setSelected(c)}
                      onEdit={() => setEditContact(c)}
                      onDelete={() => setToDelete(c)}
                      onToggleFavorite={() => handleFav(c._id)} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </>}

        {page === 'nearby'    && <NearbyPage />}
        {page === 'reminders' && <RemindersPage />}
        {page === 'analytics' && <AnalyticsPage />}
        {page === 'settings'  && <SettingsPage />}
      </main>

      <AnimatePresence>
        {selected && page === 'contacts' && (
          <ContactDetail contact={selected}
            onClose={() => setSelected(null)}
            onEdit={() => setEditContact(selected)}
            onDelete={() => setToDelete(selected)}
            onToggleFavorite={() => handleFav(selected._id)}
            onUpdated={u => { setContacts(p => p.map(c => c._id === u._id ? u : c)); setSelected(u); }} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {(showAdd || editContact) && (
          <ContactModal contact={editContact}
            onClose={() => { setShowAdd(false); setEditContact(null); }}
            onSaved={handleSaved} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {toDelete && (
          <ConfirmDialog title="Delete Contact"
            message={`Permanently delete "${toDelete.name}"? This cannot be undone.`}
            onConfirm={() => handleDelete(toDelete._id)}
            onCancel={() => setToDelete(null)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showPin && (
          <PinModal
            onVerified={() => { sessionStorage.setItem('pb_pin_ok', '1'); setPinUnlocked(true); setShowPin(false); }}
            onClose={() => setShowPin(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
