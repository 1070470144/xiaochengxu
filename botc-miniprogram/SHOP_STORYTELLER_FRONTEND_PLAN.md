# 🏪🎭 Shop & Storyteller 前端适配计划

## 📋 需要适配的页面

### Shop 模块（3个页面）
| # | 页面 | 路径 | 使用的云函数 | 对应云对象方法 |
|---|------|------|-------------|--------------|
| 1 | 店铺列表 | `pages/shop/list/list.vue` | `shop-list` | `shopObj.getList()` |
| 2 | 店铺详情 | `pages/shop/detail/detail.vue` | `shop-detail` | `shopObj.getDetail()` |
| 3 | 店铺申请 | `pages/shop/apply/apply.vue` | `shop-apply` | `shopObj.apply()` |

### Storyteller 模块（2个页面）
| # | 页面 | 路径 | 使用的云函数 | 对应云对象方法 |
|---|------|------|-------------|--------------|
| 1 | 说书人列表 | `pages/storyteller/list/list.vue` | `storyteller-list` | `storytellerObj.getList()` |
| 2 | 说书人详情 | `pages/storyteller/detail/detail.vue` | `storyteller-detail`<br>`storyteller-reviews` | `storytellerObj.getDetail()`<br>`storytellerObj.getReviews()` |

**注意：** `pages/carpool/create/create.vue` 中使用了 `storyteller-list`，但这是获取说书人列表供拼车创建选择，也需要适配。

---

## 🔧 适配步骤

### 对于每个页面：

1. **导入云对象**
```javascript
onLoad() {
  this.shopObj = uniCloud.importObject('shop', { customUI: true })
  // 或
  this.storytellerObj = uniCloud.importObject('storyteller', { customUI: true })
}
```

2. **替换云函数调用**
```javascript
// 旧方式
const result = await uniCloud.callFunction({
  name: 'shop-list',
  data: { page, pageSize, city, sortBy }
})

// 新方式
const result = await this.shopObj.getList({
  page, pageSize, city, sortBy
})
```

3. **调整结果访问**
```javascript
// 旧方式
result.result.code
result.result.data

// 新方式
result.code
result.data
```

---

## ✅ 开始适配

准备开始一次性适配所有 6 个页面！

---

_创建时间：2025-11-04_

