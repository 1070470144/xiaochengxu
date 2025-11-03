# 云函数迁移到云对象完整规划

## 📋 项目概述

将当前 73 个云函数重构为云对象架构，提升代码组织性、可维护性和开发效率。

---

## 🎯 云对象 vs 云函数对比

### 云函数（当前方式）
```javascript
// 每个功能一个独立云函数
user-login/index.js
user-logout/index.js
user-info/index.js
user-update/index.js
// ... 需要维护 73 个独立函数
```

**缺点：**
- ❌ 文件数量多，难以管理
- ❌ 代码重复（鉴权、错误处理等）
- ❌ 调用方式不统一
- ❌ 难以共享工具函数

### 云对象（目标方式）
```javascript
// 按业务模块组织
user/index.obj.js          // 用户相关所有方法
  - login()
  - logout()
  - getInfo()
  - update()
```

**优点：**
- ✅ 代码组织清晰，按业务分类
- ✅ 方法调用更直观（面向对象）
- ✅ 减少重复代码（共享 this）
- ✅ 便于维护和扩展

---

## 📊 当前云函数分类统计

根据现有 73 个云函数，按业务模块分类：

### 1. **用户模块 (user)** - 12 个云函数
- `user-login` - 手机号登录
- `user-logout` - 登出
- `user-info` - 获取当前用户信息
- `user-update` - 更新用户信息
- `user-profile` - 获取用户主页
- `user-send-sms` - 发送验证码
- `user-stats` - 用户统计
- `user-level-info` - 等级信息
- `user-daily-login` - 每日登录
- `user-add-exp` - 增加经验
- `user-follow` - 关注/取关
- `user-follow-sync` - 同步关注数据
- `user-followers-list` - 粉丝列表
- `user-following-list` - 关注列表

### 2. **剧本模块 (script)** - 14 个云函数
- `script-list` - 剧本列表
- `script-detail` - 剧本详情
- `script-upload` - 上传剧本
- `script-delete` - 删除剧本
- `script-my-uploads` - 我的上传
- `script-json-get` - 获取JSON文件
- `script-generate-json-url` - 生成JSON链接
- `script-review-create` - 创建评价
- `script-rating` - 评分
- `script-calculate-heat` - 计算热度
- `script-ranking-hot` - 热门排行
- `script-ranking-new` - 最新排行
- `script-ranking-rating` - 评分排行
- `script-ranking-download` - 下载排行

### 3. **拼车模块 (carpool)** - 9 个云函数
- `carpool-list` - 拼车列表
- `carpool-detail` - 拼车详情
- `carpool-create` - 创建拼车
- `carpool-apply` - 报名拼车
- `carpool-cancel-apply` - 取消报名
- `carpool-confirm-member` - 确认成员
- `carpool-remove-member` - 移除成员
- `carpool-update-status` - 更新状态
- `carpool-applied-list` - 我的报名列表

### 4. **私聊模块 (chat)** - 5 个云函数
- `chat-conversations` - 会话列表
- `chat-conversation-list` - 会话列表（重复？）
- `chat-send` - 发送消息
- `chat-send-message` - 发送消息（重复？）
- `chat-mark-read` - 标记已读

### 5. **帖子/社区模块 (post)** - 5 个云函数
- `post-list` - 帖子列表
- `post-detail` - 帖子详情
- `post-create` - 发布帖子
- `post-like` - 点赞帖子
- `post-report` - 举报帖子

### 6. **收藏/历史模块 (collection)** - 5 个云函数
- `favorite-add` - 添加收藏
- `favorite-remove` - 移除收藏
- `favorites-list` - 收藏列表
- `history-add` - 添加历史
- `history-list` - 历史列表

### 7. **说书人模块 (storyteller)** - 4 个云函数
- `storyteller-list` - 说书人列表
- `storyteller-detail` - 说书人详情
- `storyteller-reviews` - 说书人评价
- `storyteller-calculate-heat` - 计算热度

