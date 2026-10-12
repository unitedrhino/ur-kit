import type { ThingsApi } from '@vben/api';

export const DEVICE_MAP_PROFILE_SCHEMA_VERSION = 2;
export const DEFAULT_DEVICE_MAP_MARKER_SIZE = 44;

export interface DeviceMapPoint {
  deviceKey: string;
  deviceName: string;
  lat: number;
  lng: number;
  productID: string;
  size: number;
}

export interface DeviceMapProfileV2 {
  areaID: string;
  image: {
    height: number;
    url: string;
    width: number;
  };
  parseError?: string;
  points: DeviceMapPoint[];
  schemaVersion: 2;
  viewport: {
    center: [number, number];
    zoom: number;
  };
}

export interface DeviceMapProfileContext {
  areaID: string;
  imageHeight?: number;
  imageUrl?: string;
  imageWidth?: number;
}

export interface DeviceMapRuntimeDevice extends DeviceMapPoint {
  device: ThingsApi.DeviceInfo;
  imageUrl: string;
  isPlotted: boolean;
  label: string;
  statusLabel: string;
  statusTone: 'default' | 'error' | 'success' | 'warning';
}

export function createDeviceKey(productID?: null | string, deviceName?: null | string) {
  return `${String(productID ?? '')}::${String(deviceName ?? '')}`;
}

function toFiniteNumber(value: unknown, fallback: number) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function createEmptyProfile(context: DeviceMapProfileContext): DeviceMapProfileV2 {
  const width = toFiniteNumber(context.imageWidth, 0);
  const height = toFiniteNumber(context.imageHeight, 0);
  return {
    areaID: context.areaID,
    image: {
      height,
      url: context.imageUrl ?? '',
      width,
    },
    points: [],
    schemaVersion: DEVICE_MAP_PROFILE_SCHEMA_VERSION,
    viewport: {
      center: [height / 2, width / 2],
      zoom: 0,
    },
  };
}

function normalizePoint(raw: any): DeviceMapPoint | null {
  const productID = String(raw?.productID ?? '').trim();
  const deviceName = String(raw?.deviceName ?? '').trim();
  if (!productID || !deviceName) return null;

  const lat = Number(raw?.lat);
  const lng = Number(raw?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    deviceKey: raw?.deviceKey || createDeviceKey(productID, deviceName),
    deviceName,
    lat,
    lng,
    productID,
    size: Math.max(24, toFiniteNumber(raw?.size, DEFAULT_DEVICE_MAP_MARKER_SIZE)),
  };
}

export function parseDeviceMapProfile(
  params: null | string | undefined,
  context: DeviceMapProfileContext,
): DeviceMapProfileV2 {
  const fallback = createEmptyProfile(context);
  if (!params || !params.trim()) return fallback;

  try {
    const raw = JSON.parse(params) as Partial<DeviceMapProfileV2>;
    const rawImage = raw.image ?? ({} as DeviceMapProfileV2['image']);
    const imageWidth = toFiniteNumber(context.imageWidth ?? rawImage.width, 0);
    const imageHeight = toFiniteNumber(context.imageHeight ?? rawImage.height, 0);
    const rawCenter = Array.isArray(raw.viewport?.center) ? raw.viewport.center : [];
    const points = Array.isArray(raw.points)
      ? raw.points.map(normalizePoint).filter((item): item is DeviceMapPoint => !!item)
      : [];

    return {
      areaID: context.areaID || String(raw.areaID ?? ''),
      image: {
        height: imageHeight,
        url: context.imageUrl ?? rawImage.url ?? '',
        width: imageWidth,
      },
      points,
      schemaVersion: DEVICE_MAP_PROFILE_SCHEMA_VERSION,
      viewport: {
        center: [
          toFiniteNumber(rawCenter[0], imageHeight / 2),
          toFiniteNumber(rawCenter[1], imageWidth / 2),
        ],
        zoom: toFiniteNumber(raw.viewport?.zoom, 0),
      },
    };
  } catch (error) {
    return {
      ...fallback,
      parseError: error instanceof Error ? error.message : 'Invalid JSON',
    };
  }
}

export function getDeviceStatusMeta(status?: number): {
  label: string;
  tone: DeviceMapRuntimeDevice['statusTone'];
} {
  switch (status) {
    case 1: {
      return { label: '未激活', tone: 'default' };
    }
    case 2: {
      return { label: '在线', tone: 'success' };
    }
    case 3: {
      return { label: '离线', tone: 'warning' };
    }
    case 4: {
      return { label: '异常', tone: 'error' };
    }
    default: {
      return { label: '未知', tone: 'default' };
    }
  }
}

export function mergeDevicesWithProfilePoints(
  devices: ThingsApi.DeviceInfo[],
  profile: DeviceMapProfileV2,
): DeviceMapRuntimeDevice[] {
  const pointMap = new Map(profile.points.map((point) => [point.deviceKey, point]));

  return devices
    .filter((device) => !!device.productID && !!device.deviceName)
    .map((device) => {
      const deviceKey = createDeviceKey(device.productID, device.deviceName);
      const point = pointMap.get(deviceKey);
      const statusMeta = getDeviceStatusMeta(device.status ?? device.isOnline);
      return {
        device,
        deviceKey,
        deviceName: device.deviceName,
        imageUrl: device.deviceImg || device.productImg || '',
        isPlotted: !!point,
        label: device.deviceAlias || device.deviceName,
        lat: point?.lat ?? 0,
        lng: point?.lng ?? 0,
        productID: device.productID,
        size: point?.size ?? DEFAULT_DEVICE_MAP_MARKER_SIZE,
        statusLabel: statusMeta.label,
        statusTone: statusMeta.tone,
      };
    });
}

export function toSavableDeviceMapProfile(
  profile: DeviceMapProfileV2,
  devices: DeviceMapRuntimeDevice[],
): DeviceMapProfileV2 {
  const points = devices
    .filter((device) => device.isPlotted)
    .map<DeviceMapPoint>((device) => ({
      deviceKey: device.deviceKey,
      deviceName: device.deviceName,
      lat: device.lat,
      lng: device.lng,
      productID: device.productID,
      size: device.size,
    }));

  return {
    areaID: profile.areaID,
    image: { ...profile.image },
    points,
    schemaVersion: DEVICE_MAP_PROFILE_SCHEMA_VERSION,
    viewport: { ...profile.viewport },
  };
}

export function serializeDeviceMapProfile(
  profile: DeviceMapProfileV2,
  devices: DeviceMapRuntimeDevice[],
) {
  return JSON.stringify(toSavableDeviceMapProfile(profile, devices));
}
