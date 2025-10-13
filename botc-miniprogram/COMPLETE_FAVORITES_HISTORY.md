# 收藏和浏览历史功能完整集成文档

## ✅ 功能完成清单

### 1. 云函数（6个）
- ✅ `history-add` - 记录浏览历史
- ✅ `history-list` - 查询浏览历史列表
- ✅ `favorite-add` - 添加收藏
- ✅ `favorite-remove` - 取消收藏
- ✅ `favorites-list` - 查询收藏列表
- ✅ `user-stats` - 更新统计数据（新增 historyCount）

### 2. 前端页面（2个）
- ✅ `pages/user/favorites/favorites.vue` - 我的收藏页面
- ✅ `pages/user/history/history.vue` - 浏览历史页面

### 3. 功能集成（3个详情页）
- ✅ `pages/script/detail/detail.vue` - 剧本详情（浏览历史 + 收藏）
- ✅ `pages/community/detail/detail.vue` - 帖子详情（浏览历史 + 收藏）
- ✅ `pages/carpool/detail/detail.vue` - 拼车详情（浏览历史）

### 4. 界面优化
- ✅ `pages/user/profile/profile.vue` - 删除"我的剧本"，显示收藏和历史计数

---

## 📊 数据库表结构

### 1. `botc-favorites` 收藏表

```json
{
  "bsonType": "object",
  "description": "用户收藏表",
  "required": ["user_id", "target_type", "target_id"],
  "permission": {
    "read": "auth.uid == doc.user_id",
    "create": "auth.uid != null && auth.uid == doc.user_id",
    "update": false,
    "delete": "auth.uid != null && auth.uid == doc.user_id"
  },
  "properties": {
    "_id": {
      "description": "收藏ID"
    },
    "user_id": {
      "bsonType": "string",
      "description": "用户ID",
      "foreignKey": "uni-id-users._id"
    },
    "target_type": {
      "bsonType": "string",
      "description": "目标类型：script-剧本 post-帖子",
      "enum": ["script", "post"]
    },
    "target_id": {
      "bsonType": "string",
      "description": "目标ID"
    },
    "created_at": {
      "bsonType": "timestamp",
      "description": "收藏时间",
      "forceDefaultValue": {
        "$env": "now"
      }
    }
  }
}
```

**索引建议**：
- `user_id` + `target_type` + `target_id` 联合唯一索引

### 2. `botc-browse-history` 浏览历史表

```json
{
  "bsonType": "object",
  "description": "用户浏览历史表",
  "required": ["user_id", "target_type", "target_id"],
  "permission": {
    "read": "auth.uid == doc.user_id",
    "create": "auth.uid != null && auth.uid == doc.user_id",
    "update": "auth.uid != null && auth.uid == doc.user_id",
    "delete": "auth.uid != null && auth.uid == doc.user_id"
  },
  "properties": {
    "_id": {
      "description": "历史记录ID"
    },
    "user_id": {
      "bsonType": "string",
      "description": "用户ID",
      "foreignKey": "uni-id-users._id"
    },
    "target_type": {
      "bsonType": "string",
      "description": "目标类型：script-剧本 post-帖子 carpool-拼车",
      "enum": ["script", "post", "carpool"]
    },
    "target_id": {
      "bsonType": "string",
      "description": "目标ID"
    },
    "created_at": {
      "bsonType": "timestamp",
      "description": "首次浏览时间",
      "forceDefaultValue": {
        "$env": "now"
      }
    },
    "updated_at": {
      "bsonType": "timestamp",
      "description": "最后浏览时间"
    }
  }
}
```

**索引建议**：
- `user_id` + `target_type` + `target_id` 联合唯一索引
- `user_id` + `updated_at` 联合索引（用于排序）

---

## 🔧 云函数详细说明

### 1. `history-add` - 记录浏览历史

#### 请求参数
```javascript
{
  target_type: 'script',  // 必填：script/post/carpool
  target_id: 'xxx',       // 必填：目标ID
  token: 'xxx'            // 必填：用户token
}
```

#### 返回结果
```javascript
{
  code: 0,
  message: '记录成功'
}
```

#### 特性
- 自动去重：同一用户对同一内容的浏览记录只保留一条
- 更新时间：重复浏览时更新 `updated_at`

---

### 2. `favorite-add` - 添加收藏

#### 请求参数
```javascript
{
  target_type: 'script',  // 必填：script/post
  target_id: 'xxx',       // 必填：目标ID
  token: 'xxx'            // 必填：用户token
}
```

