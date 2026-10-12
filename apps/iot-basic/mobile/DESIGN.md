---
version: alpha
name: WeChat UniApp IoT Control
description: A calm, system-native mobile design system for SaaS IoT consumer workflows. It uses Apple-inspired clarity, a blue interaction language, soft white cards, and precise operational states for devices, scenes, Bluetooth provisioning, OTA, and AI conversations.

colors:
  primary: "#1677ff"
  primary-action: "#0958d9"
  primary-pressed: "#0958d9"
  primary-soft: "#e8f2ff"
  primary-tint: "#f0f7ff"
  success: "#52c41a"
  success-ink: "#237804"
  success-soft: "#f6ffed"
  warning: "#faad14"
  warning-ink: "#874d00"
  warning-soft: "#fff7e6"
  error: "#ff4d4f"
  error-ink: "#cf1322"
  error-action: "#cf1322"
  error-soft: "#fff1f0"
  info: "#13c2c2"
  text-primary: "#1a1a1a"
  text-secondary: "#666666"
  text-tertiary: "#999999"
  text-placeholder: "#767676"
  page-bg: "#f5f7fa"
  card-bg: "#ffffff"
  card-bg-subtle: "#fafbfc"
  border: "#f0f0f0"
  divider: "#e8e8e8"
  shadow-blue: "#1e88e5"
  dark-page-bg: "#111111"
  dark-card-bg: "#1c1c1e"
  dark-border: "#2c2c2e"
  dark-text-primary: "#e5e5e5"
  on-primary: "#ffffff"

typography:
  page-title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif"
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: 0px
  section-title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: 0px
  card-title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif"
    fontSize: 15px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0px
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0px
  body-strong:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: 0px
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: 0px
  caption:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: 0px
  button:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif"
    fontSize: 15px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0px
  mono:
    fontFamily: "SFMono-Regular, Consolas, 'Liberation Mono', monospace"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0px

rounded:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 24px
  xxl: 32px
  page-x: 16px
  page-y: 16px
  touch-min: 44px
  fab: 56px
  footer-height: 64px

components:
  app-shell:
    backgroundColor: "{colors.page-bg}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
  navigation-bar:
    backgroundColor: "{colors.card-bg}"
    textColor: "{colors.text-primary}"
    typography: "{typography.section-title}"
    height: 44px
  content-card:
    backgroundColor: "{colors.card-bg}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "16px"
  feature-card:
    backgroundColor: "{colors.card-bg}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "20px"
  list-row:
    backgroundColor: "{colors.card-bg}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    height: 52px
  button-primary:
    backgroundColor: "{colors.primary-action}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    height: 44px
    padding: "0 16px"
  button-primary-pressed:
    backgroundColor: "{colors.primary-pressed}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    height: 44px
    padding: "0 16px"
  button-secondary:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary-action}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    height: 44px
    padding: "0 16px"
  button-danger:
    backgroundColor: "{colors.error-action}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    height: 44px
    padding: "0 16px"
  search-input:
    backgroundColor: "{colors.card-bg}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    height: 40px
    padding: "8px 12px"
  search-placeholder:
    backgroundColor: "{colors.card-bg}"
    textColor: "{colors.text-placeholder}"
    typography: "{typography.body}"
  text-link:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    typography: "{typography.body}"
  text-secondary:
    backgroundColor: transparent
    textColor: "{colors.text-secondary}"
    typography: "{typography.label}"
  text-tertiary:
    backgroundColor: transparent
    textColor: "{colors.text-tertiary}"
    typography: "{typography.caption}"
  control-surface:
    backgroundColor: "{colors.primary-tint}"
    textColor: "{colors.primary-action}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "12px"
  subtle-card:
    backgroundColor: "{colors.card-bg-subtle}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "16px"
  divider-line:
    backgroundColor: "{colors.divider}"
    height: 1px
  hairline:
    backgroundColor: "{colors.border}"
    height: 1px
  status-badge-online:
    backgroundColor: "{colors.success-soft}"
    textColor: "{colors.success-ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  status-badge-warning:
    backgroundColor: "{colors.warning-soft}"
    textColor: "{colors.warning-ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  status-badge-error:
    backgroundColor: "{colors.error-soft}"
    textColor: "{colors.error-ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  status-dot-online:
    backgroundColor: "{colors.success}"
    rounded: "{rounded.full}"
    size: 8px
  status-dot-warning:
    backgroundColor: "{colors.warning}"
    rounded: "{rounded.full}"
    size: 8px
  status-dot-error:
    backgroundColor: "{colors.error}"
    rounded: "{rounded.full}"
    size: 8px
  status-dot-info:
    backgroundColor: "{colors.info}"
    rounded: "{rounded.full}"
    size: 8px
  fab-primary:
    backgroundColor: "{colors.primary-action}"
    textColor: "{colors.on-primary}"
    typography: "{typography.page-title}"
    rounded: "{rounded.full}"
    size: 56px
  fab-shadow-color:
    backgroundColor: "{colors.shadow-blue}"
  bottom-footer:
    backgroundColor: "{colors.card-bg}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    height: 64px
  debug-panel:
    backgroundColor: "#111827"
    textColor: "#d1d5db"
    typography: "{typography.mono}"
    rounded: "{rounded.lg}"
    padding: "16px"
  dark-app-shell:
    backgroundColor: "{colors.dark-page-bg}"
    textColor: "{colors.dark-text-primary}"
    typography: "{typography.body}"
  dark-content-card:
    backgroundColor: "{colors.dark-card-bg}"
    textColor: "{colors.dark-text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "16px"
  dark-divider:
    backgroundColor: "{colors.dark-border}"
    height: 1px
