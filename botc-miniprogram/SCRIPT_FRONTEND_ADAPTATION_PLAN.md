# 📱 Script 前端适配计划

## 📋 需要适配的页面

### 1. 剧本详情页 ⭐⭐⭐
**文件：** `pages/script/detail/detail.vue`
**使用的云函数：**
- `script-detail` → `script.getDetail()`
- `script-generate-json-url` → `script.generateJsonUrl()`
- `script-download` → 暂不替换（下载功能）
- `script-rating` (2处) → `script.rate()`

---

### 2. 我的上传页 ⭐⭐⭐
**文件：** `pages/user/my-uploads/my-uploads.vue`
**使用的云函数：**
- `script-my-uploads` → `script.getMyUploads()`
- `script-delete` → `script.delete()`

---

### 3. 上传剧本页 ⭐⭐⭐
**文件：** `pages/tools/upload-json/upload-json.vue`
**使用的云函数：**
- `script-upload` → `script.upload()`

---

### 4. 拼车创建页 ⭐
**文件：** `pages/carpool/create/create.vue`
**使用的云函数：**
- `script-list` → `script.getList()`

---

### 5. 我的评分页 ⭐
**文件：** `pages/user/my-ratings/my-ratings.vue`
**使用的云函数：**
- `script-rating` → `script.rate()`

---

## 🎯 适配优先级

### 高优先级（核心功能）✅
1. **剧本详情页** - 最重要的页面
2. **我的上传页** - 用户核心功能
3. **上传剧本页** - 用户核心功能

### 中优先级 ⏸
4. 拼车创建页 - 次要功能
5. 我的评分页 - 次要功能

---

## 📊 方法映射表

| 旧云函数 | 新云对象方法 | 参数变化 |
|---------|------------|---------|
| `script-detail` | `script.getDetail(scriptId)` | 简化 |
| `script-my-uploads` | `script.getMyUploads(page, pageSize)` | 简化 |
| `script-delete` | `script.delete(scriptId)` | 简化 |
| `script-upload` | `script.upload(data)` | 保持 |
| `script-list` | `script.getList(options)` | 简化 |
| `script-rating` | `script.rate(scriptId, rating, comment)` | 简化 |
| `script-generate-json-url` | `script.generateJsonUrl(scriptId)` | 简化 |

---

## 🔧 适配模式

### 旧方式（云函数）
```javascript
const result = await uniCloud.callFunction({
  name: 'script-detail',
  data: {
    scriptId: this.scriptId,
    token: uni.getStorageSync('token')
  }
})
```

### 新方式（云对象）
```javascript
const scriptObj = uniCloud.importObject('script')
const result = await scriptObj.getDetail(this.scriptId)
```

---

## 📝 适配步骤

### 每个页面的适配步骤：

1. **导入云对象**
```javascript
// 在页面的 data 或 onLoad 中
this.scriptObj = uniCloud.importObject('script', {
  customUI: true
})
```

2. **替换调用方式**
```javascript
// 旧: uniCloud.callFunction({ name: 'script-detail', data: {...} })
// 新: await this.scriptObj.getDetail(scriptId)
```

3. **调整错误处理**
```javascript
// 旧: if (res.result.code === 0)
// 新: if (result.code === 0)
```

4. **测试验证**
- 功能正常
- 数据正确
- 错误处理有效

---

## ⏱ 预计时间

| 页面 | 预计时间 | 优先级 |
|-----|---------|--------|
| 剧本详情页 | 30分钟 | ⭐⭐⭐ |
| 我的上传页 | 20分钟 | ⭐⭐⭐ |
| 上传剧本页 | 20分钟 | ⭐⭐⭐ |
| 拼车创建页 | 10分钟 | ⭐ |
| 我的评分页 | 10分钟 | ⭐ |
| **总计** | **90分钟** | |

---

## 🎯 开始顺序

1. ✅ 剧本详情页（最复杂，最重要）
2. ✅ 我的上传页（高频使用）
3. ✅ 上传剧本页（核心功能）
4. ⏸ 拼车创建页
5. ⏸ 我的评分页

---

## 📊 当前进度

- [ ] 1. 剧本详情页 (0%)
- [ ] 2. 我的上传页 (0%)
- [ ] 3. 上传剧本页 (0%)
- [ ] 4. 拼车创建页 (0%)
- [ ] 5. 我的评分页 (0%)

**总进度：0/5 (0%)**

---

_创建时间：2025-11-04_  
_状态：准备开始_  
_下一步：开始适配剧本详情页_

