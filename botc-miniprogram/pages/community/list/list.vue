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

    <!-- 帖子列表 - 四宫格 -->
    <scroll-view 
      class="posts-scroll"
      scroll-y
      @scrolltolower="loadMore"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <!-- 四宫格网格布局 -->
      <view class="posts-grid">
        <view 
          v-for="post in postsList" 
          :key="post._id"
          class="grid-item"
          @click="goToDetail(post._id)"
        >
          <!-- 卡片内容 -->
          <view class="card-content">
            <!-- 封面图片 -->
            <view class="card-cover">
              <image 
                class="cover-image" 
                :src="getCoverImage(post)"
                mode="aspectFill"
              />
              <!-- 置顶或热门角标 -->
              <view v-if="post.is_top" class="corner-badge top-badge">置顶</view>
              <view v-else-if="post.is_hot" class="corner-badge hot-badge">🔥</view>
            </view>
            
            <!-- 标题和内容 -->
            <view class="card-text">
              <text class="card-title">{{ post.content }}</text>
            </view>
            
            <!-- 底部信息 -->
            <view class="card-footer">
              <!-- 用户头像 -->
              <image 
                class="mini-avatar" 
                :src="post.user?.avatar || '/static/default-avatar.png'"
                mode="aspectFill"
                @click.stop="handleUserClick(post.user_id, post.user)"
              />
              
              <!-- 互动数据 -->
              <view class="meta-info">
                <view class="meta-item">
                  <uni-icons type="eye" size="14" color="#999" />
                  <text>{{ formatCount(post.view_count || 0) }}</text>
                </view>
                <view class="meta-item">
                  <uni-icons type="heart" size="14" color="#999" />
                  <text>{{ formatCount(post.like_count || 0) }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 加载状态 -->
      <view class="loading-status">
        <text v-if="loading">加载中...</text>
        <text v-else-if="!hasMore">没有更多了</text>
        <text v-else-if="postsList.length === 0">暂无帖子</text>
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
    },
    
    // 获取封面图片
    getCoverImage(post) {
      // 1. 优先使用第一张上传的图片
      if (post.images && post.images.length > 0) {
        return post.images[0]
      }
      
      // 2. 使用默认占位图
      return '/static/community-default.png'
    },
    
    // 格式化数量显示
    formatCount(count) {
      if (count >= 10000) {
        return (count / 10000).toFixed(1) + 'w'
      } else if (count >= 1000) {
        return (count / 1000).toFixed(1) + 'k'
      }
      return count
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

/* 四宫格布局 */
.posts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  padding: 20rpx;
}

/* 网格卡片 */
.grid-item {
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.grid-item:active {
  transform: scale(0.98);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.12);
}

/* 卡片内容 */
.card-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 封面图片区域 */
.card-cover {
  position: relative;
  width: 100%;
  height: 300rpx;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
}

/* 角标 */
.corner-badge {
  position: absolute;
  top: 12rpx;
  right: 12rpx;
  padding: 6rpx 14rpx;
  border-radius: 20rpx;
  font-size: 20rpx;
  font-weight: bold;
  backdrop-filter: blur(10rpx);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
}

.top-badge {
  background: rgba(255, 107, 107, 0.95);
  color: #fff;
}

.hot-badge {
  background: rgba(255, 149, 0, 0.95);
  color: #fff;
}

/* 文本区域 */
.card-text {
  padding: 20rpx;
  flex: 1;
  display: flex;
  align-items: center;
}

.card-title {
  font-size: 26rpx;
  line-height: 1.5;
  color: #333;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
}

/* 底部信息 */
.card-footer {
  padding: 16rpx 20rpx;
  border-top: 1rpx solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 迷你头像 */
.mini-avatar {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  border: 2rpx solid #fff;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.1);
}

.clickable {
  cursor: pointer;
  transition: opacity 0.3s;
}

.clickable:active {
  opacity: 0.6;
}

/* 互动数据 */
.meta-info {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6rpx;
  font-size: 20rpx;
  color: #999;
}

.meta-item text {
  line-height: 1;
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

