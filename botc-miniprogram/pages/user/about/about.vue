<template>
  <view class="about-page">
    <!-- Logo和标题 -->
    <view class="header-section">
      <image class="app-logo" src="/static/logo.png" mode="aspectFit" />
      <text class="app-name">血染钟楼</text>
      <text class="app-version">版本 {{ version }}</text>
    </view>

    <!-- 应用介绍 -->
    <view class="intro-section">
      <text class="intro-title">关于血染钟楼</text>
      <text class="intro-text">
        血染钟楼是一款基于经典桌游《Blood on the Clocktower》的社区平台。
        我们为广大玩家提供剧本库、拼车组局、经验分享等服务，让更多人能够享受这款精彩的游戏。
      </text>
    </view>

    <!-- 功能特色 -->
    <view class="features-section">
      <text class="section-title">核心功能</text>
      <view class="feature-item">
        <text class="feature-icon">📚</text>
        <view class="feature-content">
          <text class="feature-name">剧本库</text>
          <text class="feature-desc">海量剧本，角色技能详解</text>
        </view>
      </view>
      <view class="feature-item">
        <text class="feature-icon">🚗</text>
        <view class="feature-content">
          <text class="feature-name">拼车组局</text>
          <text class="feature-desc">快速找到同城玩家</text>
        </view>
      </view>
      <view class="feature-item">
        <text class="feature-icon">💬</text>
        <view class="feature-content">
          <text class="feature-name">社区交流</text>
          <text class="feature-desc">分享心得，结识好友</text>
        </view>
      </view>
      <view class="feature-item">
        <text class="feature-icon">🎭</text>
        <view class="feature-content">
          <text class="feature-name">说书人平台</text>
          <text class="feature-desc">展示风采，组织活动</text>
        </view>
      </view>
    </view>

    <!-- 联系方式 -->
    <view class="contact-section">
      <text class="section-title">联系我们</text>
      <view class="contact-item">
        <text class="contact-label">官方微信</text>
        <text class="contact-value">暂未开通</text>
      </view>
      <view class="contact-item">
        <text class="contact-label">官方QQ群</text>
        <text class="contact-value">暂未开通</text>
      </view>
      <view class="contact-item">
        <text class="contact-label">客服邮箱</text>
        <text class="contact-value">support@botc.com</text>
      </view>
    </view>

    <!-- 法律信息 -->
    <view class="legal-section">
      <view class="legal-links">
        <text class="link-item" @click="viewAgreement('user')">用户协议</text>
        <text class="link-divider">|</text>
        <text class="link-item" @click="viewAgreement('privacy')">隐私政策</text>
      </view>
      <text class="copyright">© 2025 血染钟楼 All Rights Reserved</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'About',
  
  data() {
    return {
      version: '1.0.0'
    }
  },
  
  methods: {
    viewAgreement(type) {
      const urlMap = {
        user: '/pages/user/agreement/agreement?type=user',
        privacy: '/pages/user/agreement/agreement?type=privacy'
      }
      
      uni.navigateTo({
        url: urlMap[type] || urlMap.user
      })
    }
  }
}
</script>

<style scoped>
.about-page {
  min-height: 100vh;
  background: #fff;
  padding-bottom: 40rpx;
}

.header-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 0 60rpx;
  background: linear-gradient(135deg, #A0522D 0%, #8B4513 100%);
}

.app-logo {
  width: 150rpx;
  height: 150rpx;
  border-radius: 30rpx;
  margin-bottom: 20rpx;
}

.app-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 10rpx;
}

.app-version {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.intro-section {
  padding: 40rpx 30rpx;
}

.intro-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 20rpx;
}

.intro-text {
  font-size: 26rpx;
  line-height: 1.8;
  color: #666;
}

.features-section {
  padding: 20rpx 30rpx 40rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 30rpx;
}

.feature-item {
  display: flex;
  align-items: center;
  padding: 25rpx 0;
  border-bottom: 1px solid #f5f5f5;
}

.feature-item:last-child {
  border-bottom: none;
}

.feature-icon {
  font-size: 50rpx;
  margin-right: 20rpx;
}

.feature-content {
  flex: 1;
}

.feature-name {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 5rpx;
}

.feature-desc {
  font-size: 24rpx;
  color: #999;
}

.contact-section {
  padding: 20rpx 30rpx 40rpx;
  background: #f5f5f5;
}

.contact-item {
  display: flex;
  justify-content: space-between;
  padding: 25rpx 0;
  border-bottom: 1px solid #e0e0e0;
}

.contact-item:last-child {
  border-bottom: none;
}

.contact-label {
  font-size: 28rpx;
  color: #333;
}

.contact-value {
  font-size: 26rpx;
  color: #8B4513;
}

.legal-section {
  padding: 40rpx 30rpx;
  text-align: center;
}

.legal-links {
  margin-bottom: 20rpx;
}

.link-item {
  font-size: 26rpx;
  color: #8B4513;
  padding: 0 15rpx;
}

.link-divider {
  color: #ddd;
}

.copyright {
  font-size: 24rpx;
  color: #999;
}
</style>

