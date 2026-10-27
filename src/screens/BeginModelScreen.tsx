import React, { useState } from 'react';
import { Plus, X, User } from 'lucide-react';
import {
  AberTechHeader,
  CircleButton,
  LoadingRing,
  PrimaryButton,
  SrIcons,
  SrScaffold,
} from '../components/Common';
import { Experience, Fitness, GeoPosition, SubjectProfile, TravelMode } from '../types';

interface BeginModelScreenProps {
  pin: GeoPosition;
  locationLabel: string;
  travelMode: TravelMode;
  lastSeenTime: string;
  timeZone: string;
  subject: SubjectProfile;
  running: boolean;
  progress: string;
  error?: string | null;
  onUpdateSubject: (subject: SubjectProfile) => void;
  onBeginModel: () => void;
  onBack: () => void;
}

export const BeginModelScreen: React.FC<BeginModelScreenProps> = ({
  pin,
  locationLabel,
  travelMode,
  lastSeenTime,
  timeZone,
  subject,
  running,
  progress,
  error,
  onUpdateSubject,
  onBeginModel,
  onBack,
}) => {
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [draftSubject, setDraftSubject] = useState<SubjectProfile>(subject);

  const fitnessOptions: Fitness[] = ['LOW', 'MEDIUM', 'HIGH'];
  const experienceOptions: Experience[] = ['NOVICE', 'INTERMEDIATE', 'EXPERT'];

  const subjectSummary = () => {
    const parts: string[] = [];
    if (subject.name.trim()) parts.push(subject.name.trim());
    if (subject.age != null) parts.push(`age ${subject.age}`);
    parts.push(`fitness ${subject.fitness.toLowerCase()}`);
    parts.push(`${subject.experience.toLowerCase()} experience`);
    return parts.join(', ');
  };

  const handleSaveSubject = () => {
    onUpdateSubject(draftSubject);
    setShowSubjectModal(false);
  };

  return (
    <SrScaffold
      topBar={
        <div className="w-full flex items-center justify-between px-4 py-3 bg-[#5B5B5B] border-b border-white/10">
          <button
            type="button"
            onClick={onBack}
            disabled={running}
            className="text-white text-sm font-medium hover:underline flex items-center gap-1 disabled:opacity-50"
          >
            ← Back
          </button>
          <span className="text-white text-xs opacity-75 font-mono">Step 4 of 4</span>
        </div>
      }
    >
      <div className="flex-1 flex flex-col items-center px-4 py-4 max-w-md mx-auto w-full text-center">
        <AberTechHeader />
        <h2 className="text-white text-2xl font-bold tracking-wide mt-2 mb-6">
          Begin AI Model
        </h2>

        {/* Big Mountain Circle Button */}
        <div className="relative flex items-center justify-center my-2">
          {running && (
            <div className="absolute -inset-2.5 z-10 flex items-center justify-center pointer-events-none">
              <LoadingRing size={204} strokeWidth={9} spinning={true} />
            </div>
          )}
          <CircleButton
            size={184}
            onClick={onBeginModel}
            disabled={running}
            background="#383838"
            className="border-4 border-[#2B2B2B]"
          >
            <div className="w-36 h-36 rounded-full bg-[#5B5B5B] flex items-center justify-center">
              <SrIcons.Mountain className="w-32 h-32" color="#FFFFFF" />
            </div>
          </CircleButton>
        </div>

        {/* Progress / Status feedback */}
        <div className="min-h-[40px] flex items-center justify-center my-3 px-2">
          {running ? (
            <p className="text-sm text-[#E6DEF5] font-semibold animate-pulse">{progress}</p>
          ) : error ? (
            <p className="text-xs text-[#E5484D] font-bold">{error}</p>
          ) : (
            <p className="text-xs text-[#D9D9D9]">
              Pin at {locationLabel || `${pin.lat.toFixed(4)}, ${pin.lon.toFixed(4)}`} ·{' '}
              {travelMode.toLowerCase().replace('_', ' ')} · last seen {lastSeenTime} {timeZone}
            </p>
          )}
        </div>

        <div className="h-6" />

        {/* Add Additional User Info Section */}
        <div className="w-full flex flex-col items-center">
          <h3 className="text-white font-bold text-base mb-3">Add Additional User info</h3>
          <CircleButton
            size={96}
            onClick={() => {
              setDraftSubject(subject);
              setShowSubjectModal(true);
            }}
            background="#5B5B5B"
            className="border-2 border-white/20"
          >
            <Plus size={48} className="text-[#D9D9D9]" strokeWidth={2} />
          </CircleButton>
          <div className="h-2.5" />
          <p className="text-xs text-[#D9D9D9] max-w-xs">{subjectSummary()}</p>
        </div>

        {/* Subject Profile Modal Sheet */}
        {showSubjectModal && (
          <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-[#383838] border border-white/20 rounded-t-2xl sm:rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-5 shadow-2xl flex flex-col gap-4 text-left">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <User size={20} className="text-[#E6DEF5]" />
                  <h3 className="text-white font-bold text-lg">Missing Person Profile</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="text-[#D9D9D9] hover:text-white p-1"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-xs text-[#D9D9D9]">
                These characteristics weight the wander model now and feed the causal / A*
                model later.
              </p>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-[#D9D9D9] mb-1">
                  Name or description
                </label>
                <input
                  type="text"
                  value={draftSubject.name}
                  onChange={(e) => setDraftSubject({ ...draftSubject, name: e.target.value })}
                  placeholder="e.g. John Evans, walker"
                  className="w-full bg-[#2B2B2B] text-white px-3 py-2 rounded-lg border border-white/20 text-sm outline-none focus:border-[#6B5AA6]"
                />
              </div>

              {/* Age */}
              <div>
                <label className="block text-xs font-semibold text-[#D9D9D9] mb-1">Age</label>
                <input
                  type="number"
                  value={draftSubject.age ?? ''}
                  onChange={(e) =>
                    setDraftSubject({
                      ...draftSubject,
                      age: e.target.value ? parseInt(e.target.value, 10) : null,
                    })
                  }
                  placeholder="e.g. 35"
                  className="w-full bg-[#2B2B2B] text-white px-3 py-2 rounded-lg border border-white/20 text-sm outline-none focus:border-[#6B5AA6]"
                />
              </div>

              {/* Fitness */}
              <div>
                <label className="block text-xs font-semibold text-[#D9D9D9] mb-1.5">
                  Fitness
                </label>
                <div className="flex gap-2">
                  {fitnessOptions.map((fit) => (
                    <button
                      key={fit}
                      type="button"
                      onClick={() => setDraftSubject({ ...draftSubject, fitness: fit })}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        draftSubject.fitness === fit
                          ? 'bg-[#6B5AA6] text-white border-[#E6DEF5]'
                          : 'bg-[#2B2B2B] text-[#D9D9D9] border-white/10 hover:bg-[#323232]'
                      }`}
                    >
                      {fit.charAt(0) + fit.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Experience */}
              <div>
                <label className="block text-xs font-semibold text-[#D9D9D9] mb-1.5">
                  Outdoor Experience
                </label>
                <div className="flex gap-2">
                  {experienceOptions.map((exp) => (
                    <button
                      key={exp}
                      type="button"
                      onClick={() => setDraftSubject({ ...draftSubject, experience: exp })}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        draftSubject.experience === exp
                          ? 'bg-[#6B5AA6] text-white border-[#E6DEF5]'
                          : 'bg-[#2B2B2B] text-[#D9D9D9] border-white/10 hover:bg-[#323232]'
                      }`}
                    >
                      {exp.charAt(0) + exp.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clothing */}
              <div>
                <label className="block text-xs font-semibold text-[#D9D9D9] mb-1">
                  Clothing / vehicle appearance
                </label>
                <input
                  type="text"
                  value={draftSubject.clothing}
                  onChange={(e) =>
                    setDraftSubject({ ...draftSubject, clothing: e.target.value })
                  }
                  placeholder="e.g. Red waterproof jacket, blue backpack"
                  className="w-full bg-[#2B2B2B] text-white px-3 py-2 rounded-lg border border-white/20 text-sm outline-none focus:border-[#6B5AA6]"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-[#D9D9D9] mb-1">
                  Additional notes
                </label>
                <textarea
                  rows={2}
                  value={draftSubject.notes}
                  onChange={(e) => setDraftSubject({ ...draftSubject, notes: e.target.value })}
                  placeholder="Medical conditions, known route, car registration..."
                  className="w-full bg-[#2B2B2B] text-white px-3 py-2 rounded-lg border border-white/20 text-sm outline-none focus:border-[#6B5AA6]"
                />
              </div>

              <div className="mt-2">
                <PrimaryButton text="done" onClick={handleSaveSubject} />
              </div>
            </div>
          </div>
        )}
      </div>
    </SrScaffold>
  );
};
