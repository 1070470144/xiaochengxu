# 📋 Script 云对象开发计划

## 🎯 目标

将 14 个剧本相关云函数迁移为 1 个 Script 云对象

---

## 📊 需要迁移的云函数

| # | 云函数名 | 新方法名 | 功能说明 | 优先级 |
|---|---------|---------|---------|--------|
| 1 | script-list | getList | 获取剧本列表（支持筛选、搜索、分页） | ⭐⭐⭐⭐⭐ |
| 2 | script-detail | getDetail | 获取剧本详情 | ⭐⭐⭐⭐⭐ |
| 3 | script-upload | upload | 上传剧本（含预览图生成） | ⭐⭐⭐⭐⭐ |
| 4 | script-my-uploads | getMyUploads | 获取我上传的剧本 | ⭐⭐⭐⭐ |
| 5 | script-delete | delete | 删除剧本 | ⭐⭐⭐⭐ |
| 6 | script-review-create | createReview | 创建剧本评价 | ⭐⭐⭐⭐ |
| 7 | script-json-get | getJson | 获取剧本JSON数据 | ⭐⭐⭐⭐ |
| 8 | script-ranking-hot | getRankingHot | 热门剧本排行 | ⭐⭐⭐ |
| 9 | script-ranking-new | getRankingNew | 最新剧本排行 | ⭐⭐⭐ |
| 10 | script-ranking-rating | getRankingRating | 高分剧本排行 | ⭐⭐⭐ |
| 11 | script-ranking-download | getRankingDownload | 下载排行 | ⭐⭐⭐ |
| 12 | script-rating | rate | 给剧本评分 | ⭐⭐⭐ |
| 13 | script-calculate-heat | calculateHeat | 计算剧本热度（系统） | ⭐⭐ |
| 14 | script-generate-json-url | generateJsonUrl | 生成JSON下载链接 | ⭐⭐ |

---

## 🔧 技术特点

### 1. 复杂功能
- **文件处理**：需要处理剧本JSON文件上传
- **预览图生成**：自动生成SVG预览图
- **图片处理**：支持用户上传的图片（最多3张）
- **聚合查询**：关联查询创建者信息

### 2. 权限控制
- 公开方法：列表、详情、排行、JSON获取
- 需登录：上传、删除、评价、评分
- 权限验证：删除时需验证是否为创建者

### 3. 统计更新
- 浏览量自动+1
- 下载量统计
- 收藏数统计
- 评分统计
- 热度计算

---

## 📁 文件结构

```
script/
├── index.obj.js         # 主云对象文件
├── package.json         # 依赖配置
└── preview-generator.js # 预览图生成工具（复用）
```

---

## 🎨 方法设计

### 核心方法（5个）

#### 1. getList(options)
```javascript
/**
 * 获取剧本列表
 * @param {Object} options - 查询选项
 * @param {Number} options.page - 页码
 * @param {Number} options.pageSize - 每页数量
 * @param {String} options.keyword - 搜索关键词
 * @param {String} options.type - 排序类型（all/hot/rating/download/new）
 * @param {Number} options.difficulty - 难度筛选
 * @param {String} options.playerCount - 人数筛选
 * @param {Array} options.tags - 标签筛选
 * @returns {Object} 剧本列表
 */
```

#### 2. getDetail(scriptId)
```javascript
/**
 * 获取剧本详情
 * @param {String} scriptId - 剧本ID
 * @returns {Object} 剧本详情（含创建者信息）
 */
```

#### 3. upload(data)
```javascript
/**
 * 上传剧本
 * @param {Object} data - 剧本数据
 * @param {String} data.title - 标题
 * @param {String} data.author - 作者
 * @param {String} data.description - 描述
 * @param {Object} data.json - 剧本JSON
 * @param {Array} data.user_images - 用户上传的图片（最多3张）
 * @returns {Object} 上传结果（含预览图）
 */
```

#### 4. getMyUploads(page, pageSize)
```javascript
/**
 * 获取我上传的剧本
 * @param {Number} page - 页码
 * @param {Number} pageSize - 每页数量
 * @returns {Object} 我的剧本列表
 */
```

#### 5. delete(scriptId)
```javascript
/**
 * 删除剧本
 * @param {String} scriptId - 剧本ID
 * @returns {Object} 删除结果
 */
```

---

### 评价方法（2个）

#### 6. createReview(scriptId, content, rating)
```javascript
/**
 * 创建剧本评价
 * @param {String} scriptId - 剧本ID
 * @param {String} content - 评价内容
 * @param {Number} rating - 评分（1-5）
 * @returns {Object} 评价结果
 */
```

#### 7. rate(scriptId, rating)
```javascript
/**
 * 给剧本评分
 * @param {String} scriptId - 剧本ID
 * @param {Number} rating - 评分（1-5）
 * @returns {Object} 评分结果
 */
```

---

### 查询方法（5个）

#### 8. getJson(scriptId)
```javascript
/**
 * 获取剧本JSON数据
 * @param {String} scriptId - 剧本ID
 * @returns {Object} JSON数据（增加下载量）
 */
```

#### 9. getRankingHot(limit)
```javascript
/**
 * 获取热门剧本排行
 * @param {Number} limit - 数量限制
 * @returns {Array} 热门剧本列表
 */
```

