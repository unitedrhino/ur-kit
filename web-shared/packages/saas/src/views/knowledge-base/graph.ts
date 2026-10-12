/**
 * 文件说明：知识库切片关联的关系类型展示辅助；旧版自绘图谱构建逻辑已随旧详情页移除。
 */

import { $t } from '../../locales';
/** relationTypeLabel 将切片关联类型转为用户可读文案。 */
export function relationTypeLabel(relationType: string) {
  switch (relationType) {
    case 'duplicate': {
      return $t('knowledgeBase.text_6e708ba759df');
    }
    case 'reference': {
      return $t('knowledgeBase.text_23c0e102a0ae');
    }
    case 'similar': {
      return $t('knowledgeBase.text_72bfb8ee146e');
    }
    default: {
      return relationType || $t('knowledgeBase.text_dc91aa56fbcf');
    }
  }
}
