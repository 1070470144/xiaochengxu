# 血染百科功能开发计划

## 📋 项目概览

### 功能名称
**血染百科 - 网页抓取解析功能**

### 目标
在小程序工具模块的百科页面中，集成钟楼百科（https://clocktower-wiki.gstonegames.com/）内容自动解析功能，让用户可以通过输入URL导入并浏览官方百科内容。

### 开发周期
**预计 10 个工作日**（约 60-80 小时）

---

## 🎯 开发阶段规划

### 阶段一：后端云函数开发（4天）

#### Day 1-2: 核心解析云函数
**任务：创建 `wiki-parse-url` 云函数**

**工作内容：**
1. 创建云函数目录结构
   ```
   uniCloud-aliyun/cloudfunctions/wiki-parse-url/
   ├── index.js
   └── package.json
   ```

2. 安装依赖包
   ```json
   {
     "dependencies": {
       "cheerio": "^1.0.0-rc.12",
       "got": "^11.8.6"
     }
   }
   ```

3. 实现核心功能
   - ✅ URL 验证（仅支持钟楼百科域名）
   - ✅ HTML 抓取（got 库）
   - ✅ MediaWiki 内容解析（cheerio）
   - ✅ 结构化数据提取
     - 标题提取
     - 段落提取
     - 图片提取
     - 角色信息提取（信息框）
     - 相关链接提取
   - ✅ 缓存检查机制
   - ✅ 数据库保存

4. 错误处理
   - 网络超时处理
   - URL 格式验证
   - 解析失败兜底
   - 友好的错误提示

**验收标准：**
- [ ] 成功抓取钟楼百科任意页面
- [ ] 正确解析角色页面（如"洗衣妇"）
- [ ] 正确解析规则页面（如"规则概要"）
- [ ] 正确解析剧本页面（如"暗流涌动"）
- [ ] 缓存机制正常工作
- [ ] 错误提示友好明确

**测试用例：**
```javascript
// 测试角色页面
const testUrl1 = 'https://clocktower-wiki.gstonegames.com/index.php?title=洗衣妇';

// 测试规则页面
const testUrl2 = 'https://clocktower-wiki.gstonegames.com/index.php?title=规则概要';

// 测试剧本页面
const testUrl3 = 'https://clocktower-wiki.gstonegames.com/index.php?title=暗流涌动';
```

---

#### Day 3: 搜索和详情云函数
**任务：创建 `wiki-search` 和 `wiki-detail` 云函数**

##### wiki-search 云函数
**功能：**
- 关键词搜索（标题、内容、标签）
- 类型筛选（角色、规则、剧本等）
- 分页查询
- 搜索历史记录

**验收标准：**
- [ ] 搜索"洗衣妇"能找到相关结果
- [ ] 搜索"镇民"能找到所有镇民角色
- [ ] 分页功能正常
- [ ] 搜索记录正确保存

##### wiki-detail 云函数
**功能：**
- 根据词条ID查询详情
- 增加浏览计数
- 查询相关词条
- 记录浏览历史

**验收标准：**
- [ ] 能正确查询词条详情
- [ ] 浏览计数正确递增
- [ ] 相关词条推荐准确
- [ ] 浏览历史正确记录

---

#### Day 4: 云函数优化和测试
**任务：完善云函数功能和性能优化**

**工作内容：**
1. 性能优化
   - 查询优化（添加索引）
   - 响应时间优化
   - 内存使用优化

2. 完善错误处理
   - 统一错误码
   - 详细错误信息
   - 日志记录

3. 添加数据验证
   - 输入参数验证
   - 数据格式校验
   - 安全性检查

4. 全面测试
   - 单元测试
   - 集成测试
   - 压力测试

**验收标准：**
- [ ] 所有云函数响应时间 < 5秒
- [ ] 错误处理完善，提示友好
- [ ] 测试覆盖率 > 80%
- [ ] 无内存泄漏

---

### 阶段二：数据库设计和创建（1天）

#### Day 5: 创建数据库集合
**任务：在 uniCloud 创建数据库集合**

**集合列表：**

