/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
import { HistoryActionTypeEnum, HistoryTargetTypeEnum } from './chartHistoryStore.type'

export const historyActionTypeName = {
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get [HistoryActionTypeEnum.ADD]() { return editorT('bigscreenEditor.ui.helperAdd'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get [HistoryActionTypeEnum.DELETE]() { return editorT('bigscreenEditor.ui.helperDelete'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get [HistoryActionTypeEnum.CLEAR_GROUP]() { return editorT('bigscreenEditor.ui.helperClearGroup'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get [HistoryActionTypeEnum.UPDATE]() { return editorT('bigscreenEditor.ui.helperUpdate'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get [HistoryActionTypeEnum.MOVE]() { return editorT('bigscreenEditor.ui.helperMove'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get [HistoryActionTypeEnum.PASTE]() { return editorT('bigscreenEditor.ui.paste'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get [HistoryActionTypeEnum.COPY]() { return editorT('bigscreenEditor.ui.helperCopy'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get [HistoryActionTypeEnum.CUT]() { return editorT('bigscreenEditor.ui.cut'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get [HistoryActionTypeEnum.TOP]() { return editorT('bigscreenEditor.ui.helperBringToFront'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get [HistoryActionTypeEnum.BOTTOM]() { return editorT('bigscreenEditor.ui.sendBack'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get [HistoryActionTypeEnum.UP]() { return editorT('bigscreenEditor.ui.helperMoveUp'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get [HistoryActionTypeEnum.DOWN]() { return editorT('bigscreenEditor.ui.helperMoveDown'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get [HistoryActionTypeEnum.GROUP]() { return editorT('bigscreenEditor.ui.helperGroup'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get [HistoryActionTypeEnum.UN_GROUP]() { return editorT('bigscreenEditor.ui.helperUngroup'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get [HistoryActionTypeEnum.LOCK]() { return editorT('bigscreenEditor.ui.helperLock'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get [HistoryActionTypeEnum.UNLOCK]() { return editorT('bigscreenEditor.ui.helperUnlock'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get [HistoryActionTypeEnum.HIDE]() { return editorT('bigscreenEditor.ui.helperHide'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get [HistoryActionTypeEnum.SHOW]() { return editorT('bigscreenEditor.ui.helperShow'); },

  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get [HistoryTargetTypeEnum.CANVAS]() { return editorT('bigscreenEditor.ui.helperInitializeCanvas'); },
}
