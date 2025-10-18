# 🔧 云对象调用问题修复

## 🐛 错误

```
Method name is required
```

## 🔍 原因

云对象（index.obj.js）的调用方式有问题。

---

## ✅ 解决方案

### 方法1：改回云函数方式（最简单）

把 `wiki-admin-sync-single` 改回普通云函数方式。

#### 操作：

```bash
1. 删除文件：
   botc-admin/uniCloud-aliyun/cloudfunctions/wiki-admin-sync-single/index.obj.js

2. 创建文件：
   botc-admin/uniCloud-aliyun/cloudfunctions/wiki-admin-sync-single/index.js

3. 使用普通云函数方式
```

我现在帮您创建一个标准云函数版本！

---

**修复方案**: 改为普通云函数
**状态**: 正在修复

