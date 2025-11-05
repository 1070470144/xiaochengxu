# 🎯 管理端云对象开发执行计划

## 📋 项目概述

**项目名称**: 管理端云对象化改造  
**开始时间**: 2025-11-04  
**预估工期**: 6-9 天  
**目标**: 将 9 个管理端云函数迁移到 3 个云对象

---

## 🎯 总体目标

### 从（当前）
- 9 个分散的云函数
- 功能分散，维护困难
- 无统一架构

### 到（目标）
- 3 个模块化云对象
- 30-40 个方法
- 统一架构模式
- 易于维护和扩展

---

## 📊 开发计划总览

### Phase 1: Admin 云对象（Day 1-4）
**优先级**: ⭐⭐⭐⭐⭐ 最高  
**工期**: 3-4 天  
**方法数**: 15-20 个  
**复杂度**: ⭐⭐⭐ 中等

### Phase 2: AdminScript 云对象（Day 5-6）
**优先级**: ⭐⭐⭐⭐ 高  
**工期**: 1-2 天  
**方法数**: 6-8 个  
**复杂度**: ⭐⭐⭐⭐ 中高

### Phase 3: AdminWiki 云对象（Day 7-9）
**优先级**: ⭐⭐⭐ 中  
**工期**: 2-3 天  
**方法数**: 8-10 个  
**复杂度**: ⭐⭐⭐⭐⭐ 最高

---

## 📅 Phase 1: Admin 云对象（核心管理）

### 🎯 目标
创建管理端核心云对象，包含认证、举报、消息、敏感词、用户管理功能。

---

### Day 1: 基础架构 + 认证管理

#### 上午（4小时）：基础架构搭建

**任务清单**:
- [ ] 创建 `admin` 云对象目录
  ```bash
  mkdir botc-admin/uniCloud-aliyun/cloudfunctions/admin
  ```

- [ ] 创建 `package.json`
  ```json
  {
    "name": "admin",
    "version": "1.0.0",
    "description": "管理端核心云对象",
    "main": "index.obj.js",
    "cloudfunction-config": {
      "memorySize": 512,
      "timeout": 60
    }
  }
  ```

- [ ] 创建 `index.obj.js` 基础结构
  ```javascript
  'use strict';
  
  // ==================== 工具函数 ====================
  
  function parseAdminId(context) { ... }
  function checkAdminAuth(adminId) { ... }
  function returnSuccess(data, message) { ... }
  function returnError(code, message, data) { ... }
  function logOperation(db, adminId, action, target, details) { ... }
  
  // ==================== 云对象主体 ====================
  
  module.exports = {
    _before() {
      this.db = uniCloud.database();
      this.dbCmd = this.db.command;
      this.adminId = parseAdminId(this.getClientInfo());
      checkAdminAuth(this.adminId);
    },
    
    // 方法实现...
  };
  ```

**交付物**:
- ✅ admin 云对象基础架构
- ✅ 工具函数完成
- ✅ _before 钩子完成

---

#### 下午（4小时）：认证管理（3个方法）

**任务清单**:
- [ ] `getCertifications(options)` - 获取认证列表
  ```javascript
  {
    status: 'pending/approved/rejected',
    certType: 'shop/storyteller',
    pageNo: 1,
    pageSize: 20
  }
  ```

- [ ] `approveCertification(certId)` - 审核通过
  ```javascript
  // 1. 更新认证状态
  // 2. 更新用户认证信息
  // 3. 发送系统消息
  // 4. 记录操作日志
  ```

- [ ] `rejectCertification(certId, reason)` - 拒绝认证
  ```javascript
  // 1. 更新认证状态
  // 2. 记录拒绝原因
  // 3. 发送系统消息
  // 4. 记录操作日志
  ```

**测试**:
- [ ] 创建测试数据
- [ ] 测试获取列表
- [ ] 测试审核通过
- [ ] 测试拒绝认证

**交付物**:
- ✅ 认证管理 3 个方法
- ✅ 单元测试通过

---

### Day 2: 系统消息 + 举报管理（上半部分）

