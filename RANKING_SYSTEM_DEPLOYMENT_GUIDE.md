# 剧本排行榜系统 - 部署指南

## 📦 新增的云函数

### 1. script-ranking-hot（热门排行）
**功能**: 按热度算法排序剧本
**算法**: `热度 = 浏览×0.3 + 下载×0.4 + 评分×20 + 收藏×0.3`
**支持周期**: 总榜/周榜/月榜

### 2. script-ranking-new（最新排行）
**功能**: 按创建时间倒序排列
**特点**: 展示最新上传的剧本

### 3. script-ranking-download（下载排行）
**功能**: 按下载次数倒序排列
**支持周期**: 总榜/周榜/月榜

### 4. script-ranking-rating（评分排行）
**功能**: 按平均评分倒序排列
**要求**: 至少5个评分才能上榜

---

## 🚀 部署步骤

### Step 1: 上传云函数
在 HBuilderX 中：

```
右键 script-ranking-hot → 上传部署
右键 script-ranking-new → 上传部署
右键 script-ranking-download → 上传部署
右键 script-ranking-rating → 上传部署
```

### Step 2: 测试云函数
使用 HBuilderX 的云函数调试功能测试：

#### 测试热门排行
```javascript
{
  "page": 1,
  "pageSize": 10,
  "period": "all"  // all/weekly/monthly
}
```

#### 测试最新排行
```javascript
{
  "page": 1,
  "pageSize": 10
}
```

#### 测试下载排行
```javascript
{
  "page": 1,
  "pageSize": 10,
  "period": "all"
}
```

#### 测试评分排行
```javascript
{
  "page": 1,
  "pageSize": 10,
  "minRatingCount": 5
}
```

---

## 📱 前端接入示例

### 在剧本排行页面中使用

```vue
<template>
  <view class="page">
    <!-- Tab 切换 -->
    <view class="tabs">
      <view 
        v-for="(tab, index) in tabs" 
        :key="index"
        class="tab"
        :class="{ active: currentTab === index }"
        @click="switchTab(index)">
        {{ tab.name }}
      </view>
    </view>
    
    <!-- 排行榜列表 -->
    <scroll-view 
      scroll-y 
      class="ranking-list"
      @scrolltolower="loadMore">
      <view 
        v-for="(item, index) in scriptList" 
        :key="item._id"
        class="ranking-item"
        @click="goToDetail(item._id)">
        <view class="rank">{{ item.rank }}</view>
        <image :src="item.cover_image" class="cover" />
        <view class="info">
          <text class="title">{{ item.title }}</text>
          <text class="meta">
            ⭐{{ item.rating }} | 
            👁️{{ item.view_count }} | 
            💾{{ item.download_count }}
          </text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      currentTab: 0,
      tabs: [
        { name: '热门', type: 'hot' },
        { name: '最新', type: 'new' },
        { name: '下载', type: 'download' },
        { name: '评分', type: 'rating' }
      ],
      scriptList: [],
      page: 1,
      pageSize: 20,
      hasMore: true,
      loading: false
    };
  },
  
  onLoad() {
    this.loadRanking();
  },
  
  methods: {
    // 加载排行榜
    async loadRanking() {
      if (this.loading || !this.hasMore) return;
      
      this.loading = true;
      
      try {
        const currentType = this.tabs[this.currentTab].type;
        const functionName = `script-ranking-${currentType}`;
        
        const res = await uniCloud.callFunction({
          name: functionName,
          data: {
            page: this.page,
            pageSize: this.pageSize,
            period: 'all' // 或 'weekly', 'monthly'
          }
        });
        
        if (res.result.code === 0) {
          const data = res.result.data;
          
          if (this.page === 1) {
            this.scriptList = data.list;
          } else {
            this.scriptList = [...this.scriptList, ...data.list];
          }
          
          this.hasMore = data.hasNext;
          this.page++;
        }
      } catch (error) {
        console.error('加载排行榜失败:', error);
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
    },
    
    // 切换Tab
    switchTab(index) {
      this.currentTab = index;
      this.page = 1;
      this.hasMore = true;
      this.scriptList = [];
      this.loadRanking();
    },
    
    // 加载更多
    loadMore() {
      this.loadRanking();
    },
    
    // 查看详情
    goToDetail(id) {
      uni.navigateTo({
        url: `/pages/script/detail/detail?id=${id}`
      });
    }
  }
};
</script>
```

