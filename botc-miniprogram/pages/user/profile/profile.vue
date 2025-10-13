<template>
  <view class="page">
    <!-- 用户信息头部 -->
    <view class="profile-header clock-tower-gradient">
      <view class="user-info">
        <view class="avatar-section">
          <view class="avatar-wrapper" @click="editProfile">
            <image class="user-avatar" :src="userInfo.avatar || '/static/logo.png'" mode="aspectFill"></image>
            <view class="avatar-edit-icon">
              <text>✏️</text>
            </view>
          </view>
          <!-- 粉丝关注数据 -->
          <view class="follow-stats">
            <view class="follow-item" @click="goToFollowers">
              <text class="follow-number">{{ userInfo.followers_count || 0 }}</text>
              <text class="follow-label">粉丝</text>
            </view>
            <view class="follow-divider"></view>
            <view class="follow-item" @click="goToFollowing">
              <text class="follow-number">{{ userInfo.following_count || 0 }}</text>
              <text class="follow-label">关注</text>
            </view>
          </view>
        </view>
        <view class="user-details">
          <text class="user-name">{{ userInfo.nickname || '血染玩家' }}</text>
          <text class="user-mobile">{{ formatMobile(userInfo.mobile) }}</text>
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

    <!-- 数据统计区 - 仅展示数字 -->
    <view class="stats-section">
      <view class="stats-grid">
        <view class="stat-item" @click="goToMyPosts">
          <text class="stat-number">{{ userStats.postCount || 0 }}</text>
          <text class="stat-label">帖子</text>
        </view>
        <view class="stat-item" @click="goToMyCarpool">
          <text class="stat-number">{{ userStats.carpoolCount || 0 }}</text>
          <text class="stat-label">拼车</text>
        </view>
        <view class="stat-item" @click="goToFavorites">
          <text class="stat-number">{{ userStats.favoriteCount || 0 }}</text>
          <text class="stat-label">收藏</text>
        </view>
        <view class="stat-item" @click="goToMyScripts">
          <text class="stat-number">{{ userStats.scriptCount || 0 }}</text>
          <text class="stat-label">剧本</text>
        </view>
      </view>
    </view>

    <!-- 功能菜单 - 统一风格 -->
    <view class="menu-section">
      <!-- 社交互动 -->
      <view class="function-card">
        <view class="card-header">
          <text class="card-title">💬 社交互动</text>
        </view>
        <view class="function-list">
          <view class="function-row" @click="goToChatList">
            <view class="row-left">
              <view class="row-icon">💬</view>
              <text class="row-title">私信消息</text>
            </view>
            <view class="row-right">
              <text class="row-count" v-if="userStats.chatCount > 0">{{ userStats.chatCount }}</text>
              <text class="row-arrow">›</text>
            </view>
          </view>
          <view class="function-row" @click="goToFollowing">
            <view class="row-left">
              <view class="row-icon">➕</view>
              <text class="row-title">我的关注</text>
            </view>
            <view class="row-right">
              <text class="row-count" v-if="userInfo.following_count > 0">{{ userInfo.following_count }}</text>
              <text class="row-arrow">›</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 拼车服务 -->
      <view class="function-card">
        <view class="card-header">
          <text class="card-title">🚗 拼车服务</text>
        </view>
        <view class="function-list">
          <view class="function-row" @click="goToMyCarpool">
            <view class="row-left">
              <view class="row-icon">🚗</view>
              <text class="row-title">我的拼车</text>
            </view>
            <view class="row-right">
              <text class="row-count" v-if="userStats.carpoolCount > 0">{{ userStats.carpoolCount }}</text>
              <text class="row-arrow">›</text>
            </view>
          </view>
          <view class="function-row" @click="goToAppliedCarpool">
            <view class="row-left">
              <view class="row-icon">📋</view>
              <text class="row-title">报名记录</text>
            </view>
            <view class="row-right">
              <text class="row-arrow">›</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 内容管理 -->
      <view class="function-card">
        <view class="card-header">
          <text class="card-title">📚 内容管理</text>
        </view>
        <view class="function-list">
          <view class="function-row" @click="goToMyScripts">
            <view class="row-left">
              <view class="row-icon">📚</view>
              <text class="row-title">我的剧本</text>
            </view>
            <view class="row-right">
              <text class="row-arrow">›</text>
            </view>
          </view>
          <view class="function-row" @click="goToFavorites">
            <view class="row-left">
              <view class="row-icon">⭐</view>
              <text class="row-title">我的收藏</text>
            </view>
            <view class="row-right">
              <text class="row-count" v-if="userStats.favoriteCount > 0">{{ userStats.favoriteCount }}</text>
              <text class="row-arrow">›</text>
            </view>
          </view>
          <view class="function-row" @click="goToHistory">
            <view class="row-left">
              <view class="row-icon">👁️</view>
              <text class="row-title">浏览历史</text>
            </view>
            <view class="row-right">
              <text class="row-arrow">›</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 店铺服务 -->
      <view class="function-card">
        <view class="card-header">
          <text class="card-title">🏪 店铺服务</text>
        </view>
        <view class="function-list">
          <view class="function-row" @click="goToShopList">
            <view class="row-left">
              <view class="row-icon">🏪</view>
              <text class="row-title">血染店铺</text>
            </view>
            <view class="row-right">
              <text class="row-arrow">›</text>
            </view>
          </view>
          <view class="function-row" @click="goToShopApply">
            <view class="row-left">
              <view class="row-icon">🏅</view>
              <text class="row-title">店铺认证</text>
            </view>
            <view class="row-right">
              <text class="row-arrow">›</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 说书人 -->
      <view class="function-card">
        <view class="card-header">
          <text class="card-title">🎭 说书人</text>
        </view>
        <view class="function-list">
          <view class="function-row" @click="userInfo.role >= 3 ? goToStorytellerProfile() : goToStorytellerApply()">
            <view class="row-left">
              <view class="row-icon">🎭</view>
              <text class="row-title">{{ userInfo.role >= 3 ? '我的主页' : '申请认证' }}</text>
            </view>
            <view class="row-right">
              <text class="row-arrow">›</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 系统设置 -->
      <view class="function-card">
        <view class="card-header">
          <text class="card-title">⚙️ 系统设置</text>
        </view>
        <view class="function-list">
          <view class="function-row" @click="goToSettings">
            <view class="row-left">
              <view class="row-icon">⚙️</view>
              <text class="row-title">设置</text>
            </view>
            <view class="row-right">
              <text class="row-arrow">›</text>
            </view>
          </view>
          <view class="function-row" @click="goToAbout">
            <view class="row-left">
              <view class="row-icon">ℹ️</view>
              <text class="row-title">关于我们</text>
            </view>
            <view class="row-right">
              <text class="row-arrow">›</text>
            </view>
          </view>
          <view class="function-row" @click="handleLogout">
            <view class="row-left">
              <view class="row-icon">🚪</view>
              <text class="row-title">退出登录</text>
            </view>
            <view class="row-right">
              <text class="row-arrow">›</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import Auth from '@/utils/auth.js'

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
    this.checkLogin()
  },

  onShow() {
    // 每次显示时刷新用户数据
    this.loadUserData()
  },

  methods: {
    // 检查登录状态
    checkLogin() {
      if (!Auth.isLogin()) {
        Auth.toLogin()
        return
      }
      this.loadUserData()
    },

    // 加载用户数据
    async loadUserData() {
      try {
        // 从Storage获取用户信息
        const storedUserInfo = Auth.getUserInfo()
        if (storedUserInfo) {
          this.userInfo = storedUserInfo
          this.calculateLevelInfo()
        }
        
        // 从服务器获取最新信息
        await this.refreshUserInfo()
        
        // 获取用户统计数据
        await this.loadUserStats()
        
      } catch (error) {
        console.error('加载用户数据失败：', error)
      }
    },

    // 刷新用户信息
    async refreshUserInfo() {
      try {
        const token = Auth.getToken()
        
        const result = await uniCloud.callFunction({
          name: 'user-info',
          data: {
            token: token
          }
        })

        if (result.result.code === 0) {
          this.userInfo = result.result.data
          this.calculateLevelInfo()
          
          // 更新本地存储
          uni.setStorageSync('userInfo', this.userInfo)
        }
      } catch (error) {
        console.error('刷新用户信息失败：', error)
      }
    },

    // 加载用户统计数据
    async loadUserStats() {
      try {
        const token = Auth.getToken()
        
        const result = await uniCloud.callFunction({
          name: 'user-stats',
          data: {
            token: token
          }
        })
        
        if (result.result.code === 0) {
          this.userStats = result.result.data
        } else {
          // 失败时使用默认值
          this.userStats = {
            uploadCount: 0,
            favoriteCount: 0,
            carpoolCount: 0,
            joinedCarpoolCount: 0,
            postCount: 0,
            commentCount: 0,
            likeCount: 0,
            viewCount: 0
          }
        }
      } catch (error) {
        console.error('加载用户统计失败：', error)
        // 失败时使用默认值
        this.userStats = {
          uploadCount: 0,
          favoriteCount: 0,
          carpoolCount: 0,
          joinedCarpoolCount: 0,
          postCount: 0,
          commentCount: 0,
          likeCount: 0,
          viewCount: 0
        }
      }
    },

    // 计算等级信息
    calculateLevelInfo() {
      const level = this.userInfo.level || 1
      const exp = this.userInfo.exp || 0
      
      // 等级配置（根据 spec-kit）
      const levelConfig = [
        { level: 1, name: '初来乍到', exp: 0 },
        { level: 2, name: '略知一二', exp: 100 },
        { level: 3, name: '初窥门径', exp: 300 },
        { level: 4, name: '渐入佳境', exp: 600 },
        { level: 5, name: '驾轻就熟', exp: 1000 },
        { level: 6, name: '炉火纯青', exp: 1500 },
        { level: 7, name: '登峰造极', exp: 2200 },
        { level: 8, name: '出神入化', exp: 3000 },
        { level: 9, name: '无与伦比', exp: 4000 },
        { level: 10, name: '传奇玩家', exp: 5500 }
      ]
      
      const currentLevel = levelConfig.find(l => l.level === level) || levelConfig[0]
      const nextLevel = levelConfig.find(l => l.level === level + 1)
      
      this.levelInfo = {
        name: currentLevel.name,
        currentLevelExp: currentLevel.exp,
        nextLevelExp: nextLevel ? nextLevel.exp : null,
        progress: nextLevel 
          ? ((exp - currentLevel.exp) / (nextLevel.exp - currentLevel.exp) * 100).toFixed(0)
          : 100
      }
    },

    // 格式化手机号
    formatMobile(mobile) {
      if (!mobile) return ''
      return mobile.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
    },

    // 编辑资料
    editProfile() {
      uni.navigateTo({
        url: '/pages/user/edit-profile/edit-profile'
      })
    },

    // 页面跳转方法
    goToMyScripts() {
      uni.showToast({
        title: '功能开发中',
        icon: 'none'
      })
    },

    goToFavorites() {
      uni.showToast({
        title: '功能开发中',
        icon: 'none'
      })
    },

    goToHistory() {
      uni.showToast({
        title: '功能开发中',
        icon: 'none'
      })
    },

    goToMyCarpool() {
      uni.navigateTo({
        url: '/pages/user/my-carpool/my-carpool'
      })
    },

    goToAppliedCarpool() {
      uni.showToast({
        title: '功能开发中',
        icon: 'none'
      })
    },

    // 跳转到我的帖子
    goToMyPosts() {
      uni.navigateTo({
        url: '/pages/user/my-posts/my-posts'
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

    // 跳转到店铺列表
    goToShopList() {
      uni.navigateTo({
        url: '/pages/shop/list/list'
      })
    },

    // 跳转到店铺认证
    goToShopApply() {
      uni.navigateTo({
        url: '/pages/shop/apply/apply'
      })
    },
    
    // 跳转到粉丝列表
    goToFollowers() {
      uni.showToast({
        title: '粉丝列表开发中',
        icon: 'none'
      })
    },
    
    // 跳转到关注列表
    goToFollowing() {
      uni.showToast({
        title: '关注列表开发中',
        icon: 'none'
      })
    },
    
    // 跳转到私聊列表
    goToChatList() {
      uni.navigateTo({
        url: '/pages/chat/list/list'
      })
    },

    // 退出登录
    async handleLogout() {
      uni.showModal({
        title: '确认退出',
        content: '确定要退出登录吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              const token = Auth.getToken()
              
              // 调用云函数退出登录
              await uniCloud.callFunction({
                name: 'user-logout',
                data: {
                  token: token
                }
              })
              
              // 使用Auth工具类清除登录信息
              Auth.logout()
              
              uni.showToast({
                title: '已退出登录',
                icon: 'success'
              })
              
              // 跳转到登录页
              setTimeout(() => {
                uni.reLaunch({
                  url: '/pages/login/sms-login'
                })
              }, 1500)
            } catch (error) {
              console.error('退出登录失败：', error)
              // 即使失败也清除本地登录信息
              Auth.logout()
              uni.reLaunch({
                url: '/pages/login/sms-login'
              })
            }
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.clock-tower-gradient {
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
}

.profile-header {
  padding: 40rpx 30rpx;
  color: white;
}

.user-info {
  display: flex;
  align-items: center;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 30rpx;
}

.avatar-wrapper {
  position: relative;
  margin-bottom: 15rpx;
}

.user-avatar {
  width: 140rpx;
  height: 140rpx;
  border-radius: 70rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
}

.avatar-edit-icon {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 40rpx;
  height: 40rpx;
  background-color: #8B4513;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
  border: 3rpx solid white;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
}

/* 粉丝关注数据 */
.follow-stats {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10rpx);
  border-radius: 30rpx;
  padding: 8rpx 20rpx;
  gap: 15rpx;
}

.follow-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.3s;
}

.follow-item:active {
  transform: scale(0.95);
}

.follow-number {
  font-size: 32rpx;
  font-weight: bold;
  color: white;
  line-height: 1;
  margin-bottom: 4rpx;
}

.follow-label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1;
}

.follow-divider {
  width: 1rpx;
  height: 40rpx;
  background: rgba(255, 255, 255, 0.3);
}

.user-details {
  flex: 1;
}

.user-name {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.user-mobile {
  display: block;
  font-size: 24rpx;
  opacity: 0.8;
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

/* 数据统计区 - 简洁风格 */
.stats-section {
  background: white;
  margin: 20rpx;
  border-radius: 16rpx;
  padding: 30rpx 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.stats-grid {
  display: flex;
  justify-content: space-around;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10rpx 20rpx;
  transition: all 0.3s;
}

.stat-item:active {
  transform: scale(0.95);
}

.stat-number {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #8B4513;
  margin-bottom: 8rpx;
  line-height: 1;
}

.stat-label {
  font-size: 24rpx;
  color: #666666;
  line-height: 1;
}

/* 功能菜单 - 列表风格 */
.menu-section {
  background: #f5f5f5;
  padding: 0 20rpx 20rpx;
}

.function-card {
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.card-header {
  padding: 25rpx 30rpx 15rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.card-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  display: flex;
  align-items: center;
}

.function-list {
  /* 无需额外样式 */
}

.function-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 25rpx 30rpx;
  border-bottom: 1rpx solid #f8f8f8;
  transition: background 0.3s;
}

.function-row:last-child {
  border-bottom: none;
}

.function-row:active {
  background: #f8f8f8;
}

.row-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.row-icon {
  font-size: 36rpx;
  width: 40rpx;
  text-align: center;
}

.row-title {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.row-right {
  display: flex;
  align-items: center;
  gap: 15rpx;
}

.row-count {
  font-size: 24rpx;
  color: #999;
  background: #f5f5f5;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  min-width: 40rpx;
  text-align: center;
}

.row-arrow {
  font-size: 32rpx;
  color: #ccc;
  font-weight: 300;
}
</style>
