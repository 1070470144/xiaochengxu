# 内容审核系统部署指南

## 🎯 系统概述

本系统实现了**举报功能 + 关键词过滤**的混合审核机制，成本为0且能解决大部分内容审核问题。

### 核心功能

1. ✅ **管理端敏感词管理**：在管理后台配置敏感词
2. ✅ **自动内容过滤**：发帖时自动检查敏感词
3. ✅ **用户举报功能**：用户可举报违规内容
4. ✅ **管理端举报处理**：管理员审核举报内容
5. ✅ **自动封禁机制**：3人举报自动隐藏，5人举报永久封禁

---

## 📁 文件结构

### 数据库表（共享）

```
botc-admin/uniCloud-aliyun/database/
├── botc-sensitive-words.schema.json   # 敏感词表
└── botc-reports.schema.json          # 举报表
```

### 管理端文件

```
botc-admin/
├── pages/
│   └── content/
│       ├── sensitive-words.vue        # 敏感词管理页面
│       └── reports.vue                # 举报管理页面
└── pages.json                         # 已注册路由
```

### 用户端文件

```
botc-miniprogram/
├── uniCloud-aliyun/cloudfunctions/
│   ├── content-filter/                # 内容过滤云函数
│   │   ├── index.js
│   │   └── package.json
│   ├── post-report/                   # 举报云函数
│   │   ├── index.js
│   │   └── package.json
│   └── post-create/index.js           # 已集成内容过滤
└── pages/
    └── community/
        └── detail/detail.vue          # 帖子详情页（含举报按钮）
```

---

## 🚀 部署步骤

### 第一步：创建数据库表

1. **打开 HBuilderX**
2. **右键 `botc-admin/uniCloud-aliyun/database/` 目录**
3. **选择"上传所有DB Schema及扩展校验函数"**

**创建的表**：
- `botc-sensitive-words`（敏感词表）
- `botc-reports`（举报表）

---

### 第二步：上传云函数（用户端）

**在 `botc-miniprogram` 项目中**：

1. 右键 `content-filter` → **上传部署**
2. 右键 `post-report` → **上传部署**
3. 右键 `post-create` → **上传并运行**（更新）

**验证云函数**：
- 在 uniCloud web控制台查看云函数是否上传成功
- 测试运行 `content-filter` 云函数

---

### 第三步：添加初始敏感词

1. **打开管理端小程序**
2. **进入"敏感词管理"页面**
   - 路径：`pages/content/sensitive-words`
3. **点击"添加敏感词"**

**推荐添加的敏感词**：

| 敏感词 | 类型 | 替换词 |
|--------|------|--------|
| 微信 | 联系方式 | *** |
| QQ | 联系方式 | *** |
| 电话 | 联系方式 | *** |
| 加我 | 联系方式 | *** |
| 广告 | 广告词 | *** |
| 代购 | 广告词 | *** |

---

### 第四步：测试内容过滤

1. **打开用户端小程序**
2. **进入社区发帖页面**
3. **输入包含敏感词的内容**，例如：
   ```
   这个剧本太好了！加我微信xxx
   ```
4. **点击发布**
5. **预期结果**：提示"请勿发布微信等联系方式"

---

### 第五步：测试举报功能

1. **打开任意帖子详情页**
2. **点击底部"举报"按钮**
3. **选择举报原因**（如：垃圾广告）
4. **提交举报**
5. **预期结果**：提示"举报成功，我们会尽快处理"

---

### 第六步：管理端处理举报

1. **打开管理端小程序**
2. **进入"举报管理"页面**
   - 路径：`pages/content/reports`
3. **查看待处理的举报**
4. **点击操作按钮**：
   - **违规-删除**：删除该帖子
   - **正常-驳回**：驳回举报
   - **忽略**：标记为已忽略

---

## 📊 数据结构

### 敏感词表（botc-sensitive-words）

```json
{
  "_id": "xxx",
  "word": "微信",
  "type": 3,                    // 1=违禁词 2=广告词 3=联系方式 4=其他
  "replacement": "***",         // 替换词（可选）
  "enabled": true,              // 是否启用
  "created_at": 1234567890
}
```

### 举报表（botc-reports）

