# 剧本上传功能优化说明

## 🎯 优化内容

### 1. 文件上传方式 ✅
**从**: 复制粘贴JSON内容  
**改为**: 选择JSON文件上传

**优势**:
- ✅ 更符合用户习惯
- ✅ 支持大文件
- ✅ 自动读取文件内容
- ✅ 显示文件名和大小
- ✅ 提供备选粘贴方案

**实现方式**:
```javascript
// 使用 uni.chooseMessageFile 选择文件
const res = await uni.chooseMessageFile({
  count: 1,
  type: 'file',
  extension: ['.json']
})

// 读取文件内容
const fs = uni.getFileSystemManager()
fs.readFile({
  filePath: file.path,
  encoding: 'utf8',
  success: (res) => {
    this.jsonContent = res.data
  }
})
```

---

### 2. 标题和作者优先级 ✅
**逻辑**: 用户输入 > JSON中的值

**实现**:
```javascript
// 表单字段
formData: {
  customTitle: '',   // 用户自定义标题
  customAuthor: '',  // 用户自定义作者
  description: ''
}

// 提交时的优先级
const finalTitle = this.formData.customTitle.trim() || this.parsedInfo.title
const finalAuthor = this.formData.customAuthor.trim() || this.parsedInfo.author
```

**界面提示**:
```
剧本名称: [__________________]
          如需修改，请在此输入新名称
          留空则使用：暗流涌动

作者:     [__________________]
          如需修改，请在此输入新作者名
          留空则使用：血染工作室
```

---

### 3. 预览图展示 ✅
**位置**: 表单填写后，提交按钮前

**功能**:
- ✅ 显示即将生成的预览图样式
- ✅ 提示"提交后自动生成"
- ✅ 占位说明文字

**界面**:
```
┌──────────────────────────┐
│ 预览图    [提交后自动生成] │
├──────────────────────────┤
│   [预览图占位或示例图]     │
│                           │
│ 这是根据您的剧本JSON       │
│ 自动生成的预览图           │
└──────────────────────────┘
```

---

## 📁 修改的文件

### 前端
- ✅ `pages/tools/upload-json/upload-json.vue` - 上传页面主逻辑
  - 文件选择器
  - 优先级逻辑
  - 预览图展示

### 后端
- ✅ `cloudfunctions/script-upload/index.js` - 云函数
  - 返回预览图URL

---

## 💡 核心改进

### 改进1: 文件选择器

**UI界面**:
```
┌─────────────────────────────┐
│ 选择剧本文件  [✓ 格式正确]   │
├─────────────────────────────┤
│          📁                  │ ← 未选择时
│    点击选择JSON文件           │
│    支持 .json 格式文件        │
└─────────────────────────────┘

或

┌─────────────────────────────┐
│ 选择剧本文件  [✓ 格式正确]   │
├─────────────────────────────┤
│ ✅ darkflow.json       ✕    │ ← 已选择时
│    15.2KB                    │
└─────────────────────────────┘
```

**交互**:
- 点击区域选择文件
- 显示文件名和大小
- 点击✕移除文件
- 自动读取并验证

### 改进2: 优先级逻辑

**场景A: 用户不输入**
```
JSON中: { "name": "暗流涌动", "author": "血染工作室" }
用户输入: customTitle = '', customAuthor = ''
最终使用: title = "暗流涌动", author = "血染工作室"
```

**场景B: 用户输入**
```
JSON中: { "name": "darkflow", "author": "Blood Workshop" }
用户输入: customTitle = "暗流涌动", customAuthor = "血染工作室"
最终使用: title = "暗流涌动", author = "血染工作室"
```

**场景C: 部分输入**
```
JSON中: { "name": "darkflow", "author": "Blood Workshop" }
用户输入: customTitle = "暗流涌动", customAuthor = ''
最终使用: title = "暗流涌动", author = "Blood Workshop"
```

### 改进3: 预览图展示

**实现方式**:
```vue
<!-- 解析成功后显示 -->
<view v-if="previewImageUrl" class="preview-container">
  <image 
    class="preview-image" 
    :src="previewImageUrl" 
    mode="widthFix"
  />
  <text class="preview-tip">
    这是根据您的剧本JSON自动生成的预览图
  </text>
</view>
```

**说明**:
- 提交前: 显示占位或示例图（可选）
- 提交后: 云函数返回真实预览图URL
- 显示SVG矢量图，可缩放

---

## 🔄 完整上传流程

```
1. 点击"选择文件"
   ↓
2. 选择JSON文件（或粘贴内容）
   ↓
3. 自动读取并验证格式
   ↓
4. 解析剧本信息
   - 剧本名称: xxx（来自JSON）
   - 作者: xxx（来自JSON）
   - 角色统计: xxx
   ↓
5. 用户可选填写
   - 自定义标题（留空则用JSON中的）
   - 自定义作者（留空则用JSON中的）
   - 剧本简介
   ↓
6. 点击"提交并生成预览图"
   ↓
7. 云函数处理
   - 使用优先级逻辑确定最终标题和作者
   - 生成SVG预览图
   - 保存到数据库
   ↓
8. 返回成功
   - 显示最终使用的标题和作者
   - 跳转到"我的上传"页面
```

