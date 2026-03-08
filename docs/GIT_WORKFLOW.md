# FoodPrint Git 工作流

本文档说明团队协作时的分支管理、提交规范与 Code Review 流程。

---

## 一、分支约定

| 分支 | 说明 |
|------|------|
| `master` / `main` | 主分支，只放已通过 Review、可发布的内容，**不要直接在上面改代码** |
| `feature/xxx` | 新功能，如 `feature/login`、`feature/camera-scan` |
| `fix/xxx` | 修复 Bug，如 `fix/crash-on-android` |
| `refactor/xxx` | 重构，如 `refactor/navigation` |

---

## 二、日常流程

### 1. 拉取最新代码

每次开发前先同步主分支：

```bash
git checkout master
git pull origin master
```

### 2. 新建功能分支

从最新的 `master` 切出新分支：

```bash
git checkout -b feature/你的功能名
```

示例：

```bash
git checkout -b feature/profile-edit
```

### 3. 开发与提交

在分支上正常写代码，按「小步、语义化」提交：

```bash
# 查看修改
git status
git diff

# 暂存要提交的文件（不要提交 node_modules、.env 等）
git add src/screens/ProfileScreen.tsx
# 或暂存所有修改：git add .

# 提交（建议用简洁的祈使句）
git commit -m "feat(profile): 增加个人资料编辑页"
```

**提交信息建议格式：**

- `feat(模块): 做了什么` — 新功能
- `fix(模块): 修复什么问题` — Bug 修复
- `refactor(模块): 重构说明` — 重构
- `docs: 说明` — 文档
- `style: 说明` — 格式/样式，不改变逻辑

### 4. 推送到远程并发起 PR

首次推送该分支时：

```bash
git push -u origin feature/你的功能名
```

之后同一分支再改：

```bash
git push
```

然后到 **GitHub**：

1. 打开仓库页面，一般会看到「Compare & pull request」横幅，点进去；
2. 或手动：**Branches** → 找到你的分支 → **New pull request**；
3. **Base** 选 `master`，**Compare** 选你的分支；
4. 填写 PR 标题和描述（做了什么、如何自测、有无截图/录屏）；
5. 指定 Reviewer（队友），点 **Create pull request**。

### 5. Code Review

- **Reviewer**：在 PR 的 **Files changed** 里看 diff，对某行点「+」可写评论；全部看完后点 **Review changes** → 选 **Approve** 或 **Request changes**，并写总结。
- **作者**：根据评论改代码，在同一分支继续提交并 push，PR 会自动更新；讨论都解决后再请 Reviewer 确认。

### 6. 合并与清理

- 合并：在 GitHub 上点 **Merge pull request**（可选 **Squash and merge** 把多次提交压成一条）。
- 合并后删除远程分支（GitHub 会提示 **Delete branch**）。
- 本地切回主分支并删除已合并的功能分支：

```bash
git checkout master
git pull origin master
git branch -d feature/你的功能名
```

---

## 三、常用命令速查

| 操作 | 命令 |
|------|------|
| 看当前分支 | `git branch` |
| 看状态与未提交改动 | `git status`、`git diff` |
| 新建并切换分支 | `git checkout -b feature/xxx` |
| 切换分支 | `git checkout master` |
| 暂存所有改动 | `git add .` |
| 提交 | `git commit -m "消息"` |
| 推送当前分支 | `git push` 或 `git push -u origin 分支名` |
| 拉取当前分支 | `git pull` |
| 放弃工作区未暂存修改 | `git checkout -- 文件名` |
| 查看提交历史 | `git log --oneline` |

---

## 四、提交前自检

合并进 `master` 前建议在本地跑一遍：

```bash
pnpm lint
pnpm format:check
pnpm start   # 确认能正常跑
```

有问题则：

```bash
pnpm lint:fix
pnpm format
```

再 `git add`、`git commit` 后推送，减少 Review 时的格式类评论。

---

## 五、可选：主分支保护（GitHub）

若希望主分支只能通过 PR 合并、且需 Review：

1. 仓库 **Settings** → **Branches**；
2. **Add branch protection rule**，分支名填 `master` 或 `main`；
3. 勾选 **Require a pull request before merging**，可再勾选 **Require approvals**（如 1）；
4. 保存后，无人能直接 push 到 `master`，必须走 PR + Review。

这样「新建分支 → 提交 → PR → Code Review → 合并」就成团队统一流程。
