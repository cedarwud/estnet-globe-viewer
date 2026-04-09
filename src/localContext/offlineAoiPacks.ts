import type { GeoCoordinate } from '../truth/contracts';

export interface LocalContextPanOffset {
  eastM: number;
  northM: number;
}

export interface LocalContextAnchor {
  id: string;
  label: string;
  role: 'endpoint-site' | 'service-lookout' | 'support-site';
  eastM: number;
  northM: number;
  markerHeightM: number;
  accentColor: string;
  note: string;
}

export interface LocalContextTerrainGrid {
  columns: number;
  rows: number;
  sampleSpacingM: number;
  baseHeightM: number;
  maxHeightM: number;
  heightsM: number[][];
}

export interface LocalContextAoiPack {
  id: string;
  label: string;
  targetLabel: string;
  endpointId: string;
  regionLabel: string;
  center: GeoCoordinate;
  halfExtentM: number;
  terrainSourceLabel: string;
  serviceContextNote: string;
  panStepM: number;
  panBoundsM: {
    eastM: number;
    northM: number;
  };
  defaultCamera: {
    headingDeg: number;
    pitchDeg: number;
    rangeM: number;
    minRangeM: number;
    maxRangeM: number;
    maxTiltDeg: number;
  };
  terrain: LocalContextTerrainGrid;
  anchors: LocalContextAnchor[];
}

function buildEndpointAlphaTerrainGrid(): LocalContextTerrainGrid {
  const rows = 21;
  const columns = 21;
  const sampleSpacingM = 420;
  const heightsM: number[][] = [];
  let maxHeightM = 0;

  for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
    const row: number[] = [];

    for (let columnIndex = 0; columnIndex < columns; columnIndex += 1) {
      const eastM = (columnIndex - (columns - 1) / 2) * sampleSpacingM;
      const northM = (rowIndex - (rows - 1) / 2) * sampleSpacingM;

      const northernRidge =
        360 *
        Math.exp(
          -((eastM + 680) ** 2 / (2150 ** 2) + (northM - 1320) ** 2 / (1280 ** 2))
        );
      const easternShoulder =
        240 *
        Math.exp(
          -((eastM - 1380) ** 2 / (1520 ** 2) + (northM + 280) ** 2 / (1850 ** 2))
        );
      const basin =
        -165 *
        Math.exp(
          -((eastM - 160) ** 2 / (980 ** 2) + (northM + 180) ** 2 / (840 ** 2))
        );
      const foldedTerrain = 48 * Math.sin(eastM / 1180) * Math.cos(northM / 960);

      const heightM = Math.max(46, 138 + northernRidge + easternShoulder + basin + foldedTerrain);

      row.push(heightM);
      maxHeightM = Math.max(maxHeightM, heightM);
    }

    heightsM.push(row);
  }

  return {
    columns,
    rows,
    sampleSpacingM,
    baseHeightM: 46,
    maxHeightM,
    heightsM,
  };
}

const endpointAlphaTerrain = buildEndpointAlphaTerrainGrid();

export const endpointAlphaLocalContextPack: LocalContextAoiPack = {
  id: 'endpoint-alpha-taipei-foothills',
  label: 'Endpoint Alpha Local Context',
  targetLabel: 'Endpoint Alpha service site AOI',
  endpointId: 'endpoint-alpha',
  regionLabel: 'Taipei foothills offline AOI pack',
  center: {
    latitudeDeg: 25.033,
    longitudeDeg: 121.5654,
    altitudeKm: null,
  },
  halfExtentM: ((endpointAlphaTerrain.columns - 1) * endpointAlphaTerrain.sampleSpacingM) / 2,
  terrainSourceLabel: 'embedded-offline-height-grid-v1',
  serviceContextNote:
    'This first slice stays tied to Endpoint Alpha. The local scene proves terrain-first AOI inspection without upgrading routing truth or requiring a cloud provider.',
  panStepM: 420,
  panBoundsM: {
    eastM: 1260,
    northM: 1260,
  },
  defaultCamera: {
    headingDeg: 28,
    pitchDeg: -34,
    rangeM: 5600,
    minRangeM: 1800,
    maxRangeM: 9000,
    maxTiltDeg: 84,
  },
  terrain: endpointAlphaTerrain,
  anchors: [
    {
      id: 'endpoint-alpha-service-site',
      label: 'Endpoint Alpha Service Site',
      role: 'endpoint-site',
      eastM: -280,
      northM: -180,
      markerHeightM: 28,
      accentColor: '#ffbf69',
      note: 'Primary service-relevant entry target for the first AOI slice.',
    },
    {
      id: 'endpoint-alpha-lookout',
      label: 'Corridor Lookout Ridge',
      role: 'service-lookout',
      eastM: 1340,
      northM: 980,
      markerHeightM: 22,
      accentColor: '#8ed2ff',
      note: 'A higher local anchor used to make terrain relief legible from moderate oblique orbit.',
    },
    {
      id: 'endpoint-alpha-support-pad',
      label: 'Support Access Pad',
      role: 'support-site',
      eastM: 860,
      northM: -1020,
      markerHeightM: 18,
      accentColor: '#7bdff2',
      note: 'Optional local support anchor to avoid the slice reading as one isolated marker on empty relief.',
    },
  ],
};

const offlineLocalContextPacks = [endpointAlphaLocalContextPack] as const;

export function getOfflineLocalContextPack(aoiId: string) {
  return offlineLocalContextPacks.find((pack) => pack.id === aoiId) ?? null;
}

export function getPrimaryServiceSiteAnchor(pack: LocalContextAoiPack) {
  return pack.anchors.find((anchor) => anchor.role === 'endpoint-site') ?? pack.anchors[0] ?? null;
}
