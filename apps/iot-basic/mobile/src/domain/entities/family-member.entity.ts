/**
 * 家庭成员领域实体，区分成员资料、家庭权限和成员称呼。
 */
export interface FamilyMemberUser {
  /** 用户标识，后端 int64 以字符串返回。 */
  userID: string;
  /** 登录账号。 */
  userName: string;
  /** 手机号。 */
  phone: string;
  /** 用户昵称。 */
  nickName: string;
  /** 用户头像。 */
  avatar: string;
}

export interface FamilyMemberEntity {
  /** 家庭标识。 */
  projectID: string;
  /** 成员用户标识。 */
  targetID: string;
  /** 目标类型，当前家庭成员只允许 user。 */
  targetType: 'user' | string;
  /** 权限：1=管理，2=读写，3=只读。 */
  authType: number;
  /** 家庭创建者设置的成员称呼。 */
  memberRemark: string;
  /** 最近更新时间，作为成员关系回显时间。 */
  joinedAt: string;
  /** 成员用户资料。 */
  user?: FamilyMemberUser;
}

/** 当前账号在指定家庭的操作资格，仅负责人管理成员，直接成员可退出。 */
export interface FamilyMemberAccess {
  /** 后端项目详情返回的负责人用户标识。 */
  ownerUserID: string;
  /** 已登录的当前用户标识。 */
  userID: string;
  /** 是否为家庭负责人。 */
  canManage: boolean;
  /** 是否存在本人的直接授权且本人不是负责人。 */
  canLeave: boolean;
}
