import { useEffect, useRef, useState } from 'react';
import type { LocalContextAoiPack, LocalContextPanOffset } from './offlineAoiPacks';
import {
  loadCesiumRuntime,
  type CesiumEntity,
  type CesiumRuntime,
  type CesiumViewer,
} from './cesiumRuntime';

interface LocalContextSceneProps {
  pack: LocalContextAoiPack;
  focusOffset: LocalContextPanOffset;
  resetRevision: number;
}

function metersToLatitudeDegrees(meters: number) {
  return meters / 111_320;
}

function metersToLongitudeDegrees(meters: number, latitudeDeg: number) {
  const latitudeRad = (latitudeDeg * Math.PI) / 180;
  const metersPerDegree = 111_320 * Math.cos(latitudeRad);

  return metersPerDegree === 0 ? 0 : meters / metersPerDegree;
}

function localMetersToCartesian(
  cesium: CesiumRuntime,
  pack: LocalContextAoiPack,
  eastM: number,
  northM: number,
  heightM: number
) {
  const latitudeDeg = pack.center.latitudeDeg + metersToLatitudeDegrees(northM);
  const longitudeDeg = pack.center.longitudeDeg + metersToLongitudeDegrees(eastM, pack.center.latitudeDeg);

  return cesium.Cartesian3.fromDegrees(longitudeDeg, latitudeDeg, heightM);
}

function getCellAverageHeight(heightsM: number[][], rowIndex: number, columnIndex: number) {
  return (
    heightsM[rowIndex][columnIndex] +
    heightsM[rowIndex][columnIndex + 1] +
    heightsM[rowIndex + 1][columnIndex] +
    heightsM[rowIndex + 1][columnIndex + 1]
  ) / 4;
}

function getTerrainCellColor(
  cesium: CesiumRuntime,
  pack: LocalContextAoiPack,
  averageHeightM: number
) {
  const relativeHeight =
    (averageHeightM - pack.terrain.baseHeightM) /
    Math.max(1, pack.terrain.maxHeightM - pack.terrain.baseHeightM);
  const ridgeTone = Math.min(1, Math.max(0, relativeHeight));
  const valley = cesium.Color.fromCssColorString('#324b61');
  const slope = cesium.Color.fromCssColorString('#567960');
  const ridge = cesium.Color.fromCssColorString('#8aa36f');
  const mixed = cesium.Color.lerp(valley, slope, Math.min(1, ridgeTone * 0.85), new cesium.Color());

  return cesium.Color.lerp(mixed, ridge, Math.max(0, ridgeTone - 0.48) * 1.5, new cesium.Color()).withAlpha(0.96);
}

function buildTerrainSurface(
  cesium: CesiumRuntime,
  viewer: CesiumViewer,
  pack: LocalContextAoiPack
) {
  const { columns, rows, sampleSpacingM, heightsM, baseHeightM } = pack.terrain;
  const halfWidthM = ((columns - 1) * sampleSpacingM) / 2;
  const halfHeightM = ((rows - 1) * sampleSpacingM) / 2;

  viewer.entities.add({
    name: 'AOI floor',
    polygon: {
      hierarchy: new cesium.PolygonHierarchy([
        localMetersToCartesian(cesium, pack, -halfWidthM, -halfHeightM, baseHeightM - 24),
        localMetersToCartesian(cesium, pack, halfWidthM, -halfHeightM, baseHeightM - 24),
        localMetersToCartesian(cesium, pack, halfWidthM, halfHeightM, baseHeightM - 24),
        localMetersToCartesian(cesium, pack, -halfWidthM, halfHeightM, baseHeightM - 24),
      ]),
      perPositionHeight: true,
      material: cesium.Color.fromCssColorString('#122133').withAlpha(0.96),
    },
  });

  for (let rowIndex = 0; rowIndex < rows - 1; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < columns - 1; columnIndex += 1) {
      const westM = columnIndex * sampleSpacingM - halfWidthM;
      const eastM = (columnIndex + 1) * sampleSpacingM - halfWidthM;
      const southM = rowIndex * sampleSpacingM - halfHeightM;
      const northM = (rowIndex + 1) * sampleSpacingM - halfHeightM;
      const averageHeightM = getCellAverageHeight(heightsM, rowIndex, columnIndex);

      viewer.entities.add({
        polygon: {
          hierarchy: new cesium.PolygonHierarchy([
            localMetersToCartesian(cesium, pack, westM, southM, heightsM[rowIndex][columnIndex]),
            localMetersToCartesian(cesium, pack, eastM, southM, heightsM[rowIndex][columnIndex + 1]),
            localMetersToCartesian(cesium, pack, eastM, northM, heightsM[rowIndex + 1][columnIndex + 1]),
            localMetersToCartesian(cesium, pack, westM, northM, heightsM[rowIndex + 1][columnIndex]),
          ]),
          perPositionHeight: true,
          material: getTerrainCellColor(cesium, pack, averageHeightM),
        },
      });
    }
  }

  viewer.entities.add({
    name: 'AOI boundary',
    polyline: {
      positions: [
        localMetersToCartesian(cesium, pack, -halfWidthM, -halfHeightM, baseHeightM + 6),
        localMetersToCartesian(cesium, pack, halfWidthM, -halfHeightM, baseHeightM + 6),
        localMetersToCartesian(cesium, pack, halfWidthM, halfHeightM, baseHeightM + 6),
        localMetersToCartesian(cesium, pack, -halfWidthM, halfHeightM, baseHeightM + 6),
        localMetersToCartesian(cesium, pack, -halfWidthM, -halfHeightM, baseHeightM + 6),
      ],
      width: 2.1,
      material: cesium.Color.fromCssColorString('#8ed2ff').withAlpha(0.78),
    },
  });
}

