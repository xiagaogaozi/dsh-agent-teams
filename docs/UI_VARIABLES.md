# UI 变量说明

适用范围：`dsh-agent-teams` 的成员模板设置页与右上角 AgentTeams 活动面板。设置页和活动面板均优先复用 DeepSeek Harness 的 `--dsw-alias-*` 语义变量；活动面板只在 `.badge`、`.panel` 内兼容旧版名称，绝不覆盖宿主的全局主题变量。

## 命名与层级

页面专属且需要统一控制的尺寸使用组件级变量，名称以 `--agent-teams-` 开头，避免与宿主或其他插件冲突。`--dsw-alias-*`、`--dsw-static-*` 与 `--dsh-sidebar-width` 均由宿主或已安装的侧栏插件提供，本插件仅引用或在自身面板作用域内提供兼容回退。

## 组件变量

| 变量 | 层级 | 当前值/引用 | 中文说明 | 来源 | 主要使用位置 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| `--agent-teams-settings-field-width` | 组件 | `280px` | 成员模板编辑表单中可编辑控件的统一桌面宽度；窄容器可由 `flex-shrink` 收缩。 | `src/client/TeamSettingsPage.module.css` | 名称、描述、模型、推理等级、预设 | 在用 |
| `--agent-teams-panel-width` | 组件 | `388px` | 活动面板的桌面宽度，也是对话列为面板让出的主要空间计算依据。 | `src/client/ActivityPanel.module.css` | 展开面板、对话列位移 | 在用 |
| `--agent-teams-panel-top` | 组件 | `64px`；窄屏 `56px` | 右上活动面板与顶部导航的安全间距。 | `src/client/ActivityPanel.module.css` | 折叠徽标、展开面板 | 在用 |
| `--agent-teams-panel-bottom-gap` | 组件 | `64px`；窄屏 `56px` | 保留底部输入区的可视空间，参与面板最大高度计算。 | `src/client/ActivityPanel.module.css` | 展开面板 | 在用 |
| `--agent-teams-panel-min-height` | 组件 | `560px` | 桌面活动面板的优先最小高度；小视口仍受可用视窗约束。 | `src/client/ActivityPanel.module.css` | 展开面板 | 在用 |
| `--agent-teams-panel-right` | 组件 | `calc(18px + var(--dsh-sidebar-width, 0px))`；窄屏 `10px` | 面板右侧偏移；自动避开已启用的 Better Sidebar。 | `src/client/ActivityPanel.module.css` | 折叠徽标、展开面板 | 在用 |
| `--agent-teams-panel-gap` | 组件 | `14px` | 面板与对话列之间的固定间隔。 | `src/client/ActivityPanel.module.css` | 对话列位移 | 在用 |
| `--agent-teams-panel-shift` | 组件 | 由面板宽度、右侧间隔计算 | 面板展开时写入活动对话列的右侧内边距，避免遮住正文和编辑器。 | `src/client/ActivityPanel.module.css` | 活动对话列 | 在用 |

## 宿主语义变量复用与兼容

- `TeamSettingsPage.module.css` 复用 `--dsw-alias-border-l2`、`--dsw-alias-label-primary`、`--dsw-alias-label-secondary`、`--dsw-alias-label-dimmed`、`--dsw-alias-bg-module-platform`、`--dsw-alias-bg-layer-1`、`--dsw-alias-interactive-bg-hover`、`--dsw-alias-brand-primary` 与 `--dsw-alias-state-error-primary`。
- `ActivityPanel.module.css` 复用 `--dsw-alias-label-primary`、`--dsw-alias-label-secondary`、`--dsw-alias-label-tertiary`、`--dsw-alias-bg-module-platform`、`--dsw-alias-bg-layer-1`、`--dsw-alias-state-business-primary`、`--dsw-alias-state-success-primary`、`--dsw-alias-state-warn-primary`、`--dsw-alias-state-error-primary`、`--dsw-alias-label-primary-inverted` 和 `--dsh-sidebar-width`。
- 活动面板内部的 `--dsw-alias-line-normal`、`--dsw-alias-line-strong`、`--dsw-alias-bg-module`、`--dsw-alias-bg-fill-*`、`--dsw-alias-state-success|warning|danger`、`--dsw-alias-label-on-fill` 是兼容别名，作用域限于 `.badge` 与 `.panel`；它们回退至上述宿主变量与 `--dsw-static-neutral-bluish-*`。

## 合法硬编码例外

- 活动面板兼容层中的 `#e7e9ee`、`#e1e5ee`、`#cfd3d6`、`#ffffff`、`#eef0f4`、`#4d6bfe`、`#12a150`、`#e08700`、`#e5484d` 仅在宿主缺少相应设计变量时作为回退值，不参与本插件主题定义。
- `0`、`auto`、百分比、SVG 坐标与由视窗或 flex 布局计算的值保留为布局逻辑。`activity-model.ts` 的 DAG 节点尺寸与间距是纯布局算法常量，不是可主题化的 CSS token。

## 同步记录

- 2026-08-17：移植上游活动面板的紧凑 DAG、键盘/悬停依赖焦点和响应式布局；新增并核对活动面板组件变量与宿主语义变量复用。成员头像继续只显示原始鲸鱼图，不使用姓名首字母或状态角标；头像底色改为宿主 `--dsw-alias-bg-module`。
- 2026-08-17：新增 `--agent-teams-settings-field-width: 280px`，使名称、描述、模型、推理等级和预设同宽；保留顶部“选择成员模板”选择器的满行布局。
