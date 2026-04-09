import { useMemo, useState } from 'react';
import { LocalContextScene } from './LocalContextScene';
import type { LocalContextAoiPack, LocalContextPanOffset } from './offlineAoiPacks';

interface LocalContextStageProps {
  pack: LocalContextAoiPack;
  availabilityLabel: string;
  availabilityTone: 'available' | 'unavailable' | 'unsupported';
  currentCorridorLabel: string;
  endpointPairLabel: string;
  relayLabel: string;
  onBackToGlobe: () => void;
}

function clampOffset(value: number, directionLimit: number) {
  return Math.max(-directionLimit, Math.min(directionLimit, value));
}

export function LocalContextStage({
  pack,
  availabilityLabel,
  availabilityTone,
  currentCorridorLabel,
  endpointPairLabel,
  relayLabel,
  onBackToGlobe,
}: LocalContextStageProps) {
  const [focusOffset, setFocusOffset] = useState<LocalContextPanOffset>({
    eastM: 0,
    northM: 0,
  });
  const [resetRevision, setResetRevision] = useState(0);

  const canPanNorth = focusOffset.northM < pack.panBoundsM.northM;
  const canPanSouth = focusOffset.northM > -pack.panBoundsM.northM;
  const canPanEast = focusOffset.eastM < pack.panBoundsM.eastM;
  const canPanWest = focusOffset.eastM > -pack.panBoundsM.eastM;
  const reliefMetersLabel = Math.round(pack.terrain.maxHeightM - pack.terrain.baseHeightM);
  const aoiSpanKmLabel = ((pack.halfExtentM * 2) / 1000).toFixed(1);
  const localDestinationSummary = useMemo(() => {
    return `${pack.placeNarrative.placeLabel} stays tied to ${relayLabel} as one bounded hillside destination instead of a free-roam local browser.`;
  }, [pack.placeNarrative.placeLabel, relayLabel]);

  const nudgeFocus = (eastDeltaM: number, northDeltaM: number) => {
    setFocusOffset((current) => ({
      eastM: clampOffset(current.eastM + eastDeltaM, pack.panBoundsM.eastM),
      northM: clampOffset(current.northM + northDeltaM, pack.panBoundsM.northM),
    }));
  };

  const resetLocalView = () => {
    setFocusOffset({
      eastM: 0,
      northM: 0,
    });
    setResetRevision((current) => current + 1);
  };

  return (
    <>
      <div className="viewer-stage viewer-stage--local">
        <LocalContextScene
          pack={pack}
          focusOffset={focusOffset}
          resetRevision={resetRevision}
        />
      </div>

      <div className="viewer-overlay viewer-overlay--local">
        <section
          className="floating-card shared-service-context-bar"
          aria-label="Shared service context"
        >
          <div className="shared-service-context-bar__summary">
            <div className="shared-service-context-bar__topline">
              <div className="shared-service-context-bar__continuity">
                <p className="floating-card__eyebrow">Scale Handoff</p>
                <div
                  className="continuity-trail continuity-trail--local"
                  aria-label="Scale handoff continuity"
                >
                  <span className="continuity-chip continuity-chip--globe">Globe corridor</span>
                  <span className="continuity-trail__arrow">-&gt;</span>
                  <span className="continuity-chip continuity-chip--local">Local inspect</span>
                </div>
              </div>

              <div className="shared-service-context-bar__headline">
                <span className={`availability-pill availability-pill--${availabilityTone}`}>
                  {availabilityLabel}
                </span>
                <p className="shared-service-context-bar__title">{pack.placeNarrative.placeLabel}</p>
                <span className="local-destination-chip">Terrain-ready destination</span>
              </div>
            </div>

            <p className="shared-service-context-bar__copy shared-service-context-bar__copy--emphasis">
              {localDestinationSummary}
            </p>
            <p className="shared-service-context-bar__copy">
              Current corridor: {currentCorridorLabel}
            </p>

            <div className="shared-service-context-bar__facts">
              <span className="shared-service-context-bar__fact">{endpointPairLabel}</span>
              <span className="shared-service-context-bar__fact">{aoiSpanKmLabel} km AOI span</span>
              <span className="shared-service-context-bar__fact">{reliefMetersLabel} m relief</span>
              <span className="shared-service-context-bar__fact">{pack.anchors.length} site-linked anchors</span>
            </div>

            <div className="shared-service-context-bar__features">
              {pack.placeNarrative.featureLabels.map((featureLabel) => (
                <span
                  key={featureLabel}
                  className="shared-service-context-bar__feature-chip"
                >
                  {featureLabel}
                </span>
              ))}
            </div>

            <p className="shared-service-context-bar__copy shared-service-context-bar__copy--muted">
              {pack.placeNarrative.placeSummary}
            </p>
            <p className="shared-service-context-bar__copy shared-service-context-bar__copy--muted">
              {pack.placeNarrative.terrainSummary}
            </p>
          </div>

          <div className="shared-service-context-bar__actions">
            <div
              className="local-pan-pad"
              aria-label="Local AOI pan controls"
            >
              <button
                type="button"
                className="local-pan-pad__button"
                disabled={!canPanNorth}
                onClick={() => nudgeFocus(0, pack.panStepM)}
              >
                Pan North
              </button>
              <div className="local-pan-pad__row">
                <button
                  type="button"
                  className="local-pan-pad__button"
                  disabled={!canPanWest}
                  onClick={() => nudgeFocus(-pack.panStepM, 0)}
                >
                  Pan West
                </button>
                <button
                  type="button"
                  className="local-pan-pad__button"
                  disabled={!canPanEast}
                  onClick={() => nudgeFocus(pack.panStepM, 0)}
                >
                  Pan East
                </button>
              </div>
              <button
                type="button"
                className="local-pan-pad__button"
                disabled={!canPanSouth}
                onClick={() => nudgeFocus(0, -pack.panStepM)}
              >
                Pan South
              </button>
            </div>

            <div className="local-primary-actions">
              <button
                type="button"
                className="scene-action"
                onClick={resetLocalView}
              >
                Reset Local View
              </button>
              <button
                type="button"
                className="scene-action scene-action--active"
                onClick={onBackToGlobe}
              >
                Back to Globe
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
