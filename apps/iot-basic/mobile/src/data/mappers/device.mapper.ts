import type { DeviceEntity } from '../../domain/entities/device.entity';
import type { GeoPoint } from '../../domain/models/location.model';

function toPoint(value: unknown): GeoPoint | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const raw = value as Record<string, unknown>;
  const latitude = Number(raw.latitude || 0);
  const longitude = Number(raw.longitude || 0);
  if (!latitude && !longitude) return undefined;
  return { latitude, longitude };
}

/** normalizeEpochMillis 兼容历史秒时间戳并统一为毫秒。 */
function normalizeEpochMillis(value: unknown): number {
  const timestamp = Number(value || 0);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return 0;
  return timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp;
}

export class DeviceMapper {
  static toEntity(dto: Record<string, unknown>): DeviceEntity {
    return {
      id: String(dto.id || ''),
      productID: String(dto.productID || ''),
      deviceName: String(dto.deviceName || ''),
      deviceAlias: String(dto.deviceAlias || dto.deviceName || ''),
      status: Number(dto.status || 1),
      lastLogin: Number(dto.lastLogin || 0),
      lastOffline: Number(dto.lastOffline || 0),
      productName: String(dto.productName || ''),
      productImg: String(dto.productImg || ''),
      projectID: String(dto.projectID || ''),
      areaID: String(dto.areaID || ''),
      deviceType: Number(dto.deviceType || 1),
      version: dto.version ? String(dto.version) : undefined,
      rssi: Number(dto.rssi || 0),
      createdTime: Number(dto.createdTime || 0),
      isEnable: Number(dto.isEnable || 1),
      deviceImg: String(dto.deviceImg || ''),
      address: dto.address ? String(dto.address) : undefined,
      position: toPoint(dto.position),
      desc: dto.desc ? String(dto.desc) : undefined,
      tags: (dto.tags || {}) as Record<string, string>,
      // 后端字段名可能是 cloneID / clone_id / cloneId，值为字符串或数字，0 值会被 omitempty 省略。
      cloneID: (dto.cloneID ?? dto.clone_id ?? dto.cloneId)
        ? Number(dto.cloneID ?? dto.clone_id ?? dto.cloneId)
        : undefined,
      // 设备信息页扩展字段：后端返回字符串的时间戳与枚举，统一转 number，空值归 undefined。
      imei: dto.imei ? String(dto.imei) : undefined,
      mac: dto.mac ? String(dto.mac) : undefined,
      iccid: dto.iccid ? String(dto.iccid) : undefined,
      hardInfo: dto.hardInfo ? String(dto.hardInfo) : undefined,
      softInfo: dto.softInfo ? String(dto.softInfo) : undefined,
      remoteAddr: dto.remoteAddr ? String(dto.remoteAddr) : undefined,
      netType: dto.netType ? Number(dto.netType) : undefined,
      mobileOperator: dto.mobileOperator ? Number(dto.mobileOperator) : undefined,
      phone: dto.phone ? String(dto.phone) : undefined,
      lastIp: dto.lastIp ? String(dto.lastIp) : undefined,
      lastLocalIp: dto.lastLocalIp ? String(dto.lastLocalIp) : undefined,
      firstLogin: dto.firstLogin ? Number(dto.firstLogin) : undefined,
      firstBind: dto.firstBind ? Number(dto.firstBind) : undefined,
      lastBind: dto.lastBind ? Number(dto.lastBind) : undefined,
      expTime: normalizeEpochMillis(dto.expTime) || undefined,
    };
  }
}
