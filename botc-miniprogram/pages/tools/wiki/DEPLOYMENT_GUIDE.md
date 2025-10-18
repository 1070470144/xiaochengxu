# 血染百科功能部署指南

## 📦 部署清单

### 文件清单
```
✅ 云函数（3个）
├── wiki-parse-url/
│   ├── index.js
│   └── package.json
├── wiki-search/
│   ├── index.js
│   └── package.json
└── wiki-detail/
    ├── index.js
    └── package.json

✅ 数据库Schema（3个）
├── wiki_entries.schema.json
├── wiki_favorites.schema.json
└── wiki_search_history.schema.json

✅ 小程序页面（2个）
├── wiki.vue (已修改)
└── detail.vue (新建)
```

---

## 🚀 部署步骤

### 第一步：上传云函数

#### 1. 安装云函数依赖

在 HBuilderX 中：

```bash
# wiki-parse-url 需要安装依赖
1. 右键 cloudfunctions/wiki-parse-url
2. 选择"终端窗口打开所在目录"
3. 运行命令：npm install cheerio
4. 等待安装完成
```

或者：

```bash
# 在云函数目录手动安装
cd botc-miniprogram/uniCloud-aliyun/cloudfunctions/wiki-parse-url
npm install
```

#### 2. 上传部署云函数

```bash
方式1：单个上传
1. 右键 cloudfunctions/wiki-parse-url
2. 选择"上传部署"
3. 等待上传完成（首次需要安装依赖，约1-2分钟）
4. 重复步骤1-3，分别上传 wiki-search 和 wiki-detail

方式2：批量上传
1. 右键 cloudfunctions 目录
2. 选择"上传所有云函数"
3. 等待所有云函数上传完成
```

#### 3. 验证云函数部署

在 uniCloud Web控制台：

```bash
1. 登录 https://unicloud.dcloud.net.cn
2. 选择项目空间
3. 云函数 → 查看函数列表
4. 确认3个云函数都已部署成功
5. 查看部署时间和状态
```

---

### 第二步：创建数据库集合

#### 1. 创建 wiki_entries 集合

```bash
1. 打开 uniCloud Web控制台
2. 进入"云数据库"
3. 点击"新建集合"
4. 集合名称：wiki_entries
5. 点击"确定"
```

#### 2. 导入 Schema

```bash
1. 进入 wiki_entries 集合
2. 点击"DB Schema"标签
3. 点击"导入Schema"
4. 复制 database/wiki_entries.schema.json 内容
5. 粘贴到编辑器
6. 点击"保存"
```

#### 3. 设置索引

```bash
1. 点击"索引"标签
2. 添加以下索引：
   - source_url (唯一索引)
   - entry_type (普通索引)
   - title (文本索引)
   - cache_expires_at (普通索引)
```

#### 4. 设置数据库权限

```json
{
  ".read": true,
  ".create": "auth.uid != null",
  ".update": false,
  ".delete": false
}
```

#### 5. 重复步骤创建其他集合

```bash
创建 wiki_favorites：
- 导入 wiki_favorites.schema.json
- 添加唯一索引：user_id + entry_id

创建 wiki_search_history：
- 导入 wiki_search_history.schema.json
- 添加索引：user_id, keyword, created_at
```

---

### 第三步：配置小程序路由

#### 1. 更新 pages.json

确保以下路由已配置：

```json
{
  "pages": [
    // ... 其他页面
    {
      "path": "pages/tools/wiki/wiki",
      "style": {
        "navigationBarTitleText": "血染百科",
        "enablePullDownRefresh": false
      }
    },
    {
      "path": "pages/tools/wiki/detail",
      "style": {
        "navigationBarTitleText": "百科详情",
        "enablePullDownRefresh": false,
        "navigationBarBackgroundColor": "#4facfe",
        "navigationBarTextStyle": "white"
      }
    }
  ]
}
```

---

### 第四步：部署验证

#### 1. 云函数测试

在 HBuilderX 中：

```bash
1. 右键 wiki-parse-url
2. 选择"运行-云端"
3. 输入测试参数：
   {
     "url": "https://clocktower-wiki.gstonegames.com/index.php?title=洗衣妇"
   }
4. 点击"运行"
5. 查看返回结果是否正确
```

#### 2. 小程序测试

```bash
1. 在 HBuilderX 中运行项目到微信开发者工具
2. 进入 工具 → 血染百科
3. 点击"导入百科链接"
4. 输入测试URL
5. 验证是否能正常导入和显示
```

---

## ⚙️ 配置说明

### 云函数配置

#### wiki-parse-url 配置
```json
{
  "timeout": 60,
  "memory": 256
}
```
- timeout: 60秒（网页抓取可能较慢）
- memory: 256MB（cheerio 解析需要内存）

