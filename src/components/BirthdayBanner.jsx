import React from 'react';
import { Gift, Bell } from 'lucide-react';
import './BirthdayBanner.css';

export default function BirthdayBanner({ birthdays }) {
  if (!birthdays || birthdays.length === 0) return null;
  const today = birthdays.filter(b => b.daysUntil === 0);
  const week  = birthdays.filter(b => b.daysUntil > 0 && b.daysUntil <= 7);
  const later = birthdays.filter(b => b.daysUntil > 7);

  return (
    <div className="bb-wrap">
      {today.length > 0 && (
        <div className="bb-banner today">
          <div className="bb-icon"><Gift size={16}/></div>
          <div className="bb-content">
            <span className="bb-label">🎂 Birthday Today!</span>
            <div className="bb-chips">
              {today.map(b => <span key={b._id} className="bb-chip today">{b.name} 🎉</span>)}
            </div>
          </div>
        </div>
      )}
      {(week.length > 0 || later.length > 0) && (
        <div className="bb-banner upcoming">
          <div className="bb-icon"><Bell size={15}/></div>
          <div className="bb-content">
            <span className="bb-label">Upcoming Birthdays (next 30 days)</span>
            <div className="bb-chips">
              {week.map(b => (
                <span key={b._id} className="bb-chip week">
                  {b.name}<span className="bb-days week">{b.daysUntil}d</span>
                </span>
              ))}
              {later.map(b => (
                <span key={b._id} className="bb-chip">
                  {b.name}<span className="bb-days">{b.daysUntil}d</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
