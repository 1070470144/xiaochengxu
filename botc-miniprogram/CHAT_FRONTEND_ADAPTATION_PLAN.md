# 💬 Chat 前端页面适配计划

## 📋 需要适配的页面

找到了 4 个使用 Chat 云函数的页面：

| # | 页面 | 文件路径 | 使用的云函数 | 优先级 |
|---|------|---------|-------------|--------|
| 1 | 聊天详情页 | `pages/chat/detail/detail.vue` | chat-send-message, chat-mark-read | ⭐⭐⭐ |
| 2 | 聊天列表页 | `pages/chat/list/list.vue` | chat-conversation-list | ⭐⭐⭐ |
| 3 | 社区聊天列表 | `pages/community/chat/list/list.vue` | chat-conversations | ⭐⭐ |
| 4 | 他人资料页 | `pages/user/other-profile/other-profile.vue` | （可能发起聊天） | ⭐ |

---

## 🔄 云函数映射关系

| 旧云函数 | 新云对象方法 | 参数变化 |
|---------|------------|---------|
| `chat-send-message` | `chatObj.sendMessage(receiverId, content, messageType)` | 简化，不需要传 token |
| `chat-conversation-list` | `chatObj.getConversations(page, pageSize)` | 简化 |
| `chat-conversations` | `chatObj.getConversations(page, pageSize)` | 简化，旧版本已废弃 |
| `chat-mark-read` | `chatObj.markRead(userId, conversationId)` | 简化 |
| - | `chatObj.getMessages(userId, page, pageSize)` | 新增 |

---

## 📝 详细适配方案

### 1. 聊天详情页 (`pages/chat/detail/detail.vue`) ⭐⭐⭐

**当前使用的云函数：**
- `chat-send-message` - 发送消息
- `chat-mark-read` - 标记已读

**需要的新功能：**
- `chatObj.getMessages()` - 获取聊天记录

**适配步骤：**

#### 1.1 在 onLoad 中添加云对象导入
```javascript
onLoad(options) {
  // 初始化 chat 云对象
  this.chatObj = uniCloud.importObject('chat', {
    customUI: true
  })
  
  // 原有代码...
}
```

#### 1.2 替换发送消息
```javascript
// 旧方式
const result = await uniCloud.callFunction({
  name: 'chat-send-message',
  data: {
    receiver_id: this.userId,
    content: content,
    message_type: 1,
    token: this.token
  }
})

// 新方式
const result = await this.chatObj.sendMessage(
  this.userId,      // receiverId
  content,          // content
  1                 // messageType
)
```

#### 1.3 替换标记已读
```javascript
// 旧方式
const result = await uniCloud.callFunction({
  name: 'chat-mark-read',
  data: {
    user_id: this.userId,
    conversation_id: this.conversationId,
    token: this.token
  }
})

// 新方式
const result = await this.chatObj.markRead(
  this.userId,           // userId
  this.conversationId    // conversationId (可选)
)
```

#### 1.4 加载聊天记录（新增）
```javascript
// 新增功能：使用 getMessages 获取聊天记录
async loadMessages() {
  try {
    const result = await this.chatObj.getMessages(
      this.userId,    // 对方用户ID
      this.page,      // 页码
      50              // 每页数量
    )
    
    if (result.code === 0) {
      this.messages = result.data.list
      this.conversationId = result.data.conversation_id
    }
  } catch (error) {
    console.error('加载消息失败：', error)
  }
}
```

#### 1.5 调整返回数据访问
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

### 2. 聊天列表页 (`pages/chat/list/list.vue`) ⭐⭐⭐

**当前使用的云函数：**
- `chat-conversation-list` - 获取会话列表

**适配步骤：**

#### 2.1 在 onLoad 中添加云对象导入
```javascript
onLoad() {
  // 初始化 chat 云对象
  this.chatObj = uniCloud.importObject('chat', {
    customUI: true
  })
  
  this.loadConversations()
}
```

#### 2.2 替换获取会话列表
```javascript
// 旧方式
const result = await uniCloud.callFunction({
  name: 'chat-conversation-list',
  data: {
    page: this.page,
    page_size: this.pageSize,
    token: this.token
  }
})

// 新方式
const result = await this.chatObj.getConversations(
  this.page,
  this.pageSize
)
```

#### 2.3 调整返回数据访问
```javascript
// 旧方式
if (result.result.code === 0) {
  this.conversations = result.result.data.list
  this.total = result.result.data.total
}

// 新方式
if (result.code === 0) {
  this.conversations = result.data.list
  this.total = result.data.total
  this.hasNext = result.data.hasNext
}
```

