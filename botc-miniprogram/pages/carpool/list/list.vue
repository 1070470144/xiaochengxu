<template>
  <view class="page">
    <!-- 顶部栏 - 整合筛选和创建 -->
    <view class="top-bar">
      <!-- 筛选区域 - 不折叠 -->
      <view class="filter-container">
        <view class="filter-items">
          <view 
            :class="['filter-chip', currentType === 'all' ? 'active' : '']"
            @click="changeType('all')">
            <text class="filter-text">全部</text>
          </view>
          <view 
            :class="['filter-chip', currentType === 'urgent' ? 'active' : '']"
            @click="changeType('urgent')">
            <text class="filter-icon">🔥</text>
            <text class="filter-text">即将开始</text>
          </view>
          <view 
            :class="['filter-chip', currentType === 'recruiting' ? 'active' : '']"
            @click="changeType('recruiting')">
            <text class="filter-icon">👥</text>
            <text class="filter-text">招募中</text>
          </view>
          <view 
            :class="['filter-chip', currentType === 'today' ? 'active' : '']"
            @click="changeType('today')">
            <text class="filter-icon">📅</text>
            <text class="filter-text">今日</text>
          </view>
        </view>
      </view>
      
      <!-- 创建按钮 -->
      <view class="create-btn-wrapper">
        <view class="create-btn" @click="goToCreate">
          <text class="create-icon">+</text>
        </view>
      </view>
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
          class="carpool-card"
          @click="goToDetail(room._id)">
          
          <!-- 卡片头部 - 状态标签 -->
          <view class="card-status-bar" :class="getStatusClass(room.status)">
            <text class="status-text">{{ getStatusText(room.status) }}</text>
            <text v-if="room.status === 1" class="status-icon">●</text>
          </view>
          
          <!-- 卡片内容 -->
          <view class="card-content">
            <!-- 标题区域 -->
            <view class="title-section">
              <text class="carpool-title">{{ room.title }}</text>
              <text class="room-number">#{{ room.room_number }}</text>
            </view>

            <!-- 关联剧本信息 -->
            <view v-if="room.script" class="script-tag">
              <text class="script-icon">🎭</text>
              <text class="script-name">{{ room.script.title }}</text>
            </view>

            <!-- 核心信息网格 -->
            <view class="info-grid">
              <!-- 时间 -->
              <view class="info-item time-item">
                <text class="info-icon">⏰</text>
                <view class="info-content">
                  <text class="info-label">开始时间</text>
                  <text class="info-value">{{ formatGameTime(room.game_time) }}</text>
                </view>
              </view>
              
              <!-- 地点 -->
              <view class="info-item location-item">
                <text class="info-icon">📍</text>
                <view class="info-content">
                  <text class="info-label">活动地点</text>
                  <text class="info-value">{{ room.location }}</text>
                </view>
              </view>
            </view>

            <!-- 人数进度条 -->
            <view class="players-section">
              <view class="players-header">
                <text class="players-icon">👥</text>
                <text class="players-count">{{ room.current_players }}/{{ room.max_players }}人</text>
                <text class="players-status" :class="room.current_players === room.max_players ? 'full' : ''">
                  {{ room.current_players === room.max_players ? '已满员' : `还差${room.max_players - room.current_players}人` }}
                </text>
              </view>
              <view class="players-progress">
                <view class="progress-track">
                  <view 
                    class="progress-bar-fill" 
                    :class="room.current_players === room.max_players ? 'full' : ''"
                    :style="{ width: getProgressWidth(room.current_players, room.max_players) }">
                  </view>
                </view>
              </view>
            </view>

            <!-- 人员信息 -->
            <view class="people-section">
              <view class="person-item">
                <text class="person-role">发起人</text>
                <text class="person-name">{{ room.host ? room.host.nickname : '未知' }}</text>
                <text v-if="room.host && room.host.level" class="level-badge">Lv{{ room.host.level }}</text>
              </view>
              <view v-if="room.storyteller" class="person-item storyteller">
                <text class="person-role">说书人</text>
                <text class="person-name">{{ room.storyteller.nickname }}</text>
              </view>
            </view>

            <!-- 描述 -->
            <text v-if="room.description" class="description">{{ room.description }}</text>

            <!-- 底部标签和时间 -->
            <view class="card-footer">
              <!-- 标签 -->
              <view v-if="room.tags && room.tags.length > 0" class="tags-row">
                <text v-for="tag in room.tags.slice(0, 3)" :key="tag" class="tag-item">
                  {{ tag }}
                </text>
              </view>
              <text class="create-time">{{ formatTime(room.created_at) }}</text>
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
    // 初始化 Carpool 云对象
    this.carpoolObj = uniCloud.importObject('carpool', {
      customUI: true
    })
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

        const result = await this.carpoolObj.getList(queryParams)

        if (result.code === 0) {
          const { list, hasNext } = result.data
          
          if (isLoadMore) {
            this.carpoolList = [...this.carpoolList, ...list]
          } else {
            this.carpoolList = list
          }
          
          this.hasNext = hasNext
          this.loadMoreStatus = hasNext ? 'more' : 'noMore'
        } else {
          throw new Error(result.message)
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
/* 页面背景 - 温暖的米色调 */
.page {
  background: #FAF9F7;
  min-height: 100vh;
}

/* 顶部栏 - 整合筛选和创建按钮 */
.top-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(139, 69, 19, 0.08);
}

