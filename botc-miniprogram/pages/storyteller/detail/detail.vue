<template>
  <view class="page">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-container">
      <uni-load-more status="loading"></uni-load-more>
    </view>

    <!-- 说书人详情 -->
    <view v-else-if="storytellerDetail" class="storyteller-detail">
      <!-- 头部信息 -->
      <view class="storyteller-header">
        <view class="header-bg"></view>
        <view class="header-content">
          <image 
            class="avatar" 
            :src="storytellerDetail.user.avatar || '/static/images/default-avatar.png'" 
            mode="aspectFill">
          </image>
          <view class="info">
            <view class="name-row">
              <text class="name">{{ storytellerDetail.user.nickname }}</text>
              <view v-if="storytellerDetail.is_certified" class="cert-badge">
                <text class="cert-icon">✓</text>
                <text class="cert-text">认证说书人</text>
              </view>
            </view>
            <view class="rating-row">
              <text class="rating">⭐ {{ storytellerDetail.rating || '5.0' }}</text>
              <text class="review-count">({{ storytellerDetail.review_count || 0 }}条评价)</text>
            </view>
            <text class="location">📍 {{ storytellerDetail.location || '未知地区' }}</text>
          </view>
        </view>
      </view>

      <!-- 统计数据 -->
      <view class="stats-section">
        <view class="stat-item">
          <text class="stat-number">{{ storytellerDetail.game_count || 0 }}</text>
          <text class="stat-label">主持场次</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-number">{{ storytellerDetail.review_count || 0 }}</text>
          <text class="stat-label">收到评价</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-number">{{ storytellerDetail.specialties ? storytellerDetail.specialties.length : 0 }}</text>
          <text class="stat-label">擅长剧本</text>
        </view>
      </view>

      <!-- 个人介绍 -->
      <view class="intro-card card">
        <view class="card-header">
          <text class="card-title">个人介绍</text>
        </view>
        <view class="card-body">
          <text class="intro-text">{{ storytellerDetail.introduction || '这位说书人很神秘，暂未留下介绍...' }}</text>
        </view>
      </view>

      <!-- 擅长剧本 -->
      <view v-if="storytellerDetail.specialties && storytellerDetail.specialties.length > 0" class="specialties-card card">
        <view class="card-header">
          <text class="card-title">擅长剧本</text>
        </view>
        <view class="card-body">
          <view class="specialty-list">
            <text v-for="specialty in storytellerDetail.specialties" :key="specialty" class="specialty-item">
              {{ specialty }}
            </text>
          </view>
        </view>
      </view>

      <!-- 服务信息 -->
      <view class="service-card card">
        <view class="card-header">
          <text class="card-title">服务信息</text>
        </view>
        <view class="card-body">
          <view class="service-item">
            <text class="service-label">服务时间：</text>
            <text class="service-value">{{ storytellerDetail.available_time || '随时' }}</text>
          </view>
          <view class="service-item">
            <text class="service-label">服务地区：</text>
            <text class="service-value">{{ storytellerDetail.service_area || '待定' }}</text>
          </view>
          <view class="service-item">
            <text class="service-label">联系方式：</text>
            <text class="service-value">{{ storytellerDetail.contact || '站内私聊' }}</text>
          </view>
        </view>
      </view>

      <!-- 标签 -->
      <view v-if="storytellerDetail.tags && storytellerDetail.tags.length > 0" class="tags-card card">
        <view class="card-header">
          <text class="card-title">特色标签</text>
        </view>
        <view class="card-body">
          <view class="tags">
            <text v-for="tag in storytellerDetail.tags" :key="tag" class="tag">{{ tag }}</text>
          </view>
        </view>
      </view>

      <!-- 用户评价 -->
      <view class="reviews-section">
        <view class="section-header">
          <text class="section-title">用户评价</text>
          <text class="review-count-text">共{{ storytellerDetail.review_count || 0 }}条</text>
        </view>

        <view v-if="reviewList.length > 0" class="review-list">
          <view v-for="review in reviewList" :key="review._id" class="review-item">
            <view class="review-header">
              <view class="user-info">
                <image class="user-avatar" :src="review.user.avatar || '/static/images/default-avatar.png'"></image>
                <text class="user-name">{{ review.user.nickname || '匿名用户' }}</text>
              </view>
              <text class="review-time">{{ formatTime(review.created_at) }}</text>
            </view>
            <view class="review-rating">
              <text class="rating-stars">{{ getStars(review.rating) }}</text>
            </view>
            <text class="review-content">{{ review.content }}</text>
          </view>
        </view>

        <view v-else class="empty-reviews">
          <text class="empty-text">暂无评价</text>
        </view>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="action-bar">
      <button class="action-btn btn-secondary" @click="chatWithStoryteller">
        <text class="btn-icon">💬</text>
        <text>私聊</text>
      </button>
      <button class="action-btn btn-primary" @click="inviteStoryteller">
        <text class="btn-icon">✉️</text>
        <text>邀请说书</text>
      </button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      storytellerId: '',
      storytellerDetail: null,
      reviewList: [],
      loading: true
    }
  },

  onLoad(options) {
    // 初始化 Storyteller 云对象
    this.storytellerObj = uniCloud.importObject('storyteller', { customUI: true })
    
    if (options.id) {
      this.storytellerId = options.id
      this.loadStorytellerDetail()
      this.loadReviews()
    }
  },

  methods: {
    // 加载说书人详情
    async loadStorytellerDetail() {
      try {
        const res = await this.storytellerObj.getDetail(this.storytellerId)

        if (res.code === 0) {
          this.storytellerDetail = res.data
        } else {
          uni.showToast({
            title: res.message || '加载失败',
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('加载说书人详情失败:', error)
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },

    // 加载评价列表
    async loadReviews() {
      try {
        const res = await this.storytellerObj.getReviews(this.storytellerId, 1, 5)

        if (res.code === 0) {
          this.reviewList = res.data.list || []
        }
      } catch (error) {
        console.error('加载评价失败:', error)
      }
    },

    // 格式化时间
    formatTime(timestamp) {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      const now = new Date()
      const diff = now - date
      
      if (diff < 60000) return '刚刚'
      if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
      if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
      if (diff < 604800000) return Math.floor(diff / 86400000) + '天前'
      
      return `${date.getMonth() + 1}-${date.getDate()}`
    },

    // 获取星级
    getStars(rating) {
      const fullStars = Math.floor(rating)
      const hasHalfStar = rating % 1 >= 0.5
      let stars = '⭐'.repeat(fullStars)
      if (hasHalfStar) stars += '✨'
      return stars
    },

    // 私聊说书人
    chatWithStoryteller() {
      uni.navigateTo({
        url: `/pages/community/chat/detail/detail?userId=${this.storytellerDetail.user_id}`
      })
    },

    // 邀请说书
    inviteStoryteller() {
      uni.showModal({
        title: '邀请说书',
        content: '是否邀请该说书人为你的拼车说书？',
        success: (res) => {
          if (res.confirm) {
            // 跳转到创建拼车页面，并预填说书人
            uni.navigateTo({
              url: `/pages/carpool/create/create?storytellerId=${this.storytellerId}`
            })
          }
        }
      })
    }
  }
}
</script>

<style scoped>
/* 页面容器 */
.page {
  background-color: #F8F8F8;
  min-height: 100vh;
  padding-bottom: 120rpx;
}

/* 加载状态 */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

/* 头部区域 */
.storyteller-header {
  position: relative;
  padding: 48rpx 32rpx;
  background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%);
}

.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.1;
}

.header-content {
  position: relative;
  display: flex;
  align-items: center;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  margin-right: 32rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
}

.info {
  flex: 1;
}

.name-row {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.name {
  font-size: 36rpx;
  font-weight: 700;
  color: #FFFFFF;
  margin-right: 16rpx;
  line-height: 1.3;
}

.cert-badge {
  display: flex;
  align-items: center;
  background: rgba(255, 215, 0, 0.9);
  padding: 6rpx 16rpx;
  border-radius: 12rpx;
}

.cert-icon {
  color: #FFFFFF;
  font-size: 20rpx;
  font-weight: 700;
  margin-right: 4rpx;
  line-height: 1;
}

.cert-text {
  color: #FFFFFF;
  font-size: 22rpx;
  font-weight: 500;
  line-height: 1;
}

.rating-row {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.rating {
  font-size: 28rpx;
  font-weight: 600;
  color: #FFFFFF;
  margin-right: 12rpx;
  line-height: 1.4;
}

.review-count {
  font-size: 24rpx;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.4;
}

.location {
  font-size: 26rpx;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.5;
}

/* 统计数据 */
.stats-section {
  background: #FFFFFF;
  margin: 32rpx;
  padding: 32rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(139, 69, 19, 0.08);
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-number {
  font-size: 36rpx;
  font-weight: 700;
  color: #8B4513;
  display: block;
  margin-bottom: 8rpx;
  line-height: 1.2;
}

.stat-label {
  font-size: 24rpx;
  font-weight: 400;
  color: #999999;
  display: block;
  line-height: 1.4;
}

.stat-divider {
  width: 1px;
  height: 40rpx;
  background-color: #E8E8E8;
}

/* 卡片样式 */
.card {
  background: #FFFFFF;
  border-radius: 16rpx;
  margin: 0 32rpx 24rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(139, 69, 19, 0.08);
}

.card-header {
  margin-bottom: 24rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1A1A1A;
  line-height: 1.4;
}

.card-body {
}

/* 个人介绍 */
.intro-text {
  font-size: 26rpx;
  font-weight: 400;
  color: #666666;
  line-height: 1.6;
}

/* 擅长剧本 */
.specialty-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.specialty-item {
  font-size: 26rpx;
  font-weight: 500;
  color: #8B4513;
  background: rgba(139, 69, 19, 0.1);
  padding: 12rpx 24rpx;
  border-radius: 12rpx;
  line-height: 1.4;
}

/* 服务信息 */
.service-item {
  display: flex;
  margin-bottom: 16rpx;
}

.service-item:last-child {
  margin-bottom: 0;
}

.service-label {
  font-size: 26rpx;
  font-weight: 500;
  color: #666666;
  min-width: 140rpx;
  line-height: 1.5;
}

.service-value {
  font-size: 26rpx;
  font-weight: 400;
  color: #1A1A1A;
  flex: 1;
  line-height: 1.5;
}

/* 标签 */
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.tag {
  font-size: 24rpx;
  font-weight: 400;
  color: #8B4513;
  background-color: rgba(139, 69, 19, 0.1);
  padding: 8rpx 16rpx;
  border-radius: 12rpx;
  line-height: 1.4;
}

/* 评价区域 */
.reviews-section {
  margin: 0 32rpx 24rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1A1A1A;
  line-height: 1.4;
}

.review-count-text {
  font-size: 26rpx;
  font-weight: 400;
  color: #999999;
  line-height: 1.4;
}

/* 评价列表 */
.review-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.review-item {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(139, 69, 19, 0.08);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-avatar {
  width: 48rpx;
  height: 48rpx;
  border-radius: 24rpx;
  margin-right: 12rpx;
}

.user-name {
  font-size: 26rpx;
  font-weight: 500;
  color: #1A1A1A;
  line-height: 1.4;
}

.review-time {
  font-size: 22rpx;
  font-weight: 400;
  color: #999999;
  line-height: 1.4;
}

.review-rating {
  margin-bottom: 12rpx;
}

.rating-stars {
  font-size: 24rpx;
  line-height: 1;
}

.review-content {
  font-size: 26rpx;
  font-weight: 400;
  color: #666666;
  line-height: 1.6;
}

/* 空状态 */
.empty-reviews {
  text-align: center;
  padding: 80rpx 0;
}

.empty-text {
  font-size: 28rpx;
  font-weight: 400;
  color: #999999;
  line-height: 1.4;
}

/* 底部操作栏 */
.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #FFFFFF;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  border-top: 1px solid #E8E8E8;
  display: flex;
  gap: 24rpx;
  z-index: 100;
}

.action-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 12rpx;
  font-size: 30rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  transition: opacity 0.2s ease;
}

.action-btn:active {
  opacity: 0.6;
}

.btn-icon {
  font-size: 32rpx;
  line-height: 1;
}

.btn-secondary {
  background: #F5F5F5;
  color: #1A1A1A;
}

.btn-primary {
  background: #8B4513;
  color: #FFFFFF;
}
</style>

