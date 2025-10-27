<template>
  <view class="page">
    <!-- 顶部Tab -->
    <view class="main-tabs">
      <view 
        class="main-tab"
        :class="{ active: mainTab === 0 }"
        @click="switchMainTab(0)"
      >
        <text class="tab-icon">🎭</text>
        <text class="tab-name">说书人榜</text>
      </view>
      <view 
        class="main-tab"
        :class="{ active: mainTab === 1 }"
        @click="switchMainTab(1)"
      >
        <text class="tab-icon">👤</text>
        <text class="tab-name">角色榜</text>
      </view>
    </view>
    
    <!-- 说书人榜单 -->
    <view v-if="mainTab === 0" class="content">
      <!-- 子Tab -->
      <scroll-view scroll-x class="sub-tabs">
        <view 
          v-for="(tab, index) in storytellerTabs" 
          :key="index"
          class="sub-tab"
          :class="{ active: storytellerTab === index }"
          @click="switchStorytellerTab(index)"
        >
          {{ tab.name }}
        </view>
      </scroll-view>
      
      <!-- 说书人列表 -->
      <view v-if="loadingStorytellers" class="loading-box">
        <uni-load-more status="loading" />
      </view>
      
      <view v-else-if="storytellerList.length === 0" class="empty-box">
        <text class="empty-icon">📭</text>
        <text class="empty-text">暂无数据</text>
      </view>
      
      <view v-else class="ranking-list">
        <view 
          v-for="(item, index) in storytellerList" 
          :key="item._id"
          class="ranking-item card"
          @click="viewStorytellerProfile(item._id)"
        >
          <view class="rank-badge" :class="'rank-' + (index + 1)">
            {{ index + 1 }}
          </view>
          
          <image 
            class="user-avatar"
            :src="item.avatar_file?.url || '/static/default-avatar.png'"
            mode="aspectFill"
          />
          
          <view class="user-info">
            <view class="name-row">
              <text class="user-name">{{ item.nickname || '匿名用户' }}</text>
              <!-- 认证标识 -->
              <view v-if="item.storyteller_certified && item.storyteller_level" class="cert-badge-small">
                <text class="cert-icon-small">{{ item.storyteller_level === 1 ? '⭐' : '⭐⭐' }}</text>
              </view>
            </view>
            <view class="user-stats">
              <text class="stat-text">👥 粉丝 {{ item.storyteller_stats?.fans_count || 0 }}</text>
              <text class="stat-text">📜 剧本 {{ item.storyteller_stats?.script_count || 0 }}</text>
            </view>
          </view>
          
          <view class="score-box">
            <text class="score-num">{{ getStorytellerScore(item) }}</text>
            <text class="score-label">{{ storytellerTabs[storytellerTab].unit }}</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 角色榜单 -->
    <view v-if="mainTab === 1" class="content">
      <!-- 子Tab -->
      <scroll-view scroll-x class="sub-tabs">
        <view 
          v-for="(tab, index) in roleTabs" 
          :key="index"
          class="sub-tab"
          :class="{ active: roleTab === index }"
          @click="switchRoleTab(index)"
        >
          {{ tab.name }}
        </view>
      </scroll-view>
      
      <!-- 角色列表 -->
      <view v-if="loadingRoles" class="loading-box">
        <uni-load-more status="loading" />
      </view>
      
      <view v-else-if="roleList.length === 0" class="empty-box">
        <text class="empty-icon">📭</text>
        <text class="empty-text">暂无数据</text>
      </view>
      
      <view v-else class="ranking-list">
        <view 
          v-for="(role, index) in roleList" 
          :key="role._id"
          class="ranking-item card"
          @click="viewRoleDetail(role._id)"
        >
          <view class="rank-badge" :class="'rank-' + (index + 1)">
            {{ index + 1 }}
          </view>
          
          <image 
            v-if="role.media?.icon_url"
            class="role-icon"
            :src="role.media.icon_url"
            mode="aspectFit"
          />
          <view v-else class="role-icon-placeholder">
            {{ role.title.substring(0, 1) }}
          </view>
          
          <view class="role-info">
            <text class="role-name">{{ role.title }}</text>
            <view class="role-stats">
              <text class="stat-text">👁️ {{ role.stats?.view_count || 0 }}</text>
              <text class="stat-text">❤️ {{ role.stats?.like_count || 0 }}</text>
              <text class="stat-text">💬 {{ role.stats?.comment_count || 0 }}</text>
            </view>
          </view>
          
          <view class="score-box">
            <text class="score-num">{{ getRoleScore(role) }}</text>
            <text class="score-label">{{ roleTabs[roleTab].unit }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'RankingPage',
  
  data() {
    return {
      mainTab: 1, // 默认显示角色榜
      
      // 说书人榜单
      storytellerTab: 0,
      storytellerTabs: [
        { name: '粉丝榜', field: 'fans_count', unit: '粉丝' },
        { name: '热度榜', field: 'heat_score', unit: '热度' }
      ],
      storytellerList: [],
      loadingStorytellers: false,
      
      // 角色榜单
      roleTab: 0,
      roleTabs: [
        { name: '最新榜', field: 'created_at', unit: '' },
        { name: '人气榜', field: 'favorite_count', unit: '收藏' },
        { name: '点赞榜', field: 'like_count', unit: '点赞' },
        { name: '热度榜', field: 'view_count', unit: '浏览' }
      ],
      roleList: [],
      loadingRoles: false
    }
  },
  
  onLoad() {
    this.loadRoleRanking();
  },
  
  methods: {
    // 切换主Tab
    switchMainTab(index) {
      this.mainTab = index;
      if (index === 0) {
        this.loadStorytellerRanking();
      } else {
        this.loadRoleRanking();
      }
    },
    
    // 切换说书人子Tab
    switchStorytellerTab(index) {
      this.storytellerTab = index;
      this.loadStorytellerRanking();
    },
    
    // 切换角色子Tab
    switchRoleTab(index) {
      this.roleTab = index;
      this.loadRoleRanking();
    },
    
    // 加载说书人榜单
    async loadStorytellerRanking() {
      this.loadingStorytellers = true;
      
      try {
        const res = await uniCloud.callFunction({
          name: 'wiki-ranking-storytellers',
          data: {
            type: this.storytellerTabs[this.storytellerTab].field,
            limit: 50
          }
        });
        
        if (res.result.code === 0) {
          this.storytellerList = res.result.data.list || [];
          console.log('[loadStorytellerRanking] 加载成功，共', this.storytellerList.length, '位');
        }
      } catch (error) {
        console.error('[loadStorytellerRanking] 加载失败:', error);
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        });
      } finally {
        this.loadingStorytellers = false;
      }
    },
    
    // 加载角色榜单
    async loadRoleRanking() {
      this.loadingRoles = true;
      
      try {
        const tab = this.roleTabs[this.roleTab];
        
        const db = uniCloud.database();
        let query = db.collection('wiki_entries')
          .where({
            entry_type: 'role',
            status: 1
          })
          .field({
            _id: true,
            title: true,
            'media.icon_url': true,
            'media.character_info': true,
            stats: true,
            created_at: true
          });
        
        // 根据不同榜单排序
        if (tab.field === 'created_at') {
          query = query.orderBy('created_at', 'desc');
        } else {
          query = query.orderBy(`stats.${tab.field}`, 'desc');
        }
        
        const res = await query.limit(50).get();
        
        const data = res.result?.data || res.data || [];
        this.roleList = data;
        
        console.log('[loadRoleRanking] 加载成功，共', this.roleList.length, '个角色');
      } catch (error) {
        console.error('[loadRoleRanking] 加载失败:', error);
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        });
      } finally {
        this.loadingRoles = false;
      }
    },
    
    // 查看说书人主页
    viewStorytellerProfile(userId) {
      uni.navigateTo({
        url: `/pages/user/profile/profile?userId=${userId}`
      });
    },
    
    // 查看角色详情
    viewRoleDetail(roleId) {
      uni.navigateTo({
        url: `/pages/tools/wiki/detail?id=${roleId}`
      });
    },
    
    // 获取说书人分数
    getStorytellerScore(item) {
      const tab = this.storytellerTabs[this.storytellerTab];
      if (tab.field === 'fans_count') {
        return item.storyteller_stats?.fans_count || 0;
      } else {
        return item.storyteller_stats?.heat_score || 0;
      }
    },
    
    // 获取角色分数
    getRoleScore(role) {
      const tab = this.roleTabs[this.roleTab];
      if (tab.field === 'created_at') {
        return '新';
      } else {
        return role.stats?.[tab.field] || 0;
      }
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #F5F5F5;
  padding-bottom: 40rpx;
}

