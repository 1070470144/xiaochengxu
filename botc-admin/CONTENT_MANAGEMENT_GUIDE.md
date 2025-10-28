# 📝 内容管理系统 - 管理端

## ✅ 已完成功能

### 1. 敏感词管理
### 2. 举报管理

---

## 🎯 一、敏感词管理

### 功能概述
管理系统敏感词库，用于过滤和审核用户发布的内容。

### 数据表：`botc-sensitive-words`

#### 字段说明
| 字段 | 类型 | 说明 |
|------|------|------|
| word | string | 敏感词 |
| type | string | 类型（politics/violence/porn/abuse/illegal/other） |
| level | int | 级别（1-轻度提示，2-中度审核，3-重度拦截） |
| status | string | 状态（enabled/disabled） |
| replacement | string | 替换词（可选） |
| remark | string | 备注说明 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

### 云函数：`sensitive-words-admin`

#### 功能列表
- ✅ `list` - 获取敏感词列表（支持搜索、筛选、分页）
- ✅ `add` - 添加敏感词
- ✅ `edit` - 编辑敏感词
- ✅ `delete` - 删除敏感词
- ✅ `import` - 批量导入敏感词
- ✅ `toggleStatus` - 启用/禁用敏感词

#### 调用示例
```javascript
// 获取列表
await uniCloud.callFunction({
  name: 'sensitive-words-admin',
  data: {
    action: 'list',
    pageNo: 1,
    pageSize: 20,
    keyword: '搜索关键词', // 可选
    type: 'politics', // 可选
    status: 'enabled' // 可选
  }
})

// 添加敏感词
await uniCloud.callFunction({
  name: 'sensitive-words-admin',
  data: {
    action: 'add',
    wordData: {
      word: '敏感词',
      type: 'other',
      level: 2,
      status: 'enabled',
      replacement: '***',
      remark: '备注'
    }
  }
})

// 批量导入
await uniCloud.callFunction({
  name: 'sensitive-words-admin',
  data: {
    action: 'import',
    words: [
      { word: '敏感词1', type: 'politics', level: 3 },
      { word: '敏感词2', type: 'violence', level: 2 }
    ]
  }
})
```

### 管理页面：`pages/botc/content/sensitive-words.vue`

#### 页面功能
- ✅ 列表展示（表格）
- ✅ 搜索功能（按敏感词搜索）
- ✅ 筛选功能（类型、状态）
- ✅ 添加敏感词
- ✅ 编辑敏感词
- ✅ 删除敏感词
- ✅ 启用/禁用
- ✅ 批量导入（支持CSV格式）
- ✅ 分页

#### 批量导入格式
```
格式1：每行一个敏感词
敏感词1
敏感词2
敏感词3

格式2：CSV格式（敏感词,类型,级别,替换词,备注）
敏感词1,politics,3,***,政治敏感
敏感词2,violence,2,**,暴力血腥
```

---

## 🚨 二、举报管理

### 功能概述
处理用户举报的不当内容，包括帖子、评论、用户等。

### 数据表：`botc-reports`

#### 字段说明
| 字段 | 类型 | 说明 |
|------|------|------|
| reporter_id | string | 举报人ID |
| reporter_nickname | string | 举报人昵称 |
| content_type | string | 内容类型（post/comment/user/script/review） |
| content_id | string | 被举报内容ID |
| content_title | string | 内容标题/摘要 |
| reported_user_id | string | 被举报用户ID |
| reported_user_nickname | string | 被举报用户昵称 |
| reason | string | 举报原因（spam/porn/violence/politics/illegal/abuse/false/other） |
| description | string | 详细描述 |
| images | array | 举报截图 |
| status | string | 状态（pending/processing/resolved/rejected） |
| handle_result | string | 处理结果（delete/warn/ban/ignore） |
| handle_remark | string | 处理备注 |
| handler_id | string | 处理人ID |
| handled_at | timestamp | 处理时间 |
| created_at | timestamp | 举报时间 |
| updated_at | timestamp | 更新时间 |

### 云函数：`reports-admin`

#### 功能列表
- ✅ `list` - 获取举报列表（支持筛选、分页）
- ✅ `handle` - 处理举报（删除内容/警告用户/封禁用户/忽略举报）
- ✅ `reject` - 驳回举报
- ✅ `stats` - 获取统计数据

#### 调用示例
```javascript
// 获取列表
await uniCloud.callFunction({
  name: 'reports-admin',
  data: {
    action: 'list',
    pageNo: 1,
    pageSize: 20,
    status: 'pending', // 可选
    contentType: 'post', // 可选
    reason: 'spam' // 可选
  }
})

// 处理举报
await uniCloud.callFunction({
  name: 'reports-admin',
  data: {
    action: 'handle',
    reportId: 'xxx',
    handleResult: 'delete', // delete/warn/ban/ignore
    handleRemark: '处理说明'
  }
})

// 驳回举报
await uniCloud.callFunction({
  name: 'reports-admin',
  data: {
    action: 'reject',
    reportId: 'xxx',
    rejectRemark: '驳回原因'
  }
})
```

### 管理页面：`pages/botc/content/reports.vue`

#### 页面功能
- ✅ 列表展示（表格）
- ✅ 统计数据（待处理/处理中/已处理/已驳回）
- ✅ 筛选功能（状态、内容类型、举报原因）
- ✅ 处理举报（删除内容/警告/封禁/忽略）
- ✅ 驳回举报
- ✅ 查看详情（包括举报截图）
- ✅ 分页