function buildServiceAnchors(
  cesium: CesiumRuntime,
  viewer: CesiumViewer,
  pack: LocalContextAoiPack
) {
  const [siteAnchor, ridgeAnchor] = pack.anchors;

  for (const anchor of pack.anchors) {
    const markerBase = localMetersToCartesian(cesium, pack, anchor.eastM, anchor.northM, anchor.markerHeightM);
    const markerCenter = localMetersToCartesian(
      cesium,
      pack,
      anchor.eastM,
      anchor.northM,
      anchor.markerHeightM + 34
    );

    viewer.entities.add({
      position: markerCenter,
      cylinder: {
        length: 68,
        topRadius: anchor.role === 'endpoint-site' ? 4 : 3,
        bottomRadius: anchor.role === 'endpoint-site' ? 18 : 12,
        material: cesium.Color.fromCssColorString(anchor.accentColor).withAlpha(0.88),
      },
      point: {
        pixelSize: anchor.role === 'endpoint-site' ? 14 : 11,
        color: cesium.Color.fromCssColorString(anchor.accentColor),
        outlineColor: cesium.Color.fromCssColorString('#08111d'),
        outlineWidth: 2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: anchor.label,
        font: '600 15px "Avenir Next", sans-serif',
        fillColor: cesium.Color.fromCssColorString('#f4f8ff'),
        outlineWidth: 2,
        outlineColor: cesium.Color.fromCssColorString('#08111d'),
        showBackground: true,
        backgroundColor: cesium.Color.fromCssColorString('#08111d').withAlpha(0.72),
        horizontalOrigin: cesium.HorizontalOrigin.LEFT,
        verticalOrigin: cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new cesium.Cartesian2(16, -6),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      description: anchor.note,
    });

    viewer.entities.add({
      polyline: {
        positions: [markerBase, markerCenter],
        width: 2.2,
        material: cesium.Color.fromCssColorString(anchor.accentColor).withAlpha(0.76),
      },
    });
  }

  if (siteAnchor && ridgeAnchor) {
    viewer.entities.add({
      name: 'Local service sightline',
      polyline: {
        positions: [
          localMetersToCartesian(
            cesium,
            pack,
            siteAnchor.eastM,
            siteAnchor.northM,
            siteAnchor.markerHeightM + 42
          ),
          localMetersToCartesian(
            cesium,
            pack,
            ridgeAnchor.eastM,
            ridgeAnchor.northM,
            ridgeAnchor.markerHeightM + 38
          ),
        ],
        width: 3.2,
        material: cesium.Color.fromCssColorString('#8ed2ff').withAlpha(0.58),
      },
    });
  }
}

function createViewer(
  cesium: CesiumRuntime,
  container: HTMLDivElement,
  pack: LocalContextAoiPack
) {
  const viewer = new cesium.Viewer(container, {
    baseLayer: false,
    animation: false,
    timeline: false,
    fullscreenButton: false,
    baseLayerPicker: false,
    geocoder: false,
    homeButton: false,
    infoBox: false,
    sceneModePicker: false,
    navigationHelpButton: false,
    selectionIndicator: false,
    requestRenderMode: true,
    scene3DOnly: true,
  });

  viewer.scene.backgroundColor = cesium.Color.fromCssColorString('#06101b');
  viewer.scene.globe.show = false;
  viewer.scene.skyBox = undefined;
  viewer.scene.skyAtmosphere = undefined;
  viewer.scene.fog.enabled = false;
  viewer.scene.sun = undefined;
  viewer.scene.moon = undefined;

  const controls = viewer.scene.screenSpaceCameraController;
  controls.enableTranslate = false;
  controls.enableLook = false;
  controls.enableRotate = true;
  controls.enableTilt = true;
  controls.enableZoom = true;
  controls.minimumZoomDistance = pack.defaultCamera.minRangeM;
  controls.maximumZoomDistance = pack.defaultCamera.maxRangeM;
  controls.maximumTiltAngle = cesium.Math.toRadians(pack.defaultCamera.maxTiltDeg);

  viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
  viewer.cesiumWidget.creditContainer.classList.add('cesium-credit--compact');

  buildTerrainSurface(cesium, viewer, pack);
  buildServiceAnchors(cesium, viewer, pack);

  return viewer;
}

function applyTrackedView(
  cesium: CesiumRuntime,
  viewer: CesiumViewer,
  focusEntity: CesiumEntity,
  pack: LocalContextAoiPack,
  duration = 0
) {
  viewer.trackedEntity = focusEntity;

  return viewer.flyTo(focusEntity, {
    duration,
    offset: new cesium.HeadingPitchRange(
      cesium.Math.toRadians(pack.defaultCamera.headingDeg),
      cesium.Math.toRadians(pack.defaultCamera.pitchDeg),
      pack.defaultCamera.rangeM
    ),
  });
}

export function LocalContextScene({
  pack,
  focusOffset,
  resetRevision,
}: LocalContextSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<CesiumViewer | null>(null);
  const focusEntityRef = useRef<CesiumEntity | null>(null);
  const cesiumRuntimeRef = useRef<CesiumRuntime | null>(null);
  const [loadState, setLoadState] = useState<{
    status: 'loading' | 'ready' | 'error';
    message: string;
  }>({
    status: 'loading',
    message: 'Loading local context...',
  });

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return undefined;
    }

    let disposed = false;

    setLoadState({
      status: 'loading',
      message: 'Loading local context...',
    });

    void (async () => {
      try {
        const cesium = await loadCesiumRuntime();

        if (disposed) {
          return;
        }

        const viewer = createViewer(cesium, container, pack);
        const focusEntity = viewer.entities.add({
          position: new cesium.ConstantPositionProperty(
            localMetersToCartesian(
              cesium,
              pack,
              focusOffset.eastM,
              focusOffset.northM,
              pack.terrain.baseHeightM + 160
            )
          ),
          point: {
            pixelSize: 1,
            color: cesium.Color.TRANSPARENT,
          },
        });

        cesiumRuntimeRef.current = cesium;
        viewerRef.current = viewer;
        focusEntityRef.current = focusEntity;
        await applyTrackedView(cesium, viewer, focusEntity, pack);

        if (!disposed) {
          setLoadState({
            status: 'ready',
            message: '',
          });
        }
      } catch (error) {
        if (disposed) {
          return;
        }

        setLoadState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Unable to load the local context runtime.',
        });
      }
    })();

    return () => {
      disposed = true;
      focusEntityRef.current = null;
      cesiumRuntimeRef.current = null;

      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
      }

      viewerRef.current = null;
    };
  }, [pack]);

  useEffect(() => {
    const viewer = viewerRef.current;
    const focusEntity = focusEntityRef.current;
    const cesium = cesiumRuntimeRef.current;

    if (!viewer || !focusEntity || !cesium) {
      return;
    }

    focusEntity.position = new cesium.ConstantPositionProperty(
      localMetersToCartesian(
        cesium,
        pack,
        focusOffset.eastM,
        focusOffset.northM,
        pack.terrain.baseHeightM + 160
      )
    );

    void viewer.flyTo(focusEntity, {
      duration: 0.7,
      offset: new cesium.HeadingPitchRange(
        viewer.camera.heading,
        viewer.camera.pitch,
        Math.min(
          pack.defaultCamera.maxRangeM,
          Math.max(pack.defaultCamera.minRangeM, viewer.camera.positionCartographic.height)
        )
      ),
    });
  }, [focusOffset.eastM, focusOffset.northM, pack]);

  useEffect(() => {
    const viewer = viewerRef.current;
    const focusEntity = focusEntityRef.current;
    const cesium = cesiumRuntimeRef.current;

    if (!viewer || !focusEntity || !cesium) {
      return;
    }

    void applyTrackedView(cesium, viewer, focusEntity, pack, 0.95);
  }, [pack, resetRevision]);

  return (
    <div className="local-context-scene">
      <div
        ref={containerRef}
        className="local-context-scene__canvas"
      />
      {loadState.status !== 'ready' ? (
        <div
          className={`local-context-scene__status-surface local-context-scene__status-surface--${loadState.status}`}
          aria-live="polite"
        >
          <p className="local-context-scene__status">{loadState.message}</p>
        </div>
      ) : null}
    </div>
  );
}
