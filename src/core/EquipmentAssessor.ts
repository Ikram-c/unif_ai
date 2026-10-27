import { EquipmentAssessment, EquipmentKind, TravelMode, WeatherSnapshot } from '../types';
import { defaultSarConfig, SarConfig } from './SarConfig';

export class EquipmentAssessor {
  constructor(private config: SarConfig = defaultSarConfig) {}

  assess(
    weather: WeatherSnapshot,
    elapsedMinutes: number,
    mode: TravelMode
  ): EquipmentAssessment[] {
    return [
      this.uavVisual(weather),
      this.uavThermal(weather),
      this.groundTeam(weather),
      this.vehiclePatrol(weather, mode),
      this.dogTeam(weather, elapsedMinutes),
      this.helicopter(weather),
    ];
  }

  private uavVisual(w: WeatherSnapshot): EquipmentAssessment {
    const flight = this.uavFlightBlockers(w);
    if (flight.length > 0) {
      return { kind: 'UAV_VISUAL', viable: false, reason: flight.join('; ') };
    }
    if (!w.daylight) {
      return {
        kind: 'UAV_VISUAL',
        viable: false,
        reason: 'No daylight: use the thermal payload instead',
      };
    }
    return { kind: 'UAV_VISUAL', viable: true, reason: this.flyable(w) };
  }

  private uavThermal(w: WeatherSnapshot): EquipmentAssessment {
    const flight = this.uavFlightBlockers(w);
    if (flight.length > 0) {
      return { kind: 'UAV_THERMAL', viable: false, reason: flight.join('; ') };
    }
    const note = w.daylight
      ? 'Flyable; thermal contrast is weaker in daylight'
      : 'Flyable; best contrast after dark';
    return { kind: 'UAV_THERMAL', viable: true, reason: note };
  }

  private groundTeam(w: WeatherSnapshot): EquipmentAssessment {
    const limits = this.config.equipment;
    const hazards: string[] = [];
    if (w.wind_ms > limits.groundHazardWindMs) {
      hazards.push(`wind ${w.wind_ms.toFixed(0)} m/s`);
    }
    if (w.visibility_m < limits.groundHazardVisibilityM) {
      hazards.push(`visibility ${w.visibility_m.toFixed(0)} m`);
    }

    const reason =
      hazards.length === 0
        ? `Deployable; ${w.wind_ms.toFixed(0)} m/s wind, ${(w.visibility_m / 1000.0).toFixed(1)} km visibility`
        : 'Deployable with exposure caution: ' + hazards.join(', ');
    return { kind: 'GROUND_TEAM', viable: true, reason };
  }

  private vehiclePatrol(w: WeatherSnapshot, mode: TravelMode): EquipmentAssessment {
    let reason = '';
    switch (mode) {
      case 'VEHICLE':
        reason = 'Priority: subject was in a vehicle, sweep road network and lay-bys';
        break;
      case 'ON_FOOT':
        reason = 'Useful for road-edge sweeps and moving teams to sector drop-offs';
        break;
      case 'UNKNOWN':
        reason = 'Sweep roads first to rule out a vehicle scenario';
        break;
    }
    const visibilityNote =
      w.visibility_m < this.config.equipment.groundHazardVisibilityM
        ? `; drive with caution, visibility ${w.visibility_m.toFixed(0)} m`
        : '';
    return { kind: 'VEHICLE_PATROL', viable: true, reason: reason + visibilityNote };
  }

  private dogTeam(w: WeatherSnapshot, elapsedMinutes: number): EquipmentAssessment {
    const limits = this.config.equipment;
    const hours = elapsedMinutes / 60.0;
    const blockers: string[] = [];
    if (w.wind_ms > limits.dogMaxWindMs) {
      blockers.push(`wind ${w.wind_ms.toFixed(0)} m/s scatters scent`);
    }
    if (w.precipitation_mm_h > limits.dogMaxPrecipMmH) {
      blockers.push(`heavy rain ${w.precipitation_mm_h.toFixed(1)} mm/h`);
    }
    if (hours > limits.dogMaxElapsedHours) {
      blockers.push(`scent trail older than ${limits.dogMaxElapsedHours.toFixed(0)} h`);
    }

    if (blockers.length > 0) {
      return { kind: 'DOG_TEAM', viable: false, reason: blockers.join('; ') };
    }
    return {
      kind: 'DOG_TEAM',
      viable: true,
      reason: 'Scent conditions acceptable; start from the pin',
    };
  }

  private helicopter(w: WeatherSnapshot): EquipmentAssessment {
    const limits = this.config.equipment;
    const blockers: string[] = [];
    if (w.wind_ms > limits.heliMaxWindMs) {
      blockers.push(`wind ${w.wind_ms.toFixed(0)} m/s`);
    }
    if (w.visibility_m < limits.heliMinVisibilityM) {
      blockers.push(`visibility ${(w.visibility_m / 1000.0).toFixed(1)} km`);
    }
    if (w.cloud_cover_pct > limits.heliMaxCloudPct) {
      blockers.push(`cloud cover ${w.cloud_cover_pct.toFixed(0)}%`);
    }

    if (blockers.length > 0) {
      return {
        kind: 'HELICOPTER',
        viable: false,
        reason: 'Request only if conditions improve: ' + blockers.join(', '),
      };
    }
    return {
      kind: 'HELICOPTER',
      viable: true,
      reason: 'Conditions allow a tasking request',
    };
  }

  private uavFlightBlockers(w: WeatherSnapshot): string[] {
    const limits = this.config.equipment;
    const blockers: string[] = [];
    if (w.wind_ms > limits.uavMaxWindMs) {
      blockers.push(
        `wind ${w.wind_ms.toFixed(0)} m/s over ${limits.uavMaxWindMs.toFixed(0)} m/s limit`
      );
    }
    if (w.gust_ms > limits.uavMaxGustMs) {
      blockers.push(
        `gusts ${w.gust_ms.toFixed(0)} m/s over ${limits.uavMaxGustMs.toFixed(0)} m/s limit`
      );
    }
    if (w.precipitation_mm_h > limits.uavMaxPrecipMmH) {
      blockers.push(`rain ${w.precipitation_mm_h.toFixed(1)} mm/h too wet`);
    }
    if (w.visibility_m < limits.uavMinVisibilityM) {
      blockers.push(
        `visibility ${w.visibility_m.toFixed(0)} m under ${limits.uavMinVisibilityM.toFixed(0)} m`
      );
    }
    if (w.temperature_c < limits.uavMinTempC) {
      blockers.push(`${w.temperature_c.toFixed(0)} C below battery limit`);
    }
    return blockers;
  }

  private flyable(w: WeatherSnapshot): string {
    return `Flyable: wind ${w.wind_ms.toFixed(0)} m/s, rain ${w.precipitation_mm_h.toFixed(1)} mm/h, visibility ${(w.visibility_m / 1000.0).toFixed(1)} km`;
  }
}
