# 血染百科 v2.1 开发计划

## 📋 项目概述

### 版本升级
**v2.0 → v2.1**

### 核心目标
**实现完整的结构化内容解析**，将钟楼百科的角色页面解析为详细的、可查询的结构化数据。

### 开发周期
**预计 5-7 天**（30-40 小时）

---

## 🎯 开发阶段规划

### 阶段一：数据结构设计（0.5天）

#### Day 1 上午：设计数据结构

**任务：定义 role_detail 完整结构**

```javascript
role_detail: {
  background_story: String,        // 背景故事
  ability: String,                 // 角色能力
  introduction: Array,             // 角色简介（多段）
  examples: Array,                 // 范例（对象数组）
  mechanics: Array,                // 运作方式（步骤数组）
  reminder_tokens: Array,          // 提示标记（结构化）
  rule_details: Array,             // 规则细节
  tips_and_tricks: Array,          // 提示与技巧
  bluff_tips: Array,               // 伪装方法
  character_info: Object           // 角色信息
}
```

**交付物**：
- ✅ 完整的数据结构文档
- ✅ 更新 wiki_entries.schema.json

**验收标准**：
- [ ] 数据结构覆盖所有需求字段
- [ ] Schema定义完整
- [ ] 文档清晰

---

### 阶段二：解析算法开发（3天）

#### Day 1 下午 - Day 2：基础解析函数

**任务1：章节识别算法**
- 识别10个主要章节
- 提取章节标题和内容
- 处理嵌套章节（h2, h3, h4）

**任务2：基础字段提取**
- parseBackgroundStory() - 背景故事
- parseAbility() - 角色能力
- parseCharacterInfo() - 角色信息（英文名、剧本、类型）

**交付物**：
- ✅ 章节识别函数
- ✅ 3个基础解析函数
- ✅ 单元测试

**验收标准**：
- [ ] 能正确识别所有章节
- [ ] 背景故事提取准确
- [ ] 角色能力提取完整
- [ ] 角色信息字段完整

---

#### Day 3：复杂字段解析

**任务3：多段内容提取**
- parseIntroduction() - 角色简介（识别多个段落）
- parseRuleDetails() - 规则细节（分条提取）
- parseTips() - 提示与技巧（分条提取）
- parseBluffing() - 伪装方法（分条提取）

**交付物**：
- ✅ 4个多段内容解析函数
- ✅ 段落分割算法

**验收标准**：
- [ ] 能正确分割段落
- [ ] 内容不重复不遗漏
- [ ] 格式清晰

---

#### Day 4：结构化内容解析

**任务4：复杂结构提取**
- parseExamples() - 范例（场景+结果配对）
- parseMechanics() - 运作方式（步骤识别）
- parseReminderTokens() - 提示标记（标记名+详情分组）

**算法重点**：
```javascript
// 范例解析
识别模式：
"小X是Y，小Z是W。洗衣妇得知..."

提取：
{
  scenario: "小X是Y，小Z是W。",
  result: "洗衣妇得知..."
}

// 提示标记解析
识别模式：
"标记名\n放置时机：...\n放置条件：...\n移除时机：..."

提取：
{
  name: "标记名",
  details: ["放置时机：...", "放置条件：...", "移除时机：..."]
}
```

**交付物**：
- ✅ 3个复杂结构解析函数
- ✅ 模式匹配算法

**验收标准**：
- [ ] 范例场景和结果正确配对
- [ ] 运作步骤顺序正确
- [ ] 提示标记分组准确

---

### 阶段三：云函数集成（1天）

#### Day 5：集成所有解析函数

**任务5：更新云函数**

**文件修改**：
- `wiki-admin-sync-all/index.js`
- `wiki-admin-sync-single/index.obj.js`

**核心逻辑**：
```javascript
function parseMediaWikiPage(html, url) {
  // ... 原有逻辑
  
  // 新增：详细内容解析
  const role_detail = {
    background_story: parseBackgroundStory(html),
    ability: parseAbility(html),
    introduction: parseIntroduction(html),
    examples: parseExamples(html),
    mechanics: parseMechanics(html),
    reminder_tokens: parseReminderTokens(html),
    rule_details: parseRuleDetails(html),
    tips_and_tricks: parseTips(html),
    bluff_tips: parseBluffing(html),
    character_info: parseCharacterInfo(html)
  };
  
  return {
    // ... 原有字段
    role_detail  // 新增字段
  };
}
```

