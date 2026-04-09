export interface OfficialPlaceContextPoint {
  eastM: number;
  northM: number;
}

export interface OfficialPlaceContextBuilding {
  id: string;
  floors: number;
  heightM: number;
  areaM2: number;
  constructionType: string | null;
  sourcePermitId: string | null;
  center: OfficialPlaceContextPoint;
  footprint: OfficialPlaceContextPoint[];
}

export interface OfficialPlaceContextSidewalk {
  id: string;
  areaM2: number;
  center: OfficialPlaceContextPoint;
  polygon: OfficialPlaceContextPoint[];
}

export interface OfficialPlaceContextAsset {
  version: string;
  generatedAt: string;
  packId: string;
  clip: {
    centeredOn: string;
    halfExtentM: number;
  };
  summary: {
    buildingCount: number;
    sidewalkCount: number;
    tallestBuildingFloors: number;
  };
  provenance: {
    licenseLabel: string;
    licenseUrl: string;
    datasets: Array<{
      name: string;
      datasetUrl: string;
      resourceDownloadUrl: string;
      updatedAt: string;
    }>;
  };
  buildings: OfficialPlaceContextBuilding[];
  sidewalks: OfficialPlaceContextSidewalk[];
}

export async function loadOfficialPlaceContextAsset(assetPath: string) {
  const response = await fetch(assetPath);

  if (!response.ok) {
    throw new Error(`Unable to load official place-context asset from ${assetPath}.`);
  }

  return (await response.json()) as OfficialPlaceContextAsset;
}
