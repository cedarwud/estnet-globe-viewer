import { useEffect, useRef, useState } from 'react';
import type {
  LocalContextAoiPack,
  LocalContextFeatureFootprint,
  LocalContextPanOffset,
} from './offlineAoiPacks';
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

interface LocalPoint {
  eastM: number;
  northM: number;
}

const CONTOUR_INTERVAL_M = 70;
const CONTOUR_MAJOR_INTERVAL_M = 140;
const FOOTPRINT_SEGMENTS = 28;
const LABEL_HEIGHT_ABOVE_GROUND_M = 38;
const CONTOUR_CASE_SEGMENTS: Record<number, Array<[number, number]>> = {
  1: [[3, 0]],
  2: [[0, 1]],
  3: [[3, 1]],
  4: [[1, 2]],
  5: [[3, 2], [0, 1]],
  6: [[0, 2]],
  7: [[3, 2]],
  8: [[2, 3]],
  9: [[0, 2]],
  10: [[0, 3], [1, 2]],
  11: [[1, 2]],
  12: [[1, 3]],
  13: [[0, 1]],
  14: [[0, 3]],
};

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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getCellAverageHeight(heightsM: number[][], rowIndex: number, columnIndex: number) {
  return (
    heightsM[rowIndex][columnIndex] +
    heightsM[rowIndex][columnIndex + 1] +
    heightsM[rowIndex + 1][columnIndex] +
    heightsM[rowIndex + 1][columnIndex + 1]
  ) / 4;
}

function sampleTerrainHeight(pack: LocalContextAoiPack, eastM: number, northM: number) {
  const { columns, rows, sampleSpacingM, heightsM } = pack.terrain;
  const halfWidthM = ((columns - 1) * sampleSpacingM) / 2;
  const halfHeightM = ((rows - 1) * sampleSpacingM) / 2;
  const columnPosition = clamp((eastM + halfWidthM) / sampleSpacingM, 0, columns - 1);
  const rowPosition = clamp((northM + halfHeightM) / sampleSpacingM, 0, rows - 1);
  const westColumn = Math.floor(columnPosition);
  const eastColumn = Math.min(columns - 1, westColumn + 1);
  const southRow = Math.floor(rowPosition);
  const northRow = Math.min(rows - 1, southRow + 1);
  const eastWeight = columnPosition - westColumn;
  const northWeight = rowPosition - southRow;
  const southHeight =
    heightsM[southRow][westColumn] * (1 - eastWeight) + heightsM[southRow][eastColumn] * eastWeight;
  const northHeight =
    heightsM[northRow][westColumn] * (1 - eastWeight) + heightsM[northRow][eastColumn] * eastWeight;

  return southHeight * (1 - northWeight) + northHeight * northWeight;
}

function getCellGradient(pack: LocalContextAoiPack, rowIndex: number, columnIndex: number) {
  const { heightsM, sampleSpacingM } = pack.terrain;
  const westAverage = (heightsM[rowIndex][columnIndex] + heightsM[rowIndex + 1][columnIndex]) / 2;
  const eastAverage = (heightsM[rowIndex][columnIndex + 1] + heightsM[rowIndex + 1][columnIndex + 1]) / 2;
  const southAverage = (heightsM[rowIndex][columnIndex] + heightsM[rowIndex][columnIndex + 1]) / 2;
  const northAverage = (heightsM[rowIndex + 1][columnIndex] + heightsM[rowIndex + 1][columnIndex + 1]) / 2;

  return {
    eastGradient: (eastAverage - westAverage) / sampleSpacingM,
    northGradient: (northAverage - southAverage) / sampleSpacingM,
  };
}

