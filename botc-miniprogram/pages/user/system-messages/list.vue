<template>
  <view class="page">
    <!-- 头部 -->
    <view class="header">
      <view v-if="unreadCount > 0" class="header-btn mark-all-read" @click="markAllAsRead">
        <text class="btn-icon">✓</text>
        <text class="btn-text">全部已读</text>
      </view>
      <view v-if="messages.length > 0" class="header-btn delete-all-btn" @click="confirmDeleteAll">
        <text class="btn-icon">🗑️</text>
        <text class="btn-text">全部删除</text>
      </view>
    </view>

    <!-- 消息列表 -->
    <scroll-view class="message-list" scroll-y @scrolltolower="loadMore">
      <view v-if="loading && messages.length === 0" class="loading-box">
        <uni-load-more status="loading"></uni-load-more>
      </view>
      
      <view v-else-if="messages.length === 0" class="empty-box">
        <text class="empty-icon">📭</text>
        <text class="empty-text">暂无消息</text>
      </view>
      
      <view v-else>
        <view 
          v-for="item in messages" 
          :key="item._id"
          class="message-item"
          :class="{ unread: !item.is_read }"
        >
          <view class="message-main" @click="viewDetail(item)">
            <!-- 消息图标 -->
            <view class="message-icon" :class="'icon-' + item.type">
              <text class="icon-text">{{ getTypeIcon(item.type) }}</text>
            </view>
            
            <!-- 消息内容 -->
            <view class="message-content">
              <view class="message-header">
                <text class="message-title">{{ item.title }}</text>
                <text class="message-time">{{ formatTime(item.created_at) }}</text>
              </view>
              <text class="message-preview">{{ item.content }}</text>
            </view>
            
            <!-- 未读标识 -->
            <view v-if="!item.is_read" class="unread-dot"></view>
          </view>
          
          <!-- 删除按钮 -->
          <view class="delete-btn" @click.stop="confirmDelete(item)">
            <text class="delete-icon">🗑️</text>
          </view>
        </view>
      </view>
      
      <!-- 加载更多 -->
      <view v-if="hasMore && messages.length > 0" class="load-more">
        <uni-load-more :status="loadingMore ? 'loading' : 'more'" @click="loadMore" />
      </view>
      <view v-else-if="!hasMore && messages.length > 0" class="no-more">
        <text>没有更多了</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import Auth from '@/utils/auth.js'

