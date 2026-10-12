/**
 * 应用启动信息工具。
 * 提供应用刷新时的控制台日志输出，便于排查用户访问的是哪个应用、哪次构建的包。
 */

/**
 * 打印当前应用名称与编译时间。
 * 应用入口（src/main.ts）在启动时调用一次；开发与生产构建均会输出，
 * 编译时间由 vite 公共插件注入的 import.meta.env.VITE_BUILD_TIME 提供。
 */
export function logAppBuildInfo() {
  console.info(
    `[app] ${import.meta.env.VITE_GLOB_APPNAME} build@${import.meta.env.VITE_BUILD_TIME}`,
  );
}
