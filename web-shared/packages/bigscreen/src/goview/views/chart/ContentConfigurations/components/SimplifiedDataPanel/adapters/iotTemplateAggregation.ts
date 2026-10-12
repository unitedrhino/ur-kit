import type { RequestIoTDeviceConfigType } from '@/store/modules/chartEditStore/chartEditStore.type';

export function normalizeUnitToken(unit?: string) {
  return String(unit ?? '').trim().toLowerCase();
}

export function shouldAggregateAcrossAreasBySum(dataID: string, cfg?: RequestIoTDeviceConfigType) {
  const normalized = String(dataID ?? '').toLowerCase();
  const unit = normalizeUnitToken(cfg?.dataUnits?.[cfg?.dataIDNames?.[dataID] || dataID]);

  if (['v', 'a', 'kv', 'ma', '%', '℃', '°c', 'hz'].includes(unit)) {
    return false;
  }

  if (
    normalized.startsWith('u')
    || normalized.startsWith('i')
    || normalized.startsWith('pf')
    || normalized.includes('voltage')
    || normalized.includes('current')
    || normalized.includes('temperature')
  ) {
    return false;
  }

  return [
    'epchange',
    'eqchange',
    'totalenergychange',
    'totalenergy',
    'ep',
    'eq',
    'ps',
    'p',
    'qs',
    'q',
  ].includes(normalized);
}

export function combineAreaValuesForSingleStat(dataID: string, values: number[], cfg?: RequestIoTDeviceConfigType) {
  if (values.length === 0) return 0;
  if (shouldAggregateAcrossAreasBySum(dataID, cfg)) {
    return values.reduce((acc, value) => acc + value, 0);
  }
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

export function resolveSingleStatBucketConfig(startTime: number, endTime: number) {
  const duration = Math.max(0, endTime - startTime);
  if (duration <= 2 * 24 * 60 * 60 * 1000) {
    return { format: 'time' as const, interval: 1, intervalUnit: 'h' as const };
  }
  if (duration <= 45 * 24 * 60 * 60 * 1000) {
    return { format: 'date' as const, interval: 1, intervalUnit: 'd' as const };
  }
  if (duration <= 400 * 24 * 60 * 60 * 1000) {
    return { format: 'month' as const, interval: 1, intervalUnit: 'n' as const };
  }
  return { format: 'year' as const, interval: 1, intervalUnit: 'y' as const };
}
