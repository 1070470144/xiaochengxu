<template>
  <view class="page">
    <view v-if="loading" class="loading-box">
      <uni-load-more status="loading"></uni-load-more>
    </view>
    
    <view v-else-if="message" class="message-detail">
      <!-- 消息类型图标 -->
      <view class="message-icon" :class="'icon-' + message.type">
        <text class="icon-text">{{ getTypeIcon(message.type) }}</text>
      </view>
      
      <!-- 消息标题 -->
      <text class="message-title">{{ message.title }}</text>
      
      <!-- 消息时间 -->
      <text class="message-time">{{ formatTime(message.created_at) }}</text>
      
      <!-- 消息内容 -->
      <view class="message-content">
        <text class="content-text">{{ message.content }}</text>
      </view>
      
      <!-- 相关内容 -->
      <view v-if="message.related_type && message.related_id" class="related-section">
        <text class="related-label">相关内容</text>
        <view class="related-button" @click="viewRelated">
          <text>查看详情</text>
          <text class="arrow">›</text>
        </view>
      </view>
    </view>
    
    <view v-else class="empty-box">
      <text class="empty-text">消息不存在</text>
    </view>
  </view>
</template>

<script>
import Auth from '@/utils/auth.js'

export default {
  name: 'MessageDetail',
  
  data() {
    return {
      messageId: '',
      message: null,
      loading: false
    }
  },
  
  onLoad(options) {
    // 初始化 system 云对象
    this.systemObj = uniCloud.importObject('system', { customUI: true })
    if (options.id) {
      this.messageId = options.id
      this.loadMessage()
    }
  },
  
  methods: {
    // 加载消息详情
    async loadMessage() {
      this.loading = true
      
      try {
        const userInfo = Auth.getUserInfo()
        if (!userInfo) {
          uni.showToast({ title: '请先登录', icon: 'none' })
          return
        }
        
        const userId = userInfo.uid || userInfo._id || userInfo.id
        if (!userId) {
          uni.showToast({ title: '用户ID获取失败', icon: 'none' })
          return
        }
        
        console.log('=== 查询消息详情 ===')
        console.log('消息ID:', this.messageId)
        
        // 使用云对象查询消息详情
        const res = await this.systemObj.getSystemMessages(1, 20, this.messageId)
        
        console.log('消息详情查询结果:', res)
        
        if (res && res.code === 0) {
          this.message = res.data
          console.log('✅ 消息详情加载成功')
        } else {
          console.error('❌ 查询失败:', res?.message)
          uni.showToast({ 
            title: res?.message || '加载失败', 
            icon: 'none' 
          })
        }
      } catch (error) {
        console.error('加载消息失败:', error)
        uni.showToast({ title: '加载失败: ' + error.message, icon: 'none' })
      } finally {
        this.loading = false
      }
    },
    
    // 查看相关内容
    viewRelated() {
      if (!this.message.related_type || !this.message.related_id) return
      
      if (this.message.related_type === 'post') {
        uni.navigateTo({
          url: `/pages/community/detail/detail?id=${this.message.related_id}`
        })
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
      const date = new Date(timestamp)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #F5F5F5;
  padding: 32rpx;
}

.loading-box,
.empty-box {
  padding: 120rpx 20rpx;
  text-align: center;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

.message-detail {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 消息图标 */
.message-icon {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32rpx;
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
  font-size: 64rpx;
}

/* 消息标题 */
.message-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-bottom: 16rpx;
}

/* 消息时间 */
.message-time {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 32rpx;
}

/* 消息内容 */
.message-content {
  width: 100%;
  padding: 32rpx 0;
  border-top: 1px solid #F0F0F0;
  border-bottom: 1px solid #F0F0F0;
}

.content-text {
  font-size: 28rpx;
  color: #666;
  line-height: 1.8;
  display: block;
}

/* 相关内容 */
.related-section {
  width: 100%;
  margin-top: 32rpx;
}

.related-label {
  font-size: 24rpx;
  color: #999;
  display: block;
  margin-bottom: 16rpx;
}

.related-button {
  background: #F5F5F5;
  padding: 24rpx;
  border-radius: 12rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 28rpx;
  color: #1890FF;
}

.related-button:active {
  background: #E8E8E8;
}

.arrow {
  font-size: 32rpx;
  font-weight: bold;
}
</style>

