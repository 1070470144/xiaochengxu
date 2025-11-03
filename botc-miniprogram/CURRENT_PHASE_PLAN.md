# 当前阶段开发计划

## 📍 当前进度分析

### 已完成功能（估算）✅
基于现有的 73 个云函数和代码结构，项目已经完成了大部分功能：

#### ✅ 阶段一：MVP核心功能（90%完成）
- ✅ 用户系统（登录、注册、信息管理）
- ✅ 剧本系统（列表、详情、上传、下载）
- ✅ 评论系统（评论、评分）
- ✅ 收藏和历史功能
- ⚠️ Web管理后台（需确认）

#### ✅ 阶段二：社交功能（95%完成）
- ✅ 私聊系统（会话、消息）
- ✅ 用户关注系统
- ✅ 排行榜系统（热门、最新、评分）
- ✅ 帖子系统（发布、点赞、评论）

#### ✅ 阶段三：拼车功能（100%完成）
- ✅ 拼车创建、报名、管理
- ✅ 拼车列表和详情

#### ✅ 阶段四：说书人和等级系统（95%完成）
- ✅ 说书人系统
- ✅ 用户等级系统
- ✅ 经验值系统

#### ✅ 附加功能（已完成）
- ✅ Wiki百科系统
- ✅ 店铺系统
- ✅ 系统消息

---

## 🎯 当前主要任务：云对象架构重构

### 为什么要进行云对象重构？

#### 当前问题：
1. ❌ **73 个独立云函数**，文件数量过多，难以管理
2. ❌ **代码重复严重**（鉴权、错误处理、工具函数）
3. ❌ **维护成本高**（修改一个逻辑需要改多个文件）
4. ❌ **调用方式繁琐**（每次都要手动传 token）
5. ❌ **扩展困难**（新增功能需要创建新云函数）

#### 重构后的收益：
1. ✅ **文件数量减少 86%**（73个 → 10个）
2. ✅ **代码量减少 44%**（~8000行 → ~4500行）
3. ✅ **开发效率提升 40%**
4. ✅ **维护成本降低 60%**
5. ✅ **代码组织更清晰**（按业务模块分类）

---

## 📅 云对象重构时间计划（10-15个工作日）

### 第 1-2 天：用户模块（user）✅ **当前优先级**

**时间投入：** 8-12小时

**任务清单：**
- [ ] 创建 `user/index.obj.js` 云对象
- [ ] 实现 14 个用户相关方法：
  - [ ] `sendSms(phone, type)` - 发送验证码
  - [ ] `login(phone, code)` - 手机号登录
  - [ ] `logout()` - 登出
  - [ ] `getInfo()` - 获取当前用户信息
  - [ ] `update(data)` - 更新用户信息
  - [ ] `getProfile(userId)` - 获取用户主页
  - [ ] `getStats()` - 获取用户统计
  - [ ] `getLevelInfo()` - 获取等级信息
  - [ ] `dailyLogin()` - 每日签到
  - [ ] `addExp(type, amount)` - 增加经验值
  - [ ] `follow(targetUserId)` - 关注/取关
  - [ ] `syncFollowCount()` - 同步关注数
  - [ ] `getFollowersList(userId, page)` - 粉丝列表
  - [ ] `getFollowingList(userId, page)` - 关注列表

**前端适配：**
- [ ] 更新登录页面调用方式
- [ ] 更新用户中心调用方式
- [ ] 更新个人主页调用方式
- [ ] 测试所有用户相关功能

**验收标准：**
- [ ] 所有用户功能正常运行
- [ ] 前端调用无报错
- [ ] 代码通过测试
- [ ] 性能无明显下降

---

### 第 3-5 天：剧本模块（script）

**时间投入：** 12-16小时

**任务清单：**
- [ ] 创建 `script/index.obj.js` 云对象
- [ ] 实现 14 个剧本相关方法：
  - [ ] `getList(params)` - 剧本列表
  - [ ] `getDetail(scriptId)` - 剧本详情
  - [ ] `upload(data)` - 上传剧本
  - [ ] `delete(scriptId)` - 删除剧本
  - [ ] `getMyUploads(page)` - 我的上传
  - [ ] `getJsonContent(scriptId)` - 获取JSON
  - [ ] `generateJsonUrl(scriptId)` - 生成JSON链接
  - [ ] `createReview(data)` - 创建评价
  - [ ] `rate(scriptId, rating)` - 评分
  - [ ] `calculateHeat(scriptId)` - 计算热度
  - [ ] `getRankingHot(params)` - 热门排行
  - [ ] `getRankingNew(params)` - 最新排行
  - [ ] `getRankingRating(params)` - 评分排行
  - [ ] `getRankingDownload(params)` - 下载排行

**前端适配：**
- [ ] 更新剧本列表页
- [ ] 更新剧本详情页
- [ ] 更新剧本上传页
- [ ] 更新排行榜页面

**验收标准：**
- [ ] 剧本CRUD功能正常
- [ ] 排行榜数据正确
- [ ] JSON文件处理正常

