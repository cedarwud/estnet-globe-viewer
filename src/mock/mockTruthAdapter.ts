import type {
  CanonicalTruthSnapshot,
  DatasetCapabilityProfile,
  EventTruth,
  ServiceAvailabilityTruth,
  ServiceSelectionTruth,
  WorldGeometryTruth,
} from '../truth/contracts';
import type { MockTruthSeed } from './mockTruthSeed';

function buildCapabilityProfile(): DatasetCapabilityProfile {
  return {
    supportsGlobalPositions: true,
    supportsPathAvailability: false,
    supportsActivePath: false,
    supportsDerivedEvents: false,
    supportsProducerEvents: false,
    supportsContext3DTilesHints: false,
    supportsSiteAssetAnchors: false,
  };
}

function buildWorldGeometryTruth(seed: MockTruthSeed): WorldGeometryTruth {
  return {
    coordinateFrame: 'wgs84',
    endpoints: seed.worldEndpoints.map((endpoint) => ({
      id: endpoint.id,
      label: endpoint.label,
      regionLabel: endpoint.locationHint,
      accentColor: endpoint.accentHex,
      position: {
        latitudeDeg: endpoint.latDeg,
        longitudeDeg: endpoint.lonDeg,
        altitudeKm: null,
      },
    })),
    satellites: [],
  };
}

function buildUnsupportedAvailabilityTruth(): ServiceAvailabilityTruth {
  return {
    kind: 'unsupported',
    reason: 'Mock truth baseline does not claim path availability or availability envelope inputs yet.',
    currentAvailability: null,
    candidatePaths: [],
  };
}

function buildUnsupportedSelectionTruth(): ServiceSelectionTruth {
  return {
    kind: 'unsupported',
    reason: 'Mock truth baseline does not claim an active path or selected relay yet.',
    activePath: null,
    selectedRelayId: null,
  };
}

function buildEmptyDerivedEventTruth(): EventTruth {
  return {
    source: 'derived',
    producerBacked: false,
    events: [],
  };
}

export function adaptMockTruthSeed(seed: MockTruthSeed): CanonicalTruthSnapshot {
  return {
    datasetId: seed.datasetId,
    datasetLabel: seed.datasetLabel,
    summary: seed.summary,
    worldGeometry: buildWorldGeometryTruth(seed),
    // Availability and selection stay explicitly unsupported here so the UI cannot imply
    // corridor or routing truth before the next milestone actually implements it.
    serviceAvailability: buildUnsupportedAvailabilityTruth(),
    serviceSelection: buildUnsupportedSelectionTruth(),
    eventTruth: buildEmptyDerivedEventTruth(),
    capabilityProfile: buildCapabilityProfile(),
  };
}