#### 处理流程
```
举报提交（用户端）
  ↓
待处理（pending）
  ↓
管理员处理
  ↓
┌──────────────┬────────────┐
│  处理举报    │  驳回举报  │
│  ↓           │  ↓         │
│ 选择处理结果 │ 填写原因   │
│ ├─ 删除内容  │ ↓          │
│ ├─ 警告用户  │ rejected   │
│ ├─ 封禁用户  │            │
│ └─ 忽略举报  │            │
│  ↓           │            │
│ resolved     │            │
└──────────────┴────────────┘
```

---

## 📁 文件结构

```
botc-admin/
├── uniCloud-aliyun/
│   ├── database/
│   │   ├── botc-sensitive-words.schema.json  ✅ 敏感词表
│   │   └── botc-reports.schema.json  ✅ 举报表
│   └── cloudfunctions/
│       ├── sensitive-words-admin/  ✅ 敏感词管理
│       │   ├── index.js
│       │   └── package.json
│       └── reports-admin/  ✅ 举报管理
│           ├── index.js
│           └── package.json
└── pages/
    └── botc/
        └── content/
            ├── sensitive-words.vue  ✅ 敏感词管理页面
            └── reports.vue  ✅ 举报管理页面
```

---

## 🚀 部署步骤

### 1. 上传数据库Schema
```bash
右键以下文件 → 上传DB Schema：
- botc-sensitive-words.schema.json
- botc-reports.schema.json
```

### 2. 上传云函数
```bash
右键以下文件夹 → 上传部署：
- sensitive-words-admin
- reports-admin
```

### 3. 添加菜单（通过菜单管理）
```
敏感词管理：
- 菜单ID：botc-sensitive-words
- 菜单名称：敏感词管理
- 父级菜单：血染钟楼管理
- 菜单路径：/pages/botc/content/sensitive-words
- 排序：106

举报管理：
- 菜单ID：botc-reports
- 菜单名称：举报管理
- 父级菜单：血染钟楼管理
- 菜单路径：/pages/botc/content/reports
- 排序：107
```

### 4. 刷新管理后台
```bash
按 Ctrl + F5 强制刷新
```

---

## 🎯 使用场景

### 敏感词管理

#### 场景1：添加敏感词
```
1. 进入"敏感词管理"
2. 点击"添加敏感词"
3. 填写信息：
   - 敏感词：xxx
   - 类型：政治敏感
   - 级别：3（重度拦截）
   - 替换词：***
   - 备注：说明原因
4. 点击"确定"
```

#### 场景2：批量导入
```
1. 点击"批量导入"
2. 粘贴敏感词列表：
   敏感词1
   敏感词2
   敏感词3
3. 点击"导入"
4. 系统自动过滤重复，显示导入结果
```

#### 场景3：启用/禁用
```
1. 找到需要禁用的敏感词
2. 点击"禁用"按钮
3. 该敏感词不再参与过滤
4. 需要时可重新启用
```

### 举报管理

#### 场景1：处理举报
```
1. 进入"举报管理"
2. 查看待处理列表
3. 点击"处理"按钮
4. 选择处理结果：
   - 删除内容：违规内容将被删除
   - 警告用户：发送警告通知
   - 封禁用户：禁用用户账号
   - 忽略举报：举报无效
5. 填写处理备注
6. 点击"确定"
```

#### 场景2：驳回举报
```
1. 查看举报详情
2. 判断举报不成立
3. 点击"驳回"按钮
4. 填写驳回原因
5. 点击"确定"
```

---

## 📊 数据统计

### 举报统计
- **待处理**：需要立即处理的举报
- **处理中**：正在处理的举报
- **已处理**：已完成处理
- **已驳回**：举报不成立

### 敏感词统计
- **启用数量**：正在使用的敏感词
- **禁用数量**：已禁用的敏感词
- **按类型统计**：各类型敏感词数量

---

## 💡 最佳实践

### 敏感词管理

1. **分级管理**
   - 轻度（1级）：提示用户，但允许发布
   - 中度（2级）：进入审核队列，人工审核
   - 重度（3级）：直接拦截，禁止发布

2. **定期更新**
   - 及时添加新发现的敏感词
   - 定期审查现有敏感词的有效性
   - 根据实际情况调整级别

3. **分类明确**
   - 按类型分类管理
   - 便于针对性处理
   - 提高审核效率

### 举报管理

1. **及时处理**
   - 优先处理待处理举报
   - 24小时内响应
   - 重要举报标记优先级

2. **公正处理**
   - 仔细查看举报详情
   - 查看举报截图证据
   - 核实被举报内容
   - 做出公正判断

3. **记录完整**
   - 填写详细的处理备注
   - 记录处理依据
   - 便于后续追溯

---

## ⚠️ 注意事项

1. **敏感词库安全**
   - 定期备份敏感词库
   - 控制管理权限
   - 避免敏感词泄露

2. **举报处理慎重**
   - 删除内容操作不可逆
   - 封禁用户需谨慎
   - 保留处理记录

3. **隐私保护**
   - 妥善保管举报信息
   - 不泄露举报人身份
   - 遵守相关法律法规

---

**✅ 内容管理系统已全部完成！** 📝✨

**下一步**：
1. 上传数据库Schema
2. 上传云函数
3. 通过"菜单管理"添加菜单
4. 刷新管理后台测试功能

