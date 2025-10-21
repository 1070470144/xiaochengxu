# 🔧 编辑剧本保存错误修复

## 🐛 问题

编辑剧本时点击保存报错：
```
保存失败：不能更新_id的值
```

---

## ✅ 原因

在编辑模式下，`loadData()` 方法从数据库查询数据后：

```javascript
this.formData = {
  ...this.formData,
  ...res.result.data[0]  // 包含了 _id 字段
}
```

然后保存时：
```javascript
const data = { ...this.formData }  // data中包含_id
await db.collection('botc-scripts').doc(this.scriptId).update(data)
```

MongoDB **不允许更新 _id 字段**，所以报错。

---

## ✅ 修复方案

在更新数据前，删除 `_id` 字段：

```javascript
if (this.isEdit) {
  // 更新时需要移除_id字段（不能更新_id）
  const updateData = { ...data }
  delete updateData._id
  
  await db.collection('botc-scripts')
    .doc(this.scriptId)
    .update(updateData)
}
```

---

## 🎯 修复位置

**文件**：`botc-admin/pages/botc/script/edit.vue`  
**位置**：第608-615行

---

## 🧪 测试

### 编辑剧本测试：
```bash
1. 进入剧本列表
2. 点击任意剧本的「编辑」按钮
3. 修改任意字段（如标题）
4. 点击「保存」
5. ✅ 应该保存成功，不再报错
```

---

## ✅ 完成

- [x] 问题诊断
- [x] 代码修复
- [x] 文档说明

---

**状态**: ✅ 已修复