function getTerrainCellColor(
  cesium: CesiumRuntime,
  pack: LocalContextAoiPack,
  rowIndex: number,
  columnIndex: number,
  averageHeightM: number
) {
  const relativeHeight =
    (averageHeightM - pack.terrain.baseHeightM) /
    Math.max(1, pack.terrain.maxHeightM - pack.terrain.baseHeightM);
  const { eastGradient, northGradient } = getCellGradient(pack, rowIndex, columnIndex);
  const slopeStrength = Math.min(1, Math.hypot(eastGradient, northGradient) / 0.24);
  const lightVector = {
    east: -0.52,
    north: 0.38,
    up: 0.76,
  };
  const normalVector = {
    east: -eastGradient,
    north: -northGradient,
    up: 1,
  };
  const normalMagnitude = Math.hypot(normalVector.east, normalVector.north, normalVector.up) || 1;
  const lightMagnitude = Math.hypot(lightVector.east, lightVector.north, lightVector.up) || 1;
  const hillshade = clamp(
    (normalVector.east * lightVector.east +
      normalVector.north * lightVector.north +
      normalVector.up * lightVector.up) /
      (normalMagnitude * lightMagnitude),
    0,
    1
  );
  const basin = cesium.Color.fromCssColorString('#193043');
  const hillside = cesium.Color.fromCssColorString('#486250');
  const ridge = cesium.Color.fromCssColorString('#9f8b63');
  const shadow = cesium.Color.fromCssColorString('#102536');
  const sunlit = cesium.Color.fromCssColorString('#d7b47a');
  let mixed = cesium.Color.lerp(
    basin,
    hillside,
    clamp(relativeHeight * 1.08 + slopeStrength * 0.12, 0, 1),
    new cesium.Color()
  );

  mixed = cesium.Color.lerp(mixed, ridge, Math.max(0, relativeHeight - 0.46) * 1.7, mixed);
  mixed = cesium.Color.lerp(mixed, shadow, clamp((1 - hillshade) * 0.42 + slopeStrength * 0.08, 0, 0.48), mixed);
  mixed = cesium.Color.lerp(mixed, sunlit, clamp((hillshade - 0.48) * 0.88, 0, 0.34), mixed);

  return mixed.withAlpha(0.98);
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
        localMetersToCartesian(cesium, pack, -halfWidthM, -halfHeightM, baseHeightM - 36),
        localMetersToCartesian(cesium, pack, halfWidthM, -halfHeightM, baseHeightM - 36),
        localMetersToCartesian(cesium, pack, halfWidthM, halfHeightM, baseHeightM - 36),
        localMetersToCartesian(cesium, pack, -halfWidthM, halfHeightM, baseHeightM - 36),
      ]),
      perPositionHeight: true,
      material: cesium.Color.fromCssColorString('#091521').withAlpha(0.96),
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
            localMetersToCartesian(
              cesium,
              pack,
              eastM,
              northM,
              heightsM[rowIndex + 1][columnIndex + 1]
            ),
            localMetersToCartesian(cesium, pack, westM, northM, heightsM[rowIndex + 1][columnIndex]),
          ]),
          perPositionHeight: true,
          material: getTerrainCellColor(cesium, pack, rowIndex, columnIndex, averageHeightM),
        },
      });
    }
  }

  viewer.entities.add({
    name: 'AOI boundary',
    polyline: {
      positions: [
        localMetersToCartesian(cesium, pack, -halfWidthM, -halfHeightM, baseHeightM + 12),
        localMetersToCartesian(cesium, pack, halfWidthM, -halfHeightM, baseHeightM + 12),
        localMetersToCartesian(cesium, pack, halfWidthM, halfHeightM, baseHeightM + 12),
        localMetersToCartesian(cesium, pack, -halfWidthM, halfHeightM, baseHeightM + 12),
        localMetersToCartesian(cesium, pack, -halfWidthM, -halfHeightM, baseHeightM + 12),
      ],
      width: 2.3,
      material: cesium.Color.fromCssColorString('#93cfff').withAlpha(0.66),
    },
  });
}

function interpolateContourPoint(
  levelM: number,
  startPoint: LocalPoint,
  endPoint: LocalPoint,
  startHeightM: number,
  endHeightM: number
) {
  if (startHeightM === endHeightM) {
    return {
      eastM: (startPoint.eastM + endPoint.eastM) / 2,
      northM: (startPoint.northM + endPoint.northM) / 2,
    };
  }

  const interpolation = clamp((levelM - startHeightM) / (endHeightM - startHeightM), 0, 1);

  return {
    eastM: startPoint.eastM + (endPoint.eastM - startPoint.eastM) * interpolation,
    northM: startPoint.northM + (endPoint.northM - startPoint.northM) * interpolation,
  };
}