**交付物**：
- ✅ 更新后的云函数
- ✅ 完整的解析流程

**验收标准**：
- [ ] 所有解析函数集成完成
- [ ] 测试单个角色解析成功
- [ ] 数据结构完整

---

### 阶段四：展示页面优化（1.5天）

#### Day 6：小程序端详情页优化

**任务6：优化 detail.vue 页面**

**新增UI组件**：

```vue
<!-- 背景故事卡片 -->
<view class="background-card">
  <text class="section-title">📖 背景故事</text>
  <text class="background-text">"{{ role_detail.background_story }}"</text>
</view>

<!-- 角色能力卡片 -->
<view class="ability-card">
  <text class="section-title">🎯 角色能力</text>
  <text class="ability-text">{{ role_detail.ability }}</text>
</view>

<!-- 角色简介（可折叠） -->
<view class="introduction-card">
  <text class="section-title" @click="toggleIntro">
    📝 角色简介 {{ introExpanded ? '▼' : '▶' }}
  </text>
  <view v-show="introExpanded" class="intro-list">
    <text v-for="(para, idx) in role_detail.introduction" :key="idx" class="intro-item">
      {{ para }}
    </text>
  </view>
</view>

<!-- 范例列表 -->
<view class="examples-card">
  <text class="section-title">📌 范例</text>
  <view v-for="(example, idx) in role_detail.examples" :key="idx" class="example-item">
    <text class="example-scenario">场景：{{ example.scenario }}</text>
    <text class="example-result">结果：{{ example.result }}</text>
  </view>
</view>

<!-- 提示标记 -->
<view class="tokens-card">
  <text class="section-title">🏷️ 提示标记</text>
  <view v-for="token in role_detail.reminder_tokens" :key="token.name" class="token-item">
    <text class="token-name">{{ token.icon }} {{ token.name }}</text>
    <view class="token-details">
      <text v-for="(detail, idx) in token.details" :key="idx" class="token-detail">
        • {{ detail }}
      </text>
    </view>
  </view>
</view>

<!-- 其他章节... -->
```

**交付物**：
- ✅ 优化后的详情页
- ✅ 美观的UI设计
- ✅ 折叠/展开交互

**验收标准**：
- [ ] UI美观大方
- [ ] 内容结构清晰
- [ ] 交互流畅
- [ ] 所有字段都能展示

---

### 阶段五：测试与优化（1天）

#### Day 7：全面测试

**任务7：批量测试所有角色**

**测试清单**：
- [ ] 测试暗流涌动24个角色
- [ ] 验证每个字段的准确性
- [ ] 检查特殊情况处理
- [ ] 性能测试

**任务8：优化和修复**
- 修复发现的bug
- 优化解析准确率
- 改进错误处理
- 完善文档

**交付物**：
- ✅ 测试报告
- ✅ 优化后的代码
- ✅ 完整文档

**验收标准**：
- [ ] 解析准确率 > 90%
- [ ] 所有测试通过
- [ ] 无严重bug
- [ ] 文档完整

---

## 📊 开发任务清单（18个）

### 后端开发（14个任务）

#### 数据设计（1个）
1. ⏸️ 设计完整的 role_detail 数据结构

#### 解析函数（12个）
2. ⏸️ 开发章节识别算法
3. ⏸️ 开发背景故事提取函数
4. ⏸️ 开发角色能力提取函数
5. ⏸️ 开发角色简介提取函数（多段）
6. ⏸️ 开发范例提取函数（场景+结果）
7. ⏸️ 开发运作方式提取函数（多步骤）
8. ⏸️ 开发提示标记提取函数（结构化）
9. ⏸️ 开发规则细节提取函数（多条）
10. ⏸️ 开发提示与技巧提取函数（多条）
11. ⏸️ 开发伪装方法提取函数（多条）
12. ⏸️ 开发角色信息提取函数（属性）

#### 云函数更新（2个）
13. ⏸️ 更新 wiki-admin-sync-all 云函数
14. ⏸️ 更新 wiki-admin-sync-single 云函数

#### Schema更新（1个）
15. ⏸️ 更新 wiki_entries.schema.json

---

### 前端开发（3个任务）

16. ⏸️ 优化小程序 detail.vue 展示页面
17. ⏸️ 批量测试24个角色解析
18. ⏸️ UI优化和交互完善

---

## ⏰ 时间线

