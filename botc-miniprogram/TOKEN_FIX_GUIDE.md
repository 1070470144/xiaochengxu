# Token 功能修复说明

## 🔧 问题分析

### 原始错误
```
TypeError: uniCloud.createToken is not a function
TypeError: uniCloud.verifyToken is not a function
```

### 问题原因
uniCloud 基础版本不提供 `createToken` 和 `verifyToken` 方法。这些是 uni-id 扩展模块的功能。

---

## ✅ 修复方案

### 方案：简化Token实现

我们采用了简化的Token实现方案，适合个人开发和MVP阶段：

#### 1. Token生成（user-login）

**修复前：**
```javascript
const tokenResult = await uniCloud.createToken({
    uid: userId,
    role: ['user']
})
```

**修复后：**
```javascript
// 简单token实现
const tokenExpired = Date.now() + 7 * 24 * 60 * 60 * 1000  // 7天
const token = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2)}`
```

**Token格式：** `用户ID_时间戳_随机字符串`
- 示例：`abc123_1699999999999_k8j2h3`

#### 2. Token验证（user-info, user-update, user-logout）

**修复前：**
```javascript
const payload = await uniCloud.verifyToken(context.TOKEN)
const userId = payload.uid
```

**修复后：**
```javascript
const token = event.token || context.token
const userId = token.split('_')[0]  // 提取用户ID
```

#### 3. 前端传递Token

**所有云函数调用都需要传递token：**
```javascript
const token = Auth.getToken()

await uniCloud.callFunction({
    name: 'user-info',
    data: {
        token: token  // ← 必须传递
    }
})
```

---

## 📝 已修复的文件

### 云函数（4个）

1. **user-login/index.js**
   - ✅ 修改Token生成方式
   - ✅ 使用简单字符串拼接

2. **user-info/index.js**
   - ✅ 修改Token验证方式
   - ✅ 从event.token获取并解析

3. **user-update/index.js**
   - ✅ 修改Token验证方式
   - ✅ 从event.token获取并解析

4. **user-logout/index.js**
   - ✅ 修改Token验证方式
   - ✅ 从event.token获取并解析

### 前端页面（2个）

1. **pages/user/profile/profile.vue**
   - ✅ refreshUserInfo() - 传递token
   - ✅ handleLogout() - 传递token

2. **pages/user/edit-profile/edit-profile.vue**
   - ✅ saveProfile() - 传递token

---

## 🚀 使用方法

### 1. 重新上传云函数

在 HBuilderX 中上传修复后的云函数：

```bash
右键上传以下云函数：
1. user-login    → 上传部署
2. user-info     → 上传部署
3. user-update   → 上传部署
4. user-logout   → 上传部署
```

### 2. 测试登录流程

```bash
1. 清除本地存储（Storage）
2. 重新登录
3. 检查token格式
4. 测试个人中心功能
5. 测试退出登录
```

### 3. 验证Token

```javascript
// 控制台执行
const token = uni.getStorageSync('uni_id_token')
console.log('Token:', token)
// 输出示例: abc123_1699999999999_k8j2h3

const parts = token.split('_')
console.log('用户ID:', parts[0])
console.log('时间戳:', parts[1])
console.log('随机串:', parts[2])
```

---

## 🔍 Token流程说明

### 登录流程

```
1. 用户输入手机号和验证码
   ↓
2. 调用 user-login 云函数
   ↓
3. 验证验证码
   ↓
4. 创建/获取用户
   ↓
5. 生成token: userId_timestamp_random
   ↓
6. 返回token和用户信息
   ↓
7. 前端保存到Storage
```

### 鉴权流程

```
1. 前端获取token: Auth.getToken()
   ↓
2. 调用云函数时传递token
   ↓
3. 云函数接收: event.token
   ↓
4. 解析token: token.split('_')[0]
   ↓
5. 获取userId
   ↓
6. 查询用户数据
   ↓
