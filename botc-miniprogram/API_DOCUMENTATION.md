# 📚 BOTC 小程序云对象 API 文档

## 🎯 概述

本文档提供所有云对象的完整 API 说明，包括方法列表、参数说明、返回值格式和调用示例。

---

## 📦 通用说明

### 导入云对象

```javascript
const xxxObj = uniCloud.importObject('xxx', { customUI: true });
```

### 统一返回格式

```javascript
{
  code: 0,           // 0 表示成功，其他表示失败
  message: 'success', // 提示信息
  data: {}           // 返回数据
}
```

### 错误码

| 错误码 | 说明 |
|-------|------|
| 0 | 成功 |
| -1 | 一般错误 |
| 400 | 参数错误 |
| 401 | 未登录 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

---

## 1️⃣ User 云对象

**导入**: `const userObj = uniCloud.importObject('user', { customUI: true });`

### 方法列表

#### 1.1 sendSms(phone)
发送短信验证码

**参数**:
- `phone` (String) - 手机号

**返回**:
```javascript
{
  code: 0,
  message: '验证码发送成功',
  data: {
    devCode: '123456' // 开发模式下返回
  }
}
```

**示例**:
```javascript
const res = await userObj.sendSms('13800138000');
```

---

#### 1.2 login(phone, code, inviteCode)
登录/注册

**参数**:
- `phone` (String) - 手机号
- `code` (String) - 验证码
- `inviteCode` (String, 可选) - 邀请码

**返回**:
```javascript
{
  code: 0,
  message: '登录成功',
  data: {
    token: 'xxx',
    userInfo: { ... }
  }
}
```

---

#### 1.3 getInfo()
获取当前用户信息

**返回**:
```javascript
{
  code: 0,
  data: {
    _id: 'xxx',
    nickname: '用户名',
    avatar_file: { url: 'xxx' },
    // ... 其他用户信息
  }
}
```

---

#### 1.4 update(updateData)
更新用户信息

**参数**:
- `updateData` (Object) - 更新数据
  - `nickname` (String, 可选)
  - `avatar_file` (Object, 可选)
  - `bio` (String, 可选)

**返回**:
```javascript
{
  code: 0,
  message: '更新成功',
  data: { ...更新后的用户信息 }
}
```

---

#### 1.5 logout()
退出登录

---

#### 1.6 getProfile(targetUserId)
获取他人资料

**参数**:
- `targetUserId` (String) - 目标用户ID

---

#### 1.7 follow(targetUserId)
关注用户

---

#### 1.8 unfollow(targetUserId)
取消关注

---

#### 1.9 getFollowingList(userId, page, pageSize)
获取关注列表

---

#### 1.10 getFollowersList(userId, page, pageSize)
获取粉丝列表

---

#### 1.11 checkFollow(targetUserId)
检查是否关注

---

#### 1.12 getLevel()
获取用户等级

---

#### 1.13 addExp(exp, reason)
增加经验值

---

## 2️⃣ Script 云对象

**导入**: `const scriptObj = uniCloud.importObject('script', { customUI: true });`

### 方法列表

#### 2.1 upload(scriptData, previewImage)
上传剧本

**参数**:
- `scriptData` (Object) - 剧本数据
- `previewImage` (Object, 可选) - 预览图

---

#### 2.2 getList(options)
获取剧本列表

**参数**:
- `options` (Object)
  - `page` (Number, 默认1)
  - `pageSize` (Number, 默认10)
  - `keyword` (String, 可选)
  - `orderBy` (String, 可选)

**返回**:
```javascript
{
  code: 0,
  data: {
    list: [ ... ],
    total: 100,
    page: 1,
    pageSize: 10
  }
}
```

---

#### 2.3 getDetail(scriptId)
获取剧本详情

---

#### 2.4 update(scriptId, updateData)
更新剧本

---

#### 2.5 deleteScript(scriptId)
删除剧本（软删除）

---

#### 2.6 getMyScripts(page, pageSize)
获取我上传的剧本

---

#### 2.7 getRanking(type, limit)
获取剧本排行榜

