# 🎭 说书人认证审核系统 - 管理端

## ✅ 已完成功能

### 1. 数据库Schema
创建了 `botc-certifications` 数据表，字段包括：
- `user_id`：用户ID
- `user_nickname`：用户昵称
- `user_mobile`：用户手机号
- `level`：认证级别（1-一星，2-二星）
- `images`：证明材料图片数组
- `description`：申请说明
- `status`：状态（pending-待审核，approved-已通过，rejected-已拒绝）
- `reject_reason`：拒绝原因
- `approved_at`：审核通过时间
- `created_at`：创建时间
- `updated_at`：更新时间

### 2. 云函数
**云函数名称**：`certification-admin`

**功能列表**：
- ✅ `list`：获取认证申请列表（支持分页和状态筛选）
- ✅ `approve`：审核通过（更新认证状态，更新用户认证信息）
- ✅ `reject`：拒绝申请（需填写拒绝原因）

**调用示例**：
```javascript
// 获取列表
await uniCloud.callFunction({
  name: 'certification-admin',
  data: {
    action: 'list',
    pageNo: 1,
    pageSize: 20,
    status: 'pending' // 可选：'pending', 'approved', 'rejected'
  }
})

// 审核通过
await uniCloud.callFunction({
  name: 'certification-admin',
  data: {
    action: 'approve',
    certId: 'xxx'
  }
})

// 拒绝申请
await uniCloud.callFunction({
  name: 'certification-admin',
  data: {
    action: 'reject',
    certId: 'xxx',
    rejectReason: '照片不清晰'
  }
})
```

### 3. 管理页面
**页面路径**：`pages/botc/certification/list.vue`

**页面功能**：
- ✅ 认证列表展示（表格形式）
- ✅ 状态筛选（全部、待审核、已通过、已拒绝）
- ✅ 统计信息（待审核、已通过、已拒绝数量）
- ✅ 证明材料图片预览
- ✅ 审核通过操作
- ✅ 拒绝操作（需填写原因）
- ✅ 查看详情弹窗
- ✅ 分页功能

**页面字段**：
| 字段 | 说明 |
|------|------|
| 申请时间 | 认证申请提交时间 |
| 用户昵称 | 申请人昵称 |
| 手机号 | 申请人手机号 |
| 级别 | ⭐ 一星 / ⭐⭐ 二星 |
| 证明材料 | 图片缩略图（点击预览） |
| 申请说明 | 用户填写的说明文字 |
| 状态 | 待审核/已通过/已拒绝 |
| 拒绝原因 | 审核拒绝时填写的原因 |
| 操作 | 通过/拒绝/查看按钮 |

### 4. 导航菜单
已添加到左侧菜单：
- **位置**：血染钟楼管理 → 说书人认证审核
- **图标**：admin-icons-manager-user
- **排序**：105

---

## 📁 文件结构

```
botc-admin/
├── uniCloud-aliyun/
│   ├── database/
│   │   └── botc-certifications.schema.json  ✅ 数据表定义
│   │   └── opendb-admin-menus.init_data.json  ✅ 菜单配置
│   └── cloudfunctions/
│       └── certification-admin/
│           ├── index.js  ✅ 云函数逻辑
│           └── package.json  ✅ 云函数配置
└── pages/
    └── botc/
        └── certification/
            └── list.vue  ✅ 审核页面
```

---

## 🚀 部署步骤

### 1. 上传数据库Schema
```bash
右键：botc-admin/uniCloud-aliyun/database/botc-certifications.schema.json
→ 上传DB Schema
```

### 2. 初始化菜单数据
```bash
右键：botc-admin/uniCloud-aliyun/database/opendb-admin-menus.init_data.json
→ 初始化云数据库数据
```

### 3. 上传云函数
```bash
右键：botc-admin/uniCloud-aliyun/cloudfunctions/certification-admin
→ 上传部署
```

### 4. 运行项目
```bash
在HBuilderX中运行到浏览器
登录管理后台
左侧菜单 → 血染钟楼管理 → 说书人认证审核
```

---

## 🔄 审核流程

