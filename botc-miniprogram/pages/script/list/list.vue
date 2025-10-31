<template>
  <view class="page">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <uni-search-bar 
        v-model="searchKeyword"
        placeholder="搜索剧本名称、作者"
        @confirm="handleSearch"
        @clear="handleClear"
        :focus="false"
        bg-color="#ffffff"
        cancel-button="none">
      </uni-search-bar>
    </view>

    <!-- 筛选栏 -->
    <view class="filter-bar">
      <scroll-view scroll-x="true" class="filter-scroll">
        <view class="filter-items">
          <text 
            :class="['filter-item', currentType === 'all' ? 'active' : '']"
            @click="changeType('all')">全部</text>
          <text 
            :class="['filter-item', currentType === 'hot' ? 'active' : '']"
            @click="changeType('hot')">热门</text>
          <text 
            :class="['filter-item', currentType === 'new' ? 'active' : '']"
            @click="changeType('new')">最新</text>
          <text 
            :class="['filter-item', currentType === 'rating' ? 'active' : '']"
            @click="changeType('rating')">高分</text>
          <text 
            :class="['filter-item', currentType === 'mystery' ? 'active' : '']"
            @click="changeType('mystery')">推理</text>
          <text 
            :class="['filter-item', currentType === 'fun' ? 'active' : '']"
            @click="changeType('fun')">娱乐</text>
        </view>
      </scroll-view>
    </view>

    <!-- 剧本列表 -->
    <view class="container">
      <view v-if="loading && scriptList.length === 0" class="loading-state">
        <uni-load-more status="loading" />
      </view>

      <view v-else-if="scriptList.length === 0" class="empty-state">
        <text class="empty-text">暂无剧本数据</text>
      </view>

      <view v-else class="script-list">
        <view 
          v-for="script in scriptList" 
          :key="script._id" 
          class="script-card"
          @click="goToDetail(script._id)">
          
          <!-- 剧本头部信息 -->
          <view class="script-header">
            <view class="script-basic">
              <text class="script-title">{{ script.title }}</text>
              <text v-if="script.subtitle" class="script-subtitle">{{ script.subtitle }}</text>
            </view>
            <view class="script-rating">
              <text class="rating-score">⭐{{ script.average_rating ? script.average_rating.toFixed(1) : '0.0' }}</text>
              <text class="rating-count">({{ script.rating_count || 0 }})</text>
            </view>
          </view>

          <!-- 剧本描述 -->
          <text class="script-desc">{{ script.description || '暂无描述' }}</text>

          <!-- 剧本meta信息 -->
          <view class="script-meta">
            <view class="meta-left">
              <text class="meta-item">👥{{ script.player_count || '未知' }}</text>
              <text class="meta-item">⏱️{{ script.duration ? script.duration + '分钟' : '未知' }}</text>
              <text class="meta-item difficulty" :class="getDifficultyClass(script.difficulty)">
                {{ getDifficultyText(script.difficulty) }}
              </text>
            </view>
            <view class="meta-right">
              <text class="meta-item">👁️{{ script.view_count || 0 }}</text>
            </view>
          </view>

          <!-- 创建者信息 -->
          <view class="script-footer">
            <text class="script-type" :class="getTypeClass(script.script_type)">
              {{ getTypeText(script.script_type) }}
            </text>
            <text class="create-time">{{ formatTime(script.created_at) }}</text>
          </view>

          <!-- 标签 -->
          <view v-if="script.tags && script.tags.length > 0" class="script-tags">
            <text 
              v-for="tag in script.tags.slice(0, 3)" 
              :key="tag" 
              class="tag">{{ tag }}</text>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view v-if="scriptList.length > 0" class="load-more">
        <uni-load-more 
          :status="loadMoreStatus" 
          @clickLoadMore="loadMore">
        </uni-load-more>
      </view>
    </view>
  </view>
</template>

<script>
const db = uniCloud.database()
const dbCmd = db.command

