# 📘 管理端 API 文档

**版本**: v1.0.0  
**更新日期**: 2025-11-05  
**架构**: uniCloud 云对象

---

## 目录

1. [Admin 云对象](#admin-云对象) - 核心管理（15个方法）
2. [AdminScript 云对象](#adminscript-云对象) - 剧本管理（10个方法）
3. [AdminWiki 云对象](#adminwiki-云对象) - 百科管理（9个方法）
4. [通用规范](#通用规范)
5. [错误码说明](#错误码说明)

---

## Admin 云对象

### 导入方式

```javascript
const adminObj = uniCloud.importObject('admin', { customUI: true });
```

---

### 1. 认证管理

#### 1.1 获取认证列表

**方法**: `getCertifications()`

**参数**:
```javascript
{
  pageNo: Number,    // 页码，默认 1
  pageSize: Number,  // 每页数量，默认 20
  status: String     // 状态筛选：pending/approved/rejected，可选
}
```

**返回**:
```javascript
{
  code: 0,
  message: '获取成功',
  data: {
    list: [
      {
        _id: 'cert_id',
        user_id: 'user_id',
        level: 'junior',              // 认证等级
        real_name: '张三',
        id_card: '123***456',
        phone: '138****1234',
        experience: '5年说书经验...',
        status: 'pending',            // pending/approved/rejected
        reject_reason: '',
        created_at: 1699200000000,
        approved_at: null,
        updated_at: 1699200000000,
        user_info: {
          nickname: '用户昵称',
          avatar: 'https://...'
        }
      }
    ],
    total: 100,
    pageNo: 1,
    pageSize: 20
  }
}
```

**示例**:
```javascript
const res = await adminObj.getCertifications({
  pageNo: 1,
  pageSize: 20,
  status: 'pending'
});
```

---

#### 1.2 审核通过认证

**方法**: `approveCertification()`

**参数**:
```javascript
certId: String  // 认证ID（必填）
```

**返回**:
```javascript
{
  code: 0,
  message: '审核通过',
  data: null
}
```

**功能**:
- 更新认证状态为 `approved`
- 更新用户认证信息（`storyteller_level`, `storyteller_certified`, `storyteller_stats`）
- 发送系统通知给用户

**示例**:
```javascript
await adminObj.approveCertification('cert_id_123');
```

---

#### 1.3 拒绝认证

**方法**: `rejectCertification()`

**参数**:
```javascript
certId: String,        // 认证ID（必填）
rejectReason: String   // 拒绝原因（必填）
```

**返回**:
```javascript
{
  code: 0,
  message: '已拒绝',
  data: null
}
```

**功能**:
- 更新认证状态为 `rejected`
- 记录拒绝原因
- 发送系统通知给用户

**示例**:
```javascript
await adminObj.rejectCertification('cert_id_123', '资料不完整');
```

---

### 2. 举报管理

#### 2.1 获取举报列表

**方法**: `getReports()`

**参数**:
```javascript
{
  pageNo: Number,      // 页码，默认 1
  pageSize: Number,    // 每页数量，默认 20
  status: String,      // 状态筛选：pending/processing/resolved/rejected，可选
  contentType: String, // 内容类型筛选：post/comment/script/review，可选
  reason: String       // 举报原因筛选，可选
}
```

**返回**:
```javascript
{
  code: 0,
  message: '获取成功',
  data: {
    list: [
      {
        _id: 'report_id',
        content_type: 'post',         // post/comment/script/review
        content_id: 'content_id',
        reason: 'spam',               // 举报原因
        description: '详细描述...',
        status: 'pending',            // pending/processing/resolved/rejected
        handle_result: null,          // delete/warn/ban/ignore
        handle_remark: '',
        created_at: 1699200000000,
        handled_at: null,
        reporter_info: {
          nickname: '举报人昵称',
          avatar: 'https://...'
        },
        reported_info: {
          nickname: '被举报人昵称',
          avatar: 'https://...'
        }
      }
    ],
    total: 50,
    pageNo: 1,
    pageSize: 20
  }
}
```

**示例**:
```javascript
const res = await adminObj.getReports({
  pageNo: 1,
  pageSize: 20,
  status: 'pending',
  contentType: 'post'
});
```

---

#### 2.2 处理举报

**方法**: `handleReport()`

**参数**:
```javascript
reportId: String,      // 举报ID（必填）
handleResult: String,  // 处理结果：delete/warn/ban/ignore（必填）
handleRemark: String   // 处理备注（可选）
```

**返回**:
```javascript
{
  code: 0,
  message: '处理成功',
  data: null
}
```

**处理结果说明**:
- `delete`: 删除被举报内容，发送违规通知
- `warn`: 警告用户，发送警告消息，累计警告次数
- `ban`: 封禁用户，发送封禁通知，设置用户状态为禁用
- `ignore`: 忽略举报，不执行其他操作

**示例**:
```javascript
// 删除内容
await adminObj.handleReport('report_id_123', 'delete', '内容违规');

// 警告用户
await adminObj.handleReport('report_id_123', 'warn', '不当言论');

// 封禁用户
await adminObj.handleReport('report_id_123', 'ban', '多次违规');
```

---

#### 2.3 驳回举报

**方法**: `rejectReport()`

**参数**:
```javascript
reportId: String,      // 举报ID（必填）
rejectRemark: String   // 驳回备注（可选）
```

**返回**:
```javascript
{
  code: 0,
  message: '已驳回举报',
  data: null
}
```

**示例**:
```javascript
await adminObj.rejectReport('report_id_123', '举报不成立');
```

---

#### 2.4 获取举报统计

**方法**: `getReportStats()`

**参数**: 无

**返回**:
```javascript
{
  code: 0,
  message: '操作成功',
  data: {
    pending: 10,      // 待处理
    processing: 5,    // 处理中
    resolved: 100,    // 已处理
    rejected: 20,     // 已驳回
    total: 135        // 总数
  }
}
```

**示例**:
```javascript
const res = await adminObj.getReportStats();
```

---

### 3. 系统消息

#### 3.1 发送系统消息

**方法**: `sendSystemMessage()`

**参数**:
```javascript
{
  userId: String,      // 用户ID（必填）
  type: String,        // 消息类型：system/warning/notification，默认 system
  title: String,       // 标题（必填）
  content: String,     // 内容（必填）
  relatedType: String, // 关联类型（可选）
  relatedId: String    // 关联ID（可选）
}
```

**返回**:
```javascript
{
  code: 0,
  message: '发送成功',
  data: {
    messageId: 'message_id'
  }
}
```

**示例**:
```javascript
await adminObj.sendSystemMessage({
  userId: 'user_id_123',
  type: 'system',
  title: '认证通过通知',
  content: '恭喜您的说书人认证已通过审核！',
  relatedType: 'certification',
  relatedId: 'cert_id_123'
});
```

---

### 4. 敏感词管理

#### 4.1 获取敏感词列表

**方法**: `getSensitiveWords()`

**参数**:
```javascript
{
  pageNo: Number,    // 页码，默认 1
  pageSize: Number,  // 每页数量，默认 20
  keyword: String,   // 关键词搜索，可选
  type: String,      // 类型筛选，可选
  status: String     // 状态筛选：enabled/disabled，可选
}
```

**返回**:
```javascript
{
  code: 0,
  message: '获取成功',
  data: {
    list: [
      {
        _id: 'word_id',
        word: '敏感词',
        type: 'illegal',           // 类型
        level: 3,                  // 等级：1-3
        status: 'enabled',         // enabled/disabled
        replacement: '***',        // 替换字符
        remark: '备注',
        created_at: 1699200000000,
        updated_at: 1699200000000
      }
    ],
    total: 200,
    pageNo: 1,
    pageSize: 20
  }
}
```

**示例**:
```javascript
const res = await adminObj.getSensitiveWords({
  pageNo: 1,
  pageSize: 20,
  keyword: '违禁',
  status: 'enabled'
});
```

---

#### 4.2 添加敏感词

**方法**: `addSensitiveWord()`

**参数**:
```javascript
{
  word: String,        // 敏感词（必填）
  type: String,        // 类型：illegal/political/adult/other，默认 other
  level: Number,       // 等级：1-3，默认 2
  status: String,      // 状态：enabled/disabled，默认 enabled
  replacement: String, // 替换字符，默认空
  remark: String       // 备注，默认空
}
```

**返回**:
```javascript
{
  code: 0,
  message: '添加成功',
  data: null
}
```

**示例**:
```javascript
await adminObj.addSensitiveWord({
  word: '违禁词',
  type: 'illegal',
  level: 3,
  status: 'enabled',
  replacement: '***',
  remark: '严重违规'
});
```

---

#### 4.3 编辑敏感词

**方法**: `editSensitiveWord()`

**参数**:
```javascript
wordId: String,  // 敏感词ID（必填）
wordData: {      // 更新数据（必填）
  word: String,
  type: String,
  level: Number,
  status: String,
  replacement: String,
  remark: String
}
```

**返回**:
```javascript
{
  code: 0,
  message: '更新成功',
  data: null
}
```

**示例**:
```javascript
await adminObj.editSensitiveWord('word_id_123', {
  level: 2,
  remark: '等级调整'
});
```

---

#### 4.4 删除敏感词

**方法**: `deleteSensitiveWord()`

**参数**:
```javascript
wordId: String  // 敏感词ID（必填）
```

**返回**:
```javascript
{
  code: 0,
  message: '删除成功',
  data: null
}
```

**示例**:
```javascript
await adminObj.deleteSensitiveWord('word_id_123');
```

---

#### 4.5 批量导入敏感词

**方法**: `importSensitiveWords()`

**参数**:
```javascript
[
  {
    word: String,        // 敏感词（必填）
    type: String,        // 类型，默认 other
    level: Number,       // 等级，默认 2
    replacement: String, // 替换字符，默认空
    remark: String       // 备注，默认空
  }
]
```

**返回**:
```javascript
{
  code: 0,
  message: '导入完成：成功10个，失败2个',
  data: {
    successCount: 10,
    failCount: 2
  }
}
```

**示例**:
```javascript
await adminObj.importSensitiveWords([
  { word: '违禁词1', type: 'illegal', level: 3 },
  { word: '违禁词2', type: 'illegal', level: 3 }
]);
```

---

#### 4.6 启用/禁用敏感词

**方法**: `toggleSensitiveWordStatus()`

**参数**:
```javascript
wordId: String,  // 敏感词ID（必填）
status: String   // 状态：enabled/disabled（必填）
```

**返回**:
```javascript
{
  code: 0,
  message: '已启用', // 或 '已禁用'
  data: null
}
```

**示例**:
```javascript
await adminObj.toggleSensitiveWordStatus('word_id_123', 'disabled');
```

---

## AdminScript 云对象

### 导入方式

```javascript
const scriptObj = uniCloud.importObject('admin-script', { customUI: true });
```

---

### 1. 批量导入剧本

**方法**: `batchImport()`

**参数**:
```javascript
[
  {
    title: String,       // 剧本标题（必填）
    author: String,      // 作者（可选）
    description: String, // 描述（可选）
    json_data: Object,   // 剧本JSON数据（必填）
    difficulty: Number,  // 难度（可选）
    player_count: String,// 玩家人数（可选）
    tags: Array,         // 标签（可选）
    creator_id: String,  // 创建者ID（可选）
    ...                  // 其他字段
  }
]
```

**返回**:
```javascript
{
  code: 0,
  message: '批量导入完成',
  data: {
    success: 8,    // 成功数量
    failed: 2,     // 失败数量
    details: [
      {
        success: true,
        title: '剧本名称',
        id: 'script_id',
        hasPreview: true
      },
      {
        success: false,
        title: '剧本名称2',
        error: '错误信息'
      }
    ]
  }
}
```

**功能**:
- 自动生成SVG预览图
- 设置 `created_at`, `updated_at`
- 返回详细的成功/失败统计

**示例**:
```javascript
const res = await scriptObj.batchImport([
  {
    title: '测试剧本',
    author: '测试作者',
    json_data: [...],  // 剧本JSON数据
    creator_id: 'user_id_123'
  }
]);
```

---

### 2. 生成预览图

**方法**: `generatePreview()`

**参数**:
```javascript
{
  title: String,       // 剧本标题（可选）
  author: String,      // 作者（可选）
  jsonData: Object     // 剧本JSON数据（必填）
}
```

**返回**:
```javascript
{
  code: 0,
  message: 'success',
  data: {
    previewImage: 'data:image/svg+xml;base64,...'  // base64编码的SVG
  }
}
```

**示例**:
```javascript
const res = await scriptObj.generatePreview({
  title: '测试剧本',
  author: '测试作者',
  jsonData: [...]  // 剧本JSON数据
});
```

---

### 3. 剧本审核

#### 3.1 获取待审核剧本列表

**方法**: `getAuditList()`

**参数**:
```javascript
{
  pageNo: Number,    // 页码，默认 1
  pageSize: Number,  // 每页数量，默认 20
  status: String     // 状态筛选：pending/approved/rejected，默认 pending
}
```

**返回**:
```javascript
{
  code: 0,
  message: '获取成功',
  data: {
    list: [
      {
        _id: 'script_id',
        title: '剧本标题',
        author: '作者',
        description: '描述',
        difficulty: 3,
        tags: ['新手友好'],
        player_count: '5-7人',
        preview_image: 'data:image/svg+xml;base64,...',
        audit_status: 'pending',  // pending/approved/rejected
        audit_reason: '',
        created_at: 1699200000000,
        updated_at: 1699200000000,
        creator_info: {
          nickname: '创建者昵称',
          avatar: 'https://...'
        }
      }
    ],
    total: 30,
    pageNo: 1,
    pageSize: 20
  }
}
```

**示例**:
```javascript
const res = await scriptObj.getAuditList({
  pageNo: 1,
  pageSize: 20,
  status: 'pending'
});
```

---

#### 3.2 审核通过剧本

**方法**: `approveScript()`

**参数**:
```javascript
scriptId: String  // 剧本ID（必填）
```

**返回**:
```javascript
{
  code: 0,
  message: '审核通过',
  data: null
}
```

**功能**:
- 更新 `audit_status` 为 `approved`
- 更新 `status` 为 `published`（自动发布）
- 设置 `audited_at`

**示例**:
```javascript
await scriptObj.approveScript('script_id_123');
```

---

#### 3.3 拒绝剧本

**方法**: `rejectScript()`

**参数**:
```javascript
scriptId: String,  // 剧本ID（必填）
reason: String     // 拒绝原因（必填）
```

**返回**:
```javascript
{
  code: 0,
  message: '已拒绝',
  data: null
}
```

**功能**:
- 更新 `audit_status` 为 `rejected`
- 记录 `audit_reason`
- 更新 `status` 为 `draft`（退回草稿）
- 设置 `audited_at`

**示例**:
```javascript
await scriptObj.rejectScript('script_id_123', '内容不完整');
```

---

### 4. 剧本管理

#### 4.1 获取剧本列表

**方法**: `getScripts()`

**参数**:
```javascript
{
  pageNo: Number,    // 页码，默认 1
  pageSize: Number,  // 每页数量，默认 20
  status: String,    // 状态筛选：published/draft，可选
  keyword: String    // 关键词搜索，可选
}
```

**返回**:
```javascript
{
  code: 0,
  message: '获取成功',
  data: {
    list: [
      {
        _id: 'script_id',
        title: '剧本标题',
        author: '作者',
        description: '描述',
        difficulty: 3,
        tags: ['新手友好'],
        player_count: '5-7人',
        preview_image: 'data:image/svg+xml;base64,...',
        status: 'published',       // published/draft
        audit_status: 'approved',  // pending/approved/rejected
        view_count: 100,
        favorite_count: 20,
        created_at: 1699200000000,
        updated_at: 1699200000000,
        creator_info: {
          nickname: '创建者昵称',
          avatar: 'https://...'
        }
      }
    ],
    total: 200,
    pageNo: 1,
    pageSize: 20
  }
}
```

**示例**:
```javascript
const res = await scriptObj.getScripts({
  pageNo: 1,
  pageSize: 20,
  status: 'published',
  keyword: '测试'
});
```

---

#### 4.2 上架剧本

**方法**: `publishScript()`

**参数**:
```javascript
scriptId: String  // 剧本ID（必填）
```

**返回**:
```javascript
{
  code: 0,
  message: '已上架',
  data: null
}
```

**示例**:
```javascript
await scriptObj.publishScript('script_id_123');
```

---

#### 4.3 下架剧本

**方法**: `unpublishScript()`

**参数**:
```javascript
scriptId: String  // 剧本ID（必填）
```

**返回**:
```javascript
{
  code: 0,
  message: '已下架',
  data: null
}
```

**示例**:
```javascript
await scriptObj.unpublishScript('script_id_123');
```

---

#### 4.4 删除剧本

**方法**: `deleteScript()`

**参数**:
```javascript
scriptId: String  // 剧本ID（必填）
```

**返回**:
```javascript
{
  code: 0,
  message: '已删除',
  data: null
}
```

**功能**: 软删除，设置 `deleted_at` 字段

**示例**:
```javascript
await scriptObj.deleteScript('script_id_123');
```

---

#### 4.5 获取剧本统计

**方法**: `getScriptStats()`

**参数**: 无

**返回**:
```javascript
{
  code: 0,
  message: '操作成功',
  data: {
    total: 200,      // 总数（未删除）
    published: 150,  // 已发布
    draft: 50,       // 草稿
    pending: 10,     // 待审核
    approved: 180,   // 已审核通过
    rejected: 10     // 已拒绝
  }
}
```

**示例**:
```javascript
const res = await scriptObj.getScriptStats();
```

---

## AdminWiki 云对象

### 导入方式

```javascript
const wikiObj = uniCloud.importObject('admin-wiki', { customUI: true });
```

---

### 1. 批量同步百科

**方法**: `syncAll()`

**参数**:
```javascript
{
  sync_type: String,  // 同步类型：all/roles/mechanics，默认 all
  batch_size: Number  // 批次大小，默认 5
}
```

**返回**:
```javascript
{
  code: 0,
  message: '同步完成！成功: 45, 失败: 3',
  data: {
    sync_type: 'all',
    start_time: '2025-11-05T10:00:00.000Z',
    end_time: '2025-11-05T10:10:00.000Z',
    duration: 600,         // 耗时（秒）
    total_count: 48,
    success_count: 45,
    failed_count: 3,
    error_list: [
      {
        url: 'https://...',
        error: '错误信息'
      }
    ],
    status: 'partial_success'  // running/success/partial_success
  }
}
```

**功能**:
- 分批抓取钟楼百科页面
- 解析标题、内容、角色详情、图标
- 自动创建/更新 `wiki_entries` 表
- 记录同步日志到 `wiki_sync_logs` 表

**示例**:
```javascript
const res = await wikiObj.syncAll({
  sync_type: 'roles',
  batch_size: 5
});
```

---

### 2. 单个同步百科

**方法**: `syncSingle()`

**参数**:
```javascript
url: String  // 百科URL（必填）
```

**返回**:
```javascript
{
  code: 0,
  message: '同步成功',
  data: {
    _id: 'entry_id'
  }
}
```

**示例**:
```javascript
const res = await wikiObj.syncSingle('https://clocktower-wiki.gstonegames.com/index.php?title=酒鬼');
```

---

### 3. 角色管理

#### 3.1 获取角色列表

**方法**: `getRoles()`

**参数**:
```javascript
{
  keyword: String,      // 搜索关键词，可选
  sync_status: String,  // 状态筛选：all/synced/unsynced/failed，默认 all
  page: Number,         // 页码，默认 1
  page_size: Number     // 每页数量，默认 20
}
```

**返回**:
```javascript
{
  code: 0,
  message: '查询成功',
  data: {
    list: [
      {
        _id: 'role_id',
        role_name: '酒鬼',
        role_url: 'https://...',
        is_synced: true,
        sync_status: 'success',  // pending/success/failed
        last_sync_time: 1699200000000,
        sync_error: null,
        created_at: 1699100000000,
        updated_at: 1699200000000
      }
    ],
    total: 80,
    page: 1,
    page_size: 20
  }
}
```

**示例**:
```javascript
const res = await wikiObj.getRoles({
  keyword: '酒鬼',
  sync_status: 'unsynced',
  page: 1,
  page_size: 20
});
```

---

#### 3.2 添加角色

**方法**: `addRoles()`

**参数**:
```javascript
[
  '酒鬼',
  '洗衣妇',
  '图书管理员'
]
```

**返回**:
```javascript
{
  code: 0,
  message: '成功添加 3 个角色',
  data: {
    success: ['酒鬼', '洗衣妇', '图书管理员'],
    failed: [],
    duplicate: []
  }
}
```

**功能**:
- 自动生成URL
- 检测重复

**示例**:
```javascript
const res = await wikiObj.addRoles(['酒鬼', '洗衣妇']);
```

---

#### 3.3 删除角色

**方法**: `deleteRoles()`

**参数**:
```javascript
[
  'role_id_1',
  'role_id_2'
]
```

**返回**:
```javascript
{
  code: 0,
  message: '成功删除 2 个角色',
  data: {
    success: ['role_id_1', 'role_id_2'],
    failed: []
  }
}
```

**示例**:
```javascript
const res = await wikiObj.deleteRoles(['role_id_1', 'role_id_2']);
```

---

#### 3.4 同步角色

**方法**: `syncRoles()`

**参数**:
```javascript
[
  'role_id_1',
  'role_id_2'
]
```

**返回**:
```javascript
{
  code: 0,
  message: '同步完成：成功 2 个，失败 0 个，耗时 15 秒',
  data: {
    total_count: 2,
    success_count: 2,
    failed_count: 0,
    duration: 15,
    success: [
      {
        role_id: 'role_id_1',
        role_name: '酒鬼'
      },
      {
        role_id: 'role_id_2',
        role_name: '洗衣妇'
      }
    ],
    failed: []
  }
}
```

**功能**:
- 调用内部同步方法抓取页面
- 更新角色同步状态
- 记录同步日志到 `wiki_sync_logs` 表

**示例**:
```javascript
const res = await wikiObj.syncRoles(['role_id_1', 'role_id_2']);
```

---

### 4. 同步日志

#### 4.1 获取同步日志列表

**方法**: `getSyncLogs()`

**参数**:
```javascript
{
  page: Number,       // 页码，默认 1
  page_size: Number   // 每页数量，默认 20
}
```

**返回**:
```javascript
{
  code: 0,
  message: '查询成功',
  data: {
    list: [
      {
        _id: 'log_id',
        sync_type: 'roles',           // all/roles/mechanics
        start_time: '2025-11-05T10:00:00.000Z',
        end_time: '2025-11-05T10:10:00.000Z',
        duration: 600,
        total_count: 10,
        success_count: 8,
        failed_count: 2,
        status: 'partial_success',    // success/partial_success/failed
        created_at: 1699200000000
      }
    ],
    total: 50,
    page: 1,
    page_size: 20
  }
}
```

**示例**:
```javascript
const res = await wikiObj.getSyncLogs({
  page: 1,
  page_size: 20
});
```

---

#### 4.2 获取百科统计

**方法**: `getWikiStats()`

**参数**: 无

**返回**:
```javascript
{
  code: 0,
  message: '操作成功',
  data: {
    total_entries: 150,   // 总条目数
    total_roles: 80,      // 总角色数
    synced_roles: 70,     // 已同步角色数
    failed_roles: 5,      // 同步失败角色数
    pending_roles: 5      // 待同步角色数
  }
}
```

**示例**:
```javascript
const res = await wikiObj.getWikiStats();
```

---

## 通用规范

### 返回格式

所有云对象方法都遵循统一的返回格式：

**成功返回**:
```javascript
{
  code: 0,
  message: '操作成功',
  data: { ... }  // 返回数据，可以为 null
}
```

**错误返回**:
```javascript
{
  code: 400,  // 错误码
  message: '错误信息'
}
```

### 权限验证

所有云对象都在 `_before` hook 中进行统一权限验证：

```javascript
module.exports = {
  _before: async function() {
    // 检查管理员权限
    await checkAdminAuth(this.getClientInfo());
  },
  
  // 方法定义...
};
```

**验证逻辑**:
1. 检查是否有 `TOKEN` 或 `ADMIN_TOKEN`
2. （可选）查询用户表，检查 `role` 字段是否为 `admin`

### 调用方式

所有管理端云对象都使用 `uniCloud.importObject` 调用：

```javascript
// 导入云对象
const adminObj = uniCloud.importObject('admin', { customUI: true });

// 调用方法
const res = await adminObj.getCertifications({ pageNo: 1, pageSize: 20 });
```

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 400 | 参数错误 |
| 401 | 未登录 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0.0 | 2025-11-05 | 初始版本，34个方法 |

---

**🎉 管理端云对象 API 文档 - 3个云对象，34个方法，统一架构！**

