# ✅ 云函数文件冲突问题解决

## 🐛 错误信息

```
云函数目录下index.js和index.obj.js不可同时存在
```

## 🔍 原因

`wiki-admin-sync-single` 目录下同时存在：
- ❌ index.js（旧文件）
- ✅ index.obj.js（新文件）

uniCloud 规定一个云函数只能有一个入口文件。

---

## ✅ 已解决

我已经删除了 `index.js`，只保留 `index.obj.js`。

---

## 🚀 立即操作

### Step 1: 重新上传云函数

```bash
在 HBuilderX 中：

右键 wiki-admin-sync-single → 上传部署
```

现在应该能成功上传了！

### Step 2: 测试同步

```bash
1. 刷新管理后台
2. 在"单个同步"输入：
   https://clocktower-wiki.gstonegames.com/index.php?title=洗衣妇
3. 点击"同步"
4. 应该成功！✅
```

---

## 📝 云对象 vs 云函数

### 云函数方式（index.js）
```javascript
exports.main = async (event, context) => {
  // ...
}
```

### 云对象方式（index.obj.js）
```javascript
module.exports = {
  async syncPage(url) {
    // ...
  }
}
```

**调用方式也不同**：
```javascript
// 云函数调用
await uniCloud.callFunction({ name: 'xxx', data: {} })

// 云对象调用
const obj = uniCloud.importObject('xxx');
await obj.syncPage(url);
```

---

## ✅ 现在的文件结构

```
wiki-admin-sync-single/
├── index.obj.js ✅ （云对象入口文件）
└── package.json ✅
```

---

**问题**: 文件冲突  
**解决**: 删除index.js  
**状态**: ✅ 已解决

