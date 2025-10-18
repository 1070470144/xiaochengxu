<template>
  <view class="detail-page">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-state">
      <uni-load-more status="loading" :content-text="{ contentdown: '加载中...', contentrefresh: '加载中...', contentnomore: '加载中...' }" />
    </view>
    
    <!-- 内容区域 -->
    <view v-else-if="entry" class="content">
      <!-- 头部信息 -->
      <view class="entry-header card">
        <view class="header-main">
          <image 
            v-if="entry.media && entry.media.icon_url" 
            class="entry-icon"
            :src="entry.media.icon_url"
            mode="aspectFit"
          />
          <view class="title-area">
            <text class="entry-title">{{ entry.title }}</text>
            <view v-if="entry.role_info && entry.role_info.team" class="team-badge-wrapper">
              <text class="team-badge" :class="'badge-' + entry.role_info.team">
                {{ entry.role_info.team_name || entry.role_info.team }}
              </text>
            </view>
          </view>
        </view>
        
        <view class="source-info">
          <text class="source-label">来源：</text>
          <text class="source-name">{{ entry.source_name }}</text>
        </view>
      </view>
      
      <!-- 角色信息（如果是角色） -->
      <view v-if="entry.entry_type === 'role' && entry.role_info" class="role-info card">
        <view class="info-title">角色信息</view>
        
        <view v-if="entry.role_info.ability" class="info-item">
          <text class="info-label">🎯 能力</text>
          <text class="info-value">{{ entry.role_info.ability }}</text>
        </view>
        
        <view v-if="entry.role_info.setup_info" class="info-item">
          <text class="info-label">⚙️ 设置</text>
          <text class="info-value">{{ entry.role_info.setup_info }}</text>
        </view>
        
        <view v-if="entry.role_info.script_belongs && entry.role_info.script_belongs.length > 0" class="info-item">
          <text class="info-label">📜 所属剧本</text>
          <view class="script-tags">
            <text 
              v-for="(script, idx) in entry.role_info.script_belongs" 
              :key="idx"
              class="script-tag"
            >
              {{ script }}
            </text>
          </view>
        </view>
      </view>
      
      <!-- 文章内容 -->
      <view class="article card">
        <!-- 摘要 -->
        <view v-if="entry.content.summary" class="summary">
          {{ entry.content.summary }}
        </view>
        
        <!-- 分段内容 -->
        <view 
          v-for="(section, index) in entry.content.sections" 
          :key="index"
          class="section"
        >
          <text class="section-heading" :class="'level-' + section.level">
            {{ section.heading }}
          </text>
          <text class="section-content">{{ section.content }}</text>
        </view>
      </view>
      
      <!-- 相关图片 -->
      <view v-if="entry.media && entry.media.images && entry.media.images.length > 0" class="images card">
        <text class="images-title">相关图片</text>
        <view class="image-grid">
          <image 
            v-for="(img, index) in entry.media.images" 
            :key="index"
            class="grid-image"
            :src="img"
            mode="aspectFill"
            @click="previewImage(index)"
          />
        </view>
      </view>
      
      <!-- 相关链接 -->
      <view v-if="entry.related_links && entry.related_links.length > 0" class="related-links card">
        <text class="links-title">相关链接</text>
        <view 
          v-for="(link, index) in entry.related_links" 
          :key="index"
          class="link-item"
          @click="importFromLink(link.url)"
        >
          <text class="link-text">{{ link.text }}</text>
          <text class="link-arrow">›</text>
        </view>
      </view>
      
      <!-- 相关词条 -->
      <view v-if="entry.related_entries && entry.related_entries.length > 0" class="related-entries card">
        <text class="related-title">相关词条</text>
        <view 
          v-for="item in entry.related_entries" 
          :key="item._id"
          class="related-item"
          @click="viewDetail(item._id)"
        >
          <text class="related-name">{{ item.title }}</text>
          <text class="related-arrow">›</text>
        </view>
      </view>
      
      <!-- 底部操作栏 -->
      <view class="footer-placeholder"></view>
    </view>
    
    <!-- 错误状态 -->
    <view v-else class="error-state">
      <text class="error-icon">😢</text>
      <text class="error-text">加载失败</text>
      <button class="retry-btn" @click="loadEntry">重试</button>
    </view>
    
    <!-- 固定底部操作栏 -->
    <view v-if="entry" class="footer">
      <button class="action-btn favorite" @click="toggleFavorite">
        {{ isFavorite ? '💛' : '🤍' }} {{ isFavorite ? '已收藏' : '收藏' }}
      </button>
      <button class="action-btn share" @click="shareEntry">
        📤 分享
      </button>
      <button class="action-btn source" @click="openSource">
        🔗 原文
      </button>
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
      loading: true,
      isFavorite: false
    }
  },
  
  onLoad(options) {
    if (options.id) {
      this.entryId = options.id;
      this.loadEntry();
    } else {
      uni.showToast({
        title: '缺少词条ID',
        icon: 'none'
      });
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
    }
  },
  
  methods: {
    // 加载词条
    async loadEntry() {
      this.loading = true;
      
      try {
        const res = await uniCloud.callFunction({
          name: 'wiki-detail',
          data: {
            entry_id: this.entryId,
            userId: getApp().globalData.userId
          }
        });
        
        if (res.result.code === 0) {
          this.entry = res.result.data;
          
          // 设置页面标题
          uni.setNavigationBarTitle({
            title: this.entry.title || '百科详情'
          });
          
          // 检查是否已收藏
          await this.checkFavorite();
        } else {
          uni.showToast({
            title: res.result.message || '加载失败',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('加载失败', error);
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
    },
    
    // 检查是否已收藏
    async checkFavorite() {
      try {
        const userId = getApp().globalData.userId;
        if (!userId) {
          this.isFavorite = false;
          return;
        }
        
        const db = uniCloud.database();
        const res = await db.collection('wiki_favorites')
          .where({
            user_id: userId,
            entry_id: this.entryId
          })
          .count();
        
        this.isFavorite = res.result.total > 0;
      } catch (error) {
        console.error('检查收藏状态失败', error);
      }
    },
    
    // 预览图片
    previewImage(index) {
      if (!this.entry.media || !this.entry.media.images) return;
      
      uni.previewImage({
        urls: this.entry.media.images,
        current: this.entry.media.images[index]
      });
    },
    
    // 查看其他词条
    viewDetail(id) {
      uni.redirectTo({
        url: `/pages/tools/wiki/detail?id=${id}`
      });
    },
    
    // 从相关链接导入
    importFromLink(url) {
      uni.showModal({
        title: '导入词条',
        content: '是否导入这个词条？',
        success: async (res) => {
          if (res.confirm) {
            try {
              uni.showLoading({ title: '解析中...' });
              
              const result = await uniCloud.callFunction({
                name: 'wiki-parse-url',
                data: {
                  url: url,
                  userId: getApp().globalData.userId
                }
              });
              
              uni.hideLoading();
              
              if (result.result.code === 0) {
                this.viewDetail(result.result.data._id);
              } else {
                uni.showToast({
                  title: '导入失败',
                  icon: 'none'
                });
              }
            } catch (error) {
              uni.hideLoading();
              console.error('导入失败', error);
            }
          }
        }
      });
    },
    
    // 收藏/取消收藏
    async toggleFavorite() {
      const userId = getApp().globalData.userId;
      if (!userId) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return;
      }
      
      try {
        const db = uniCloud.database();
        const dbCmd = db.command;
        
        if (this.isFavorite) {
          // 取消收藏
          await db.collection('wiki_favorites')
            .where({
              user_id: userId,
              entry_id: this.entryId
            })
            .remove();
          
          // 更新词条收藏计数
          await db.collection('wiki_entries')
            .doc(this.entryId)
            .update({
              'stats.favorite_count': dbCmd.inc(-1)
            });
          
          this.isFavorite = false;
          uni.showToast({
            title: '已取消收藏',
            icon: 'success'
          });
        } else {
          // 添加收藏
          await db.collection('wiki_favorites').add({
            user_id: userId,
            entry_id: this.entryId,
            created_at: new Date()
          });
          
          // 更新词条收藏计数
          await db.collection('wiki_entries')
            .doc(this.entryId)
            .update({
              'stats.favorite_count': dbCmd.inc(1)
            });
          
          this.isFavorite = true;
          uni.showToast({
            title: '收藏成功',
            icon: 'success'
          });
        }
      } catch (error) {
        console.error('收藏操作失败', error);
        uni.showToast({
          title: '操作失败',
          icon: 'none'
        });
      }
    },
    
    // 分享词条
    shareEntry() {
      // TODO: 实现分享功能
      uni.showToast({
        title: '分享功能开发中',
        icon: 'none'
      });
    },
    
    // 打开原文链接
    openSource() {
      if (!this.entry || !this.entry.source_url) return;
      
      // 复制链接到剪贴板
      uni.setClipboardData({
        data: this.entry.source_url,
        success: () => {
          uni.showModal({
            title: '链接已复制',
            content: '可以在浏览器中打开查看原文',
            showCancel: false
          });
        }
      });
    }
  }
}
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  background: #F5F5F5;
  padding-bottom: 160rpx;
}

/* 加载和错误状态 */
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  gap: 24rpx;
}

