import type { CSSProperties } from 'react';
import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { HeroGlobeScene, type HeroGlobeFramingRequest } from './components/globe/HeroGlobeScene';
import type { FramingMode } from './components/globe/corridorFraming';
import { offlineEarthImageryProvider } from './imagery/offlineEarthImageryProvider';
import { useEarthTextures } from './imagery/useEarthTextures';
import { endpointAlphaLocalContextPack, getOfflineLocalContextPack } from './localContext/offlineAoiPacks';
import { parseViewerRouteHash, syncViewerRouteHash, type ViewerRoute } from './localContext/routes';
import { getTerrainCapabilityReport } from './localContext/terrainCapability';
import { mockTruthProvider } from './mock/mockTruthProvider';
import type { DatasetCapabilityProfile } from './truth/contracts';
import { useTruthSnapshot } from './truth/useTruthSnapshot';

interface ReturnEchoState {
  aoiId: string;
  revision: number;
}

const completedScope = [
  'Approved NASA day and night runtime derivatives through the existing imagery seam',
  'Approved NASA GSFC Blue Marble cloud derivative through the same governance path',
  'Day-night Earth shader v1 with a controlled terminator and restrained twilight band',
  'Restrained ocean/specular treatment and Earth grading pass using the same approved day/night/cloud baseline',
  'Restrained cloud shell layered between the Earth surface and atmosphere',
  'Restrained procedural atmosphere shell that continues to add depth without becoming a cloud substitute',
  'Corridor-aware first screen with explicit Home and Fit Corridor framing actions',
  'One bounded offline local-context vertical slice tied to Endpoint Alpha through a route-level full-screen takeover',
  'AOI-centered local camera with bounded inspection, explicit Reset Local View, and Back to Globe return grammar',
  'Visible corridor-linked continuity layer for globe discoverability, scale handoff, and return echo',
  'Natural zoom range from whole-globe read to closer corridor inspection',
  'In-scene endpoint labels and clearer endpoint / relay / corridor hierarchy',
  'Reduced persistent overlay with more detail pushed down into the drawer',
  'Mock truth scene and overlays still reading the same canonical snapshot',
];

const deferredScope = [
  'Bloom follow-on',
  'estnet-bootstrap-kit reference replay smoke',
  'Additional AOI packs and local-to-local switching',
  'Buildings or photogrammetry as local-context enrichment',
  'Premium world context beyond the offline AOI pack baseline',
  'Producer-backed event truth and handover cause',
];

function capabilityEntries(capabilities: DatasetCapabilityProfile) {
  return [
    ['Global positions', capabilities.supportsGlobalPositions],
    ['Path availability', capabilities.supportsPathAvailability],
    ['Active path', capabilities.supportsActivePath],
    ['Derived events', capabilities.supportsDerivedEvents],
    ['Producer events', capabilities.supportsProducerEvents],
    ['Context 3D tiles hints', capabilities.supportsContext3DTilesHints],
    ['Site asset anchors', capabilities.supportsSiteAssetAnchors],
  ] as const;
}

function formatCorridorLabel(
  endpointIds: [string, string],
  relaySatelliteIds: string[],
  labels: {
    endpoint: Map<string, string>;
    satellite: Map<string, string>;
  }
) {
  return [
    labels.endpoint.get(endpointIds[0]) ?? endpointIds[0],
    ...relaySatelliteIds.map((relayId) => labels.satellite.get(relayId) ?? relayId),
    labels.endpoint.get(endpointIds[1]) ?? endpointIds[1],
  ].join(' -> ');
}

function buildCurrentEndpointPairLabel(
  endpointLabels: Map<string, string>,
  endpointIds: [string, string] | null
) {
  if (!endpointIds) {
    return 'Endpoint pair unavailable';
  }

  return endpointIds
    .map((endpointId) => endpointLabels.get(endpointId) ?? endpointId)
    .join(' / ');
}

const LocalContextStage = lazy(async () => {
  const module = await import('./localContext/LocalContextStage');

  return {
    default: module.LocalContextStage,
  };
});

