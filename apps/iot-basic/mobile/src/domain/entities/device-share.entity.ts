/**
 * 设备分享领域实体，承载分享关系、授权范围和被分享用户信息。
 */
export interface DeviceSharePermission {
  /** 权限级别：2=读写，3=只读。 */
  perm: number;
}

export interface DeviceShareDevice {
  /** 产品标识，后端按字符串传输。 */
  productID: string;
  /** 设备名称。 */
  deviceName: string;
  /** 设备别名。 */
  deviceAlias?: string;
}

export interface DeviceShareUser {
  /** 用户标识，后端 int64 以字符串返回。 */
  userID: string;
  /** 登录账号。 */
  userName: string;
  /** 手机号或邮箱。 */
  account: string;
  /** 用户昵称。 */
  nickName: string;
  /** 用户头像。 */
  avatar: string;
}

export interface DeviceShareEntity {
  /** 分享记录标识。 */
  id: string;
  /** 分享所属家庭标识。 */
  projectID: string;
  /** 设备核心信息。 */
  device: DeviceShareDevice;
  /** 被分享用户标识。 */
  sharedUserID: string;
  /** 被分享用户账号快照。 */
  sharedUserAccount: string;
  /** 授权类型：1=全部授权，2=部分授权。 */
  authType: number;
  /** 物模型权限。 */
  schemaPerm: Record<string, DeviceSharePermission>;
  /** 系统能力权限。 */
  accessPerm: Record<string, DeviceSharePermission>;
  /** 过期时间，毫秒时间戳字符串；空字符串表示不限制。 */
  expTime: string;
  /** 分享用途。 */
  useBy: string;
  /** 被分享用户详情。 */
  user?: DeviceShareUser;
  /** 创建时间，毫秒时间戳字符串。 */
  createdTime: string;
}
