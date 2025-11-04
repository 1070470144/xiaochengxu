# 🚗 Carpool 云对象迁移计划

## 📋 现有云函数分析

### 需要迁移的云函数（9个）

| # | 云函数名 | 功能说明 | 优先级 |
|---|---------|---------|--------|
| 1 | `carpool-create` | 创建拼车 | ⭐⭐⭐ |
| 2 | `carpool-list` | 拼车列表 | ⭐⭐⭐ |
| 3 | `carpool-detail` | 拼车详情 | ⭐⭐⭐ |
| 4 | `carpool-apply` | 申请加入拼车 | ⭐⭐⭐ |
| 5 | `carpool-applied-list` | 我申请的拼车列表 | ⭐⭐ |
| 6 | `carpool-cancel-apply` | 取消申请 | ⭐⭐ |
| 7 | `carpool-confirm-member` | 确认成员 | ⭐⭐ |
| 8 | `carpool-remove-member` | 移除成员 | ⭐⭐ |
| 9 | `carpool-update-status` | 更新拼车状态 | ⭐⭐ |

---

## 🎯 云对象设计

### 云对象名称
`carpool`

### 方法设计（9个公共方法）

#### 核心方法（Phase 1 - 高优先级）⭐⭐⭐

```javascript
module.exports = {
  _before() {
    // 初始化数据库连接
    // 解析 token
    // 获取当前用户 ID
  },
  
  // 1. 创建拼车
  async create(carpoolData) {
    // 创建拼车信息
    // 验证用户登录
    // 验证必填字段
    // 返回拼车 ID
  },
  
  // 2. 获取拼车列表
  async getList(options = {}) {
    // page, pageSize, status, scriptId
    // 支持筛选：状态、剧本
    // 支持排序：时间、报名人数
    // 返回分页列表
  },
  
  // 3. 获取拼车详情
  async getDetail(carpoolId) {
    // 获取拼车详细信息
    // 包含创建者信息
    // 包含成员列表
    // 包含剧本信息
  },
  
  // 4. 申请加入拼车
  async apply(carpoolId, message = '') {
    // 验证用户未重复申请
    // 验证拼车是否已满
    // 创建申请记录
    // 发送通知给车主
  }
}
```

#### 管理方法（Phase 2 - 中优先级）⭐⭐

```javascript
  // 5. 获取我申请的拼车列表
  async getMyApplications(page = 1, pageSize = 10) {
    // 获取当前用户的申请列表
    // 包含拼车信息
    // 支持分页
  },
  
  // 6. 取消申请
  async cancelApply(carpoolId) {
    // 验证是否有申请记录
    // 删除申请记录
    // 发送通知
  },
  
  // 7. 确认成员（车主操作）
  async confirmMember(carpoolId, userId) {
    // 验证是车主
    // 验证拼车未满
    // 更新申请状态为已确认
    // 增加成员
    // 发送通知
  },
  
  // 8. 移除成员（车主操作）
  async removeMember(carpoolId, userId) {
    // 验证是车主
    // 移除成员
    // 更新申请状态
    // 发送通知
  },
  
  // 9. 更新拼车状态
  async updateStatus(carpoolId, status) {
    // 验证是车主
    // 验证状态有效性
    // 更新状态（recruiting/full/completed/cancelled）
    // 发送通知给所有成员
  }
```

---

## 📊 数据表结构

### carpool 表

```javascript
{
  _id: "拼车ID",
  creator_id: "创建者ID",
  script_id: "剧本ID",
  script_title: "剧本标题",
  script_player_count: "剧本人数",
  title: "拼车标题",
  description: "拼车描述",
  play_time: "游戏时间",
  location: "地点",
  location_detail: "详细地址",
  max_members: "最大人数",
  current_members: "当前人数",
  members: ["成员ID数组"],
  status: "状态", // recruiting/full/completed/cancelled
  tags: ["标签数组"],
  contact_way: "联系方式",
  requirements: "参与要求",
  created_at: "创建时间",
  updated_at: "更新时间",
  deleted_at: "删除时间"
}
```

### carpool_applications 表

```javascript
{
  _id: "申请ID",
  carpool_id: "拼车ID",
  user_id: "申请人ID",
  message: "申请留言",
  status: "状态", // pending/approved/rejected/cancelled
  created_at: "申请时间",
  updated_at: "更新时间"
}
```

---

## 🔧 工具函数设计

```javascript
// 外部工具函数（避免 this 上下文问题）

// 统一返回成功
function returnSuccess(data = null, message = 'success') {
  return { code: 0, message, data }
}

// 统一返回错误
function returnError(message, code = 500) {
  return { code, message, data: null }
}

// 解析用户 ID
function parseUserId(clientInfo, token) {
  // 从 token 或 clientInfo 中获取用户 ID
}

// 验证登录
function checkAuth(userId) {
  if (!userId) {
    throw new Error('请先登录')
  }
}

// 验证是否是车主
async function checkIsCreator(db, carpoolId, userId) {
  const carpool = await db.collection('carpool')
    .where({ _id: carpoolId })
    .field({ creator_id: true })
    .get()
  
  if (!carpool.data.length) {
    throw new Error('拼车不存在')
  }
  
  if (carpool.data[0].creator_id !== userId) {
    throw new Error('无权操作')
  }
}

// 验证拼车数据
function validateCarpoolData(data) {
  const required = ['script_id', 'title', 'play_time', 'location', 'max_members']
  for (const field of required) {
    if (!data[field]) {
      throw new Error(`缺少必填字段: ${field}`)
    }
  }
}

// 格式化拼车数据
function formatCarpoolData(data, userId) {
  return {
    creator_id: userId,
    script_id: data.script_id,
    script_title: data.script_title || '',
    script_player_count: data.script_player_count || '',
    title: data.title,
    description: data.description || '',
    play_time: data.play_time,
    location: data.location,
    location_detail: data.location_detail || '',
    max_members: parseInt(data.max_members),
    current_members: 1,
    members: [userId],
    status: 'recruiting',
    tags: data.tags || [],
    contact_way: data.contact_way || '',
    requirements: data.requirements || '',
    created_at: Date.now(),
    updated_at: Date.now(),
    deleted_at: null
  }
}
```

