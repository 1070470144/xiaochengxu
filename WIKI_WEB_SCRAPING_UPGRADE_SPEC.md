# 血染百科 - 网页抓取解析功能升级方案

## 📋 项目背景

### 现状分析
当前 `pages/tools/wiki/wiki.vue` 页面使用**静态数据**展示百科内容，存在以下问题：
- ✅ 数据写死在代码中，更新困难
- ✅ 内容有限，无法覆盖所有角色和规则
- ✅ 无法同步官方最新信息
- ✅ 维护成本高

### 升级目标
通过**网页抓取解析技术**，实现：
- 🎯 自动同步官方百科内容
- 🎯 内容丰富且实时更新
- 🎯 降低人工维护成本
- 🎯 提供更完整的百科体验

---

## 🎨 技术方案评估

### 方案对比

#### ❌ 方案A：小程序端直接抓取（不可行）
```
小程序 → 百科网站 → 解析HTML → 展示
```
**不可行原因：**
1. 微信小程序对第三方网络请求有**严格限制**
2. 必须配置**服务器域名白名单**
3. 大多数百科网站**不在白名单**中
4. 无法处理跨域问题

#### ✅ 方案B：云函数后端抓取（推荐）
```
小程序 → uniCloud云函数 → 抓取百科网站 → 解析HTML → 返回数据 → 小程序展示
```
**优点：**
1. ✅ 云函数无跨域限制
2. ✅ 可以缓存内容，提升性能
3. ✅ 统一管理，便于维护
4. ✅ 可以做内容审核和优化
5. ✅ 符合小程序安全规范

#### ⚠️ 方案C：定时爬虫 + 数据库存储（备选）
```
定时任务 → 爬取百科 → 存储到数据库 → 小程序读取数据库
```
**优点：**
- 响应速度最快
- 离线可用
- 成本可控

**缺点：**
- 需要额外的爬虫服务
- 内容更新有延迟
- 需要更多存储空间

### 📌 最终选择：方案B + 方案C 混合
- **首次访问/手动刷新**：云函数实时抓取
- **二次访问**：读取缓存数据
- **定期后台任务**：更新热门词条到数据库

---

## 🏗️ 技术架构设计

### 整体架构图
```
┌─────────────────────────────────────────────────────┐
│                    小程序端                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  │  百科首页     │  │  词条搜索    │  │  词条详情    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
│         │                  │                  │
│         └──────────────────┴──────────────────┘
│                           │
└───────────────────────────┼─────────────────────────┘
                            │ uniCloud SDK 调用
                            ↓
┌─────────────────────────────────────────────────────┐
│                  uniCloud 云服务                     │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │           云函数层                           │   │
│  │  ┌──────────────┐  ┌──────────────┐       │   │
│  │  │ wiki-parse   │  │ wiki-search  │       │   │
│  │  │  URL解析     │  │  搜索词条    │       │   │
│  │  └──────┬───────┘  └──────┬───────┘       │   │
│  │         │                  │                │   │
│  │  ┌──────┴──────────────────┴───────┐       │   │
│  │  │     HTML 解析引擎（cheerio）     │       │   │
│  │  └────────────────────────────────┘       │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │          缓存层（云数据库）                  │   │
│  │  ┌──────────────┐  ┌──────────────┐       │   │
│  │  │ wiki_entries │  │ wiki_cache   │       │   │
│  │  │  词条数据    │  │  抓取缓存    │       │   │
│  │  └──────────────┘  └──────────────┘       │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │          定时任务                            │   │
│  │  每天凌晨2点：更新热门词条                   │   │
│  │  每周一次：全量同步                         │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
                            │
                            │ HTTP 请求
                            ↓
┌─────────────────────────────────────────────────────┐
│              目标百科网站                            │
│  ┌──────────────┐  ┌──────────────┐                │
│  │ 官方Wiki     │  │ 社区Wiki     │                │
│  └──────────────┘  └──────────────┘                │
└─────────────────────────────────────────────────────┘
```

### 支持的百科来源
1. **Blood on the Clocktower 官方Wiki**
   - URL: `https://wiki.bloodontheclocktower.com/`
   - 特点：最权威，英文为主

2. **血染钟楼中文Wiki**
   - URL: `https://botc.wiki/`
   - 特点：中文翻译，适合国内玩家

3. **社区百科**
   - 各类玩家维护的百科站点

---

## 💾 数据库设计

