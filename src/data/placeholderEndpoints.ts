export interface PlaceholderEndpoint {
  id: string;
  label: string;
  regionLabel: string;
  latitudeDeg: number;
  longitudeDeg: number;
  color: string;
}

export const placeholderEndpoints: PlaceholderEndpoint[] = [
  {
    id: 'endpoint-alpha',
    label: 'Endpoint Alpha',
    regionLabel: 'East Asia placeholder',
    latitudeDeg: 25.033,
    longitudeDeg: 121.5654,
    color: '#ffbf69',
  },
  {
    id: 'endpoint-bravo',
    label: 'Endpoint Bravo',
    regionLabel: 'Europe placeholder',
    latitudeDeg: 48.8566,
    longitudeDeg: 2.3522,
    color: '#7bdff2',
  },
];
