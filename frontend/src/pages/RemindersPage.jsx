import React, { useEffect, useState } from 'react';
import { Bell, Phone, CheckCircle2 } from 'lucide-react';
import { getAllReminders, updateReminder } from '../services/api';
import { toast } from 'react-toastify';
import './RemindersPage.css';

function getDueInfo(dueDate) {
  var now = new Date();
  now.setHours(0, 0, 0, 0);
  var d = new Date(dueDate);
  d.setHours(0, 0, 0, 0);
  var diff = Math.ceil((d - now) / 86400000);
  if (diff < 0) return { label: Math.abs(diff) + 'd overdue', cls: 'overdue' };
  if (diff === 0) return { label: 'Due today', cls: 'today' };
  if (diff === 1) return { label: 'Due tomorrow', cls: '' };
  return { label: 'In ' + diff + ' days', cls: '' };
}

function ReminderRow({ r, onDone }) {
  var due = r.dueDate ? getDueInfo(r.dueDate) : null;
  var emoji = r.type === 'call' ? '📞' : r.type === 'followup' ? '💬' : '🕐';
  return (
    <div className="rp-row">
      <span className="rp-emoji">{emoji}</span>
      <div className="rp-body">
        <div className="rp-contact">{r.contactName}</div>
        <div className="rp-type">{r.type}</div>
        {r.note && <div className="rp-note">{r.note}</div>}
        {r.contactPhone && <a href={'tel:' + r.contactPhone} className="rp-phone"><Phone size={11} />{r.contactPhone}</a>}
      </div>
      <div className="rp-right">
        {due && <span className={'rp-due ' + due.cls}>{due.label}</span>}
        {r.dueDate && <span className="rp-date">{new Date(r.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
        <button className="rp-done-btn" onClick={onDone}><CheckCircle2 size={14} />Done</button>
      </div>
    </div>
  );
}

export default function RemindersPage() {
  var [reminders, setReminders] = useState([]);
  var [loading, setLoading] = useState(true);

  function load() {
    getAllReminders()
      .then(function(r) { setReminders(r.data.data); })
      .catch(function() {})
      .finally(function() { setLoading(false); });
  }

  useEffect(function() { load(); }, []);

  function markDone(r) {
    updateReminder(r.contactId, r._id, { completed: true })
      .then(function() { setReminders(function(prev) { return prev.filter(function(x) { return x._id !== r._id; }); }); toast.success('Reminder completed'); })
      .catch(function() { toast.error('Failed'); });
  }

  var overdue = reminders.filter(function(r) { return r.dueDate && new Date(r.dueDate) < new Date(); });
  var upcoming = reminders.filter(function(r) { return !r.dueDate || new Date(r.dueDate) >= new Date(); });

  if (loading) return <div className="rp-loading"><div className="rp-spinner" /></div>;

  return (
    <div className="rp">
      <div className="rp-header">
        <h2>Reminders</h2>
        {reminders.length > 0 && <span className="rp-count">{reminders.length} pending</span>}
      </div>

      {reminders.length === 0 && <div className="rp-empty"><Bell size={32} /><p>No pending reminders</p></div>}

      {overdue.length > 0 && (
        <div className="rp-section">
          <div className="rp-section-title overdue">⚠ Overdue ({overdue.length})</div>
          {overdue.map(function(r) { return <ReminderRow key={r._id} r={r} onDone={function() { markDone(r); }} />; })}
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="rp-section">
          <div className="rp-section-title">Upcoming</div>
          {upcoming.map(function(r) { return <ReminderRow key={r._id} r={r} onDone={function() { markDone(r); }} />; })}
        </div>
      )}
    </div>
  );
}