function buildTerrainContours(
  cesium: CesiumRuntime,
  viewer: CesiumViewer,
  pack: LocalContextAoiPack
) {
  const { columns, rows, sampleSpacingM, heightsM, baseHeightM, maxHeightM } = pack.terrain;
  const halfWidthM = ((columns - 1) * sampleSpacingM) / 2;
  const halfHeightM = ((rows - 1) * sampleSpacingM) / 2;
  const minimumContourM = Math.ceil((baseHeightM + 24) / CONTOUR_INTERVAL_M) * CONTOUR_INTERVAL_M;
  const maximumContourM = Math.floor((maxHeightM - 20) / CONTOUR_INTERVAL_M) * CONTOUR_INTERVAL_M;

  for (let contourLevelM = minimumContourM; contourLevelM <= maximumContourM; contourLevelM += CONTOUR_INTERVAL_M) {
    const isMajorContour = contourLevelM % CONTOUR_MAJOR_INTERVAL_M === 0;
    const contourColor = isMajorContour ? '#d8e6f0' : '#8fa6ba';

    for (let rowIndex = 0; rowIndex < rows - 1; rowIndex += 1) {
      for (let columnIndex = 0; columnIndex < columns - 1; columnIndex += 1) {
        const westM = columnIndex * sampleSpacingM - halfWidthM;
        const eastM = (columnIndex + 1) * sampleSpacingM - halfWidthM;
        const southM = rowIndex * sampleSpacingM - halfHeightM;
        const northM = (rowIndex + 1) * sampleSpacingM - halfHeightM;
        const southWestHeightM = heightsM[rowIndex][columnIndex];
        const southEastHeightM = heightsM[rowIndex][columnIndex + 1];
        const northEastHeightM = heightsM[rowIndex + 1][columnIndex + 1];
        const northWestHeightM = heightsM[rowIndex + 1][columnIndex];
        let contourCase = 0;

        if (southWestHeightM >= contourLevelM) {
          contourCase |= 1;
        }

        if (southEastHeightM >= contourLevelM) {
          contourCase |= 2;
        }

        if (northEastHeightM >= contourLevelM) {
          contourCase |= 4;
        }

        if (northWestHeightM >= contourLevelM) {
          contourCase |= 8;
        }

        const contourSegments = CONTOUR_CASE_SEGMENTS[contourCase];

        if (!contourSegments) {
          continue;
        }

        const edgePoints: Record<number, LocalPoint> = {
          0: interpolateContourPoint(
            contourLevelM,
            { eastM: westM, northM: southM },
            { eastM, northM: southM },
            southWestHeightM,
            southEastHeightM
          ),
          1: interpolateContourPoint(
            contourLevelM,
            { eastM, northM: southM },
            { eastM, northM },
            southEastHeightM,
            northEastHeightM
          ),
          2: interpolateContourPoint(
            contourLevelM,
            { eastM, northM },
            { eastM: westM, northM },
            northEastHeightM,
            northWestHeightM
          ),
          3: interpolateContourPoint(
            contourLevelM,
            { eastM: westM, northM },
            { eastM: westM, northM: southM },
            northWestHeightM,
            southWestHeightM
          ),
        };

        for (const [startEdge, endEdge] of contourSegments) {
          const startPoint = edgePoints[startEdge];
          const endPoint = edgePoints[endEdge];

          viewer.entities.add({
            polyline: {
              positions: [
                localMetersToCartesian(cesium, pack, startPoint.eastM, startPoint.northM, contourLevelM + 8),
                localMetersToCartesian(cesium, pack, endPoint.eastM, endPoint.northM, contourLevelM + 8),
              ],
              width: isMajorContour ? 2.2 : 1.2,
              material: cesium.Color.fromCssColorString(contourColor).withAlpha(
                isMajorContour ? 0.42 : 0.24
              ),
            },
          });
        }
      }
    }
  }
}

function buildFootprintPolygonPoints(footprint: LocalContextFeatureFootprint) {
  const rotationRad = (footprint.rotationDeg * Math.PI) / 180;
  const cosine = Math.cos(rotationRad);
  const sine = Math.sin(rotationRad);
  const points: LocalPoint[] = [];

  for (let segmentIndex = 0; segmentIndex < FOOTPRINT_SEGMENTS; segmentIndex += 1) {
    const angle = (segmentIndex / FOOTPRINT_SEGMENTS) * Math.PI * 2;
    const x = Math.cos(angle) * footprint.halfWidthM;
    const y = Math.sin(angle) * footprint.halfHeightM;

    points.push({
      eastM: footprint.centerEastM + x * cosine - y * sine,
      northM: footprint.centerNorthM + x * sine + y * cosine,
    });
  }

  return points;
}