/* 筛选容器 - 不折叠 */
.filter-container {
  flex: 1;
  overflow: visible;
}

.filter-items {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

/* 筛选芯片 - 柔和配色 */
.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6rpx;
  padding: 12rpx 16rpx;
  background: #F5F0EB;
  border-radius: 16rpx;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  border: 2rpx solid transparent;
}

.filter-chip.active {
  background: linear-gradient(135deg, #A0785A 0%, #8B6F47 100%);
  box-shadow: 0 4rpx 16rpx rgba(160, 120, 90, 0.25);
  border-color: rgba(160, 120, 90, 0.2);
}

.filter-icon {
  font-size: 24rpx;
  line-height: 1;
}

.filter-text {
  font-size: 26rpx;
  font-weight: 500;
  color: #6B5744;
  line-height: 1;
}

.filter-chip.active .filter-text,
.filter-chip.active .filter-icon {
  color: #FFFFFF;
}

/* 创建按钮包装器 */
.create-btn-wrapper {
  margin-left: 16rpx;
}

/* 创建按钮 - 柔和配色 */
.create-btn {
  width: 88rpx;
  height: 88rpx;
  background: linear-gradient(135deg, #A0785A 0%, #8B6F47 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6rpx 20rpx rgba(160, 120, 90, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.create-btn:active {
  transform: scale(0.92);
  box-shadow: 0 4rpx 12rpx rgba(160, 120, 90, 0.25);
}

.create-icon {
  font-size: 48rpx;
  font-weight: 300;
  color: #FFFFFF;
  line-height: 1;
}

/* 拼车列表容器 */
.carpool-list {
  padding: 24rpx;
}

/* 拼车卡片 - 柔和卡片设计 */
.carpool-card {
  background: #FFFFFF;
  border-radius: 20rpx;
  margin-bottom: 24rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(139, 99, 71, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1rpx solid rgba(139, 99, 71, 0.06);
}

.carpool-card:active {
  transform: translateY(2rpx);
  box-shadow: 0 2rpx 12rpx rgba(139, 99, 71, 0.12);
}

/* 卡片状态栏 - 顶部彩色条 - 柔和配色 */
.card-status-bar {
  height: 8rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 24rpx;
  font-size: 24rpx;
  font-weight: 600;
  letter-spacing: 0.5rpx;
}

.card-status-bar.status-recruiting {
  background: linear-gradient(90deg, #7FB069 0%, #8BC34A 100%);
}

.card-status-bar.status-full {
  background: linear-gradient(90deg, #E8B861 0%, #F4C542 100%);
}

.card-status-bar.status-confirmed {
  background: linear-gradient(90deg, #5DADE2 0%, #7FC8F8 100%);
}

.card-status-bar.status-finished {
  background: linear-gradient(90deg, #C8B8A8 0%, #D8CABD 100%);
}

.status-text {
  color: #FFFFFF;
  font-size: 22rpx;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1rpx;
}

.status-icon {
  color: #FFFFFF;
  font-size: 16rpx;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* 卡片内容区 */
.card-content {
  padding: 24rpx;
}

/* 标题区域 */
.title-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.carpool-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1A1A1A;
  flex: 1;
  line-height: 1.3;
  margin-right: 16rpx;
}

.room-number {
  font-size: 22rpx;
  font-weight: 600;
  color: #A0785A;
  background: #F5F0EB;
  padding: 6rpx 12rpx;
  border-radius: 12rpx;
  letter-spacing: 0.5rpx;
}

/* 剧本标签 */
.script-tag {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  background: linear-gradient(135deg, #F9F5F0 0%, #F5F0EB 100%);
  padding: 12rpx 16rpx;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  border: 1rpx solid rgba(160, 120, 90, 0.15);
}

.script-icon {
  font-size: 28rpx;
  line-height: 1;
}

.script-name {
  font-size: 26rpx;
  font-weight: 500;
  color: #8B6F47;
  line-height: 1;
}

/* 信息网格 */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  background: #FAF8F5;
  padding: 16rpx;
  border-radius: 12rpx;
  border: 1rpx solid rgba(160, 120, 90, 0.08);
}

.info-icon {
  font-size: 28rpx;
  line-height: 1;
  margin-top: 2rpx;
}

.info-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.info-label {
  font-size: 22rpx;
  font-weight: 400;
  color: #8C8C8C;
  line-height: 1;
}

.info-value {
  font-size: 26rpx;
  font-weight: 500;
  color: #1A1A1A;
  line-height: 1.3;
}

/* 人数区域 - 柔和配色 */
.players-section {
  background: linear-gradient(135deg, #F9F7F4 0%, #F5F2EE 100%);
  padding: 16rpx;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  border: 1rpx solid rgba(160, 120, 90, 0.1);
}

.players-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 12rpx;
}

.players-icon {
  font-size: 28rpx;
  line-height: 1;
}

.players-count {
  font-size: 30rpx;
  font-weight: 700;
  color: #5D4E37;
  line-height: 1;
}

.players-status {
  font-size: 22rpx;
  font-weight: 500;
  color: #7FB069;
  background: rgba(127, 176, 105, 0.12);
  padding: 6rpx 12rpx;
  border-radius: 8rpx;
  line-height: 1;
  margin-left: auto;
}

.players-status.full {
  color: #E8B861;
  background: rgba(232, 184, 97, 0.12);
}

.players-progress {
  margin-top: 12rpx;
}

.progress-track {
  height: 10rpx;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8rpx;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #A0785A 0%, #8B6F47 100%);
  border-radius: 8rpx;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-bar-fill.full {
  background: linear-gradient(90deg, #E8B861 0%, #D4A856 100%);
}

/* 人员区域 */
.people-section {
  display: flex;
  gap: 24rpx;
  margin-bottom: 20rpx;
}

.person-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8rpx;
  background: #FAF8F5;
  padding: 12rpx 16rpx;
  border-radius: 12rpx;
  border: 2rpx solid #F0EBE6;
}

.person-item.storyteller {
  background: linear-gradient(135deg, rgba(160, 120, 90, 0.08) 0%, rgba(160, 120, 90, 0.12) 100%);
  border-color: rgba(160, 120, 90, 0.2);
}

.person-role {
  font-size: 22rpx;
  font-weight: 400;
  color: #8C8C8C;
  line-height: 1;
}

.person-name {
  font-size: 24rpx;
  font-weight: 600;
  color: #1A1A1A;
  line-height: 1;
}

.person-item.storyteller .person-name {
  color: #8B6F47;
}

.level-badge {
  font-size: 20rpx;
  font-weight: 600;
  color: #D4A86A;
  background: rgba(212, 168, 106, 0.15);
  padding: 4rpx 8rpx;
  border-radius: 6rpx;
  line-height: 1;
  margin-left: auto;
}

/* 描述 */
.description {
  font-size: 26rpx;
  font-weight: 400;
  color: #595959;
  line-height: 1.6;
  margin-bottom: 20rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 底部区域 */
.card-footer {
  padding-top: 16rpx;
  border-top: 1rpx solid #F0F0F0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 标签行 */
.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  flex: 1;
}

.tag-item {
  font-size: 22rpx;
  font-weight: 500;
  color: #8B6F47;
  background: #F5F0EB;
  padding: 6rpx 12rpx;
  border-radius: 8rpx;
  line-height: 1;
}

.create-time {
  font-size: 22rpx;
  font-weight: 400;
  color: #BFBFBF;
  line-height: 1;
  white-space: nowrap;
  margin-left: 16rpx;
}

/* 加载和空状态 */
.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 100rpx 40rpx;
  background: #FFFFFF;
  border-radius: 20rpx;
  margin: 24rpx;
}

.empty-icon {
  width: 160rpx;
  height: 160rpx;
  margin-bottom: 32rpx;
  opacity: 0.6;
}

.empty-text {
  color: #595959;
  font-size: 30rpx;
  font-weight: 500;
  margin-bottom: 12rpx;
  line-height: 1.4;
}

.empty-subtitle {
  color: #BFBFBF;
  font-size: 26rpx;
  font-weight: 400;
  line-height: 1.5;
}

/* 加载更多区域 */
.load-more {
  padding: 32rpx 24rpx;
}
</style>
