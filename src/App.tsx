import type { CSSProperties } from 'react';
import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { HeroGlobeScene, type HeroGlobeFramingRequest } from './components/globe/HeroGlobeScene';
import type { FramingMode } from './components/globe/corridorFraming';
import {
  buildHomeGlobeImagerySearchFromWindow,
  replaceHomeGlobeImageryHashQueryParameter,
  resolveHomeGlobeImagerySelection,
  type HomeGlobeImageryMode,
} from './imagery/homeGlobeImagery';
import { useEarthTextures } from './imagery/useEarthTextures';
import {
  buildHomeGlobeLocalEntryReason,
  buildHomeGlobeLocalInspectCue,
  GroundContextPreview,
} from './homeGlobe/homeGlobeLocalEntry';
import { buildSharedFocusDetailFromOfflinePack, resolveHomeGlobePayload } from './homeGlobe/homeGlobePayload';
import {
  endpointAlphaLocalContextPack,
  getOfflineLocalContextPack,
  getPrimaryServiceSiteAnchor,
  getServiceSiteArrivalRegion,
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
  'Opt-in home-globe Google Map Tiles satellite imagery path with explicit offline fallback',
  'Mostly daylit Earth presentation with restrained limb darkening and a soft far-edge terminator',
  'Restrained ocean/specular treatment and Earth grading pass using the same approved day/night/cloud baseline',
  'Restrained cloud shell layered between the Earth surface and atmosphere',
  'Restrained procedural atmosphere shell that continues to add depth without becoming a cloud substitute',
  'Corridor-aware first screen with explicit Home and Fit Corridor framing actions',
  'One bounded offline local-context vertical slice tied to Asia through a route-level full-screen takeover',
  'AOI-centered local camera with bounded inspection, explicit Reset Local View, and Back to Globe return grammar',
  'Visible corridor-linked continuity layer for globe discoverability, scale handoff, and return echo',
  'Phase 3c first-screen product shift with a home-stage service-site spotlight, service-to-site narrative, and compact ground-context preview',
  'Site anchor / site geometry decoupling follow-on with a distinct service-site anchor and restrained corridor-to-site handoff',
  'Arrival-hemisphere composition reset with home-stage framing bias, hemisphere-scaled landing treatment, and stronger terminal approach staging',
  'Offline local-fidelity follow-on with terrain contours, site-ground footprints, and corridor-linked local destination cues for the single AOI scene',
  'Lazy-loaded official Taipei building footprints and painted sidewalk surfaces clipped into the Asia AOI local scene',
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
  'AOI/local API uplift or whole-globe deep-zoom parity claims',
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

interface ImageryDebugBadgeProps {
  requestedMode: string;
  requestedProviderId: string;
  activeProviderId: string;
  status: 'ready' | 'loading' | 'fallback';
  activeProviderKind: 'empty' | 'static' | 'api';
  failureReason: string | null;
}

function ImageryDebugBadge({
  requestedMode,
  requestedProviderId,
  activeProviderId,
  status,
  activeProviderKind,
  failureReason,
}: ImageryDebugBadgeProps) {
  const tone =
    status === 'loading'
      ? 'loading'
      : activeProviderKind === 'api'
        ? 'active'
        : status === 'fallback'
          ? 'fallback'
          : 'offline';
  const toneLabel =
    tone === 'active'
      ? 'Google live'
      : tone === 'loading'
        ? 'Loading'
        : tone === 'fallback'
          ? 'Fallback'
          : 'Offline';

  return (
    <aside
      className={`imagery-debug-badge imagery-debug-badge--${tone}`}
      aria-label="Home globe imagery debug status"
    >
      <div className="imagery-debug-badge__header">
        <p className="imagery-debug-badge__eyebrow">Imagery Debug</p>
        <span className="imagery-debug-badge__pill">{toneLabel}</span>
      </div>
      <p className="imagery-debug-badge__line">
        <strong>Requested</strong> {requestedMode}
      </p>
      <p className="imagery-debug-badge__line">
        <strong>Provider</strong> {activeProviderId}
      </p>
      {requestedProviderId !== activeProviderId ? (
        <p className="imagery-debug-badge__line imagery-debug-badge__line--muted">
          Target seam: {requestedProviderId}
        </p>
      ) : null}
      <p className="imagery-debug-badge__line imagery-debug-badge__line--muted">
        Status: {status}
      </p>
      {failureReason ? (
        <p className="imagery-debug-badge__reason" title={failureReason}>
          {failureReason}
        </p>
      ) : null}
    </aside>
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
  const [imagerySearch, setImagerySearch] = useState(() =>
    typeof window === 'undefined' ? '' : buildHomeGlobeImagerySearchFromWindow()
  );
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
  const homeGlobeImagery = useMemo(() => resolveHomeGlobeImagerySelection(imagerySearch), [imagerySearch]);
  const showImageryDebugBadge = useMemo(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    const queryParameters = new URLSearchParams(window.location.search);
    const hashQuery =
      window.location.hash.includes('?')
        ? window.location.hash.slice(window.location.hash.indexOf('?') + 1)
        : '';
    const hashParameters = new URLSearchParams(hashQuery);

    if (queryParameters.get('imageryDebug') === '1' || hashParameters.get('imageryDebug') === '1') {
      return true;
    }

    return import.meta.env.DEV && homeGlobeImagery.requestedMode === 'google-satellite';
  }, [homeGlobeImagery.requestedMode]);
  const truthSnapshot = useTruthSnapshot(mockTruthProvider);
  const earthTextureState = useEarthTextures(
    homeGlobeImagery.requestedProvider,
    homeGlobeImagery.fallbackProvider
  );
  const earthTextures = earthTextureState.textureSet;
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
  const sharedFocusDetail = useMemo(() => {
    const pack = localEntryState.pack;
    if (!pack) return null;
    return buildSharedFocusDetailFromOfflinePack({
      centerLatDeg: pack.center.latitudeDeg,
      centerLonDeg: pack.center.longitudeDeg,
      halfExtentM: pack.halfExtentM,
      regionLabel: pack.regionLabel,
      packId: pack.id,
    });
  }, [localEntryState.pack]);
  const homeGlobePayload = useMemo(
    () => resolveHomeGlobePayload(earthTextures, sharedFocusDetail),
    [earthTextures, sharedFocusDetail]
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
  const globeLocalInspectCue = useMemo(
    () =>
      buildHomeGlobeLocalInspectCue({
        available: localEntryState.available,
        pack: localEntryState.pack,
        serviceSiteArrivalRegion,
        primaryServiceSiteAnchor,
        siteAnchorLabel: homeStageSiteLabel,
        showsReturnEcho,
      }),
    [
      homeStageSiteLabel,
      localEntryState.available,
      localEntryState.pack,
      primaryServiceSiteAnchor,
      serviceSiteArrivalRegion,
      showsReturnEcho,
    ]
  );
  const localEntryActionLabel = 'Inspect Local Context';
  const localEntryReason = buildHomeGlobeLocalEntryReason({
    available: localEntryState.available,
    reason: localEntryState.reason,
    showsReturnEcho,
    siteAnchorLabel: homeStageSiteLabel,
  });
  const localEntryActionTitle = localEntryState.available
    ? `Enter local context for ${homeStageSiteLabel}`
    : localEntryReason;
  const conservativeBoundaries = [
    'The activePath wording remains limited to current service corridor / current active relay path / current visible relay path.',
    'The unavailable candidate corridor is still mock availability truth, not KPI, SLA, or coverage-field truth.',
    'The reviewer-facing Earth surface now stays mostly daylit even during globe rotation. Darkening and night lights are pushed to the far limb so the first screen still reads Earth surface, service corridor, and arrival region before anything astronomical.',
    'Home and Fit Corridor still stay globe-centered. The cloud shell does not reopen generic free pan or free-fly camera drift.',
    'Ocean/specular and grading stay restrained and texture-backed. This commit uses the same approved day/night/cloud assets and does not add bloom, weather animation, new runtime Earth assets, or a larger planet-rendering stack.',
    'Google Map Tiles satellite uplift is bounded to the home globe imagery seam only. It does not reopen AOI/local API, provider migration, or deep-zoom parity claims.',
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
    earthTextures?.dayTextureUrl ? earthTextures.availability : 'none-approved';
  const cloudShellStatus = earthTextures?.cloudTextureUrl ? 'approved-runtime' : 'inactive';
  const imagerySelectionSource =
    homeGlobeImagery.modeSource === 'query'
      ? 'query-override'
      : homeGlobeImagery.modeSource === 'env'
        ? 'env-default'
        : 'built-in-default';
  const activeEarthProviderId = earthTextureState.activeProviderId;
  const activeEarthProviderKind = earthTextureState.activeProviderKind;
  const homeGlobeImageryStatus =
    homeGlobeImagery.requestedMode === 'google-satellite'
      ? earthTextureState.status === 'loading'
        ? 'google-satellite-loading'
        : activeEarthProviderKind === 'api'
          ? 'google-satellite-active'
          : 'offline-fallback'
      : 'offline-baseline';
  const earthSurfaceMode =
    activeEarthProviderKind === 'api'
      ? 'Mostly daylit Google satellite surface + retained night/cloud depth continuity'
      : earthTextureState.status === 'loading' && homeGlobeImagery.requestedMode === 'google-satellite'
        ? 'Offline mostly-daylit baseline while Google satellite imagery loads'
        : earthImageryAvailability === 'approved-runtime'
          ? earthTextures?.cloudTextureUrl
            ? 'Mostly daylit Earth presentation + restrained grading/specular + cloud shell + atmosphere'
            : 'Mostly daylit Earth presentation + restrained atmosphere'
          : earthTextures?.dayTextureUrl
            ? 'Step 1 day-only fallback surface'
            : 'Placeholder globe fallback';
  const homeGlobeImageryHeadline =
    homeGlobeImagery.requestedMode === 'google-satellite'
      ? activeEarthProviderKind === 'api'
        ? 'Home imagery: Google satellite enhanced with retained depth continuity'
        : earthTextureState.status === 'loading'
          ? 'Home imagery: Google satellite loading over the offline baseline'
          : 'Home imagery: Offline fallback after Google satellite issue'
      : 'Home imagery: Offline approved Earth baseline';
  const homeGlobeImageryNote =
    homeGlobeImagery.requestedMode === 'google-satellite'
      ? activeEarthProviderKind === 'api'
        ? 'Google Map Tiles API satellite imagery is active on the home globe. The Google day map keeps the approved offline night lights and restrained cloud shell so the hero globe remains mostly daylit without losing its depth cues. The AOI/local route, truth vocabulary, and dual-scale grammar remain unchanged.'
        : earthTextureState.status === 'loading'
          ? 'Google Map Tiles satellite mode was requested, but the app keeps the approved offline globe visible until the runtime composite is ready.'
          : earthTextureState.failureReason ??
            homeGlobeImagery.requestedProvider.availabilityReason ??
            'Google Map Tiles satellite mode could not be activated. The home globe fell back to the approved offline baseline.'
      : 'The home globe is using the approved offline mostly-daylit Earth baseline with restrained cloud and atmosphere layers.';
  const earthSurfaceNote =
    earthTextures?.note ??
    'No Earth imagery seam state is available. The placeholder globe should remain the only runtime surface.';

  const setFramingMode = (mode: FramingMode) => {
    setFramingRequest((current) => ({
      mode,
      revision: current.revision + 1,
    }));
  };

  const setHomeGlobeImageryMode = (mode: HomeGlobeImageryMode) => {
    setImagerySearch(replaceHomeGlobeImageryHashQueryParameter('imagery', mode));
  };

  const clearReturnEcho = () => {
    setReturnEcho(null);
  };

  const enterLocalContext = () => {
    if (!localEntryState.available || !localEntryState.pack) {
      return;
    }

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
      const nextImagerySearch = buildHomeGlobeImagerySearchFromWindow();
      setImagerySearch((current) => nextImagerySearch || current);
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);

    if (!window.location.hash) {
      syncViewerRouteHash({ kind: 'globe' });
    }

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
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
          homeGlobePayload={homeGlobePayload}
          framingRequest={framingRequest}
          localInspectCue={globeLocalInspectCue}
          worldGeometry={truthSnapshot.worldGeometry}
          serviceAvailability={truthSnapshot.serviceAvailability}
          serviceSelection={truthSnapshot.serviceSelection}
        />
      </div>

      <div className="viewer-overlay viewer-overlay--minimal-home">
        <section className="floating-card home-controls" aria-label="Home controls">
          <div className="scene-actions scene-actions--compact">
            <button
              type="button"
              className="scene-action"
              disabled={!localEntryState.available}
              onClick={enterLocalContext}
              title={localEntryActionTitle}
            >
              {localEntryActionLabel}
            </button>
            <button
              type="button"
              className={`scene-action ${framingRequest.mode === 'home' ? 'scene-action--active' : ''}`}
              onClick={() => setFramingMode('home')}
            >
              Home
            </button>
            <button
              type="button"
              className={`scene-action ${homeGlobeImagery.requestedMode === 'google-satellite' ? 'scene-action--active' : ''}`}
              onClick={() =>
                setHomeGlobeImageryMode(
                  homeGlobeImagery.requestedMode === 'google-satellite' ? 'offline' : 'google-satellite'
                )
              }
              title={
                homeGlobeImagery.requestedMode === 'google-satellite'
                  ? 'Switch the home globe back to the offline Earth baseline'
                  : 'Switch the home globe to Google satellite imagery'
              }
            >
              {homeGlobeImagery.requestedMode === 'google-satellite' ? 'Use Offline Globe' : 'Use Google Globe'}
            </button>
          </div>
        </section>

        <header className="floating-card hero-overlay">
          <p className="floating-card__eyebrow">Offline-First Dual-Scale Explorer</p>
          <p className="hero-overlay__summary">
            Endpoint pair, current corridor, and one active arrival hemisphere now share the home stage.
          </p>
          <p className="hero-overlay__detail">{homeGlobeImageryHeadline}</p>
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
                title={localEntryActionTitle}
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

        {showImageryDebugBadge ? (
          <ImageryDebugBadge
            requestedMode={homeGlobeImagery.requestedMode}
            requestedProviderId={homeGlobeImagery.requestedProvider.providerId}
            activeProviderId={activeEarthProviderId}
            status={earthTextureState.status}
            activeProviderKind={activeEarthProviderKind}
            failureReason={earthTextureState.failureReason}
          />
        ) : null}

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
                  <dt>Requested provider</dt>
                  <dd>{homeGlobeImagery.requestedProvider.providerId}</dd>
                </div>
                <div className="status-facts__row">
                  <dt>Requested kind</dt>
                  <dd>{homeGlobeImagery.requestedProvider.providerKind}</dd>
                </div>
                <div className="status-facts__row">
                  <dt>Active provider</dt>
                  <dd>{activeEarthProviderId}</dd>
                </div>
                <div className="status-facts__row">
                  <dt>Active kind</dt>
                  <dd>{activeEarthProviderKind}</dd>
                </div>
                <div className="status-facts__row">
                  <dt>Requested mode</dt>
                  <dd>{homeGlobeImagery.requestedMode}</dd>
                </div>
                <div className="status-facts__row">
                  <dt>Selection source</dt>
                  <dd>{imagerySelectionSource}</dd>
                </div>
                <div className="status-facts__row">
                  <dt>Status</dt>
                  <dd>{homeGlobeImageryStatus}</dd>
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
                {homeGlobeImagery.failureMode !== 'none' ? (
                  <div className="status-facts__row">
                    <dt>Failure override</dt>
                    <dd>{homeGlobeImagery.failureMode}</dd>
                  </div>
                ) : null}
                {homeGlobeImagery.keyOverride !== 'default' ? (
                  <div className="status-facts__row">
                    <dt>Key override</dt>
                    <dd>{homeGlobeImagery.keyOverride}</dd>
                  </div>
                ) : null}
                {earthTextureState.failureReason ? (
                  <div className="status-facts__row">
                    <dt>Fallback reason</dt>
                    <dd>{earthTextureState.failureReason}</dd>
                  </div>
                ) : null}
              </dl>
              <p className="drawer-copy">{homeGlobeImageryNote}</p>
              <p className="drawer-copy">{earthSurfaceNote}</p>
            </section>

            <section className="drawer-section">
              <p className="floating-card__eyebrow">Home Globe Capability Layers</p>
              <dl className="status-facts">
                <div className="status-facts__row">
                  <dt>Layer 1 — Earth baseline</dt>
                  <dd>{homeGlobePayload.earthBaseline ? homeGlobePayload.earthBaseline.availability : 'none'}</dd>
                </div>
                <div className="status-facts__row">
                  <dt>Layer 2 — Shared focus detail</dt>
                  <dd>{homeGlobePayload.sharedFocusDetail ? homeGlobePayload.sharedFocusDetail.detailKind : 'not-yet-resolved'}</dd>
                </div>
                {homeGlobePayload.sharedFocusDetail ? (
                  <>
                    <div className="status-facts__row">
                      <dt>Focus region</dt>
                      <dd>{homeGlobePayload.sharedFocusDetail.regionLabel}</dd>
                    </div>
                    <div className="status-facts__row">
                      <dt>Focus center</dt>
                      <dd>
                        {homeGlobePayload.sharedFocusDetail.center.latDeg.toFixed(3)}°N,{' '}
                        {homeGlobePayload.sharedFocusDetail.center.lonDeg.toFixed(4)}°E
                      </dd>
                    </div>
                    <div className="status-facts__row">
                      <dt>Focus extent</dt>
                      <dd>
                        {(homeGlobePayload.sharedFocusDetail.extent.halfWidthM * 2 / 1000).toFixed(1)} km ×{' '}
                        {(homeGlobePayload.sharedFocusDetail.extent.halfHeightM * 2 / 1000).toFixed(1)} km
                      </dd>
                    </div>
                    <div className="status-facts__row">
                      <dt>Focus source</dt>
                      <dd>{homeGlobePayload.sharedFocusDetail.sourceId}</dd>
                    </div>
                  </>
                ) : null}
                <div className="status-facts__row">
                  <dt>Layer 3 — API-only enhancement</dt>
                  <dd>reserved</dd>
                </div>
              </dl>
              <p className="drawer-copy">
                {homeGlobePayload.sharedFocusDetail
                  ? `Layer 2 is now resolved from ${homeGlobePayload.sharedFocusDetail.sourceId}. The bounded focus-detail region shares the same inspect grammar in both offline and API modes. Layer 3 remains reserved for a later bounded decision.`
                  : 'EarthTextureSet remains the Layer 1 baseline seam. Layer 2 and Layer 3 are separate contracts that will be resolved in later rounds.'
                }
              </p>
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
