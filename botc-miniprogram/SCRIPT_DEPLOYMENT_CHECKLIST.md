# ✅ Script 云对象部署清单

## 📋 部署前检查

### 1. 云对象文件检查 ✅
- [x] `uniCloud-aliyun/cloudfunctions/script/index.obj.js` - 1338 行，包含 14 个方法
- [x] `uniCloud-aliyun/cloudfunctions/script/package.json` - 依赖配置
- [x] `uniCloud-aliyun/cloudfunctions/script/preview-generator.js` - SVG 预览生成器

### 2. 前端页面检查 ✅
- [x] `pages/script/detail/detail.vue` - 剧本详情页（已适配）
- [x] `pages/user/my-uploads/my-uploads.vue` - 我的上传页（已适配）
- [x] `pages/tools/upload-json/upload-json.vue` - 上传剧本页（已适配）
- [x] `pages/carpool/create/create.vue` - 拼车创建页（已适配）
- [x] `pages/test/script-test.vue` - 测试页面

### 3. 测试页面检查 ✅
- [x] 测试页面可访问
- [x] 所有 14 个方法都有测试按钮
- [x] 测试结果展示正常
- [x] 错误处理有效

---

## 🚀 部署步骤

### 步骤 1: 上传云对象到云端

#### 在 HBuilderX 中操作
```bash
1. 找到 uniCloud-aliyun/cloudfunctions/script 文件夹
2. 右键点击 script 文件夹
3. 选择"上传云函数"
4. 等待上传完成（看到"上传成功"提示）
5. ⚠️ 等待 1-2 分钟让云端更新缓存
```

#### 验证上传成功
```bash
1. 打开 uniCloud Web 控制台
2. 进入"云函数/云对象"
3. 查看"script"是否显示为"云对象"类型
4. 检查最后更新时间是否是刚刚
```

---

### 步骤 2: 配置 URL 化访问（可选）

**如果需要外部访问 `generateJsonUrl` 方法：**

#### 方法 A: HBuilderX 配置
```bash
1. 右键 script-generate-json-url 云函数
2. 选择"云函数URL化"
3. 在"PATH部分"输入: /script-generate-json-url
4. 点击"确定"
```

#### 方法 B: Web 控制台配置
```bash
1. 打开 uniCloud Web 控制台
2. 进入"云函数/云对象" → "云函数"
3. 找到 script-generate-json-url
4. 点击"详情" → "URL化"
5. 配置路径: /script-generate-json-url
6. 保存
```

**配置后的 URL：**
```
https://fc-mp-1e0f6630-18c8-400c-99ff-761aea3a4e83.next.bspapp.com/script-generate-json-url?scriptId=xxx
```

---

### 步骤 3: 测试云对象功能

#### 3.1 使用测试页面测试
```bash
1. 在浏览器中打开:
   http://localhost:5173/#/pages/test/script-test

2. 依次测试以下功能:
   ✅ 获取剧本列表 (getList)
   ✅ 获取剧本详情 (getDetail)  
   ✅ 上传剧本 (upload)
   ✅ 获取我的上传 (getMyUploads)
   ✅ 删除剧本 (delete)
   ✅ 创建评论 (createReview)
   ✅ 评分剧本 (rate)
   ✅ 获取JSON内容 (getJson)
   ✅ 热门排行 (getRankingHot)
   ✅ 最新排行 (getRankingNew)
   ✅ 评分排行 (getRankingRating)
   ✅ 下载排行 (getRankingDownload)
   ✅ 计算热度 (calculateHeat)
   ✅ 生成JSON URL (generateJsonUrl)

3. 检查每个测试的返回结果
4. 确认没有错误
```

#### 3.2 测试前端适配页面

##### 剧本详情页
```bash
1. 访问: #/pages/script/detail/detail?id=测试剧本ID
2. 检查:
   ✅ 剧本信息正常显示
   ✅ 预览图加载正常
   ✅ "复制JSON链接"功能正常
   ✅ 评分显示正常
```

##### 我的上传页
```bash
1. 访问: #/pages/user/my-uploads/my-uploads
2. 检查:
   ✅ 上传列表正常显示
   ✅ 状态筛选正常（全部/待审核/已通过/已拒绝）
   ✅ 删除功能正常
   ✅ 空状态显示正常
```

##### 上传剧本页
```bash
1. 访问: #/pages/tools/upload-json/upload-json
2. 检查:
   ✅ 文件上传正常
   ✅ JSON 粘贴正常
   ✅ 信息解析正常
   ✅ 图片上传正常
   ✅ 提交审核正常
   ✅ 预览图生成正常
```

##### 拼车创建页
```bash
1. 访问: #/pages/carpool/create/create
2. 检查:
   ✅ 剧本选项加载正常
   ✅ 剧本列表显示正常
   ✅ 创建拼车功能正常
```

---

### 步骤 4: 回归测试

#### 核心功能回归
- [ ] 剧本列表页正常显示
- [ ] 剧本搜索功能正常
- [ ] 剧本详情查看正常
- [ ] 剧本上传功能正常
- [ ] 剧本删除功能正常
- [ ] 剧本评分功能正常
- [ ] 剧本评论功能正常
- [ ] 剧本排行榜正常

