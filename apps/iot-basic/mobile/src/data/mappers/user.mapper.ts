import type { UserEntity } from '../../domain/entities/user.entity';

export class UserMapper {
  static toEntity(dto: Record<string, unknown>, token?: string): UserEntity {
    return {
      userID: String(dto.userID || dto.uid || ''),
      userName: String(dto.userName || ''),
      nickName: String(dto.nickName || ''),
      email: dto.email ? String(dto.email) : undefined,
      phone: dto.phone ? String(dto.phone) : undefined,
      sex: Number(dto.sex || 0),
      avatar: String(dto.avatar || ''),
      token: token || String(dto.token || ''),
      tenantCode: String(dto.tenantCode || ''),
      password: dto.password ? String(dto.password) : undefined,
    };
  }
}
