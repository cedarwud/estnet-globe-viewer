import type { CSSProperties } from 'react';
import { HeroGlobeScene } from './components/globe/HeroGlobeScene';
import { mockTruthProvider } from './mock/mockTruthProvider';
import type { DatasetCapabilityProfile } from './truth/contracts';
import { useTruthSnapshot } from './truth/useTruthSnapshot';

const completedScope = [
  'Canonical truth vocabulary and dataset capability profile',
  'Minimal synchronous TruthProvider seam',
  'In-memory mock truth path with placeholder adapter',
  'Hero globe scene and status UI reading the same truth snapshot',
];

const deferredScope = [
  'Selective service corridor baseline',
  'Active versus unavailable visual grammar',
  'Selective satellite context',
  'Reference replay smoke via estnet-bootstrap-kit',
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

export function App() {
  const truthSnapshot = useTruthSnapshot(mockTruthProvider);
  const capabilityRows = capabilityEntries(truthSnapshot.capabilityProfile);
  const truthGaps = [
    truthSnapshot.serviceAvailability.kind === 'unsupported'
      ? `ServiceAvailabilityTruth: ${truthSnapshot.serviceAvailability.reason}`
      : `ServiceAvailabilityTruth: ${truthSnapshot.serviceAvailability.currentAvailability}`,
    truthSnapshot.serviceSelection.kind === 'unsupported'
      ? `ServiceSelectionTruth: ${truthSnapshot.serviceSelection.reason}`
      : `ServiceSelectionTruth: active path ${truthSnapshot.serviceSelection.activePath ? 'present' : 'empty'}`,
    truthSnapshot.eventTruth.events.length === 0
      ? 'EventTruth: derived-only surface is present, but this baseline intentionally keeps the event set empty.'
      : `EventTruth: ${truthSnapshot.eventTruth.events.length} derived events`,
  ];

  return (
    <div className="shell">
      <header className="hero-copy">
        <p className="hero-copy__eyebrow">Commit 03 Baseline</p>
        <h1 className="hero-copy__title">Canonical Truth Mock Path</h1>
        <p className="hero-copy__body">
          This stage keeps the viewer offline-first while moving the hero globe onto a real canonical truth
          vocabulary, so future provider swaps replace the truth path instead of rewriting the scene or UI.
        </p>

        <div className="hero-copy__chips">
          <span className="hero-chip">Mock TruthProvider seam</span>
          <span className="hero-chip">Single canonical snapshot</span>
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
              Orbit drag to inspect. Scroll to zoom.
            </p>
          </div>

          <div className="stage-card__viewport">
            <HeroGlobeScene endpoints={truthSnapshot.worldGeometry.endpoints} />
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
            <p className="status-card__eyebrow">Current Truth Gaps</p>
            <ul className="status-list status-list--muted">
              {truthGaps.map((item) => (
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
        </aside>
      </main>
    </div>
  );
}
