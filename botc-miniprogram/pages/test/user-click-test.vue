<template>
  <view class="test-page">
    <view class="test-section">
      <text class="section-title">用户点击功能测试</text>
      
      <!-- 测试按钮 -->
      <view class="test-item">
        <text class="test-label">1. 测试 UserAction.showUserMenu</text>
        <button class="test-btn" @click="testShowMenu">点击测试</button>
      </view>
      
      <!-- 测试直接跳转 -->
      <view class="test-item">
        <text class="test-label">2. 测试 UserAction.goToChat</text>
        <button class="test-btn" @click="testGoToChat">点击测试</button>
      </view>
      
      <!-- 测试模拟帖子数据 -->
      <view class="test-item">
        <text class="test-label">3. 模拟帖子用户点击</text>
        <view class="mock-post">
          <image 
            class="mock-avatar clickable" 
            src="/static/logo.png"
            @click.stop="handleUserClick(mockUserId, mockUserInfo)"
          />
          <view class="mock-info" @click.stop="handleUserClick(mockUserId, mockUserInfo)">
            <text class="mock-nickname clickable">测试用户</text>
            <text class="mock-desc">点击头像或昵称测试</text>
          </view>
        </view>
      </view>
      
      <!-- 控制台输出 -->
      <view class="test-item">
        <text class="test-label">控制台输出：</text>
        <scroll-view class="console-output" scroll-y>
          <view v-for="(log, index) in logs" :key="index" class="log-item">
            {{ log }}
          </view>
        </scroll-view>
      </view>
      
      <!-- 清空日志 -->
      <button class="clear-btn" @click="clearLogs">清空日志</button>
    </view>
  </view>
</template>

<script>
import UserAction from '@/utils/user-action.js'
import Auth from '@/utils/auth.js'

export default {
  name: 'UserClickTest',
  
  data() {
    return {
      logs: [],
      mockUserId: 'test_user_123',
      mockUserInfo: {
        nickname: '测试用户',
        avatar: '/static/logo.png'
      }
    }
  },
  
  onLoad() {
    this.addLog('页面加载完成')
    this.addLog('当前登录状态: ' + (Auth.isLogin() ? '已登录' : '未登录'))
    
    // 拦截 console.log
    const originalLog = console.log
    console.log = (...args) => {
      this.addLog(args.join(' '))
      originalLog.apply(console, args)
    }
  },
  
  methods: {
    testShowMenu() {
      this.addLog('【测试1】调用 UserAction.showUserMenu')
      try {
        UserAction.showUserMenu(this.mockUserId, this.mockUserInfo)
        this.addLog('【测试1】调用成功')
      } catch (error) {
        this.addLog('【测试1】调用失败: ' + error.message)
      }
    },
    
    testGoToChat() {
      this.addLog('【测试2】调用 UserAction.goToChat')
      try {
        UserAction.goToChat(this.mockUserId, this.mockUserInfo)
        this.addLog('【测试2】调用成功')
      } catch (error) {
        this.addLog('【测试2】调用失败: ' + error.message)
      }
    },
    
    handleUserClick(userId, userInfo) {
      this.addLog('【测试3】handleUserClick 被调用')
      this.addLog('userId: ' + userId)
      this.addLog('userInfo: ' + JSON.stringify(userInfo))
      
      if (!userId) {
        this.addLog('警告: userId 为空')
        return
      }
      
      UserAction.showUserMenu(userId, userInfo)
    },
    
    addLog(message) {
      const timestamp = new Date().toLocaleTimeString()
      this.logs.unshift(`[${timestamp}] ${message}`)
      
      // 限制日志数量
      if (this.logs.length > 50) {
        this.logs.pop()
      }
    },
    
    clearLogs() {
      this.logs = []
      this.addLog('日志已清空')
    }
  }
}
</script>

<style scoped>
.test-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 30rpx;
}

.test-section {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
}

.section-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
  display: block;
}

.test-item {
  margin-bottom: 40rpx;
}

.test-label {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 15rpx;
  display: block;
}

.test-btn {
  width: 100%;
  height: 80rpx;
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
  color: white;
  border: none;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.mock-post {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  gap: 20rpx;
}

.mock-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: #ddd;
}

.mock-info {
  flex: 1;
  cursor: pointer;
}

.mock-nickname {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 10rpx;
}

.mock-desc {
  font-size: 24rpx;
  color: #999;
}

.clickable {
  cursor: pointer;
  transition: opacity 0.3s;
}

.clickable:active {
  opacity: 0.6;
}

.console-output {
  height: 400rpx;
  background: #1e1e1e;
  border-radius: 8rpx;
  padding: 20rpx;
  margin-top: 15rpx;
}

.log-item {
  font-size: 24rpx;
  color: #00ff00;
  line-height: 1.6;
  margin-bottom: 10rpx;
  font-family: 'Courier New', monospace;
}

.clear-btn {
  width: 100%;
  height: 70rpx;
  background: #666;
  color: white;
  border: none;
  border-radius: 12rpx;
  font-size: 28rpx;
  margin-top: 20rpx;
}
</style>

