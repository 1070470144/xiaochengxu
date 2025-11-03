# User 云对象前端适配指南

## 📋 需要适配的文件列表

### 高优先级（核心功能）
1. ✅ **pages/login/sms-login.vue** - 登录页（已完成）
2. 🔄 **pages/user/profile/profile.vue** - 个人中心（进行中）
3. 🔲 **pages/user/edit-profile/edit-profile.vue** - 编辑资料
4. 🔲 **pages/user/other-profile/other-profile.vue** - 他人资料
5. 🔲 **pages/user/following/following.vue** - 关注列表
6. 🔲 **pages/user/followers/followers.vue** - 粉丝列表

### 中优先级
7. 🔲 **pages/storyteller/detail/detail.vue** - 说书人详情
8. 🔲 **pages/community/detail/detail.vue** - 社区详情
9. 🔲 **pages/ranking/index.vue** - 排行榜

### 低优先级
10. 🔲 其他使用到用户功能的页面

---

## 🔧 适配步骤

### 第 1 步：导入云对象工具

在 `<script>` 标签中添加导入：

```javascript
import { getUserCloudObject } from '@/common/userCloudObject.js'
```

### 第 2 步：添加数据属性

在 `data()` 中添加：

```javascript
data() {
  return {
    // ... 其他数据
    userObj: null  // 用户云对象
  }
}
```

### 第 3 步：初始化云对象

在 `onLoad()` 中初始化：

```javascript
onLoad() {
  this.userObj = getUserCloudObject()
  // ... 其他初始化代码
}
```

### 第 4 步：替换云函数调用

#### 原云函数调用方式：
```javascript
const result = await uniCloud.callFunction({
  name: 'user-info',
  data: {
    token: Auth.getToken()
  }
})

if (result.result.code === 0) {
  this.userInfo = result.result.data
}
```

#### 新云对象调用方式：
```javascript
const result = await this.userObj.getInfo()

if (result.code === 0) {
  this.userInfo = result.data
}
```

---

## 📝 各云函数替换对照表

| 原云函数 | 云对象方法 | 参数变化 | 返回值变化 |
|---------|-----------|---------|-----------|
| user-send-sms | sendSms(phone, type) | ✅ 无需token | result.data → result.data |
| user-login | login(phone, code) | ✅ 无需token | result.data → result.data |
| user-info | getInfo() | ❌ 无需传参，自动获取当前用户 | result.result.data → result.data |
| user-update | update(data) | ❌ 无需token，直接传数据对象 | result.result.data → result.data |
| user-logout | logout() | ❌ 无需token | result.result.data → result.data |
| user-profile | getProfile(userId) | ✅ 传目标用户ID | result.result.data → result.data |
| user-follow | follow(targetUserId) | ✅ 传目标用户ID | result.result.data → result.data |
| user-unfollow | unfollow(targetUserId) | ✅ 传目标用户ID | result.result.data → result.data |
| user-following-list | getFollowingList(page, pageSize) | ✅ 分页参数 | result.result.data → result.data |
| user-followers-list | getFollowersList(page, pageSize) | ✅ 分页参数 | result.result.data → result.data |
| user-level-info | getLevel(targetUserId) | ✅ 可选用户ID | result.result.data → result.data |
| user-add-exp | addExp(targetUserId, expAmount, reason) | ✅ 三个参数 | result.result.data → result.data |

---

## 🎯 具体页面适配示例

### pages/user/profile/profile.vue

#### 1. 获取用户信息
```javascript
// ❌ 旧代码
const result = await uniCloud.callFunction({
  name: 'user-info',
  data: { token: Auth.getToken() }
})
if (result.result.code === 0) {
  this.userInfo = result.result.data
}

// ✅ 新代码
const result = await this.userObj.getInfo()
if (result.code === 0) {
  this.userInfo = result.data
}
```

