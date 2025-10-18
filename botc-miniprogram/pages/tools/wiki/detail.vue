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
      
      <!-- 🆕 v2.1: 角色详细内容 -->
      <view v-if="entry.entry_type === 'role' && entry.role_detail">
        
        <!-- 背景故事 -->
        <view v-if="entry.role_detail.background_story" class="detail-card card">
          <text class="card-title">📖 背景故事</text>
          <text class="background-story">"{{ entry.role_detail.background_story }}"</text>
        </view>
        
        <!-- 角色能力 -->
        <view v-if="entry.role_detail.ability" class="detail-card card">
          <text class="card-title">🎯 角色能力</text>
          <text class="ability-text">{{ entry.role_detail.ability }}</text>
        </view>
        
        <!-- 角色简介 -->
        <view v-if="entry.role_detail.introduction && entry.role_detail.introduction.length > 0" class="detail-card card">
          <text class="card-title" @click="toggleSection('intro')">
            📝 角色简介 {{ expandedSections.intro ? '▼' : '▶' }}
          </text>
          <view v-show="expandedSections.intro" class="content-list">
            <view v-for="(para, idx) in entry.role_detail.introduction" :key="idx" class="content-item">
              <text class="bullet">•</text>
              <text class="content-text">{{ para }}</text>
            </view>
          </view>
        </view>
        
        <!-- 范例 -->
        <view v-if="entry.role_detail.examples && entry.role_detail.examples.length > 0" class="detail-card card">
          <text class="card-title" @click="toggleSection('examples')">
            📌 范例 {{ expandedSections.examples ? '▼' : '▶' }}
          </text>
          <view v-show="expandedSections.examples" class="examples-list">
            <view v-for="(example, idx) in entry.role_detail.examples" :key="idx" class="example-item">
              <text class="example-label">场景</text>
              <text class="example-text">{{ example.scenario }}</text>
              <text class="example-label">结果</text>
              <text class="example-text result">{{ example.result }}</text>
            </view>
          </view>
        </view>
        
        <!-- 运作方式 -->
        <view v-if="entry.role_detail.mechanics && entry.role_detail.mechanics.length > 0" class="detail-card card">
          <text class="card-title" @click="toggleSection('mechanics')">
            ⚙️ 运作方式 {{ expandedSections.mechanics ? '▼' : '▶' }}
          </text>
          <view v-show="expandedSections.mechanics" class="content-list">
            <view v-for="(step, idx) in entry.role_detail.mechanics" :key="idx" class="content-item">
              <text class="step-num">{{ idx + 1 }}.</text>
              <text class="content-text">{{ step }}</text>
            </view>
          </view>
        </view>
        
        <!-- 提示标记 -->
        <view v-if="entry.role_detail.reminder_tokens && entry.role_detail.reminder_tokens.length > 0" class="detail-card card">
          <text class="card-title" @click="toggleSection('tokens')">
            🏷️ 提示标记 {{ expandedSections.tokens ? '▼' : '▶' }}
          </text>
          <view v-show="expandedSections.tokens" class="tokens-list">
            <view v-for="token in entry.role_detail.reminder_tokens" :key="token.name" class="token-item">
              <text class="token-name">{{ token.icon }} {{ token.name }}</text>
              <view class="token-details">
                <text v-for="(detail, idx) in token.details" :key="idx" class="token-detail">
                  {{ detail }}
                </text>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 规则细节 -->
        <view v-if="entry.role_detail.rule_details && entry.role_detail.rule_details.length > 0" class="detail-card card">
          <text class="card-title" @click="toggleSection('rules')">
            📜 规则细节 {{ expandedSections.rules ? '▼' : '▶' }}
          </text>
          <view v-show="expandedSections.rules" class="content-list">
            <view v-for="(rule, idx) in entry.role_detail.rule_details" :key="idx" class="content-item">
              <text class="bullet">•</text>
              <text class="content-text">{{ rule }}</text>
            </view>
          </view>
        </view>
        
        <!-- 提示与技巧 -->
        <view v-if="entry.role_detail.tips_and_tricks && entry.role_detail.tips_and_tricks.length > 0" class="detail-card card">
          <text class="card-title" @click="toggleSection('tips')">
            💡 提示与技巧 {{ expandedSections.tips ? '▼' : '▶' }}
          </text>
          <view v-show="expandedSections.tips" class="content-list">
            <view v-for="(tip, idx) in entry.role_detail.tips_and_tricks" :key="idx" class="content-item">
              <text class="bullet">•</text>
              <text class="content-text">{{ tip }}</text>
            </view>
          </view>
        </view>
        
        <!-- 伪装方法 -->
        <view v-if="entry.role_detail.bluff_tips && entry.role_detail.bluff_tips.length > 0" class="detail-card card">
          <text class="card-title" @click="toggleSection('bluff')">
            🎭 伪装方法 {{ expandedSections.bluff ? '▼' : '▶' }}
          </text>
          <view v-show="expandedSections.bluff" class="content-list">
            <view v-for="(bluff, idx) in entry.role_detail.bluff_tips" :key="idx" class="content-item">
              <text class="bullet">•</text>
              <text class="content-text">{{ bluff }}</text>
            </view>
          </view>
        </view>
        
        <!-- 角色信息 -->
        <view v-if="entry.role_detail.character_info" class="detail-card card">
          <text class="card-title">ℹ️ 角色信息</text>
          <view class="info-grid">
            <view v-if="entry.role_detail.character_info.english_name" class="info-row">
              <text class="info-key">英文名</text>
              <text class="info-val">{{ entry.role_detail.character_info.english_name }}</text>
            </view>
            <view v-if="entry.role_detail.character_info.character_type" class="info-row">
              <text class="info-key">角色类型</text>
              <text class="info-val">{{ entry.role_detail.character_info.character_type }}</text>
            </view>
            <view v-if="entry.role_detail.character_info.belongs_to_scripts && entry.role_detail.character_info.belongs_to_scripts.length > 0" class="info-row">
              <text class="info-key">所属剧本</text>
              <text class="info-val">{{ entry.role_detail.character_info.belongs_to_scripts.join('、') }}</text>
            </view>
            <view v-if="entry.role_detail.character_info.ability_categories && entry.role_detail.character_info.ability_categories.length > 0" class="info-row">
              <text class="info-key">能力类别</text>
              <text class="info-val">{{ entry.role_detail.character_info.ability_categories.join('、') }}</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 原有的角色信息卡片（作为备用，如果没有role_detail） -->
      <view v-else-if="entry.entry_type === 'role' && entry.role_info" class="role-info card">
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
      
      <!-- 🆕 互动区域 -->
      <view class="interaction-section">
        <!-- 点赞和统计 -->
        <view class="stats-bar card">
          <view class="stat-item">
            <text class="stat-icon">👁️</text>
            <text class="stat-text">{{ entry.stats?.view_count || 0 }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-icon">❤️</text>
            <text class="stat-text">{{ entry.stats?.like_count || 0 }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-icon">💬</text>
            <text class="stat-text">{{ entry.stats?.comment_count || 0 }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-icon">⭐</text>
            <text class="stat-text">{{ entry.stats?.favorite_count || 0 }}</text>
          </view>
        </view>
        
        <!-- 点赞按钮 -->
        <view class="like-section card">
          <button 
            class="like-btn"
            :class="{ liked: isLiked }"
            @click="toggleLike"
          >
            <text class="like-icon">{{ isLiked ? '❤️' : '🤍' }}</text>
            <text class="like-text">{{ isLiked ? '已点赞' : '点赞' }}</text>
          </button>
        </view>
        
        <!-- 评论区域 -->
        <view class="comments-section card">
          <view class="comments-header">
            <text class="comments-title">💬 评论 ({{ commentList.length }})</text>
          </view>
          
          <!-- 评论列表 -->
          <view v-if="loadingComments" class="comments-loading">
            <uni-load-more status="loading" />
          </view>
          
          <view v-else-if="commentList.length === 0" class="comments-empty">
            <text class="empty-icon">💭</text>
            <text class="empty-text">还没有评论，快来抢沙发吧~</text>
          </view>
          
          <view v-else class="comments-list">
            <view 
              v-for="comment in commentList" 
              :key="comment._id"
              class="comment-item"
            >
              <image 
                class="comment-avatar"
                :src="comment.user_avatar || '/static/default-avatar.png'"
                mode="aspectFill"
              />
              <view class="comment-content">
                <view class="comment-header">
                  <text class="comment-user">{{ comment.user_nickname }}</text>
                  <text class="comment-time">{{ formatCommentTime(comment.created_at) }}</text>
                </view>
                <text class="comment-text">{{ comment.content }}</text>
              </view>
            </view>
          </view>
          
          <!-- 评论输入 -->
          <view class="comment-input-area">
            <input 
              class="comment-input"
              v-model="commentInput"
              placeholder="说说你的看法..."
              :maxlength="500"
              @confirm="submitComment"
            />
            <button 
              class="comment-submit"
              :disabled="!commentInput.trim()"
              @click="submitComment"
            >
              发送
            </button>
          </view>
        </view>
      </view>
      
      <!-- 底部占位 -->
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
      <button class="action-btn-full source" @click="openSource">
        🌐 跳转百科地址
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
      isFavorite: false,
      // 🆕 v2.1: 折叠/展开状态
      expandedSections: {
        intro: true,      // 默认展开角色简介
        examples: false,
        mechanics: false,
        tokens: false,
        rules: false,
        tips: false,
        bluff: false
      },
      // 🆕 v3.0: 互动功能
      isLiked: false,
      commentList: [],
      loadingComments: false,
      commentInput: ''
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
        const db = uniCloud.database();
        const res = await db.collection('wiki_entries')
          .doc(this.entryId)
          .get();
        
        const data = res.result?.data || res.data || [];
        
        if (data && data.length > 0) {
          this.entry = data[0];
          
          // 设置页面标题
          uni.setNavigationBarTitle({
            title: this.entry.title || '百科详情'
          });
          
          // 更新浏览量
          await this.updateViewCount();
          
          // 检查是否已收藏（仅登录用户）
          const userId = getApp().globalData.userId;
          if (userId) {
            await this.checkFavorite();
            await this.checkLikeStatus();
          }
          
          // 加载评论列表
          await this.loadComments();
        } else {
          uni.showToast({
            title: '词条不存在',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('[loadEntry] 加载失败:', error);
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
    },
    
    // 更新浏览量
    async updateViewCount() {
      try {
        const db = uniCloud.database();
        const dbCmd = db.command;
        await db.collection('wiki_entries')
          .doc(this.entryId)
          .update({
            'stats.view_count': dbCmd.inc(1)
          });
      } catch (error) {
        console.error('[updateViewCount] 更新浏览量失败:', error);
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
    
    // 🆕 v2.1: 切换章节展开/折叠
    toggleSection(sectionName) {
      this.expandedSections[sectionName] = !this.expandedSections[sectionName];
    },
    
    // 查看其他词条
    viewDetail(id) {
      uni.redirectTo({
        url: `/pages/tools/wiki/detail?id=${id}`
      });
    },
    
    // 打开百科地址
    openSource() {
      if (!this.entry || !this.entry.source_url) {
        uni.showToast({
          title: '百科地址不存在',
          icon: 'none'
        });
        return;
      }
      
      console.log('[openSource] 准备打开百科地址:', this.entry.source_url);
      
      // 使用 web-view 或外部浏览器打开
      // #ifdef H5
      // H5端直接打开新窗口
      window.open(this.entry.source_url, '_blank');
      // #endif
      
      // #ifndef H5
      // 小程序端复制地址并提示用户在浏览器中打开
      uni.setClipboardData({
        data: this.entry.source_url,
        success: () => {
          uni.showModal({
            title: '🌐 即将跳转',
            content: '百科地址已复制到剪贴板\n\n' + this.entry.source_url + '\n\n请在浏览器中粘贴打开',
            confirmText: '好的',
            showCancel: false
          });
        },
        fail: () => {
          uni.showToast({
            title: '操作失败',
            icon: 'none'
          });
        }
      });
      // #endif
    },
    
    // 🆕 v3.0: 检查点赞状态
    async checkLikeStatus() {
      try {
        const userId = getApp().globalData.userId;
        if (!userId) {
          this.isLiked = false;
          return;
        }
        
        const db = uniCloud.database();
        const res = await db.collection('wiki_role_likes')
          .where({
            user_id: userId,
            role_id: this.entryId
          })
          .count();
        
        this.isLiked = (res.result?.total || res.total || 0) > 0;
      } catch (error) {
        console.error('[checkLikeStatus] 检查点赞状态失败:', error);
      }
    },
    
    // 🆕 v3.0: 点赞/取消点赞
    async toggleLike() {
      const userId = getApp().globalData.userId;
      if (!userId) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return;
      }
      
      try {
        const res = await uniCloud.callFunction({
          name: 'wiki-role-toggle-like',
          data: {
            role_id: this.entryId
          }
        });
        
        if (res.result.code === 0) {
          this.isLiked = res.result.data.is_liked;
          
          // 更新本地统计
          if (this.entry.stats) {
            this.entry.stats.like_count = (this.entry.stats.like_count || 0) + (this.isLiked ? 1 : -1);
          }
          
          uni.showToast({
            title: res.result.message,
            icon: 'success',
            duration: 1000
          });
        } else {
          uni.showToast({
            title: res.result.message,
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('[toggleLike] 点赞失败:', error);
        uni.showToast({
          title: '操作失败',
          icon: 'none'
        });
      }
    },
    
    // 🆕 v3.0: 加载评论列表
    async loadComments() {
      this.loadingComments = true;
      
      try {
        const res = await uniCloud.callFunction({
          name: 'wiki-role-comment-list',
          data: {
            role_id: this.entryId,
            page: 1,
            page_size: 50
          }
        });
        
        if (res.result.code === 0) {
          this.commentList = res.result.data.list || [];
          console.log('[loadComments] 加载评论成功，共', this.commentList.length, '条');
        }
      } catch (error) {
        console.error('[loadComments] 加载评论失败:', error);
      } finally {
        this.loadingComments = false;
      }
    },
    
    // 🆕 v3.0: 发表评论
    async submitComment() {
      const userId = getApp().globalData.userId;
      if (!userId) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return;
      }
      
      const content = this.commentInput.trim();
      if (!content) {
        uni.showToast({
          title: '请输入评论内容',
          icon: 'none'
        });
        return;
      }
      
      try {
        uni.showLoading({ title: '发送中...' });
        
        const res = await uniCloud.callFunction({
          name: 'wiki-role-comment-add',
          data: {
            role_id: this.entryId,
            content: content
          }
        });
        
        uni.hideLoading();
        
        if (res.result.code === 0) {
          uni.showToast({
            title: '评论成功',
            icon: 'success'
          });
          
          // 清空输入
          this.commentInput = '';
          
          // 更新本地统计
          if (this.entry.stats) {
            this.entry.stats.comment_count = (this.entry.stats.comment_count || 0) + 1;
          }
          
          // 重新加载评论列表
          await this.loadComments();
        } else {
          uni.showToast({
            title: res.result.message,
            icon: 'none'
          });
        }
      } catch (error) {
        uni.hideLoading();
        console.error('[submitComment] 评论失败:', error);
        uni.showToast({
          title: '评论失败',
          icon: 'none'
        });
      }
    },
    
    // 🆕 v3.0: 格式化评论时间
    formatCommentTime(timestamp) {
      if (!timestamp) return '';
      
      const now = Date.now();
      const time = new Date(timestamp).getTime();
      const diff = now - time;
      
      if (diff < 60000) {
        return '刚刚';
      } else if (diff < 3600000) {
        return Math.floor(diff / 60000) + '分钟前';
      } else if (diff < 86400000) {
        return Math.floor(diff / 3600000) + '小时前';
      } else if (diff < 2592000000) {
        return Math.floor(diff / 86400000) + '天前';
      } else {
        const d = new Date(timestamp);
        return `${d.getMonth() + 1}/${d.getDate()}`;
      }
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

/* 底部占位 */
.footer-placeholder {
  height: 100rpx;
}

/* 底部操作栏 */
.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 24rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: white;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.action-btn-full {
  width: 100%;
  height: 88rpx;
  font-size: 30rpx;
  border-radius: 16rpx;
  border: none;
  color: white;
  font-weight: 600;
  letter-spacing: 2rpx;
}

.action-btn-full.source {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 8rpx 20rpx rgba(102, 126, 234, 0.3);
}

.action-btn-full:active {
  transform: scale(0.98);
  opacity: 0.9;
}

/* 🆕 v3.0: 互动区域样式 */
.interaction-section {
  padding: 0 24rpx;
}

/* 统计栏 */
.stats-bar {
  display: flex;
  justify-content: space-around;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.stat-icon {
  font-size: 32rpx;
}

.stat-text {
  font-size: 24rpx;
  color: #666;
  font-weight: 500;
}

/* 点赞按钮 */
.like-section {
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.like-btn {
  width: 100%;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);
  border-radius: 16rpx;
  border: none;
  box-shadow: 0 8rpx 20rpx rgba(253, 203, 110, 0.3);
  transition: all 0.3s;
}

.like-btn.liked {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  box-shadow: 0 8rpx 20rpx rgba(255, 107, 107, 0.4);
}

.like-btn:active {
  transform: scale(0.95);
}

.like-icon {
  font-size: 36rpx;
}

.like-text {
  font-size: 30rpx;
  color: white;
  font-weight: bold;
}

/* 评论区域 */
.comments-section {
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.comments-header {
  margin-bottom: 24rpx;
  padding-bottom: 16rpx;
  border-bottom: 2rpx solid #F0F0F0;
}

.comments-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #1A1A1A;
}

.comments-loading,
.comments-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 20rpx;
  gap: 16rpx;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  margin-bottom: 32rpx;
}

.comment-item {
  display: flex;
  gap: 20rpx;
}

.comment-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: #F5F5F5;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.comment-user {
  font-size: 26rpx;
  color: #666;
  font-weight: 500;
}

.comment-time {
  font-size: 22rpx;
  color: #999;
}

.comment-text {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
  word-break: break-all;
}

/* 评论输入 */
.comment-input-area {
  display: flex;
  gap: 16rpx;
  align-items: center;
  padding: 20rpx;
  background: #F8F8F8;
  border-radius: 12rpx;
}

.comment-input {
  flex: 1;
  height: 64rpx;
  padding: 0 20rpx;
  background: white;
  border-radius: 32rpx;
  font-size: 26rpx;
}

.comment-submit {
  width: 120rpx;
  height: 64rpx;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  font-size: 26rpx;
  font-weight: 500;
  border-radius: 32rpx;
  border: none;
}

.comment-submit[disabled] {
  opacity: 0.5;
}

/* 🆕 v2.1: 详细内容样式 */
.detail-card {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.card-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #1A1A1A;
  margin-bottom: 24rpx;
  padding-bottom: 16rpx;
  border-bottom: 2rpx solid #F0F0F0;
}

/* 背景故事 */
.background-story {
  display: block;
  font-size: 30rpx;
  color: #666;
  line-height: 1.8;
  font-style: italic;
  padding: 20rpx;
  background: #F8F8F8;
  border-left: 6rpx solid #4facfe;
  border-radius: 8rpx;
}

/* 角色能力 */
.ability-text {
  display: block;
  font-size: 30rpx;
  color: #333;
  line-height: 1.8;
  padding: 20rpx;
  background: #E8F4FD;
  border-radius: 8rpx;
}

/* 内容列表 */
.content-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-top: 16rpx;
}

.content-item {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
}

.bullet {
  font-size: 28rpx;
  color: #4facfe;
  margin-top: 4rpx;
}

.step-num {
  font-size: 26rpx;
  font-weight: bold;
  color: #4facfe;
  min-width: 40rpx;
  margin-top: 4rpx;
}

.content-text {
  flex: 1;
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
}

/* 范例列表 */
.examples-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  margin-top: 16rpx;
}

.example-item {
  padding: 20rpx;
  background: #F8F8F8;
  border-radius: 12rpx;
  border-left: 6rpx solid #52c41a;
}

.example-label {
  display: block;
  font-size: 24rpx;
  color: #999;
  margin-bottom: 8rpx;
  font-weight: 500;
}

.example-text {
  display: block;
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
  margin-bottom: 16rpx;
}

.example-text.result {
  color: #52c41a;
  font-weight: 500;
  margin-bottom: 0;
}

/* 提示标记 */
.tokens-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  margin-top: 16rpx;
}

.token-item {
  padding: 20rpx;
  background: #FFF9E6;
  border-radius: 12rpx;
  border: 2rpx solid #FAAD14;
}

.token-name {
  display: block;
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
}

.token-details {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.token-detail {
  display: block;
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
  padding-left: 24rpx;
}

/* 角色信息网格 */
.info-grid {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #F0F0F0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-key {
  font-size: 26rpx;
  color: #999;
  min-width: 140rpx;
}

.info-val {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  text-align: right;
}
</style>

