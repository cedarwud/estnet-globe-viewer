export type ViewerRoute =
  | {
      kind: 'globe';
    }
  | {
      kind: 'local';
      aoiId: string;
    };

const globeHash = '#/globe';
const localHashPrefix = '#/local/';

export function parseViewerRouteHash(hash: string): ViewerRoute {
  if (!hash || hash === '#' || hash === globeHash) {
    return { kind: 'globe' };
  }

  if (hash.startsWith(localHashPrefix)) {
    const aoiId = hash.slice(localHashPrefix.length).trim();

    if (aoiId.length > 0) {
      return {
        kind: 'local',
        aoiId,
      };
    }
  }

  return { kind: 'globe' };
}

export function buildViewerRouteHash(route: ViewerRoute) {
  return route.kind === 'globe' ? globeHash : `${localHashPrefix}${route.aoiId}`;
}

export function syncViewerRouteHash(route: ViewerRoute) {
  const nextHash = buildViewerRouteHash(route);

  if (window.location.hash !== nextHash) {
    window.location.hash = nextHash;
  }
}
