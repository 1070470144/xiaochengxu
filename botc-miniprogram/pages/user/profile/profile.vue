<template>
  <view class="page">
    <!-- 用户信息头部 -->
    <view class="profile-header clock-tower-gradient">
      <view class="user-info">
        <image class="user-avatar" :src="userInfo.avatar || '/static/images/default-avatar.png'" mode="aspectFill"></image>
        <view class="user-details">
          <text class="user-name">{{ userInfo.nickname || '血染玩家' }}</text>
          <view class="user-level-info">
            <text class="level-text">{{ levelInfo.name }}</text>
            <text class="level-number">Lv.{{ userInfo.level || 1 }}</text>
          </view>
          <view class="exp-progress">
            <view class="progress-bar">
              <view class="progress-fill" :style="{ width: levelInfo.progress + '%' }"></view>
            </view>
            <text class="exp-text">{{ userInfo.exp || 0 }}/{{ levelInfo.nextLevelExp || '满级' }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 用户统计 -->
    <view class="stats-section">
      <view class="stats-grid">
        <view class="stat-item" @click="goToMyScripts">
          <text class="stat-number">{{ userStats.uploadCount || 0 }}</text>
          <text class="stat-label">上传剧本</text>
        </view>
        <view class="stat-item" @click="goToFavorites">
          <text class="stat-number">{{ userStats.favoriteCount || 0 }}</text>
          <text class="stat-label">收藏剧本</text>
        </view>
        <view class="stat-item" @click="goToMyCarpool">
          <text class="stat-number">{{ userStats.carpoolCount || 0 }}</text>
          <text class="stat-label">参与拼车</text>
        </view>
        <view class="stat-item">
          <text class="stat-number">{{ userStats.commentCount || 0 }}</text>
          <text class="stat-label">发表评论</text>
        </view>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-section">
      <view class="menu-list">
        <!-- 我的内容 -->
        <view class="menu-group">
          <text class="menu-group-title">我的内容</text>
          <view class="menu-item" @click="goToMyScripts">
            <text class="menu-icon">📚</text>
            <text class="menu-text">我的剧本</text>
            <text class="menu-arrow">></text>
          </view>
          <view class="menu-item" @click="goToFavorites">
            <text class="menu-icon">⭐</text>
            <text class="menu-text">我的收藏</text>
            <text class="menu-arrow">></text>
          </view>
          <view class="menu-item" @click="goToHistory">
            <text class="menu-icon">👁️</text>
            <text class="menu-text">浏览历史</text>
            <text class="menu-arrow">></text>
          </view>
        </view>

        <!-- 拼车相关 -->
        <view class="menu-group">
          <text class="menu-group-title">拼车相关</text>
          <view class="menu-item" @click="goToMyCarpool">
            <text class="menu-icon">🚗</text>
            <text class="menu-text">我的拼车</text>
            <text class="menu-arrow">></text>
          </view>
          <view class="menu-item" @click="goToAppliedCarpool">
            <text class="menu-icon">📝</text>
            <text class="menu-text">报名记录</text>
            <text class="menu-arrow">></text>
          </view>
        </view>

        <!-- 说书人功能 -->
        <view class="menu-group" v-if="userInfo.role >= 3">
          <text class="menu-group-title">说书人</text>
          <view class="menu-item" @click="goToStorytellerProfile">
            <text class="menu-icon">🎭</text>
            <text class="menu-text">我的说书人主页</text>
            <text class="menu-arrow">></text>
          </view>
        </view>
        
        <view class="menu-group" v-else>
          <text class="menu-group-title">说书人</text>
          <view class="menu-item" @click="goToStorytellerApply">
            <text class="menu-icon">🎭</text>
            <text class="menu-text">申请成为说书人</text>
            <text class="menu-arrow">></text>
          </view>
        </view>

        <!-- 系统功能 -->
        <view class="menu-group">
          <text class="menu-group-title">系统功能</text>
          <view class="menu-item" @click="goToSettings">
            <text class="menu-icon">⚙️</text>
            <text class="menu-text">设置</text>
            <text class="menu-arrow">></text>
          </view>
          <view class="menu-item" @click="goToAbout">
            <text class="menu-icon">ℹ️</text>
            <text class="menu-text">关于我们</text>
            <text class="menu-arrow">></text>
          </view>
          <view class="menu-item" @click="handleLogout">
            <text class="menu-icon">🚪</text>
            <text class="menu-text">退出登录</text>
            <text class="menu-arrow">></text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { getUserLevelInfo } from '@/utils/common.js'

export default {
  name: 'UserProfile',
  
  data() {
    return {
      userInfo: {},
      userStats: {},
      levelInfo: {},
      loading: false
    }
  },

  onLoad() {
    console.log('用户中心页面加载')
    this.loadUserData()
  },

  onShow() {
    // 每次显示时刷新用户数据
    this.loadUserData()
  },

  methods: {
    // 加载用户数据
    async loadUserData() {
      try {
        // 从本地获取用户信息
        const app = getApp()
        if (app.globalData.userInfo) {
          this.userInfo = app.globalData.userInfo
          this.calculateLevelInfo()
        }
        
        // 从服务器获取最新的用户统计数据
        await this.loadUserStats()
        
      } catch (error) {
        console.error('加载用户数据失败：', error)
      }
    },

    // 加载用户统计数据
    async loadUserStats() {
      try {
        const result = await uniCloud.callFunction({
          name: 'user-stats'
        })

        if (result.result.code === 0) {
          this.userStats = result.result.data
        }
      } catch (error) {
        console.error('加载用户统计失败：', error)
      }
    },

    // 计算等级信息
    calculateLevelInfo() {
      this.levelInfo = getUserLevelInfo(
        this.userInfo.level || 1, 
        this.userInfo.exp || 0
      )
    },

    // 页面跳转方法
    goToMyScripts() {
      uni.navigateTo({
        url: '/pages/user/my-scripts/my-scripts'
      })
    },

    goToFavorites() {
      uni.navigateTo({
        url: '/pages/user/favorites/favorites'
      })
    },

    goToHistory() {
      uni.navigateTo({
        url: '/pages/user/history/history'
      })
    },

    goToMyCarpool() {
      uni.navigateTo({
        url: '/pages/carpool/my/my'
      })
    },

    goToAppliedCarpool() {
      uni.navigateTo({
        url: '/pages/carpool/applied/applied'
      })
    },

    goToStorytellerProfile() {
      uni.navigateTo({
        url: '/pages/storyteller/my-profile/my-profile'
      })
    },

    goToStorytellerApply() {
      uni.navigateTo({
        url: '/pages/storyteller/apply/apply'
      })
    },

    goToSettings() {
      uni.navigateTo({
        url: '/pages/user/settings/settings'
      })
    },

    goToAbout() {
      uni.navigateTo({
        url: '/pages/user/about/about'
      })
    },

    // 退出登录
    handleLogout() {
      uni.showModal({
        title: '确认退出',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            // 清除本地存储
            uni.removeStorageSync('token')
            uni.removeStorageSync('userInfo')
            
            // 清除全局数据
            const app = getApp()
            app.globalData.token = null
            app.globalData.userInfo = null
            
            uni.showToast({
              title: '已退出登录',
              icon: 'success'
            })
            
            // 跳转到登录页
            setTimeout(() => {
              uni.reLaunch({
                url: '/pages/user/login/login'
              })
            }, 1500)
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.profile-header {
  padding: 40rpx 30rpx;
  color: white;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  margin-right: 30rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.2);
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 12rpx;
}

.user-level-info {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.level-text {
  font-size: 26rpx;
  opacity: 0.9;
  margin-right: 16rpx;
}

.level-number {
  font-size: 24rpx;
  background-color: rgba(255, 255, 255, 0.2);
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  font-weight: 500;
}

.exp-progress {
  display: flex;
  align-items: center;
}

.progress-bar {
  flex: 1;
  height: 8rpx;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 4rpx;
  overflow: hidden;
  margin-right: 16rpx;
}

.progress-fill {
  height: 100%;
  background-color: white;
  border-radius: 4rpx;
  transition: width 0.3s ease;
}

.exp-text {
  font-size: 22rpx;
  opacity: 0.8;
}

.stats-section {
  background: white;
  margin: 20rpx;
  border-radius: 12rpx;
  padding: 30rpx;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
}

.stat-item {
  text-align: center;
  padding: 20rpx 0;
}

.stat-number {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #8B4513;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #666666;
}

.menu-section {
  margin: 20rpx;
}

.menu-group {
  background: white;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
}

.menu-group-title {
  display: block;
  font-size: 26rpx;
  color: #999999;
  padding: 20rpx 30rpx 0;
  font-weight: 500;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:active {
  background-color: #f5f5f5;
}

.menu-icon {
  font-size: 36rpx;
  width: 50rpx;
  margin-right: 20rpx;
}

.menu-text {
  flex: 1;
  font-size: 30rpx;
  color: #333333;
}

.menu-arrow {
  font-size: 28rpx;
  color: #cccccc;
}
</style>
