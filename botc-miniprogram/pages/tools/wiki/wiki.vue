<template>
  <view class="page">
    <!-- 页面头部 -->
    <view class="header">
      <text class="header-title">血染百科</text>
      <text class="header-subtitle">Blood on the Clocktower Encyclopedia</text>
    </view>

    <!-- 🆕 导入百科功能区 -->
    <view class="import-section">
      <view class="import-card card">
        <view class="import-header">
          <text class="import-title">📚 从钟楼百科导入</text>
          <text class="import-desc">复制百科页面链接，一键导入官方内容</text>
        </view>
        <button class="import-btn" @click="showImportDialog">
          🔗 导入百科链接
        </button>
      </view>
    </view>

    <!-- 🆕 最近导入 -->
    <view v-if="recentImports.length > 0" class="recent-section">
      <view class="section-header">
        <text class="section-title">最近导入</text>
      </view>
      <scroll-view scroll-x class="recent-scroll" show-scrollbar="false">
        <view class="recent-list">
          <view 
            v-for="item in recentImports" 
            :key="item._id"
            class="recent-item card"
            @click="viewDetail(item._id)"
          >
            <view v-if="item.media && item.media.icon_url" class="recent-icon-wrapper">
              <image 
                class="recent-icon"
                :src="item.media.icon_url"
                mode="aspectFit"
              />
            </view>
            <view v-else class="recent-icon-placeholder">
              {{ getTypeIcon(item.entry_type) }}
            </view>
            <text class="recent-title">{{ item.title }}</text>
            <text v-if="item.role_info && item.role_info.team_name" class="recent-team">
              {{ item.role_info.team_name }}
            </text>
          </view>
        </view>
      </scroll-view>
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
      <!-- 新手指南 -->
      <view v-if="currentCategory === 0">
        <view 
          v-for="(item, index) in guideList" 
          :key="index"
          class="wiki-card card"
          @click="showDetail(item)"
        >
          <text class="wiki-icon">{{ item.icon }}</text>
          <view class="wiki-content">
            <text class="wiki-title">{{ item.title }}</text>
            <text class="wiki-desc">{{ item.desc }}</text>
          </view>
          <text class="wiki-arrow">›</text>
        </view>
      </view>

      <!-- 角色大全 -->
      <view v-if="currentCategory === 1">
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
        <view class="role-list">
          <view 
            v-for="(role, index) in currentRoleList" 
            :key="index"
            class="role-card card"
            :class="'team-' + role.team"
            @click="showRoleDetail(role)"
          >
            <view class="role-header">
              <text class="role-name">{{ role.name }}</text>
              <text class="team-badge" :class="'badge-' + role.team">
                {{ role.teamName }}
              </text>
            </view>
            <text class="role-ability">{{ role.ability }}</text>
          </view>
        </view>
      </view>

      <!-- 游戏规则 -->
      <view v-if="currentCategory === 2">
        <view 
          v-for="(rule, index) in ruleList" 
          :key="index"
          class="wiki-card card"
          @click="showDetail(rule)"
        >
          <text class="wiki-icon">{{ rule.icon }}</text>
          <view class="wiki-content">
            <text class="wiki-title">{{ rule.title }}</text>
            <text class="wiki-desc">{{ rule.desc }}</text>
          </view>
          <text class="wiki-arrow">›</text>
        </view>
      </view>

      <!-- 术语解释 -->
      <view v-if="currentCategory === 3">
        <view 
          v-for="(term, index) in termList" 
          :key="index"
          class="term-card card"
        >
          <view class="term-header">
            <text class="term-name">{{ term.name }}</text>
            <text class="term-type">{{ term.type }}</text>
          </view>
          <text class="term-explain">{{ term.explain }}</text>
        </view>
      </view>
    </view>
    
    <!-- 🆕 导入弹窗 -->
    <uni-popup ref="importPopup" type="center" :mask-click="false">
      <view class="import-dialog">
        <view class="dialog-header">
          <text class="dialog-title">导入百科内容</text>
          <text class="dialog-close" @click="closeImportDialog">✕</text>
        </view>
        
        <view class="dialog-body">
          <view class="input-label">钟楼百科页面链接</view>
          <textarea 
            class="url-input"
            v-model="importUrl"
            placeholder="粘贴链接，例如：&#10;https://clocktower-wiki.gstonegames.com/index.php?title=洗衣妇"
            placeholder-class="placeholder"
            :auto-height="true"
            :maxlength="500"
          />
          
          <view class="input-actions">
            <text class="char-count">{{ importUrl.length }}/500</text>
            <button class="paste-btn" size="mini" @click="pasteUrl">
              📋 粘贴
            </button>
          </view>
          
          <view class="help-text">
            💡 提示：在钟楼百科网页中复制页面链接即可
          </view>
        </view>
        
        <view class="dialog-footer">
          <button class="btn-secondary" @click="closeImportDialog">
            取消
          </button>
          <button 
            class="btn-primary" 
            :loading="importing"
            :disabled="!importUrl.trim()"
            @click="importWiki"
          >
            {{ importing ? '解析中...' : '开始导入' }}
          </button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
