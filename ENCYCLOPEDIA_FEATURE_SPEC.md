# 血染百科功能需求规格说明

## 1. 功能概述

### 1.1 功能名称
血染百科（Blood on the Clocktower Encyclopedia）- 网页内容解析与展示

### 1.2 功能定位
为玩家提供一个**便捷的角色、剧本和游戏机制查询工具**，通过输入百科网页地址，自动解析并以友好的方式展示血染钟楼相关知识内容。

### 1.3 核心价值
- 📚 **知识聚合**：将分散的百科内容集中展示
- 🔍 **快速查询**：通过搜索或URL输入快速找到所需信息
- 📱 **移动优化**：将PC端百科内容适配小程序展示
- 💾 **离线缓存**：查看过的内容可离线访问
- ⭐ **收藏管理**：常用内容快速收藏

### 1.4 目标用户
- 新手玩家：学习游戏规则、角色技能
- 资深玩家：查询复杂机制、剧本细节
- 说书人：准备游戏时查阅参考资料

---

## 2. 功能需求

### 2.1 核心功能

#### 2.1.1 URL 解析与展示
**功能描述**：用户输入血染百科网页地址，系统自动解析并展示内容

**支持的百科源**：
1. 血染钟楼中文 Wiki
2. Blood on the Clocktower 官方 Wiki
3. 其他社区百科站点

**技术实现方案**：
```
方案1：后端解析（推荐）
用户 → 小程序 → 云函数 → 抓取网页 → 解析HTML → 返回结构化数据 → 小程序展示

优点：
- 避免跨域问题
- 可以缓存内容
- 统一管理
- 可以做内容审核

方案2：小程序直接请求
用户 → 小程序 → 网页地址 → 返回HTML → 本地解析 → 展示

缺点：
- 微信小程序对第三方网络请求有限制
- 需要配置合法域名
- 无法缓存优化
```

**采用方案**：方案1 - 云函数后端解析

#### 2.1.2 内容分类展示
将百科内容分为以下类别：
- 🎭 **角色百科**：角色名称、阵营、能力、玩法技巧
- 📜 **剧本百科**：剧本介绍、角色配置、游戏流程
- ⚙️ **游戏机制**：规则说明、特殊机制、常见问题
- 🏛️ **游戏背景**：故事设定、世界观

#### 2.1.3 搜索功能
- **关键词搜索**：支持角色名、技能名、剧本名
- **智能推荐**：根据用户查询历史推荐相关内容
- **热门词条**：显示最常查询的百科词条

#### 2.1.4 收藏与历史
- **收藏功能**：用户可收藏常用百科词条
- **浏览历史**：记录用户最近查看的词条
- **快速访问**：首页快捷入口访问收藏和历史

### 2.2 数据管理

#### 2.2.1 缓存策略
- **云端缓存**：解析后的百科内容缓存7天
- **本地缓存**：用户查看过的内容本地缓存3天
- **更新机制**：用户手动刷新或缓存过期后重新抓取

#### 2.2.2 内容审核
- 自动过滤敏感词
- 人工审核机制（管理后台）
- 用户举报功能

---

## 3. 技术设计

### 3.1 数据库设计

#### 3.1.1 百科内容表 (encyclopedia_entries)
```sql
CREATE TABLE encyclopedia_entries (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    entry_type VARCHAR(20) NOT NULL COMMENT '词条类型：role-角色，script-剧本，mechanism-机制，lore-背景',
    title VARCHAR(200) NOT NULL COMMENT '词条标题',
    subtitle VARCHAR(300) COMMENT '副标题',
    source_url VARCHAR(500) COMMENT '来源URL',
    source_type VARCHAR(50) COMMENT '来源类型：official_wiki, community_wiki',
    content_text TEXT COMMENT '纯文本内容',
    content_html TEXT COMMENT 'HTML格式内容',
    content_json JSON COMMENT '结构化内容（JSON格式）',
    images JSON COMMENT '图片URL数组',
    tags JSON COMMENT '标签数组',
    view_count INT DEFAULT 0 COMMENT '查看次数',
    favorite_count INT DEFAULT 0 COMMENT '收藏次数',
    search_count INT DEFAULT 0 COMMENT '搜索次数',
    status TINYINT DEFAULT 1 COMMENT '状态：0-下架，1-正常，2-待审核',
    cache_expires_at DATETIME COMMENT '缓存过期时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME COMMENT '软删除时间',
    INDEX idx_type (entry_type),
    INDEX idx_title (title),
    INDEX idx_source_url (source_url),
    INDEX idx_status (status),
    INDEX idx_view_count (view_count),
    INDEX idx_cache_expires (cache_expires_at),
    FULLTEXT INDEX ft_title_content (title, content_text) WITH PARSER ngram
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='百科词条表';
```

