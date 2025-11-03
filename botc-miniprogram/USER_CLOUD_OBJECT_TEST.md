# User 云对象测试指南

## 📋 已实现的功能

### ✅ 登录模块（4个方法）

| 方法 | 功能 | 参数 | 返回 |
|------|------|------|------|
| `sendSms(phone, type)` | 发送验证码 | phone: 手机号<br>type: 类型(login/register) | devCode: 验证码（开发模式）<br>expiresIn: 有效期(秒) |
| `login(phone, code)` | 手机号登录 | phone: 手机号<br>code: 验证码 | token: 登录令牌<br>userInfo: 用户信息<br>isNewUser: 是否新用户 |
| `logout()` | 用户登出 | 无 | success 消息 |
| `getInfo()` | 获取当前用户信息 | 无 | 用户详细信息（含关注数） |
| `update(data)` | 更新用户信息 | nickname: 昵称<br>avatar: 头像<br>gender: 性别<br>background_image: 背景图 | 更新后的用户信息 |

---

## 🚀 快速测试步骤

### 步骤 1：上传云对象到 uniCloud

1. 打开 **HBuilderX**
2. 找到 `uniCloud-aliyun/cloudfunctions/user` 目录
3. **右键** → **上传部署**
4. 等待部署成功提示

---

### 步骤 2：在 HBuilderX 控制台测试

#### 测试 1：发送验证码

```javascript
// 在 HBuilderX 的 uniCloud 控制台执行
const userObj = uniCloud.importObject('user')

// 发送验证码
const smsResult = await userObj.sendSms('13800138000', 'login')
console.log('验证码结果:', smsResult)
// 预期返回:
// {
//   code: 0,
//   message: '验证码已发送（开发模式）',
//   data: {
//     expiresIn: 180,
//     devCode: '123456' // 6位验证码
//   }
// }
```

#### 测试 2：手机号登录

```javascript
// 使用上一步获取的验证码登录
const loginResult = await userObj.login('13800138000', '123456')
console.log('登录结果:', loginResult)
// 预期返回:
// {
//   code: 0,
//   message: '登录成功' 或 '注册成功',
//   data: {
//     token: 'xxxxx_timestamp_random',
//     tokenExpired: 1234567890,
//     userInfo: {
//       _id: 'user_id',
//       uid: 'user_id',
//       mobile: '13800138000',
//       nickname: '玩家8000',
//       avatar: '',
//       gender: 0,
//       level: 1,
//       exp: 0,
//       ...
//     },
//     isNewUser: true/false
//   }
// }
```

#### 测试 3：获取用户信息（需要先登录）

```javascript
// 注意：需要携带 token，云对象会自动处理
const infoResult = await userObj.getInfo()
console.log('用户信息:', infoResult)
```

#### 测试 4：更新用户信息

```javascript
const updateResult = await userObj.update({
  nickname: '血染玩家',
  gender: 1
})
console.log('更新结果:', updateResult)
```

#### 测试 5：登出

```javascript
const logoutResult = await userObj.logout()
console.log('登出结果:', logoutResult)
```

---

### 步骤 3：前端页面测试（推荐）

创建一个测试页面来验证完整流程：

#### 创建测试页面 `pages/test-login/test-login.vue`