export default {
  name: 'WikiPage',
  
  data() {
    return {
      // 🆕 新增数据
      importUrl: '',
      importing: false,
      recentImports: [],
      
      searchKeyword: '',
      currentCategory: 0,
      currentRoleTab: 0,
      
      // 分类
      categories: [
        { icon: '📖', name: '新手指南' },
        { icon: '👤', name: '角色大全' },
        { icon: '📋', name: '游戏规则' },
        { icon: '💬', name: '术语解释' }
      ],
      
      // 新手指南
      guideList: [
        { icon: '🎮', title: '游戏介绍', desc: '了解血染钟楼的基本玩法', content: '血染钟楼是一款社交推理桌游...' },
        { icon: '👥', title: '阵营介绍', desc: '善良、邪恶及中立角色', content: '游戏分为善良阵营和邪恶阵营...' },
        { icon: '⏰', title: '游戏流程', desc: '白天和黑夜的完整流程', content: '游戏分为白天和夜晚两个阶段...' },
        { icon: '🎭', title: '说书人职责', desc: '如何成为优秀的说书人', content: '说书人是游戏的主持人...' }
      ],
      
      // 角色标签
      roleTabs: [
        { name: '全部', value: 'all' },
        { name: '镇民', value: 'townsfolk' },
        { name: '外来者', value: 'outsider' },
        { name: '爪牙', value: 'minion' },
        { name: '恶魔', value: 'demon' }
      ],
      
      // 角色示例数据
      roleList: [
        { name: '洗衣妇', team: 'townsfolk', teamName: '镇民', ability: '开局得知某位玩家的角色' },
        { name: '图书管理员', team: 'townsfolk', teamName: '镇民', ability: '开局得知外来者的数量' },
        { name: '厨师', team: 'townsfolk', teamName: '镇民', ability: '开局得知邻座邪恶玩家对数' },
        { name: '酒鬼', team: 'outsider', teamName: '外来者', ability: '不知道自己的真实角色' },
        { name: '隐士', team: 'outsider', teamName: '外来者', ability: '被提名即死亡' },
        { name: '男爵', team: 'minion', teamName: '爪牙', ability: '增加两个外来者角色' },
        { name: '投毒者', team: 'minion', teamName: '爪牙', ability: '每夜选择一人，其能力失效' },
        { name: '小恶魔', team: 'demon', teamName: '恶魔', ability: '每夜选择一名玩家杀死' }
      ],
      
      // 游戏规则
      ruleList: [
        { icon: '🌙', title: '夜晚阶段', desc: '夜晚时各角色的行动顺序' },
        { icon: '☀️', title: '白天阶段', desc: '白天的讨论、提名和投票' },
        { icon: '⚖️', title: '投票规则', desc: '提名、举手和处决规则' },
        { icon: '💀', title: '死亡规则', desc: '角色死亡后的能力和投票权' },
        { icon: '🏆', title: '胜利条件', desc: '各阵营的胜利条件' }
      ],
      
      // 术语列表
      termList: [
        { name: '魔典', type: '游戏术语', explain: '说书人使用的记录本，记录所有角色信息和夜晚行动' },
        { name: '毒害', type: '能力术语', explain: '被毒害的玩家能力失效，且获得的信息可能是错误的' },
        { name: '提名', type: '投票术语', explain: '白天时玩家可以提名某人处决，每人每天只能提名一次' },
        { name: '邻座', type: '位置术语', explain: '指你左右相邻的两位存活玩家' }
      ]
    }
  },
  
  computed: {
    // 当前角色列表
    currentRoleList() {
      if (this.currentRoleTab === 0) {
        return this.roleList
      }
      const teamValue = this.roleTabs[this.currentRoleTab].value
      return this.roleList.filter(role => role.team === teamValue)
    }
  },
  
  onLoad() {
    this.loadRecentImports();
  },
  
  methods: {
    // 🆕 加载最近导入
    async loadRecentImports() {
      try {
        const db = uniCloud.database();
        const res = await db.collection('wiki_entries')
          .orderBy('created_at', 'desc')
          .limit(10)
          .field({
            _id: true,
            title: true,
            entry_type: true,
            'media.icon_url': true,
            'role_info.team_name': true
          })
          .get();
        
        this.recentImports = res.result.data || [];
      } catch (error) {
        console.error('加载最近导入失败', error);
      }
    },
    
    // 🆕 显示导入弹窗
    showImportDialog() {
      this.$refs.importPopup.open();
    },
    
    // 🆕 关闭导入弹窗
    closeImportDialog() {
      this.importUrl = '';
      this.$refs.importPopup.close();
    },
    
    // 🆕 粘贴URL
    async pasteUrl() {
      try {
        const res = await uni.getClipboardData();
        this.importUrl = res.data;
        uni.showToast({
          title: '粘贴成功',
          icon: 'success',
          duration: 1000
        });
      } catch (error) {
        uni.showToast({
          title: '粘贴失败',
          icon: 'none'
        });
      }
    },
    
    // 🆕 导入百科
    async importWiki() {
      if (!this.importUrl.trim()) {
        uni.showToast({
          title: '请输入百科链接',
          icon: 'none'
        });
        return;
      }
      
      // 验证URL
      if (!this.importUrl.includes('clocktower-wiki.gstonegames.com')) {
        uni.showToast({
          title: '请输入钟楼百科的页面链接',
          icon: 'none',
          duration: 2000
        });
        return;
      }
      
      this.importing = true;
      
      try {
        uni.showLoading({
          title: '解析中...',
          mask: true
        });
        
        const res = await uniCloud.callFunction({
          name: 'wiki-parse-url',
          data: {
            url: this.importUrl.trim(),
            userId: getApp().globalData.userId
          }
        });
        
        uni.hideLoading();
        
        if (res.result.code === 0) {
          uni.showToast({
            title: res.result.from_cache ? '已加载' : '导入成功',
            icon: 'success'
          });
          
          // 关闭弹窗
          this.closeImportDialog();
          
          // 刷新最近导入
          this.loadRecentImports();
          
          // 跳转到详情页
          setTimeout(() => {
            this.viewDetail(res.result.data._id);
          }, 800);
        } else {
          uni.showModal({
            title: '导入失败',
            content: res.result.message || '请检查链接是否正确',
            showCancel: false
          });
        }
      } catch (error) {
        uni.hideLoading();
        console.error('导入失败', error);
        uni.showModal({
          title: '导入失败',
          content: '网络错误，请稍后重试',
          showCancel: false
        });
      } finally {
        this.importing = false;
      }
    },
    
    // 🆕 查看详情
    viewDetail(entryId) {
      uni.navigateTo({
        url: `/pages/tools/wiki/detail?id=${entryId}`
      });
    },
    
    // 🆕 获取类型图标
    getTypeIcon(type) {
      const icons = {
        role: '👤',
        script: '📜',
        rule: '📋',
        guide: '📖',
        term: '💬'
      };
      return icons[type] || '📄';
    },
    
    // 搜索
    async handleSearch() {
      if (!this.searchKeyword.trim()) return;
      
      try {
        uni.showLoading({ title: '搜索中...' });
        
        const res = await uniCloud.callFunction({
          name: 'wiki-search',
          data: {
            keyword: this.searchKeyword.trim(),
            userId: getApp().globalData.userId
          }
        });
        
        uni.hideLoading();
        
        if (res.result.code === 0) {
          const results = res.result.data.list;
          if (results.length > 0) {
            // 显示搜索结果，这里简化为跳转到第一个结果
            this.viewDetail(results[0]._id);
          } else {
            uni.showToast({
              title: '未找到相关内容',
              icon: 'none'
            });
          }
        }
      } catch (error) {
        uni.hideLoading();
        console.error('搜索失败', error);
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
      this.currentRoleTab = index
    },
    
    // 显示详情
    showDetail(item) {
      uni.showModal({
        title: item.title,
        content: item.content || item.desc,
        showCancel: false
      })
    },
    
    // 显示角色详情
    showRoleDetail(role) {
      uni.showModal({
        title: role.name,
        content: `阵营：${role.teamName}\n能力：${role.ability}`,
        showCancel: false
      })
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

/* 页面头部 */
.header {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  padding: 60rpx 40rpx 40rpx;
  text-align: center;
}

.header-title {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #FFFFFF;
  margin-bottom: 12rpx;
}

.header-subtitle {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
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

/* Wiki卡片 */
.wiki-card {
  display: flex;
  align-items: center;
  padding: 28rpx;
  margin-bottom: 20rpx;
  background: white;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.wiki-card:active {
  transform: scale(0.98);
  opacity: 0.9;
}

.wiki-icon {
  font-size: 48rpx;
  margin-right: 24rpx;
}

.wiki-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.wiki-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #1A1A1A;
}

.wiki-desc {
  font-size: 24rpx;
  color: #999;
}

.wiki-arrow {
  font-size: 48rpx;
  color: #ccc;
  margin-left: 16rpx;
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
  padding: 28rpx;
  border-left: 6rpx solid #ccc;
}

.role-card:active {
  transform: scale(0.98);
  opacity: 0.9;
}

.role-card.team-townsfolk {
  border-left-color: #52c41a;
}

.role-card.team-outsider {
  border-left-color: #faad14;
}

.role-card.team-minion {
  border-left-color: #f97316;
}

.role-card.team-demon {
  border-left-color: #ef4444;
}

.role-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.role-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #1A1A1A;
}

.team-badge {
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
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

.role-ability {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
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

/* 🆕 导入功能区 */
.import-section {
  padding: 0 24rpx 24rpx;
}

.import-card {
  padding: 32rpx;
}

.import-header {
  margin-bottom: 24rpx;
}

.import-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #1A1A1A;
  margin-bottom: 8rpx;
}

.import-desc {
  display: block;
  font-size: 24rpx;
  color: #999;
  line-height: 1.5;
}

.import-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  font-size: 30rpx;
  font-weight: 500;
  border-radius: 12rpx;
  border: none;
  box-shadow: 0 8rpx 24rpx rgba(79, 172, 254, 0.3);
}

/* 🆕 最近导入 */
.recent-section {
  padding: 0 24rpx 24rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #1A1A1A;
}

.recent-scroll {
  white-space: nowrap;
}

.recent-list {
  display: inline-flex;
  gap: 16rpx;
  padding-bottom: 8rpx;
}

.recent-item {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  width: 160rpx;
  padding: 20rpx 12rpx;
}

.recent-item:active {
  transform: scale(0.95);
  opacity: 0.8;
}

.recent-icon-wrapper {
  width: 96rpx;
  height: 96rpx;
  margin-bottom: 12rpx;
  border-radius: 12rpx;
  overflow: hidden;
  background: #F5F5F5;
}

.recent-icon {
  width: 100%;
  height: 100%;
}

.recent-icon-placeholder {
  width: 96rpx;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 56rpx;
  border-radius: 12rpx;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  margin-bottom: 12rpx;
}

.recent-title {
  font-size: 26rpx;
  color: #333;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  margin-bottom: 4rpx;
}

.recent-team {
  font-size: 22rpx;
  color: #999;
}

/* 🆕 导入弹窗 */
.import-dialog {
  width: 640rpx;
  background: white;
  border-radius: 24rpx;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #F0F0F0;
}

.dialog-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #1A1A1A;
}

.dialog-close {
  font-size: 40rpx;
  color: #999;
  padding: 8rpx;
  line-height: 1;
}

.dialog-body {
  padding: 32rpx;
}

.input-label {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 16rpx;
  font-weight: 500;
}

.url-input {
  width: 100%;
  min-height: 200rpx;
  padding: 20rpx;
  background: #F8F8F8;
  border-radius: 12rpx;
  font-size: 26rpx;
  line-height: 1.6;
  color: #333;
}

.placeholder {
  color: #BBB;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16rpx;
}

.char-count {
  font-size: 24rpx;
  color: #999;
}

.paste-btn {
  padding: 8rpx 20rpx;
  background: #4facfe;
  color: white;
  font-size: 24rpx;
  border-radius: 8rpx;
  border: none;
}

.help-text {
  margin-top: 24rpx;
  padding: 16rpx;
  background: #E8F4FD;
  border-radius: 8rpx;
  font-size: 24rpx;
  color: #4facfe;
  line-height: 1.6;
}

.dialog-footer {
  display: flex;
  gap: 16rpx;
  padding: 24rpx 32rpx;
  border-top: 1rpx solid #F0F0F0;
}

.btn-secondary,
.btn-primary {
  flex: 1;
  height: 80rpx;
  font-size: 28rpx;
  border-radius: 12rpx;
  border: none;
}

.btn-secondary {
  background: #F5F5F5;
  color: #666;
}

.btn-primary {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.btn-primary[disabled] {
  opacity: 0.5;
}
</style>

