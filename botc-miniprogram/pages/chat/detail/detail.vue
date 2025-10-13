<template>
  <view class="page">
    <!-- 消息列表 -->
    <scroll-view 
      class="message-list" 
      scroll-y 
      :scroll-into-view="scrollToView"
      @scrolltoupper="loadMoreMessages"
    >
      <view v-if="loadingMore" class="loading-more">
        <uni-load-more status="loading" />
      </view>
      
      <view 
        v-for="(msg, index) in messageList" 
        :key="msg._id"
        :id="'msg-' + index"
        class="message-item"
        :class="{ 'is-mine': msg.sender_id === currentUserId }"
      >
        <view class="message-content">
          <image 
            v-if="msg.sender_id !== currentUserId"
            class="user-avatar" 
            :src="otherUser.avatar || '/static/logo.png'" 
            mode="aspectFill"
          />
          
          <view class="message-bubble">
            <text class="message-text">{{ msg.content }}</text>
          </view>
          
          <image 
            v-if="msg.sender_id === currentUserId"
            class="user-avatar" 
            :src="myAvatar || '/static/logo.png'" 
            mode="aspectFill"
          />
        </view>
        
        <text class="message-time">{{ formatTime(msg.created_at) }}</text>
      </view>
      
      <view v-if="messageList.length === 0 && !loading" class="empty-message">
        <text>暂无消息，开始聊天吧~</text>
      </view>
    </scroll-view>
    
    <!-- 输入栏 -->
    <view class="input-bar">
      <textarea 
        v-model="inputText"
        class="message-input"
        placeholder="输入消息..."
        :maxlength="1000"
        :adjust-position="true"
        :auto-height="true"
        :show-confirm-bar="false"
      />
      <button 
        class="send-btn"
        :class="{ active: inputText.trim() }"
        :disabled="!inputText.trim() || sending"
        @click="sendMessage"
      >
        {{ sending ? '发送中...' : '发送' }}
      </button>
    </view>
  </view>
</template>

<script>
import Auth from '@/utils/auth.js'

