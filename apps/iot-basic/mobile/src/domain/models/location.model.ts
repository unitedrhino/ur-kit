export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export type LocationFailureCode =
  | 'LOCATION_CANCELLED'
  | 'LOCATION_PERMISSION_DENIED'
  | 'LOCATION_UNAVAILABLE';

export class LocationError extends Error {
  constructor(
    public readonly code: LocationFailureCode,
    message: string,
  ) {
    super(message);
    this.name = 'LocationError';
  }
}

export function formatGeoPoint(point?: GeoPoint | null): string {
  if (!point) return '未设置';
  return `${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}`;
}
