# FoodPrint 样式管理文档

本文档说明项目中主题与样式的组织方式、如何修改主题色、以及页面如何复用样式，避免在多个文件中重复配置。

---

## 一、概述与原则

- **单一数据源**：颜色、间距、字体等集中在 `src/theme/tokens.ts`，修改一处即可全局生效。
- **双端一致**：React Native Paper（按钮、卡片、底部栏等）与 React Navigation（导航栏、头部、Tab）使用同一套颜色，通过 `combinedTheme` 合并后分别注入。
- **页面不写死颜色**：各 Screen 通过 `useScreenStyles()` 或 Paper 的 `useTheme()` 获取样式与颜色，不单独写 `backgroundColor: '#fff'` 等。

---

## 二、目录结构

```
src/theme/
├── tokens.ts         # 设计令牌：颜色、间距、字体
├── combinedTheme.ts  # 合并 Paper + Navigation 主题
├── useScreenStyles.ts# 页面通用样式 Hook
└── index.ts          # 统一导出
```

| 文件 | 作用 |
|------|------|
| `tokens.ts` | 定义 `lightColors` / `darkColors`、`spacing`、`typography`，供主题与样式消费 |
| `combinedTheme.ts` | 用 tokens 生成 Paper 主题与 Navigation 主题，并导出 `getCombinedTheme` / `getNavigationTheme` |
| `useScreenStyles.ts` | 根据当前主题生成页面通用样式（如 `screen`、`title`），供各 Screen 使用 |
| `index.ts` | 对外导出 theme 相关 API |

---

## 三、设计令牌（tokens）

### 3.1 颜色

**浅色主题 `lightColors`**

| 键 | 含义 | 典型用途 |
|----|------|----------|
| `background` | 页面背景 | 全屏容器、Tab 内容区 |
| `foreground` | 主文字色 | 标题、正文 |
| `card` | 卡片背景 | 卡片、列表项背景 |
| `primary` | 主色 | 按钮、选中 Tab、链接 |
| `primaryForeground` | 主色上的文字 | 主按钮文字 |
| `muted` | 弱化背景 | 次要区域、输入框底 |
| `mutedForeground` | 弱化文字 | 说明、占位符 |
| `border` | 边框 | 分割线、输入框边框 |
| `destructive` | 危险操作 | 删除、错误提示 |

**深色主题 `darkColors`** 键与上表一致，仅取值不同，随系统深色模式切换。

修改主题色时，只需在 `tokens.ts` 中改 `lightColors` / `darkColors` 的对应 hex 或 rgba，无需改其他文件。

### 3.2 间距与字体

```ts
// tokens.ts
spacing   // xs: 4, sm: 8, md: 16, lg: 24, xl: 32（单位 px）
typography // title: { fontSize: 24, fontWeight: '600' }, body: { fontSize: 16, ... }
```

需要统一间距或字号时，在组件中引用 `spacing.md`、`typography.title` 等，避免魔法数字。

---

## 四、合并主题（Paper + Navigation）

### 4.1 流程

1. **App 根节点**（`App.tsx`）根据系统深浅色得到 `'light' | 'dark'`。
2. 调用 `getCombinedTheme(scheme)` 得到 Paper 主题，传给 `<PaperProvider theme={...}>`。
3. 调用 `getNavigationTheme(scheme)` 得到 Navigation 主题，传给 `<NavigationContainer theme={...}>`。

两套主题均来自同一套 `tokens`，因此底部 Tab、头部、卡片、按钮等视觉一致。

### 4.2 映射关系

`combinedTheme.ts` 内通过 `mapToPaperColors(colors)` 将 tokens 映射到 Paper 的 MD3 颜色键，例如：

- `primary` → Paper `primary` / `onPrimary`
- `background` / `foreground` → `surface` / `onSurface`
- `muted` / `mutedForeground` → `surfaceVariant` / `onSurfaceVariant`
- `destructive` → `error`

Navigation 主题则直接使用 `background`、`card`、`text`、`primary`、`border` 等键，与 tokens 一一对应。

新增或重命名 token 时，若需在 Paper 或 Navigation 中生效，需在 `combinedTheme.ts` 的映射或合并对象中补充。

---

## 五、页面样式（useScreenStyles）

### 5.1 作用

`useScreenStyles()` 根据当前 Paper 主题生成**页面级通用样式**，避免在每个 Screen 里重复写 `StyleSheet` 和颜色。