export default {
  name: 'ChatDetail',
  
  data() {
    return {
      userId: '',  // 对方用户ID
      conversationId: '',  // 会话ID
      currentUserId: '',  // 当前用户ID
      otherUser: {},  // 对方用户信息
      myAvatar: '',  // 我的头像
      messageList: [],
      inputText: '',
      sending: false,
      loading: false,
      loadingMore: false,
      page: 1,
      pageSize: 20,
      hasMore: true,
      scrollToView: '',
      autoRefreshTimer: null
    }
  },
  
  onLoad(options) {
    if (options.user_id) {
      this.userId = options.user_id
    }
    
    if (options.conversation_id) {
      this.conversationId = options.conversation_id
    }
    
    // 获取当前用户ID
    const userInfo = Auth.getUserInfo()
    if (userInfo) {
      this.currentUserId = userInfo.uid || userInfo._id || userInfo.id
      this.myAvatar = userInfo.avatar || ''
    }
    
    this.loadOtherUserInfo()
    this.loadMessages()
    
    // 设置自动刷新
    this.startAutoRefresh()
  },
  
  onUnload() {
    // 清除自动刷新
    this.stopAutoRefresh()
  },
  
  methods: {
    // 加载对方用户信息
    async loadOtherUserInfo() {
      try {
        const db = uniCloud.database()
        const result = await db.collection('uni-id-users')
          .doc(this.userId)
          .field('_id,nickname,avatar')
          .get()
        
        if (result.data && result.data.length > 0) {
          this.otherUser = result.data[0]
          
          // 设置页面标题
          uni.setNavigationBarTitle({
            title: this.otherUser.nickname || '私聊'
          })
        }
      } catch (error) {
        console.error('加载用户信息失败：', error)
      }
    },
    
    // 加载消息列表
    async loadMessages() {
      if (this.loading) return
      
      this.loading = true
      
      try {
        const db = uniCloud.database()
        
        // 查询消息
        let query = db.collection('botc-chat-messages')
        
        if (this.conversationId) {
          query = query.where({
            conversation_id: this.conversationId
          })
        } else {
          // 没有会话ID，根据双方用户ID查询
          query = query.where(db.command.or([
            {
              sender_id: this.currentUserId,
              receiver_id: this.userId
            },
            {
              sender_id: this.userId,
              receiver_id: this.currentUserId
            }
          ]))
        }
        
        const result = await query
          .orderBy('created_at', 'desc')
          .limit(this.pageSize)
          .get()
        
        const messages = result.result?.data || result.data || []
        
        // 反转数组（时间正序）
        this.messageList = messages.reverse()
        
        // 滚动到底部
        this.$nextTick(() => {
          if (this.messageList.length > 0) {
            this.scrollToView = 'msg-' + (this.messageList.length - 1)
          }
        })
        
      } catch (error) {
        console.error('加载消息失败：', error)
      } finally {
        this.loading = false
      }
    },
    
    // 加载更多消息
    async loadMoreMessages() {
      if (this.loadingMore || !this.hasMore) return
      
      // 暂不实现分页，避免复杂性
    },
    
    // 发送消息
    async sendMessage() {
      if (!this.inputText.trim() || this.sending) return
      
      const content = this.inputText.trim()
      this.inputText = ''
      this.sending = true
      
      try {
        const result = await uniCloud.callFunction({
          name: 'chat-send-message',
          data: {
            receiver_id: this.userId,
            content: content,
            message_type: 1,
            token: Auth.getToken()
          }
        })
        
        if (result.result.code === 0) {
          // 保存会话ID
          if (!this.conversationId) {
            this.conversationId = result.result.data.conversation_id
          }
          
          // 添加消息到列表
          this.messageList.push({
            _id: result.result.data.message_id,
            conversation_id: this.conversationId,
            sender_id: this.currentUserId,
            receiver_id: this.userId,
            content: content,
            message_type: 1,
            is_read: false,
            created_at: result.result.data.created_at
          })
          
          // 滚动到底部
          this.$nextTick(() => {
            this.scrollToView = 'msg-' + (this.messageList.length - 1)
          })
        } else {
          throw new Error(result.result.message)
        }
      } catch (error) {
        console.error('发送消息失败：', error)
        uni.showToast({
          title: '发送失败',
          icon: 'none'
        })
        
        // 恢复输入框内容
        this.inputText = content
      } finally {
        this.sending = false
      }
    },
    
    // 开始自动刷新
    startAutoRefresh() {
      this.autoRefreshTimer = setInterval(() => {
        this.refreshMessages()
      }, 3000)  // 每3秒刷新一次
    },
    
    // 停止自动刷新
    stopAutoRefresh() {
      if (this.autoRefreshTimer) {
        clearInterval(this.autoRefreshTimer)
        this.autoRefreshTimer = null
      }
    },
    
    // 刷新消息（静默）
    async refreshMessages() {
      try {
        const db = uniCloud.database()
        
        // 获取最后一条消息的时间
        const lastMessageTime = this.messageList.length > 0 
          ? this.messageList[this.messageList.length - 1].created_at 
          : new Date(0)
        
        // 查询新消息
        let query = db.collection('botc-chat-messages')
        
        if (this.conversationId) {
          query = query.where({
            conversation_id: this.conversationId,
            created_at: db.command.gt(lastMessageTime)
          })
        } else {
          query = query.where(db.command.and([
            db.command.or([
              {
                sender_id: this.currentUserId,
                receiver_id: this.userId
              },
              {
                sender_id: this.userId,
                receiver_id: this.currentUserId
              }
            ]),
            {
              created_at: db.command.gt(lastMessageTime)
            }
          ]))
        }
        
        const result = await query
          .orderBy('created_at', 'asc')
          .limit(20)
          .get()
        
        const newMessages = result.result?.data || result.data || []
        
        if (newMessages.length > 0) {
          this.messageList = [...this.messageList, ...newMessages]
          
          // 滚动到底部
          this.$nextTick(() => {
            this.scrollToView = 'msg-' + (this.messageList.length - 1)
          })
        }
        
      } catch (error) {
        console.error('刷新消息失败：', error)
      }
    },
    
    // 格式化时间
    formatTime(timestamp) {
      if (!timestamp) return ''
      
      const date = new Date(timestamp)
      return date.getHours().toString().padStart(2, '0') + ':' + 
             date.getMinutes().toString().padStart(2, '0')
    }
  }
}
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.message-list {
  flex: 1;
  padding: 20rpx;
  overflow-y: auto;
}

.loading-more {
  padding: 20rpx 0;
}

.message-item {
  margin-bottom: 30rpx;
}

.message-content {
  display: flex;
  align-items: flex-end;
  gap: 20rpx;
}

.message-item.is-mine .message-content {
  flex-direction: row-reverse;
}

.user-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: #f0f0f0;
  flex-shrink: 0;
}

.message-bubble {
  max-width: 480rpx;
  padding: 20rpx 25rpx;
  background: white;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.message-item.is-mine .message-bubble {
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
  color: white;
}

.message-text {
  font-size: 28rpx;
  line-height: 1.6;
  word-wrap: break-word;
}

.message-item.is-mine .message-text {
  color: white;
}

.message-time {
  display: block;
  font-size: 22rpx;
  color: #999;
  text-align: center;
  margin-top: 10rpx;
}

.empty-message {
  text-align: center;
  padding: 200rpx 0;
  color: #999;
  font-size: 28rpx;
}

.input-bar {
  display: flex;
  align-items: flex-end;
  padding: 20rpx 30rpx;
  background: white;
  border-top: 1px solid #e8e8e8;
  gap: 20rpx;
}

.message-input {
  flex: 1;
  min-height: 70rpx;
  max-height: 200rpx;
  padding: 15rpx 20rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  font-size: 28rpx;
  line-height: 1.6;
}

.send-btn {
  width: 140rpx;
  height: 70rpx;
  line-height: 70rpx;
  padding: 0;
  background: #d9d9d9;
  color: #999;
  font-size: 28rpx;
  border-radius: 12rpx;
  border: none;
  transition: all 0.3s;
}

.send-btn.active {
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
  color: white;
}

.send-btn[disabled] {
  opacity: 0.6;
}
</style>

