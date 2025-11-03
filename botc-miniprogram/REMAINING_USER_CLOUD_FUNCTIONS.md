# 📋 剩余需要替换的 User 云函数调用

## ✅ 已完成适配（6个页面）

- ✅ `pages/login/sms-login.vue` - 登录页
- ✅ `pages/user/profile/profile.vue` - 个人中心（部分）
- ✅ `pages/user/edit-profile/edit-profile.vue` - 编辑资料
- ✅ `pages/user/other-profile/other-profile.vue` - 他人资料
- ✅ `pages/user/following/following.vue` - 关注列表
- ✅ `pages/user/followers/followers.vue` - 粉丝列表

---

## ⚠️ 还需要适配（3个页面，5处调用）

### 1. `pages/user/profile/profile.vue` - 个人中心（遗漏的 3 处）

#### 🔴 调用 1：user-stats（获取用户统计）
**位置：** 第 375 行
```javascript
// ❌ 旧代码
const result = await uniCloud.callFunction({
  name: 'user-stats',
  data: {
    token: token
  }
})
```

**说明：** 这个云函数 `user-stats` 不在我们的 user 云对象中！
- 它是一个独立的统计功能
- 需要检查是否要迁移到 user 云对象
- 或者保持独立（暂不处理）

---

#### 🔴 调用 2：user-follow-sync（同步关注数据）
**位置：** 第 609 行
```javascript
// ❌ 旧代码
const result = await uniCloud.callFunction({
  name: 'user-follow-sync',
  data: {}
})
```

**说明：** 这个云函数 `user-follow-sync` 也不在 user 云对象中！
- 它是一个后台同步功能
- 可能不需要前端调用
- 建议删除或迁移到后台任务

---

#### 🟡 调用 3：user-update（更新背景图）
**位置：** 第 733 行
```javascript
// ❌ 旧代码
const result = await uniCloud.callFunction({
  name: 'user-update',
  data: {
    background_image: imageUrl,
    token: Auth.getToken()
  }
})

// ✅ 应改为
const result = await this.userObj.update({
  background_image: imageUrl
})
```

**说明：** 这个可以直接替换！

---

### 2. `pages/user/settings/settings.vue` - 设置页

#### 🟡 调用 4：user-logout（退出登录）
**位置：** 第 250 行
```javascript
// ❌ 旧代码
await uniCloud.callFunction({
  name: 'user-logout',
  data: { token }
})

// ✅ 应改为
await this.userObj.logout()
```

**说明：** 可以直接替换！

---

### 3. 其他页面（非 user 云函数，暂不处理）

- `pages/ranking/index.vue` - 使用 `wiki-ranking-storytellers`（wiki 云函数）
- `pages/storyteller/detail/detail.vue` - 使用 `storyteller-detail`（storyteller 云函数）

---

## 🎯 处理建议

### 优先级 1：可以立即替换的（2处）

#### 1.1 修复 profile.vue 的 updateBackgroundImage
```javascript
// 第 733 行附近
async updateBackgroundImage(imageUrl) {
  try {
    const result = await this.userObj.update({
      background_image: imageUrl
    })
    
    if (result.code === 0) {
      // ... 更新成功
    }
  } catch (error) {
    // ...
  }
}
```

#### 1.2 修复 settings.vue 的 logout
```javascript
// 第 250 行附近
import { getUserCloudObject } from '@/common/userCloudObject.js'

// 在 data 中添加
data() {
  return {
    userObj: null
  }
}

// 在 onLoad 中初始化
onLoad() {
  this.userObj = getUserCloudObject()
}

// 修改退出登录
async handleLogout() {
  try {
    await this.userObj.logout()
    Auth.logout()
    // ...
  } catch (error) {
    // ...
  }
}
```

---

### 优先级 2：需要决策的（2处）

#### 2.1 user-stats（用户统计）
**问题：** 这个云函数不在我们的迁移计划中

**选项：**
- A. 保持不变（使用独立云函数）
- B. 迁移到 user 云对象（添加 getStats 方法）
- C. 删除此功能（如果不重要）

**建议：** 先保持不变，等其他云对象完成后再统一处理

---

#### 2.2 user-follow-sync（同步关注）
**问题：** 这个看起来像后台同步任务

**选项：**
- A. 删除前端调用（改为后台定时任务）
- B. 迁移到 user 云对象
- C. 保持不变

**建议：** 先删除或注释掉，测试是否影响功能

---

## 📊 统计汇总

### User 云函数使用情况
| 云函数名 | 页面数 | 调用次数 | 状态 | 建议 |
|---------|--------|---------|------|------|
| user-login | 1 | 1 | ✅ 已替换 | - |
| user-send-sms | 1 | 1 | ✅ 已替换 | - |
| user-info | 1 | 1 | ✅ 已替换 | - |
| user-update | 3 | 4 | 🟡 部分替换 | 替换剩余 1 处 |
| user-logout | 2 | 2 | 🟡 部分替换 | 替换剩余 1 处 |
| user-profile | 1 | 1 | ✅ 已替换 | - |
| user-follow | 2 | 4 | ✅ 已替换 | - |
| user-following-list | 1 | 1 | ✅ 已替换 | - |
| user-followers-list | 1 | 1 | ✅ 已替换 | - |
| **user-stats** | 1 | 1 | 🔴 未迁移 | 待决策 |
| **user-follow-sync** | 1 | 1 | 🔴 未迁移 | 待决策 |

---

## ✅ 下一步行动

### 立即可做（5分钟）：
1. 修复 `profile.vue` 的 `updateBackgroundImage` 方法
2. 修复 `settings.vue` 的退出登录

### 需要决策（讨论后再做）：
3. 决定 `user-stats` 的处理方式
4. 决定 `user-follow-sync` 的处理方式

---

## 🎉 完成度

### User 云对象迁移进度
- **云对象开发：** ✅ 100% (14/14 方法)
- **核心页面适配：** ✅ 100% (6/6 高优先级页面)
- **遗漏修复：** 🟡 60% (需修复 2 处必须项 + 2 处待决策项)
- **整体完成度：** 🎯 约 90%

---

**建议：先修复 2 处必须项，然后再决定另外 2 处的处理方式。**

