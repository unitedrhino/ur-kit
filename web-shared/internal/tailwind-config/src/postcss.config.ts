import config from '.';

export default {
  plugins: {
    ...(process.env.NODE_ENV === 'production' ? { cssnano: {} } : {}),
    // Specifying the config is not necessary in most cases, but it is included
    autoprefixer: {},
    // 修复 element-plus 和 ant-design-vue 的样式和tailwindcss冲突问题
    'postcss-antd-fixes': { prefixes: ['ant', 'el'] },
    'postcss-import': {},
    'postcss-preset-env': {
      features: {
        // 禁用逻辑属性降级：默认按 browserslist 会把 margin-inline-end 等改写成
        // margin-right/left 纯物理值（无方向变体），导致 dir=rtl 下 Tailwind 的
        // start/end/me/ps 等镜像类完全失效。现代浏览器原生支持逻辑属性，直接保留输出。
        'logical-properties-and-values': false,
      },
    },
    tailwindcss: { config },
    'tailwindcss/nesting': {},
  },
};
