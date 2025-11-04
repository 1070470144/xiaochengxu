# 📝 Post 云对象开发计划

## 📋 现有云函数分析

找到了 5 个 Post 相关的云函数：

| # | 云函数名 | 功能 | 复杂度 |
|---|---------|------|--------|
| 1 | `post-list` | 获取帖子列表 | ⭐⭐⭐ |
| 2 | `post-create` | 发布帖子 | ⭐⭐ |
| 3 | `post-detail` | 获取帖子详情 | ⭐⭐⭐ |
| 4 | `post-like` | 点赞/取消点赞 | ⭐⭐ |
| 5 | `post-report` | 举报帖子 | ⭐⭐ |

---

## 🎯 Post 云对象设计

### 数据库表结构

#### 1. botc-posts（帖子表）
```javascript
{
  _id: String,
  user_id: String,        // 发布用户ID
  script_id: String,      // 关联剧本ID
  content: String,        // 帖子内容
  images: Array,          // 图片数组
  type: Number,           // 帖子类型
  tags: Array,            // 标签
  location: String,       // 地理位置
  related_id: String,     // 关联ID（可选）
  view_count: Number,     // 浏览数
  like_count: Number,     // 点赞数
  comment_count: Number,  // 评论数
  share_count: Number,    // 分享数
  is_top: Boolean,        // 是否置顶
  is_hot: Boolean,        // 是否热门
  status: Number,         // 状态：1正常 0隐藏 -1封禁
  created_at: Date
}
```

#### 2. botc-post-likes（点赞表）
```javascript
{
  _id: String,
  post_id: String,
  user_id: String,
  type: Number,           // 1=帖子点赞
  created_at: Date
}
```

#### 3. botc-post-comments（评论表）
```javascript
{
  _id: String,
  post_id: String,
  user_id: String,
  reply_to_user_id: String,  // 回复的用户ID
  content: String,
  like_count: Number,
  status: Number,
  created_at: Date
}
```

#### 4. botc-reports（举报表）
```javascript
{
  _id: String,
  reporter_id: String,
  reporter_nickname: String,
  content_type: String,
  content_id: String,
  content_title: String,
  reported_user_id: String,
  reported_user_nickname: String,
  reason: String,
  description: String,
  images: Array,
  status: String,         // pending/approved/rejected
  created_at: Number
}
```

---

## 🔧 云对象方法设计

### 方法列表

| # | 方法名 | 功能 | 参数 | 返回 |
|---|--------|------|------|------|
| 1 | `getList` | 获取帖子列表 | page, pageSize, type, userId, sortBy | { list, total, hasMore } |
| 2 | `create` | 发布帖子 | scriptId, content, images, type, tags, location, relatedId | { post_id, created_at } |
| 3 | `getDetail` | 获取帖子详情 | postId | { post, comments, isLiked } |
| 4 | `toggleLike` | 点赞/取消点赞 | postId | { isLiked, likeCount } |
| 5 | `report` | 举报帖子 | contentId, contentType, reason, description, images | { report_count } |
| 6 | `delete` | 删除帖子 | postId | { success } |

---

## 📝 详细方法设计

### 1. getList(options)

**功能：** 获取帖子列表（支持多种排序和筛选）

**参数：**
```javascript
{
  page: Number,          // 页码，默认1
  pageSize: Number,      // 每页数量，默认10
  type: Number,          // 帖子类型筛选（可选）
  userId: String,        // 用户ID筛选（可选）
  sortBy: String         // 排序：time|hot|following，默认time
}
```

**逻辑：**
1. 验证参数
2. 构建查询条件
   - 基本条件：`status: 1`
   - 类型筛选
   - 用户筛选
   - 关注筛选（需要获取关注列表）
3. 设置排序规则
   - `time`: `is_top: -1, created_at: -1`
   - `hot`: `is_top: -1, is_hot: -1, like_count: -1, comment_count: -1, created_at: -1`
4. 使用聚合查询关联用户信息
5. 返回分页数据

**返回：**
```javascript
{
  code: 0,
  message: 'success',
  data: {
    list: [...],
    total: Number,
    page: Number,
    pageSize: Number,
    hasMore: Boolean
  }
}
```

---

### 2. create(postData)

**功能：** 发布帖子

**参数：**
```javascript
{
  scriptId: String,      // 剧本ID（必填）
  content: String,       // 内容（必填）
  images: Array,         // 图片数组（可选）
  type: Number,          // 类型，默认1
  tags: Array,           // 标签（可选）
  location: String,      // 位置（可选）
  relatedId: String      // 关联ID（可选）
}
```

**逻辑：**
1. 验证参数
   - scriptId 必填
   - content 必填，长度 1-5000
   - images 最多9张
2. 调用 content-filter 进行内容过滤
3. 验证剧本是否存在
4. 创建帖子记录
   - 自动设置：user_id, view_count, like_count等
   - tags 最多5个
5. 返回帖子ID和创建时间

**返回：**
```javascript
{
  code: 0,
  message: '发布成功',
  data: {
    post_id: String,
    created_at: Date
  }
}
```

---

### 3. getDetail(postId)

**功能：** 获取帖子详情

**参数：**
```javascript
postId: String
```

**逻辑：**
1. 验证参数
2. 使用聚合查询获取帖子信息
   - 关联用户信息
3. 检查帖子状态
4. 增加浏览数 `view_count += 1`
5. 获取评论列表
   - 使用聚合查询
   - 关联用户信息和回复用户信息
   - 按时间排序
6. 检查当前用户是否已点赞（如果已登录）
7. 返回完整数据

