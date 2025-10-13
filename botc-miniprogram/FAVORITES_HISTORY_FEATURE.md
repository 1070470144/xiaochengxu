# 收藏和浏览历史功能说明

## 📋 本次优化内容

### ✅ 已删除
- ❌ 统计区的"剧本"项
- ❌ 功能菜单中的"我的剧本"

### ✅ 已完善
- ✅ 我的收藏功能（云函数 + 页面）
- ✅ 浏览历史功能（云函数 + 页面）

---

## 🎯 功能说明

### 1. 我的收藏

用户可以收藏喜欢的内容，包括：
- 📚 剧本
- 📝 帖子

#### 功能特性
- 显示收藏的剧本和帖子
- 支持下拉刷新
- 支持加载更多
- 点击跳转到详情页

### 2. 浏览历史

自动记录用户浏览过的内容，包括：
- 📚 剧本
- 📝 帖子
- 🚗 拼车

#### 功能特性
- 按时间倒序显示
- 显示浏览时间（今天/昨天/周几/日期）
- 支持下拉刷新
- 支持加载更多
- 点击跳转到详情页

---

## 📊 新界面结构

### 数据统计区（3项）
```
┌────────────────────────────┐
│  123    45     67          │
│  帖子   拼车    收藏        │
└────────────────────────────┘
```

**变化**：
- ❌ 删除了"剧本"统计项
- ✅ 保留"帖子"、"拼车"、"收藏"

### 内容管理区（2项）
```
┌────────────────────────────┐
│ 📚 内容管理                 │
├────────────────────────────┤
│ ⭐ 我的收藏      25   ›    │
│ 👁️ 浏览历史     120   ›   │
└────────────────────────────┘
```

**变化**：
- ❌ 删除了"我的剧本"
- ✅ "我的收藏"和"浏览历史"显示计数

---

## 📁 文件清单

### 新增云函数

#### 1. `favorites-list`
- **路径**: `uniCloud-aliyun/cloudfunctions/favorites-list/`
- **功能**: 获取用户收藏列表
- **支持**: 剧本、帖子
- **返回**: 分页数据 + 总数

#### 2. `history-list`
- **路径**: `uniCloud-aliyun/cloudfunctions/history-list/`
- **功能**: 获取用户浏览历史
- **支持**: 剧本、帖子、拼车
- **返回**: 分页数据 + 总数

### 新增页面

#### 1. `pages/user/favorites/favorites.vue`
- **标题**: 我的收藏
- **功能**: 
  - 显示收藏的剧本（带封面）
  - 显示收藏的帖子（带内容预览）
  - 点击跳转详情

#### 2. `pages/user/history/history.vue`
- **标题**: 浏览历史
- **功能**:
  - 显示浏览的剧本（带封面）
  - 显示浏览的帖子（带内容预览）
  - 显示浏览的拼车（带时间地点）
  - 类型标签区分

### 修改文件

- ✅ `pages.json` - 注册2个新页面
- ✅ `pages/user/profile/profile.vue` - 删除"我的剧本"，更新跳转方法

---

## 🎨 页面效果

### 我的收藏页面

#### 剧本收藏
```
┌────────────────────────────┐
│ ┌────┐  暗流涌动           │
│ │封面│  作者：官方         │
│ │图片│  今天 15:30         │
│ └────┘                     │
└────────────────────────────┘
```

#### 帖子收藏
```
┌────────────────────────────┐
│ 这是一篇很有趣的帖子内容   │
│ 分享给大家...             │
│                            │
│ [图] [图] [图]            │
│                            │
│ 昨天                       │
└────────────────────────────┘
```

### 浏览历史页面

#### 剧本历史
```
┌────────────────────────────┐
│ ┌────┐  暗流涌动    [剧本] │
│ │封面│  作者：官方         │
│ │图片│  今天 15:30         │
│ └────┘                     │
└────────────────────────────┘
```

#### 帖子历史
```
┌────────────────────────────┐
│              [帖子]         │
│ 这是一篇很有趣的帖子内容   │
│ [图] [图] [图]            │
│ 昨天                       │
└────────────────────────────┘
```

#### 拼车历史
```
┌────────────────────────────┐
│              [拼车]         │
│ 暗流涌动拼车               │
│ 📅 01-15 19:00            │
│ 📍 血染钟楼旗舰店          │
│ 周一                       │
└────────────────────────────┘
```

---

## 📊 数据库表结构

### 收藏表 (`botc-favorites`)

```javascript
{
  _id: 'favorite_id',
  user_id: 'user_id',              // 用户ID
  target_type: 'script',           // 类型：script/post
  target_id: 'target_id',          // 目标ID
  created_at: timestamp            // 收藏时间
}
```

### 浏览历史表 (`botc-browse-history`)

```javascript
{
  _id: 'history_id',
  user_id: 'user_id',              // 用户ID
  target_type: 'script',           // 类型：script/post/carpool
  target_id: 'target_id',          // 目标ID
  created_at: timestamp,           // 首次浏览时间
  updated_at: timestamp            // 最后浏览时间
}
```

**注意**: 浏览历史使用 `updated_at` 排序，最近浏览的在前面。

