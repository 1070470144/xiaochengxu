# ✅ Script 云对象 - 阶段1 完成

## 🎯 阶段1：核心功能（5个方法）

**完成时间：** 2025-11-03  
**状态：** ✅ 开发完成，待测试

---

## 📋 已完成的方法

| # | 方法名 | 功能说明 | 优先级 | 状态 |
|---|--------|---------|--------|------|
| 1 | getList | 获取剧本列表（支持筛选、搜索、分页） | ⭐⭐⭐⭐⭐ | ✅ |
| 2 | getDetail | 获取剧本详情（自动增加浏览量） | ⭐⭐⭐⭐⭐ | ✅ |
| 3 | upload | 上传剧本（含预览图生成） | ⭐⭐⭐⭐⭐ | ✅ |
| 4 | getMyUploads | 获取我上传的剧本 | ⭐⭐⭐⭐ | ✅ |
| 5 | delete | 删除剧本（软删除） | ⭐⭐⭐⭐ | ✅ |

---

## 📁 文件清单

### 云对象文件
- ✅ `uniCloud-aliyun/cloudfunctions/script/index.obj.js` (约 700 行)
- ✅ `uniCloud-aliyun/cloudfunctions/script/package.json`
- ✅ `uniCloud-aliyun/cloudfunctions/script/preview-generator.js` (复用)

---

## 🎨 方法详情

### 1. getList(options)
**功能：** 获取剧本列表，支持多种筛选和排序

**参数：**
```javascript
{
  page: 1,              // 页码
  pageSize: 20,         // 每页数量
  keyword: '',          // 搜索关键词（标题、作者、描述）
  type: 'all',          // 排序类型（all/hot/rating/download/new）
  difficulty: 0,        // 难度筛选（0=全部，1-5=具体难度）
  playerCount: '',      // 人数筛选
  tags: []              // 标签筛选
}
```

**返回：**
```javascript
{
  code: 0,
  message: 'success',
  data: {
    list: [...]，        // 剧本列表（不含完整JSON）
    total: 100,          // 总数
    page: 1,             // 当前页
    pageSize: 20,        // 每页数量
    hasNext: true        // 是否有下一页
  }
}
```

**特点：**
- ✅ 关联查询创建者信息
- ✅ 支持关键词搜索
- ✅ 支持难度、人数、标签筛选
- ✅ 支持多种排序（热门、评分、下载、最新）
- ✅ 列表不返回完整JSON（节省带宽）

---

### 2. getDetail(scriptId)
**功能：** 获取剧本详情

**参数：**
```javascript
scriptId: "script_xxx" // 剧本ID
```

**返回：**
```javascript
{
  code: 0,
  message: '获取成功',
  data: {
    _id: "xxx",
    title: "剧本标题",
    author: "作者",
    description: "描述",
    json_data: {...},      // 完整JSON数据
    preview_image: "...",  // 预览图
    user_images: [...],    // 用户上传的图片
    creator: {             // 创建者信息
      _id: "xxx",
      nickname: "昵称",
      avatar: "头像"
    },
    view_count: 100,       // 浏览量
    // ... 其他字段
  }
}
```

**特点：**
- ✅ 权限控制（未发布的只有创建者可见）
- ✅ 自动增加浏览量（异步）
- ✅ 关联创建者信息
- ✅ 返回完整JSON数据

---

### 3. upload(data)
**功能：** 上传剧本，自动生成预览图

**参数：**
```javascript
{
  title: "剧本标题",      // 必填
  author: "作者",         // 必填
  description: "描述",    // 可选
  json: {...},           // 剧本JSON，必填
  user_images: [...]     // 用户上传的图片（最多3张）
}
```

**返回：**
```javascript
{
  code: 0,
  message: '上传成功',
  data: {
    scriptId: "script_xxx",
    previewGenerated: true,
    previewImage: "data:image/svg+xml;base64,..."
  }
}
```

**特点：**
- ✅ 自动生成SVG预览图
- ✅ 提取剧本信息（人数、难度、类型、标签）
- ✅ 支持用户上传图片（最多3张）
- ✅ 图片URL验证
- ✅ 初始状态为"待审核"
- ✅ 更新说书人统计

---

### 4. getMyUploads(page, pageSize)
**功能：** 获取当前用户上传的剧本

**参数：**
```javascript
page: 1,         // 页码
pageSize: 10     // 每页数量
```

**返回：**
```javascript
{
  code: 0,
  message: 'success',
  data: {
    list: [...],      // 我的剧本列表（所有状态）
    total: 10,        // 总数
    page: 1,          // 当前页
    pageSize: 10,     // 每页数量
    hasMore: false    // 是否有下一页
  }
}
```

**特点：**
- ✅ 只查询未删除的记录
- ✅ 包含所有状态（待审核、已发布、已拒绝）
- ✅ 按创建时间倒序排列

