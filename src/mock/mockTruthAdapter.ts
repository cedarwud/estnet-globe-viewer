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
    supportsPathAvailability: true,
    supportsActivePath: true,
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
    satellites: seed.worldSatellites.map((satellite) => ({
      id: satellite.id,
      label: satellite.label,
      position: {
        latitudeDeg: satellite.latDeg,
        longitudeDeg: satellite.lonDeg,
        altitudeKm: satellite.altitudeKm,
      },
    })),
  };
}

function buildServiceAvailabilityTruth(seed: MockTruthSeed): ServiceAvailabilityTruth {
  return {
    kind: 'supported',
    currentAvailability: seed.currentAvailability,
    candidatePaths: seed.candidatePaths.map((path) => ({
      id: path.id,
      endpointIds: path.endpointIds,
      relaySatelliteIds: path.relaySatelliteIds,
      state: path.state,
    })),
  };
}

function buildServiceSelectionTruth(seed: MockTruthSeed): ServiceSelectionTruth {
  return {
    kind: 'supported',
    activePath: seed.activePath
      ? {
          endpointIds: seed.activePath.endpointIds,
          relaySatelliteIds: seed.activePath.relaySatelliteIds,
        }
      : null,
    selectedRelayId: seed.activePath?.selectedRelayId ?? null,
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
    // This baseline only exposes the minimum selection and availability truth needed to draw
    // one current corridor plus one unavailable candidate without implying broader routing truth.
    serviceAvailability: buildServiceAvailabilityTruth(seed),
    serviceSelection: buildServiceSelectionTruth(seed),
    eventTruth: buildEmptyDerivedEventTruth(),
    capabilityProfile: buildCapabilityProfile(),
  };
}
