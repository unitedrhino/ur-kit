/**
 * OEM品牌页脚信息
 */
export type SysOemFooter = {
  companyName: string;    // 公司名称
  companySiteLink?: string; // 公司网站链接
  date?: string;            // 年份或日期
  enable: boolean;         // 是否启用该页脚显示
  icp?: string;            // ICP备案号
  icpLink?: string;        // ICP备案的跳转链接
  beian?: string;          // 公安备案号
  beianLink?: string;      // 公安备案的跳转链接
};
