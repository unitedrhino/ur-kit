export interface SuggestFamilyNameInput {
  nickName?: string;
  tenantName?: string;
  existingNames?: string[];
}

const GENERIC_NICKNAMES = new Set([
  '微信用户',
  '用户',
  '新用户',
  '未命名',
]);

const CHINESE_NUMBERS = ['二', '三', '四', '五', '六', '七', '八', '九', '十'];

function normalizeText(value?: string): string {
  return (value || '').trim();
}

function isPhoneLike(value: string): boolean {
  return /^\d{6,}$/.test(value) || /\*{2,}/.test(value);
}

function isGenericNickname(value: string): boolean {
  if (!value) {
    return true;
  }
  if (GENERIC_NICKNAMES.has(value)) {
    return true;
  }
  return isPhoneLike(value);
}

function trimTenantName(value: string): string {
  return value.replace(/(组织|企业|公司|集团)$/u, '').trim() || value;
}

function buildCandidates(input: SuggestFamilyNameInput): string[] {
  const candidates: string[] = [];
  const nickName = normalizeText(input.nickName);
  const tenantName = trimTenantName(normalizeText(input.tenantName));

  if (!isGenericNickname(nickName)) {
    candidates.push(`${nickName}的家`);
  }
  if (tenantName) {
    candidates.push(`${tenantName}空间`);
  }
  candidates.push('新家庭');
  return candidates;
}

function withOrdinal(baseName: string, index: number): string {
  if (index <= 1) {
    return baseName;
  }
  const ordinal = CHINESE_NUMBERS[index - 2] || `${index}`;
  if (baseName.endsWith('家')) {
    return `${baseName.slice(0, -1)}${ordinal}号家`;
  }
  return `${baseName}${ordinal}号`;
}

export function suggestFamilyName(input: SuggestFamilyNameInput): string {
  const existingNames = new Set((input.existingNames || []).map((item) => item.trim()).filter(Boolean));
  const candidates = buildCandidates(input);

  for (const candidate of candidates) {
    if (!existingNames.has(candidate)) {
      return candidate;
    }
    let index = 2;
    while (index < 20) {
      const nextName = withOrdinal(candidate, index);
      if (!existingNames.has(nextName)) {
        return nextName;
      }
      index += 1;
    }
  }

  return '新家庭';
}
