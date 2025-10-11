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
          <text class="stat-number">{{ userStats.postCount || 0 }}</text>
          <text class="stat-label">我的帖子</text>
        </view>
        <view class="stat-item" @click="goToMyCarpool">
          <text class="stat-number">{{ userStats.carpoolCount || 0 }}</text>
          <text class="stat-label">我的拼车</text>
        </view>
        <view class="stat-item" @click="goToFavorites">
          <text class="stat-number">{{ userStats.favoriteCount || 0 }}</text>
          <text class="stat-label">我的收藏</text>
        </view>
        <view class="stat-item">
          <text class="stat-number">{{ userStats.likeCount || 0 }}</text>
          <text class="stat-label">获得点赞</text>
        </view>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-section">
      <view class="menu-list">
        <!-- 我的内容 -->
        <view class="menu-group">
          <text class="menu-group-title">我的内容</text>
          <view class="menu-item" @click="goToMyPosts">
            <text class="menu-icon">📝</text>
            <text class="menu-text">我的帖子</text>
            <text class="menu-arrow">></text>
          </view>
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

        <!-- 店铺功能 -->
        <view class="menu-group">
          <text class="menu-group-title">店铺</text>
          <view class="menu-item" @click="goToShopList">
            <text class="menu-icon">🏪</text>
            <text class="menu-text">血染店铺</text>
            <text class="menu-arrow">></text>
          </view>
          <view class="menu-item" @click="goToShopApply">
            <text class="menu-icon">📝</text>
            <text class="menu-text">店铺认证</text>
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
