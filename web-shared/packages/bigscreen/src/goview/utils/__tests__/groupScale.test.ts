import { describe, expect, it } from 'vitest';

import { computeGroupContentScale } from '../groupScale';

describe('computeGroupContentScale', () => {
  it('keeps width and height scaling independent', () => {
    expect(
      computeGroupContentScale({
        containerWidth: 600,
        containerHeight: 200,
        designWidth: 300,
        designHeight: 100,
      }),
    ).toEqual({
      left: 0,
      top: 0,
      contentWidth: 600,
      contentHeight: 200,
      scaleX: 2,
      scaleY: 2,
    });

    expect(
      computeGroupContentScale({
        containerWidth: 900,
        containerHeight: 200,
        designWidth: 300,
        designHeight: 100,
      }),
    ).toEqual({
      left: 0,
      top: 0,
      contentWidth: 900,
      contentHeight: 200,
      scaleX: 3,
      scaleY: 2,
    });
  });

  it('subtracts padding and title height from the available content area', () => {
    expect(
      computeGroupContentScale({
        containerWidth: 500,
        containerHeight: 360,
        designWidth: 400,
        designHeight: 300,
        padding: 20,
        titleHeight: 40,
      }),
    ).toEqual({
      left: 20,
      top: 60,
      contentWidth: 460,
      contentHeight: 280,
      scaleX: 1.15,
      scaleY: 0.9333333333333333,
    });
  });
});
