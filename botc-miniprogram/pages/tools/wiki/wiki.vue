<template>
  <view class="page">
    <!-- 页面头部 -->
    <view class="header">
      <text class="header-title">血染百科</text>
      <text class="header-subtitle">Blood on the Clocktower Encyclopedia</text>
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
  
  methods: {
    // 搜索
    handleSearch() {
      if (!this.searchKeyword.trim()) return
      uni.showToast({
        title: '搜索功能待完善',
        icon: 'none'
      })
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
</style>

