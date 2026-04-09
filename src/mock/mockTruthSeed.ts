export interface MockEndpointSeed {
  id: string;
  label: string;
  locationHint: string;
  latDeg: number;
  lonDeg: number;
  accentHex: string;
}

export interface MockSatelliteSeed {
  id: string;
  label: string;
  latDeg: number;
  lonDeg: number;
  altitudeKm: number;
}

export interface MockCandidatePathSeed {
  id: string;
  endpointIds: [string, string];
  relaySatelliteIds: string[];
  state: 'available' | 'unavailable';
}

export interface MockActivePathSeed {
  endpointIds: [string, string];
  relaySatelliteIds: string[];
  selectedRelayId: string;
}

export interface MockTruthSeed {
  datasetId: string;
  datasetLabel: string;
  summary: string;
  worldEndpoints: MockEndpointSeed[];
  worldSatellites: MockSatelliteSeed[];
  currentAvailability: 'available' | 'unavailable';
  candidatePaths: MockCandidatePathSeed[];
  activePath: MockActivePathSeed | null;
}

const homeGlobeServiceRelevantSatellites: MockSatelliteSeed[] = [
  {
    id: 'relay-aurora-01',
    label: 'Relay Aurora-01',
    latDeg: 63,
    lonDeg: -138,
    altitudeKm: 760,
  },
  {
    id: 'relay-aurora-04',
    label: 'Relay Aurora-04',
    latDeg: 41,
    lonDeg: -78,
    altitudeKm: 760,
  },
  {
    id: 'relay-aurora-07',
    label: 'Relay Aurora-07',
    latDeg: 52,
    lonDeg: 72,
    altitudeKm: 760,
  },
  {
    id: 'relay-aurora-10',
    label: 'Relay Aurora-10',
    latDeg: 20,
    lonDeg: 132,
    altitudeKm: 760,
  },
  {
    id: 'relay-aurora-13',
    label: 'Relay Aurora-13',
    latDeg: -14,
    lonDeg: -168,
    altitudeKm: 760,
  },
  {
    id: 'relay-aurora-16',
    label: 'Relay Aurora-16',
    latDeg: -46,
    lonDeg: -108,
    altitudeKm: 760,
  },
  {
    id: 'relay-nimbus-03',
    label: 'Relay Nimbus-03',
    latDeg: 30,
    lonDeg: 44,
    altitudeKm: 760,
  },
  {
    id: 'relay-nimbus-06',
    label: 'Relay Nimbus-06',
    latDeg: 58,
    lonDeg: -18,
    altitudeKm: 760,
  },
  {
    id: 'relay-nimbus-09',
    label: 'Relay Nimbus-09',
    latDeg: 8,
    lonDeg: 104,
    altitudeKm: 760,
  },
  {
    id: 'relay-nimbus-12',
    label: 'Relay Nimbus-12',
    latDeg: -24,
    lonDeg: 164,
    altitudeKm: 760,
  },
  {
    id: 'relay-nimbus-15',
    label: 'Relay Nimbus-15',
    latDeg: -52,
    lonDeg: -136,
    altitudeKm: 760,
  },
  {
    id: 'relay-nimbus-18',
    label: 'Relay Nimbus-18',
    latDeg: -66,
    lonDeg: -76,
    altitudeKm: 760,
  },
  {
    id: 'relay-vector-02',
    label: 'Relay Vector-02',
    latDeg: 46,
    lonDeg: 142,
    altitudeKm: 760,
  },
  {
    id: 'relay-vector-05',
    label: 'Relay Vector-05',
    latDeg: 22,
    lonDeg: -158,
    altitudeKm: 760,
  },
  {
    id: 'relay-vector-08',
    label: 'Relay Vector-08',
    latDeg: -2,
    lonDeg: -98,
    altitudeKm: 760,
  },
  {
    id: 'relay-vector-11',
    label: 'Relay Vector-11',
    latDeg: -26,
    lonDeg: -38,
    altitudeKm: 760,
  },
  {
    id: 'relay-vector-14',
    label: 'Relay Vector-14',
    latDeg: -48,
    lonDeg: 22,
    altitudeKm: 760,
  },
  {
    id: 'relay-vector-17',
    label: 'Relay Vector-17',
    latDeg: -60,
    lonDeg: 82,
    altitudeKm: 760,
  },
];

export const mockTruthSeed: MockTruthSeed = {
  datasetId: 'offline-service-corridor-baseline-v1',
  datasetLabel: 'Offline service corridor mock truth',
  summary: 'In-memory mock source that provides one current service corridor, one unavailable candidate corridor, and an illustrative 18-satellite home-globe relay layer.',
  worldEndpoints: [
    {
      id: 'endpoint-alpha',
      label: 'Asia',
      locationHint: 'East Asia placeholder',
      latDeg: 25.033,
      lonDeg: 121.5654,
      accentHex: '#ffbf69',
    },
    {
      id: 'endpoint-bravo',
      label: 'Europe',
      locationHint: 'Europe placeholder',
      latDeg: 48.8566,
      lonDeg: 2.3522,
      accentHex: '#7bdff2',
    },
  ],
  // Keep the home globe visually legible: the service story still uses one active path
  // and one unavailable candidate path, but the relay layer now shows 18 illustrative satellites.
  worldSatellites: homeGlobeServiceRelevantSatellites,
  currentAvailability: 'available',
  candidatePaths: [
    {
      id: 'corridor-current-aurora',
      endpointIds: ['endpoint-alpha', 'endpoint-bravo'],
      relaySatelliteIds: ['relay-aurora-07'],
      state: 'available',
    },
    {
      id: 'corridor-candidate-nimbus',
      endpointIds: ['endpoint-alpha', 'endpoint-bravo'],
      relaySatelliteIds: ['relay-nimbus-03'],
      state: 'unavailable',
    },
  ],
  activePath: {
    endpointIds: ['endpoint-alpha', 'endpoint-bravo'],
    relaySatelliteIds: ['relay-aurora-07'],
    selectedRelayId: 'relay-aurora-07',
  },
};
