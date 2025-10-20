# 剧本JSON链接功能 - 使用指南

## 🎯 功能说明

在剧本详情页添加了"生成JSON链接"功能，可以生成一个HTTP URL，在浏览器中打开后**直接显示**JSON内容，而不是触发下载。

---

## 📦 新增文件

### 云函数（1个）
```
botc-miniprogram/uniCloud-aliyun/cloudfunctions/
└── script-json-get/
    ├── index.js
    └── package.json
```

### 前端修改
```
botc-miniprogram/pages/script/detail/detail.vue
- 新增 generateJsonUrl() 方法
- 新增 generatingUrl, copiedUrl 状态
```

---

## 🚀 部署步骤

### 1. 上传云函数
```bash
右键 script-json-get → 上传部署
```

### 2. 配置HTTP访问（重要）
在uniCloud控制台：
1. 进入"云函数" → `script-json-get`
2. 点击"详情" → "HTTP访问"
3. 启用HTTP访问
4. 路径设为：`/http/script-json-get`

### 3. 运行测试
运行小程序，测试生成JSON链接功能

---

## 💡 使用说明

### 生成JSON链接
1. 打开剧本详情页
2. 点击"🔗 生成JSON链接"
3. 链接自动复制到剪贴板
4. 弹窗显示完整URL
5. 在浏览器地址栏粘贴打开
6. 浏览器直接显示JSON内容（格式化）

### URL格式
```
https://空间ID.bja.bspapp.com/http/script-json-get?script_id=剧本ID
```

例如：
```
https://mp-1e0f6630-18c8-400c-99ff-761aea3a4e83.bja.bspapp.com/http/script-json-get?script_id=68e9fe48149854abcbbf2e7d
```

---

## 🔧 技术实现

### 云函数
```javascript
exports.main = async (event, context) => {
  // 查询剧本json_data
  const script = await db.collection('opendb-botc-scripts')
    .doc(script_id)
    .get();
  
  // 返回JSON，设置正确的响应头
  return {
    mpserverlessComposedResponse: true,
    statusCode: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': 'inline',  // 关键：让浏览器显示而不是下载
      'access-control-allow-origin': '*'
    },
    body: JSON.stringify(script.json_data, null, 2)
  };
};
```

### 关键点
- ✅ `content-disposition: inline` - 浏览器直接显示
- ✅ `content-type: application/json` - JSON格式
- ✅ 格式化输出（`JSON.stringify(..., null, 2)`）
- ✅ CORS支持

---

## 📊 对比

### 云存储URL（会下载）
```
https://xxx.cdn.bspapp.com/cloudstorage/xxx.json
↓
浏览器触发下载 ❌
```

### 云函数URL（直接显示）
```
https://xxx.bja.bspapp.com/http/script-json-get?script_id=xxx
↓
浏览器直接显示JSON ✅
```

---

## ✅ 功能对比

| 功能 | 生成JSON链接 | 下载JSON文件 |
|------|-------------|-------------|
| 按钮 | 🔗 生成JSON链接 | 💾 下载JSON文件 |
| 结果 | HTTP URL | 本地.json文件 |
| 浏览器 | 直接显示 | 下载文件 |
| 分享 | 可分享URL | 可分享文件 |
| 速度 | 即时生成 | 需要处理 |

---

## 🎉 完成！

现在用户可以：
1. ✅ 生成可在浏览器查看的JSON链接
2. ✅ 下载JSON文件到本地
3. ✅ 两种方式都支持完整JSON内容

部署 `script-json-get` 云函数并启用HTTP访问即可！

