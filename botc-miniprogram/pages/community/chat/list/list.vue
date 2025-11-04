<template>
  <view class="page">
    <!-- 搜索栏 -->
    <view class="search-container">
      <uni-search-bar 
        placeholder="搜索好友"
        @confirm="handleSearch"
        @clear="handleClear"
        v-model="searchKeyword"
        :focus="false"
        bg-color="#ffffff">
      </uni-search-bar>
    </view>

    <!-- 会话列表 -->
    <view class="chat-list">
      <view v-if="loading && conversations.length === 0" class="loading-state">
        <uni-load-more status="loading"></uni-load-more>
      </view>

      <view v-else-if="conversations.length === 0" class="empty-state">
        <image class="empty-icon" src="/static/images/empty-chat.png"></image>
        <text class="empty-text">暂无聊天记录</text>
        <text class="empty-subtitle">在拼车详情页可以与其他玩家私聊</text>
      </view>

      <view v-else>
        <view 
          v-for="conversation in filteredConversations" 
          :key="conversation.user_id"
          class="conversation-item"
          @click="openConversation(conversation.user)">
          
          <!-- 用户头像 -->
          <view class="avatar-container">
            <image 
              class="user-avatar" 
              :src="conversation.user.avatar || '/static/images/default-avatar.png'"
              mode="aspectFill">
            </image>
            <view v-if="conversation.unread_count > 0" class="unread-badge">
              <text class="unread-count">{{ formatUnreadCount(conversation.unread_count) }}</text>
            </view>
          </view>

          <!-- 聊天内容 -->
          <view class="conversation-content">
            <view class="conversation-header">
              <text class="user-name">{{ conversation.user.nickname }}</text>
              <text v-if="conversation.user.level" class="user-level">Lv.{{ conversation.user.level }}</text>
              <text class="message-time">{{ formatTime(conversation.last_message_time) }}</text>
            </view>
            
            <view class="last-message">
              <text v-if="conversation.last_message.is_from_me" class="message-prefix">[我] </text>
              <text class="message-content" :class="{ 'unread': conversation.unread_count > 0 }">
                {{ getMessagePreview(conversation.last_message) }}
              </text>
            </view>
          </view>

          <!-- 箭头 -->
          <view class="arrow-container">
            <text class="arrow-icon">></text>
          </view>
        </view>
      </view>
    </view>

    <!-- 浮动按钮：搜索用户 -->
    <view class="fab-container">
      <uni-fab 
        :pattern="fabPattern"
        :content="fabContent"
        @trigger="handleFabClick">
      </uni-fab>
    </view>
  </view>
</template>

