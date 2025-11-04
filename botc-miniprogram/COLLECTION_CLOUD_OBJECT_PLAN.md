# 📦 Collection 云对象开发计划

## 📋 概述

将 **5个收藏和历史记录相关云函数**迁移为统一的 **Collection 云对象**。

---

## 🎯 待迁移的云函数

### 收藏相关（3个）
1. **favorite-add** - 添加收藏
2. **favorite-remove** - 取消收藏
3. **favorites-list** - 获取收藏列表

### 历史记录相关（2个）
4. **history-add** - 添加浏览历史
5. **history-list** - 获取浏览历史

---

## 📊 数据库表结构

### 1. botc-favorites（收藏表）
```javascript
{
  _id: String,
  user_id: String,        // 用户ID
  target_type: String,    // 目标类型：'script' | 'post'
  target_id: String,      // 目标ID
  created_at: Date        // 创建时间
}
```

### 2. botc-browse-history（浏览历史表）
```javascript
{
  _id: String,
  user_id: String,        // 用户ID
  target_type: String,    // 目标类型：'script' | 'post' | 'carpool'
  target_id: String,      // 目标ID
  created_at: Date,       // 创建时间
  updated_at: Date        // 更新时间
}
```

---

## 🔧 Collection 云对象方法设计

### 1. addFavorite(targetType, targetId)
**功能：** 添加收藏

**参数：**
```javascript
{
  targetType: String,  // 'script' | 'post'
  targetId: String     // 目标ID
}
```

**返回：**
```javascript
{
  code: 0,
  message: '收藏成功',
  data: {
    favoriteId: String  // 收藏记录ID
  }
}
```

**业务逻辑：**
1. 验证用户登录
2. 验证参数（targetType, targetId）
3. 检查是否已收藏
4. 创建收藏记录
5. 返回成功

---

### 2. removeFavorite(targetType, targetId)
**功能：** 取消收藏

**参数：**
```javascript
{
  targetType: String,  // 'script' | 'post'
  targetId: String     // 目标ID
}
```

**返回：**
```javascript
{
  code: 0,
  message: '取消收藏成功'
}
```

**业务逻辑：**
1. 验证用户登录
2. 验证参数
3. 删除收藏记录
4. 返回结果

---

### 3. getFavorites(options)
**功能：** 获取收藏列表

**参数：**
```javascript
{
  page: Number,        // 页码，默认1
  pageSize: Number,    // 每页数量，默认10
  targetType: String   // 可选，筛选类型：'script' | 'post'
}
```

**返回：**
```javascript
{
  code: 0,
  message: 'success',
  data: {
    list: [
      {
        favoriteId: String,
        targetType: String,
        targetData: {
          // 根据 targetType 返回不同的数据
          // script: { id, title, cover, author }
          // post: { id, content, images }
        },
        createdAt: Date
      }
    ],
    total: Number,
    hasMore: Boolean
  }
}
```

**业务逻辑：**
1. 验证用户登录
2. 查询用户收藏列表（支持分页、筛选）
3. 按类型分组收藏项
4. 聚合查询关联数据（剧本、帖子）
5. 组合返回数据

---

### 4. addHistory(targetType, targetId)
**功能：** 添加/更新浏览历史

**参数：**
```javascript
{
  targetType: String,  // 'script' | 'post' | 'carpool'
  targetId: String     // 目标ID
}
```

**返回：**
```javascript
{
  code: 0,
  message: '记录成功'
}
```

**业务逻辑：**
1. 验证用户登录
2. 验证参数
3. 查询是否已存在记录
4. 存在则更新时间，不存在则创建新记录
5. 返回成功

---

### 5. getHistory(options)
**功能：** 获取浏览历史列表

**参数：**
```javascript
{
  page: Number,        // 页码，默认1
  pageSize: Number,    // 每页数量，默认10
  targetType: String   // 可选，筛选类型：'script' | 'post' | 'carpool'
}
```

**返回：**
```javascript
{
  code: 0,
  message: 'success',
  data: {
    list: [
      {
        historyId: String,
        targetType: String,
        targetData: {
          // 根据 targetType 返回不同的数据
          // script: { id, title, cover, author }
          // post: { id, content, images }
          // carpool: { id, title, gameTime, location }
        },
        updatedAt: Date
      }
    ],
    total: Number,
    hasMore: Boolean
  }
}
```

