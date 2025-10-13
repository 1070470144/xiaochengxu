<template>
  <view class="community-page">
    <!-- 顶部tab切换 -->
    <view class="tabs-container">
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

    <!-- 帖子列表 -->
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
          <!-- 用户信息 -->
          <view class="post-header">
            <image 
              class="avatar clickable" 
              :src="post.user?.avatar || '/static/default-avatar.png'"
              mode="aspectFill"
              @click.stop="handleUserClick(post.user_id, post.user)"
            />
            <view class="user-info" @click.stop="handleUserClick(post.user_id, post.user)">
              <view class="nickname clickable">{{ post.user?.nickname || '匿名用户' }}</view>
              <view class="time">{{ formatTime(post.created_at) }}</view>
            </view>
            <view v-if="post.is_top" class="top-tag">置顶</view>
            <view v-if="post.is_hot" class="hot-tag">热门</view>
          </view>

          <!-- 帖子内容 -->
          <view class="post-content">
            <text class="content-text">{{ post.content }}</text>
          </view>

          <!-- 图片 -->
          <view v-if="post.images && post.images.length > 0" class="post-images">
            <view 
              class="image-grid"
              :class="`grid-${post.images.length > 3 ? '3' : post.images.length}`"
            >
              <image
                v-for="(img, index) in post.images.slice(0, 9)"
                :key="index"
                class="post-image"
                :src="img"
                mode="aspectFill"
                @click.stop="previewImage(post.images, index)"
              />
            </view>
          </view>

          <!-- 标签 -->
          <view v-if="post.tags && post.tags.length > 0" class="tags">
            <text 
              v-for="tag in post.tags" 
              :key="tag"
              class="tag"
            >
              #{{ tag }}
            </text>
          </view>

          <!-- 底部操作栏 -->
          <view class="post-footer">
            <view class="action-item">
              <uni-icons type="eye" size="18" color="#999" />
              <text>{{ post.view_count || 0 }}</text>
            </view>
            <view class="action-item">
              <uni-icons type="chat" size="18" color="#999" />
              <text>{{ post.comment_count || 0 }}</text>
            </view>
            <view class="action-item">
              <uni-icons type="heart" size="18" color="#999" />
              <text>{{ post.like_count || 0 }}</text>
            </view>
          </view>
        </view>

        <!-- 加载状态 -->
        <view class="loading-status">
          <text v-if="loading">加载中...</text>
          <text v-else-if="!hasMore">没有更多了</text>
          <text v-else-if="postsList.length === 0">暂无帖子</text>
        </view>
      </view>
    </scroll-view>

    <!-- 发布按钮 -->
    <view class="fab-button" @click="goToCreate">
      <uni-icons type="plusempty" size="30" color="#fff" />
    </view>
  </view>
</template>

<script>
import Auth from '@/utils/auth.js'
import UserAction from '@/utils/user-action.js'

