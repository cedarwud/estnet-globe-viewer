import type { CSSProperties } from 'react';
import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { HeroGlobeScene, type HeroGlobeFramingRequest } from './components/globe/HeroGlobeScene';
import type { FramingMode } from './components/globe/corridorFraming';
import { offlineEarthImageryProvider } from './imagery/offlineEarthImageryProvider';
import { useEarthTextures } from './imagery/useEarthTextures';
import {
  endpointAlphaLocalContextPack,
  getOfflineLocalContextPack,
  getPrimaryServiceSiteAnchor,
  getServiceSiteArrivalRegion,
  type LocalContextAoiPack,
} from './localContext/offlineAoiPacks';
import { parseViewerRouteHash, syncViewerRouteHash, type ViewerRoute } from './localContext/routes';
import { getTerrainCapabilityReport } from './localContext/terrainCapability';
import { mockTruthProvider } from './mock/mockTruthProvider';
import type { DatasetCapabilityProfile } from './truth/contracts';
import { useTruthSnapshot } from './truth/useTruthSnapshot';

interface ReturnEchoState {
  aoiId: string;
  revision: number;
}

const RETURN_ECHO_AUTO_CLEAR_MS = 45_000;

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
  'Phase 3c first-screen product shift with a home-stage service-site spotlight, service-to-site narrative, and compact ground-context preview',
  'Site anchor / site geometry decoupling follow-on with a distinct service-site anchor and restrained corridor-to-site handoff',
  'Arrival-hemisphere composition reset with home-stage framing bias, hemisphere-scaled landing treatment, and stronger terminal approach staging',
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

function formatPreviewAnchorRole(role: LocalContextAoiPack['anchors'][number]['role']) {
  if (role === 'endpoint-site') {
    return 'Site anchor';
  }

  if (role === 'service-lookout') {
    return 'Lookout ridge';
  }

  return 'Support pad';
}

