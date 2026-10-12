/**
 * @vben/bigscreen - 大屏管理功能包
 *
 * 包含完整的大屏管理功能（GoView 编辑器、管理视图、数据源/数据集等）。
 * 源码完整存放在本包 src/ 下，独立于宿主应用。
 *
 * 宿主应用需要在 vite.config 中配置以下别名：
 * - @/             → packages/bigscreen/src/goview/  (goview 内部别名)
 * - /#/            → packages/bigscreen/src/goview/types (goview 类型别名)
 * - @app/          → packages/bigscreen/src/         (goview 跨域别名)
 *
 * 以及对应的 SCSS 预处理和 OSS 代理配置。
 */
export { createBigscreenRoutes } from './routes';
export type { BigscreenRoutesOptions } from './routes';

// 宿主应用可直接挂载 GoView 预览（例如嵌入自定义大屏到业务页面）
export { mountGoview, getGoviewInstance } from './goview-host/mount';
export type { GoviewMode, MountedGoview } from './goview-host/mount';
