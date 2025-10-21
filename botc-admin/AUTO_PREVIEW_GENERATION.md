# 🖼️ 管理端自动生成预览图功能

## ✅ 功能概述

在管理端添加剧本时（单个上传和批量导入），系统会自动根据JSON数据生成精美的SVG预览图。

---

## 📦 实现内容

### 1. 新增云函数

#### `script-generate-preview`
- **位置**：`botc-admin/uniCloud-aliyun/cloudfunctions/script-generate-preview/`
- **功能**：根据JSON数据生成SVG预览图（不保存数据库）
- **文件**：
  - `index.js` - 云函数主逻辑
  - `preview-generator.js` - SVG生成器
  - `package.json` - 包配置

### 2. 修改现有云函数

#### `script-batch-import`
- **修改**：添加预览图生成逻辑
- **新增文件**：`preview-generator.js`
- **功能**：批量导入时自动为每个剧本生成预览图

### 3. 修改前端页面

#### `pages/botc/script/edit.vue`
- **修改**：保存前调用云函数生成预览图
- **位置**：`handleSubmit()` 方法

---

## 🚀 部署步骤

### 步骤1：上传云函数

#### 上传 script-generate-preview
```bash
右键：botc-admin/uniCloud-aliyun/cloudfunctions/script-generate-preview
选择：「上传部署」
等待上传成功
```

#### 重新上传 script-batch-import
```bash
右键：botc-admin/uniCloud-aliyun/cloudfunctions/script-batch-import
选择：「上传部署」
等待上传成功
```

### 步骤2：测试功能

#### 测试单个上传
```bash
1. 刷新管理后台
2. 进入「添加剧本」
3. 上传JSON文件
4. 填写信息
5. 点击「保存」
6. 观察loading提示：
   - "生成预览图..."
   - "保存中..."
7. 保存成功后，在剧本列表查看
8. ✅ 应该有preview_image字段
```

#### 测试批量导入
```bash
1. 在剧本列表页点击「📁 批量导入JSON」
2. 选择多个JSON文件
3. 点击「开始导入」
4. 观察导入进度
5. 导入完成后查看剧本列表
6. ✅ 所有剧本都应该有预览图
```

---

## 🔄 工作流程

### 单个上传流程
```
用户上传JSON文件
    ↓
点击「保存」
    ↓
调用 script-generate-preview 云函数
    ↓
生成SVG预览图（base64）
    ↓
将preview_image添加到数据
    ↓
保存到数据库
```

### 批量导入流程
```
用户选择多个JSON文件
    ↓
前端解析文件并构建数据
    ↓
调用 script-batch-import 云函数
    ↓
For 每个剧本:
  ├─ 解析JSON数据
  ├─ 生成SVG预览图
  ├─ 转换为base64
  ├─ 添加preview_image字段
  └─ 保存到数据库
```

---

## 📊 预览图内容

### 包含信息
- ✅ 剧本标题（居中显示）
- ✅ 作者名称
- ✅ 角色分类（镇民、外来者、爪牙、恶魔等）
- ✅ 每个角色的名称和能力描述
- ✅ 角色头像（如果有image字段）
- ✅ 精美的渐变背景
- ✅ 黄金边框装饰

### 格式
- **类型**：SVG矢量图
- **编码**：base64
- **存储**：`data:image/svg+xml;base64,...`
- **优势**：无需云存储，体积小，清晰度高

---

## 🧪 验证清单

### 单个上传测试
- [ ] 上传JSON文件成功
- [ ] 显示"生成预览图..."提示
- [ ] 保存成功
- [ ] 数据库中有preview_image字段
- [ ] 预览图可以正常显示

### 批量导入测试
- [ ] 选择多个JSON文件
- [ ] 导入进度正常显示
- [ ] 所有剧本都有预览图
- [ ] 日志显示"已生成预览图"
- [ ] 预览图内容正确

### 用户端验证
- [ ] 在用户端小程序查看剧本详情
- [ ] 预览图正常显示
- [ ] 可以放大查看
- [ ] 可以下载保存

---

## 🐛 故障排查

### 问题1：预览图生成失败

**查看日志**：
```
uniCloud控制台 → 云函数 → script-generate-preview → 日志
或
script-batch-import → 日志
```

**常见原因**：
- JSON格式不正确
- 缺少必要字段（name、team等）
- 云函数未正确部署

### 问题2：保存后没有预览图

**检查**：
```
1. 云函数是否上传成功
2. 控制台是否有错误日志
3. json_data字段是否存在
```

### 问题3：批量导入没有预览图

**检查**：
```
1. script-batch-import 是否包含 preview-generator.js
2. 云函数是否重新上传
3. 查看云函数日志
```

---

## 💡 优化建议

### 已实现
- ✅ 自动生成预览图
- ✅ 不影响保存流程（生成失败也能保存）
- ✅ 显示进度提示
- ✅ 批量和单个都支持

### 未来可优化
- 📌 添加预览图编辑功能
- 📌 支持自定义预览图样式
- 📌 缓存已生成的预览图
- 📌 异步生成（先保存，后台生成）

---

## ✅ 完成状态

### 已完成
- [x] 创建 script-generate-preview 云函数
- [x] 修改 script-batch-import 云函数
- [x] 修改单个添加页面逻辑
- [x] 添加preview-generator.js
- [x] 编写文档

### 待完成
- [ ] 上传云函数到uniCloud
- [ ] 测试单个上传生成预览图
- [ ] 测试批量导入生成预览图
- [ ] 在用户端验证预览图显示

---

**功能版本**: v1.0.0  
**完成时间**: 2025年10月21日  
**状态**: ✅ 开发完成，待部署测试

