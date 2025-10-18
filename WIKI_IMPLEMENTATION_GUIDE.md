# 血染百科功能实施指南

## 📌 项目概述

### 目标网站
**钟楼百科**：https://clocktower-wiki.gstonegames.com/

**网站特点：**
- ✅ 官方中文百科（集石独家运营）
- ✅ MediaWiki 框架（易于解析）
- ✅ 内容丰富完整
- ✅ 结构规范统一
- ✅ 权威性强

### 功能目标
在小程序 `pages/tools/wiki/wiki.vue` 中集成**网页解析功能**，让用户可以：
1. 输入百科URL自动解析展示
2. 搜索角色、规则、术语
3. 浏览分类内容
4. 收藏常用词条

---

## 🎯 快速开始（3步上手）

### 步骤1：创建云函数

在 `uniCloud-aliyun/cloudfunctions/` 目录下创建云函数：

```bash
uniCloud-aliyun/cloudfunctions/
├── wiki-parse-url/
│   ├── index.js
│   └── package.json
├── wiki-search/
│   ├── index.js
│   └── package.json
└── wiki-detail/
    ├── index.js
    └── package.json
```

### 步骤2：创建数据库集合

在 uniCloud Web控制台创建以下集合：

```javascript
// 1. wiki_entries - 百科词条表
// 2. wiki_favorites - 用户收藏表
// 3. wiki_search_history - 搜索历史表
```

### 步骤3：更新小程序页面

修改 `pages/tools/wiki/wiki.vue`，添加URL解析功能。

---

## 💻 云函数完整实现

### 云函数1: wiki-parse-url

**专门针对钟楼百科优化的解析器**