---

# WeChat UniApp IoT Control Design System

## Overview

本设计系统用于 `apps/mobile-uniapp` 后续迭代，目标是让首页、设备、场景、我的、蓝牙配网、OTA、AI 会话等页面保持一致的视觉语言和交互习惯。

主参考选择 `/Users/ykhl/Desktop/design/awesome-design-md/design-md/apple/DESIGN.md`。原因是当前项目已经采用系统字体、蓝色交互主色、浅色卡片和低装饰移动端体验，与 Apple 式的清晰、克制、系统原生感最贴合。文档格式参考 `/Users/ykhl/Desktop/design/design.md` 的 DESIGN.md 规范：YAML front matter 是机器可读 token，正文是设计意图和执行规则。

产品气质是 **安静可信的 IoT 控制台**：它不是营销页，也不是重后台，而是用户每天反复打开的设备管理工具。UI 应该让设备状态、控制入口和异常反馈一眼可读；装饰、复杂渐变、夸张阴影和强品牌化插画都要让位给操作效率。

## Colors

主色沿用当前项目的 `#1677ff`，用于主操作、选中态、进行中状态、链接和关键入口。不要把主色当装饰背景大面积铺开，蓝色应该像系统控件一样只在用户需要行动或识别状态时出现。

- **Primary `#1677ff`**：选中 tab、可点击文字、配网进度 active 状态。
- **Primary Action `#0958d9`**：承载白字的主按钮和 FAB，保证对比度。
- **Success `#52c41a` / Success Ink `#237804`**：在线、成功、可用、完成；浅底标签用深色文字。
- **Warning `#faad14` / Warning Ink `#874d00`**：等待、超时提醒、需要用户留意但未失败；浅底标签用深色文字。
- **Error `#ff4d4f` / Error Action `#cf1322`**：删除、解绑、失败、异常设备状态；危险按钮使用深红保证白字对比度。
- **Page Background `#f5f7fa`**：所有滚动页底色。
- **Card Background `#ffffff`**：信息卡、列表行、控制面板、表单分组。
- **Text Primary `#1a1a1a`**：核心内容和标题。
- **Text Secondary `#666666`**：说明、辅助信息、设备型号、时间。

暗色模式只做系统级兜底，默认不主动设计整套深色页面。若新增暗色体验，必须沿用 token 中的 `dark-*` 值，避免在页面里散写固定黑灰色。

## Typography

字体使用系统栈：`-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif`。不要引入远程字体，不要为了单页效果额外加载字体包。

移动端中文界面以 12/13/14/15/16/20px 为主。页面级标题交给自定义 `navigation-bar`，内容区内不要再堆大标题。设备名称、步骤标题、核心状态可使用 20px；普通正文使用 14px；辅助说明使用 13px；时间、标记和角标使用 12px。

所有 letter spacing 保持 `0px`。不要使用负字距、全大写英文风格或营销感标题。数字、设备标识、调试日志可使用 `mono` token，但只用于技术信息，不用于普通文案。

## Layout

页面结构默认是：

```text
navigation-bar
scroll-view scroll-y type="list"
  page section
  content card / list row / control panel
safe-area or fixed bottom footer
```

布局以 8px 栅格为基础：页面左右边距 16px，卡片内边距 16px，重要视觉卡片可用 20px，卡片间距 12px 或 16px。不要使用复杂 grid、float 或依赖浏览器特性的布局；小程序、H5、App、Harmony 都要优先保证一致。

首屏必须优先呈现当前上下文：当前用户/家庭、设备列表、设备状态、配网步骤或当前会话。不要做营销式 hero、说明卡或大段功能介绍。工具型页面应让用户进入后能直接执行下一步。

滚动页底部必须留出 safe area。固定底部操作区使用 `bottom-footer` 语义：白色背景、顶部细分割或轻阴影、按钮高度 44px，内容区 padding-bottom 至少为 `footer-height + safe-area-inset-bottom + 16px`。

## Elevation & Depth

