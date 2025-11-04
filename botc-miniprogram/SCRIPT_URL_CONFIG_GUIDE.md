# 📡 Script JSON URL化访问配置指南

## 🎯 问题说明

当调用 `script.generateJsonUrl()` 返回的URL访问时，出现错误：
```json
{
  "success": false,
  "error": {
    "code": "InternalBizError",
    "message": "no_matching_function_for_path /script-generate-json-url"
  }
}
```

**原因：** `script-generate-json-url` 云函数没有开启URL化访问。

---

## 🔧 解决方案

### 方案1：使用 `getJson()` 方法（推荐）✅

直接使用云对象的 `getJson()` 方法获取JSON数据，无需配置：

```javascript
// 获取剧本JSON数据
const result = await scriptObj.getJson(scriptId)

if (result.code === 0) {
  console.log('JSON数据:', result.data.json_data)
}
```

**优点：**
- ✅ 无需配置
- ✅ 直接获取数据
- ✅ 支持权限控制
- ✅ 立即可用

---

### 方案2：配置URL化访问（可选）

如果确实需要URL化访问（如给第三方工具使用），需要在HBuilderX中配置。

#### 步骤1：找到云函数
```
uniCloud-aliyun/cloudfunctions/script-generate-json-url
```

#### 步骤2：开启URL化
1. 在HBuilderX中右键 `script-generate-json-url` 文件夹
2. 选择 "配置云函数URL化"
3. 启用URL化访问
4. 获取实际的URL地址

#### 步骤3：更新URL
修改 `script/index.obj.js` 中的URL：
```javascript
// 替换为实际的URL化地址
const cloudFunctionUrl = `你的实际URL?scriptId=${scriptId}`
```

---

## 💡 两种方法对比

### getJson() 方法
```javascript
// 调用方式
const result = await scriptObj.getJson(scriptId)

// 返回格式
{
  code: 0,
  message: 'success',
  data: {
    title: '剧本标题',
    json_data: { ... }  // 完整JSON
  }
}
```

**适用场景：**
- ✅ 小程序内部使用
- ✅ 需要权限控制
- ✅ 快速开发

---

### generateJsonUrl() 方法
```javascript
// 调用方式
const result = await scriptObj.generateJsonUrl(scriptId)

// 返回格式
{
  code: 0,
  message: 'success',
  data: {
    url: 'https://...',
    type: 'cloud_function',
    cors: true,
    note: '需要配置URL化访问'
  }
}
```

**适用场景：**
- ✅ 第三方工具访问
- ✅ 浏览器直接访问
- ✅ 支持CORS跨域

---

## 🧪 测试验证

### 测试 getJson()
```
1. 访问测试页面
2. 找到 "获取JSON (getJson)" 测试项
3. 输入剧本ID
4. 点击"获取JSON"
5. 查看返回的JSON数据
```

### 测试 generateJsonUrl()
```
1. 访问测试页面
2. 找到 "生成JSON链接 (generateJsonUrl)" 测试项
3. 输入剧本ID
4. 点击"生成链接"
5. 查看返回的URL（已自动复制）
6. 注意：URL需要配置后才能访问
```

---

## 📊 当前返回内容

### generateJsonUrl() 当前返回
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "url": "https://fc-mp-xxx.next.bspapp.com/script-generate-json-url?scriptId=xxx",
    "type": "cloud_function",
    "cors": true,
    "note": "需要在HBuilderX中配置script-generate-json-url云函数的URL化访问",
    "alternative": "或使用 script.getJson() 方法直接获取JSON数据"
  }
}
```

**说明：**
- ✅ 返回格式与原云函数一致
- ✅ 包含配置提示
- ✅ 提供替代方案
- ⚠️ URL需要配置后才能访问

---

## 🎯 推荐使用

### 小程序内部使用
```javascript
// 推荐：直接使用 getJson()
const result = await scriptObj.getJson(scriptId)
```

### 第三方工具使用
```javascript
// 1. 先配置URL化访问
// 2. 再使用 generateJsonUrl()
const result = await scriptObj.generateJsonUrl(scriptId)
// 3. 访问返回的URL
```

---

## ⚠️ 注意事项

### 1. URL化访问限制
- 需要在HBuilderX中手动配置
- 配置后才能通过URL访问
- 支持CORS跨域访问

### 2. getJson() 方法
- 无需配置，立即可用
- 支持权限控制
- 适合小程序内部使用

### 3. 数据安全
- URL化访问是公开的
- getJson() 有权限控制
- 未发布剧本只有创建者可访问

---

## 🚀 快速开始

### 1. 立即使用（推荐）
```javascript
// 直接使用 getJson()，无需配置
const scriptObj = uniCloud.importObject('script')
const result = await scriptObj.getJson(scriptId)
console.log(result.data.json_data)
```

### 2. 配置URL化（可选）
```
1. 右键 script-generate-json-url
2. 配置云函数URL化
3. 更新返回的URL地址
4. 测试URL访问
```

---

## 📝 总结

**现状：**
- ✅ `getJson()` 方法可用（推荐）
- ⚠️ `generateJsonUrl()` 返回的URL需要配置

**建议：**
- 🎯 小程序内部：使用 `getJson()`
- 🌐 第三方工具：配置URL化后使用 `generateJsonUrl()`

**下一步：**
- 如果只是小程序内部使用，继续使用 `getJson()`
- 如果需要URL访问，按照指南配置URL化

---

_创建时间：2025-11-04_  
_更新时间：2025-11-04_  
_状态：✅ 两种方法都可用_