```
Day 1:
├─ 上午：数据结构设计
├─ 下午：章节识别 + 基础解析（3个函数）
└─ 交付：背景故事、角色能力、角色信息解析

Day 2:
├─ 上午：多段内容解析（4个函数）
├─ 下午：继续开发
└─ 交付：角色简介、规则细节、提示、伪装解析

Day 3:
├─ 上午：复杂结构解析（3个函数）
├─ 下午：继续开发
└─ 交付：范例、运作方式、提示标记解析

Day 4:
├─ 上午：集成到云函数
├─ 下午：测试云函数
└─ 交付：完整的云函数代码

Day 5:
├─ 全天：优化小程序展示页面
└─ 交付：优化后的 detail.vue

Day 6-7:
├─ 测试24个角色
├─ 修复bug
├─ 优化UI
└─ 交付：完整的 v2.1 版本
```

---

## 💻 技术实现方案

### 解析策略

#### 策略1：章节定位
```javascript
// 使用正则匹配h2/h3标题
const sections = {
  '背景故事': extractSection(html, '背景故事', '角色能力'),
  '角色能力': extractSection(html, '角色能力', '角色简介'),
  '角色简介': extractSection(html, '角色简介', '范例'),
  // ...
};
```

#### 策略2：内容提取
```javascript
// 根据不同章节特点使用不同提取方法
- 背景故事：提取引号内文本
- 能力：提取第一段完整文本
- 简介：按段落分割
- 范例：识别场景-结果模式
- 提示标记：识别标记名和详情列表
```

#### 策略3：数据清洗
```javascript
// 清理多余空格、换行、HTML标签
function cleanText(text) {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
```

---

## 📦 交付清单

### 代码文件（4个）

1. ✅ `wiki-admin-sync-all/index.js` - 更新
2. ✅ `wiki-admin-sync-single/index.obj.js` - 更新
3. ✅ `wiki_entries.schema.json` - 更新
4. ✅ `botc-miniprogram/pages/tools/wiki/detail.vue` - 优化

### 解析函数库（1个新文件）

5. ✅ `wiki-admin-sync-all/parser-utils.js` - 解析工具库
   - 包含所有12个解析函数
   - 可复用的工具方法
   - 完整的注释说明

### 文档（3份）

6. ✅ v2.1 技术规格说明
7. ✅ v2.1 开发计划（本文档）
8. ✅ v2.1 使用手册

---

## 🎯 成功标准

### 解析准确率
- **背景故事**：100%（固定格式）
- **角色能力**：100%（固定格式）
- **角色简介**：>90%（段落分割）
- **范例**：>85%（场景识别）
- **运作方式**：>90%（步骤识别）
- **提示标记**：>95%（结构化）
- **规则细节**：>85%（条目识别）
- **提示与技巧**：>85%（段落分割）
- **伪装方法**：>85%（段落分割）
- **角色信息**：100%（固定字段）

**总体目标**：平均准确率 > 90%

---

### 用户体验
- [ ] 内容展示完整清晰
- [ ] 分段易于阅读
- [ ] 可折叠/展开章节
- [ ] 加载速度快
- [ ] 操作流畅

---

## 💰 成本估算

### 开发成本
- **人力投入**：30-40 小时
- **代码行数**：预计新增 800-1000 行
- **文档页数**：预计新增 30 页

### 运营成本
- **无额外成本**（复用现有云函数）
- **数据库存储**：略有增加（每条数据增加约2-3KB）

---

## 📈 预期效果

### 对用户
- 📚 **内容更详细** - 完整的角色信息
- 🎯 **查询更精准** - 可按字段搜索
- 📱 **展示更清晰** - 结构化展示
- ⭐ **体验更好** - 专业的百科工具

### 对平台
- 🏆 **竞争力提升** - 最完整的百科系统
- 📊 **用户粘性** - 更长的停留时间
- 🎯 **专业形象** - 权威的知识平台

---

## 🚀 立即开始？

**准备好了吗？**

确认后我将开始：
1. 设计完整的数据结构
2. 开发12个解析函数
3. 更新云函数代码
4. 优化展示页面
5. 全面测试

回复 **/implement** 开始v2.1开发！

---

**计划版本**: v2.1.0  
**功能名称**: 详细内容结构化解析  
**开发周期**: 5-7天  
**预计工作量**: 30-40小时  
**创建时间**: 2025年10月17日

