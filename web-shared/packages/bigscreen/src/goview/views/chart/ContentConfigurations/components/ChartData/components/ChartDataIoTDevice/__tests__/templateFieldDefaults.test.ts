import { describe, expect, it } from 'vitest';

import { getTemplateSuggestedDataIDs, sortSchemaValuesBySuggestedOrder } from '../templateFieldDefaults';

describe('templateFieldDefaults', () => {
  it('电表品类单值卡和趋势图默认优先推荐 P，并保留 PF/PFs 作为候选', () => {
    expect(getTemplateSuggestedDataIDs('singleStat', 'dianbiao')).toEqual(['P', 'PF', 'PFs']);
    expect(getTemplateSuggestedDataIDs('trend', 'dianbiao')).toEqual(['P', 'PF', 'PFs']);
  });

  it('电表品类排行和占比默认推荐 TotalEnergyChange', () => {
    expect(getTemplateSuggestedDataIDs('ranking', 'dianbiao')).toEqual(['TotalEnergyChange']);
    expect(getTemplateSuggestedDataIDs('share', 'dianbiao')).toEqual(['TotalEnergyChange']);
  });

  it('非电表品类不返回默认推荐字段', () => {
    expect(getTemplateSuggestedDataIDs('singleStat', 'other')).toEqual([]);
  });

  it('推荐字段应排到属性列表最前面', () => {
    const values = ['Ua', 'P', 'TotalEnergyChange', 'PF'];
    expect(sortSchemaValuesBySuggestedOrder(values, ['P'])).toEqual(['P', 'Ua', 'TotalEnergyChange', 'PF']);
    expect(sortSchemaValuesBySuggestedOrder(values, ['TotalEnergyChange'])).toEqual(['TotalEnergyChange', 'Ua', 'P', 'PF']);
  });
});
