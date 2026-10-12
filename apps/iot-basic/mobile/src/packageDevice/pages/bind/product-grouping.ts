import type { ProductEntity } from '../../../domain/entities/product.entity';
import type { ProductCategoryOption } from '../../../services/product.service';

export const OTHER_CATEGORY_KEY = '__other__';

export interface ProductDisplaySection {
  key: string;
  title: string;
  products: ProductEntity[];
}

/**
 * Build category tab list. Always appends an "其他" tab at the end.
 */
export function buildCategoryTabs(
  categories: ProductCategoryOption[],
): Array<{ key: string; label: string }> {
  const tabs = categories.map((c) => ({ key: c.id, label: c.name }));
  tabs.push({ key: OTHER_CATEGORY_KEY, label: '其他' });
  return tabs;
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
