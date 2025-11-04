# 📝 Collection 前端页面适配计划

## 📊 需要适配的页面

找到了 **5 个页面**使用 Collection 云函数：

| # | 页面 | 文件路径 | 使用的云函数 | 优先级 |
|---|------|---------|-------------|--------|
| 1 | 收藏列表 | `pages/user/favorites/favorites.vue` | favorites-list, favorite-remove | ⭐⭐⭐ |
| 2 | 浏览历史 | `pages/user/history/history.vue` | history-list | ⭐⭐⭐ |
| 3 | 剧本详情 | `pages/script/detail/detail.vue` | favorite-add, favorite-remove, history-add | ⭐⭐ |
| 4 | 帖子详情 | `pages/community/detail/detail.vue` | favorite-add, favorite-remove, history-add | ⭐⭐ |
| 5 | 拼车详情 | `pages/carpool/detail/detail.vue` | history-add | ⭐ |

---

## 🔄 云函数映射关系

| 旧云函数 | 新云对象方法 | 参数变化 |
|---------|------------|---------|
| `favorite-add` | `collectionObj.addFavorite(targetType, targetId)` | 简化参数 |
| `favorite-remove` | `collectionObj.removeFavorite(targetType, targetId)` | 简化参数 |
| `favorites-list` | `collectionObj.getFavorites(options)` | 统一参数 |
| `history-add` | `collectionObj.addHistory(targetType, targetId)` | 简化参数 |
| `history-list` | `collectionObj.getHistory(options)` | 统一参数 |

---

## 📝 详细适配方案

### 1. 收藏列表页 (`pages/user/favorites/favorites.vue`)

**使用的云函数：**
- `favorites-list` - 获取收藏列表
- `favorite-remove` - 取消收藏

**适配步骤：**

#### 1.1 添加云对象导入（onLoad）
```javascript
onLoad() {
  // 初始化 collection 云对象
  this.collectionObj = uniCloud.importObject('collection', {
    customUI: true
  })
  
  this.loadFavorites()
}
```

#### 1.2 替换获取收藏列表
```javascript
// 旧方式
const result = await uniCloud.callFunction({
  name: 'favorites-list',
  data: {
    page: this.page,
    page_size: this.pageSize,
    token: Auth.getToken()
  }
})

if (result.result.code === 0) {
  const list = result.result.data.list
}

// 新方式
const result = await this.collectionObj.getFavorites({
  page: this.page,
  pageSize: this.pageSize
})

if (result.code === 0) {
  const list = result.data.list
}
```

#### 1.3 替换取消收藏
```javascript
// 旧方式
const result = await uniCloud.callFunction({
  name: 'favorite-remove',
  data: {
    target_type: item.target_type,
    target_id: item.target_id,
    token: Auth.getToken()
  }
})

// 新方式
const result = await this.collectionObj.removeFavorite(
  item.targetType,
  item.targetData.id
)
```

---

### 2. 浏览历史页 (`pages/user/history/history.vue`)

**使用的云函数：**
- `history-list` - 获取浏览历史

**适配步骤：**

#### 2.1 添加云对象导入（onLoad）
```javascript
onLoad() {
  // 初始化 collection 云对象
  this.collectionObj = uniCloud.importObject('collection', {
    customUI: true
  })
  
  this.loadHistory()
}
```

#### 2.2 替换获取浏览历史
```javascript
// 旧方式
const result = await uniCloud.callFunction({
  name: 'history-list',
  data: {
    page: this.page,
    page_size: this.pageSize,
    token: Auth.getToken()
  }
})

if (result.result.code === 0) {
  const list = result.result.data.list
}

// 新方式
const result = await this.collectionObj.getHistory({
  page: this.page,
  pageSize: this.pageSize
})

if (result.code === 0) {
  const list = result.data.list
}
```

---

### 3. 剧本详情页 (`pages/script/detail/detail.vue`)

**使用的云函数：**
- `favorite-add` - 添加收藏
- `favorite-remove` - 取消收藏
- `history-add` - 添加浏览历史

**适配步骤：**

