<template>
  <view class="page">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <uni-search-bar 
        v-model="searchKeyword"
        placeholder="搜索剧本名称、作者"
        @confirm="handleSearch"
        @clear="handleClear"
        :focus="false"
        bg-color="#ffffff"
        cancel-button="none">
      </uni-search-bar>
    </view>

    <!-- 榜单列表 -->
    <scroll-view scroll-y class="rankings-container">
      <!-- 最新剧本榜单 -->
      <view class="ranking-section">
        <view class="section-header">
          <text class="section-title">📘 最新剧本</text>
          <text class="section-more" @click="viewMore('new')">更多 ></text>
        </view>
        <scroll-view scroll-x class="script-scroll">
          <view class="script-list-horizontal">
            <view 
              v-for="script in latestScripts" 
              :key="script._id"
              class="script-card-horizontal"
              @click="goToDetail(script._id)">
              <image 
                class="script-cover" 
                :src="getScriptThumbnail(script)" 
                mode="aspectFill" />
              <view class="script-info">
                <text class="script-name">{{ script.title }}</text>
                <view class="script-meta">
                  <text class="meta-text">⭐{{ script.average_rating ? script.average_rating.toFixed(1) : '0.0' }}</text>
                  <text class="meta-text">👥{{ script.player_count }}</text>
                </view>
                <view class="script-type-tag" :class="getTypeClass(script.script_type)">
                  {{ getTypeText(script.script_type) }}
                </view>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 萌萌想玩热榜 -->
      <view class="ranking-section">
        <view class="section-header">
          <text class="section-title">🔥 萌萌想玩热榜</text>
          <text class="section-more" @click="viewMore('hot')">更多 ></text>
        </view>
        <scroll-view scroll-x class="script-scroll">
          <view class="script-list-horizontal">
            <view 
              v-for="(script, index) in hotScripts" 
              :key="script._id"
              class="script-card-horizontal hot-card"
              @click="goToDetail(script._id)">
              <view class="rank-badge" :class="getRankClass(index)">{{ index + 1 }}</view>
              <image 
                class="script-cover" 
                :src="getScriptThumbnail(script)" 
                mode="aspectFill" />
              <view class="script-info">
                <text class="script-name">{{ script.title }}</text>
                <view class="script-meta">
                  <text class="meta-text">⭐{{ script.average_rating ? script.average_rating.toFixed(1) : '0.0' }}</text>
                  <text class="meta-text">👁️{{ script.view_count || 0 }}</text>
                </view>
                <view class="hot-tag">🔥热门</view>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 近期推理剧本 -->
      <view class="ranking-section">
        <view class="section-header">
          <text class="section-title">🔍 近期推理剧本</text>
          <text class="section-more" @click="viewMore('recent-mystery')">更多 ></text>
        </view>
        <scroll-view scroll-x class="script-scroll">
          <view class="script-list-horizontal">
            <view 
              v-for="script in recentMysteryScripts" 
              :key="script._id"
              class="script-card-horizontal"
              @click="goToDetail(script._id)">
              <image 
                class="script-cover" 
                :src="getScriptThumbnail(script)" 
                mode="aspectFill" />
              <view class="script-info">
                <text class="script-name">{{ script.title }}</text>
                <view class="script-meta">
                  <text class="meta-text">⭐{{ script.average_rating ? script.average_rating.toFixed(1) : '0.0' }}</text>
                  <text class="meta-text">⏱️{{ script.duration }}分</text>
                </view>
                <view class="difficulty-tag" :class="getDifficultyClass(script.difficulty)">
                  {{ getDifficultyText(script.difficulty) }}
                </view>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 近期娱乐剧本 -->
      <view class="ranking-section">
        <view class="section-header">
          <text class="section-title">🎉 近期娱乐剧本</text>
          <text class="section-more" @click="viewMore('recent-fun')">更多 ></text>
        </view>
        <scroll-view scroll-x class="script-scroll">
          <view class="script-list-horizontal">
            <view 
              v-for="script in recentFunScripts" 
              :key="script._id"
              class="script-card-horizontal"
              @click="goToDetail(script._id)">
              <image 
                class="script-cover" 
                :src="getScriptThumbnail(script)" 
                mode="aspectFill" />
              <view class="script-info">
                <text class="script-name">{{ script.title }}</text>
                <view class="script-meta">
                  <text class="meta-text">⭐{{ script.average_rating ? script.average_rating.toFixed(1) : '0.0' }}</text>
                  <text class="meta-text">👥{{ script.player_count }}</text>
                </view>
                <view class="fun-tag">🎊娱乐</view>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 萌萌推理高分榜单 -->
      <view class="ranking-section">
        <view class="section-header">
          <text class="section-title">🏆 萌萌推理高分榜</text>
          <text class="section-more" @click="viewMore('top-mystery')">更多 ></text>
        </view>
        <scroll-view scroll-x class="script-scroll">
          <view class="script-list-horizontal">
            <view 
              v-for="(script, index) in topMysteryScripts" 
              :key="script._id"
              class="script-card-horizontal top-card"
              @click="goToDetail(script._id)">
              <view class="rank-badge" :class="getRankClass(index)">{{ index + 1 }}</view>
              <image 
                class="script-cover" 
                :src="getScriptThumbnail(script)" 
                mode="aspectFill" />
              <view class="script-info">
                <text class="script-name">{{ script.title }}</text>
                <view class="script-meta">
                  <text class="meta-text rating-highlight">⭐{{ script.average_rating ? script.average_rating.toFixed(1) : '0.0' }}</text>
                  <text class="meta-text">({{ script.rating_count || 0 }}评)</text>
                </view>
                <view class="top-tag top-tag-mystery">🏆高分推理</view>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 萌萌娱乐高分榜单 -->
      <view class="ranking-section">
        <view class="section-header">
          <text class="section-title">🏆 萌萌娱乐高分榜</text>
          <text class="section-more" @click="viewMore('top-fun')">更多 ></text>
        </view>
        <scroll-view scroll-x class="script-scroll">
          <view class="script-list-horizontal">
            <view 
              v-for="(script, index) in topFunScripts" 
              :key="script._id"
              class="script-card-horizontal top-card"
              @click="goToDetail(script._id)">
              <view class="rank-badge" :class="getRankClass(index)">{{ index + 1 }}</view>
              <image 
                class="script-cover" 
                :src="getScriptThumbnail(script)" 
                mode="aspectFill" />
              <view class="script-info">
                <text class="script-name">{{ script.title }}</text>
                <view class="script-meta">
                  <text class="meta-text rating-highlight">⭐{{ script.average_rating ? script.average_rating.toFixed(1) : '0.0' }}</text>
                  <text class="meta-text">({{ script.rating_count || 0 }}评)</text>
                </view>
                <view class="top-tag top-tag-fun">🏆高分娱乐</view>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