---

## 📊 数据结构说明

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Number | 否 | 页码，默认1 |
| pageSize | Number | 否 | 每页数量，默认20 |
| period | String | 否 | 周期（hot/download支持）：all/weekly/monthly |
| minRatingCount | Number | 否 | 最少评分数（rating专用），默认5 |

### 返回数据

```javascript
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "_id": "剧本ID",
        "title": "剧本标题",
        "author": "作者",
        "cover_image": "封面图URL",
        "player_count": "5-7人",
        "rating": 4.5,
        "rating_count": 120,
        "view_count": 1500,
        "download_count": 300,
        "favorite_count": 80,
        "rank": 1,
        "calculated_heat": 568.5  // 仅hot排行有此字段
      }
    ],
    "total": 150,
    "page": 1,
    "pageSize": 20,
    "hasNext": true
  }
}
```

---

## 🔄 热度分数更新策略

### 实时计算 vs 定时计算

#### 方案1: 实时计算（当前实现）
- **优点**: 数据实时准确
- **缺点**: 每次请求都计算，性能开销大
- **适用**: 初期用户量不大时

#### 方案2: 定时计算（推荐）
- **优点**: 性能好，响应快
- **缺点**: 数据有延迟（可接受）
- **实现**: 使用定时任务每小时更新一次

### 未来优化：定时任务

创建云函数 `script-calculate-heat`（已存在），配置定时触发：

```javascript
// uniCloud 控制台配置定时触发器
// Cron 表达式: 0 */1 * * * * (每小时)
exports.main = async (event, context) => {
  const db = uniCloud.database();
  
  // 批量计算所有剧本的热度分数
  const scripts = await db.collection('opendb-botc-scripts')
    .where({ status: 1 })
    .get();
  
  const updates = scripts.data.map(script => {
    const heatScore = (
      (script.view_count || 0) * 0.3 + 
      (script.download_count || 0) * 0.4 + 
      (script.rating || 0) * 20 + 
      (script.favorite_count || 0) * 0.3
    );
    
    return db.collection('opendb-botc-scripts')
      .doc(script._id)
      .update({
        heat_score: heatScore
      });
  });
  
  await Promise.all(updates);
  
  return { success: true, count: updates.length };
};
```

---

## 🎨 前端优化建议

### 1. 添加周期切换

```vue
<view class="period-tabs">
  <view @click="switchPeriod('all')">总榜</view>
  <view @click="switchPeriod('weekly')">周榜</view>
  <view @click="switchPeriod('monthly')">月榜</view>
</view>
```

### 2. 添加排名徽章

```vue
<view class="rank-badge" :class="getRankClass(index)">
  {{ index + 1 }}
</view>

<style>
.rank-badge.rank-1 { background: gold; }
.rank-badge.rank-2 { background: silver; }
.rank-badge.rank-3 { background: #cd7f32; }
</style>
```

### 3. 添加加载状态

```vue
<view v-if="loading" class="loading">
  <uni-load-more status="loading" />
</view>
```

---

## ✅ 验证清单

部署完成后，请验证：

- [ ] 4个云函数全部上传成功
- [ ] 云函数可以正常调用
- [ ] 返回的数据格式正确
- [ ] 排序逻辑正确
  - [ ] 热门榜按热度排序
  - [ ] 最新榜按时间排序
  - [ ] 下载榜按下载量排序
  - [ ] 评分榜按评分排序
- [ ] 分页功能正常
- [ ] 前端可以正常显示数据

---

## 📈 性能指标

### 预期性能
- 查询时间: < 100ms
- 并发支持: > 100 QPS
- 数据准确性: 实时或延迟 < 1小时

### 监控指标
- 云函数调用次数
- 平均响应时间
- 错误率

---

## 🎉 完成！

排行榜系统已创建完成，现在可以：

1. 上传部署 4 个云函数
2. 在前端页面中调用测试
3. 根据实际使用情况优化算法

祝开发顺利！🚀

