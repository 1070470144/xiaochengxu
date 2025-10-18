# 🔧 最终调试步骤

## 🎯 操作清单

### 1. 重新上传云函数

```bash
HBuilderX botc-admin 项目：

右键 wiki-admin-sync-single → 上传部署

等待"上传成功"
```

### 2. 删除旧数据

```bash
uniCloud Web控制台：
云数据库 → wiki_entries → 找到"洗衣妇" → 删除
```

### 3. 重新同步

```bash
管理后台 → 百科同步 → 单个同步：
https://clocktower-wiki.gstonegames.com/index.php?title=洗衣妇

点击"同步"
```

### 4. 立即查看云函数日志

```bash
HBuilderX：
右键 wiki-admin-sync-single → 云函数日志

查找以下关键日志：
✅ [sync] parserUtils存在: true
✅ [sync] parseRoleDetail函数存在: function
✅ [sync] 详细解析完成
✅ [sync] background_story: true
✅ [sync] ability: true
✅ [sync] 最终数据包含role_detail: true
```

### 5. 把日志发给我

复制云函数日志中的内容，特别是：
- parserUtils存在吗？
- parseRoleDetail函数存在吗？
- 有错误吗？

---

## 📝 日志示例

**成功的日志应该是：**
```
[sync] HTML长度: 123456
[sync] 提取到标题: 洗衣妇
[sync] 内容长度: 5678
[sync] 开始详细解析
[sync] parserUtils存在: true
[sync] parseRoleDetail函数存在: function
[parseRoleDetail] 开始详细解析
[parseRoleDetail] 解析完成
- 背景故事: ✓
- 角色能力: ✓
- 角色简介: 3 段
[sync] 详细解析完成
[sync] background_story: true
[sync] ability: true
[sync] 最终数据包含role_detail: true
[sync] 新增成功
```

**失败的日志可能是：**
```
[sync] parserUtils存在: false  ← 问题在这
或
[sync] 详细解析失败: Error: ...  ← 问题在这
```

---

## 🎯 现在请

1. ✅ 上传云函数
2. ✅ 删除旧数据
3. ✅ 重新同步
4. ✅ **查看云函数日志并发给我**

日志会告诉我们问题所在！🔧

