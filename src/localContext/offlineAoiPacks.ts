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

export interface LocalContextFeatureFootprint {
  id: string;
  label: string;
  kind: 'landing-terrace' | 'ridge-shelf' | 'support-shelf';
  centerEastM: number;
  centerNorthM: number;
  halfWidthM: number;
  halfHeightM: number;
  rotationDeg: number;
  heightOffsetM: number;
  fillColor: string;
  outlineColor: string;
  note: string;
}

export interface LocalContextFeaturePath {
  id: string;
  label: string;
  kind: 'corridor-landing' | 'ridge-traverse' | 'service-access';
  points: Array<{
    eastM: number;
    northM: number;
  }>;
  widthM: number;
  heightOffsetM: number;
  color: string;
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
  footprints: LocalContextFeatureFootprint[];
  paths: LocalContextFeaturePath[];
  placeNarrative: {
    placeLabel: string;
    placeSummary: string;
    terrainSummary: string;
    featureLabels: string[];
  };
  officialPlaceContext: {
    assetPath: string;
    sourceLabel: string;
    buildingCount: number;
    sidewalkCount: number;
  } | null;
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
  label: 'Asia Local Context',
  targetLabel: 'Asia Service Site',
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
    'This bounded offline destination now layers one lazy-loaded official Taipei place-context pack on top of the terrain-first AOI so the service site reads as a real place without requiring API world content.',
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
      label: 'Asia Service Site',
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
  footprints: [
    {
      id: 'endpoint-alpha-landing-terrace',
      label: 'Corridor Landing Terrace',
      kind: 'landing-terrace',
      centerEastM: -260,
      centerNorthM: -120,
      halfWidthM: 360,
      halfHeightM: 228,
      rotationDeg: 18,
      heightOffsetM: 10,
      fillColor: '#ffbf69',
      outlineColor: '#ffd7a4',
      note: 'Primary corridor-linked landing terrace wrapped around the service site anchor.',
    },
    {
      id: 'endpoint-alpha-ridge-shelf',
      label: 'Lookout Ridge Shelf',
      kind: 'ridge-shelf',
      centerEastM: 1180,
      centerNorthM: 940,
      halfWidthM: 470,
      halfHeightM: 220,
      rotationDeg: 24,
      heightOffsetM: 14,
      fillColor: '#8ed2ff',
      outlineColor: '#d6efff',
      note: 'Raised ridge shelf that makes the local relief and corridor-facing lookout legible.',
    },
    {
      id: 'endpoint-alpha-support-shelf',
      label: 'Support Access Shelf',
      kind: 'support-shelf',
      centerEastM: 820,
      centerNorthM: -940,
      halfWidthM: 320,
      halfHeightM: 190,
      rotationDeg: -12,
      heightOffsetM: 8,
      fillColor: '#7bdff2',
      outlineColor: '#d5f7ff',
      note: 'Lower support shelf that ties the destination to a grounded service-access surface.',
    },
  ],
  paths: [
    {
      id: 'endpoint-alpha-corridor-landing',
      label: 'Corridor landing spine',
      kind: 'corridor-landing',
      points: [
        { eastM: -1760, northM: 1640 },
        { eastM: -1120, northM: 980 },
        { eastM: -620, northM: 260 },
        { eastM: -280, northM: -180 },
      ],
      widthM: 8,
      heightOffsetM: 20,
      color: '#ffbf69',
      note: 'Service-linked arrival line that descends from the AOI shoulder into the landing terrace.',
    },
    {
      id: 'endpoint-alpha-ridge-traverse',
      label: 'Ridge traverse',
      kind: 'ridge-traverse',
      points: [
        { eastM: -280, northM: -180 },
        { eastM: 180, northM: 140 },
        { eastM: 760, northM: 610 },
        { eastM: 1340, northM: 980 },
      ],
      widthM: 5,
      heightOffsetM: 12,
      color: '#8ed2ff',
      note: 'Bounded traverse that connects the service terrace to the corridor lookout ridge.',
    },
    {
      id: 'endpoint-alpha-service-access',
      label: 'Support access track',
      kind: 'service-access',
      points: [
        { eastM: -280, northM: -180 },
        { eastM: 150, northM: -430 },
        { eastM: 510, northM: -760 },
        { eastM: 860, northM: -1020 },
      ],
      widthM: 5,
      heightOffsetM: 10,
      color: '#7bdff2',
      note: 'Service access line that keeps the support shelf visually tied back to the landing terrace.',
    },
  ],
  placeNarrative: {
    placeLabel: 'Asia Service Site',
    placeSummary:
      'One corridor-linked landing terrace now sits inside a bounded official Taipei building-and-sidewalk context, so local mode reads as one service-linked destination rather than exposed terrain alone.',
    terrainSummary:
      'The same offline AOI still keeps the support shelf, landing terrace, and ridge lookout inside one 8.4 km hillside basin with 465 m of relief, while a lazy-loaded official place-context clip strengthens site-scale credibility around the core landing area.',
    featureLabels: ['Official buildings', 'Painted sidewalks', 'Contour terrain relief'],
  },
  officialPlaceContext: {
    assetPath: '/assets/local-context/endpoint-alpha-taipei-official-place-context-v1.json',
    sourceLabel: 'Official Taipei building footprints and painted sidewalks',
    buildingCount: 94,
    sidewalkCount: 47,
  },
};

const offlineLocalContextPacks = [endpointAlphaLocalContextPack] as const;

export function getOfflineLocalContextPack(aoiId: string) {
  return offlineLocalContextPacks.find((pack) => pack.id === aoiId) ?? null;
}

export function getPrimaryServiceSiteAnchor(pack: LocalContextAoiPack) {
  return pack.anchors.find((anchor) => anchor.role === 'endpoint-site') ?? pack.anchors[0] ?? null;
}

export function getServiceSiteArrivalRegion(pack: LocalContextAoiPack) {
  const primaryAnchor = getPrimaryServiceSiteAnchor(pack);

  if (!primaryAnchor) {
    return null;
  }

  const secondaryAnchors = pack.anchors.filter((anchor) => anchor.id !== primaryAnchor.id);
  const maxEastReachM = secondaryAnchors.reduce((maxReachM, anchor) => {
    return Math.max(maxReachM, Math.abs(anchor.eastM - primaryAnchor.eastM));
  }, pack.halfExtentM * 0.22);
  const maxNorthReachM = secondaryAnchors.reduce((maxReachM, anchor) => {
    return Math.max(maxReachM, Math.abs(anchor.northM - primaryAnchor.northM));
  }, pack.halfExtentM * 0.18);

  return {
    halfWidthM: Math.min(pack.halfExtentM * 0.78, maxEastReachM + 620),
    halfHeightM: Math.min(pack.halfExtentM * 0.68, maxNorthReachM + 540),
  };
}
