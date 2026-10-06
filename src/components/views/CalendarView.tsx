import React, { useState } from 'react';
import { db } from '../../services/db';
import { authService } from '../../services/authService';
import { Calendar as CalendarIcon, Clock, CheckCircle2, IndianRupee, ArrowRight, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

interface CalendarViewProps {
  onSelectCampaign: (id: string) => void;
  selectedAdminInfluencerId?: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  onSelectCampaign,
  selectedAdminInfluencerId = 'all',
}) => {
  const isAdmin = authService.isAdmin();
  const activeInfluencer = authService.getActiveInfluencer();

  let campaigns = db.getCampaigns();

  // Enforce role isolation
  if (!isAdmin && activeInfluencer) {
    campaigns = campaigns.filter(c => c.influencerId === activeInfluencer.id);
  } else if (isAdmin && selectedAdminInfluencerId !== 'all') {
    campaigns = campaigns.filter(c => c.influencerId === selectedAdminInfluencerId);
  }

  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(7); // 0-indexed: 7 = August
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ dateStr: string; events: any[] } | null>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Map campaign dates to events
  const allEvents = campaigns.flatMap(c => {
    const evs = [];
    if (c.dealLockedDate) {
      evs.push({
        date: c.dealLockedDate,
        title: `Deal Locked: ${c.campaignName}`,
        brand: c.brandName,
        type: 'LOCKED',
        campaignId: c.id,
        amount: c.dealAmount
      });
    }
    if (c.liveDate) {
      evs.push({
        date: c.liveDate,
        title: `Live Date: ${c.campaignName}`,
        brand: c.brandName,
        type: 'LIVE',
        campaignId: c.id,
        amount: c.dealAmount
      });
    }
    if (c.calculatedDueDate) {
      evs.push({
        date: c.calculatedDueDate,
        title: `Payment Due: ₹${c.dealAmount.toLocaleString('en-IN')}`,
        brand: c.brandName,
        type: 'DUE',
        campaignId: c.id,
        amount: c.dealAmount
      });
    }
    return evs;
  });

  // Calculate calendar grid days for selected month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getEventsForDay = (day: number) => {
    const monthStr = (currentMonth + 1).toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    const targetDate = `${currentYear}-${monthStr}-${dayStr}`;
    return allEvents.filter(e => e.date === targetDate);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-cyan-400" /> Interactive Campaign & Payment Calendar
          </h2>
          <p className="text-xs text-slate-400">
            {isAdmin
              ? 'Global schedule of deal locks, video live dates, draft deadlines & payment due dates.'
              : 'Your personal campaign timetable, live dates & payment due dates.'}
          </p>
        </div>

        {/* Month Navigation Controls */}
        <div className="flex items-center space-x-3 bg-tech-card border border-tech-border p-1.5 rounded-xl text-xs">
          <button
            onClick={handlePrevMonth}
            className="p-1 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-slate-200 min-w-[110px] text-center font-mono">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid Calendar */}
      <div className="bg-tech-card border border-tech-border rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px] font-bold text-slate-400 border-b border-tech-border pb-2">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Calendar Grid Cells */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {/* Empty padding slots before day 1 */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="h-20 sm:h-24 bg-[#090d14]/40 rounded-xl border border-transparent" />
          ))}

          {/* Days 1 to daysInMonth */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dayEvents = getEventsForDay(dayNum);
            const monthStr = (currentMonth + 1).toString().padStart(2, '0');
            const dayStr = dayNum.toString().padStart(2, '0');
            const dateStr = `${currentYear}-${monthStr}-${dayStr}`;

            return (
              <div
                key={dayNum}
                onClick={() => {
                  if (dayEvents.length > 0) {
                    setSelectedDayEvents({ dateStr, events: dayEvents });
                  }
                }}
                className={`h-20 sm:h-24 p-1.5 sm:p-2 rounded-xl border flex flex-col justify-between transition-all ${
                  dayEvents.length > 0
                    ? 'bg-[#0b0f17] border-cyan-500/40 hover:border-cyan-400 cursor-pointer shadow-md'
                    : 'bg-[#0b0f17]/80 border-tech-border text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold font-mono">
                  <span className={dayEvents.length > 0 ? 'text-cyan-400' : 'text-slate-400'}>{dayNum}</span>
                  {dayEvents.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  )}
                </div>

                {/* Badges preview */}
                <div className="space-y-1 overflow-hidden">
                  {dayEvents.slice(0, 2).map((ev, idx) => (
                    <div
                      key={idx}
                      className={`text-[9px] font-semibold px-1 py-0.5 rounded truncate font-mono ${
                        ev.type === 'LIVE'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : ev.type === 'DUE'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      {ev.brand}: {ev.type}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <span className="text-[9px] text-cyan-400 font-mono block text-center font-bold">
                      +{dayEvents.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Event Drawer Modal */}
      {selectedDayEvents && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-tech-card border border-tech-border rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-tech-border pb-3">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-cyan-400" /> Events for {selectedDayEvents.dateStr}
              </h3>
              <button
                onClick={() => setSelectedDayEvents(null)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 bg-slate-800 rounded-lg"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto">
              {selectedDayEvents.events.map((ev, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedDayEvents(null);
                    onSelectCampaign(ev.campaignId);
                  }}
                  className="p-3 bg-[#0b0f17] border border-tech-border hover:border-cyan-400 rounded-xl cursor-pointer flex items-center justify-between transition-all group"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                          ev.type === 'LIVE'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : ev.type === 'DUE'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-cyan-500/20 text-cyan-400'
                        }`}
                      >
                        {ev.type}
                      </span>
                      <span className="font-bold text-slate-200 text-xs group-hover:text-cyan-400 transition-colors">
                        {ev.brand}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{ev.title}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
