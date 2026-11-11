import type {
  DeviceShareDevice,
  DeviceShareEntity,
  DeviceSharePermission,
  DeviceShareUser,
} from '../../domain/entities/device-share.entity';

/**
 * 设备分享响应映射器，将后端可选字段收敛为页面可安全读取的实体。
 */
export class DeviceShareMapper {
  /** 映射设备核心对象。 */
  static toDevice(dto: Record<string, unknown> | undefined): DeviceShareDevice {
    return {
      productID: String(dto?.productID || ''),
      deviceName: String(dto?.deviceName || ''),
      deviceAlias: dto?.deviceAlias ? String(dto.deviceAlias) : undefined,
    };
  }

  /** 映射权限字典，并丢弃后端异常值。 */
  static toPermissions(value: unknown): Record<string, DeviceSharePermission> {
    if (!value || typeof value !== 'object') return {};
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, DeviceSharePermission>>((result, [key, item]) => {
      const raw = item && typeof item === 'object' ? item as Record<string, unknown> : {};
      result[key] = { perm: Number(raw.perm || 3) };
      return result;
    }, {});
  }

  /** 映射被分享用户信息。 */
  static toUser(dto: Record<string, unknown> | undefined): DeviceShareUser | undefined {
    if (!dto) return undefined;
    return {
      userID: String(dto.userID || ''),
      userName: String(dto.userName || ''),
      account: String(dto.phone || dto.email || dto.userName || ''),
      nickName: String(dto.nickName || ''),
      avatar: String(dto.avatar || dto.headImg || ''),
    };
  }

  /** 映射设备分享记录。 */
  static toEntity(dto: Record<string, unknown>): DeviceShareEntity {
    return {
      id: String(dto.id || ''),
      projectID: String(dto.projectID || ''),
      device: DeviceShareMapper.toDevice(dto.device as Record<string, unknown> | undefined),
      sharedUserID: String(dto.sharedUserID || ''),
      sharedUserAccount: String(dto.sharedUserAccount || ''),
      authType: Number(dto.authType || 1),
      schemaPerm: DeviceShareMapper.toPermissions(dto.schemaPerm),
      accessPerm: DeviceShareMapper.toPermissions(dto.accessPerm),
      expTime: dto.expTime == null ? '' : String(dto.expTime),
      useBy: String(dto.useBy || ''),
      user: DeviceShareMapper.toUser(dto.user as Record<string, unknown> | undefined),
      createdTime: dto.createdTime == null ? '' : String(dto.createdTime),
    };
  }
}
