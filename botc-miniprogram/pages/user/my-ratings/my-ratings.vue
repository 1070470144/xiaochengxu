<template>
  <view class="page">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="header-title">我的评分</text>
      <text class="header-subtitle">{{ total }}个剧本</text>
    </view>

    <!-- 评分列表 -->
    <view v-if="ratingList.length > 0" class="rating-list">
      <view 
        v-for="item in ratingList" 
        :key="item._id"
        class="rating-item"
        @click="goToScriptDetail(item.script_id)"
      >
        <!-- 剧本封面 -->
        <view class="script-cover">
          <image 
            v-if="item.script_info.user_images && item.script_info.user_images.length > 0"
            class="cover-image"
            :src="item.script_info.user_images[0]"
            mode="aspectFill"
          />
          <view v-else class="cover-placeholder">
            <text class="placeholder-icon">📖</text>
          </view>
        </view>

        <!-- 剧本信息 -->
        <view class="script-info">
          <text class="script-title">{{ item.script_info.title }}</text>
          <text v-if="item.script_info.author" class="script-author">
            {{ item.script_info.author }}
          </text>
          <text class="script-meta">
            {{ item.script_info.player_count }} · 
            平均{{ (item.script_info.average_rating || 0).toFixed(1) }}分
          </text>
        </view>

        <!-- 我的评分 -->
        <view class="my-rating">
          <view class="rating-stars">
            <text v-for="star in 5" :key="star" class="star">
              {{ star <= item.rating ? '⭐' : '☆' }}
            </text>
          </view>
          <text class="rating-score">{{ item.rating }}分</text>
          <text class="rating-time">{{ formatTime(item.updated_at) }}</text>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view v-else-if="!loading" class="empty-state">
      <text class="empty-icon">📊</text>
      <text class="empty-text">还没有评分记录</text>
      <text class="empty-hint">去剧本详情页给喜欢的剧本打分吧</text>
      <button class="btn-explore" @click="goToScripts">浏览剧本</button>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-container">
      <uni-load-more status="loading"></uni-load-more>
    </view>

    <!-- 加载更多 -->
    <view v-if="hasMore && !loading && ratingList.length > 0" class="load-more">
      <button class="btn-load-more" @click="loadMore">加载更多</button>
    </view>

    <!-- 到底了 -->
    <view v-if="!hasMore && ratingList.length > 0" class="no-more">
      <text>没有更多了</text>
    </view>
  </view>
</template>

<script>
import Auth from '@/utils/auth.js'

export default {
  name: 'MyRatings',
  
  data() {
    return {
      ratingList: [],
      loading: false,
      page: 1,
      limit: 20,
      total: 0,
      hasMore: true,
      currentUserId: ''
    }
  },

  onLoad() {
    // 获取用户信息
    const userInfo = Auth.getUserInfo()
    if (userInfo) {
      this.currentUserId = userInfo.uid || userInfo._id || userInfo.id
      this.loadRatings()
    } else {
      uni.showModal({
        title: '提示',
        content: '请先登录',
        success: (res) => {
          if (res.confirm) {
            uni.navigateTo({
              url: '/pages/login/sms-login'
            })
          } else {
            uni.navigateBack()
          }
        }
      })
    }
  },

  onPullDownRefresh() {
    this.page = 1
    this.ratingList = []
    this.hasMore = true
    this.loadRatings().then(() => {
      uni.stopPullDownRefresh()
    })
  },

  methods: {
    // 加载评分列表
    async loadRatings() {
      if (this.loading || !this.hasMore) return

      this.loading = true

      try {
        const result = await uniCloud.callFunction({
          name: 'script-rating',
          data: {
            action: 'getUserRatings',
            user_id: this.currentUserId,
            page: this.page,
            limit: this.limit
          }
        })

        if (result.result.code === 0) {
          const { list, total } = result.result.data
          
          if (this.page === 1) {
            this.ratingList = list
          } else {
            this.ratingList.push(...list)
          }
          
          this.total = total
          this.hasMore = this.ratingList.length < total
          
          console.log(`✅ 加载评分成功: ${list.length}条, 共${total}条`)
        } else {
          throw new Error(result.result.message)
        }
      } catch (error) {
        console.error('加载评分失败:', error)
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },

    // 加载更多
    loadMore() {
      this.page++
      this.loadRatings()
    },

    // 跳转到剧本详情
    goToScriptDetail(scriptId) {
      uni.navigateTo({
        url: `/pages/script/detail/detail?id=${scriptId}`
      })
    },

    // 浏览剧本
    goToScripts() {
      uni.switchTab({
        url: '/pages/script/index/index'
      })
    },

    // 格式化时间
    formatTime(timestamp) {
      const date = new Date(timestamp)
      const now = new Date()
      const diff = now - date

      const minute = 60 * 1000
      const hour = 60 * minute
      const day = 24 * hour

      if (diff < minute) {
        return '刚刚'
      } else if (diff < hour) {
        return `${Math.floor(diff / minute)}分钟前`
      } else if (diff < day) {
        return `${Math.floor(diff / hour)}小时前`
      } else if (diff < 7 * day) {
        return `${Math.floor(diff / day)}天前`
      } else {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      }
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 40rpx;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx 30rpx 30rpx;
}

.header-title {
  display: block;
  font-size: 40rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 8rpx;
}

.header-subtitle {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.9);
}

.rating-list {
  padding: 20rpx 30rpx;
}

.rating-item {
  display: flex;
  gap: 24rpx;
  padding: 24rpx;
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
  transition: transform 0.2s;
}

.rating-item:active {
  transform: scale(0.98);
}

.script-cover {
  width: 120rpx;
  height: 160rpx;
  flex-shrink: 0;
  border-radius: 12rpx;
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-icon {
  font-size: 48rpx;
}

.script-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
}

.script-title {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.script-author {
  font-size: 26rpx;
  color: #666;
}

.script-meta {
  font-size: 24rpx;
  color: #999;
}

.my-rating {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8rpx;
  flex-shrink: 0;
}

.rating-stars {
  display: flex;
}

.star {
  font-size: 24rpx;
}

.rating-score {
  font-size: 28rpx;
  font-weight: 500;
  color: #667eea;
}

.rating-time {
  font-size: 22rpx;
  color: #999;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
  gap: 20rpx;
}

.empty-icon {
  font-size: 120rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #666;
  font-weight: 500;
}

.empty-hint {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 20rpx;
}

.btn-explore {
  padding: 24rpx 60rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 40rpx;
  font-size: 30rpx;
}

.loading-container {
  padding: 40rpx 0;
}

.load-more {
  padding: 20rpx 30rpx;
}

.btn-load-more {
  width: 100%;
  padding: 24rpx 0;
  background: #fff;
  color: #667eea;
  border: 2rpx solid #667eea;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.no-more {
  padding: 40rpx 0;
  text-align: center;
  font-size: 26rpx;
  color: #999;
}
</style>

