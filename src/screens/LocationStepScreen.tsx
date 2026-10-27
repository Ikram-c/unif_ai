import React from 'react';
import { MapPin } from 'lucide-react';
import { CircleButton, LabelChip, PrimaryButton, SrScaffold } from '../components/Common';
import { GeoPosition } from '../types';

interface LocationStepScreenProps {
  pin: GeoPosition | null;
  locationLabel: string;
  onOpenMap: () => void;
  onConfirm: () => void;
  onBack: () => void;
}

export const LocationStepScreen: React.FC<LocationStepScreenProps> = ({
  pin,
  locationLabel,
  onOpenMap,
  onConfirm,
  onBack,
}) => {
  return (
    <SrScaffold
      topBar={
        <div className="w-full flex items-center justify-between px-4 py-3 bg-[#5B5B5B] border-b border-white/10">
          <button
            type="button"
            onClick={onBack}
            className="text-white text-sm font-medium hover:underline flex items-center gap-1"
          >
            ← Back to Home
          </button>
          <span className="text-white text-xs opacity-75 font-mono">Step 1 of 4</span>
        </div>
      }
    >
      <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-md mx-auto w-full text-center">
        <CircleButton size={170} onClick={onOpenMap}>
          <MapPin size={96} className="text-[#D9D9D9]" strokeWidth={1.8} />
        </CircleButton>

        <div className="h-9" />
        <LabelChip text="Last Known Location" />
        <div className="h-5" />

        {pin ? (
          <div className="flex flex-col items-center w-full">
            <p className="text-[#D9D9D9] text-sm font-medium mb-1">
              {locationLabel || `${pin.lat.toFixed(5)}, ${pin.lon.toFixed(5)}`}
            </p>
            <p className="text-xs text-white/60 mb-6">Tap the pin again to adjust location</p>
            <PrimaryButton text="confirm" onClick={onConfirm} />
          </div>
        ) : (
          <div className="flex flex-col items-center w-full">
            <p className="text-[#D9D9D9] text-sm mb-6">
              Tap the pin to open the map and drop the last known location
            </p>
            <PrimaryButton text="open map" onClick={onOpenMap} />
          </div>
        )}
      </div>
    </SrScaffold>
  );
};
