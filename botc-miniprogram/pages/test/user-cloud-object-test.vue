<template>
  <view class="test-container">
    <view class="title">User 云对象功能测试</view>
    
    <!-- 测试状态 -->
    <view class="status-box">
      <text>登录状态：{{ isLogin ? '已登录' : '未登录' }}</text>
      <text v-if="isLogin">用户ID: {{ currentUserId }}</text>
    </view>
    
    <!-- 1. 发送验证码测试 -->
    <view class="test-section">
      <view class="section-title">1. 发送验证码 (sendSms)</view>
      <input v-model="phone" placeholder="请输入手机号" class="input" />
      <button @click="testSendSms" class="btn">发送验证码</button>
      <view v-if="smsResult" class="result">
        <text>{{ JSON.stringify(smsResult, null, 2) }}</text>
      </view>
    </view>
    
    <!-- 2. 登录测试 -->
    <view class="test-section">
      <view class="section-title">2. 登录 (login)</view>
      <input v-model="loginPhone" placeholder="手机号" class="input" />
      <input v-model="loginCode" placeholder="验证码" class="input" />
      <button @click="testLogin" class="btn">登录</button>
      <view v-if="loginResult" class="result">
        <text>{{ JSON.stringify(loginResult, null, 2) }}</text>
      </view>
    </view>
    
    <!-- 3. 获取用户信息测试 -->
    <view class="test-section">
      <view class="section-title">3. 获取用户信息 (getInfo)</view>
      <button @click="testGetInfo" class="btn" :disabled="!isLogin">获取用户信息</button>
      <view v-if="userInfo" class="result">
        <text>{{ JSON.stringify(userInfo, null, 2) }}</text>
      </view>
    </view>
    
    <!-- 4. 更新用户信息测试 -->
    <view class="test-section">
      <view class="section-title">4. 更新用户信息 (update)</view>
      <input v-model="updateData.nickname" placeholder="昵称" class="input" />
      <input v-model="updateData.avatar" placeholder="头像URL" class="input" />
      <picker mode="selector" :range="genderOptions" @change="onGenderChange">
        <view class="picker">性别: {{ genderOptions[updateData.gender] }}</view>
      </picker>
      <button @click="testUpdate" class="btn" :disabled="!isLogin">更新资料</button>
      <view v-if="updateResult" class="result">
        <text>{{ JSON.stringify(updateResult, null, 2) }}</text>
      </view>
    </view>
    
    <!-- 5. 登出测试 -->
    <view class="test-section">
      <view class="section-title">5. 登出 (logout)</view>
      <button @click="testLogout" class="btn" :disabled="!isLogin">退出登录</button>
      <view v-if="logoutResult" class="result">
        <text>{{ JSON.stringify(logoutResult, null, 2) }}</text>
      </view>
    </view>
    
    <!-- 清空结果 -->
    <view class="test-section">
      <button @click="clearResults" class="btn btn-clear">清空所有结果</button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      userObj: null,
      
      // 测试数据
      phone: '19533284032',
      loginPhone: '19533284032',
      loginCode: '',
      
      updateData: {
        nickname: '',
        avatar: '',
        gender: 0
      },
      
      genderOptions: ['未知', '男', '女'],
      
      // 结果
      smsResult: null,
      loginResult: null,
      userInfo: null,
      updateResult: null,
      logoutResult: null,
      
      // 状态
      isLogin: false,
      currentUserId: ''
    }
  },
  
  onLoad() {
    // 导入云对象
    this.userObj = uniCloud.importObject('user', {
      customUI: true
    })
    console.log('✅ User 云对象已导入')
    
    // 检查登录状态
    this.checkLoginStatus()
  },
  
  methods: {
    // 检查登录状态
    checkLoginStatus() {
      const token = uni.getStorageSync('uni_id_token')
      if (token) {
        this.isLogin = true
        // 简单解析 token 获取 userId
        const parts = token.split('_')
        this.currentUserId = parts[0] || ''
        console.log('当前已登录，用户ID:', this.currentUserId)
      } else {
        this.isLogin = false
        this.currentUserId = ''
        console.log('当前未登录')
      }
    },
    
    // 测试发送验证码
    async testSendSms() {
      try {
        console.log('📱 测试发送验证码...')
        uni.showLoading({ title: '发送中...' })
        
        const result = await this.userObj.sendSms(this.phone, 'login')
        
        uni.hideLoading()
        this.smsResult = result
        
        if (result.code === 0) {
          // 如果是开发模式，自动填充验证码
          if (result.data.devCode) {
            this.loginCode = result.data.devCode
            this.loginPhone = this.phone
          }
          
          uni.showToast({
            title: '发送成功',
            icon: 'success'
          })
          console.log('✅ 发送成功:', result)
        } else {
          throw new Error(result.message)
        }
      } catch (error) {
        uni.hideLoading()
        console.error('❌ 发送失败:', error)
        uni.showToast({
          title: error.message || '发送失败',
          icon: 'none'
        })
      }
    },
    
    // 测试登录
    async testLogin() {
      try {
        console.log('🔐 测试登录...')
        uni.showLoading({ title: '登录中...' })
        
        const result = await this.userObj.login(this.loginPhone, this.loginCode)
        
        uni.hideLoading()
        this.loginResult = result
        
        if (result.code === 0) {
          // 保存 token
          uni.setStorageSync('uni_id_token', result.data.token)
          uni.setStorageSync('uni_id_token_expired', result.data.tokenExpired)
          
          // 更新登录状态
          this.checkLoginStatus()
          
          uni.showToast({
            title: '登录成功',
            icon: 'success'
          })
          console.log('✅ 登录成功:', result)
        } else {
          throw new Error(result.message)
        }
      } catch (error) {
        uni.hideLoading()
        console.error('❌ 登录失败:', error)
        uni.showToast({
          title: error.message || '登录失败',
          icon: 'none'
        })
      }
    },
    
    // 测试获取用户信息
    async testGetInfo() {
      try {
        console.log('👤 测试获取用户信息...')
        uni.showLoading({ title: '加载中...' })
        
        const result = await this.userObj.getInfo()
        
        uni.hideLoading()
        this.userInfo = result
        
        if (result.code === 0) {
          // 自动填充到更新表单
          this.updateData.nickname = result.data.nickname || ''
          this.updateData.avatar = result.data.avatar || ''
          this.updateData.gender = result.data.gender || 0
          
          uni.showToast({
            title: '获取成功',
            icon: 'success'
          })
          console.log('✅ 获取成功:', result)
        } else {
          throw new Error(result.message)
        }
      } catch (error) {
        uni.hideLoading()
        console.error('❌ 获取失败:', error)
        uni.showToast({
          title: error.message || '获取失败',
          icon: 'none'
        })
      }
    },
    
    // 测试更新用户信息
    async testUpdate() {
      try {
        console.log('✏️ 测试更新用户信息...')
        uni.showLoading({ title: '更新中...' })
        
        const result = await this.userObj.update(this.updateData)
        
        uni.hideLoading()
        this.updateResult = result
        
        if (result.code === 0) {
          uni.showToast({
            title: '更新成功',
            icon: 'success'
          })
          console.log('✅ 更新成功:', result)
          
          // 刷新用户信息
          setTimeout(() => {
            this.testGetInfo()
          }, 500)
        } else {
          throw new Error(result.message)
        }
      } catch (error) {
        uni.hideLoading()
        console.error('❌ 更新失败:', error)
        uni.showToast({
          title: error.message || '更新失败',
          icon: 'none'
        })
      }
    },
    
    // 测试登出
    async testLogout() {
      try {
        console.log('👋 测试登出...')
        uni.showLoading({ title: '登出中...' })
        
        const result = await this.userObj.logout()
        
        uni.hideLoading()
        this.logoutResult = result
        
        if (result.code === 0) {
          // 清除本地存储
          uni.removeStorageSync('uni_id_token')
          uni.removeStorageSync('uni_id_token_expired')
          
          // 更新登录状态
          this.checkLoginStatus()
          
          uni.showToast({
            title: '登出成功',
            icon: 'success'
          })
          console.log('✅ 登出成功:', result)
        } else {
          throw new Error(result.message)
        }
      } catch (error) {
        uni.hideLoading()
        console.error('❌ 登出失败:', error)
        uni.showToast({
          title: error.message || '登出失败',
          icon: 'none'
        })
      }
    },
    
    // 性别选择
    onGenderChange(e) {
      this.updateData.gender = parseInt(e.detail.value)
    },
    
    // 清空所有结果
    clearResults() {
      this.smsResult = null
      this.loginResult = null
      this.userInfo = null
      this.updateResult = null
      this.logoutResult = null
      console.log('🧹 已清空所有测试结果')
    }
  }
}
</script>

