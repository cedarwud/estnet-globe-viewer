import { mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import proj4 from 'proj4';
import shapefile from 'shapefile';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..');
const outputDir = join(repoRoot, 'public', 'assets', 'local-context');
const outputPath = join(outputDir, 'endpoint-alpha-taipei-official-place-context-v1.json');
const buildingsBaseDir = process.env.TAIPEI_BUILDINGS_DIR ?? '/tmp/taipei-buildings';
const sidewalksBaseDir = process.env.TAIPEI_SIDEWALKS_DIR ?? '/tmp/taipei-sidewalks';
const packCenter = {
  latitudeDeg: 25.033,
  longitudeDeg: 121.5654,
};
const primarySiteOffset = {
  eastM: -280,
  northM: -180,
};
const clipHalfExtentM = 1_000;
const minimumBuildingFloors = 2;
const minimumBuildingAreaM2 = 200;
const minimumSidewalkAreaM2 = 100;

proj4.defs(
  'EPSG:3826',
  '+proj=tmerc +lat_0=0 +lon_0=121 +k=0.9999 +x_0=250000 +y_0=0 +ellps=GRS80 +units=m +no_defs'
);

function walkFiles(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = join(directory, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      return walkFiles(fullPath);
    }

    return [fullPath];
  });
}

function findSingleFile(baseDirectory, extension) {
  const matches = walkFiles(baseDirectory).filter((filePath) => filePath.endsWith(extension));

  if (matches.length !== 1) {
    throw new Error(`Expected exactly one ${extension} file under ${baseDirectory}, found ${matches.length}.`);
  }

  return matches[0];
}

function getProjectedPackCenter() {
  const [centerX, centerY] = proj4('EPSG:4326', 'EPSG:3826', [
    packCenter.longitudeDeg,
    packCenter.latitudeDeg,
  ]);

  return {
    x: centerX,
    y: centerY,
  };
}

function normalizeRingCoordinates(ring) {
  if (ring.length <= 1) {
    return ring;
  }

  const [firstX, firstY] = ring[0];
  const [lastX, lastY] = ring[ring.length - 1];

  if (firstX === lastX && firstY === lastY) {
    return ring.slice(0, -1);
  }

  return ring;
}

function polygonArea(squareRing) {
  let area = 0;

  for (let pointIndex = 0; pointIndex < squareRing.length; pointIndex += 1) {
    const [currentX, currentY] = squareRing[pointIndex];
    const [nextX, nextY] = squareRing[(pointIndex + 1) % squareRing.length];
    area += currentX * nextY - nextX * currentY;
  }

  return Math.abs(area) / 2;
}

function polygonCentroid(squareRing) {
  let signedArea = 0;
  let centroidX = 0;
  let centroidY = 0;

  for (let pointIndex = 0; pointIndex < squareRing.length; pointIndex += 1) {
    const [currentX, currentY] = squareRing[pointIndex];
    const [nextX, nextY] = squareRing[(pointIndex + 1) % squareRing.length];
    const cross = currentX * nextY - nextX * currentY;
    signedArea += cross;
    centroidX += (currentX + nextX) * cross;
    centroidY += (currentY + nextY) * cross;
  }

  if (signedArea === 0) {
    const averageX = squareRing.reduce((sum, [x]) => sum + x, 0) / squareRing.length;
    const averageY = squareRing.reduce((sum, [, y]) => sum + y, 0) / squareRing.length;

    return {
      x: averageX,
      y: averageY,
    };
  }

  return {
    x: centroidX / (3 * signedArea),
    y: centroidY / (3 * signedArea),
  };
}

function bboxIntersectsClip(ring, clipCenter) {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const [x, y] of ring) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  return !(
    maxX < clipCenter.x - clipHalfExtentM ||
    minX > clipCenter.x + clipHalfExtentM ||
    maxY < clipCenter.y - clipHalfExtentM ||
    minY > clipCenter.y + clipHalfExtentM
  );
}

function relativePoint(point, projectedCenter) {
  return {
    eastM: Number((point[0] - projectedCenter.x).toFixed(2)),
    northM: Number((point[1] - projectedCenter.y).toFixed(2)),
  };
}

function toRelativePolygon(ring, projectedCenter) {
  return normalizeRingCoordinates(ring).map((point) => relativePoint(point, projectedCenter));
}

function clampBuildingHeight(floorCount) {
  return Math.max(18, Math.min(170, floorCount * 4.2));
}

