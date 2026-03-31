import React from 'react';
import { Search, UserPlus } from 'lucide-react';

export default function EmptyState({ onAdd, search }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14, padding:'72px 24px', textAlign:'center' }}>
      <div style={{ width:56, height:56, borderRadius:16, background:'var(--surface-2)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--ink-ghost)' }}>
        {search ? <Search size={22}/> : <UserPlus size={22}/>}
      </div>
      <div>
        <p style={{ fontSize:'1rem', fontFamily:'DM Serif Display,serif', color:'var(--ink)', marginBottom:4 }}>
          {search ? 'No contacts found' : 'No contacts yet'}
        </p>
        <p style={{ fontSize:13, color:'var(--ink-soft)' }}>
          {search ? `No results for "${search}"` : 'Add your first contact to get started'}
        </p>
      </div>
      {!search && (
        <button onClick={onAdd} style={{ display:'flex', alignItems:'center', gap:7, height:38, padding:'0 18px', background:'var(--ink)', color:'white', border:'none', borderRadius:'var(--r-md)', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
          <UserPlus size={14}/>Add Contact
        </button>
      )}
    </div>
  );
}