// The home-stage preview uses the offline AOI pack itself so the site feels concrete
// before local entry without eager-loading the local runtime.
function buildGroundPreviewData(pack: LocalContextAoiPack) {
  const width = 240;
  const height = 94;
  const topPadding = 10;
  const bottomPadding = 12;
  const terrainRow = pack.terrain.heightsM[Math.floor(pack.terrain.rows / 2)] ?? [];
  const usableHeight = height - topPadding - bottomPadding;
  const terrainRange = Math.max(1, pack.terrain.maxHeightM - pack.terrain.baseHeightM);
  const maxIndex = Math.max(terrainRow.length - 1, 1);
  const baselineY = height - bottomPadding;
  const profilePoints = terrainRow.map((sampleHeightM, sampleIndex) => {
    const x = (sampleIndex / maxIndex) * width;
    const normalizedHeight = (sampleHeightM - pack.terrain.baseHeightM) / terrainRange;
    const y = baselineY - normalizedHeight * usableHeight;

    return {
      x,
      y,
    };
  });
  const profilePath = profilePoints
    .map((point, pointIndex) => `${pointIndex === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' ');
  const areaPath =
    profilePoints.length > 0
      ? `${profilePath} L ${width.toFixed(1)} ${baselineY.toFixed(1)} L 0 ${baselineY.toFixed(1)} Z`
      : '';
  const previewAnchors = pack.anchors.slice(0, 2).map((anchor) => {
    const eastRatio = (anchor.eastM + pack.halfExtentM) / (pack.halfExtentM * 2);
    const clampedEastRatio = Math.max(0, Math.min(1, eastRatio));
    const terrainColumnIndex = Math.round(clampedEastRatio * maxIndex);
    const terrainHeightM = terrainRow[terrainColumnIndex] ?? pack.terrain.baseHeightM;
    const normalizedHeight = (terrainHeightM - pack.terrain.baseHeightM) / terrainRange;

    return {
      id: anchor.id,
      label: formatPreviewAnchorRole(anchor.role),
      x: clampedEastRatio * width,
      y: baselineY - normalizedHeight * usableHeight,
      accentColor: anchor.accentColor,
      primary: anchor.role === 'endpoint-site',
    };
  });

  return {
    width,
    height,
    baselineY,
    areaPath,
    profilePath,
    previewAnchors,
    spanKmLabel: ((pack.halfExtentM * 2) / 1000).toFixed(1),
    reliefMetersLabel: Math.round(pack.terrain.maxHeightM - pack.terrain.baseHeightM),
    anchorCountLabel: pack.anchors.length,
    additionalAnchorCount: Math.max(0, pack.anchors.length - previewAnchors.length),
  };
}

interface GroundContextPreviewProps {
  pack: LocalContextAoiPack;
  siteAnchorLabel: string;
  currentCorridorLabel: string;
  endpointPairLabel: string;
  onClearEcho: () => void;
  showsReturnEcho: boolean;
}

function GroundContextPreview({
  pack,
  siteAnchorLabel,
  currentCorridorLabel,
  endpointPairLabel,
  onClearEcho,
  showsReturnEcho,
}: GroundContextPreviewProps) {
  const previewData = useMemo(() => buildGroundPreviewData(pack), [pack]);
  const gradientId = `${pack.id}-ground-preview-gradient`;
  const headline = showsReturnEcho ? 'Pinned arrival hemisphere after local return' : 'Arrival-hemisphere footprint and terrain profile';
  const copy = showsReturnEcho
    ? `The same bounded ${siteAnchorLabel} stays concrete as the active arrival hemisphere after the local return.`
    : `The current corridor now descends across the active arrival hemisphere around ${siteAnchorLabel} before local entry.`;

  return (
    <section
      className={`floating-card ground-preview ${showsReturnEcho ? 'ground-preview--echo' : ''}`}
      aria-label="Ground context preview"
    >
      <div className="ground-preview__header">
        <div>
          <p className="floating-card__eyebrow">Ground Context Preview</p>
          <p className="ground-preview__title">{siteAnchorLabel}</p>
        </div>
        <div className="ground-preview__header-actions">
          <span className={`ground-preview__status ${showsReturnEcho ? 'ground-preview__status--echo' : ''}`}>
            {showsReturnEcho ? 'Pinned after return' : 'Terrain-ready region'}
          </span>
          {showsReturnEcho ? (
            <button
              type="button"
              className="continuity-echo__clear"
              onClick={onClearEcho}
            >
              Clear Echo
            </button>
          ) : null}
        </div>
      </div>
      {showsReturnEcho ? (
        <div className="continuity-trail continuity-trail--echo ground-preview__echo-trail">
          <span className="continuity-chip continuity-chip--globe">Home globe</span>
          <span className="continuity-trail__arrow">-&gt;</span>
          <span className="continuity-chip continuity-chip--globe">Current corridor</span>
          <span className="continuity-trail__arrow">-&gt;</span>
          <span className="continuity-chip continuity-chip--echo">Recently inspected AOI</span>
        </div>
      ) : null}
      <p className="ground-preview__headline">{headline}</p>
      <p className="ground-preview__copy">{copy}</p>
      <p className="ground-preview__meta">
        {endpointPairLabel}
        {' | '}
        {pack.regionLabel}
      </p>

      <div
        className="ground-preview__terrain"
        aria-hidden="true"
      >
        <svg
          viewBox={`0 0 ${previewData.width} ${previewData.height}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient
              id={gradientId}
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop
                offset="0%"
                stopColor="#ffbf69"
                stopOpacity="0.34"
              />
              <stop
                offset="100%"
                stopColor="#ffbf69"
                stopOpacity="0.04"
              />
            </linearGradient>
          </defs>
          <path
            className="ground-preview__baseline"
            d={`M 0 ${previewData.baselineY.toFixed(1)} L ${previewData.width.toFixed(1)} ${previewData.baselineY.toFixed(1)}`}
          />
          {previewData.areaPath ? (
            <path
              className="ground-preview__area"
              d={previewData.areaPath}
              fill={`url(#${gradientId})`}
            />
          ) : null}
          {previewData.profilePath ? (
            <path
              className="ground-preview__ridge"
              d={previewData.profilePath}
            />
          ) : null}
          {previewData.previewAnchors.map((anchor) => (
            <g
              key={anchor.id}
              className="ground-preview__anchor-marker"
            >
              <line
                className="ground-preview__anchor-line"
                x1={anchor.x}
                x2={anchor.x}
                y1={previewData.baselineY}
                y2={anchor.y}
              />
              <circle
                cx={anchor.x}
                cy={anchor.y}
                r={anchor.primary ? 4.4 : 3.5}
                fill={anchor.accentColor}
              />
            </g>
          ))}
        </svg>
      </div>

      <div className="ground-preview__facts">
        <span className="ground-preview__fact">{previewData.spanKmLabel} km AOI span</span>
        <span className="ground-preview__fact">{previewData.reliefMetersLabel} m relief</span>
        <span className="ground-preview__fact">{previewData.anchorCountLabel} anchors</span>
      </div>

      <div className="ground-preview__anchors">
        {previewData.previewAnchors.map((anchor) => (
          <span
            key={anchor.id}
            className={`ground-preview__anchor-chip ${anchor.primary ? 'ground-preview__anchor-chip--primary' : ''}`}
          >
            {anchor.label}
          </span>
        ))}
        {previewData.additionalAnchorCount > 0 ? (
          <span className="ground-preview__anchor-chip">
            +{previewData.additionalAnchorCount} support anchor
          </span>
        ) : null}
      </div>
      {showsReturnEcho ? (
        <p className="ground-preview__echo-copy">
          Back on the home globe and still tied to {currentCorridorLabel}.
        </p>
      ) : null}
    </section>
  );
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
  const primaryServiceSiteAnchor = useMemo(
    () => (localEntryState.pack ? getPrimaryServiceSiteAnchor(localEntryState.pack) : null),
    [localEntryState.pack]
  );
  const serviceSiteArrivalRegion = useMemo(
    () => (localEntryState.pack ? getServiceSiteArrivalRegion(localEntryState.pack) : null),
    [localEntryState.pack]
  );
  const homeStageSiteLabel = primaryServiceSiteAnchor?.label ?? localEntryState.pack?.targetLabel ?? 'No local target ready';
  const showsReturnEcho =
    viewerRoute.kind === 'globe' &&
    Boolean(localEntryState.pack && returnEcho?.aoiId === localEntryState.pack.id);
  const globeLocalInspectCue =
    localEntryState.available && localEntryState.pack && primaryServiceSiteAnchor && serviceSiteArrivalRegion
      ? {
          endpointId: localEntryState.pack.endpointId,
          targetLabel: localEntryState.pack.targetLabel,
          regionLabel: localEntryState.pack.regionLabel,
          siteAnchorLabel: homeStageSiteLabel,
          siteCenter: localEntryState.pack.center,
          siteAnchorOffset: {
            eastM: primaryServiceSiteAnchor.eastM,
            northM: primaryServiceSiteAnchor.northM,
          },
          arrivalRegion: serviceSiteArrivalRegion,
          state: showsReturnEcho ? ('echo' as const) : ('discoverable' as const),
        }
      : null;
  const localEntryActionLabel = showsReturnEcho ? 'Inspect Again' : 'Inspect Local Context';
  const localEntryReason = !localEntryState.available
    ? localEntryState.reason
    : showsReturnEcho
      ? 'The recently inspected arrival hemisphere stays pinned until you clear the echo or refresh it with another local return.'
      : 'The home stage now holds the corridor inside one arrival hemisphere with a bounded landing region and offline terrain pack ready behind it.';
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

  const clearReturnEcho = () => {
    setReturnEcho(null);
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
      const revision = Date.now();

      setReturnEcho({
        aoiId: localEntryState.pack.id,
        revision,
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
    }, RETURN_ECHO_AUTO_CLEAR_MS);

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
          <p className="floating-card__eyebrow">Offline-First Dual-Scale Explorer</p>
          <p className="hero-overlay__summary">
            Endpoint pair, current corridor, and one active arrival hemisphere now share the home stage.
          </p>
          {localEntryState.pack && primaryServiceSiteAnchor ? (
            <p className="hero-overlay__detail">
              Arrival hemisphere core: {homeStageSiteLabel}
            </p>
          ) : null}
        </header>

        <section
          className="floating-card top-hud"
          aria-label="First-screen service-to-site narrative"
        >
          <div className="service-story">
            <div className="service-story__header">
              <p className="floating-card__eyebrow">First-Screen Service-To-Site Narrative</p>
              <p className="service-story__lede">
                Default read path: endpoint pair -&gt; current corridor -&gt; arrival hemisphere.
              </p>
            </div>

            <div className="service-story__step">
              <span className="service-story__index">1</span>
              <div className="service-story__body">
                <p className="service-story__label">Endpoint pair</p>
                <p className="service-story__value">{currentEndpointPairLabel}</p>
              </div>
            </div>

            <div className="service-story__step service-story__step--corridor">
              <span className="service-story__index">2</span>
              <div className="service-story__body">
                <div className="service-story__meta">
                  <p className="service-story__label">Current corridor</p>
                  <span className={`availability-pill availability-pill--${availabilityTone}`}>
                    {availabilityLabel}
                  </span>
                </div>
                <p className="service-story__value">{currentCorridorLabel}</p>
              </div>
            </div>

            <div className={`service-story__step service-story__step--site ${showsReturnEcho ? 'service-story__step--echo' : ''}`}>
              <span className="service-story__index">3</span>
              <div className="service-story__body">
                <div className="service-story__meta">
                  <p className="service-story__label">{showsReturnEcho ? 'Recently inspected hemisphere' : 'Arrival hemisphere and landing region'}</p>
                  {localEntryState.available ? (
                    <span className={`ground-readiness-chip ${showsReturnEcho ? 'ground-readiness-chip--echo' : ''}`}>
                      {showsReturnEcho ? 'Pinned after return' : 'Terrain-ready'}
                    </span>
                  ) : null}
                </div>
                <p className="service-story__value">{homeStageSiteLabel}</p>
                {localEntryState.pack ? (
                  <p className="service-story__support">{localEntryState.pack.regionLabel}</p>
                ) : null}
                <p className="service-story__support service-story__support--muted">{localEntryReason}</p>
              </div>
              <button
                type="button"
                className="scene-action service-story__action"
                disabled={!localEntryState.available}
                onClick={enterLocalContext}
                title={localEntryState.available ? 'Open the bounded local-context scene' : localEntryState.reason}
              >
                {localEntryActionLabel}
              </button>
            </div>
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

        <div className="home-stage-stack">
          {localEntryState.available && localEntryState.pack ? (
            <GroundContextPreview
              pack={localEntryState.pack}
              siteAnchorLabel={homeStageSiteLabel}
              currentCorridorLabel={currentCorridorLabel}
              endpointPairLabel={currentEndpointPairLabel}
              onClearEcho={clearReturnEcho}
              showsReturnEcho={showsReturnEcho}
            />
          ) : null}
        </div>

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