#### 3.1.2 用户收藏百科表 (user_encyclopedia_favorites)
```sql
CREATE TABLE user_encyclopedia_favorites (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    entry_id BIGINT NOT NULL COMMENT '词条ID',
    notes TEXT COMMENT '用户备注',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_entry (user_id, entry_id),
    INDEX idx_user (user_id),
    INDEX idx_entry (entry_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (entry_id) REFERENCES encyclopedia_entries(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户收藏百科表';
```

#### 3.1.3 百科浏览历史表 (encyclopedia_history)
```sql
CREATE TABLE encyclopedia_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    entry_id BIGINT NOT NULL COMMENT '词条ID',
    view_duration INT DEFAULT 0 COMMENT '浏览时长（秒）',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_entry (entry_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (entry_id) REFERENCES encyclopedia_entries(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='百科浏览历史表';
```

#### 3.1.4 搜索记录表 (encyclopedia_searches)
```sql
CREATE TABLE encyclopedia_searches (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT COMMENT '用户ID（可为空）',
    keyword VARCHAR(200) NOT NULL COMMENT '搜索关键词',
    result_count INT DEFAULT 0 COMMENT '结果数量',
    clicked_entry_id BIGINT COMMENT '点击的词条ID',
    ip VARCHAR(45) COMMENT 'IP地址',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_keyword (keyword),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='搜索记录表';
```

### 3.2 云函数设计

#### 3.2.1 百科相关云函数
```javascript
// 云函数列表
encyclopedia-parse-url      // 解析百科URL
encyclopedia-detail         // 获取百科详情
encyclopedia-list           // 获取百科列表
encyclopedia-search         // 搜索百科
encyclopedia-favorite       // 收藏/取消收藏
encyclopedia-favorites      // 获取收藏列表
encyclopedia-history        // 获取浏览历史
encyclopedia-hot-keywords   // 获取热门搜索词
encyclopedia-related        // 获取相关推荐
```

#### 3.2.2 核心云函数实现

##### encyclopedia-parse-url 云函数
```javascript
'use strict';
const cheerio = require('cheerio'); // HTML解析库
const axios = require('axios');

exports.main = async (event, context) => {
  const { url } = event;
  
  // 1. 验证URL合法性
  if (!url || !isValidEncyclopediaUrl(url)) {
    return {
      code: 400,
      message: '无效的百科地址'
    };
  }
  
  // 2. 检查缓存
  const db = uniCloud.database();
  const cached = await db.collection('encyclopedia_entries')
    .where({
      source_url: url,
      cache_expires_at: db.command.gte(new Date())
    })
    .get();
  
  if (cached.data.length > 0) {
    return {
      code: 0,
      message: '成功（来自缓存）',
      data: cached.data[0]
    };
  }
  
  // 3. 抓取网页内容
  let html;
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BOTCWikiBot/1.0)'
      }
    });
    html = response.data;
  } catch (error) {
    return {
      code: 500,
      message: '网页抓取失败：' + error.message
    };
  }
  
  // 4. 解析HTML内容
  const parsedData = parseHtmlContent(html, url);
  
  // 5. 内容审核
  const auditResult = await contentAudit(parsedData.content_text);
  if (!auditResult.pass) {
    return {
      code: 403,
      message: '内容包含敏感信息，无法展示'
    };
  }
  
  // 6. 保存到数据库
  parsedData.cache_expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7天后过期
  parsedData.status = 1; // 正常状态
  
  const result = await db.collection('encyclopedia_entries').add(parsedData);
  parsedData.id = result.id;
  
  // 7. 增加经验值
  if (event.userId) {
    await uniCloud.callFunction({
      name: 'user-add-exp',
      data: {
        userId: event.userId,
        expType: 'VIEW_ENCYCLOPEDIA',
        amount: 2
      }
    });
  }
  
  return {
    code: 0,
    message: '解析成功',
    data: parsedData
  };
};

// 解析HTML内容
function parseHtmlContent(html, url) {
  const $ = cheerio.load(html);
  
  // 根据不同的百科网站，使用不同的解析规则
  let parser;
  if (url.includes('botc.wiki')) {
    parser = parseBOTCWiki;
  } else if (url.includes('bloodontheclocktower.com')) {
    parser = parseOfficialWiki;
  } else {
    parser = parseGenericWiki;
  }
  
  return parser($, url);
}

// 解析 BOTC Wiki
function parseBOTCWiki($, url) {
  // 提取标题
  const title = $('#firstHeading').text().trim() || $('h1').first().text().trim();
  
  // 提取内容
  const contentHtml = $('#mw-content-text').html() || $('article').html();
  const contentText = $('#mw-content-text').text().trim() || $('article').text().trim();
  
  // 提取图片
  const images = [];
  $('.image img, article img').each((i, elem) => {
    const src = $(elem).attr('src') || $(elem).attr('data-src');
    if (src) {
      images.push(src.startsWith('http') ? src : 'https:' + src);
    }
  });
  
  // 提取分类和标签
  const tags = [];
  $('.category, .tag').each((i, elem) => {
    tags.push($(elem).text().trim());
  });
  
  // 判断词条类型
  let entryType = 'mechanism'; // 默认机制类
  if (title.match(/(角色|Character)/i) || contentText.includes('阵营')) {
    entryType = 'role';
  } else if (title.match(/(剧本|Script)/i)) {
    entryType = 'script';
  } else if (contentText.includes('故事') || contentText.includes('背景')) {
    entryType = 'lore';
  }
  
  // 构建结构化内容
  const contentJson = {
    sections: extractSections($),
    infobox: extractInfobox($),
    relatedLinks: extractRelatedLinks($)
  };
  
  return {
    entry_type: entryType,
    title: title,
    source_url: url,
    source_type: 'botc_wiki',
    content_text: contentText.substring(0, 10000), // 限制文本长度
    content_html: contentHtml,
    content_json: contentJson,
    images: images.slice(0, 20), // 最多20张图片
    tags: tags
  };
}

// 提取章节
function extractSections($) {
  const sections = [];
  $('h2, h3').each((i, elem) => {
    const heading = $(elem).text().trim();
    const content = $(elem).nextUntil('h2, h3').text().trim();
    if (heading && content) {
      sections.push({ heading, content });
    }
  });
  return sections;
}

// 提取信息框
function extractInfobox($) {
  const infobox = {};
  $('.infobox tr, .info-box tr').each((i, elem) => {
    const key = $(elem).find('th').text().trim();
    const value = $(elem).find('td').text().trim();
    if (key && value) {
      infobox[key] = value;
    }
  });
  return infobox;
}

// 提取相关链接
function extractRelatedLinks($) {
  const links = [];
  $('.related-links a, .see-also a').each((i, elem) => {
    const text = $(elem).text().trim();
    const href = $(elem).attr('href');
    if (text && href) {
      links.push({ text, href });
    }
  });
  return links.slice(0, 10); // 最多10个相关链接
}

// 验证URL
function isValidEncyclopediaUrl(url) {
  const validDomains = [
    'botc.wiki',
    'bloodontheclocktower.com',
    'wiki.bloodontheclocktower.com'
  ];
  
  try {
    const urlObj = new URL(url);
    return validDomains.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
}

// 内容审核
async function contentAudit(content) {
  // 调用微信内容安全API
  try {
    const res = await uniCloud.httpclient.request({
      method: 'POST',
      url: 'https://api.weixin.qq.com/wxa/msg_sec_check',
      data: {
        content: content.substring(0, 1000) // 审核前1000字符
      },
      contentType: 'json'
    });
    
    return {
      pass: res.data.errcode === 0
    };
  } catch (error) {
    // 审核失败时允许通过
    console.error('内容审核失败', error);
    return { pass: true };
  }
}
```

