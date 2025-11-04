# 🚗 Carpool 前端页面适配计划

## 📋 需要适配的页面

### 找到的使用云函数的页面（5个）

| # | 页面 | 文件路径 | 使用的云函数 | 优先级 |
|---|------|---------|-------------|--------|
| 1 | 创建拼车页 | `pages/carpool/create/create.vue` | carpool-create | ⭐⭐⭐ |
| 2 | 拼车列表页 | `pages/carpool/list/list.vue` | carpool-list | ⭐⭐⭐ |
| 3 | 拼车详情页 | `pages/carpool/detail/detail.vue` | carpool-detail, carpool-apply | ⭐⭐⭐ |
| 4 | 我申请的拼车 | `pages/user/applied-carpool/applied-carpool.vue` | carpool-applied-list, carpool-cancel-apply | ⭐⭐ |
| 5 | 我的拼车 | `pages/user/my-carpool/my-carpool.vue` | carpool-list, carpool-update-status | ⭐⭐ |

---

## 🔄 云函数映射关系

| 旧云函数 | 新云对象方法 | 参数变化 |
|---------|------------|---------|
| `carpool-create` | `carpoolObj.create(data)` | 简化，不需要传 token |
| `carpool-list` | `carpoolObj.getList(options)` | 简化 |
| `carpool-detail` | `carpoolObj.getDetail(roomId)` | 简化 |
| `carpool-apply` | `carpoolObj.apply(roomId, message)` | 简化 |
| `carpool-applied-list` | `carpoolObj.getMyApplications(page, pageSize)` | 简化 |
| `carpool-cancel-apply` | `carpoolObj.cancelApply(roomId)` | 简化 |
| `carpool-update-status` | `carpoolObj.updateStatus(roomId, status)` | 简化 |

**注意：** `carpool-quit` 云函数在云对象中对应 `cancelApply` 方法

---

## 📝 适配步骤

### 每个页面的适配步骤：

#### 1. 导入云对象
```javascript
// 在 onLoad 中
this.carpoolObj = uniCloud.importObject('carpool', {
  customUI: true
})
```

#### 2. 替换云函数调用
```javascript
// 旧方式
const result = await uniCloud.callFunction({
  name: 'carpool-create',
  data: {
    title: this.title,
    game_time: this.gameTime,
    location: this.location,
    token: this.token
  }
})

// 新方式
const result = await this.carpoolObj.create({
  title: this.title,
  game_time: this.gameTime,
  location: this.location
})
```

#### 3. 调整返回数据访问
```javascript
// 旧方式
if (result.result.code === 0) {
  this.data = result.result.data
}

// 新方式
if (result.code === 0) {
  this.data = result.data
}
```

---

## 🎯 详细适配方案

### 1. 创建拼车页 (create.vue) ⭐⭐⭐

**使用的云函数：**
- `carpool-create`

**适配内容：**
```javascript
// onLoad 中添加
this.carpoolObj = uniCloud.importObject('carpool', { customUI: true })

// 提交方法中
// 旧：uniCloud.callFunction({ name: 'carpool-create', data: {...} })
// 新：await this.carpoolObj.create(carpoolData)

// 返回数据调整
// 旧：result.result.code, result.result.data
// 新：result.code, result.data
```

---

### 2. 拼车列表页 (list.vue) ⭐⭐⭐

**使用的云函数：**
- `carpool-list`

**适配内容：**
```javascript
// onLoad 中添加
this.carpoolObj = uniCloud.importObject('carpool', { customUI: true })

// 加载列表方法中
// 旧：uniCloud.callFunction({ name: 'carpool-list', data: {...} })
// 新：await this.carpoolObj.getList(options)

// options 参数：
{
  page: 1,
  pageSize: 20,
  type: 'latest',
  location: '',
  dateFilter: ''
}
```

---

### 3. 拼车详情页 (detail.vue) ⭐⭐⭐

**使用的云函数：**
- `carpool-detail`
- `carpool-apply`
- `carpool-quit`（已废弃，使用 cancelApply）