function buildSiteContextFootprints(
  cesium: CesiumRuntime,
  viewer: CesiumViewer,
  pack: LocalContextAoiPack
) {
  for (const footprint of pack.footprints) {
    const polygonPoints = buildFootprintPolygonPoints(footprint);

    viewer.entities.add({
      name: footprint.label,
      polygon: {
        hierarchy: new cesium.PolygonHierarchy(
          polygonPoints.map((point) =>
            localMetersToCartesian(
              cesium,
              pack,
              point.eastM,
              point.northM,
              sampleTerrainHeight(pack, point.eastM, point.northM) + footprint.heightOffsetM
            )
          )
        ),
        perPositionHeight: true,
        material: cesium.Color.fromCssColorString(footprint.fillColor).withAlpha(
          footprint.kind === 'landing-terrace' ? 0.22 : 0.16
        ),
      },
      description: footprint.note,
    });

    viewer.entities.add({
      polyline: {
        positions: [
          ...polygonPoints.map((point) =>
            localMetersToCartesian(
              cesium,
              pack,
              point.eastM,
              point.northM,
              sampleTerrainHeight(pack, point.eastM, point.northM) + footprint.heightOffsetM + 3
            )
          ),
          localMetersToCartesian(
            cesium,
            pack,
            polygonPoints[0].eastM,
            polygonPoints[0].northM,
            sampleTerrainHeight(pack, polygonPoints[0].eastM, polygonPoints[0].northM) +
              footprint.heightOffsetM +
              3
          ),
        ],
        width: footprint.kind === 'landing-terrace' ? 3.4 : 2.3,
        material: cesium.Color.fromCssColorString(footprint.outlineColor).withAlpha(0.82),
      },
    });

    viewer.entities.add({
      position: localMetersToCartesian(
        cesium,
        pack,
        footprint.centerEastM,
        footprint.centerNorthM,
        sampleTerrainHeight(pack, footprint.centerEastM, footprint.centerNorthM) + LABEL_HEIGHT_ABOVE_GROUND_M
      ),
      label: {
        text: footprint.label,
        font: '600 13px "Avenir Next", sans-serif',
        fillColor: cesium.Color.fromCssColorString('#eff6ff'),
        outlineWidth: 2,
        outlineColor: cesium.Color.fromCssColorString('#07101b'),
        showBackground: true,
        backgroundColor: cesium.Color.fromCssColorString('#07101b').withAlpha(0.66),
        horizontalOrigin: cesium.HorizontalOrigin.CENTER,
        verticalOrigin: cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new cesium.Cartesian2(0, -6),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
  }
}

function buildSiteContextPaths(
  cesium: CesiumRuntime,
  viewer: CesiumViewer,
  pack: LocalContextAoiPack
) {
  for (const path of pack.paths) {
    const cartesianPositions = path.points.map((point) =>
      localMetersToCartesian(
        cesium,
        pack,
        point.eastM,
        point.northM,
        sampleTerrainHeight(pack, point.eastM, point.northM) + path.heightOffsetM
      )
    );

    viewer.entities.add({
      polyline: {
        positions: cartesianPositions,
        width: path.widthM + 2.4,
        material: cesium.Color.fromCssColorString('#09131d').withAlpha(0.62),
      },
      description: path.note,
    });

    viewer.entities.add({
      name: path.label,
      polyline: {
        positions: cartesianPositions,
        width: path.widthM,
        material: cesium.Color.fromCssColorString(path.color).withAlpha(
          path.kind === 'corridor-landing' ? 0.84 : 0.62
        ),
      },
    });

    if (path.kind === 'corridor-landing') {
      const labelPoint = path.points[Math.min(1, path.points.length - 1)] ?? path.points[0];

      viewer.entities.add({
        position: localMetersToCartesian(
          cesium,
          pack,
          labelPoint.eastM,
          labelPoint.northM,
          sampleTerrainHeight(pack, labelPoint.eastM, labelPoint.northM) + LABEL_HEIGHT_ABOVE_GROUND_M + 10
        ),
        label: {
          text: path.label,
          font: '600 13px "Avenir Next", sans-serif',
          fillColor: cesium.Color.fromCssColorString('#ffd8ab'),
          outlineWidth: 2,
          outlineColor: cesium.Color.fromCssColorString('#07101b'),
          showBackground: true,
          backgroundColor: cesium.Color.fromCssColorString('#07101b').withAlpha(0.66),
          horizontalOrigin: cesium.HorizontalOrigin.LEFT,
          verticalOrigin: cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new cesium.Cartesian2(14, -8),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
    }
  }
}

function buildServiceAnchors(
  cesium: CesiumRuntime,
  viewer: CesiumViewer,
  pack: LocalContextAoiPack
) {
  const siteAnchor = pack.anchors.find((anchor) => anchor.role === 'endpoint-site');
  const ridgeAnchor = pack.anchors.find((anchor) => anchor.role === 'service-lookout');

  for (const anchor of pack.anchors) {
    const groundHeightM = sampleTerrainHeight(pack, anchor.eastM, anchor.northM);
    const pedestalHeightM = anchor.role === 'endpoint-site' ? 16 : 12;
    const columnLengthM = anchor.role === 'endpoint-site' ? anchor.markerHeightM + 32 : anchor.markerHeightM + 24;
    const markerBaseHeightM = groundHeightM + pedestalHeightM;
    const markerCenterHeightM = markerBaseHeightM + columnLengthM / 2;
    const markerTopHeightM = markerBaseHeightM + columnLengthM;

    viewer.entities.add({
      position: localMetersToCartesian(cesium, pack, anchor.eastM, anchor.northM, markerCenterHeightM),
      cylinder: {
        length: columnLengthM,
        topRadius: anchor.role === 'endpoint-site' ? 4.6 : 3.2,
        bottomRadius: anchor.role === 'endpoint-site' ? 18 : 12,
        material: cesium.Color.fromCssColorString(anchor.accentColor).withAlpha(0.9),
      },
      point: {
        pixelSize: anchor.role === 'endpoint-site' ? 15 : 11,
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
        backgroundColor: cesium.Color.fromCssColorString('#08111d').withAlpha(0.74),
        horizontalOrigin: cesium.HorizontalOrigin.LEFT,
        verticalOrigin: cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new cesium.Cartesian2(16, -6),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      description: anchor.note,
    });

    viewer.entities.add({
      polyline: {
        positions: [
          localMetersToCartesian(cesium, pack, anchor.eastM, anchor.northM, groundHeightM + 4),
          localMetersToCartesian(cesium, pack, anchor.eastM, anchor.northM, markerTopHeightM + 2),
        ],
        width: anchor.role === 'endpoint-site' ? 2.8 : 2.1,
        material: cesium.Color.fromCssColorString(anchor.accentColor).withAlpha(0.82),
      },
    });
  }

  if (siteAnchor && ridgeAnchor) {
    viewer.entities.add({
      name: 'Corridor lookout axis',
      polyline: {
        positions: [
          localMetersToCartesian(
            cesium,
            pack,
            siteAnchor.eastM,
            siteAnchor.northM,
            sampleTerrainHeight(pack, siteAnchor.eastM, siteAnchor.northM) + 62
          ),
          localMetersToCartesian(
            cesium,
            pack,
            ridgeAnchor.eastM,
            ridgeAnchor.northM,
            sampleTerrainHeight(pack, ridgeAnchor.eastM, ridgeAnchor.northM) + 54
          ),
        ],
        width: 2.4,
        material: cesium.Color.fromCssColorString('#bfe6ff').withAlpha(0.56),
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

  viewer.scene.backgroundColor = cesium.Color.fromCssColorString('#07111b');
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
  buildTerrainContours(cesium, viewer, pack);
  buildSiteContextFootprints(cesium, viewer, pack);
  buildSiteContextPaths(cesium, viewer, pack);
  buildServiceAnchors(cesium, viewer, pack);
  viewer.scene.requestRender();

  return viewer;
}

function buildFocusHeight(pack: LocalContextAoiPack, focusOffset: LocalContextPanOffset) {
  return sampleTerrainHeight(pack, focusOffset.eastM, focusOffset.northM) + 180;
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
              buildFocusHeight(pack, focusOffset)
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
        viewer.scene.requestRender();

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
      localMetersToCartesian(cesium, pack, focusOffset.eastM, focusOffset.northM, buildFocusHeight(pack, focusOffset))
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
    viewer.scene.requestRender();
  }, [focusOffset.eastM, focusOffset.northM, pack]);

  useEffect(() => {
    const viewer = viewerRef.current;
    const focusEntity = focusEntityRef.current;
    const cesium = cesiumRuntimeRef.current;

    if (!viewer || !focusEntity || !cesium) {
      return;
    }

    void applyTrackedView(cesium, viewer, focusEntity, pack, 0.95);
    viewer.scene.requestRender();
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
