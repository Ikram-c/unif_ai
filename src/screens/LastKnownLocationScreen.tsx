import React, { useState } from 'react';
import { Search, MapPin, ArrowLeft, ArrowRight, Crosshair } from 'lucide-react';
import { Card, PrimaryButton, SecondaryButton, StepHeader } from '../components/Common';
import { OsmMap } from '../components/OsmMap';
import { GeoPosition, Place } from '../types';
import { rescueRepository } from '../data/RescueRepository';

interface LastKnownLocationScreenProps {
  initialPin: GeoPosition;
  initialLabel: string;
  initialUncertainty: number;
  missionRef: string;
  onBack: () => void;
  onNext: (pin: GeoPosition, label: string, uncertainty: number) => void;
}

export const LastKnownLocationScreen: React.FC<LastKnownLocationScreenProps> = ({
  initialPin,
  initialLabel,
  initialUncertainty,
  missionRef,
  onBack,
  onNext,
}) => {
  const [pin, setPin] = useState<GeoPosition>(initialPin);
  const [label, setLabel] = useState(initialLabel || 'Storey Arms, Bannau Brycheiniog');
  const [uncertainty, setUncertainty] = useState(initialUncertainty || 100);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Place[]>([]);

  const handleSearchChange = async (q: string) => {
    setSearchQuery(q);
    if (q.trim().length >= 2) {
      const results = await rescueRepository.geocode(q);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectPlace = (place: Place) => {
    setPin(place.position);
    setLabel(place.name);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleLatChange = (latVal: string) => {
    const lat = parseFloat(latVal);
    if (!isNaN(lat)) {
      setPin((prev) => ({ ...prev, lat }));
    }
  };

  const handleLonChange = (lonVal: string) => {
    const lon = parseFloat(lonVal);
    if (!isNaN(lon)) {
      setPin((prev) => ({ ...prev, lon }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(pin, label, uncertainty);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F4F6F5] overflow-y-auto">
      <StepHeader stepNumber="03 / 09" stepTitle="SETUP 2 OF 3" missionRef={missionRef} />

      <form onSubmit={handleSubmit} className="p-4 sm:p-6 max-w-4xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1C2E2A] tracking-tight">
            Last-known location (LKP)
          </h1>
          <p className="text-xs text-[#5A706A] mt-0.5">
            Step 2 of 3 · Set coordinate anchor point or witness report location
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form Inputs */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="space-y-4">
              {/* Gazetteer Search */}
              <div className="relative">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C2E2A] mb-1.5">
                  Gazetteer Search
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search Storey Arms, Pen y Fan..."
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-[#E2E8E5] text-sm text-[#1C2E2A] focus:outline-none focus:border-[#0B6758] bg-[#F4F6F5]"
                  />
                  <Search size={16} className="absolute left-3 top-3 text-[#5A706A]" />
                </div>

                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E2E8E5] rounded-lg shadow-lg z-50 overflow-hidden divide-y divide-[#E2E8E5]">
                    {searchResults.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPlace(p)}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-[#F4F6F5] flex items-center justify-between transition-colors text-xs"
                      >
                        <div>
                          <span className="font-semibold text-[#1C2E2A] block">{p.name}</span>
                          <span className="text-[11px] text-[#5A706A]">{p.region}</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#0B6758] bg-[#E1ECE8] px-1.5 py-0.5 rounded">
                          {p.position.lat.toFixed(3)}, {p.position.lon.toFixed(3)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Location Label */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C2E2A] mb-1.5">
                  Location Label
                </label>
                <input
                  type="text"
                  required
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Storey Arms car park trailhead"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8E5] text-sm text-[#1C2E2A] focus:outline-none focus:border-[#0B6758] bg-[#F4F6F5]"
                />
              </div>

              {/* Lat / Lon */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C2E2A] mb-1.5">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={pin.lat}
                    onChange={(e) => handleLatChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E2E8E5] text-xs font-mono text-[#1C2E2A] focus:outline-none focus:border-[#0B6758] bg-[#F4F6F5]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C2E2A] mb-1.5">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={pin.lon}
                    onChange={(e) => handleLonChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E2E8E5] text-xs font-mono text-[#1C2E2A] focus:outline-none focus:border-[#0B6758] bg-[#F4F6F5]"
                  />
                </div>
              </div>

              {/* Witness Uncertainty */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#1C2E2A]">
                    Reported Uncertainty
                  </label>
                  <span className="text-xs font-mono font-semibold text-[#0B6758] bg-[#E1ECE8] px-2 py-0.5 rounded">
                    ±{uncertainty} m
                  </span>
                </div>
                <input
                  type="range"
                  min="25"
                  max="1000"
                  step="25"
                  value={uncertainty}
                  onChange={(e) => setUncertainty(parseInt(e.target.value, 10))}
                  className="w-full accent-[#0B6758]"
                />
                <span className="text-[11px] text-[#5A706A] mt-1 block">
                  Reported witness point precision (e.g. car park vs vague ridge sighting)
                </span>
              </div>
            </Card>
          </div>

          {/* Right Column: Interactive Map Preview */}
          <div className="lg:col-span-7 flex flex-col">
            <Card className="flex-1 flex flex-col p-3 min-h-[340px]">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1C2E2A] flex items-center gap-1.5">
                  <Crosshair size={14} className="text-[#0B6758]" />
                  <span>Interactive Map Anchor (Drag pin to adjust)</span>
                </span>
                <span className="text-[11px] font-mono text-[#5A706A]">
                  {pin.lat.toFixed(4)}° N, {Math.abs(pin.lon).toFixed(4)}° W
                </span>
              </div>
              <div className="flex-1 min-h-[300px]">
                <OsmMap
                  center={pin}
                  zoom={13}
                  pin={pin}
                  pinLabel={label}
                  isPicker={true}
                  onPinChange={(pos) => setPin(pos)}
                  showLegend={false}
                  className="h-full min-h-[300px]"
                />
              </div>
            </Card>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <SecondaryButton onClick={onBack} icon={<ArrowLeft size={16} />}>
            Back: Setup 1
          </SecondaryButton>
          <PrimaryButton type="submit" icon={<ArrowRight size={16} />}>
            Next: Subject & last seen
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
};