#### 上午（4小时）：系统消息（2个方法）

**任务清单**:
- [ ] `sendSystemMessage(userId, type, title, content, related)` - 发送消息
  ```javascript
  {
    userId: '目标用户ID',
    type: 'system/warning/notice',
    title: '消息标题',
    content: '消息内容',
    relatedType: 'post/script/...',
    relatedId: 'xxx'
  }
  ```

- [ ] `sendBatchMessages(userIds, messageData)` - 批量发送
  ```javascript
  {
    userIds: ['user1', 'user2', ...],
    messageData: {
      type: 'system',
      title: '标题',
      content: '内容'
    }
  }
  ```

**测试**:
- [ ] 测试单条发送
- [ ] 测试批量发送
- [ ] 验证消息存储

**交付物**:
- ✅ 系统消息 2 个方法
- ✅ 单元测试通过

---

#### 下午（4小时）：举报管理（前3个方法）

**任务清单**:
- [ ] `getReports(options)` - 获取举报列表
  ```javascript
  {
    status: 'pending/resolved/rejected',
    contentType: 'post/comment/script',
    reason: '举报原因',
    pageNo: 1,
    pageSize: 20
  }
  ```

- [ ] `getReportStats()` - 举报统计
  ```javascript
  // 返回各状态的举报数量
  {
    pending: 10,
    processing: 5,
    resolved: 100,
    rejected: 20,
    total: 135
  }
  ```

- [ ] `rejectReport(reportId, remark)` - 驳回举报
  ```javascript
  // 1. 更新举报状态为 rejected
  // 2. 记录驳回原因
  // 3. 记录操作日志
  ```

**交付物**:
- ✅ 举报管理 3 个方法
- ✅ 单元测试通过

---

### Day 3: 举报管理（下半部分）+ 敏感词管理（上半部分）

#### 上午（4小时）：举报管理（后2个方法）

**任务清单**:
- [ ] `handleReport(reportId, handleResult, remark)` - 处理举报
  ```javascript
  {
    reportId: 'xxx',
    handleResult: 'delete/warn/ban',
    handleRemark: '处理说明'
  }
  
  // 根据 handleResult 执行不同操作：
  // - delete: 删除被举报内容 + 通知用户
  // - warn: 警告用户 + 增加警告次数
  // - ban: 封禁用户 + 发送封禁通知
  ```

- [ ] `deleteReportedContent(contentType, contentId)` - 删除内容
  ```javascript
  // 内部方法，支持删除：
  // - post（帖子）
  // - comment（评论）
  // - script（剧本）
  // - review（评价）
  ```

**复杂功能实现**:
```javascript
// 警告用户
async function warnUser(db, userId, contentType) {
  // 1. 发送警告消息
  // 2. 更新用户警告次数
  // 3. 记录警告时间
}

// 封禁用户
async function banUser(db, userId, reason) {
  // 1. 发送封禁通知
  // 2. 更新用户状态（status: 1）
  // 3. 记录封禁原因和时间
}
```

**测试**:
- [ ] 测试删除内容
- [ ] 测试警告用户
- [ ] 测试封禁用户

**交付物**:
- ✅ 举报管理完整（5个方法）
- ✅ 复杂功能测试通过

---

#### 下午（4小时）：敏感词管理（前3个方法）

**任务清单**:
- [ ] `getSensitiveWords(options)` - 获取列表
  ```javascript
  {
    keyword: '搜索关键词',
    type: 'political/violence/porn/ad/other',
    status: 'enabled/disabled',
    pageNo: 1,
    pageSize: 20
  }
  ```

- [ ] `addSensitiveWord(wordData)` - 添加敏感词
  ```javascript
  {
    word: '敏感词',
    type: 'political',
    level: 1-3,  // 1:严重 2:一般 3:轻微
    replacement: '替换词',
    remark: '备注'
  }
  ```

- [ ] `updateSensitiveWord(wordId, wordData)` - 更新敏感词
  ```javascript
  // 允许更新所有字段
  ```

