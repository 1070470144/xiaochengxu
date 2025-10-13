# 用户关注与私聊功能说明

## 📋 功能概述

本次更新实现了以下核心功能：
1. ✅ 用户关注/取消关注
2. ✅ 显示粉丝数和关注数
3. ✅ 私聊功能（发送消息、会话列表）

---

## 👥 一、用户关注功能

### 1.1 数据库设计

#### `botc-user-follows.schema.json` - 关注关系表
```json
{
  "follower_id": "关注者ID（粉丝）",
  "following_id": "被关注者ID",
  "status": "状态：0-已取消 1-已关注",
  "created_at": "关注时间"
}
```

#### `uni-id-users` - 用户扩展字段
需要手动添加两个字段（在 uniCloud Web 控制台）：
- `followers_count` (Number) - 粉丝数
- `following_count` (Number) - 关注数

### 1.2 云函数

#### `user-follow` - 关注/取消关注

**请求参数：**
```javascript
{
  target_user_id: "目标用户ID",
  action: "follow|unfollow",  // follow-关注 unfollow-取消关注
  token: "用户token"
}
```

**功能：**
1. 创建/删除关注记录
2. 自动更新双方的粉丝数和关注数
3. 防止重复关注
4. 防止自己关注自己

**返回结果：**
```javascript
{
  code: 0,
  message: "关注成功",
  data: {
    is_following: true
  }
}
```

---

## 💬 二、私聊功能

### 2.1 数据库设计

#### `botc-chat-conversations.schema.json` - 会话表
```json
{
  "user1_id": "用户1 ID",
  "user2_id": "用户2 ID",
  "last_message": "最后一条消息内容",
  "last_message_time": "最后一条消息时间",
  "user1_unread_count": "用户1未读消息数",
  "user2_unread_count": "用户2未读消息数",
  "created_at": "创建时间",
  "updated_at": "更新时间"
}
```

#### `botc-chat-messages.schema.json` - 消息表
```json
{
  "conversation_id": "会话ID",
  "sender_id": "发送者ID",
  "receiver_id": "接收者ID",
  "content": "消息内容",
  "message_type": "消息类型：1-文本 2-图片 3-语音",
  "is_read": "是否已读",
  "created_at": "发送时间"
}
```

### 2.2 云函数

#### `chat-send-message` - 发送消息

**请求参数：**
```javascript
{
  receiver_id: "接收者ID",
  content: "消息内容",
  message_type: 1,  // 1-文本
  token: "用户token"
}
```

**功能：**
1. 自动创建或查找会话
2. 创建消息记录
3. 更新会话最后消息
4. 更新接收方未读数

**返回结果：**
```javascript
{
  code: 0,
  message: "发送成功",
  data: {
    message_id: "消息ID",
    conversation_id: "会话ID",
    created_at: "发送时间"
  }
}
```

#### `chat-conversation-list` - 获取会话列表

**请求参数：**
```javascript
{
  page: 1,
  page_size: 20,
  token: "用户token"
}
```

**功能：**
1. 获取当前用户的所有会话
2. 按最后消息时间排序
3. 返回对方用户信息
4. 返回未读消息数

**返回结果：**
```javascript
{
  code: 0,
  message: "获取成功",
  data: {
    list: [
      {
        conversation_id: "会话ID",
        other_user: {
          _id: "用户ID",
          nickname: "昵称",
          avatar: "头像"
        },
        last_message: "最后一条消息",
        last_message_time: "时间",
        unread_count: 3
      }
    ],
    total: 10,
    page: 1,
    page_size: 20
  }
}
```

---

## 🎨 三、前端集成

### 3.1 用户中心修改

#### `pages/user/profile/profile.vue`

**新增统计项：**
- 粉丝数（点击查看粉丝列表）
- 关注数（点击查看关注列表）
- 私聊数（点击进入私聊列表）

**UI展示：**
```vue
<view class="stats-grid">
  <view class="stat-item" @click="goToFollowers">
    <view class="stat-icon">👥</view>
    <text class="stat-number">{{ userInfo.followers_count || 0 }}</text>
    <text class="stat-label">粉丝</text>
  </view>
  <view class="stat-item" @click="goToFollowing">
    <view class="stat-icon">➕</view>
    <text class="stat-number">{{ userInfo.following_count || 0 }}</text>
    <text class="stat-label">关注</text>
  </view>
  <view class="stat-item" @click="goToChatList">
    <view class="stat-icon">💬</view>
    <text class="stat-number">{{ userStats.chatCount || 0 }}</text>
    <text class="stat-label">私聊</text>
  </view>
</view>
```

### 3.2 云函数更新

#### `user-stats` - 新增私聊数统计
```javascript
// 私聊会话数
db.collection('botc-chat-conversations').where(
  db.command.or([
    { user1_id: userId },
    { user2_id: userId }
  ])
).count()
```

---

## 🚀 使用场景

### 场景1：用户A关注用户B

```javascript
// 调用关注云函数
uniCloud.callFunction({
  name: 'user-follow',
  data: {
    target_user_id: 'user_b_id',
    action: 'follow',
    token: Auth.getToken()
  }
})

// 结果：
// - user_a.following_count + 1
// - user_b.followers_count + 1
// - 创建关注记录
```

