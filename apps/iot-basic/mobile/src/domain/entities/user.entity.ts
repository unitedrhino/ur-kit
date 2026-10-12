export interface UserEntity {
  userID: string;
  userName: string;
  nickName: string;
  email?: string;
  phone?: string;
  sex?: number;
  avatar: string;
  token: string;
  tenantCode: string;
  /** 密码字段：为空字符串或 undefined 时表示用户未设置过密码 */
  password?: string;
}
