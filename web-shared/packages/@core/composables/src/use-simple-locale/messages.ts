/** 文件说明：为共用表单和基础交互提供 14 种语言的简短操作文案。 */

/** Locale 为轻量词库支持的语言，与应用语言切换清单一致。 */
export type Locale =
  | 'en-US'
  | 'zh-CN'
  | 'zh-TW'
  | 'es-ES'
  | 'ar'
  | 'fr-FR'
  | 'bn-BD'
  | 'pt-BR'
  | 'ru-RU'
  | 'id-ID'
  | 'th-TH'
  | 'ur-PK'
  | 'de-DE'
  | 'ja-JP';

/** SimpleLocaleKey 为共用表单等组件使用的全部轻量文案键。 */
type SimpleLocaleKey = 'cancel' | 'collapse' | 'confirm' | 'expand' | 'prompt' | 'reset' | 'submit';

/** messages 为每种受支持语言提供完整操作文案，防止静默回退英语。 */
export const messages: Record<Locale, Record<SimpleLocaleKey, string>> = {
  'en-US': {
    cancel: 'Cancel',
    collapse: 'Collapse',
    confirm: 'Confirm',
    expand: 'Expand',
    prompt: 'Prompt',
    reset: 'Reset',
    submit: 'Submit',
  },
  'zh-CN': {
    cancel: '取消',
    collapse: '收起',
    confirm: '确认',
    expand: '展开',
    prompt: '提示',
    reset: '重置',
    submit: '提交',
  },
  'zh-TW': {
    cancel: '取消',
    collapse: '收起',
    confirm: '確認',
    expand: '展開',
    prompt: '提示',
    reset: '重置',
    submit: '提交',
  },
  'es-ES': {
    cancel: 'Cancelar',
    collapse: 'Plegar',
    confirm: 'Confirmar',
    expand: 'Expandir',
    prompt: 'Aviso',
    reset: 'Restablecer',
    submit: 'Enviar',
  },
  ar: {
    cancel: 'إلغاء',
    collapse: 'طي',
    confirm: 'تأكيد',
    expand: 'توسيع',
    prompt: 'تنبيه',
    reset: 'إعادة تعيين',
    submit: 'إرسال',
  },
  'fr-FR': {
    cancel: 'Annuler',
    collapse: 'Replier',
    confirm: 'Confirmer',
    expand: 'Déplier',
    prompt: 'Invite',
    reset: 'Réinitialiser',
    submit: 'Soumettre',
  },
  'bn-BD': {
    cancel: 'বাতিল করুন',
    collapse: 'ভাঁজ করুন',
    confirm: 'নিশ্চিত করুন',
    expand: 'প্রসারিত করুন',
    prompt: 'প্রম্পট',
    reset: 'রিসেট',
    submit: 'সাবমিট',
  },
  'pt-BR': {
    cancel: 'Cancelar',
    collapse: 'Recolher',
    confirm: 'Confirmar',
    expand: 'Expandir',
    prompt: 'Aviso',
    reset: 'Redefinir',
    submit: 'Enviar',
  },
  'ru-RU': {
    cancel: 'Отмена',
    collapse: 'Свернуть',
    confirm: 'Подтвердить',
    expand: 'Развернуть',
    prompt: 'Подсказка',
    reset: 'Сбросить',
    submit: 'Отправить',
  },
  'id-ID': {
    cancel: 'Batal',
    collapse: 'Ciutkan',
    confirm: 'Konfirmasi',
    expand: 'Perluas',
    prompt: 'Pemberitahuan',
    reset: 'Atur Ulang',
    submit: 'Kirim',
  },
  'th-TH': {
    cancel: 'ยกเลิก',
    collapse: 'ยุบ',
    confirm: 'ยืนยัน',
    expand: 'ขยาย',
    prompt: 'แจ้งเตือน',
    reset: 'รีเซ็ต',
    submit: 'ส่ง',
  },
  'ur-PK': {
    cancel: 'منسوخ',
    collapse: 'سکیڑیں',
    confirm: 'تصدیق',
    expand: 'پھیلائیں',
    prompt: 'اطلاع',
    reset: 'ری سیٹ',
    submit: 'جمع کرائیں',
  },
  'de-DE': {
    cancel: 'Abbrechen',
    collapse: 'Einklappen',
    confirm: 'Bestätigen',
    expand: 'Aufklappen',
    prompt: 'Hinweis',
    reset: 'Zurücksetzen',
    submit: 'Senden',
  },
  'ja-JP': {
    cancel: 'キャンセル',
    collapse: '折りたたむ',
    confirm: '確認',
    expand: '展開',
    prompt: 'プロンプト',
    reset: 'リセット',
    submit: '送信',
  },
};

/** getMessages 返回目标语言的表单词库；未知运行时值回退英语。 */
export const getMessages = (locale: Locale): Record<string, string> => messages[locale] ?? messages['en-US']!;
