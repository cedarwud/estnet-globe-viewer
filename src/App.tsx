import type { CSSProperties } from 'react';
import { useState } from 'react';
import { HeroGlobeScene, type HeroGlobeFramingRequest } from './components/globe/HeroGlobeScene';
import type { FramingMode } from './components/globe/corridorFraming';
import { offlineEarthImageryProvider } from './imagery/offlineEarthImageryProvider';
import { useEarthTextures } from './imagery/useEarthTextures';
import { mockTruthProvider } from './mock/mockTruthProvider';
import type { DatasetCapabilityProfile } from './truth/contracts';
import { useTruthSnapshot } from './truth/useTruthSnapshot';

const completedScope = [
  'Approved NASA day and night runtime derivatives through the existing imagery seam',
  'Approved NASA GSFC Blue Marble cloud derivative through the same governance path',
  'Day-night Earth shader v1 with a controlled terminator and restrained twilight band',
  'Restrained cloud shell layered between the Earth surface and atmosphere',
  'Restrained procedural atmosphere shell that continues to add depth without becoming a cloud substitute',
  'Corridor-aware first screen with explicit Home and Fit Corridor framing actions',
  'Natural zoom range from whole-globe read to closer corridor inspection',
  'In-scene endpoint labels and clearer endpoint / relay / corridor hierarchy',
  'Reduced persistent overlay with more detail pushed down into the drawer',
  'Mock truth scene and overlays still reading the same canonical snapshot',
];

const deferredScope = [
  'Bloom follow-on',
  'estnet-bootstrap-kit reference replay smoke',
  'Focus lens follow-on interface',
  'Premium world context and site assets',
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

export function App() {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [framingRequest, setFramingRequest] = useState<HeroGlobeFramingRequest>({
    mode: 'home',
    revision: 0,
  });
  const truthSnapshot = useTruthSnapshot(mockTruthProvider);
  const earthTextures = useEarthTextures(offlineEarthImageryProvider);
  const capabilityRows = capabilityEntries(truthSnapshot.capabilityProfile);
  const endpointLabels = new Map(truthSnapshot.worldGeometry.endpoints.map((endpoint) => [endpoint.id, endpoint.label]));
  const satelliteLabels = new Map(truthSnapshot.worldGeometry.satellites.map((satellite) => [satellite.id, satellite.label]));
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
  const conservativeBoundaries = [
    'The activePath wording remains limited to current service corridor / current active relay path / current visible relay path.',
    'The unavailable candidate corridor is still mock availability truth, not KPI, SLA, or coverage-field truth.',
    'Dark-side readability now comes from a controlled day/night shader and approved Black Marble night lights, not from washing the whole globe with ambient fill.',
    'Home and Fit Corridor still stay globe-centered. The cloud shell does not reopen generic free pan or free-fly camera drift.',
    'The approved cloud shell stays restrained and texture-backed. This commit does not add bloom, weather animation, ocean specular, grading, or a larger planet-rendering stack.',
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
        ? 'Day-night Earth shader v1 + restrained cloud shell + atmosphere'
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

  return (
    <div className="viewer-shell">
      <div className="viewer-stage">
        <HeroGlobeScene
          earthTextures={earthTextures}
          framingRequest={framingRequest}
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
                  <dd>{earthTextures?.appearanceProfileId ?? 'offline-balanced-v2'}</dd>
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