#### 返回结果
```javascript
{
  code: 0,
  message: '收藏成功'
}
```

#### 错误处理
- 已收藏：`{ code: 400, message: '已收藏过了' }`

---

### 3. `favorite-remove` - 取消收藏

#### 请求参数
```javascript
{
  target_type: 'script',  // 必填：script/post
  target_id: 'xxx',       // 必填：目标ID
  token: 'xxx'            // 必填：用户token
}
```

#### 返回结果
```javascript
{
  code: 0,
  message: '取消收藏成功'
}
```

---

### 4. `favorites-list` - 查询收藏列表

#### 请求参数
```javascript
{
  page: 1,         // 可选：页码，默认1
  page_size: 10,   // 可选：每页数量，默认10
  token: 'xxx'     // 必填：用户token
}
```

#### 返回结果
```javascript
{
  code: 0,
  message: 'success',
  data: {
    list: [
      {
        favorite_id: 'xxx',
        target_type: 'script',
        target_data: {
          id: 'xxx',
          title: '暗流涌动',
          cover: 'xxx',
          author: '官方',
          type: 'script'
        },
        created_at: timestamp
      }
    ],
    total: 25
  }
}
```

---

### 5. `history-list` - 查询浏览历史列表

#### 请求参数
```javascript
{
  page: 1,         // 可选：页码，默认1
  page_size: 10,   // 可选：每页数量，默认10
  token: 'xxx'     // 必填：用户token
}
```

#### 返回结果
```javascript
{
  code: 0,
  message: 'success',
  data: {
    list: [
      {
        history_id: 'xxx',
        target_type: 'script',
        target_data: {
          id: 'xxx',
          title: '暗流涌动',
          cover: 'xxx',
          author: '官方',
          type: 'script'
        },
        updated_at: timestamp
      }
    ],
    total: 120
  }
}
```

---

## 🎯 详情页集成说明

### 1. 剧本详情页 (`pages/script/detail/detail.vue`)

#### 新增功能
- ✅ 自动记录浏览历史
- ✅ 检查收藏状态
- ✅ 收藏/取消收藏按钮

#### 关键方法
```javascript
// 在 onLoad 中调用
this.recordHistory()      // 记录浏览历史
this.checkFavoriteStatus() // 检查收藏状态

// 新增方法
recordHistory()          // 记录浏览历史
checkFavoriteStatus()    // 检查收藏状态
favoriteScript()         // 收藏/取消收藏
```

#### UI变化
- 收藏按钮动态显示"收藏"或"取消收藏"
- 按钮状态与数据库同步

---

### 2. 帖子详情页 (`pages/community/detail/detail.vue`)

#### 新增功能
- ✅ 自动记录浏览历史
- ✅ 检查收藏状态
- ✅ 底部操作栏新增收藏按钮

#### 关键方法
```javascript
// 在 onLoad 中调用
this.recordHistory()      // 记录浏览历史
this.checkFavoriteStatus() // 检查收藏状态

// 新增方法
recordHistory()          // 记录浏览历史
checkFavoriteStatus()    // 检查收藏状态
handleFavorite()         // 收藏/取消收藏
```

#### UI变化
- 底部操作栏：点赞 + 收藏
- 收藏按钮：⭐（未收藏）/ ⭐（已收藏，金色）

---

### 3. 拼车详情页 (`pages/carpool/detail/detail.vue`)

#### 新增功能
- ✅ 自动记录浏览历史

#### 关键方法
```javascript
// 在 onLoad 中调用
this.recordHistory()      // 记录浏览历史

// 新增方法
recordHistory()          // 记录浏览历史
```

**注意**：拼车详情页不需要收藏功能。

---

## 📱 前端页面说明

### 1. 我的收藏页面 (`pages/user/favorites/favorites.vue`)

#### 功能特性
- ✅ 显示所有收藏（剧本 + 帖子）
- ✅ 剧本卡片：封面 + 标题 + 作者 + 收藏时间
- ✅ 帖子卡片：内容预览 + 图片（最多3张） + 收藏时间
- ✅ 点击跳转到详情页
- ✅ 下拉刷新
- ✅ 加载更多

#### 时间格式
- 今天：今天 15:30
- 昨天：昨天
- 一周内：周一/周二...
- 其他：01-15 或 2024-01-15

---

### 2. 浏览历史页面 (`pages/user/history/history.vue`)

