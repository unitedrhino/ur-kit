import type { MappingFieldDef, MappingSchema } from '../../../adapters/types';

export interface MappingRendererProps {
  activeGroupNames: string[];
  getFieldStatusText: (field: MappingFieldDef, groupKey?: string) => string;
  getFieldStatusType: (field: MappingFieldDef, groupKey?: string) => 'success' | 'warning';
  getGroupRowsCount: (groupKey: string) => number;
  getMultiValue: (field: MappingFieldDef, groupKey?: string) => string[];
  getSelectOptions: (field: MappingFieldDef, groupKey?: string) => Array<{ label: string; value: string }>;
  getSingleValue: (field: MappingFieldDef, groupKey?: string) => string;
  readonly: boolean;
  schema: MappingSchema;
  setActiveGroupNames: (names: string[]) => void;
  setFieldValue: (field: MappingFieldDef, value: null | string | string[], groupKey?: string) => void;
}
