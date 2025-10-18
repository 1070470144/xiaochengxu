# ✅ 百科数据库Schema配置指南

## 🐛 问题

```
项目database目录下缺少wiki_entries.schema.json
加载失败
```

## 🔍 原因

uni-admin 管理后台要求每个数据库集合都有对应的 schema.json 文件，用于：
- 定义数据结构
- 配置权限
- 生成表单
- 数据验证

---

## ✅ 已创建的Schema文件

我已经创建了2个Schema文件：

### 1. wiki_entries.schema.json
**位置**：`botc-admin/uniCloud-aliyun/database/wiki_entries.schema.json`

**用途**：百科词条表的结构定义

### 2. wiki_sync_logs.schema.json
**位置**：`botc-admin/uniCloud-aliyun/database/wiki_sync_logs.schema.json`

**用途**：同步日志表的结构定义

---

## 🚀 让Schema生效

### 方法1：上传Schema到云端（推荐）

```bash
在 HBuilderX 中 botc-admin 项目：

1. 找到 uniCloud-aliyun/database/wiki_entries.schema.json
2. 右键 → 上传DB Schema
3. 等待上传完成

4. 再找到 wiki_sync_logs.schema.json
5. 右键 → 上传DB Schema
6. 等待上传完成
```

### 方法2：在Web控制台上传

```bash
1. 访问 uniCloud Web控制台
2. 云数据库 → wiki_entries 集合
3. 点击"DB Schema"标签
4. 点击"导入Schema"
5. 复制 wiki_entries.schema.json 的内容
6. 粘贴并保存

重复步骤2-6，处理 wiki_sync_logs 集合
```

---

## 🎯 创建数据库集合（如果还没有）

如果云数据库中还没有这两个集合，需要先创建：

### 在 uniCloud Web控制台：

```bash
1. 云数据库 → 新建集合

2. 集合名称：wiki_entries
   点击"创建"

3. 集合名称：wiki_sync_logs
   点击"创建"

4. 然后再上传Schema（见上面的方法）
```

---

## ✅ 验证Schema是否生效

### 检查步骤：

```bash
1. 刷新管理后台页面
2. 进入"百科管理"
3. 应该能正常显示，不再报错
```

### 成功标志：
- ✅ "百科管理"页面能正常打开
- ✅ 显示词条列表（可能为空，需要先同步数据）
- ✅ 不再提示"缺少schema.json"

---

## 📋 完整部署清单

### 确认以下都已完成：

**云函数（botc-admin）**：
- [ ] wiki-admin-sync-all 已上传
- [ ] wiki-admin-sync-single 已上传
- [ ] add-wiki-menu 已上传

**数据库Schema（botc-admin）**：
- [ ] wiki_entries.schema.json 已上传
- [ ] wiki_sync_logs.schema.json 已上传

**数据库集合（Web控制台）**：
- [ ] wiki_entries 集合已创建
- [ ] wiki_sync_logs 集合已创建

**页面文件（botc-admin）**：
- [ ] pages/botc/wiki/sync.vue 已创建
- [ ] pages/botc/wiki/list.vue 已创建

**路由配置（botc-admin）**：
- [ ] pages.json 已添加路由

**菜单配置（botc-admin）**：
- [ ] 菜单已添加（手动或通过云函数）

---

## 🎯 现在请操作

### Step 1: 上传Schema文件
```bash
右键 wiki_entries.schema.json → 上传DB Schema
右键 wiki_sync_logs.schema.json → 上传DB Schema
```

### Step 2: 刷新管理后台
```bash
Ctrl + F5 强制刷新
```

### Step 3: 测试
```bash
1. 进入"百科管理" - 应该不再报错
2. 进入"百科同步" - 同步日志应该能显示
```

---

完成后告诉我结果！🚀
