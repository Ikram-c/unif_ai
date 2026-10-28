import React, { useState } from 'react';
import {
  Wind,
  CloudRain,
  Eye,
  Thermometer,
  Cloud,
  Sun,
  Moon,
  Gauge,
  AlertTriangle,
  Sliders,
  RefreshCw,
} from 'lucide-react';
import { DetailedWeatherReport, WeatherScenarioKey } from '../types';

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
  const isHeloGrounded =
    weather.gust_ms > 24 || weather.cloud_ceiling_m < 350 || weather.visibility_m < 800;

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
      className={`tactical-card rounded-2xl p-4 sm:p-5 space-y-4 ${className}`}
    >
      {/* Top Header Row with Scenario Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#CBD8D4] pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 hig-app-icon bg-[#E1ECE8] flex items-center justify-center text-[#0B6758] shrink-0">
            <Wind size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-[#081820]">
                Weather Report &amp; Causality Telemetry
              </h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#EDF2EF] text-[#1E3831] border border-[#CBD8D4] font-mono">
                {weather.source.split(' ')[0]}
              </span>
            </div>
            <p className="text-xs text-[#1E3831] mt-0.5">
              Live atmospheric constraints evaluated directly by the terrain causality model
            </p>
          </div>
        </div>

        {/* Scenario Switcher Pills (Targets >= 40-44px) */}
        <div className="flex items-center gap-2 overflow-x-auto py-0.5">
          {scenarios.map((sc) => {
            const isSelected = weather.scenario === sc.key;
            return (
              <button
                key={sc.key}
                type="button"
                onClick={() => onSelectScenario(sc.key)}
                className={`min-h-[42px] px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 border cursor-pointer ${
                  isSelected
                    ? 'bg-[#0B6758] text-white border-[#085446]'
                    : 'bg-[#F6F9F7] text-[#081820] border-[#B8C9C3] hover:bg-[#E1ECE8]'
                }`}
              >
                <span>{sc.label.split(' ')[0]}</span>
                <span
                  className={`ml-1.5 text-xs font-mono ${
                    isSelected ? 'text-[#E0F8D0]' : 'text-[#1E3831]'
                  }`}
                >
                  ({sc.tag})
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setShowSliders(!showSliders)}
            className={`min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
              showSliders
                ? 'bg-[#081820] text-white border-[#081820]'
                : 'bg-white text-[#081820] border-[#8BA39B] hover:bg-[#EDF2EF]'
            }`}
            title="Adjust atmospheric sliders"
            aria-expanded={showSliders}
          >
            <Sliders size={16} />
            <span className="hidden sm:inline">Sliders</span>
          </button>
        </div>
      </div>

      {/* Primary Telemetry Grid (CR >= 4.5:1) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-xs">
        {/* Wind */}
        <div className="p-3 bg-[#F6F9F7] rounded-xl border border-[#CBD8D4]">
          <div className="flex items-center justify-between text-[#1E3831] font-semibold">
            <span className="flex items-center gap-1.5">
              <Wind size={14} className="text-[#0B6758]" />
              <span>Wind</span>
            </span>
            <span className="font-mono font-bold">{weather.wind_dir_cardinal}</span>
          </div>
          <div className="font-bold text-[#081820] text-sm mt-1 font-mono tabular-nums">
            {weather.wind_ms.toFixed(1)} m/s
          </div>
          <div className="text-xs text-[#78350F] font-semibold mt-0.5 font-mono tabular-nums">
            Gust {gustKnots} kt ({knots} kt)
          </div>
        </div>

        {/* Temperature & Wind Chill */}
        <div className="p-3 bg-[#F6F9F7] rounded-xl border border-[#CBD8D4]">
          <div className="flex items-center justify-between text-[#1E3831] font-semibold">
            <span className="flex items-center gap-1.5">
              <Thermometer size={14} className="text-[#0B6758]" />
              <span>Temp</span>
            </span>
          </div>
          <div className="font-bold text-[#081820] text-sm mt-1 font-mono tabular-nums">
            {weather.temperature_c.toFixed(1)}°C
          </div>
          <div
            className={`text-xs mt-0.5 font-mono font-semibold tabular-nums ${
              weather.wind_chill_c < 0 ? 'text-[#DC2626]' : 'text-[#1E3831]'
            }`}
          >
            Chill {weather.wind_chill_c.toFixed(1)}°C
          </div>
        </div>

        {/* Cloud Ceiling vs Summit */}
        <div className="p-3 bg-[#F6F9F7] rounded-xl border border-[#CBD8D4]">
          <div className="flex items-center justify-between text-[#1E3831] font-semibold">
            <span className="flex items-center gap-1.5">
              <Cloud size={14} className="text-[#0B6758]" />
              <span>Cloud Base</span>
            </span>
            <span className="font-mono">{weather.cloud_cover_pct}%</span>
          </div>
          <div className="font-bold text-[#081820] text-sm mt-1 font-mono tabular-nums">
            {weather.cloud_ceiling_m} m ASL
          </div>
          <div
            className={`text-xs font-semibold mt-0.5 ${
              weather.cloud_ceiling_m < 886 ? 'text-[#DC2626]' : 'text-[#064E3B]'
            }`}
          >
            {weather.cloud_ceiling_m < 886
              ? `Envelops summit`
              : 'Clears summit'}
          </div>
        </div>

        {/* Visibility */}
        <div className="p-3 bg-[#F6F9F7] rounded-xl border border-[#CBD8D4]">
          <div className="flex items-center justify-between text-[#1E3831] font-semibold">
            <span className="flex items-center gap-1.5">
              <Eye size={14} className="text-[#0B6758]" />
              <span>Visibility</span>
            </span>
          </div>
          <div className="font-bold text-[#081820] text-sm mt-1 font-mono tabular-nums">
            {weather.visibility_m >= 1000
              ? `${(weather.visibility_m / 1000).toFixed(1)} km`
              : `${weather.visibility_m} m`}
          </div>
          <div className="text-xs text-[#1E3831] mt-0.5">
            {weather.visibility_m < 300
              ? 'Dense valley fog'
              : weather.visibility_m < 1500
              ? 'Moderate mist'
              : 'Clear sight'}
          </div>
        </div>

        {/* Precipitation */}
        <div className="p-3 bg-[#F6F9F7] rounded-xl border border-[#CBD8D4]">
          <div className="flex items-center justify-between text-[#1E3831] font-semibold">
            <span className="flex items-center gap-1.5">
              <CloudRain size={14} className="text-[#0B6758]" />
              <span>Rain / Snow</span>
            </span>
          </div>
          <div className="font-bold text-[#081820] text-sm mt-1 font-mono tabular-nums">
            {weather.precipitation_mm_h.toFixed(1)} mm/h
          </div>
          <div className="text-xs text-[#1E3831] mt-0.5 font-medium truncate">
            {weather.precipitation_type}
          </div>
        </div>

        {/* Barometer */}
        <div className="p-3 bg-[#F6F9F7] rounded-xl border border-[#CBD8D4]">
          <div className="flex items-center justify-between text-[#1E3831] font-semibold">
            <span className="flex items-center gap-1.5">
              <Gauge size={14} className="text-[#0B6758]" />
              <span>Pressure</span>
            </span>
          </div>
          <div className="font-bold text-[#081820] text-sm mt-1 font-mono tabular-nums">
            {weather.barometric_hpa} hPa
          </div>
          <div className="text-xs text-[#1E3831] mt-0.5 font-mono">
            {weather.baro_trend}
          </div>
        </div>

        {/* Daylight Window */}
        <div className="p-3 bg-[#F6F9F7] rounded-xl border border-[#CBD8D4]">
          <div className="flex items-center justify-between text-[#1E3831] font-semibold">
            <span className="flex items-center gap-1.5">
              {weather.daylight ? (
                <Sun size={14} className="text-[#D97706]" />
              ) : (
                <Moon size={14} className="text-[#081820]" />
              )}
              <span>Daylight</span>
            </span>
          </div>
          <div className="font-bold text-[#081820] text-sm mt-1 font-mono tabular-nums">
            {weather.daylight
              ? `${Math.floor(weather.daylight_remaining_min / 60)}h ${
                  weather.daylight_remaining_min % 60
                }m`
              : 'Night Ops'}
          </div>
          <div className="text-xs text-[#1E3831] mt-0.5">
            {weather.daylight ? 'Sunset 16:40 UTC' : 'Thermal array'}
          </div>
        </div>
      </div>

      {/* Causality Operational Warning Bar */}
      {(isUavGrounded || isK9Impaired || isHeloGrounded) && (
        <div className="bg-[#FEF3DD] border border-[#D97706] rounded-xl p-3.5 flex flex-wrap items-center gap-2.5 text-xs text-[#78350F]">
          <AlertTriangle size={18} className="shrink-0 text-[#B45309]" />
          <div className="flex-1 font-medium">
            <strong className="text-[#081820]">Causality Operational Constraints:</strong>
            <ul className="inline-flex flex-wrap gap-x-4 gap-y-1 ml-2 list-disc list-inside">
              {isUavGrounded && <li>UAV-01 grounded or cloud-capped on ridge</li>}
              {isK9Impaired && <li>K9 scent cone dispersion active</li>}
              {isHeloGrounded && <li>Rescue-936 Helo minimums restricted</li>}
            </ul>
          </div>
        </div>
      )}

      {/* Expandable Custom Sliders Drawer (Apple HIG Selection: Sliders for continuous ranges) */}
      {showSliders && (
        <div className="pt-3 border-t border-[#CBD8D4] space-y-3.5 bg-[#F6F9F7] p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#081820]">
              Fine-Tune Atmospheric Variables for Causality Testing
            </span>
            <button
              type="button"
              onClick={() => onSelectScenario('BASELINE')}
              className="min-h-[40px] px-3 py-1.5 rounded-lg bg-white border border-[#8BA39B] text-xs text-[#0B6758] font-bold hover:bg-[#E1ECE8] flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={13} /> Reset to Baseline
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <label htmlFor="slider-wind" className="font-semibold text-[#1E3831]">
                  Sustained Wind:
                </label>
                <span className="font-mono font-bold text-[#081820] tabular-nums">
                  {weather.wind_ms.toFixed(1)} m/s ({knots} kt)
                </span>
              </div>
              <input
                id="slider-wind"
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
                className="w-full accent-[#0B6758] cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <label htmlFor="slider-ceiling" className="font-semibold text-[#1E3831]">
                  Cloud Ceiling (ASL):
                </label>
                <span className="font-mono font-bold text-[#081820] tabular-nums">
                  {weather.cloud_ceiling_m} m
                </span>
              </div>
              <input
                id="slider-ceiling"
                type="range"
                min="200"
                max="1200"
                step="20"
                value={weather.cloud_ceiling_m}
                onChange={(e) =>
                  handleSliderChange('cloud_ceiling_m', parseInt(e.target.value, 10))
                }
                className="w-full accent-[#0B6758] cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <label htmlFor="slider-visibility" className="font-semibold text-[#1E3831]">
                  Visibility:
                </label>
                <span className="font-mono font-bold text-[#081820] tabular-nums">
                  {weather.visibility_m} m
                </span>
              </div>
              <input
                id="slider-visibility"
                type="range"
                min="100"
                max="10000"
                step="100"
                value={weather.visibility_m}
                onChange={(e) =>
                  handleSliderChange('visibility_m', parseInt(e.target.value, 10))
                }
                className="w-full accent-[#0B6758] cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
