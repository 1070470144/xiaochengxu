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
.filter-bar {
  background: white;
  border-bottom: 1rpx solid #f0f0f0;
}

.filter-scroll {
  white-space: nowrap;
  padding: 20rpx 0;
}

.filter-items {
  display: inline-flex;
  padding: 0 20rpx;
}

.filter-item {
  display: inline-block;
  padding: 12rpx 24rpx;
  margin-right: 20rpx;
  font-size: 28rpx;
  color: #666666;
  background-color: #f5f5f5;
  border-radius: 20rpx;
  white-space: nowrap;
}

.filter-item.active {
  background-color: #8B4513;
  color: white;
}

.create-btn-container {
  padding: 20rpx;
  background: white;
  border-bottom: 1rpx solid #f0f0f0;
}

.create-btn {
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 40rpx;
  font-size: 30rpx;
}

.carpool-list {
  padding: 20rpx;
}

.carpool-card {
  margin-bottom: 20rpx;
}

.carpool-header {
  margin-bottom: 16rpx;
}

.carpool-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  flex: 1;
  margin-right: 20rpx;
}

.status-badge {
  font-size: 24rpx;
  padding: 6rpx 12rpx;
  border-radius: 12rpx;
  color: white;
  font-weight: 500;
}

.status-recruiting { background-color: #52c41a; }
.status-full { background-color: #faad14; }
.status-confirmed { background-color: #1890ff; }
.status-finished { background-color: #d9d9d9; color: #666666 !important; }

.related-script {
  margin-bottom: 16rpx;
}

.script-info {
  font-size: 26rpx;
  color: #8B4513;
  background-color: rgba(139, 69, 19, 0.1);
  padding: 8rpx 12rpx;
  border-radius: 8rpx;
}

.carpool-info {
  margin-bottom: 16rpx;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-icon {
  font-size: 24rpx;
  width: 40rpx;
  flex-shrink: 0;
}

.info-text {
  font-size: 26rpx;
  color: #333333;
  flex: 1;
}

.progress-bar {
  width: 80rpx;
  height: 8rpx;
  background-color: #f0f0f0;
  border-radius: 4rpx;
  overflow: hidden;
  margin-left: 12rpx;
}

.progress-fill {
  height: 100%;
  background-color: #8B4513;
  border-radius: 4rpx;
  transition: width 0.3s ease;
}

.people-info {
  margin-bottom: 12rpx;
  font-size: 24rpx;
}

.people-label {
  color: #999999;
}

.people-name {
  color: #333333;
  margin-left: 8rpx;
}

.storyteller-name {
  color: #8B4513;
  font-weight: 500;
}

.user-level {
  color: #FF6B35;
  font-size: 20rpx;
  background-color: rgba(255, 107, 53, 0.1);
  padding: 2rpx 6rpx;
  border-radius: 6rpx;
  margin-left: 8rpx;
}

.carpool-desc {
  font-size: 26rpx;
  color: #666666;
  line-height: 1.4;
  margin-bottom: 12rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.carpool-tags {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 12rpx;
}

.tag {
  font-size: 22rpx;
  color: #8B4513;
  background-color: rgba(139, 69, 19, 0.1);
  padding: 4rpx 8rpx;
  border-radius: 8rpx;
  margin-right: 8rpx;
  margin-bottom: 8rpx;
}

.carpool-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 22rpx;
  color: #999999;
}

.room-number {
  color: #8B4513;
  font-weight: 500;
}

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
  margin-bottom: 20rpx;
}

.empty-text {
  color: #666666;
  font-size: 28rpx;
  margin-bottom: 8rpx;
}

.empty-subtitle {
  color: #999999;
  font-size: 24rpx;
}

.load-more {
  padding: 20rpx;
}
</style>