##### 1. wiki_entries（百科词条表）
```javascript
{
  _id: String,
  entry_type: String,      // role, script, rule, guide, term
  title: String,
  source_url: String,
  source_type: String,
  source_name: String,
  content: {
    text: String,
    sections: Array,
    summary: String
  },
  role_info: {
    team: String,
    team_name: String,
    ability: String,
    setup_info: String,
    script_belongs: Array
  },
  media: {
    icon_url: String,
    images: Array
  },
  tags: Array,
  related_links: Array,
  stats: {
    view_count: Number,
    search_count: Number,
    favorite_count: Number
  },
  cache_expires_at: Date,
  created_at: Date,
  updated_at: Date
}
```

**索引设计：**
- 主键：`_id`
- 索引1：`source_url`（唯一索引）
- 索引2：`entry_type`
- 索引3：`title`（文本索引）
- 索引4：`cache_expires_at`

##### 2. wiki_favorites（用户收藏表）
```javascript
{
  _id: String,
  user_id: String,
  entry_id: String,
  notes: String,
  created_at: Date
}
```

**索引设计：**
- 主键：`_id`
- 索引1：`user_id`
- 索引2：`entry_id`
- 唯一索引：`user_id + entry_id`

##### 3. wiki_search_history（搜索历史表）
```javascript
{
  _id: String,
  user_id: String,
  keyword: String,
  result_count: Number,
  created_at: Date
}
```

**索引设计：**
- 主键：`_id`
- 索引1：`user_id`
- 索引2：`keyword`
- 索引3：`created_at`

**验收标准：**
- [ ] 所有集合创建成功
- [ ] 索引设置正确
- [ ] 数据库规则配置完成
- [ ] 测试数据插入成功

---

### 阶段三：小程序前端开发（3天）

#### Day 6-7: 修改百科主页
**任务：修改 `pages/tools/wiki/wiki.vue`**

**新增功能：**

##### 1. 导入功能区
```vue
<!-- 导入百科卡片 -->
<view class="import-card">
  <button @click="showImportDialog">导入百科链接</button>
</view>
```

**功能点：**
- 显示导入入口
- 打开导入弹窗
- URL 输入和粘贴
- 调用云函数解析
- 显示解析进度
- 跳转到详情页

##### 2. 最近导入区
```vue
<!-- 最近导入的词条 -->
<view class="recent-imports">
  <scroll-view scroll-x>
    <view class="recent-item" 
      v-for="item in recentImports"
      @click="viewDetail(item._id)">
      <!-- 词条卡片 -->
    </view>
  </scroll-view>
</view>
```

**功能点：**
- 显示最近导入的10个词条
- 横向滚动浏览
- 点击查看详情
- 实时更新列表

##### 3. 导入弹窗
```vue
<uni-popup ref="importPopup">
  <view class="import-dialog">
    <!-- URL输入框 -->
    <textarea v-model="importUrl"></textarea>
    
    <!-- 操作按钮 -->
    <button @click="importWiki">导入</button>
    <button @click="pasteUrl">粘贴</button>
  </view>
</uni-popup>
```

**功能点：**
- URL 输入和验证
- 剪贴板粘贴
- 字数统计
- 导入进度提示
- 错误提示

##### 4. 搜索功能增强
**功能点：**
- 调用 `wiki-search` 云函数
- 显示搜索结果
- 按类型筛选
- 搜索历史记录

**验收标准：**
- [ ] 导入功能正常工作
- [ ] 最近导入正确显示
- [ ] 弹窗交互流畅
- [ ] 搜索功能完善
- [ ] UI 美观符合设计规范
- [ ] 加载状态友好
- [ ] 错误提示清晰

---

#### Day 8: 创建百科详情页
**任务：创建 `pages/tools/wiki/detail.vue`**

