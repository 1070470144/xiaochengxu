# 📱 社区图文发布功能 - 使用指南

## ✅ 已完成的功能

### 📦 数据库表（3个）
- ✅ `botc-posts` - 帖子表
- ✅ `botc-post-comments` - 评论表
- ✅ `botc-post-likes` - 点赞表

### ☁️ 云函数（5个）
- ✅ `post-create` - 发布帖子
- ✅ `post-list` - 获取帖子列表
- ✅ `post-detail` - 获取帖子详情
- ✅ `post-like` - 点赞/取消点赞
- ✅ `comment-create` - 发表评论

### 📄 前端页面（3个）
- ✅ `pages/community/list/list.vue` - 社区广场（帖子列表）
- ✅ `pages/community/create/create.vue` - 发布帖子
- ✅ `pages/community/detail/detail.vue` - 帖子详情

### ⚙️ 配置
- ✅ `pages.json` - 路由配置
- ✅ TabBar导航 - 新增"社区"标签

---

## 🚀 快速开始

### 步骤1：上传云函数（必须）

在 HBuilderX 中右键上传以下云函数：

```
uniCloud-aliyun/cloudfunctions/
  ├── post-create       → 右键 → 上传部署
  ├── post-list         → 右键 → 上传部署
  ├── post-detail       → 右键 → 上传部署
  ├── post-like         → 右键 → 上传部署
  └── comment-create    → 右键 → 上传部署
```

### 步骤2：创建数据库表

在 uniCloud Web控制台：

1. 进入**云数据库**
2. 点击**新建数据表**
3. 选择**DB Schema**方式
4. 依次导入以下schema文件：
   - `botc-posts.schema.json`
   - `botc-post-comments.schema.json`
   - `botc-post-likes.schema.json`

### 步骤3：准备TabBar图标（可选）

如果没有社区图标，可以临时使用已有图标：

```
static/tabbar/
  community.png          ← 复制 home.png 并重命名
  community_active.png   ← 复制 home_active.png 并重命名
```

或者下载专用图标后放入 `static/tabbar/` 目录。

### 步骤4：运行测试

1. 重新编译运行项目
2. 点击底部"社区"标签
3. 测试功能

---

## 📋 功能清单

### 1. 社区广场（帖子列表）

**功能：**
- ✅ 时间排序/热度排序切换
- ✅ 下拉刷新
- ✅ 上拉加载更多
- ✅ 显示帖子内容、图片、标签
- ✅ 显示点赞、评论、浏览数
- ✅ 置顶/热门标识
- ✅ 点击进入详情
- ✅ 悬浮发布按钮

**路径：** `pages/community/list/list.vue`

### 2. 发布帖子

**功能：**
- ✅ 文字输入（最多5000字）
- ✅ 图片上传（最多9张）
- ✅ 标签选择（最多5个）
- ✅ 上传到云存储
- ✅ 字数统计
- ✅ 发布成功后刷新列表

**路径：** `pages/community/create/create.vue`

**使用：**
```javascript
// 点击底部悬浮按钮
// 或从其他页面跳转
uni.navigateTo({
  url: '/pages/community/create/create'
})
```

### 3. 帖子详情

**功能：**
- ✅ 显示完整帖子内容
- ✅ 图片预览
- ✅ 点赞/取消点赞
- ✅ 评论列表
- ✅ 发表评论
- ✅ 浏览数自动增加
- ✅ 登录拦截

**路径：** `pages/community/detail/detail.vue`

### 4. 评论功能

**功能：**
- ✅ 发表一级评论
- ✅ 显示评论列表
- ✅ 评论内容（最多500字）
- ✅ 字数统计
- ✅ 实时更新评论数

**支持：** 帖子详情页底部评论框

### 5. 点赞功能

**功能：**
- ✅ 点赞/取消点赞
- ✅ 实时更新点赞数
- ✅ 点赞状态标识
- ✅ 登录拦截

---

## 📊 数据结构

### 帖子表 (botc-posts)