export default {
  name: 'SystemMessages',
  
  data() {
    return {
      messages: [],
      loading: false,
      loadingMore: false,
      hasMore: true,
      page: 1,
      pageSize: 20,
      unreadCount: 0
    }
  },
  
  onLoad() {
    // 初始化 system 云对象
    this.systemObj = uniCloud.importObject('system', { customUI: true })
    this.loadMessages()
    this.loadUnreadCount()
  },
  
  methods: {
    // 加载消息列表
    async loadMessages(loadMore = false) {
      if (this.loading || this.loadingMore) return
      
      if (loadMore) {
        this.loadingMore = true
      } else {
        this.loading = true
      }
      
      try {
        const userInfo = Auth.getUserInfo()
        console.log('用户信息:', userInfo)
        
        if (!userInfo) {
          console.error('用户信息为空')
          uni.showToast({ title: '请先登录', icon: 'none' })
          return
        }
        
        const userId = userInfo.uid || userInfo._id || userInfo.id
        
        console.log('=== 用户信息详情 ===')
        console.log('完整userInfo:', userInfo)
        console.log('提取的userId:', userId)
        console.log('userId类型:', typeof userId)
        
        if (!userId) {
          console.error('❌ 用户ID为空')
          uni.showToast({ title: '用户ID获取失败，请重新登录', icon: 'none' })
          return
        }
        
        console.log('=== 开始查询系统消息 ===')
        console.log('当前用户ID:', userId)
        console.log('用户ID类型:', typeof userId)
        console.log('用户ID长度:', userId ? userId.length : 0)
        console.log('页码:', this.page)
        console.log('每页条数:', this.pageSize)
        
        // 使用云对象查询系统消息
        console.log('>>> 通过云对象查询系统消息')
        console.log('调用参数:', { page: this.page, pageSize: this.pageSize })
        
        let res
        try {
          res = await this.systemObj.getSystemMessages(this.page, this.pageSize)
          
          console.log('=== 云对象调用成功 ===')
          console.log('完整响应:', res)
          
        } catch (error) {
          console.error('❌ 云对象调用失败:', error)
          console.error('错误信息:', error.message)
          console.error('错误代码:', error.code)
          uni.showToast({ title: '查询失败: ' + error.message, icon: 'none' })
          return
        }
        
        console.log('=== 查询结果 ===')
        
        // 处理云对象返回的数据
        let data = []
        if (res && res.code === 0) {
          data = res.data?.list || []
          console.log('数据条数:', data.length)
          
          if (data.length > 0) {
            console.log('消息列表:')
            data.forEach((msg, i) => {
              console.log(`消息${i+1}:`, {
                title: msg.title,
                content: msg.content ? msg.content.substring(0, 50) : '',
                user_id: msg.user_id,
                created_at: new Date(msg.created_at),
                is_read: msg.is_read
              })
            })
          } else {
            console.log('❌ 未查询到任何消息')
          }
        } else {
          console.error('❌ 云对象调用失败:', res?.message)
        }
        
        if (loadMore) {
          this.messages = [...this.messages, ...data]
        } else {
          this.messages = data
        }
        
        this.hasMore = data.length >= this.pageSize
        console.log('=== 最终消息数量:', this.messages.length, '===')
        
        // 如果没有消息，显示提示
        if (this.messages.length === 0) {
          console.warn('⚠️ 当前用户没有系统消息')
        }
        
      } catch (error) {
        console.error('加载消息失败 - 详细错误:', error)
        console.error('错误信息:', error.message)
        console.error('错误代码:', error.code)
        uni.showToast({ 
          title: error.message || '加载失败', 
          icon: 'none',
          duration: 3000
        })
      } finally {
        this.loading = false
        this.loadingMore = false
      }
    },
    
    // 加载未读数量
    async loadUnreadCount() {
      try {
        const userInfo = Auth.getUserInfo()
        if (!userInfo) return
        
        const userId = userInfo.uid || userInfo._id || userInfo.id
        if (!userId) return
        
        const db = uniCloud.database()
        
        const res = await db.collection('botc-system-messages')
          .where({
            user_id: userId,
            is_read: false
          })
          .count()
        
        this.unreadCount = (res && res.total) ? res.total : 0
      } catch (error) {
        console.error('加载未读数量失败:', error)
        this.unreadCount = 0
      }
    },
    
    // 加载更多
    loadMore() {
      if (!this.hasMore || this.loadingMore) return
      this.page++
      this.loadMessages(true)
    },
    
    // 查看详情
    viewDetail(item) {
      // 标记为已读
      if (!item.is_read) {
        this.markAsRead(item._id)
      }
      
      // 跳转到详情页
      uni.navigateTo({
        url: `/pages/user/system-messages/detail?id=${item._id}`
      })
    },
    
    // 标记为已读
    async markAsRead(id) {
      try {
        const db = uniCloud.database()
        await db.collection('botc-system-messages').doc(id).update({
          is_read: true,
          read_at: Date.now()
        })
        
        // 更新本地数据
        const message = this.messages.find(m => m._id === id)
        if (message) {
          message.is_read = true
          message.read_at = Date.now()
        }
        
        // 更新未读数量
        if (this.unreadCount > 0) {
          this.unreadCount--
        }
      } catch (error) {
        console.error('标记已读失败:', error)
      }
    },
    
    // 全部标记为已读
    async markAllAsRead() {
      try {
        const userInfo = Auth.getUserInfo()
        const userId = userInfo.uid || userInfo._id || userInfo.id
        const db = uniCloud.database()
        
        uni.showLoading({ title: '处理中...' })
        
        await db.collection('botc-system-messages')
          .where({
            user_id: userId,
            is_read: false
          })
          .update({
            is_read: true,
            read_at: Date.now()
          })
        
        // 更新本地数据
        this.messages.forEach(m => {
          if (!m.is_read) {
            m.is_read = true
            m.read_at = Date.now()
          }
        })
        
        this.unreadCount = 0
        
        uni.hideLoading()
        uni.showToast({ title: '已全部标记为已读', icon: 'success' })
        
      } catch (error) {
        console.error('全部标记已读失败:', error)
        uni.hideLoading()
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    },
    
    // 获取类型图标
    getTypeIcon(type) {
      const icons = {
        warning: '⚠️',
        notice: '📢',
        system: 'ℹ️'
      }
      return icons[type] || 'ℹ️'
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
    
    // 确认删除单条消息
    confirmDelete(item) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这条消息吗？',
        success: (res) => {
          if (res.confirm) {
            this.deleteMessage(item._id)
          }
        }
      })
    },
    
    // 删除单条消息
    async deleteMessage(messageId) {
      try {
        uni.showLoading({ title: '删除中...' })
        
        // 调用云对象删除消息
        const res = await this.systemObj.deleteSystemMessage(messageId, false)
        
        uni.hideLoading()
        
        if (res && res.code === 0) {
          uni.showToast({ title: '删除成功', icon: 'success' })
          // 从列表中移除
          this.messages = this.messages.filter(m => m._id !== messageId)
          // 更新未读数量
          this.loadUnreadCount()
        } else {
          uni.showToast({ title: res?.message || '删除失败', icon: 'none' })
        }
      } catch (error) {
        uni.hideLoading()
        console.error('删除消息失败:', error)
        uni.showToast({ title: '删除失败', icon: 'none' })
      }
    },
    
    // 确认全部删除
    confirmDeleteAll() {
      uni.showModal({
        title: '确认删除',
        content: `确定要删除全部${this.messages.length}条消息吗？此操作不可恢复。`,
        confirmColor: '#FF4D4F',
        success: (res) => {
          if (res.confirm) {
            this.deleteAllMessages()
          }
        }
      })
    },
    
    // 全部删除
    async deleteAllMessages() {
      try {
        uni.showLoading({ title: '删除中...' })
        
        // 调用云对象删除所有消息
        const res = await this.systemObj.deleteSystemMessage(null, true)
        
        uni.hideLoading()
        
        if (res && res.code === 0) {
          uni.showToast({ title: '已删除全部消息', icon: 'success' })
          this.messages = []
          this.unreadCount = 0
        } else {
          uni.showToast({ title: res?.message || '删除失败', icon: 'none' })
        }
      } catch (error) {
        uni.hideLoading()
        console.error('删除全部消息失败:', error)
        uni.showToast({ title: '删除失败', icon: 'none' })
      }
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #F5F5F5;
}

/* 头部 */
.header {
  background: #FFFFFF;
  padding: 16rpx 24rpx;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12rpx;
  border-bottom: 1px solid #F0F0F0;
  min-height: 60rpx;
}

.header-btn {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 8rpx 16rpx;
  border-radius: 24rpx;
  transition: all 0.3s;
}

.header-btn .btn-icon {
  font-size: 24rpx;
}

.header-btn .btn-text {
  font-size: 24rpx;
  font-weight: 500;
}

.mark-all-read {
  background: #E6F7FF;
  color: #1890FF;
}

.mark-all-read:active {
  background: #BAE7FF;
  transform: scale(0.95);
}

.delete-all-btn {
  background: #FFF1F0;
  color: #FF4D4F;
}

.delete-all-btn:active {
  background: #FFCCC7;
  transform: scale(0.95);
}

/* 消息列表 */
.message-list {
  height: calc(100vh - 60rpx);
}

.loading-box,
.empty-box {
  padding: 120rpx 20rpx;
  text-align: center;
}

.empty-icon {
  display: block;
  font-size: 100rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

/* 消息项 */
.message-item {
  background: #FFFFFF;
  margin-bottom: 2rpx;
  display: flex;
  align-items: center;
  position: relative;
  transition: all 0.3s;
}

.message-item.unread {
  background: #F0F8FF;
}

.message-main {
  flex: 1;
  padding: 32rpx;
  display: flex;
  align-items: flex-start;
}

.message-main:active {
  background: #F5F5F5;
}

.delete-btn {
  width: 100rpx;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  position: relative;
}

.delete-btn::before {
  content: '';
  position: absolute;
  left: 0;
  top: 20%;
  bottom: 20%;
  width: 1rpx;
  background: #F0F0F0;
}

.delete-btn:active {
  background: linear-gradient(to left, #FFF1F0, transparent);
}

.delete-btn:active .delete-icon {
  transform: scale(1.2) rotate(10deg);
}

.delete-icon {
  font-size: 36rpx;
  transition: all 0.3s;
  filter: grayscale(0.3);
}

.message-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 24rpx;
}

.message-icon.icon-warning {
  background: #FFF7E6;
}

.message-icon.icon-notice {
  background: #E6F7FF;
}

.message-icon.icon-system {
  background: #F0F0F0;
}

.icon-text {
  font-size: 40rpx;
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.message-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-time {
  font-size: 24rpx;
  color: #999;
  flex-shrink: 0;
  margin-left: 16rpx;
}

.message-preview {
  font-size: 26rpx;
  color: #666;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 未读标识 */
.unread-dot {
  position: absolute;
  top: 40rpx;
  right: 32rpx;
  width: 16rpx;
  height: 16rpx;
  background: #FF4D4F;
  border-radius: 50%;
}

/* 加载更多 */
.load-more,
.no-more {
  padding: 32rpx;
  text-align: center;
  color: #999;
  font-size: 26rpx;
}
</style>