### 表1: wiki_entries (百科词条表)
```javascript
// MongoDB Schema
{
  _id: ObjectId,
  
  // 基本信息
  entry_type: String,      // 词条类型: role, script, rule, term
  title: String,           // 标题
  title_en: String,        // 英文标题
  title_zh: String,        // 中文标题
  
  // 来源信息
  source_url: String,      // 来源URL
  source_type: String,     // 来源类型: official_wiki, community_wiki
  source_site: String,     // 来源站点名称
  
  // 内容数据
  content: {
    text: String,          // 纯文本内容
    html: String,          // HTML格式内容（精简后）
    sections: [            // 分段内容
      {
        heading: String,   // 小标题
        content: String,   // 段落内容
        level: Number      // 标题层级 (h2=2, h3=3)
      }
    ],
    summary: String        // 摘要（前200字）
  },
  
  // 角色专属字段 (entry_type === 'role')
  role_info: {
    team: String,          // 阵营: townsfolk, outsider, minion, demon
    team_name_zh: String,  // 阵营中文名
    ability: String,       // 能力描述
    ability_type: String,  // 能力类型: passive, active, setup
    script_belongs: [String], // 所属剧本列表
    is_jinx: Boolean,      // 是否有禁忌
    jinx_with: [String]    // 禁忌角色列表
  },
  
  // 媒体资源
  media: {
    icon_url: String,      // 图标URL
    images: [String],      // 相关图片URL数组
    video_url: String      // 视频教程URL
  },
  
  // 扩展信息
  tags: [String],          // 标签
  keywords: [String],      // 搜索关键词
  related_entries: [String], // 相关词条ID
  
  // 统计数据
  stats: {
    view_count: Number,    // 查看次数
    search_count: Number,  // 搜索次数
    favorite_count: Number // 收藏次数
  },
  
  // 状态管理
  status: Number,          // 0-草稿, 1-已发布, 2-已下架
  quality_score: Number,   // 内容质量分数 (0-100)
  
  // 缓存管理
  cache_expires_at: Date,  // 缓存过期时间
  last_fetched_at: Date,   // 最后抓取时间
  fetch_count: Number,     // 抓取次数
  
  // 时间戳
  created_at: Date,
  updated_at: Date
}
```

### 表2: wiki_search_history (搜索历史)
```javascript
{
  _id: ObjectId,
  user_id: String,         // 用户ID
  keyword: String,         // 搜索关键词
  result_count: Number,    // 结果数量
  clicked_entry_id: String, // 点击的词条ID
  created_at: Date
}
```

### 表3: wiki_favorites (用户收藏)
```javascript
{
  _id: ObjectId,
  user_id: String,         // 用户ID
  entry_id: String,        // 词条ID
  notes: String,           // 用户备注
  created_at: Date
}
```

---

## ☁️ 云函数实现

### 云函数1: wiki-parse-url

#### 功能描述
接收一个百科URL，抓取并解析网页内容，返回结构化数据。

