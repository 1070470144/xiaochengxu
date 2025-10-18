<template>
  <view class="page">
    <!-- 返回按钮 -->
    <view class="back-bar">
      <view class="back-btn" @click="goBack">
        <view class="btn-content">
          <text class="back-icon">←</text>
          <text class="back-text">返回列表</text>
        </view>
      </view>
    </view>
    
    <view v-if="loading" class="loading">
      <uni-load-more status="loading" />
    </view>
    
    <view v-else-if="entry" class="content">
      <!-- 头部信息 -->
      <view class="header-card card">
        <view class="header-main">
          <image 
            v-if="entry.media && entry.media.icon_url"
            class="icon"
            :src="entry.media.icon_url"
            mode="aspectFit"
          />
          <view class="header-info">
            <text class="title">{{ entry.title }}</text>
            <text v-if="entry.slug" class="subtitle">{{ entry.slug }}</text>
            <view class="meta">
              <text class="meta-item">类型：{{ getTypeText(entry.entry_type) }}</text>
              <text v-if="entry.role_detail && entry.role_detail.character_info" class="meta-item">
                {{ entry.role_detail.character_info.character_type }}
              </text>
            </view>
          </view>
        </view>
        <view class="source-link">
          <text>来源：</text>
          <a :href="entry.source_url" target="_blank">{{ entry.source_name }}</a>
        </view>
      </view>
      
      <!-- 🆕 v2.1: 角色详细内容展示 -->
      <view v-if="entry.entry_type === 'role' && entry.role_detail">
        
        <!-- 背景故事 -->
        <view v-if="entry.role_detail.background_story" class="section-card card">
          <view class="section-header">
            <text class="section-title">📖 背景故事</text>
          </view>
          <view class="section-content">
            <text class="background-story">"{{ entry.role_detail.background_story }}"</text>
          </view>
        </view>
        
        <!-- 角色能力 -->
        <view v-if="entry.role_detail.ability" class="section-card card">
          <view class="section-header">
            <text class="section-title">🎯 角色能力</text>
          </view>
          <view class="section-content">
            <text class="ability-text">{{ entry.role_detail.ability }}</text>
          </view>
        </view>
        
        <!-- 角色简介 -->
        <view v-if="entry.role_detail.introduction && entry.role_detail.introduction.length > 0" class="section-card card">
          <view class="section-header">
            <text class="section-title">📝 角色简介</text>
            <text class="item-count">{{ entry.role_detail.introduction.length }}段</text>
          </view>
          <view class="section-content">
            <view v-for="(para, idx) in entry.role_detail.introduction" :key="idx" class="text-item">
              <text class="item-num">{{ idx + 1 }}.</text>
              <text class="item-text">{{ para }}</text>
            </view>
          </view>
        </view>
        
        <!-- 范例 -->
        <view v-if="entry.role_detail.examples && entry.role_detail.examples.length > 0" class="section-card card">
          <view class="section-header">
            <text class="section-title">📌 范例</text>
            <text class="item-count">{{ entry.role_detail.examples.length }}条</text>
          </view>
          <view class="section-content">
            <view v-for="(example, idx) in entry.role_detail.examples" :key="idx" class="example-box">
              <view class="example-row">
                <text class="example-label">场景：</text>
                <text class="example-value">{{ example.scenario }}</text>
              </view>
              <view class="example-row">
                <text class="example-label">结果：</text>
                <text class="example-value result">{{ example.result }}</text>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 运作方式 -->
        <view v-if="entry.role_detail.mechanics && entry.role_detail.mechanics.length > 0" class="section-card card">
          <view class="section-header">
            <text class="section-title">⚙️ 运作方式</text>
            <text class="item-count">{{ entry.role_detail.mechanics.length }}步</text>
          </view>
          <view class="section-content">
            <view v-for="(step, idx) in entry.role_detail.mechanics" :key="idx" class="text-item">
              <text class="item-num">{{ idx + 1 }}.</text>
              <text class="item-text">{{ step }}</text>
            </view>
          </view>
        </view>
        
        <!-- 提示标记 -->
        <view v-if="entry.role_detail.reminder_tokens && entry.role_detail.reminder_tokens.length > 0" class="section-card card">
          <view class="section-header">
            <text class="section-title">🏷️ 提示标记</text>
            <text class="item-count">{{ entry.role_detail.reminder_tokens.length }}个</text>
          </view>
          <view class="section-content">
            <view v-for="token in entry.role_detail.reminder_tokens" :key="token.name" class="token-box">
              <text class="token-name">{{ token.icon }} {{ token.name }}</text>
              <view class="token-details">
                <text v-for="(detail, idx) in token.details" :key="idx" class="token-detail">
                  • {{ detail }}
                </text>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 规则细节 -->
        <view v-if="entry.role_detail.rule_details && entry.role_detail.rule_details.length > 0" class="section-card card">
          <view class="section-header">
            <text class="section-title">📜 规则细节</text>
            <text class="item-count">{{ entry.role_detail.rule_details.length }}条</text>
          </view>
          <view class="section-content">
            <view v-for="(rule, idx) in entry.role_detail.rule_details" :key="idx" class="text-item">
              <text class="bullet">•</text>
              <text class="item-text">{{ rule }}</text>
            </view>
          </view>
        </view>
        
        <!-- 提示与技巧 -->
        <view v-if="entry.role_detail.tips_and_tricks && entry.role_detail.tips_and_tricks.length > 0" class="section-card card">
          <view class="section-header">
            <text class="section-title">💡 提示与技巧</text>
            <text class="item-count">{{ entry.role_detail.tips_and_tricks.length }}条</text>
          </view>
          <view class="section-content">
            <view v-for="(tip, idx) in entry.role_detail.tips_and_tricks" :key="idx" class="text-item">
              <text class="bullet">•</text>
              <text class="item-text">{{ tip }}</text>
            </view>
          </view>
        </view>
        
        <!-- 伪装方法 -->
        <view v-if="entry.role_detail.bluff_tips && entry.role_detail.bluff_tips.length > 0" class="section-card card">
          <view class="section-header">
            <text class="section-title">🎭 伪装方法</text>
            <text class="item-count">{{ entry.role_detail.bluff_tips.length }}条</text>
          </view>
          <view class="section-content">
            <view v-for="(bluff, idx) in entry.role_detail.bluff_tips" :key="idx" class="text-item">
              <text class="bullet">•</text>
              <text class="item-text">{{ bluff }}</text>
            </view>
          </view>
        </view>
        
        <!-- 角色信息 -->
        <view v-if="entry.role_detail.character_info" class="section-card card">
          <view class="section-header">
            <text class="section-title">ℹ️ 角色信息</text>
          </view>
          <view class="section-content">
            <view class="info-table">
              <view v-if="entry.role_detail.character_info.english_name" class="info-row">
                <text class="info-label">英文名</text>
                <text class="info-value">{{ entry.role_detail.character_info.english_name }}</text>
              </view>
              <view v-if="entry.role_detail.character_info.character_type" class="info-row">
                <text class="info-label">角色类型</text>
                <text class="info-value">{{ entry.role_detail.character_info.character_type }}</text>
              </view>
              <view v-if="entry.role_detail.character_info.belongs_to_scripts" class="info-row">
                <text class="info-label">所属剧本</text>
                <text class="info-value">{{ entry.role_detail.character_info.belongs_to_scripts.join('、') }}</text>
              </view>
              <view v-if="entry.role_detail.character_info.ability_categories" class="info-row">
                <text class="info-label">能力类别</text>
                <text class="info-value">{{ entry.role_detail.character_info.ability_categories.join('、') }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'WikiDetail',
  
  data() {
    return {
      entryId: '',
      entry: null,
      loading: true
    }
  },
  
  onLoad(options) {
    if (options.id) {
      this.entryId = options.id;
      this.loadEntry();
    }
  },
  
  methods: {
    goBack() {
      // 优先使用navigateBack，如果没有历史记录则跳转到列表页
      const pages = getCurrentPages();
      if (pages.length > 1) {
        uni.navigateBack({
          delta: 1
        });
      } else {
        uni.redirectTo({
          url: '/pages/botc/wiki/list'
        });
      }
    },
    
    async loadEntry() {
      this.loading = true;
      
      try {
        const db = uniCloud.database();
        const res = await db.collection('wiki_entries')
          .doc(this.entryId)
          .get();
        
        console.log('查询结果:', res);
        
        const data = res.result?.data || res.data || [];
        
        if (data && data.length > 0) {
          this.entry = data[0];
          
          // 设置页面标题
          uni.setNavigationBarTitle({
            title: this.entry.title || '词条详情'
          });
        } else {
          uni.showToast({
            title: '词条不存在',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('加载失败:', error);
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
    },
    
    formatTime(time) {
      if (!time) return '-';
      const d = new Date(time);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    },
    
    getTypeText(type) {
      const map = {
        role: '角色',
        script: '剧本',
        rule: '规则',
        guide: '指南',
        term: '术语'
      };
      return map[type] || type;
    }
  }
}
</script>

<style scoped>
.page {
  padding: 20px;
  background: #F5F5F5;
  min-height: 100vh;
}

/* 返回按钮 */
.back-bar {
  margin-bottom: 24px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.back-btn {
  display: inline-block;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.btn-content {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 1;
}

.back-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  border-radius: 50px;
  opacity: 0;
  transition: opacity 0.3s;
  z-index: 0;
}

.back-btn:hover::before {
  opacity: 1;
}

.back-btn:hover .btn-content {
  transform: translateX(-4px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.back-btn:active .btn-content {
  transform: translateX(-4px) scale(0.98);
}

.back-icon {
  font-size: 20px;
  font-weight: bold;
  color: white;
  line-height: 1;
  transition: transform 0.3s;
}

.back-btn:hover .back-icon {
  transform: translateX(-3px);
}

.back-text {
  font-size: 15px;
  color: white;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.content {
  max-width: 1200px;
  margin: 0 auto;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 头部 */
.header-main {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
}

.icon {
  width: 120px;
  height: 120px;
  border-radius: 12px;
  margin-right: 20px;
  background: #f5f5f5;
}

.header-info {
  flex: 1;
}

.title {
  display: block;
  font-size: 32px;
  font-weight: bold;
  color: #1A1A1A;
  margin-bottom: 8px;
}

.subtitle {
  display: block;
  font-size: 16px;
  color: #999;
  margin-bottom: 12px;
}

.meta {
  display: flex;
  gap: 20px;
}

.meta-item {
  font-size: 14px;
  color: #666;
  padding: 4px 12px;
  background: #f0f0f0;
  border-radius: 12px;
}

.source-link {
  font-size: 14px;
  color: #666;
}

.source-link a {
  color: #4facfe;
  text-decoration: none;
}

/* 章节卡片 */
.section-card {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0;
}

.section-title {
  font-size: 24px;
  font-weight: bold;
  color: #1A1A1A;
}

.item-count {
  font-size: 14px;
  color: #999;
  padding: 4px 12px;
  background: #f5f5f5;
  border-radius: 12px;
}

.section-content {
  line-height: 1.8;
}

/* 背景故事 */
.background-story {
  display: block;
  font-size: 18px;
  color: #666;
  font-style: italic;
  padding: 16px;
  background: #F8F8F8;
  border-left: 4px solid #4facfe;
  border-radius: 6px;
  line-height: 1.8;
}

/* 角色能力 */
.ability-text {
  display: block;
  font-size: 18px;
  color: #333;
  padding: 16px;
  background: #E8F4FD;
  border-radius: 6px;
  line-height: 1.8;
}

/* 文本列表 */
.text-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.item-num {
  font-size: 16px;
  font-weight: bold;
  color: #4facfe;
  min-width: 30px;
}

.bullet {
  font-size: 16px;
  color: #4facfe;
}

.item-text {
  flex: 1;
  font-size: 16px;
  color: #666;
  line-height: 1.8;
}

/* 范例 */
.example-box {
  padding: 16px;
  background: #F8F8F8;
  border-radius: 8px;
  border-left: 4px solid #52c41a;
  margin-bottom: 12px;
}

.example-row {
  display: flex;
  margin-bottom: 8px;
}

.example-row:last-child {
  margin-bottom: 0;
}

.example-label {
  font-size: 14px;
  color: #999;
  min-width: 60px;
  font-weight: 500;
}

.example-value {
  flex: 1;
  font-size: 16px;
  color: #333;
  line-height: 1.6;
}

.example-value.result {
  color: #52c41a;
  font-weight: 500;
}

/* 提示标记 */
.token-box {
  padding: 16px;
  background: #FFF9E6;
  border: 2px solid #FAAD14;
  border-radius: 8px;
  margin-bottom: 12px;
}

.token-name {
  display: block;
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
}

.token-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.token-detail {
  font-size: 15px;
  color: #666;
  line-height: 1.6;
}

/* 信息表格 */
.info-table {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 15px;
  color: #999;
  min-width: 100px;
}

.info-value {
  flex: 1;
  font-size: 16px;
  color: #333;
  text-align: right;
}

</style>