#### 10. getRankingNew(limit)
```javascript
/**
 * 获取最新剧本排行
 * @param {Number} limit - 数量限制
 * @returns {Array} 最新剧本列表
 */
```

#### 11. getRankingRating(limit)
```javascript
/**
 * 获取高分剧本排行
 * @param {Number} limit - 数量限制
 * @returns {Array} 高分剧本列表
 */
```

#### 12. getRankingDownload(limit)
```javascript
/**
 * 获取下载排行
 * @param {Number} limit - 数量限制
 * @returns {Array} 下载排行列表
 */
```

---

### 系统方法（2个）

#### 13. calculateHeat(scriptId)
```javascript
/**
 * 计算剧本热度（系统调用）
 * @param {String} scriptId - 剧本ID（可选，为空则计算所有）
 * @returns {Object} 计算结果
 */
```

#### 14. generateJsonUrl(scriptId)
```javascript
/**
 * 生成JSON下载链接
 * @param {String} scriptId - 剧本ID
 * @returns {Object} 下载链接
 */
```

---

## 🔐 权限设计

### 公开方法（无需登录）
- getList
- getDetail
- getJson
- getRankingHot
- getRankingNew
- getRankingRating
- getRankingDownload

### 需登录方法
- upload
- getMyUploads
- delete（需验证为创建者）
- createReview
- rate

### 系统方法（管理员或系统调用）
- calculateHeat
- generateJsonUrl

---

## 🛠️ 工具函数

### 外置工具函数
```javascript
// 验证参数
function validateScriptData(data) { }

// 验证是否为创建者
function checkScriptOwner(scriptId, userId) { }

// 统一成功返回
function returnSuccess(data, message) { }

// 解析用户ID
function parseUserId(token) { }

// 检查登录
function checkAuth(userId) { }
```

### 预览图生成
- 复用 `preview-generator.js`
- 生成SVG预览图
- 提取剧本信息

---

## 📊 数据库设计

### botc-scripts 表
```javascript
{
  _id: String,
  title: String,          // 标题
  author: String,         // 作者
  description: String,    // 描述
  json_data: Object,      // 剧本JSON
  preview_image: String,  // 预览图（SVG base64）
  user_images: Array,     // 用户上传的图片URL
  player_count: String,   // 人数
  total_characters: Number, // 角色总数
  difficulty: Number,     // 难度（1-5）
  script_type: String,    // 类型
  tags: Array,            // 标签
  creator_id: String,     // 创建者ID
  status: Number,         // 状态（0-待审核，1-已发布，2-已拒绝）
  view_count: Number,     // 浏览量
  download_count: Number, // 下载量
  favorite_count: Number, // 收藏数
  comment_count: Number,  // 评论数
  rating: Number,         // 平均评分
  rating_count: Number,   // 评分人数
  heat: Number,           // 热度值
  created_at: Number,     // 创建时间
  updated_at: Number,     // 更新时间
  published_at: Number    // 发布时间
}
```

---

## 🎯 开发步骤

### 阶段 1：核心功能（必须）
1. ✅ 创建云对象文件结构
2. ✅ 实现 `getList` - 剧本列表
3. ✅ 实现 `getDetail` - 剧本详情
4. ✅ 实现 `upload` - 上传剧本
5. ✅ 实现 `getMyUploads` - 我的剧本
6. ✅ 实现 `delete` - 删除剧本

### 阶段 2：评价功能（重要）
7. ✅ 实现 `createReview` - 创建评价
8. ✅ 实现 `rate` - 评分

### 阶段 3：查询功能（重要）
9. ✅ 实现 `getJson` - 获取JSON
10. ✅ 实现 4 个排行方法

### 阶段 4：系统功能（可选）
11. ✅ 实现 `calculateHeat` - 计算热度
12. ✅ 实现 `generateJsonUrl` - 生成链接

---

## 📝 注意事项

### 1. 预览图生成
- 复用现有的 `preview-generator.js`
- SVG 转 base64 存储
- 不要在返回列表时返回完整 JSON

### 2. 图片处理
- 支持用户上传最多 3 张图片
- 验证图片 URL 格式
- 拒绝 Blob URL
- 必须是 HTTPS 地址

### 3. 权限控制
- 待审核剧本只有创建者可见
- 删除时验证创建者身份
- 评分和评价需要登录

### 4. 性能优化
- 列表不返回完整 JSON 数据
- 使用聚合查询关联创建者
- 异步更新浏览量

---

## 🧪 测试计划

### 功能测试
- [ ] 剧本列表（筛选、搜索、分页）
- [ ] 剧本详情（浏览量增加）
- [ ] 上传剧本（预览图生成）
- [ ] 我的剧本
- [ ] 删除剧本
- [ ] 创建评价
- [ ] 给剧本评分
- [ ] 获取JSON（下载量增加）
- [ ] 4个排行榜
- [ ] 计算热度
- [ ] 生成下载链接

### 权限测试
- [ ] 未登录访问公开接口
- [ ] 登录访问需登录接口
- [ ] 非创建者尝试删除
- [ ] 查看未发布剧本

---

## 📈 预计工作量

- **代码行数：** 约 2000-2500 行
- **开发时间：** 2-3 小时
- **测试时间：** 1 小时
- **文档时间：** 30 分钟

---

**准备好了！现在开始开发 Script 云对象！** 🚀

