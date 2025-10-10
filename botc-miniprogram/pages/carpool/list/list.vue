<template>
  <view class="page">
    <!-- 筛选栏 -->
    <view class="filter-bar">
      <scroll-view scroll-x="true" class="filter-scroll">
        <view class="filter-items">
          <text 
            :class="['filter-item', currentType === 'all' ? 'active' : '']"
            @click="changeType('all')">全部</text>
          <text 
            :class="['filter-item', currentType === 'urgent' ? 'active' : '']"
            @click="changeType('urgent')">即将开始</text>
          <text 
            :class="['filter-item', currentType === 'recruiting' ? 'active' : '']"
            @click="changeType('recruiting')">招募中</text>
          <text 
            :class="['filter-item', currentType === 'today' ? 'active' : '']"
            @click="changeType('today')">今日</text>
        </view>
      </scroll-view>
    </view>

    <!-- 发起拼车按钮 -->
    <view class="create-btn-container">
      <button class="create-btn btn-primary" @click="goToCreate">
        <text>发起拼车</text>
      </button>
    </view>

    <!-- 拼车列表 -->
    <view class="container">
      <view v-if="loading && carpoolList.length === 0" class="loading-state">
        <uni-load-more status="loading" :content-text="loadingText"></uni-load-more>
      </view>

      <view v-else-if="carpoolList.length === 0" class="empty-state">
        <image class="empty-icon" src="/static/images/empty-carpool.png"></image>
        <text class="empty-text">暂无拼车信息</text>
        <text class="empty-subtitle">快来发起第一个拼车吧！</text>
      </view>

      <view v-else class="carpool-list">
        <view 
          v-for="room in carpoolList" 
          :key="room._id"
          class="carpool-card card"
          @click="goToDetail(room._id)">
          
          <view class="card-body">
            <!-- 拼车标题和状态 -->
            <view class="carpool-header flex-between">
              <text class="carpool-title">{{ room.title }}</text>
              <text class="status-badge" :class="getStatusClass(room.status)">
                {{ getStatusText(room.status) }}
              </text>
            </view>

            <!-- 关联剧本信息 -->
            <view v-if="room.script" class="related-script">
              <text class="script-info">🎭 {{ room.script.title }}</text>
            </view>

            <!-- 基础信息 -->
            <view class="carpool-info">
              <view class="info-row">
                <text class="info-icon">📍</text>
                <text class="info-text">{{ room.location }}</text>
              </view>
              <view class="info-row">
                <text class="info-icon">⏰</text>
                <text class="info-text">{{ formatGameTime(room.game_time) }}</text>
              </view>
              <view class="info-row">
                <text class="info-icon">👥</text>
                <text class="info-text">{{ room.current_players }}/{{ room.max_players }}人</text>
                <view class="progress-bar">
                  <view 
                    class="progress-fill" 
                    :style="{ width: getProgressWidth(room.current_players, room.max_players) }">
                  </view>
                </view>
              </view>
            </view>

            <!-- 发起人和说书人信息 -->
            <view class="people-info flex-between">
              <view class="host-info">
                <text class="people-label">发起人：</text>
                <text class="people-name">{{ room.host ? room.host.nickname : '未知' }}</text>
                <text v-if="room.host && room.host.level" class="user-level">Lv.{{ room.host.level }}</text>
              </view>
              <view v-if="room.storyteller" class="storyteller-info">
                <text class="people-label">说书人：</text>
                <text class="people-name storyteller-name">{{ room.storyteller.nickname }}</text>
              </view>
            </view>

            <!-- 描述 -->
            <text v-if="room.description" class="carpool-desc">{{ room.description }}</text>

            <!-- 标签 -->
            <view v-if="room.tags && room.tags.length > 0" class="carpool-tags">
              <text v-for="tag in room.tags.slice(0, 3)" :key="tag" class="tag">{{ tag }}</text>
            </view>

            <!-- 底部信息 -->
            <view class="carpool-footer">
              <text class="create-time">{{ formatTime(room.created_at) }}</text>
              <text class="room-number">房间号：{{ room.room_number }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view v-if="carpoolList.length > 0" class="load-more">
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
  name: 'CarpoolList',
  
  data() {
    return {
      carpoolList: [],
      currentType: 'all',
      loading: false,
      loadMoreStatus: 'more',
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
    console.log('拼车列表页面加载')
    this.loadCarpoolList()
  },

  onShow() {
    // 每次显示时刷新数据
    this.refreshList()
  },

  onPullDownRefresh() {
    this.refreshList()
  },

  onReachBottom() {
    this.loadMore()
  },

  methods: {
    // 加载拼车列表
    async loadCarpoolList(isLoadMore = false) {
      if (this.loading) return
      
      this.loading = true
      
      if (!isLoadMore) {
        this.loadMoreStatus = 'loading'
      }

      try {
        // 构建查询参数
        let queryParams = {
          page: this.currentPage,
          pageSize: this.pageSize,
          type: this.currentType
        }

        // 根据类型添加特定筛选
        if (this.currentType === 'recruiting') {
          queryParams.status = '1'
        } else if (this.currentType === 'today') {
          queryParams.dateFilter = 'today'
        }

        const result = await uniCloud.callFunction({
          name: 'carpool-list',
          data: queryParams
        })

        if (result.result.code === 0) {
          const { list, hasNext } = result.result.data
          
          if (isLoadMore) {
            this.carpoolList = [...this.carpoolList, ...list]
          } else {
            this.carpoolList = list
          }
          
          this.hasNext = hasNext
          this.loadMoreStatus = hasNext ? 'more' : 'noMore'
        } else {
          throw new Error(result.result.message)
        }
        
      } catch (error) {
        console.error('加载拼车列表失败：', error)
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
      this.loadCarpoolList()
    },

    // 加载更多
    loadMore() {
      if (!this.hasNext || this.loading) return
      
      this.currentPage++
      this.loadCarpoolList(true)
    },

    // 切换类型筛选
    changeType(type) {
      if (this.currentType === type) return
      
      this.currentType = type
      this.refreshList()
    },

    // 跳转到创建拼车
    goToCreate() {
      uni.navigateTo({
        url: '/pages/carpool/create/create'
      })
    },

    // 跳转到拼车详情
    goToDetail(id) {
      uni.navigateTo({
        url: `/pages/carpool/detail/detail?id=${id}`
      })
    },

    // 格式化游戏时间
    formatGameTime(timestamp) {
      if (!timestamp) return ''
      
      const date = new Date(timestamp)
      const now = new Date()
      const diff = date - now
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      
      const timeStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
      
      if (days === 0) {
        return `今天 ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
      } else if (days === 1) {
        return `明天 ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
      } else if (days > 0 && days < 7) {
        return `${days}天后 ${timeStr}`
      } else {
        return timeStr
      }
    },

    // 格式化创建时间
    formatTime(timestamp) {
      if (!timestamp) return ''
      
      const date = new Date(timestamp)
      const now = new Date()
      const diff = now - date
      const minutes = Math.floor(diff / (1000 * 60))
      
      if (minutes < 60) {
        return `${minutes}分钟前`
      } else if (minutes < 1440) {
        return `${Math.floor(minutes / 60)}小时前`
      } else {
        return `${Math.floor(minutes / 1440)}天前`
      }
    },

    // 获取进度条宽度
    getProgressWidth(current, max) {
      return `${Math.min((current / max) * 100, 100)}%`
    },

    // 获取状态样式
    getStatusClass(status) {
      const classMap = {
        1: 'status-recruiting', // 招募中
        2: 'status-full', // 已满员
        3: 'status-confirmed', // 已确认
        4: 'status-finished' // 已结束
      }
      return classMap[status] || 'status-default'
    },

    // 获取状态文本
    getStatusText(status) {
      const textMap = {
        1: '招募中',
        2: '已满员',
        3: '已确认',
        4: '已结束'
      }
      return textMap[status] || '未知'
    }
  }
}
</script>

<style scoped>
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

/* 筛选项 - Apple HIG触摸区域 */
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

/* 创建按钮容器 */
.create-btn-container {
  padding: 24rpx;
  background: #FFFFFF;
  border-bottom: 1px solid #E8E8E8;
}

/* 主要按钮 - Apple HIG规范 */
.create-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 12rpx;
  font-size: 30rpx;
  font-weight: 500;
  transition: opacity 0.2s ease;
}

.create-btn:active {
  opacity: 0.6;
}

/* 拼车列表容器 */
.carpool-list {
  padding: 24rpx;
}

/* 拼车卡片 - 增强交互反馈 */
.carpool-card {
  margin-bottom: 24rpx;
  transition: all 0.3s ease;
  min-height: 200rpx;
}

.carpool-card:active {
  transform: scale(0.98);
  opacity: 0.95;
}

/* 拼车标题区域 */
.carpool-header {
  margin-bottom: 16rpx;
}

/* 拼车标题 - 次级标题规范 */
.carpool-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1A1A1A;
  flex: 1;
  margin-right: 24rpx;
  line-height: 1.4;
}

