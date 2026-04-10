# Community Screen 模块化结构

## 目录结构

```
screens/Community/
├── index.ts                  # 主导出文件
├── CommunityScreen.tsx       # 主屏幕组件（精简版本）
├── types.ts                  # TypeScript 类型定义
├── constants.ts              # 常量和示例数据
├── styles.ts                 # 所有样式表（待迁移）
├── components/
│   ├── index.ts
│   ├── ChallengeCard.tsx     # Challenge 卡片组件
│   ├── PostCard.tsx          # Post 卡片组件
│   ├── ChallengeDetailModal.tsx   # 挑战详情模态框
│   ├── CreateChallengeModal.tsx   # 4步向导创建模态框
│   └── CreatePostModal.tsx        # 创建帖子模态框
└── hooks/
    ├── index.ts
    └── useCommunityState.ts  # 统一状态管理 Hook
```

## 使用方式

### 直接导入主组件
```typescript
import { CommunityScreen } from 'src/screens/Community'
```

### 导入具体类型和常量
```typescript
import { CommunityChallenge, Post, SAMPLE_CHALLENGES } from 'src/screens/Community'
```

### 在其他屏幕使用 Hook
```typescript
import { useCommunityState } from 'src/screens/Community'

const state = useCommunityState()
// 现在可以在多个屏幕共享 Community 状态
```

## 文件说明

### types.ts
- `TopParticipant`: 参与者信息
- `Badge`: 徽章数据
- `CommunityChallenge`: 挑战主数据
- `Post`: 帖子数据
- `CreateChallengeFormData`: 创建表单数据
- `ChallengeType`, `DurationOption`, `BadgeDesign`: 创建表单选项类型

### constants.ts
- `SAMPLE_CHALLENGES`: 5个预设挑战
- `SAMPLE_POSTS`: 3个示例帖子
- `CHALLENGE_TYPES`: 5种挑战类型
- `DURATION_OPTIONS`: 6种时长选项
- `BADGE_DESIGNS`: 9种徽章设计
- `EMOJI_CATEGORIES`: 9个快速表情
- `MEAL_CATEGORIES`: 8个食物分类

### hooks/useCommunityState.ts
集中管理所有状态：
- Challenge 相关：challenges, selectedChallenge, showChallengeDetail, scrollOffset
- Post 相关：posts, showCreatePost
- 创建表单相关：createStep, formData, titleError, descError
- 所有操作函数：scroll, handleJoinChallenge, handleCreatePost 等

### components/
独立的组件，接收必要的 props，易于单独测试和复用：
- **ChallengeCard**: 显示单个挑战卡片
- **PostCard**: 显示单个帖子卡片
- **ChallengeDetailModal**: 挑战详情模态框（需迁移）
- **CreateChallengeModal**: 4步向导创建模态框（需迁移）
- **CreatePostModal**: 创建帖子的模态框（需迁移）

## 迁移计划

### 第一阶段（✅ 已完成）
- ✅ 创建文件夹和 index.ts
- ✅ 提取 types.ts
- ✅ 提取 constants.ts
- ✅ 创建 useCommunityState Hook
- ✅ 创建 ChallengeCard 和 PostCard 组件

### 第二阶段（待进行）
- ⏳ 创建 styles.ts 并导出所有样式
- ⏳ 提取 ChallengeDetailModal 组件
- ⏳ 提取 CreateChallengeModal 组件
- ⏳ 提取 CreatePostModal 组件

### 第三阶段（待进行）
- ⏳ 重写 CommunityScreen.tsx
  - 使用 useCommunityState Hook
  - 导入所有组件
  - 导入所有样式
  - 将文件精简到 200-300 行

### 第四阶段（待进行）
- ⏳ 删除原始 CommunityScreen.tsx 文件
- ⏳ 更新 navigation/AppNavigator.tsx 导入路径
- ⏳ 测试所有功能

## 优势

1. **代码分离**: 每个文件职责单一，易于维护
2. **可复用**: 组件和 hooks 可在其他屏幕使用
3. **类型安全**: 集中定义所有类型
4. **易测试**: 小的独立组件更容易单元测试
5. **可扩展**: 新增功能只需添加新组件或 hooks
6. **性能**: 按需导入，减少初始加载

## 后续完善

- 添加更多测试
- 性能优化（memoization）
- 增加错误处理
- 添加加载状态
- 集成实际 API
