import type { EarthTextureSet } from '../imagery/provider';

// ---------------------------------------------------------------------------
// Layer 2 contract: Shared focus-detail region
// ---------------------------------------------------------------------------

/**
 * Contract for a bounded focus-detail region on the home globe.
 *
 * Both offline and API modes share this shape. Offline mode must prove
 * the real shared ceiling first; API mode may later source it differently
 * but through the same contract.
 *
 * Round 1 establishes the contract. Round 3 provides the first real
 * offline-first implementation.
 */
export interface HomeGlobeSharedFocusDetail {
  /** Geographic center of the bounded focus region. */
  center: { latDeg: number; lonDeg: number };
  /** Bounded extent from center. */
  extent: { halfWidthM: number; halfHeightM: number };
  /** What detail is currently resolved. */
  detailKind: 'none' | 'offline-asset' | 'shared-runtime';
  /** Human-readable region label for the focus area. */
  regionLabel: string;
  /** Traceable source identifier (e.g. provider or asset pack ID). */
  sourceId: string;
}

// ---------------------------------------------------------------------------
// Three-layer home-globe payload
// ---------------------------------------------------------------------------

/**
 * The three-layer home-globe capability payload.
 *
 * Layer 1 — earthBaseline:      globe-wide minimum surface (EarthTextureSet).
 * Layer 2 — sharedFocusDetail:  bounded focus region shared across modes.
 * Layer 3 — (reserved):         API-only enhancement, not yet approved.
 *
 * EarthTextureSet remains the right contract for Layer 1.
 * This payload makes explicit that it is not the only long-term contract
 * for the home globe.
 *
 * @see estnet-globe-viewer-home-globe-staged-uplift-sdd-v1.md §Contract Direction
 */
export interface HomeGlobePayload {
  /** Layer 1: Common globe-wide minimum surface for both offline and API modes. */
  earthBaseline: EarthTextureSet | null;

  /** Layer 2: Bounded shared focus-detail region. null when not yet resolved. */
  sharedFocusDetail: HomeGlobeSharedFocusDetail | null;

  // Layer 3 (reserved): API-only enhancement.
  // When a later bounded decision approves HG4, extend this interface:
  //   apiEnhancement?: HomeGlobeApiEnhancement;
  // Do not overload earthBaseline or sharedFocusDetail with API-only fidelity.
}

// ---------------------------------------------------------------------------
// Payload resolver
// ---------------------------------------------------------------------------

/**
 * Builds the current HomeGlobePayload from the resolved Earth texture state.
 *
 * In this round sharedFocusDetail is always null — the contract boundary
 * exists but no focus-detail data is resolved yet. Round 3 will provide
 * the first real offline-first implementation.
 */
export function resolveHomeGlobePayload(
  earthTextures: EarthTextureSet | null,
): HomeGlobePayload {
  return {
    earthBaseline: earthTextures,
    sharedFocusDetail: null,
  };
}