#### 完整代码实现
```javascript
// uniCloud-aliyun/cloudfunctions/wiki-parse-url/index.js

'use strict';

const cheerio = require('cheerio');
const got = require('got'); // 推荐使用 got 替代 axios

exports.main = async (event, context) => {
  const { url, force_refresh = false } = event;
  
  console.log('[wiki-parse-url] 开始解析:', url);
  
  // 1. 参数验证
  if (!url) {
    return {
      code: 400,
      message: '缺少URL参数'
    };
  }
  
  // 验证URL是否为支持的百科站点
  const validationResult = validateUrl(url);
  if (!validationResult.valid) {
    return {
      code: 400,
      message: validationResult.message
    };
  }
  
  const db = uniCloud.database();
  
  // 2. 检查缓存（除非强制刷新）
  if (!force_refresh) {
    const cached = await db.collection('wiki_entries')
      .where({
        source_url: url,
        cache_expires_at: db.command.gte(new Date())
      })
      .get();
    
    if (cached.data.length > 0) {
      console.log('[wiki-parse-url] 返回缓存数据');
      return {
        code: 0,
        message: '成功（来自缓存）',
        data: cached.data[0],
        from_cache: true
      };
    }
  }
  
  // 3. 抓取网页内容
  let html;
  try {
    console.log('[wiki-parse-url] 开始抓取网页...');
    const response = await got(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      },
      retry: {
        limit: 2,
        methods: ['GET']
      }
    });
    html = response.body;
    console.log('[wiki-parse-url] 网页抓取成功');
  } catch (error) {
    console.error('[wiki-parse-url] 抓取失败:', error);
    return {
      code: 500,
      message: '网页抓取失败: ' + error.message
    };
  }
  
  // 4. 解析HTML内容
  let parsedData;
  try {
    console.log('[wiki-parse-url] 开始解析HTML...');
    parsedData = parseWikiContent(html, url, validationResult.site_type);
    console.log('[wiki-parse-url] HTML解析成功');
  } catch (error) {
    console.error('[wiki-parse-url] 解析失败:', error);
    return {
      code: 500,
      message: 'HTML解析失败: ' + error.message
    };
  }
  
  // 5. 内容审核（简单的敏感词过滤）
  const auditResult = await simpleContentAudit(parsedData.content.text);
  if (!auditResult.pass) {
    console.warn('[wiki-parse-url] 内容审核未通过');
    return {
      code: 403,
      message: '内容包含敏感信息，无法展示'
    };
  }
  
  // 6. 保存到数据库
  try {
    // 设置缓存过期时间：7天后
    parsedData.cache_expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    parsedData.last_fetched_at = new Date();
    parsedData.fetch_count = 1;
    parsedData.status = 1;
    parsedData.quality_score = calculateQualityScore(parsedData);
    parsedData.created_at = new Date();
    parsedData.updated_at = new Date();
    
    // 初始化统计数据
    parsedData.stats = {
      view_count: 0,
      search_count: 0,
      favorite_count: 0
    };
    
    // 检查是否已存在
    const existing = await db.collection('wiki_entries')
      .where({ source_url: url })
      .get();
    
    if (existing.data.length > 0) {
      // 更新现有记录
      await db.collection('wiki_entries')
        .doc(existing.data[0]._id)
        .update({
          ...parsedData,
          fetch_count: db.command.inc(1),
          stats: existing.data[0].stats // 保留原有统计数据
        });
      parsedData._id = existing.data[0]._id;
      console.log('[wiki-parse-url] 更新现有词条');
    } else {
      // 插入新记录
      const result = await db.collection('wiki_entries').add(parsedData);
      parsedData._id = result.id;
      console.log('[wiki-parse-url] 插入新词条');
    }
  } catch (error) {
    console.error('[wiki-parse-url] 数据库操作失败:', error);
    return {
      code: 500,
      message: '数据保存失败: ' + error.message
    };
  }
  
  // 7. 增加用户经验值（如果用户已登录）
  if (event.userId) {
    try {
      await uniCloud.callFunction({
        name: 'user-add-exp',
        data: {
          userId: event.userId,
          expType: 'VIEW_WIKI',
          amount: 2
        }
      });
    } catch (err) {
      console.error('[wiki-parse-url] 增加经验值失败:', err);
    }
  }
  
  console.log('[wiki-parse-url] 解析完成');
  return {
    code: 0,
    message: '解析成功',
    data: parsedData,
    from_cache: false
  };
};

/**
 * 验证URL是否为支持的百科站点
 */
function validateUrl(url) {
  const supportedSites = [
    {
      pattern: /wiki\.bloodontheclocktower\.com/i,
      type: 'official_wiki',
      name: 'Blood on the Clocktower Official Wiki'
    },
    {
      pattern: /botc\.wiki/i,
      type: 'community_wiki_cn',
      name: '血染钟楼中文Wiki'
    }
  ];
  
  for (const site of supportedSites) {
    if (site.pattern.test(url)) {
      return {
        valid: true,
        site_type: site.type,
        site_name: site.name
      };
    }
  }
  
  return {
    valid: false,
    message: '不支持的百科站点，请使用官方Wiki或社区Wiki的链接'
  };
}

/**
 * 解析Wiki内容
 */
function parseWikiContent(html, url, siteType) {
  const $ = cheerio.load(html);
  
  // 根据不同站点类型选择不同的解析器
  if (siteType === 'official_wiki') {
    return parseOfficialWiki($, url);
  } else if (siteType === 'community_wiki_cn') {
    return parseCommunityWikiCN($, url);
  } else {
    return parseGenericWiki($, url);
  }
}

/**
 * 解析官方Wiki（英文）
 */
function parseOfficialWiki($, url) {
  // 提取标题
  const titleEn = $('#firstHeading').text().trim() || $('h1.page-title').text().trim();
  
  // 提取主要内容区域
  const $content = $('#mw-content-text, .mw-parser-output').first();
  
  // 移除不需要的元素
  $content.find('.navigation, .printfooter, .catlinks, script, style').remove();
  
  // 提取纯文本
  const contentText = $content.text().replace(/\s+/g, ' ').trim();
  
  // 提取结构化段落
  const sections = [];
  $content.children('h2, h3').each((i, elem) => {
    const $heading = $(elem);
    const heading = $heading.text().replace(/\[edit\]/g, '').trim();
    const level = parseInt(elem.name.substring(1)); // h2 -> 2, h3 -> 3
    
    // 获取该标题下的内容（直到下一个标题）
    const $contentElems = $heading.nextUntil('h2, h3');
    const sectionContent = $contentElems.text().trim();
    
    if (heading && sectionContent) {
      sections.push({
        heading,
        content: sectionContent,
        level
      });
    }
  });
  
  // 提取图片
  const images = [];
  $content.find('img').each((i, elem) => {
    const src = $(elem).attr('src') || $(elem).attr('data-src');
    if (src && !src.includes('icon')) {
      const fullSrc = src.startsWith('http') ? src : 'https://wiki.bloodontheclocktower.com' + src;
      images.push(fullSrc);
    }
  });
  
  // 提取信息框数据（角色专属）
  const roleInfo = extractRoleInfo($);
  
  // 判断词条类型
  const entryType = detectEntryType(titleEn, contentText, roleInfo);
  
  // 提取关键词
  const keywords = extractKeywords(titleEn, contentText);
  
  return {
    entry_type: entryType,
    title: titleEn,
    title_en: titleEn,
    title_zh: '', // 官方Wiki无中文
    source_url: url,
    source_type: 'official_wiki',
    source_site: 'Blood on the Clocktower Official Wiki',
    content: {
      text: contentText.substring(0, 10000), // 限制长度
      html: $content.html(),
      sections: sections.slice(0, 20), // 最多20个段落
      summary: contentText.substring(0, 200)
    },
    role_info: roleInfo,
    media: {
      icon_url: extractIconUrl($),
      images: images.slice(0, 10), // 最多10张图片
      video_url: null
    },
    tags: extractTags($),
    keywords: keywords,
    related_entries: []
  };
}

/**
 * 解析中文社区Wiki
 */
function parseCommunityWikiCN($, url) {
  // 类似逻辑，但适配中文Wiki的HTML结构
  const titleZh = $('#firstHeading, h1').first().text().trim();
  
  // ... 类似的解析逻辑，此处省略
  
  return {
    entry_type: 'role',
    title: titleZh,
    title_zh: titleZh,
    title_en: '',
    source_url: url,
    source_type: 'community_wiki_cn',
    source_site: '血染钟楼中文Wiki',
    // ... 其他字段
  };
}

/**
 * 通用Wiki解析器（兜底）
 */
function parseGenericWiki($, url) {
  const title = $('h1').first().text().trim();
  const content = $('article, .content, #content, main').first().text().trim();
  
  return {
    entry_type: 'term',
    title: title,
    source_url: url,
    content: {
      text: content.substring(0, 10000),
      summary: content.substring(0, 200)
    }
  };
}

/**
 * 提取角色信息
 */
function extractRoleInfo($) {
  const roleInfo = {
    team: null,
    team_name_zh: null,
    ability: null,
    ability_type: null,
    script_belongs: [],
    is_jinx: false,
    jinx_with: []
  };
  
  // 从信息框中提取
  $('.infobox tr, .character-info tr').each((i, elem) => {
    const key = $(elem).find('th').text().trim().toLowerCase();
    const value = $(elem).find('td').text().trim();
    
    if (key.includes('team') || key.includes('阵营')) {
      roleInfo.team = detectTeam(value);
      roleInfo.team_name_zh = value;
    }
    
    if (key.includes('ability') || key.includes('能力')) {
      roleInfo.ability = value;
    }
    
    if (key.includes('script') || key.includes('剧本')) {
      roleInfo.script_belongs = value.split(/[,，、]/);
    }
  });
  
  // 检测是否有禁忌
  const fullText = $('body').text();
  if (fullText.includes('jinx') || fullText.includes('禁忌')) {
    roleInfo.is_jinx = true;
  }
  
  return roleInfo;
}

/**
 * 检测阵营类型
 */
function detectTeam(teamText) {
  const teamLower = teamText.toLowerCase();
  if (teamLower.includes('townsfolk') || teamLower.includes('镇民')) {
    return 'townsfolk';
  } else if (teamLower.includes('outsider') || teamLower.includes('外来者')) {
    return 'outsider';
  } else if (teamLower.includes('minion') || teamLower.includes('爪牙')) {
    return 'minion';
  } else if (teamLower.includes('demon') || teamLower.includes('恶魔')) {
    return 'demon';
  }
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
  
  // 检查标题和内容关键词
  const combined = (title + ' ' + content).toLowerCase();
  
  if (combined.includes('script') || combined.includes('剧本')) {
    return 'script';
  } else if (combined.includes('rule') || combined.includes('规则')) {
    return 'rule';
  } else {
    return 'term';
  }
}

/**
 * 提取图标URL
 */
function extractIconUrl($) {
  // 查找角色图标
  const iconSrc = $('.character-icon img, .role-icon img, .infobox img').first().attr('src');
  if (iconSrc) {
    return iconSrc.startsWith('http') ? iconSrc : 'https://wiki.bloodontheclocktower.com' + iconSrc;
  }
  return null;
}

/**
 * 提取标签
 */
function extractTags($) {
  const tags = [];
  $('.category, .tag, .label').each((i, elem) => {
    const tag = $(elem).text().trim();
    if (tag) tags.push(tag);
  });
  return tags.slice(0, 10);
}

/**
 * 提取关键词
 */
function extractKeywords(title, content) {
  const keywords = [title];
  
  // 简单的关键词提取（实际应使用NLP）
  const words = content.split(/\s+/);
  const wordFreq = {};
  
  words.forEach(word => {
    const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
    if (cleaned.length > 3) {
      wordFreq[cleaned] = (wordFreq[cleaned] || 0) + 1;
    }
  });
  
  // 取出现频率最高的前10个词
  const topWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(entry => entry[0]);
  
  return [...keywords, ...topWords];
}

/**
 * 简单的内容审核（敏感词过滤）
 */
async function simpleContentAudit(content) {
  // 敏感词列表（简化版）
  const sensitiveWords = ['暴力', '色情', '反动'];
  
  for (const word of sensitiveWords) {
    if (content.includes(word)) {
      return { pass: false };
    }
  }
  
  return { pass: true };
}

/**
 * 计算内容质量分数
 */
function calculateQualityScore(data) {
  let score = 50; // 基础分
  
  // 有标题 +10
  if (data.title && data.title.length > 0) score += 10;
  
  // 有内容 +20
  if (data.content.text && data.content.text.length > 100) score += 20;
  
  // 有段落结构 +10
  if (data.content.sections && data.content.sections.length > 0) score += 10;
  
  // 有图片 +5
  if (data.media.images && data.media.images.length > 0) score += 5;
  
  // 有角色信息 +5
  if (data.role_info && data.role_info.team) score += 5;
  
  return Math.min(score, 100);
}
```