```vue
<template>
  <view class="container">
    <view class="title">User 云对象登录测试</view>
    
    <!-- 发送验证码 -->
    <view class="section">
      <input 
        v-model="phone" 
        type="number" 
        placeholder="请输入手机号"
        maxlength="11"
      />
      <button @click="handleSendSms" :disabled="countdown > 0">
        {{ countdown > 0 ? `${countdown}秒后重试` : '发送验证码' }}
      </button>
      <view v-if="devCode" class="dev-code">
        开发模式验证码：{{ devCode }}
      </view>
    </view>
    
    <!-- 登录 -->
    <view class="section">
      <input 
        v-model="code" 
        type="number" 
        placeholder="请输入验证码"
        maxlength="6"
      />
      <button @click="handleLogin" type="primary">
        登录
      </button>
    </view>
    
    <!-- 用户信息 -->
    <view v-if="userInfo" class="section">
      <view class="user-info">
        <text>用户ID: {{ userInfo._id }}</text>
        <text>昵称: {{ userInfo.nickname }}</text>
        <text>手机号: {{ userInfo.mobile }}</text>
        <text>等级: {{ userInfo.level }}</text>
        <text>经验: {{ userInfo.exp }}</text>
      </view>
      
      <button @click="handleGetInfo">刷新用户信息</button>
      <button @click="handleUpdateInfo">更新昵称</button>
      <button @click="handleLogout">登出</button>
    </view>
    
    <!-- 日志 -->
    <view class="logs">
      <view class="log-title">操作日志：</view>
      <view 
        v-for="(log, index) in logs" 
        :key="index" 
        class="log-item"
      >
        {{ log }}
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      phone: '13800138000',
      code: '',
      devCode: '',
      countdown: 0,
      userInfo: null,
      logs: [],
      userObj: null
    }
  },
  
  onLoad() {
    // 导入云对象
    this.userObj = uniCloud.importObject('user')
    this.addLog('✅ 云对象已导入')
  },
  
  methods: {
    // 添加日志
    addLog(msg) {
      const time = new Date().toLocaleTimeString()
      this.logs.unshift(`[${time}] ${msg}`)
      if (this.logs.length > 10) {
        this.logs.pop()
      }
    },
    
    // 发送验证码
    async handleSendSms() {
      if (!this.phone || this.phone.length !== 11) {
        uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
        return
      }
      
      try {
        this.addLog('📤 发送验证码...')
        const res = await this.userObj.sendSms(this.phone, 'login')
        
        if (res.code === 0) {
          this.devCode = res.data.devCode // 开发模式显示验证码
          this.addLog(`✅ ${res.message}`)
          
          // 开始倒计时
          this.countdown = 60
          const timer = setInterval(() => {
            this.countdown--
            if (this.countdown <= 0) {
              clearInterval(timer)
            }
          }, 1000)
          
          uni.showToast({ title: '验证码已发送', icon: 'success' })
        } else {
          this.addLog(`❌ 发送失败: ${res.message}`)
          uni.showToast({ title: res.message, icon: 'none' })
        }
      } catch (e) {
        this.addLog(`❌ 异常: ${e.message}`)
        uni.showToast({ title: '发送失败', icon: 'none' })
      }
    },
    
    // 登录
    async handleLogin() {
      if (!this.code || this.code.length !== 6) {
        uni.showToast({ title: '请输入6位验证码', icon: 'none' })
        return
      }
      
      try {
        this.addLog('🔐 登录中...')
        const res = await this.userObj.login(this.phone, this.code)
        
        if (res.code === 0) {
          this.userInfo = res.data.userInfo
          this.addLog(`✅ ${res.message}`)
          this.addLog(`👤 用户: ${this.userInfo.nickname}`)
          
          // 保存 token（云对象会自动处理，这里仅作演示）
          uni.setStorageSync('user_token', res.data.token)
          
          uni.showToast({ title: res.message, icon: 'success' })
        } else {
          this.addLog(`❌ 登录失败: ${res.message}`)
          uni.showToast({ title: res.message, icon: 'none' })
        }
      } catch (e) {
        this.addLog(`❌ 异常: ${e.message}`)
        uni.showToast({ title: '登录失败', icon: 'none' })
      }
    },
    
    // 获取用户信息
    async handleGetInfo() {
      try {
        this.addLog('📥 获取用户信息...')
        const res = await this.userObj.getInfo()
        
        if (res.code === 0) {
          this.userInfo = res.data
          this.addLog(`✅ 信息已更新`)
        } else {
          this.addLog(`❌ 获取失败: ${res.message}`)
          uni.showToast({ title: res.message, icon: 'none' })
        }
      } catch (e) {
        this.addLog(`❌ 异常: ${e.message}`)
      }
    },
    
    // 更新用户信息
    async handleUpdateInfo() {
      try {
        this.addLog('✏️ 更新用户信息...')
        const newNickname = '测试玩家_' + Date.now().toString().substr(-4)
        
        const res = await this.userObj.update({
          nickname: newNickname,
          gender: 1
        })
        
        if (res.code === 0) {
          this.userInfo = res.data
          this.addLog(`✅ 昵称已更新为: ${newNickname}`)
          uni.showToast({ title: '更新成功', icon: 'success' })
        } else {
          this.addLog(`❌ 更新失败: ${res.message}`)
          uni.showToast({ title: res.message, icon: 'none' })
        }
      } catch (e) {
        this.addLog(`❌ 异常: ${e.message}`)
      }
    },
    
    // 登出
    async handleLogout() {
      try {
        this.addLog('👋 登出中...')
        const res = await this.userObj.logout()
        
        if (res.code === 0) {
          this.userInfo = null
          this.code = ''
          this.devCode = ''
          this.addLog(`✅ ${res.message}`)
          
          uni.removeStorageSync('user_token')
          uni.showToast({ title: '已登出', icon: 'success' })
        }
      } catch (e) {
        this.addLog(`❌ 异常: ${e.message}`)
      }
    }
  }
}
</script>

<style scoped>
.container {
  padding: 30rpx;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  text-align: center;
  margin-bottom: 40rpx;
  color: #333;
}

.section {
  margin-bottom: 40rpx;
  padding: 30rpx;
  background: #f8f8f8;
  border-radius: 16rpx;
}

input {
  width: 100%;
  height: 80rpx;
  padding: 0 20rpx;
  margin-bottom: 20rpx;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8rpx;
  box-sizing: border-box;
}

button {
  width: 100%;
  margin-top: 10rpx;
}

.dev-code {
  margin-top: 20rpx;
  padding: 20rpx;
  background: #fff3cd;
  border-radius: 8rpx;
  color: #856404;
  text-align: center;
  font-weight: bold;
}

.user-info {
  padding: 20rpx;
  background: white;
  border-radius: 8rpx;
  margin-bottom: 20rpx;
}

.user-info text {
  display: block;
  margin-bottom: 10rpx;
  color: #333;
}

.logs {
  margin-top: 40rpx;
  padding: 20rpx;
  background: #000;
  border-radius: 16rpx;
  max-height: 600rpx;
  overflow-y: auto;
}

.log-title {
  color: #0f0;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.log-item {
  color: #0f0;
  font-size: 24rpx;
  margin-bottom: 8rpx;
  font-family: monospace;
}
</style>
```

