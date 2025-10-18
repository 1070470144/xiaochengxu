<template>
  <view class="page">
    <!-- 页面标题 -->
    <view class="page-title">
      <text class="title-text">工具箱</text>
      <text class="subtitle-text">Blood on the Clocktower</text>
    </view>

    <!-- 工具卡片列表 -->
    <view class="tools-container">
      <!-- 拼车组局 -->
      <view class="tool-card card" @click="goToCarpool">
        <view class="tool-icon carpool">🚗</view>
        <view class="tool-content">
          <text class="tool-title">拼车组局</text>
          <text class="tool-desc">线下游戏，快速组局</text>
        </view>
        <text class="tool-arrow">›</text>
      </view>

      <!-- 剧本上传 -->
      <view class="tool-card card" @click="goToUploadJson">
        <view class="tool-icon upload">📄</view>
        <view class="tool-content">
          <text class="tool-title">剧本上传</text>
          <text class="tool-desc">分享您的剧本JSON</text>
        </view>
        <text class="tool-arrow">›</text>
      </view>

      <!-- 血染百科 -->
      <view class="tool-card card" @click="goToWiki">
        <view class="tool-icon wiki">📚</view>
        <view class="tool-content">
          <text class="tool-title">血染百科</text>
          <text class="tool-desc">规则、角色、攻略</text>
        </view>
        <text class="tool-arrow">›</text>
      </view>

      <!-- 榜单 -->
      <view class="tool-card card" @click="goToRanking">
        <view class="tool-icon ranking">🏆</view>
        <view class="tool-content">
          <text class="tool-title">榜单</text>
          <text class="tool-desc">说书人榜·角色榜</text>
        </view>
        <text class="tool-arrow">›</text>
      </view>

      <!-- 说书人 -->
      <view class="tool-card card" @click="goToStoryteller">
        <view class="tool-icon storyteller">🎭</view>
        <view class="tool-content">
          <text class="tool-title">说书人</text>
          <text class="tool-desc">寻找专业说书人</text>
        </view>
        <text class="tool-arrow">›</text>
      </view>

      <!-- 血染店铺 -->
      <view class="tool-card card" @click="goToShops">
        <view class="tool-icon shop">🏪</view>
        <view class="tool-content">
          <text class="tool-title">血染店铺</text>
          <text class="tool-desc">附近的线下店铺</text>
        </view>
        <text class="tool-arrow">›</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'ToolsIndex',
  
  data() {
    return {
      
    }
  },
  
  methods: {
    // 跳转到拼车列表
    goToCarpool() {
      uni.navigateTo({
        url: '/pages/carpool/list/list'
      })
    },
    
    // 跳转到剧本上传
    goToUploadJson() {
      uni.navigateTo({
        url: '/pages/tools/upload-json/upload-json'
      })
    },
    
    // 跳转到血染百科
    goToWiki() {
      uni.navigateTo({
        url: '/pages/tools/wiki/wiki'
      })
    },
    
    // 跳转到榜单
    goToRanking() {
      uni.navigateTo({
        url: '/pages/ranking/index'
      })
    },
    
    // 跳转到说书人列表
    goToStoryteller() {
      uni.navigateTo({
        url: '/pages/storyteller/list/list'
      })
    },
    
    // 跳转到店铺列表
    goToShops() {
      uni.navigateTo({
        url: '/pages/shop/list/list'
      })
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background-color: #F5F5F5;
  padding-bottom: 40rpx;
}

/* 页面标题 */
.page-title {
  background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%);
  padding: 60rpx 40rpx 40rpx;
  text-align: center;
}

.title-text {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #FFFFFF;
  margin-bottom: 12rpx;
}

.subtitle-text {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
}

/* 工具容器 */
.tools-container {
  padding: 32rpx 24rpx;
}

/* 工具卡片 */
.tool-card {
  display: flex;
  align-items: center;
  padding: 32rpx 28rpx;
  margin-bottom: 24rpx;
  background: #FFFFFF;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(139, 69, 19, 0.08);
  transition: all 0.3s ease;
}

.tool-card:active {
  transform: scale(0.98);
  opacity: 0.9;
}

.tool-card:last-child {
  margin-bottom: 0;
}

/* 工具图标 */
.tool-icon {
  width: 88rpx;
  height: 88rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  margin-right: 24rpx;
  flex-shrink: 0;
}

.tool-icon.carpool {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.tool-icon.upload {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.tool-icon.wiki {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.tool-icon.ranking {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.tool-icon.storyteller {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.tool-icon.shop {
  background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);
}

/* 工具内容 */
.tool-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.tool-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #1A1A1A;
  line-height: 1.4;
}

.tool-desc {
  font-size: 24rpx;
  color: #999999;
  line-height: 1.4;
}

/* 箭头 */
.tool-arrow {
  font-size: 48rpx;
  color: #CCCCCC;
  margin-left: 16rpx;
  flex-shrink: 0;
}

/* 通用卡片样式 */
.card {
  background: #FFFFFF;
  border-radius: 16rpx;
}
</style>

