# 📝 举报管理数据字段统一修复

## 🐛 问题描述

举报后台有记录但没有数据显示，原因是：
- **客户端使用旧字段名**：`target_id`, `target_type`, `report_type`, `report_reason`, `status: 0/1/-1`
- **管理端期望新字段名**：`content_id`, `content_type`, `reason`, `description`, `status: pending/processing/resolved/rejected`

## ✅ 修复方案

统一使用新字段名，客户端兼容旧参数。

---

## 📦 已修改的文件

### 1. 客户端云函数
```
✅ botc-miniprogram/uniCloud-aliyun/cloudfunctions/post-report/index.js
```

**主要变更：**
- ✅ 兼容旧参数（`target_id` → `content_id`）
- ✅ 使用新字段名写入数据库
- ✅ 状态统一为字符串：`'pending'`, `'processing'`, `'resolved'`, `'rejected'`
- ✅ 自动获取举报人昵称

### 2. 管理端云函数
```
✅ botc-admin/uniCloud-aliyun/cloudfunctions/reports-admin/index.js
```

**主要变更：**
- ✅ 处理举报时兼容字段名获取

---

## 🔄 字段映射表

| 旧字段名 | 新字段名 | 说明 |
|---------|---------|------|
| `target_id` | `content_id` | 被举报内容ID |
| `target_type` | `content_type` | 内容类型（post/comment/user/script/review） |
| `report_type` | `reason` | 举报原因（spam/porn/violence等） |
| `report_reason` | `description` | 详细描述 |
| `status: 0` | `status: 'pending'` | 待处理 |
| `status: 1` | `status: 'processing'` | 处理中 |
| `status: 2` | `status: 'resolved'` | 已处理 |
| `status: -1` | `status: 'rejected'` | 已驳回 |

---

## 🚀 部署步骤

### 第1步：上传客户端云函数
```bash
右键：botc-miniprogram/uniCloud-aliyun/cloudfunctions/post-report
→ 上传部署
```

### 第2步：上传管理端云函数
```bash
右键：botc-admin/uniCloud-aliyun/cloudfunctions/reports-admin
→ 上传部署
```

### 第3步：测试举报功能

#### 客户端测试（小程序）
```javascript
// 新参数方式（推荐）
await uniCloud.callFunction({
  name: 'post-report',
  data: {
    content_id: 'xxx',
    content_type: 'post',
    reason: 'spam',
    description: '这是广告',
    images: ['图片URL1', '图片URL2'],
    token: 'xxx'
  }
})

// 旧参数方式（兼容）
await uniCloud.callFunction({
  name: 'post-report',
  data: {
    target_id: 'xxx',
    target_type: 'post',
    report_type: 'spam',
    report_reason: '这是广告',
    token: 'xxx'
  }
})
```

#### 管理端测试
```bash
1. 打开：举报管理页面
2. 查看列表是否显示数据
3. 查看统计数据是否正确
4. 测试处理功能
```

---

## 📊 新的数据结构

### botc-reports 表结构

```json
{
  "_id": "自动生成",
  "reporter_id": "举报人ID",
  "reporter_nickname": "举报人昵称",
  "content_type": "post",
  "content_id": "内容ID",
  "content_title": "内容标题",
  "reported_user_id": "被举报用户ID",
  "reported_user_nickname": "被举报用户昵称",
  "reason": "spam",
  "description": "详细描述",
  "images": ["图片1", "图片2"],
  "status": "pending",
  "handle_result": "delete",
  "handle_remark": "处理备注",
  "handler_id": "处理人ID",
  "handled_at": 1234567890,
  "created_at": 1234567890,
  "updated_at": 1234567890
}
```

---

## 🧪 测试清单

### 客户端测试
- [ ] 使用新参数举报成功
- [ ] 使用旧参数举报成功（兼容性）
- [ ] 重复举报提示正确
- [ ] 举报后可在管理端看到

### 管理端测试
- [ ] 列表显示举报数据
- [ ] 统计数据显示正确
- [ ] 状态筛选正常工作
- [ ] 处理举报功能正常
- [ ] 驳回举报功能正常
- [ ] 查看详情显示完整

---

## 💡 最佳实践

### 客户端调用示例

```javascript
// 完整的举报功能示例
async function reportContent(contentId, contentType, reason) {
  try {
    // 获取token
    const token = uni.getStorageSync('token')
    if (!token) {
      uni.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    
    // 弹出输入框
    const res = await uni.showModal({
      title: '举报原因',
      editable: true,
      placeholderText: '请详细说明举报原因'
    })
    
    if (!res.confirm) return
    
    // 调用云函数
    uni.showLoading({ title: '提交中...' })
    const result = await uniCloud.callFunction({
      name: 'post-report',
      data: {
        content_id: contentId,
        content_type: contentType,
        reason: reason,
        description: res.content || '',
        token: token
      }
    })
    
    uni.hideLoading()
    
    if (result.result.code === 0) {
      uni.showToast({ title: '举报成功', icon: 'success' })
    } else {
      uni.showToast({ title: result.result.message, icon: 'none' })
    }
  } catch (error) {
    uni.hideLoading()
    uni.showToast({ title: '举报失败', icon: 'none' })
  }
}

// 使用示例
reportContent('post_id_123', 'post', 'spam')
```

---

## ⚠️ 注意事项

1. **数据兼容性**
   - 客户端云函数支持新旧两种参数
   - 优先使用新参数，旧参数作为备选
   - 所有新数据统一使用新字段名

2. **状态值**
   - 统一使用字符串：`'pending'`, `'processing'`, `'resolved'`, `'rejected'`
   - 不再使用数字：`0`, `1`, `2`, `-1`

3. **举报人信息**
   - 自动从 `uni-id-users` 获取昵称
   - 如果获取失败，显示"匿名用户"

4. **被举报人信息**
   - 当前为空，可以后续完善
   - 需要根据 `content_type` 和 `content_id` 查询对应内容的作者

---

## 🔮 后续优化建议

### 1. 自动填充被举报人信息
```javascript
// 在创建举报记录时，根据内容类型查询作者
if (reportContentType === 'post') {
  const postRes = await db.collection('botc-posts')
    .doc(reportContentId)
    .field({ user_id: true, user_nickname: true })
    .get()
  
  if (postRes.data && postRes.data.length > 0) {
    reported_user_id = postRes.data[0].user_id
    reported_user_nickname = postRes.data[0].user_nickname
  }
}
```

### 2. 自动填充内容标题
```javascript
// 查询被举报内容的标题
if (reportContentType === 'post') {
  const postRes = await db.collection('botc-posts')
    .doc(reportContentId)
    .field({ title: true })
    .get()
  
  if (postRes.data && postRes.data.length > 0) {
    content_title = postRes.data[0].title
  }
}
```

### 3. 添加举报通知
```javascript
// 处理举报后通知相关用户
if (handleResult === 'delete' || handleResult === 'warn') {
  // 发送通知给被举报用户
  await sendNotification(reported_user_id, {
    type: 'report_handled',
    content: `您的${contentType}因违规被${handleResult === 'delete' ? '删除' : '警告'}`
  })
}
```

---

**✅ 字段统一完成！现在可以正常使用举报功能了！** 🎉

**测试步骤：**
1. 上传两个云函数
2. 小程序提交一条举报
3. 管理后台查看数据
4. 测试处理功能

**如有问题，请检查云函数是否上传成功！** 🔧

