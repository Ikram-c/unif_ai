import { GeoPosition, SearchCell, Terrain } from '../types';
import { Geo } from './Geo';
import { HexGridParams, defaultSarConfig } from './SarConfig';

export class HexGrid {
  constructor(private params: HexGridParams = defaultSarConfig.hexGrid) {}

  cover(centre: GeoPosition, radiusM: number): SearchCell[] {
    const cellRadius = this.cellRadiusFor(radiusM);
    const rings = Math.ceil(radiusM / (1.5 * cellRadius)) + 1;
    const cells: SearchCell[] = [];
    const areaKm2 = ((3.0 * Math.sqrt(3.0)) / 2.0 * cellRadius * cellRadius) / 1000000.0;

    for (let q = -rings; q <= rings; q++) {
      for (let r = -rings; r <= rings; r++) {
        if (cells.length >= this.params.maxCells) return cells;
        if (Math.abs(q + r) > rings) continue;

        const east = 1.5 * cellRadius * q;
        const north = Math.sqrt(3.0) * cellRadius * (r + q / 2.0);
        const distance = Math.sqrt(east * east + north * north);
        if (distance > radiusM + cellRadius) continue;

        const cellCentre = Geo.offset(centre, east, north);
        cells.push({
          cell_id: `hex:${q}:${r}`,
          centre: cellCentre,
          boundary: this.boundary(cellCentre, cellRadius),
          terrain: this.pseudoTerrain(q, r),
          area_km2: areaKm2,
        });
      }
    }
    return cells;
  }

  cellRadiusFor(radiusM: number): number {
    const nominal = radiusM / Math.max(1, this.params.cellsAcrossRadius);
    const hexAreaFactor = (3.0 * Math.sqrt(3.0)) / 2.0;
    const boundedByCount =
      radiusM *
      Math.sqrt(Math.PI / (hexAreaFactor * Math.max(7, this.params.maxCells) * 0.8));
    return Math.max(nominal, boundedByCount, this.params.minCellRadiusM);
  }

  private boundary(centre: GeoPosition, cellRadius: number): GeoPosition[] {
    const points: GeoPosition[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (60.0 * i * Math.PI) / 180.0;
      points.push(
        Geo.offset(centre, cellRadius * Math.cos(angle), cellRadius * Math.sin(angle))
      );
    }
    return points;
  }

  private pseudoTerrain(q: number, r: number): Terrain {
    const qHash = Math.imul(q, 73856093);
    const rHash = Math.imul(r, 19349663);
    const xor = qHash ^ rHash;
    const hash = Math.abs(xor) % 10;
    switch (hash) {
      case 0:
      case 1:
      case 2:
      case 3:
        return 'OPEN_MOORLAND';
      case 4:
      case 5:
        return 'FOREST';
      case 6:
      case 7:
        return 'MOUNTAIN';
      case 8:
        return 'FARMLAND';
      default:
        return 'WATER';
    }
  }
}