async function collectBuildings(projectedCenter, clipCenter) {
  const shpPath = findSingleFile(buildingsBaseDir, '.shp');
  const dbfPath = findSingleFile(buildingsBaseDir, '.dbf');
  const source = await shapefile.open(shpPath, dbfPath, { encoding: 'utf-8' });
  const buildings = [];

  while (true) {
    const { done, value } = await source.read();

    if (done) {
      break;
    }

    if (!value.geometry) {
      continue;
    }

    const geometry = value.geometry;
    const exteriorRing =
      geometry.type === 'Polygon'
        ? geometry.coordinates[0]
        : geometry.type === 'MultiPolygon'
          ? geometry.coordinates[0]?.[0]
          : null;

    if (!exteriorRing || !bboxIntersectsClip(exteriorRing, clipCenter)) {
      continue;
    }

    const normalizedRing = normalizeRingCoordinates(exteriorRing);
    const floorCount = Number(value.properties.BUD_FLOOR ?? 0);
    const areaM2 = polygonArea(normalizedRing);

    if (floorCount < minimumBuildingFloors || areaM2 < minimumBuildingAreaM2) {
      continue;
    }

    const centroid = polygonCentroid(normalizedRing);

    buildings.push({
      id: `tp-building-${String(value.properties.BUDATT_NO ?? buildings.length + 1).replaceAll('.', '-')}`,
      floors: floorCount,
      heightM: Number(clampBuildingHeight(floorCount).toFixed(1)),
      areaM2: Number(areaM2.toFixed(1)),
      constructionType: value.properties.BUD_CONST ?? null,
      sourcePermitId: value.properties.BUDATT_NO ?? null,
      center: relativePoint([centroid.x, centroid.y], projectedCenter),
      footprint: toRelativePolygon(normalizedRing, projectedCenter),
    });
  }

  buildings.sort((left, right) => {
    if (right.floors !== left.floors) {
      return right.floors - left.floors;
    }

    return right.areaM2 - left.areaM2;
  });

  return buildings;
}

async function collectSidewalks(projectedCenter, clipCenter) {
  const shpPath = findSingleFile(sidewalksBaseDir, '.shp');
  const dbfPath = findSingleFile(sidewalksBaseDir, '.dbf');
  const source = await shapefile.open(shpPath, dbfPath, { encoding: 'utf-8' });
  const sidewalks = [];

  while (true) {
    const { done, value } = await source.read();

    if (done) {
      break;
    }

    if (!value.geometry) {
      continue;
    }

    const geometry = value.geometry;
    const exteriorRing =
      geometry.type === 'Polygon'
        ? geometry.coordinates[0]
        : geometry.type === 'MultiPolygon'
          ? geometry.coordinates[0]?.[0]
          : null;

    if (!exteriorRing || !bboxIntersectsClip(exteriorRing, clipCenter)) {
      continue;
    }

    const normalizedRing = normalizeRingCoordinates(exteriorRing);
    const areaM2 = polygonArea(normalizedRing);

    if (areaM2 < minimumSidewalkAreaM2) {
      continue;
    }

    const centroid = polygonCentroid(normalizedRing);

    sidewalks.push({
      id: `tp-sidewalk-${value.properties.keyid ?? sidewalks.length + 1}`,
      areaM2: Number(areaM2.toFixed(1)),
      center: relativePoint([centroid.x, centroid.y], projectedCenter),
      polygon: toRelativePolygon(normalizedRing, projectedCenter),
    });
  }

  sidewalks.sort((left, right) => right.areaM2 - left.areaM2);

  return sidewalks;
}

async function main() {
  const projectedCenter = getProjectedPackCenter();
  const clipCenter = {
    x: projectedCenter.x + primarySiteOffset.eastM,
    y: projectedCenter.y + primarySiteOffset.northM,
  };
  const buildings = await collectBuildings(projectedCenter, clipCenter);
  const sidewalks = await collectSidewalks(projectedCenter, clipCenter);

  const payload = {
    version: '2026-04-09-endpoint-alpha-official-place-context-v1',
    generatedAt: new Date().toISOString(),
    packId: 'endpoint-alpha-taipei-foothills',
    clip: {
      centeredOn: 'endpoint-alpha-service-site',
      halfExtentM: clipHalfExtentM,
    },
    summary: {
      buildingCount: buildings.length,
      sidewalkCount: sidewalks.length,
      tallestBuildingFloors: buildings[0]?.floors ?? 0,
    },
    provenance: {
      licenseLabel: 'Taipei City Government Open Data License',
      licenseUrl: 'https://data.taipei/rule',
      datasets: [
        {
          name: '臺北市建築執照套繪圖',
          datasetUrl: 'https://data.taipei/dataset/detail?id=af4281e7-ae72-4f8f-9a14-65b6f8d4b9ed',
          resourceDownloadUrl:
            'https://data.taipei/api/frontstage/tpeod/dataset/resource.download?rid=ccdfe8df-ef54-4c13-a93d-ba42968ced3b',
          updatedAt: '2025-12-29 14:16:06',
        },
        {
          name: '臺北市標線型人行道',
          datasetUrl: 'https://data.taipei/dataset/detail?id=d647b3af-4bbd-4e8f-b420-8f6c1bc1b597',
          resourceDownloadUrl:
            'https://data.taipei/api/frontstage/tpeod/dataset/resource.download?rid=2d82d5f1-8f97-45db-89df-162ba161dedb',
          updatedAt: '2026-03-19 14:56:08',
        },
      ],
    },
    buildings,
    sidewalks,
  };

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(
    JSON.stringify(
      {
        outputPath,
        buildingCount: buildings.length,
        sidewalkCount: sidewalks.length,
      },
      null,
      2
    )
  );
}

await main();
