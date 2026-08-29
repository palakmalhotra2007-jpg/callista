import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { authVerifyPin } from '../services/api';
import './PinModal.css';

export default function PinModal({ onVerified, onClose }) {
  var [digits, setDigits] = useState(['', '', '', '']);
  var [error, setError] = useState('');
  var [loading, setLoading] = useState(false);
  var refs = [useRef(), useRef(), useRef(), useRef()];

  useEffect(function() {
    refs[0].current && refs[0].current.focus();
  }, []); // eslint-disable-line

  function handleKeyDown(i, e) {
    if (e.key === 'Backspace') {
      var next = digits.slice();
      next[i] = '';
      setDigits(next);
      if (i > 0) refs[i - 1].current.focus();
      return;
    }
    if (!/^[0-9]$/.test(e.key)) return;
    var arr = digits.slice();
    arr[i] = e.key;
    setDigits(arr);
    if (i < 3) {
      refs[i + 1].current.focus();
    } else {
      var code = arr.join('');
      if (code.length === 4) verify(code);
    }
  }

  function verify(code) {
    setLoading(true);
    setError('');
    authVerifyPin({ pin: code })
      .then(function(res) {
        if (res.data.success) {
          sessionStorage.setItem('pb_pin_ok', '1');
          onVerified();
        } else {
          setError('Incorrect PIN. Try again.');
          setDigits(['', '', '', '']);
          refs[0].current && refs[0].current.focus();
        }
      })
      .catch(function() { setError('Verification failed.'); })
      .finally(function() { setLoading(false); });
  }

  return (
    <div className="pin-overlay" onClick={onClose}>
      <motion.div className="pin-box" initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94 }} onClick={function(e) { e.stopPropagation(); }}>
        <div className="pin-icon"><Shield size={22} /></div>
        <h3>Private Contacts</h3>
        <p>Enter your 4-digit PIN to view private contacts</p>
        <div className="pin-inputs">
          {digits.map(function(v, i) {
            return (
              <input
                key={i}
                ref={refs[i]}
                type="password"
                maxLength={1}
                value={v}
                className={'pin-digit' + (error ? ' pin-err' : '')}
                onKeyDown={function(e) { handleKeyDown(i, e); }}
                onChange={function() {}}
                disabled={loading}
              />
            );
          })}
        </div>
        {error && <p className="pin-error">{error}</p>}
        <button className="pin-cancel-btn" onClick={onClose}>Cancel</button>
      </motion.div>
    </div>
  );
}