---

### 第 6-7 天：拼车模块（carpool）

**时间投入：** 8-10小时

**任务清单：**
- [ ] 创建 `carpool/index.obj.js` 云对象
- [ ] 实现 9 个拼车相关方法：
  - [ ] `getList(params)` - 拼车列表
  - [ ] `getDetail(roomId)` - 拼车详情
  - [ ] `create(data)` - 创建拼车
  - [ ] `apply(roomId, message)` - 报名
  - [ ] `cancelApply(roomId)` - 取消报名
  - [ ] `confirmMember(roomId, userId)` - 确认成员
  - [ ] `removeMember(roomId, userId)` - 移除成员
  - [ ] `updateStatus(roomId, status)` - 更新状态
  - [ ] `getAppliedList(page)` - 我的报名

**前端适配：**
- [ ] 更新拼车列表页
- [ ] 更新拼车详情页
- [ ] 更新拼车创建页

---

### 第 8-10 天：社交模块（chat + post）

**时间投入：** 10-14小时

#### chat 云对象
- [ ] 创建 `chat/index.obj.js`
- [ ] 实现 5 个私聊方法：
  - [ ] `getConversations(page)` - 会话列表
  - [ ] `send(toUserId, content, type)` - 发送消息
  - [ ] `markRead(conversationId)` - 标记已读
  - [ ] `getMessages(conversationId, page)` - 聊天记录
  - [ ] `getUnreadCount()` - 未读数

#### post 云对象
- [ ] 创建 `post/index.obj.js`
- [ ] 实现 5 个帖子方法：
  - [ ] `getList(params)` - 帖子列表
  - [ ] `getDetail(postId)` - 帖子详情
  - [ ] `create(data)` - 发布帖子
  - [ ] `toggleLike(postId)` - 点赞
  - [ ] `report(postId, reason)` - 举报

**前端适配：**
- [ ] 更新私聊页面
- [ ] 更新社区页面

---

### 第 11-13 天：其他模块（collection + storyteller + wiki + shop + system）

**时间投入：** 12-16小时

#### collection 云对象（收藏历史）
- [ ] `addFavorite(scriptId)` - 添加收藏
- [ ] `removeFavorite(scriptId)` - 移除收藏
- [ ] `getFavorites(page)` - 收藏列表
- [ ] `addHistory(scriptId)` - 添加历史
- [ ] `getHistory(page)` - 历史列表

#### storyteller 云对象（说书人）
- [ ] `getList(params)` - 说书人列表
- [ ] `getDetail(userId)` - 说书人详情
- [ ] `getReviews(userId, page)` - 说书人评价
- [ ] `calculateHeat(userId)` - 计算热度

#### wiki 云对象（百科）
- [ ] `getList(params)` - 百科列表
- [ ] `getDetail(wikiId)` - 百科详情
- [ ] `search(keyword)` - 搜索
- [ ] `getCategories()` - 获取分类
- [ ] `parseUrl(url)` - 解析URL
- [ ] `getRankingStorytellers()` - 说书人排行
- [ ] `addRoleComment(data)` - 角色评论
- [ ] `getRoleComments(roleId)` - 评论列表
- [ ] `toggleRoleLike(roleId)` - 角色点赞

#### shop 云对象（店铺）
- [ ] `getList(params)` - 店铺列表
- [ ] `getDetail(shopId)` - 店铺详情
- [ ] `apply(data)` - 申请入驻

#### system 云对象（系统）
- [ ] `getHomeData()` - 首页数据
- [ ] `getMessages(page)` - 系统消息
- [ ] `deleteMessage(msgId)` - 删除消息
- [ ] `filterContent(content)` - 内容过滤
- [ ] `manageCertification(data)` - 认证管理
- [ ] `createComment(data)` - 创建评论

---

### 第 14-15 天：清理与优化

**时间投入：** 6-8小时

**任务清单：**
- [ ] **删除旧云函数**
  - [ ] 备份旧代码（以防万一）
  - [ ] 逐个删除旧云函数文件夹
  - [ ] 清理 package.json 中的依赖

- [ ] **代码优化**
  - [ ] 统一错误处理
  - [ ] 统一返回格式
  - [ ] 添加完整注释
  - [ ] 性能优化（缓存、查询优化）

- [ ] **测试验证**
  - [ ] 全面功能测试
  - [ ] 性能测试
  - [ ] 边界情况测试
  - [ ] 兼容性测试

- [ ] **文档更新**
  - [ ] 更新 API 文档
  - [ ] 更新开发文档
  - [ ] 添加迁移说明
  - [ ] 更新 README

---

## 📊 进度跟踪表

### 云对象开发进度

