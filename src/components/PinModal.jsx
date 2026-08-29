import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Delete } from 'lucide-react';
import { authVerifyPin } from '../services/api';
import './PinModal.css';

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','del'];

export default function PinModal({ onVerified, onClose }) {
  const [digits,  setDigits]  = useState([]);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [shake,   setShake]   = useState(false);

  function press(k) {
    if (loading) return;
    setError('');

    if (k === 'del') {
      setDigits(d => d.slice(0, -1));
      return;
    }
    if (digits.length >= 4) return;

    const next = [...digits, k];
    setDigits(next);

    if (next.length === 4) verify(next.join(''));
  }

  function verify(code) {
    setLoading(true);
    authVerifyPin({ pin: code })
      .then(res => {
        if (res.data.success) {
          onVerified();
        } else {
          triggerError('Incorrect PIN. Try again.');
        }
      })
      .catch(() => triggerError('Verification failed. Try again.'))
      .finally(() => setLoading(false));
  }

  function triggerError(msg) {
    setError(msg);
    setShake(true);
    setDigits([]);
    setTimeout(() => setShake(false), 500);
  }

  return (
    <div className="pm-overlay" onClick={onClose}>
      <motion.div
        className="pm-card"
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 10 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="pm-icon"><Shield size={26} strokeWidth={1.75} /></div>
        <h3 className="pm-title">Private Contacts</h3>
        <p className="pm-sub">Enter your 4-digit PIN to unlock</p>

        {/* Dot indicators */}
        <motion.div
          className="pm-dots"
          animate={shake ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : {}}
          transition={{ duration: 0.45 }}
        >
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`pm-dot${i < digits.length ? ' filled' : ''}`} />
          ))}
        </motion.div>

        <p className="pm-error">{error}</p>

        {/* Numpad */}
        <div className="pm-pad">
          {KEYS.map((k, i) => {
            if (k === '') return <div key={i} />;
            return (
              <button
                key={i}
                className={`pm-key${k === 'del' ? ' del' : ''}`}
                onClick={() => press(k)}
                disabled={loading}
              >
                {k === 'del' ? <Delete size={16} /> : k}
              </button>
            );
          })}
        </div>

        <button className="pm-cancel" onClick={onClose}>Cancel</button>
      </motion.div>
    </div>
  );
}
