# 🎭 Storyteller 云对象开发计划

## 📋 原云函数分析

| 云函数名 | 功能 | 复杂度 | 关键点 |
|---------|------|--------|--------|
| `storyteller-list` | 获取说书人列表 | ⭐⭐ | 筛选、搜索、排序、关联用户信息 |
| `storyteller-detail` | 获取说书人详情 | ⭐ | 关联用户信息 |
| `storyteller-reviews` | 获取评价列表 | ⭐⭐ | 分页、关联用户信息 |
| `storyteller-calculate-heat` | 计算热度分数 | ⭐⭐⭐ | 复杂计算、批量更新 |

---

## 🎯 云对象方法设计

### 1. `getList(options)` - 获取说书人列表
**参数：**
```javascript
{
  page: 1,
  pageSize: 10,
  filter: 'all',      // all/certified/high_rating/nearby
  keyword: ''         // 搜索关键词
}
```

**返回：**
```javascript
{
  code: 0,
  message: '获取说书人列表成功',
  data: {
    list: [...],      // 说书人列表（含用户信息）
    total: 100,
    page: 1,
    pageSize: 10
  }
}
```

---

### 2. `getDetail(storytellerId)` - 获取说书人详情
**参数：**
```javascript
{
  storytellerId: 'st_xxx'
}
```

**返回：**
```javascript
{
  code: 0,
  message: '获取说书人详情成功',
  data: {
    ...storytellerInfo,
    user: {...}
  }
}
```

---

### 3. `getReviews(storytellerId, page, pageSize)` - 获取评价列表
**参数：**
```javascript
{
  storytellerId: 'st_xxx',
  page: 1,
  pageSize: 10
}
```

**返回：**
```javascript
{
  code: 0,
  message: '获取评价列表成功',
  data: {
    list: [...],      // 评价列表（含用户信息）
    total: 50,
    page: 1,
    pageSize: 10
  }
}
```

---

### 4. `calculateHeat(userId = null)` - 计算热度分数
**参数：**
```javascript
{
  userId: 'user_xxx'  // 可选，不传则计算所有认证说书人
}
```

**返回：**
```javascript
{
  code: 0,
  message: '成功计算 10 个说书人的热度',
  data: {
    count: 10,
    results: [...]
  }
}
```

**计算公式：**
```
heat_score = 粉丝数 * 10 + 剧本数 * 50 + 剧本总下载量 * 1 + 剧本总评分 * 20
```

---

## 🗄️ 数据库集合

### `botc-storyteller-profiles` - 说书人档案表
```javascript
{
  _id: 'st_xxx',
  user_id: 'user_xxx',
  introduction: '个人介绍',
  is_certified: true,
  rating: 4.5,
  review_count: 100,
  game_count: 50,
  specialties: [],
  location: {},
  tags: [],
  status: 1,
  deleted_at: null,
  created_at: Date
}
```

### `botc-storyteller-reviews` - 说书人评价表
```javascript
{
  _id: 'review_xxx',
  storyteller_id: 'st_xxx',
  user_id: 'user_xxx',
  rating: 5,
  content: '评价内容',
  deleted_at: null,
  created_at: Date
}
```

### `uni-id-users` - 用户表（相关字段）
```javascript
{
  _id: 'user_xxx',
  nickname: '昵称',
  avatar: 'url',
  followers_count: 100,
  storyteller_certified: true,
  storyteller_stats: {
    heat_score: 1000,
    fans_count: 100,
    script_count: 10
  }
}
```

---

## 📝 实现要点

### 1. 关联用户信息
```javascript
// 方式1：分步查询（storyteller-list使用）
const userIds = list.map(item => item.user_id);
const users = await db.collection('uni-id-users')
  .where({ _id: dbCmd.in(userIds) })
  .get();

// 组装数据
const userMap = {};
users.data.forEach(user => {
  userMap[user._id] = user;
});
```

### 2. 筛选逻辑
```javascript
switch (filter) {
  case 'certified':
    whereCondition.is_certified = dbCmd.eq(true);
    break;
  case 'high_rating':
    whereCondition.rating = dbCmd.gte(4.5);
    break;
}
```

### 3. 热度计算
```javascript
const heatScore = 
  fansCount * 10 +       // 每个粉丝 10 分
  scriptCount * 50 +     // 每个剧本 50 分
  totalDownloads * 1 +   // 每次下载 1 分
  totalRating * 20       // 每个评分 20 分
```

---

## ✅ 开发步骤

1. ✅ 分析原云函数
2. ⏳ 创建 `storyteller/index.obj.js`
3. ⏳ 实现 4 个方法
4. ⏳ 上传并测试
5. ⏳ 创建测试页面
6. ⏳ 前端页面适配（如需要）

---

_创建时间：2025-11-04_  
_预计时间：1 小时_

