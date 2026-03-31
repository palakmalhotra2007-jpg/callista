import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ title, message, onConfirm, onCancel }) {
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:60, backdropFilter:'blur(3px)' }}>
      <motion.div initial={{ scale:0.94, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.94, opacity:0 }}
        style={{ background:'var(--surface)', borderRadius:'var(--r-xl)', padding:'28px 24px', width:340, boxShadow:'var(--sh-xl)' }}>
        <div style={{ width:44, height:44, borderRadius:12, background:'var(--red-bg)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--red)', margin:'0 auto 14px' }}>
          <AlertTriangle size={20}/>
        </div>
        <h3 style={{ fontFamily:'DM Serif Display,serif', fontSize:'1.1rem', color:'var(--ink)', marginBottom:6, textAlign:'center' }}>{title}</h3>
        <p style={{ fontSize:13, color:'var(--ink-soft)', textAlign:'center', marginBottom:22, lineHeight:1.6 }}>{message}</p>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onCancel} style={{ flex:1, height:40, background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', color:'var(--ink-mid)', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex:1, height:40, background:'var(--red)', border:'none', borderRadius:'var(--r-md)', color:'white', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>Delete</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
