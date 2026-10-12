/** 产品归属展示：依据接口的归属编码标记公共产品，保留产品原名和选择值。 */
import type { ThingsApi } from '@vben/api';

import { $t } from '../locales';

/** ProductScopeInfo 包含显示来源所需的产品名称、ID 和归属编码。 */
type ProductScopeInfo = Pick<ThingsApi.ProductInfo, 'productID' | 'productName' | 'tenantCode'>;

/** isPublicProduct 判断产品是否为平台维护的公共产品；未加载或缺失归属时不推断公共来源。 */
export function isPublicProduct(product?: Pick<ProductScopeInfo, 'tenantCode'>): boolean {
  return product?.tenantCode === 'common';
}

/** formatProductOptionLabel 在原选项文案后追加公共标识；label 保留调用方已有的名称和 ID 格式。 */
export function formatProductOptionLabel(product: ProductScopeInfo, label = String(product.productName || product.productID || '')): string {
  return isPublicProduct(product) ? `${label} · ${$t('iotApp.productPage.publicProduct')}` : label;
}
