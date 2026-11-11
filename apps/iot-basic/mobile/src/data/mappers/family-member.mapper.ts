import type { FamilyMemberEntity, FamilyMemberUser } from '../../domain/entities/family-member.entity';

/**
 * 家庭成员响应映射器，统一处理用户资料缺省值和字符串 ID。
 */
export class FamilyMemberMapper {
  /** 映射嵌套用户信息。 */
  static toUser(dto: Record<string, unknown> | undefined): FamilyMemberUser | undefined {
    if (!dto) return undefined;
    return {
      userID: String(dto.userID || ''),
      userName: String(dto.userName || ''),
      phone: String(dto.phone || ''),
      nickName: String(dto.nickName || ''),
      avatar: String(dto.avatar || dto.headImg || ''),
    };
  }

  /** 映射家庭成员权限记录。 */
  static toEntity(dto: Record<string, unknown>): FamilyMemberEntity {
    return {
      projectID: String(dto.projectID || ''),
      targetID: String(dto.targetID || dto.userID || ''),
      targetType: String(dto.targetType || 'user'),
      authType: Number(dto.authType || 3),
      memberRemark: String(dto.memberRemark || ''),
      joinedAt: String(dto.updatedTime || dto.createdTime || ''),
      user: FamilyMemberMapper.toUser(dto.user as Record<string, unknown> | undefined),
    };
  }
}
