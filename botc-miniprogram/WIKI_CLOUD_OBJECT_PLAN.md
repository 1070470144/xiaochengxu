# 📚 Wiki 云对象开发计划

## 📋 原云函数分析

| 云函数名 | 功能 | 复杂度 | 关键点 |
|---------|------|--------|--------|
| `wiki-list` | 获取词条列表 | ⭐⭐ | 分页、筛选、排序 |
| `wiki-detail` | 获取词条详情 | ⭐⭐ | 浏览计数、相关词条 |
| `wiki-categories` | 分类统计 | ⭐ | 多类型统计 |
| `wiki-search` | 搜索词条 | ⭐⭐ | 关键词、搜索历史 |
| `wiki-role-comment-add` | 添加评论 | ⭐⭐ | Token验证、用户信息 |
| `wiki-role-comment-list` | 评论列表 | ⭐ | 分页查询 |
| `wiki-role-toggle-like` | 点赞/取消 | ⭐⭐ | 状态切换 |
| `wiki-ranking-storytellers` | 说书人榜单 | ⭐ | 排序、筛选 |
| `wiki-parse-url` | 解析网页 | ⭐⭐⭐⭐⭐ | cheerio、HTTP请求、缓存 |

---

## 🎯 云对象方法设计

### 1. `getList(options)` - 获取词条列表
**参数：**
```javascript
{
  entry_type: 'role|script|rule|guide|term',
  keyword: '关键词',
  page: 1,
  pageSize: 20,
  orderBy: 'created_at',
  order: 'desc'
}
```

### 2. `getDetail(entryId)` - 获取词条详情
**参数：** `entryId`

**功能：**
- 增加浏览计数
- 获取相关词条

### 3. `getCategories()` - 获取分类统计
**参数：** 无

**返回：** `{ role: 10, script: 5, rule: 3, guide: 2, term: 8, total: 28 }`

### 4. `search(options)` - 搜索词条
**参数：**
```javascript
{
  keyword: '关键词',
  entry_type: 'role|script|...',
  page: 1,
  pageSize: 20
}
```

### 5. `addComment(roleId, content)` - 添加评论
**参数：** `roleId`, `content`

**功能：**
- 验证登录
- 增加评论数

### 6. `getComments(roleId, page, pageSize)` - 获取评论列表
**参数：** `roleId`, `page`, `pageSize`

### 7. `toggleLike(roleId)` - 点赞/取消点赞
**参数：** `roleId`

**返回：** `{ is_liked: true/false }`

### 8. `getRankingStorytel lers(type, limit)` - 说书人榜单
**参数：** `type` ('fans_count' | 'heat_score'), `limit`

### 9. `parseUrl(url, forceRefresh)` - 解析网页
**参数：** `url`, `forceRefresh`

**功能：**
- 缓存检查
- HTTP 抓取
- cheerio 解析
- 数据存储

---

## 🗄️ 数据库集合

### `wiki_entries` - 百科词条表
```javascript
{
  _id: 'entry_xxx',
  entry_type: 'role|script|rule|guide|term',
  title: '标题',
  source_url: 'URL',
  content: {
    text: '完整文本',
    sections: [...],
    summary: '摘要'
  },
  role_info: {
    team: 'townsfolk|outsider|minion|demon|traveler',
    team_name: '阵营名',
    ability: '能力',
    setup_info: '设置信息',
    script_belongs: []
  },
  media: {
    icon_url: '图标URL',
    images: []
  },
  stats: {
    view_count: 0,
    search_count: 0,
    favorite_count: 0,
    comment_count: 0,
    like_count: 0
  },
  tags: [],
  related_links: [],
  cache_expires_at: Date,
  status: 1
}
```

### `wiki_role_comments` - 角色评论表
```javascript
{
  _id: 'comment_xxx',
  user_id: 'user_xxx',
  user_nickname: '昵称',
  user_avatar: 'URL',
  role_id: 'role_xxx',
  content: '评论内容',
  like_count: 0,
  status: 1,
  created_at: Date
}
```

### `wiki_role_likes` - 角色点赞表
```javascript
{
  user_id: 'user_xxx',
  role_id: 'role_xxx',
  created_at: Date
}
```

### `wiki_search_history` - 搜索历史表
```javascript
{
  user_id: 'user_xxx',
  keyword: '关键词',
  result_count: 10,
  created_at: Date
}
```

---

## 🔧 工具函数（复用）

- `parseUserId(context)` - 解析用户ID
- `returnSuccess(data, message)` - 成功返回
- `returnError(code, message)` - 错误返回

---

## 📝 实现要点

### 1. `_before` 钩子
```javascript
_before() {
  this.db = uniCloud.database();
  this.dbCmd = this.db.command;
  this.clientInfo = this.getClientInfo();
  
  // 需要认证的方法
  const authMethods = [
    'addComment',
    'toggleLike'
  ];
  
  const methodName = this.getMethodName();
  if (authMethods.includes(methodName)) {
    this.currentUserId = parseUserId(this.clientInfo);
    if (!this.currentUserId) {
      throw new Error('请先登录');
    }
  }
}
```

### 2. 搜索优化
- 正则表达式匹配标题、内容、标签
- 记录搜索历史（可选，需登录）
- 更新搜索计数

### 3. 缓存机制（parseUrl）
- 检查 `cache_expires_at` 字段
- 7天缓存有效期
- 支持强制刷新

### 4. HTML 解析（parseUrl）
- 使用 cheerio 解析
- 提取标题、内容、图片、信息框
- 自动检测词条类型
- 保留原有统计数据

---

## ✅ 开发步骤

1. ✅ 分析原云函数
2. ⏳ 创建 `wiki/index.obj.js`
3. ⏳ 实现 9 个方法
4. ⏳ 安装 cheerio 依赖（parseUrl需要）
5. ⏳ 上传并测试
6. ⏳ 创建测试页面
7. ⏳ 前端页面适配

---

## 🚨 特别注意

### parseUrl 方法复杂度
- 需要 `cheerio` 库（约 1.5MB）
- HTTP 请求可能超时
- HTML 解析可能失败
- 需要错误处理和降级方案

---

_创建时间：2025-11-04_  
_预计时间：2.5-3.5 小时_  
_最后 10% 冲刺！_