#### 3.1 添加云对象导入（onLoad）
```javascript
onLoad(options) {
  // 初始化 collection 云对象
  this.collectionObj = uniCloud.importObject('collection', {
    customUI: true
  })
  
  // 记录浏览历史
  if (Auth.isLogin()) {
    this.recordHistory()
  }
  
  // 其他初始化...
}
```

#### 3.2 替换添加收藏
```javascript
// 旧方式
const result = await uniCloud.callFunction({
  name: 'favorite-add',
  data: {
    target_type: 'script',
    target_id: this.scriptId,
    token: Auth.getToken()
  }
})

// 新方式
const result = await this.collectionObj.addFavorite('script', this.scriptId)
```

#### 3.3 替换取消收藏
```javascript
// 旧方式
const result = await uniCloud.callFunction({
  name: 'favorite-remove',
  data: {
    target_type: 'script',
    target_id: this.scriptId,
    token: Auth.getToken()
  }
})

// 新方式
const result = await this.collectionObj.removeFavorite('script', this.scriptId)
```

#### 3.4 替换添加浏览历史
```javascript
// 旧方式
await uniCloud.callFunction({
  name: 'history-add',
  data: {
    target_type: 'script',
    target_id: this.scriptId,
    token: Auth.getToken()
  }
})

// 新方式
await this.collectionObj.addHistory('script', this.scriptId)
```

---

### 4. 帖子详情页 (`pages/community/detail/detail.vue`)

**使用的云函数：**
- `favorite-add` - 添加收藏
- `favorite-remove` - 取消收藏
- `history-add` - 添加浏览历史

**适配步骤：** 与剧本详情页类似，targetType 改为 'post'

---

### 5. 拼车详情页 (`pages/carpool/detail/detail.vue`)

**使用的云函数：**
- `history-add` - 添加浏览历史

**适配步骤：**

#### 5.1 添加云对象导入（onLoad）
```javascript
onLoad(options) {
  // 初始化 collection 云对象
  this.collectionObj = uniCloud.importObject('collection', {
    customUI: true
  })
  
  // 记录浏览历史
  if (Auth.isLogin()) {
    this.recordHistory()
  }
  
  // 其他初始化...
}
```

#### 5.2 替换添加浏览历史
```javascript
// 旧方式
await uniCloud.callFunction({
  name: 'history-add',
  data: {
    target_type: 'carpool',
    target_id: this.carpoolId,
    token: Auth.getToken()
  }
})

// 新方式
await this.collectionObj.addHistory('carpool', this.carpoolId)
```

---

## 🎯 适配顺序建议

1. **✅ 收藏列表页** - 核心功能，优先适配
2. **✅ 浏览历史页** - 核心功能，优先适配
3. **✅ 剧本详情页** - 多个功能，重要页面
4. **✅ 帖子详情页** - 多个功能，重要页面
5. **✅ 拼车详情页** - 单一功能，最后适配

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

### 2. 参数名称变化

**旧参数：**
- `target_type` → `targetType`
- `target_id` → `targetId`
- `page_size` → `pageSize`
- `token` → *(移除)*

### 3. 数据字段变化

**收藏列表返回：**
- `favorite_id` → `favoriteId`
- `target_type` → `targetType`
- `target_data` → `targetData`
- `created_at` → `createdAt`

**历史列表返回：**
- `history_id` → `historyId`
- `target_type` → `targetType`
- `target_data` → `targetData`
- `updated_at` → `updatedAt`

---

## ✅ 适配检查清单

### 每个页面完成后检查：

- [ ] 已添加云对象导入
- [ ] 所有云函数调用已替换
- [ ] 返回数据访问已调整
- [ ] token 传递已移除
- [ ] 参数名称已更新
- [ ] 页面功能测试通过
- [ ] 没有控制台错误

---

## 📚 相关文档

- `COLLECTION_CLOUD_OBJECT_COMPLETE.md` - 云对象完成报告
- `COLLECTION_TEST_READY.md` - 测试指南
- `COLLECTION_FRONTEND_ADAPTATION_PLAN.md` (本文档) - 前端适配计划

---

_创建时间：2025-11-04_  
_状态：准备开始_  
_预计完成时间：1 小时_

