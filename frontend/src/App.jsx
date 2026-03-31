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
  else if (Notification.permission !== 'denied') Notification.requestPermission().then(p => {
    if (p === 'granted') new Notification(title, { body });
  });
}

export default function App() {
  const { user, loading: authLoading } = useAuth();

  // MOBILE SIDEBAR STATE
  const [open, setOpen] = useState(false);

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

  const handleCSV = async e => {
    const file = e.target.files?.[0]; if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    try {
      const r = await importCSV(fd);
      const { imported, skipped } = r.data.data;
      toast.success(`Imported ${imported}` + (skipped ? `, skipped ${skipped}` : ''));
      fetchContacts(); fetchTags();
    } catch (err) { toast.error(err.response?.data?.message || 'Import failed'); }
    e.target.value = '';
  };

  const handlePDF = async () => {
    try {
      const r = await exportPDF();
      const url = URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url; a.download = 'Callista-Contacts.pdf';
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch { toast.error('Export failed'); }
  };

  if (authLoading) return <div className="app-loading">Loading...</div>;
  if (!user) return <LoginPage />;

  const pageTitle = showFavorites ? 'Favourites' : category || activeTag ? (category || `#${activeTag}`) : 'All Contacts';

  return (
    <div className="app">
      <input ref={csvRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCSV} />

      {/* MOBILE MENU BUTTON */}
      <button className="menu-btn" onClick={() => setOpen(true)}>☰</button>

      <Sidebar
        open={open}
        setOpen={setOpen}
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
              {!loading && <span className="topbar-count">{contacts.length} contacts</span>}
            </div>
            <div className="topbar-right">
              <button className="add-btn" onClick={() => setShowAdd(true)}>
                <Plus size={14} /> New Contact
              </button>
            </div>
          </div>

          <div className="content">
            {contacts.length === 0 ? (
              <EmptyState onAdd={() => setShowAdd(true)} search={search} />
            ) : (
              <div className={`contacts-grid${viewMode === 'list' ? ' list' : ''}`}>
                <AnimatePresence>
                  {contacts.map(c => (
                    <ContactCard key={c._id} contact={c} viewMode={viewMode}
                      isSelected={selected?._id === c._id}
                      onClick={() => setSelected(c)}
                    />
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
    </div>
  );
}