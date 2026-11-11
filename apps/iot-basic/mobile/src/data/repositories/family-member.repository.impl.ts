import { request } from '../../utils/request';
import type { IFamilyMemberRepository } from '../../domain/interfaces/family-member.repository';
import type { FamilyMemberEntity, FamilyMemberUser } from '../../domain/entities/family-member.entity';
import type { PageResult } from '../../domain/models/page-state.model';
import { FamilyMemberMapper } from '../mappers/family-member.mapper';

/**
 * 家庭成员数据仓库，对接用户搜索和项目数据权限接口。
 */
export class FamilyMemberRepositoryImpl implements IFamilyMemberRepository {
  /** 精准搜索用户，找不到用户时返回 null。 */
  async searchUser(account: string, projectID: string): Promise<FamilyMemberUser | null> {
    try {
      const resp = await request<Record<string, unknown>>({
        url: '/api/v1/things/data/project/user-search',
        data: { account, projectID },
      });
      if (!resp.userID) return null;
      return FamilyMemberMapper.toUser(resp) || null;
    } catch {
      return null;
    }
  }

  /** 分页读取当前家庭的用户权限。 */
  async getList(projectID: string, page: number, size: number): Promise<PageResult<FamilyMemberEntity>> {
    const resp = await request<Record<string, unknown>>({
      url: '/api/v1/things/data/project/get-list',
      data: {
        page: { page, size },
        projectID,
        targetType: 'user',
      },
    });
    const list = ((resp.list || []) as Record<string, unknown>[]).map(FamilyMemberMapper.toEntity);
    return { list, total: Number(resp.total || 0) };
  }

  /** 精确查询本人直接授权，忽略其他项目或其他账号的返回记录。 */
  async getMembership(projectID: string, userID: string): Promise<FamilyMemberEntity | null> {
    const resp = await request<{ list?: Record<string, unknown>[] }>({
      url: '/api/v1/things/data/project/get-list',
      data: { projectID, targetID: userID, targetType: 'user', page: { page: 1, size: 1 } },
    });
    const member = (resp.list || []).find(
      (item) => String(item.projectID) === projectID && String(item.targetID) === userID && [1, 2, 3].includes(Number(item.authType)),
    );
    return member ? FamilyMemberMapper.toEntity(member) : null;
  }

  /** 创建成员权限关系。 */
  async create(data: { projectID: string; targetID: string; authType: number; memberRemark?: string }): Promise<void> {
    await request({
      url: '/api/v1/things/data/project/create',
      data: {
        projectID: data.projectID,
        targetID: data.targetID,
        targetType: 'user',
        authType: data.authType,
        memberRemark: data.memberRemark || undefined,
      },
    });
  }

  /** 更新成员称呼，空字符串表示清空。 */
  async update(data: { projectID: string; targetID: string; memberRemark: string }): Promise<void> {
    await request({
      url: '/api/v1/things/data/project/update',
      data: {
        projectID: data.projectID,
        targetID: data.targetID,
        targetType: 'user',
        memberRemark: data.memberRemark,
      },
    });
  }

  /** 删除成员权限关系。 */
  async remove(data: { projectID: string; targetID: string }): Promise<void> {
    await request({
      url: '/api/v1/things/data/project/delete',
      data: {
        projectID: data.projectID,
        targetID: data.targetID,
        targetType: 'user',
      },
    });
  }
}
