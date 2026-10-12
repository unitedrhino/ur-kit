
import { CoreApi } from '@vben/api';

export namespace SystemDeptApi {
  export interface SystemDept {
    [key: string]: any;
    children?: SystemDept[];
    id: string;
    name: string;
    remark?: string;
    status: 0 | 1;
  }
}

/**
 * 获取部门列表数据
 */
async function getDeptList() {
  // return requestClient.get<Array<SystemDeptApi.SystemDept>>(
  //   '/system/dept/list',
  // );

  const res = await CoreApi.postApiV1SystemDeptInfoGetList({});

  let depts: SystemDeptApi.SystemDept[] = [];

  depts =
    res?.list?.map((item) => {
      return item as unknown as SystemDeptApi.SystemDept;
    }) || [];

  console.log('depts ===================== ', depts);

  //res 根据 parentID 转换成树型 用children 转换
  // 将扁平的 menus 转换为树形结构
  const convertDeptsToTree = (depts: SystemDeptApi.SystemDept[]): SystemDeptApi.SystemDept[] => {
    const map = new Map<string, SystemDeptApi.SystemDept>();
    const result: SystemDeptApi.SystemDept[] = [];

    // 创建映射表，同时复制菜单对象并初始化 children
    depts.forEach((dept) => {
      map.set(dept.id, {
        ...dept,
        children: [],
      });
    });

    // 构建树形结构
    depts.forEach((dept) => {
      const currentDept = map.get(dept.id);
      if (!currentDept) return;

      if (dept.parentID && map.has(dept.parentID)) {
        // 有父级，添加到父级的 children 中
        const parent = map.get(dept.parentID)!;
        parent.children!.push(currentDept);
      } else {
        // 没有父级或父级不存在，作为顶级菜单
        result.push(currentDept);
      }
    });

    return result;
  };

  const treeDepts = convertDeptsToTree(depts);

  console.log('treeDepts ===================== ', treeDepts);

  return treeDepts;
}

/**
 * 创建部门
 * @param data 部门数据
 */
async function createDept(data: Omit<SystemDeptApi.SystemDept, 'children' | 'id'>) {
  console.log('createDept data ===================== ', data);
  // return requestClient.post('/system/dept', data);
  const res = await CoreApi.postApiV1SystemDeptInfoCreate({
    // ...data,
    parentID: data.pid,
    name: data.name,
    desc: data.desc,
    status: data.status,
  });
  return res;
}

/**
 * 更新部门
 *
 * @param id 部门 ID
 * @param data 部门数据
 */
async function updateDept(id: string, data: Omit<SystemDeptApi.SystemDept, 'children' | 'id'>) {
  // return requestClient.put(`/system/dept/${id}`, data);

  console.log('updateDept data ===================== ', data);

  const res = await CoreApi.postApiV1SystemDeptInfoUpdate({
    id: id,
    parentID: data.pid,
    name: data.name,
    desc: data.desc,
    status: data.status,
    ...data,
  });
  return res;
}

/**
 * 删除部门
 * @param id 部门 ID
 */
async function deleteDept(id: string) {
  // return requestClient.delete(`/system/dept/${id}`);
  console.log('deleteDept id ===================== ', id);

  const res = await CoreApi.postApiV1SystemDeptInfoDelete({
    id: id,
  });
  return res;
}

export { createDept, deleteDept, getDeptList, updateDept };
