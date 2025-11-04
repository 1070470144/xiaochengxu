<template>
  <view class="my-carpool-page">
    <view class="tabs">
      <view 
        v-for="tab in tabs" 
        :key="tab.value"
        class="tab-item"
        :class="{ active: currentTab === tab.value }"
        @click="switchTab(tab.value)"
      >
        {{ tab.label }}
      </view>
    </view>

    <scroll-view 
      class="carpool-scroll"
      scroll-y
      @scrolltolower="loadMore"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view class="carpool-list">
        <view 
          v-for="room in carpoolList" 
          :key="room._id"
          class="carpool-card"
          @click="goToDetail(room._id)"
        >
          <view class="card-header">
            <view class="room-title">{{ room.title }}</view>
            <view class="room-status" :class="'status-' + room.status">
              {{ getStatusText(room.status) }}
            </view>
          </view>

          <view class="card-info">
            <view class="info-item">
              <text class="info-label">时间：</text>
              <text class="info-value">{{ formatDate(room.game_time) }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">地点：</text>
              <text class="info-value">{{ room.location }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">人数：</text>
              <text class="info-value">{{ room.current_players }}/{{ room.max_players }}</text>
            </view>
          </view>

          <view class="card-footer">
            <text class="create-time">创建于 {{ formatTime(room.created_at) }}</text>
            <view class="action-btns">
              <button class="btn-manage" size="mini" @click.stop="manageRoom(room)">管理</button>
            </view>
          </view>
        </view>

        <view class="loading-status">
          <text v-if="loading">加载中...</text>
          <text v-else-if="!hasMore">没有更多了</text>
          <text v-else-if="carpoolList.length === 0">还没有创建拼车</text>
        </view>
      </view>
    </scroll-view>

    <!-- 创建拼车按钮 -->
    <view class="fab-button" @click="createCarpool">
      <uni-icons type="plusempty" size="30" color="#fff" />
    </view>
  </view>
</template>

<script>
import Auth from '@/utils/auth.js'

export default {
  name: 'MyCarpool',
  
  data() {
    return {
      tabs: [
        { label: '全部', value: 'all' },
        { label: '招募中', value: 1 },
        { label: '已满员', value: 2 },
        { label: '进行中', value: 3 },
        { label: '已结束', value: 4 }
      ],
      currentTab: 'all',
      carpoolList: [],
      page: 1,
      pageSize: 10,
      loading: false,
      refreshing: false,
      hasMore: true
    }
  },
  
  onLoad() {
    // 初始化 carpool 云对象
    this.carpoolObj = uniCloud.importObject('carpool', {
      customUI: true
    })
    this.loadCarpool()
  },
  
  onShow() {
    // 从创建/管理页面返回时刷新
    if (this.needRefresh) {
      this.onRefresh()
      this.needRefresh = false
    }
  },
  
  methods: {
    async loadCarpool(loadMore = false) {
      if (this.loading) return
      
      this.loading = true
      
      try {
        const userInfo = Auth.getUserInfo()
        
        const result = await this.carpoolObj.getList({
          page: this.page,
          pageSize: this.pageSize,
          hostId: userInfo._id,
          status: this.currentTab === 'all' ? undefined : this.currentTab
        })
        
        if (result.code === 0) {
          const newRooms = result.data.list
          
          if (loadMore) {
            this.carpoolList = [...this.carpoolList, ...newRooms]
          } else {
            this.carpoolList = newRooms
          }
          
          this.hasMore = result.data.hasNext
        }
        
      } catch (error) {
        console.error('加载拼车失败：', error)
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
        this.refreshing = false
      }
    },
    
    switchTab(tab) {
      if (this.currentTab === tab) return
      
      this.currentTab = tab
      this.page = 1
      this.hasMore = true
      this.carpoolList = []
      this.loadCarpool()
    },
    
    onRefresh() {
      this.refreshing = true
      this.page = 1
      this.hasMore = true
      this.loadCarpool()
    },
    
    loadMore() {
      if (!this.hasMore || this.loading) return
      
      this.page++
      this.loadCarpool(true)
    },
    
    goToDetail(roomId) {
      uni.navigateTo({
        url: `/pages/carpool/detail/detail?id=${roomId}`
      })
    },
    
    createCarpool() {
      uni.navigateTo({
        url: '/pages/carpool/create/create',
        events: {
          createSuccess: () => {
            this.needRefresh = true
          }
        }
      })
    },
    
    manageRoom(room) {
      uni.showActionSheet({
        itemList: ['查看详情', '修改信息', '结束拼车'],
        success: (res) => {
          if (res.tapIndex === 0) {
            this.goToDetail(room._id)
          } else if (res.tapIndex === 1) {
            // TODO: 跳转到编辑页面
            uni.showToast({
              title: '编辑功能开发中',
              icon: 'none'
            })
          } else if (res.tapIndex === 2) {
            this.endCarpool(room._id)
          }
        }
      })
    },
    
    async endCarpool(roomId) {
      uni.showModal({
        title: '确认结束',
        content: '确定要结束这个拼车吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await this.carpoolObj.updateStatus(
                roomId,
                4 // 已结束状态
              )
              
              if (result.code === 0) {
                uni.showToast({
                  title: '已结束',
                  icon: 'success'
                })
                this.onRefresh()
              }
            } catch (error) {
              console.error('结束拼车失败：', error)
              uni.showToast({
                title: '操作失败',
                icon: 'none'
              })
            }
          }
        }
      })
    },
    
    getStatusText(status) {
      const statusMap = {
        1: '招募中',
        2: '已满员',
        3: '进行中',
        4: '已结束',
        5: '已取消'
      }
      return statusMap[status] || '未知'
    },
    
    formatDate(timestamp) {
      if (!timestamp) return ''
      
      const date = new Date(timestamp)
      return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
    },
    
    formatTime(timestamp) {
      if (!timestamp) return ''
      
      const date = new Date(timestamp)
      return `${date.getMonth() + 1}-${date.getDate()}`
    }
  }
}
</script>

