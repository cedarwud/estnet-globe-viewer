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

export const mockTruthSeed: MockTruthSeed = {
  datasetId: 'offline-service-corridor-baseline-v1',
  datasetLabel: 'Offline service corridor mock truth',
  summary: 'In-memory mock source that provides one current service corridor and one unavailable candidate corridor for the offline hero globe baseline.',
  worldEndpoints: [
    {
      id: 'endpoint-alpha',
      label: 'Endpoint Alpha',
      locationHint: 'East Asia placeholder',
      latDeg: 25.033,
      lonDeg: 121.5654,
      accentHex: '#ffbf69',
    },
    {
      id: 'endpoint-bravo',
      label: 'Endpoint Bravo',
      locationHint: 'Europe placeholder',
      latDeg: 48.8566,
      lonDeg: 2.3522,
      accentHex: '#7bdff2',
    },
  ],
  worldSatellites: [
    {
      id: 'relay-aurora-07',
      label: 'Relay Aurora-07',
      latDeg: 52,
      lonDeg: 72,
      altitudeKm: 620,
    },
    {
      id: 'relay-nimbus-03',
      label: 'Relay Nimbus-03',
      latDeg: 30,
      lonDeg: 44,
      altitudeKm: 680,
    },
  ],
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