**页面结构：**
```vue
<template>
  <view class="detail-page">
    <!-- 头部：标题和图标 -->
    <view class="header">
      <image :src="entry.media.icon_url" />
      <text>{{ entry.title }}</text>
    </view>
    
    <!-- 角色信息（如果是角色） -->
    <view v-if="entry.entry_type === 'role'" class="role-info">
      <view class="info-item">
        <text>阵营：{{ entry.role_info.team_name }}</text>
      </view>
      <view class="info-item">
        <text>能力：{{ entry.role_info.ability }}</text>
      </view>
    </view>
    
    <!-- 内容区域 -->
    <view class="content">
      <!-- 摘要 -->
      <view class="summary">{{ entry.content.summary }}</view>
      
      <!-- 分段内容 -->
      <view v-for="section in entry.content.sections" class="section">
        <text class="heading">{{ section.heading }}</text>
        <text class="content">{{ section.content }}</text>
      </view>
    </view>
    
    <!-- 相关图片 -->
    <view v-if="entry.media.images.length > 0" class="images">
      <image 
        v-for="img in entry.media.images" 
        :src="img"
        @click="previewImage(img)"
      />
    </view>
    
    <!-- 相关词条 -->
    <view class="related">
      <view v-for="item in entry.related_entries" class="related-item">
        <text>{{ item.title }}</text>
      </view>
    </view>
    
    <!-- 底部操作栏 -->
    <view class="footer">
      <button @click="toggleFavorite">收藏</button>
      <button @click="shareEntry">分享</button>
      <button @click="openSource">查看原文</button>
    </view>
  </view>
</template>
```

**功能点：**
1. 词条信息展示
   - 标题和图标
   - 角色信息（阵营、能力）
   - 内容分段显示
   - 图片预览
   - 相关词条推荐

2. 交互功能
   - 收藏/取消收藏
   - 分享词条
   - 查看原文（复制链接）
   - 图片预览

3. 数据加载
   - 调用 `wiki-detail` 云函数
   - 加载状态显示
   - 错误处理

**验收标准：**
- [ ] 页面布局美观
- [ ] 内容展示完整
- [ ] 角色信息正确显示
- [ ] 图片可以预览
- [ ] 相关词条推荐准确
- [ ] 收藏功能正常
- [ ] 分享功能正常

---

### 阶段四：测试和优化（2天）

#### Day 9: 功能测试
**任务：全面测试所有功能**

**测试清单：**

##### 1. 云函数测试
- [ ] wiki-parse-url
  - 测试不同类型页面（角色、规则、剧本）
  - 测试缓存机制
  - 测试错误处理
  - 测试性能（响应时间）

- [ ] wiki-search
  - 测试关键词搜索
  - 测试类型筛选
  - 测试分页功能
  - 测试搜索记录

- [ ] wiki-detail
  - 测试详情查询
  - 测试浏览计数
  - 测试相关推荐

##### 2. 小程序页面测试
- [ ] wiki.vue（主页）
  - 测试导入功能
  - 测试URL粘贴
  - 测试最近导入
  - 测试搜索功能
  - 测试UI交互

- [ ] detail.vue（详情页）
  - 测试内容展示
  - 测试图片预览
  - 测试收藏功能
  - 测试分享功能

##### 3. 边界测试
- [ ] 无效URL处理
- [ ] 网络异常处理
- [ ] 空数据处理
- [ ] 并发请求处理

##### 4. 兼容性测试
- [ ] iOS系统测试
- [ ] Android系统测试
- [ ] 不同屏幕尺寸适配

**测试记录模板：**
```markdown
测试项：URL解析 - 角色页面
测试URL：https://clocktower-wiki.gstonegames.com/index.php?title=洗衣妇
预期结果：成功解析并显示角色信息
实际结果：✅ 通过 / ❌ 失败
问题描述：
解决方案：
```

---

#### Day 10: 优化和完善
**任务：性能优化和用户体验提升**

**优化项目：**

##### 1. 性能优化
- [ ] 图片懒加载
- [ ] 列表虚拟滚动
- [ ] 请求去重
- [ ] 数据缓存优化
- [ ] 云函数冷启动优化

##### 2. 用户体验优化
- [ ] 加载状态优化
  - 骨架屏
  - 进度提示
  - 友好的等待提示

- [ ] 错误提示优化
  - 明确的错误信息
  - 操作指引
  - 重试按钮

- [ ] 交互优化
  - 按钮点击反馈
  - 滚动优化
  - 动画效果

