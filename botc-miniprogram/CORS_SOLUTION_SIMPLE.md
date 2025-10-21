# 🔗 解决CORS问题 - 简单方案

## ✅ 最终方案

使用**一个云函数**同时支持：
1. **小程序调用**：返回可访问的URL
2. **HTTP直接访问**：返回JSON内容 + CORS响应头

---

## 📦 部署步骤

### 步骤1：上传云函数

```bash
在 HBuilderX 中：
1. 右键：uniCloud-aliyun/cloudfunctions/script-generate-json-url
2. 选择：「上传部署」
3. 等待上传成功
```

### 步骤2：开启云函数URL化 ⭐ 重要

```bash
1. 登录 uniCloud Web控制台
   https://unicloud.dcloud.net.cn

2. 选择服务空间
   mp-1e0f6630-18c8-400c-99ff-761aea3a4e83

3. 进入「云函数/云对象」

4. 找到 script-generate-json-url

5. 点击「详情」

6. 找到「云函数URL化」并点击「编辑」

7. 配置：
   - 路径：/script-generate-json-url
   - 启用：是
   - 鉴权：否（公开访问）
   
8. 保存

9. 记录显示的URL地址（重要！）
   例如：https://fc-mp-xxx.next.bspapp.com/script-generate-json-url
```

### 步骤3：更新前端代码中的URL

如果你在控制台看到的URL **不是** `https://fc-mp-1e0f6630-18c8-400c-99ff-761aea3a4e83.next.bspapp.com/script-generate-json-url`

则需要修改云函数代码第144行：

打开文件：`uniCloud-aliyun/cloudfunctions/script-generate-json-url/index.js`

找到第144行，改成你看到的实际URL：

```javascript
// 第144行
const cloudFunctionUrl = `你的实际URL?scriptId=${scriptId}`
```

然后重新上传云函数。

---

## 🧪 测试步骤

### 测试1：小程序端

```bash
1. 刷新小程序
2. 进入剧本详情页
3. 点击「🔗 复制JSON链接」
4. 应该立即复制成功
5. 复制的URL格式：
   https://fc-mp-xxx.next.bspapp.com/script-generate-json-url?scriptId=xxx
```

### 测试2：浏览器直接访问

```bash
1. 复制的URL粘贴到浏览器
2. 应该直接显示JSON内容
3. 格式化显示
4. 不报错
```

### 测试3：血染工具导入

```bash
1. 打开 https://botcgrimoire.top
2. 点击「导入URL」
3. 粘贴复制的URL
4. 应该成功导入
5. ✅ 不再有CORS错误
```

---

## 🎯 工作原理

### 双模式设计

```
┌─────────────────────────────────────┐
│   script-generate-json-url 云函数    │
│                                     │
│   判断请求类型：                      │
│   ├─ HTTP请求（浏览器/工具访问）       │
│   │  └─ 返回JSON内容 + CORS响应头    │
│   │                                 │
│   └─ 云函数调用（小程序调用）          │
│      └─ 返回云函数URL地址            │
└─────────────────────────────────────┘
```

### URL格式

```
https://fc-mp-xxx.next.bspapp.com/script-generate-json-url?scriptId=剧本ID
```

这个URL：
- ✅ 可以在浏览器直接打开
- ✅ 支持CORS跨域访问
- ✅ 可以在血染工具中使用
- ✅ 永久有效（不会过期）

---

## 📊 优势

| 特性 | 云存储URL ❌ | 云函数URL ✅ |
|------|------------|-------------|
| CORS支持 | 不支持 | 完美支持 |
| 有效期 | 7天 | 永久 |
| 配置难度 | 需配置存储 | 只需开启URL化 |
| 成本 | 存储费用 | 云函数费用 |
| 血染工具 | 无法使用 | 可以使用 |

---

## 🐛 问题排查

### 问题1：URL无法访问

**解决**：
1. 确认云函数已上传
2. 确认URL化已开启
3. 检查URL地址是否正确

### 问题2：仍然有CORS错误

**解决**：
1. 等待1-2分钟（云函数更新需要时间）
2. 查看云函数日志确认新版本已生效
3. 确认返回了CORS响应头

### 问题3：返回404

**解决**：
1. 检查URL路径配置（/script-generate-json-url）
2. 确认URL化已启用
3. 重新上传云函数

---

## ✅ 完成清单

- [ ] script-generate-json-url 云函数已上传
- [ ] 云函数URL化已开启
- [ ] URL地址已记录
- [ ] 小程序可以复制URL
- [ ] 浏览器可以访问URL
- [ ] 血染工具可以导入URL
- [ ] 不再有CORS错误

---

## 📞 需要帮助？

1. **查看云函数日志**
   ```
   uniCloud控制台 → 云函数 → script-generate-json-url → 日志
   ```

2. **测试HTTP访问**
   ```
   直接在浏览器访问：
   https://你的URL/script-generate-json-url?scriptId=你的剧本ID
   ```

3. **查看返回内容**
   ```
   应该直接显示JSON，不是HTML页面
   ```

---

**关键点**：
1. 必须开启云函数URL化
2. 必须设置为公开访问（无需鉴权）
3. URL地址必须正确

**现在就去开启云函数URL化吧！** 🚀