**交付物**:
- ✅ 敏感词管理 3 个方法
- ✅ 单元测试通过

---

### Day 4: 敏感词管理（下半部分）+ 用户管理 + 测试

#### 上午（3小时）：敏感词管理（后3个方法）

**任务清单**:
- [ ] `deleteSensitiveWord(wordId)` - 删除敏感词

- [ ] `importSensitiveWords(words)` - 批量导入
  ```javascript
  {
    words: [
      { word: '敏感词1', type: 'political', level: 1 },
      { word: '敏感词2', type: 'violence', level: 2 },
      ...
    ]
  }
  
  // 功能：
  // 1. 检查重复（跳过已存在）
  // 2. 批量插入
  // 3. 返回成功/失败统计
  ```

- [ ] `toggleSensitiveWord(wordId, status)` - 启用/禁用

**测试**:
- [ ] 测试批量导入（100条）
- [ ] 测试重复检测
- [ ] 测试启用/禁用

**交付物**:
- ✅ 敏感词管理完整（6个方法）
- ✅ 批量导入测试通过

---

#### 下午（5小时）：用户管理 + 集成测试

**任务清单**:
- [ ] `warnUser(userId, reason)` - 警告用户
  ```javascript
  // 1. 发送警告消息
  // 2. 增加警告次数
  // 3. 记录警告时间
  // 4. 记录操作日志
  ```

- [ ] `banUser(userId, reason)` - 封禁用户
  ```javascript
  // 1. 发送封禁通知
  // 2. 更新用户状态（status: 1）
  // 3. 记录封禁原因
  // 4. 记录操作日志
  ```

- [ ] `unbanUser(userId)` - 解封用户
  ```javascript
  // 1. 恢复用户状态（status: 0）
  // 2. 发送解封通知
  // 3. 记录操作日志
  ```

**集成测试**:
- [ ] 测试所有 15-20 个方法
- [ ] 创建测试页面
- [ ] 性能测试（响应时间）
- [ ] 错误处理测试

**文档**:
- [ ] 创建 `ADMIN_CLOUD_OBJECT_COMPLETE.md`
- [ ] 记录 API 文档
- [ ] 记录测试用例

**交付物**:
- ✅ Admin 云对象完整（15-20个方法）
- ✅ 测试页面
- ✅ 完成文档

---

## 📅 Phase 2: AdminScript 云对象（剧本管理）

### 🎯 目标
创建剧本管理云对象，包含批量导入、预览图生成、剧本审核功能。

---

### Day 5: 批量导入 + 预览图生成

#### 上午（4小时）：基础架构 + 批量导入

**任务清单**:
- [ ] 创建 `admin-script` 云对象目录

- [ ] 复制 `preview-generator.js`
  ```bash
  cp ../script-batch-import/preview-generator.js \
     admin-script/preview-generator.js
  ```

- [ ] 创建 `package.json`

- [ ] 创建 `index.obj.js` 基础结构

- [ ] `batchImportScripts(scripts)` - 批量导入
  ```javascript
  {
    scripts: [
      {
        title: '剧本名',
        author: '作者',
        json_data: { ... },
        intro: '简介',
        player_count: { min: 5, max: 15 },
        tags: ['标签1', '标签2'],
        ...
      }
    ]
  }
  
  // 功能：
  // 1. 验证剧本数据
  // 2. 生成预览图
  // 3. 批量插入数据库
  // 4. 返回成功/失败统计
  ```

- [ ] `validateScriptData(scriptData)` - 验证数据
  ```javascript
  // 验证必填字段：
  // - title（剧本名）
  // - author（作者）
  // - json_data（JSON数据）
  ```

**测试**:
- [ ] 准备测试剧本数据（10个）
- [ ] 测试批量导入
- [ ] 验证预览图生成

**交付物**:
- ✅ 批量导入 2 个方法
- ✅ 预览图生成器集成

---

#### 下午（4小时）：预览图生成

