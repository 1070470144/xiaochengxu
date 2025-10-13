<template>
  <view class="page">
    <!-- 会话列表 -->
    <view v-if="!loading && conversationList.length > 0" class="conversation-list">
      <view 
        v-for="conv in conversationList" 
        :key="conv.conversation_id"
        class="conversation-item"
        @click="goToChat(conv)"
      >
        <view class="avatar-wrapper">
          <image 
            class="user-avatar" 
            :src="conv.other_user.avatar || '/static/logo.png'" 
            mode="aspectFill"
          />
          <view v-if="conv.unread_count > 0" class="unread-badge">
            {{ conv.unread_count > 99 ? '99+' : conv.unread_count }}
          </view>
        </view>
        
        <view class="conversation-content">
          <view class="conversation-header">
            <text class="user-nickname">{{ conv.other_user.nickname || '未知用户' }}</text>
            <text class="message-time">{{ formatTime(conv.last_message_time) }}</text>
          </view>
          <text class="last-message">{{ conv.last_message || '暂无消息' }}</text>
        </view>
      </view>
    </view>
    
    <!-- 加载状态 -->
    <view v-else-if="loading" class="loading-state">
      <uni-load-more status="loading" />
    </view>
    
    <!-- 空状态 -->
    <view v-else class="empty-state">
      <view class="empty-icon">💬</view>
      <text class="empty-text">暂无私聊消息</text>
      <text class="empty-hint">去关注或私聊感兴趣的用户吧~</text>
    </view>
  </view>
</template>

<script>
import Auth from '@/utils/auth.js'

export default {
  name: 'ChatList',
  
  data() {
    return {
      conversationList: [],
      loading: false,
      page: 1,
      pageSize: 20,
      hasMore: true
    }
  },
  
  onLoad() {
    this.loadConversations()
  },
  
  onShow() {
    // 每次显示时刷新列表
    this.refreshList()
  },
  
  onPullDownRefresh() {
    this.refreshList()
  },
  
  onReachBottom() {
    this.loadMore()
  },
  
  methods: {
    // 加载会话列表
    async loadConversations(isLoadMore = false) {
      if (this.loading) return
      
      // 检查登录
      if (!Auth.isLogin()) {
        Auth.toLogin()
        return
      }
      
      this.loading = true
      
      try {
        const result = await uniCloud.callFunction({
          name: 'chat-conversation-list',
          data: {
            page: this.page,
            page_size: this.pageSize,
            token: Auth.getToken()
          }
        })
        
        if (result.result.code === 0) {
          const newList = result.result.data.list || []
          
          if (isLoadMore) {
            this.conversationList = [...this.conversationList, ...newList]
          } else {
            this.conversationList = newList
          }
          
          this.hasMore = newList.length >= this.pageSize
        } else {
          throw new Error(result.result.message)
        }
      } catch (error) {
        console.error('加载会话列表失败：', error)
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
      this.loadConversations(false)
    },
    
    // 加载更多
    loadMore() {
      if (!this.hasMore || this.loading) return
      
      this.page++
      this.loadConversations(true)
    },
    
    // 进入聊天页面
    goToChat(conversation) {
      uni.navigateTo({
        url: `/pages/chat/detail/detail?user_id=${conversation.other_user._id}&conversation_id=${conversation.conversation_id}`
      })
    },
    
    // 格式化时间
    formatTime(timestamp) {
      if (!timestamp) return ''
      
      const now = new Date()
      const date = new Date(timestamp)
      const diff = now - date
      
      // 一分钟内
      if (diff < 60 * 1000) {
        return '刚刚'
      }
      
      // 一小时内
      if (diff < 60 * 60 * 1000) {
        return Math.floor(diff / (60 * 1000)) + '分钟前'
      }
      
      // 今天
      if (date.toDateString() === now.toDateString()) {
        return date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0')
      }
      
      // 昨天
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      if (date.toDateString() === yesterday.toDateString()) {
        return '昨天'
      }
      
      // 一周内
      if (diff < 7 * 24 * 60 * 60 * 1000) {
        const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
        return weekdays[date.getDay()]
      }
      
      // 更早
      return (date.getMonth() + 1) + '/' + date.getDate()
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
}

.conversation-list {
  background: white;
}

.conversation-item {
  display: flex;
  padding: 25rpx 30rpx;
  background: white;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.3s;
}

.conversation-item:active {
  background: #f5f5f5;
}

.avatar-wrapper {
  position: relative;
  margin-right: 25rpx;
  flex-shrink: 0;
}

.user-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: #f0f0f0;
}

.unread-badge {
  position: absolute;
  top: -5rpx;
  right: -5rpx;
  min-width: 36rpx;
  height: 36rpx;
  line-height: 36rpx;
  padding: 0 8rpx;
  background: #ff4d4f;
  color: white;
  font-size: 20rpx;
  border-radius: 18rpx;
  text-align: center;
  box-shadow: 0 2rpx 8rpx rgba(255, 77, 79, 0.3);
}

.conversation-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
}

.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.user-nickname {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.message-time {
  font-size: 24rpx;
  color: #999;
  flex-shrink: 0;
  margin-left: 20rpx;
}

.last-message {
  font-size: 28rpx;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
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
</style>

