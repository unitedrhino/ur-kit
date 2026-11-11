import type { ProductEntity } from '../../../domain/entities/product.entity';
import type { ProductCategoryOption } from '../../../services/product.service';

export const OTHER_CATEGORY_KEY = '__other__';

export interface ProductDisplaySection {
  key: string;
  title: string;
  products: ProductEntity[];
}

/** 根据完整产品列表保留有产品的分类，并将未知分类归入其他。 */
export function buildCategoryTabs(
  categories: ProductCategoryOption[],
  products: ProductEntity[],
): Array<{ key: string; label: string }> {
  const productCategoryIDs = new Set(products.map((product) => product.categoryID));
  const knownCategoryIDs = new Set(categories.map((category) => category.id));
  const tabs = categories
    .filter((category) => productCategoryIDs.has(category.id))
    .map((category) => ({ key: category.id, label: category.name }));
  if (products.some((product) => !knownCategoryIDs.has(product.categoryID))) {
    tabs.push({ key: OTHER_CATEGORY_KEY, label: '其他' });
  }
  return tabs;
}

/** 分页读取完整列表；后端提前返回空页或超出上限时报告错误，避免误隐藏分类。 */
export async function loadAllPages<T>(
  fetchPage: (page: number, size: number) => Promise<{ list: T[]; total: number }>,
): Promise<T[]> {
  const size = 100;
  const items: T[] = [];
  for (let page = 1; page <= 200; page += 1) {
    const result = await fetchPage(page, size);
    const list = result.list || [];
    items.push(...list);
    if (result.total > 0 ? items.length >= result.total : list.length < size) return items;
    if (list.length === 0) throw new Error('产品列表加载不完整，请重试');
  }
  throw new Error('产品列表过多，请联系管理员');
}

/**
 * Build product display sections filtered by active category key.
 * If activeKey is OTHER_CATEGORY_KEY, includes all products not matched by other categories.
 */
export function buildProductSections(
  products: ProductEntity[],
  tabs: Array<{ key: string; label: string }>,
  activeKey: string,
): ProductDisplaySection[] {
  const knownCategoryIDs = new Set(
    tabs.filter((t) => t.key !== OTHER_CATEGORY_KEY).map((t) => t.key),
  );

  if (activeKey === OTHER_CATEGORY_KEY) {
    const others = products.filter((p) => !knownCategoryIDs.has(p.categoryID));
    return others.length > 0
      ? [{ key: OTHER_CATEGORY_KEY, title: '其他', products: others }]
      : [];
  }

  const tab = tabs.find((t) => t.key === activeKey);
  if (!tab) return [];
  const matched = products.filter((p) => p.categoryID === activeKey);
  return matched.length > 0
    ? [{ key: activeKey, title: tab.label, products: matched }]
    : [];
}