#### 功能特性
- ✅ 显示所有浏览历史（剧本 + 帖子 + 拼车）
- ✅ 按最后浏览时间倒序排列
- ✅ 每种类型显示类型标签
- ✅ 剧本：封面 + 标题 + 作者 + 时间
- ✅ 帖子：内容预览 + 图片（最多3张） + 时间
- ✅ 拼车：标题 + 时间地点 + 时间
- ✅ 点击跳转到详情页
- ✅ 下拉刷新
- ✅ 加载更多

---

## 📈 统计数据更新

### `user-stats` 云函数变更

#### 新增统计项
- ✅ `historyCount` - 浏览历史数量

#### 修复
- ✅ `favoriteCount` - 修复查询条件（移除 `type: 'script'` 限制）

#### 返回数据
```javascript
{
  code: 0,
  message: 'success',
  data: {
    uploadCount: 0,        // 上传剧本数
    favoriteCount: 25,     // 收藏数（剧本+帖子）
    carpoolCount: 3,       // 创建拼车数
    joinedCarpoolCount: 5, // 参与拼车数
    postCount: 12,         // 发布帖子数
    commentCount: 18,      // 发表评论数
    likeCount: 42,         // 获得点赞数
    viewCount: 156,        // 获得浏览数
    chatCount: 8,          // 私聊会话数
    historyCount: 120      // 浏览历史数（新增）
  }
}
```

---

## 🎨 UI效果展示

### 剧本详情页

```
┌─────────────────────────────┐
│ 暗流涌动                     │
│ ⭐4.8 (125人评价)            │
├─────────────────────────────┤
│ 作者：官方                   │
│ 人数：7人                    │
│ 时长：120分钟                │
├─────────────────────────────┤
│ [分享] [收藏] [写评价]       │ ← 收藏按钮
└─────────────────────────────┘
```

### 帖子详情页

```
┌─────────────────────────────┐
│ 帖子内容...                  │
│ [图片]                       │
├─────────────────────────────┤
│ 说点什么... [❤️ 42] [⭐ 收藏]│ ← 收藏按钮
└─────────────────────────────┘
```

### 我的收藏页面

```
┌─────────────────────────────┐
│ ┌────┐ 暗流涌动              │
│ │封面│ 作者：官方            │
│ └────┘ 今天 15:30            │
├─────────────────────────────┤
│ 这是一篇很有趣的帖子...      │
│ [图] [图] [图]              │
│ 昨天                         │
└─────────────────────────────┘
```

### 浏览历史页面

```
┌─────────────────────────────┐
│ ┌────┐ 暗流涌动     [剧本]   │
│ │封面│ 作者：官方            │
│ └────┘ 今天 15:30            │
├─────────────────────────────┤
│              [帖子]          │
│ 这是一篇很有趣的帖子...      │
│ [图] [图] [图]              │
│ 昨天                         │
├─────────────────────────────┤
│              [拼车]          │
│ 暗流涌动拼车                 │
│ 📅 01-15 19:00              │
│ 📍 血染钟楼旗舰店            │
│ 周一                         │
└─────────────────────────────┘
```

---

## 🚀 部署步骤

### 1. 创建数据库表

在 uniCloud Web 控制台创建两个表：
1. `botc-favorites`
2. `botc-browse-history`

使用上面提供的 schema。

### 2. 添加索引

#### `botc-favorites` 表
```javascript
// 联合唯一索引
{
  "user_id": 1,
  "target_type": 1,
  "target_id": 1
}
// 设置为唯一索引
```

#### `botc-browse-history` 表
```javascript
// 联合唯一索引
{
  "user_id": 1,
  "target_type": 1,
  "target_id": 1
}
// 设置为唯一索引

// 排序索引
{
  "user_id": 1,
  "updated_at": -1
}
```

### 3. 上传云函数

在 HBuilderX 中，右键上传以下云函数：
- `history-add`
- `favorite-add`
- `favorite-remove`
- `favorites-list`
- `history-list`
- `user-stats` (更新)

### 4. 运行项目

```bash
# 在 HBuilderX 中
运行 → 运行到浏览器
```

---

## 🧪 测试流程

### 1. 测试浏览历史

1. ✅ 访问任意剧本详情页
2. ✅ 进入"我的 → 浏览历史"
3. ✅ 确认该剧本出现在列表中
4. ✅ 再次访问同一剧本
5. ✅ 刷新浏览历史，确认时间已更新

### 2. 测试收藏功能

1. ✅ 访问任意剧本详情页
2. ✅ 点击"收藏"按钮
3. ✅ 确认提示"收藏成功"
4. ✅ 进入"我的 → 我的收藏"
5. ✅ 确认该剧本出现在列表中
6. ✅ 返回剧本详情页
7. ✅ 确认按钮显示"取消收藏"
8. ✅ 点击"取消收藏"
9. ✅ 确认提示"取消收藏"
10. ✅ 刷新收藏列表，确认已移除