##### 3. 细节完善
- [ ] 空状态页面
- [ ] 网络异常页面
- [ ] 数据为空提示
- [ ] 操作成功提示

##### 4. 代码优化
- [ ] 代码注释完善
- [ ] 函数拆分优化
- [ ] 代码复用
- [ ] 性能监控

**验收标准：**
- [ ] 首屏加载时间 < 2秒
- [ ] 页面切换流畅（60fps）
- [ ] 内存占用合理
- [ ] 无明显卡顿
- [ ] 用户反馈积极

---

## 📊 项目里程碑

### 里程碑1：后端完成（Day 1-4）
**交付物：**
- ✅ 3个云函数（已测试）
- ✅ 云函数文档
- ✅ 测试报告

**验收标准：**
- 所有云函数功能正常
- 测试用例全部通过
- 文档完整清晰

### 里程碑2：数据库完成（Day 5）
**交付物：**
- ✅ 3个数据库集合
- ✅ 索引配置
- ✅ 测试数据

**验收标准：**
- 数据库结构正确
- 索引优化完成
- 可以正常读写

### 里程碑3：前端完成（Day 6-8）
**交付物：**
- ✅ wiki.vue 改造
- ✅ detail.vue 新建
- ✅ UI组件完成

**验收标准：**
- UI美观符合规范
- 功能交互流畅
- 与后端对接成功

### 里程碑4：项目完成（Day 9-10）
**交付物：**
- ✅ 完整功能
- ✅ 测试报告
- ✅ 用户文档
- ✅ 部署文档

**验收标准：**
- 所有功能正常运行
- 测试全部通过
- 文档完整
- 可以正式上线

---

## 📝 开发规范

### 代码规范
1. **命名规范**
   - 云函数：kebab-case（如 `wiki-parse-url`）
   - 变量/函数：camelCase（如 `importUrl`）
   - 常量：UPPER_SNAKE_CASE（如 `MAX_CACHE_TIME`）
   - 组件：PascalCase（如 `WikiCard`）

2. **注释规范**
   ```javascript
   /**
    * 解析钟楼百科页面
    * @param {String} html - HTML内容
    * @param {String} url - 页面URL
    * @returns {Object} 解析后的结构化数据
    */
   function parseMediaWikiPage(html, url) {
     // ...
   }
   ```

3. **错误处理**
   ```javascript
   try {
     // 业务逻辑
   } catch (error) {
     console.error('[wiki-parse] 错误:', error);
     return {
       code: 500,
       message: '操作失败: ' + error.message
     };
   }
   ```

### Git提交规范
```bash
# 功能开发
git commit -m "feat(wiki): 添加URL解析功能"

# Bug修复
git commit -m "fix(wiki): 修复图片加载失败问题"

# 文档更新
git commit -m "docs(wiki): 更新使用文档"

# 性能优化
git commit -m "perf(wiki): 优化搜索性能"
```

### 测试规范
1. **单元测试**
   - 每个云函数至少5个测试用例
   - 覆盖正常流程和异常流程
   - 测试数据真实有效

2. **集成测试**
   - 端到端流程测试
   - 真实场景模拟
   - 性能测试

3. **用户测试**
   - 邀请5-10名用户试用
   - 收集反馈意见
   - 记录改进建议

---

## 💰 成本预算

### 开发成本
- **人力成本**：10天 × 8小时 = 80小时
- **学习成本**：熟悉钟楼百科结构 2小时
- **测试成本**：编写和执行测试 10小时
- **总计**：约 92小时

### 运营成本（首年）
基于1000用户/月使用量：

| 项目 | 用量 | 单价 | 月成本 | 年成本 |
|------|------|------|--------|--------|
| 云函数调用 | 35,000次 | ¥0.0133/万次 | ¥4.66 | ¥55.92 |
| 云数据库 | 0.5GB | 免费额度内 | ¥0 | ¥0 |
| 云存储 | 1GB | 免费额度内 | ¥0 | ¥0 |
| **总计** | - | - | **¥4.66** | **¥55.92** |

**成本极低，完全在可控范围内！**

---

## 🎯 成功指标

