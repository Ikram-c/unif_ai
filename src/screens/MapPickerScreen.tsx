import React, { useState } from 'react';
import { Search, Menu, ArrowLeft } from 'lucide-react';
import { OsmMap } from '../components/OsmMap';
import { PrimaryButton, SrScaffold } from '../components/Common';
import { GeoPosition, Place } from '../types';
import { rescueRepository } from '../data/RescueRepository';

interface MapPickerScreenProps {
  initialPin: GeoPosition | null;
  onConfirm: (pin: GeoPosition, label: string) => void;
  onBack: () => void;
}

export const MapPickerScreen: React.FC<MapPickerScreenProps> = ({
  initialPin,
  onConfirm,
  onBack,
}) => {
  const defaultCenter = initialPin || rescueRepository.demoDataset.defaultPin;
  const [pin, setPin] = useState<GeoPosition | null>(initialPin || defaultCenter);
  const [label, setLabel] = useState<string>('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.trim().length > 1) {
      const places = await rescueRepository.geocode(text);
      setResults(places);
    } else {
      setResults([]);
    }
  };

  const handleSelectPlace = (place: Place) => {
    setPin(place.position);
    setLabel(place.name);
    setQuery(place.name);
    setResults([]);
  };

  const handleMapPinChange = (newPos: GeoPosition) => {
    setPin(newPos);
    setLabel('');
  };

  return (
    <SrScaffold
      topBar={
        <div className="w-full flex items-center justify-between px-3 py-2 bg-[#5B5B5B] border-b border-white/10 z-20 relative">
          <button
            type="button"
            onClick={onBack}
            className="text-white hover:text-[#D9D9D9] flex items-center gap-1.5 text-sm font-semibold"
          >
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
          <span className="text-white text-xs font-mono">Map Location Picker</span>
        </div>
      }
    >
      <div className="relative flex-1 w-full h-full overflow-hidden flex flex-col">
        {/* Full-bleed Map */}
        <div className="absolute inset-0">
          <OsmMap
            center={pin || defaultCenter}
            zoom={pin ? 12 : 9}
            pin={pin}
            pinLabel={label || (pin ? `${pin.lat.toFixed(4)}, ${pin.lon.toFixed(4)}` : undefined)}
            onPinChange={handleMapPinChange}
            isPicker={true}
          />
        </div>

        {/* Floating Search Bar */}
        <div className="relative z-[500] w-full max-w-md mx-auto p-3">
          <div className="flex items-center bg-[#E6DEF5] rounded-2xl px-3.5 py-2.5 shadow-xl text-[#141414]">
            <Menu size={22} className="text-[#141414] shrink-0 mr-2.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search Map (e.g. Pumlumon Fawr, Elan Valley...)"
              className="w-full bg-transparent border-0 outline-none text-[#141414] placeholder-[#141414]/60 text-sm font-medium"
            />
            <button
              type="button"
              onClick={() => handleSearch(query)}
              className="shrink-0 p-1 hover:opacity-75"
            >
              <Search size={20} className="text-[#141414]" />
            </button>
          </div>

          {/* Autocomplete Dropdown */}
          {results.length > 0 && (
            <div className="mt-2 bg-[#2B2B2B] rounded-xl shadow-2xl overflow-hidden border border-white/10 divide-y divide-white/5">
              {results.map((place, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectPlace(place)}
                  className="px-4 py-2.5 hover:bg-[#383838] cursor-pointer transition-colors"
                >
                  <p className="text-white text-sm font-medium">{place.name}</p>
                  {place.region && (
                    <p className="text-xs text-[#D9D9D9]/70">{place.region}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Pin Status & Confirm Button */}
        <div className="mt-auto relative z-[500] w-full max-w-md mx-auto p-4 flex flex-col gap-2">
          <div className="bg-[#2B2B2B]/95 backdrop-blur rounded-lg px-3 py-2 text-center text-xs text-white border border-white/10 shadow-lg">
            {pin ? (
              <span>
                Selected: <strong className="text-[#F2D06B]">{label || `${pin.lat.toFixed(5)}, ${pin.lon.toFixed(5)}`}</strong> (Tap map to change)
              </span>
            ) : (
              <span>Tap anywhere on the map to drop the pin</span>
            )}
          </div>
          <PrimaryButton
            text="confirm"
            disabled={!pin}
            onClick={() => {
              if (pin) onConfirm(pin, label);
            }}
          />
        </div>
      </div>
    </SrScaffold>
  );
};
