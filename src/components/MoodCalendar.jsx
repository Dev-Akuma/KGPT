import React, { useState, useMemo } from 'react';
import { MOOD_OPTIONS } from './TodayMoodCheckIn';
import { parseDateKey, formatDateKey, getTodayKey } from '../utils/moodUtils';

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const MoodCalendar = ({ history }) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const todayKey = getTodayKey();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    const thisMonth = new Date();
    // Don't navigate to future months
    if (nextMonth.getFullYear() > thisMonth.getFullYear() || 
        (nextMonth.getFullYear() === thisMonth.getFullYear() && nextMonth.getMonth() > thisMonth.getMonth())) {
      return;
    }
    setCurrentMonth(nextMonth);
  };

  const isNextDisabled = () => {
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    const thisMonth = new Date();
    return nextMonth.getFullYear() > thisMonth.getFullYear() || 
           (nextMonth.getFullYear() === thisMonth.getFullYear() && nextMonth.getMonth() > thisMonth.getMonth());
  };

  const monthLabel = currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    
    // Empty slots for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [currentMonth]);

  const getMoodForDate = (dateKey) => {
    // History is now a dictionary
    return history[dateKey] || null;
  };

  const [selectedDateKey, setSelectedDateKey] = useState(null);

  const getSelectedDayDetails = () => {
    if (!selectedDateKey) return null;
    const checkIn = getMoodForDate(selectedDateKey);
    const displayDate = parseDateKey(selectedDateKey).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    
    if (checkIn) {
      const moodDef = MOOD_OPTIONS.find(m => m.key === checkIn.mood);
      return (
        <div className="calendar-day-details">
          <strong>{displayDate}</strong>
          <p>{moodDef ? `${moodDef.emoji} ${moodDef.label}` : 'Checked in'}</p>
        </div>
      );
    }

    return (
      <div className="calendar-day-details empty">
        <strong>{displayDate}</strong>
        <p>No check-in recorded.</p>
      </div>
    );
  };

  return (
    <section className="mood-calendar">
      <header className="calendar-header">
        <button type="button" onClick={handlePrevMonth} aria-label="Previous month">
          &lt;
        </button>
        <h3>{monthLabel}</h3>
        <button 
          type="button" 
          onClick={handleNextMonth} 
          disabled={isNextDisabled()} 
          aria-label="Next month"
        >
          &gt;
        </button>
      </header>

      <div className="calendar-grid">
        {DAYS_OF_WEEK.map((day, i) => (
          <div key={`header-${i}`} className="calendar-cell header-cell">{day}</div>
        ))}

        {calendarDays.map((dateObj, i) => {
          if (!dateObj) {
            return <div key={`empty-${i}`} className="calendar-cell empty" />;
          }
          
          const dateKey = formatDateKey(dateObj);
          const isToday = dateKey === todayKey;
          const checkIn = getMoodForDate(dateKey);
          const moodDef = checkIn ? MOOD_OPTIONS.find(m => m.key === checkIn.mood) : null;
          
          const cellClasses = [
            'calendar-cell',
            'day-cell',
            isToday ? 'is-today' : '',
            checkIn ? 'has-checkin' : '',
            selectedDateKey === dateKey ? 'is-selected' : ''
          ].filter(Boolean).join(' ');

          return (
            <button
              key={dateKey}
              className={cellClasses}
              onClick={() => setSelectedDateKey(dateKey)}
              aria-label={`${dateObj.toLocaleDateString()} ${checkIn ? 'Check-in recorded' : 'No check-in'}`}
              aria-pressed={selectedDateKey === dateKey}
            >
              {checkIn && moodDef ? (
                <span className="calendar-emoji" aria-hidden="true">{moodDef.emoji}</span>
              ) : (
                <span className="calendar-date">{dateObj.getDate()}</span>
              )}
            </button>
          );
        })}
      </div>
      
      {getSelectedDayDetails()}
    </section>
  );
};

export default MoodCalendar;