```javascript
// uniCloud-aliyun/cloudfunctions/wiki-parse-url/index.js

'use strict';

const cheerio = require('cheerio');
const got = require('got');

exports.main = async (event, context) => {
  const { url, force_refresh = false } = event;
  
  console.log('[wiki-parse] 开始解析:', url);
  
  // 1. 验证URL
  if (!url || !url.includes('clocktower-wiki.gstonegames.com')) {
    return {
      code: 400,
      message: '请输入钟楼百科的页面链接'
    };
  }
  
  const db = uniCloud.database();
  
  // 2. 检查缓存
  if (!force_refresh) {
    const cached = await db.collection('wiki_entries')
      .where({
        source_url: url,
        cache_expires_at: db.command.gte(new Date())
      })
      .get();
    
    if (cached.data.length > 0) {
      console.log('[wiki-parse] 返回缓存');
      return {
        code: 0,
        message: '加载成功（缓存）',
        data: cached.data[0],
        from_cache: true
      };
    }
  }
  
  // 3. 抓取网页
  let html;
  try {
    const response = await got(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BOTCMiniProgram/1.0)',
        'Accept-Language': 'zh-CN,zh;q=0.9'
      }
    });
    html = response.body;
  } catch (error) {
    console.error('[wiki-parse] 抓取失败:', error);
    return {
      code: 500,
      message: '网页加载失败: ' + error.message
    };
  }
  
  // 4. 解析MediaWiki内容
  let parsedData;
  try {
    parsedData = parseMediaWikiPage(html, url);
  } catch (error) {
    console.error('[wiki-parse] 解析失败:', error);
    return {
      code: 500,
      message: '内容解析失败: ' + error.message
    };
  }
  
  // 5. 保存到数据库
  try {
    parsedData.cache_expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    parsedData.created_at = new Date();
    parsedData.updated_at = new Date();
    
    const existing = await db.collection('wiki_entries')
      .where({ source_url: url })
      .get();
    
    if (existing.data.length > 0) {
      await db.collection('wiki_entries')
        .doc(existing.data[0]._id)
        .update(parsedData);
      parsedData._id = existing.data[0]._id;
    } else {
      const result = await db.collection('wiki_entries').add(parsedData);
      parsedData._id = result.id;
    }
  } catch (error) {
    console.error('[wiki-parse] 保存失败:', error);
  }
  
  return {
    code: 0,
    message: '解析成功',
    data: parsedData,
    from_cache: false
  };
};

/**
 * 解析 MediaWiki 页面（钟楼百科）
 */
function parseMediaWikiPage(html, url) {
  const $ = cheerio.load(html);
  
  // 提取页面标题
  const title = $('#firstHeading').text().trim();
  
  // 提取主要内容
  const $content = $('#mw-content-text .mw-parser-output');
  
  // 移除不需要的元素
  $content.find('.toc, .navbox, .navigation, #toc, script, style').remove();
  
  // 提取纯文本
  const contentText = $content.text()
    .replace(/\s+/g, ' ')
    .replace(/\[编辑\]/g, '')
    .trim();
  
  // 提取结构化段落
  const sections = [];
  $content.children('h2, h3, h4').each((i, elem) => {
    const $heading = $(elem);
    const headingText = $heading.find('.mw-headline').text().trim();
    const level = parseInt(elem.name.substring(1));
    
    // 获取该标题下的内容
    let sectionContent = '';
    $heading.nextUntil('h2, h3, h4').each((j, contentElem) => {
      const text = $(contentElem).text().trim();
      if (text) {
        sectionContent += text + '\n';
      }
    });
    
    if (headingText && sectionContent) {
      sections.push({
        heading: headingText,
        content: sectionContent.trim(),
        level
      });
    }
  });
  
  // 提取图片
  const images = [];
  $content.find('img').each((i, elem) => {
    let src = $(elem).attr('src') || $(elem).attr('data-src');
    if (src && !src.includes('icon') && !src.includes('logo')) {
      // MediaWiki 图片通常是相对路径
      if (!src.startsWith('http')) {
        src = 'https://clocktower-wiki.gstonegames.com' + src;
      }
      images.push(src);
    }
  });
  
  // 提取信息框（角色专用）
  const roleInfo = extractRoleInfobox($);
  
  // 判断词条类型
  const entryType = detectEntryType(title, contentText, roleInfo);
  
  // 提取分类标签
  const tags = [];
  $('#mw-normal-catlinks ul li').each((i, elem) => {
    const tag = $(elem).text().trim();
    if (tag) tags.push(tag);
  });
  
  // 提取相关链接
  const relatedLinks = [];
  $content.find('a[href^="/index.php"]').each((i, elem) => {
    const linkText = $(elem).text().trim();
    const linkHref = $(elem).attr('href');
    if (linkText && linkHref && !linkHref.includes('action=')) {
      relatedLinks.push({
        text: linkText,
        url: 'https://clocktower-wiki.gstonegames.com' + linkHref
      });
    }
  });
  
  return {
    entry_type: entryType,
    title: title,
    source_url: url,
    source_type: 'official_wiki_cn',
    source_name: '钟楼百科',
    content: {
      text: contentText.substring(0, 20000),
      sections: sections.slice(0, 30),
      summary: contentText.substring(0, 300)
    },
    role_info: roleInfo,
    media: {
      icon_url: extractRoleIcon($),
      images: images.slice(0, 15)
    },
    tags: tags,
    related_links: relatedLinks.slice(0, 10),
    stats: {
      view_count: 0,
      search_count: 0,
      favorite_count: 0
    }
  };
}

/**
 * 提取角色信息框
 */
function extractRoleInfobox($) {
  const roleInfo = {
    team: null,
    team_name: null,
    ability: null,
    setup_info: null,
    script_belongs: []
  };
  
  // MediaWiki 信息框通常在 .infobox 中
  const $infobox = $('.infobox, .character-info');
  
  $infobox.find('tr').each((i, tr) => {
    const $tr = $(tr);
    const label = $tr.find('th').text().trim();
    const value = $tr.find('td').text().trim();
    
    if (label.includes('阵营') || label.includes('类型')) {
      roleInfo.team_name = value;
      roleInfo.team = detectTeam(value);
    }
    
    if (label.includes('能力')) {
      roleInfo.ability = value;
    }
    
    if (label.includes('设置')) {
      roleInfo.setup_info = value;
    }
    
    if (label.includes('剧本')) {
      roleInfo.script_belongs = value.split(/[、，,]/).map(s => s.trim());
    }
  });
  
  // 如果没有信息框，尝试从内容中提取
  if (!roleInfo.ability) {
    const text = $('#mw-content-text').text();
    
    // 匹配角色能力描述（通常在引号中）
    const abilityMatch = text.match(/["""]([^"""]{10,200})["""]/);
    if (abilityMatch) {
      roleInfo.ability = abilityMatch[1];
    }
  }
  
  return roleInfo;
}

/**
 * 提取角色图标
 */
function extractRoleIcon($) {
  // 钟楼百科的角色图标通常在页面右侧
  const iconSrc = $('.infobox img, .character-icon img').first().attr('src');
  if (iconSrc) {
    return iconSrc.startsWith('http') 
      ? iconSrc 
      : 'https://clocktower-wiki.gstonegames.com' + iconSrc;
  }
  return null;
}

/**
 * 检测阵营
 */
function detectTeam(teamText) {
  const text = teamText.toLowerCase();
  if (text.includes('镇民') || text.includes('townsfolk')) return 'townsfolk';
  if (text.includes('外来者') || text.includes('outsider')) return 'outsider';
  if (text.includes('爪牙') || text.includes('minion')) return 'minion';
  if (text.includes('恶魔') || text.includes('demon')) return 'demon';
  if (text.includes('旅行者') || text.includes('traveler')) return 'traveler';
  return null;
}

/**
 * 判断词条类型
 */
function detectEntryType(title, content, roleInfo) {
  // 如果有角色信息，则为角色
  if (roleInfo && roleInfo.team) {
    return 'role';
  }
  
  // 根据标题和内容判断
  const combined = (title + ' ' + content).toLowerCase();
  
  if (combined.includes('剧本') && !combined.includes('角色')) {
    return 'script';
  } else if (combined.includes('规则') || combined.includes('术语')) {
    return 'rule';
  } else if (title.includes('游戏') || title.includes('介绍')) {
    return 'guide';
  } else {
    return 'term';
  }
}
```

