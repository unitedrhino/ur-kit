/**
 * tab-icons 保存底部导航图标的 SVG mask 源码。
 *
 * 微信小程序对 SVG 静态资源和 mask 支持较严格，源码不直接暴露 SVG 文件；
 * 构建阶段由 vite.config.ts 读取这里的 SVG 字符串，并按主题 token 生成 PNG。
 */

/** tabIconSvgs 是底部导航图标的单色 SVG mask 集合。 */
export const tabIconSvgs = {
  home: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 81 81" fill="none">
  <path d="M16 38.5L40.5 18L65 38.5" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M24 36.5V64H35V49H46V64H57V36.5" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
  device: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 81 81" fill="none">
  <rect x="18" y="15" width="31" height="37" rx="5" stroke="currentColor" stroke-width="6" stroke-linejoin="round"/>
  <rect x="33" y="29" width="30" height="37" rx="5" fill="white" stroke="currentColor" stroke-width="6" stroke-linejoin="round"/>
  <path d="M42 58H54" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
</svg>`,
  scene: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 81 81" fill="none">
  <path d="M19 42.5L40.5 24L62 42.5" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M25 40.5V62H56V40.5" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M36 56L45 47H37L45 38" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
  mine: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 81 81" fill="none">
  <circle cx="40.5" cy="27" r="10" stroke="currentColor" stroke-width="6"/>
  <path d="M22 64C24.8 52.5 31.5 46.5 40.5 46.5C49.5 46.5 56.2 52.5 59 64" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
} as const;
