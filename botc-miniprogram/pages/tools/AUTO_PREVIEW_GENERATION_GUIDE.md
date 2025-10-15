# 剧本上传自动预览图生成功能

## 📋 功能概述

用户上传剧本JSON后，系统会自动生成精美的SVG预览图，包含：
- 剧本基本信息（名称、作者）
- 角色分类统计（镇民、外来者、爪牙、恶魔等）
- 夜晚行动顺序可视化
- 专业的视觉设计

## 🎯 实现原理

### 1. 前端：剧本上传页面
**文件**: `pages/tools/upload-json/upload-json.vue`

**功能流程**:
```
用户粘贴JSON → 前端解析验证 → 提取基本信息 → 提交到云函数
```

**核心特性**:
- ✅ 实时JSON格式验证
- ✅ 自动解析剧本信息
- ✅ 智能提取角色统计
- ✅ 三步式上传流程
- ✅ 友好的提示和反馈

### 2. 后端：云函数处理
**文件**: `uniCloud-aliyun/cloudfunctions/script-upload/`

**文件结构**:
```
script-upload/
├── index.js              # 主函数入口
├── preview-generator.js  # SVG预览图生成器
└── package.json         # 依赖配置
```

**处理流程**:
```
接收JSON → 验证用户 → 生成SVG预览图 → 保存到数据库 → 返回结果
```

## 💡 核心代码说明

### 前端解析逻辑

```javascript
// 解析剧本数据
parseScriptData(json) {
  // 支持两种JSON格式
  if (Array.isArray(json)) {
    // 数组格式：[{id: '_meta', ...}, {id: 'washerwoman', ...}]
    const metaObj = json.find(item => item.id === '_meta')
    title = metaObj?.name || title
    characters = json.filter(item => item.id !== '_meta')
  } else {
    // 对象格式：{name: '剧本名', characters: [...]}
    title = json.name || json.title
    characters = json.characters || json
  }
  
  // 统计各阵营角色数量
  const rolesByTeam = {
    townsfolk: [],
    outsider: [],
    minion: [],
    demon: []
  }
  // ... 分类统计
}
```

### 云函数生成预览图

```javascript
// 1. 接收数据
const { title, author, description, json } = event

// 2. 生成SVG
const scriptData = { id, title, author, json }
const svgContent = generateScriptPreviewSVG(scriptData)

// 3. 转为base64
const svgBase64 = Buffer.from(svgContent, 'utf-8').toString('base64')
const previewDataUrl = `data:image/svg+xml;base64,${svgBase64}`

// 4. 保存到数据库
await db.collection('opendb-botc-scripts').add({
  title,
  author,
  json_data: parsedJson,
  preview_image: previewDataUrl, // SVG预览图
  ...
})
```

### SVG生成核心逻辑

**参考源代码**: 用户提供的 TypeScript 预览图生成器

**关键功能**:
1. **动态高度计算** - 根据角色数量自动调整画布高度
2. **两列布局** - 角色列表采用两列展示
3. **夜晚行动可视化** - 左侧首夜，右侧其他夜晚
4. **智能文本换行** - 角色技能支持多行显示
5. **渐变色设计** - 专业的视觉效果

## 📊 数据流转

```
用户端 (小程序)
    ↓
  粘贴JSON
    ↓
  前端验证和解析
    ↓
  提交到云函数
    ↓
云函数 (uniCloud)
    ↓
  验证用户身份
    ↓
  生成SVG预览图
    ↓
  保存到云数据库
    ↓
  返回成功结果
    ↓
用户端显示成功
```

## 🎨 预览图设计规范

### 尺寸规格
- **宽度**: 520px（固定）
- **高度**: 动态计算（根据角色数量）
- **格式**: SVG（矢量图，可缩放）