**返回：**
```javascript
{
  code: 0,
  message: 'success',
  data: {
    _id, user_id, content, images, type, tags,
    location, view_count, like_count, comment_count,
    share_count, is_top, is_hot, created_at,
    user: {...},
    comments: [...],
    isLiked: Boolean
  }
}
```

---

### 4. toggleLike(postId)

**功能：** 点赞/取消点赞

**参数：**
```javascript
postId: String
```

**逻辑：**
1. 验证参数和用户认证
2. 检查帖子是否存在
3. 查询当前用户的点赞记录
4. 如果已点赞：
   - 删除点赞记录
   - `like_count -= 1`
   - 返回 `isLiked: false`
5. 如果未点赞：
   - 创建点赞记录
   - `like_count += 1`
   - 返回 `isLiked: true`

**返回：**
```javascript
{
  code: 0,
  message: '点赞成功' | '已取消点赞',
  data: {
    isLiked: Boolean,
    likeCount: Number
  }
}
```

---

### 5. report(reportData)

**功能：** 举报帖子

**参数：**
```javascript
{
  contentId: String,     // 内容ID
  contentType: String,   // 内容类型（post/comment等）
  reason: String,        // 举报原因
  description: String,   // 详细描述（可选）
  images: Array          // 截图（可选）
}
```

**逻辑：**
1. 验证参数和用户认证
2. 获取举报人信息
3. 检查是否已举报过（同一用户对同一内容只能举报一次）
4. 创建举报记录
5. 统计举报次数
6. 自动处理规则：
   - 3次举报：自动隐藏（status = 0）
   - 5次举报：永久封禁（status = -1）
7. 返回举报结果

**返回：**
```javascript
{
  code: 0,
  message: '举报成功，我们会尽快处理',
  data: {
    report_count: Number
  }
}
```

---

### 6. delete(postId) - 新增

**功能：** 删除帖子

**参数：**
```javascript
postId: String
```

**逻辑：**
1. 验证参数和用户认证
2. 查询帖子信息
3. 检查权限（只能删除自己的帖子）
4. 软删除：设置 `status: 0`
5. 返回成功

**返回：**
```javascript
{
  code: 0,
  message: '删除成功',
  data: {
    success: true
  }
}
```

---

## 🔐 权限控制

### _before() 钩子

```javascript
async _before() {
  // 初始化数据库
  this.db = uniCloud.database()
  this.dbCmd = this.db.command
  
  // 获取客户端信息
  this.clientInfo = this.getClientInfo()
  
  // 获取token（如果有）
  this.token = this.clientInfo.uniIdToken || ''
  this.currentUserId = ''
  
  // 解析用户ID
  if (this.token) {
    this.currentUserId = parseUserId(this.token)
  }
  
  // 需要登录的方法
  const requireAuthMethods = ['create', 'toggleLike', 'report', 'delete']
  
  if (requireAuthMethods.includes(this.getMethodName()) && !this.currentUserId) {
    throw new Error('请先登录')
  }
}
```

---

## 🛠 工具函数

### 外部工具函数（非 module.exports 内部）

```javascript
// 解析用户ID
function parseUserId(token) {
  if (!token) return ''
  return token.split('_')[0] || ''
}

// 返回成功
function returnSuccess(message = 'success', data = null) {
  return {
    code: 0,
    message,
    data
  }
}

// 返回错误
function returnError(code, message) {
  return {
    code,
    message
  }
}

// 验证帖子内容
function validatePostContent(content) {
  if (!content || typeof content !== 'string') {
    return '帖子内容不能为空'
  }
  
  const trimmedContent = content.trim()
  
  if (trimmedContent.length === 0) {
    return '帖子内容不能为空'
  }
  
  if (trimmedContent.length > 5000) {
    return '帖子内容不能超过5000字'
  }
  
  return null
}

// 验证图片数组
function validateImages(images) {
  if (!Array.isArray(images)) {
    return '图片格式错误'
  }
  
  if (images.length > 9) {
    return '最多上传9张图片'
  }
  
  return null
}
```

---

## 📊 与现有云函数的对比

| 功能 | 现有云函数 | 新云对象方法 | 改进 |
|-----|----------|------------|------|
| 获取列表 | `post-list` | `postObj.getList()` | 参数简化 |
| 发布帖子 | `post-create` | `postObj.create()` | 内容过滤集成 |
| 获取详情 | `post-detail` | `postObj.getDetail()` | 数据结构优化 |
| 点赞 | `post-like` | `postObj.toggleLike()` | 命名更清晰 |
| 举报 | `post-report` | `postObj.report()` | 参数统一 |

---

## 🎯 开发步骤

1. ✅ 分析现有云函数（已完成）
2. ⏸ 创建 Post 云对象文件
3. ⏸ 实现 `_before()` 钩子
4. ⏸ 实现工具函数
5. ⏸ 实现 6 个方法
6. ⏸ 创建 package.json
7. ⏸ 测试所有方法
8. ⏸ 前端页面适配
9. ⏸ 删除旧云函数

---

## ⚠️ 注意事项

1. **内容过滤**
   - 调用 `content-filter` 云函数
   - 需要保持原有调用方式（云函数调用云函数）

2. **聚合查询**
   - 使用 `lookup` 关联用户信息
   - 注意性能优化

3. **自动处理规则**
   - 举报次数达标自动隐藏/封禁
   - 需要记录日志

4. **软删除**
   - 使用 `status` 字段标记
   - 不真正删除数据

---

## 📚 相关文档

- `POST_CLOUD_OBJECT_PLAN.md` - 本文档
- `POST_CLOUD_OBJECT_COMPLETE.md` - 待创建
- `POST_TEST_GUIDE.md` - 待创建

---

_创建时间：2025-11-04_  
_状态：规划完成，待开发_  
_预计时间：2 小时_

