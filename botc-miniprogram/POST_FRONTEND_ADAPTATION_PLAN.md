# 📝 Post 前端页面适配计划

## 📋 需要适配的页面

找到了 **5 个页面**使用 Post 云函数：

| # | 页面 | 文件路径 | 使用的云函数 | 优先级 |
|---|------|---------|-------------|--------|
| 1 | 首页 | `pages/index/index.vue` | post-list (3次) | ⭐⭐⭐ |
| 2 | 社区帖子列表 | `pages/community/list/list.vue` | post-list | ⭐⭐⭐ |
| 3 | 社区帖子详情 | `pages/community/detail/detail.vue` | post-detail, post-like, post-report | ⭐⭐⭐ |
| 4 | 发布帖子 | `pages/community/create/create.vue` | post-create | ⭐⭐⭐ |
| 5 | 我的帖子 | `pages/user/my-posts/my-posts.vue` | post-list | ⭐⭐ |

---

## 🔄 云函数映射关系

| 旧云函数 | 新云对象方法 | 参数变化 |
|---------|------------|---------|
| `post-list` | `postObj.getList(options)` | 简化，不需要传 token |
| `post-create` | `postObj.create(postData)` | 简化，不需要传 token |
| `post-detail` | `postObj.getDetail(postId)` | 简化，不需要传 token |
| `post-like` | `postObj.toggleLike(postId)` | 简化，不需要传 token |
| `post-report` | `postObj.report(reportData)` | 参数统一 |

---

## 📝 详细适配方案

### 1. 首页 (`pages/index/index.vue`) ⭐⭐⭐

**当前使用的云函数：**
- `post-list` - 获取最新帖子（3次调用）
- `post-list` - 获取火热帖子

**适配步骤：**

#### 1.1 在 onLoad 中添加云对象导入
```javascript
onLoad() {
  // 初始化 post 云对象
  this.postObj = uniCloud.importObject('post', {
    customUI: true
  })
  
  // 原有代码...
  this.loadIndexData()
}
```

#### 1.2 替换获取最新帖子（第一次调用，约295-315行）
```javascript
// 旧方式
const latestRes = await uniCloud.callFunction({
  name: 'post-list',
  data: {
    page: 1,
    pageSize: 5,
    sortBy: 'time',
    token: Auth.getToken()
  }
})

if (latestRes.result.code === 0) {
  this.latestPosts = latestRes.result.data.list
}

// 新方式
const latestRes = await this.postObj.getList({
  page: 1,
  pageSize: 5,
  sortBy: 'time'
})

if (latestRes.code === 0) {
  this.latestPosts = latestRes.data.list
}
```

#### 1.3 替换获取火热帖子（第二次调用，约319-339行）
```javascript
// 旧方式
const hotRes = await uniCloud.callFunction({
  name: 'post-list',
  data: {
    page: 1,
    pageSize: 5,
    sortBy: 'hot',
    token: Auth.getToken()
  }
})

if (hotRes.result.code === 0) {
  this.hotPosts = hotRes.result.data.list
}

// 新方式
const hotRes = await this.postObj.getList({
  page: 1,
  pageSize: 5,
  sortBy: 'hot'
})

if (hotRes.code === 0) {
  this.hotPosts = hotRes.data.list
}
```

#### 1.4 替换刷新帖子（第三次调用，约373-383行）
```javascript
// 旧方式
Promise.all([
  uniCloud.callFunction({
    name: 'post-list',
    data: { page: this.postPage, pageSize: 4, sortBy: 'time' }
  }),
  uniCloud.callFunction({
    name: 'post-list',
    data: { page: this.postPage, pageSize: 4, sortBy: 'hot' }
  })
]).then(([latestRes, hotRes]) => {
  // 处理结果
})

// 新方式
Promise.all([
  this.postObj.getList({
    page: this.postPage,
    pageSize: 4,
    sortBy: 'time'
  }),
  this.postObj.getList({
    page: this.postPage,
    pageSize: 4,
    sortBy: 'hot'
  })
]).then(([latestRes, hotRes]) => {
  if (latestRes.code === 0) {
    this.latestPosts = [...this.latestPosts, ...latestRes.data.list]
  }
  if (hotRes.code === 0) {
    this.hotPosts = [...this.hotPosts, ...hotRes.data.list]
  }
})
```

---

### 2. 社区帖子列表 (`pages/community/list/list.vue`) ⭐⭐⭐

**当前使用的云函数：**
- `post-list` - 获取帖子列表

**适配步骤：**