#### package.json
```json
{
  "name": "wiki-parse-url",
  "version": "1.0.0",
  "dependencies": {
    "cheerio": "^1.0.0-rc.12",
    "got": "^11.8.6"
  }
}
```

---

### 云函数2: wiki-search

```javascript
// uniCloud-aliyun/cloudfunctions/wiki-search/index.js

'use strict';

exports.main = async (event, context) => {
  const { keyword, entry_type, page = 1, pageSize = 20 } = event;
  
  if (!keyword) {
    return {
      code: 400,
      message: '请输入搜索关键词'
    };
  }
  
  const db = uniCloud.database();
  const $ = db.command;
  
  // 构建查询条件
  const whereCondition = {
    $or: [
      { title: new RegExp(keyword, 'i') },
      { 'content.text': new RegExp(keyword, 'i') },
      { tags: $.in([keyword]) }
    ]
  };
  
  if (entry_type) {
    whereCondition.entry_type = entry_type;
  }
  
  // 执行搜索
  const result = await db.collection('wiki_entries')
    .where(whereCondition)
    .field({
      _id: true,
      entry_type: true,
      title: true,
      'content.summary': true,
      'role_info.team': true,
      'role_info.team_name': true,
      'media.icon_url': true,
      tags: true,
      'stats.view_count': true
    })
    .orderBy('stats.view_count', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get();
  
  // 记录搜索
  if (event.userId) {
    await db.collection('wiki_search_history').add({
      user_id: event.userId,
      keyword,
      result_count: result.data.length,
      created_at: new Date()
    });
  }
  
  return {
    code: 0,
    message: '搜索成功',
    data: {
      list: result.data,
      total: result.data.length,
      keyword
    }
  };
};
```

---

### 云函数3: wiki-detail

```javascript
// uniCloud-aliyun/cloudfunctions/wiki-detail/index.js

'use strict';

exports.main = async (event, context) => {
  const { entry_id, userId } = event;
  
  const db = uniCloud.database();
  const $ = db.command;
  
  // 查询词条
  const result = await db.collection('wiki_entries')
    .doc(entry_id)
    .get();
  
  if (!result.data || result.data.length === 0) {
    return {
      code: 404,
      message: '词条不存在'
    };
  }
  
  const entry = result.data[0];
  
  // 增加浏览计数
  await db.collection('wiki_entries')
    .doc(entry_id)
    .update({
      'stats.view_count': $.inc(1)
    });
  
  // 查询相关词条
  const related = await db.collection('wiki_entries')
    .where({
      _id: $.neq(entry_id),
      entry_type: entry.entry_type
    })
    .field({
      _id: true,
      title: true,
      'content.summary': true
    })
    .limit(5)
    .get();
  
  entry.related_entries = related.data;
  
  return {
    code: 0,
    message: '获取成功',
    data: entry
  };
};
```

---

## 📱 小程序页面改造

### 方案：在现有页面添加"导入百科"功能

修改 `pages/tools/wiki/wiki.vue`：

