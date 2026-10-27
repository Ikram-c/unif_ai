import React, { useState } from 'react';
import { Clock, Calendar as CalendarIcon, Globe } from 'lucide-react';
import { AberTechHeader, PrimaryButton, SrScaffold } from '../components/Common';
import { SearchWindowCalculator, TimeFormat } from '../core/TimeFormat';

interface LastSeenScreenProps {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  timeZone: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onTimeZoneChange: (tz: string) => void;
  onConfirm: () => void;
  onBack: () => void;
}

export const LastSeenScreen: React.FC<LastSeenScreenProps> = ({
  date,
  time,
  timeZone,
  onDateChange,
  onTimeChange,
  onTimeZoneChange,
  onConfirm,
  onBack,
}) => {
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [modalHour, setModalHour] = useState(parseInt(time.split(':')[0] || '12', 10));
  const [modalMinute, setModalMinute] = useState(parseInt(time.split(':')[1] || '00', 10));

  const timeZones = ['UTC', 'Europe/London', 'Local'];

  const cycleTimeZone = () => {
    const currentIndex = timeZones.indexOf(timeZone);
    const nextIndex = (currentIndex + 1) % timeZones.length;
    onTimeZoneChange(timeZones[nextIndex]);
  };

  // Compute selected Date
  const [year, month, day] = date.split('-').map((v) => parseInt(v, 10));
  const [hour, minute] = time.split(':').map((v) => parseInt(v, 10));
  const selectedDate = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const now = new Date();

  const isFuture = SearchWindowCalculator.isInFuture(selectedDate, now);
  const elapsedMinutes = SearchWindowCalculator.elapsedMinutes(selectedDate, now);

  const handleSetTime = () => {
    const formatted = `${String(modalHour).padStart(2, '0')}:${String(modalMinute).padStart(2, '0')}`;
    onTimeChange(formatted);
    setShowTimeModal(false);
  };

  return (
    <SrScaffold
      topBar={
        <div className="w-full flex items-center justify-between px-4 py-3 bg-[#5B5B5B] border-b border-white/10">
          <button
            type="button"
            onClick={onBack}
            className="text-white text-sm font-medium hover:underline flex items-center gap-1"
          >
            ← Back
          </button>
          <span className="text-white text-xs opacity-75 font-mono">Step 3 of 4</span>
        </div>
      }
    >
      <div className="flex-1 flex flex-col items-center px-4 py-4 max-w-md mx-auto w-full">
        <AberTechHeader />
        <h2 className="text-white text-xl font-bold tracking-wide mt-2 mb-4">
          Last Seen Date/Time
        </h2>

        {/* Big Digital Clock Card */}
        <div
          onClick={() => {
            setModalHour(parseInt(time.split(':')[0] || '12', 10));
            setModalMinute(parseInt(time.split(':')[1] || '00', 10));
            setShowTimeModal(true);
          }}
          className="w-full bg-[#383838] rounded-xl py-4 flex flex-col items-center justify-center cursor-pointer shadow-md hover:bg-[#404040] transition-colors"
          title="Click to change time"
        >
          <div className="bg-[#D9D9D9] text-[#141414] font-bold text-5xl sm:text-6xl px-6 py-1.5 rounded-lg font-mono tracking-tight shadow">
            {time}
          </div>
          <span className="text-xs text-[#D9D9D9]/70 mt-2 flex items-center gap-1">
            <Clock size={12} /> Tap to set time
          </span>
        </div>

        <div className="h-4" />

        {/* Date Selector Card */}
        <div className="w-full bg-[#383838] rounded-xl p-4 shadow-md flex flex-col items-center">
          <div className="flex items-center gap-2 text-white font-medium text-sm mb-3">
            <CalendarIcon size={16} className="text-[#E6DEF5]" />
            <span>Select Date</span>
          </div>
          <input
            type="date"
            value={date}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => onDateChange(e.target.value)}
            className="bg-[#2B2B2B] text-white font-semibold text-lg px-4 py-2 rounded-lg border border-white/20 outline-none cursor-pointer focus:border-[#6B5AA6] transition-colors"
          />
        </div>

        <div className="h-4" />

        {/* Time-Zone Selector Card */}
        <div className="w-full flex flex-col items-center">
          <span className="text-white text-sm font-semibold mb-2 flex items-center gap-1.5">
            <Globe size={15} className="text-[#8ED0FF]" />
            Time-Zone
          </span>
          <button
            type="button"
            onClick={cycleTimeZone}
            className="bg-[#D9D9D9] text-[#141414] font-bold text-2xl px-6 py-2 rounded-xl shadow-md hover:brightness-105 active:scale-95 transition-all"
            title="Click to cycle time zone"
          >
            {timeZone}
          </button>
        </div>

        <div className="h-4" />

        {/* Elapsed / Future Warning */}
        <div className="text-center min-h-[30px] flex items-center justify-center">
          {isFuture ? (
            <p className="text-[#E5484D] text-xs font-semibold">
              That moment is in the future; pick an earlier time
            </p>
          ) : (
            <p className="text-[#D9D9D9] text-xs">
              Search window so far:{' '}
              <strong className="text-[#E6DEF5] font-semibold">
                {TimeFormat.elapsed(elapsedMinutes)}
              </strong>
            </p>
          )}
        </div>

        <div className="w-full mt-4 pb-4">
          <PrimaryButton text="confirm" disabled={isFuture} onClick={onConfirm} />
        </div>

        {/* Time Picker Modal */}
        {showTimeModal && (
          <div className="fixed inset-0 z-[1000] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#2B2B2B] border border-white/20 rounded-2xl p-6 max-w-xs w-full shadow-2xl flex flex-col items-center">
              <h3 className="text-white font-bold text-lg mb-4">Set Last Seen Time</h3>
              <div className="flex items-center gap-2 my-2">
                {/* Hours */}
                <div className="flex flex-col items-center">
                  <span className="text-xs text-[#D9D9D9] mb-1">Hour</span>
                  <select
                    value={modalHour}
                    onChange={(e) => setModalHour(parseInt(e.target.value, 10))}
                    className="bg-[#383838] text-white font-mono font-bold text-2xl px-3 py-2 rounded-lg border border-white/20"
                  >
                    {Array.from({ length: 24 }).map((_, i) => (
                      <option key={i} value={i}>
                        {String(i).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="text-white font-bold text-2xl mt-4">:</span>
                {/* Minutes */}
                <div className="flex flex-col items-center">
                  <span className="text-xs text-[#D9D9D9] mb-1">Minute</span>
                  <select
                    value={modalMinute}
                    onChange={(e) => setModalMinute(parseInt(e.target.value, 10))}
                    className="bg-[#383838] text-white font-mono font-bold text-2xl px-3 py-2 rounded-lg border border-white/20"
                  >
                    {Array.from({ length: 60 }).map((_, i) => (
                      <option key={i} value={i}>
                        {String(i).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full mt-6">
                <button
                  type="button"
                  onClick={() => setShowTimeModal(false)}
                  className="flex-1 py-2.5 rounded-lg bg-[#383838] text-white text-sm font-medium hover:bg-[#454545]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSetTime}
                  className="flex-1 py-2.5 rounded-lg bg-[#6B5AA6] text-white text-sm font-bold hover:bg-[#7B6AB6]"
                >
                  Set Time
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SrScaffold>
  );
};