const db = uniCloud.database()
const dbCmd = db.command

export default {
  name: 'ScriptRanking',
  
  data() {
    return {
      searchKeyword: '',
      latestScripts: [],
      hotScripts: [],
      recentMysteryScripts: [],
      recentFunScripts: [],
      topMysteryScripts: [],
      topFunScripts: [],
      loading: false
    }
  },

  onLoad() {
    this.loadAllRankings()
  },

  onShow() {
    this.loadAllRankings()
  },

  onPullDownRefresh() {
    this.loadAllRankings()
    setTimeout(() => {
      uni.stopPullDownRefresh()
    }, 1000)
  },

  methods: {
    async loadAllRankings() {
      if (this.loading) return
      this.loading = true

      try {
        await Promise.all([
          this.loadLatestScripts(),
          this.loadHotScripts(),
          this.loadRecentMysteryScripts(),
          this.loadRecentFunScripts(),
          this.loadTopMysteryScripts(),
          this.loadTopFunScripts()
        ])
      } catch (error) {
        console.error('加载榜单失败：', error)
        uni.showToast({ title: '加载失败', icon: 'none' })
      } finally {
        this.loading = false
      }
    },

    async loadLatestScripts() {
      const res = await db.collection('botc-scripts')
        .where({ status: 1 })
        .orderBy('published_at', 'desc')
        .limit(10)
        .get()
      this.latestScripts = res.result.data
    },

    async loadHotScripts() {
      const res = await db.collection('botc-scripts')
        .where({ status: 1 })
        .orderBy('view_count', 'desc')
        .limit(10)
        .get()
      this.hotScripts = res.result.data
    },

    async loadRecentMysteryScripts() {
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
      const res = await db.collection('botc-scripts')
        .where({
          status: 1,
          script_type: 1,
          published_at: dbCmd.gte(thirtyDaysAgo)
        })
        .orderBy('published_at', 'desc')
        .limit(10)
        .get()
      this.recentMysteryScripts = res.result.data
    },

    async loadRecentFunScripts() {
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
      const res = await db.collection('botc-scripts')
        .where({
          status: 1,
          script_type: 2,
          published_at: dbCmd.gte(thirtyDaysAgo)
        })
        .orderBy('published_at', 'desc')
        .limit(10)
        .get()
      this.recentFunScripts = res.result.data
    },

    async loadTopMysteryScripts() {
      console.log('=== 加载推理高分榜单 ===')
      
      // 先查询所有推理剧本，看看数据情况
      const allRes = await db.collection('botc-scripts')
        .where({
          status: 1,
          script_type: 1
        })
        .field({
          _id: true,
          title: true,
          average_rating: true,
          rating_count: true
        })
        .get()
      
      console.log('所有推理剧本:', allRes.result.data.length, '个')
      console.log('推理剧本评分情况:', allRes.result.data.map(s => ({
        title: s.title,
        avg: s.average_rating,
        count: s.rating_count
      })))
      
      // 查询有评分的推理剧本（降低门槛）
      const res = await db.collection('botc-scripts')
        .where({
          status: 1,
          script_type: 1,
          average_rating: dbCmd.gt(0), // 只要有评分就行
          rating_count: dbCmd.gt(0) // 只要有人评价就行
        })
        .orderBy('average_rating', 'desc')
        .orderBy('rating_count', 'desc')
        .limit(20)
        .get()
      
      console.log('有评分的推理剧本查询结果:', res.result.data.length, '个')
      
      if (res.result.data.length === 0) {
        console.warn('⚠️ 没有找到有评分的推理剧本')
        this.topMysteryScripts = []
        return
      }
      
      // 按综合分数排序（评分 * 评价人数权重）
      const scripts = res.result.data.map(script => {
        const ratingWeight = Math.min(script.rating_count / 10, 1) // 评价人数权重，最多1
        const comprehensiveScore = script.average_rating * (0.7 + 0.3 * ratingWeight)
        return {
          ...script,
          comprehensiveScore
        }
      })
      
      scripts.sort((a, b) => b.comprehensiveScore - a.comprehensiveScore)
      this.topMysteryScripts = scripts.slice(0, 10)
      
      console.log('✅ 推理高分榜TOP10:', this.topMysteryScripts.map(s => ({
        title: s.title,
        rating: s.average_rating,
        count: s.rating_count,
        score: s.comprehensiveScore.toFixed(2)
      })))
    },

    async loadTopFunScripts() {
      console.log('=== 加载娱乐高分榜单 ===')
      
      // 先查询所有娱乐剧本，看看数据情况
      const allRes = await db.collection('botc-scripts')
        .where({
          status: 1,
          script_type: 2
        })
        .field({
          _id: true,
          title: true,
          average_rating: true,
          rating_count: true
        })
        .get()
      
      console.log('所有娱乐剧本:', allRes.result.data.length, '个')
      console.log('娱乐剧本评分情况:', allRes.result.data.map(s => ({
        title: s.title,
        avg: s.average_rating,
        count: s.rating_count
      })))
      
      // 查询有评分的娱乐剧本（降低门槛）
      const res = await db.collection('botc-scripts')
        .where({
          status: 1,
          script_type: 2,
          average_rating: dbCmd.gt(0), // 只要有评分就行
          rating_count: dbCmd.gt(0) // 只要有人评价就行
        })
        .orderBy('average_rating', 'desc')
        .orderBy('rating_count', 'desc')
        .limit(20)
        .get()
      
      console.log('有评分的娱乐剧本查询结果:', res.result.data.length, '个')
      
      if (res.result.data.length === 0) {
        console.warn('⚠️ 没有找到有评分的娱乐剧本')
        this.topFunScripts = []
        return
      }
      
      // 按综合分数排序（评分 * 评价人数权重）
      const scripts = res.result.data.map(script => {
        const ratingWeight = Math.min(script.rating_count / 10, 1) // 评价人数权重，最多1
        const comprehensiveScore = script.average_rating * (0.7 + 0.3 * ratingWeight)
        return {
          ...script,
          comprehensiveScore
        }
      })
      
      scripts.sort((a, b) => b.comprehensiveScore - a.comprehensiveScore)
      this.topFunScripts = scripts.slice(0, 10)
      
      console.log('✅ 娱乐高分榜TOP10:', this.topFunScripts.map(s => ({
        title: s.title,
        rating: s.average_rating,
        count: s.rating_count,
        score: s.comprehensiveScore.toFixed(2)
      })))
    },

    handleSearch(e) {
      const keyword = e.value || e
      if (keyword) {
        uni.navigateTo({
          url: `/pages/script/list/list?keyword=${keyword}`
        })
      }
    },

    handleClear() {
      this.searchKeyword = ''
    },

    viewMore(type) {
      console.log('点击更多，类型:', type)
      
      // 根据不同榜单类型，跳转到对应的筛选页面
      let targetType = 'all'
      
      switch (type) {
        case 'new':
          // 最新剧本 -> 最新
          targetType = 'new'
          break
        case 'hot':
          // 萌萌想玩热榜 -> 最热
          targetType = 'hot'
          break
        case 'recent-mystery':
          // 近期推理剧本 -> 推理
          targetType = 'mystery'
          break
        case 'recent-fun':
          // 近期娱乐剧本 -> 娱乐
          targetType = 'fun'
          break
        case 'top-mystery':
          // 萌萌推理高分榜 -> 高分（单选）
          targetType = 'rating'
          break
        case 'top-fun':
          // 萌萌娱乐高分榜 -> 高分（单选）
          targetType = 'rating'
          break
        default:
          targetType = 'all'
      }
      
      console.log('跳转类型:', targetType)
      
      uni.navigateTo({
        url: `/pages/script/list/list?type=${targetType}`
      })
    },

    goToDetail(id) {
      uni.navigateTo({
        url: `/pages/script/detail/detail?id=${id}`
      })
    },

    getTypeText(type) {
      return type === 1 ? '推理' : '娱乐'
    },

    getTypeClass(type) {
      return type === 1 ? 'type-mystery' : 'type-fun'
    },

    getDifficultyText(difficulty) {
      const map = { 1: '简单', 2: '中等', 3: '困难', 4: '专家' }
      return map[difficulty] || '未知'
    },

    getDifficultyClass(difficulty) {
      const map = { 1: 'diff-easy', 2: 'diff-normal', 3: 'diff-hard', 4: 'diff-expert' }
      return map[difficulty] || ''
    },

    getRankClass(index) {
      if (index === 0) return 'rank-1'
      if (index === 1) return 'rank-2'
      if (index === 2) return 'rank-3'
      return 'rank-other'
    },
    
    // 获取剧本缩略图（优先用户上传，随机选择）
    getScriptThumbnail(script) {
      // 1. 优先使用用户上传的图片（随机选择一张）
      if (script.user_images && script.user_images.length > 0) {
        const randomIndex = Math.floor(Math.random() * script.user_images.length)
        return script.user_images[randomIndex]
      }
      
      // 2. 没有用户上传图片，使用自动生成的预览图
      if (script.preview_image) {
        return script.preview_image
      }
      
      // 3. 都没有，使用默认图片
      return '/static/logo.png'
    }
  }
}
</script>

