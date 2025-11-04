<template>
  <view class="page">
    <!-- 空状态 -->
    <view v-if="!loading && appliedList.length === 0" class="empty-state">
      <view class="empty-icon">📋</view>
      <text class="empty-text">暂无报名记录</text>
      <text class="empty-hint">快去参加拼车活动吧~</text>
      <button class="go-carpool-btn" @click="goToCarpool">去拼车</button>
    </view>

    <!-- 报名列表 -->
    <view v-else class="carpool-list">
      <view 
        v-for="item in appliedList" 
        :key="item.application_id"
        class="carpool-card"
        @click="goToCarpoolDetail(item.carpool_id)"
      >
        <!-- 状态标签 -->
        <view class="status-badge" :class="getStatusClass(item.status)">
          {{ getStatusText(item.status) }}
        </view>

        <!-- 拼车信息 -->
        <view class="carpool-info">
          <text class="carpool-title">{{ item.carpool.title }}</text>
          
          <view class="info-row">
            <text class="info-icon">📅</text>
            <text class="info-text">{{ formatTime(item.carpool.game_time) }}</text>
          </view>
          
          <view class="info-row">
            <text class="info-icon">📍</text>
            <text class="info-text">{{ item.carpool.location }}</text>
          </view>
          
          <view class="info-row">
            <text class="info-icon">👥</text>
            <text class="info-text">{{ item.carpool.current_count }}/{{ item.carpool.max_count }}人</text>
          </view>
        </view>

        <!-- 发起者信息 -->
        <view class="host-info">
          <image class="host-avatar" :src="item.host.avatar || '/static/logo.png'" mode="aspectFill"></image>
          <view class="host-details">
            <text class="host-label">发起者</text>
            <text class="host-name">{{ item.host.nickname }}</text>
          </view>
        </view>

        <!-- 报名时间 -->
        <view class="apply-time">
          <text>报名时间：{{ formatTime(item.created_at) }}</text>
        </view>

        <!-- 操作按钮 -->
        <view class="action-bar">
          <button 
            v-if="item.status === 1 || item.status === 2"
            class="cancel-btn"
            @click.stop="cancelApply(item)"
          >
            取消报名
          </button>
          <button 
            v-if="item.status === 2 && item.carpool.status === 1"
            class="contact-btn"
            @click.stop="contactHost(item)"
          >
            联系发起者
          </button>
        </view>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-state">
      <uni-load-more status="loading" />
    </view>

    <!-- 加载更多 -->
    <view v-if="!loading && hasMore && appliedList.length > 0" class="load-more">
      <button class="load-more-btn" @click="loadMore">加载更多</button>
    </view>
  </view>
</template>

<script>
import Auth from '@/utils/auth.js'