function getLocalEntryState(params: {
  currentRoute: ViewerRoute;
  activeEndpointIds: [string, string] | null;
}) {
  const pack = getOfflineLocalContextPack(endpointAlphaLocalContextPack.id);

  if (!pack) {
    return {
      pack: null,
      available: false,
      reason: 'No offline AOI pack is installed for the current local target.',
      routeIsValid: params.currentRoute.kind === 'globe',
    };
  }

  if (!params.activeEndpointIds) {
    return {
      pack,
      available: false,
      reason: 'Local inspection stays hidden until a current service corridor is available.',
      routeIsValid: params.currentRoute.kind === 'globe',
    };
  }

  if (!params.activeEndpointIds.includes(pack.endpointId)) {
    return {
      pack,
      available: false,
      reason: 'The current service story does not expose an AOI-capable local target.',
      routeIsValid: params.currentRoute.kind === 'globe',
    };
  }

  const terrainCapability = getTerrainCapabilityReport(pack);

  if (!terrainCapability.capable) {
    return {
      pack,
      available: false,
      reason: terrainCapability.reason,
      routeIsValid: params.currentRoute.kind === 'globe',
    };
  }

  if (params.currentRoute.kind === 'local' && params.currentRoute.aoiId !== pack.id) {
    return {
      pack,
      available: true,
      reason: '',
      routeIsValid: false,
    };
  }

  return {
    pack,
    available: true,
    reason: '',
    routeIsValid: true,
  };
}

