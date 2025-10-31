# 系统消息未显示问题 - 修复指南

## 🔍 问题描述

**现象**：管理端点击"隐藏并警告"后，帖子被隐藏了，但用户客户端系统消息列表中看不到警告消息。

**日志显示**：
```
16:48:42.314 [本地调试][clientDB请求]表名：botc-system-messages 
16:48:42.585 [本地调试][clientDB请求]表名：botc-system-messages，返回数据： {"code":0,"errCode":0,"message":"",...}
```

---

## ✅ 已修复的问题

### 问题1：`created_at` 字段类型不匹配

**原始代码**（`botc-admin/pages/botc/post/audit-list.vue` 第257行）：
```javascript
await db.collection('botc-system-messages').add({
  user_id: item.user_id,
  type: 'warning',
  title: '内容违规警告',
  content: `您发布的帖子...`,
  related_type: 'post',
  related_id: item._id,
  is_read: false,
  created_at: Date.now()  // ❌ 错误：数字类型，但schema要求timestamp
})
```

**修复后**：
```javascript
const messageData = {
  user_id: item.user_id,
  type: 'warning',
  title: '内容违规警告',
  content: `您发布的帖子...`,
  related_type: 'post',
  related_id: item._id,
  is_read: false
  // ✅ 删除 created_at，让数据库使用默认值 $env:now
}

const addRes = await db.collection('botc-system-messages').add(messageData)
console.log('系统消息发送结果:', addRes)
```

### 问题2：缺少调试日志

**修复**：添加了详细的调试日志，可以清楚看到：
- 目标用户ID
- 帖子内容
- 消息数据内容
- 发送结果

---

## 🧪 测试步骤

### 步骤1：重新测试管理端功能

1. 打开管理端（`http://localhost:9001` 或你的管理端地址）
2. 进入"帖子审核管理"
3. 找到一个状态为"正常"的帖子
4. 点击"隐藏"按钮
5. 在弹窗中选择"**隐藏并警告**"（确认按钮）
6. 观察控制台输出

**预期控制台输出**：
```
=== 准备发送系统消息 ===
目标用户ID: 65xxx...
帖子内容: 测试帖子内容...
消息数据: {user_id: "65xxx...", type: "warning", ...}
系统消息发送结果: {id: "673xxx...", ...}
✅ 系统消息发送成功，ID: 673xxx...
```

### 步骤2：验证数据库

1. 打开 uniCloud Web控制台
2. 进入"云数据库"
3. 打开 `botc-system-messages` 表
4. 查看是否有新增的记录

**应该看到**：
- `user_id`: 对应的用户ID
- `type`: "warning"
- `title`: "内容违规警告"
- `content`: 包含帖子内容的警告文本
- `is_read`: false
- `created_at`: 自动生成的时间戳

### 步骤3：验证客户端显示

1. 打开小程序
2. 使用**被警告的用户账号**登录
3. 进入"我的" → "系统消息"
4. 应该能看到刚发送的警告消息

**预期显示**：
```
⚠️ 内容违规警告              刚刚
您发布的帖子"测试帖子内容..."因违反社区规范已被隐藏。
请遵守社区规则，避免发布违规内容。
```

---

## 🔧 如果仍然看不到消息

### 检查1：确认用户ID匹配

**在管理端控制台**：
```
目标用户ID: 65abc123...
```

**在小程序控制台**（打开 `/pages/user/system-messages/list.vue`）：
```
=== 用户信息详情 ===
提取的userId: 65abc123...
```

**两者必须完全一致！**

### 检查2：验证数据库权限

1. 打开 uniCloud Web控制台
2. 云数据库 → `botc-system-messages`
3. 点击"表结构"
4. 查看"权限规则"

**应该是**：
```json
{
  "read": true,     // ✅ 必须为 true
  "create": false,
  "update": true,   // ✅ 必须为 true
  "delete": false
}
```

### 检查3：手动创建测试数据

在 uniCloud Web控制台，手动添加一条记录：

```json
{
  "user_id": "你的用户ID（从小程序控制台复制）",
  "type": "notice",
  "title": "测试消息",
  "content": "这是一条手动创建的测试消息",
  "related_type": "",
  "related_id": "",
  "is_read": false
}
```

**然后刷新小程序，看是否能显示这条消息**。

- ✅ **能显示**：说明客户端查询正常，问题在于管理端发送
- ❌ **不能显示**：说明客户端查询有问题，需要检查 `user_id` 是否匹配

---

## 📋 完整排查清单

- [ ] 管理端代码已更新（已删除手动设置的 `created_at`）
- [ ] 管理端控制台显示"系统消息发送成功"
- [ ] uniCloud数据库中能看到新增的消息记录
- [ ] 消息记录的 `user_id` 与客户端用户ID一致
- [ ] 数据库权限配置正确（read: true, update: true）
- [ ] 客户端能查询到手动创建的测试数据
- [ ] 客户端能查询到管理端发送的警告消息

---

## 🎯 核心要点总结

### 1. Schema 默认值机制

`botc-system-messages.schema.json` 中定义：
```json
"created_at": {
  "bsonType": "timestamp",
  "defaultValue": {"$env": "now"}  // ✅ 自动使用当前时间
}
```

**不要手动设置 `created_at`**，让数据库自动填充！

### 2. 用户ID必须完全匹配

```javascript
// 管理端发送时的 user_id
user_id: item.user_id

// 客户端查询时的 user_id
user_id: userInfo.uid || userInfo._id || userInfo.id
```

**确保两者一致！**

### 3. 时间戳类型说明

- ❌ `Date.now()` - 返回数字（毫秒）
- ❌ `new Date()` - 返回Date对象
- ✅ **不设置** - 让数据库使用 `$env:now` 默认值
- ✅ `db.serverDate()` - uniCloud专用时间戳（云函数中使用）

---

## 📞 如果问题仍未解决

请提供以下信息：

1. **管理端控制台完整日志**（从"准备发送系统消息"到"发送结果"）
2. **数据库截图**（`botc-system-messages` 表的记录）
3. **客户端控制台日志**（从"用户信息详情"到"查询结果"）
4. **user_id 对比**：
   - 管理端显示的目标用户ID
   - 客户端显示的当前用户ID
   - 数据库中消息记录的 user_id

---

**修复完成日期**：2024年10月29日  
**修复文件**：`botc-admin/pages/botc/post/audit-list.vue`  
**修复内容**：删除手动设置的 `created_at`，添加调试日志

