# 💬 Chat 云对象开发计划

## 📋 现状分析

### 当前云函数列表（5个）

| # | 云函数名 | 功能描述 | 主要功能 |
|---|---------|---------|---------|
| 1 | `chat-send` | 发送私聊消息（旧） | 简单消息发送，无会话管理 |
| 2 | `chat-send-message` | 发送私聊消息（新） | 完整消息发送，包含会话创建和更新 |
| 3 | `chat-conversations` | 获取聊天会话列表（旧） | 使用聚合查询获取会话 |
| 4 | `chat-conversation-list` | 获取会话列表（新） | 基于会话表查询 |
| 5 | `chat-mark-read` | 标记消息为已读 | 更新消息和会话的已读状态 |

### 数据库表结构

#### 1. botc-chat-messages（消息表）
- `_id` - 消息ID
- `conversation_id` - 会话ID（新版本）
- `from_user_id` / `sender_id` - 发送者ID
- `to_user_id` / `receiver_id` - 接收者ID
- `content` - 消息内容
- `message_type` - 消息类型（1-文本）
- `media_url` - 媒体URL
- `is_read` - 是否已读
- `created_at` - 创建时间

#### 2. botc-chat-conversations（会话表）
- `_id` - 会话ID
- `user1_id` - 用户1 ID
- `user2_id` - 用户2 ID
- `last_message` - 最后一条消息内容
- `last_message_time` - 最后消息时间
- `user1_unread_count` - 用户1未读数
- `user2_unread_count` - 用户2未读数
- `created_at` - 创建时间
- `updated_at` - 更新时间

---

## 🎯 云对象设计

### Chat 云对象方法列表

| # | 方法名 | 功能 | 参数 | 替换云函数 |
|---|--------|------|------|-----------|
| 1 | `sendMessage(receiverId, content, messageType)` | 发送消息 | receiverId, content, messageType | chat-send-message |
| 2 | `getConversations(page, pageSize)` | 获取会话列表 | page, pageSize | chat-conversation-list |
| 3 | `getMessages(userId, page, pageSize)` | 获取聊天消息 | userId, page, pageSize | 新增 |
| 4 | `markRead(userId, conversationId)` | 标记已读 | userId, conversationId | chat-mark-read |
| 5 | `deleteConversation(conversationId)` | 删除会话 | conversationId | 新增 |
| 6 | `getUnreadCount()` | 获取未读总数 | 无 | 新增 |

---

## 🔄 功能映射

### 1. sendMessage() - 发送消息

**替换云函数：** `chat-send-message`

**功能：**
- 查找或创建会话
- 创建消息记录
- 更新会话信息（最后消息、未读数）

**参数：**
```javascript
{
  receiverId: String,    // 接收者ID
  content: String,       // 消息内容
  messageType: Number    // 消息类型，默认1（文本）
}
```

**返回：**
```javascript
{
  code: 0,
  message: '发送成功',
  data: {
    message_id: String,
    conversation_id: String,
    created_at: Date
  }
}
```

---

### 2. getConversations() - 获取会话列表

**替换云函数：** `chat-conversation-list`

**功能：**
- 获取当前用户的所有会话
- 关联对方用户信息
- 计算未读数量
- 分页支持

**参数：**
```javascript
{
  page: Number,       // 页码，默认1
  pageSize: Number    // 每页数量，默认20
}
```

**返回：**
```javascript
{
  code: 0,
  message: '获取成功',
  data: {
    list: [
      {
        conversation_id: String,
        other_user: {
          _id: String,
          nickname: String,
          avatar: String
        },
        last_message: String,
        last_message_time: Date,
        unread_count: Number
      }
    ],
    total: Number,
    page: Number,
    page_size: Number,
    hasNext: Boolean
  }
}
```

---

### 3. getMessages() - 获取聊天消息（新增）

**功能：**
- 获取与指定用户的聊天记录
- 分页加载
- 按时间倒序

**参数：**
```javascript
{
  userId: String,      // 对方用户ID
  page: Number,        // 页码，默认1
  pageSize: Number     // 每页数量，默认50
}
```

**返回：**
```javascript
{
  code: 0,
  message: '获取成功',
  data: {
    list: [
      {
        message_id: String,
        sender_id: String,
        receiver_id: String,
        content: String,
        message_type: Number,
        is_read: Boolean,
        created_at: Date,
        is_mine: Boolean  // 是否是我发送的
      }
    ],
    conversation_id: String,
    total: Number,
    hasNext: Boolean
  }
}
```

---

### 4. markRead() - 标记已读

**替换云函数：** `chat-mark-read`

**功能：**
- 标记消息为已读
- 更新会话未读数

**参数：**
```javascript
{
  userId: String,           // 对方用户ID
  conversationId: String    // 会话ID（可选）
}
```

**返回：**
```javascript
{
  code: 0,
  message: '标记成功',
  data: {
    conversation_id: String,
    marked_count: Number
  }
}
```

---

### 5. deleteConversation() - 删除会话（新增）

**功能：**
- 软删除会话（只对当前用户隐藏）
- 保留消息记录

**参数：**
```javascript
{
  conversationId: String    // 会话ID
}
```

**返回：**
```javascript
{
  code: 0,
  message: '删除成功',
  data: {
    conversation_id: String
  }
}
```

---

### 6. getUnreadCount() - 获取未读总数（新增）