##### encyclopedia-search 云函数
```javascript
'use strict';

exports.main = async (event, context) => {
  const { keyword, page = 1, pageSize = 20, userId } = event;
  
  if (!keyword || keyword.trim().length === 0) {
    return {
      code: 400,
      message: '搜索关键词不能为空'
    };
  }
  
  const db = uniCloud.database();
  const _ = db.command;
  
  // 记录搜索
  await db.collection('encyclopedia_searches').add({
    user_id: userId || null,
    keyword: keyword.trim(),
    created_at: new Date()
  });
  
  // 搜索词条（标题和内容）
  const searchResult = await db.collection('encyclopedia_entries')
    .where({
      status: 1,
      _or: [
        { title: new RegExp(keyword, 'i') },
        { content_text: new RegExp(keyword, 'i') },
        { tags: _.in([keyword]) }
      ]
    })
    .field({
      id: true,
      entry_type: true,
      title: true,
      subtitle: true,
      images: true,
      tags: true,
      view_count: true,
      favorite_count: true
    })
    .orderBy('view_count', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get();
  
  // 更新搜索结果数量
  await db.collection('encyclopedia_searches')
    .where({ keyword: keyword.trim() })
    .orderBy('created_at', 'desc')
    .limit(1)
    .update({
      result_count: searchResult.data.length
    });
  
  return {
    code: 0,
    message: '搜索成功',
    data: {
      list: searchResult.data,
      total: searchResult.data.length,
      page,
      pageSize,
      keyword
    }
  };
};
```

### 3.3 小程序页面设计

#### 3.3.1 页面结构
```
pages/encyclopedia/
├── index/              # 百科首页
│   ├── index.vue
│   └── index.js
├── parse/              # URL解析页面
│   ├── parse.vue
│   └── parse.js
├── detail/             # 词条详情
│   ├── detail.vue
│   └── detail.js
├── search/             # 搜索页面
│   ├── search.vue
│   └── search.js
├── favorites/          # 收藏列表
│   ├── favorites.vue
│   └── favorites.js
└── history/            # 浏览历史
    ├── history.vue
    └── history.js
```