```javascript
{
  _id: String,              // 帖子ID
  user_id: String,          // 发布者ID
  content: String,          // 帖子内容（1-5000字）
  images: Array,            // 图片URL数组（最多9张）
  type: Number,             // 类型：1-普通 2-拼车分享 3-剧本推荐 4-游戏心得
  tags: Array,              // 标签数组（最多5个）
  location: String,         // 地点
  view_count: Number,       // 浏览数
  like_count: Number,       // 点赞数
  comment_count: Number,    // 评论数
  is_top: Boolean,          // 是否置顶
  is_hot: Boolean,          // 是否热门
  status: Number,           // 状态：0-已删除 1-正常 2-审核中 3-已隐藏
  created_at: Timestamp     // 发布时间
}
```

### 评论表 (botc-post-comments)

```javascript
{
  _id: String,              // 评论ID
  post_id: String,          // 帖子ID
  user_id: String,          // 评论者ID
  reply_to_id: String,      // 回复的评论ID（二级评论）
  reply_to_user_id: String, // 回复的用户ID
  content: String,          // 评论内容（1-500字）
  like_count: Number,       // 点赞数
  status: Number,           // 状态：0-已删除 1-正常 2-审核中
  created_at: Timestamp     // 评论时间
}
```

### 点赞表 (botc-post-likes)

```javascript
{
  _id: String,              // 点赞记录ID
  post_id: String,          // 帖子ID
  user_id: String,          // 点赞用户ID
  type: Number,             // 类型：1-帖子点赞 2-评论点赞
  created_at: Timestamp     // 点赞时间
}
```

---

## 🔧 云函数接口

### 1. post-create（发布帖子）

**参数：**
```javascript
{
  token: String,        // 必须，用户token
  content: String,      // 必须，帖子内容
  images: Array,        // 可选，图片URL数组
  type: Number,         // 可选，帖子类型，默认1
  tags: Array,          // 可选，标签数组
  location: String,     // 可选，地点
  related_id: String    // 可选，关联ID
}
```

**返回：**
```javascript
{
  code: 0,
  message: '发布成功',
  data: {
    post_id: String,
    created_at: Timestamp
  }
}
```

### 2. post-list（帖子列表）

**参数：**
```javascript
{
  page: Number,        // 可选，页码，默认1
  pageSize: Number,    // 可选，每页数量，默认10
  type: Number,        // 可选，帖子类型筛选
  userId: String,      // 可选，用户ID筛选
  sortBy: String       // 可选，排序方式：time-时间 hot-热度，默认time
}
```

**返回：**
```javascript
{
  code: 0,
  message: 'success',
  data: {
    list: Array,        // 帖子列表
    total: Number,      // 总数
    page: Number,       // 当前页
    pageSize: Number,   // 每页数量
    hasMore: Boolean    // 是否有更多
  }
}
```

### 3. post-detail（帖子详情）

**参数：**
```javascript
{
  postId: String,      // 必须，帖子ID
  token: String        // 可选，用户token（用于判断是否点赞）
}
```

**返回：**
```javascript
{
  code: 0,
  message: 'success',
  data: {
    _id: String,
    content: String,
    images: Array,
    user: Object,
    comments: Array,
    isLiked: Boolean,
    // ... 其他字段
  }
}
```

### 4. post-like（点赞/取消点赞）

**参数：**
```javascript
{
  postId: String,      // 必须，帖子ID
  token: String        // 必须，用户token
}
```

**返回：**
```javascript
{
  code: 0,
  message: '点赞成功' | '已取消点赞',
  data: {
    isLiked: Boolean,    // 点赞状态
    likeCount: Number    // 最新点赞数
  }
}
```

### 5. comment-create（发表评论）

**参数：**
```javascript
{
  postId: String,          // 必须，帖子ID
  content: String,         // 必须，评论内容
  replyToId: String,       // 可选，回复的评论ID
  replyToUserId: String,   // 可选，回复的用户ID
  token: String            // 必须，用户token
}
```

**返回：**
```javascript
{
  code: 0,
  message: '评论成功',
  data: {
    comment_id: String,
    comment: Object
  }
}
```

---

## 🎨 UI设计

### 配色方案
- 主色：`#8B4513` (钟楼棕)
- 辅助色：`#A0522D` (深棕色)
- 点赞：`#ff6b6b` (红色)
- 热门：`#ff9500` (橙色)
- 置顶：`#ff6b6b` (红色)

### 图片布局
- 1张图：大图显示（高度400rpx）
- 2张图：2列网格
- 3张及以上：3列网格（每张200rpx）
- 最多显示9张

### 标签样式
- 背景：`#f0f0f0`
- 文字：`#8B4513`
- 圆角：`4rpx`
- 前缀：`#`

