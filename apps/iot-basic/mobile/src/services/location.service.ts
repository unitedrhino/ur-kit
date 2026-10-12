import { LocationError, type GeoPoint } from '../domain/models/location.model';

type LocationType = 'wgs84' | 'gcj02';

type LocationApi = {
  getLocation?: (options: {
    type?: LocationType;
    success?: (res: { latitude: number; longitude: number }) => void;
    fail?: (error: { errMsg?: string; errCode?: number }) => void;
  }) => void;
};

function getDefaultLocationApi(): LocationApi {
  if (typeof uni !== 'undefined') {
    return uni as LocationApi;
  }
  if (typeof wx !== 'undefined') {
    return wx as LocationApi;
  }
  return {};
}

function supportsWgs84Fallback(error: { errMsg?: string; errCode?: number } | undefined): boolean {
  const lower = (error?.errMsg || '').toLowerCase();
  return lower.includes('gcj02') && (
    lower.includes('no support') ||
    lower.includes('not support') ||
    lower.includes('suppport')
  );
}

function classifyLocationFailure(error: { errMsg?: string; errCode?: number } | undefined): LocationError {
  const errMsg = error?.errMsg || '';
  const lower = errMsg.toLowerCase();
  if (lower.includes('auth deny') || lower.includes('authorize') || lower.includes('permission')) {
    return new LocationError('LOCATION_PERMISSION_DENIED', '定位权限未开启');
  }
  if (lower.includes('cancel')) {
    return new LocationError('LOCATION_CANCELLED', '已取消获取位置');
  }
  return new LocationError('LOCATION_UNAVAILABLE', errMsg || '暂时无法获取当前位置');
}

export class LocationService {
  constructor(private readonly locationApi: LocationApi = getDefaultLocationApi()) {}

  getCurrentLocation(): Promise<GeoPoint> {
    if (typeof this.locationApi.getLocation !== 'function') {
      return Promise.reject(new LocationError('LOCATION_UNAVAILABLE', '当前环境不支持获取位置'));
    }

    return this.requestLocation('gcj02');
  }

  private requestLocation(type: LocationType): Promise<GeoPoint> {
    return new Promise((resolve, reject) => {
      this.locationApi.getLocation!({
        type,
        success: (res) => {
          resolve({
            latitude: Number(res.latitude || 0),
            longitude: Number(res.longitude || 0),
          });
        },
        fail: (error) => {
          if (type === 'gcj02' && supportsWgs84Fallback(error)) {
            this.requestLocation('wgs84').then(resolve, reject);
            return;
          }
          reject(classifyLocationFailure(error));
        },
      });
    });
  }
}

export const locationService = new LocationService();