### 8. **百科模块 (wiki)** - 8 个云函数
- `wiki-list` - 百科列表
- `wiki-detail` - 百科详情
- `wiki-search` - 搜索
- `wiki-categories` - 分类
- `wiki-parse-url` - 解析URL
- `wiki-ranking-storytellers` - 说书人排行
- `wiki-role-comment-add` - 角色评论
- `wiki-role-comment-list` - 角色评论列表
- `wiki-role-toggle-like` - 角色点赞

### 9. **店铺模块 (shop)** - 3 个云函数
- `shop-list` - 店铺列表
- `shop-detail` - 店铺详情
- `shop-apply` - 申请入驻

### 10. **系统模块 (system)** - 4 个云函数
- `home-data` - 首页数据
- `get-system-messages` - 获取系统消息
- `delete-system-message` - 删除系统消息
- `content-filter` - 内容过滤
- `certification-manage` - 认证管理
- `comment-create` - 创建评论

### 11. **uni系统模块** - 4 个云函数（保持不变）
- `uni-portal` - uni门户
- `uni-stat-cron` - 统计定时任务
- `uni-stat-receiver` - 统计接收器
- `uni-upgrade-center` - 升级中心
- `uni-analyse-searchhot` - 搜索热词分析
- `uni-sms-co` - 短信云对象

---

## 🏗️ 云对象架构设计

### 核心云对象列表（10个）

```
uniCloud-aliyun/cloudfunctions/
├── user/                    # 用户云对象
│   └── index.obj.js
├── script/                  # 剧本云对象
│   └── index.obj.js
├── carpool/                 # 拼车云对象
│   └── index.obj.js
├── chat/                    # 私聊云对象
│   └── index.obj.js
├── post/                    # 帖子云对象
│   └── index.obj.js
├── collection/              # 收藏历史云对象
│   └── index.obj.js
├── storyteller/             # 说书人云对象
│   └── index.obj.js
├── wiki/                    # 百科云对象
│   └── index.obj.js
├── shop/                    # 店铺云对象
│   └── index.obj.js
├── system/                  # 系统云对象
│   └── index.obj.js
└── common/                  # 公共模块（保持）
    └── utils/
```

---

## 📝 云对象方法映射表

### 1️⃣ user 云对象 (14个方法)

| 原云函数 | 云对象方法 | 功能描述 |
|---------|----------|---------|
| user-login | `login(phone, code)` | 手机号验证码登录 |
| user-logout | `logout()` | 用户登出 |
| user-send-sms | `sendSms(phone, type)` | 发送验证码 |
| user-info | `getInfo()` | 获取当前用户信息 |
| user-update | `update(data)` | 更新用户信息 |
| user-profile | `getProfile(userId)` | 获取用户主页 |
| user-stats | `getStats()` | 获取用户统计 |
| user-level-info | `getLevelInfo()` | 获取等级信息 |
| user-daily-login | `dailyLogin()` | 每日签到 |
| user-add-exp | `addExp(type, amount)` | 增加经验值 |
| user-follow | `follow(targetUserId)` | 关注/取关用户 |
| user-follow-sync | `syncFollowCount()` | 同步关注数 |
| user-followers-list | `getFollowersList(userId, page)` | 获取粉丝列表 |
| user-following-list | `getFollowingList(userId, page)` | 获取关注列表 |

**调用示例：**
```javascript
// 前端调用
const userObj = uniCloud.importObject('user')

// 登录
await userObj.login('13800138000', '123456')

// 获取信息
await userObj.getInfo()

// 更新信息
await userObj.update({ nickname: '新昵称', avatar: 'xxx' })

// 关注用户
await userObj.follow('user_id_123')
```

---

### 2️⃣ script 云对象 (14个方法)

