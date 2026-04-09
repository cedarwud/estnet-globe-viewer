import type { LocalContextAoiPack, LocalContextTerrainGrid } from './offlineAoiPacks';

export interface TerrainCapabilityReport {
  capable: boolean;
  reason: string;
  reliefRangeM: number | null;
  minimumHeightM: number | null;
  maximumHeightM: number | null;
}

const MIN_TERRAIN_RELIEF_RANGE_M = 24;

function buildInvalidTerrainReport(reason: string): TerrainCapabilityReport {
  return {
    capable: false,
    reason,
    reliefRangeM: null,
    minimumHeightM: null,
    maximumHeightM: null,
  };
}

function isPositiveInteger(value: unknown) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 2;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isPositiveFiniteNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value > 0;
}

function scanTerrainHeights(
  terrainGrid: LocalContextTerrainGrid
): {
  minimumHeightM: number;
  maximumHeightM: number;
  reliefRangeM: number;
} | null {
  if (!Array.isArray(terrainGrid.heightsM) || terrainGrid.heightsM.length !== terrainGrid.rows) {
    return null;
  }

  let minimumHeightM = Number.POSITIVE_INFINITY;
  let maximumHeightM = Number.NEGATIVE_INFINITY;

  for (const row of terrainGrid.heightsM) {
    if (!Array.isArray(row) || row.length !== terrainGrid.columns) {
      return null;
    }

    for (const heightM of row) {
      if (!isFiniteNumber(heightM)) {
        return null;
      }

      minimumHeightM = Math.min(minimumHeightM, heightM);
      maximumHeightM = Math.max(maximumHeightM, heightM);
    }
  }

  if (!Number.isFinite(minimumHeightM) || !Number.isFinite(maximumHeightM)) {
    return null;
  }

  return {
    minimumHeightM,
    maximumHeightM,
    reliefRangeM: maximumHeightM - minimumHeightM,
  };
}

export function getTerrainCapabilityReport(pack: LocalContextAoiPack | null | undefined): TerrainCapabilityReport {
  if (!pack) {
    return buildInvalidTerrainReport('No offline AOI pack is installed for the current local target.');
  }

  if (!pack.terrain || typeof pack.terrain !== 'object') {
    return buildInvalidTerrainReport('The local AOI pack is present, but its terrain grid is missing.');
  }

  if (!isPositiveInteger(pack.terrain.rows) || !isPositiveInteger(pack.terrain.columns)) {
    return buildInvalidTerrainReport('The local AOI terrain grid must expose at least 2 rows and 2 columns.');
  }

  if (!isPositiveFiniteNumber(pack.terrain.sampleSpacingM)) {
    return buildInvalidTerrainReport('The local AOI terrain grid sample spacing must be a positive finite value.');
  }

  if (!isFiniteNumber(pack.terrain.baseHeightM) || !isFiniteNumber(pack.terrain.maxHeightM)) {
    return buildInvalidTerrainReport('The local AOI terrain metadata must include finite base and max heights.');
  }

  const scannedTerrain = scanTerrainHeights(pack.terrain);

  if (!scannedTerrain) {
    return buildInvalidTerrainReport('The local AOI terrain grid shape does not match its rows, columns, or height samples.');
  }

  if (scannedTerrain.reliefRangeM < MIN_TERRAIN_RELIEF_RANGE_M) {
    return {
      capable: false,
      reason: `The local AOI terrain relief is too flat (${scannedTerrain.reliefRangeM.toFixed(1)} m).`,
      reliefRangeM: scannedTerrain.reliefRangeM,
      minimumHeightM: scannedTerrain.minimumHeightM,
      maximumHeightM: scannedTerrain.maximumHeightM,
    };
  }

  return {
    capable: true,
    reason: '',
    reliefRangeM: scannedTerrain.reliefRangeM,
    minimumHeightM: scannedTerrain.minimumHeightM,
    maximumHeightM: scannedTerrain.maximumHeightM,
  };
}

export function isTerrainCapableLocalContextPack(pack: LocalContextAoiPack | null | undefined) {
  return getTerrainCapabilityReport(pack).capable;
}