export default {
  name: 'CommunityList',
  
  data() {
    return {
      tabs: [
        { label: '推荐', value: 'time' },
        { label: '热门', value: 'hot' }
      ],
      currentTab: 'time',
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
  
  onShow() {
    // 从发布页面返回时刷新列表
    if (this.needRefresh) {
      this.onRefresh()
      this.needRefresh = false
    }
  },
  
  methods: {
    // 加载帖子列表
    async loadPosts(loadMore = false) {
      if (this.loading) return
      
      this.loading = true
      
      try {
        const result = await uniCloud.callFunction({
          name: 'post-list',
          data: {
            page: this.page,
            pageSize: this.pageSize,
            sortBy: this.currentTab
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
    
    // 切换tab
    switchTab(tab) {
      if (this.currentTab === tab) return
      
      this.currentTab = tab
      this.page = 1
      this.hasMore = true
      this.postsList = []
      this.loadPosts()
    },
    
    // 下拉刷新
    onRefresh() {
      this.refreshing = true
      this.page = 1
      this.hasMore = true
      this.loadPosts()
    },
    
    // 加载更多
    loadMore() {
      if (!this.hasMore || this.loading) return
      
      this.page++
      this.loadPosts(true)
    },
    
    // 跳转到帖子详情
    goToDetail(postId) {
      uni.navigateTo({
        url: `/pages/community/detail/detail?id=${postId}`
      })
    },
    
    // 跳转到发布页面
    goToCreate() {
      if (!Auth.isLogin()) {
        Auth.toLogin()
        return
      }
      
      uni.navigateTo({
        url: '/pages/community/create/create',
        events: {
          // 监听发布成功事件
          publishSuccess: () => {
            this.needRefresh = true
          }
        }
      })
    },
    
    // 预览图片
    previewImage(images, current) {
      uni.previewImage({
        urls: images,
        current: current
      })
    },
    
    // 格式化时间
    formatTime(timestamp) {
      if (!timestamp) return ''
      
      const now = Date.now()
      const time = new Date(timestamp).getTime()
      const diff = now - time
      
      if (diff < 60000) {
        return '刚刚'
      } else if (diff < 3600000) {
        return Math.floor(diff / 60000) + '分钟前'
      } else if (diff < 86400000) {
        return Math.floor(diff / 3600000) + '小时前'
      } else if (diff < 604800000) {
        return Math.floor(diff / 86400000) + '天前'
      } else {
        const date = new Date(timestamp)
        return `${date.getMonth() + 1}-${date.getDate()}`
      }
    },
    
    // 处理用户点击事件
    handleUserClick(userId, userInfo = {}) {
      console.log('🔔 handleUserClick triggered')
      console.log('   userId:', userId)
      console.log('   userInfo:', userInfo)
      console.log('   userId type:', typeof userId)
      
      if (!userId) {
        console.warn('❌ userId is empty in handleUserClick')
        uni.showToast({
          title: '用户信息无效',
          icon: 'none'
        })
        return
      }
      
      console.log('✅ 调用 UserAction.showUserMenu')
      UserAction.showUserMenu(userId, userInfo)
    }
  }
}
</script>

<style scoped>
.community-page {
  width: 100%;
  height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.tabs-container {
  background: #fff;
  display: flex;
  padding: 0 30rpx;
  border-bottom: 1px solid #eee;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 25rpx 0;
  font-size: 30rpx;
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
  margin-bottom: 20rpx;
  padding: 30rpx;
}

.post-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 20rpx;
}

.user-info {
  flex: 1;
}

.nickname {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 5rpx;
}

.clickable {
  cursor: pointer;
  transition: opacity 0.3s;
}

.clickable:active {
  opacity: 0.6;
}

.time {
  font-size: 24rpx;
  color: #999;
}

.top-tag, .hot-tag {
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
  font-size: 22rpx;
  margin-left: 10rpx;
}

.top-tag {
  background: #ff6b6b;
  color: #fff;
}

.hot-tag {
  background: #ff9500;
  color: #fff;
}

.post-content {
  margin-bottom: 20rpx;
}

.content-text {
  font-size: 28rpx;
  line-height: 1.6;
  color: #333;
  word-break: break-all;
  display: -webkit-box;
  -webkit-line-clamp: 6;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-images {
  margin-bottom: 20rpx;
}

.image-grid {
  display: grid;
  gap: 10rpx;
}

.grid-1 {
  grid-template-columns: 1fr;
}

.grid-2 {
  grid-template-columns: 1fr 1fr;
}

.grid-3 {
  grid-template-columns: 1fr 1fr 1fr;
}

.post-image {
  width: 100%;
  height: 200rpx;
  border-radius: 8rpx;
}

.grid-1 .post-image {
  height: 400rpx;
}

.tags {
  margin-bottom: 20rpx;
}

.tag {
  display: inline-block;
  padding: 4rpx 12rpx;
  background: #f0f0f0;
  color: #8B4513;
  font-size: 24rpx;
  border-radius: 4rpx;
  margin-right: 10rpx;
  margin-bottom: 10rpx;
}

.post-footer {
  display: flex;
  align-items: center;
  padding-top: 20rpx;
  border-top: 1px solid #f0f0f0;
}

.action-item {
  display: flex;
  align-items: center;
  margin-right: 40rpx;
  color: #999;
  font-size: 24rpx;
}

.action-item text {
  margin-left: 8rpx;
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

