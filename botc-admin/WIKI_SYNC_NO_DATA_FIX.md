# 🐛 同步成功但无数据问题排查

## 🎯 问题描述

- ✅ 提示"同步成功"
- ❌ 同步日志没有数据
- ❌ 百科管理没有数据

## 🔍 可能原因

1. **数据库集合不存在** - wiki_entries 或 wiki_sync_logs 集合未创建
2. **Schema权限问题** - 云函数无法写入数据
3. **云函数执行失败** - 实际同步失败但返回了成功
4. **网络超时** - 超时但错误处理不当

---

## ✅ 解决方案

### 第一步：检查数据库集合是否存在

```bash
1. 打开 uniCloud Web控制台
   https://unicloud.dcloud.net.cn

2. 选择云服务空间

3. 云数据库 → 查看集合列表

4. 检查是否存在：
   - wiki_entries ✅
   - wiki_sync_logs ✅
   - wiki_favorites ✅
   - wiki_search_history ✅

5. 如果不存在，点击"新建集合"创建
```

---

### 第二步：创建缺失的集合

#### 创建 wiki_entries
```bash
1. 云数据库 → 新建集合
2. 集合名称：wiki_entries
3. 点击"创建"
4. 进入集合 → DB Schema → 导入Schema
5. 复制 botc-admin/uniCloud-aliyun/database/wiki_entries.schema.json 内容
6. 粘贴并保存
```

#### 创建 wiki_sync_logs
```bash
1. 云数据库 → 新建集合
2. 集合名称：wiki_sync_logs
3. 点击"创建"
4. 进入集合 → DB Schema → 导入Schema
5. 复制 wiki_sync_logs.schema.json 内容
6. 粘贴并保存
```

#### 创建 wiki_favorites
```bash
集合名称：wiki_favorites
Schema：使用 botc-miniprogram 项目中的 wiki_favorites.schema.json
```

#### 创建 wiki_search_history
```bash
集合名称：wiki_search_history
Schema：使用 botc-miniprogram 项目中的 wiki_search_history.schema.json
```

---

### 第三步：检查Schema权限

```bash
在每个集合中：

1. 点击"权限"标签
2. 设置为：
   {
     ".read": true,
     ".create": false,
     ".update": false,
     ".delete": false
   }
3. 保存
```

**重要**：云函数有完整权限，不受Schema权限限制。

---

### 第四步：重新测试同步

```bash
1. 刷新管理后台（Ctrl + F5）
2. 进入"百科同步"
3. 在"单个同步"输入：
   https://clocktower-wiki.gstonegames.com/index.php?title=洗衣妇
4. 点击"同步"
5. 等待完成
```

---

## 🔍 验证数据是否入库

### 在 uniCloud Web控制台检查：

```bash
1. 云数据库 → wiki_entries
2. 查看数据列表
3. 如果有数据，说明同步成功 ✅
4. 点击查看数据内容
```

### 在管理后台检查：

```bash
1. 进入"百科管理"
2. 应该能看到同步的词条
3. 点击"查看"查看详情
```

---

## 🎯 如果数据库中有数据，但管理后台看不到

### 可能原因：

1. **权限问题** - Schema权限配置不当
2. **查询条件问题** - 云函数查询条件过滤了数据
3. **缓存问题** - 浏览器缓存

### 解决方案：

```bash
1. 检查 wiki_entries 集合的权限设置
2. 确保 .read 为 true
3. 强制刷新浏览器（Ctrl + Shift + Delete 清除缓存）
4. 重新进入"百科管理"
```

---

## 📊 调试云函数

### 查看云函数日志：

```bash
方法1（HBuilderX）：
右键 wiki-admin-sync-single → 云函数日志

方法2（Web控制台）：
云函数 → wiki-admin-sync-single → 日志

查看：
- 是否有报错
- 数据库操作是否成功
- 返回的数据是什么
```

---

## 💡 快速验证方法

### 手动插入测试数据：

```bash
1. uniCloud Web控制台
2. 云数据库 → wiki_entries
3. 点击"添加数据"
4. 插入测试数据：

{
  "entry_type": "role",
  "title": "测试角色",
  "source_url": "https://test.com",
  "source_type": "official_wiki_cn",
  "source_name": "钟楼百科",
  "content": {
    "text": "这是测试数据",
    "summary": "测试",
    "sections": []
  },
  "role_info": {},
  "media": {},
  "category": "角色",
  "tags": [],
  "keywords": ["测试"],
  "stats": {
    "view_count": 0,
    "search_count": 0,
    "favorite_count": 0
  },
  "status": 1,
  "is_featured": false,
  "created_at": new Date()
}

5. 保存
6. 刷新管理后台
7. 进入"百科管理"
8. 如果能看到"测试角色"，说明页面功能正常
9. 问题在云函数同步逻辑
```

---

## 🎯 下一步

请先：

1. **检查数据库集合是否存在**
   ```
   wiki_entries ？
   wiki_sync_logs ？
   ```

2. **上传Schema文件**
   ```
   右键 wiki_entries.schema.json → 上传DB Schema
   右键 wiki_sync_logs.schema.json → 上传DB Schema
   ```

3. **查看数据库是否有数据**
   ```
   uniCloud控制台 → wiki_entries → 查看数据
   ```

4. **告诉我结果**
   - 数据库中有数据吗？
   - 管理后台能看到吗？
   - 同步日志有吗？

根据您的反馈，我会继续帮您解决！🔧

---

**排查指南**: 2025年10月17日  
**状态**: 待验证

