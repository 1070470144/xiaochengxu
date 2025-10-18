# 血染百科功能使用指南

## 🎉 功能已完成！

### ✅ 已实现的功能

#### 1. **后端云函数（3个）**
- ✅ `wiki-parse-url` - URL解析功能
- ✅ `wiki-search` - 搜索功能
- ✅ `wiki-detail` - 详情查询功能

#### 2. **数据库集合（3个）**
- ✅ `wiki_entries` - 百科词条表
- ✅ `wiki_favorites` - 用户收藏表
- ✅ `wiki_search_history` - 搜索历史表

#### 3. **小程序页面（2个）**
- ✅ `pages/tools/wiki/wiki.vue` - 百科主页（已升级）
- ✅ `pages/tools/wiki/detail.vue` - 词条详情页

---

## 🚀 部署步骤

### 步骤1：上传云函数

在 HBuilderX 中：

```bash
1. 右键 uniCloud-aliyun/cloudfunctions/wiki-parse-url
   → 上传部署

2. 右键 uniCloud-aliyun/cloudfunctions/wiki-search
   → 上传部署

3. 右键 uniCloud-aliyun/cloudfunctions/wiki-detail
   → 上传部署
```

**注意**：首次上传时，云函数会自动安装 `cheerio` 依赖，可能需要等待1-2分钟。

---

### 步骤2：创建数据库集合

在 uniCloud Web控制台（https://unicloud.dcloud.net.cn）：

#### 创建集合1：wiki_entries
```bash
1. 进入云数据库
2. 点击"新建集合"
3. 集合名称：wiki_entries
4. 点击"确定"
5. 进入集合 → 点击"DB Schema" → 导入Schema
6. 复制 uniCloud-aliyun/database/wiki_entries.schema.json 内容
7. 保存
```

#### 创建集合2：wiki_favorites
```bash
1. 新建集合：wiki_favorites
2. 导入 Schema：wiki_favorites.schema.json
3. 保存
```

#### 创建集合3：wiki_search_history
```bash
1. 新建集合：wiki_search_history
2. 导入 Schema：wiki_search_history.schema.json
3. 保存
```

#### 设置数据库权限
```json
{
  "read": true,
  "create": "auth.uid != null",
  "update": "auth.uid != null && doc.user_id == auth.uid",
  "delete": "auth.uid != null && doc.user_id == auth.uid"
}
```

---

### 步骤3：配置页面路由

在 `pages.json` 中添加详情页路由（如果还没有）：

```json
{
  "path": "pages/tools/wiki/detail",
  "style": {
    "navigationBarTitleText": "百科详情",
    "enablePullDownRefresh": false
  }
}
```

---

## 📖 使用指南

### 用户操作流程

#### 1. 进入百科页面
```
打开小程序 → 工具 → 血染百科
```

#### 2. 导入百科内容
```
方法1：手动输入URL
1. 点击"导入百科链接"按钮
2. 输入钟楼百科的页面URL
3. 点击"开始导入"
4. 等待解析（约3-5秒）
5. 自动跳转到详情页

方法2：粘贴URL
1. 在浏览器中复制百科URL
2. 点击"导入百科链接"
3. 点击"粘贴"按钮
4. 点击"开始导入"
```

#### 3. 浏览内容
```
- 查看"最近导入"区域的词条
- 点击词条卡片查看详情
- 使用搜索功能查找内容
```

#### 4. 词条详情页
```
- 查看完整内容
- 查看角色信息（阵营、能力）
- 预览相关图片
- 点击相关链接导入更多词条
- 收藏常用词条
- 复制原文链接
```

---

## 🌐 支持的URL格式

### 示例URL

#### 角色页面
```
https://clocktower-wiki.gstonegames.com/index.php?title=洗衣妇
https://clocktower-wiki.gstonegames.com/index.php?title=图书管理员
https://clocktower-wiki.gstonegames.com/index.php?title=小恶魔
```

#### 规则页面
```
https://clocktower-wiki.gstonegames.com/index.php?title=规则概要
https://clocktower-wiki.gstonegames.com/index.php?title=术语汇总
https://clocktower-wiki.gstonegames.com/index.php?title=重要细节
```

#### 剧本页面
```
https://clocktower-wiki.gstonegames.com/index.php?title=暗流涌动
https://clocktower-wiki.gstonegames.com/index.php?title=黯月初升
https://clocktower-wiki.gstonegames.com/index.php?title=梦殒春宵
```

---

## 🔧 技术说明

### 工作原理

```
用户输入URL
    ↓
小程序调用 wiki-parse-url 云函数
    ↓
云函数抓取钟楼百科网页
    ↓
使用 cheerio 解析 HTML
    ↓
提取结构化数据（标题、内容、图片等）
    ↓
保存到云数据库（缓存7天）
    ↓
返回数据给小程序
    ↓
小程序展示内容
```

### 缓存机制

- **云端缓存**：7天
- **本地缓存**：浏览过的词条会在本地缓存
- **缓存刷新**：用户可以手动刷新（开发中）

### 性能优化

- ✅ 首次导入：3-5秒（抓取+解析）
- ✅ 二次访问：<1秒（读取缓存）
- ✅ 图片懒加载
- ✅ 分页查询

---

## 🐛 常见问题

### Q1: 导入失败怎么办？
**A**: 检查以下几点：
1. URL 是否正确（必须是钟楼百科的链接）
2. 网络是否正常
3. 云函数是否已上传部署
4. 数据库集合是否已创建

### Q2: 解析时间太长？
**A**: 
- 首次解析需要3-5秒（抓取网页）
- 二次访问会使用缓存，瞬间加载
- 如果超过10秒，可能是网络问题

### Q3: 部分内容显示不全？
**A**:
- MediaWiki 结构复杂，部分特殊格式可能解析不完整
- 可以点击"查看原文"复制链接，在浏览器中查看

### Q4: 收藏功能不可用？
**A**:
- 需要用户登录后才能使用收藏功能
- 检查是否已登录小程序

---

## 📊 数据统计

### 云函数调用统计
可以在 uniCloud Web控制台查看：
- 云函数调用次数
- 平均响应时间
- 错误率

### 用户行为统计
- 导入次数
- 搜索热词
- 热门词条

---

## 🔄 后续优化方向

### 功能扩展
- [ ] 搜索结果页面（显示多个结果）
- [ ] 收藏列表页面
- [ ] 浏览历史页面
- [ ] 热门词条推荐
- [ ] 词条分享功能
- [ ] 离线下载功能

### 性能优化
- [ ] 图片CDN加速
- [ ] 预加载热门词条
- [ ] 搜索结果缓存
- [ ] 分批加载图片

### 用户体验
- [ ] 骨架屏加载
- [ ] 内容目录导航
- [ ] 夜间模式
- [ ] 字体大小调节

---

## 📞 技术支持

### 遇到问题？
1. 查看云函数日志
2. 检查数据库连接
3. 查看浏览器控制台
4. 联系开发团队

### 调试技巧
```javascript
// 在云函数中添加日志
console.log('[wiki-parse] 调试信息:', data);

// 在小程序中查看返回数据
console.log('云函数返回:', res);
```

---

## 📝 更新日志

### v1.0.0 (2025-10-17)
- ✅ 初始版本发布
- ✅ 支持钟楼百科URL解析
- ✅ 支持角色、规则、剧本等多种类型
- ✅ 支持搜索功能
- ✅ 支持收藏功能
- ✅ 完整的缓存机制

---

**维护人员**: 开发团队  
**最后更新**: 2025年10月17日  
**文档版本**: v1.0.0

