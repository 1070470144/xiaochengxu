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
            :class="['filter-item', currentType === 'download' ? 'active' : '']"
            @click="changeType('download')">下载榜</text>
        </view>
      </scroll-view>
    </view>

    <!-- 剧本列表 -->
    <view class="container">
      <view v-if="loading && scriptList.length === 0" class="loading-state">
        <uni-load-more status="loading" :content-text="loadingText"></uni-load-more>
      </view>

      <view v-else-if="scriptList.length === 0" class="empty-state">
        <image class="empty-icon" src="/static/images/empty-script.png"></image>
        <text class="empty-text">暂无剧本数据</text>
      </view>

      <view v-else class="script-list">
        <view 
          v-for="script in scriptList" 
          :key="script._id" 
          class="script-card card"
          @click="goToDetail(script._id)">
          
          <view class="card-body">
            <!-- 剧本头部信息 -->
            <view class="script-header flex-between">
              <view class="script-basic">
                <text class="script-title">{{ script.title }}</text>
                <text v-if="script.subtitle" class="script-subtitle">{{ script.subtitle }}</text>
              </view>
              <view class="script-rating">
                <text class="rating-score">⭐{{ script.rating || '0.0' }}</text>
                <text class="rating-count">({{ script.rating_count || 0 }})</text>
              </view>
            </view>

            <!-- 剧本描述 -->
            <text class="script-desc">{{ script.description || '暂无描述' }}</text>

            <!-- 剧本meta信息 -->
            <view class="script-meta flex-between">
              <view class="meta-left">
                <text class="meta-item">👥{{ script.player_count || '未知' }}</text>
                <text class="meta-item">⏱️{{ script.duration ? script.duration + '分钟' : '未知' }}</text>
                <text class="meta-item difficulty" :class="getDifficultyClass(script.difficulty)">
                  {{ getDifficultyText(script.difficulty) }}
                </text>
              </view>
              <view class="meta-right">
                <text class="meta-item">👁️{{ script.view_count || 0 }}</text>
                <text class="meta-item">📥{{ script.download_count || 0 }}</text>
              </view>
            </view>

            <!-- 创建者信息 -->
            <view class="script-footer flex-between">
              <view class="creator-info">
                <text class="creator-text">
                  上传者：{{ script.creator ? script.creator.nickname : '未知' }}
                </text>
              </view>
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
      </view>

      <!-- 加载更多 -->
      <view v-if="scriptList.length > 0" class="load-more">
        <uni-load-more 
          :status="loadMoreStatus" 
          :content-text="loadMoreText"
          @clickLoadMore="loadMore">
        </uni-load-more>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'ScriptList',
  
  data() {
    return {
      scriptList: [],
      searchKeyword: '',
      currentType: 'all',
      loading: false,
      loadMoreStatus: 'more', // more, loading, noMore
      currentPage: 1,
      pageSize: 20,
      hasNext: true,
      loadingText: {
        contentdown: '上拉显示更多',
        contentrefresh: '正在加载...',
        contentnomore: '没有更多了'
      },
      loadMoreText: {
        contentdown: '上拉显示更多',
        contentrefresh: '正在加载...',
        contentnomore: '没有更多了'
      }
    }
  },

  onLoad() {
    console.log('剧本列表页面加载')
    this.loadScriptList()
  },

  onShow() {
    // 每次显示时刷新第一页数据
    this.refreshList()
  },

  onPullDownRefresh() {
    this.refreshList()
  },

  onReachBottom() {
    this.loadMore()
  },

  methods: {
    // 加载剧本列表
    async loadScriptList(isLoadMore = false) {
      if (this.loading) return
      
      this.loading = true
      
      if (!isLoadMore) {
        this.loadMoreStatus = 'loading'
      }

      try {
        const result = await uniCloud.callFunction({
          name: 'script-list',
          data: {
            page: this.currentPage,
            pageSize: this.pageSize,
            keyword: this.searchKeyword,
            type: this.currentType
          }
        })

        if (result.result.code === 0) {
          const { list, hasNext } = result.result.data
          
          if (isLoadMore) {
            this.scriptList = [...this.scriptList, ...list]
          } else {
            this.scriptList = list
          }
          
          this.hasNext = hasNext
          this.loadMoreStatus = hasNext ? 'more' : 'noMore'
        } else {
          throw new Error(result.result.message)
        }
        
      } catch (error) {
        console.error('加载剧本列表失败：', error)
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        })
        this.loadMoreStatus = 'more'
      } finally {
        this.loading = false
        uni.stopPullDownRefresh()
      }
    },

    // 刷新列表
    refreshList() {
      this.currentPage = 1
      this.hasNext = true
      this.loadScriptList()
    },

    // 加载更多
    loadMore() {
      if (!this.hasNext || this.loading) return
      
      this.currentPage++
      this.loadScriptList(true)
    },

    // 搜索处理
    handleSearch(keyword) {
      this.searchKeyword = keyword.value
      this.refreshList()
    },

    // 清除搜索
    handleClear() {
      this.searchKeyword = ''
      this.refreshList()
    },

    // 切换类型筛选
    changeType(type) {
      if (this.currentType === type) return
      
      this.currentType = type
      this.refreshList()
    },

    // 跳转到剧本详情
    goToDetail(id) {
      uni.navigateTo({
        url: `/pages/script/detail/detail?id=${id}`
      })
    },

    // 格式化时间
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

    // 获取难度等级样式
    getDifficultyClass(difficulty) {
      const classMap = {
        1: 'difficulty-easy',
        2: 'difficulty-normal', 
        3: 'difficulty-hard',
        4: 'difficulty-expert'
      }
      return classMap[difficulty] || 'difficulty-unknown'
    },

    // 获取难度等级文本
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
/* 搜索栏 - 统一间距 */
.search-bar {
  background: #FFFFFF;
  padding: 24rpx;
  border-bottom: 1px solid #E8E8E8;
}

