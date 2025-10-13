# 帖子关联剧本 & 热度计算功能说明

## 📋 功能概述

本次更新实现了以下核心功能：
1. ✅ 帖子必须关联剧本
2. ✅ 剧本详情页展示相关帖子
3. ✅ 基于帖子数据计算剧本热度
4. ✅ 剧本列表支持热度排序

---

## 🎯 一、帖子关联剧本

### 1.1 数据库修改

#### `botc-posts.schema.json`
```json
{
  "required": ["user_id", "content", "script_id"],  // ⭐ 新增 script_id 为必填
  "properties": {
    "script_id": {
      "bsonType": "string",
      "description": "关联剧本ID（必选）",
      "foreignKey": "botc-scripts._id",
      "errorMessage": {
        "required": "必须选择一个剧本"
      }
    }
  }
}
```

### 1.2 发帖页面更新

#### `pages/community/create/create.vue`

**新增UI组件：**
- ✅ 剧本选择器（带搜索功能）
- ✅ 剧本选择弹窗
- ✅ 已选剧本显示

**新增功能：**
```javascript
// 加载剧本列表
async loadScripts() {
  const result = await db.collection('botc-scripts')
    .where({ status: 1 })
    .field('_id,title,author')
    .orderBy('created_at', 'desc')
    .limit(100)
    .get()
}

// 搜索剧本
searchScripts() {
  const key = this.scriptSearchKey.toLowerCase()
  this.filteredScripts = this.scriptList.filter(script => {
    return script.title.toLowerCase().includes(key) || 
           (script.author && script.author.toLowerCase().includes(key))
  })
}

// 发布时验证
if (!this.selectedScript) {
  uni.showToast({ title: '请选择剧本' })
  return
}
```

### 1.3 云函数更新

#### `post-create/index.js`

**新增验证：**
```javascript
// 1. 验证 script_id 参数
if (!script_id) {
  return { code: 400, message: '必须选择一个剧本' }
}

// 2. 验证剧本是否存在
const scriptCheck = await scriptsCollection.doc(script_id).get()
if (!scriptCheck.data || scriptCheck.data.length === 0) {
  return { code: 400, message: '选择的剧本不存在' }
}

// 3. 创建帖子时包含 script_id
const postData = {
  user_id: userId,
  script_id: script_id,  // ⭐ 必填
  content: content.trim(),
  ...
}
```

---

## 💬 二、剧本详情页展示相关帖子

### 2.1 UI设计

#### `pages/script/detail/detail.vue`

**新增板块：**
```vue
<!-- 相关帖子 -->
<view class="posts-section">
  <view class="section-header">
    <text class="section-title">💬 相关讨论</text>
    <view class="more-btn" @click="goToCreatePost">
      <text>发帖</text>
    </view>
  </view>
  
  <view class="posts-list">
    <view class="post-item" @click="goToPostDetail(post._id)">
      <view class="post-user">
        <text class="post-username">{{ post.user.nickname }}</text>
        <text class="post-time">{{ formatTime(post.created_at) }}</text>
      </view>
      <text class="post-content">{{ post.content }}</text>
      <view class="post-stats">
        <text>👁 {{ post.view_count }}</text>
        <text>❤️ {{ post.like_count }}</text>
        <text>💬 {{ post.comment_count }}</text>
      </view>
    </view>
  </view>
</view>
```

### 2.2 数据加载

**加载相关帖子：**
```javascript
async loadRelatedPosts() {
  // 第一步：查询帖子列表
  const postsResult = await db.collection('botc-posts')
    .where({
      script_id: this.scriptId,
      status: 1
    })
    .orderBy('created_at', 'desc')
    .limit(5)
    .get()
  
  // 第二步：获取用户信息
  const userIds = [...new Set(posts.map(p => p.user_id).filter(id => id))]
  const usersResult = await db.collection('uni-id-users')
    .where({ _id: db.command.in(userIds) })
    .field('_id,nickname,avatar')
    .get()
  
  // 第三步：合并数据
  this.relatedPosts = posts.map(post => ({
    ...post,
    user: usersMap[post.user_id] || { nickname: '匿名用户' }
  }))
}
```

---

## 🔥 三、热度计算系统

### 3.1 热度计算规则

#### `script-calculate-heat/index.js`

**计算公式：**
```javascript
热度分数 = 
  (帖子数 × 10) +          // 帖子数权重最高
  (评价数 × 5) +           // 评价数次之
  (帖子点赞数 × 2) +       // 帖子点赞
  (帖子评论数 × 3) +       // 帖子评论
  (浏览数 × 0.1) +         // 浏览数权重最低
  (下载数 × 1) +           // 下载数
  新剧本加成               // 30天内新剧本额外加成
```

**新剧本加成：**
```javascript
if (daysSinceCreated < 30) {
  const newBonus = Math.max(0, 100 * (1 - daysSinceCreated / 30))
  heatScore += newBonus
}
```

### 3.2 数据库字段

#### `botc-scripts.schema.json`

**新增字段：**
```json
{
  "heat_score": {
    "bsonType": "int",
    "description": "热度分数（基于帖子、评论、点赞等计算）",
    "defaultValue": 0,
    "minimum": 0
  },
  "heat_updated_at": {
    "bsonType": "timestamp",
    "description": "热度更新时间"
  }
}
```

### 3.3 云函数使用

**计算单个剧本热度：**
```javascript
uniCloud.callFunction({
  name: 'script-calculate-heat',
  data: { script_id: 'xxx' }
})
```

**计算所有剧本热度：**
```javascript
uniCloud.callFunction({
  name: 'script-calculate-heat',
  data: {}
})
```

