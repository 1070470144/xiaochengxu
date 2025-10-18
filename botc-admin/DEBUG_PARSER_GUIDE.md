# 🔍 解析功能调试指南

## 🐛 问题

- 文件都存在
- 云函数已上传
- 但 role_detail 不存在（解析未执行）

## 🔍 可能原因

1. **parser-utils.js 未被正确引用**
2. **require 路径错误**
3. **解析函数执行失败但被静默忽略**

---

## ✅ 修复方案

我已经在代码中添加了详细的调试日志。

### 现在请操作：

#### Step 1: 重新上传云函数

```bash
HBuilderX botc-admin：

1. 右键 wiki-admin-sync-single → 上传部署
2. 等待成功
```

#### Step 2: 删除旧数据

```bash
uniCloud控制台 → wiki_entries → 删除"洗衣妇"
```

#### Step 3: 重新同步并查看日志

```bash
1. 管理后台 → 百科同步

2. 单个同步：
   https://clocktower-wiki.gstonegames.com/index.php?title=洗衣妇

3. 点击"同步"

4. 立即去 HBuilderX 查看云函数日志：
   右键 wiki-admin-sync-single → 云函数日志

5. 查找以下日志：
   - [sync] parserUtils存在: true/false
   - [sync] parseRoleDetail函数存在: true/false
   - [sync] 详细解析完成
   - [sync] role_detail结果: {...}
   - [sync] 最终数据包含role_detail: true/false
```

---

## 📝 根据日志判断

### 情况1：parserUtils存在: false
**说明**：parser-utils.js 没有被正确引入

**解决**：
1. 检查文件路径
2. 确认 require 路径正确
3. 重新上传云函数

### 情况2：parseRoleDetail函数存在: false
**说明**：parser-utils.js 文件有问题

**解决**：
1. 检查 parser-utils.js 的 module.exports
2. 确认导出了 parseRoleDetail 函数

### 情况3：详细解析失败
**说明**：解析函数执行时报错

**解决**：
1. 查看错误信息
2. 修复解析逻辑

---

## 🎯 请现在执行

1. ✅ 重新上传 wiki-admin-sync-single
2. ✅ 删除"洗衣妇"数据
3. ✅ 重新同步
4. ✅ **立即查看云函数日志**
5. ✅ 把日志内容发给我

**日志会告诉我们问题在哪！** 🔧

---

**调试版本**: v2.1.1  
**添加内容**: 详细的调试日志

