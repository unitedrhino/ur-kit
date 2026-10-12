import { borderDefaultOptions, defaultTitleConfig } from '../../Decorates/BorderCharts/borderConstants'

export const DEFAULT_BORDER_KEY = 'Border01'

export const createDefaultBorderTitleOption = () => {
  return { ...defaultTitleConfig }
}

export const createBorderContainerOption = (borderKey = DEFAULT_BORDER_KEY, existingTitle?: unknown) => {
  const createDefaults = borderDefaultOptions[borderKey] || borderDefaultOptions[DEFAULT_BORDER_KEY]
  const defaultOption = createDefaults ? createDefaults() : {}

  if (borderKey === 'Border04') {
    const titleText
      = typeof existingTitle === 'object' && existingTitle && 'text' in existingTitle
        ? (existingTitle as Record<string, any>).text || ''
        : typeof existingTitle === 'string'
          ? existingTitle
          : ''

    return {
      ...defaultOption,
      borderTitle: titleText,
    }
  }

  const normalizedTitle
    = typeof existingTitle === 'object' && existingTitle
      ? { ...createDefaultBorderTitleOption(), ...(existingTitle as Record<string, any>) }
      : {
          ...createDefaultBorderTitleOption(),
          text: typeof existingTitle === 'string' ? existingTitle : '',
        }

  return {
    ...defaultOption,
    borderTitle: normalizedTitle,
  }
}

export const ensureDecoratedChartOptionDefaults = (optionData: Record<string, any>) => {
  if (!optionData) return

  if (optionData.containerType === undefined) {
    optionData.containerType = 'none'
  }

  if (optionData.padding === undefined) {
    optionData.padding = 0
  }

  if (optionData.containerType !== 'border') return

  const borderKey = optionData.borderKey || DEFAULT_BORDER_KEY
  optionData.borderKey = borderKey

  const borderOption = optionData.borderOption
  if (!borderOption) {
    optionData.borderOption = createBorderContainerOption(borderKey)
    return
  }

  if (borderKey === 'Border04' && typeof borderOption.borderTitle !== 'string') {
    optionData.borderOption = createBorderContainerOption(borderKey, borderOption.borderTitle)
    return
  }

  if (borderKey !== 'Border04' && typeof borderOption.borderTitle !== 'object') {
    optionData.borderOption = createBorderContainerOption(borderKey, borderOption.borderTitle)
  }
}

export const resolveDecoratedChartTitleHeight = (optionData: Record<string, any>, titleConfig?: Record<string, any> | null) => {
  if (optionData?.borderKey === 'Border04') {
    return optionData?.borderOption?.borderTitleHeight || 52
  }

  if (!titleConfig?.show || !titleConfig?.text) {
    return 0
  }

  return (titleConfig.fontSize || 18) + 10
}