<style scoped>
.my-carpool-page {
  width: 100%;
  height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.tabs {
  background: #fff;
  display: flex;
  padding: 0 20rpx;
  border-bottom: 1px solid #eee;
  overflow-x: auto;
  white-space: nowrap;
}

.tab-item {
  padding: 25rpx 20rpx;
  font-size: 28rpx;
  color: #666;
  position: relative;
  flex-shrink: 0;
}

.tab-item.active {
  color: #8B4513;
  font-weight: bold;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60rpx;
  height: 4rpx;
  background: #8B4513;
  border-radius: 2rpx;
}

.carpool-scroll {
  flex: 1;
  overflow-y: auto;
}

.carpool-list {
  padding: 20rpx;
}

.carpool-card {
  background: #fff;
  margin-bottom: 20rpx;
  padding: 25rpx;
  border-radius: 12rpx;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15rpx;
}

.room-title {
  flex: 1;
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.room-status {
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
  font-size: 22rpx;
  margin-left: 10rpx;
}

.status-1 {
  background: #e8f5e9;
  color: #4caf50;
}

.status-2 {
  background: #fff3e0;
  color: #ff9800;
}

.status-3 {
  background: #e3f2fd;
  color: #2196f3;
}

.status-4 {
  background: #f0f0f0;
  color: #999;
}

.status-5 {
  background: #ffebee;
  color: #f44336;
}

.card-info {
  margin-bottom: 15rpx;
}

.info-item {
  display: flex;
  padding: 8rpx 0;
  font-size: 26rpx;
}

.info-label {
  color: #999;
  width: 100rpx;
}

.info-value {
  flex: 1;
  color: #333;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15rpx;
  border-top: 1px solid #f0f0f0;
}

.create-time {
  font-size: 24rpx;
  color: #999;
}

.btn-manage {
  background: #8B4513;
  color: #fff;
  border: none;
}

.loading-status {
  text-align: center;
  padding: 30rpx 0;
  color: #999;
  font-size: 26rpx;
}

.fab-button {
  position: fixed;
  right: 40rpx;
  bottom: 100rpx;
  width: 100rpx;
  height: 100rpx;
  background: linear-gradient(135deg, #A0522D 0%, #8B4513 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 20rpx rgba(139, 69, 19, 0.4);
}
</style>

