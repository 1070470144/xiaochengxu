# 🏪 Shop 云对象开发计划

## 📋 原云函数分析

| 云函数名 | 功能 | 复杂度 | 关键点 |
|---------|------|--------|--------|
| `shop-list` | 获取店铺列表 | ⭐⭐ | 聚合查询、排序、分页 |
| `shop-detail` | 获取店铺详情 | ⭐⭐ | 聚合查询、增加浏览数、关联评价 |
| `shop-apply` | 店铺认证申请 | ⭐⭐ | Token验证、新建/更新逻辑 |

---

## 🎯 云对象方法设计

### 1. `getList(options)` - 获取店铺列表
**参数：**
```javascript
{
  page: 1,          // 页码
  pageSize: 10,     // 每页数量
  city: '',         // 城市筛选
  sortBy: 'recommend' // 排序：recommend/rating/newest
}
```

**返回：**
```javascript
{
  code: 0,
  message: 'success',
  data: {
    list: [...],
    total: 100,
    page: 1,
    pageSize: 10,
    hasMore: true
  }
}
```

**关键逻辑：**
- 聚合查询关联店主信息
- 多种排序方式
- 分页查询

---

### 2. `getDetail(shopId)` - 获取店铺详情
**参数：**
```javascript
{
  shopId: 'shop_xxx'  // 店铺ID
}
```

**返回：**
```javascript
{
  code: 0,
  message: 'success',
  data: {
    ...shopInfo,
    owner: {...},
    reviews: [...]  // 最新5条评价
  }
}
```

**关键逻辑：**
- 聚合查询店铺和店主信息
- 增加浏览计数
- 关联最新5条评价（聚合用户信息）

---

### 3. `apply(shopData)` - 店铺认证申请
**参数：**
```javascript
{
  shopName: '店铺名称',
  shopLogo: 'url',
  shopImages: [...],
  contactPhone: '手机号',
  contactPerson: '联系人',
  contactWechat: '微信',
  province: '省',
  city: '市',
  district: '区',
  address: '详细地址',
  businessHours: '营业时间',
  tableCount: 10,
  avgPrice: 100,
  facilities: [...],
  description: '描述',
  licenseImage: '营业执照',
  licenseNumber: '执照编号'
}
```

**返回：**
```javascript
{
  code: 0,
  message: '提交成功，请等待审核',
  data: {
    shop_id: 'shop_xxx'
  }
}
```

**关键逻辑：**
- 验证必填项
- 验证手机号格式
- Token 验证（使用 `parseUserId`）
- 检查是否已有店铺
- 新建或更新店铺信息

---

## 🗄️ 数据库集合

### `botc-shops` - 店铺表
```javascript
{
  _id: 'shop_xxx',
  owner_id: 'user_xxx',
  shop_name: '店铺名称',
  shop_logo: 'url',
  shop_images: [],
  province: '省',
  city: '市',
  district: '区',
  address: '详细地址',
  location: { type: 'Point', coordinates: [lng, lat] },
  contact_person: '联系人',
  contact_phone: '手机',
  contact_wechat: '微信',
  business_hours: '营业时间',
  description: '描述',
  facilities: [],
  table_count: 10,
  avg_price: 100,
  rating: 5,
  view_count: 0,
  favorite_count: 0,
  review_count: 0,
  verify_status: 0,  // 0-待审核 1-已认证 2-已拒绝
  reject_reason: '',
  status: 1,         // 1-营业 0-停业
  is_recommend: false,
  license_image: 'url',
  license_number: '执照编号',
  created_at: Date,
  updated_at: Date
}
```

### `botc-shop-reviews` - 店铺评价表
```javascript
{
  _id: 'review_xxx',
  shop_id: 'shop_xxx',
  user_id: 'user_xxx',
  rating: 5,
  content: '评价内容',
  images: [],
  tags: [],
  like_count: 0,
  reply: '店主回复',
  reply_time: Date,
  status: 1,
  created_at: Date
}
```

---

## 🔧 工具函数（复用）

从其他云对象复用的工具函数：
- `parseUserId(context)` - 解析用户ID
- `checkAuth(userId)` - 检查认证
- `returnSuccess(data, message)` - 成功返回
- `returnError(code, message)` - 错误返回

---

## 📝 实现要点

### 1. `_before` 钩子
```javascript
_before() {
  this.db = uniCloud.database();
  this.dbCmd = this.db.command;
  this.clientInfo = this.getClientInfo();
  
  // Token 验证（仅 apply 方法需要）
  if (this.getMethodName() === 'apply') {
    this.currentUserId = parseUserId(this.clientInfo);
    if (!this.currentUserId) {
      throw new Error('请先登录');
    }
  }
}
```

### 2. 聚合查询优化
- 使用 `lookup` 关联店主信息
- 使用 `addFields` 处理数组
- 合理使用 `skip` 和 `limit`

### 3. 数据处理
- 店铺列表：只返回必要字段
- 店铺详情：返回完整信息 + 评价
- 申请：新建/更新逻辑分离

---

## ✅ 开发步骤

1. ✅ 分析原云函数
2. ⏳ 创建 `shop/index.obj.js`
3. ⏳ 实现 3 个方法
4. ⏳ 上传并测试
5. ⏳ 创建测试页面
6. ⏳ 前端页面适配

---

_创建时间：2025-11-04_  
_预计时间：1 小时_