.error-icon {
  font-size: 120rpx;
}

.error-text {
  font-size: 28rpx;
  color: #999;
}

.retry-btn {
  margin-top: 16rpx;
  padding: 16rpx 48rpx;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  font-size: 28rpx;
  border-radius: 40rpx;
  border: none;
}

/* 内容区域 */
.content {
  padding: 24rpx;
}

.card {
  background: #FFFFFF;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
  margin-bottom: 24rpx;
}

/* 头部 */
.entry-header {
  padding: 32rpx;
}

.header-main {
  display: flex;
  align-items: flex-start;
  margin-bottom: 24rpx;
}

.entry-icon {
  width: 120rpx;
  height: 120rpx;
  margin-right: 24rpx;
  border-radius: 12rpx;
  background: #F5F5F5;
  flex-shrink: 0;
}

.title-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.entry-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #1A1A1A;
  line-height: 1.4;
}

.team-badge-wrapper {
  display: flex;
}

.team-badge {
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: 500;
}

.badge-townsfolk {
  background: #f6ffed;
  color: #52c41a;
}

.badge-outsider {
  background: #fffbe6;
  color: #faad14;
}

.badge-minion {
  background: #fff7ed;
  color: #f97316;
}

.badge-demon {
  background: #fff2f0;
  color: #ef4444;
}

