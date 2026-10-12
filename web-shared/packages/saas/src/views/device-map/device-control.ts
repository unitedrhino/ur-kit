import type { ThingsApi } from '@vben/api';

export type DeviceMapControlValueType = 'bool' | 'enum' | 'float' | 'int';

export interface DeviceMapControlOption {
  label: string;
  value: string;
}

export interface DeviceMapControlSchema {
  identifier: string;
  max?: number;
  min?: number;
  name: string;
  options?: DeviceMapControlOption[];
  raw: ThingsApi.DeviceSchema;
  step?: number;
  valueType: DeviceMapControlValueType;
}

function parseJson(input: unknown): any {
  if (!input) return {};
  if (typeof input === 'object') return input;
  if (typeof input !== 'string') return {};
  try {
    return JSON.parse(input);
  } catch {
    return {};
  }
}

function toNumber(value: unknown, fallback: number) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function normalizeEnumOptions(mapping: unknown): DeviceMapControlOption[] {
  if (Array.isArray(mapping)) {
    return mapping
      .map((item) => ({
        label: String(item?.label ?? item?.name ?? item?.value ?? ''),
        value: String(item?.value ?? item?.key ?? ''),
      }))
      .filter((item) => item.value);
  }

  if (mapping && typeof mapping === 'object') {
    return Object.entries(mapping as Record<string, unknown>).map(([value, label]) => ({
      label: String(label),
      value,
    }));
  }

  return [];
}

export function normalizeControlSchemas(
  schemas: ThingsApi.DeviceSchema[],
): DeviceMapControlSchema[] {
  return schemas
    .map<DeviceMapControlSchema | null>((schema) => {
      const affordance = parseJson(schema.affordance);
      const define = affordance?.define ?? affordance;
      const valueType = define?.type as DeviceMapControlValueType | undefined;
      if (!schema.identifier || !valueType) return null;

      if (valueType === 'bool') {
        return {
          identifier: schema.identifier,
          name: schema.name || schema.identifier,
          raw: schema,
          valueType,
        };
      }

      if (valueType === 'enum') {
        const options = normalizeEnumOptions(define.mapping);
        if (options.length === 0) return null;
        return {
          identifier: schema.identifier,
          name: schema.name || schema.identifier,
          options,
          raw: schema,
          valueType,
        };
      }

      if (valueType === 'int' || valueType === 'float') {
        return {
          identifier: schema.identifier,
          max: toNumber(define.max, 100),
          min: toNumber(define.min ?? define.start, 0),
          name: schema.name || schema.identifier,
          raw: schema,
          step: toNumber(define.step, valueType === 'int' ? 1 : 0.1),
          valueType,
        };
      }

      return null;
    })
    .filter((item): item is DeviceMapControlSchema => !!item);
}

export function normalizeControlValue(
  control: DeviceMapControlSchema,
  value: unknown,
) {
  if (control.valueType === 'bool') return value === true || value === 1 || value === '1' || value === 'true' ? 1 : 0;
  if (control.valueType === 'int') return Math.trunc(toNumber(value, control.min ?? 0));
  if (control.valueType === 'float') return toNumber(value, control.min ?? 0);
  return String(value ?? '');
}

export function buildControlInitialValues(
  controls: DeviceMapControlSchema[],
  properties?: Record<string, ThingsApi.DeviceInfoWithProperty>,
) {
  const values: Record<string, boolean | number | string> = {};
  for (const control of controls) {
    const reportedValue = properties?.[control.identifier]?.value;
    if (reportedValue !== undefined && reportedValue !== null && reportedValue !== '') {
      if (control.valueType === 'bool') {
        const normalizedValue = String(reportedValue).toLowerCase();
        values[control.identifier] = normalizedValue === 'true' || normalizedValue === '1';
      } else if (control.valueType === 'int' || control.valueType === 'float') {
        values[control.identifier] = toNumber(reportedValue, control.min ?? 0);
      } else {
        values[control.identifier] = String(reportedValue);
      }
      continue;
    }

    if (control.valueType === 'bool') {
      values[control.identifier] = false;
    } else if (control.valueType === 'enum') {
      values[control.identifier] = control.options?.[0]?.value ?? '';
    } else {
      values[control.identifier] = control.min ?? 0;
    }
  }
  return values;
}

export function buildControlPayload(
  controls: DeviceMapControlSchema[],
  values: Record<string, unknown>,
) {
  const payload: Record<string, unknown> = {};
  for (const control of controls) {
    if (values[control.identifier] !== undefined) {
      payload[control.identifier] = normalizeControlValue(control, values[control.identifier]);
    }
  }
  return payload;
}