#### 3.3.2 百科首页 UI 设计
```vue
<template>
  <view class="encyclopedia-index">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-input" @click="goToSearch">
        <image class="search-icon" src="/static/icons/search.png" />
        <text class="search-placeholder">搜索角色、剧本、游戏机制...</text>
      </view>
      <view class="parse-btn" @click="goToParse">
        <image class="link-icon" src="/static/icons/link.png" />
      </view>
    </view>
    
    <!-- 快捷入口 -->
    <view class="quick-access">
      <view class="access-item" @click="goToFavorites">
        <image class="access-icon" src="/static/icons/star.png" />
        <text class="access-text">我的收藏</text>
        <text class="access-count">{{ favoriteCount }}</text>
      </view>
      <view class="access-item" @click="goToHistory">
        <image class="access-icon" src="/static/icons/history.png" />
        <text class="access-text">浏览历史</text>
        <text class="access-count">{{ historyCount }}</text>
      </view>
    </view>
    
    <!-- 热门搜索 -->
    <view class="hot-keywords">
      <view class="section-title">热门搜索</view>
      <view class="keyword-list">
        <view 
          v-for="(keyword, index) in hotKeywords" 
          :key="index"
          class="keyword-item"
          @click="searchKeyword(keyword)"
        >
          <text class="keyword-rank">{{ index + 1 }}</text>
          <text class="keyword-text">{{ keyword }}</text>
        </view>
      </view>
    </view>
    
    <!-- 分类导航 -->
    <view class="categories">
      <view class="section-title">分类浏览</view>
      <view class="category-grid">
        <view 
          v-for="category in categories" 
          :key="category.type"
          class="category-item"
          @click="goToCategory(category.type)"
        >
          <image class="category-icon" :src="category.icon" />
          <text class="category-name">{{ category.name }}</text>
          <text class="category-count">{{ category.count }}条</text>
        </view>
      </view>
    </view>
    
    <!-- 推荐词条 -->
    <view class="recommended">
      <view class="section-title">推荐词条</view>
      <view class="entry-list">
        <encyclopedia-card 
          v-for="entry in recommendedEntries" 
          :key="entry.id"
          :entry="entry"
          @click="goToDetail(entry.id)"
        />
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      favoriteCount: 0,
      historyCount: 0,
      hotKeywords: [],
      categories: [
        { type: 'role', name: '角色', icon: '/static/icons/role.png', count: 0 },
        { type: 'script', name: '剧本', icon: '/static/icons/script.png', count: 0 },
        { type: 'mechanism', name: '游戏机制', icon: '/static/icons/mechanism.png', count: 0 },
        { type: 'lore', name: '游戏背景', icon: '/static/icons/lore.png', count: 0 }
      ],
      recommendedEntries: []
    };
  },
  onLoad() {
    this.loadData();
  },
  methods: {
    async loadData() {
      // 加载统计数据
      const stats = await this.getStats();
      this.favoriteCount = stats.favoriteCount;
      this.historyCount = stats.historyCount;
      
      // 加载热门关键词
      this.hotKeywords = await this.getHotKeywords();
      
      // 加载分类统计
      const categoryCounts = await this.getCategoryCounts();
      this.categories.forEach(cat => {
        cat.count = categoryCounts[cat.type] || 0;
      });
      
      // 加载推荐词条
      this.recommendedEntries = await this.getRecommendedEntries();
    },
    
    goToSearch() {
      uni.navigateTo({
        url: '/pages/encyclopedia/search/search'
      });
    },
    
    goToParse() {
      uni.navigateTo({
        url: '/pages/encyclopedia/parse/parse'
      });
    },
    
    goToFavorites() {
      uni.navigateTo({
        url: '/pages/encyclopedia/favorites/favorites'
      });
    },
    
    goToHistory() {
      uni.navigateTo({
        url: '/pages/encyclopedia/history/history'
      });
    },
    
    goToDetail(entryId) {
      uni.navigateTo({
        url: `/pages/encyclopedia/detail/detail?id=${entryId}`
      });
    },
    
    searchKeyword(keyword) {
      uni.navigateTo({
        url: `/pages/encyclopedia/search/search?keyword=${encodeURIComponent(keyword)}`
      });
    },
    
    goToCategory(type) {
      uni.navigateTo({
        url: `/pages/encyclopedia/search/search?type=${type}`
      });
    },
    
    async getStats() {
      const res = await uniCloud.callFunction({
        name: 'encyclopedia-user-stats'
      });
      return res.result.data;
    },
    
    async getHotKeywords() {
      const res = await uniCloud.callFunction({
        name: 'encyclopedia-hot-keywords',
        data: { limit: 10 }
      });
      return res.result.data;
    },
    
    async getCategoryCounts() {
      const res = await uniCloud.callFunction({
        name: 'encyclopedia-category-counts'
      });
      return res.result.data;
    },
    
    async getRecommendedEntries() {
      const res = await uniCloud.callFunction({
        name: 'encyclopedia-list',
        data: { 
          page: 1, 
          pageSize: 6,
          orderBy: 'view_count'
        }
      });
      return res.result.data.list;
    }
  }
};
</script>

<style lang="scss" scoped>
.encyclopedia-index {
  padding: 32rpx;
  background: #F8F8F8;
  min-height: 100vh;
}

.search-bar {
  display: flex;
  align-items: center;
  margin-bottom: 32rpx;
  
  .search-input {
    flex: 1;
    display: flex;
    align-items: center;
    height: 80rpx;
    padding: 0 32rpx;
    background: #FFFFFF;
    border-radius: 40rpx;
    box-shadow: 0 4rpx 20rpx rgba(139, 69, 19, 0.08);
    
    .search-icon {
      width: 40rpx;
      height: 40rpx;
      margin-right: 16rpx;
    }
    
    .search-placeholder {
      font-size: 28rpx;
      color: #999999;
    }
  }
  
  .parse-btn {
    width: 80rpx;
    height: 80rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #8B4513;
    border-radius: 40rpx;
    margin-left: 16rpx;
    
    .link-icon {
      width: 40rpx;
      height: 40rpx;
    }
  }
}

.quick-access {
  display: flex;
  gap: 16rpx;
  margin-bottom: 48rpx;
  
  .access-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 32rpx;
    background: #FFFFFF;
    border-radius: 16rpx;
    box-shadow: 0 4rpx 20rpx rgba(139, 69, 19, 0.08);
    
    .access-icon {
      width: 60rpx;
      height: 60rpx;
      margin-bottom: 16rpx;
    }
    
    .access-text {
      font-size: 26rpx;
      color: #666666;
      margin-bottom: 8rpx;
    }
    
    .access-count {
      font-size: 32rpx;
      font-weight: 600;
      color: #8B4513;
    }
  }
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1A1A1A;
  margin-bottom: 24rpx;
}

.hot-keywords {
  margin-bottom: 48rpx;
  
  .keyword-list {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
    
    .keyword-item {
      display: flex;
      align-items: center;
      padding: 16rpx 24rpx;
      background: #FFFFFF;
      border-radius: 40rpx;
      box-shadow: 0 2rpx 12rpx rgba(139, 69, 19, 0.06);
      
      .keyword-rank {
        width: 40rpx;
        height: 40rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
        color: #FFFFFF;
        font-size: 24rpx;
        font-weight: 600;
        border-radius: 50%;
        margin-right: 12rpx;
      }
      
      .keyword-text {
        font-size: 28rpx;
        color: #333333;
      }
    }
  }
}

.categories {
  margin-bottom: 48rpx;
  
  .category-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16rpx;
    
    .category-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32rpx;
      background: #FFFFFF;
      border-radius: 16rpx;
      box-shadow: 0 4rpx 20rpx rgba(139, 69, 19, 0.08);
      
      .category-icon {
        width: 80rpx;
        height: 80rpx;
        margin-bottom: 16rpx;
      }
      
      .category-name {
        font-size: 28rpx;
        font-weight: 500;
        color: #333333;
        margin-bottom: 8rpx;
      }
      
      .category-count {
        font-size: 24rpx;
        color: #999999;
      }
    }
  }
}

.recommended {
  .entry-list {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
  }
}
</style>
```

