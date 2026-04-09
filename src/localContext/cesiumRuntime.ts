export type CesiumRuntime = typeof import('cesium');
export type CesiumViewer = import('cesium').Viewer;
export type CesiumEntity = import('cesium').Entity;

const CESIUM_RUNTIME_BASE_URL = '/cesium/';

declare global {
  interface Window {
    CESIUM_BASE_URL?: string;
  }
}

let cesiumRuntimePromise: Promise<CesiumRuntime> | null = null;

export async function loadCesiumRuntime(): Promise<CesiumRuntime> {
  if (typeof window !== 'undefined' && window.CESIUM_BASE_URL !== CESIUM_RUNTIME_BASE_URL) {
    window.CESIUM_BASE_URL = CESIUM_RUNTIME_BASE_URL;
  }

  if (!cesiumRuntimePromise) {
    cesiumRuntimePromise = Promise.all([
      import('cesium'),
      import('cesium/Build/Cesium/Widgets/widgets.css'),
    ]).then(([cesium]) => cesium);
  }

  return cesiumRuntimePromise;
}