**适配内容：**
```javascript
// onLoad 中添加
this.carpoolObj = uniCloud.importObject('carpool', { customUI: true })

// 加载详情
// 旧：uniCloud.callFunction({ name: 'carpool-detail', data: { id: roomId } })
// 新：await this.carpoolObj.getDetail(roomId)

// 申请加入
// 旧：uniCloud.callFunction({ name: 'carpool-apply', data: { roomId, message } })
// 新：await this.carpoolObj.apply(roomId, message)

// 取消申请
// 旧：uniCloud.callFunction({ name: 'carpool-quit', data: { roomId } })
// 新：await this.carpoolObj.cancelApply(roomId)
```

---

### 4. 我申请的拼车页 (applied-carpool.vue) ⭐⭐

**使用的云函数：**
- `carpool-applied-list`
- `carpool-cancel-apply`

**适配内容：**
```javascript
// onLoad 中添加
this.carpoolObj = uniCloud.importObject('carpool', { customUI: true })

// 加载申请列表
// 旧：uniCloud.callFunction({ name: 'carpool-applied-list', data: { page, pageSize } })
// 新：await this.carpoolObj.getMyApplications(page, pageSize)

// 取消申请
// 旧：uniCloud.callFunction({ name: 'carpool-cancel-apply', data: { roomId } })
// 新：await this.carpoolObj.cancelApply(roomId)
```

---

### 5. 我的拼车页 (my-carpool.vue) ⭐⭐

**使用的云函数：**
- `carpool-list`（带特殊筛选）
- `carpool-update-status`

**适配内容：**
```javascript
// onLoad 中添加
this.carpoolObj = uniCloud.importObject('carpool', { customUI: true })

// 加载我创建的拼车
// 旧：uniCloud.callFunction({ name: 'carpool-list', data: { hostId: userId } })
// 新：await this.carpoolObj.getList({ hostId: userId }) // 需要在云对象中添加 hostId 筛选

// 更新状态
// 旧：uniCloud.callFunction({ name: 'carpool-update-status', data: { roomId, status } })
// 新：await this.carpoolObj.updateStatus(roomId, status)
```

**注意：** 需要在云对象的 `getList` 方法中添加 `hostId` 筛选支持

---

## ⚠️ 特殊情况处理

### 1. 我的拼车页需要扩展

目前云对象的 `getList` 不支持按 `hostId`（房主ID）筛选。

**解决方案 A：** 在云对象中添加 `hostId` 参数支持
```javascript
// 在 carpool/index.obj.js 的 getList 方法中添加
if (options.hostId) {
  whereCondition.host_id = options.hostId
}
```

**解决方案 B：** 新增 `getMyCreated` 方法
```javascript
async getMyCreated(page = 1, pageSize = 10) {
  checkAuth(this.currentUserId)
  
  const result = await this.db.collection('botc-carpool-rooms')
    .where({ host_id: this.currentUserId })
    .orderBy('created_at', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()
  
  return returnSuccess({ list: result.data, total: result.data.length })
}
```

**推荐：** 方案 A（在 getList 中添加筛选更灵活）

---

## 📊 预计工作量

| 页面 | 预计时间 | 难度 |
|-----|---------|------|
| 创建拼车页 | 15分钟 | ⭐ 简单 |
| 拼车列表页 | 15分钟 | ⭐ 简单 |
| 拼车详情页 | 20分钟 | ⭐⭐ 中等 |
| 我申请的拼车 | 15分钟 | ⭐ 简单 |
| 我的拼车页 | 20分钟 | ⭐⭐ 中等（需扩展云对象）|
| **总计** | **85分钟** | |

---

## ✅ 适配检查清单

### 每个页面完成后检查：

- [ ] 已添加云对象导入
- [ ] 所有云函数调用已替换
- [ ] 返回数据访问已调整
- [ ] token 传递已移除
- [ ] 页面功能测试通过
- [ ] 错误处理正常
- [ ] 没有控制台错误

---

## 🚀 开始顺序

建议按照以下顺序进行适配：

1. ✅ **拼车列表页** - 最简单，先热身
2. ✅ **创建拼车页** - 核心功能
3. ✅ **拼车详情页** - 核心功能，稍复杂
4. ✅ **我申请的拼车** - 次要功能
5. ✅ **我的拼车页** - 需要先扩展云对象

---

_创建时间：2025-11-04_  
_状态：准备开始_  
_下一步：先扩展云对象（添加 hostId 筛选），然后开始适配页面_