<style scoped>
.test-container {
  padding: 30rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.title {
  font-size: 40rpx;
  font-weight: bold;
  text-align: center;
  margin-bottom: 30rpx;
  color: #333;
}

.status-box {
  background-color: #fff;
  padding: 20rpx;
  border-radius: 10rpx;
  margin-bottom: 30rpx;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.status-box text {
  font-size: 28rpx;
  color: #666;
}

.test-section {
  background-color: #fff;
  padding: 30rpx;
  border-radius: 10rpx;
  margin-bottom: 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
  color: #333;
}

.input {
  width: 100%;
  height: 80rpx;
  border: 2rpx solid #ddd;
  border-radius: 10rpx;
  padding: 0 20rpx;
  margin-bottom: 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.picker {
  height: 80rpx;
  line-height: 80rpx;
  border: 2rpx solid #ddd;
  border-radius: 10rpx;
  padding: 0 20rpx;
  margin-bottom: 20rpx;
  font-size: 28rpx;
}

.btn {
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  background-color: #007aff;
  color: #fff;
  border-radius: 10rpx;
  text-align: center;
  font-size: 28rpx;
  margin-bottom: 20rpx;
}

.btn[disabled] {
  background-color: #ccc;
}

.btn-clear {
  background-color: #ff3b30;
}

.result {
  background-color: #f9f9f9;
  padding: 20rpx;
  border-radius: 10rpx;
  margin-top: 20rpx;
  max-height: 600rpx;
  overflow-y: auto;
}

.result text {
  font-size: 24rpx;
  color: #666;
  word-break: break-all;
  white-space: pre-wrap;
  font-family: monospace;
}
</style>