.badge-traveler {
  background: #e6f7ff;
  color: #1890ff;
}

.source-info {
  display: flex;
  align-items: center;
  padding: 16rpx;
  background: #F8F8F8;
  border-radius: 8rpx;
}

.source-label {
  font-size: 24rpx;
  color: #999;
  margin-right: 8rpx;
}

.source-name {
  font-size: 24rpx;
  color: #4facfe;
}

/* 角色信息 */
.role-info {
  padding: 32rpx;
}

.info-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #1A1A1A;
  margin-bottom: 24rpx;
}

.info-item {
  display: flex;
  flex-direction: column;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #F0F0F0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 26rpx;
  color: #666;
  font-weight: 500;
  margin-bottom: 12rpx;
}

.info-value {
  font-size: 28rpx;
  color: #1A1A1A;
  line-height: 1.6;
}

.script-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.script-tag {
  padding: 8rpx 16rpx;
  background: #E8F4FD;
  color: #4facfe;
  font-size: 24rpx;
  border-radius: 20rpx;
}

/* 文章内容 */
.article {
  padding: 32rpx;
}

.summary {
  font-size: 30rpx;
  color: #333;
  line-height: 1.8;
  margin-bottom: 32rpx;
  padding-bottom: 32rpx;
  border-bottom: 2rpx solid #F0F0F0;
}

.section {
  margin-bottom: 32rpx;
}

.section:last-child {
  margin-bottom: 0;
}

.section-heading {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #1A1A1A;
  margin-bottom: 16rpx;
  line-height: 1.4;
}

.section-heading.level-3 {
  font-size: 28rpx;
  font-weight: 600;
}

.section-heading.level-4 {
  font-size: 26rpx;
  font-weight: 500;
}

.section-content {
  display: block;
  font-size: 28rpx;
  color: #666;
  line-height: 1.8;
  white-space: pre-wrap;
}

/* 图片网格 */
.images {
  padding: 32rpx;
}

.images-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #1A1A1A;
  margin-bottom: 24rpx;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}

.grid-image {
  width: 100%;
  height: 200rpx;
  border-radius: 12rpx;
  background: #F5F5F5;
}

/* 相关链接 */
.related-links {
  padding: 32rpx;
}

.links-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #1A1A1A;
  margin-bottom: 24rpx;
}

.link-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #F0F0F0;
}

.link-item:last-child {
  border-bottom: none;
}

.link-item:active {
  background: #F8F8F8;
  margin: 0 -16rpx;
  padding: 20rpx 16rpx;
}

.link-text {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.link-arrow {
  font-size: 40rpx;
  color: #ccc;
  margin-left: 16rpx;
}

/* 相关词条 */
.related-entries {
  padding: 32rpx;
}

.related-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #1A1A1A;
  margin-bottom: 24rpx;
}

.related-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #F0F0F0;
}

.related-item:last-child {
  border-bottom: none;
}

.related-item:active {
  background: #F8F8F8;
  margin: 0 -16rpx;
  padding: 20rpx 16rpx;
}

.related-name {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.related-arrow {
  font-size: 40rpx;
  color: #ccc;
  margin-left: 16rpx;
}

/* 底部占位 */
.footer-placeholder {
  height: 120rpx;
}

/* 底部操作栏 */
.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 12rpx;
  padding: 20rpx 24rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: white;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.action-btn {
  flex: 1;
  height: 80rpx;
  font-size: 26rpx;
  border-radius: 12rpx;
  border: none;
  color: white;
  font-weight: 500;
}

.action-btn.favorite {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.action-btn.share {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.action-btn.source {
  background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);
}
</style>

