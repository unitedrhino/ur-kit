import { describe, expect, it } from 'vitest';

import {
  CONTROL_SCHEMA_TYPE_ACTION,
  buildChangedControlPayload,
  buildChangedActionItems,
  buildControlDevices,
  buildDeviceKey,
  buildFailedControlMap,
  buildRetryDevices,
  buildSchemaRequest,
  isMissingControlModeColumnError,
  normalizeControlSchemas,
  selectRowsByKeys,
  collectFailedControlResults,
} from './modules/device-control-model';

describe('org-iot-client device control model', () => {
  it('does not send group control mode for a single device schema request', () => {
    const request = buildSchemaRequest([{ productID: 'p1', deviceName: 'd1' }]);

    expect(request.productIDs).toEqual(['p1']);
    expect(request).not.toHaveProperty('controlMode');
  });

  it('sends group control mode when controlling multiple devices', () => {
    const request = buildSchemaRequest([
      { productID: 'p1', deviceName: 'd1' },
      { productID: 'p1', deviceName: 'd2' },
    ]);

    expect(request.productIDs).toEqual(['p1']);
    expect(request.controlMode).toBe(1);
  });

  it('can build a group schema fallback request without controlMode', () => {
    const request = buildSchemaRequest(
      [
        { productID: 'p1', deviceName: 'd1' },
        { productID: 'p1', deviceName: 'd2' },
      ],
      { omitControlMode: true },
    );

    expect(request).not.toHaveProperty('controlMode');
    expect(request.productIDs).toEqual(['p1']);
  });

  it('supports read-only property schema requests', () => {
    const request = buildSchemaRequest([{ productID: 'p1', deviceName: 'd1' }], { propertyMode: 'r' });

    expect(request.propertyMode).toBe('r');
    expect(request).toHaveProperty('productSceneMode', 'rw');
  });

  it('shows readonly properties and action schemas while preferring writable duplicates', () => {
    const schemas = normalizeControlSchemas(
      [
        {
          identifier: 'temp',
          type: CONTROL_SCHEMA_TYPE_ACTION,
          affordance: JSON.stringify({
            dir: 'down',
            input: [
              {
                identifier: 'seconds',
                name: '秒数',
                define: { type: 'int', start: 3, min: 1, max: 60, step: 1 },
              },
            ],
          }),
        },
        {
          identifier: 'mode',
          type: 1,
          affordance: JSON.stringify({ mode: 'r', define: { type: 'enum', mapping: { auto: '自动', manual: '手动' } } }),
        },
        {
          identifier: 'mode',
          type: 1,
          affordance: JSON.stringify({ mode: 'rw', define: { type: 'enum', mapping: { auto: '自动', manual: '手动' } } }),
        },
      ],
      [{ productID: 'p1', deviceName: 'd1', withProperties: { mode: { value: 'manual' } } }],
    );

    const actionItem = schemas.find((item) => item.schemaType === CONTROL_SCHEMA_TYPE_ACTION);
    const readOnlyProperties = schemas.filter((item) => item.identifier === 'mode' && item.schemaType !== CONTROL_SCHEMA_TYPE_ACTION);

    expect(actionItem).toBeTruthy();
    expect(actionItem?.schemaType).toBe(3);
    expect(actionItem?.initialValue).toBeTruthy();
    expect(JSON.parse(String(actionItem?.initialValue)).seconds).toBe(3);
    expect(readOnlyProperties).toHaveLength(1);
    expect(readOnlyProperties[0]?.isReadonly).toBe(false);
  });

  it('filters non-group controls locally when schema fallback omits controlMode', () => {
    const schemas = normalizeControlSchemas(
      [
        {
          identifier: 'groupable',
          affordance: '{"controlMode":1,"define":{"type":"float","min":0,"max":100},"mode":"rw"}',
        },
        {
          identifier: 'singleOnly',
          affordance: '{"controlMode":2,"define":{"type":"float","min":0,"max":100},"mode":"rw"}',
        },
        {
          identifier: 'legacyDefault',
          affordance: '{"define":{"type":"bool"},"mode":"rw"}',
        },
      ],
      [
        { productID: 'p1', deviceName: 'd1' },
        { productID: 'p1', deviceName: 'd2' },
      ],
    );

    expect(schemas.map((item) => item.identifier)).toEqual(['groupable', 'legacyDefault']);
  });

  it('detects backend errors caused by the legacy control_mode column filter', () => {
    expect(isMissingControlModeColumnError({ detail: 'column "control_mode" does not exist' })).toBe(true);
    expect(isMissingControlModeColumnError({ message: 'other error' })).toBe(false);
  });

  it('builds payload from changed controls only', () => {
    const payload = buildChangedControlPayload({
      power: true,
      mode: 'auto',
      untouched: undefined,
    });

    expect(payload).toEqual({ power: true, mode: 'auto' });
  });

  it('builds bulk actions from changed action items only', () => {
    const actions = buildChangedActionItems(
      [
        {
          identifier: 'restart',
          schemaType: CONTROL_SCHEMA_TYPE_ACTION,
          affordance: { input: [{ identifier: 'seconds' }] },
        },
        {
          identifier: 'selfTest',
          schemaType: CONTROL_SCHEMA_TYPE_ACTION,
          affordance: { input: [] },
        },
        {
          identifier: 'power',
          schemaType: 1,
        },
      ],
      {
        restart: true,
        selfTest: false,
      },
    );

    expect(actions.map((item) => item.identifier)).toEqual(['restart']);
  });

  it('maps selected rows to control devices', () => {
    const devices = buildControlDevices([
      { productID: 'p1', deviceName: 'd1', deviceAlias: '一号设备' },
      { productID: 'p2', deviceName: 'd2' },
    ]);

    expect(devices).toEqual([
      { productID: 'p1', deviceName: 'd1' },
      { productID: 'p2', deviceName: 'd2' },
    ]);
  });

  it('collects group control failures by non-200 result code', () => {
    const failures = collectFailedControlResults([
      { deviceName: 'd1', code: 200 },
      { deviceName: 'd2', code: 500 },
      { deviceName: 'd3', code: '200' },
      { deviceName: 'd4', code: '404' },
    ]);

    expect(failures.map((item) => item.deviceName)).toEqual(['d2', 'd4']);
  });

  it('maps failed device results onto each changed control item', () => {
    const failureMap = buildFailedControlMap(
      {
        power: true,
        temp: 26,
      },
      [
        { productID: 'p1', deviceName: 'd2', code: 500, msg: 'timeout' },
        { productID: 'p1', deviceName: 'd3', code: 404, msg: 'offline' },
      ],
    );

    expect(failureMap.power?.count).toBe(2);
    expect(failureMap.temp?.count).toBe(2);
    expect(failureMap.power?.results.map((item) => item.deviceName)).toEqual(['d2', 'd3']);
  });

  it('retries a single control on failed devices first', () => {
    const devices = buildRetryDevices(
      [
        { productID: 'p1', deviceName: 'd1' },
        { productID: 'p1', deviceName: 'd2' },
      ],
      [{ deviceName: 'd2', code: 500 }],
    );

    expect(devices).toEqual([{ productID: 'p1', deviceName: 'd2' }]);
  });

  it('selects dialog target rows by device keys', () => {
    const rows = [
      { productID: 'p1', deviceName: 'd1' },
      { productID: 'p1', deviceName: 'd2' },
      { productID: 'p2', deviceName: 'd1' },
    ];
    const selectedRows = selectRowsByKeys(rows, [buildDeviceKey(rows[1]!), buildDeviceKey(rows[2]!)]);

    expect(selectedRows).toEqual([rows[1], rows[2]]);
  });
});