#### wiki-search 配置
```json
{
  "timeout": 10,
  "memory": 128
}
```

#### wiki-detail 配置
```json
{
  "timeout": 10,
  "memory": 128
}
```

### 数据库索引配置

#### wiki_entries 索引
```javascript
// 1. 唯一索引
{
  "source_url": 1
}

// 2. 复合索引
{
  "entry_type": 1,
  "created_at": -1
}

// 3. 文本索引（支持中文搜索）
{
  "title": "text",
  "content.text": "text"
}

// 4. 过期时间索引
{
  "cache_expires_at": 1
}
```

---

## 🔒 安全配置

### 数据库权限

#### wiki_entries
```json
{
  ".read": true,
  ".create": "auth.uid != null",
  ".update": "doc.creator_id == auth.uid",
  ".delete": false
}
```

#### wiki_favorites
```json
{
  ".read": "doc.user_id == auth.uid",
  ".create": "auth.uid != null && doc.user_id == auth.uid",
  ".update": false,
  ".delete": "doc.user_id == auth.uid"
}
```

#### wiki_search_history
```json
{
  ".read": "doc.user_id == auth.uid",
  ".create": true,
  ".update": false,
  ".delete": "doc.user_id == auth.uid"
}
```

---

## 📊 监控配置

### 云函数监控

在 uniCloud 控制台设置：

```bash
1. 云函数 → wiki-parse-url → 监控
2. 设置告警规则：
   - 错误率 > 5%：发送邮件告警
   - 平均耗时 > 10秒：发送告警
   - 调用量异常：发送告警
```

### 数据库监控

```bash
1. 云数据库 → 监控
2. 关注指标：
   - 存储空间使用
   - 读写次数
   - 慢查询
```

---

## 🐛 故障排查

### 问题1：云函数上传失败
**可能原因：**
- 网络问题
- uniCloud 服务异常
- 云函数代码有语法错误

**解决方案：**
1. 检查网络连接
2. 检查代码语法
3. 查看 HBuilderX 控制台错误信息
4. 重试上传

---

### 问题2：导入时提示"网页加载失败"
**可能原因：**
- 目标网站无法访问
- 云函数超时
- URL 格式错误

**解决方案：**
1. 在浏览器中验证URL是否可访问
2. 检查URL格式是否正确
3. 查看云函数日志
4. 增加云函数超时时间

---

### 问题3：解析后内容不完整
**可能原因：**
- 网页结构特殊
- 解析规则需要优化

**解决方案：**
1. 查看云函数返回的原始数据
2. 优化解析规则
3. 针对特定页面添加特殊处理

---

### 问题4：数据库查询失败
**可能原因：**
- 集合未创建
- 权限配置错误
- 索引未创建

**解决方案：**
1. 确认集合已创建
2. 检查数据库权限配置
3. 验证索引设置

---

## 📈 性能优化建议

### 云函数优化
```javascript
// 1. 使用连接池（如果频繁请求）
// 2. 增加超时时间配置
// 3. 优化解析算法
// 4. 减少不必要的数据库操作
```

### 数据库优化
```javascript
// 1. 合理使用索引
// 2. 避免全表扫描
// 3. 限制返回字段
// 4. 使用分页查询
```

### 小程序优化
```javascript
// 1. 图片懒加载
// 2. 使用本地缓存
// 3. 减少不必要的请求
// 4. 优化渲染性能
```

---

## ✅ 部署完成检查清单

### 云函数部署
- [ ] wiki-parse-url 已上传
- [ ] wiki-search 已上传
- [ ] wiki-detail 已上传
- [ ] 依赖包已安装
- [ ] 云函数测试通过

### 数据库配置
- [ ] wiki_entries 集合已创建
- [ ] wiki_favorites 集合已创建
- [ ] wiki_search_history 集合已创建
- [ ] Schema 已导入
- [ ] 索引已设置
- [ ] 权限已配置

### 小程序配置
- [ ] pages.json 已更新
- [ ] wiki.vue 已修改
- [ ] detail.vue 已创建
- [ ] 功能测试通过

### 文档完善
- [ ] README 已创建
- [ ] 测试用例已编写
- [ ] 部署文档已完善

---

## 🎉 上线准备

### 上线前检查
- [ ] 所有测试通过
- [ ] 性能达标
- [ ] 无已知严重bug
- [ ] 文档完整
- [ ] 用户反馈良好

### 灰度发布
建议先小范围测试：
1. 邀请10-20名用户试用
2. 收集反馈意见
3. 修复发现的问题
4. 全量发布

---

**维护人员**: 开发团队  
**创建时间**: 2025年10月17日  
**版本**: v1.0.0