**业务逻辑：**
1. 验证用户登录
2. 查询用户浏览历史（支持分页、筛选）
3. 按类型分组历史记录
4. 聚合查询关联数据（剧本、帖子、拼车）
5. 组合返回数据

---

### 6. checkFavoriteStatus(targetType, targetId)
**功能：** 检查收藏状态（新增方法，便于前端判断）

**参数：**
```javascript
{
  targetType: String,  // 'script' | 'post'
  targetId: String     // 目标ID
}
```

**返回：**
```javascript
{
  code: 0,
  message: 'success',
  data: {
    isFavorited: Boolean  // 是否已收藏
  }
}
```

---

## 🔄 云函数 → 云对象映射

| 旧云函数 | 新云对象方法 | 说明 |
|---------|------------|------|
| `favorite-add` | `addFavorite(targetType, targetId)` | 添加收藏 |
| `favorite-remove` | `removeFavorite(targetType, targetId)` | 取消收藏 |
| `favorites-list` | `getFavorites(options)` | 获取收藏列表 |
| `history-add` | `addHistory(targetType, targetId)` | 添加历史 |
| `history-list` | `getHistory(options)` | 获取历史列表 |
| *(新增)* | `checkFavoriteStatus(targetType, targetId)` | 检查收藏状态 |

---

## 📝 参数名称调整

| 旧参数名 | 新参数名 | 说明 |
|---------|---------|------|
| `target_type` | `targetType` | 驼峰命名 |
| `target_id` | `targetId` | 驼峰命名 |
| `page_size` | `pageSize` | 驼峰命名 |
| `token` | *(移除)* | 自动从 clientInfo 获取 |

---

## 🎨 云对象结构

```javascript
// collection/index.obj.js
const db = uniCloud.database()
const dbCmd = db.command

module.exports = {
  _before() {
    // 统一认证和初始化
  },
  
  _after(error, result) {
    // 统一返回格式处理
  },
  
  // 收藏相关
  async addFavorite(targetType, targetId) {},
  async removeFavorite(targetType, targetId) {},
  async getFavorites(options = {}) {},
  async checkFavoriteStatus(targetType, targetId) {},
  
  // 历史记录相关
  async addHistory(targetType, targetId) {},
  async getHistory(options = {}) {}
}
```

---

## ✅ 开发检查清单

### 云对象开发
- [ ] 创建 `collection/index.obj.js`
- [ ] 创建 `collection/package.json`
- [ ] 实现 `_before` 钩子（认证）
- [ ] 实现 `_after` 钩子（返回格式化）
- [ ] 实现 `addFavorite` 方法
- [ ] 实现 `removeFavorite` 方法
- [ ] 实现 `getFavorites` 方法
- [ ] 实现 `checkFavoriteStatus` 方法
- [ ] 实现 `addHistory` 方法
- [ ] 实现 `getHistory` 方法
- [ ] 上传云对象到云端

### 测试页面
- [ ] 在 `script-test.vue` 添加 Collection 测试页签
- [ ] 实现收藏功能测试
- [ ] 实现历史记录测试
- [ ] 测试所有方法

### 前端适配
- [ ] 查找使用旧云函数的页面
- [ ] 适配所有相关页面
- [ ] 测试前端功能

### 文档编写
- [ ] 创建开发计划文档
- [ ] 创建完成报告文档
- [ ] 创建测试指南文档
- [ ] 创建前端适配文档

---

## 📊 预计工作量

| 任务 | 预计时间 |
|------|---------|
| 云对象开发 | 1.5 小时 |
| 测试页面 | 0.5 小时 |
| 前端适配 | 1 小时 |
| 文档编写 | 0.5 小时 |
| **总计** | **3.5 小时** |

---

## 🚀 开发顺序

1. **创建云对象基础结构** ✅
2. **实现收藏功能** (3个方法)
3. **实现历史记录功能** (2个方法)
4. **实现检查状态功能** (1个方法)
5. **创建测试页面**
6. **前端页面适配**
7. **删除旧云函数**

---

_创建时间：2025-11-04_  
_状态：准备开始_  
_优先级：⭐⭐⭐_

