import type { CSSProperties } from 'react';
import { useState } from 'react';
import { HeroGlobeScene } from './components/globe/HeroGlobeScene';
import { offlineEarthImageryProvider } from './imagery/offlineEarthImageryProvider';
import { useEarthTextures } from './imagery/useEarthTextures';
import { mockTruthProvider } from './mock/mockTruthProvider';
import type { DatasetCapabilityProfile } from './truth/contracts';
import { useTruthSnapshot } from './truth/useTruthSnapshot';

const completedScope = [
  'Approved NASA day and night runtime derivatives through the existing imagery seam',
  'Day-night Earth shader v1 with a controlled terminator and restrained twilight band',
  'Full-stage globe-first shell with corridor-focused framing',
  'Natural zoom range from whole-globe read to closer corridor inspection',
  'Compact HUD plus on-demand drawer instead of a permanent dashboard rail',
  'Mock truth scene and overlays still reading the same canonical snapshot',
];

const deferredScope = [
  'Cloud shell, atmosphere shader, and bloom follow-ons',
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
    'Step 2 still does not claim clouds, atmosphere, bloom, or a full planet-rendering stack.',
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
  const earthSurfaceMode =
    earthImageryAvailability === 'approved-runtime'
      ? 'Day-night Earth shader v1'
      : earthTextures?.dayTextureUrl
        ? 'Step 1 day-only fallback surface'
        : 'Placeholder globe fallback';
  const earthSurfaceNote =
    earthTextures?.note ??
    'No Earth imagery seam state is available. The placeholder globe should remain the only runtime surface.';

  return (
    <div className="viewer-shell">
      <div className="viewer-stage">
        <HeroGlobeScene
          earthTextures={earthTextures}
          worldGeometry={truthSnapshot.worldGeometry}
          serviceAvailability={truthSnapshot.serviceAvailability}
          serviceSelection={truthSnapshot.serviceSelection}
        />
      </div>

      <div className="viewer-overlay">
        <header className="floating-card hero-overlay">
          <p className="floating-card__eyebrow">Offline Earth Reset Step 2</p>
          <h1 className="hero-overlay__title">Service-Driven Hero Globe</h1>
          <p className="hero-overlay__body">
            Step 2 keeps the approved NASA day baseline, adds Black Marble night lights, and promotes a
            formal day-night shader. The dark side is now readable without pretending clouds, atmosphere,
            or bloom already exist.
          </p>
        </header>

        <div className="top-hud">
          <div className="floating-card scene-status">
            <p className="floating-card__eyebrow">Current State</p>
            <div className="scene-status__row">
              <span className={`availability-pill availability-pill--${availabilityTone}`}>
                {availabilityLabel}
              </span>
              <span className="scene-status__dataset">{truthSnapshot.datasetLabel}</span>
            </div>
            <p className="scene-status__path">{currentCorridorLabel}</p>
          </div>

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

        <section className="floating-card service-ribbon">
          <p className="floating-card__eyebrow">Current Visible Relay Path</p>
          <p className="service-ribbon__path">{currentCorridorLabel}</p>
          <p className="service-ribbon__hint">
            Drag to rotate. Scroll to zoom from whole-globe framing toward the corridor.
          </p>
        </section>

        <section className="floating-card legend-overlay">
          <p className="floating-card__eyebrow">Legend</p>
          <div className="legend-overlay__items">
            <span className="scene-legend scene-legend--active">Current service corridor</span>
            <span className="scene-legend scene-legend--unavailable">Unavailable candidate</span>
          </div>
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
