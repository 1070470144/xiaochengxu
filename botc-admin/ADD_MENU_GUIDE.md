# 添加剧本管理菜单指南

## 📋 问题说明

左侧菜单栏没有显示 "剧本管理"，需要手动在云端数据库中添加。

---

## ✅ 快速操作步骤

### 步骤1：打开 uniCloud Web 控制台

```
1. 访问：https://unicloud.dcloud.net.cn/

2. 登录您的账号

3. 选择服务空间：mp-1e0f6630-18c8-400c-99ff-761aea3a4e83
```

### 步骤2：进入菜单管理数据库

```
1. 点击左侧 "数据库"

2. 找到并点击表 "opendb-admin-menus"

3. 点击 "表数据" 标签页
```

### 步骤3：添加菜单项

点击右上角 **"添加记录"** 按钮，然后填写以下内容：

#### 📝 复制以下JSON数据：

```json
{
  "menu_id": "botc-script-manage",
  "name": "剧本管理",
  "icon": "admin-icons-book",
  "url": "/pages/botc/script/list",
  "sort": 104,
  "parent_id": "botc-manage",
  "permission": [],
  "enable": true,
  "create_date": 1702800000000
}
```

#### 操作方式：

**方式A：使用JSON编辑器**
```
1. 在添加记录窗口，切换到 "JSON模式"
2. 粘贴上面的JSON数据
3. 点击 "确定" 保存
```

**方式B：逐个字段填写**
```
- menu_id: botc-script-manage
- name: 剧本管理
- icon: admin-icons-book
- url: /pages/botc/script/list
- sort: 104
- parent_id: botc-manage
- permission: []
- enable: true
- create_date: 1702800000000
```

### 步骤4：刷新管理后台

```
1. 回到管理后台页面
2. 按 F5 刷新页面
3. 左侧菜单应该显示：

   血染钟楼管理 ▼
   ├── 店铺认证审核
   ├── 拼车管理
   ├── 帖子审核
   └── 剧本管理  ← 新增
```

---

## 🎯 菜单层级结构

### 当前完整结构：

```
📁 血染钟楼管理 (botc-manage)
 ├── 📄 店铺认证审核 (botc-shop-verify)
 ├── 🚗 拼车管理 (botc-carpool)
 ├── 📝 帖子审核 (botc-post-audit)
 └── 📖 剧本管理 (botc-script-manage)  ← 新增
```

### 字段说明：

| 字段 | 值 | 说明 |
|------|------|------|
| menu_id | botc-script-manage | 菜单唯一标识 |
| name | 剧本管理 | 显示名称 |
| icon | admin-icons-book | 图标（书本） |
| url | /pages/botc/script/list | 页面路径 |
| sort | 104 | 排序（越小越靠前） |
| **parent_id** | **botc-manage** | **父菜单ID（血染钟楼管理）** |
| permission | [] | 权限（空数组表示所有人可见） |
| enable | true | 是否启用 |

---

## 🔍 验证菜单是否添加成功

### 检查数据库：

```
1. 在 opendb-admin-menus 表中
2. 查找 menu_id = "botc-script-manage"
3. 确认 parent_id = "botc-manage"
4. 确认 enable = true
```

### 检查管理后台：

```
1. 刷新页面（F5）
2. 左侧菜单中应该看到 "血染钟楼管理"
3. 点击展开，应该看到 4 个子菜单：
   - 店铺认证审核
   - 拼车管理
   - 帖子审核
   - 剧本管理 ← 新增
```

---

## 🎨 图标说明

使用的图标：`admin-icons-book`

如果想更换图标，可以使用以下选项：
- `admin-icons-book` - 书本
- `admin-icons-read` - 阅读
- `admin-icons-apps` - 应用
- `admin-icons-order` - 订单
- `admin-icons-car` - 汽车

---

## ⚠️ 常见问题

### Q1: 添加后菜单仍然不显示？

**解决方法：**
```
1. 清除浏览器缓存（Ctrl + Shift + Delete）
2. 强制刷新页面（Ctrl + F5）
3. 检查 enable 字段是否为 true
4. 检查 parent_id 是否正确（应该是 "botc-manage"）
5. 重新登录管理后台
```

### Q2: 菜单显示了但点击没反应？

**解决方法：**
```
1. 检查 url 字段是否正确：/pages/botc/script/list
2. 检查 pages.json 中是否有对应路由
3. 检查页面文件是否存在：botc-admin/pages/botc/script/list.vue
```

### Q3: 显示 404 错误？

**解决方法：**
```
1. 确认路由配置正确
2. 确认页面文件存在
3. 在 HBuilderX 中重新运行项目
```

### Q4: 菜单排序不对？

**解决方法：**
```
修改 sort 字段：
- 店铺认证审核: 101
- 拼车管理: 102
- 帖子审核: 103
- 剧本管理: 104

数字越小，越靠前
```

---

## 🔄 如果需要修改菜单

### 修改菜单名称：

```
1. 在 opendb-admin-menus 表中
2. 找到 menu_id = "botc-script-manage"
3. 点击编辑
4. 修改 name 字段
5. 保存后刷新页面
```

### 修改菜单图标：

```
1. 编辑记录
2. 修改 icon 字段
3. 保存后刷新页面
```

### 修改菜单排序：

```
1. 编辑记录
2. 修改 sort 字段（数字越小越靠前）
3. 保存后刷新页面
```

---

## 📱 截图参考

### 添加前：
```
血染钟楼管理 ▼
├── 店铺认证审核
├── 拼车管理
└── 帖子审核
```

### 添加后：
```
血染钟楼管理 ▼
├── 店铺认证审核
├── 拼车管理
├── 帖子审核
└── 剧本管理  ✨ 新增
```

---

## ✨ 完成检查清单

- [ ] 已打开 uniCloud Web 控制台
- [ ] 已进入 opendb-admin-menus 表
- [ ] 已添加剧本管理菜单记录
- [ ] menu_id 为 "botc-script-manage"
- [ ] parent_id 为 "botc-manage"
- [ ] enable 为 true
- [ ] 已刷新管理后台页面
- [ ] 左侧菜单中看到 "剧本管理"
- [ ] 点击菜单可以正常打开页面

---

## 🎉 总结

只需3步：
1. 📂 打开 uniCloud 控制台 → 数据库 → opendb-admin-menus
2. ➕ 添加记录（复制上面的JSON数据）
3. 🔄 刷新管理后台页面

**完成后，"剧本管理" 将出现在 "血染钟楼管理" 下！** 🎊

