import type { CSSProperties } from 'react';
import { HeroGlobeScene } from './components/globe/HeroGlobeScene';
import { mockTruthProvider } from './mock/mockTruthProvider';
import type { DatasetCapabilityProfile } from './truth/contracts';
import { useTruthSnapshot } from './truth/useTruthSnapshot';

const completedScope = [
  'Canonical truth vocabulary and dataset capability profile',
  'Minimal synchronous TruthProvider seam',
  'In-memory mock truth path with service corridor baseline',
  'Hero globe scene and status UI reading the same truth snapshot',
];

const deferredScope = [
  'Reference replay smoke via estnet-bootstrap-kit',
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
  const truthSnapshot = useTruthSnapshot(mockTruthProvider);
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
  const conservativeBoundaries = [
    'The activePath wording remains limited to current service corridor / current active relay path / current visible relay path.',
    'The unavailable candidate corridor is still mock availability truth, not KPI, SLA, or coverage-field truth.',
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

  return (
    <div className="shell">
      <header className="hero-copy">
        <p className="hero-copy__eyebrow">Commit 04 Baseline</p>
        <h1 className="hero-copy__title">Selective Service Corridor</h1>
        <p className="hero-copy__body">
          This stage keeps the globe offline-first while adding one current service corridor, one unavailable
          candidate corridor, and a strictly limited set of service-relevant satellites on top of the canonical
          truth path.
        </p>

        <div className="hero-copy__chips">
          <span className="hero-chip">One active corridor</span>
          <span className="hero-chip">One unavailable candidate</span>
          <span className="hero-chip">Main branch baseline</span>
        </div>
      </header>

      <main className="shell__layout">
        <section className="stage-card">
          <div className="stage-card__header">
            <div>
              <p className="stage-card__eyebrow">Hero Stage</p>
              <h2 className="stage-card__title">Single globe primary scene</h2>
            </div>
            <p className="stage-card__meta">
              {truthSnapshot.datasetLabel}
              <br />
              Current availability: {availabilityLabel}
            </p>
          </div>

          <div className="stage-card__viewport">
            <HeroGlobeScene
              worldGeometry={truthSnapshot.worldGeometry}
              serviceAvailability={truthSnapshot.serviceAvailability}
              serviceSelection={truthSnapshot.serviceSelection}
            />
            <div className="stage-card__legend">
              <span className="scene-legend scene-legend--active">Current service corridor</span>
              <span className="scene-legend scene-legend--unavailable">Unavailable candidate</span>
            </div>
          </div>
        </section>

        <aside className="status-card">
          <section className="status-card__section">
            <p className="status-card__eyebrow">Truth Snapshot</p>
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
                <dt>Summary</dt>
                <dd>{truthSnapshot.summary}</dd>
              </div>
              <div className="status-facts__row">
                <dt>Service-relevant satellites</dt>
                <dd>{truthSnapshot.worldGeometry.satellites.length}</dd>
              </div>
            </dl>
          </section>

          <section className="status-card__section">
            <p className="status-card__eyebrow">Included Now</p>
            <ul className="status-list">
              {completedScope.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="status-card__section">
            <p className="status-card__eyebrow">Intentionally Deferred</p>
            <ul className="status-list status-list--muted">
              {deferredScope.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="status-card__section">
            <p className="status-card__eyebrow">Capability Profile</p>
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

          <section className="status-card__section">
            <p className="status-card__eyebrow">Current Service State</p>
            <dl className="status-facts">
              <div className="status-facts__row">
                <dt>Availability</dt>
                <dd>{availabilityLabel}</dd>
              </div>
              <div className="status-facts__row">
                <dt>Current visible relay path</dt>
                <dd>{currentCorridorLabel}</dd>
              </div>
              <div className="status-facts__row">
                <dt>Selected relay</dt>
                <dd>
                  {truthSnapshot.serviceSelection.kind === 'supported' && truthSnapshot.serviceSelection.selectedRelayId
                    ? satelliteLabels.get(truthSnapshot.serviceSelection.selectedRelayId) ?? truthSnapshot.serviceSelection.selectedRelayId
                    : 'Not provided'}
                </dd>
              </div>
            </dl>
          </section>

          <section className="status-card__section">
            <p className="status-card__eyebrow">Candidate Corridor Availability</p>
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

          <section className="status-card__section">
            <p className="status-card__eyebrow">Conservative Boundaries</p>
            <ul className="status-list status-list--muted">
              {conservativeBoundaries.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="status-card__section">
            <p className="status-card__eyebrow">WorldGeometryTruth Endpoints</p>
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

          <section className="status-card__section">
            <p className="status-card__eyebrow">WorldGeometryTruth Satellites</p>
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
        </aside>
      </main>
    </div>
  );
}