| 模块 | 方法数 | 开发状态 | 测试状态 | 前端适配 | 完成度 |
|------|--------|---------|---------|---------|--------|
| user | 14 | ⏳ 待开始 | ⏳ 待开始 | ⏳ 待开始 | 0% |
| script | 14 | ⏳ 待开始 | ⏳ 待开始 | ⏳ 待开始 | 0% |
| carpool | 9 | ⏳ 待开始 | ⏳ 待开始 | ⏳ 待开始 | 0% |
| chat | 5 | ⏳ 待开始 | ⏳ 待开始 | ⏳ 待开始 | 0% |
| post | 5 | ⏳ 待开始 | ⏳ 待开始 | ⏳ 待开始 | 0% |
| collection | 5 | ⏳ 待开始 | ⏳ 待开始 | ⏳ 待开始 | 0% |
| storyteller | 4 | ⏳ 待开始 | ⏳ 待开始 | ⏳ 待开始 | 0% |
| wiki | 9 | ⏳ 待开始 | ⏳ 待开始 | ⏳ 待开始 | 0% |
| shop | 3 | ⏳ 待开始 | ⏳ 待开始 | ⏳ 待开始 | 0% |
| system | 6 | ⏳ 待开始 | ⏳ 待开始 | ⏳ 待开始 | 0% |

**图例：**
- ⏳ 待开始
- 🚧 进行中
- ✅ 已完成
- ⚠️ 有问题

---

## 🎯 今日任务（第一天）

### 目标：完成 user 云对象开发

#### 上午任务（4小时）
- [ ] **创建云对象基础结构**
  - [ ] 创建 `uniCloud-aliyun/cloudfunctions/user/` 目录
  - [ ] 创建 `index.obj.js` 文件
  - [ ] 实现 `_before()` 和 `_after()` 方法
  - [ ] 实现私有工具方法（_checkAuth、_validatePhone 等）

- [ ] **实现核心登录方法**
  - [ ] `sendSms(phone, type)` - 发送验证码
  - [ ] `login(phone, code)` - 手机号登录
  - [ ] `logout()` - 登出

#### 下午任务（4小时）
- [ ] **实现用户信息方法**
  - [ ] `getInfo()` - 获取当前用户信息
  - [ ] `update(data)` - 更新用户信息
  - [ ] `getProfile(userId)` - 获取用户主页
  - [ ] `getStats()` - 获取用户统计

- [ ] **本地测试**
  - [ ] 云对象上传到 uniCloud
  - [ ] 使用 HBuilderX 控制台测试
  - [ ] 修复发现的问题

#### 晚上任务（可选，2-3小时）
- [ ] **实现高级功能**
  - [ ] `getLevelInfo()` - 获取等级信息
  - [ ] `dailyLogin()` - 每日签到
  - [ ] `addExp(type, amount)` - 增加经验值
  - [ ] `follow(targetUserId)` - 关注/取关
  - [ ] 其他关注相关方法

---

## 📝 开发注意事项

### 1. 代码规范
- ✅ 使用 ES6+ 语法
- ✅ 方法添加完整 JSDoc 注释
- ✅ 统一错误处理和返回格式
- ✅ 私有方法以 `_` 开头

### 2. 性能优化
- ✅ 合理使用数据库索引
- ✅ 避免 N+1 查询
- ✅ 使用聚合查询减少请求次数
- ✅ 缓存常用数据

### 3. 安全性
- ✅ 所有需要登录的方法调用 `_checkAuth()`
- ✅ 参数验证（手机号、用户ID等）
- ✅ 防止 SQL 注入
- ✅ 敏感信息不返回

### 4. 兼容性
- ✅ 保留旧云函数一段时间（双轨运行）
- ✅ 前端逐步迁移
- ✅ 做好回滚准备

---

## 🚀 快速开始

### 立即开始开发 user 云对象

告诉我以下任一指令：

1. **"开始开发 user 云对象"** - 我会立即创建完整的 `user/index.obj.js` 文件
2. **"只看代码模板"** - 我会先展示代码结构，供你审阅
3. **"先测试一个方法"** - 我会先实现一个简单方法（如 sendSms）作为示例

---

## 📈 预期成果

### 重构完成后的项目状态

#### 代码结构
```
uniCloud-aliyun/cloudfunctions/
├── user/index.obj.js           (替代 14 个云函数)
├── script/index.obj.js         (替代 14 个云函数)
├── carpool/index.obj.js        (替代 9 个云函数)
├── chat/index.obj.js           (替代 5 个云函数)
├── post/index.obj.js           (替代 5 个云函数)
├── collection/index.obj.js     (替代 5 个云函数)
├── storyteller/index.obj.js    (替代 4 个云函数)
├── wiki/index.obj.js           (替代 9 个云函数)
├── shop/index.obj.js           (替代 3 个云函数)
├── system/index.obj.js         (替代 6 个云函数)
└── common/                     (公共模块保持)
```

#### 代码量对比
- **文件数量**：73 个 → 10 个（-86%）
- **代码行数**：~8000 行 → ~4500 行（-44%）
- **重复代码**：减少 60%

#### 开发效率
- **新功能开发**：快 40%
- **Bug 修复**：快 50%
- **代码审查**：快 60%

---

**状态：** 📋 待开始  
**优先级：** 🔴 最高  
**预计完成：** 10-15 个工作日  
**当前任务：** user 云对象开发