**任务清单**:
- [ ] `generatePreview(scriptData)` - 生成预览图
  ```javascript
  {
    title: '剧本名',
    author: '作者',
    jsonData: { ... }
  }
  
  // 返回：
  {
    previewImage: 'data:image/svg+xml;base64,...',
    previewUrl: 'cloudinary URL'  // 可选
  }
  ```

- [ ] `regeneratePreview(scriptId)` - 重新生成
  ```javascript
  // 1. 从数据库获取剧本
  // 2. 生成新的预览图
  // 3. 更新数据库
  // 4. 返回新预览图
  ```

**测试**:
- [ ] 测试 SVG 生成
- [ ] 测试 Base64 编码
- [ ] 测试云存储上传（可选）
- [ ] 性能测试（生成时间）

**交付物**:
- ✅ 预览图生成 2 个方法
- ✅ 性能优化完成

---

### Day 6: 剧本审核 + 剧本管理 + 测试

#### 上午（3小时）：剧本审核

**任务清单**:
- [ ] `getAuditList(options)` - 获取待审核列表
  ```javascript
  {
    status: 'pending/approved/rejected',
    pageNo: 1,
    pageSize: 20
  }
  ```

- [ ] `approveScript(scriptId)` - 审核通过
  ```javascript
  // 1. 更新剧本状态（published）
  // 2. 发送系统消息给作者
  // 3. 记录操作日志
  ```

- [ ] `rejectScript(scriptId, reason)` - 拒绝剧本
  ```javascript
  // 1. 更新剧本状态（rejected）
  // 2. 记录拒绝原因
  // 3. 发送系统消息给作者
  // 4. 记录操作日志
  ```

**测试**:
- [ ] 创建测试剧本
- [ ] 测试审核流程
- [ ] 验证消息发送

**交付物**:
- ✅ 剧本审核 3 个方法

---

#### 下午（5小时）：剧本管理 + 集成测试

**任务清单**:
- [ ] `toggleScriptStatus(scriptId, status)` - 上架/下架
  ```javascript
  {
    scriptId: 'xxx',
    status: 'published/draft/offline'
  }
  
  // published: 上架（公开显示）
  // draft: 草稿（仅作者可见）
  // offline: 下架（不显示）
  ```

**集成测试**:
- [ ] 测试所有 6-8 个方法
- [ ] 创建测试页面
- [ ] 测试批量导入（100个剧本）
- [ ] 性能测试

**文档**:
- [ ] 创建 `ADMIN_SCRIPT_CLOUD_OBJECT_COMPLETE.md`
- [ ] 记录 API 文档
- [ ] 记录性能指标

**交付物**:
- ✅ AdminScript 云对象完整（6-8个方法）
- ✅ 测试页面
- ✅ 完成文档

---

## 📅 Phase 3: AdminWiki 云对象（百科管理）

### 🎯 目标
创建百科管理云对象，包含批量同步、角色管理、日志管理功能。

**⚠️ 注意**: 这是最复杂的模块，需要谨慎处理！

---

### Day 7: 基础架构 + 批量同步

#### 上午（4小时）：基础架构搭建

**任务清单**:
- [ ] 创建 `admin-wiki` 云对象目录

- [ ] 复制依赖文件
  ```bash
  cp ../wiki-admin-sync-all/parser-utils.js admin-wiki/
  cp ../wiki-admin-sync-all/urls-config.js admin-wiki/
  ```

- [ ] 创建 `package.json`（含 cheerio 依赖）
  ```json
  {
    "dependencies": {
      "cheerio": "^1.0.0-rc.12"
    },
    "cloudfunction-config": {
      "memorySize": 512,
      "timeout": 60
    }
  }
  ```

- [ ] 创建 `index.obj.js` 基础结构

- [ ] 配置 cheerio
  ```javascript
  const cheerio = require('cheerio');
  const parserUtils = require('./parser-utils');
  const urlsConfig = require('./urls-config');
  ```

**测试**:
- [ ] 验证 cheerio 可用
- [ ] 测试解析工具

**交付物**:
- ✅ AdminWiki 云对象架构
- ✅ cheerio 配置完成

---