### 布局结构
```
┌────────────────────────────────┐
│  制作者：萌萌           (水印)  │
│         剧本标题                │
│        作者: xxx                │
├──┬────────────────────────┬───┤
│首│  👥 镇民 (5个)          │其 │
│夜│  洗衣妇  开局得知...    │他 │
│  │  厨师    开局得知...    │夜 │
│行│  🏃 外来者 (2个)         │晚 │
│动│  酒鬼    不知道...      │   │
│  │  🗡️ 爪牙 (3个)          │行 │
│顺│  投毒者  每夜选择...    │动 │
│序│  😈 恶魔 (1个)          │   │
│  │  小恶魔  每夜选择...    │顺 │
└──┴────────────────────────┴───┘
```

### 颜色方案
- **背景**: 深蓝渐变 `#0f172a → #1e293b → #334155`
- **边框**: 金色 `#f59e0b`
- **镇民**: 绿色 `#10b981`
- **外来者**: 黄色 `#eab308`
- **爪牙**: 橙色 `#f97316`
- **恶魔**: 红色 `#ef4444`
- **夜晚**: 紫色 `#8b5cf6`

## 🔧 技术特点

### 1. 支持两种JSON格式

**格式一：数组格式** (官方工具导出)
```json
[
  {
    "id": "_meta",
    "name": "剧本名称",
    "author": "作者"
  },
  {
    "id": "washerwoman",
    "name": "洗衣妇",
    "team": "townsfolk",
    "ability": "开局得知某位玩家的角色",
    "firstNight": 15
  }
]
```

**格式二：对象格式** (自定义)
```json
{
  "name": "剧本名称",
  "author": "作者",
  "characters": [
    {
      "id": "washerwoman",
      "name": "洗衣妇",
      "team": "townsfolk"
    }
  ]
}
```

### 2. 智能信息提取

- **剧本名称**: 优先从 `_meta.name` 或 `json.name` 提取
- **作者**: 优先从 `_meta.author` 或 `json.author` 提取
- **角色统计**: 自动分类统计各阵营角色数量
- **玩家数量**: 根据角色数量智能估算

### 3. SVG优势

- ✅ **矢量图**: 无损缩放，清晰度高
- ✅ **体积小**: 比PNG/JPEG小得多
- ✅ **可编辑**: 可直接修改SVG代码
- ✅ **兼容性**: 所有现代浏览器支持

## 📱 用户使用流程

### 步骤 1: 进入上传页面
```
工具 Tab → 剧本上传
```

### 步骤 2: 粘贴JSON
```
1. 复制剧本JSON内容
2. 粘贴到输入框
3. 系统自动验证格式
```

### 步骤 3: 查看解析结果
```
自动显示：
- 剧本名称
- 作者
- 角色总数
- 玩家数量
- 各阵营角色统计
```

### 步骤 4: 完善信息
```
可编辑：
- 剧本名称
- 作者
- 剧本简介
```

### 步骤 5: 提交
```
点击"提交并生成预览图"
→ 云函数自动生成SVG预览图
→ 保存到数据库
→ 等待管理员审核
```

## 🗄️ 数据库设计

### opendb-botc-scripts 集合

```javascript
{
  title: '剧本名称',
  author: '作者',
  description: '剧本简介',
  json_data: {...},              // 原始JSON数据
  preview_image: 'data:image/svg+xml;base64,...', // SVG预览图（base64）
  player_count: '7-15人',
  total_characters: 20,
  difficulty: '普通',
  script_type: '标准剧本',
  tags: [],
  creator_id: 'user_id',
  status: 0,                     // 0-待审核，1-已发布，2-已拒绝
  created_at: 1234567890,
  updated_at: 1234567890
}
```

## 🎯 与原TypeScript代码的对比

### 保留的功能
- ✅ 动态高度计算
- ✅ 两列角色布局
- ✅ 夜晚行动顺序
- ✅ 智能文本换行
- ✅ 角色分类统计
- ✅ 渐变色设计

### 简化的部分
- ❌ 图片下载和压缩（云函数环境用首字母代替）
- ❌ Sharp图片处理（SVG不需要）
- ❌ 文件系统操作（直接返回base64）
- ❌ 批量生成功能（单个上传）