/* 状态标签 */
.status-badge {
  font-size: 24rpx;
  font-weight: 500;
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  color: #FFFFFF;
  line-height: 1;
}

/* Apple HIG辅助色系 */
.status-recruiting { background-color: #52C41A; }
.status-full { background-color: #FAAD14; }
.status-confirmed { background-color: #1890FF; }
.status-finished { background-color: #D9D9D9; color: #666666 !important; }

/* 关联剧本 */
.related-script {
  margin-bottom: 16rpx;
}

.script-info {
  font-size: 26rpx;
  font-weight: 400;
  color: #8B4513;
  background-color: rgba(139, 69, 19, 0.08);
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  line-height: 1.5;
}

/* 拼车信息区域 */
.carpool-info {
  margin-bottom: 16rpx;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
  min-height: 40rpx;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-icon {
  font-size: 24rpx;
  width: 48rpx;
  flex-shrink: 0;
}

.info-text {
  font-size: 26rpx;
  font-weight: 400;
  color: #1A1A1A;
  flex: 1;
  line-height: 1.5;
}

/* 进度条 */
.progress-bar {
  width: 80rpx;
  height: 8rpx;
  background-color: #F0F0F0;
  border-radius: 4rpx;
  overflow: hidden;
  margin-left: 16rpx;
}

.progress-fill {
  height: 100%;
  background-color: #8B4513;
  border-radius: 4rpx;
  transition: width 0.3s ease;
}

/* 人员信息 */
.people-info {
  margin-bottom: 16rpx;
  font-size: 24rpx;
  line-height: 1.4;
}

.people-label {
  color: #999999;
  font-weight: 400;
}

.people-name {
  color: #1A1A1A;
  font-weight: 400;
  margin-left: 8rpx;
}

.storyteller-name {
  color: #8B4513;
  font-weight: 500;
}

/* 用户等级标签 */
.user-level {
  color: #FF6B35;
  font-size: 22rpx;
  font-weight: 500;
  background-color: rgba(255, 107, 53, 0.08);
  padding: 4rpx 8rpx;
  border-radius: 8rpx;
  margin-left: 8rpx;
  line-height: 1;
}

/* 拼车描述 */
.carpool-desc {
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

/* 标签区域 */
.carpool-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-bottom: 16rpx;
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

/* 页脚信息 */
.carpool-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 22rpx;
  font-weight: 400;
  color: #999999;
  line-height: 1.4;
}

.room-number {
  color: #8B4513;
  font-weight: 500;
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
  color: #666666;
  font-size: 28rpx;
  font-weight: 400;
  margin-bottom: 8rpx;
  line-height: 1.5;
}

.empty-subtitle {
  color: #999999;
  font-size: 24rpx;
  font-weight: 400;
  line-height: 1.4;
}

/* 加载更多区域 */
.load-more {
  padding: 24rpx;
}
</style>