```vue
<template>
  <view class="page">
    <!-- 页面头部 -->
    <view class="header">
      <text class="header-title">血染百科</text>
      <text class="header-subtitle">Blood on the Clocktower Encyclopedia</text>
    </view>

    <!-- 🆕 新增：导入功能区 -->
    <view class="import-section">
      <view class="import-card card">
        <view class="import-header">
          <text class="import-title">📚 从钟楼百科导入</text>
          <text class="import-desc">复制百科页面链接，一键导入</text>
        </view>
        <button class="import-btn" @click="showImportDialog">
          🔗 导入百科链接
        </button>
      </view>
    </view>

    <!-- 原有的搜索栏 -->
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

    <!-- 🆕 新增：最近导入 -->
    <view v-if="recentImports.length > 0" class="recent-section">
      <view class="section-header">
        <text class="section-title">最近导入</text>
        <text class="section-more" @click="viewAllImports">查看全部</text>
      </view>
      <scroll-view scroll-x class="recent-scroll">
        <view class="recent-list">
          <view 
            v-for="item in recentImports" 
            :key="item._id"
            class="recent-item card"
            @click="viewDetail(item._id)"
          >
            <image 
              v-if="item.media.icon_url" 
              class="recent-icon"
              :src="item.media.icon_url"
              mode="aspectFit"
            />
            <view v-else class="recent-icon-placeholder">
              {{ getTypeIcon(item.entry_type) }}
            </view>
            <text class="recent-title">{{ item.title }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 原有的分类导航和内容 -->
    <!-- ... 保留原有代码 ... -->
  </view>
  
  <!-- 🆕 导入弹窗 -->
  <uni-popup ref="importPopup" type="center" :mask-click="false">
    <view class="import-dialog">
      <view class="dialog-header">
        <text class="dialog-title">导入百科内容</text>
        <text class="dialog-close" @click="closeImportDialog">✕</text>
      </view>
      
      <view class="dialog-body">
        <view class="input-label">百科页面链接</view>
        <textarea 
          class="url-input"
          v-model="importUrl"
          placeholder="粘贴钟楼百科页面链接，例如：&#10;https://clocktower-wiki.gstonegames.com/index.php?title=洗衣妇"
          placeholder-class="placeholder"
          auto-height
          maxlength="500"
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
</template>

<script>
export default {
  name: 'WikiPage',
  
  data() {
    return {
      // 新增数据
      importUrl: '',
      importing: false,
      recentImports: [],
      
      // 原有数据
      searchKeyword: '',
      currentCategory: 0,
      currentRoleTab: 0,
      categories: [
        { icon: '📖', name: '新手指南' },
        { icon: '👤', name: '角色大全' },
        { icon: '📋', name: '游戏规则' },
        { icon: '💬', name: '术语解释' }
      ],
      // ... 其他原有数据
    }
  },
  
  onLoad() {
    this.loadRecentImports();
  },
  
  methods: {
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
            'media.icon_url': true
          })
          .get();
        
        this.recentImports = res.data || [];
      } catch (error) {
        console.error('加载失败', error);
      }
    },
    
    // 🆕 查看详情
    viewDetail(entryId) {
      // 可以跳转到详情页，或在弹窗中显示
      uni.navigateTo({
        url: `/pages/tools/wiki/detail?id=${entryId}`
      });
    },
    
    // 🆕 查看全部导入
    viewAllImports() {
      uni.navigateTo({
        url: '/pages/tools/wiki/list'
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
    
    // 原有方法
    handleSearch() {
      // ... 保留原有代码
    },
    
    switchCategory(index) {
      this.currentCategory = index;
    }
    
    // ... 其他原有方法
  }
}
</script>

<style scoped>
/* 原有样式保留 */

/* 🆕 新增样式 */

/* 导入区域 */
.import-section {
  padding: 24rpx;
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

/* 导入弹窗 */
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
}

.dialog-body {
  padding: 32rpx;
}

.input-label {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 16rpx;
}

.url-input {
  width: 100%;
  min-height: 200rpx;
  padding: 24rpx;
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
  padding: 12rpx 24rpx;
  background: #F0F0F0;
  color: #666;
  font-size: 24rpx;
  border-radius: 8rpx;
}

.help-text {
  margin-top: 24rpx;
  padding: 16rpx;
  background: #FFF9E6;
  border-radius: 8rpx;
  font-size: 24rpx;
  color: #FF9800;
  line-height: 1.6;
}

.dialog-footer {
  display: flex;
  gap: 16rpx;
  padding: 24rpx 32rpx;
  border-top: 1rpx solid #F0F0F0;
}

.btn-secondary, .btn-primary {
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

/* 最近导入 */
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
  font-size: 32rpx;
  font-weight: bold;
  color: #1A1A1A;
}

.section-more {
  font-size: 24rpx;
  color: #4facfe;
}

.recent-scroll {
  white-space: nowrap;
}

.recent-list {
  display: inline-flex;
  gap: 16rpx;
}

.recent-item {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  width: 180rpx;
  padding: 24rpx 16rpx;
}

.recent-item:active {
  transform: scale(0.95);
  opacity: 0.8;
}

.recent-icon {
  width: 96rpx;
  height: 96rpx;
  border-radius: 12rpx;
  margin-bottom: 12rpx;
  background: #F5F5F5;
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
}
</style>
```

