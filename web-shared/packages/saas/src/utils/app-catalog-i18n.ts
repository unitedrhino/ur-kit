import { $t } from '@vben/saas/locales';

/**
 * 文件说明：预置应用名称与描述的多语言目录（TASK-142 可选配置）。
 *
 * 后端 sys_app_info 的 name/desc 为单份文本（平台管理员可改写），
 * 这里按固定种子应用 ID 建立翻译键目录；仅当后端名称/描述与种子默认值
 * 完全一致（未被人工改写）时改用翻译键渲染，否则保持后端原文。
 * 企业自行创建的应用不在目录中，天然保持原文。
 */
interface PresetAppEntry {
  /** 种子默认名称（用于改写判定） */
  seedName: string;
  /** 种子默认描述（用于改写判定） */
  seedDesc: string;
  /** 名称翻译键（ui.appCatalog.<id>.name） */
  nameKey: string;
  /** 描述翻译键（ui.appCatalog.<id>.desc） */
  descKey: string;
}

const catalog: Record<string, PresetAppEntry> = {
  '77': { seedName: '大厅', seedDesc: '应用大厅，提供各应用统一入口与导航', nameKey: 'ui.appCatalog.77.name', descKey: 'ui.appCatalog.77.desc' },
  '100': { seedName: '平台管理', seedDesc: '平台运营管理后台，涵盖套餐、订单、客户及系统配置', nameKey: 'ui.appCatalog.100.name', descKey: 'ui.appCatalog.100.desc' },
  '200': { seedName: '物联网', seedDesc: '物联网设备全生命周期管理平台，支持设备接入、项目管理、区域管理、OTA升级及数据流转', nameKey: 'ui.appCatalog.200.name', descKey: 'ui.appCatalog.200.desc' },
  '300': { seedName: '系统管理', seedDesc: '企业系统管理后台，提供企业信息维护、用户与角色管理、服务续期及AI智能体配置', nameKey: 'ui.appCatalog.300.name', descKey: 'ui.appCatalog.300.desc' },
  '500': { seedName: '运营中心', seedDesc: '运营中心商城，提供产品套餐购买、订单管理及充值服务', nameKey: 'ui.appCatalog.500.name', descKey: 'ui.appCatalog.500.desc' },
  '600': { seedName: '物联网客户端', seedDesc: 'Web 物联网客户端，提供设备空间、设备地图、场景联动和基础系统配置', nameKey: 'ui.appCatalog.600.name', descKey: 'ui.appCatalog.600.desc' },
  '700': { seedName: '物联网客户端', seedDesc: '物联网C端微信小程序，支持设备绑定与远程控制', nameKey: 'ui.appCatalog.700.name', descKey: 'ui.appCatalog.700.desc' },
  '800': { seedName: '物联网客户端', seedDesc: '物联网安卓客户端，支持设备管理与实时监控', nameKey: 'ui.appCatalog.800.name', descKey: 'ui.appCatalog.800.desc' },
  '900': { seedName: '物联网客户端', seedDesc: '物联网iOS客户端，支持设备管理与实时监控', nameKey: 'ui.appCatalog.900.name', descKey: 'ui.appCatalog.900.desc' },
  '1000': { seedName: '能耗中心', seedDesc: '能源能耗管理中心，提供能耗监测、统计分析与节能优化', nameKey: 'ui.appCatalog.1000.name', descKey: 'ui.appCatalog.1000.desc' },
  '1200': { seedName: '电子合同', seedDesc: '电子合同管理端，合同、模板、印章、供应商、审批管理', nameKey: 'ui.appCatalog.1200.name', descKey: 'ui.appCatalog.1200.desc' },
  '1201': { seedName: '电子合同用户端', seedDesc: '电子合同用户端，合同签署、查看、工作区', nameKey: 'ui.appCatalog.1201.name', descKey: 'ui.appCatalog.1201.desc' },
  '1202': { seedName: '电子合同租户端', seedDesc: '电子合同租户管理端', nameKey: 'ui.appCatalog.1202.name', descKey: 'ui.appCatalog.1202.desc' },
  '1500': { seedName: '停车场管理', seedDesc: '停车场管理平台，提供停车场、通道、设备、停车记录、车辆类型及计费规则管理', nameKey: 'ui.appCatalog.1500.name', descKey: 'ui.appCatalog.1500.desc' },
  '1600': { seedName: '智慧楼宇', seedDesc: '智慧楼宇综合管理平台，提供消防、照明、门禁、道闸、能耗、安防、协议接入及第三方系统对接等一体化管理', nameKey: 'ui.appCatalog.1600.name', descKey: 'ui.appCatalog.1600.desc' },
  '1700': { seedName: '云边管理', seedDesc: '云边协同（云端），管理边缘节点授权、license 签发与在线状态', nameKey: 'ui.appCatalog.1700.name', descKey: 'ui.appCatalog.1700.desc' },
};

/**
 * translatePresetAppName 按应用 ID 与当前名称匹配种子目录，返回翻译后的展示名。
 * 未命中目录或名称已被人工改写时返回 undefined，由调用方回退后端原文。
 * @param appId 应用 ID（sys_app_info 种子固定值）
 * @param name 后端返回的当前名称
 */
export function translatePresetAppName(appId: string | undefined, name: string | undefined): string | undefined {
  const entry = catalog[String(appId ?? '')];
  if (entry && entry.seedName === name) return $t(entry.nameKey);
  // 部分列表接口的应用子对象不含 id：预置应用种子名唯一，按名兜底匹配
  const byName = name ? Object.values(catalog).find((item) => item.seedName === name) : undefined;
  return byName ? $t(byName.nameKey) : undefined;
}

/**
 * translatePresetAppDesc 同上，针对应用描述的翻译。
 * @param appId 应用 ID
 * @param desc 后端返回的当前描述
 */
export function translatePresetAppDesc(appId: string | undefined, desc: string | undefined): string | undefined {
  const entry = catalog[String(appId ?? '')];
  if (entry && entry.seedDesc === desc) return $t(entry.descKey);
  const byDesc = desc ? Object.values(catalog).find((item) => item.seedDesc === desc) : undefined;
  return byDesc ? $t(byDesc.descKey) : undefined;
}
