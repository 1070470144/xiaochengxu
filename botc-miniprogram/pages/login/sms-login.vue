<template>
  <view class="login-page">
    <view class="login-container">
      <!-- Logo 区域 -->
      <view class="logo-section">
        <image src="/static/logo.png" class="logo" mode="aspectFit"></image>
        <text class="app-name">血染钟楼</text>
        <text class="app-slogan">Blood on the Clocktower</text>
      </view>

      <!-- 登录表单 -->
      <view class="login-form">
        <!-- 手机号输入 -->
        <view class="form-item">
          <view class="input-wrapper">
            <text class="input-icon">📱</text>
            <input 
              class="input-field" 
              type="number"
              v-model="phone" 
              placeholder="请输入手机号"
              maxlength="11"
              @input="onPhoneInput">
            </input>
          </view>
        </view>

        <!-- 验证码输入 -->
        <view class="form-item">
          <view class="input-wrapper code-wrapper">
            <text class="input-icon">🔐</text>
            <input 
              class="input-field code-input" 
              type="number"
              v-model="code" 
              placeholder="请输入验证码"
              maxlength="6">
            </input>
            <button 
              class="send-code-btn" 
              :disabled="!canSendCode || countdown > 0"
              @click="sendCode">
              {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
            </button>
          </view>
        </view>

        <!-- 开发模式提示 -->
        <view v-if="devMode && devCode" class="dev-tips">
          <text class="dev-text">🔧 开发模式 - 验证码：{{ devCode }}</text>
        </view>

        <!-- 登录按钮 -->
        <button 
          class="login-btn" 
          :disabled="!canLogin"
          :loading="loading"
          @click="login">
          登 录
        </button>

        <!-- 隐私协议 -->
        <view class="privacy-notice">
          <text class="notice-text">登录即表示同意</text>
          <text class="notice-link" @click="showAgreement">《用户协议》</text>
          <text class="notice-text">和</text>
          <text class="notice-link" @click="showPrivacy">《隐私政策》</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'SmsLogin',
  
  data() {
    return {
      phone: '',
      code: '',
      countdown: 0,
      loading: false,
      devMode: true,  // 开发模式
      devCode: ''     // 开发模式下显示的验证码
    }
  },

  computed: {
    // 是否可以发送验证码
    canSendCode() {
      return /^1[3-9]\d{9}$/.test(this.phone)
    },

    // 是否可以登录
    canLogin() {
      return this.canSendCode && this.code.length === 6
    }
  },

  methods: {
    // 手机号输入
    onPhoneInput(e) {
      this.phone = e.detail.value.replace(/\D/g, '').slice(0, 11)
    },

    // 发送验证码
    async sendCode() {
      if (!this.canSendCode) {
        uni.showToast({
          title: '请输入正确的手机号',
          icon: 'none'
        })
        return
      }

      try {
        uni.showLoading({ title: '发送中...' })

        const result = await uniCloud.callFunction({
          name: 'user-send-sms',
          data: {
            phone: this.phone,
            type: 'login'
          }
        })

        uni.hideLoading()

        if (result.result.code === 0) {
          // 开发模式：显示验证码
          if (result.result.data.devCode) {
            this.devCode = result.result.data.devCode
          }

          uni.showToast({
            title: '验证码已发送',
            icon: 'success'
          })

          // 开始倒计时
          this.countdown = 60
          const timer = setInterval(() => {
            this.countdown--
            if (this.countdown <= 0) {
              clearInterval(timer)
            }
          }, 1000)

        } else {
          throw new Error(result.result.message)
        }

      } catch (error) {
        uni.hideLoading()
        console.error('发送验证码失败：', error)
        uni.showToast({
          title: error.message || '发送失败',
          icon: 'none'
        })
      }
    },

    // 登录
    async login() {
      if (!this.canLogin) {
        return
      }

      this.loading = true

      try {
        const result = await uniCloud.callFunction({
          name: 'user-login',
          data: {
            phone: this.phone,
            code: this.code
          }
        })

        if (result.result.code === 0) {
          const { token, tokenExpired, userInfo, isNewUser } = result.result.data

          // 保存登录信息
          uni.setStorageSync('uni_id_token', token)
          uni.setStorageSync('uni_id_token_expired', tokenExpired)
          uni.setStorageSync('userInfo', userInfo)

          uni.showToast({
            title: isNewUser ? '注册成功' : '登录成功',
            icon: 'success'
          })

          // 跳转到首页
          setTimeout(() => {
            uni.reLaunch({
              url: '/pages/index/index'
            })
          }, 1500)

        } else {
          throw new Error(result.result.message)
        }

      } catch (error) {
        console.error('登录失败：', error)
        uni.showToast({
          title: error.message || '登录失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },

    // 显示用户协议
    showAgreement() {
      uni.navigateTo({
        url: '/pages/uni-agree/uni-agree'
      })
    },

    // 显示隐私政策
    showPrivacy() {
      uni.navigateTo({
        url: '/pages/uni-agree/uni-agree?type=privacy'
      })
    }
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
  padding: 40rpx;
}

.login-container {
  padding-top: 120rpx;
}

/* Logo 区域 */
.logo-section {
  text-align: center;
  margin-bottom: 100rpx;
}

.logo {
  width: 160rpx;
  height: 160rpx;
  margin-bottom: 30rpx;
}

.app-name {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #FFFFFF;
  margin-bottom: 10rpx;
}

.app-slogan {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  letter-spacing: 2rpx;
}

/* 登录表单 */
.login-form {
  margin-top: 60rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

.input-wrapper {
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 48rpx;
  padding: 0 30rpx;
  height: 96rpx;
}

.input-icon {
  font-size: 40rpx;
  margin-right: 20rpx;
}

.input-field {
  flex: 1;
  font-size: 30rpx;
  color: #333333;
}

.code-wrapper {
  padding-right: 10rpx;
}

.code-input {
  flex: 1;
}

.send-code-btn {
  background-color: transparent;
  color: #8B4513;
  font-size: 26rpx;
  padding: 12rpx 24rpx;
  border: none;
  height: auto;
  line-height: 1;
  margin: 0;
}

.send-code-btn::after {
  border: none;
}

.send-code-btn[disabled] {
  color: #999999;
}

/* 开发模式提示 */
.dev-tips {
  background-color: rgba(255, 193, 7, 0.9);
  padding: 20rpx;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
}

.dev-text {
  color: #333333;
  font-size: 26rpx;
  font-weight: 500;
}

/* 登录按钮 */
.login-btn {
  width: 100%;
  height: 96rpx;
  background-color: #FFFFFF;
  color: #8B4513;
  font-size: 32rpx;
  font-weight: 500;
  border-radius: 48rpx;
  border: none;
  margin-top: 40rpx;
}

.login-btn::after {
  border: none;
}

.login-btn[disabled] {
  background-color: rgba(255, 255, 255, 0.5);
  color: rgba(139, 69, 19, 0.5);
}

/* 隐私协议 */
.privacy-notice {
  text-align: center;
  margin-top: 40rpx;
}

.notice-text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.notice-link {
  font-size: 24rpx;
  color: #FFFFFF;
  text-decoration: underline;
}
</style>

