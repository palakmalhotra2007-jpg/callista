import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { Users, Star, Lock, Gift, Bell } from 'lucide-react';
import { getAnalytics } from '../services/api';
import './AnalyticsPage.css';

const CAT_COLORS = { Personal:'#6366f1', Work:'#14b8a6', Family:'#f43f5e', Emergency:'#ef4444', Other:'#f59e0b' };

const STATS = (d) => [
  { icon: <Users size={17}/>,  label: 'Total Contacts',    value: d.total,            color: '#6366f1', bg: '#dbeafe' },
  { icon: <Star size={17}/>,   label: 'Favourites',        value: d.favCount,          color: '#d97706', bg: '#fffbeb' },
  { icon: <Lock size={17}/>,   label: 'Private',           value: d.privCount,         color: '#14b8a6', bg: '#f5f3ff' },
  { icon: <Gift size={17}/>,   label: 'Have Birthday',     value: d.bdays,             color: '#f43f5e', bg: '#fff1f2' },
  { icon: <Bell size={17}/>,   label: 'Pending Reminders', value: d.pendingReminders,  color: '#ef4444', bg: '#fef2f2' },
];

export default function AnalyticsPage() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics().then(r => setData(r.data.data)).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  if (loading) return <div className="ap-loading"><div className="ap-spinner"/></div>;
  if (!data)   return <div className="ap"><p style={{color:'var(--ink-soft)'}}>Could not load analytics.</p></div>;

  const catData = (data.byCategory||[]).map(c => ({ name:c._id, value:c.count, color: CAT_COLORS[c._id]||'#888' }));

  return (
    <div className="ap">
      <h2 className="ap-title">Analytics</h2>

      <div className="ap-stats">
        {STATS(data).map(s => (
          <div key={s.label} className="ap-stat">
            <div className="ap-stat-icon" style={{ color:s.color, background:s.bg }}>{s.icon}</div>
            <div className="ap-stat-val">{s.value ?? 0}</div>
            <div className="ap-stat-lbl">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="ap-charts">
        <div className="ap-chart">
          <h3>Contacts by Category</h3>
          {catData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={catData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {catData.map((e,i) => <Cell key={i} fill={e.color}/>)}
                </Pie>
                <Tooltip contentStyle={{ fontSize:12, borderRadius:8 }}/>
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="ap-no-data">No contacts yet</p>}
        </div>

        <div className="ap-chart">
          <h3>Recently Added</h3>
          {data.topSearched?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.topSearched} layout="vertical" margin={{ left:10 }}>
                <XAxis type="number" tick={{ fontSize:11 }}/>
                <YAxis dataKey="name" type="category" width={90} tick={{ fontSize:12 }}/>
                <Tooltip contentStyle={{ fontSize:12, borderRadius:8 }}/>
                <Bar dataKey="searchCount" fill="var(--accent)" radius={[0,4,4,0]}/>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="ap-no-data">Add contacts to see data</p>}
        </div>
      </div>
    </div>
  );
}