| 原云函数 | 云对象方法 | 功能描述 |
|---------|----------|---------|
| script-list | `getList(params)` | 获取剧本列表 |
| script-detail | `getDetail(scriptId)` | 获取剧本详情 |
| script-upload | `upload(data)` | 上传剧本 |
| script-delete | `delete(scriptId)` | 删除剧本 |
| script-my-uploads | `getMyUploads(page)` | 我的上传 |
| script-json-get | `getJsonContent(scriptId)` | 获取JSON内容 |
| script-generate-json-url | `generateJsonUrl(scriptId)` | 生成JSON链接 |
| script-review-create | `createReview(data)` | 创建评价 |
| script-rating | `rate(scriptId, rating)` | 评分 |
| script-calculate-heat | `calculateHeat(scriptId)` | 计算热度 |
| script-ranking-hot | `getRankingHot(params)` | 热门排行 |
| script-ranking-new | `getRankingNew(params)` | 最新排行 |
| script-ranking-rating | `getRankingRating(params)` | 评分排行 |
| script-ranking-download | `getRankingDownload(params)` | 下载排行 |

**调用示例：**
```javascript
const scriptObj = uniCloud.importObject('script')

// 获取列表
await scriptObj.getList({ page: 1, pageSize: 20 })

// 获取详情
await scriptObj.getDetail('script_id_123')

// 上传剧本
await scriptObj.upload({ title: '新剧本', description: '...' })

// 评分
await scriptObj.rate('script_id_123', 5)
```

---

### 3️⃣ carpool 云对象 (9个方法)

| 原云函数 | 云对象方法 | 功能描述 |
|---------|----------|---------|
| carpool-list | `getList(params)` | 拼车列表 |
| carpool-detail | `getDetail(roomId)` | 拼车详情 |
| carpool-create | `create(data)` | 创建拼车 |
| carpool-apply | `apply(roomId, message)` | 报名拼车 |
| carpool-cancel-apply | `cancelApply(roomId)` | 取消报名 |
| carpool-confirm-member | `confirmMember(roomId, userId)` | 确认成员 |
| carpool-remove-member | `removeMember(roomId, userId)` | 移除成员 |
| carpool-update-status | `updateStatus(roomId, status)` | 更新状态 |
| carpool-applied-list | `getAppliedList(page)` | 我的报名 |

**调用示例：**
```javascript
const carpoolObj = uniCloud.importObject('carpool')

// 获取列表
await carpoolObj.getList({ city: '北京', page: 1 })

// 创建拼车
await carpoolObj.create({ 
  title: '周末组局', 
  location: '朝阳区',
  max_players: 7
})

// 报名
await carpoolObj.apply('room_id_123', '我想参加')
```

---

### 4️⃣ chat 云对象 (5个方法)

| 原云函数 | 云对象方法 | 功能描述 |
|---------|----------|---------|
| chat-conversations | `getConversations(page)` | 获取会话列表 |
| chat-send | `send(toUserId, content, type)` | 发送消息 |
| chat-mark-read | `markRead(conversationId)` | 标记已读 |
| - | `getMessages(conversationId, page)` | 获取聊天记录 |
| - | `getUnreadCount()` | 获取未读数 |

**调用示例：**
```javascript
const chatObj = uniCloud.importObject('chat')

// 获取会话列表
await chatObj.getConversations(1)

// 发送消息
await chatObj.send('user_id_123', '你好', 1)

// 标记已读
await chatObj.markRead('conversation_id')
```

---

### 5️⃣ post 云对象 (5个方法)

| 原云函数 | 云对象方法 | 功能描述 |
|---------|----------|---------|
| post-list | `getList(params)` | 帖子列表 |
| post-detail | `getDetail(postId)` | 帖子详情 |
| post-create | `create(data)` | 发布帖子 |
| post-like | `toggleLike(postId)` | 点赞/取消 |
| post-report | `report(postId, reason)` | 举报帖子 |

---

### 6️⃣ collection 云对象 (4个方法)