### 原因说明
- uniCloud云函数不支持Sharp库
- 小程序环境不需要复杂的图片处理
- SVG格式已足够满足需求
- 使用base64存储更简单

## 🚀 部署步骤

### 1. 上传云函数
```
在HBuilderX中：
1. 右键 uniCloud-aliyun/cloudfunctions/script-upload
2. 选择"上传并运行"
3. 等待部署完成
```

### 2. 测试功能
```
1. 在小程序中进入工具 → 剧本上传
2. 粘贴测试JSON
3. 填写信息并提交
4. 检查数据库中的记录
5. 查看生成的preview_image字段
```

### 3. 验证预览图
```javascript
// 在剧本详情页显示预览图
<image :src="script.preview_image" mode="aspectFit"/>
```

## 📝 示例测试JSON

```json
[
  {
    "id": "_meta",
    "name": "测试剧本",
    "author": "测试作者"
  },
  {
    "id": "washerwoman",
    "name": "洗衣妇",
    "team": "townsfolk",
    "ability": "开局得知某位玩家的角色",
    "firstNight": 15
  },
  {
    "id": "imp",
    "name": "小恶魔",
    "team": "demon",
    "ability": "每夜选择一名玩家杀死",
    "firstNight": 0,
    "otherNight": 21
  }
]
```

## ⚠️ 注意事项

### 1. JSON格式要求
- 必须是有效的JSON格式
- 支持数组和对象两种格式
- 必须包含角色数据

### 2. 性能考虑
- SVG生成在云端进行，不影响前端性能
- 生成的SVG以base64存储在数据库
- 首次加载可能较慢，建议使用CDN

### 3. 图片显示
```vue
<!-- 在剧本列表/详情中显示预览图 -->
<image 
  :src="script.preview_image" 
  mode="aspectFit"
  style="width: 100%; height: auto;"
/>
```

## 🔄 后续优化方向

### 1. 图片处理增强
- 考虑将SVG转为PNG（使用云函数）
- 支持图片URL下载和压缩
- 生成多种尺寸的预览图

### 2. 功能扩展
- 支持自定义预览图模板
- 支持用户上传封面图
- 批量导入剧本

### 3. 用户体验
- 实时预览生成结果
- 支持预览图编辑
- 提供预览图下载

## 📚 相关文件

### 小程序端
- `pages/tools/index/index.vue` - 工具主页
- `pages/tools/upload-json/upload-json.vue` - 上传页面
- `pages/tools/wiki/wiki.vue` - 百科页面

### 云函数端
- `cloudfunctions/script-upload/index.js` - 主函数
- `cloudfunctions/script-upload/preview-generator.js` - 预览图生成器
- `cloudfunctions/script-upload/package.json` - 依赖配置

### 配置文件
- `pages.json` - 页面路由配置

## 🎉 完成状态

- [x] 创建剧本上传页面
- [x] JSON解析和验证
- [x] 剧本信息提取
- [x] 创建云函数
- [x] 集成SVG生成器
- [x] 数据库保存
- [x] 注册页面路由
- [x] 更新工具页面跳转

## 📖 使用示例

### 1. 用户上传剧本
```
1. 打开小程序 → 工具 → 剧本上传
2. 粘贴剧本JSON
3. 查看自动解析的信息
4. 可修改完善剧本名称、作者、简介
5. 点击"提交并生成预览图"
6. 等待上传成功提示
```

### 2. 管理员审核
```
1. 在管理后台查看待审核剧本
2. 可以看到自动生成的预览图
3. 审核通过后剧本发布
```

### 3. 用户浏览
```
1. 在剧本列表中显示预览图
2. 点击查看详情
3. 可下载剧本JSON
```

---

**创建日期**: 2025年10月15日  
**参考代码**: 用户提供的TypeScript预览图生成器  
**实现状态**: ✅ 完成  
**版本**: v1.0.0