#### package.json 依赖
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

#### 功能描述
搜索百科词条，支持标题、内容、标签搜索。

#### 代码实现
```javascript
// uniCloud-aliyun/cloudfunctions/wiki-search/index.js

'use strict';

exports.main = async (event, context) => {
  const { 
    keyword, 
    entry_type = null,  // 筛选类型：role, script, rule, term
    page = 1, 
    pageSize = 20,
    userId = null 
  } = event;
  
  if (!keyword || keyword.trim().length === 0) {
    return {
      code: 400,
      message: '搜索关键词不能为空'
    };
  }
  
  const db = uniCloud.database();
  const $ = db.command;
  
  // 记录搜索行为
  try {
    await db.collection('wiki_search_history').add({
      user_id: userId,
      keyword: keyword.trim(),
      result_count: 0, // 稍后更新
      created_at: new Date()
    });
  } catch (err) {
    console.error('[wiki-search] 记录搜索失败:', err);
  }
  
  // 构建查询条件
  const whereCondition = {
    status: 1, // 只查询已发布的
    $or: [
      { title: new RegExp(keyword, 'i') },
      { title_zh: new RegExp(keyword, 'i') },
      { title_en: new RegExp(keyword, 'i') },
      { 'content.text': new RegExp(keyword, 'i') },
      { tags: $.in([keyword]) },
      { keywords: $.elemMatch($.eq(keyword.toLowerCase())) }
    ]
  };
  
  // 如果指定了类型，添加类型筛选
  if (entry_type) {
    whereCondition.entry_type = entry_type;
  }
  
  // 执行搜索
  const searchResult = await db.collection('wiki_entries')
    .where(whereCondition)
    .field({
      _id: true,
      entry_type: true,
      title: true,
      title_zh: true,
      title_en: true,
      'content.summary': true,
      'role_info.team': true,
      'role_info.team_name_zh': true,
      'media.icon_url': true,
      tags: true,
      'stats.view_count': true,
      'stats.favorite_count': true
    })
    .orderBy('stats.view_count', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get();
  
  // 增加搜索计数
  const entryIds = searchResult.data.map(item => item._id);
  if (entryIds.length > 0) {
    await db.collection('wiki_entries')
      .where({
        _id: $.in(entryIds)
      })
      .update({
        'stats.search_count': $.inc(1)
      });
  }
  
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

---

### 云函数3: wiki-detail

#### 功能描述
获取单个百科词条的详细信息，并增加浏览计数。

#### 代码实现
```javascript
// uniCloud-aliyun/cloudfunctions/wiki-detail/index.js