#### 3.3.3 URL 解析页面
```vue
<template>
  <view class="parse-page">
    <view class="parse-header">
      <text class="header-title">输入百科地址</text>
      <text class="header-desc">支持血染钟楼官方Wiki和社区百科</text>
    </view>
    
    <view class="url-input-box">
      <textarea 
        v-model="url"
        class="url-input"
        placeholder="粘贴百科网页地址，例如：https://botc.wiki/..."
        placeholder-class="url-placeholder"
        auto-height
        maxlength="500"
      />
      <view class="input-actions">
        <view class="char-count">{{ url.length }}/500</view>
        <view class="paste-btn" @click="pasteUrl">
          <image class="paste-icon" src="/static/icons/paste.png" />
          <text>粘贴</text>
        </view>
      </view>
    </view>
    
    <button 
      class="parse-btn" 
      :disabled="!url || parsing"
      :loading="parsing"
      @click="parseUrl"
    >
      {{ parsing ? '解析中...' : '开始解析' }}
    </button>
    
    <!-- 支持的网站说明 -->
    <view class="supported-sites">
      <view class="sites-title">支持的百科网站</view>
      <view class="site-list">
        <view class="site-item" v-for="site in supportedSites" :key="site.url">
          <image class="site-icon" :src="site.icon" />
          <view class="site-info">
            <text class="site-name">{{ site.name }}</text>
            <text class="site-url">{{ site.url }}</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 最近解析 -->
    <view class="recent-parses" v-if="recentParses.length > 0">
      <view class="section-title">最近解析</view>
      <view class="parse-list">
        <view 
          v-for="item in recentParses" 
          :key="item.id"
          class="parse-item"
          @click="goToDetail(item.id)"
        >
          <text class="parse-title">{{ item.title }}</text>
          <text class="parse-time">{{ formatTime(item.created_at) }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      url: '',
      parsing: false,
      supportedSites: [
        {
          name: '血染钟楼中文Wiki',
          url: 'botc.wiki',
          icon: '/static/icons/wiki-cn.png'
        },
        {
          name: 'Blood on the Clocktower Wiki',
          url: 'bloodontheclocktower.com',
          icon: '/static/icons/wiki-en.png'
        }
      ],
      recentParses: []
    };
  },
  onLoad() {
    this.loadRecentParses();
  },
  methods: {
    async pasteUrl() {
      try {
        const res = await uni.getClipboardData();
        this.url = res.data;
        uni.showToast({
          title: '粘贴成功',
          icon: 'success'
        });
      } catch (error) {
        uni.showToast({
          title: '粘贴失败',
          icon: 'none'
        });
      }
    },
    
    async parseUrl() {
      if (!this.url) {
        uni.showToast({
          title: '请输入网址',
          icon: 'none'
        });
        return;
      }
      
      this.parsing = true;
      
      try {
        const res = await uniCloud.callFunction({
          name: 'encyclopedia-parse-url',
          data: {
            url: this.url.trim()
          }
        });
        
        if (res.result.code === 0) {
          uni.showToast({
            title: '解析成功',
            icon: 'success'
          });
          
          // 跳转到详情页
          setTimeout(() => {
            uni.redirectTo({
              url: `/pages/encyclopedia/detail/detail?id=${res.result.data.id}`
            });
          }, 1000);
        } else {
          uni.showToast({
            title: res.result.message || '解析失败',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('解析失败', error);
        uni.showToast({
          title: '解析失败，请检查网址',
          icon: 'none'
        });
      } finally {
        this.parsing = false;
      }
    },
    
    async loadRecentParses() {
      const res = await uniCloud.callFunction({
        name: 'encyclopedia-history',
        data: {
          page: 1,
          pageSize: 5
        }
      });
      this.recentParses = res.result.data.list;
    },
    
    goToDetail(entryId) {
      uni.navigateTo({
        url: `/pages/encyclopedia/detail/detail?id=${entryId}`
      });
    },
    
    formatTime(time) {
      // 格式化时间显示
      const date = new Date(time);
      const now = new Date();
      const diff = now - date;
      
      if (diff < 60000) {
        return '刚刚';
      } else if (diff < 3600000) {
        return `${Math.floor(diff / 60000)}分钟前`;
      } else if (diff < 86400000) {
        return `${Math.floor(diff / 3600000)}小时前`;
      } else {
        return `${Math.floor(diff / 86400000)}天前`;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.parse-page {
  padding: 32rpx;
  background: #F8F8F8;
  min-height: 100vh;
}

.parse-header {
  text-align: center;
  margin-bottom: 48rpx;
  
  .header-title {
    display: block;
    font-size: 40rpx;
    font-weight: 600;
    color: #1A1A1A;
    margin-bottom: 16rpx;
  }
  
  .header-desc {
    display: block;
    font-size: 26rpx;
    color: #666666;
  }
}

.url-input-box {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(139, 69, 19, 0.08);
  
  .url-input {
    width: 100%;
    min-height: 160rpx;
    font-size: 28rpx;
    color: #333333;
    line-height: 1.6;
  }
  
  .input-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16rpx;
    
    .char-count {
      font-size: 24rpx;
      color: #999999;
    }
    
    .paste-btn {
      display: flex;
      align-items: center;
      gap: 8rpx;
      padding: 12rpx 24rpx;
      background: #8B4513;
      color: #FFFFFF;
      font-size: 26rpx;
      border-radius: 40rpx;
      
      .paste-icon {
        width: 32rpx;
        height: 32rpx;
      }
    }
  }
}

.parse-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
  color: #FFFFFF;
  font-size: 32rpx;
  font-weight: 600;
  border-radius: 44rpx;
  border: none;
  box-shadow: 0 8rpx 24rpx rgba(139, 69, 19, 0.3);
  margin-bottom: 48rpx;
  
  &[disabled] {
    opacity: 0.5;
    box-shadow: none;
  }
}

.supported-sites {
  margin-bottom: 48rpx;
  
  .sites-title {
    font-size: 28rpx;
    font-weight: 500;
    color: #666666;
    margin-bottom: 24rpx;
  }
  
  .site-list {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
    
    .site-item {
      display: flex;
      align-items: center;
      padding: 24rpx;
      background: #FFFFFF;
      border-radius: 12rpx;
      box-shadow: 0 2rpx 12rpx rgba(139, 69, 19, 0.06);
      
      .site-icon {
        width: 64rpx;
        height: 64rpx;
        margin-right: 24rpx;
        border-radius: 12rpx;
      }
      
      .site-info {
        display: flex;
        flex-direction: column;
        
        .site-name {
          font-size: 28rpx;
          font-weight: 500;
          color: #333333;
          margin-bottom: 8rpx;
        }
        
        .site-url {
          font-size: 24rpx;
          color: #999999;
        }
      }
    }
  }
}

.recent-parses {
  .section-title {
    font-size: 28rpx;
    font-weight: 500;
    color: #666666;
    margin-bottom: 24rpx;
  }
  
  .parse-list {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
    
    .parse-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24rpx;
      background: #FFFFFF;
      border-radius: 12rpx;
      box-shadow: 0 2rpx 12rpx rgba(139, 69, 19, 0.06);
      
      .parse-title {
        flex: 1;
        font-size: 28rpx;
        color: #333333;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .parse-time {
        font-size: 24rpx;
        color: #999999;
        margin-left: 16rpx;
      }
    }
  }
}
</style>
```

