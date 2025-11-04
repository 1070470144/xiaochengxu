# 🔧 System 前端适配计划

## 📋 需要适配的页面

| # | 页面 | 路径 | 使用的云函数 | 对应云对象方法 |
|---|------|------|-------------|--------------|
| 1 | 首页 | `pages/index/index.vue` | `home-data` | `systemObj.getHomeData()` |
| 2 | 系统消息列表 | `pages/user/system-messages/list.vue` | `get-system-messages`<br>`delete-system-message` | `systemObj.getSystemMessages()`<br>`systemObj.deleteSystemMessage()` |
| 3 | 系统消息详情 | `pages/user/system-messages/detail.vue` | `get-system-messages` | `systemObj.getSystemMessages()` |
| 4 | 认证管理 | `pages/user/certification/certification.vue` | `certification-manage` | `systemObj.manageCertification()` |
| 5 | 帖子详情 | `pages/community/detail/detail.vue` | `comment-create`<br>`content-filter` | `systemObj.createComment()`<br>`systemObj.filterContent()` |

---

## 🔧 适配要点

### 对于每个页面：

1. **初始化云对象**
```javascript
onLoad() {
  this.systemObj = uniCloud.importObject('system', { customUI: true })
}
```

2. **替换云函数调用**
```javascript
// 旧方式
const result = await uniCloud.callFunction({
  name: 'home-data',
  data: {}
})

// 新方式
const result = await this.systemObj.getHomeData()
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

准备一次性适配所有 5 个页面！

---

_创建时间：2025-11-04_

