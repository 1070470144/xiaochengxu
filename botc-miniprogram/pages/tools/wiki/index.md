# 血染百科功能文档索引

## 📚 文档列表

### 1. 核心文档

#### 📘 [WIKI_FEATURE_README.md](./WIKI_FEATURE_README.md)
**功能使用指南**
- 功能介绍
- 使用方法
- 常见问题
- 后续优化方向

#### 📗 [QUICK_START.md](./QUICK_START.md)
**5分钟快速开始**
- 快速部署步骤
- 测试URL清单
- 使用技巧

#### 📙 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
**详细部署指南**
- 完整部署流程
- 配置说明
- 故障排查
- 性能优化

#### 📕 [TEST_CASES.md](./TEST_CASES.md)
**测试用例文档**
- 功能测试
- 性能测试
- 边界测试
- 测试结果记录

---

### 2. 技术设计文档

#### 📄 WIKI_IMPLEMENTATION_GUIDE.md
**完整实施指南**（项目根目录）
- 技术架构
- 完整代码实现
- 数据库设计

#### 📄 WIKI_WEB_SCRAPING_UPGRADE_SPEC.md
**技术规格说明**（项目根目录）
- 技术方案对比
- 可行性分析
- 风险评估

#### 📄 WIKI_FEATURE_DEVELOPMENT_PLAN.md
**开发计划**（项目根目录）
- 开发阶段规划
- 时间估算
- 成本预算

---

## 🎯 根据需求选择文档

### 我想快速部署
👉 阅读 [QUICK_START.md](./QUICK_START.md)

### 我想了解详细部署流程
👉 阅读 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

### 我想进行测试
👉 阅读 [TEST_CASES.md](./TEST_CASES.md)

### 我想了解技术细节
👉 阅读 `WIKI_IMPLEMENTATION_GUIDE.md`

### 我想了解功能使用
👉 阅读 [WIKI_FEATURE_README.md](./WIKI_FEATURE_README.md)

---

## 📂 文件结构

```
pages/tools/wiki/
├── wiki.vue                    # 百科主页（已升级）
├── detail.vue                  # 词条详情页（新建）
├── WIKI_FEATURE_README.md      # 功能使用指南
├── QUICK_START.md              # 快速开始
├── DEPLOYMENT_GUIDE.md         # 部署指南
├── TEST_CASES.md               # 测试用例
└── index.md                    # 本文档（导航）

uniCloud-aliyun/cloudfunctions/
├── wiki-parse-url/             # URL解析云函数
│   ├── index.js
│   ├── package.json
│   └── test.js                 # 测试脚本
├── wiki-search/                # 搜索云函数
│   ├── index.js
│   └── package.json
└── wiki-detail/                # 详情查询云函数
    ├── index.js
    └── package.json

uniCloud-aliyun/database/
├── wiki_entries.schema.json
├── wiki_favorites.schema.json
└── wiki_search_history.schema.json
```

---

## 🚀 快速链接

- [钟楼百科官网](https://clocktower-wiki.gstonegames.com/)
- [uniCloud 控制台](https://unicloud.dcloud.net.cn)
- [uniCloud 文档](https://uniapp.dcloud.net.cn/uniCloud/)

---

**维护人员**: 开发团队  
**创建时间**: 2025年10月17日  
**版本**: v1.0.0