**参数**:
- `type` (String) - 排行类型: 'heat'(热度) | 'views'(浏览) | 'favorites'(收藏)
- `limit` (Number, 默认10)

---

#### 2.8 generateJsonUrl(scriptId)
生成剧本 JSON URL（URL化访问）

**返回**:
```javascript
{
  code: 0,
  data: {
    url: 'https://xxx.com/script-generate-json-url?scriptId=xxx'
  }
}
```

---

#### 2.9 calculateHeat(scriptId)
计算剧本热度

---

## 3️⃣ Carpool 云对象

**导入**: `const carpoolObj = uniCloud.importObject('carpool', { customUI: true });`

### 方法列表

#### 3.1 create(carpoolData)
创建拼车

**参数**:
- `carpoolData` (Object)
  - `script_id` (String) - 剧本ID
  - `city` (String) - 城市
  - `date` (String) - 日期
  - `time` (String) - 时间
  - `location` (String) - 地点
  - `max_players` (Number) - 最大人数
  - `contact_info` (String) - 联系方式
  - `description` (String, 可选)

---

#### 3.2 getList(options)
获取拼车列表

**参数**:
- `options` (Object)
  - `city` (String, 可选)
  - `script_id` (String, 可选)
  - `status` (String, 可选): 'pending'(招募中) | 'full'(已满员) | 'completed'(已完成)

---

#### 3.3 getDetail(carpoolId)
获取拼车详情

---

#### 3.4 join(carpoolId)
加入拼车

---

#### 3.5 cancelJoin(carpoolId)
取消参加

---

#### 3.6 getMyCarpools(type, page, pageSize)
获取我的拼车

**参数**:
- `type` (String): 'created'(我创建的) | 'joined'(我参加的)

---

#### 3.7 update(carpoolId, updateData)
更新拼车

---

#### 3.8 complete(carpoolId)
完成拼车

---

#### 3.9 cancel(carpoolId)
取消拼车（软删除）

---

## 4️⃣ Chat 云对象

**导入**: `const chatObj = uniCloud.importObject('chat', { customUI: true });`

### 方法列表

#### 4.1 sendMessage(targetUserId, content, messageType)
发送消息

**参数**:
- `targetUserId` (String) - 接收用户ID
- `content` (String) - 消息内容
- `messageType` (String, 默认'text') - 消息类型

---

#### 4.2 getConversations(page, pageSize)
获取会话列表

---

#### 4.3 getMessages(conversationId, page, pageSize)
获取聊天记录

---

#### 4.4 markAsRead(conversationId)
标记已读

---

#### 4.5 deleteConversation(conversationId)
删除会话（软删除）

---

#### 4.6 getUnreadCount()
获取未读消息数

---

## 5️⃣ Post 云对象

**导入**: `const postObj = uniCloud.importObject('post', { customUI: true });`

### 方法列表

#### 5.1 getList(options)
获取帖子列表

**参数**:
- `options` (Object)
  - `category` (String, 可选): 'all' | 'strategy' | 'story' | 'question'
  - `sort` (String, 可选): 'latest'(最新) | 'hot'(热门) | 'best'(精选)
  - `keyword` (String, 可选)

---

#### 5.2 create(postData)
发布帖子

**参数**:
- `postData` (Object)
  - `title` (String) - 标题
  - `content` (String) - 内容
  - `category` (String) - 分类
  - `images` (Array, 可选) - 图片
  - `script_id` (String, 可选) - 关联剧本

---

#### 5.3 getDetail(postId)
获取帖子详情

---

#### 5.4 toggleLike(postId)
点赞/取消点赞

---

#### 5.5 report(postId, reason)
举报帖子

---

#### 5.6 deletePost(postId)
删除帖子（软删除）

---

## 6️⃣ Collection 云对象

**导入**: `const collectionObj = uniCloud.importObject('collection', { customUI: true });`

### 方法列表

#### 6.1 addFavorite(targetId, targetType)
添加收藏