#### 2. 更新背景图片
```javascript
// ❌ 旧代码
const result = await uniCloud.callFunction({
  name: 'user-update',
  data: {
    background_image: imageUrl,
    token: Auth.getToken()
  }
})

// ✅ 新代码
const result = await this.userObj.update({
  background_image: imageUrl
})
```

#### 3. 退出登录
```javascript
// ❌ 旧代码
await uniCloud.callFunction({
  name: 'user-logout',
  data: { token: Auth.getToken() }
})

// ✅ 新代码
await this.userObj.logout()
```

---

### pages/user/other-profile/other-profile.vue

#### 获取他人资料
```javascript
// ❌ 旧代码
const result = await uniCloud.callFunction({
  name: 'user-profile',
  data: {
    user_id: this.userId,
    token: Auth.getToken()
  }
})
if (result.result.code === 0) {
  this.userInfo = result.result.data.user
  this.userStats = result.result.data.stats
}

// ✅ 新代码
const result = await this.userObj.getProfile(this.userId)
if (result.code === 0) {
  this.userInfo = result.data.user
  this.userStats = result.data.stats
  this.followStatus = result.data.follow_status
}
```

#### 关注/取消关注
```javascript
// ❌ 旧代码
const result = await uniCloud.callFunction({
  name: 'user-follow',
  data: {
    target_user_id: this.userId,
    action: this.isFollowing ? 'unfollow' : 'follow',
    token: Auth.getToken()
  }
})

// ✅ 新代码
const result = this.isFollowing 
  ? await this.userObj.unfollow(this.userId)
  : await this.userObj.follow(this.userId)
```

---

### pages/user/following/following.vue

#### 获取关注列表
```javascript
// ❌ 旧代码
const result = await uniCloud.callFunction({
  name: 'user-following-list',
  data: {
    page: this.currentPage,
    page_size: this.pageSize,
    token: Auth.getToken()
  }
})
if (result.result.code === 0) {
  this.followingList = result.result.data.list
  this.total = result.result.data.total
}

// ✅ 新代码
const result = await this.userObj.getFollowingList(this.currentPage, this.pageSize)
if (result.code === 0) {
  this.followingList = result.data.list
  this.total = result.data.total
}
```

---

### pages/user/followers/followers.vue

#### 获取粉丝列表
```javascript
// ❌ 旧代码
const result = await uniCloud.callFunction({
  name: 'user-followers-list',
  data: {
    page: this.currentPage,
    page_size: this.pageSize,
    token: Auth.getToken()
  }
})

// ✅ 新代码
const result = await this.userObj.getFollowersList(this.currentPage, this.pageSize)
if (result.code === 0) {
  this.followersList = result.data.list
  this.total = result.data.total
}
```

---

## ⚠️ 注意事项

### 1. 返回值格式变化
- **旧：** `result.result.code` 和 `result.result.data`
- **新：** `result.code` 和 `result.data`

### 2. Token 管理
- ✅ **云对象自动处理 token**，不需要手动传递
- ✅ Token 从 `uniIdToken` 或本地存储自动获取
- ❌ 不要再传递 `token` 参数

### 3. 错误处理
云对象的错误统一通过 `_after` 钩子处理，返回格式为：
```javascript
{
  code: 500,
  message: "错误信息",
  data: null
}
```

### 4. 未登录处理
需要登录的接口会自动检查，返回：
```javascript
{
  code: 500,
  message: "请先登录",
  data: null
}
```

---

## ✅ 测试清单

适配完成后，需要测试以下功能：

- [ ] 登录流程
- [ ] 获取用户信息
- [ ] 更新用户资料
- [ ] 查看他人资料
- [ ] 关注/取消关注
- [ ] 关注列表
- [ ] 粉丝列表
- [ ] 等级信息
- [ ] 退出登录

---

## 📦 上传部署

适配完成后：
1. 确保 `user` 云对象已上传到云端
2. 测试所有适配的页面
3. 发现问题及时修复

---

**适配开始时间：** 2025-11-03  
**预计完成时间：** 待定  
**当前进度：** 1/10 页面完成

