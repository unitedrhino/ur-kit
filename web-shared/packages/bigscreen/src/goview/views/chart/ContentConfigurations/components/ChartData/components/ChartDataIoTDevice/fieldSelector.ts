import type { FieldOption } from './FieldSelector.vue';

const MAX_LABEL_LENGTH = 24;
const MAX_SUMMARY_LENGTH = 48;

export const truncateFieldLabel = (label: string, maxLength = MAX_LABEL_LENGTH): string => {
  if (!label) return '';
  if (label.length <= maxLength) return label;
  return `${label.slice(0, Math.max(0, maxLength - 1))}…`;
};

export const filterFieldOptions = (options: FieldOption[], keyword?: string): FieldOption[] => {
  const k = keyword?.trim().toLowerCase() ?? '';
  if (!k) return options;
  return options.filter((item) => {
    const text = `${item.label} ${item.value}`.toLowerCase();
    return text.includes(k);
  });
};

export const formatSelectedSummary = (options: FieldOption[], selectedValues: string[], maxDisplay = 3): string => {
  if (selectedValues.length === 0) return '';
  const labels: string[] = [];
  for (const value of selectedValues) {
    const opt = options.find((o) => o.value === value);
    if (opt) labels.push(truncateFieldLabel(opt.label));
  }
  if (labels.length === 0) return '';
  const base = labels.length <= maxDisplay ? labels.join(', ') : `${labels.slice(0, maxDisplay).join(', ')} +${labels.length - maxDisplay}`;
  if (base.length <= MAX_SUMMARY_LENGTH) return base;
  return `${base.slice(0, MAX_SUMMARY_LENGTH - 1)}…`;
};

export const getSelectedLabels = (options: FieldOption[], selectedValues: string[]): string[] => {
  const labels: string[] = [];
  for (const value of selectedValues) {
    const opt = options.find((o) => o.value === value);
    if (opt) labels.push(truncateFieldLabel(opt.label));
  }
  return labels;
};