#### 边界情况测试
- [ ] 未登录访问剧本详情
- [ ] 访问不存在的剧本
- [ ] 删除别人的剧本（应该失败）
- [ ] 上传无效的 JSON
- [ ] 评分已评分的剧本
- [ ] 网络错误处理

---

### 步骤 5: 性能检查

#### 响应时间
- [ ] getList 响应时间 < 500ms
- [ ] getDetail 响应时间 < 300ms
- [ ] upload 响应时间 < 3s
- [ ] delete 响应时间 < 300ms
- [ ] rate 响应时间 < 300ms

#### 并发测试
- [ ] 多个用户同时访问剧本详情
- [ ] 多个用户同时上传剧本
- [ ] 多个用户同时评分

---

## ⚠️ 常见问题排查

### 问题 1: "Method[xxx] was not found in index.obj.js"

**原因：** 云对象未上传或云端缓存未更新

**解决方案：**
```bash
1. 重新上传 script 云对象
2. 等待 2-3 分钟
3. 刷新页面重试
4. 如果仍然失败，删除云端 script 云对象后重新上传
```

---

### 问题 2: "无法连接uniCloud本地调试服务"

**原因：** 本地调试开启

**解决方案：**
```javascript
// 在前端页面的 onLoad 中
this.scriptObj = uniCloud.importObject('script', {
  customUI: true,
  debugFunction: false  // 明确禁用本地调试
})
```

---

### 问题 3: "token invalid"

**原因：** 未登录或 token 过期

**解决方案：**
```bash
1. 确保用户已登录
2. 检查 uni.getStorageSync('uni_id_token') 是否有值
3. 重新登录获取新 token
```

---

### 问题 4: generateJsonUrl 返回的 URL 无法访问

**原因：** 云函数未配置 URL 化

**解决方案：**
```bash
1. 按照"步骤 2"配置 URL 化访问
2. 等待 1-2 分钟
3. 重新生成 URL
4. 在浏览器中测试访问
```

---

### 问题 5: 预览图无法生成

**原因：** preview-generator.js 未上传或 JSON 格式不正确

**解决方案：**
```bash
1. 确认 preview-generator.js 已随云对象一起上传
2. 检查 JSON 内容是否包含必要字段
3. 查看云函数日志，确认具体错误
```

---

## 📊 部署验证清单

### 云端验证
- [ ] script 云对象在云端存在
- [ ] 云对象最后更新时间正确
- [ ] 云对象状态为"正常"
- [ ] 云对象依赖包已安装

### 功能验证
- [ ] 14 个方法全部可调用
- [ ] 所有方法返回格式正确
- [ ] 错误处理正常工作
- [ ] 鉴权机制正常工作

### 前端验证
- [ ] 4 个核心页面正常工作
- [ ] 测试页面可正常访问
- [ ] 没有控制台错误
- [ ] 用户交互流畅

### 性能验证
- [ ] 响应时间在可接受范围内
- [ ] 没有内存泄漏
- [ ] 数据库查询优化正常
- [ ] 缓存机制有效

---

## ✅ 部署完成标志

当以下所有条件都满足时，视为部署完成：

1. ✅ script 云对象成功上传到云端
2. ✅ 所有 14 个方法测试通过
3. ✅ 4 个核心前端页面功能正常
4. ✅ 测试页面可正常使用
5. ✅ 没有控制台错误
6. ✅ 用户反馈功能正常
7. ✅ 性能指标达标

---

## 📝 部署后任务

### 立即任务
1. **通知团队** - Script 云对象已上线
2. **更新文档** - 标记 Script 模块已完成
3. **监控运行** - 观察云函数日志，确保没有错误

### 后续任务
1. **扩展评分 API** - 添加查询用户评分的方法
2. **删除旧云函数** - 删除 14 个 script-* 云函数
3. **性能优化** - 根据使用情况优化性能
4. **继续迁移** - 开始 Carpool 云对象迁移

---

## 📄 相关文档

- **实现文档：** `uniCloud-aliyun/cloudfunctions/script/index.obj.js`
- **测试指南：** `SCRIPT_FRONTEND_TEST_GUIDE.md`
- **完成总结：** `SCRIPT_MIGRATION_COMPLETE.md`
- **URL配置：** `SCRIPT_URL_CONFIG_GUIDE.md`

---

## 🎯 成功标准

### 技术指标
- ✅ 代码覆盖率 > 90%
- ✅ 响应时间 < 500ms (平均)
- ✅ 错误率 < 0.1%
- ✅ 可用性 > 99.9%

### 业务指标
- ✅ 用户无感知迁移
- ✅ 功能完全兼容
- ✅ 性能持平或提升
- ✅ 代码量减少 30%+

---

**准备好了吗？开始部署！** 🚀

1. **第一步：** 上传云对象 ⬆️
2. **第二步：** 运行测试 🧪
3. **第三步：** 验证功能 ✅
4. **第四步：** 监控运行 📊

祝部署顺利！ 🎉

---

_创建时间：2025-11-04_  
_版本：v1.0_  
_状态：等待部署_

