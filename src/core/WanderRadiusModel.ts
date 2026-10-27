import { RadiusRing, SubjectProfile, TravelMode } from '../types';
import { defaultSarConfig, SarConfig } from './SarConfig';

function clamp(value: number, lo: number, hi: number): number {
  return Math.min(Math.max(lo, hi), Math.max(lo, value));
}

export class WanderRadiusModel {
  constructor(private config: SarConfig = defaultSarConfig) {}

  rings(
    mode: TravelMode,
    elapsedMinutes: number,
    subject: SubjectProfile = {
      name: '',
      fitness: 'MEDIUM',
      experience: 'INTERMEDIATE',
      clothing: '',
      notes: '',
    }
  ): RadiusRing[] {
    const hours = Math.max(0, elapsedMinutes) / 60.0;
    switch (mode) {
      case 'ON_FOOT':
        return this.footRings(hours, subject);
      case 'VEHICLE':
        return this.vehicleRings(hours);
      case 'UNKNOWN':
        return this.merge(
          this.scale(this.footRings(hours, subject), this.config.vehicle.unknownFootMultiplier),
          this.scale(this.vehicleRings(hours), this.config.vehicle.unknownVehicleMultiplier)
        );
    }
  }

  outerRadiusM(
    mode: TravelMode,
    elapsedMinutes: number,
    subject: SubjectProfile = {
      name: '',
      fitness: 'MEDIUM',
      experience: 'INTERMEDIATE',
      clothing: '',
      notes: '',
    }
  ): number {
    const rings = this.rings(mode, elapsedMinutes, subject);
    return Math.max(...rings.map((r) => r.radius_m));
  }

  profileFactor(subject: SubjectProfile): number {
    const p = this.config.onFoot;
    let fitness = 1.0;
    if (subject.fitness === 'LOW') fitness = p.fitnessLow;
    else if (subject.fitness === 'HIGH') fitness = p.fitnessHigh;

    let experience = 1.0;
    if (subject.experience === 'NOVICE') experience = p.experienceNovice;
    else if (subject.experience === 'EXPERT') experience = p.experienceExpert;

    const age = subject.age;
    const ageFactor =
      age != null && (age < p.childAgeLimit || age > p.elderlyAgeLimit)
        ? p.ageFactor
        : 1.0;

    return fitness * experience * ageFactor;
  }

  private footRings(hours: number, subject: SubjectProfile): RadiusRing[] {
    const p = this.config.onFoot;
    const timeConstant = Math.max(0.01, p.timeConstantHours);
    const saturation = 1.0 - Math.exp(-hours / timeConstant);
    const raw = p.d50SaturationM * saturation * this.profileFactor(subject);
    const p50 = clamp(raw, p.minRadiusM, p.maxRadiusM);
    const p75 = clamp(p50 * p.p75Multiplier, p.minRadiusM, p.maxRadiusM);
    const p95 = clamp(p50 * p.p95Multiplier, p.minRadiusM, p.maxRadiusM);
    return [
      { probability: 0.5, radius_m: p50 },
      { probability: 0.75, radius_m: p75 },
      { probability: 0.95, radius_m: p95 },
    ];
  }

  private vehicleRings(hours: number): RadiusRing[] {
    const p = this.config.vehicle;
    const reach = clamp(p.effectiveSpeedMPerH * hours, p.minRadiusM, p.maxRadiusM);
    const p50 = clamp(reach * p.p50Fraction, p.minRadiusM, p.maxRadiusM);
    const p95 = clamp(reach * p.p95Multiplier, p.minRadiusM, p.maxRadiusM);
    return [
      { probability: 0.5, radius_m: p50 },
      { probability: 0.75, radius_m: reach },
      { probability: 0.95, radius_m: p95 },
    ];
  }

  private scale(rings: RadiusRing[], factor: number): RadiusRing[] {
    return rings.map((r) => ({ probability: r.probability, radius_m: r.radius_m * factor }));
  }

  private merge(a: RadiusRing[], b: RadiusRing[]): RadiusRing[] {
    const count = Math.min(a.length, b.length);
    const merged: RadiusRing[] = [];
    for (let i = 0; i < count; i++) {
      merged.push({
        probability: a[i].probability,
        radius_m: Math.max(a[i].radius_m, b[i].radius_m),
      });
    }
    return merged;
  }
}
