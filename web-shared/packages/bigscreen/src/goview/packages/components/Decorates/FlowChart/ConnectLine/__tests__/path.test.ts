import { describe, expect, it } from 'vitest';

import { buildConnectLinePath, resolveConnectLinePathPoints } from '../path';

describe('connect line path helpers', () => {
  it('keeps elbow multi-point lines based on the original polyline', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 40, y: 30 },
      { x: 80, y: 10 },
    ];

    expect(resolveConnectLinePathPoints(points, 'elbow', 0.25, 'horizontal')).toEqual(points);
  });

  it('keeps rounded elbow multi-point lines based on the original polyline', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 40, y: 30 },
      { x: 80, y: 10 },
    ];

    expect(resolveConnectLinePathPoints(points, 'roundedElbow', 0.25, 'horizontal')).toEqual(points);
  });

  it('keeps straight multi-point lines on the original polyline', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 40, y: 30 },
      { x: 80, y: 10 },
    ];

    expect(resolveConnectLinePathPoints(points, 'straight', 0.25, 'horizontal')).toEqual(points);
  });

  it('keeps elbow two-point lines on the original segment', () => {
    const points = resolveConnectLinePathPoints(
      [
        { x: 0, y: 0 },
        { x: 100, y: 80 },
      ],
      'elbow',
      0.25,
      'horizontal',
    );

    expect(points).toEqual([
      { x: 0, y: 0 },
      { x: 100, y: 80 },
    ]);
  });

  it('only applies smooth cubic commands to rounded elbow paths', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 40, y: 0 },
      { x: 40, y: 30 },
      { x: 80, y: 30 },
    ];

    expect(buildConnectLinePath(points, 'roundedElbow', 12)).toContain(' C ');
    expect(buildConnectLinePath(points, 'elbow', 12)).not.toContain(' C ');
  });

  it('uses bend ratio as the smoothing strength for rounded elbow paths', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 40, y: 0 },
      { x: 40, y: 30 },
      { x: 80, y: 30 },
    ];

    expect(buildConnectLinePath(points, 'roundedElbow', 12, 0.2)).not.toBe(buildConnectLinePath(points, 'roundedElbow', 12, 1));
  });

  it('keeps rounded elbow two-point lines on the original segment', () => {
    const points = resolveConnectLinePathPoints(
      [
        { x: 0, y: 0 },
        { x: 100, y: 80 },
      ],
      'roundedElbow',
      0.25,
      'horizontal',
    );

    expect(points).toEqual([
      { x: 0, y: 0 },
      { x: 100, y: 80 },
    ]);
  });
});