**参数**:
- `targetId` (String) - 目标ID
- `targetType` (String) - 类型: 'script' | 'post' | 'wiki'

---

#### 6.2 removeFavorite(targetId, targetType)
取消收藏

---

#### 6.3 getFavorites(targetType, page, pageSize)
获取收藏列表

---

#### 6.4 checkFavoriteStatus(targetId, targetType)
检查收藏状态

---

#### 6.5 addHistory(targetId, targetType)
添加/更新浏览历史

---

#### 6.6 getHistory(targetType, page, pageSize)
获取浏览历史

---

## 7️⃣ Shop 云对象

**导入**: `const shopObj = uniCloud.importObject('shop', { customUI: true });`

### 方法列表

#### 7.1 getList(options)
获取店铺列表

**参数**:
- `options` (Object)
  - `city` (String, 可选)
  - `sort` (String, 可选): 'rating'(评分) | 'distance'(距离)

---

#### 7.2 getDetail(shopId)
获取店铺详情

---

#### 7.3 apply(shopData)
申请店铺认证

**参数**:
- `shopData` (Object)
  - `shop_name` (String) - 店铺名称
  - `city` (String) - 城市
  - `address` (String) - 地址
  - `contact_phone` (String) - 联系电话
  - `description` (String, 可选)

---

## 8️⃣ Storyteller 云对象

**导入**: `const storytellerObj = uniCloud.importObject('storyteller', { customUI: true });`

### 方法列表

#### 8.1 getList(options)
获取说书人列表

**参数**:
- `options` (Object)
  - `city` (String, 可选)
  - `keyword` (String, 可选)
  - `sort` (String, 可选): 'heat'(热度) | 'rating'(评分)

---

#### 8.2 getDetail(storytellerId)
获取说书人详情

---

#### 8.3 getReviews(storytellerId, page, pageSize)
获取说书人评价

---

#### 8.4 calculateHeat(storytellerId)
计算说书人热度

---

## 9️⃣ System 云对象

**导入**: `const systemObj = uniCloud.importObject('system', { customUI: true });`

### 方法列表

#### 9.1 getHomeData()
获取首页数据

**返回**:
```javascript
{
  code: 0,
  data: {
    stats: {
      total_users: 1000,
      total_scripts: 500,
      total_carpools: 200
    },
    hot_scripts: [ ... ],
    latest_carpools: [ ... ]
  }
}
```

---

#### 9.2 getSystemMessages(options)
获取系统消息

**参数**:
- `options` (Object)
  - `type` (String, 可选): 'all' | 'like' | 'comment' | 'follow' | 'system'
  - `page` (Number, 默认1)

---

#### 9.3 deleteSystemMessage(messageId)
删除系统消息

---

#### 9.4 createComment(targetId, targetType, content, replyTo)
创建评论

**参数**:
- `targetId` (String) - 目标ID
- `targetType` (String) - 类型: 'post' | 'script' | 'carpool'
- `content` (String) - 评论内容
- `replyTo` (String, 可选) - 回复评论ID

---

#### 9.5 filterContent(content)
内容过滤（敏感词、联系方式、垃圾信息）

**返回**:
```javascript
{
  code: 0,
  data: {
    passed: true,
    filtered_content: '过滤后的内容',
    warnings: []
  }
}
```

---

#### 9.6 manageCertification(action, certType, certData)
管理认证

**参数**:
- `action` (String): 'get' | 'apply' | 'revoke'
- `certType` (String): 'shop' | 'storyteller'
- `certData` (Object, 可选) - 申请数据

---

## 🔟 Wiki 云对象

**导入**: `const wikiObj = uniCloud.importObject('wiki', { customUI: true });`

### 方法列表

#### 10.1 getList(options)
获取词条列表

**参数**:
- `options` (Object)
  - `entry_type` (String, 可选): 'all' | 'role' | 'script' | 'rule' | 'guide' | 'term'
  - `keyword` (String, 可选)
  - `page` (Number, 默认1)

---

#### 10.2 getDetail(entryId)
获取词条详情

---

#### 10.3 getCategories()
获取分类统计

