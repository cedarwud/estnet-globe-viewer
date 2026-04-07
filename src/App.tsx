import type { CSSProperties } from 'react';
import { HeroGlobeScene } from './components/globe/HeroGlobeScene';
import { placeholderEndpoints } from './data/placeholderEndpoints';

const completedScope = [
  'Offline-only app shell with no producer dependency',
  'Single hero globe primary stage',
  'Camera orbit and zoom baseline',
  'Two distant placeholder endpoint anchors',
];

const deferredScope = [
  'Canonical truth interfaces',
  'Service corridor and availability rendering',
  'Selective satellite context',
  'Reference replay smoke via estnet-bootstrap-kit',
];

export function App() {
  return (
    <div className="shell">
      <header className="hero-copy">
        <p className="hero-copy__eyebrow">Commit 02 Baseline</p>
        <h1 className="hero-copy__title">Offline Hero Globe Shell</h1>
        <p className="hero-copy__body">
          This stage proves the globe-first primary scene can stand on its own before canonical truth
          contracts or any external replay producer enter the repo.
        </p>

        <div className="hero-copy__chips">
          <span className="hero-chip">No producer required</span>
          <span className="hero-chip">Placeholder endpoints only</span>
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
            <p className="stage-card__meta">Orbit drag to inspect. Scroll to zoom.</p>
          </div>

          <div className="stage-card__viewport">
            <HeroGlobeScene endpoints={placeholderEndpoints} />
          </div>
        </section>

        <aside className="status-card">
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
            <p className="status-card__eyebrow">Placeholder Anchors</p>
            <div className="endpoint-cards">
              {placeholderEndpoints.map((endpoint) => (
                <article
                  key={endpoint.id}
                  className="endpoint-card"
                  style={{ '--endpoint-accent': endpoint.color } as CSSProperties}
                >
                  <p className="endpoint-card__label">{endpoint.label}</p>
                  <p className="endpoint-card__region">{endpoint.regionLabel}</p>
                  <p className="endpoint-card__coords">
                    {endpoint.latitudeDeg.toFixed(1)}°, {endpoint.longitudeDeg.toFixed(1)}°
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
