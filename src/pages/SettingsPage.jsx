import React, { useState } from 'react';
import { Shield, Key, CheckCircle2 } from 'lucide-react';
import { authSetPin } from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import './SettingsPage.css';

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const [pin,        setPin]        = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [saving,     setSaving]     = useState(false);

  const handleSetPin = async (e) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(pin))   { toast.error('PIN must be exactly 4 digits'); return; }
    if (pin !== confirmPin)      { toast.error('PINs do not match'); return; }
    setSaving(true);
    try {
      await authSetPin({ pin });
      setUser(u => ({ ...u, hasPin: true }));
      toast.success('✅ PIN set — private contacts are now protected');
      setPin(''); setConfirmPin('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to set PIN');
    } finally { setSaving(false); }
  };

  return (
    <div className="sp">
      <h2 className="sp-title">Settings</h2>

      <div className="sp-section">
        <div className="sp-section-hdr"><Shield size={13}/>Privacy & Security</div>
        <div className="sp-card">
          <h4>Private Contact PIN</h4>
          <p>Set a 4-digit PIN to lock private contacts. They stay hidden from the main list until you enter the PIN.</p>
          {user?.hasPin && (
            <div className="pin-set-badge"><CheckCircle2 size={14}/>PIN is active — update it below if needed</div>
          )}
          <form onSubmit={handleSetPin} className="sp-form">
            <div className="sp-group">
              <label>New PIN (4 digits)</label>
              <input type="password" inputMode="numeric" value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g,'').slice(0,4))}
                placeholder="••••" maxLength={4} className="sp-input"/>
            </div>
            <div className="sp-group">
              <label>Confirm PIN</label>
              <input type="password" inputMode="numeric" value={confirmPin}
                onChange={e => setConfirmPin(e.target.value.replace(/\D/g,'').slice(0,4))}
                placeholder="••••" maxLength={4} className="sp-input"/>
            </div>
            <button type="submit" className="sp-btn" disabled={saving}>
              <Key size={13}/>{saving ? 'Saving…' : user?.hasPin ? 'Update PIN' : 'Set PIN'}
            </button>
          </form>
        </div>
      </div>

      <div className="sp-section">
        <div className="sp-section-hdr">ℹ About</div>
        <div className="sp-card">
          <h4>PhoneBook Pro</h4>
          <p style={{ marginTop:8 }}>Full-featured MERN contact directory — JWT auth, Google Maps, birthday notifications, reminders, analytics, CSV import, PDF export, and PIN-protected private contacts.</p>
        </div>
      </div>
    </div>
  );
}