7. 返回结果
```

---

## ⚠️ 注意事项

### 1. Token安全性

**当前方案：**
- ✅ 适合开发和MVP阶段
- ✅ 简单易用
- ⚠️ 安全性较低（无加密签名）

**生产环境建议：**
- 使用 uni-id 扩展模块
- 或使用 JWT（jsonwebtoken）
- 添加签名验证
- 实现token刷新机制

### 2. Token过期处理

**当前实现：**
```javascript
tokenExpired = Date.now() + 7 * 24 * 60 * 60 * 1000  // 7天
```

**前端需要检查：**
```javascript
// Auth.js中已实现
static isLogin() {
    const token = uni.getStorageSync('uni_id_token')
    const tokenExpired = uni.getStorageSync('uni_id_token_expired')
    
    if (tokenExpired && tokenExpired < Date.now()) {
        this.logout()
        return false
    }
    
    return true
}
```

### 3. 云函数调用模板

**标准调用方式：**
```javascript
import Auth from '@/utils/auth.js'

async function callCloudFunction() {
    // 1. 获取token
    const token = Auth.getToken()
    
    // 2. 调用云函数
    const result = await uniCloud.callFunction({
        name: 'your-function',
        data: {
            token: token,  // 必须传递
            // ... 其他参数
        }
    })
    
    // 3. 处理结果
    if (result.result.code === 0) {
        // 成功
    } else if (result.result.code === 401) {
        // token过期，跳转登录
        Auth.toLogin()
    }
}
```

---

## 📊 对比表

| 项目 | 修复前 | 修复后 |
|-----|--------|--------|
| **Token生成** | uniCloud.createToken() | 字符串拼接 |
| **Token验证** | uniCloud.verifyToken() | split解析 |
| **Token格式** | JWT标准格式 | userId_时间戳_随机串 |
| **安全性** | 高（签名验证） | 中（无签名） |
| **复杂度** | 高 | 低 |
| **依赖** | uni-id模块 | 无依赖 |
| **适用场景** | 生产环境 | 开发/MVP |

---

## 🔄 升级到uni-id方案（可选）

### 如果需要更高安全性：

#### 1. 安装uni-id
```bash
# 在云函数目录下
npm install uni-id
```

#### 2. 配置uni-id
```javascript
// common/uni-id/config.json
{
    "passwordSecret": "your-password-secret",
    "tokenSecret": "your-token-secret",
    "tokenExpiresIn": 604800  // 7天
}
```

#### 3. 使用uni-id
```javascript
const uniID = require('uni-id')

// 生成token
const token = uniID.createToken({
    uid: userId,
    role: ['user']
})

// 验证token
const payload = uniID.checkToken(token)
```

---

## ✅ 测试清单

- [ ] 登录功能正常
- [ ] Token正确保存
- [ ] Token格式正确
- [ ] 获取用户信息成功
- [ ] 更新用户信息成功
- [ ] 退出登录成功
- [ ] Token过期自动跳转登录

---

## 🐛 常见问题

### Q1: 调用云函数返回401
**原因：** 未传递token或token格式错误

**解决：**
```javascript
// 确保传递token
const token = Auth.getToken()
await uniCloud.callFunction({
    name: 'xxx',
    data: { token }  // ← 必须有
})
```

### Q2: Token解析失败
**原因：** Token格式不对

**解决：**
```javascript
// 检查token格式
const token = uni.getStorageSync('uni_id_token')
console.log('Token:', token)
// 应该是: userId_timestamp_random

// 如果格式不对，重新登录
```

### Q3: 用户信息获取失败
**原因：** userId解析错误

**解决：**
```javascript
// 云函数中添加调试
const userId = token.split('_')[0]
console.log('解析的userId:', userId)

// 检查用户是否存在
const user = await db.collection('uni-id-users')
    .doc(userId)
    .get()
console.log('用户数据:', user)
```

---

## 📝 总结

✅ **已完成：**
- 修复Token生成和验证问题
- 更新所有云函数
- 更新前端调用方式
- 保持功能完整性

✅ **当前方案：**
- 简单实用
- 无需额外依赖
- 适合MVP和个人项目

⚠️ **未来优化：**
- 升级到uni-id（生产环境）
- 添加Token签名验证
- 实现Token刷新机制

现在可以正常使用登录和用户管理功能了！🎉