### 技术指标
- [ ] 云函数响应时间 < 5秒
- [ ] 页面加载时间 < 2秒
- [ ] 解析成功率 > 95%
- [ ] 缓存命中率 > 80%
- [ ] 错误率 < 1%

### 用户指标
- [ ] 每周新增导入 > 50次
- [ ] 用户满意度 > 4.5分
- [ ] 功能使用率 > 30%
- [ ] 收藏率 > 20%

### 业务指标
- [ ] 丰富百科内容 > 100条
- [ ] 减少用户跳出到其他百科网站
- [ ] 提升用户停留时长

---

## ⚠️ 风险管理

### 技术风险

#### 风险1：网站结构变化
**影响程度**：中  
**应对措施**：
- 建立解析失败监控
- 快速更新解析规则
- 提供手动刷新功能
- 保留历史缓存数据

#### 风险2：网络不稳定
**影响程度**：中  
**应对措施**：
- 增加重试机制
- 设置合理超时时间
- 提供离线缓存
- 友好的错误提示

#### 风险3：性能问题
**影响程度**：低  
**应对措施**：
- 云函数性能优化
- 数据库查询优化
- 添加缓存机制
- 限流控制

### 运营风险

#### 风险1：版权问题
**影响程度**：低（官方网站）  
**应对措施**：
- 明确标注内容来源
- 仅用于展示，不做商业用途
- 提供原文链接
- 遵守官方使用规范

#### 风险2：用户接受度
**影响程度**：低  
**应对措施**：
- 提供详细使用教程
- 优化用户体验
- 收集用户反馈
- 持续改进功能

---

## 📚 参考资料

### 技术文档
- [uniCloud 云函数文档](https://uniapp.dcloud.net.cn/uniCloud/cf-functions.html)
- [Cheerio 文档](https://cheerio.js.org/)
- [Got HTTP 库文档](https://github.com/sindresorhus/got)
- [MediaWiki API](https://www.mediawiki.org/wiki/API:Main_page)

### 项目文档
- `WIKI_IMPLEMENTATION_GUIDE.md` - 实施指南
- `WIKI_WEB_SCRAPING_UPGRADE_SPEC.md` - 技术规格
- `ENCYCLOPEDIA_FEATURE_SPEC.md` - 功能需求

### 官方资源
- [钟楼百科](https://clocktower-wiki.gstonegames.com/)
- [集石官方](https://gstonegames.com/)

---

## ✅ 检查清单

### 开发前检查
- [ ] 阅读完整的实施指南
- [ ] 理解钟楼百科的结构
- [ ] 准备好开发环境
- [ ] 创建测试账号

### 开发中检查
- [ ] 代码符合规范
- [ ] 添加必要注释
- [ ] 错误处理完善
- [ ] 性能符合要求

### 上线前检查
- [ ] 所有测试通过
- [ ] 文档完整
- [ ] 性能达标
- [ ] 用户反馈良好
- [ ] 无已知严重bug

---

## 🚀 下一步行动

### 立即开始
1. **创建第一个云函数**
   ```bash
   在 HBuilderX 中：
   右键 uniCloud-aliyun/cloudfunctions
   → 新建云函数
   → 命名为 wiki-parse-url
   ```

2. **复制代码**
   - 从 `WIKI_IMPLEMENTATION_GUIDE.md` 复制代码
   - 粘贴到 `index.js`
   - 创建 `package.json`

3. **上传部署**
   ```bash
   右键 wiki-parse-url
   → 上传部署
   ```

4. **测试**
   ```bash
   右键 wiki-parse-url
   → 运行云函数
   → 输入测试参数
   ```

---

## 📞 支持和帮助

### 遇到问题？
1. 查看 `WIKI_IMPLEMENTATION_GUIDE.md` 详细文档
2. 检查云函数日志
3. 使用 uniCloud Web控制台调试
4. 查看钟楼百科网站源码

### 需要优化？
1. 使用云函数性能分析
2. 查看数据库慢查询
3. 优化代码逻辑
4. 添加缓存机制

---

**文档版本**: v1.0.0  
**创建时间**: 2025年10月17日  
**维护人员**: 开发团队  
**预计完成时间**: 2025年10月27日


