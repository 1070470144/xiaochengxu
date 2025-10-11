<template>
  <view class="page">
    <!-- 用户信息头部 -->
    <view class="profile-header clock-tower-gradient">
      <view class="user-info">
        <view class="avatar-wrapper" @click="editProfile">
          <image class="user-avatar" :src="userInfo.avatar || '/static/logo.png'" mode="aspectFill"></image>
          <view class="avatar-edit-icon">
            <text>✏️</text>
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

    <!-- 用户统计 -->
    <view class="stats-section">
      <view class="stats-grid">
        <view class="stat-item" @click="goToMyPosts">
          <view class="stat-icon">📝</view>
          <text class="stat-number">{{ userStats.postCount || 0 }}</text>
          <text class="stat-label">我的帖子</text>
        </view>
        <view class="stat-item" @click="goToMyCarpool">
          <view class="stat-icon">🚗</view>
          <text class="stat-number">{{ userStats.carpoolCount || 0 }}</text>
          <text class="stat-label">我的拼车</text>
        </view>
        <view class="stat-item" @click="goToFavorites">
          <view class="stat-icon">⭐</view>
          <text class="stat-number">{{ userStats.favoriteCount || 0 }}</text>
          <text class="stat-label">我的收藏</text>
        </view>
        <view class="stat-item">
          <view class="stat-icon">❤️</view>
          <text class="stat-number">{{ userStats.likeCount || 0 }}</text>
          <text class="stat-label">获得点赞</text>
        </view>
      </view>
    </view>

    <!-- 功能菜单 - 横向布局 -->
    <view class="menu-section">
      <!-- 我的内容 -->
      <view class="function-card">
        <view class="card-title">我的内容</view>
        <view class="function-grid">
          <view class="function-item" @click="goToMyPosts">
            <view class="function-icon">📝</view>
            <text class="function-text">我的帖子</text>
          </view>
          <view class="function-item" @click="goToMyScripts">
            <view class="function-icon">📚</view>
            <text class="function-text">我的剧本</text>
          </view>
          <view class="function-item" @click="goToFavorites">
            <view class="function-icon">⭐</view>
            <text class="function-text">我的收藏</text>
          </view>
          <view class="function-item" @click="goToHistory">
            <view class="function-icon">👁️</view>
            <text class="function-text">浏览历史</text>
          </view>
        </view>
      </view>

      <!-- 拼车与店铺 -->
      <view class="function-card">
        <view class="card-title">拼车与店铺</view>
        <view class="function-grid">
          <view class="function-item" @click="goToMyCarpool">
            <view class="function-icon">🚗</view>
            <text class="function-text">我的拼车</text>
          </view>
          <view class="function-item" @click="goToAppliedCarpool">
            <view class="function-icon">📋</view>
            <text class="function-text">报名记录</text>
          </view>
          <view class="function-item" @click="goToShopList">
            <view class="function-icon">🏪</view>
            <text class="function-text">血染店铺</text>
          </view>
          <view class="function-item" @click="goToShopApply">
            <view class="function-icon">🏅</view>
            <text class="function-text">店铺认证</text>
          </view>
        </view>
      </view>

      <!-- 说书人 -->
      <view class="function-card" v-if="userInfo.role >= 3">
        <view class="card-title">说书人</view>
        <view class="function-grid">
          <view class="function-item" @click="goToStorytellerProfile">
            <view class="function-icon">🎭</view>
            <text class="function-text">我的主页</text>
          </view>
        </view>
      </view>
      
      <view class="function-card" v-else>
        <view class="card-title">说书人</view>
        <view class="function-grid">
          <view class="function-item" @click="goToStorytellerApply">
            <view class="function-icon">🎭</view>
            <text class="function-text">申请认证</text>
          </view>
        </view>
      </view>

      <!-- 系统设置 -->
      <view class="function-card">
        <view class="card-title">系统设置</view>
        <view class="function-grid">
          <view class="function-item" @click="goToSettings">
            <view class="function-icon">⚙️</view>
            <text class="function-text">设置</text>
          </view>
          <view class="function-item" @click="goToAbout">
            <view class="function-icon">ℹ️</view>
            <text class="function-text">关于我们</text>
          </view>
          <view class="function-item" @click="handleLogout">
            <view class="function-icon">🚪</view>
            <text class="function-text">退出登录</text>
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

.avatar-wrapper {
  position: relative;
  margin-right: 30rpx;
}

.user-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.2);
}

.avatar-edit-icon {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 36rpx;
  height: 36rpx;
  background-color: #8B4513;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
  border: 2rpx solid white;
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

.stats-section {
  background: white;
  margin: 20rpx;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20rpx;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15rpx 10rpx;
  border-radius: 12rpx;
  background: #f8f8f8;
  transition: all 0.3s;
}

.stat-item:active {
  background: #f0f0f0;
  transform: scale(0.95);
}

.stat-icon {
  font-size: 36rpx;
  margin-bottom: 8rpx;
}

.stat-number {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #8B4513;
  margin-bottom: 6rpx;
}

.stat-label {
  font-size: 22rpx;
  color: #666666;
  text-align: center;
  word-break: keep-all;
  white-space: nowrap;
}

/* 功能菜单 - 横向布局 */
.menu-section {
  background: #f5f5f5;
  padding: 20rpx;
}

.function-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.card-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 25rpx;
  padding-left: 15rpx;
  border-left: 4rpx solid #8B4513;
}

.function-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20rpx;
}

.function-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20rpx 10rpx;
  border-radius: 12rpx;
  background: #f8f8f8;
  transition: all 0.3s;
}

.function-item:active {
  background: #f0f0f0;
  transform: scale(0.95);
}

.function-icon {
  font-size: 40rpx;
  margin-bottom: 10rpx;
}

.function-text {
  font-size: 24rpx;
  color: #666;
  text-align: center;
  word-break: keep-all;
  white-space: nowrap;
}
</style>
