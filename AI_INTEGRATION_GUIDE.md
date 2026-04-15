# 🚀 AI 功能集成测试指南

## ✅ 已完成的集成

### 1. AI 服务层
- **文件**: `src/services/ai.ts`
- **功能**: 
  - `analyzeText()` - 文本分析API调用
  - `analyzeImage()` - 图片分析API调用
  - `extractAssistantText()` - 响应适配

### 2. 认证服务层
- **文件**: `src/services/auth.ts`
- **功能**: 
  - `getUserToken()` - 获取用户认证token（当前为mock实现）
  - `isDevelopmentMode()` - 开发模式检测
  - 为真实认证集成预留接口

### 3. 聊天工具类
- **文件**: `src/services/chatUtils.ts`
- **功能**: ChatMessage 格式适配和创建工具

### 4. RecordScreen 界面集成 ✅ 完全集成
- **Text Description**: 连接到 `POST /api/ai/analyze`
- **Photo Scan**: 连接到 `POST /api/ai/analyze/image` 
- **AI Chat**: 连接到 `POST /api/ai/analyze`
- **UI状态**: 支持loading、error、success显示
- **认证**: 集成token获取和验证

---

## 🔧 待配置项

### 1. 真实JWT认证集成 ⚠️ 重要
**位置**: `src/services/auth.ts` 中的 `getUserToken()` 函数
```typescript
// 需要替换为真实Supabase认证：
const { data: { session } } = await supabaseClient.auth.getSession();
return session?.access_token || null;
```

### 2. 网络地址配置（真机调试）
**文件**: `.env` 
```bash
# 真机调试时，将 localhost 改为电脑的局域网IP
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:8080
```

---

## 🧪 测试步骤

### 1. 启动后端
```bash
cd SHIT_CODE/backend
# 设置环境变量(需要真实的 GEMINI_API_KEY)
export GEMINI_API_KEY=your_key_here
mvn spring-boot:run
```

### 2. 启动前端
```bash
cd FoodPrint_fe
pnpm start
```

### 3. 测试 Text Description
1. 点击 "Text Description" tab
2. 输入文本，如："我今天吃了鸡胸肉和西兰花"
3. 点击 "Analyze Now"
4. 观察：
   - 按钮变为 "Analyzing..." 并显示loading
   - 成功后弹出 Alert 显示结果

### 4. 测试 Photo Scan  
1. 点击 "Photo Scan" tab
2. 选择 "Take Photo" 或 "Upload from Gallery"
3. 选择一张食物图片
4. 观察：
   - 自动开始分析并显示loading
   - 成功后弹出 Alert 显示识别结果

### 5. 测试 AI Chat
1. 点击右下角的聊天按钮
2. 输入消息，如："你好，我想了解健康饮食"
3. 点击发送
4. 观察：
   - 用户消息立即显示
   - 发送按钮变为loading状态
   - AI回复显示在聊天区

---

## 🐛 常见问题排查

### 1. 认证相关问题
**现象**: 弹出"请先登录"或token获取失败
**解决**: 
1. 当前使用mock token，检查 `src/services/auth.ts`
2. 生产环境需要集成真实Supabase认证
3. 开发模式会显示"使用mock token"提示

### 2. 网络连接失败
**现象**: 网络错误提示
**排查顺序**:
1. 检查后端是否启动 (`http://localhost:8080`)
2. 检查 `.env` 中的 `EXPO_PUBLIC_API_BASE_URL`
3. 真机用户检查是否使用了 `localhost`(应该用局域网IP)
4. 检查控制台是否有详细的网络错误日志

### 3. 后端API错误  
**现象**: HTTP 4xx/5xx 错误
**排查**:
1. 检查 `GEMINI_API_KEY` 是否设置
2. 查看后端日志
3. 检查mock token是否被后端接受
4. 检查请求格式是否正确

### 4. 图片上传失败
**现象**: 图片处理失败
**可能原因**:
1. 图片格式不支持（仅支持JPEG、PNG）
2. 文件太大 (后端限制10MB)
3. multipart/form-data 格式错误
4. 真机权限问题（相机/相册权限）

---

## 📝 下一步工作

### 🔴 高优先级（必须完成）
1. **集成Supabase认证** - 替换 `src/services/auth.ts` 中的mock实现
2. **后端JWT验证** - 确保后端接受前端的认证token
3. **错误处理优化** - 更友好的错误提示和重试机制

### 🟡 中优先级（建议完成）  
1. **结果展示UI** - 更好地展示AI分析结果，而不是只用Alert
2. **离线缓存** - 保存聊天历史和分析记录
3. **图片预览** - 在分析前/后显示上传的图片
4. **加载状态优化** - 更平滑的loading动画

### 🟢 低优先级（可选）
1. **分析结果导出** - 保存到食物日历或本地存储
2. **性能优化** - API调用去重和缓存
3. **用户体验增强** - 输入建议、快捷短语、语音输入
4. **多语言支持** - 国际化处理

---

## 🚀 立即可测试的功能

现在你可以直接测试：
- ✅ **文本分析** - 输入食物描述，获取AI分析结果
- ✅ **图片识别** - 上传食物图片，获取识别结果  
- ✅ **AI聊天** - 与AI进行对话交流
- ✅ **Loading状态** - 所有操作都有loading和错误处理

只需要：
1. 启动后端（设置GEMINI_API_KEY）
2. 启动前端（pnpm start）
3. 选择平台测试！