```json
{
  "_id": "xxx",
  "target_id": "post_id",       // 被举报对象ID
  "target_type": "post",        // post=帖子 user=用户
  "report_type": "spam",        // 举报原因
  "report_reason": "详细原因",   // 可选
  "reporter_id": "user_id",     // 举报人
  "status": 0,                  // 0=待处理 1=违规 2=正常 3=忽略
  "created_at": 1234567890
}
```

---

## 🛡️ 审核流程

### 发帖流程

```
用户输入内容
    ↓
本地检查（前端）
    ↓
调用 content-filter 云函数
    ↓
检查敏感词库
    ↓
检查联系方式（手机/微信/QQ）
    ↓
检查重复内容
    ↓
✅ 通过 → 发布成功
❌ 不通过 → 提示修改
```

### 举报流程

```
用户举报帖子
    ↓
创建举报记录（status=0）
    ↓
统计举报次数
    ↓
3人举报 → 自动隐藏（status=0）
5人举报 → 永久封禁（status=-1）
    ↓
管理员审核
    ↓
✅ 违规 → 删除帖子
✅ 正常 → 驳回举报
✅ 忽略 → 标记忽略
```

---

## 🔧 自定义配置

### 修改自动封禁阈值

编辑 `botc-miniprogram/uniCloud-aliyun/cloudfunctions/post-report/index.js`：

```javascript
// 3人举报自动隐藏
if (reportCount.total >= 3 && target_type === 'post') {
  // 改为 5 人举报
  if (reportCount.total >= 5 && target_type === 'post') {
    // ...
  }
}
```

### 添加新的敏感词类型

编辑 `botc-admin/uniCloud-aliyun/database/botc-sensitive-words.schema.json`：

```json
{
  "value": 5,
  "text": "政治敏感"
}
```

---

## ✅ 功能验证清单

- [ ] 数据库表已创建
- [ ] 云函数已上传
- [ ] 敏感词管理页面可访问
- [ ] 可添加/删除敏感词
- [ ] 发帖时会检查敏感词
- [ ] 包含敏感词的帖子被拦截
- [ ] 用户可以举报帖子
- [ ] 管理端可查看举报列表
- [ ] 管理员可处理举报
- [ ] 3人举报自动隐藏
- [ ] 5人举报永久封禁

---

## 📱 管理端入口

在管理端添加菜单入口（可选）：

### 方式1：左侧菜单

编辑 `botc-admin` 的菜单配置文件，添加：

```json
{
  "text": "内容管理",
  "children": [
    {
      "text": "敏感词管理",
      "url": "/pages/content/sensitive-words"
    },
    {
      "text": "举报管理",
      "url": "/pages/content/reports"
    }
  ]
}
```

### 方式2：直接访问

- 敏感词管理：`pages/content/sensitive-words`
- 举报管理：`pages/content/reports`

---

## 💡 使用建议

### 初期（用户量 < 100）

- ✅ 添加基础敏感词（10-20个）
- ✅ 依靠举报功能
- ✅ 人工审核举报

### 中期（用户量 100-1000）

- ✅ 扩充敏感词库（50-100个）
- ✅ 优化自动封禁阈值
- ✅ 定期清理举报记录

### 后期（用户量 > 1000）

- ✅ 考虑接入 uniCloud 内容安全服务
- ✅ 实现用户信用体系
- ✅ 自动化审核 + 人工复核

---

## 📞 常见问题

### Q1：敏感词不生效？

**A**：检查以下几点：
1. 敏感词的 `enabled` 字段是否为 `true`
2. `content-filter` 云函数是否上传成功
3. `post-create` 云函数是否调用了 `content-filter`

### Q2：举报后没有自动隐藏？

**A**：检查：
1. 举报次数是否达到阈值（默认3次）
2. `post-report` 云函数是否正确执行
3. 帖子的 `status` 字段是否更新

### Q3：管理端页面打不开？

**A**：检查：
1. `pages.json` 是否注册了路由
2. 页面路径是否正确
3. 页面文件是否存在

---

## 🎉 部署完成

恭喜！您已成功部署内容审核系统！

**下一步**：
1. 添加更多敏感词
2. 测试举报功能
3. 培训管理员使用举报处理页面

**需要帮助**？请查看代码注释或联系开发者。

