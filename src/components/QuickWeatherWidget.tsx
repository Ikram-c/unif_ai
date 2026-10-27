import React, { useState } from 'react';
import {
  Wind,
  CloudRain,
  Eye,
  Thermometer,
  Cloud,
  Sun,
  Moon,
  Compass,
  Gauge,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sliders,
  RefreshCw,
} from 'lucide-react';
import { DetailedWeatherReport, WeatherScenarioKey } from '../types';
import { WEATHER_PRESETS } from '../core/CausalityModel';

interface QuickWeatherWidgetProps {
  weather: DetailedWeatherReport;
  onSelectScenario: (scenario: WeatherScenarioKey) => void;
  onUpdateWeather?: (updated: DetailedWeatherReport) => void;
  className?: string;
}

export const QuickWeatherWidget: React.FC<QuickWeatherWidgetProps> = ({
  weather,
  onSelectScenario,
  onUpdateWeather,
  className = '',
}) => {
  const [showSliders, setShowSliders] = useState(false);

  const knots = Math.round(weather.wind_ms * 1.944);
  const gustKnots = Math.round(weather.gust_ms * 1.944);

  const isUavGrounded = weather.gust_ms > 16.5 || weather.cloud_ceiling_m < 600;
  const isK9Impaired = weather.wind_ms > 13 || weather.precipitation_mm_h > 4;
  const isHeloGrounded = weather.gust_ms > 24 || weather.cloud_ceiling_m < 350 || weather.visibility_m < 800;

  const scenarios: Array<{ key: WeatherScenarioKey; label: string; tag: string }> = [
    { key: 'BASELINE', label: 'Baseline (Storey Arms)', tag: '12:25 UTC' },
    { key: 'SUMMIT_GALE', label: 'Summit Gale Warning', tag: 'Gusts 54 kts' },
    { key: 'CWM_FOG', label: 'Dense Cwm Fog & Mist', tag: '180m Vis' },
    { key: 'FREEZING_NIGHT', label: 'Sub-Zero Night Freeze', tag: '-11°C Chill' },
  ];

  const handleSliderChange = (key: keyof DetailedWeatherReport, value: number) => {
    if (onUpdateWeather) {
      onUpdateWeather({
        ...weather,
        [key]: value,
      });
    }
  };

  return (
    <div
      className={`bg-white border border-[#E2E8E5] rounded-xl p-3 sm:p-4 shadow-xs space-y-3 ${className}`}
    >
      {/* Top Header Row with Scenario Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#E2E8E5] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#E1ECE8] flex items-center justify-center text-[#0B6758] shrink-0">
            <Wind size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1C2E2A]">
                Quick Weather Report & Causality Telemetry
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F4F6F5] text-[#5A706A] border border-[#E2E8E5] font-mono">
                {weather.source.split(' ')[0]}
              </span>
            </div>
            <p className="text-[11px] text-[#5A706A]">
              Live atmospheric constraints evaluated directly by the Causality Model
            </p>
          </div>
        </div>

        {/* Scenario Switcher Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          {scenarios.map((sc) => {
            const isSelected = weather.scenario === sc.key;
            return (
              <button
                key={sc.key}
                type="button"
                onClick={() => onSelectScenario(sc.key)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all shrink-0 border ${
                  isSelected
                    ? 'bg-[#0B6758] text-white border-[#0B6758] shadow-xs'
                    : 'bg-[#F4F6F5] text-[#5A706A] border-[#E2E8E5] hover:bg-[#EAEFEA] hover:text-[#1C2E2A]'
                }`}
              >
                <span>{sc.label.split(' ')[0]}</span>
                <span className={`ml-1 text-[10px] opacity-80 ${isSelected ? 'text-white' : 'text-[#7D918B]'}`}>
                  ({sc.tag})
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setShowSliders(!showSliders)}
            className={`p-1.5 rounded-md border text-xs transition-colors shrink-0 ${
              showSliders
                ? 'bg-[#1C2E2A] text-white border-[#1C2E2A]'
                : 'bg-white text-[#5A706A] border-[#E2E8E5] hover:bg-[#F4F6F5]'
            }`}
            title="Custom atmospheric sliders"
          >
            <Sliders size={14} />
          </button>
        </div>
      </div>

      {/* Primary Telemetry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-xs">
        {/* Wind */}
        <div className="p-2.5 bg-[#F4F6F5] rounded-lg border border-[#E2E8E5]">
          <div className="flex items-center justify-between text-[#5A706A] text-[11px]">
            <span className="flex items-center gap-1">
              <Wind size={13} className="text-[#0B6758]" />
              <span>Wind / Gust</span>
            </span>
            <span className="font-mono">{weather.wind_dir_cardinal}</span>
          </div>
          <div className="font-black text-[#1C2E2A] text-sm mt-1 font-mono">
            {weather.wind_ms.toFixed(1)} <span className="text-[11px] font-medium text-[#5A706A]">m/s</span>
            <span className="text-[#9A690B] text-xs font-bold ml-1">({gustKnots} kt g)</span>
          </div>
          <div className="text-[10px] text-[#5A706A] mt-0.5 font-mono">
            {knots} kts sustained · {weather.wind_dir_deg}°
          </div>
        </div>

        {/* Temperature & Wind Chill */}
        <div className="p-2.5 bg-[#F4F6F5] rounded-lg border border-[#E2E8E5]">
          <div className="flex items-center justify-between text-[#5A706A] text-[11px]">
            <span className="flex items-center gap-1">
              <Thermometer size={13} className="text-[#0B6758]" />
              <span>Temp / Chill</span>
            </span>
          </div>
          <div className="font-black text-[#1C2E2A] text-sm mt-1 font-mono">
            {weather.temperature_c.toFixed(1)}°C
            <span
              className={`text-xs ml-1.5 font-bold ${
                weather.wind_chill_c < 0 ? 'text-[#DC2626]' : 'text-[#5A706A]'
              }`}
            >
              (Chill {weather.wind_chill_c.toFixed(1)}°C)
            </span>
          </div>
          <div className="text-[10px] text-[#5A706A] mt-0.5">
            Lapse rate: -0.65°C / 100m
          </div>
        </div>

        {/* Cloud Ceiling vs Summit */}
        <div className="p-2.5 bg-[#F4F6F5] rounded-lg border border-[#E2E8E5]">
          <div className="flex items-center justify-between text-[#5A706A] text-[11px]">
            <span className="flex items-center gap-1">
              <Cloud size={13} className="text-[#0B6758]" />
              <span>Cloud Base</span>
            </span>
            <span className="font-mono">{weather.cloud_cover_pct}%</span>
          </div>
          <div className="font-black text-[#1C2E2A] text-sm mt-1 font-mono">
            {weather.cloud_ceiling_m} m <span className="text-[11px] font-medium text-[#5A706A]">ASL</span>
          </div>
          <div
            className={`text-[10px] font-semibold mt-0.5 ${
              weather.cloud_ceiling_m < 886 ? 'text-[#DC2626]' : 'text-[#0B6758]'
            }`}
          >
            {weather.cloud_ceiling_m < 886
              ? `Envelops summit (${886 - weather.cloud_ceiling_m}m cloud drop)`
              : 'Clears Pen y Fan summit'}
          </div>
        </div>

        {/* Visibility */}
        <div className="p-2.5 bg-[#F4F6F5] rounded-lg border border-[#E2E8E5]">
          <div className="flex items-center justify-between text-[#5A706A] text-[11px]">
            <span className="flex items-center gap-1">
              <Eye size={13} className="text-[#0B6758]" />
              <span>Visibility</span>
            </span>
          </div>
          <div className="font-black text-[#1C2E2A] text-sm mt-1 font-mono">
            {weather.visibility_m >= 1000
              ? `${(weather.visibility_m / 1000).toFixed(1)} km`
              : `${weather.visibility_m} m`}
          </div>
          <div className="text-[10px] text-[#5A706A] mt-0.5">
            {weather.visibility_m < 300
              ? 'Dense valley fog'
              : weather.visibility_m < 1500
              ? 'Moderate hill mist'
              : 'Good horizontal sight'}
          </div>
        </div>

        {/* Precipitation */}
        <div className="p-2.5 bg-[#F4F6F5] rounded-lg border border-[#E2E8E5]">
          <div className="flex items-center justify-between text-[#5A706A] text-[11px]">
            <span className="flex items-center gap-1">
              <CloudRain size={13} className="text-[#0B6758]" />
              <span>Precipitation</span>
            </span>
          </div>
          <div className="font-black text-[#1C2E2A] text-sm mt-1 font-mono">
            {weather.precipitation_mm_h.toFixed(1)} <span className="text-[11px] font-medium text-[#5A706A]">mm/h</span>
          </div>
          <div className="text-[10px] text-[#5A706A] mt-0.5 font-medium">
            {weather.precipitation_type}
          </div>
        </div>

        {/* Barometer */}
        <div className="p-2.5 bg-[#F4F6F5] rounded-lg border border-[#E2E8E5]">
          <div className="flex items-center justify-between text-[#5A706A] text-[11px]">
            <span className="flex items-center gap-1">
              <Gauge size={13} className="text-[#0B6758]" />
              <span>Barometer</span>
            </span>
            <span className="text-[10px] font-mono">{weather.baro_trend}</span>
          </div>
          <div className="font-black text-[#1C2E2A] text-sm mt-1 font-mono">
            {weather.barometric_hpa} <span className="text-[11px] font-medium text-[#5A706A]">hPa</span>
          </div>
          <div className="text-[10px] text-[#5A706A] mt-0.5">
            {weather.baro_trend === 'FALLING' ? 'Approaching front' : 'Stable air mass'}
          </div>
        </div>

        {/* Daylight Window */}
        <div className="p-2.5 bg-[#F4F6F5] rounded-lg border border-[#E2E8E5]">
          <div className="flex items-center justify-between text-[#5A706A] text-[11px]">
            <span className="flex items-center gap-1">
              {weather.daylight ? <Sun size={13} className="text-[#9A690B]" /> : <Moon size={13} className="text-[#1C2E2A]" />}
              <span>Daylight</span>
            </span>
          </div>
          <div className="font-black text-[#1C2E2A] text-sm mt-1 font-mono">
            {weather.daylight ? `${Math.floor(weather.daylight_remaining_min / 60)}h ${weather.daylight_remaining_min % 60}m` : 'Night Search'}
          </div>
          <div className="text-[10px] text-[#5A706A] mt-0.5">
            {weather.daylight ? 'Sunset 16:40 UTC' : 'Thermal / Night array'}
          </div>
        </div>
      </div>

      {/* Causality Operational Warning Bar */}
      {(isUavGrounded || isK9Impaired || isHeloGrounded) && (
        <div className="bg-[#FEF3DD] border border-[#F3D794] rounded-lg p-2.5 flex flex-wrap items-center gap-2 text-xs text-[#9A690B]">
          <AlertTriangle size={15} className="shrink-0 text-[#9A690B]" />
          <div className="flex-1 font-medium">
            <strong>Causality Warning:</strong> Current atmospheric limits trigger operational constraints:
            <ul className="inline-flex flex-wrap gap-x-3 gap-y-0.5 ml-1.5 list-disc list-inside text-[11px]">
              {isUavGrounded && <li>UAV-01 grounded or cloud-capped on ridge</li>}
              {isK9Impaired && <li>K9 scent cone dispersion active</li>}
              {isHeloGrounded && <li>Rescue-936 Helo minimums restricted</li>}
            </ul>
          </div>
        </div>
      )}

      {/* Expandable Custom Sliders Drawer */}
      {showSliders && (
        <div className="pt-2 border-t border-[#E2E8E5] space-y-3 bg-[#F4F6F5] p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1C2E2A]">
              Fine-tune Atmospheric Variables for Causality Testing
            </span>
            <button
              type="button"
              onClick={() => onSelectScenario('BASELINE')}
              className="text-[11px] text-[#0B6758] font-bold hover:underline flex items-center gap-1"
            >
              <RefreshCw size={11} /> Reset to baseline
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[#5A706A]">Sustained Wind:</span>
                <span className="font-mono font-bold text-[#1C2E2A]">{weather.wind_ms.toFixed(1)} m/s ({knots} kt)</span>
              </div>
              <input
                type="range"
                min="0"
                max="28"
                step="0.5"
                value={weather.wind_ms}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  handleSliderChange('wind_ms', val);
                  handleSliderChange('gust_ms', parseFloat((val * 1.4).toFixed(1)));
                }}
                className="w-full accent-[#0B6758]"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[#5A706A]">Cloud Ceiling (ASL):</span>
                <span className="font-mono font-bold text-[#1C2E2A]">{weather.cloud_ceiling_m} m</span>
              </div>
              <input
                type="range"
                min="200"
                max="1200"
                step="20"
                value={weather.cloud_ceiling_m}
                onChange={(e) => handleSliderChange('cloud_ceiling_m', parseInt(e.target.value, 10))}
                className="w-full accent-[#0B6758]"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[#5A706A]">Visibility:</span>
                <span className="font-mono font-bold text-[#1C2E2A]">{weather.visibility_m} m</span>
              </div>
              <input
                type="range"
                min="100"
                max="10000"
                step="100"
                value={weather.visibility_m}
                onChange={(e) => handleSliderChange('visibility_m', parseInt(e.target.value, 10))}
                className="w-full accent-[#0B6758]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