'use strict';

exports.main = async (event, context) => {
  const { entry_id, userId = null } = event;
  
  if (!entry_id) {
    return {
      code: 400,
      message: '缺少词条ID'
    };
  }
  
  const db = uniCloud.database();
  const $ = db.command;
  
  // 查询词条
  const result = await db.collection('wiki_entries')
    .doc(entry_id)
    .get();
  
  if (result.data.length === 0) {
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
  
  // 如果有用户ID，记录浏览历史
  if (userId) {
    try {
      await db.collection('wiki_favorites')
        .add({
          user_id: userId,
          entry_id: entry_id,
          created_at: new Date()
        });
    } catch (err) {
      // 忽略重复记录错误
    }
  }
  
  // 查询相关词条
  const relatedEntries = await db.collection('wiki_entries')
    .where({
      _id: $.neq(entry_id),
      entry_type: entry.entry_type,
      status: 1
    })
    .field({
      _id: true,
      title: true,
      title_zh: true,
      'content.summary': true,
      'media.icon_url': true
    })
    .orderBy('stats.view_count', 'desc')
    .limit(5)
    .get();
  
  entry.related_entries = relatedEntries.data;
  
  return {
    code: 0,
    message: '获取成功',
    data: entry
  };
};
```

---

## 📱 小程序端改造

### 方案一：保留现有UI，添加URL解析入口

在现有 `wiki.vue` 页面顶部添加一个"导入百科"按钮：

```vue
<template>
  <view class="page">
    <!-- 页面头部 -->
    <view class="header">
      <text class="header-title">血染百科</text>
      <text class="header-subtitle">Blood on the Clocktower Encyclopedia</text>
    </view>

    <!-- 新增：URL导入区域 -->
    <view class="import-section">
      <button class="import-btn" @click="showImportDialog">
        🔗 导入百科链接
      </button>
    </view>

    <!-- 原有的搜索栏和内容... -->
    <!-- ... -->
  </view>
  
  <!-- URL输入弹窗 -->
  <uni-popup ref="importPopup" type="center">
    <view class="import-dialog">
      <view class="dialog-title">导入百科链接</view>
      <textarea 
        class="url-input"
        v-model="importUrl"
        placeholder="粘贴百科URL，例如：https://wiki.bloodontheclocktower.com/..."
        maxlength="500"
      />
      <view class="dialog-actions">
        <button class="btn-cancel" @click="cancelImport">取消</button>
        <button 
          class="btn-confirm" 
          :loading="importing"
          @click="importWiki"
        >
          {{ importing ? '解析中...' : '导入' }}
        </button>
      </view>
    </view>
  </uni-popup>
</template>

<script>
export default {
  data() {
    return {
      importUrl: '',
      importing: false,
      // ... 原有数据
    }
  },
  
  methods: {
    // 显示导入弹窗
    showImportDialog() {
      this.$refs.importPopup.open();
    },
    
    // 取消导入
    cancelImport() {
      this.importUrl = '';
      this.$refs.importPopup.close();
    },
    
    // 导入百科
    async importWiki() {
      if (!this.importUrl.trim()) {
        uni.showToast({
          title: '请输入百科链接',
          icon: 'none'
        });
        return;
      }
      
      this.importing = true;
      
      try {
        const res = await uniCloud.callFunction({
          name: 'wiki-parse-url',
          data: {
            url: this.importUrl.trim(),
            userId: this.userId
          }
        });
        
        if (res.result.code === 0) {
          uni.showToast({
            title: res.result.from_cache ? '已加载' : '导入成功',
            icon: 'success'
          });
          
          // 关闭弹窗
          this.$refs.importPopup.close();
          this.importUrl = '';
          
          // 跳转到详情页
          setTimeout(() => {
            this.showWikiDetail(res.result.data);
          }, 500);
        } else {
          uni.showToast({
            title: res.result.message || '导入失败',
            icon: 'none',
            duration: 2000
          });
        }
      } catch (error) {
        console.error('导入失败', error);
        uni.showToast({
          title: '导入失败，请检查链接',
          icon: 'none'
        });
      } finally {
        this.importing = false;
      }
    },
    
    // 显示百科详情
    showWikiDetail(entry) {
      // 可以显示在弹窗中，或跳转到新页面
      uni.showModal({
        title: entry.title || entry.title_zh,
        content: entry.content.summary || entry.content.text.substring(0, 200),
        confirmText: '查看完整',
        success: (res) => {
          if (res.confirm) {
            // 跳转到详情页
            uni.navigateTo({
              url: `/pages/tools/wiki/detail?id=${entry._id}`
            });
          }
        }
      });
    },
    
    // ... 原有方法
  }
}
</script>

<style scoped>
/* 导入区域 */
.import-section {
  padding: 24rpx;
}

.import-btn {
  width: 100%;
  height: 80rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 28rpx;
  font-weight: 500;
  border-radius: 12rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 导入弹窗 */
.import-dialog {
  width: 600rpx;
  background: white;
  border-radius: 24rpx;
  padding: 48rpx 32rpx;
}

.dialog-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #1A1A1A;
  text-align: center;
  margin-bottom: 32rpx;
}

.url-input {
  width: 100%;
  min-height: 200rpx;
  padding: 24rpx;
  background: #F5F5F5;
  border-radius: 12rpx;
  font-size: 26rpx;
  line-height: 1.6;
  margin-bottom: 32rpx;
}

.dialog-actions {
  display: flex;
  gap: 16rpx;
}

.btn-cancel, .btn-confirm {
  flex: 1;
  height: 80rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  border: none;
}

.btn-cancel {
  background: #F5F5F5;
  color: #666;
}

.btn-confirm {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

/* ... 原有样式 */
</style>
```

---

### 方案二：创建专门的百科详情页

创建新页面 `pages/tools/wiki/detail.vue`：

```vue
<template>
  <view class="detail-page">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading">
      <uni-load-more status="loading" />
    </view>
    
    <!-- 内容区域 -->
    <view v-else-if="entry" class="content">
      <!-- 头部信息 -->
      <view class="header">
        <image 
          v-if="entry.media.icon_url" 
          class="icon"
          :src="entry.media.icon_url"
          mode="aspectFit"
        />
        <view class="title-area">
          <text class="title">{{ entry.title || entry.title_zh }}</text>
          <text v-if="entry.title_en && entry.title_zh" class="subtitle">
            {{ entry.title_en }}
          </text>
        </view>
      </view>
      
      <!-- 角色信息（如果是角色） -->
      <view v-if="entry.entry_type === 'role' && entry.role_info" class="role-info">
        <view class="info-item">
          <text class="label">阵营</text>
          <text class="value" :class="'team-' + entry.role_info.team">
            {{ entry.role_info.team_name_zh || entry.role_info.team }}
          </text>
        </view>
        <view class="info-item">
          <text class="label">能力</text>
          <text class="value">{{ entry.role_info.ability }}</text>
        </view>
      </view>
      
      <!-- 文章内容 -->
      <view class="article">
        <!-- 摘要 -->
        <view class="summary">
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
      <view v-if="entry.media.images.length > 0" class="images">
        <text class="section-title">相关图片</text>
        <view class="image-grid">
          <image 
            v-for="(img, index) in entry.media.images" 
            :key="index"
            class="grid-image"
            :src="img"
            mode="aspectFill"
            @click="previewImage(img)"
          />
        </view>
      </view>
      
      <!-- 相关词条 -->
      <view v-if="entry.related_entries.length > 0" class="related">
        <text class="section-title">相关词条</text>
        <view 
          v-for="related in entry.related_entries" 
          :key="related._id"
          class="related-item"
          @click="goToEntry(related._id)"
        >
          <text class="related-title">{{ related.title || related.title_zh }}</text>
          <text class="related-arrow">›</text>
        </view>
      </view>
      
      <!-- 底部操作栏 -->
      <view class="footer">
        <button class="action-btn" @click="toggleFavorite">
          {{ isFavorite ? '💛 已收藏' : '🤍 收藏' }}
        </button>
        <button class="action-btn" @click="shareEntry">
          📤 分享
        </button>
        <button class="action-btn" @click="openSource">
          🔗 查看原文
        </button>
      </view>
    </view>
    
    <!-- 错误状态 -->
    <view v-else class="error">
      <text class="error-text">加载失败</text>
      <button class="retry-btn" @click="loadEntry">重试</button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      entryId: '',
      entry: null,
      loading: true,
      isFavorite: false
    }
  },
  
  onLoad(options) {
    this.entryId = options.id;
    this.loadEntry();
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
            userId: this.userId
          }
        });
        
        if (res.result.code === 0) {
          this.entry = res.result.data;
        } else {
          uni.showToast({
            title: '加载失败',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('加载失败', error);
      } finally {
        this.loading = false;
      }
    },
    
    // 预览图片
    previewImage(img) {
      uni.previewImage({
        urls: this.entry.media.images,
        current: img
      });
    },
    
    // 跳转到其他词条
    goToEntry(id) {
      uni.navigateTo({
        url: `/pages/tools/wiki/detail?id=${id}`
      });
    },
    
    // 收藏/取消收藏
    async toggleFavorite() {
      // TODO: 实现收藏功能
      this.isFavorite = !this.isFavorite;
      uni.showToast({
        title: this.isFavorite ? '已收藏' : '已取消',
        icon: 'success'
      });
    },
    
    // 分享词条
    shareEntry() {
      // TODO: 实现分享功能
    },
    
    // 打开原文链接
    openSource() {
      // 复制链接到剪贴板
      uni.setClipboardData({
        data: this.entry.source_url,
        success: () => {
          uni.showToast({
            title: '链接已复制',
            icon: 'success'
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
}

.loading, .error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
}

.content {
  padding: 32rpx;
  padding-bottom: 160rpx; /* 为底部操作栏留空间 */
}

/* 头部 */
.header {
  display: flex;
  align-items: center;
  margin-bottom: 32rpx;
  padding: 32rpx;
  background: white;
  border-radius: 16rpx;
}

.icon {
  width: 120rpx;
  height: 120rpx;
  margin-right: 24rpx;
  border-radius: 12rpx;
}

.title-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.title {
  font-size: 40rpx;
  font-weight: bold;
  color: #1A1A1A;
}

.subtitle {
  font-size: 28rpx;
  color: #666;
}

/* 角色信息 */
.role-info {
  background: white;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 32rpx;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #F0F0F0;
}

.info-item:last-child {
  border-bottom: none;
}

.label {
  font-size: 28rpx;
  color: #666;
  font-weight: 500;
}

.value {
  font-size: 28rpx;
  color: #1A1A1A;
}

.team-townsfolk { color: #52c41a; }
.team-outsider { color: #faad14; }
.team-minion { color: #f97316; }
.team-demon { color: #ef4444; }

/* 文章内容 */
.article {
  background: white;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 32rpx;
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

.section-heading {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #1A1A1A;
  margin-bottom: 16rpx;
}

.section-heading.level-3 {
  font-size: 28rpx;
  font-weight: 500;
}

.section-content {
  display: block;
  font-size: 28rpx;
  color: #666;
  line-height: 1.8;
}

/* 图片网格 */
.images {
  background: white;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 32rpx;
}

.section-title {
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

/* 相关词条 */
.related {
  background: white;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 32rpx;
}

.related-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #F0F0F0;
}

.related-item:last-child {
  border-bottom: none;
}

.related-title {
  font-size: 28rpx;
  color: #333;
}

.related-arrow {
  font-size: 40rpx;
  color: #ccc;
}

/* 底部操作栏 */
.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 16rpx;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: white;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.action-btn {
  flex: 1;
  height: 80rpx;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  font-size: 26rpx;
  border-radius: 12rpx;
  border: none;
}

.action-btn:nth-child(2) {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.action-btn:nth-child(3) {
  background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);
}
</style>
```

---

## ⚠️ 技术可行性分析

### ✅ 可行性
1. **uniCloud 云函数无跨域限制**
   - 可以访问任何网站
   - 不受小程序域名白名单限制

2. **HTML 解析技术成熟**
   - cheerio 库功能强大
   - 类似 jQuery 的语法，易于使用

3. **缓存机制完善**
   - 云数据库缓存
   - 本地存储缓存
   - 减少重复抓取

### ⚠️ 注意事项

#### 1. 法律合规
- ✅ **遵守 robots.txt**：检查目标网站的爬虫协议
- ✅ **标注来源**：明确显示内容来源
- ✅ **仅用于展示**：不做商业用途
- ⚠️ **获取授权**：最好与目标网站取得联系

#### 2. 技术限制
- ⚠️ **动态内容**：JavaScript 渲染的内容无法获取
- ⚠️ **反爬虫**：可能被目标网站封禁
- ⚠️ **网站结构变化**：需要定期更新解析规则

#### 3. 性能考虑
- ⚠️ **抓取耗时**：首次抓取需要 3-5 秒
- ⚠️ **云函数成本**：频繁调用会产生费用
- ✅ **缓存优化**：通过缓存降低成本

---

## 📈 开发计划

### 阶段一：核心功能（2周）
- [ ] 数据库表设计
- [ ] `wiki-parse-url` 云函数开发
- [ ] `wiki-detail` 云函数开发
- [ ] 小程序UI改造
- [ ] 基础测试

### 阶段二：搜索与缓存（1周）
- [ ] `wiki-search` 云函数开发
- [ ] 缓存策略实现
- [ ] 搜索页面开发
- [ ] 性能优化

### 阶段三：优化与完善（1周）
- [ ] 错误处理完善
- [ ] 用户体验优化
- [ ] 定时任务配置
- [ ] 全面测试

**总开发时间**：4周（约80-100小时）

---

## 💰 成本估算

### uniCloud 费用（假设1000用户）
- **云函数调用**：约 10万次/月 → ¥13/月
- **云数据库**：约 1GB 存储 → 免费额度内
- **云存储**：约 2GB → 免费额度内
- **总计**：约 ¥150/年

### 维护成本
- **规则更新**：每月 2-4 小时
- **内容审核**：每周 1-2 小时

---

## 🎯 总结

### ✅ 推荐方案
**云函数后端抓取 + 多级缓存 + 定时更新**

### 核心优势
1. ✅ 技术可行，符合小程序规范
2. ✅ 成本可控，无需额外服务器
3. ✅ 内容丰富，实时同步官方
4. ✅ 用户体验好，响应速度快

### 风险提示
1. ⚠️ 需要遵守目标网站的爬虫协议
2. ⚠️ 网站结构变化需要更新解析规则
3. ⚠️ 建议与官方取得授权

### 下一步行动
1. **评估法律风险**：联系百科网站获取授权
2. **开发原型**：先实现核心功能验证可行性
3. **小范围测试**：邀请用户试用并收集反馈
4. **正式上线**：完善后向所有用户开放

---

**文档版本**: v1.0.0  
**创建时间**: 2025年10月17日  
**维护人员**: 开发团队