#### 下午（4小时）：批量同步（方法1）

**任务清单**:
- [ ] `syncAll(syncType, batchSize)` - 批量同步所有
  ```javascript
  {
    sync_type: 'all/roles/scripts/rules/guides',
    batch_size: 5  // 每批处理数量
  }
  
  // 功能：
  // 1. 读取 URL 配置
  // 2. 分批处理（避免超时）
  // 3. 抓取页面（cheerio 解析）
  // 4. 写入数据库
  // 5. 记录同步日志
  // 6. 返回统计结果
  ```

**复杂功能实现**:
```javascript
// 同步单个页面（内部方法）
async function syncSinglePage(url, db) {
  // 1. HTTP 请求获取 HTML
  // 2. cheerio 解析 HTML
  // 3. 提取结构化数据
  // 4. 保存/更新数据库
  // 5. 返回结果
}

// 批处理逻辑
for (let i = 0; i < urls.length; i += batch_size) {
  const batch = urls.slice(i, i + batch_size);
  await Promise.all(batch.map(url => syncSinglePage(url, db)));
  await sleep(1000);  // 间隔1秒
}
```

**测试**:
- [ ] 测试单个 URL 同步
- [ ] 测试小批量（5个）
- [ ] 测试超时处理

**交付物**:
- ✅ 批量同步方法1

---

### Day 8: 批量同步（完善）+ 角色管理

#### 上午（4小时）：批量同步（方法2）+ 优化

**任务清单**:
- [ ] `syncSingle(url, forceRefresh)` - 同步单个页面
  ```javascript
  {
    url: 'https://clocktower-wiki.gstonegames.com/...',
    forceRefresh: true/false
  }
  
  // 功能：
  // 1. 验证 URL
  // 2. 检查缓存（除非 forceRefresh）
  // 3. 抓取并解析
  // 4. 保存数据
  // 5. 返回结果
  ```

**性能优化**:
- [ ] 添加重试机制（失败重试3次）
- [ ] 添加错误处理
- [ ] 优化 cheerio 解析逻辑
- [ ] 添加进度回调

**测试**:
- [ ] 测试缓存机制
- [ ] 测试强制刷新
- [ ] 测试错误重试
- [ ] 性能测试

**交付物**:
- ✅ 批量同步完整（2个方法）
- ✅ 性能优化完成

---

#### 下午（4小时）：角色管理（前3个方法）

**任务清单**:
- [ ] `getRoles(options)` - 获取角色列表
  ```javascript
  {
    keyword: '搜索关键词',
    team: 'townsfolk/outsider/minion/demon',
    pageNo: 1,
    pageSize: 20
  }
  ```

- [ ] `addRole(roleData)` - 添加角色
  ```javascript
  {
    title: '角色名',
    entry_type: 'role',
    role_info: {
      team: 'townsfolk',
      team_name: '镇民',
      ability: '能力描述',
      ...
    },
    ...
  }
  ```

- [ ] `updateRole(roleId, roleData)` - 更新角色

**测试**:
- [ ] 测试角色列表
- [ ] 测试添加角色
- [ ] 测试更新角色

**交付物**:
- ✅ 角色管理 3 个方法

---

### Day 9: 角色管理（完善）+ 日志管理 + 测试

#### 上午（3小时）：角色管理（后2个方法）+ 日志

**任务清单**:
- [ ] `deleteRole(roleId)` - 删除角色
  ```javascript
  // 软删除或硬删除
  ```

- [ ] `syncRole(roleId)` - 同步角色数据
  ```javascript
  // 1. 获取角色的 source_url
  // 2. 重新抓取并解析
  // 3. 更新数据库
  ```

- [ ] `getSyncLogs(options)` - 获取同步日志
  ```javascript
  {
    syncType: 'all/roles/...',
    status: 'success/partial_success/failed',
    pageNo: 1,
    pageSize: 20
  }
  ```

- [ ] `getSyncLogDetail(logId)` - 获取日志详情

**交付物**:
- ✅ 角色管理完整（5个方法）
- ✅ 日志管理（2个方法）

