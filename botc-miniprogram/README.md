# 血染钟楼小程序

## 项目简介

血染钟楼（Blood on the Clocktower）中国玩家交流平台，基于uniCloud云开发的微信小程序。

### 核心功能
- 📚 **剧本管理**：浏览、搜索、下载、上传血染钟楼剧本
- 🚗 **拼车组局**：发起线下游戏拼车，寻找队友
- 💬 **私聊功能**：玩家之间私密聊天
- 🎭 **说书人系统**：说书人认证、展示、评价
- ⭐ **用户等级**：经验值系统，激励用户参与

## 技术架构

### 前端
- **框架**：uni-app（基于uni-starter模板）
- **云开发**：uniCloud阿里云版本
- **UI组件**：uni-ui组件库
- **状态管理**：Vuex

### 后端
- **云函数**：30+个业务云函数
- **云数据库**：MongoDB（6个核心集合）
- **云存储**：文件和图片存储
- **用户系统**：基于uni-id-pages

### 管理后台
- **框架**：uni-admin
- **部署**：uniCloud前端网页托管

## 项目结构

```
botc-miniprogram/
├── uniCloud-aliyun/           # 云开发目录
│   ├── cloudfunctions/        # 云函数
│   │   ├── script-list/       # 获取剧本列表
│   │   ├── script-detail/     # 获取剧本详情
│   │   ├── script-upload/     # 上传剧本
│   │   ├── carpool-create/    # 创建拼车
│   │   ├── carpool-list/      # 获取拼车列表
│   │   ├── carpool-apply/     # 报名拼车
│   │   ├── chat-send/         # 发送消息
│   │   └── ...                # 其他云函数
│   └── database/              # 数据库Schema
│       ├── botc-scripts.schema.json
│       ├── botc-carpool-rooms.schema.json
│       └── ...
├── pages/                     # 小程序页面
│   ├── index/                 # 首页
│   ├── script/                # 剧本相关页面
│   ├── carpool/               # 拼车相关页面
│   ├── community/chat/        # 私聊功能
│   └── user/                  # 用户中心
├── components/                # 组件
├── utils/                     # 工具类
├── static/                    # 静态资源
├── app.js                     # 应用入口
├── app.json                   # 应用配置
└── manifest.json              # 项目配置
```

## 开发指南

### 环境准备
1. 安装HBuilderX
2. 创建uniCloud服务空间
3. 配置微信小程序AppID

### 本地开发
1. 在HBuilderX中打开项目
2. 关联云服务空间
3. 上传云函数到测试环境
4. 运行到微信开发者工具

### 部署上线
1. 上传所有云函数到正式环境
2. 上传数据库Schema
3. 小程序提交微信审核
4. Web管理后台部署到前端网页托管

## 数据库设计

### 核心集合
- **uni-id-users**：用户表（基于uni-id）
- **botc-scripts**：剧本表
- **botc-carpool-rooms**：拼车房间表
- **botc-carpool-members**：拼车成员表
- **botc-chat-messages**：私聊消息表
- **botc-storyteller-profiles**：说书人信息表

### 数据关系
- 用户 → 剧本（一对多，创建关系）
- 用户 → 拼车房间（一对多，发起关系）
- 拼车房间 → 拼车成员（一对多）
- 用户 → 私聊消息（多对多）
- 用户 → 说书人档案（一对一）

## API接口

### 云函数列表
- `user-*`：用户相关（登录、资料、统计）
- `script-*`：剧本相关（列表、详情、上传、搜索）
- `carpool-*`：拼车相关（创建、列表、报名、管理）
- `chat-*`：私聊相关（发送、获取、会话）
- `storyteller-*`：说书人相关（申请、认证、评价）

### 调用示例
```javascript
// 获取剧本列表
const result = await uniCloud.callFunction({
  name: 'script-list',
  data: {
    page: 1,
    pageSize: 20,
    keyword: '',
    type: 'hot'
  }
})

// 创建拼车
const result = await uniCloud.callFunction({
  name: 'carpool-create',
  data: {
    title: '周末血染局',
    game_time: new Date().getTime(),
    location: '北京朝阳区',
    max_players: 7
  }
})
```

## 开发进度

### ✅ 已完成
- [x] 基础架构搭建
- [x] 数据库设计
- [x] 剧本系统（列表、详情、上传）
- [x] 拼车系统（创建、列表、详情、报名）
- [x] 私聊系统基础功能
- [x] 用户中心页面
- [x] 工具类和常量定义

### 🔄 进行中
- [ ] 说书人系统完善
- [ ] 管理后台定制
- [ ] UI主题优化

### 📅 待开发
- [ ] 评论系统完善
- [ ] 搜索功能增强
- [ ] 消息推送
- [ ] 数据统计

## 联系方式

- **项目开发者**：血染钟楼爱好者
- **技术支持**：uniCloud官方文档
- **项目文档**：详见项目speckit系列文档

## 许可证

MIT License - 开源项目，欢迎贡献代码