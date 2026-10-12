/**
 * 环境术语配置 —— 页面统一消费 TERM，具体显示由 config.terminologyPreset 决定。
 *
 * 智能家居场景：project="家庭"  area="房间"
 * 工业/能源场景：project="项目"  area="区域"
 */
import { config, type TerminologyPreset } from '../config';

/** TerminologyConfig 定义项目/区域相关页面的用户可见文案集合。 */
type TerminologyConfig = {
  project: string;
  projectPlural: string;
  area: string;
  areaPlural: string;
  projectManageTitle: string;
  areaManageTitle: string;
  projectCreateTitle: string;
  projectEditTitle: string;
  areaCreateTitle: string;
  areaEditTitle: string;
  projectDeleteLastMsg: string;
  projectDeleteBlockDeviceMsg: string;
  projectDeleteBlockMsg: string;
  areaDeleteBlockMsg: string;
  projectDeleteConfirmMsg: string;
  areaDeleteConfirmMsg: string;
  projectEmptyText: string;
  areaEmptyText: string;
  statusNormal: string;
  statusDisabled: string;
};

/** terminologyPresets 保存不同业态的完整术语包，后续可接租户或应用配置复用。 */
const terminologyPresets: Record<TerminologyPreset, TerminologyConfig> = {
  home: {
    project: '家庭',
    projectPlural: '家庭',
    area: '房间',
    areaPlural: '房间',
    projectManageTitle: '家庭管理',
    areaManageTitle: '房间管理',
    projectCreateTitle: '新建家庭',
    projectEditTitle: '编辑家庭',
    areaCreateTitle: '新建房间',
    areaEditTitle: '编辑房间',
    projectDeleteLastMsg: '当前只剩一个家庭，无法删除',
    projectDeleteBlockDeviceMsg: '该家庭下还有设备，请先移除所有设备',
    projectDeleteBlockMsg: '该家庭下还有房间，请先删除所有房间',
    areaDeleteBlockMsg: '该房间下还有设备，请先移除所有设备',
    projectDeleteConfirmMsg: '确定删除该家庭？',
    areaDeleteConfirmMsg: '确定删除该房间？',
    projectEmptyText: '还没有家庭',
    areaEmptyText: '还没有房间',
    statusNormal: '正常',
    statusDisabled: '禁用',
  },
  projectArea: {
    project: '项目',
    projectPlural: '项目',
    area: '区域',
    areaPlural: '区域',
    projectManageTitle: '项目管理',
    areaManageTitle: '区域管理',
    projectCreateTitle: '新建项目',
    projectEditTitle: '编辑项目',
    areaCreateTitle: '新建区域',
    areaEditTitle: '编辑区域',
    projectDeleteLastMsg: '当前只剩一个项目，无法删除',
    projectDeleteBlockDeviceMsg: '该项目下还有设备，请先移除所有设备',
    projectDeleteBlockMsg: '该项目下还有区域，请先删除所有区域',
    areaDeleteBlockMsg: '该区域下还有设备，请先移除所有设备',
    projectDeleteConfirmMsg: '确定删除该项目？',
    areaDeleteConfirmMsg: '确定删除该区域？',
    projectEmptyText: '还没有项目',
    areaEmptyText: '还没有区域',
    statusNormal: '正常',
    statusDisabled: '禁用',
  },
};

export const TERM = terminologyPresets[config.terminologyPreset] || terminologyPresets.home;
