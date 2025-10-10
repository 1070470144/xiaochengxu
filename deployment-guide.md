# 血染钟楼小程序部署指南

## 🚀 快速部署流程

### 第一步：HBuilderX配置

#### 1. 打开项目
- 使用HBuilderX打开 `botc-miniprogram` 目录
- 确认项目结构正确

#### 2. 配置微信小程序
- 编辑 `manifest.json`
- 在 `mp-weixin` → `appid` 中填入你的微信小程序AppID
- 保存文件

#### 3. 配置云服务空间
- 右键 `uniCloud-aliyun` 目录
- 选择 "创建云服务空间"
- 选择阿里云，填写空间名称：`botc-production`
- 等待创建完成
- 右键选择 "关联云服务空间"，选择刚创建的空间

### 第二步：部署云函数

#### 上传所有云函数
**必须上传的云函数：**
```bash
# 用户相关（基于uni-starter已有）
uni-id-co                    # 用户登录注册（已存在）

# 血染钟楼特色云函数
script-list                  # ✅ 剧本列表
script-detail                # ✅ 剧本详情  
script-upload                # ✅ 剧本上传
carpool-create               # ✅ 创建拼车
carpool-list                 # ✅ 拼车列表
carpool-detail               # ✅ 拼车详情
carpool-apply                # ✅ 报名拼车
chat-send                    # ✅ 发送消息
chat-conversations           # ✅ 会话列表
```

**操作步骤：**
1. 右键每个云函数目录
2. 选择 "上传部署"
3. 等待上传完成
4. 在uniCloud Web控制台验证部署成功

### 第三步：初始化数据库

#### 1. 上传数据库Schema
```bash
右键 uniCloud-aliyun/database/botc-scripts.schema.json → 上传DB Schema
右键 uniCloud-aliyun/database/botc-carpool-rooms.schema.json → 上传DB Schema
右键 uniCloud-aliyun/database/botc-carpool-members.schema.json → 上传DB Schema
右键 uniCloud-aliyun/database/botc-chat-messages.schema.json → 上传DB Schema
右键 uniCloud-aliyun/database/botc-storyteller-profiles.schema.json → 上传DB Schema
右键 uniCloud-aliyun/database/botc-storyteller-reviews.schema.json → 上传DB Schema
```

#### 2. 创建初始数据
- 右键 `uniCloud-aliyun` → 打开uniCloud Web控制台
- 进入云数据库
- 确认表结构创建成功

### 第四步：小程序发布

#### 1. 本地测试
```bash
运行 → 运行到小程序模拟器 → 微信开发者工具
```

#### 2. 提交审核
- 在微信开发者工具中点击"上传"
- 填写版本号和项目备注
- 在微信小程序后台提交审核

#### 3. 发布上线
- 审核通过后点击"发布"
- 用户即可在微信中搜索使用

### 第五步：管理后台部署

#### 部署到uniCloud前端网页托管
1. 使用HBuilderX打开 `botc-admin` 项目
2. 关联同一个云服务空间
3. 运行 → 发行 → 网站-H5-PC/手机版
4. 选择uniCloud前端网页托管
5. 点击发行，自动部署

#### 访问管理后台
- 部署成功后，访问提供的URL
- 使用管理员账号登录
- 开始管理剧本、用户、拼车等内容

## 💰 成本预估

### uniCloud资源使用预估（1000用户）

#### 云函数调用量
- **每日调用**：约5000次
- **月调用量**：15万次
- **年调用量**：180万次
- **费用**：前5万次免费，后续 ¥0.0133/万次
- **年费用**：约 ¥15

#### 云数据库存储
- **数据量**：约500MB
- **费用**：前1GB免费
- **年费用**：¥0

#### 云存储
- **文件存储**：约2GB（剧本文件、图片）
- **费用**：前5GB免费  
- **年费用**：¥0

#### 前端网页托管
- **管理后台**：约10MB
- **CDN流量**：约100GB/年
- **费用**：前5GB免费，后续 ¥0.0043/GB/天
- **年费用**：约 ¥150

### **总计年费用：约 ¥165！**

相比传统服务器方案（4000-8000元/年），节约95%以上！

## 📊 功能检查清单

### 小程序端功能
- [ ] 首页展示正常（热门剧本、最新拼车）
- [ ] 剧本列表可以正常浏览和搜索
- [ ] 剧本详情页面功能完整
- [ ] 可以正常下载剧本JSON
- [ ] 拼车列表显示正确
- [ ] 可以创建拼车房间
- [ ] 拼车详情和报名功能正常
- [ ] 私聊功能可以使用
- [ ] 用户登录注册正常
- [ ] 个人中心信息正确

### 管理后台功能
- [ ] 管理员可以正常登录
- [ ] 剧本审核功能正常
- [ ] 用户管理功能正常
- [ ] 拼车管理功能正常
- [ ] 数据统计显示正确

### 云服务检查
- [ ] 所有云函数部署成功
- [ ] 数据库表创建正确
- [ ] 云存储配置正确
- [ ] 权限设置正确

## 🛠️ 故障排除

### 常见问题

#### 1. 云函数调用失败
**可能原因：**
- 云函数未上传或上传失败
- 云服务空间配置错误
- 参数传递错误

**解决方案：**
- 检查云函数是否成功部署
- 在uniCloud控制台查看函数日志
- 验证传递的参数格式

#### 2. 数据库操作失败
**可能原因：**
- 数据库Schema未上传
- 字段验证规则不符合
- 权限配置问题

**解决方案：**
- 重新上传DB Schema
- 检查数据格式是否符合要求
- 在uniCloud控制台检查数据库权限

#### 3. 小程序审核不通过
**可能原因：**
- 功能不完整
- 缺少必要的用户协议
- 内容涉及敏感信息

**解决方案：**
- 完善功能，确保基础流程可用
- 添加用户协议和隐私政策
- 检查内容合规性

## 📈 上线后运营

### 内容准备
1. 准备50个常用血染钟楼剧本
2. 创建剧本分类和标签
3. 准备用户引导内容

### 推广计划
1. **社群推广**：在血染钟楼QQ群、微信群宣传
2. **KOL合作**：联系相关UP主体验推广
3. **口碑传播**：提供优质服务，用户自然推荐

### 数据监控
- 日活用户数
- 剧本下载量
- 拼车成功率
- 用户留存率

## 🆘 技术支持

### 文档资源
- [uniCloud官方文档](https://uniapp.dcloud.net.cn/uniCloud/)
- [uni-app官方文档](https://uniapp.dcloud.net.cn/)
- [微信小程序文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)

### 社区支持
- uniCloud官方QQ群
- uni-app官方论坛
- GitHub Issues

---

**部署完成后，你就拥有了一个完整的血染钟楼社区平台！** 🎉

记住：
- 📱 用户通过微信小程序使用
- 💻 你通过Web管理后台管理内容
- ☁️ 一切都托管在uniCloud，无需运维
- 💰 按使用量付费，成本极低

祝你的血染钟楼社区发展顺利！🎭
