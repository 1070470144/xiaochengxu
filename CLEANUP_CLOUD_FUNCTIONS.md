# 云函数清理指南

## ⚠️ 云函数数量已达上限

需要删除不再使用的云函数以释放空间。

---

## 🗑️ 可以删除的云函数

### Wiki相关（旧版本，已废弃）
以下云函数在v2.2+版本中已不再使用，可以安全删除：

1. **wiki-check-favorite** ✅ 空文件夹
2. **wiki-recent-imports** ✅ 空文件夹  
3. **wiki-toggle-favorite** ✅ 空文件夹
4. **wiki-parse-url** ❌ 不再使用（改为管理端同步）
5. **wiki-search** ❌ 不再使用（改为直接查询数据库）
6. **wiki-categories** ❌ 不再使用
7. **wiki-list** ❌ 不再使用（直接查询数据库）
8. **wiki-detail** ❌ 不再使用（直接查询数据库）

### 其他可能不用的
9. **chat-conversations** ❓ 如果聊天功能不用，可删除
10. **chat-mark-read** ❓
11. **chat-send** ❓
12. **chat-send-message** ❓ （与chat-send重复？）

---

## ✅ 需要保留的Wiki云函数

### v3.0 新增（必须保留）
- **wiki-role-toggle-like** ✅ 点赞功能
- **wiki-role-comment-add** ✅ 发表评论
- **wiki-role-comment-list** ✅ 评论列表
- **wiki-ranking-storytellers** ✅ 说书人榜单

---

## 📝 删除步骤

### 方式1: 在HBuilderX中删除（推荐）

1. **右键云函数文件夹**
2. 选择 **"从云端删除"**
3. 确认删除
4. 等待删除成功

**建议删除顺序**（从空文件夹开始）：
```
1. wiki-check-favorite      （空文件夹）
2. wiki-recent-imports      （空文件夹）
3. wiki-toggle-favorite     （空文件夹）
4. wiki-parse-url          （不再使用）
5. wiki-search             （不再使用）
6. wiki-categories         （不再使用）
7. wiki-list               （不再使用）
8. wiki-detail             （不再使用）
```

### 方式2: 在uniCloud控制台删除

1. 登录 uniCloud Web控制台
2. 进入"云函数/云对象"
3. 找到上述云函数
4. 点击"删除"
5. 确认删除

---

## ⚡ 快速清理方案

### 立即删除这8个云函数：

```
✅ wiki-check-favorite      - 空文件夹
✅ wiki-recent-imports      - 空文件夹
✅ wiki-toggle-favorite     - 空文件夹
✅ wiki-parse-url          - 旧版导入功能
✅ wiki-search             - 已改为直接查询
✅ wiki-categories         - 不再使用
✅ wiki-list               - 直接查询数据库
✅ wiki-detail             - 直接查询数据库
```

删除后即可腾出8个云函数空间！

---

## 🔍 如何判断云函数是否还在使用

### 搜索代码引用

在项目中搜索云函数名称，例如：

```
搜索: "wiki-parse-url"
搜索: "wiki-search"
```

如果没有任何引用，说明已经不用了，可以安全删除。

---

## ⚠️ 注意事项

### 删除前确认
- 先在控制台查看云函数的调用记录
- 如果最近30天没有调用，可以删除
- 删除云端后，本地文件夹也可以删除

### 删除后
- 本地也删除对应文件夹
- 避免误上传

---

## 🎯 清理后的云函数结构

### Wiki相关（v3.0）
```
✅ wiki-role-toggle-like        - 点赞
✅ wiki-role-comment-add        - 评论
✅ wiki-role-comment-list       - 评论列表
✅ wiki-ranking-storytellers    - 榜单
```

### 其他保留
```
✅ script-* (剧本相关)
✅ carpool-* (拼车相关)
✅ post-* (社区相关)
✅ user-* (用户相关)
✅ favorite-* (收藏相关)
✅ history-* (历史相关)
... 等等
```

---

## 🚀 清理完成后

1. 重新上传新的云函数
2. 测试功能是否正常
3. 如果有报错，检查是否误删

---

**建议**: 先删除空文件夹（3个），再删除不用的（5个），一共释放8个云函数空间！