---

### 5. delete(scriptId)
**功能：** 删除剧本（软删除）

**参数：**
```javascript
scriptId: "script_xxx" // 剧本ID
```

**返回：**
```javascript
{
  code: 0,
  message: '删除成功',
  data: null
}
```

**特点：**
- ✅ 权限验证（只能删除自己的剧本）
- ✅ 已发布的剧本不能删除
- ✅ 软删除（设置deleted_at和status=-1）
- ✅ 更新说书人统计

---

## 🔐 权限设计

### 公开方法（无需登录）
- ✅ `getList` - 获取剧本列表
- ✅ `getDetail` - 获取剧本详情（未发布的需要创建者身份）

### 需登录方法
- ✅ `upload` - 上传剧本
- ✅ `getMyUploads` - 我的剧本
- ✅ `delete` - 删除剧本（需创建者身份）

---

## 🛠️ 工具函数

已实现的工具函数：
- ✅ `returnSuccess` - 统一成功返回
- ✅ `parseUserId` - 解析用户ID
- ✅ `checkAuth` - 检查登录状态
- ✅ `validateScriptData` - 验证剧本数据
- ✅ `generateScriptId` - 生成剧本ID
- ✅ `checkScriptOwner` - 检查创建者权限

---

## 🧪 测试清单

### 功能测试
- [ ] **getList** - 剧本列表
  - [ ] 默认列表（最新）
  - [ ] 关键词搜索
  - [ ] 难度筛选
  - [ ] 标签筛选
  - [ ] 热门排序
  - [ ] 评分排序
  - [ ] 下载排序
  - [ ] 分页功能

- [ ] **getDetail** - 剧本详情
  - [ ] 查看已发布剧本
  - [ ] 查看自己的未发布剧本
  - [ ] 查看他人的未发布剧本（应失败）
  - [ ] 浏览量增加

- [ ] **upload** - 上传剧本
  - [ ] 上传成功（生成预览图）
  - [ ] 参数验证（缺少必填项）
  - [ ] JSON格式验证
  - [ ] 图片URL验证
  - [ ] 未登录（应失败）

- [ ] **getMyUploads** - 我的剧本
  - [ ] 获取列表
  - [ ] 分页功能
  - [ ] 未登录（应失败）

- [ ] **delete** - 删除剧本
  - [ ] 删除待审核剧本（成功）
  - [ ] 删除已发布剧本（应失败）
  - [ ] 删除他人剧本（应失败）
  - [ ] 未登录（应失败）

---

## 📈 代码统计

- **代码行数：** 约 700 行
- **方法数量：** 5 个
- **工具函数：** 6 个
- **依赖文件：** 1 个（preview-generator.js）

---

## 🚀 下一步

### 阶段2：评价功能（2个方法）
1. `createReview` - 创建剧本评价
2. `rate` - 给剧本评分

### 阶段3：查询功能（5个方法）
3. `getJson` - 获取剧本JSON
4. `getRankingHot` - 热门排行
5. `getRankingNew` - 最新排行
6. `getRankingRating` - 高分排行
7. `getRankingDownload` - 下载排行

### 阶段4：系统功能（2个方法）
8. `calculateHeat` - 计算热度
9. `generateJsonUrl` - 生成下载链接

---

## 📝 使用说明

### 上传云对象
```
右键 script 文件夹 → 上传部署
```

### 前端调用示例
```javascript
// 导入云对象
const scriptObj = uniCloud.importObject('script', {
  customUI: true,
  debugFunction: false
})

// 获取剧本列表
const result = await scriptObj.getList({
  page: 1,
  pageSize: 20,
  type: 'hot'
})

// 获取剧本详情
const detail = await scriptObj.getDetail(scriptId)

// 上传剧本
const uploadResult = await scriptObj.upload({
  title: "我的剧本",
  author: "作者名",
  json: scriptJson,
  user_images: [imageUrl1, imageUrl2]
})

// 获取我的剧本
const myScripts = await scriptObj.getMyUploads(1, 10)

// 删除剧本
await scriptObj.delete(scriptId)
```

---

## ⚠️ 注意事项

1. **预览图生成**
   - 依赖 `preview-generator.js`
   - SVG 转 base64 存储
   - 列表不返回完整JSON

2. **图片处理**
   - 最多3张图片
   - 必须是HTTPS地址
   - 不接受Blob URL

3. **权限控制**
   - 待审核剧本只有创建者可见
   - 已发布剧本不能删除
   - 软删除机制

4. **性能优化**
   - 列表使用聚合查询
   - 浏览量异步更新
   - 不返回完整JSON

---

**阶段1 开发完成！** ✅

**现在请上传 script 云对象，然后告诉我测试结果！** 🚀