### 用户申请（小程序端）
1. 用户在小程序中进入"说书人认证"
2. 选择认证级别（⭐ 一星 / ⭐⭐ 二星）
3. 上传1-3张证明材料照片
4. 填写申请说明（选填）
5. 提交申请（状态变为 `pending`）

### 管理员审核（管理端）
1. 进入"说书人认证审核"页面
2. 查看待审核列表
3. 点击图片预览证明材料
4. 查看申请说明
5. 做出审核决定：
   - **通过**：
     - 点击"通过"按钮
     - 确认后，系统自动：
       - 更新认证状态为 `approved`
       - 设置用户 `storyteller_level` 和 `storyteller_certified` 字段
       - 记录审核通过时间
   - **拒绝**：
     - 点击"拒绝"按钮
     - 填写拒绝原因
     - 确认后，系统自动：
       - 更新认证状态为 `rejected`
       - 保存拒绝原因

### 用户端展示（小程序端）
- **已通过**：显示认证标识 ⭐ 或 ⭐⭐
- **已拒绝**：显示拒绝原因，可重新申请
- **待审核**：显示审核中状态

---

## 🎯 功能特点

### 1. 高效审核
- ✅ **图片预览**：点击即可预览大图
- ✅ **批量展示**：一屏显示多条申请
- ✅ **状态筛选**：快速定位待审核项
- ✅ **统计信息**：实时查看各状态数量

### 2. 详细记录
- ✅ **用户信息**：昵称、手机号
- ✅ **申请说明**：用户填写的文字说明
- ✅ **拒绝原因**：审核不通过时的详细原因
- ✅ **时间记录**：申请时间、审核时间

### 3. 操作简便
- ✅ **一键通过**：点击即可审核通过
- ✅ **拒绝原因**：弹窗输入，便于记录
- ✅ **详情查看**：完整信息弹窗展示
- ✅ **分页加载**：支持大量数据浏览

---

## 📊 数据统计

### 统计指标
- **待审核数量**：实时显示待处理申请数
- **已通过数量**：累计审核通过数
- **已拒绝数量**：累计拒绝数

### 展示位置
页面顶部统计栏：
```
待审核: 12    已通过: 156    已拒绝: 8
```

---

## 🧪 测试建议

### 测试步骤
1. ✅ **数据准备**
   - 在小程序端提交几个测试认证申请
   - 包含不同级别（一星、二星）
   - 上传不同数量的图片（1-3张）

2. ✅ **审核通过测试**
   - 进入管理后台审核页面
   - 查看待审核列表
   - 点击"通过"按钮
   - 验证用户认证信息已更新

3. ✅ **审核拒绝测试**
   - 点击"拒绝"按钮
   - 填写拒绝原因
   - 验证状态已变更
   - 在小程序端查看拒绝原因

4. ✅ **筛选功能测试**
   - 切换不同状态筛选
   - 验证列表正确过滤

5. ✅ **图片预览测试**
   - 点击缩略图
   - 验证大图正常预览
   - 支持多图切换

---

## 💡 常见问题

### Q1: 菜单不显示？
**A**: 需要初始化菜单数据：
```bash
右键 opendb-admin-menus.init_data.json → 初始化云数据库数据
```

### Q2: 云函数调用失败？
**A**: 检查是否已上传云函数：
```bash
右键 certification-admin → 上传部署
```

### Q3: 图片无法预览？
**A**: 确保图片URL可访问，检查云存储权限设置

### Q4: 审核后用户端未生效？
**A**: 检查 `uni-id-users` 表字段：
- `storyteller_level`：认证级别
- `storyteller_certified`：是否已认证

---

## 🔐 权限管理

### 当前权限设置
- **访问权限**：需登录管理后台
- **操作权限**：所有管理员均可审核
- **数据权限**：可查看所有认证申请

### 未来扩展
可以通过 `permission` 字段配置：
- 仅特定角色可审核
- 不同级别审核需要不同权限
- 审核日志记录

---

**✅ 说书人认证审核系统已完成！** 🎭

**下一步**：上传云函数和Schema，然后在小程序端提交测试申请进行审核测试！