---

## 🎨 界面优化

### 文件选择区
```
┌──────────────────────────────┐
│ 选择剧本文件  [等待选择]      │
├──────────────────────────────┤
│          📁                   │
│    点击选择JSON文件            │
│    支持 .json 格式文件         │
├──────────────────────────────┤
│    [验证格式]  [查看内容]      │
└──────────────────────────────┘
```

### 解析结果（自动显示）
```
┌──────────────────────────────┐
│ 解析结果      [✓ 解析成功]    │
├──────────────────────────────┤
│ 剧本名称：暗流涌动             │
│ 作者：血染工作室               │
│ 角色总数：20个                 │
│ 玩家数量：7-15人左右           │
│ 👥镇民5 🏃外来者2 🗡️爪牙3 😈恶魔1│
└──────────────────────────────┘
```

### 表单信息（可选填写）
```
┌──────────────────────────────┐
│ 剧本信息  [可选填写，留空则使用JSON中的值] │
├──────────────────────────────┤
│ 剧本名称                       │
│ [_________________________]   │
│ 如需修改，请在此输入新名称      │
│ 留空则使用：暗流涌动            │
│                               │
│ 作者                          │
│ [_________________________]   │
│ 如需修改，请在此输入新作者名    │
│ 留空则使用：血染工作室          │
│                               │
│ 剧本简介                       │
│ [_________________________]   │
│ 请简要介绍这个剧本...（可选）   │
└──────────────────────────────┘
```

### 预览图展示
```
┌──────────────────────────────┐
│ 预览图        [提交后自动生成] │
├──────────────────────────────┤
│   ┌────────────────────┐     │
│   │                    │     │
│   │   [SVG预览图]       │     │
│   │                    │     │
│   └────────────────────┘     │
│                               │
│ 这是根据您的剧本JSON           │
│ 自动生成的预览图               │
└──────────────────────────────┘
```

---

## 🧪 测试场景

### 场景1: 使用JSON中的值
```
1. 选择文件：darkflow.json
   JSON: { "name": "darkflow", "author": "Blood Workshop" }
2. 不输入自定义值
   customTitle = ''
   customAuthor = ''
3. 提交
4. 最终使用：
   title = "darkflow"
   author = "Blood Workshop"
```

### 场景2: 使用自定义值
```
1. 选择文件：darkflow.json
   JSON: { "name": "darkflow", "author": "Blood Workshop" }
2. 输入自定义值
   customTitle = "暗流涌动"
   customAuthor = "血染工作室"
3. 提交
4. 最终使用：
   title = "暗流涌动"   ← 用户输入优先
   author = "血染工作室" ← 用户输入优先
```

### 场景3: 部分自定义
```
1. 选择文件：darkflow.json
   JSON: { "name": "darkflow", "author": "Blood Workshop" }
2. 只输入标题
   customTitle = "暗流涌动"
   customAuthor = ''
3. 提交
4. 最终使用：
   title = "暗流涌动"       ← 用户输入
   author = "Blood Workshop" ← JSON中的值
```

---

## 🔧 技术实现细节

### 文件选择API

**主方案**: `uni.chooseMessageFile`
```javascript
uni.chooseMessageFile({
  count: 1,           // 只选一个文件
  type: 'file',       // 文件类型
  extension: ['.json'] // 限制扩展名
})
```

**备选方案**: 手动粘贴
```javascript
// 如果API不可用，弹出粘贴对话框
uni.showModal({
  title: '粘贴JSON内容',
  editable: true,
  success: (res) => {
    if (res.confirm) {
      this.jsonContent = res.content
    }
  }
})
```

### 文件读取

```javascript
const fs = uni.getFileSystemManager()

fs.readFile({
  filePath: file.path,
  encoding: 'utf8',
  success: (res) => {
    this.jsonContent = res.data
    this.validateJsonFormat()
  }
})
```

### 优先级判断

```javascript
// 提交时决定最终值
const finalTitle = this.formData.customTitle.trim() || this.parsedInfo.title
const finalAuthor = this.formData.customAuthor.trim() || this.parsedInfo.author

// 发送到云函数
const uploadData = {
  title: finalTitle,    // 最终确定的标题
  author: finalAuthor,  // 最终确定的作者
  json: this.jsonContent
}
```

---

## 📊 数据流

```
用户选择文件
    ↓
读取文件内容 → this.jsonContent
    ↓
解析JSON → this.parsedInfo
    ├─ parsedInfo.title (JSON中的标题)
    └─ parsedInfo.author (JSON中的作者)
    ↓
用户可选输入
    ├─ formData.customTitle (自定义标题，可为空)
    └─ formData.customAuthor (自定义作者，可为空)
    ↓
提交时合并
    ├─ finalTitle = customTitle || parsedInfo.title
    └─ finalAuthor = customAuthor || parsedInfo.author
    ↓
发送到云函数
    ↓
云函数使用 finalTitle 和 finalAuthor
    ├─ 生成预览图（使用finalTitle和finalAuthor）
    └─ 保存到数据库
    ↓
返回成功 + 预览图URL
```

