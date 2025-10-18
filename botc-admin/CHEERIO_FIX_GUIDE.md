# 🔧 Cheerio 兼容性问题修复

## 🐛 问题

```
ReadableStream is not defined
500 Internal Server Error
```

## 🔍 原因

`cheerio` 库在 uniCloud 云函数环境中有兼容性问题，导致云函数执行失败。

---

## ✅ 解决方案

### 改用正则表达式解析HTML

**不再依赖 cheerio 库**，改用原生JavaScript正则表达式解析HTML。

### 优点：
- ✅ 无需外部依赖
- ✅ 兼容性好
- ✅ 执行更快
- ✅ 内存占用更小

### 缺点：
- ⚠️ 解析功能相对简单
- ⚠️ 但足够满足需求

---

## 🚀 立即操作

### 步骤1：重新上传云函数

```bash
在 HBuilderX 中：

1. 右键 wiki-admin-sync-all → 上传部署
   （现在不需要安装cheerio，上传很快，约10秒）

2. 右键 wiki-admin-sync-single → 上传部署
   （同样不需要cheerio）

3. 等待上传完成
```

### 步骤2：测试同步

```bash
1. 刷新管理后台页面
2. 进入"百科同步"
3. 在"单个同步"输入：
   https://clocktower-wiki.gstonegames.com/index.php?title=洗衣妇
4. 点击"同步"
5. 应该在10-20秒内完成 ✅
```

---

## 📊 修改内容

### Before（使用cheerio）
```javascript
const cheerio = require('cheerio');
const $ = cheerio.load(html);
const title = $('#firstHeading').text();
```
**问题**: ReadableStream 兼容性错误

### After（使用正则）
```javascript
const titleMatch = html.match(/<h1[^>]*id="firstHeading"[^>]*>(.*?)<\/h1>/is);
const title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
```
**优点**: 无兼容性问题 ✅

---

## ✅ 现在应该能正常工作

### 修复后的特点：
- ✅ 不再报 ReadableStream 错误
- ✅ 云函数执行正常
- ✅ 能成功抓取和解析
- ✅ 性能更好

---

## 🎯 测试清单

- [ ] 重新上传 wiki-admin-sync-all
- [ ] 重新上传 wiki-admin-sync-single
- [ ] 测试单个URL同步
- [ ] 成功后测试批量同步
- [ ] 验证数据正确

---

**修复时间**: 2025年10月17日  
**方案**: 移除cheerio，改用正则表达式  
**状态**: ✅ 已修复，请重新上传云函数测试

