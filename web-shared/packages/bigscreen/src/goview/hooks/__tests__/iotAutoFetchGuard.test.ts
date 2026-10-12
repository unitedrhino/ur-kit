import { describe, expect, it } from 'vitest';

import { RequestDataTypeEnum } from '../../enums/httpEnum';

import { shouldRunIotAutoFetch } from '../iotAutoFetchGuard';

describe('shouldRunIotAutoFetch', () => {
  it('allows deviceStatus auto fetch without product scope', () => {
    expect(
      shouldRunIotAutoFetch(RequestDataTypeEnum.IoTDevice, {
        aggFunc: 'last',
        aggFuncs: [],
        areaIDs: [],
        dataIDs: [],
        dataView: 'prop',
        deviceNames: [],
        logAggregationMode: 'intraday',
        logInterval: '10m',
        logTimeRange: '1h',
        mode: 'latest',
        queryType: 'deviceStatus',
        selectedFields: ['systemUptimeDays'],
      } as any),
    ).toBe(true);
  });

  it('keeps property queries requiring product scope and data ids', () => {
    expect(
      shouldRunIotAutoFetch(RequestDataTypeEnum.IoTDevice, {
        aggFunc: 'last',
        aggFuncs: [],
        areaIDs: [],
        dataIDs: ['P'],
        dataView: 'prop',
        deviceNames: ['d1'],
        logAggregationMode: 'intraday',
        logInterval: '10m',
        logTimeRange: '1h',
        mode: 'latest',
        productID: '',
        productCategoryCode: '',
        queryType: 'property',
      } as any),
    ).toBe(false);
  });

  it('requires devices for deviceInfo queries', () => {
    expect(
      shouldRunIotAutoFetch(RequestDataTypeEnum.IoTDevice, {
        aggFunc: 'last',
        aggFuncs: [],
        areaIDs: [],
        dataIDs: [],
        dataView: 'prop',
        deviceNames: [],
        logAggregationMode: 'intraday',
        logInterval: '10m',
        logTimeRange: '1h',
        mode: 'latest',
        productID: '100',
        queryType: 'deviceInfo',
      } as any),
    ).toBe(false);
  });
});
