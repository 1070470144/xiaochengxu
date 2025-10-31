<template>
  <view class="page">
    <!-- 搜索和筛选栏 -->
    <view class="filter-bar">
      <!-- 搜索和下拉组合 -->
      <view class="filter-row">
        <!-- 搜索框 -->
        <view class="search-box">
          <text class="search-icon">🔍</text>
          <input 
            class="search-input" 
            v-model="searchKeyword" 
            placeholder="搜索剧本名称或作者"
            @confirm="handleSearch"
          />
          <text v-if="searchKeyword" class="clear-icon" @click="clearSearch">✕</text>
        </view>
        
        <!-- 评分下拉选择 -->
        <view class="rating-select" @click="toggleRatingDropdown">
          <text class="select-label">{{ getCurrentRatingLabel() }}</text>
          <text class="select-arrow" :class="{ 'arrow-up': showRatingDropdown }">▼</text>
        </view>
      </view>
      
      <!-- 下拉选项面板 -->
      <view v-if="showRatingDropdown" class="dropdown-panel">
        <view 
          v-for="filter in ratingFilters" 
          :key="filter.value"
          class="dropdown-item"
          :class="{ active: selectedRating === filter.value }"
          @click="selectRatingFilter(filter.value)"
        >
          <text class="item-label">{{ filter.label }}</text>
          <text v-if="selectedRating === filter.value" class="item-check">✓</text>
        </view>
      </view>
      
      <!-- 统计信息 -->
      <view class="stats-info">
        <text class="stats-text">共 {{ total }} 个剧本</text>
      </view>
    </view>

    <!-- 评分列表 -->
    <view v-if="ratingList.length > 0" class="rating-list" @click="closeDropdown">
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
    <view v-else-if="!loading" class="empty-state" @click="closeDropdown">
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
      currentUserId: '',
      
      // 搜索和筛选
      searchKeyword: '',
      selectedRating: 0, // 0=全部, 1-5=对应评分
      showRatingDropdown: false, // 是否显示下拉面板
      ratingFilters: [
        { label: '全部评分', value: 0 },
        { label: '⭐ 1分', value: 1 },
        { label: '⭐⭐ 2分', value: 2 },
        { label: '⭐⭐⭐ 3分', value: 3 },
        { label: '⭐⭐⭐⭐ 4分', value: 4 },
        { label: '⭐⭐⭐⭐⭐ 5分', value: 5 }
      ]
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
            limit: this.limit,
            searchKeyword: this.searchKeyword,
            rating: this.selectedRating
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
    
    // 搜索
    handleSearch() {
      console.log('搜索关键词:', this.searchKeyword)
      this.page = 1
      this.ratingList = []
      this.hasMore = true
      this.loadRatings()
    },
    
    // 清除搜索
    clearSearch() {
      this.searchKeyword = ''
      this.handleSearch()
    },
    
    // 切换下拉面板
    toggleRatingDropdown() {
      this.showRatingDropdown = !this.showRatingDropdown
    },
    
    // 选择评分筛选
    selectRatingFilter(rating) {
      console.log('筛选评分:', rating)
      this.selectedRating = rating
      this.showRatingDropdown = false // 关闭下拉面板
      this.page = 1
      this.ratingList = []
      this.hasMore = true
      this.loadRatings()
    },
    
    // 获取当前评分筛选的显示文本
    getCurrentRatingLabel() {
      const filter = this.ratingFilters.find(f => f.value === this.selectedRating)
      return filter ? filter.label : '全部评分'
    },
    
    // 关闭下拉面板
    closeDropdown() {
      if (this.showRatingDropdown) {
        this.showRatingDropdown = false
      }
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

/* 搜索和筛选栏 */
.filter-bar {
  background: #fff;
  padding: 24rpx 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
  position: relative;
  z-index: 10;
}

/* 搜索和下拉组合行 */
.filter-row {
  display: flex;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

/* 搜索框 */
.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 50rpx;
  padding: 0 24rpx;
  height: 72rpx;
}

.search-icon {
  font-size: 32rpx;
  margin-right: 12rpx;
  opacity: 0.5;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  height: 100%;
}

.clear-icon {
  font-size: 32rpx;
  color: #999;
  padding: 8rpx;
  margin-right: -8rpx;
}

/* 评分下拉选择 */
.rating-select {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8rpx;
  background: #f5f5f5;
  border-radius: 50rpx;
  padding: 0 24rpx;
  height: 72rpx;
  min-width: 200rpx;
  cursor: pointer;
  transition: all 0.3s;
}

.rating-select:active {
  background: #e8e8e8;
}

.select-label {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.select-arrow {
  font-size: 20rpx;
  color: #999;
  transition: transform 0.3s;
}

.select-arrow.arrow-up {
  transform: rotate(180deg);
}

/* 下拉选项面板 */
.dropdown-panel {
  position: absolute;
  left: 30rpx;
  right: 30rpx;
  top: 112rpx;
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
  overflow: hidden;
  animation: dropdownFadeIn 0.3s ease;
  z-index: 100;
}

@keyframes dropdownFadeIn {
  from {
    opacity: 0;
    transform: translateY(-10rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
  transition: background 0.2s;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:active {
  background: #f5f5f5;
}

.dropdown-item.active {
  background: #fff8f0;
}

.item-label {
  font-size: 28rpx;
  color: #333;
}

.dropdown-item.active .item-label {
  color: #8B4513;
  font-weight: bold;
}

.item-check {
  font-size: 32rpx;
  color: #8B4513;
  font-weight: bold;
}

/* 统计信息 */
.stats-info {
  display: flex;
  justify-content: center;
  padding-top: 8rpx;
}

.stats-text {
  font-size: 24rpx;
  color: #999;
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

