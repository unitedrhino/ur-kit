import { describe, expect, it } from 'vitest';

import { shouldSelectByVisibleArea } from '../visibleAreaHitTest';

describe('shouldSelectByVisibleArea', () => {
  it('allows selecting non-image components by default', () => {
    const result = shouldSelectByVisibleArea(
      { clientX: 10, clientY: 10 } as MouseEvent,
      { chartConfig: { key: 'TextCommon' }, option: {} } as any,
      null,
    );

    expect(result).toBe(true);
  });

  it('ignores contain image blank area below the real image', () => {
    const container = document.createElement('div');
    const image = document.createElement('img');
    container.appendChild(image);

    Object.defineProperty(image, 'naturalWidth', { value: 1000, configurable: true });
    Object.defineProperty(image, 'naturalHeight', { value: 100, configurable: true });
    (container as any).getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      right: 1000,
      bottom: 300,
      width: 1000,
      height: 300,
    });

    const inside = shouldSelectByVisibleArea(
      { clientX: 500, clientY: 120 } as MouseEvent,
      { chartConfig: { key: 'Image' }, option: { fit: 'contain' } } as any,
      container,
    );
    const outside = shouldSelectByVisibleArea(
      { clientX: 500, clientY: 240 } as MouseEvent,
      { chartConfig: { key: 'Image' }, option: { fit: 'contain' } } as any,
      container,
    );

    expect(inside).toBe(true);
    expect(outside).toBe(false);
  });

  it('ignores contain video blank area below the real video', () => {
    const container = document.createElement('div');
    const video = document.createElement('video');
    container.appendChild(video);

    Object.defineProperty(video, 'videoWidth', { value: 1000, configurable: true });
    Object.defineProperty(video, 'videoHeight', { value: 100, configurable: true });
    (container as any).getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      right: 1000,
      bottom: 300,
      width: 1000,
      height: 300,
    });

    const inside = shouldSelectByVisibleArea(
      { clientX: 500, clientY: 120 } as MouseEvent,
      { chartConfig: { key: 'Video' }, option: { fit: 'contain' } } as any,
      container,
    );
    const outside = shouldSelectByVisibleArea(
      { clientX: 500, clientY: 240 } as MouseEvent,
      { chartConfig: { key: 'Video' }, option: { fit: 'contain' } } as any,
      container,
    );

    expect(inside).toBe(true);
    expect(outside).toBe(false);
  });

  it('ignores contain image carousel blank area below the real image', () => {
    const container = document.createElement('div');
    const image = document.createElement('img');
    container.appendChild(image);

    Object.defineProperty(image, 'naturalWidth', { value: 1000, configurable: true });
    Object.defineProperty(image, 'naturalHeight', { value: 100, configurable: true });
    (container as any).getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      right: 1000,
      bottom: 300,
      width: 1000,
      height: 300,
    });

    const inside = shouldSelectByVisibleArea(
      { clientX: 500, clientY: 120 } as MouseEvent,
      { chartConfig: { key: 'ImageCarousel' }, option: { fit: 'contain' } } as any,
      container,
    );
    const outside = shouldSelectByVisibleArea(
      { clientX: 500, clientY: 240 } as MouseEvent,
      { chartConfig: { key: 'ImageCarousel' }, option: { fit: 'contain' } } as any,
      container,
    );

    expect(inside).toBe(true);
    expect(outside).toBe(false);
  });
});