| 原云函数 | 云对象方法 | 功能描述 |
|---------|----------|---------|
| favorite-add | `addFavorite(scriptId)` | 添加收藏 |
| favorite-remove | `removeFavorite(scriptId)` | 移除收藏 |
| favorites-list | `getFavorites(page)` | 收藏列表 |
| history-add | `addHistory(scriptId)` | 添加历史 |
| history-list | `getHistory(page)` | 历史列表 |

---

### 7️⃣ storyteller 云对象 (4个方法)

| 原云函数 | 云对象方法 | 功能描述 |
|---------|----------|---------|
| storyteller-list | `getList(params)` | 说书人列表 |
| storyteller-detail | `getDetail(userId)` | 说书人详情 |
| storyteller-reviews | `getReviews(userId, page)` | 说书人评价 |
| storyteller-calculate-heat | `calculateHeat(userId)` | 计算热度 |

---

### 8️⃣ wiki 云对象 (9个方法)

| 原云函数 | 云对象方法 | 功能描述 |
|---------|----------|---------|
| wiki-list | `getList(params)` | 百科列表 |
| wiki-detail | `getDetail(wikiId)` | 百科详情 |
| wiki-search | `search(keyword)` | 搜索 |
| wiki-categories | `getCategories()` | 获取分类 |
| wiki-parse-url | `parseUrl(url)` | 解析URL |
| wiki-ranking-storytellers | `getRankingStorytellers()` | 说书人排行 |
| wiki-role-comment-add | `addRoleComment(data)` | 添加角色评论 |
| wiki-role-comment-list | `getRoleComments(roleId)` | 角色评论列表 |
| wiki-role-toggle-like | `toggleRoleLike(roleId)` | 角色点赞 |

---

### 9️⃣ shop 云对象 (3个方法)

| 原云函数 | 云对象方法 | 功能描述 |
|---------|----------|---------|
| shop-list | `getList(params)` | 店铺列表 |
| shop-detail | `getDetail(shopId)` | 店铺详情 |
| shop-apply | `apply(data)` | 申请入驻 |

---

### 🔟 system 云对象 (6个方法)

| 原云函数 | 云对象方法 | 功能描述 |
|---------|----------|---------|
| home-data | `getHomeData()` | 获取首页数据 |
| get-system-messages | `getMessages(page)` | 获取系统消息 |
| delete-system-message | `deleteMessage(msgId)` | 删除系统消息 |
| content-filter | `filterContent(content)` | 内容过滤 |
| certification-manage | `manageCertification(data)` | 认证管理 |
| comment-create | `createComment(data)` | 创建评论 |

---

## 🛠️ 云对象基础模板

### 标准云对象结构