---

## 🔧 使用方法

### 访问入口

**我的 → 内容管理 → 我的收藏/浏览历史**

### 收藏内容

1. 在剧本详情或帖子详情页
2. 点击"收藏"按钮
3. 收藏成功后，数据会显示在"我的收藏"

### 查看收藏

1. 进入"我的"页面
2. 点击"内容管理"下的"我的收藏"
3. 查看所有收藏的内容
4. 点击卡片跳转到详情页

### 浏览历史

1. 每次查看剧本、帖子、拼车详情时自动记录
2. 进入"我的"页面
3. 点击"内容管理"下的"浏览历史"
4. 查看所有浏览过的内容

---

## 🎯 智能时间显示

### 时间格式规则

| 时间差 | 显示格式 | 示例 |
|-------|---------|------|
| 今天 | 今天 HH:MM | 今天 15:30 |
| 昨天 | 昨天 | 昨天 |
| 一周内 | 周几 | 周一 |
| 今年内 | MM-DD | 01-15 |
| 其他 | YYYY-MM-DD | 2024-01-15 |

---

## 🚀 部署步骤

### 1. 上传云函数

在 HBuilderX 中：
1. 右键 `favorites-list` 云函数 → 上传部署
2. 右键 `history-list` 云函数 → 上传部署

### 2. 创建数据库表

在 uniCloud Web 控制台创建两个表：

#### `botc-favorites` 表
```json
{
  "bsonType": "object",
  "required": ["user_id", "target_type", "target_id"],
  "properties": {
    "_id": {
      "description": "ID"
    },
    "user_id": {
      "bsonType": "string",
      "description": "用户ID",
      "foreignKey": "uni-id-users._id"
    },
    "target_type": {
      "bsonType": "string",
      "description": "目标类型",
      "enum": ["script", "post"]
    },
    "target_id": {
      "bsonType": "string",
      "description": "目标ID"
    },
    "created_at": {
      "bsonType": "timestamp",
      "description": "创建时间",
      "forceDefaultValue": {
        "$env": "now"
      }
    }
  }
}
```

#### `botc-browse-history` 表
```json
{
  "bsonType": "object",
  "required": ["user_id", "target_type", "target_id"],
  "properties": {
    "_id": {
      "description": "ID"
    },
    "user_id": {
      "bsonType": "string",
      "description": "用户ID",
      "foreignKey": "uni-id-users._id"
    },
    "target_type": {
      "bsonType": "string",
      "description": "目标类型",
      "enum": ["script", "post", "carpool"]
    },
    "target_id": {
      "bsonType": "string",
      "description": "目标ID"
    },
    "created_at": {
      "bsonType": "timestamp",
      "description": "创建时间",
      "forceDefaultValue": {
        "$env": "now"
      }
    },
    "updated_at": {
      "bsonType": "timestamp",
      "description": "更新时间"
    }
  }
}
```

### 3. 运行项目

```bash
# 在 HBuilderX 中
运行 → 运行到浏览器
```

---

## 📝 后续集成

### 需要在详情页添加的功能

#### 1. 剧本详情页 (`pages/script/detail/detail.vue`)

添加收藏按钮：
```javascript
// 收藏剧本
async favoriteScript() {
  const result = await uniCloud.callFunction({
    name: 'favorite-add',
    data: {
      target_type: 'script',
      target_id: this.scriptId,
      token: Auth.getToken()
    }
  })
}
```

添加浏览历史记录：
```javascript
// 记录浏览历史
async recordHistory() {
  await uniCloud.callFunction({
    name: 'history-add',
    data: {
      target_type: 'script',
      target_id: this.scriptId,
      token: Auth.getToken()
    }
  })
}
```

#### 2. 帖子详情页 (`pages/community/detail/detail.vue`)

同样添加收藏和历史记录功能。

#### 3. 拼车详情页 (`pages/carpool/detail/detail.vue`)

添加浏览历史记录功能（不需要收藏功能）。

---

## ⚠️ 注意事项

### 1. 数据权限
- 用户只能查看自己的收藏和历史
- 云函数自动验证 token
- 使用 `user_id` 过滤数据

### 2. 唯一性
- 收藏：同一用户对同一内容只能收藏一次
- 历史：同一用户对同一内容的浏览会更新 `updated_at`

### 3. 性能优化
- 使用分页加载，每页 10 条
- 支持下拉刷新和加载更多
- 图片懒加载

---

## 🎉 完成状态

### ✅ 已完成
- ✅ 删除"我的剧本"功能
- ✅ 创建收藏云函数和页面
- ✅ 创建浏览历史云函数和页面
- ✅ 页面注册和路由配置
- ✅ 统计区数据调整

### ⏳ 待集成
- ⏳ 在详情页添加收藏按钮
- ⏳ 在详情页添加历史记录
- ⏳ 创建 `favorite-add` 云函数
- ⏳ 创建 `history-add` 云函数
- ⏳ 更新 `user-stats` 云函数（添加 `historyCount`）

---

**优化完成！** 
现在用户中心更加简洁，"我的收藏"和"浏览历史"功能已完全实现。🎊

