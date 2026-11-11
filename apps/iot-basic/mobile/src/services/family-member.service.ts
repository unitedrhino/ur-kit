/** 家庭成员服务：核验操作身份、维护授权并区分退出与删除家庭。 */
import { FamilyMemberRepositoryImpl } from '../data/repositories/family-member.repository.impl';
import type { FamilyMemberAccess, FamilyMemberEntity, FamilyMemberUser } from '../domain/entities/family-member.entity';
import { projectService } from './project.service';
import type { PageResult } from '../domain/models/page-state.model';

const familyMemberRepo = new FamilyMemberRepositoryImpl();

/**
 * 家庭成员服务，集中维护用户搜索、权限关系和成员称呼操作。
 */
export class FamilyMemberService {
  /** 核验负责人及本人的直接成员资格；资格查询失败时由调用方关闭操作入口。 */
  async getAccess(projectID: string, userID: string): Promise<FamilyMemberAccess> {
    if (!projectID || !userID || userID === '0') throw new Error('请先登录并选择家庭');
    const project = await projectService.getOne(projectID);
    if (project.projectID !== projectID || !project.adminUserID || project.adminUserID === '0') {
      throw new Error('无法确认家庭负责人，请刷新重试');
    }
    const canManage = project.adminUserID === userID;
    const membership = canManage ? null : await familyMemberRepo.getMembership(projectID, userID);
    return { ownerUserID: project.adminUserID, userID, canManage, canLeave: !canManage && !!membership };
  }

  /** 退出共享家庭：重新核验本人资格，仅撤销本人的直接授权，禁止删除家庭。 */
  async leaveSharedFamily(projectID: string, userID: string): Promise<void> {
    const access = await this.getAccess(projectID, userID);
    if (!access.canLeave) throw new Error('仅共享家庭的直接成员可以退出');
    await familyMemberRepo.remove({ projectID, targetID: userID });
  }

  /** 精准搜索用户。 */
  async searchUser(account: string, projectID: string): Promise<FamilyMemberUser | null> {
    return familyMemberRepo.searchUser(account.trim(), projectID);
  }

  /** 分页读取家庭成员。 */
  async getList(projectID: string, page: number, size: number): Promise<PageResult<FamilyMemberEntity>> {
    return familyMemberRepo.getList(projectID, page, size);
  }

  /** 创建家庭成员权限。 */
  async create(data: { projectID: string; targetID: string; authType: number; memberRemark?: string }): Promise<void> {
    return familyMemberRepo.create(data);
  }

  /** 更新成员称呼。 */
  async update(data: { projectID: string; targetID: string; memberRemark: string }): Promise<void> {
    return familyMemberRepo.update(data);
  }

  /** 删除成员权限。 */
  async remove(data: { projectID: string; targetID: string }): Promise<void> {
    return familyMemberRepo.remove(data);
  }
}

export const familyMemberService = new FamilyMemberService();