```javascript
// user/index.obj.js
const db = uniCloud.database()
const dbCmd = db.command

module.exports = {
  _before: function() {
    // 统一的前置处理
    this.db = db
    this.dbCmd = dbCmd
    
    // 鉴权（如果需要）
    this.token = this.getClientInfo().uniIdToken || this.getUniIdToken()
    
    if (this.token) {
      // 解析用户ID
      this.currentUserId = this._parseUserId(this.token)
    }
  },
  
  _after: function(error, result) {
    // 统一的后置处理
    if (error) {
      console.error('云对象错误：', error)
      throw error
    }
    return result
  },
  
  // ========== 私有方法 ==========
  
  /**
   * 解析token获取用户ID
   */
  _parseUserId(token) {
    try {
      return token.split('_')[0]
    } catch (e) {
      return null
    }
  },
  
  /**
   * 检查登录状态
   */
  _checkAuth() {
    if (!this.currentUserId) {
      throw new Error('未登录或登录已过期')
    }
    return true
  },
  
  /**
   * 验证手机号格式
   */
  _validatePhone(phone) {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      throw new Error('手机号格式不正确')
    }
    return true
  },
  
  /**
   * 统一返回格式
   */
  _success(data, message = 'success') {
    return {
      code: 0,
      message,
      data
    }
  },
  
  _error(message, code = 500) {
    return {
      code,
      message,
      data: null
    }
  },
  
  // ========== 公开方法 ==========
  
  /**
   * 发送短信验证码
   * @param {String} phone - 手机号
   * @param {String} type - 类型（login/register）
   */
  async sendSms(phone, type = 'login') {
    // 验证手机号
    this._validatePhone(phone)
    
    // 生成验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = Date.now() + 3 * 60 * 1000
    
    // 保存到数据库
    const smsCollection = this.db.collection('sms-codes')
    
    // 删除旧验证码
    await smsCollection.where({ phone }).remove()
    
    // 保存新验证码
    await smsCollection.add({
      phone,
      code,
      type,
      expires_at: expiresAt,
      created_at: Date.now(),
      used: false
    })
    
    // 开发模式返回验证码
    const isDev = true // 生产环境改为 false
    
    return this._success({
      expiresIn: 180,
      devCode: isDev ? code : undefined
    }, '验证码已发送')
  },
  
  /**
   * 手机号验证码登录
   * @param {String} phone - 手机号
   * @param {String} code - 验证码
   */
  async login(phone, code) {
    // 验证参数
    this._validatePhone(phone)
    
    if (!code) {
      throw new Error('请输入验证码')
    }
    
    // 验证验证码
    const smsCollection = this.db.collection('sms-codes')
    const smsQuery = await smsCollection
      .where({
        phone,
        code,
        used: false,
        expires_at: this.dbCmd.gt(Date.now())
      })
      .orderBy('created_at', 'desc')
      .limit(1)
      .get()
    
    if (smsQuery.data.length === 0) {
      throw new Error('验证码错误或已过期')
    }
    
    // 标记验证码已使用
    await smsCollection.doc(smsQuery.data[0]._id).update({
      used: true,
      used_at: Date.now()
    })
    
    // 查询或创建用户
    const usersCollection = this.db.collection('uni-id-users')
    const userQuery = await usersCollection.where({ mobile: phone }).get()
    
    let userId
    let userInfo
    let isNewUser = false
    
    if (userQuery.data.length > 0) {
      // 已存在用户
      const existingUser = userQuery.data[0]
      userId = existingUser._id
      
      await usersCollection.doc(userId).update({
        last_login_date: Date.now()
      })
      
      userInfo = existingUser
    } else {
      // 新用户
      isNewUser = true
      const newUser = {
        mobile: phone,
        mobile_confirmed: 1,
        nickname: `玩家${phone.substr(-4)}`,
        register_date: Date.now(),
        last_login_date: Date.now(),
        status: 0,
        level: 1,
        exp: 0
      }
      
      const createResult = await usersCollection.add(newUser)
      userId = createResult.id
      userInfo = { ...newUser, _id: userId }
    }
    
    // 生成token
    const tokenExpired = Date.now() + 7 * 24 * 60 * 60 * 1000
    const token = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2)}`
    
    return this._success({
      token,
      tokenExpired,
      userInfo: {
        _id: userInfo._id,
        mobile: userInfo.mobile,
        nickname: userInfo.nickname,
        avatar: userInfo.avatar || '',
        level: userInfo.level || 1,
        exp: userInfo.exp || 0
      },
      isNewUser
    }, isNewUser ? '注册成功' : '登录成功')
  },
  
  /**
   * 获取当前用户信息
   */
  async getInfo() {
    this._checkAuth()
    
    const userResult = await this.db.collection('uni-id-users')
      .doc(this.currentUserId)
      .get()
    
    if (!userResult.data || userResult.data.length === 0) {
      throw new Error('用户不存在')
    }
    
    const userInfo = userResult.data[0]
    
    // 统计关注数和粉丝数
    const followingCount = await this.db.collection('botc-user-follows')
      .where({ follower_id: this.currentUserId, status: 1 })
      .count()
    
    const followersCount = await this.db.collection('botc-user-follows')
      .where({ following_id: this.currentUserId, status: 1 })
      .count()
    
    return this._success({
      _id: userInfo._id,
      uid: userInfo._id,
      mobile: userInfo.mobile,
      nickname: userInfo.nickname,
      avatar: userInfo.avatar || '',
      gender: userInfo.gender || 0,
      level: userInfo.level || 1,
      exp: userInfo.exp || 0,
      following_count: followingCount.total || 0,
      followers_count: followersCount.total || 0,
      background_image: userInfo.background_image || ''
    })
  },
  
  /**
   * 更新用户信息
   * @param {Object} data - 要更新的数据
   */
  async update(data) {
    this._checkAuth()
    
    const { nickname, avatar, gender, background_image } = data
    const updateData = {}
    
    if (nickname !== undefined) {
      if (!nickname || nickname.trim().length === 0) {
        throw new Error('昵称不能为空')
      }
      if (nickname.length > 20) {
        throw new Error('昵称不能超过20个字符')
      }
      updateData.nickname = nickname.trim()
    }
    
    if (avatar !== undefined) {
      updateData.avatar = avatar
    }
    
    if (gender !== undefined) {
      if (![0, 1, 2].includes(gender)) {
        throw new Error('性别参数错误')
      }
      updateData.gender = gender
    }
    
    if (background_image !== undefined) {
      updateData.background_image = background_image
    }
    
    if (Object.keys(updateData).length === 0) {
      throw new Error('没有要更新的数据')
    }
    
    await this.db.collection('uni-id-users')
      .doc(this.currentUserId)
      .update(updateData)
    
    // 返回更新后的信息
    return await this.getInfo()
  },
  
  /**
   * 登出
   */
  async logout() {
    this._checkAuth()
    
    await this.db.collection('uni-id-users')
      .doc(this.currentUserId)
      .update({
        last_logout_date: Date.now()
      })
    
    return this._success(null, '登出成功')
  }
  
  // ... 其他方法
}
```

---

## 🔄 迁移步骤规划

### 阶段一：用户模块（1-2天）✅ 优先

**目标：**完成用户云对象，替代 14 个用户相关云函数

**步骤：**
1. 创建 `user/index.obj.js`
2. 实现基础方法（登录、登出、获取信息、更新信息）
3. 实现高级方法（关注、等级、统计）
4. 前端代码适配
5. 测试验证

**预期成果：**
- ✅ 减少 14 个云函数文件
- ✅ 代码量减少约 40%
- ✅ 调用更直观

---

### 阶段二：剧本模块（2-3天）

**目标：**完成剧本云对象，替代 14 个剧本相关云函数

**步骤：**
1. 创建 `script/index.obj.js`
2. 实现列表、详情、上传、删除
3. 实现评价、评分系统
4. 实现排行榜功能
5. 前端代码适配
6. 测试验证

---

### 阶段三：拼车模块（1-2天）

**目标：**完成拼车云对象，替代 9 个拼车相关云函数

**步骤：**
1. 创建 `carpool/index.obj.js`
2. 实现拼车创建、报名、管理
3. 实现状态管理
4. 前端代码适配
5. 测试验证

---

### 阶段四：社交模块（2-3天）

**目标：**完成 chat + post 云对象

**步骤：**
1. 创建 `chat/index.obj.js` - 私聊功能
2. 创建 `post/index.obj.js` - 帖子功能
3. 前端代码适配
4. 测试验证

---

### 阶段五：其他模块（2-3天）

**目标：**完成剩余 5 个云对象

**步骤：**
1. 创建 `collection/index.obj.js` - 收藏历史
2. 创建 `storyteller/index.obj.js` - 说书人
3. 创建 `wiki/index.obj.js` - 百科
4. 创建 `shop/index.obj.js` - 店铺
5. 创建 `system/index.obj.js` - 系统
6. 前端代码适配
7. 测试验证

---

### 阶段六：清理与优化（1天）

**目标：**清理旧云函数，优化代码

**步骤：**
1. 删除旧的云函数文件
2. 统一错误处理
3. 性能优化
4. 文档更新

---

## 📱 前端调用方式对比

### 旧方式（云函数）
```javascript
// 调用多个云函数
const loginRes = await uniCloud.callFunction({
  name: 'user-login',
  data: { phone: '13800138000', code: '123456' }
})