### 3.4 Web管理后台设计

#### 3.4.1 百科管理页面
- 词条列表
- 词条审核
- 词条编辑
- 缓存管理
- 统计分析

---

## 4. 用户体验设计

### 4.1 交互流程

#### 4.1.1 URL解析流程
```
1. 用户进入解析页面
2. 粘贴或输入百科URL
3. 点击"开始解析"
4. 显示加载动画（预计需要3-5秒）
5. 解析成功后跳转到详情页
6. 失败则提示错误信息
```

#### 4.1.2 搜索流程
```
1. 用户在首页点击搜索框
2. 进入搜索页面
3. 输入关键词
4. 实时显示搜索建议
5. 选择结果或按回车搜索
6. 显示搜索结果列表
7. 点击进入词条详情
```

### 4.2 视觉设计

#### 4.2.1 配色方案
- 主色：#8B4513（钟楼棕）
- 辅助色：#D2691E（巧克力橙）
- 强调色：#8B0000（深红 - 血色）
- 背景色：#F8F8F8（浅灰）
- 文字色：#1A1A1A（深灰黑）

#### 4.2.2 图标设计
- 搜索图标：放大镜
- 链接图标：链条/链接符号
- 收藏图标：星星
- 历史图标：时钟

### 4.3 性能优化

