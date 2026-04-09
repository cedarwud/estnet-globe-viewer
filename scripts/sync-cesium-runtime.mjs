import { access, cp, mkdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cesiumBuildRoot = path.join(repoRoot, 'node_modules', 'cesium', 'Build', 'Cesium');
const publicCesiumRoot = path.join(repoRoot, 'public', 'cesium');
const requiredRuntimeDirectories = ['Assets', 'ThirdParty', 'Workers', 'Widgets'];

async function assertReadableDirectory(directoryPath) {
  await access(directoryPath, constants.R_OK);
}

async function syncRuntimeDirectory(directoryName) {
  const sourceDirectory = path.join(cesiumBuildRoot, directoryName);
  const targetDirectory = path.join(publicCesiumRoot, directoryName);

  await assertReadableDirectory(sourceDirectory);
  await mkdir(publicCesiumRoot, { recursive: true });
  await cp(sourceDirectory, targetDirectory, {
    recursive: true,
    force: true,
  });
}

for (const directoryName of requiredRuntimeDirectories) {
  await syncRuntimeDirectory(directoryName);
}

console.log(
  `[prepare:cesium-runtime] synced ${requiredRuntimeDirectories.join(', ')} to ${path.relative(repoRoot, publicCesiumRoot)}`
);