const infoRes = await uniCloud.callFunction({
  name: 'user-info',
  data: { token: loginRes.result.data.token }
})

const updateRes = await uniCloud.callFunction({
  name: 'user-update',
  data: { 
    token: loginRes.result.data.token,
    nickname: '新昵称' 
  }
})
```

### 新方式（云对象）
```javascript
// 导入云对象（只需一次）
const userObj = uniCloud.importObject('user')

// 链式调用，代码更简洁
const loginRes = await userObj.login('13800138000', '123456')
const infoRes = await userObj.getInfo()
const updateRes = await userObj.update({ nickname: '新昵称' })

// token 自动传递，无需手动管理
```

---

## 🎯 迁移的核心优势

### 1. **代码组织更清晰**
- 从 73 个独立文件 → 10 个业务对象
- 相关功能集中管理
- 便于查找和维护

### 2. **开发效率提升**
- 方法调用更直观（面向对象）
- 减少重复代码（共享 this）
- 统一的错误处理和鉴权

### 3. **性能优化**
- 减少云函数冷启动次数
- 共享数据库连接
- 减少网络请求

### 4. **易于扩展**
- 新增功能只需添加方法
- 便于实现业务逻辑复用
- 支持继承和组合

### 5. **前端调用简化**
- 不需要传递 token（自动处理）
- 链式调用更优雅
- 代码量减少 30-50%

---

## ⚠️ 注意事项

### 1. **兼容性处理**
- 逐步迁移，新旧共存
- 保留旧云函数一段时间
- 前端代码分批次更新

### 2. **鉴权处理**
```javascript
// 云对象中使用 _before 统一鉴权
_before: function() {
  this.token = this.getUniIdToken()
  this.currentUserId = this._parseUserId(this.token)
}
```

### 3. **错误处理**
```javascript
// 使用 _after 统一处理错误
_after: function(error, result) {
  if (error) {
    console.error('云对象错误：', error)
    throw error
  }
  return result
}
```

### 4. **性能监控**
- 监控云对象调用次数
- 记录执行时间
- 优化慢查询

---

## 📊 预期收益

### 代码量对比
| 项目 | 云函数 | 云对象 | 减少比例 |
|------|-------|-------|---------|
| 文件数量 | 73 个 | 10 个 | -86% |
| 代码行数 | ~8000 行 | ~4500 行 | -44% |
| 重复代码 | 高 | 低 | -60% |

### 开发效率提升
- **新功能开发**：快 40%
- **Bug 修复**：快 50%
- **代码审查**：快 60%

### 维护成本降低
- **查找代码**：快 70%
- **理解业务**：快 50%
- **代码重构**：快 60%

---

## 🚀 开始迁移

### 推荐顺序
1. ✅ **user** - 用户模块（最基础，影响最大）
2. **script** - 剧本模块（核心业务）
3. **carpool** - 拼车模块（独立性强）
4. **chat + post** - 社交模块（互相关联）
5. **其他模块** - 逐步完成

### 验收标准
- ✅ 所有功能正常运行
- ✅ 前端调用无报错
- ✅ 性能无明显下降
- ✅ 代码通过审查
- ✅ 文档更新完成

---

## 📚 参考资料

- [uniCloud 云对象官方文档](https://uniapp.dcloud.net.cn/uniCloud/cloud-obj.html)
- [云函数迁移到云对象指南](https://uniapp.dcloud.net.cn/uniCloud/clientdb.html)
- [云对象最佳实践](https://uniapp.dcloud.net.cn/uniCloud/cloud-obj.html#best-practice)

---

**制定时间：** 2025-01-XX
**预计完成：** 10-15 个工作日
**负责人：** 开发团队
**状态：** 📋 规划中