#### 4.3.1 加载优化
- 骨架屏加载
- 图片懒加载
- 本地缓存优先
- 分页加载

#### 4.3.2 缓存策略
```javascript
// 本地缓存
const cacheKey = `encyclopedia_${entryId}`;
const cached = uni.getStorageSync(cacheKey);

if (cached && Date.now() - cached.timestamp < 3 * 24 * 60 * 60 * 1000) {
  // 3天内的缓存直接使用
  return cached.data;
}

// 否则从云端获取
const res = await uniCloud.callFunction({
  name: 'encyclopedia-detail',
  data: { id: entryId }
});

// 保存到本地
uni.setStorageSync(cacheKey, {
  data: res.result.data,
  timestamp: Date.now()
});
```

---

## 5. 开发计划

### 5.1 开发阶段

#### 阶段一：基础功能（2周）
- [ ] 数据库表设计和创建
- [ ] encyclopedia-parse-url 云函数开发
- [ ] encyclopedia-detail 云函数开发
- [ ] 百科首页UI实现
- [ ] URL解析页面实现
- [ ] 词条详情页面实现

#### 阶段二：搜索功能（1周）
- [ ] encyclopedia-search 云函数开发
- [ ] 搜索页面UI实现
- [ ] 热门搜索功能
- [ ] 搜索历史记录

#### 阶段三：收藏与历史（1周）
- [ ] encyclopedia-favorite 云函数开发
- [ ] encyclopedia-history 云函数开发
- [ ] 收藏列表页面
- [ ] 浏览历史页面
- [ ] 本地缓存机制

#### 阶段四：管理后台（1周）
- [ ] Web后台词条管理页面
- [ ] 词条审核功能
- [ ] 缓存管理功能
- [ ] 统计分析页面

#### 阶段五：优化与测试（1周）
- [ ] 性能优化
- [ ] UI/UX优化
- [ ] 错误处理完善
- [ ] 功能测试
- [ ] 用户体验测试

### 5.2 时间估算
- **总开发时间**：6周（约42天）
- **开发工作量**：120-150小时

### 5.3 人力安排
- **前端开发**：40-50小时
- **后端开发**：40-50小时
- **测试与优化**：30-40小时
- **文档编写**：10小时

---

## 6. 技术难点与解决方案

### 6.1 网页抓取与解析

#### 6.1.1 难点
- 不同百科网站的HTML结构差异大
- 需要处理各种特殊格式（表格、列表、图片等）
- 动态加载的内容难以获取
- 反爬虫机制

#### 6.1.2 解决方案
1. **针对性解析器**：为每个百科网站编写专门的解析器
2. **通用解析器兜底**：使用基于语义的通用解析规则
3. **定期更新解析规则**：监控解析失败率，及时更新规则
4. **User-Agent 轮换**：避免被识别为爬虫

### 6.2 内容审核

#### 6.2.1 难点
- 需要过滤敏感内容
- 避免违规信息
- 平衡审核严格度和用户体验

#### 6.2.2 解决方案
1. **接入微信内容安全API**：自动审核文本和图片
2. **关键词过滤**：建立敏感词库
3. **人工复审机制**：对标记内容进行人工审核
4. **用户举报**：允许用户举报不当内容

### 6.3 性能优化