深度主要靠色层、间距和圆角，不靠重阴影。默认卡片没有外阴影，浮动按钮可以使用一层蓝色轻阴影，弹层和固定底部栏可使用很浅的阴影或 hairline 分割。

推荐层级：

- **Level 0：页面底色**，`page-bg`。
- **Level 1：普通卡片**，`card-bg` + 12px/16px 圆角，无阴影。
- **Level 2：固定栏/浮动按钮**，少量阴影或分割线，z-index 清晰。
- **Level 3：Modal/Action Sheet**，由平台原生能力承接，业务页面不自造复杂遮罩。

禁止为了“高级感”添加玻璃拟态、渐变光斑、彩色阴影、背景装饰球或大面积透明叠层。IoT 控制界面的高级感来自稳定、清晰和响应及时。

## Shapes

形状语言是 **系统原生 + 轻柔卡片**。

- 小控件、输入框、列表行：8px。
- 普通卡片、表单分组、状态面板：12px。
- 强视觉卡片、配网主视觉、空状态容器：16px。
- FAB、状态点、胶囊标签：9999px。

不要使用超过 24px 的大圆角卡片作为默认容器。卡片内部不要再嵌套卡片；如果需要分组，用标题、分割线、间距或淡色背景区分。

## Components

**Navigation Bar**

全局使用自定义 `<navigation-bar>`。主 tab 页 `back=false`，子页默认可返回。标题保持简短，通常 2 到 6 个汉字。右侧只放一个高频操作或状态入口，避免堆多个文字按钮。

**Cards**

设备、场景、配网、OTA、设置项都使用白色卡片承载。卡片标题 15/16px 半粗，正文 14px，辅助文案 13px。卡片内的主状态应靠左上或顶部区域呈现，不要把关键信息藏在卡片底部。

**Device Card**

设备卡是核心重复组件。必须同时表达设备名、产品名、图片或占位、在线状态。在线状态使用成功绿，离线使用中性灰，异常使用 warning/error。点击区域覆盖整张卡，触控目标不小于 44px。

**Property Control**

物模型控件优先清晰，不追求炫技。布尔值用 switch，枚举用 picker/action sheet，数值用 slider/stepper/input，动作调用进入独立页面确认。控制项必须展示当前值和单位；下发中禁用重复提交；成功和失败用 toast 反馈。

**Forms**

新增/编辑表单优先独立页面。表单项纵向排列，label 不要过长；必填和错误靠字段附近表达。底部固定主按钮，危险操作单独放在危险分组，不和保存按钮并排。

**Lists**

列表页默认：搜索/筛选区、列表内容、加载/空状态、底部 “没有更多了”。列表项高度保持稳定，不因状态标签、图片加载或长文本导致跳动。长设备名、产品名、会话标题统一省略。

**Bluetooth Provisioning**

配网是强流程页面。步骤条、当前状态、倒计时和取消入口必须稳定可见。图标可以抽象，但不要用 emoji。失败页必须给出明确下一步：重试、返回修改 WiFi、查看帮助或取消。

**AI Chat and Clone Memory**

会话类页面使用安静的聊天气泡和时间/摘要分隔。用户气泡使用主色，助手气泡使用白色卡片。记忆、摘要、主题词属于辅助信息，使用 caption/label，不要抢主对话内容。

**Empty, Loading, Error**

空状态必须告诉用户当前对象为空和下一步动作。加载态使用现有 `<loading>`；长列表加载更多用底部文字，不在每个卡片内放 spinner。错误态优先 toast + 页面内可恢复动作，不要只显示“失败”。

## Do's and Don'ts

**Do**

- 优先复用 `src/app.scss` 的 CSS 变量和本文件 token。
- 页面滚动内容使用 `scroll-view scroll-y type="list"`。
- 主操作使用蓝色，成功/警告/错误严格使用语义色。
- 所有点击区域至少 44px 高或宽。
- 业务组件沉淀到 `src/components/<name>/<name>.vue`，遵循 easycom 目录约定。
- 设备、家庭、房间、场景等用户语义统一从配置或业务模型来，不在页面随意改名。
- 用户可见文案禁止出现“租户”及英文 tenant。
- 每个页面首屏都要让用户看清当前对象、状态和下一步。

**Don't**

- 不引入 Vant 4、Vant Weapp 或整套第三方 UI 库作为默认方案。
- 不做营销式 hero、装饰插画、渐变背景、光斑、玻璃拟态。
- 不在页面散写平台私有 API，不在 UI 直接调用 repository 或裸 request。
- 不用 emoji 作为功能图标；需要图标时使用现有组件、图片资源或纯 CSS 图形。
- 不把卡片套卡片，不用重阴影制造层级。
- 不使用负字距、视口缩放字体或超大标题。
- 不把调试信息暴露给普通用户；调试面板必须暗色、可控、只在明确需要时出现。
- 不让按钮文字、标签、设备名撑破容器；长文本必须省略或换行，并验证小屏。