---

## 🎨 UI改进

### 表单输入框
```vue
<!-- 带placeholder提示当前JSON中的值 -->
<input 
  v-model="formData.customTitle"
  :placeholder="'留空则使用：' + parsedInfo.title"
/>

<!-- 下方提示文字 -->
<text class="form-hint">
  如需修改，请在此输入新名称
</text>
```

### 样式特性
- ✅ 输入框获得焦点时高亮（粉色边框）
- ✅ placeholder显示JSON中的值
- ✅ 灰色提示文字说明用法
- ✅ 留空时自动使用JSON值

---

## 📝 用户体验优化

### 1. 清晰的优先级提示
```
不需要重复输入：
- JSON中有标题和作者，直接留空即可
- 只有需要修改时才输入

例如：
JSON中是英文名，想改成中文名，就输入中文名
```

### 2. 友好的错误处理
```javascript
// 文件选择失败 → 提供粘贴备选方案
if (error) {
  uni.showModal({
    content: '当前环境不支持文件选择，是否使用粘贴方式？'
  })
}
```

### 3. 实时反馈
```
选择文件 → 自动读取 → 自动验证 → 显示解析结果
```

### 4. 成功提示清晰
```
上传成功！

剧本已提交审核
预览图已自动生成

最终使用：
标题：暗流涌动
作者：血染工作室

[确定] → 跳转到"我的上传"
```

---

## 🧪 测试清单

### 功能测试
- [ ] 点击选择文件区域
- [ ] 选择.json文件
- [ ] 文件信息显示正确（名称、大小）
- [ ] 自动读取文件内容
- [ ] 自动验证JSON格式
- [ ] 自动解析剧本信息
- [ ] 点击"验证格式"按钮
- [ ] 点击"查看内容"按钮
- [ ] 点击✕移除文件

### 优先级测试
- [ ] 留空标题和作者 → 使用JSON中的值
- [ ] 输入标题和作者 → 使用用户输入的值
- [ ] 只输入标题 → 标题用输入，作者用JSON
- [ ] 只输入作者 → 标题用JSON，作者用输入

### 预览图测试
- [ ] 解析后显示预览区域
- [ ] 提交后云函数生成预览图
- [ ] 在"我的上传"中显示预览图

---

## 🔄 兼容性方案

### 文件选择兼容性

**方案1**: `uni.chooseMessageFile` (推荐)
- 支持平台：微信小程序、H5
- 功能最完整

**方案2**: 手动粘贴
- 支持平台：所有
- 作为备选方案

**实现**:
```javascript
try {
  // 尝试使用文件选择API
  await uni.chooseMessageFile({...})
} catch (error) {
  // 失败则提供粘贴方案
  this.showPasteDialog()
}
```

---

## 📖 使用说明

### 标准流程
```
1. 点击"剧本上传"
2. 点击"点击选择JSON文件"
3. 从聊天记录或文件管理器选择.json文件
4. 等待自动验证和解析
5. 查看解析的剧本信息
6. 如果标题或作者需要修改，输入新值
7. 如果不需要修改，留空即可
8. 填写剧本简介（可选）
9. 点击"提交并生成预览图"
10. 等待上传成功
11. 自动跳转到"我的上传"查看
```

### 快捷测试
```
1. 准备一个test.json文件
2. 发送到微信"文件传输助手"
3. 在小程序中选择该文件
4. 直接提交（使用JSON中的值）
```

---

## ⚙️ 配置说明

### 文件限制
```javascript
{
  extension: ['.json'],  // 只允许json文件
  maxSize: 10 * 1024 * 1024  // 最大10MB（可配置）
}
```

### 验证规则
```javascript
// 必须项
- jsonContent 不为空
- JSON格式正确
- 包含角色数据

// 可选项
- customTitle（留空使用JSON）
- customAuthor（留空使用JSON）
- description
```

---

## 🎉 优化总结

### 用户体验提升
1. ✅ **更方便**: 文件选择比复制粘贴更快捷
2. ✅ **更灵活**: 可以自定义标题和作者
3. ✅ **更智能**: 自动使用JSON中的值
4. ✅ **更直观**: 实时显示预览图效果

### 技术实现亮点
1. ✅ **优先级逻辑**: 用户输入 > JSON值
2. ✅ **文件系统**: 使用uni文件API
3. ✅ **兼容性方案**: 主方案+备选方案
4. ✅ **实时验证**: 选择文件即验证

### 功能完整性
1. ✅ **文件上传**: 支持选择JSON文件
2. ✅ **智能解析**: 自动提取信息
3. ✅ **灵活编辑**: 可覆盖JSON中的值
4. ✅ **预览展示**: 显示即将生成的预览图
5. ✅ **成功跳转**: 上传后查看结果

---

**优化日期**: 2025年10月15日  
**版本**: v2.0.0  
**状态**: ✅ 优化完成

