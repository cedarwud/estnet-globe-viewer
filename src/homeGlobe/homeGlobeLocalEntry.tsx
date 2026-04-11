import { useMemo } from 'react';
import type { GlobeLocalInspectCue } from '../components/globe/HeroGlobe';
import type { LocalContextAoiPack } from '../localContext/offlineAoiPacks';

interface HomeGlobeLocalInspectCueParams {
  available: boolean;
  pack: LocalContextAoiPack | null;
  serviceSiteArrivalRegion: {
    halfWidthM: number;
    halfHeightM: number;
  } | null;
  primaryServiceSiteAnchor: {
    eastM: number;
    northM: number;
  } | null;
  siteAnchorLabel: string;
  showsReturnEcho: boolean;
}

interface GroundContextPreviewData {
  width: number;
  height: number;
  baselineY: number;
  areaPath: string;
  profilePath: string;
  previewAnchors: Array<{
    id: string;
    label: string;
    x: number;
    y: number;
    accentColor: string;
    primary: boolean;
  }>;
  spanKmLabel: string;
  reliefMetersLabel: number;
  anchorCountLabel: number;
  additionalAnchorCount: number;
}

export interface GroundContextPreviewProps {
  pack: LocalContextAoiPack;
  siteAnchorLabel: string;
  currentCorridorLabel: string;
  endpointPairLabel: string;
  onClearEcho: () => void;
  showsReturnEcho: boolean;
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
function buildGroundPreviewData(pack: LocalContextAoiPack): GroundContextPreviewData {
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

export function buildHomeGlobeLocalInspectCue({
  available,
  pack,
  serviceSiteArrivalRegion,
  primaryServiceSiteAnchor,
  siteAnchorLabel,
  showsReturnEcho,
}: HomeGlobeLocalInspectCueParams): GlobeLocalInspectCue | null {
  if (!available || !pack || !serviceSiteArrivalRegion || !primaryServiceSiteAnchor) {
    return null;
  }

  return {
    endpointId: pack.endpointId,
    targetLabel: pack.targetLabel,
    regionLabel: pack.regionLabel,
    siteAnchorLabel,
    siteCenter: pack.center,
    siteAnchorOffset: {
      eastM: primaryServiceSiteAnchor.eastM,
      northM: primaryServiceSiteAnchor.northM,
    },
    arrivalRegion: serviceSiteArrivalRegion,
    state: showsReturnEcho ? 'echo' : 'discoverable',
  };
}

export function buildHomeGlobeLocalEntryReason(params: {
  available: boolean;
  reason: string;
  showsReturnEcho: boolean;
  siteAnchorLabel: string;
}) {
  if (!params.available) {
    return params.reason;
  }

  if (params.showsReturnEcho) {
    return 'The recently inspected arrival hemisphere stays pinned until you clear the echo or refresh it with another local return.';
  }

  return `The home stage now holds the corridor inside one arrival hemisphere with a bounded landing region and offline terrain pack ready around ${params.siteAnchorLabel}.`;
}

export function GroundContextPreview({
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