#### 2.1 在 onLoad 中添加云对象导入
```javascript
onLoad() {
  // 初始化 post 云对象
  this.postObj = uniCloud.importObject('post', {
    customUI: true
  })
  
  this.loadPosts()
}
```

#### 2.2 替换获取帖子列表（约134-163行）
```javascript
// 旧方式
const result = await uniCloud.callFunction({
  name: 'post-list',
  data: {
    page: this.page,
    pageSize: this.pageSize,
    sortBy: this.currentTab,
    token: Auth.getToken()
  }
})

if (result.result.code === 0) {
  const newList = result.result.data.list || []
  if (isLoadMore) {
    this.postList = [...this.postList, ...newList]
  } else {
    this.postList = newList
  }
  this.hasMore = result.result.data.hasMore
}

// 新方式
const result = await this.postObj.getList({
  page: this.page,
  pageSize: this.pageSize,
  sortBy: this.currentTab
})

if (result.code === 0) {
  const newList = result.data.list || []
  if (isLoadMore) {
    this.postList = [...this.postList, ...newList]
  } else {
    this.postList = newList
  }
  this.hasMore = result.data.hasMore
}
```

---

### 3. 社区帖子详情 (`pages/community/detail/detail.vue`) ⭐⭐⭐

**当前使用的云函数：**
- `post-detail` - 获取帖子详情
- `post-like` - 点赞/取消点赞
- `post-report` - 举报帖子

**适配步骤：**

#### 3.1 在 onLoad 中添加云对象导入
```javascript
onLoad(options) {
  // 初始化 post 云对象
  this.postObj = uniCloud.importObject('post', {
    customUI: true
  })
  
  if (options.postId) {
    this.postId = options.postId
    this.loadPostDetail()
  }
}
```

#### 3.2 替换获取帖子详情（约241-275行）
```javascript
// 旧方式
const token = Auth.isLogin() ? Auth.getToken() : null

const result = await uniCloud.callFunction({
  name: 'post-detail',
  data: {
    postId: this.postId,
    token: token
  }
})

if (result.result.code === 0) {
  this.post = result.result.data
  this.isLiked = result.result.data.isLiked || false
}

// 新方式
const result = await this.postObj.getDetail(this.postId)

if (result.code === 0) {
  this.post = result.data
  this.isLiked = result.data.isLiked || false
}
```

#### 3.3 替换点赞/取消点赞（约352-387行）
```javascript
// 旧方式
const token = Auth.getToken()

const result = await uniCloud.callFunction({
  name: 'post-like',
  data: {
    postId: this.postId,
    token: token
  }
})

if (result.result.code === 0) {
  this.isLiked = result.result.data.isLiked
  this.post.like_count = result.result.data.likeCount
}

// 新方式
const result = await this.postObj.toggleLike(this.postId)

if (result.code === 0) {
  this.isLiked = result.data.isLiked
  this.post.like_count = result.data.likeCount
}
```

#### 3.4 替换举报帖子（约514-545行）
```javascript
// 旧方式
const res = await uniCloud.callFunction({
  name: 'post-report',
  data: {
    target_id: this.postId,
    target_type: 'post',
    report_type: this.selectedReason,
    report_reason: this.reportReason
  }
})

// 新方式
const res = await this.postObj.report({
  contentId: this.postId,
  contentType: 'post',
  reason: this.selectedReason,
  description: this.reportReason
})
```

---

### 4. 发布帖子 (`pages/community/create/create.vue`) ⭐⭐⭐

**当前使用的云函数：**
- `post-create` - 发布帖子

**适配步骤：**

#### 4.1 在 onLoad 中添加云对象导入
```javascript
onLoad() {
  // 初始化 post 云对象
  this.postObj = uniCloud.importObject('post', {
    customUI: true
  })
}
```

#### 4.2 替换发布帖子（约298-340行）
```javascript
// 旧方式
const token = Auth.getToken()

const result = await uniCloud.callFunction({
  name: 'post-create',
  data: {
    token: token,
    script_id: this.selectedScript._id,
    content: this.content,
    images: this.images,
    type: 1,
    tags: this.tags,
    location: this.location
  }
})

if (result.result.code === 0) {
  uni.showToast({
    title: '发布成功',
    icon: 'success'
  })
  setTimeout(() => {
    uni.navigateBack()
  }, 1500)
}

// 新方式
const result = await this.postObj.create({
  scriptId: this.selectedScript._id,
  content: this.content,
  images: this.images,
  type: 1,
  tags: this.tags,
  location: this.location
})

if (result.code === 0) {
  uni.showToast({
    title: '发布成功',
    icon: 'success'
  })
  setTimeout(() => {
    uni.navigateBack()
  }, 1500)
}
```