---

## 🗄️ 数据库集合创建

在 uniCloud Web控制台创建以下集合：

### 1. wiki_entries (百科词条)

```javascript
{
  "_id": "",  // 自动生成
  "entry_type": "role",  // role, script, rule, guide, term
  "title": "洗衣妇",
  "source_url": "https://clocktower-wiki.gstonegames.com/...",
  "source_type": "official_wiki_cn",
  "source_name": "钟楼百科",
  "content": {
    "text": "完整文本内容...",
    "sections": [
      {
        "heading": "能力描述",
        "content": "...",
        "level": 2
      }
    ],
    "summary": "摘要..."
  },
  "role_info": {
    "team": "townsfolk",
    "team_name": "镇民",
    "ability": "开局得知某位玩家的角色",
    "setup_info": null,
    "script_belongs": ["暗流涌动"]
  },
  "media": {
    "icon_url": "https://...",
    "images": ["https://..."]
  },
  "tags": ["镇民", "开局信息"],
  "related_links": [
    {
      "text": "图书管理员",
      "url": "https://..."
    }
  ],
  "stats": {
    "view_count": 0,
    "search_count": 0,
    "favorite_count": 0
  },
  "cache_expires_at": "2025-10-24T00:00:00.000Z",
  "created_at": "2025-10-17T00:00:00.000Z",
  "updated_at": "2025-10-17T00:00:00.000Z"
}
```

### 2. wiki_favorites (用户收藏)

```javascript
{
  "_id": "",
  "user_id": "用户ID",
  "entry_id": "词条ID",
  "notes": "用户备注",
  "created_at": "2025-10-17T00:00:00.000Z"
}
```

### 3. wiki_search_history (搜索历史)

```javascript
{
  "_id": "",
  "user_id": "用户ID",
  "keyword": "洗衣妇",
  "result_count": 5,
  "created_at": "2025-10-17T00:00:00.000Z"
}
```

---

## 📝 使用指南

### 用户操作流程

1. **进入百科页面**
   - 点击工具箱 → 血染百科

2. **导入百科内容**
   - 点击"导入百科链接"按钮
   - 粘贴钟楼百科的页面URL
   - 点击"开始导入"
   - 等待3-5秒解析完成
   - 自动跳转到详情页查看

3. **浏览内容**
   - 查看最近导入的词条
   - 使用搜索功能查找
   - 按分类浏览

### 获取百科URL的方法

在钟楼百科网站：
1. 打开任意页面（如角色页面）
2. 复制浏览器地址栏的URL
3. 粘贴到小程序中

**示例URL：**
```
https://clocktower-wiki.gstonegames.com/index.php?title=洗衣妇
https://clocktower-wiki.gstonegames.com/index.php?title=暗流涌动
https://clocktower-wiki.gstonegames.com/index.php?title=规则概要
```

---

## ⚡ 性能优化建议

### 1. 缓存策略
- ✅ 云端缓存7天
- ✅ 本地缓存3天
- ✅ 用户手动刷新

### 2. 图片优化
```javascript
// 在小程序中使用图片懒加载
<image 
  :src="imageUrl" 
  lazy-load
  mode="aspectFit"
/>
```

### 3. 分页加载
```javascript
// 搜索结果分页
const pageSize = 20;
const page = 1;
```

---

## 💰 成本估算

### 假设1000用户，每月使用情况：
- 每人每月导入5个词条
- 每人每月搜索10次
- 每人每月查看详情20次

**成本计算：**
- 云函数调用：35,000次/月 ≈ ¥5/月
- 数据库存储：约0.5GB ≈ 免费
- 总计：约 ¥60/年

---

## 🎯 开发时间估算

### 阶段1：核心功能（1周）
- [ ] 创建3个云函数
- [ ] 创建数据库集合
- [ ] 修改wiki.vue页面
- [ ] 基础测试

### 阶段2：优化完善（3天）
- [ ] 错误处理
- [ ] 用户体验优化
- [ ] 性能测试

**总计：10天（约60-80小时）**

---

## ✅ 优势总结

1. ✅ **官方数据源**：钟楼百科是官方维护，权威可靠
2. ✅ **MediaWiki框架**：结构规范，易于解析
3. ✅ **中文内容**：完全中文，无需翻译
4. ✅ **内容丰富**：覆盖所有角色、规则、剧本
5. ✅ **更新及时**：官方会持续更新内容
6. ✅ **合法合规**：引用官方资源，标注来源

---

**文档版本**: v1.0.0  
**创建时间**: 2025年10月17日  
**最后更新**: 2025年10月17日