**返回**:
```javascript
{
  code: 0,
  data: {
    role: 50,
    script: 20,
    rule: 30,
    guide: 10,
    term: 15
  }
}
```

---

#### 10.4 search(keyword, options)
搜索词条

**参数**:
- `keyword` (String) - 搜索关键词
- `options` (Object)
  - `entry_type` (String, 可选)
  - `page` (Number, 默认1)

---

#### 10.5 addComment(roleId, content)
添加评论

---

#### 10.6 getComments(roleId, page, pageSize)
获取评论列表

---

#### 10.7 toggleLike(roleId)
点赞/取消点赞

---

#### 10.8 getRankingStorytellers(type, limit)
获取说书人榜单

**参数**:
- `type` (String): 'fans'(粉丝数) | 'heat'(热度)
- `limit` (Number, 默认50)

---

#### 10.9 parseUrl(url, forceRefresh)
解析钟楼百科 URL（完整版 cheerio）

**参数**:
- `url` (String) - 钟楼百科页面URL
- `forceRefresh` (Boolean, 默认false) - 是否强制刷新

**返回**:
```javascript
{
  code: 0,
  data: {
    entry_type: 'role',
    title: '洗衣妇',
    content: {
      text: '完整文本',
      sections: [ ... ],
      summary: '摘要'
    },
    role_info: {
      team: 'townsfolk',
      team_name: '镇民',
      ability: '能力描述',
      setup_info: '设置信息',
      script_belongs: ['暗流涌动']
    },
    media: {
      icon_url: 'https://...',
      images: [ ... ]
    },
    tags: ['镇民', '信息类'],
    related_links: [ ... ]
  }
}
```

---

## 📝 调用示例

### 示例 1: 用户登录
```javascript
// 1. 发送验证码
const smsRes = await userObj.sendSms('13800138000');
console.log('验证码:', smsRes.data.devCode);

// 2. 登录
const loginRes = await userObj.login('13800138000', '123456');
if (loginRes.code === 0) {
  const token = loginRes.data.token;
  const userInfo = loginRes.data.userInfo;
  // 保存 token 和用户信息
}
```

### 示例 2: 发布帖子
```javascript
const postObj = uniCloud.importObject('post', { customUI: true });

const res = await postObj.create({
  title: '暗流涌动攻略',
  content: '这是一个攻略...',
  category: 'strategy',
  images: [],
  script_id: 'xxx'
});

if (res.code === 0) {
  console.log('发布成功，帖子ID:', res.data._id);
}
```

### 示例 3: 解析百科页面
```javascript
const wikiObj = uniCloud.importObject('wiki', { customUI: true });

const res = await wikiObj.parseUrl(
  'https://clocktower-wiki.gstonegames.com/index.php?title=洗衣妇',
  false  // 使用缓存
);

if (res.code === 0) {
  const entry = res.data;
  console.log('标题:', entry.title);
  console.log('类型:', entry.entry_type);
  console.log('阵营:', entry.role_info.team_name);
  console.log('能力:', entry.role_info.ability);
}
```

---

## 🔍 常见问题

### Q1: 如何处理错误？
```javascript
try {
  const res = await userObj.getInfo();
  if (res.code === 0) {
    // 成功
  } else {
    // 业务错误
    uni.showToast({ title: res.message, icon: 'none' });
  }
} catch (error) {
  // 系统错误
  console.error('调用失败:', error);
  uni.showToast({ title: '网络错误', icon: 'none' });
}
```

### Q2: 如何在云对象间复用？
```javascript
// 在 post 云对象中调用 system 云对象
const systemObj = uniCloud.importObject('system');
const filterResult = await systemObj.filterContent(content);
```

### Q3: 如何调试云对象？
```javascript
// 在云对象代码中添加 console.log
console.log('[methodName] 参数:', params);
console.log('[methodName] 结果:', result);

// 前端查看日志
const res = await xxxObj.method();
console.log('云对象返回:', res);
```

---

_文档版本：v1.0_  
_最后更新：2025-11-04_  
_总方法数：77 个_

