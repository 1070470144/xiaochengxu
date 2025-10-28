<template>
  <view class="page">
    <!-- 两个主按钮 -->
    <view class="button-group">
      <view class="main-button search-button" @click="goToList">
        <view class="button-icon">🔍</view>
        <text class="button-text">查找剧本</text>
        <text class="button-desc">搜索、筛选所有剧本</text>
      </view>
      
      <view class="main-button ranking-button" @click="goToRanking">
        <view class="button-icon">📊</view>
        <text class="button-text">查看榜单</text>
        <text class="button-desc">热门、高分、最新榜单</text>
      </view>
    </view>

    <!-- 热门剧本展示 -->
    <view class="hot-section">
      <view class="section-header">
        <text class="section-title">🔥 热门剧本</text>
        <text class="section-more" @click="goToRanking">更多 ></text>
      </view>

      <!-- 加载状态 -->
      <view v-if="loading" class="loading-container">
        <uni-load-more status="loading" />
      </view>

      <!-- 热门剧本列表 -->
      <view v-else class="hot-scripts-list">
        <view 
          v-for="(script, index) in hotScripts" 
          :key="script._id"
          class="script-card"
          @click="goToDetail(script._id)">
          
          <!-- 排名标识 -->
          <view class="rank-number" :class="getRankClass(index)">
            {{ index + 1 }}
          </view>

          <!-- 剧本封面 -->
          <image 
            class="script-cover" 
            :src="getScriptCover(script)" 
            mode="aspectFill" />

          <!-- 剧本信息 -->
          <view class="script-info">
            <text class="script-title">{{ script.title }}</text>
            <text v-if="script.subtitle" class="script-subtitle">{{ script.subtitle }}</text>
            
            <!-- 评分和类型 -->
            <view class="script-meta">
              <view class="meta-rating">
                <text class="rating-score">⭐{{ script.rating ? script.rating.toFixed(1) : '0.0' }}</text>
                <text class="rating-count">({{ script.rating_count || 0 }})</text>
              </view>
              <view class="script-type" :class="getTypeClass(script.script_type)">
                {{ getTypeText(script.script_type) }}
              </view>
            </view>

            <!-- 剧本详情 -->
            <view class="script-details">
              <text class="detail-item">👥{{ script.player_count || '未知' }}</text>
              <text class="detail-item">⏱️{{ script.duration || '?' }}分</text>
              <text class="detail-item">👁️{{ script.view_count || 0 }}</text>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="hotScripts.length === 0" class="empty-state">
          <text class="empty-text">暂无热门剧本</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
const db = uniCloud.database()

export default {
  name: 'ScriptIndex',
  
  data() {
    return {
      hotScripts: [],
      loading: false
    }
  },

  onLoad() {
    this.loadHotScripts()
  },

  onShow() {
    this.loadHotScripts()
  },

  onPullDownRefresh() {
    this.loadHotScripts()
    setTimeout(() => {
      uni.stopPullDownRefresh()
    }, 1000)
  },

  methods: {
    // 加载热门剧本
    async loadHotScripts() {
      this.loading = true
      try {
        const res = await db.collection('botc-scripts')
          .where({ status: 1 })
          .orderBy('view_count', 'desc')
          .limit(10)
          .get()
        
        this.hotScripts = res.result.data
      } catch (error) {
        console.error('加载热门剧本失败：', error)
        uni.showToast({ title: '加载失败', icon: 'none' })
      } finally {
        this.loading = false
      }
    },

    // 跳转到剧本列表
    goToList() {
      uni.navigateTo({
        url: '/pages/script/list/list'
      })
    },

    // 跳转到榜单页面
    goToRanking() {
      uni.navigateTo({
        url: '/pages/script/ranking/ranking'
      })
    },

    // 跳转到剧本详情
    goToDetail(id) {
      uni.navigateTo({
        url: `/pages/script/detail/detail?id=${id}`
      })
    },

    // 获取类型文本
    getTypeText(type) {
      return type === 1 ? '推理' : '娱乐'
    },

    // 获取类型样式
    getTypeClass(type) {
      return type === 1 ? 'type-mystery' : 'type-fun'
    },

    // 获取排名样式
    getRankClass(index) {
      if (index === 0) return 'rank-1'
      if (index === 1) return 'rank-2'
      if (index === 2) return 'rank-3'
      return 'rank-normal'
    },
    
    // 获取剧本封面（优先使用用户上传图片，其次生成艺术字）
    getScriptCover(script) {
      // 1. 优先使用用户上传的图片
      if (script.user_images && script.user_images.length > 0) {
        // 随机选择一张用户上传的图片
        const randomIndex = Math.floor(Math.random() * script.user_images.length)
        return script.user_images[randomIndex]
      }
      
      // 2. 生成艺术字缩略图（使用剧本名称）
      return this.generateTitleImage(script.title || '未命名')
    },
    
    // 生成艺术字缩略图（使用 Canvas 或 SVG）
    generateTitleImage(title) {
      // 取标题前2-4个字
      const displayText = title.length > 4 ? title.substring(0, 4) : title
      
      // 生成渐变色配置
      const colors = [
        ['#667eea', '#764ba2'],  // 紫色渐变
        ['#f093fb', '#f5576c'],  // 粉红渐变
        ['#4facfe', '#00f2fe'],  // 蓝色渐变
        ['#43e97b', '#38f9d7'],  // 绿色渐变
        ['#fa709a', '#fee140'],  // 橙粉渐变
        ['#30cfd0', '#330867'],  // 蓝紫渐变
        ['#a8edea', '#fed6e3'],  // 薄荷粉渐变
        ['#ff9a9e', '#fecfef'],  // 柔粉渐变
      ]
      
      // 根据标题生成固定的颜色索引（同一标题总是相同颜色）
      const hash = this.hashCode(title)
      const colorPair = colors[Math.abs(hash) % colors.length]
      
      // 生成 SVG 艺术字
      const svg = `
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad-${Date.now()}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colorPair[0]};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colorPair[1]};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="200" height="200" fill="url(#grad-${Date.now()})" />
  <text x="50%" y="50%" 
        text-anchor="middle" 
        dominant-baseline="middle" 
        fill="white" 
        font-size="${title.length <= 2 ? '56' : '48'}" 
        font-weight="bold" 
        font-family="Arial, sans-serif"
        stroke="rgba(0,0,0,0.2)"
        stroke-width="1">
    ${displayText}
  </text>
</svg>`.trim()
      
      // 转换为 base64
      const base64 = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)))
      return base64
    },
    
    // 生成字符串哈希值（确保同一标题总是得到相同的颜色）
    hashCode(str) {
      let hash = 0
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // 转换为32位整数
      }
      return hash
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 40rpx;
}

