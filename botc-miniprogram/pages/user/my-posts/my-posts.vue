<template>
  <view class="my-posts-page">
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
      class="posts-scroll"
      scroll-y
      @scrolltolower="loadMore"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view class="posts-list">
        <view 
          v-for="post in postsList" 
          :key="post._id"
          class="post-item"
          @click="goToDetail(post._id)"
        >
          <view class="post-header">
            <view class="post-time">{{ formatTime(post.created_at) }}</view>
            <view class="post-status" :class="'status-' + post.status">
              {{ getStatusText(post.status) }}
            </view>
          </view>

          <view class="post-content">
            <text class="content-text">{{ post.content }}</text>
          </view>

          <view v-if="post.images && post.images.length > 0" class="post-images">
            <image
              v-for="(img, index) in post.images.slice(0, 3)"
              :key="index"
              class="post-image"
              :src="img"
              mode="aspectFill"
            />
          </view>

          <view class="post-stats">
            <text class="stat-item">👁️ {{ post.view_count || 0 }}</text>
            <text class="stat-item">❤️ {{ post.like_count || 0 }}</text>
            <text class="stat-item">💬 {{ post.comment_count || 0 }}</text>
          </view>
        </view>

        <view class="loading-status">
          <text v-if="loading">加载中...</text>
          <text v-else-if="!hasMore">没有更多了</text>
          <text v-else-if="postsList.length === 0">还没有发布帖子</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import Auth from '@/utils/auth.js'

export default {
  name: 'MyPosts',
  
  data() {
    return {
      tabs: [
        { label: '全部', value: 'all' },
        { label: '正常', value: 1 },
        { label: '审核中', value: 2 }
      ],
      currentTab: 'all',
      postsList: [],
      page: 1,
      pageSize: 10,
      loading: false,
      refreshing: false,
      hasMore: true
    }
  },
  
  onLoad() {
    this.loadPosts()
  },
  
  methods: {
    async loadPosts(loadMore = false) {
      if (this.loading) return
      
      this.loading = true
      
      try {
        const token = Auth.getToken()
        const userInfo = Auth.getUserInfo()
        
        const result = await uniCloud.callFunction({
          name: 'post-list',
          data: {
            page: this.page,
            pageSize: this.pageSize,
            userId: userInfo._id,
            status: this.currentTab === 'all' ? undefined : this.currentTab
          }
        })
        
        if (result.result.code === 0) {
          const newPosts = result.result.data.list
          
          if (loadMore) {
            this.postsList = [...this.postsList, ...newPosts]
          } else {
            this.postsList = newPosts
          }
          
          this.hasMore = result.result.data.hasMore
        }
        
      } catch (error) {
        console.error('加载帖子失败：', error)
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
      this.postsList = []
      this.loadPosts()
    },
    
    onRefresh() {
      this.refreshing = true
      this.page = 1
      this.hasMore = true
      this.loadPosts()
    },
    
    loadMore() {
      if (!this.hasMore || this.loading) return
      
      this.page++
      this.loadPosts(true)
    },
    
    goToDetail(postId) {
      uni.navigateTo({
        url: `/pages/community/detail/detail?id=${postId}`
      })
    },
    
    getStatusText(status) {
      const statusMap = {
        0: '已删除',
        1: '正常',
        2: '审核中',
        3: '已隐藏'
      }
      return statusMap[status] || '未知'
    },
    
    formatTime(timestamp) {
      if (!timestamp) return ''
      
      const date = new Date(timestamp)
      return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
    }
  }
}
</script>

<style scoped>
.my-posts-page {
  width: 100%;
  height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.tabs {
  background: #fff;
  display: flex;
  padding: 0 30rpx;
  border-bottom: 1px solid #eee;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 25rpx 0;
  font-size: 28rpx;
  color: #666;
  position: relative;
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

.posts-scroll {
  flex: 1;
  overflow-y: auto;
}

.posts-list {
  padding: 20rpx 0;
}

.post-item {
  background: #fff;
  margin: 0 20rpx 20rpx;
  padding: 25rpx;
  border-radius: 12rpx;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15rpx;
}

.post-time {
  font-size: 24rpx;
  color: #999;
}

.post-status {
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
  font-size: 22rpx;
}

.status-0 {
  background: #f0f0f0;
  color: #999;
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
  background: #ffebee;
  color: #f44336;
}

.post-content {
  margin-bottom: 15rpx;
}

.content-text {
  font-size: 28rpx;
  line-height: 1.6;
  color: #333;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-images {
  display: flex;
  gap: 10rpx;
  margin-bottom: 15rpx;
}

.post-image {
  width: 150rpx;
  height: 150rpx;
  border-radius: 8rpx;
}

.post-stats {
  display: flex;
  gap: 30rpx;
  padding-top: 15rpx;
  border-top: 1px solid #f0f0f0;
}

.stat-item {
  font-size: 24rpx;
  color: #999;
}

.loading-status {
  text-align: center;
  padding: 30rpx 0;
  color: #999;
  font-size: 26rpx;
}
</style>