---

#### 下午（5小时）：工具方法 + 集成测试

**任务清单**:
- [ ] `testParser(url)` - 测试解析器
  ```javascript
  {
    url: 'https://...'
  }
  
  // 返回：
  {
    success: true/false,
    parsed_data: { ... },
    error: '错误信息'
  }
  ```

**集成测试**:
- [ ] 测试所有 8-10 个方法
- [ ] 创建测试页面
- [ ] 测试大批量同步（50个）
- [ ] 超时测试（60秒限制）
- [ ] 错误处理测试

**性能优化**:
- [ ] 优化数据库查询
- [ ] 优化 cheerio 解析
- [ ] 添加缓存机制

**文档**:
- [ ] 创建 `ADMIN_WIKI_CLOUD_OBJECT_COMPLETE.md`
- [ ] 记录 API 文档
- [ ] 记录性能指标
- [ ] 记录已知问题

**交付物**:
- ✅ AdminWiki 云对象完整（8-10个方法）
- ✅ 测试页面
- ✅ 完成文档
- ✅ 性能优化

---

## 📊 技术规范

### 1. 统一的架构模式

```javascript
'use strict';

// ==================== 外部工具函数 ====================

function parseAdminId(context) {
  return context.ADMIN_UID || context.ADMIN_USER_ID || null;
}

function checkAdminAuth(adminId) {
  if (!adminId) {
    throw new Error('需要管理员权限');
  }
  return true;
}

function returnSuccess(data = null, message = '操作成功') {
  return {
    code: 0,
    message,
    data
  };
}

function returnError(code = -1, message = '操作失败', data = null) {
  return {
    code,
    message,
    data
  };
}

async function logOperation(db, adminId, action, target, details) {
  try {
    await db.collection('admin_operation_logs').add({
      admin_id: adminId,
      action: action,
      target: target,
      details: details,
      created_at: Date.now()
    });
  } catch (error) {
    console.error('[logOperation] 记录失败:', error);
  }
}

// ==================== 云对象主体 ====================

module.exports = {
  
  _before() {
    // 初始化数据库
    this.db = uniCloud.database();
    this.dbCmd = this.db.command;
    
    // 获取管理员ID
    const context = this.getClientInfo();
    this.adminId = parseAdminId(context);
    
    // 验证权限
    try {
      checkAdminAuth(this.adminId);
    } catch (error) {
      throw new Error('权限验证失败: ' + error.message);
    }
    
    console.log('[admin] 管理员ID:', this.adminId);
  },
  
  /**
   * 方法模板
   */
  async methodName(param1, param2) {
    console.log('[admin] methodName 调用:', { param1, param2 });
    
    try {
      // 参数验证
      if (!param1) {
        return returnError(400, '缺少必要参数');
      }
      
      // 业务逻辑
      const result = await this.db.collection('xxx')
        .where({ ... })
        .get();
      
      // 记录操作日志
      await logOperation(
        this.db, 
        this.adminId, 
        'methodName', 
        'target', 
        { param1, param2 }
      );
      
      return returnSuccess(result.data, '操作成功');
      
    } catch (error) {
      console.error('[admin] methodName 错误:', error);
      return returnError(500, error.message);
    }
  }
};
```

---

### 2. 权限验证

每个方法都会经过 `_before` 钩子验证：

```javascript
_before() {
  this.adminId = parseAdminId(this.getClientInfo());
  checkAdminAuth(this.adminId);  // 抛出异常如果无权限
}
```

---

### 3. 操作日志

重要操作必须记录：

```javascript
await logOperation(
  this.db,
  this.adminId,
  'approve_certification',  // 操作类型
  'certification',           // 目标类型
  {                          // 详细信息
    certId: certId,
    certType: 'storyteller'
  }
);
```

---

### 4. 错误处理

```javascript
try {
  // 业务逻辑
} catch (error) {
  console.error('[admin] 错误:', error);
  
  // 记录错误日志
  await logOperation(this.db, this.adminId, 'error', 'methodName', {
    error: error.message,
    stack: error.stack
  });
  
  return returnError(500, error.message);
}
```

