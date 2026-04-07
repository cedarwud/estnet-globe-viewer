export interface MockEndpointSeed {
  id: string;
  label: string;
  locationHint: string;
  latDeg: number;
  lonDeg: number;
  accentHex: string;
}

export interface MockTruthSeed {
  datasetId: string;
  datasetLabel: string;
  summary: string;
  worldEndpoints: MockEndpointSeed[];
}

export const mockTruthSeed: MockTruthSeed = {
  datasetId: 'offline-shell-baseline-v1',
  datasetLabel: 'Offline shell mock truth',
  summary: 'In-memory mock source that only provides global endpoint geometry for the offline hero globe baseline.',
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
};