#### 2.4 可选：添加未读总数显示
```javascript
async getUnreadCount() {
  try {
    const result = await this.chatObj.getUnreadCount()
    
    if (result.code === 0) {
      this.totalUnread = result.data.total_unread
      // 更新 tabBar 角标
      if (this.totalUnread > 0) {
        uni.setTabBarBadge({
          index: 2, // 假设聊天在第3个tab
          text: String(this.totalUnread)
        })
      } else {
        uni.removeTabBarBadge({ index: 2 })
      }
    }
  } catch (error) {
    console.error('获取未读数失败：', error)
  }
}
```

---

### 3. 社区聊天列表 (`pages/community/chat/list/list.vue`) ⭐⭐

**当前使用的云函数：**
- `chat-conversations` - 旧版本会话列表（使用聚合查询）

**适配步骤：**

#### 3.1 在 onLoad 中添加云对象导入
```javascript
onLoad() {
  // 初始化 chat 云对象
  this.chatObj = uniCloud.importObject('chat', {
    customUI: true
  })
  
  this.loadConversations()
}
```

#### 3.2 替换获取会话列表
```javascript
// 旧方式（使用旧版云函数）
const result = await uniCloud.callFunction({
  name: 'chat-conversations'
})

// 新方式（使用新云对象）
const result = await this.chatObj.getConversations(1, 20)
```

#### 3.3 调整返回数据访问
```javascript
// 旧方式
if (result.result.code === 0) {
  this.conversations = result.result.data.list
}

// 新方式
if (result.code === 0) {
  this.conversations = result.data.list
}
```

---

### 4. 他人资料页 (`pages/user/other-profile/other-profile.vue`) ⭐

**功能：** 可能包含"发起聊天"按钮

**适配步骤：**

检查是否有发起聊天的功能，如果有：

#### 4.1 添加云对象导入
```javascript
onLoad() {
  // 初始化 chat 云对象
  this.chatObj = uniCloud.importObject('chat', {
    customUI: true
  })
}
```

#### 4.2 实现发起聊天功能
```javascript
// 跳转到聊天详情页
goToChat() {
  uni.navigateTo({
    url: `/pages/chat/detail/detail?userId=${this.userId}`
  })
}
```

**注意：** 这个页面可能不需要直接调用 chat 云对象，只需要跳转即可。

---

## 🎯 适配顺序建议

建议按照以下顺序进行适配：

1. **✅ 聊天列表页** - 最简单，只有一个云函数
2. **✅ 聊天详情页** - 核心功能，包含发送和标记已读
3. **✅ 社区聊天列表** - 类似聊天列表页
4. **✅ 他人资料页** - 检查是否需要适配

---

## 📊 预计工作量

| 页面 | 预计时间 | 难度 |
|-----|---------|------|
| 聊天列表页 | 15分钟 | ⭐ 简单 |
| 聊天详情页 | 25分钟 | ⭐⭐ 中等 |
| 社区聊天列表 | 10分钟 | ⭐ 简单 |
| 他人资料页 | 5分钟 | ⭐ 简单 |
| **总计** | **55分钟** | |

---

## ⚠️ 注意事项

### 1. 数据字段兼容性

**问题：** 旧消息可能使用 `from_user_id`/`to_user_id`，新消息使用 `sender_id`/`receiver_id`

**解决方案：**
- 云对象已经统一使用新字段
- 前端显示时做兼容处理：
```javascript
const senderId = message.sender_id || message.from_user_id
const receiverId = message.receiver_id || message.to_user_id
```

### 2. 会话ID的获取

**问题：** 旧版本可能没有 `conversation_id`

**解决方案：**
- 使用 `getMessages` 方法时，会自动创建或返回 `conversation_id`
- 存储 `conversation_id` 供后续使用（标记已读、删除会话）

### 3. 未读数的更新时机

**建议的更新时机：**
- 进入聊天列表页时更新
- 发送消息后更新
- 标记已读后更新
- 接收到新消息时更新（需要推送）

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

## 🚀 部署步骤

### 适配完成后：

1. **测试所有页面**
   - [ ] 聊天列表加载正常
   - [ ] 发送消息正常
   - [ ] 接收消息正常
   - [ ] 标记已读正常
   - [ ] 未读数显示正常

2. **删除旧云函数**（确认无误后）
   - [ ] `chat-send`
   - [ ] `chat-send-message`
   - [ ] `chat-conversations`
   - [ ] `chat-conversation-list`
   - [ ] `chat-mark-read`

3. **创建适配完成文档**
   - [ ] 记录适配的页面
   - [ ] 记录测试结果
   - [ ] 更新项目文档

---

## 📚 相关文档

- **云对象文档：** `CHAT_CLOUD_OBJECT_COMPLETE.md`
- **测试指南：** `CHAT_TEST_GUIDE.md`
- **项目进度：** `CLOUD_OBJECT_MIGRATION_PROGRESS.md`

---

_创建时间：2025-11-04_  
_状态：准备开始_  
_预计完成时间：1 小时_

