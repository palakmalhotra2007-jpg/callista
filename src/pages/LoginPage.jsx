import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Loader, AtSign, Lock, AlertCircle, Phone } from 'lucide-react';
import { authLogin, authRegister } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const { loginUser } = useAuth();
  const [mode, setMode] = useState('login');
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const clear = () => setError('');

  const switchMode = (m) => {
    setMode(m);
    clear();
    setUser('');
    setPass('');
    setConfirm('');
  };

  const submit = async (e) => {
    e.preventDefault();
    clear();

    if (!user.trim()) {
      setError('Please enter a username');
      return;
    }

    if (!pass) {
      setError('Please enter a password');
      return;
    }

    if (mode === 'register') {
      if (pass.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      if (pass !== confirm) {
        setError('Passwords do not match');
        return;
      }
    }

    setLoading(true);
    try {
      const fn = mode === 'login' ? authLogin : authRegister;
      const res = await fn({ username: user.trim(), password: pass });
      loginUser(res.data.token, res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lp-center">
      <motion.div
        className="lp-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >

        {/* 🌸 BRANDING */}
        <div className="lp-card-brand">
          <div className="lp-card-mark">
            <Phone size={16} strokeWidth={2.5} />
          </div>
          <div>
            <span className="lp-card-name">Callista</span>
            <p className="brand-tagline">
              Beautifully Organized Connections.
            </p>
          </div>
        </div>

        {/* MODE HEADER */}
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <p className="lp-title">
              {mode === 'login' ? 'Welcome back 👋' : 'Create your account'}
            </p>
            <p className="lp-sub">
              {mode === 'login'
                ? 'Sign in to Callista'
                : 'Set up your personal Callista directory'}
            </p>
          </motion.div>
        </AnimatePresence>

        {error && (
          <div className="lp-err">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <form onSubmit={submit} className="lp-form">

          <div className="lp-field">
            <label>Username</label>
            <div className="lp-iw">
              <AtSign size={14} className="lp-ico" />
              <input
                type="text"
                placeholder="e.g. itspalku"
                value={user}
                onChange={(e) => {
                  setUser(e.target.value);
                  clear();
                }}
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="lp-field">
            <label>Password</label>
            <div className="lp-iw">
              <Lock size={14} className="lp-ico" />
              <input
                type={show ? 'text' : 'password'}
                placeholder={mode === 'register' ? 'Min. 6 characters' : '••••••••'}
                value={pass}
                onChange={(e) => {
                  setPass(e.target.value);
                  clear();
                }}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
              />
              <button
                type="button"
                className="lp-eye"
                onClick={() => setShow((v) => !v)}
              >
                {show ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div className="lp-field">
              <label>Confirm Password</label>
              <div className="lp-iw">
                <Lock size={14} className="lp-ico" />
                <input
                  type="password"
                  placeholder="Repeat your password"
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value);
                    clear();
                  }}
                  autoComplete="new-password"
                />
              </div>
            </div>
          )}

          <button type="submit" className="lp-btn" disabled={loading}>
            {loading
              ? <>
                  <Loader size={15} style={{ animation: 'spin 0.8s linear infinite' }} />
                  &nbsp;Processing…
                </>
              : mode === 'login'
              ? 'Sign In'
              : 'Create Account'}
          </button>
        </form>

        <p className="lp-switch">
          {mode === 'login'
            ? "Don't have an account? "
            : 'Already registered? '}
          <button onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Create one free' : 'Sign in'}
          </button>
        </p>

      </motion.div>
    </div>
  );
}