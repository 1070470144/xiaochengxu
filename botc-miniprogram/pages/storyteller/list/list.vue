<template>
  <view class="page">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <uni-search-bar 
        v-model="searchKeyword" 
        placeholder="搜索说书人" 
        @confirm="handleSearch"
        @clear="handleClear">
      </uni-search-bar>
    </view>

    <!-- 筛选栏 -->
    <view class="filter-bar">
      <scroll-view scroll-x class="filter-scroll">
        <view 
          v-for="(filter, index) in filters" 
          :key="index"
          class="filter-item" 
          :class="{ active: currentFilter === index }"
          @click="selectFilter(index)">
          {{ filter.label }}
        </view>
      </scroll-view>
    </view>

    <!-- 说书人列表 -->
    <view class="storyteller-list">
      <view 
        v-for="storyteller in storytellerList" 
        :key="storyteller._id"
        class="storyteller-card"
        @click="goToDetail(storyteller._id)">
        <!-- 说书人头像 -->
        <view class="storyteller-header">
          <image 
            class="avatar" 
            :src="storyteller.user.avatar || '/static/images/default-avatar.png'" 
            mode="aspectFill">
          </image>
          <view class="info">
            <view class="name-row">
              <text class="name">{{ storyteller.user.nickname }}</text>
              <view v-if="storyteller.is_certified" class="cert-badge">
                <text class="cert-icon">✓</text>
                <text class="cert-text">认证</text>
              </view>
            </view>
            <view class="rating-row">
              <text class="rating">⭐ {{ storyteller.rating || '5.0' }}</text>
              <text class="review-count">({{ storyteller.review_count || 0 }}条评价)</text>
            </view>
          </view>
        </view>

        <!-- 说书人信息 -->
        <view class="storyteller-body">
          <view class="intro">
            <text class="intro-text">{{ storyteller.introduction || '这位说书人很神秘，暂未留下介绍...' }}</text>
          </view>

          <!-- 统计信息 -->
          <view class="stats">
            <view class="stat-item">
              <text class="stat-label">主持场次</text>
              <text class="stat-value">{{ storyteller.game_count || 0 }}</text>
            </view>
            <view class="stat-divider"></view>
            <view class="stat-item">
              <text class="stat-label">擅长剧本</text>
              <text class="stat-value">{{ storyteller.specialties ? storyteller.specialties.length : 0 }}</text>
            </view>
            <view class="stat-divider"></view>
            <view class="stat-item">
              <text class="stat-label">所在地</text>
              <text class="stat-value">{{ storyteller.location || '未知' }}</text>
            </view>
          </view>

          <!-- 标签 -->
          <view v-if="storyteller.tags && storyteller.tags.length > 0" class="tags">
            <text v-for="tag in storyteller.tags.slice(0, 3)" :key="tag" class="tag">{{ tag }}</text>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="!loading && storytellerList.length === 0" class="empty-state">
        <text class="empty-icon">🎭</text>
        <text class="empty-text">暂无说书人</text>
      </view>
    </view>

    <!-- 加载更多 -->
    <view class="load-more">
      <uni-load-more 
        :status="loadMoreStatus"
        @clickLoadMore="loadMore">
      </uni-load-more>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      searchKeyword: '',
      currentFilter: 0,
      filters: [
        { label: '全部', value: 'all' },
        { label: '认证说书人', value: 'certified' },
        { label: '高评分', value: 'high_rating' },
        { label: '附近', value: 'nearby' }
      ],
      storytellerList: [],
      loading: false,
      loadMoreStatus: 'more',
      page: 1,
      pageSize: 10
    }
  },

  onLoad() {
    // 初始化 Storyteller 云对象
    this.storytellerObj = uniCloud.importObject('storyteller', { customUI: true })
    this.loadStorytellerList()
  },

  onPullDownRefresh() {
    this.refreshList()
  },

  onReachBottom() {
    this.loadMore()
  },

  methods: {
    // 加载说书人列表
    async loadStorytellerList() {
      if (this.loading) return
      
      this.loading = true
      try {
        const res = await this.storytellerObj.getList({
          page: this.page,
          pageSize: this.pageSize,
          filter: this.filters[this.currentFilter].value,
          keyword: this.searchKeyword
        })

        if (res.code === 0) {
          const newList = res.data.list || []
          if (this.page === 1) {
            this.storytellerList = newList
          } else {
            this.storytellerList = [...this.storytellerList, ...newList]
          }

          // 更新加载状态
          if (newList.length < this.pageSize) {
            this.loadMoreStatus = 'noMore'
          } else {
            this.loadMoreStatus = 'more'
          }
        }
      } catch (error) {
        console.error('加载说书人列表失败:', error)
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
        uni.stopPullDownRefresh()
      }
    },

    // 刷新列表
    refreshList() {
      this.page = 1
      this.loadStorytellerList()
    },

    // 加载更多
    loadMore() {
      if (this.loadMoreStatus === 'more') {
        this.page++
        this.loadStorytellerList()
      }
    },

    // 搜索
    handleSearch() {
      this.refreshList()
    },

    // 清空搜索
    handleClear() {
      this.searchKeyword = ''
      this.refreshList()
    },

    // 选择筛选
    selectFilter(index) {
      if (this.currentFilter === index) return
      this.currentFilter = index
      this.refreshList()
    },

    // 跳转详情
    goToDetail(id) {
      uni.navigateTo({
        url: `/pages/storyteller/detail/detail?id=${id}`
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
}

/* 搜索栏 - Apple HIG标准间距 */
.search-bar {
  background: #FFFFFF;
  padding: 24rpx;
  border-bottom: 1px solid #E8E8E8;
}

/* 筛选栏 - Apple HIG触摸区域 */
.filter-bar {
  background: #FFFFFF;
  padding: 24rpx;
  border-bottom: 1px solid #E8E8E8;
}

.filter-scroll {
  white-space: nowrap;
}

.filter-item {
  display: inline-block;
  padding: 16rpx 24rpx;
  margin-right: 16rpx;
  font-size: 28rpx;
  font-weight: 400;
  color: #666666;
  background-color: #F5F5F5;
  border-radius: 16rpx;
  white-space: nowrap;
  min-height: 60rpx;
  line-height: 1.4;
  transition: all 0.2s ease;
}

.filter-item.active {
  background-color: #8B4513;
  color: #FFFFFF;
  font-weight: 500;
}

/* 说书人列表 */
.storyteller-list {
  padding: 24rpx;
}

/* 说书人卡片 - Apple HIG卡片规范 */
.storyteller-card {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(139, 69, 19, 0.08);
  transition: all 0.3s ease;
}

.storyteller-card:active {
  transform: scale(0.98);
  opacity: 0.95;
}

/* 说书人头部 */
.storyteller-header {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}

.avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 48rpx;
  margin-right: 24rpx;
  border: 3rpx solid #8B4513;
}

.info {
  flex: 1;
}

.name-row {
  display: flex;
  align-items: center;
  margin-bottom: 8rpx;
}

.name {
  font-size: 32rpx;
  font-weight: 600;
  color: #1A1A1A;
  margin-right: 12rpx;
  line-height: 1.4;
}

.cert-badge {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  padding: 4rpx 12rpx;
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
  font-size: 20rpx;
  font-weight: 500;
  line-height: 1;
}

.rating-row {
  display: flex;
  align-items: center;
}

.rating {
  font-size: 26rpx;
  font-weight: 500;
  color: #FF6B35;
  margin-right: 8rpx;
  line-height: 1.4;
}

.review-count {
  font-size: 24rpx;
  font-weight: 400;
  color: #999999;
  line-height: 1.4;
}

/* 说书人内容 */
.storyteller-body {
}

.intro {
  margin-bottom: 24rpx;
}

.intro-text {
  font-size: 26rpx;
  font-weight: 400;
  color: #666666;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

/* 统计信息 */
.stats {
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: rgba(139, 69, 19, 0.03);
  border-radius: 12rpx;
  padding: 24rpx 16rpx;
  margin-bottom: 24rpx;
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-label {
  font-size: 24rpx;
  font-weight: 400;
  color: #999999;
  display: block;
  margin-bottom: 8rpx;
  line-height: 1.4;
}

.stat-value {
  font-size: 28rpx;
  font-weight: 600;
  color: #8B4513;
  display: block;
  line-height: 1.4;
}

.stat-divider {
  width: 1px;
  height: 40rpx;
  background-color: #E8E8E8;
}

/* 标签 */
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.tag {
  font-size: 22rpx;
  font-weight: 400;
  color: #8B4513;
  background-color: rgba(139, 69, 19, 0.1);
  padding: 6rpx 16rpx;
  border-radius: 12rpx;
  line-height: 1.4;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 120rpx 0;
}

.empty-icon {
  font-size: 96rpx;
  display: block;
  margin-bottom: 24rpx;
  opacity: 0.5;
}

.empty-text {
  font-size: 28rpx;
  font-weight: 400;
  color: #999999;
  line-height: 1.4;
}

/* 加载更多 */
.load-more {
  padding: 32rpx 0;
}
</style>