/* 筛选栏 */
.filter-bar {
  background: #FFFFFF;
  border-bottom: 1px solid #E8E8E8;
}

.filter-scroll {
  white-space: nowrap;
  padding: 24rpx 0;
}

.filter-items {
  display: inline-flex;
  padding: 0 24rpx;
}

/* 筛选项 - 满足触摸区域 */
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

/* 剧本列表容器 */
.script-list {
  padding: 24rpx;
}

/* 剧本卡片 - 增强交互反馈 */
.script-card {
  margin-bottom: 24rpx;
  transition: all 0.3s ease;
  min-height: 180rpx;
}

.script-card:active {
  transform: scale(0.98);
  opacity: 0.95;
}

/* 剧本标题区域 */
.script-header {
  margin-bottom: 16rpx;
}

/* 剧本标题 - 次级标题规范 */
.script-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1A1A1A;
  line-height: 1.4;
}

/* 剧本副标题 */
.script-subtitle {
  display: block;
  font-size: 26rpx;
  font-weight: 400;
  color: #8B4513;
  margin-top: 8rpx;
  line-height: 1.5;
}

/* 评分区域 */
.script-rating {
  text-align: right;
  flex-shrink: 0;
  margin-left: 24rpx;
}

.rating-score {
  font-size: 28rpx;
  font-weight: 700;
  color: #FF6B35;
  line-height: 1.4;
}

.rating-count {
  font-size: 22rpx;
  font-weight: 400;
  color: #999999;
  margin-left: 8rpx;
  line-height: 1.4;
}

/* 剧本描述 */
.script-desc {
  font-size: 26rpx;
  font-weight: 400;
  color: #666666;
  line-height: 1.6;
  margin-bottom: 16rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 元信息区域 */
.script-meta {
  margin-bottom: 16rpx;
}

.meta-left {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx 8rpx;
}

.meta-right {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.meta-item {
  font-size: 24rpx;
  font-weight: 400;
  color: #999999;
  line-height: 1.4;
}

/* 难度标签 */
.difficulty {
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  color: #FFFFFF !important;
  font-weight: 700;
  font-size: 22rpx;
  line-height: 1;
}

/* Apple HIG辅助色系 */
.difficulty-easy { background-color: #52C41A; }
.difficulty-normal { background-color: #1890FF; }
.difficulty-hard { background-color: #FAAD14; }  
.difficulty-expert { background-color: #F5222D; }
.difficulty-unknown { background-color: #D9D9D9; }

/* 页脚信息 */
.script-footer {
  font-size: 24rpx;
  font-weight: 400;
  color: #999999;
  margin-bottom: 16rpx;
  line-height: 1.4;
}

/* 标签区域 */
.script-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
}

.tag {
  font-size: 22rpx;
  font-weight: 400;
  color: #8B4513;
  background-color: rgba(139, 69, 19, 0.08);
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  line-height: 1;
}

/* 加载状态 */
.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 400rpx;
}

.empty-icon {
  width: 120rpx;
  height: 120rpx;
  margin-bottom: 24rpx;
}

.empty-text {
  color: #999999;
  font-size: 28rpx;
  font-weight: 400;
  line-height: 1.5;
}

/* 加载更多区域 */
.load-more {
  padding: 24rpx;
}
</style>
