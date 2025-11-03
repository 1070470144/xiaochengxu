<template>
  <view class="page" v-if="!loading">
    <!-- 用户信息头部 -->
    <view class="profile-header" :class="{ 'clock-tower-gradient': !profileData.user.background_image }" :style="backgroundStyle">
      <view class="user-info">
        <view class="avatar-section">
          <view class="avatar-wrapper">
            <image class="user-avatar" :src="profileData.user.avatar || '/static/logo.png'" mode="aspectFill"></image>
            <view class="level-badge">
              <text class="level-text">Lv.{{ profileData.user.level || 1 }}</text>
            </view>
          </view>
          <!-- 粉丝关注数据 -->
          <view class="follow-stats">
            <view class="follow-item">
              <text class="follow-number">{{ profileData.user.followers_count || 0 }}</text>
              <text class="follow-label">粉丝</text>
            </view>
            <view class="follow-divider"></view>
            <view class="follow-item">
              <text class="follow-number">{{ profileData.user.following_count || 0 }}</text>
              <text class="follow-label">关注</text>
            </view>
          </view>
        </view>
        <view class="user-details">
          <view class="name-row">
            <text class="user-name">{{ profileData.user.nickname || '血染玩家' }}</text>
            <!-- 认证标识 -->
            <view v-if="profileData.user.storyteller_certified && profileData.user.storyteller_level" class="cert-badge">
              <text class="cert-icon">{{ profileData.user.storyteller_level === 1 ? '⭐' : '⭐⭐' }}</text>
            </view>
          </view>
          <view class="user-level-info">
            <text class="level-name">{{ genderText }} · {{ levelName }}</text>
            <text class="join-time">{{ formatJoinTime(profileData.user.register_date) }}</text>
          </view>
          <view class="exp-progress">
            <view class="progress-bar">
              <view class="progress-fill" :style="{ width: expProgress + '%' }"></view>
            </view>
            <text class="exp-text">{{ profileData.user.exp || 0 }}/{{ nextLevelExp || '满级' }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 数据统计区 -->
    <view class="stats-section">
      <view class="stats-grid">
        <view class="stat-item">
          <text class="stat-number">{{ profileData.stats.posts_count || 0 }}</text>
          <text class="stat-label">帖子</text>
        </view>
        <view class="stat-item">
          <text class="stat-number">{{ profileData.stats.reviews_count || 0 }}</text>
          <text class="stat-label">评价</text>
        </view>
        <view class="stat-item">
          <text class="stat-number">{{ profileData.stats.carpool_count || 0 }}</text>
          <text class="stat-label">拼车</text>
        </view>
        <view class="stat-item">
          <text class="stat-number">{{ profileData.stats.likes_count || 0 }}</text>
          <text class="stat-label">获赞</text>
        </view>
      </view>
    </view>

    <!-- 操作按钮区 -->
    <view class="actions-section" v-if="!profileData.follow_status.is_self">
      <view class="action-buttons">
        <button 
          class="action-btn follow-btn" 
          :class="{ 
            following: profileData.follow_status.is_following,
            mutual: profileData.follow_status.is_mutual
          }"
          @click="handleFollowClick"
          @tap="handleFollowClick"
          :loading="followLoading"
          :disabled="followLoading"
        >
          <text v-if="followLoading">操作中...</text>
          <text v-else-if="profileData.follow_status.is_mutual">💞 互关</text>
          <text v-else-if="profileData.follow_status.is_following">✓ 已关注</text>
          <text v-else>+ 关注</text>
        </button>
        <button 
          class="action-btn chat-btn"
          @click="handleChatClick"
          @tap="handleChatClick"
          :disabled="chatLoading"
        >
          <text v-if="chatLoading">跳转中...</text>
          <text v-else>💬 私聊</text>
        </button>
      </view>
    </view>

    <!-- 近期动态 -->
    <view class="activity-section" v-if="profileData.recent_posts.length > 0 || profileData.recent_reviews.length > 0">
      <view class="section-title">
        <text>近期动态</text>
      </view>

      <!-- 最近帖子 -->
      <view class="activity-card" v-if="profileData.recent_posts.length > 0">
        <view class="card-header">
          <text class="card-title">📝 最近发布</text>
        </view>
        <view class="posts-list">
          <view 
            class="post-item" 
            v-for="post in profileData.recent_posts" 
            :key="post._id"
            @click="goToPost(post._id)"
          >
            <view class="post-content">
              <text class="post-text">{{ post.content.substring(0, 50) }}{{ post.content.length > 50 ? '...' : '' }}</text>
              <view class="post-images" v-if="post.images && post.images.length > 0">
                <image 
                  class="post-image" 
                  :src="post.images[0]" 
                  mode="aspectFill"
                />
                <view class="image-count" v-if="post.images.length > 1">
                  <text>+{{ post.images.length - 1 }}</text>
                </view>
              </view>
            </view>
            <view class="post-meta">
              <view class="post-stats">
                <text class="stat-text">❤️ {{ post.like_count || 0 }}</text>
                <text class="stat-text">💬 {{ post.comment_count || 0 }}</text>
              </view>
              <text class="post-time">{{ formatTime(post.created_at) }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 最近评价 -->
      <view class="activity-card" v-if="profileData.recent_reviews.length > 0">
        <view class="card-header">
          <text class="card-title">⭐ 最近评价</text>
        </view>
        <view class="reviews-list">
          <view 
            class="review-item" 
            v-for="review in profileData.recent_reviews" 
            :key="review._id"
            @click="goToScript(review.script_id)"
          >
            <view class="review-left">
              <image 
                class="script-cover" 
                :src="review.script_cover || '/static/logo.png'" 
                mode="aspectFill"
              />
            </view>
            <view class="review-right">
              <text class="script-name">{{ review.script_name }}</text>
              <view class="rating-stars">
                <text 
                  class="star" 
                  v-for="n in 5" 
                  :key="n"
                  :class="{ active: n <= review.rating }"
                >
                  ⭐
                </text>
              </view>
              <text class="review-content">{{ review.content.substring(0, 30) }}{{ review.content.length > 30 ? '...' : '' }}</text>
              <text class="review-time">{{ formatTime(review.created_at) }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-if="profileData.recent_posts.length === 0 && profileData.recent_reviews.length === 0">
      <text class="empty-text">暂无动态</text>
    </view>
  </view>

  <!-- 加载状态 -->
  <view class="loading-container" v-else>
    <uni-load-more status="loading" />
  </view>
</template>

<script>
import Auth from '@/utils/auth.js'
import { getUserCloudObject } from '@/common/userCloudObject.js'

export default {
  name: 'OtherProfile',
  
  data() {
    return {
      userId: '',
      userObj: null,  // 用户云对象
      loading: true,
      followLoading: false,
      chatLoading: false,
      profileData: {
        user: {},
        stats: {},
        follow_status: {},
        recent_posts: [],
        recent_reviews: []
      }
    }
  },
  
  computed: {
    // 背景样式
    backgroundStyle() {
      if (this.profileData.user && this.profileData.user.background_image) {
        return {
          backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${this.profileData.user.background_image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }
      }
      return {}
    },
    
    genderText() {
      const gender = this.profileData.user.gender
      if (gender === 1) return '男'
      if (gender === 2) return '女'
      return '保密'
    },
    
    levelName() {
      const level = this.profileData.user.level || 1
      if (level >= 50) return '传奇说书人'
      if (level >= 30) return '资深说书人'
      if (level >= 20) return '高级玩家'
      if (level >= 10) return '进阶玩家'
      if (level >= 5) return '熟练玩家'
      return '新手玩家'
    },
    
    expProgress() {
      const currentExp = this.profileData.user.exp || 0
      const level = this.profileData.user.level || 1
      const currentLevelExp = (level - 1) * 100
      const nextLevelExp = level * 100
      const progress = ((currentExp - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100
      return Math.min(Math.max(progress, 0), 100)
    },
    
    nextLevelExp() {
      const level = this.profileData.user.level || 1
      return level >= 50 ? '满级' : level * 100
    }
  },
  
  onLoad(options) {
    // 初始化用户云对象
    this.userObj = getUserCloudObject()
    
    if (options.user_id) {
      this.userId = options.user_id
      this.loadUserProfile()
    } else {
      uni.showToast({
        title: '用户ID不能为空',
        icon: 'error'
      })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    }
  },
  
  onShow() {
    // 每次显示页面时重新加载用户数据，确保背景图等信息是最新的
    if (this.userId) {
      this.loadUserProfile()
    }
  },
  
  methods: {
    // 加载用户主页数据
    async loadUserProfile() {
      this.loading = true
      
      try {
        // 使用云对象获取用户资料
        const result = await this.userObj.getProfile(this.userId)
        
        if (result.code === 0) {
          this.profileData = result.data
          
          // 设置页面标题
          uni.setNavigationBarTitle({
            title: this.profileData.user.nickname || '用户主页'
          })
        } else {
          throw new Error(result.result.message)
        }
      } catch (error) {
        console.error('加载用户主页失败：', error)
        uni.showToast({
          title: '加载失败',
          icon: 'error'
        })
      } finally {
        this.loading = false
      }
    },
    
    // 处理关注按钮点击
    async handleFollowClick() {
      console.log('🔘 关注按钮被点击')
      
      // 如果已关注，显示确认对话框
      if (this.profileData.follow_status && this.profileData.follow_status.is_following) {
        uni.showModal({
          title: '取消关注',
          content: `确定要取消关注 ${this.profileData.user.nickname || '该用户'} 吗？`,
          confirmText: '取消关注',
          cancelText: '继续关注',
          confirmColor: '#ff4757',
          success: (res) => {
            if (res.confirm) {
              this.toggleFollow()
            }
          }
        })
      } else {
        // 直接关注
        this.toggleFollow()
      }
    },
    
    // 处理私聊按钮点击
    async handleChatClick() {
      console.log('🔘 私聊按钮被点击')
      
      if (!Auth.isLogin()) {
        uni.showModal({
          title: '需要登录',
          content: '请先登录后再使用私聊功能',
          confirmText: '去登录',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              Auth.redirectToLogin()
            }
          }
        })
        return
      }
      
      this.chatLoading = true
      
      try {
        uni.showLoading({
          title: '正在跳转...'
        })
        
        // 稍微延迟一下，提供更好的用户体验
        setTimeout(() => {
          this.startChat()
          this.chatLoading = false
          uni.hideLoading()
        }, 300)
        
      } catch (error) {
        console.error('跳转私聊页面失败：', error)
        this.chatLoading = false
        uni.hideLoading()
        uni.showToast({
          title: '跳转失败',
          icon: 'error'
        })
      }
    },
    
    // 切换关注状态
    async toggleFollow() {
      if (!Auth.isLogin()) {
        Auth.redirectToLogin()
        return
      }
      
      if (this.followLoading) return
      
      this.followLoading = true
      
      try {
        const isFollowing = this.profileData.follow_status.is_following
        
        // 使用云对象关注/取消关注
        const result = isFollowing 
          ? await this.userObj.unfollow(this.userId)
          : await this.userObj.follow(this.userId)
        
        if (result.code === 0) {
          // 更新关注状态
          const wasFollowing = this.profileData.follow_status.is_following
          this.profileData.follow_status.is_following = !wasFollowing
          
          // 更新粉丝数
          if (!wasFollowing) {
            // 刚刚关注了
            this.profileData.user.followers_count = (this.profileData.user.followers_count || 0) + 1
          } else {
            // 刚刚取消关注
            this.profileData.user.followers_count = Math.max((this.profileData.user.followers_count || 0) - 1, 0)
          }
          
          // 检查互关状态
          if (this.profileData.follow_status.is_following) {
            // 重新检查是否互关
            this.checkMutualFollow()
          } else {
            this.profileData.follow_status.is_mutual = false
          }
          
          uni.showToast({
            title: action === 'follow' ? '关注成功' : '取消关注',
            icon: 'success'
          })
        } else {
          throw new Error(result.result.message)
        }
      } catch (error) {
        console.error('关注操作失败：', error)
        uni.showToast({
          title: '操作失败',
          icon: 'error'
        })
      } finally {
        this.followLoading = false
      }
    },
    
    // 检查互关状态
    async checkMutualFollow() {
      try {
        const db = uniCloud.database()
        const currentUserId = Auth.getUserInfo().uid || Auth.getUserInfo()._id || Auth.getUserInfo().id
        
        const result = await db.collection('botc-user-follows')
          .where({
            follower_id: this.userId,
            following_id: currentUserId
          })
          .count()
        
        this.profileData.follow_status.is_mutual = result.total > 0
      } catch (error) {
        console.error('检查互关状态失败：', error)
      }
    },
    
    // 开始私聊
    startChat() {
      if (!Auth.isLogin()) {
        Auth.redirectToLogin()
        return
      }
      
      uni.navigateTo({
        url: `/pages/chat/detail/detail?user_id=${this.userId}`
      })
    },
    
    // 跳转到帖子详情
    goToPost(postId) {
      uni.navigateTo({
        url: `/pages/community/detail/detail?id=${postId}`
      })
    },
    
    // 跳转到剧本详情
    goToScript(scriptId) {
      uni.navigateTo({
        url: `/pages/script/detail/detail?id=${scriptId}`
      })
    },
    
    // 格式化时间
    formatTime(time) {
      if (!time) return ''
      
      const date = new Date(time)
      const now = new Date()
      const diff = now.getTime() - date.getTime()
      
      const minute = 60 * 1000
      const hour = 60 * minute
      const day = 24 * hour
      const week = 7 * day
      const month = 30 * day
      
      if (diff < minute) {
        return '刚刚'
      } else if (diff < hour) {
        return Math.floor(diff / minute) + '分钟前'
      } else if (diff < day) {
        return Math.floor(diff / hour) + '小时前'
      } else if (diff < week) {
        return Math.floor(diff / day) + '天前'
      } else if (diff < month) {
        return Math.floor(diff / week) + '周前'
      } else {
        return date.toLocaleDateString()
      }
    },
    
    // 格式化加入时间
    formatJoinTime(time) {
      if (!time) return '未知'
      
      const date = new Date(time)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      
      return `${year}.${month} 加入`
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
}

/* 头部样式 */
.profile-header {
  padding: 60rpx 40rpx 40rpx;
  position: relative;
}

.clock-tower-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.user-info {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 30rpx;
}

.avatar-wrapper {
  position: relative;
  width: 140rpx;
  height: 140rpx;
  margin-bottom: 20rpx;
}

.user-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
}

.level-badge {
  position: absolute;
  bottom: -5rpx;
  right: -5rpx;
  background: rgba(255, 255, 255, 0.9);
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  border: 2rpx solid #667eea;
}

.level-text {
  font-size: 20rpx;
  font-weight: bold;
  color: #667eea;
}

.follow-stats {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10rpx);
  padding: 16rpx 24rpx;
  border-radius: 30rpx;
  margin-top: 10rpx;
}

.follow-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.follow-number {
  font-size: 32rpx;
  font-weight: bold;
  color: white;
  line-height: 1;
}

.follow-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 4rpx;
}

.follow-divider {
  width: 2rpx;
  height: 40rpx;
  background: rgba(255, 255, 255, 0.3);
  margin: 0 24rpx;
}

.user-details {
  flex: 1;
  padding-top: 10rpx;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 12rpx;
}

.user-name {
  font-size: 40rpx;
  font-weight: bold;
  color: white;
}

.cert-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4rpx 12rpx;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.2) 100%);
  border-radius: 20rpx;
  border: 2rpx solid rgba(255, 215, 0, 0.5);
}