---

## 📝 验收清单

### 功能验收

- [ ] **发送验证码**
  - [ ] 手机号格式验证正确
  - [ ] 60秒内不能重复发送
  - [ ] 开发模式返回验证码
  - [ ] 验证码保存到数据库

- [ ] **手机号登录**
  - [ ] 验证码校验正确
  - [ ] 新用户自动注册
  - [ ] 老用户正常登录
  - [ ] 返回 token 和用户信息
  - [ ] 验证码使用后标记为已用

- [ ] **获取用户信息**
  - [ ] 需要登录才能调用
  - [ ] 返回完整用户信息
  - [ ] 实时统计关注数和粉丝数

- [ ] **更新用户信息**
  - [ ] 昵称长度验证
  - [ ] 性别参数验证
  - [ ] 成功更新数据库
  - [ ] 返回最新用户信息

- [ ] **用户登出**
  - [ ] 记录登出时间
  - [ ] 返回成功消息

---

## 🎯 测试结果示例

### ✅ 成功案例

```javascript
// 1. 发送验证码
{
  code: 0,
  message: '验证码已发送（开发模式）',
  data: {
    expiresIn: 180,
    devCode: '856234'
  }
}

// 2. 登录成功（新用户）
{
  code: 0,
  message: '注册成功',
  data: {
    token: '65abc123_1234567890_xyz789',
    tokenExpired: 1234567890,
    userInfo: {
      _id: '65abc123',
      uid: '65abc123',
      mobile: '13800138000',
      nickname: '玩家8000',
      level: 1,
      exp: 0,
      ...
    },
    isNewUser: true
  }
}

// 3. 获取用户信息
{
  code: 0,
  message: '获取成功',
  data: {
    _id: '65abc123',
    nickname: '玩家8000',
    following_count: 0,
    followers_count: 0,
    ...
  }
}
```

### ❌ 错误案例

```javascript
// 手机号格式错误
{
  code: 400,
  message: '手机号格式不正确',
  data: null
}

// 验证码错误
{
  code: 400,
  message: '验证码错误或已过期',
  data: null
}

// 未登录
{
  code: 500,
  message: '未登录或登录已过期，请重新登录',
  data: null
}
```

---

## 🔍 调试技巧

### 1. 查看云函数日志
在 HBuilderX 中：
- **uniCloud** → **云服务空间** → **云函数/云对象** → **user** → **查看日志**

### 2. 数据库验证
检查以下表的数据：
- `sms-codes` - 验证码记录
- `uni-id-users` - 用户信息

### 3. 常见问题

**Q: 提示"未登录"？**
A: 确保调用 `getInfo()` 等方法前已经登录，云对象会自动读取 token。

**Q: 验证码一直提示错误？**
A: 检查开发模式返回的 `devCode`，确保输入正确的6位数字。

**Q: 云对象找不到？**
A: 确保已经右键上传部署云对象到 uniCloud。

---

## ✅ 验收通过标准

1. ✅ 所有 5 个方法正常运行
2. ✅ 错误处理正确（手机号格式、验证码错误等）
3. ✅ 日志输出清晰（前置、后置处理）
4. ✅ 数据库正确保存（用户信息、验证码）
5. ✅ 新老用户逻辑正确

---

**准备好后，请告诉我测试结果！** 🚀