<script>
export default {
  name: 'ChatList',
  
  data() {
    return {
      conversations: [],
      searchKeyword: '',
      loading: false,
      
      // 浮动按钮配置
      fabPattern: {
        color: '#8B4513',
        selectedColor: '#D2691E'
      },
      fabContent: [
        {
          iconPath: '/static/images/add-chat.png',
          selectedIconPath: '/static/images/add-chat-active.png',
          text: '新建会话',
          active: false
        }
      ]
    }
  },

  computed: {
    // 过滤后的会话列表
    filteredConversations() {
      if (!this.searchKeyword) {
        return this.conversations
      }
      
      return this.conversations.filter(conv => 
        conv.user.nickname.toLowerCase().includes(this.searchKeyword.toLowerCase())
      )
    }
  },

  onLoad() {
    console.log('聊天列表页面加载')
    // 初始化 chat 云对象
    this.chatObj = uniCloud.importObject('chat', {
      customUI: true
    })
    this.loadConversations()
  },

  onShow() {
    // 每次显示时刷新数据
    this.loadConversations()
  },

  onPullDownRefresh() {
    this.loadConversations().finally(() => {
      uni.stopPullDownRefresh()
    })
  },

  methods: {
    // 加载聊天会话列表
    async loadConversations() {
      this.loading = true
      
      try {
        const result = await this.chatObj.getConversations(1, 50)

        if (result.code === 0) {
          this.conversations = result.data.list
        } else {
          throw new Error(result.message)
        }
        
      } catch (error) {
        console.error('加载聊天列表失败：', error)
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },

    // 搜索处理
    handleSearch(keyword) {
      this.searchKeyword = keyword.value
    },

    // 清除搜索
    handleClear() {
      this.searchKeyword = ''
    },

    // 打开对话
    openConversation(user) {
      uni.navigateTo({
        url: `/pages/community/chat/conversation/conversation?userId=${user._id}&nickname=${user.nickname}&avatar=${user.avatar || ''}`
      })
    },

    // 浮动按钮点击
    handleFabClick() {
      // 跳转到查找用户页面
      uni.navigateTo({
        url: '/pages/community/chat/search/search'
      })
    },

    // 格式化未读数量
    formatUnreadCount(count) {
      if (count > 99) {
        return '99+'
      }
      return count.toString()
    },

    // 格式化时间
    formatTime(timestamp) {
      if (!timestamp) return ''
      
      const date = new Date(timestamp)
      const now = new Date()
      const diff = now - date
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      
      if (days === 0) {
        // 今天
        return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
      } else if (days === 1) {
        return '昨天'
      } else if (days < 7) {
        return `${days}天前`
      } else {
        return `${date.getMonth() + 1}/${date.getDate()}`
      }
    },

    // 获取消息预览
    getMessagePreview(message) {
      if (message.message_type === 1) {
        // 文本消息
        return message.content.length > 30 ? 
          message.content.substring(0, 30) + '...' : 
          message.content
      } else if (message.message_type === 2) {
        return '[图片]'
      } else {
        return '[未知消息类型]'
      }
    }
  }
}
</script>

<style scoped>
.search-container {
  background: white;
  padding: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.chat-list {
  background: white;
}

.conversation-item {
  display: flex;
  align-items: center;
  padding: 24rpx 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
  position: relative;
}

.conversation-item:active {
  background-color: #f5f5f5;
}

.avatar-container {
  position: relative;
  margin-right: 20rpx;
}

.user-avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: 44rpx;
}

.unread-badge {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  background-color: #ff4d4f;
  border-radius: 20rpx;
  min-width: 32rpx;
  height: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.unread-count {
  font-size: 20rpx;
  color: white;
  font-weight: bold;
  padding: 0 8rpx;
}

.conversation-content {
  flex: 1;
  min-width: 0;
}

.conversation-header {
  display: flex;
  align-items: center;
  margin-bottom: 8rpx;
}

.user-name {
  font-size: 30rpx;
  color: #333333;
  font-weight: 500;
  margin-right: 12rpx;
}

.user-level {
  font-size: 20rpx;
  color: #FF6B35;
  background-color: rgba(255, 107, 53, 0.1);
  padding: 2rpx 6rpx;
  border-radius: 6rpx;
  margin-right: auto;
}

.message-time {
  font-size: 22rpx;
  color: #999999;
  flex-shrink: 0;
}

.last-message {
  display: flex;
  align-items: center;
}

.message-prefix {
  font-size: 24rpx;
  color: #8B4513;
  flex-shrink: 0;
}

.message-content {
  font-size: 26rpx;
  color: #666666;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.message-content.unread {
  color: #333333;
  font-weight: 500;
}

.arrow-container {
  margin-left: 20rpx;
}

.arrow-icon {
  font-size: 28rpx;
  color: #cccccc;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 60vh;
}

.empty-icon {
  width: 120rpx;
  height: 120rpx;
  margin-bottom: 20rpx;
  opacity: 0.6;
}

.empty-text {
  font-size: 28rpx;
  color: #666666;
  margin-bottom: 8rpx;
}

.empty-subtitle {
  font-size: 24rpx;
  color: #999999;
}

.fab-container {
  position: fixed;
  bottom: 120rpx;
  right: 40rpx;
  z-index: 100;
}
</style>
