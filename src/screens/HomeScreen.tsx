import React, { useEffect, useState } from 'react';
import { Plus, CheckCheck, Settings as SettingsIcon } from 'lucide-react';
import { CircleButton, LabelChip, LoadingRing, SrScaffold } from '../components/Common';
import { rescueRepository } from '../data/RescueRepository';
import { Rescue } from '../types';

interface HomeScreenProps {
  onNewRescue: () => void;
  onOngoing: () => void;
  onCompleted: () => void;
  onSettings: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNewRescue,
  onOngoing,
  onCompleted,
  onSettings,
}) => {
  const [rescues, setRescues] = useState<Rescue[]>(rescueRepository.allRescues);

  useEffect(() => {
    return rescueRepository.subscribeRescues(setRescues);
  }, []);

  const ongoingCount = rescues.filter((r) => r.status === 'ONGOING').length;
  const completedCount = rescues.filter((r) => r.status === 'COMPLETED').length;

  return (
    <SrScaffold>
      <div className="flex-1 flex flex-col items-center justify-evenly px-4 py-8 max-w-xl mx-auto w-full">
        {/* Top Row: New Rescue & Ongoing Rescues */}
        <div className="w-full flex justify-around items-center">
          <div className="flex flex-col items-center">
            <CircleButton size={144} onClick={onNewRescue}>
              <Plus size={64} className="text-[#D9D9D9]" strokeWidth={2.5} />
            </CircleButton>
            <div className="h-6" />
            <LabelChip text="New Rescue" />
          </div>

          <div className="flex flex-col items-center relative">
            <CircleButton size={144} onClick={onOngoing}>
              <div className="relative flex items-center justify-center">
                <LoadingRing size={68} strokeWidth={8} spinning={false} />
                {ongoingCount > 0 && (
                  <span className="absolute text-sm font-bold text-white bg-[#6B5AA6] rounded-full w-6 h-6 flex items-center justify-center">
                    {ongoingCount}
                  </span>
                )}
              </div>
            </CircleButton>
            <div className="h-6" />
            <LabelChip text="Ongoing Rescues" />
          </div>
        </div>

        {/* Bottom Row: Completed Rescues & Settings */}
        <div className="w-full flex justify-around items-center">
          <div className="flex flex-col items-center">
            <CircleButton size={144} onClick={onCompleted}>
              <div className="relative flex items-center justify-center">
                <CheckCheck size={64} className="text-[#D9D9D9]" strokeWidth={2.2} />
                {completedCount > 0 && (
                  <span className="absolute -top-1 -right-1 text-xs font-bold text-white bg-[#34C759] rounded-full px-1.5 py-0.5">
                    {completedCount}
                  </span>
                )}
              </div>
            </CircleButton>
            <div className="h-6" />
            <LabelChip text="Completed Rescues" />
          </div>

          <div className="flex flex-col items-center">
            <CircleButton size={144} onClick={onSettings}>
              <SettingsIcon size={60} className="text-[#D9D9D9]" strokeWidth={2.2} />
            </CircleButton>
            <div className="h-6" />
            <LabelChip text="Settings" />
          </div>
        </div>
      </div>
    </SrScaffold>
  );
};
