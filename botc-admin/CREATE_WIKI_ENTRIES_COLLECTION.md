# 📦 创建 wiki_entries 数据库集合

## 🎯 问题确认

- ✅ wiki_sync_logs 存在且有数据
- ❌ wiki_entries 不存在
- 结果：同步的词条数据无处保存！

---

## ✅ 解决方案：创建 wiki_entries 集合

### 方法1：通过 HBuilderX 创建（推荐）

```bash
在 HBuilderX 中 botc-admin 项目：

1. 找到 uniCloud-aliyun/database/wiki_entries.schema.json

2. 右键 → 上传DB Schema

3. HBuilderX 会自动：
   - 创建 wiki_entries 集合
   - 上传 Schema 定义
   - 配置权限

4. 等待"上传成功"提示
```

---

### 方法2：通过 Web 控制台创建

```bash
1. 打开 uniCloud Web控制台
   https://unicloud.dcloud.net.cn

2. 选择云服务空间

3. 云数据库 → 新建集合

4. 填写：
   集合名称：wiki_entries
   
5. 点击"创建"

6. 创建成功后，进入集合

7. 点击"DB Schema"标签

8. 点击"导入Schema"

9. 打开本地文件：
   botc-admin/uniCloud-aliyun/database/wiki_entries.schema.json

10. 复制全部内容

11. 粘贴到Schema编辑器

12. 点击"保存"
```

---

## 🔄 创建后立即测试

### 测试步骤：

```bash
1. 刷新管理后台（Ctrl + F5）

2. 进入"百科同步"

3. 在"单个同步"输入：
   https://clocktower-wiki.gstonegames.com/index.php?title=洗衣妇

4. 点击"同步"

5. 等待完成

6. 查看结果
```

---

## ✅ 验证数据是否保存

### 检查1：在数据库中查看

```bash
1. uniCloud Web控制台
2. 云数据库 → wiki_entries
3. 应该能看到数据记录
4. 点击查看详情，确认内容正确
```

### 检查2：在管理后台查看

```bash
1. 刷新管理后台
2. 进入"百科管理"
3. 应该能看到词条列表
4. 显示"洗衣妇"或其他同步的词条 ✅
```

---

## 📊 集合创建清单

请确保以下集合都已创建：

| 集合名称 | 用途 | 状态 | Schema文件 |
|---------|------|------|-----------|
| wiki_entries | 百科词条 | ❌ 需创建 | botc-admin/database/wiki_entries.schema.json |
| wiki_sync_logs | 同步日志 | ✅ 已存在 | botc-admin/database/wiki_sync_logs.schema.json |
| wiki_favorites | 用户收藏 | ❓ 检查 | botc-miniprogram/database/wiki_favorites.schema.json |
| wiki_search_history | 搜索历史 | ❓ 检查 | botc-miniprogram/database/wiki_search_history.schema.json |

---

## 🎯 快速操作指南

### 最快的方法（1分钟）：

```bash
1. HBuilderX → botc-admin 项目
2. 找到 database/wiki_entries.schema.json
3. 右键 → 上传DB Schema
4. 等待成功 ✅
5. 刷新管理后台
6. 重新测试同步
```

---

## 💡 为什么 wiki_sync_logs 有数据？

```
因为云函数在开始时先创建了同步日志记录
但同步词条时，发现 wiki_entries 集合不存在
导致词条数据保存失败
但云函数没有抛出错误，所以显示"同步成功"
```

---

## 🔧 云函数改进建议

我可以改进云函数，让它：
1. 检查集合是否存在
2. 如果不存在，自动创建
3. 或者给出明确的错误提示

需要我优化吗？

---

## 🎊 总结

**问题根源**：wiki_entries 集合不存在

**解决方法**：
1. 上传 wiki_entries.schema.json
2. 或在Web控制台手动创建集合
3. 重新测试同步

---

现在请：
1. ✅ 上传 wiki_entries.schema.json
2. ✅ 重新测试同步
3. ✅ 告诉我数据库中是否有数据

我在等您的反馈！🚀

