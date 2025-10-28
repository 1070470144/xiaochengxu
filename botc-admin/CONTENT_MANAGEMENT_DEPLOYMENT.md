# 🚀 内容管理系统 - 部署清单

## ✅ 已创建的文件

### 数据库Schema（2个）
- ✅ `botc-sensitive-words.schema.json` - 敏感词表
- ✅ `botc-reports.schema.json` - 举报表

### 云函数（2个）
- ✅ `sensitive-words-admin/` - 敏感词管理
  - `index.js`
  - `package.json`
- ✅ `reports-admin/` - 举报管理
  - `index.js`
  - `package.json`

### 管理页面（2个）
- ✅ `pages/botc/content/sensitive-words.vue` - 敏感词管理
- ✅ `pages/botc/content/reports.vue` - 举报管理

### 配置文件
- ✅ `pages.json` - 已添加路由
- ✅ `opendb-admin-menus.init_data.json` - 已添加菜单

### 文档
- ✅ `CONTENT_MANAGEMENT_GUIDE.md` - 完整使用文档

---

## 📋 部署步骤（按顺序执行）

### 步骤1：上传数据库Schema

```bash
在HBuilderX中：

1. 右键：botc-admin/uniCloud-aliyun/database/botc-sensitive-words.schema.json
   → 上传DB Schema
   → 等待"上传成功"

2. 右键：botc-admin/uniCloud-aliyun/database/botc-reports.schema.json
   → 上传DB Schema
   → 等待"上传成功"
```

### 步骤2：上传云函数

```bash
在HBuilderX中：

1. 右键：botc-admin/uniCloud-aliyun/cloudfunctions/sensitive-words-admin
   → 上传部署
   → 等待"上传成功"

2. 右键：botc-admin/uniCloud-aliyun/cloudfunctions/reports-admin
   → 上传部署
   → 等待"上传成功"
```

### 步骤3：添加菜单

#### 方法1：通过"菜单管理"界面添加（推荐）

```bash
1. 登录管理后台
2. 进入：系统管理 → 菜单管理
3. 点击"新增菜单"
```

**敏感词管理菜单：**
```
菜单ID：botc-sensitive-words
菜单名称：敏感词管理
父级菜单：血染钟楼管理
菜单图标：admin-icons-safety
菜单路径：/pages/botc/content/sensitive-words
排序：106
启用状态：✅ 勾选
```

**举报管理菜单：**
```
菜单ID：botc-reports
菜单名称：举报管理
父级菜单：血染钟楼管理
菜单图标：admin-icons-read
菜单路径：/pages/botc/content/reports
排序：107
启用状态：✅ 勾选
```

#### 方法2：修改数据库（如果菜单管理不可用）

```bash
1. 打开uniCloud web控制台
2. 进入：云数据库 → opendb-admin-menus
3. 添加两条记录（见下文JSON）
```

**敏感词管理菜单JSON：**
```json
{
  "menu_id": "botc-sensitive-words",
  "name": "敏感词管理",
  "icon": "admin-icons-safety",
  "url": "/pages/botc/content/sensitive-words",
  "sort": 106,
  "parent_id": "botc-manage",
  "permission": [],
  "enable": true,
  "create_date": 1702800000000
}
```

**举报管理菜单JSON：**
```json
{
  "menu_id": "botc-reports",
  "name": "举报管理",
  "icon": "admin-icons-read",
  "url": "/pages/botc/content/reports",
  "sort": 107,
  "parent_id": "botc-manage",
  "permission": [],
  "enable": true,
  "create_date": 1702800000000
}
```

### 步骤4：验证部署

```bash
1. 刷新管理后台（Ctrl + F5）
2. 查看左侧菜单是否显示
3. 点击菜单测试跳转
4. 测试基本功能
```

---

## 🔍 验证清单

### 数据库验证
- [ ] 打开uniCloud web控制台
- [ ] 查看"云数据库"
- [ ] 确认存在 `botc-sensitive-words` 表
- [ ] 确认存在 `botc-reports` 表

### 云函数验证
- [ ] 打开uniCloud web控制台
- [ ] 查看"云函数"
- [ ] 确认存在 `sensitive-words-admin` 函数
- [ ] 确认存在 `reports-admin` 函数

