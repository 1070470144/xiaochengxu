# 🔧 百科同步失败问题修复

## 🐛 错误信息

```
POST http://127.0.0.1:7001/cloudfunctions/wiki-admin-sync-all 500 (Internal Server Error)
ReadableStream is not defined
```

## 🔍 问题原因

1. **ReadableStream 兼容性问题** - cheerio库在某些Node.js环境中的兼容性问题
2. **云函数执行错误** - 可能是网络请求或解析失败

---

## ✅ 已修复的内容

### 修复1：添加 ReadableStream 兼容性补丁
```javascript
// 在云函数开头添加
if (typeof ReadableStream === 'undefined') {
  global.ReadableStream = class ReadableStream {};
}
```

### 修复2：增加详细的错误日志
```javascript
// 每个关键步骤都添加了 console.log
// 方便查看云函数日志定位问题
```

### 修复3：优化错误处理
```javascript
// 添加了更完善的 try-catch
// 验证数据有效性
```

---

## 🚀 重新部署

### 步骤1：重新上传云函数

```bash
在 HBuilderX 中：

1. 找到 botc-admin/uniCloud-aliyun/cloudfunctions/wiki-admin-sync-all
2. 右键 → 上传部署
3. 等待上传完成
4. 看到"上传成功"提示
```

### 步骤2：查看云函数日志

```bash
1. 右键 wiki-admin-sync-all
2. 选择"云函数日志"
3. 或者访问 uniCloud Web控制台
4. 云函数 → wiki-admin-sync-all → 日志
```

### 步骤3：重新测试同步

```bash
1. 刷新管理后台页面
2. 进入"百科同步"
3. 先点击"仅同步角色"（不要点"同步所有内容"）
4. 等待执行
5. 查看结果
```

---

## 🐛 如果还是失败？

### 调试方法1：查看云函数日志

```bash
在云函数日志中查找：
- [syncSinglePage] 开始抓取: https://...
- [syncSinglePage] HTTP状态: 200
- [parseMediaWikiPage] 提取标题: xxx

如果看到错误，记录错误信息
```

### 调试方法2：测试单个URL同步

```bash
不要点"同步所有内容"，先测试单个：

1. 在"单个同步"输入框输入：
   https://clocktower-wiki.gstonegames.com/index.php?title=洗衣妇

2. 点击"同步"按钮

3. 看是否成功
```

### 调试方法3：检查网络

```bash
云函数可能无法访问外网，检查：
1. uniCloud 云服务空间是否正常
2. 网络是否有限制
3. 钟楼百科网站是否可访问
```

---

## 🔍 常见失败原因

### 原因1：cheerio 依赖未安装
**解决**：
```bash
1. 进入云函数目录
2. 手动安装依赖：
   cd botc-admin/uniCloud-aliyun/cloudfunctions/wiki-admin-sync-all
   npm install cheerio
3. 重新上传云函数
```

### 原因2：网络超时
**解决**：
```bash
1. 不要一次同步太多
2. 先测试"仅同步角色"
3. 每批次只处理5个URL
```

### 原因3：云函数超时
**解决**：
```bash
已在 package.json 中配置：
{
  "cloudfunction-config": {
    "timeout": 300,  // 5分钟超时
    "memorySize": 512  // 512MB内存
  }
}
```

---

## 💡 推荐的测试步骤

### 步骤1：测试单个URL（最简单）

```bash
1. 在"单个同步"输入：
   https://clocktower-wiki.gstonegames.com/index.php?title=洗衣妇

2. 点击"同步"

3. 如果成功，说明云函数基本功能正常
4. 如果失败，查看云函数日志找原因
```

### 步骤2：测试小批量

```bash
1. 修改 urls-config.js
2. 暂时只保留3-5个URL
3. 点击"仅同步角色"
4. 看是否成功
```

### 步骤3：逐步增加

```bash
成功后再逐步增加URL数量
```

---

## 📝 云函数日志查看方法

### 在 HBuilderX 查看

```bash
1. 右键 wiki-admin-sync-all 云函数
2. 选择"云函数日志"
3. 查看最新的执行日志
4. 找到错误信息
```

### 在 uniCloud 控制台查看

```bash
1. 访问 https://unicloud.dcloud.net.cn
2. 选择您的云服务空间
3. 云函数 → wiki-admin-sync-all
4. 点击"日志"标签
5. 查看详细错误信息
```

---

## 🎯 请先做这个

### 立即操作：

1. **重新上传修复后的云函数**
   ```bash
   右键 wiki-admin-sync-all → 上传部署
   ```

2. **测试单个URL同步**
   ```bash
   在"单个同步"输入框：
   https://clocktower-wiki.gstonegames.com/index.php?title=洗衣妇
   点击"同步"
   ```

3. **查看结果**
   - 如果成功：说明云函数基本正常，可以继续批量同步
   - 如果失败：告诉我错误信息，我帮您继续调试

---

## 📞 需要什么信息？

如果还是失败，请提供：
1. 云函数日志中的错误信息
2. 单个URL同步是否成功
3. 浏览器控制台的完整错误

我会继续帮您解决！🔧

---

**修复时间**: 2025年10月17日  
**状态**: 已添加兼容性修复和日志