#### 6.3.1 难点
- 网页抓取耗时长（3-5秒）
- 频繁请求影响服务器性能
- 图片加载影响展示速度

#### 6.3.2 解决方案
1. **多级缓存**：云端缓存 + 本地缓存
2. **异步加载**：先展示文本，图片懒加载
3. **CDN加速**：图片使用CDN
4. **限流机制**：防止恶意频繁请求

---

## 7. 风险评估与应对

### 7.1 技术风险

#### 风险1：网页结构变化导致解析失败
**影响程度**：高  
**应对措施**：
- 建立解析失败监控
- 快速更新解析规则
- 提供手动更新按钮

#### 风险2：被目标网站封禁IP
**影响程度**：中  
**应对措施**：
- 使用代理池轮换IP
- 增加请求间隔
- 降低请求频率

#### 风险3：内容审核不通过
**影响程度**：中  
**应对措施**：
- 严格的自动审核
- 人工预审核机制
- 提供申诉渠道

### 7.2 法律风险

#### 风险1：版权问题
**影响程度**：高  
**应对措施**：
- 明确标注内容来源
- 提供原网页链接
- 仅做展示，不做商业用途
- 收到投诉及时下架

#### 风险2：爬虫合法性
**影响程度**：中  
**应对措施**：
- 遵守robots.txt协议
- 控制爬取频率
- 不爬取敏感信息
- 取得网站授权（如可能）

### 7.3 用户体验风险

#### 风险1：解析时间过长
**影响程度**：中  
**应对措施**：
- 显示详细的加载进度
- 提供预估时间
- 优化解析算法

#### 风险2：解析准确率低
**影响程度**：高  
**应对措施**：
- 持续优化解析规则
- 提供用户反馈渠道
- 人工修正错误内容

---

## 8. 测试计划

### 8.1 功能测试

#### 8.1.1 URL解析测试
- [ ] 测试不同百科网站的URL
- [ ] 测试各种格式的词条页面
- [ ] 测试异常URL的处理
- [ ] 测试网络异常情况

#### 8.1.2 搜索功能测试
- [ ] 测试关键词搜索准确性
- [ ] 测试分类筛选功能
- [ ] 测试搜索结果排序
- [ ] 测试搜索历史记录

#### 8.1.3 收藏与历史测试
- [ ] 测试收藏功能
- [ ] 测试取消收藏
- [ ] 测试浏览历史记录
- [ ] 测试数据同步

### 8.2 性能测试

#### 8.2.1 响应时间测试
- URL解析响应时间 < 5秒
- 搜索响应时间 < 1秒
- 页面加载时间 < 2秒

#### 8.2.2 并发测试
- 支持100并发用户
- 云函数调用成功率 > 99%

### 8.3 兼容性测试

#### 8.3.1 设备兼容性
- iOS系统测试
- Android系统测试
- 不同屏幕尺寸适配

#### 8.3.2 微信版本兼容性
- 测试最新版微信
- 测试旧版微信兼容性

---

## 9. 运营策略

### 9.1 推广计划

#### 9.1.1 初期推广
- 在玩家社群宣传新功能
- 制作使用教程视频
- 邀请用户试用并收集反馈

#### 9.1.2 持续运营
- 定期更新热门词条
- 推荐优质百科内容
- 举办百科知识竞赛活动

### 9.2 用户激励

#### 9.2.1 经验值奖励
- 查看百科词条：+2经验
- 收藏词条：+3经验
- 分享词条：+5经验

#### 9.2.2 成就系统
- 百科达人：查看100个词条
- 知识渊博：收藏50个词条
- 资料专家：连续7天查阅百科

---

## 10. 后续优化方向

### 10.1 功能扩展
- [ ] 支持更多百科网站
- [ ] 百科词条评论功能
- [ ] 词条对比功能
- [ ] 生成学习笔记
- [ ] 导出PDF功能

### 10.2 技术优化
- [ ] 引入AI优化内容解析
- [ ] 使用OCR识别图片内容
- [ ] 智能推荐相关词条
- [ ] 多语言支持

### 10.3 运营优化
- [ ] 建立词条贡献者体系
- [ ] 用户编辑词条功能
- [ ] 词条质量评分系统
- [ ] 专家认证机制

---

## 11. 附录

### 11.1 参考资料
- [血染钟楼中文Wiki](https://botc.wiki/)
- [Blood on the Clocktower 官方Wiki](https://bloodontheclocktower.com/)
- [微信小程序开发文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [uniCloud 云开发文档](https://uniapp.dcloud.net.cn/uniCloud/)

### 11.2 相关文档
- `speckit.specify` - 项目详细说明
- `speckit.plan` - 项目开发计划
- `speckit.constitution` - 项目开发规范

### 11.3 技术依赖
```json
{
  "dependencies": {
    "cheerio": "^1.0.0-rc.12",
    "axios": "^1.6.0"
  }
}
```

---

**文档版本**: v1.0.0  
**创建时间**: 2025年10月17日  
**最后更新**: 2025年10月17日  
**维护人员**: 开发团队

