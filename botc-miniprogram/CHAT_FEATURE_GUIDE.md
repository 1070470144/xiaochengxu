# 私聊功能使用指南

## 功能概述

本次更新实现了完整的私聊功能，用户可以：
1. 点击任何用户的头像或昵称发起私聊
2. 查看私聊列表
3. 进入私聊页面进行一对一对话
4. 实时收发消息（3秒自动刷新）

## 新增文件

### 前端页面

#### 1. 私聊列表页 `pages/chat/list/list.vue`
- 显示所有私聊会话
- 显示对方用户头像、昵称、最后一条消息
- 显示未读消息数量（红色角标）
- 支持下拉刷新和上拉加载更多
- 点击会话进入聊天页面

**主要功能**：
- `loadConversations()` - 加载会话列表
- `refreshList()` - 刷新列表
- `goToChat()` - 进入聊天页面
- `formatTime()` - 智能时间显示（刚刚/分钟前/小时前/昨天/日期）

#### 2. 私聊对话页 `pages/chat/detail/detail.vue`
- 显示与特定用户的聊天记录
- 发送文本消息（最多1000字）
- 自动刷新新消息（3秒间隔）
- 自动滚动到最新消息
- 显示发送状态（发送中/已发送）

**主要功能**：
- `loadOtherUserInfo()` - 加载对方用户信息
- `loadMessages()` - 加载聊天记录
- `sendMessage()` - 发送消息
- `startAutoRefresh()` - 启动自动刷新
- `refreshMessages()` - 静默刷新新消息

### 工具类

#### `utils/user-action.js` - 用户交互工具类

提供统一的用户点击处理逻辑：

1. **showUserMenu(userId, userInfo)** - 显示用户操作菜单
   - 发私信
   - 查看主页（开发中）
   - 关注TA

2. **goToChat(userId, userInfo)** - 直接发起私聊
   - 自动检查登录状态
   - 跳转到私聊页面

3. **followUser(userId)** - 关注用户
   - 调用 `user-follow` 云函数
   - 显示操作结果

4. **onLongPressUser(userId, userInfo)** - 长按用户触发（可选）
   - 震动反馈
   - 显示操作菜单

## 已修改文件

### 1. `pages.json`
注册了两个新页面：
```json
{
  "path": "pages/chat/list/list",
  "style": {
    "navigationBarTitleText": "私聊",
    "enablePullDownRefresh": true
  }
},
{
  "path": "pages/chat/detail/detail",
  "style": {
    "navigationBarTitleText": "私聊"
  }
}
```

### 2. 剧本详情页 `pages/script/detail/detail.vue`

**修改内容**：
- 导入 `UserAction` 工具类
- 评论区用户名添加点击事件：`@click="handleUserClick(comment.user_id, comment.user)"`
- 相关帖子区用户名添加点击事件：`@click.stop="handleUserClick(post.user_id, post.user)"`
- 添加 `handleUserClick()` 方法
- 添加 `.clickable` 样式类

### 3. 帖子列表页 `pages/community/list/list.vue`

**修改内容**：
- 导入 `UserAction` 工具类
- 头像添加点击事件：`@click.stop="handleUserClick(post.user_id, post.user)"`
- 用户信息区添加点击事件：`@click.stop="handleUserClick(post.user_id, post.user)"`
- 昵称添加 `clickable` 样式类
- 添加 `handleUserClick()` 方法
- 添加 `.clickable` 样式类

### 4. 帖子详情页 `pages/community/detail/detail.vue`

**修改内容**：
- 导入 `UserAction` 工具类
- 帖子作者头像和昵称添加点击事件
- 评论区用户头像和昵称添加点击事件
- 添加 `handleUserClick()` 方法
- 添加 `.clickable` 样式类

### 5. 用户中心 `pages/user/profile/profile.vue`

**已有功能**：
- 统计数据中包含"私聊"数量（`chatCount`）
- 点击"私聊"跳转到 `pages/chat/list/list`

## 使用方法

### 1. 发起私聊

在以下场景中，点击用户头像或昵称即可发起私聊：

#### 场景1：剧本评论区
```
pages/script/detail/detail.vue
↓ 点击评论者昵称
↓ 弹出操作菜单
↓ 选择"发私信"
↓ 跳转到私聊页面
```

#### 场景2：帖子列表
```
pages/community/list/list.vue
↓ 点击帖子作者头像/昵称
↓ 弹出操作菜单
↓ 选择"发私信"
↓ 跳转到私聊页面
```

#### 场景3：帖子详情
```
pages/community/detail/detail.vue
↓ 点击帖子作者或评论者头像/昵称
↓ 弹出操作菜单
↓ 选择"发私信"
↓ 跳转到私聊页面
```

#### 场景4：用户中心
```
pages/user/profile/profile.vue
↓ 点击"私聊"统计卡片
↓ 直接进入私聊列表
```

### 2. 查看私聊列表

**入口**：
- 用户中心 → 统计数据 → "私聊"（显示会话数量）

**功能**：
- 显示所有会话，按最后消息时间排序
- 显示未读消息数（红色角标）
- 下拉刷新最新会话
- 上拉加载更多会话

### 3. 聊天对话

**功能**：
- 查看历史消息
- 发送文本消息（最多1000字）
- 自动接收新消息（每3秒刷新）
- 消息自动滚动到底部
- 左侧显示对方消息（白色气泡）
- 右侧显示自己消息（棕色渐变气泡）

**操作**：
1. 在输入框输入消息
2. 点击"发送"按钮
3. 发送成功后自动清空输入框
4. 消息立即显示在聊天记录中

## 云函数使用

本功能使用了以下现有云函数：

### 1. `chat-conversation-list`
获取私聊会话列表