### 场景2：用户A给用户B发私信

```javascript
// 调用发送消息云函数
uniCloud.callFunction({
  name: 'chat-send-message',
  data: {
    receiver_id: 'user_b_id',
    content: '你好！',
    token: Auth.getToken()
  }
})

// 结果：
// - 创建或查找会话
// - 创建消息记录
// - user_b 未读数 + 1
// - 更新会话最后消息
```

### 场景3：查看私聊列表

```javascript
// 调用获取会话列表云函数
uniCloud.callFunction({
  name: 'chat-conversation-list',
  data: {
    page: 1,
    page_size: 20,
    token: Auth.getToken()
  }
})

// 返回：
// - 所有会话列表
// - 对方用户信息
// - 最后一条消息
// - 未读消息数
```

---

## 📐 数据库关系图

```
uni-id-users (用户表)
├── followers_count: 粉丝数
└── following_count: 关注数
    ↑
    |
botc-user-follows (关注关系表)
├── follower_id ────→ uni-id-users._id
├── following_id ───→ uni-id-users._id
└── status: 0|1

botc-chat-conversations (会话表)
├── user1_id ───────→ uni-id-users._id
├── user2_id ───────→ uni-id-users._id
├── user1_unread_count
└── user2_unread_count
    ↓
botc-chat-messages (消息表)
├── conversation_id ─→ botc-chat-conversations._id
├── sender_id ──────→ uni-id-users._id
├── receiver_id ────→ uni-id-users._id
└── is_read: boolean
```

---

## ⚠️ 注意事项

### 1. 数据库权限

确保以下权限配置正确：

```json
// botc-user-follows.schema.json
"permission": {
  "read": true,
  "create": "auth.uid != null",
  "update": false,
  "delete": "doc.follower_id == auth.uid"
}

// botc-chat-conversations.schema.json
"permission": {
  "read": "doc.user1_id == auth.uid || doc.user2_id == auth.uid",
  "create": "auth.uid != null",
  "update": "doc.user1_id == auth.uid || doc.user2_id == auth.uid",
  "delete": false
}

// botc-chat-messages.schema.json
"permission": {
  "read": "doc.sender_id == auth.uid || doc.receiver_id == auth.uid",
  "create": "auth.uid != null && doc.sender_id == auth.uid",
  "update": false,
  "delete": false
}
```

### 2. 扩展用户表字段

**在 uniCloud Web 控制台手动添加：**

1. 进入 uniCloud Web 控制台
2. 选择数据库 → `uni-id-users`
3. 点击"添加字段"
4. 添加以下字段：
   - `followers_count` (Number, 默认值 0)
   - `following_count` (Number, 默认值 0)

### 3. 上传到云端

**必须上传：**
1. ✅ Schema 文件（3个）
   - `botc-user-follows.schema.json`
   - `botc-chat-conversations.schema.json`
   - `botc-chat-messages.schema.json`
2. ✅ 云函数（3个）
   - `user-follow`
   - `chat-send-message`
   - `chat-conversation-list`
   - `user-stats`（已修改）
3. ✅ 前端页面
   - `pages/user/profile/profile.vue`（已修改）

### 4. 测试流程

```
1. 上传 Schema 文件
2. 上传云函数
3. 在 uniCloud Web 控制台添加用户表字段
4. 刷新前端页面
5. 测试关注功能
6. 测试私聊功能
```

---

## 🔮 待完善功能

### 1. 粉丝列表页面（开发中）
- 显示所有粉丝
- 支持关注回粉
- 支持查看粉丝详情

### 2. 关注列表页面（开发中）
- 显示所有关注的用户
- 支持取消关注
- 支持私聊

### 3. 私聊页面（待开发）
- 聊天对话界面
- 消息发送与接收
- 消息已读状态
- 图片消息支持
- 实时消息推送

### 4. 未读消息红点
- TabBar 显示未读数
- 会话列表显示未读数
- 消息阅读后清除未读

---

## 📊 性能优化建议

### 1. 数据库索引

创建以下索引以提升查询性能：

```javascript
// botc-user-follows
{ follower_id: 1, following_id: 1, status: 1 }

// botc-chat-conversations
{ user1_id: 1, user2_id: 1 }
{ last_message_time: -1 }

// botc-chat-messages
{ conversation_id: 1, created_at: -1 }
{ sender_id: 1, receiver_id: 1 }
```

### 2. 查询优化

- 使用分页加载
- 限制返回字段
- 合理使用缓存

### 3. 实时通信

后续可集成：
- uniCloud 云函数URL化
- WebSocket
- 长轮询

---

## ✅ 完成清单

- [x] 创建用户关注关系表
- [x] 修改 uni-id-users 扩展字段
- [x] 创建关注/取消关注云函数
- [x] 创建私聊会话表
- [x] 创建私聊消息表
- [x] 创建私聊相关云函数
- [x] 修改用户中心，显示粉丝数和关注数
- [ ] 创建私聊页面（待开发）
- [ ] 创建粉丝列表页面（待开发）
- [ ] 创建关注列表页面（待开发）

---

**更新时间：** 2025-10-11
**版本：** v1.0.0

