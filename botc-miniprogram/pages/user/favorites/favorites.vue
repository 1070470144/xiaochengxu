<template>
  <view class="page">
    <!-- 筛选栏 -->
    <view class="filter-bar">
      <scroll-view scroll-x="true" class="filter-scroll" :show-scrollbar="false">
        <view class="filter-items">
          <text 
            v-for="category in categories" 
            :key="category.type"
            :class="['filter-item', activeCategory === category.type ? 'active' : '']"
            @click="switchCategory(category.type)"
          >
            {{ category.icon }} {{ category.name }}
            <text v-if="category.count > 0" class="count-badge">{{ category.count }}</text>
          </text>
        </view>
      </scroll-view>
    </view>

    <!-- 空状态 -->
    <view v-if="!loading && filteredFavoritesList.length === 0" class="empty-state">
      <view class="empty-icon">⭐</view>
      <text class="empty-text">暂无收藏</text>
      <text class="empty-hint">{{ activeCategory === 'all' ? '快去收藏喜欢的内容吧~' : '该分类下暂无收藏' }}</text>
    </view>

    <!-- 收藏列表 -->
    <view v-else class="favorites-list">
      <view 
        v-for="item in filteredFavoritesList" 
        :key="item.favorite_id"
        class="favorite-card"
        @click="goToDetail(item)"
      >
        <!-- 剧本收藏 -->
        <view v-if="item.target_type === 'script'" class="script-favorite">
          <image 
            v-if="item.target_data.cover"
            class="cover-image" 
            :src="item.target_data.cover" 
            mode="aspectFill"
          />
          <view class="cover-placeholder" v-else>📚</view>
          <view class="info">
            <text class="title">{{ item.target_data.title || '未知剧本' }}</text>
            <text class="author">作者：{{ item.target_data.author || '未知' }}</text>
            <text class="time">{{ formatTime(item.created_at) }}</text>
          </view>
        </view>

        <!-- 帖子收藏 -->
        <view v-else-if="item.target_type === 'post'" class="post-favorite">
          <view class="post-content">
            <text class="post-text">{{ item.target_data.content }}</text>
            <view v-if="item.target_data.images && item.target_data.images.length > 0" class="post-images">
              <image 
                v-for="(img, index) in item.target_data.images.slice(0, 3)"
                :key="index"
                class="post-image"
                :src="img"
                mode="aspectFill"
              />
            </view>
          </view>
          <text class="time">{{ formatTime(item.created_at) }}</text>
        </view>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-state">
      <uni-load-more status="loading" />
    </view>

    <!-- 加载更多 -->
    <view v-if="!loading && hasMore && favoritesList.length > 0" class="load-more">
      <button class="load-more-btn" @click="loadMore">加载更多</button>
    </view>
  </view>
</template>

<script>
import Auth from '@/utils/auth.js'

