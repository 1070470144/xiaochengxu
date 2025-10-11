<template>
  <view class="settings-page">
    <!-- 基本设置 -->
    <view class="settings-section">
      <view class="section-title">基本设置</view>
      <view class="settings-list">
        <view class="setting-item" @click="editProfile">
          <text class="setting-label">编辑资料</text>
          <view class="setting-value">
            <text class="value-text">{{ userInfo.nickname || '' }}</text>
            <uni-icons type="forward" size="16" color="#999" />
          </view>
        </view>
        
        <view class="setting-item">
          <text class="setting-label">手机号</text>
          <view class="setting-value">
            <text class="value-text">{{ formatMobile(userInfo.mobile) }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 消息通知 -->
    <view class="settings-section">
      <view class="section-title">消息通知</view>
      <view class="settings-list">
        <view class="setting-item">
          <text class="setting-label">拼车通知</text>
          <switch :checked="settings.carpoolNotify" @change="toggleSetting('carpoolNotify', $event)" />
        </view>
        
        <view class="setting-item">
          <text class="setting-label">评论通知</text>
          <switch :checked="settings.commentNotify" @change="toggleSetting('commentNotify', $event)" />
        </view>
        
        <view class="setting-item">
          <text class="setting-label">点赞通知</text>
          <switch :checked="settings.likeNotify" @change="toggleSetting('likeNotify', $event)" />
        </view>
      </view>
    </view>

    <!-- 隐私设置 -->
    <view class="settings-section">
      <view class="section-title">隐私设置</view>
      <view class="settings-list">
        <view class="setting-item">
          <text class="setting-label">公开我的主页</text>
          <switch :checked="settings.publicProfile" @change="toggleSetting('publicProfile', $event)" />
        </view>
        
        <view class="setting-item">
          <text class="setting-label">允许陌生人私信</text>
          <switch :checked="settings.allowMessage" @change="toggleSetting('allowMessage', $event)" />
        </view>
      </view>
    </view>

    <!-- 缓存管理 -->
    <view class="settings-section">
      <view class="section-title">缓存管理</view>
      <view class="settings-list">
        <view class="setting-item" @click="clearCache">
          <text class="setting-label">清理缓存</text>
          <view class="setting-value">
            <text class="value-text">{{ cacheSize }}</text>
            <uni-icons type="forward" size="16" color="#999" />
          </view>
        </view>
      </view>
    </view>

    <!-- 其他设置 -->
    <view class="settings-section">
      <view class="section-title">其他</view>
      <view class="settings-list">
        <view class="setting-item" @click="goToAbout">
          <text class="setting-label">关于我们</text>
          <view class="setting-value">
            <uni-icons type="forward" size="16" color="#999" />
          </view>
        </view>
        
        <view class="setting-item" @click="goToFeedback">
          <text class="setting-label">意见反馈</text>
          <view class="setting-value">
            <uni-icons type="forward" size="16" color="#999" />
          </view>
        </view>
        
        <view class="setting-item" @click="checkUpdate">
          <text class="setting-label">检查更新</text>
          <view class="setting-value">
            <text class="value-text">{{ version }}</text>
            <uni-icons type="forward" size="16" color="#999" />
          </view>
        </view>
      </view>
    </view>

    <!-- 退出登录 -->
    <view class="logout-section">
      <button class="logout-btn" @click="handleLogout">退出登录</button>
    </view>
  </view>
</template>

<script>
import Auth from '@/utils/auth.js'

export default {
  name: 'Settings',
  
  data() {
    return {
      userInfo: {},
      settings: {
        carpoolNotify: true,
        commentNotify: true,
        likeNotify: true,
        publicProfile: true,
        allowMessage: true
      },
      cacheSize: '计算中...',
      version: '1.0.0'
    }
  },
  
  onLoad() {
    this.loadUserInfo()
    this.loadSettings()
    this.calculateCacheSize()
  },
  
  methods: {
    loadUserInfo() {
      this.userInfo = Auth.getUserInfo() || {}
    },
    
    loadSettings() {
      const savedSettings = uni.getStorageSync('userSettings')
      if (savedSettings) {
        this.settings = { ...this.settings, ...savedSettings }
      }
    },
    
    toggleSetting(key, event) {
      this.settings[key] = event.detail.value
      
      // 保存到本地存储
      uni.setStorageSync('userSettings', this.settings)
      
      uni.showToast({
        title: '设置已保存',
        icon: 'success',
        duration: 1000
      })
    },
    
    calculateCacheSize() {
      try {
        const info = uni.getStorageInfoSync()
        const size = info.currentSize
        
        if (size < 1024) {
          this.cacheSize = size + 'KB'
        } else {
          this.cacheSize = (size / 1024).toFixed(2) + 'MB'
        }
      } catch (e) {
        this.cacheSize = '0KB'
      }
    },
    
    clearCache() {
      uni.showModal({
        title: '清理缓存',
        content: '确定要清理缓存吗？清理后需要重新加载数据',
        success: (res) => {
          if (res.confirm) {
            try {
              // 保留登录信息和设置
              const token = uni.getStorageSync('uni_id_token')
              const tokenExpired = uni.getStorageSync('uni_id_token_expired')
              const userInfo = uni.getStorageSync('userInfo')
              const settings = uni.getStorageSync('userSettings')
              
              // 清除所有缓存
              uni.clearStorageSync()
              
              // 恢复登录信息和设置
              if (token) uni.setStorageSync('uni_id_token', token)
              if (tokenExpired) uni.setStorageSync('uni_id_token_expired', tokenExpired)
              if (userInfo) uni.setStorageSync('userInfo', userInfo)
              if (settings) uni.setStorageSync('userSettings', settings)
              
              this.calculateCacheSize()
              
              uni.showToast({
                title: '清理成功',
                icon: 'success'
              })
            } catch (e) {
              uni.showToast({
                title: '清理失败',
                icon: 'none'
              })
            }
          }
        }
      })
    },
    
    editProfile() {
      uni.navigateTo({
        url: '/pages/user/edit-profile/edit-profile'
      })
    },
    
    goToAbout() {
      uni.navigateTo({
        url: '/pages/user/about/about'
      })
    },
    
    goToFeedback() {
      uni.navigateTo({
        url: '/pages/user/feedback/feedback'
      })
    },
    
    checkUpdate() {
      uni.showToast({
        title: '已是最新版本',
        icon: 'success'
      })
    },
    
    handleLogout() {
      uni.showModal({
        title: '确认退出',
        content: '确定要退出登录吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              const token = Auth.getToken()
              
              await uniCloud.callFunction({
                name: 'user-logout',
                data: { token }
              })
              
              Auth.logout()
              
              uni.showToast({
                title: '已退出登录',
                icon: 'success'
              })
              
              setTimeout(() => {
                uni.reLaunch({
                  url: '/pages/index/index'
                })
              }, 1500)
            } catch (error) {
              Auth.logout()
              uni.reLaunch({
                url: '/pages/index/index'
              })
            }
          }
        }
      })
    },
    
    formatMobile(mobile) {
      if (!mobile) return '未绑定'
      return mobile.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
    }
  }
}
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 120rpx;
}

.settings-section {
  margin-bottom: 20rpx;
}

.section-title {
  padding: 30rpx 30rpx 15rpx;
  font-size: 26rpx;
  color: #999;
}

.settings-list {
  background: #fff;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1px solid #f5f5f5;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  font-size: 28rpx;
  color: #333;
}

.setting-value {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.value-text {
  font-size: 26rpx;
  color: #999;
}

.logout-section {
  padding: 40rpx 30rpx;
}

.logout-btn {
  width: 100%;
  height: 80rpx;
  background: #fff;
  color: #f44336;
  font-size: 30rpx;
  border-radius: 40rpx;
  border: 1px solid #f5f5f5;
}
</style>

