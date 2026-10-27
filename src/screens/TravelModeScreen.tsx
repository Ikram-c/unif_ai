import React from 'react';
import { ArrowLeft, ArrowRight, HelpCircle } from 'lucide-react';
import { CircleButton, LabelChip, PrimaryButton, SrIcons, SrScaffold } from '../components/Common';
import { TravelMode } from '../types';

interface TravelModeScreenProps {
  mode: TravelMode;
  onChangeMode: (mode: TravelMode) => void;
  onConfirm: () => void;
  onBack: () => void;
}

export const TravelModeScreen: React.FC<TravelModeScreenProps> = ({
  mode,
  onChangeMode,
  onConfirm,
  onBack,
}) => {
  const modes: TravelMode[] = ['ON_FOOT', 'VEHICLE', 'UNKNOWN'];

  const cycleMode = (step: number) => {
    const currentIndex = modes.indexOf(mode);
    const nextIndex = (currentIndex + step + modes.length) % modes.length;
    onChangeMode(modes[nextIndex]);
  };

  const glowColor =
    mode === 'ON_FOOT'
      ? '#F2D06B'
      : mode === 'VEHICLE'
      ? '#D9D9D9'
      : '#8ED0FF';

  const modeLabel =
    mode === 'ON_FOOT'
      ? 'On Foot'
      : mode === 'VEHICLE'
      ? 'Vehicle'
      : 'Unknown';

  const modeHint =
    mode === 'ON_FOOT'
      ? 'Walking displacement model, saturates over the first day'
      : mode === 'VEHICLE'
      ? "Road-reach model, capped at the vehicle's plausible range"
      : 'Blend of both models with wider uncertainty';

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
          <span className="text-white text-xs opacity-75 font-mono">Step 2 of 4</span>
        </div>
      }
    >
      <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-md mx-auto w-full">
        {/* Glowing card border container */}
        <div
          className="w-full bg-[#383838] rounded-2xl p-6 flex flex-col items-center justify-between shadow-2xl transition-all duration-300"
          style={{
            border: `3px solid ${glowColor}`,
            boxShadow: `0 0 25px ${glowColor}33`,
          }}
        >
          <div className="flex flex-col items-center w-full">
            {/* Center Mode Icon */}
            <div className="w-48 h-48 rounded-full bg-[#141414] p-1.5 flex items-center justify-center shadow-inner">
              <div className="w-full h-full rounded-full bg-[#5B5B5B] flex items-center justify-center">
                {mode === 'ON_FOOT' && (
                  <SrIcons.Footprints className="w-28 h-28" color="#141414" />
                )}
                {mode === 'VEHICLE' && (
                  <SrIcons.Car className="w-32 h-32" color="#141414" />
                )}
                {mode === 'UNKNOWN' && (
                  <HelpCircle size={108} className="text-[#141414]" strokeWidth={2} />
                )}
              </div>
            </div>

            <div className="h-6" />
            <LabelChip text={modeLabel} />
            <div className="h-6" />

            {/* Carousel navigation arrows */}
            <div className="flex items-center gap-6">
              <CircleButton
                size={76}
                onClick={() => cycleMode(-1)}
                background="#383838"
                className="border-2 border-[#141414]"
              >
                <ArrowLeft size={36} className="text-white" strokeWidth={2.5} />
              </CircleButton>
              <CircleButton
                size={76}
                onClick={() => cycleMode(1)}
                background="#383838"
                className="border-2 border-[#141414]"
              >
                <ArrowRight size={36} className="text-white" strokeWidth={2.5} />
              </CircleButton>
            </div>

            <div className="h-4" />
            <p className="text-xs text-[#D9D9D9] text-center px-4 min-h-[36px]">
              {modeHint}
            </p>
          </div>

          <div className="w-full mt-6">
            <PrimaryButton text="confirm" onClick={onConfirm} />
          </div>
        </div>
      </div>
    </SrScaffold>
  );
};