export default {
  name: 'Favorites',
  
  data() {
    return {
      favoritesList: [],
      loading: false,
      page: 1,
      pageSize: 10,
      hasMore: true,
      activeCategory: 'all'
    }
  },
  
  computed: {
    // 分类标签
    categories() {
      const scriptCount = this.favoritesList.filter(item => item.target_type === 'script').length
      const postCount = this.favoritesList.filter(item => item.target_type === 'post').length
      
      return [
        { type: 'all', name: '全部', icon: '⭐', count: this.favoritesList.length },
        { type: 'script', name: '剧本', icon: '📚', count: scriptCount },
        { type: 'post', name: '帖子', icon: '📝', count: postCount }
      ]
    },
    
    // 筛选后的列表
    filteredFavoritesList() {
      if (this.activeCategory === 'all') {
        return this.favoritesList
      }
      return this.favoritesList.filter(item => item.target_type === this.activeCategory)
    }
  },
  
  onLoad() {
    // 初始化 collection 云对象
    this.collectionObj = uniCloud.importObject('collection', {
      customUI: true
    })
    this.checkLoginAndLoad()
  },
  
  onPullDownRefresh() {
    this.refreshList()
  },
  
  methods: {
    // 切换分类
    switchCategory(type) {
      this.activeCategory = type
    },
    
    // 检查登录并加载数据
    checkLoginAndLoad() {
      if (!Auth.isLogin()) {
        Auth.toLogin()
        return
      }
      this.loadFavoritesList()
    },
    
    // 加载收藏列表
    async loadFavoritesList(isLoadMore = false) {
      if (this.loading) return
      
      this.loading = true
      
      try {
        const result = await this.collectionObj.getFavorites({
          page: this.page,
          pageSize: this.pageSize
        })
        
        if (result.code === 0) {
          const newList = result.data.list || []
          
          if (isLoadMore) {
            this.favoritesList = [...this.favoritesList, ...newList]
          } else {
            this.favoritesList = newList
          }
          
          this.hasMore = result.data.hasMore
        } else {
          throw new Error(result.message)
        }
      } catch (error) {
        console.error('加载收藏列表失败：', error)
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
      this.loadFavoritesList(false)
    },
    
    // 加载更多
    loadMore() {
      if (!this.hasMore || this.loading) return
      
      this.page++
      this.loadFavoritesList(true)
    },
    
    // 跳转到详情
    goToDetail(item) {
      if (item.target_type === 'script') {
        uni.navigateTo({
          url: `/pages/script/detail/detail?id=${item.target_data.id}`
        })
      } else if (item.target_type === 'post') {
        uni.navigateTo({
          url: `/pages/community/detail/detail?id=${item.target_data.id}`
        })
      }
    },
    
    // 格式化时间
    formatTime(timestamp) {
      if (!timestamp) return ''
      
      const date = new Date(timestamp)
      const now = new Date()
      const diff = now - date
      
      // 今天
      if (diff < 86400000 && date.getDate() === now.getDate()) {
        return '今天' + date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0')
      }
      
      // 昨天
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      if (date.getDate() === yesterday.getDate()) {
        return '昨天'
      }
      
      // 一周内
      if (diff < 7 * 86400000) {
        const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
        return weekdays[date.getDay()]
      }
      
      // 其他
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      
      if (year === now.getFullYear()) {
        return `${month}-${day}`
      }
      
      return `${year}-${month}-${day}`
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
}

/* 筛选栏 */
.filter-bar {
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  position: sticky;
  top: 0;
  z-index: 100;
}

.filter-scroll {
  white-space: nowrap;
  padding: 24rpx 0;
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* 隐藏横向滚动条 */
.filter-scroll::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
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
  position: relative;
}

.filter-item.active {
  background: #8b4513;
  color: #fff;
  font-weight: 500;
}

.count-badge {
  display: inline-block;
  margin-left: 8rpx;
  padding: 2rpx 10rpx;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 20rpx;
  font-size: 22rpx;
}

.filter-item.active .count-badge {
  background: rgba(255, 255, 255, 0.25);
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
}

/* 收藏列表 */
.favorites-list {
  padding: 20rpx;
}

.favorite-card {
  background: white;
  border-radius: 16rpx;
  padding: 25rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

/* 剧本收藏 */
.script-favorite {
  display: flex;
  gap: 20rpx;
}

.cover-image {
  width: 160rpx;
  height: 200rpx;
  border-radius: 12rpx;
  background: #f0f0f0;
  flex-shrink: 0;
}

.cover-placeholder {
  width: 160rpx;
  height: 200rpx;
  border-radius: 12rpx;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 60rpx;
  flex-shrink: 0;
}

.info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 15rpx;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.author {
  font-size: 24rpx;
  color: #666;
  margin-bottom: 10rpx;
}

.time {
  font-size: 22rpx;
  color: #999;
  margin-top: auto;
}

/* 帖子收藏 */
.post-favorite {
  display: flex;
  flex-direction: column;
}

.post-content {
  margin-bottom: 15rpx;
}

.post-text {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  margin-bottom: 15rpx;
}

.post-images {
  display: flex;
  gap: 10rpx;
}

.post-image {
  width: 150rpx;
  height: 150rpx;
  border-radius: 8rpx;
  background: #f0f0f0;
}

/* 加载状态 */
.loading-state {
  padding: 40rpx 0;
  text-align: center;
}

.load-more {
  padding: 20rpx;
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