---

### 5. 我的帖子 (`pages/user/my-posts/my-posts.vue`) ⭐⭐

**当前使用的云函数：**
- `post-list` - 获取我的帖子列表

**适配步骤：**

#### 5.1 在 onLoad 中添加云对象导入
```javascript
onLoad() {
  // 初始化 post 云对象
  this.postObj = uniCloud.importObject('post', {
    customUI: true
  })
  
  this.loadMyPosts()
}
```

#### 5.2 替换获取我的帖子（约103-136行）
```javascript
// 旧方式
const userInfo = Auth.getUserInfo()

const result = await uniCloud.callFunction({
  name: 'post-list',
  data: {
    page: this.page,
    pageSize: this.pageSize,
    userId: userInfo._id,
    token: Auth.getToken()
  }
})

if (result.result.code === 0) {
  const newList = result.result.data.list || []
  if (isLoadMore) {
    this.postList = [...this.postList, ...newList]
  } else {
    this.postList = newList
  }
  this.hasMore = result.result.data.hasMore
}

// 新方式
const userInfo = Auth.getUserInfo()

const result = await this.postObj.getList({
  page: this.page,
  pageSize: this.pageSize,
  userId: userInfo._id
})

if (result.code === 0) {
  const newList = result.data.list || []
  if (isLoadMore) {
    this.postList = [...this.postList, ...newList]
  } else {
    this.postList = newList
  }
  this.hasMore = result.data.hasMore
}
```

---

## 🎯 适配顺序建议

建议按照以下顺序进行适配：

1. **✅ 社区帖子列表** - 最简单，单一云函数
2. **✅ 我的帖子** - 类似社区列表
3. **✅ 发布帖子** - 单一功能
4. **✅ 社区帖子详情** - 包含3个云函数
5. **✅ 首页** - 多次调用，最后适配

---

## 📊 预计工作量

| 页面 | 云函数调用次数 | 预计时间 | 难度 |
|-----|--------------|---------|------|
| 首页 | 3 | 20分钟 | ⭐⭐ |
| 社区列表 | 1 | 10分钟 | ⭐ |
| 社区详情 | 3 | 25分钟 | ⭐⭐ |
| 发布帖子 | 1 | 10分钟 | ⭐ |
| 我的帖子 | 1 | 10分钟 | ⭐ |
| **总计** | **9** | **75分钟** | |

---

## ⚠️ 注意事项

### 1. 返回数据结构变化

**旧云函数：**
```javascript
result.result.code
result.result.data
result.result.message
```

**新云对象：**
```javascript
result.code
result.data
result.message
```

### 2. 参数变化

**不再需要传递 token：**
- ❌ 旧方式：`data: { ..., token: Auth.getToken() }`
- ✅ 新方式：自动从 clientInfo 获取

**参数名称统一：**
- `script_id` → `scriptId`
- `target_id` → `contentId`
- `target_type` → `contentType`
- `report_type` → `reason`
- `report_reason` → `description`

### 3. 举报功能参数调整

**旧参数：**
```javascript
{
  target_id: postId,
  target_type: 'post',
  report_type: reason,
  report_reason: description
}
```

**新参数：**
```javascript
{
  contentId: postId,
  contentType: 'post',
  reason: reason,
  description: description
}
```

---

## ✅ 适配检查清单

### 每个页面完成后检查：

- [ ] 已添加云对象导入
- [ ] 所有云函数调用已替换
- [ ] 返回数据访问已调整
- [ ] token 传递已移除
- [ ] 参数名称已更新
- [ ] 页面功能测试通过
- [ ] 错误处理正常
- [ ] 没有控制台错误

---

## 🚀 部署步骤

### 适配完成后：

1. **测试所有页面**
   - [ ] 首页帖子加载
   - [ ] 社区列表和详情
   - [ ] 发布帖子
   - [ ] 点赞和举报
   - [ ] 我的帖子列表

2. **删除旧云函数**（确认无误后）
   - [ ] `post-list`
   - [ ] `post-create`
   - [ ] `post-detail`
   - [ ] `post-like`
   - [ ] `post-report`

3. **创建适配完成文档**
   - [ ] 记录适配的页面
   - [ ] 记录测试结果
   - [ ] 更新项目文档

---

## 📚 相关文档

- **云对象文档：** `POST_CLOUD_OBJECT_COMPLETE.md`
- **测试指南：** `POST_TEST_READY.md`
- **项目进度：** `CLOUD_OBJECT_MIGRATION_STATUS.md`

---

_创建时间：2025-11-04_  
_状态：准备开始_  
_预计完成时间：1.5 小时_