---

## 📝 实现细节

### Phase 1: 核心功能（4个方法）

#### 1. create - 创建拼车

```javascript
async create(carpoolData) {
  // 1. 验证登录
  checkAuth(this.currentUserId)
  
  // 2. 验证数据
  validateCarpoolData(carpoolData)
  
  // 3. 格式化数据
  const data = formatCarpoolData(carpoolData, this.currentUserId)
  
  // 4. 插入数据库
  const result = await this.db.collection('carpool').add(data)
  
  // 5. 返回结果
  return returnSuccess({
    carpoolId: result.id,
    ...data
  }, '创建成功')
}
```

#### 2. getList - 获取拼车列表

```javascript
async getList(options = {}) {
  const {
    page = 1,
    pageSize = 10,
    status = null,
    scriptId = null,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = options
  
  // 构建查询条件
  const where = { deleted_at: null }
  if (status) where.status = status
  if (scriptId) where.script_id = scriptId
  
  // 查询列表
  const result = await this.db.collection('carpool')
    .where(where)
    .orderBy(sortBy, sortOrder)
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()
  
  // 查询总数
  const countResult = await this.db.collection('carpool')
    .where(where)
    .count()
  
  return returnSuccess({
    list: result.data,
    total: countResult.total,
    page,
    pageSize
  })
}
```

#### 3. getDetail - 获取拼车详情

```javascript
async getDetail(carpoolId) {
  if (!carpoolId) {
    return returnError('缺少拼车ID')
  }
  
  // 查询拼车信息
  const carpool = await this.db.collection('carpool')
    .where({ _id: carpoolId, deleted_at: null })
    .get()
  
  if (!carpool.data.length) {
    return returnError('拼车不存在', 404)
  }
  
  return returnSuccess(carpool.data[0])
}
```

#### 4. apply - 申请加入拼车

```javascript
async apply(carpoolId, message = '') {
  // 1. 验证登录
  checkAuth(this.currentUserId)
  
  // 2. 获取拼车信息
  const carpool = await this.db.collection('carpool')
    .where({ _id: carpoolId, deleted_at: null })
    .get()
  
  if (!carpool.data.length) {
    return returnError('拼车不存在')
  }
  
  const carpoolData = carpool.data[0]
  
  // 3. 验证拼车状态
  if (carpoolData.status !== 'recruiting') {
    return returnError('拼车已关闭报名')
  }
  
  // 4. 验证是否已是成员
  if (carpoolData.members.includes(this.currentUserId)) {
    return returnError('您已是拼车成员')
  }
  
  // 5. 验证是否已申请
  const existingApp = await this.db.collection('carpool_applications')
    .where({
      carpool_id: carpoolId,
      user_id: this.currentUserId,
      status: 'pending'
    })
    .get()
  
  if (existingApp.data.length) {
    return returnError('您已申请过该拼车')
  }
  
  // 6. 创建申请
  const application = {
    carpool_id: carpoolId,
    user_id: this.currentUserId,
    message: message,
    status: 'pending',
    created_at: Date.now(),
    updated_at: Date.now()
  }
  
  await this.db.collection('carpool_applications').add(application)
  
  return returnSuccess(null, '申请成功')
}
```

---

### Phase 2: 管理功能（5个方法）

实现思路类似，都包含：
1. 权限验证
2. 数据验证
3. 数据库操作
4. 返回结果

---

## 🧪 测试计划

### 单元测试

1. **创建拼车测试**
   - 成功创建
   - 缺少必填字段
   - 未登录创建

2. **拼车列表测试**
   - 获取所有拼车
   - 按状态筛选
   - 按剧本筛选
   - 分页测试

3. **拼车详情测试**
   - 获取存在的拼车
   - 获取不存在的拼车

4. **申请加入测试**
   - 成功申请
   - 重复申请
   - 已是成员
   - 拼车已关闭

---

## 📈 开发排期

### Phase 1: 核心功能（预计 2 小时）
- [x] 创建云对象文件结构
- [ ] 实现 create 方法
- [ ] 实现 getList 方法
- [ ] 实现 getDetail 方法
- [ ] 实现 apply 方法
- [ ] 单元测试

### Phase 2: 管理功能（预计 1.5 小时）
- [ ] 实现 getMyApplications 方法
- [ ] 实现 cancelApply 方法
- [ ] 实现 confirmMember 方法
- [ ] 实现 removeMember 方法
- [ ] 实现 updateStatus 方法
- [ ] 单元测试

### Phase 3: 前端适配（预计 2 小时）
- [ ] 拼车列表页适配
- [ ] 拼车详情页适配
- [ ] 创建拼车页适配
- [ ] 我的拼车页适配

### Phase 4: 测试与部署（预计 1 小时）
- [ ] 综合测试
- [ ] 上传云对象
- [ ] 删除旧云函数
- [ ] 文档更新

**总预计时间：6.5 小时**

---

## 🎯 成功标准

1. ✅ 所有 9 个方法正常工作
2. ✅ 前端页面全部适配完成
3. ✅ 测试用例全部通过
4. ✅ 代码质量良好，注释完整
5. ✅ 性能优于旧云函数

---

_创建时间：2025-11-04_  
_状态：准备开始_  
_下一步：开始 Phase 1 实现_

