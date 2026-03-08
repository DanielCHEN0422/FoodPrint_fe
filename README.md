# FoodPrint

基于 Expo + React Native 的跨平台移动应用前端项目。

## 环境要求

- **Node.js**：建议 v18 或以上（[官网](https://nodejs.org/)）
- **pnpm**：本项目使用 pnpm 管理依赖

  ```bash
  npm install -g pnpm
  ```

- **Expo Go**（真机调试）：在手机应用商店搜索「Expo Go」并安装

## 快速开始

### 1. 克隆并进入项目目录

```bash
git clone <仓库地址>
cd FoodPrint
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 启动开发服务器

```bash
pnpm start
```

终端会显示二维码和 Metro 地址。可以：

- **真机**：用 Expo Go 扫描二维码即可打开应用
- **模拟器**：在终端按 `a` 启动 Android 模拟器，或按 `i` 启动 iOS 模拟器（需 macOS + Xcode）
- **网页**：按 `w` 在浏览器中打开

## 常用脚本

| 命令 | 说明 |
|------|------|
| `pnpm start` | 启动 Expo 开发服务器 |
| `pnpm android` | 直接以 Android 模式启动 |
| `pnpm ios` | 直接以 iOS 模式启动（仅 macOS） |
| `pnpm web` | 以 Web 模式启动 |
| `pnpm lint` | 运行 ESLint 检查 |
| `pnpm lint:fix` | 自动修复可修复的 ESLint 问题 |
| `pnpm format` | 使用 Prettier 格式化代码 |
| `pnpm format:check` | 检查代码格式是否符合 Prettier 规则 |

## 项目结构概览

```
FoodPrint/
├── App.tsx              # 应用入口，仅挂载导航
├── src/
│   ├── navigation/      # 导航配置（Tab、路由等）
│   │   └── AppNavigator.tsx
│   └── screens/         # 页面组件
│       ├── HomeScreen.tsx
│       └── ProfileScreen.tsx
├── assets/              # 图片、图标等静态资源
└── package.json
```

新增页面时，在 `src/screens` 下添加组件，并在 `src/navigation/AppNavigator.tsx` 中注册路由。

## Git 与协作

团队开发请遵循 [Git 工作流与 Code Review 说明](docs/GIT_WORKFLOW.md)，包括：新建分支、提交规范、发起 Pull Request、Code Review 及合并流程。

## 开发建议

- 提交前执行 `pnpm lint` 和 `pnpm format:check`，或直接运行 `pnpm lint:fix`、`pnpm format` 保持代码风格一致。
- 使用 TypeScript 和现有 ESLint / Prettier 配置，避免随意修改格式化规则。

## 常见问题

- **依赖安装失败**：确认 Node 版本 ≥ 18，并已全局安装 pnpm，再执行 `pnpm install`。
- **扫码无法连接**：确保手机和电脑在同一局域网，必要时关闭 VPN 或防火墙再试。
- **iOS 模拟器**：仅在 macOS 上可用，需先安装 Xcode 和 iOS Simulator。