### 5.2 返回值

| 键 | 说明 |
|----|------|
| `screen` | 全屏居中容器：`flex: 1`、`backgroundColor: theme.colors.background`、居中对齐 |
| `title` | 页面标题：使用 `typography.title`，并带 `color: theme.colors.onSurface`、下边距 |

### 5.3 使用方式

```tsx
// 在任意 Screen 组件内
import { useScreenStyles } from '../theme'

export function HomeScreen() {
  const styles = useScreenStyles()
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Home</Text>
      {/* 其他内容 */}
    </View>
  )
}
```

不需要在页面内再写 `backgroundColor`、标题字号或颜色，它们都来自主题。

### 5.4 扩展

若需要更多通用样式（如 `subtitle`、`card`、`input`），在 `useScreenStyles.ts` 的 `useMemo` 返回对象中增加字段，并继续使用 `theme.colors` 与 `typography` / `spacing`。

---

## 六、在组件中使用主题

### 6.1 仅用页面通用样式

- 使用 **`useScreenStyles()`** 即可，无需再引用颜色（见上一节）。

### 6.2 需要单独用颜色或 Paper 主题

- 使用 Paper 的 **`useTheme()`**：

```tsx
import { useTheme } from 'react-native-paper'

const { colors } = useTheme()
// colors.primary, colors.background, colors.onSurface 等
```

- 使用 **tokens**（不依赖 Provider，适合工具函数或非 UI 逻辑）：

```tsx
import { lightColors, spacing } from '../theme'
// 或按深浅色选 lightColors / darkColors
```

### 6.3 导航栏 / Tab 栏

- `AppNavigator` 内通过 `useTheme()`（Paper）读取 `colors`，设置 `tabBarStyle`、`tabBarActiveTintColor`、`headerStyle` 等，保证与全局主题一致。

---

## 七、修改主题与扩展清单

| 需求 | 操作位置 |
|------|----------|
| 改主色、背景色、文字色等 | `src/theme/tokens.ts` 的 `lightColors` / `darkColors` |
| 改统一间距或字号 | `src/theme/tokens.ts` 的 `spacing` / `typography` |
| 新增全局颜色键 | 在 `tokens` 中增加键，并在 `combinedTheme.ts` 的 `mapToPaperColors` 或 Navigation 主题中映射 |
| 新增页面通用样式 | `src/theme/useScreenStyles.ts` 中增加返回字段，使用 `theme.colors` 与 tokens |
| 仅改 Paper 组件表现 | 在 `combinedTheme.ts` 的 `CombinedLightTheme` / `CombinedDarkTheme` 的 `colors` 中覆盖对应键 |
| 仅改 Navigation 表现 | 在 `NavigationLightTheme` / `NavigationDarkThemeMerged` 的 `colors` 中覆盖对应键 |

---

## 八、与设计稿 / CSS 变量对照

若设计稿或 Web 端使用 CSS 变量（如 `--primary`、`--background`），可在文档或注释中维护对照表，例如：

| CSS 变量 | tokens 键 |
|----------|------------|
| `--background` | `lightColors.background` / `darkColors.background` |
| `--foreground` | `foreground` |
| `--primary` | `primary` |
| `--primary-foreground` | `primaryForeground` |
| `--muted` | `muted` |
| `--muted-foreground` | `mutedForeground` |
| `--border` | `border` |
| `--destructive` | `destructive` |

修改设计稿时，只需同步更新 `tokens.ts` 中对应键的值即可。

---

## 九、常见问题

**Q：页面想用和主题不同的背景色可以吗？**  
可以。用 `useTheme()` 取 `colors` 后，大部分仍用主题，仅对单个容器覆盖 `style={{ backgroundColor: '...' }}` 即可。

**Q：如何加第三种主题（如“高对比度”）？**  
在 `tokens.ts` 中增加一套颜色（如 `highContrastColors`），在 `combinedTheme.ts` 中增加对应主题对象，并在 App 中根据设置选择 `scheme`（需自建状态或 Context）后传入 `getCombinedTheme` / `getNavigationTheme`。

**Q：为什么不用 StyleSheet.create 在 useScreenStyles 里？**  
当前返回的是普通对象样式，便于直接使用 `theme.colors` 且随主题变化。若需性能优化，可在 Hook 内对稳定结构使用 `StyleSheet.create`，对依赖 `colors` 的部分仍用内联或 useMemo 生成对象。
