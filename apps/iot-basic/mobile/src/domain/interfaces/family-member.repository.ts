import type { FamilyMemberEntity, FamilyMemberUser } from '../entities/family-member.entity';
import type { PageResult } from '../models/page-state.model';

export interface IFamilyMemberRepository {
  /** 精准搜索可加入家庭的用户。 */
  searchUser(account: string, projectID: string): Promise<FamilyMemberUser | null>;
  /** 分页读取家庭成员。 */
  getList(projectID: string, page: number, size: number): Promise<PageResult<FamilyMemberEntity>>;
  /** 按家庭和用户精确查询直接成员资格，不从分页列表猜测权限。 */
  getMembership(projectID: string, userID: string): Promise<FamilyMemberEntity | null>;
  /** 创建家庭成员权限。 */
  create(data: { projectID: string; targetID: string; authType: number; memberRemark?: string }): Promise<void>;
  /** 更新成员称呼。 */
  update(data: { projectID: string; targetID: string; memberRemark: string }): Promise<void>;
  /** 删除成员权限。 */
  remove(data: { projectID: string; targetID: string }): Promise<void>;
}
