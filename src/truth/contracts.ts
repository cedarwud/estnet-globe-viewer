export interface GeoCoordinate {
  latitudeDeg: number;
  longitudeDeg: number;
  altitudeKm: number | null;
}

export interface EndpointGeometryTruth {
  id: string;
  label: string;
  regionLabel: string;
  accentColor: string;
  position: GeoCoordinate;
}

export interface SatelliteGeometryTruth {
  id: string;
  label: string;
  position: GeoCoordinate;
}

export interface WorldGeometryTruth {
  coordinateFrame: 'wgs84';
  endpoints: EndpointGeometryTruth[];
  satellites: SatelliteGeometryTruth[];
}

export interface CandidatePathAvailabilityTruth {
  id: string;
  endpointIds: [string, string];
  relaySatelliteIds: string[];
  state: 'available' | 'unavailable';
}

export type ServiceAvailabilityTruth =
  | {
      kind: 'unsupported';
      reason: string;
      currentAvailability: null;
      candidatePaths: [];
    }
  | {
      kind: 'supported';
      currentAvailability: 'available' | 'unavailable';
      candidatePaths: CandidatePathAvailabilityTruth[];
    };

export interface ActivePathTruth {
  endpointIds: [string, string];
  relaySatelliteIds: string[];
}

export type ServiceSelectionTruth =
  | {
      kind: 'unsupported';
      reason: string;
      activePath: null;
      selectedRelayId: null;
    }
  | {
      kind: 'supported';
      activePath: ActivePathTruth | null;
      selectedRelayId: string | null;
    };

export interface DerivedEventTruth {
  id: string;
  source: 'derived';
  eventType: 'path-change-cue';
  label: string;
  simTimeSec: number;
  detail?: string;
}

export interface EventTruth {
  // V1 keeps event truth viewer-derived only. Producer-backed event truth is a later phase.
  source: 'derived';
  producerBacked: false;
  events: DerivedEventTruth[];
}

export interface DatasetCapabilityProfile {
  supportsGlobalPositions: boolean;
  supportsPathAvailability: boolean;
  supportsActivePath: boolean;
  supportsDerivedEvents: boolean;
  supportsProducerEvents: boolean;
  supportsContext3DTilesHints: boolean;
  supportsSiteAssetAnchors: boolean;
}

export interface CanonicalTruthSnapshot {
  datasetId: string;
  datasetLabel: string;
  summary: string;
  worldGeometry: WorldGeometryTruth;
  serviceAvailability: ServiceAvailabilityTruth;
  serviceSelection: ServiceSelectionTruth;
  eventTruth: EventTruth;
  capabilityProfile: DatasetCapabilityProfile;
}
