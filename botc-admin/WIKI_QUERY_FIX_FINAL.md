# 🔧 数据库查询问题最终修复

## 🐛 错误

```
Cannot read properties of undefined (reading 'length')
```

## 🔍 原因

查询返回的数据结构不是预期的格式。可能是：
1. 返回的是 `res.result.data` 而不是 `res.data`
2. 或者查询方式需要调整

---

## ✅ 正确的查询方式

### 在浏览器控制台测试（请执行）：

```javascript
const db = uniCloud.database();
db.collection('wiki_entries').get().then(res => {
  console.log('完整返回:', res);
  console.log('res.result:', res.result);
  console.log('res.data:', res.data);
  
  // 尝试不同的数据路径
  const data = res.result?.data || res.data || [];
  console.log('实际数据:', data);
  
  if (data && data.length > 0) {
    alert('成功！共' + data.length + '条\n第一条: ' + data[0].title);
  } else {
    alert('数据为空或格式错误\n请查看控制台输出');
  }
}).catch(err => {
  console.error('错误:', err);
  alert('失败: ' + err.message);
});
```

**请运行这个，然后告诉我控制台输出什么！**

---

## 🔧 修复页面代码

根据数据结构，我需要修复 list.vue 和 sync.vue 的查询代码。

请告诉我上面代码的输出结果，我会立即修复！

---

**等待您的反馈**: 控制台输出的 res 结构