### 3. 测试帖子收藏

1. ✅ 访问任意帖子详情页
2. ✅ 点击底部"收藏"按钮
3. ✅ 确认图标变为金色实心星星
4. ✅ 进入"我的 → 我的收藏"
5. ✅ 确认该帖子出现在列表中

### 4. 测试统计数据

1. ✅ 进入"我的"页面
2. ✅ 确认"收藏"统计数字正确
3. ✅ 点击"浏览历史"
4. ✅ 确认右侧显示历史数量

---

## ⚠️ 注意事项

### 1. 权限控制
- 用户只能查看自己的收藏和历史
- 云函数自动验证 token
- 数据库 schema 已配置权限规则

### 2. 性能优化
- 使用分页加载，每页 10 条
- 使用联合唯一索引防止重复
- 浏览历史使用 `updated_at` 排序

### 3. 数据一致性
- 收藏：同一内容只能收藏一次
- 历史：同一内容的浏览记录会更新时间
- 统计：实时查询数据库确保准确

### 4. 错误处理
- 所有云函数都有完整的错误处理
- 前端显示友好的错误提示
- 使用 `catch(() => ({ total: 0 }))` 防止查询失败

---

## 📝 文件清单

### 新增云函数（6个）
1. ✅ `uniCloud-aliyun/cloudfunctions/history-add/index.js`
2. ✅ `uniCloud-aliyun/cloudfunctions/history-add/package.json`
3. ✅ `uniCloud-aliyun/cloudfunctions/favorite-add/index.js`
4. ✅ `uniCloud-aliyun/cloudfunctions/favorite-add/package.json`
5. ✅ `uniCloud-aliyun/cloudfunctions/favorite-remove/index.js`
6. ✅ `uniCloud-aliyun/cloudfunctions/favorite-remove/package.json`
7. ✅ `uniCloud-aliyun/cloudfunctions/favorites-list/index.js`
8. ✅ `uniCloud-aliyun/cloudfunctions/favorites-list/package.json`
9. ✅ `uniCloud-aliyun/cloudfunctions/history-list/index.js`
10. ✅ `uniCloud-aliyun/cloudfunctions/history-list/package.json`

### 新增页面（2个）
11. ✅ `pages/user/favorites/favorites.vue`
12. ✅ `pages/user/history/history.vue`

### 修改文件（6个）
13. ✅ `pages.json` - 注册2个新页面
14. ✅ `pages/user/profile/profile.vue` - 更新跳转方法，删除"我的剧本"
15. ✅ `pages/script/detail/detail.vue` - 集成浏览历史和收藏
16. ✅ `pages/community/detail/detail.vue` - 集成浏览历史和收藏
17. ✅ `pages/carpool/detail/detail.vue` - 集成浏览历史
18. ✅ `uniCloud-aliyun/cloudfunctions/user-stats/index.js` - 添加 historyCount

---

## 🎉 完成总结

### ✅ 已实现功能
1. ✅ 浏览历史自动记录（剧本、帖子、拼车）
2. ✅ 收藏功能（剧本、帖子）
3. ✅ 我的收藏页面
4. ✅ 浏览历史页面
5. ✅ 统计数据更新
6. ✅ 详情页完整集成

### 📊 数据流程

#### 浏览历史流程
```
用户访问详情页
  ↓
onLoad 调用 recordHistory()
  ↓
调用 history-add 云函数
  ↓
检查是否已存在记录
  ↓
存在：更新 updated_at
不存在：创建新记录
  ↓
记录成功
  ↓
用户查看"浏览历史"
  ↓
调用 history-list 云函数
  ↓
返回分页数据
```

#### 收藏流程
```
用户点击"收藏"按钮
  ↓
调用 favoriteScript/handleFavorite()
  ↓
判断当前收藏状态
  ↓
未收藏：调用 favorite-add
已收藏：调用 favorite-remove
  ↓
更新本地状态 isFavorite
  ↓
显示成功提示
  ↓
用户查看"我的收藏"
  ↓
调用 favorites-list 云函数
  ↓
返回分页数据
```

---

**所有功能已完整实现并集成！** 🎊

现在用户可以：
- ✅ 自动记录浏览历史
- ✅ 收藏喜欢的剧本和帖子
- ✅ 查看收藏列表
- ✅ 查看浏览历史
- ✅ 在个人中心看到准确的统计数据