<style scoped>
.page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.search-bar {
  background: #fff;
  padding: 20rpx;
  border-bottom: 1px solid #e8e8e8;
}

.rankings-container {
  flex: 1;
  overflow-y: auto;
}

.ranking-section {
  background: #fff;
  margin-bottom: 20rpx;
  padding: 30rpx 0 20rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 30rpx 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.section-more {
  font-size: 26rpx;
  color: #999;
}

.script-scroll {
  white-space: nowrap;
}

.script-list-horizontal {
  display: inline-flex;
  padding: 0 30rpx;
  gap: 20rpx;
}

.script-card-horizontal {
  position: relative;
  display: inline-block;
  width: 240rpx;
  background: #f8f8f8;
  border-radius: 16rpx;
  overflow: hidden;
}

.script-cover {
  width: 100%;
  height: 320rpx;
  background: #ddd;
}

.script-info {
  padding: 20rpx;
}

.script-name {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 80rpx;
}

.script-meta {
  display: flex;
  gap: 15rpx;
  margin-top: 15rpx;
}

.meta-text {
  font-size: 22rpx;
  color: #666;
}

.rating-highlight {
  color: #ff6b35;
  font-weight: bold;
}

.rank-badge {
  position: absolute;
  top: 15rpx;
  left: 15rpx;
  width: 50rpx;
  height: 50rpx;
  border-radius: 25rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  font-weight: bold;
  color: #fff;
  z-index: 10;
}

.rank-1 { background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); }
.rank-2 { background: linear-gradient(135deg, #C0C0C0 0%, #808080 100%); }
.rank-3 { background: linear-gradient(135deg, #CD7F32 0%, #8B4513 100%); }
.rank-other { background: rgba(0, 0, 0, 0.5); }

.script-type-tag,
.hot-tag,
.fun-tag,
.top-tag,
.difficulty-tag {
  display: inline-block;
  margin-top: 15rpx;
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  color: #fff;
}

.type-mystery { background: #1890ff; }
.type-fun { background: #52c41a; }
.hot-tag { background: #ff4d4f; }
.fun-tag { background: #52c41a; }
.top-tag { background: #faad14; }
.top-tag-mystery { 
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-weight: bold;
}
.top-tag-fun { 
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  font-weight: bold;
}

.diff-easy { background: #52c41a; }
.diff-normal { background: #1890ff; }
.diff-hard { background: #faad14; }
.diff-expert { background: #f5222d; }
</style>