export default {
  name: 'ScriptList',
  
  data() {
    return {
      scriptList: [],
      searchKeyword: '',
      currentType: 'all',
      loading: false,
      loadMoreStatus: 'more',
      currentPage: 1,
      pageSize: 20,
      hasNext: true
    }
  },

  onLoad(options) {
    if (options.keyword) {
      this.searchKeyword = options.keyword
    }
    if (options.type) {
      this.currentType = options.type
    }
    this.loadScriptList()
  },

  onShow() {
    this.refreshList()
  },

  onPullDownRefresh() {
    this.refreshList()
  },

  onReachBottom() {
    this.loadMore()
  },

  methods: {
    async loadScriptList(isLoadMore = false) {
      if (this.loading) return
      
      this.loading = true
      if (!isLoadMore) {
        this.loadMoreStatus = 'loading'
      }

      try {
        // 构建查询条件
        let whereCondition = { status: 1 }
        
        if (this.searchKeyword) {
          whereCondition.title = new RegExp(this.searchKeyword, 'i')
        }

        if (this.currentType === 'mystery') {
          whereCondition.script_type = 1
        } else if (this.currentType === 'fun') {
          whereCondition.script_type = 2
        }

        // 构建排序
        let orderByField = 'published_at'
        let orderByDirection = 'desc'
        
        if (this.currentType === 'hot') {
          orderByField = 'heat_score'  // 使用热度分数排序
        } else if (this.currentType === 'rating') {
          orderByField = 'average_rating'  // 使用平均评分排序
        } else if (this.currentType === 'new') {
          orderByField = 'published_at'
        }

        const res = await db.collection('botc-scripts')
          .where(whereCondition)
          .orderBy(orderByField, orderByDirection)
          .skip((this.currentPage - 1) * this.pageSize)
          .limit(this.pageSize)
          .get()

        const list = res.result.data
        
        if (isLoadMore) {
          this.scriptList = [...this.scriptList, ...list]
        } else {
          this.scriptList = list
        }
        
        this.hasNext = list.length >= this.pageSize
        this.loadMoreStatus = this.hasNext ? 'more' : 'noMore'
        
      } catch (error) {
        console.error('加载剧本列表失败：', error)
        uni.showToast({ title: '加载失败', icon: 'none' })
        this.loadMoreStatus = 'more'
      } finally {
        this.loading = false
        uni.stopPullDownRefresh()
      }
    },

    refreshList() {
      this.currentPage = 1
      this.hasNext = true
      this.loadScriptList()
    },

    loadMore() {
      if (!this.hasNext || this.loading) return
      
      this.currentPage++
      this.loadScriptList(true)
    },

    handleSearch(e) {
      this.searchKeyword = e.value || e
      this.refreshList()
    },

    handleClear() {
      this.searchKeyword = ''
      this.refreshList()
    },

    changeType(type) {
      if (this.currentType === type) return
      
      this.currentType = type
      this.refreshList()
    },

    goToDetail(id) {
      uni.navigateTo({
        url: `/pages/script/detail/detail?id=${id}`
      })
    },

    formatTime(timestamp) {
      if (!timestamp) return ''
      
      const date = new Date(timestamp)
      const now = new Date()
      const diff = now - date
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      
      if (days === 0) {
        return '今天'
      } else if (days === 1) {
        return '昨天'
      } else if (days < 7) {
        return `${days}天前`
      } else {
        return `${date.getMonth() + 1}/${date.getDate()}`
      }
    },

    getTypeText(type) {
      return type === 1 ? '推理' : '娱乐'
    },

    getTypeClass(type) {
      return type === 1 ? 'type-mystery' : 'type-fun'
    },

    getDifficultyClass(difficulty) {
      const classMap = {
        1: 'difficulty-easy',
        2: 'difficulty-normal', 
        3: 'difficulty-hard',
        4: 'difficulty-expert'
      }
      return classMap[difficulty] || 'difficulty-unknown'
    },

    getDifficultyText(difficulty) {
      const textMap = {
        1: '简单',
        2: '中等',
        3: '困难', 
        4: '专家'
      }
      return textMap[difficulty] || '未知'
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
}

.search-bar {
  background: #fff;
  padding: 24rpx;
  border-bottom: 1px solid #e8e8e8;
}

.filter-bar {
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
}

.filter-scroll {
  white-space: nowrap;
  padding: 24rpx 0;
}

.filter-items {
  display: inline-flex;
  padding: 0 24rpx;
}

.filter-item {
  display: inline-block;
  padding: 16rpx 24rpx;
  margin-right: 16rpx;
  font-size: 28rpx;
  color: #666;
  background: #f5f5f5;
  border-radius: 16rpx;
  white-space: nowrap;
  transition: all 0.2s;
}

.filter-item.active {
  background: #8b4513;
  color: #fff;
  font-weight: 500;
}

.container {
  padding: 20rpx;
}

.script-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.script-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  transition: all 0.3s;
}

.script-card:active {
  transform: scale(0.98);
  opacity: 0.95;
}

.script-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16rpx;
}

.script-basic {
  flex: 1;
  margin-right: 20rpx;
}

.script-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.script-subtitle {
  font-size: 26rpx;
  color: #8b4513;
  display: block;
}

.script-rating {
  text-align: right;
  flex-shrink: 0;
}

.rating-score {
  font-size: 28rpx;
  font-weight: bold;
  color: #ff6b35;
}

.rating-count {
  font-size: 22rpx;
  color: #999;
  margin-left: 5rpx;
}

.script-desc {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
  margin-bottom: 16rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.script-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.meta-left {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.meta-right {
  display: flex;
  align-items: center;
}

.meta-item {
  font-size: 24rpx;
  color: #999;
}

.difficulty {
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  color: #fff !important;
  font-weight: bold;
  font-size: 22rpx;
}

.difficulty-easy { background: #52c41a; }
.difficulty-normal { background: #1890ff; }
.difficulty-hard { background: #faad14; }  
.difficulty-expert { background: #f5222d; }
.difficulty-unknown { background: #d9d9d9; }

.script-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.script-type {
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  color: #fff;
}

.type-mystery { background: #1890ff; }
.type-fun { background: #52c41a; }

.create-time {
  font-size: 24rpx;
  color: #999;
}

.script-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
}

.tag {
  font-size: 22rpx;
  color: #8b4513;
  background: rgba(139, 69, 19, 0.08);
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
}

.loading-state,
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 100rpx 0;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

.load-more {
  padding: 20rpx 0;
}
</style>