---

## 📋 测试计划

### 单元测试

**每个方法都需要**:
- [ ] 正常流程测试
- [ ] 参数验证测试
- [ ] 错误处理测试
- [ ] 边界条件测试

### 集成测试

**每个云对象完成后**:
- [ ] 所有方法联合测试
- [ ] 权限验证测试
- [ ] 性能测试
- [ ] 并发测试

### 压力测试

**关键方法**:
- [ ] 批量导入（100个剧本）
- [ ] 批量同步（50个Wiki页面）
- [ ] 批量发送消息（1000个用户）

---

## 📊 质量标准

### 代码质量

- [ ] 遵循统一架构模式
- [ ] 代码注释完整（每个方法）
- [ ] 无明显代码重复
- [ ] 通过 ESLint 检查

### 性能标准

- [ ] 单个请求 < 3秒
- [ ] 批量操作 < 60秒
- [ ] 数据库查询优化
- [ ] 无内存泄漏

### 功能标准

- [ ] 所有功能正常工作
- [ ] 权限验证正确
- [ ] 错误处理完善
- [ ] 操作日志完整

---

## 📚 交付物清单

### Phase 1: Admin 云对象
- [ ] `admin/index.obj.js` (15-20个方法)
- [ ] `admin/package.json`
- [ ] 测试页面
- [ ] `ADMIN_CLOUD_OBJECT_COMPLETE.md`

### Phase 2: AdminScript 云对象
- [ ] `admin-script/index.obj.js` (6-8个方法)
- [ ] `admin-script/preview-generator.js`
- [ ] `admin-script/package.json`
- [ ] 测试页面
- [ ] `ADMIN_SCRIPT_CLOUD_OBJECT_COMPLETE.md`

### Phase 3: AdminWiki 云对象
- [ ] `admin-wiki/index.obj.js` (8-10个方法)
- [ ] `admin-wiki/parser-utils.js`
- [ ] `admin-wiki/urls-config.js`
- [ ] `admin-wiki/package.json`
- [ ] 测试页面
- [ ] `ADMIN_WIKI_CLOUD_OBJECT_COMPLETE.md`

### 最终文档
- [ ] `ADMIN_CLOUD_OBJECTS_API.md` - API文档
- [ ] `ADMIN_MIGRATION_SUMMARY.md` - 迁移总结
- [ ] 更新 `README.md`

---

## 🎊 里程碑检查点

### Checkpoint 1: Admin 云对象完成（Day 4）
- [ ] 15-20个方法全部实现
- [ ] 单元测试100%通过
- [ ] 测试页面可用
- [ ] 文档完成

### Checkpoint 2: AdminScript 云对象完成（Day 6）
- [ ] 6-8个方法全部实现
- [ ] 批量导入测试通过（100个剧本）
- [ ] 预览图生成正常
- [ ] 文档完成

### Checkpoint 3: AdminWiki 云对象完成（Day 9）
- [ ] 8-10个方法全部实现
- [ ] 批量同步测试通过（50个页面）
- [ ] cheerio 解析正常
- [ ] 超时处理正确
- [ ] 文档完成

### Final Checkpoint: 项目验收
- [ ] 所有云对象部署成功
- [ ] 所有测试通过
- [ ] 性能达标
- [ ] 文档完整
- [ ] 旧云函数删除

---

## 🚀 开始准备

### 环境准备
- [ ] HBuilderX 已安装
- [ ] uniCloud 服务空间已关联
- [ ] 测试数据已准备
- [ ] 开发分支已创建

### 知识准备
- [ ] 复习客户端云对象经验
- [ ] 熟悉 cheerio API
- [ ] 了解管理端业务逻辑
- [ ] 准备测试用例

---

**准备好了吗？让我们开始 Day 1！** 🚀

_计划创建时间：2025-11-04_  
_预估总工期：6-9天_  
_云对象数量：3个_  
_方法总数：30-40个_  
_状态：执行计划已制定，待开始_ ✅
