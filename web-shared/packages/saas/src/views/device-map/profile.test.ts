import { describe, expect, it } from 'vitest';

import {
  createDeviceKey,
  mergeDevicesWithProfilePoints,
  parseDeviceMapProfile,
  serializeDeviceMapProfile,
} from './profile';

describe('device map profile', () => {
  it('falls back to an empty v2 profile when params are invalid', () => {
    const profile = parseDeviceMapProfile('{bad json', {
      areaID: 'area-1',
      imageUrl: 'https://img.example.com/floor.png',
      imageWidth: 800,
      imageHeight: 600,
    });

    expect(profile.schemaVersion).toBe(2);
    expect(profile.areaID).toBe('area-1');
    expect(profile.image).toEqual({
      height: 600,
      url: 'https://img.example.com/floor.png',
      width: 800,
    });
    expect(profile.points).toEqual([]);
  });

  it('merges current devices with saved points and filters stale points', () => {
    const profile = parseDeviceMapProfile(
      JSON.stringify({
        schemaVersion: 2,
        areaID: 'area-1',
        image: { url: 'old.png', width: 500, height: 300 },
        points: [
          { deviceKey: 'p1::d1', productID: 'p1', deviceName: 'd1', lat: 10, lng: 20, size: 50 },
          { deviceKey: 'p2::stale', productID: 'p2', deviceName: 'stale', lat: 30, lng: 40, size: 44 },
        ],
      }),
      { areaID: 'area-1', imageUrl: 'new.png', imageWidth: 900, imageHeight: 700 },
    );

    const merged = mergeDevicesWithProfilePoints(
      [
        { productID: 'p1', deviceName: 'd1', deviceAlias: '灯 1' },
        { productID: 'p3', deviceName: 'd3', deviceAlias: '空调 3' },
      ] as any,
      profile,
    );

    expect(merged).toHaveLength(2);
    expect(merged[0]).toMatchObject({ deviceKey: 'p1::d1', isPlotted: true, lat: 10, lng: 20, size: 50 });
    expect(merged[1]).toMatchObject({ deviceKey: 'p3::d3', isPlotted: false, size: 44 });
    expect(serializeDeviceMapProfile(profile, merged)).toContain('"deviceName":"d1"');
    expect(serializeDeviceMapProfile(profile, merged)).not.toContain('stale');
  });

  it('creates stable device keys from product and device names', () => {
    expect(createDeviceKey('product-a', 'device-1')).toBe('product-a::device-1');
  });
});