export default {
  name: 'AppliedCarpool',
  
  data() {
    return {
      appliedList: [],
      loading: false,
      page: 1,
      pageSize: 10,
      hasMore: true
    }
  },
  
  onLoad() {
    // 初始化 carpool 云对象
    this.carpoolObj = uniCloud.importObject('carpool', {
      customUI: true
    })
    this.checkLoginAndLoad()
  },
  
  onPullDownRefresh() {
    this.refreshList()
  },
  
  methods: {
    // 检查登录并加载数据
    checkLoginAndLoad() {
      if (!Auth.isLogin()) {
        Auth.toLogin()
        return
      }
      this.loadAppliedList()
    },
    
    // 加载报名列表
    async loadAppliedList(isLoadMore = false) {
      if (this.loading) return
      
      this.loading = true
      
      try {
        const result = await this.carpoolObj.getMyApplications(
          this.page,
          this.pageSize
        )
        
        if (result.code === 0) {
          const newList = result.data.list || []
          
          if (isLoadMore) {
            this.appliedList = [...this.appliedList, ...newList]
          } else {
            this.appliedList = newList
          }
          
          this.hasMore = newList.length >= this.pageSize
        } else {
          throw new Error(result.message)
        }
      } catch (error) {
        console.error('加载报名列表失败：', error)
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
      this.hasMore = true
      this.loadAppliedList(false)
    },
    
    // 加载更多
    loadMore() {
      if (!this.hasMore || this.loading) return
      
      this.page++
      this.loadAppliedList(true)
    },
    
    // 取消报名
    cancelApply(item) {
      uni.showModal({
        title: '确认取消',
        content: '确定要取消这个拼车的报名吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              uni.showLoading({ title: '取消中...' })
              
              const result = await this.carpoolObj.cancelApply(item.carpool_id)
              
              uni.hideLoading()
              
              if (result.code === 0) {
                uni.showToast({
                  title: '已取消报名',
                  icon: 'success'
                })
                
                // 刷新列表
                this.refreshList()
              } else {
                throw new Error(result.result.message)
              }
            } catch (error) {
              uni.hideLoading()
              console.error('取消报名失败：', error)
              uni.showToast({
                title: error.message || '取消失败',
                icon: 'none'
              })
            }
          }
        }
      })
    },
    
    // 联系发起者
    contactHost(item) {
      // 跳转到私聊页面
      const carpool = item.carpool || {}
      const hostId = carpool.host_id || item.host._id
      
      if (hostId) {
        uni.navigateTo({
          url: `/pages/chat/detail/detail?user_id=${hostId}`
        })
      } else {
        uni.showToast({
          title: '无法获取发起者信息',
          icon: 'none'
        })
      }
    },
    
    // 跳转到拼车详情
    goToCarpoolDetail(carpoolId) {
      uni.navigateTo({
        url: `/pages/carpool/detail/detail?id=${carpoolId}`
      })
    },
    
    // 跳转到拼车列表
    goToCarpool() {
      uni.switchTab({
        url: '/pages/carpool/list/list'
      })
    },
    
    // 获取状态文字
    getStatusText(status) {
      const statusMap = {
        1: '待审核',
        2: '已通过',
        3: '已拒绝'
      }
      return statusMap[status] || '未知'
    },
    
    // 获取状态样式类
    getStatusClass(status) {
      const classMap = {
        1: 'status-pending',
        2: 'status-approved',
        3: 'status-rejected'
      }
      return classMap[status] || ''
    },
    
    // 格式化时间
    formatTime(timestamp) {
      if (!timestamp) return ''
      
      const date = new Date(timestamp)
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      const hour = date.getHours().toString().padStart(2, '0')
      const minute = date.getMinutes().toString().padStart(2, '0')
      
      return `${year}-${month}-${day} ${hour}:${minute}`
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 60rpx;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #666;
  margin-bottom: 20rpx;
}

.empty-hint {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 40rpx;
}

.go-carpool-btn {
  width: 300rpx;
  height: 80rpx;
  line-height: 80rpx;
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
  color: white;
  border: none;
  border-radius: 40rpx;
  font-size: 28rpx;
}

/* 拼车列表 */
.carpool-list {
  /* 无需额外样式 */
}

.carpool-card {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
  position: relative;
}

/* 状态标签 */
.status-badge {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  font-weight: bold;
}

.status-pending {
  background: #fff7e6;
  color: #faad14;
}

.status-approved {
  background: #f6ffed;
  color: #52c41a;
}

.status-rejected {
  background: #fff1f0;
  color: #ff4d4f;
}

/* 拼车信息 */
.carpool-info {
  margin-bottom: 20rpx;
}

.carpool-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 15rpx;
  padding-right: 120rpx;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 10rpx;
}

.info-icon {
  font-size: 28rpx;
  margin-right: 10rpx;
}

.info-text {
  font-size: 26rpx;
  color: #666;
}

/* 发起者信息 */
.host-info {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  margin-bottom: 15rpx;
}

.host-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  margin-right: 15rpx;
}

.host-details {
  display: flex;
  flex-direction: column;
}

.host-label {
  font-size: 22rpx;
  color: #999;
  margin-bottom: 4rpx;
}

.host-name {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
}

/* 报名时间 */
.apply-time {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 20rpx;
}

/* 操作按钮 */
.action-bar {
  display: flex;
  gap: 15rpx;
}

.cancel-btn,
.contact-btn {
  flex: 1;
  height: 70rpx;
  line-height: 70rpx;
  border-radius: 12rpx;
  font-size: 26rpx;
  border: none;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.contact-btn {
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
  color: white;
}

/* 加载状态 */
.loading-state {
  padding: 40rpx 0;
  text-align: center;
}

.load-more {
  padding: 20rpx 0;
  text-align: center;
}

.load-more-btn {
  width: 300rpx;
  height: 70rpx;
  line-height: 70rpx;
  background: white;
  color: #666;
  border: 1rpx solid #e8e8e8;
  border-radius: 35rpx;
  font-size: 26rpx;
}
</style>