**请求参数**：
```javascript
{
  page: 1,
  page_size: 20,
  token: 'user_token'
}
```

**返回数据**：
```javascript
{
  code: 0,
  message: 'success',
  data: {
    list: [
      {
        conversation_id: 'user1_id-user2_id',
        other_user: {
          _id: 'user_id',
          nickname: '用户昵称',
          avatar: 'avatar_url'
        },
        last_message: '最后一条消息',
        last_message_time: timestamp,
        unread_count: 5
      }
    ],
    total: 10
  }
}
```

### 2. `chat-send-message`
发送私聊消息

**请求参数**：
```javascript
{
  receiver_id: 'target_user_id',
  content: '消息内容',
  message_type: 1, // 1-文本 2-图片 3-语音
  token: 'user_token'
}
```

**返回数据**：
```javascript
{
  code: 0,
  message: '消息发送成功',
  data: {
    message_id: 'message_id',
    conversation_id: 'conversation_id',
    created_at: timestamp
  }
}
```

### 3. `user-follow`
关注/取消关注用户

**请求参数**：
```javascript
{
  target_user_id: 'user_id',
  action: 'follow', // 'follow' 或 'unfollow'
  token: 'user_token'
}
```

## 数据库集合

### 1. `botc-chat-conversations` - 会话表
存储私聊会话信息：
- `_id`: 会话ID（user1_id-user2_id，按字典序）
- `user1_id`: 用户1 ID
- `user2_id`: 用户2 ID
- `last_message_content`: 最后一条消息
- `last_message_time`: 最后消息时间
- `user1_unread_count`: 用户1未读数
- `user2_unread_count`: 用户2未读数

### 2. `botc-chat-messages` - 消息表
存储所有私聊消息：
- `_id`: 消息ID
- `conversation_id`: 所属会话ID
- `sender_id`: 发送者ID
- `receiver_id`: 接收者ID
- `content`: 消息内容
- `message_type`: 消息类型（1-文本）
- `is_read`: 是否已读
- `created_at`: 发送时间

### 3. `botc-user-follows` - 关注关系表
存储用户关注关系：
- `_id`: 关注ID（follower_id-following_id）
- `follower_id`: 关注者ID
- `following_id`: 被关注者ID
- `created_at`: 关注时间

## 样式特点

### 1. 私聊列表
- 白色背景，清晰分隔线
- 圆形头像（100rpx）
- 未读角标（红色，右上角）
- 智能时间显示
- 点击反馈（按下变灰）

### 2. 聊天页面
- 浅灰背景（#f5f5f5）
- 对方消息：左侧，白色气泡
- 自己消息：右侧，棕色渐变气泡
- 圆形小头像（80rpx）
- 输入框：灰色背景，圆角
- 发送按钮：渐变背景，激活状态

### 3. 可点击元素
```css
.clickable {
  cursor: pointer;
  transition: opacity 0.3s;
}

.clickable:active {
  opacity: 0.6; /* 按下时半透明反馈 */
}
```

## 权限控制

### 自动登录检查
- 发起私聊前检查登录状态
- 未登录自动跳转到登录页
- 登录后返回原页面

### 安全验证
- 不能给自己发消息
- 不能关注自己
- 所有云函数调用都需要 token 验证

## 注意事项

### 1. 消息刷新机制
- 聊天页面每3秒自动刷新新消息
- 只获取最后一条消息时间之后的新消息
- 避免重复加载，提高性能

### 2. 会话ID生成
- 使用字典序排序的两个用户ID组合：`userA_id-userB_id`
- 确保同一对用户的会话ID唯一
- 无论谁先发起，会话ID都一致

### 3. 事件冒泡处理
- 在帖子列表/详情中，头像和昵称点击使用 `@click.stop` 阻止冒泡
- 避免触发外层的 `post-item` 点击事件（跳转到帖子详情）

### 4. 页面生命周期
- `onLoad`: 初始化数据，加载会话/消息
- `onShow`: 刷新列表（从其他页面返回时）
- `onUnload`: 清除定时器（离开聊天页面时）

## 后续优化建议

### 功能扩展
1. 发送图片、语音
2. 消息已读/未读状态更新
3. 消息撤回
4. 表情包支持
5. 用户主页功能
6. 黑名单/屏蔽功能

### 性能优化
1. 使用 WebSocket 实现真正的实时通信
2. 消息分页加载（向上滚动加载更多历史消息）
3. 图片懒加载和缓存
4. 未读消息数量实时更新

### 用户体验
1. 输入框高度自适应
2. @ 提及功能
3. 消息搜索
4. 会话置顶
5. 消息免打扰

## 测试检查清单

- [ ] 点击评论区用户名能弹出操作菜单
- [ ] 点击帖子作者头像能弹出操作菜单
- [ ] 选择"发私信"能跳转到聊天页面
- [ ] 能在聊天页面发送消息
- [ ] 消息能正确显示在左右两侧
- [ ] 3秒后能自动接收新消息
- [ ] 未读消息数量显示正确
- [ ] 会话列表按时间排序
- [ ] 下拉刷新能更新会话
- [ ] 用户中心的"私聊"统计正确
- [ ] 点击私聊统计能进入会话列表
- [ ] 未登录时提示登录
- [ ] 不能给自己发消息
- [ ] 点击反馈效果正常（半透明）

## 完成状态

✅ 私聊列表页面
✅ 私聊对话页面
✅ pages.json 注册
✅ 剧本详情页用户点击
✅ 帖子列表页用户点击
✅ 帖子详情页用户点击
✅ 用户操作工具类
✅ 样式和交互优化

全部功能已完成！用户现在可以在任何地方点击其他用户的头像或昵称发起私聊了。

