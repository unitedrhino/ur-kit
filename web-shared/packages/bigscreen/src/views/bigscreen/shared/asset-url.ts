export function resolveAssetUrl(path?: string) {
  const normalized = path?.trim() || '';
  if (!normalized) return '';
  if (/^https?:\/\//.test(normalized)) return normalized;
  if (!normalized.startsWith('/')) return normalized;

  const apiBase = (import.meta.env.VITE_GLOB_API_URL || '').trim();
  if (!apiBase) return normalized;

  try {
    return new URL(normalized, apiBase).toString();
  } catch {
    return normalized;
  }
}