**功能：**
- 获取当前用户所有会话的未读消息总数

**参数：** 无

**返回：**
```javascript
{
  code: 0,
  message: '获取成功',
  data: {
    total_unread: Number
  }
}
```

---

## 🔧 工具函数

### 外部工具函数（在 module.exports 之外）

```javascript
// 解析用户ID
function parseUserId(token) {
  if (!token) return null
  const parts = token.split('_')
  return parts[0] || null
}

// 验证认证
function checkAuth(userId) {
  if (!userId) {
    throw new Error('未登录或token无效')
  }
}

// 统一成功返回
function returnSuccess(data = null, message = 'success') {
  return {
    code: 0,
    message,
    data
  }
}

// 统一错误返回
function returnError(code, message) {
  return {
    code,
    message,
    data: null
  }
}

// 查找或创建会话
async function findOrCreateConversation(db, user1Id, user2Id) {
  const collection = db.collection('botc-chat-conversations')
  const dbCmd = db.command
  
  // 查找现有会话
  const result = await collection
    .where(dbCmd.or([
      { user1_id: user1Id, user2_id: user2Id },
      { user1_id: user2Id, user2_id: user1Id }
    ]))
    .get()
  
  if (result.data && result.data.length > 0) {
    return result.data[0]
  }
  
  // 创建新会话
  const now = new Date()
  const newResult = await collection.add({
    user1_id: user1Id,
    user2_id: user2Id,
    last_message: '',
    last_message_time: now,
    user1_unread_count: 0,
    user2_unread_count: 0,
    created_at: now,
    updated_at: now
  })
  
  return {
    _id: newResult.id,
    user1_id: user1Id,
    user2_id: user2Id,
    user1_unread_count: 0,
    user2_unread_count: 0
  }
}
```

---

## 📊 数据流程

### 发送消息流程

```
1. 用户发送消息
   ↓
2. 验证认证
   ↓
3. 验证参数（接收者、内容）
   ↓
4. 查找或创建会话
   ↓
5. 创建消息记录
   ↓
6. 更新会话信息
   - 最后消息
   - 最后消息时间
   - 接收方未读数 +1
   ↓
7. 返回成功
```

### 标记已读流程

```
1. 用户打开聊天
   ↓
2. 验证认证
   ↓
3. 查找会话
   ↓
4. 更新消息 is_read = true
   ↓
5. 更新会话未读数 = 0
   ↓
6. 返回成功
```

---

## 🎯 前端适配

### 需要适配的页面（预估）

| # | 页面 | 功能 | 优先级 |
|---|------|------|--------|
| 1 | 聊天列表页 | 显示所有会话 | ⭐⭐⭐ |
| 2 | 聊天详情页 | 显示与某人的聊天记录 | ⭐⭐⭐ |
| 3 | 个人资料页 | 发起私聊按钮 | ⭐⭐ |

### 调用方式变化

**旧方式：**
```javascript
const result = await uniCloud.callFunction({
  name: 'chat-send-message',
  data: {
    token: token,
    receiver_id: userId,
    content: message
  }
})
```

**新方式：**
```javascript
const chatObj = uniCloud.importObject('chat', { customUI: true })
const result = await chatObj.sendMessage(userId, message)
```

---

## ⚠️ 注意事项

### 1. 数据兼容性

**问题：** 旧版本使用 `from_user_id`/`to_user_id`，新版本使用 `sender_id`/`receiver_id`

**解决方案：**
- 云对象统一使用新字段名
- 前端适配时统一使用新字段
- 数据库中可能存在两种字段名，需要兼容处理

### 2. 会话表

**问题：** 旧版本（chat-conversations）可能没有使用会话表

**解决方案：**
- 使用 `findOrCreateConversation` 函数统一处理
- 自动为旧消息创建会话记录

### 3. 实时推送

**限制：** uniCloud 不直接支持 WebSocket

**建议：**
- 使用 uni-push 进行消息推送
- 前端轮询或长轮询
- 考虑集成第三方 IM SDK

---

## 📝 开发步骤

### Phase 1: 核心功能（3个方法）
1. ✅ `sendMessage()` - 发送消息
2. ✅ `getConversations()` - 获取会话列表
3. ✅ `markRead()` - 标记已读

### Phase 2: 扩展功能（3个方法）
4. ✅ `getMessages()` - 获取聊天消息
5. ✅ `deleteConversation()` - 删除会话
6. ✅ `getUnreadCount()` - 获取未读总数

### Phase 3: 前端适配
7. ⏸ 适配聊天列表页
8. ⏸ 适配聊天详情页
9. ⏸ 适配相关功能页面

### Phase 4: 测试和优化
10. ⏸ 创建测试页面
11. ⏸ 功能测试
12. ⏸ 性能优化

---

## ✅ 预期成果

### 云对象完成后：
- ✅ 6 个云对象方法全部实现
- ✅ 统一的认证和错误处理
- ✅ 完善的数据验证
- ✅ 清晰的代码结构

### 前端适配后：
- ✅ 所有聊天相关页面迁移完成
- ✅ 调用方式统一为云对象
- ✅ 功能测试通过

### 清理后：
- ✅ 删除 5 个旧云函数
- ✅ 代码库更简洁

---

_创建时间：2025-11-04_  
_状态：准备开始_  
_预计完成时间：2-3 小时_

