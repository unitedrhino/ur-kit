export const ENERGY_TEMPLATE_DEFAULT_FIELDS: Record<string, string[]> = {
  aggregate: ['TotalEnergyChange'],
  ranking: ['TotalEnergyChange'],
  share: ['TotalEnergyChange'],
  singleStat: ['P', 'PF', 'PFs'],
  trend: ['P', 'PF', 'PFs'],
};

export function getTemplateSuggestedDataIDs(chartMode?: string, productCategoryCode?: string) {
  if (productCategoryCode !== 'dianbiao' || !chartMode) return [];
  return ENERGY_TEMPLATE_DEFAULT_FIELDS[chartMode] ?? [];
}

export function sortSchemaValuesBySuggestedOrder(values: string[], suggested: string[]) {
  if (suggested.length === 0) return values;
  const orderMap = new Map(suggested.map((value, index) => [value, index]));
  return [...values].sort((a, b) => {
    const aOrder = orderMap.get(a);
    const bOrder = orderMap.get(b);
    if (aOrder === undefined && bOrder === undefined) return 0;
    if (aOrder === undefined) return 1;
    if (bOrder === undefined) return -1;
    return aOrder - bOrder;
  });
}