export function App() {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [returnEcho, setReturnEcho] = useState<ReturnEchoState | null>(null);
  const [viewerRoute, setViewerRoute] = useState<ViewerRoute>(() => {
    if (typeof window === 'undefined') {
      return { kind: 'globe' };
    }

    return parseViewerRouteHash(window.location.hash);
  });
  const [framingRequest, setFramingRequest] = useState<HeroGlobeFramingRequest>({
    mode: 'home',
    revision: 0,
  });
  const truthSnapshot = useTruthSnapshot(mockTruthProvider);
  const earthTextures = useEarthTextures(offlineEarthImageryProvider);
  const capabilityRows = capabilityEntries(truthSnapshot.capabilityProfile);
  const endpointLabels = new Map(truthSnapshot.worldGeometry.endpoints.map((endpoint) => [endpoint.id, endpoint.label]));
  const satelliteLabels = new Map(truthSnapshot.worldGeometry.satellites.map((satellite) => [satellite.id, satellite.label]));
  const activeEndpointIds =
    truthSnapshot.serviceSelection.kind === 'supported'
      ? truthSnapshot.serviceSelection.activePath?.endpointIds ?? null
      : null;
  const currentCorridorLabel =
    truthSnapshot.serviceSelection.kind === 'supported' && truthSnapshot.serviceSelection.activePath
      ? formatCorridorLabel(
          truthSnapshot.serviceSelection.activePath.endpointIds,
          truthSnapshot.serviceSelection.activePath.relaySatelliteIds,
          {
            endpoint: endpointLabels,
            satellite: satelliteLabels,
          }
        )
      : 'No current visible relay path';
  const availabilityLabel =
    truthSnapshot.serviceAvailability.kind === 'supported'
      ? truthSnapshot.serviceAvailability.currentAvailability
      : 'unsupported';
  const availabilityTone =
    availabilityLabel === 'available'
      ? 'available'
      : availabilityLabel === 'unavailable'
        ? 'unavailable'
        : 'unsupported';
  const currentEndpointPairLabel = buildCurrentEndpointPairLabel(endpointLabels, activeEndpointIds);
  const currentRelayLabel =
    truthSnapshot.serviceSelection.kind === 'supported' && truthSnapshot.serviceSelection.activePath
      ? truthSnapshot.serviceSelection.activePath.relaySatelliteIds
          .map((relayId) => satelliteLabels.get(relayId) ?? relayId)
          .join(', ')
      : 'No selected relay';
  const localEntryState = useMemo(
    () =>
      getLocalEntryState({
        currentRoute: viewerRoute,
        activeEndpointIds,
      }),
    [activeEndpointIds, viewerRoute]
  );
  const showsReturnEcho =
    viewerRoute.kind === 'globe' &&
    Boolean(localEntryState.pack && returnEcho?.aoiId === localEntryState.pack.id);
  const globeLocalInspectCue =
    localEntryState.available && localEntryState.pack
      ? {
          endpointId: localEntryState.pack.endpointId,
          targetLabel: localEntryState.pack.targetLabel,
          regionLabel: localEntryState.pack.regionLabel,
          state: showsReturnEcho ? ('echo' as const) : ('discoverable' as const),
        }
      : null;
  const localEntryEyebrow = showsReturnEcho ? 'Return Echo' : 'Corridor-Linked AOI';
  const localEntryActionLabel = showsReturnEcho ? 'Inspect Again' : 'Inspect Local Context';
  const localEntryReason = !localEntryState.available
    ? localEntryState.reason
    : showsReturnEcho
      ? 'Recently inspected local context is now re-identified on the home globe and tied back to the current corridor.'
      : 'The current service corridor exposes one bounded offline AOI that can be inspected through a route-level local takeover.';
  const conservativeBoundaries = [
    'The activePath wording remains limited to current service corridor / current active relay path / current visible relay path.',
    'The unavailable candidate corridor is still mock availability truth, not KPI, SLA, or coverage-field truth.',
    'Dark-side readability now comes from a controlled day/night shader and approved Black Marble night lights, not from washing the whole globe with ambient fill.',
    'Home and Fit Corridor still stay globe-centered. The cloud shell does not reopen generic free pan or free-fly camera drift.',
    'Ocean/specular and grading stay restrained and texture-backed. This commit uses the same approved day/night/cloud assets and does not add bloom, weather animation, new runtime Earth assets, or a larger planet-rendering stack.',
    'The first local-context slice is still tied to one AOI-capable service target. It does not open arbitrary click-anywhere descent or multi-AOI browsing.',
    'Local mode only counts as available when the offline AOI pack passes structural terrain validation for grid presence, shape, spacing, and non-flat relief. If that gate fails, local entry stays disabled rather than faked.',
    truthSnapshot.eventTruth.events.length === 0
      ? 'EventTruth remains a derived-only surface with an intentionally empty event set in this static baseline.'
      : `EventTruth contains ${truthSnapshot.eventTruth.events.length} derived cues.`,
    'estnet-bootstrap-kit is still not connected. It remains a later reference producer integration step.',
  ];
  const candidatePaths =
    truthSnapshot.serviceAvailability.kind === 'supported'
      ? truthSnapshot.serviceAvailability.candidatePaths.map((candidate) => ({
          id: candidate.id,
          state: candidate.state,
          label: formatCorridorLabel(candidate.endpointIds, candidate.relaySatelliteIds, {
            endpoint: endpointLabels,
            satellite: satelliteLabels,
          }),
        }))
      : [];
  const earthImageryAvailability =
    earthTextures?.availability === 'approved-runtime' &&
    earthTextures.dayTextureUrl &&
    earthTextures.nightTextureUrl
      ? 'approved-runtime'
      : 'none-approved';
  const cloudShellStatus = earthTextures?.cloudTextureUrl ? 'approved-runtime' : 'not-approved';
  const earthSurfaceMode =
    earthImageryAvailability === 'approved-runtime'
      ? earthTextures?.cloudTextureUrl
        ? 'Day-night Earth shader v1 + restrained grading/specular + cloud shell + atmosphere'
        : 'Day-night Earth shader v1 + restrained atmosphere'
      : earthTextures?.dayTextureUrl
        ? 'Step 1 day-only fallback surface'
        : 'Placeholder globe fallback';
  const earthSurfaceNote =
    earthTextures?.note ??
    'No Earth imagery seam state is available. The placeholder globe should remain the only runtime surface.';

  const setFramingMode = (mode: FramingMode) => {
    setFramingRequest((current) => ({
      mode,
      revision: current.revision + 1,
    }));
  };

  const enterLocalContext = () => {
    if (!localEntryState.available || !localEntryState.pack) {
      return;
    }

    setReturnEcho(null);
    setDetailsOpen(false);
    syncViewerRouteHash({
      kind: 'local',
      aoiId: localEntryState.pack.id,
    });
  };

  const returnToGlobe = () => {
    if (localEntryState.pack) {
      setReturnEcho({
        aoiId: localEntryState.pack.id,
        revision: Date.now(),
      });
    }

    setFramingMode('fit-corridor');
    syncViewerRouteHash({ kind: 'globe' });
  };

  useEffect(() => {
    const handleHashChange = () => {
      setViewerRoute(parseViewerRouteHash(window.location.hash));
    };

    window.addEventListener('hashchange', handleHashChange);

    if (!window.location.hash) {
      syncViewerRouteHash({ kind: 'globe' });
    }

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  useEffect(() => {
    if (viewerRoute.kind === 'local' && (!localEntryState.available || !localEntryState.routeIsValid)) {
      syncViewerRouteHash({ kind: 'globe' });
    }
  }, [localEntryState.available, localEntryState.routeIsValid, viewerRoute.kind]);

  useEffect(() => {
    if (!returnEcho || viewerRoute.kind !== 'globe') {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setReturnEcho((current) => (current?.revision === returnEcho.revision ? null : current));
    }, 10_000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [returnEcho, viewerRoute.kind]);

  if (viewerRoute.kind === 'local' && localEntryState.available && localEntryState.pack) {
    return (
      <div className="viewer-shell">
        <Suspense
          fallback={
            <div className="viewer-stage viewer-stage--local viewer-stage--loading">
              <div className="local-context-scene local-context-scene--loading">
                <p className="local-context-scene__status">Loading local context...</p>
              </div>
            </div>
          }
        >
          <LocalContextStage
            pack={localEntryState.pack}
            availabilityLabel={availabilityLabel}
            availabilityTone={availabilityTone}
            currentCorridorLabel={currentCorridorLabel}
            endpointPairLabel={currentEndpointPairLabel}
            relayLabel={currentRelayLabel}
            onBackToGlobe={returnToGlobe}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="viewer-shell">
      <div className="viewer-stage">
        <HeroGlobeScene
          earthTextures={earthTextures}
          framingRequest={framingRequest}
          localInspectCue={globeLocalInspectCue}
          worldGeometry={truthSnapshot.worldGeometry}
          serviceAvailability={truthSnapshot.serviceAvailability}
          serviceSelection={truthSnapshot.serviceSelection}
        />
      </div>

      <div className="viewer-overlay">
        <header className="floating-card hero-overlay">
          <p className="floating-card__eyebrow">Service-Driven Hero Globe</p>
          <p className="hero-overlay__summary">
            Two distant endpoints, one current relay corridor.
          </p>
        </header>

        <section
          className="floating-card top-hud"
          aria-label="Current service controls"
        >
          <div className="scene-status">
            <p className="floating-card__eyebrow">Current Service</p>
            <div className="scene-status__row">
              <span className={`availability-pill availability-pill--${availabilityTone}`}>
                {availabilityLabel}
              </span>
              <p className="scene-status__path">{currentCorridorLabel}</p>
            </div>
          </div>

          <div className="local-entry">
            <p className="floating-card__eyebrow">{localEntryEyebrow}</p>
            <div
              className="continuity-trail"
              aria-label="Globe discoverability continuity"
            >
              <span className="continuity-chip continuity-chip--globe">Current corridor</span>
              <span className="continuity-trail__arrow">-&gt;</span>
              <span className={`continuity-chip ${showsReturnEcho ? 'continuity-chip--echo' : 'continuity-chip--local'}`}>
                {showsReturnEcho ? 'Recently inspected AOI' : 'Local inspectable site'}
              </span>
            </div>
            <p className="local-entry__target">
              {localEntryState.pack?.targetLabel ?? 'No local target ready'}
            </p>
            {localEntryState.pack ? (
              <p className="local-entry__pair">
                {currentEndpointPairLabel}
                {' | '}
                {localEntryState.pack.regionLabel}
              </p>
            ) : null}
            <button
              type="button"
              className="scene-action local-entry__action"
              disabled={!localEntryState.available}
              onClick={enterLocalContext}
              title={localEntryState.available ? 'Open the bounded local-context scene' : localEntryState.reason}
            >
              {localEntryActionLabel}
            </button>
            <p className="local-entry__reason">{localEntryReason}</p>
          </div>

          <div className="scene-actions">
            <button
              type="button"
              className={`scene-action ${framingRequest.mode === 'home' ? 'scene-action--active' : ''}`}
              onClick={() => setFramingMode('home')}
            >
              Home
            </button>
            <button
              type="button"
              className={`scene-action ${framingRequest.mode === 'fit-corridor' ? 'scene-action--active' : ''}`}
              onClick={() => setFramingMode('fit-corridor')}
            >
              Fit Corridor
            </button>
            <button
              type="button"
              className="details-toggle"
              onClick={() => setDetailsOpen((current) => !current)}
              aria-expanded={detailsOpen}
              aria-controls="truth-drawer"
            >
              {detailsOpen ? 'Hide Details' : 'Open Details'}
            </button>
          </div>
        </section>

        {showsReturnEcho && localEntryState.pack ? (
          <section
            className="floating-card continuity-echo"
            aria-label="Return echo"
          >
            <p className="floating-card__eyebrow">Return Echo</p>
            <div className="continuity-trail continuity-trail--echo">
              <span className="continuity-chip continuity-chip--local">Local inspect</span>
              <span className="continuity-trail__arrow">-&gt;</span>
              <span className="continuity-chip continuity-chip--globe">Globe corridor</span>
            </div>
            <p className="continuity-echo__title">{localEntryState.pack.targetLabel}</p>
            <p className="continuity-echo__copy">
              Re-linked to {currentCorridorLabel} after the local inspection return.
            </p>
          </section>
        ) : null}

        <section className="legend-overlay" aria-label="Scene legend">
          <span className="scene-legend scene-legend--active">Current corridor</span>
          <span className="scene-legend scene-legend--unavailable">Unavailable candidate</span>
        </section>

        <aside
          id="truth-drawer"
          className={`truth-drawer ${detailsOpen ? 'truth-drawer--open' : ''}`}
        >
          <div className="truth-drawer__surface">
            <div className="truth-drawer__header">
              <div>
                <p className="floating-card__eyebrow">On-Demand Overlay</p>
                <h2 className="truth-drawer__title">Truth, Corridor, and Earth Surface</h2>
              </div>
              <button
                type="button"
                className="truth-drawer__close"
                onClick={() => setDetailsOpen(false)}
              >
                Close
              </button>
            </div>

            <section className="drawer-section">
              <p className="floating-card__eyebrow">Truth Snapshot</p>
              <dl className="status-facts">
                <div className="status-facts__row">
                  <dt>Provider</dt>
                  <dd>{mockTruthProvider.providerId}</dd>
                </div>
                <div className="status-facts__row">
                  <dt>Kind</dt>
                  <dd>{mockTruthProvider.providerKind}</dd>
                </div>
                <div className="status-facts__row">
                  <dt>Dataset</dt>
                  <dd>{truthSnapshot.datasetId}</dd>
                </div>
                <div className="status-facts__row">
                  <dt>Service-relevant satellites</dt>
                  <dd>{truthSnapshot.worldGeometry.satellites.length}</dd>
                </div>
              </dl>
            </section>

            <section className="drawer-section">
              <p className="floating-card__eyebrow">Earth Surface Boundary</p>
              <dl className="status-facts">
                <div className="status-facts__row">
                  <dt>Provider</dt>
                  <dd>{offlineEarthImageryProvider.providerId}</dd>
                </div>
                <div className="status-facts__row">
                  <dt>Kind</dt>
                  <dd>{offlineEarthImageryProvider.providerKind}</dd>
                </div>
                <div className="status-facts__row">
                  <dt>Availability</dt>
                  <dd>{earthImageryAvailability}</dd>
                </div>
                <div className="status-facts__row">
                  <dt>Surface</dt>
                  <dd>{earthSurfaceMode}</dd>
                </div>
                <div className="status-facts__row">
                  <dt>Day asset</dt>
                  <dd>{earthTextures?.dayAssetId ?? 'none-approved'}</dd>
                </div>
                <div className="status-facts__row">
                  <dt>Night asset</dt>
                  <dd>{earthTextures?.nightAssetId ?? 'none-approved'}</dd>
                </div>
                <div className="status-facts__row">
                  <dt>Cloud asset</dt>
                  <dd>{earthTextures?.cloudAssetId ?? 'none-approved'}</dd>
                </div>
                <div className="status-facts__row">
                  <dt>Appearance profile</dt>
                  <dd>{earthTextures?.appearanceProfileId ?? 'offline-balanced-v3'}</dd>
                </div>
                <div className="status-facts__row">
                  <dt>Texture quality</dt>
                  <dd>{earthTextures?.textureQuality ?? 'runtime-4k-webp'}</dd>
                </div>
                <div className="status-facts__row">
                  <dt>Cloud shell</dt>
                  <dd>{cloudShellStatus}</dd>
                </div>
                <div className="status-facts__row">
                  <dt>Ocean/specular</dt>
                  <dd>restrained-appearance-pass</dd>
                </div>
                <div className="status-facts__row">
                  <dt>Governance doc</dt>
                  <dd>{earthTextures?.governanceDocPath ?? 'docs/assets/earth-assets.md'}</dd>
                </div>
              </dl>
              <p className="drawer-copy">{earthSurfaceNote}</p>
            </section>

            <section className="drawer-section">
              <p className="floating-card__eyebrow">Included Now</p>
              <ul className="status-list">
                {completedScope.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="drawer-section">
              <p className="floating-card__eyebrow">Intentionally Deferred</p>
              <ul className="status-list status-list--muted">
                {deferredScope.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="drawer-section">
              <p className="floating-card__eyebrow">Capability Profile</p>
              <div className="capability-grid">
                {capabilityRows.map(([label, supported]) => (
                  <div
                    key={label}
                    className={`capability-pill ${supported ? 'capability-pill--supported' : 'capability-pill--unsupported'}`}
                  >
                    <span>{label}</span>
                    <strong>{supported ? 'supported' : 'unsupported'}</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="drawer-section">
              <p className="floating-card__eyebrow">Candidate Corridor Availability</p>
              <div className="candidate-cards">
                {candidatePaths.map((candidate) => (
                  <article
                    key={candidate.id}
                    className={`candidate-card candidate-card--${candidate.state}`}
                  >
                    <p className="candidate-card__state">{candidate.state}</p>
                    <p className="candidate-card__label">{candidate.label}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="drawer-section">
              <p className="floating-card__eyebrow">Conservative Boundaries</p>
              <ul className="status-list status-list--muted">
                {conservativeBoundaries.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="drawer-section">
              <p className="floating-card__eyebrow">WorldGeometryTruth Endpoints</p>
              <div className="endpoint-cards">
                {truthSnapshot.worldGeometry.endpoints.map((endpoint) => (
                  <article
                    key={endpoint.id}
                    className="endpoint-card"
                    style={{ '--endpoint-accent': endpoint.accentColor } as CSSProperties}
                  >
                    <p className="endpoint-card__label">{endpoint.label}</p>
                    <p className="endpoint-card__region">{endpoint.regionLabel}</p>
                    <p className="endpoint-card__coords">
                      {endpoint.position.latitudeDeg.toFixed(1)}°, {endpoint.position.longitudeDeg.toFixed(1)}°
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section className="drawer-section">
              <p className="floating-card__eyebrow">WorldGeometryTruth Satellites</p>
              <div className="endpoint-cards">
                {truthSnapshot.worldGeometry.satellites.map((satellite) => (
                  <article
                    key={satellite.id}
                    className="endpoint-card"
                  >
                    <p className="endpoint-card__label">{satellite.label}</p>
                    <p className="endpoint-card__region">Service-relevant satellite</p>
                    <p className="endpoint-card__coords">
                      {satellite.position.latitudeDeg.toFixed(1)}°, {satellite.position.longitudeDeg.toFixed(1)}°
                      {' | '}
                      {satellite.position.altitudeKm?.toFixed(0) ?? '0'} km
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </aside>
      </div>
    </div>
  );
}
