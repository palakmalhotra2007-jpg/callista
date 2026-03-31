import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, Navigation, Loader, AlertCircle, ExternalLink, Star } from 'lucide-react';
import './NearbyPage.css';

const QUICK = [
  { icon: '🏥', label: 'Hospital',        q: 'hospital' },
  { icon: '🚒', label: 'Fire Station',    q: 'fire station' },
  { icon: '👮', label: 'Police Station',  q: 'police station' },
  { icon: '💊', label: 'Pharmacy',        q: 'pharmacy' },
  { icon: '🔧', label: 'Plumber',         q: 'plumber' },
  { icon: '⚡', label: 'Electrician',     q: 'electrician' },
  { icon: '🏦', label: 'Bank / ATM',      q: 'bank ATM' },
  { icon: '🦷', label: 'Dentist',         q: 'dentist' },
  { icon: '🏫', label: 'School',          q: 'school' },
  { icon: '🛒', label: 'Grocery Store',   q: 'grocery store' },
  { icon: '⛽', label: 'Petrol Pump',     q: 'petrol pump' },
  { icon: '🚗', label: 'Car Mechanic',    q: 'car mechanic' },
  { icon: '🏨', label: 'Hotel',           q: 'hotel' },
  { icon: '🍽️', label: 'Restaurant',     q: 'restaurant' },
  { icon: '🏋️', label: 'Gym',            q: 'gym' },
  { icon: '🧹', label: 'House Cleaner',   q: 'house cleaning service' },
];

export default function NearbyPage() {
  const [query,    setQuery]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);
  const [locErr,   setLocErr]   = useState('');
  const [coords,   setCoords]   = useState(null);
  const [activeQ,  setActiveQ]  = useState('');

  const getLocation = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('Geolocation not supported by your browser')); return; }
    navigator.geolocation.getCurrentPosition(
      p  => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => reject(new Error('Location access denied. Please allow location in your browser settings.'))
    );
  });

  const doSearch = async (raw) => {
    const q = (raw || query).trim();
    if (!q) return;
    setLoading(true); setLocErr(''); setDone(false); setActiveQ(q);
    try {
      const loc = coords || await getLocation();
      if (!coords) setCoords(loc);
      window.open(
        `https://www.google.com/maps/search/${encodeURIComponent(q + ' near me')}/@${loc.lat},${loc.lng},14z`,
        '_blank', 'noopener,noreferrer'
      );
      setDone(true);
    } catch (err) { setLocErr(err.message); }
    finally { setLoading(false); }
  };

  const makeLinks = q => {
    if (!coords) return [];
    const enc = encodeURIComponent(q + ' near me');
    const ll  = `${coords.lat},${coords.lng}`;
    return [
      { icon: '🗺️', label: 'View on Map',             href: `https://www.google.com/maps/search/${enc}/@${ll},14z` },
      { icon: '🧭', label: 'Get Directions',           href: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}&origin=${ll}` },
      { icon: '📍', label: 'Satellite View',           href: `https://www.google.com/maps/search/${enc}/@${ll},15z/data=!3m1!1e3` },
    ];
  };

  const embedSrc = coords && activeQ
    ? `https://maps.google.com/maps?q=${encodeURIComponent(activeQ + ' near me')}&ll=${coords.lat},${coords.lng}&output=embed&z=14`
    : null;

  return (
    <div className="nb">
      {/* Header */}
      <div className="nb-head">
        <div className="nb-head-ico"><MapPin size={22} strokeWidth={2.5} /></div>
        <div>
          <h2 className="nb-title">Find Nearby</h2>
          <p className="nb-sub">Search hospitals, plumbers, pharmacies and more around you</p>
        </div>
        {coords && <div className="nb-loc-ok"><Navigation size={11} />Location found</div>}
      </div>

      {/* Search bar */}
      <form className="nb-bar" onSubmit={e => { e.preventDefault(); doSearch(); }}>
        <Search size={16} className="nb-bar-ico" />
        <input
          className="nb-bar-inp"
          placeholder="Search anything… hospital, plumber, pharmacy, gym…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button type="submit" className="nb-bar-btn" disabled={loading || !query.trim()}>
          {loading
            ? <Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
            : 'Search'}
        </button>
      </form>

      {/* Quick chips */}
      <div className="nb-quick">
        <p className="nb-quick-lbl">Quick Search</p>
        <div className="nb-chips">
          {QUICK.map(s => (
            <button
              key={s.q}
              className={`nb-chip${activeQ === s.q ? ' active' : ''}`}
              onClick={() => { setQuery(s.q); doSearch(s.q); }}
            >
              <span>{s.icon}</span>{s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {locErr && (
        <motion.div className="nb-err" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <AlertCircle size={16} />
          <div>
            <strong>Location needed</strong>
            <p>{locErr}</p>
          </div>
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence>
        {done && coords && !loading && (
          <motion.div className="nb-results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>

            {/* Map embed */}
            {embedSrc && (
              <div className="nb-map">
                <iframe
                  title="Nearby Map"
                  src={embedSrc}
                  width="100%" height="300"
                  style={{ border: 0, borderRadius: 'var(--r-lg)', display: 'block' }}
                  allowFullScreen loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}

            {/* Action links */}
            <p className="nb-links-lbl">Open in Google Maps</p>
            <div className="nb-links">
              {makeLinks(activeQ).map(l => (
                <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="nb-link-card">
                  <span className="nb-link-ico">{l.icon}</span>
                  <span className="nb-link-label">{l.label}</span>
                  <ExternalLink size={12} className="nb-link-ext" />
                </a>
              ))}
            </div>

            {/* Tip */}
            <div className="nb-tip">
              <Star size={13} />
              <span>Found a useful number? Add it to your <strong>Dial</strong> directory using <strong>New Contact</strong>!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!loading && !done && !locErr && (
        <div className="nb-empty">
          <div className="nb-empty-ico">🔍</div>
          <p className="nb-empty-title">Search anything nearby</p>
          <p className="nb-empty-desc">Click a quick search chip above, or type what you need in the search bar</p>
        </div>
      )}
    </div>
  );
}
