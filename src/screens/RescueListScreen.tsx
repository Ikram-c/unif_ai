import React, { useEffect, useState } from 'react';
import { ArrowLeft, Clock, Users, Database } from 'lucide-react';
import { SrScaffold } from '../components/Common';
import { SrColors } from '../components/Theme';
import { TimeFormat } from '../core/TimeFormat';
import { rescueRepository } from '../data/RescueRepository';
import { DataSourceAvailability, Rescue, RescueStatus } from '../types';

interface RescueListScreenProps {
  status: RescueStatus;
  onOpenRescue: (rescueId: string) => void;
  onBack: () => void;
}

export const RescueListScreen: React.FC<RescueListScreenProps> = ({
  status,
  onOpenRescue,
  onBack,
}) => {
  const [rescues, setRescues] = useState<Rescue[]>(rescueRepository.allRescues);

  useEffect(() => {
    return rescueRepository.subscribeRescues(setRescues);
  }, []);

  const filtered = rescues.filter((r) => r.status === status);
  const now = new Date();

  const title = status === 'COMPLETED' ? 'Completed Rescues' : 'Ongoing Rescues';

  return (
    <SrScaffold
      topBar={
        <div className="w-full flex items-center gap-3 px-4 py-3 bg-[#5B5B5B] border-b border-white/10 shrink-0">
          <button
            type="button"
            onClick={onBack}
            className="p-1 text-white hover:text-[#D9D9D9] transition-colors"
          >
            <ArrowLeft size={22} />
          </button>
          <h2 className="text-white text-lg font-bold">{title}</h2>
        </div>
      }
    >
      <div className="flex-1 overflow-y-auto p-4 max-w-xl mx-auto w-full">
        {filtered.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center text-[#D9D9D9]">
            <p className="text-base font-semibold">No {status.toLowerCase()} rescues found</p>
            <p className="text-xs text-white/50 mt-1">Start a new rescue to generate search plans</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((rescue) => {
              const lastSeen = TimeFormat.parseOrNull(rescue.last_seen_utc) || now;
              const elapsedMinutes = Math.max(
                0,
                Math.floor((now.getTime() - lastSeen.getTime()) / 60000)
              );
              const plan = rescue.plan;

              return (
                <div
                  key={rescue.id}
                  onClick={() => onOpenRescue(rescue.id)}
                  className="bg-[#383838] rounded-xl p-4 shadow-md hover:bg-[#404040] cursor-pointer transition-all border border-white/5 active:scale-[0.99] flex flex-col gap-2"
                >
                  {/* Status Indicator & Location */}
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          rescue.status === 'COMPLETED' ? SrColors.Signal : SrColors.Amber,
                      }}
                    />
                    <h3 className="text-white font-bold text-base truncate flex-1">
                      {rescue.location_label ||
                        `${rescue.last_known_location.lat.toFixed(4)}, ${rescue.last_known_location.lon.toFixed(4)}`}
                    </h3>
                  </div>

                  {/* Metadata line */}
                  <p className="text-xs text-[#D9D9D9] flex flex-wrap items-center gap-x-2">
                    {rescue.subject.name && (
                      <span className="font-semibold text-white">{rescue.subject.name}</span>
                    )}
                    <span>·</span>
                    <span className="capitalize">
                      {rescue.travel_mode.toLowerCase().replace('_', ' ')}
                    </span>
                    <span>·</span>
                    <span>
                      last seen{' '}
                      {TimeFormat.human(lastSeen, rescue.time_zone)}
                    </span>
                  </p>

                  {/* Operational status details */}
                  <div className="pt-1 border-t border-white/10 flex items-center justify-between text-xs text-[#E6DEF5]">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-[#E6DEF5]" />
                      <span>{TimeFormat.elapsed(elapsedMinutes)} elapsed</span>
                    </div>

                    {plan ? (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Users size={14} />
                          <span>{plan.team.searchers} searchers</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Database size={14} />
                          <span>{plan.data_sources.filter((s: DataSourceAvailability) => s.available).length} sources</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-white/60 italic">Model not run yet</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SrScaffold>
  );
};
