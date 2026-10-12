import type { CloneGroupEntity } from '../entities/clone-group.entity';

/**
 * CloneGroup 仓储接口
 */
export interface ICloneGroupRepository {
  /**
   * 获取 CloneGroup 列表
   * @param filter 过滤条件
   * @param page 页码
   * @param pageSize 每页大小
   */
  getList(filter: CloneGroupFilter, page?: number, pageSize?: number): Promise<CloneGroupListResult>;
}

/**
 * CloneGroup 过滤条件
 */
export interface CloneGroupFilter {
  /** 按 AgentGroup ID 过滤 */
  agentGroupID?: number;
  /** 按第三方业务ID过滤 */
  thirdID?: string;
  /** 按名称模糊搜索 */
  name?: string;
  /** 按状态过滤 */
  status?: number;
}

/**
 * CloneGroup 列表结果
 */
export interface CloneGroupListResult {
  list: CloneGroupEntity[];
  total: number;
}
