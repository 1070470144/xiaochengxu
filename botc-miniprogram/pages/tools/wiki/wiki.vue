<template>
  <view class="page">
    <!-- 统计信息 -->
    <view class="stats-section">
      <view class="stat-card-large">
        <text class="stat-num-large">{{ totalRoles }}</text>
        <text class="stat-label-large">收录角色</text>
      </view>
    </view>

    <!-- 搜索栏 -->
    <view class="search-section">
      <view class="search-box">
        <text class="search-icon">🔍</text>
        <input 
          class="search-input" 
          v-model="searchKeyword"
          placeholder="搜索角色、规则、术语..."
          @confirm="handleSearch"
        />
      </view>
    </view>

    <!-- 分类导航 -->
    <scroll-view scroll-x class="category-nav">
      <view class="category-list">
        <view 
          v-for="(cat, index) in categories" 
          :key="index"
          class="category-item"
          :class="{ active: currentCategory === index }"
          @click="switchCategory(index)"
        >
          <text class="cat-icon">{{ cat.icon }}</text>
          <text class="cat-name">{{ cat.name }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- 内容区域 -->
    <view class="content-container">
      <!-- 角色大全 -->
      <view v-if="currentCategory === 0">
        <!-- 角色类型标签 -->
        <scroll-view scroll-x class="role-tabs">
          <view 
            v-for="(tab, index) in roleTabs" 
            :key="index"
            class="role-tab"
            :class="{ active: currentRoleTab === index }"
            @click="switchRoleTab(index)"
          >
            {{ tab.name }}
          </view>
        </scroll-view>
        
        <!-- 角色列表 -->
        <view v-if="loadingRoles" class="loading-box">
          <uni-load-more status="loading" />
        </view>
        
        <view v-else-if="currentRoleList.length === 0" class="empty-box">
          <text class="empty-icon">📭</text>
          <text class="empty-text">暂无角色数据</text>
          <text class="empty-hint">请联系管理员添加角色</text>
        </view>
        
        <view v-else class="role-list">
          <view 
            v-for="role in currentRoleList" 
            :key="role._id"
            class="role-card card"
            @tap="handleRoleClick(role)"
          >
            <view class="role-left">
              <image 
                v-if="role.icon_url"
                class="role-icon"
                :src="role.icon_url"
                mode="aspectFit"
              />
              <view v-else class="role-icon-placeholder">
                {{ role.name.substring(0, 1) }}
              </view>
              
              <view class="role-info">
                <text class="role-name">{{ role.name }}</text>
                <text v-if="role.character_type" class="role-type" :class="'type-' + getTypeClass(role.character_type)">
                  {{ role.character_type }}
                </text>
              </view>
            </view>
            
            <text class="role-arrow">›</text>
          </view>
        </view>
      </view>

      <!-- 游戏规则 -->
      <view v-if="currentCategory === 1">
        <view class="empty-box">
          <text class="empty-icon">🚧</text>
          <text class="empty-text">规则功能开发中</text>
        </view>
      </view>

      <!-- 术语解释 -->
      <view v-if="currentCategory === 2">
        <view class="empty-box">
          <text class="empty-icon">🚧</text>
          <text class="empty-text">术语功能开发中</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'WikiPage',
  
  data() {
    return {
      searchKeyword: '',
      currentCategory: 0,
      currentRoleTab: 0,
      
      // 统计数据
      totalRoles: 0,
      
      // 分类
      categories: [
        { icon: '👤', name: '角色大全' },
        { icon: '📋', name: '游戏规则' },
        { icon: '💬', name: '术语解释' }
      ],
      
      // 角色标签
      roleTabs: [
        { name: '全部', value: 'all' },
        { name: '镇民', value: '镇民' },
        { name: '外来者', value: '外来者' },
        { name: '爪牙', value: '爪牙' },
        { name: '恶魔', value: '恶魔' }
      ],
      
      // 从数据库加载的角色列表
      roleList: [],
      loadingRoles: false,
      
      // 游戏规则列表
      ruleList: [],
      
      // 术语列表  
      termList: []
    }
  },
  
  computed: {
    // 当前角色列表
    currentRoleList() {
      if (this.currentRoleTab === 0) {
        return this.roleList;
      }
      const teamValue = this.roleTabs[this.currentRoleTab].value;
      return this.roleList.filter(role => {
        return role.character_type === teamValue;
      });
    }
  },
  
  onLoad() {
    this.loadStats();
    this.loadRoles();
  },
  
  methods: {
    // 加载统计数据
    async loadStats() {
      try {
        const db = uniCloud.database();
        
        // 查询角色数量
        const roleRes = await db.collection('wiki_entries')
          .where({ entry_type: 'role', status: 1 })
          .count();
        this.totalRoles = roleRes.result?.total || roleRes.total || 0;
        
        console.log('[loadStats] 统计完成 - 角色:', this.totalRoles);
      } catch (error) {
        console.error('[loadStats] 加载统计失败:', error);
      }
    },
    
    // 加载角色列表
    async loadRoles() {
      console.log('[loadRoles] 开始加载角色列表...');
      this.loadingRoles = true;
      
      try {
        const db = uniCloud.database();
        const res = await db.collection('wiki_entries')
          .where({
            entry_type: 'role',
            status: 1
          })
          .field({
            _id: true,
            title: true,
            'media.character_info': true,
            'role_detail.ability': true,
            'media.icon_url': true
          })
          .orderBy('created_at', 'desc')
          .limit(100)
          .get();
        
        console.log('[loadRoles] 数据库查询结果:', res);
        
        const data = res.result?.data || res.data || [];
        console.log('[loadRoles] 获取到', data.length, '条原始数据');
        
        if (data.length > 0) {
          console.log('[loadRoles] 第一条数据示例:', data[0]);
        }
        
        // 转换数据格式
        this.roleList = data.map(item => ({
          _id: item._id,
          name: item.title,
          character_type: item.media?.character_info?.character_type || '',
          ability: item.role_detail?.ability || '',
          icon_url: item.media?.icon_url || ''
        }));
        
        console.log('[loadRoles] ✓ 加载完成，共', this.roleList.length, '个角色');
        
        if (this.roleList.length > 0) {
          console.log('[loadRoles] 转换后第一个角色:', this.roleList[0]);
        }
      } catch (error) {
        console.error('[loadRoles] ✗ 加载失败:', error);
        uni.showToast({
          title: '加载角色失败: ' + error.message,
          icon: 'none',
          duration: 2000
        });
      } finally {
        this.loadingRoles = false;
      }
    },
    
    // 查看详情
    viewDetail(entryId) {
      uni.navigateTo({
        url: `/pages/tools/wiki/detail?id=${entryId}`
      });
    },
    
    // 搜索
    async handleSearch() {
      if (!this.searchKeyword.trim()) return;
      
      try {
        uni.showLoading({ title: '搜索中...' });
        
        const db = uniCloud.database();
        const dbCmd = db.command;
        
        const res = await db.collection('wiki_entries')
          .where({
            status: 1,
            title: dbCmd.or([
              new RegExp(this.searchKeyword.trim(), 'i'),
              dbCmd.eq(this.searchKeyword.trim())
            ])
          })
          .field({
            _id: true,
            title: true,
            entry_type: true
          })
          .limit(10)
          .get();
        
        uni.hideLoading();
        
        const results = res.result?.data || res.data || [];
        
        if (results.length > 0) {
          // 跳转到第一个结果
          this.viewDetail(results[0]._id);
        } else {
          uni.showToast({
            title: '未找到相关内容',
            icon: 'none'
          });
        }
      } catch (error) {
        uni.hideLoading();
        console.error('[handleSearch] 搜索失败:', error);
        uni.showToast({
          title: '搜索失败',
          icon: 'none'
        });
      }
    },
    
    // 切换分类
    switchCategory(index) {
      this.currentCategory = index
    },
    
    // 切换角色标签
    switchRoleTab(index) {
      this.currentRoleTab = index;
    },
    
    // 查看详情
    viewDetail(entryId) {
      console.log('[viewDetail] 跳转到详情页，ID:', entryId);
      uni.navigateTo({
        url: `/pages/tools/wiki/detail?id=${entryId}`
      });
    },
    
    // 处理角色点击
    handleRoleClick(role) {
      console.log('=== 角色点击事件触发 ===');
      console.log('角色名称:', role.name);
      console.log('角色ID:', role._id);
      console.log('完整数据:', role);
      
      if (!role._id) {
        console.error('错误：角色ID不存在！');
        uni.showToast({
          title: '数据错误',
          icon: 'none'
        });
        return;
      }
      
      console.log('准备跳转到:', `/pages/tools/wiki/detail?id=${role._id}`);
      
      uni.navigateTo({
        url: `/pages/tools/wiki/detail?id=${role._id}`,
        success: () => {
          console.log('✓ 跳转成功');
        },
        fail: (err) => {
          console.error('✗ 跳转失败:', err);
          uni.showToast({
            title: '跳转失败',
            icon: 'none'
          });
        }
      });
    },
    
    // 获取角色类型的CSS类名
    getTypeClass(characterType) {
      const typeMap = {
        '镇民': 'townsfolk',
        '外来者': 'outsider',
        '爪牙': 'minion',
        '恶魔': 'demon',
        '旅行者': 'traveler'
      };
      return typeMap[characterType] || 'unknown';
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

/* 搜索 */
.search-section {
  padding: 24rpx;
}

.search-box {
  display: flex;
  align-items: center;
  height: 72rpx;
  background: white;
  border-radius: 36rpx;
  padding: 0 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
}

.search-icon {
  font-size: 32rpx;
  margin-right: 12rpx;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
}

/* 分类导航 */
.category-nav {
  white-space: nowrap;
  padding: 0 24rpx 24rpx;
}

.category-list {
  display: inline-flex;
  gap: 16rpx;
}

.category-item {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  min-width: 120rpx;
  padding: 20rpx 24rpx;
  background: white;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.category-item.active {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.cat-icon {
  font-size: 36rpx;
  margin-bottom: 8rpx;
}

.cat-name {
  font-size: 24rpx;
  color: #333;
}

.category-item.active .cat-name {
  color: white;
  font-weight: bold;
}

/* 内容容器 */
.content-container {
  padding: 0 24rpx;
}

/* 角色标签 */
.role-tabs {
  white-space: nowrap;
  margin-bottom: 24rpx;
}

.role-tab {
  display: inline-block;
  padding: 16rpx 32rpx;
  background: white;
  border-radius: 30rpx;
  font-size: 26rpx;
  color: #666;
  margin-right: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.role-tab.active {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  font-weight: bold;
}

/* 角色列表 */
.role-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.role-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
}

.role-card:active {
  transform: scale(0.98);
  opacity: 0.9;
}

.role-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
  flex: 1;
}

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
  gap: 8rpx;
}

.role-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #1A1A1A;
}

.role-type {
  display: inline-block;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  font-weight: 500;
  max-width: fit-content;
}

.role-type.type-townsfolk {
  background: #f6ffed;
  color: #52c41a;
}

.role-type.type-outsider {
  background: #fffbe6;
  color: #faad14;
}

.role-type.type-minion {
  background: #fff7ed;
  color: #f97316;
}

.role-type.type-demon {
  background: #fff2f0;
  color: #ef4444;
}

.role-type.type-traveler {
  background: #e6f7ff;
  color: #1890ff;
}

.role-arrow {
  font-size: 48rpx;
  color: #ccc;
  margin-left: 16rpx;
  flex-shrink: 0;
}

/* 术语卡片 */
.term-card {
  padding: 28rpx;
  margin-bottom: 20rpx;
}

.term-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.term-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #1A1A1A;
}

.term-type {
  padding: 6rpx 16rpx;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  border-radius: 20rpx;
  font-size: 22rpx;
}

.term-explain {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
}

/* 通用卡片 */
.card {
  background: #FFFFFF;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

/* 统计区域 */
.stats-section {
  padding: 32rpx 24rpx 24rpx;
}

.stat-card-large {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 32rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.3);
}

.stat-num-large {
  font-size: 80rpx;
  font-weight: bold;
  color: white;
  margin-bottom: 12rpx;
  line-height: 1;
}

.stat-label-large {
  font-size: 32rpx;
  color: rgba(255, 255, 255, 0.95);
  font-weight: 500;
  letter-spacing: 2rpx;
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
  font-weight: 500;
}

.empty-hint {
  font-size: 24rpx;
  color: #ccc;
}
</style>

