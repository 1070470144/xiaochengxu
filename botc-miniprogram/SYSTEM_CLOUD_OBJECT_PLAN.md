# 🔧 System 云对象开发计划

## 📋 原云函数分析

| 云函数名 | 功能 | 复杂度 | 关键点 |
|---------|------|--------|--------|
| `home-data` | 获取首页数据 | ⭐⭐ | 统计、多集合查询 |
| `get-system-messages` | 获取系统消息 | ⭐⭐ | 分页、未读数统计 |
| `delete-system-message` | 删除系统消息 | ⭐ | 单删、批删 |
| `comment-create` | 创建评论 | ⭐⭐ | Token验证、回复逻辑 |
| `content-filter` | 内容过滤 | ⭐⭐⭐ | 敏感词检测、规则检查 |
| `certification-manage` | 认证管理 | ⭐⭐ | 多操作、状态管理 |

---

## 🎯 云对象方法设计

### 1. `getHomeData()` - 获取首页数据
**参数：** 无

**返回：**
```javascript
{
  code: 0,
  message: '获取首页数据成功',
  data: {
    stats: {
      scriptCount: 100,
      carpoolCount: 50,
      userCount: 1000
    },
    hotScripts: [...],
    latestCarpools: [...]
  }
}
```

---

### 2. `getSystemMessages(page, pageSize, messageId)` - 获取系统消息
**参数：**
```javascript
{
  page: 1,
  pageSize: 20,
  messageId: 'msg_xxx'  // 可选，查看单条消息
}
```

**返回：**
```javascript
{
  code: 0,
  message: '查询成功',
  data: {
    list: [...],
    total: 50,
    unreadCount: 5,
    page: 1,
    pageSize: 20
  }
}
```

---

### 3. `deleteSystemMessage(messageId, deleteAll)` - 删除系统消息
**参数：**
```javascript
{
  messageId: 'msg_xxx',  // 可选
  deleteAll: false       // 可选
}
```

**返回：**
```javascript
{
  code: 0,
  message: '删除成功',
  data: {
    deleted: 1
  }
}
```

---

### 4. `createComment(commentData)` - 创建评论
**参数：**
```javascript
{
  postId: 'post_xxx',
  content: '评论内容',
  replyToId: 'comment_xxx',      // 可选
  replyToUserId: 'user_xxx'      // 可选
}
```

**返回：**
```javascript
{
  code: 0,
  message: '评论成功',
  data: {
    comment_id: 'comment_xxx',
    comment: {...}
  }
}
```

---

### 5. `filterContent(content)` - 内容过滤
**参数：**
```javascript
{
  content: '要检查的文本内容'
}
```

**返回：**
```javascript
{
  code: 0,
  message: '检查通过',
  data: {
    pass: true,
    filteredContent: '...',
    foundWords: [...]  // 发现的敏感词
  }
}
```

---

### 6. `manageCertification(action, data)` - 认证管理
**参数：**
```javascript
{
  action: 'get|apply|revoke',
  level: 1,              // apply 时需要
  images: [...],         // apply 时需要
  description: '...'     // apply 时可选
}
```

**返回：**
```javascript
{
  code: 0,
  message: '操作成功',
  data: {...}
}
```

---

## 🗄️ 数据库集合

### `botc-scripts` - 剧本表
### `botc-carpool-rooms` - 拼车表
### `uni-id-users` - 用户表
### `botc-system-messages` - 系统消息表
```javascript
{
  _id: 'msg_xxx',
  user_id: 'user_xxx',
  title: '标题',
  content: '内容',
  type: 'system|notice|alert',
  is_read: false,
  read_at: null,
  created_at: Date
}
```

### `botc-post-comments` - 帖子评论表
```javascript
{
  _id: 'comment_xxx',
  post_id: 'post_xxx',
  user_id: 'user_xxx',
  content: '评论内容',
  reply_to_id: 'comment_xxx',
  reply_to_user_id: 'user_xxx',
  like_count: 0,
  status: 1,
  created_at: Date
}
```

### `botc-sensitive-words` - 敏感词表
```javascript
{
  word: '敏感词',
  type: 'political|violent|vulgar',
  replacement: '***',
  status: 'enabled'
}
```

### `botc-certifications` - 认证申请表
```javascript
{
  _id: 'cert_xxx',
  user_id: 'user_xxx',
  level: 1,  // 1-一星 2-二星
  images: [],
  description: '',
  status: 'pending|approved|rejected',
  created_at: Date,
  updated_at: Date
}
```

---

## 🔧 工具函数（复用）

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
  
  // 需要认证的方法
  const authMethods = [
    'getSystemMessages',
    'deleteSystemMessage',
    'createComment',
    'manageCertification'
  ];
  
  const methodName = this.getMethodName();
  if (authMethods.includes(methodName)) {
    this.currentUserId = parseUserId(this.clientInfo);
    if (!this.currentUserId) {
      throw new Error('请先登录');
    }
  }
}
```

### 2. 敏感词检测优化
- 正则表达式匹配
- 多种规则检查（手机号、QQ、微信、重复字符）
- 可配置的替换词

### 3. 系统消息自动已读
- 查看单条消息时自动标记已读
- 更新 `is_read` 和 `read_at`

---

## ✅ 开发步骤

1. ✅ 分析原云函数
2. ⏳ 创建 `system/index.obj.js`
3. ⏳ 实现 6 个方法
4. ⏳ 上传并测试
5. ⏳ 创建测试页面
6. ⏳ 前端页面适配

---

_创建时间：2025-11-04_  
_预计时间：1.5 小时_