### 菜单验证
```
📱 血染钟楼管理
  ├─ 店铺认证审核
  ├─ 拼车管理
  ├─ 帖子审核
  ├─ 剧本管理
  ├─ 说书人认证审核
  ├─ 敏感词管理  ✅ 新增
  └─ 举报管理  ✅ 新增
```

### 页面验证
- [ ] 点击"敏感词管理"能正常跳转
- [ ] 页面正常加载（显示"暂无数据"）
- [ ] 点击"举报管理"能正常跳转
- [ ] 页面正常加载（显示统计数据）

---

## 🧪 功能测试

### 敏感词管理测试

#### 1. 添加敏感词
```bash
1. 点击"添加敏感词"
2. 填写信息：
   - 敏感词：测试词
   - 类型：其他
   - 级别：2
   - 状态：启用
3. 点击"确定"
4. 验证列表中出现该敏感词
```

#### 2. 编辑敏感词
```bash
1. 点击某个敏感词的"编辑"
2. 修改信息
3. 点击"确定"
4. 验证修改成功
```

#### 3. 删除敏感词
```bash
1. 点击某个敏感词的"删除"
2. 确认删除
3. 验证该敏感词已消失
```

#### 4. 批量导入
```bash
1. 点击"批量导入"
2. 输入：
   测试词1
   测试词2
   测试词3
3. 点击"导入"
4. 验证导入结果
```

### 举报管理测试

#### 1. 查看统计
```bash
验证统计数据显示：
- 待处理：0
- 处理中：0
- 已处理：0
- 已驳回：0
```

#### 2. 筛选功能
```bash
1. 切换状态筛选
2. 切换内容类型筛选
3. 切换举报原因筛选
4. 验证列表正确过滤
```

---

## ⚠️ 常见问题

### 问题1：菜单不显示
**解决**：
1. 检查 `parent_id` 是否为 `botc-manage`
2. 检查 `enable` 是否为 `true`
3. 刷新浏览器（Ctrl + F5）
4. 重新登录管理后台

### 问题2：云函数调用失败
**解决**：
1. 确认云函数已上传
2. 查看云函数日志
3. 检查参数是否正确
4. 重新上传云函数

### 问题3：页面空白或404
**解决**：
1. 检查 `pages.json` 是否配置路由
2. 检查页面文件是否存在
3. 重启开发服务器

### 问题4：数据库操作失败
**解决**：
1. 确认Schema已上传
2. 检查数据表是否创建
3. 查看数据库权限配置

---

## 📝 后续集成

### 与客户端集成

#### 敏感词过滤（客户端实现）
```javascript
// 在用户发布内容前调用
const content = '用户输入的内容'

// 调用敏感词检测云函数（需要创建）
const res = await uniCloud.callFunction({
  name: 'sensitive-words-check',
  data: { content }
})

if (res.result.hasSensitive) {
  // 根据级别处理
  if (res.result.level === 3) {
    // 重度：禁止发布
    uni.showToast({ title: '内容包含违规信息', icon: 'none' })
  } else if (res.result.level === 2) {
    // 中度：进入审核
    uni.showToast({ title: '内容将进入审核', icon: 'none' })
  } else {
    // 轻度：提示
    uni.showToast({ title: '请注意文明用语', icon: 'none' })
  }
}
```

#### 举报功能（客户端实现）
```javascript
// 用户举报某个内容
const reportData = {
  content_type: 'post', // 帖子
  content_id: 'xxx',
  reason: 'spam',
  description: '详细描述',
  images: [] // 截图
}

const res = await uniCloud.callFunction({
  name: 'content-report', // 需要创建客户端云函数
  data: reportData
})

if (res.result.code === 0) {
  uni.showToast({ title: '举报成功，我们将尽快处理', icon: 'success' })
}
```

---

**✅ 部署完成后，两个内容管理功能即可使用！** 🎉

**检查清单**：
- [ ] 数据库Schema已上传
- [ ] 云函数已上传
- [ ] 菜单已添加
- [ ] 页面可正常访问
- [ ] 基本功能测试通过

**如有问题，请参考上面的"常见问题"章节！** 🔧