---

## 🔐 权限控制

### 发布帖子
- ✅ 需要登录
- ✅ 内容长度1-5000字
- ✅ 图片最多9张
- ✅ 标签最多5个

### 点赞
- ✅ 需要登录
- ✅ 防止重复点赞

### 评论
- ✅ 需要登录
- ✅ 内容长度1-500字
- ✅ 实时更新评论列表

---

## 📝 测试清单

### 基础功能测试
- [ ] 上传云函数成功
- [ ] 创建数据库表成功
- [ ] 底部导航显示"社区"
- [ ] 点击"社区"进入列表页

### 帖子列表测试
- [ ] 列表正常加载
- [ ] 下拉刷新成功
- [ ] 上拉加载更多
- [ ] 时间/热度排序切换
- [ ] 点击帖子进入详情

### 发布帖子测试
- [ ] 未登录跳转登录页
- [ ] 输入内容正常
- [ ] 上传图片成功（单张）
- [ ] 上传图片成功（多张）
- [ ] 选择标签正常
- [ ] 发布成功并返回列表
- [ ] 列表显示新发布的帖子

### 帖子详情测试
- [ ] 显示完整内容
- [ ] 图片预览正常
- [ ] 点赞功能正常
- [ ] 取消点赞正常
- [ ] 浏览数增加
- [ ] 评论列表显示

### 评论功能测试
- [ ] 未登录跳转登录页
- [ ] 评论输入框弹出
- [ ] 发表评论成功
- [ ] 评论列表更新
- [ ] 评论数增加

---

## 💰 成本估算

### 免费额度（uniCloud 阿里云版）
- 云存储：5GB
- 下载流量：25GB/月
- CDN流量：5GB/月

### 图片存储成本
```
单张图片：100-500KB（压缩后）
1000张图片：约100-500MB
月流量（每张浏览10次）：1-5GB

结论：免费额度完全够用 ✅
```

### 预计成本（1000用户）
- 存储：约500MB（免费额度内）
- 流量：约3-5GB/月（免费额度内）
- **总成本：¥0/月** ✅

---

## 🔄 后续优化建议

### 1. 内容审核
- 接入云端内容安全检测
- 敏感词过滤
- 图片审核

### 2. 二级评论
- 实现评论的评论
- 评论楼层展示
- @用户提醒

### 3. 热门算法
- 根据点赞、评论、浏览计算热度
- 定时任务更新is_hot字段

### 4. 搜索功能
- 帖子内容搜索
- 标签搜索
- 用户搜索

### 5. 通知功能
- 点赞通知
- 评论通知
- @提醒

### 6. 管理功能
- 帖子删除
- 帖子置顶
- 用户拉黑

---

## ❓ 常见问题

### Q1: TabBar没有显示社区？
**解决：**
1. 检查 `pages.json` 中 tabBar 配置
2. 确保图标文件存在：`static/tabbar/community.png`
3. 重新编译运行

### Q2: 图片上传失败？
**解决：**
1. 检查云存储是否开通
2. 确认图片大小（建议<2MB）
3. 查看控制台错误信息

### Q3: 帖子列表为空？
**解决：**
1. 确认云函数已上传
2. 检查数据库表是否创建
3. 尝试发布一条测试帖子

### Q4: 点赞无反应？
**解决：**
1. 确认已登录
2. 检查 `post-like` 云函数
3. 查看控制台是否有错误

### Q5: 评论发送失败？
**解决：**
1. 确认已登录
2. 检查评论内容长度（1-500字）
3. 确认 `comment-create` 云函数已上传

---

## 📞 技术支持

如有问题，请检查：
1. 云函数是否全部上传成功
2. 数据库表是否创建完成
3. 控制台是否有错误信息
4. Token是否正确传递

---

## ✨ 总结

✅ **已完成功能：**
- 图文发布（最多9张图）
- 帖子列表（时间/热度排序）
- 帖子详情
- 点赞功能
- 评论功能
- 登录拦截

✅ **技术栈：**
- uniCloud 云数据库
- uniCloud 云存储
- uniCloud 云函数
- Vue.js

✅ **成本：**
- 开发阶段：完全免费
- 1000用户规模：完全免费
- 图片存储：免费额度内

🎉 **现在可以开始使用社区功能了！**