.cert-icon {
  font-size: 24rpx;
}

.user-level-info {
  margin-bottom: 16rpx;
}

.level-name {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
  display: block;
  margin-bottom: 8rpx;
}

.join-time {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
  display: block;
}

.exp-progress {
  display: flex;
  align-items: center;
}

.progress-bar {
  flex: 1;
  height: 8rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4rpx;
  overflow: hidden;
  margin-right: 16rpx;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FFD700, #FFA500);
  border-radius: 4rpx;
  transition: width 0.3s ease;
}

.exp-text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  min-width: 120rpx;
  text-align: right;
}

/* 统计区域样式 */
.stats-section {
  background: white;
  margin: 20rpx;
  border-radius: 20rpx;
  padding: 40rpx 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.stats-grid {
  display: flex;
  justify-content: space-around;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.stat-number {
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 28rpx;
  color: #666;
}

/* 操作按钮样式 */
.actions-section {
  margin: 0 20rpx 20rpx;
}

.action-buttons {
  display: flex;
  gap: 20rpx;
}

.action-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: bold;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.follow-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  transition: all 0.3s ease;
}

.follow-btn.following {
  background: linear-gradient(135deg, #95a5a6, #bdc3c7);
  color: white;
}

.follow-btn.mutual {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
}

.follow-btn:hover:not(:disabled) {
  transform: translateY(-2rpx);
  box-shadow: 0 8rpx 20rpx rgba(102, 126, 234, 0.3);
}

.follow-btn.following:hover:not(:disabled) {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  transform: translateY(-2rpx);
}

.follow-btn.following:hover:not(:disabled) text::after {
  content: ' → 取消关注';
}

.follow-btn:disabled {
  opacity: 0.7;
  transform: none;
}

.chat-btn {
  background: linear-gradient(135deg, #f093fb, #f5576c);
  color: white;
  transition: all 0.3s ease;
}

.chat-btn:hover:not(:disabled) {
  transform: translateY(-2rpx);
  box-shadow: 0 8rpx 20rpx rgba(240, 147, 251, 0.3);
}

.chat-btn:disabled {
  opacity: 0.7;
  transform: none;
}

/* 近期动态样式 */
.activity-section {
  margin: 20rpx;
}

.section-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  padding-left: 10rpx;
}

.activity-card {
  background: white;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.card-header {
  margin-bottom: 20rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

/* 帖子列表样式 */
.posts-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.post-item {
  padding: 20rpx;
  background: #f8f9fa;
  border-radius: 16rpx;
  cursor: pointer;
}

.post-content {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  margin-bottom: 16rpx;
}

.post-text {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  line-height: 1.5;
}

.post-images {
  position: relative;
}

.post-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 12rpx;
}

.image-count {
  position: absolute;
  bottom: 4rpx;
  right: 4rpx;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 20rpx;
  padding: 2rpx 8rpx;
  border-radius: 8rpx;
}

.post-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.post-stats {
  display: flex;
  gap: 20rpx;
}

.stat-text {
  font-size: 24rpx;
  color: #666;
}

.post-time {
  font-size: 24rpx;
  color: #999;
}

/* 评价列表样式 */
.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.review-item {
  display: flex;
  gap: 20rpx;
  padding: 20rpx;
  background: #f8f9fa;
  border-radius: 16rpx;
  cursor: pointer;
}

.review-left {
  flex-shrink: 0;
}

.script-cover {
  width: 120rpx;
  height: 160rpx;
  border-radius: 12rpx;
}

.review-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.script-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.rating-stars {
  display: flex;
  gap: 4rpx;
}

.star {
  font-size: 24rpx;
  color: #ddd;
}

.star.active {
  color: #FFD700;
}

.review-content {
  font-size: 26rpx;
  color: #666;
  line-height: 1.4;
}

.review-time {
  font-size: 24rpx;
  color: #999;
}

/* 空状态样式 */
.empty-state {
  text-align: center;
  padding: 100rpx 40rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #999;
}

/* 加载状态样式 */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}
</style>