/* 主Tab */
.main-tabs {
  display: flex;
  background: white;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.main-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx 24rpx;
  gap: 8rpx;
  transition: all 0.3s;
}

.main-tab.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.tab-icon {
  font-size: 40rpx;
}

.tab-name {
  font-size: 28rpx;
  color: #666;
  font-weight: 500;
}

.main-tab.active .tab-name {
  color: white;
  font-weight: bold;
}

/* 子Tab */
.content {
  padding: 24rpx;
}

.sub-tabs {
  white-space: nowrap;
  margin-bottom: 24rpx;
}

.sub-tab {
  display: inline-block;
  padding: 16rpx 32rpx;
  background: white;
  border-radius: 30rpx;
  font-size: 26rpx;
  color: #666;
  margin-right: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
}

.sub-tab.active {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  font-weight: bold;
}

/* 加载和空状态 */
.loading-box,
.empty-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
  gap: 16rpx;
}

.empty-icon {
  font-size: 96rpx;
  opacity: 0.6;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

/* 榜单列表 */
.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  gap: 20rpx;
}

.ranking-item:active {
  transform: scale(0.98);
  opacity: 0.9;
}

/* 排名徽章 */
.rank-badge {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: bold;
  color: white;
  background: linear-gradient(135deg, #bdc3c7 0%, #95a5a6 100%);
  border-radius: 50%;
  flex-shrink: 0;
}

.rank-badge.rank-1 {
  background: linear-gradient(135deg, #f7d794 0%, #f39c12 100%);
  font-size: 32rpx;
  box-shadow: 0 4rpx 12rpx rgba(243, 156, 18, 0.3);
}

.rank-badge.rank-2 {
  background: linear-gradient(135deg, #dfe6e9 0%, #b2bec3 100%);
  font-size: 30rpx;
}

.rank-badge.rank-3 {
  background: linear-gradient(135deg, #f8b878 0%, #e17055 100%);
}

/* 用户头像 */
.user-avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: #F5F5F5;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 8rpx;
}

.user-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #1A1A1A;
}

.cert-badge-small {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2rpx 8rpx;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 165, 0, 0.15) 100%);
  border-radius: 12rpx;
  border: 1rpx solid rgba(255, 215, 0, 0.4);
}

.cert-icon-small {
  font-size: 20rpx;
}

.user-stats {
  display: flex;
  gap: 24rpx;
}

.stat-text {
  font-size: 24rpx;
  color: #999;
}

/* 角色图标 */
.role-icon {
  width: 96rpx;
  height: 96rpx;
  border-radius: 12rpx;
  background: #F5F5F5;
  flex-shrink: 0;
}

.role-icon-placeholder {
  width: 96rpx;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  font-weight: bold;
  color: white;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border-radius: 12rpx;
  flex-shrink: 0;
}

.role-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.role-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #1A1A1A;
}

.role-stats {
  display: flex;
  gap: 20rpx;
}

/* 分数框 */
.score-box {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4rpx;
}

.score-num {
  font-size: 40rpx;
  font-weight: bold;
  color: #4facfe;
}

.score-label {
  font-size: 22rpx;
  color: #999;
}

/* 通用卡片 */
.card {
  background: white;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}
</style>