**返回结果：**
```javascript
{
  code: 0,
  message: '计算成功',
  data: {
    script_id: 'xxx',
    heat_score: 328  // 热度分数
  }
}
```

---

## 📊 四、热度排序

### 4.1 剧本列表排序

#### `pages/script/list/list.vue`

**修改排序逻辑：**
```javascript
// 构建排序
let orderByField = 'published_at'
let orderByDirection = 'desc'

if (this.currentType === 'hot') {
  orderByField = 'heat_score'  // ⭐ 使用热度分数排序
} else if (this.currentType === 'rating') {
  orderByField = 'rating'
} else if (this.currentType === 'new') {
  orderByField = 'published_at'
}

const res = await db.collection('botc-scripts')
  .where(whereCondition)
  .orderBy(orderByField, orderByDirection)
  .get()
```

---

## 🚀 使用流程

### 1. 发布帖子流程

```
1. 进入发帖页面 (pages/community/create)
2. 点击"选择剧本"
3. 搜索或选择剧本
4. 填写帖子内容
5. 点击发布
   → 云函数验证剧本存在性
   → 创建帖子记录（包含 script_id）
```

### 2. 查看剧本讨论

```
1. 进入剧本详情页 (pages/script/detail)
2. 自动加载相关帖子（最新5条）
3. 点击"发帖"快速发布讨论
4. 点击帖子查看详情
```

### 3. 热度更新流程

```
1. 用户发布帖子/评价/点赞
2. 定时任务调用 script-calculate-heat
   → 计算所有剧本热度
   → 更新 heat_score 和 heat_updated_at
3. 剧本列表按热度排序显示
```

---

## 📝 建议的定时任务

### 设置定时更新热度

**在 uniCloud 控制台设置定时触发器：**

1. **每小时更新热度**
   - 触发器名称：`update-script-heat`
   - 执行周期：`0 0 * * * *`（每小时）
   - 云函数：`script-calculate-heat`
   - 参数：`{}`

2. **增量更新**（可选）
   - 在每次帖子/评价/点赞操作后
   - 调用 `script-calculate-heat`
   - 参数：`{ script_id: "specific_id" }`

---

## 🎨 UI特性

### 1. 剧本选择器
- ✅ 搜索功能（支持标题、作者）
- ✅ 实时筛选
- ✅ 选中状态标记
- ✅ 底部弹窗设计

### 2. 相关帖子板块
- ✅ 立体卡片设计
- ✅ 用户信息展示
- ✅ 互动数据展示（浏览/点赞/评论）
- ✅ 内容预览（最多2行）
- ✅ 点击跳转详情

### 3. 热度排序
- ✅ 筛选栏"热门"选项
- ✅ 基于热度分数排序
- ✅ 新剧本加成机制

---

## ⚠️ 注意事项

### 1. 数据库权限

确保以下权限配置正确：

```json
// botc-posts.schema.json
"permission": {
  "read": true,
  "create": "auth.uid != null",
  "update": "doc.user_id == auth.uid",
  "delete": "doc.user_id == auth.uid"
}

// botc-scripts.schema.json
"permission": {
  "read": true,
  "create": "auth.uid != null",
  "update": "auth.uid == doc.creator_id",
  "delete": "auth.uid == doc.creator_id"
}
```

### 2. 上传到云端

**必须上传：**
1. ✅ Schema 文件
   - `botc-posts.schema.json`（已修改）
   - `botc-scripts.schema.json`（已修改）
2. ✅ 云函数
   - `post-create`（已修改）
   - `script-calculate-heat`（新建）
3. ✅ 前端页面
   - `pages/community/create/create.vue`（已修改）
   - `pages/script/detail/detail.vue`（已修改）
   - `pages/script/list/list.vue`（已修改）

### 3. 测试流程

```
1. 刷新数据库 Schema
2. 上传云函数
3. 刷新页面
4. 测试发帖（必须选择剧本）
5. 查看剧本详情页（相关帖子）
6. 手动调用热度计算
7. 查看热门排序
```

---

## 🔍 故障排查

### 问题1：发帖时提示"必须选择一个剧本"
**解决方案：**
- 检查剧本列表是否加载成功
- 检查 `script_id` 是否正确传递
- 检查云函数是否正确更新

### 问题2：相关帖子不显示
**解决方案：**
- 检查帖子的 `script_id` 是否正确
- 检查帖子状态是否为 1（正常）
- 打开控制台查看加载日志

### 问题3：热度排序不生效
**解决方案：**
- 确认已调用 `script-calculate-heat`
- 检查 `heat_score` 字段是否存在
- 检查数据库索引是否创建

---

## 📈 未来优化方向

### 1. 热度计算优化
- 添加时间衰减因子
- 考虑用户质量权重
- 添加防刷机制

### 2. 相关帖子优化
- 支持分页加载
- 添加排序选项（最新/最热）
- 支持帖子类型筛选

### 3. 性能优化
- 热度计算结果缓存
- 使用数据库聚合查询
- 添加 CDN 缓存

---

## ✅ 完成清单

- [x] 修改 botc-posts.schema.json，添加必须的 script_id 字段
- [x] 修改发帖页面，添加剧本选择器（下拉列表/搜索）
- [x] 修改 post-create 云函数，验证 script_id
- [x] 在剧本详情页添加「相关帖子」板块
- [x] 创建热度计算云函数（基于帖子数、评论、点赞）
- [x] 修改剧本列表，支持按热度排序

---

**更新时间：** 2025-10-11
**版本：** v1.0.0