/* 两个主按钮 */
.button-group {
  display: flex;
  gap: 20rpx;
  padding: 30rpx;
}

.main-button {
  flex: 1;
  height: 280rpx;
  border-radius: 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.main-button:active {
  transform: scale(0.95);
  opacity: 0.9;
}

.search-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.ranking-button {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.button-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.button-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 10rpx;
}

.button-desc {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

/* 热门剧本区域 */
.hot-section {
  background: #fff;
  margin: 0 20rpx;
  border-radius: 20rpx;
  padding: 30rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.section-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.section-more {
  font-size: 26rpx;
  color: #999;
}

/* 加载状态 */
.loading-container {
  display: flex;
  justify-content: center;
  padding: 60rpx 0;
}

/* 热门剧本列表 */
.hot-scripts-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

/* 剧本卡片 */
.script-card {
  position: relative;
  display: flex;
  background: #f8f8f8;
  border-radius: 16rpx;
  overflow: hidden;
  transition: all 0.3s;
}

.script-card:active {
  transform: scale(0.98);
  background: #f0f0f0;
}

/* 排名标识 */
.rank-number {
  position: absolute;
  top: 15rpx;
  left: 15rpx;
  width: 60rpx;
  height: 60rpx;
  border-radius: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: bold;
  color: #fff;
  z-index: 10;
}

.rank-1 { background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); }
.rank-2 { background: linear-gradient(135deg, #C0C0C0 0%, #808080 100%); }
.rank-3 { background: linear-gradient(135deg, #CD7F32 0%, #8B4513 100%); }
.rank-normal { background: rgba(0, 0, 0, 0.5); font-size: 26rpx; }

/* 剧本封面 */
.script-cover {
  width: 200rpx;
  height: 200rpx;
  flex-shrink: 0;
  background: #ddd;
}

/* 剧本信息 */
.script-info {
  flex: 1;
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.script-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.script-subtitle {
  font-size: 24rpx;
  color: #8B4513;
  margin-top: 8rpx;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 评分和类型 */
.script-meta {
  display: flex;
  align-items: center;
  gap: 15rpx;
  margin-top: 15rpx;
}

.meta-rating {
  display: flex;
  align-items: center;
  gap: 5rpx;
}

.rating-score {
  font-size: 26rpx;
  font-weight: bold;
  color: #ff6b35;
}

.rating-count {
  font-size: 22rpx;
  color: #999;
}

.script-type {
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  color: #fff;
}

.type-mystery { background: #1890ff; }
.type-fun { background: #52c41a; }

/* 剧本详情 */
.script-details {
  display: flex;
  gap: 20rpx;
  margin-top: 15rpx;
}

.detail-item {
  font-size: 22rpx;
  color: #666;
}

/* 空状态 */
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60rpx 0;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}
</style>

