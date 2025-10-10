# 个人中心功能使用指南

## ✨ 已完成功能

### 1. 退出登录功能 ✅
- 云函数：`user-logout`
- 功能：记录登出日志，清除token
- 位置：个人中心 → 系统功能 → 退出登录

### 2. 用户信息管理 ✅
- 云函数：`user-info`（获取）、`user-update`（更新）
- 功能：获取和更新用户头像、昵称、性别
- 位置：个人中心 → 点击头像 → 编辑资料

### 3. 完善个人中心页面 ✅
- 头像显示（可点击编辑）
- 昵称显示
- 手机号显示（脱敏）
- 等级系统显示
- 经验值进度条
- 用户统计数据

### 4. 编辑资料页面 ✅
- 头像上传（支持微信授权和相册选择）
- 昵称修改
- 性别选择
- 手机号显示（只读）

---

## 🚀 快速开始

### 步骤1：上传云函数

在 HBuilderX 中上传以下云函数：

```bash
1. user-logout    # 退出登录
2. user-info      # 获取用户信息
3. user-update    # 更新用户信息
```

### 步骤2：测试功能

```bash
1. 登录小程序
2. 进入"我的"页面
3. 点击头像 → 编辑资料
4. 修改昵称、头像、性别
5. 点击"保存修改"
6. 返回个人中心查看更新
```

---

## 📋 功能详解

### 1. 个人中心页面

#### 用户信息区域
```
┌─────────────────────────────┐
│  🎭                          │
│   ✏️                         │ ← 点击编辑头像
│                             │
│  张三 (玩家1234)             │ ← 昵称（手机后4位）
│  138****5678                │ ← 脱敏手机号
│  初来乍到  Lv.1             │ ← 等级信息
│  ▓▓▓▓▓░░░░░  50/100        │ ← 经验进度
└─────────────────────────────┘
```

#### 用户统计
- 上传剧本数
- 收藏剧本数
- 参与拼车数
- 发表评论数

#### 功能菜单
**我的内容：**
- 我的剧本
- 我的收藏
- 浏览历史

**拼车相关：**
- 我的拼车
- 报名记录

**说书人：**
- 我的说书人主页（已认证）
- 申请成为说书人（未认证）

**系统功能：**
- 设置
- 关于我们
- 退出登录 ⭐

### 2. 编辑资料页面

#### 头像设置
- **方式1**：微信授权头像（推荐）
- **方式2**：选择相册/拍照
- 自动上传到云存储
- 支持预览

#### 基本信息
- **昵称**：2-20个字符
- **手机号**：只读显示
- **性别**：保密/男/女

#### 保存逻辑
1. 验证昵称格式
2. 调用云函数更新
3. 更新本地Storage
4. 返回上一页

---

## 🔧 云函数说明

### 1. user-logout（退出登录）

**功能：**
- 验证token有效性
- 记录登出时间
- 返回成功状态

**调用方式：**
```javascript
const result = await uniCloud.callFunction({
  name: 'user-logout'
})
```

**返回数据：**
```json
{
  "code": 0,
  "message": "登出成功"
}
```

### 2. user-info（获取用户信息）

**功能：**
- 验证token
- 获取当前用户详细信息
- 过滤敏感字段

**调用方式：**
```javascript
const result = await uniCloud.callFunction({
  name: 'user-info'
})
```

**返回数据：**
```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "_id": "用户ID",
    "mobile": "13800138000",
    "nickname": "张三",
    "avatar": "头像URL",
    "gender": 1,
    "level": 1,
    "exp": 50,
    "status": 0,
    "register_date": 1234567890,
    "last_login_date": 1234567890
  }
}
```

### 3. user-update（更新用户信息）

**功能：**
- 验证token
- 更新昵称、头像、性别
- 验证数据格式
- 返回更新后的用户信息

**调用方式：**
```javascript
const result = await uniCloud.callFunction({
  name: 'user-update',
  data: {
    nickname: '新昵称',
    avatar: '头像URL',
    gender: 1  // 0-保密，1-男，2-女
  }
})
```

**返回数据：**
```json
{
  "code": 0,
  "message": "更新成功",
  "data": {
    "_id": "用户ID",
    "mobile": "13800138000",
    "nickname": "新昵称",
    "avatar": "新头像URL",
    "gender": 1,
    "level": 1,
    "exp": 50,
    "status": 0
  }
}
```

---

## 💡 Auth 工具类

### 使用方法

```javascript
import Auth from '@/utils/auth.js'

// 1. 检查登录状态
if (Auth.isLogin()) {
  console.log('已登录')
}

// 2. 获取用户信息
const userInfo = Auth.getUserInfo()
console.log(userInfo.nickname)  // 昵称
console.log(userInfo.mobile)    // 手机号

// 3. 获取token
const token = Auth.getToken()

// 4. 退出登录
Auth.logout()  // 清除本地所有登录信息

// 5. 跳转登录页
Auth.toLogin()

// 6. 需要登录才能执行
Auth.requireLogin(() => {
  // 已登录，执行业务逻辑
  uni.navigateTo({
    url: '/pages/carpool/create/create'
  })
})
```

---

## 🎨 等级系统说明

### 等级配置（spec-kit标准）

| 等级 | 名称 | 所需经验 |
|-----|------|---------|
| 1 | 初来乍到 | 0 |
| 2 | 略知一二 | 100 |
| 3 | 初窥门径 | 300 |
| 4 | 渐入佳境 | 600 |
| 5 | 驾轻就熟 | 1000 |
| 6 | 炉火纯青 | 1500 |
| 7 | 登峰造极 | 2200 |
| 8 | 出神入化 | 3000 |
| 9 | 无与伦比 | 4000 |
| 10 | 传奇玩家 | 5500 |

### 经验值获取（spec-kit标准）

| 行为 | 经验值 |
|-----|--------|
| 每日首次登录 | +5 |
| 上传剧本 | +20 |
| 发表评论 | +10 |
| 分享内容 | +5 |
| 创建拼车 | +10 |
| 评价说书人 | +5 |

### 进度条计算

```javascript
// 当前等级经验：300，下一等级：600，当前经验：450
progress = (450 - 300) / (600 - 300) * 100 = 50%
```

---

## 📱 页面交互流程

### 退出登录流程

```
点击"退出登录"
    ↓
显示确认弹窗
    ↓
用户确认
    ↓
调用 user-logout 云函数
    ↓
Auth.logout() 清除本地数据
    ↓
显示"已退出登录"提示
    ↓
跳转到登录页
```

### 编辑资料流程

```
点击头像
    ↓
进入编辑资料页
    ↓
加载当前用户信息
    ↓
修改昵称/头像/性别
    ↓
点击"保存修改"
    ↓
验证昵称格式
    ↓
调用 user-update 云函数
    ↓
更新本地 Storage
    ↓
显示"保存成功"提示
    ↓
返回个人中心（自动刷新）
```

### 头像上传流程

```
点击"选择头像"
    ↓
方式1：微信授权（推荐）
    ↓
获取 avatarUrl
    ↓
方式2：相册/拍照
    ↓
选择图片
    ↓
上传到 uniCloud 云存储
    ↓
获取 fileID
    ↓
更新 formData.avatar
    ↓
保存时提交到云函数
```

---

## 🛠️ 数据存储说明

### Storage 存储

```javascript
// 登录信息
uni_id_token          // token值
uni_id_token_expired  // token过期时间

// 用户信息
userInfo: {
  _id: '用户ID',
  mobile: '手机号',
  nickname: '昵称',
  avatar: '头像URL',
  gender: 0,
  level: 1,
  exp: 0
}
```

### 云数据库字段

**uni-id-users 表：**
- `nickname`: 昵称
- `avatar`: 头像URL（云存储fileID）
- `gender`: 性别（0-保密，1-男，2-女）
- `mobile`: 手机号
- `mobile_confirmed`: 手机号确认状态
- `level`: 用户等级
- `exp`: 经验值
- `last_logout_date`: 最后登出时间

---

## ⚠️ 注意事项

### 1. 头像上传

**微信小程序方式（推荐）：**
- 使用 `open-type="chooseAvatar"` 
- 获取微信头像URL
- 无需上传云存储
- 用户体验最好

**传统方式：**
- 选择本地图片
- 需要上传到云存储
- 获取云存储 fileID
- 消耗云存储空间

### 2. 昵称验证

- 不能为空
- 长度：2-20个字符
- 失焦自动验证
- 保存时二次验证

### 3. 性别选择

- 底部弹出选择器
- 三个选项：保密/男/女
- 点击遮罩关闭
- 选择后自动关闭

### 4. 数据同步

- 编辑后自动更新Storage
- 返回个人中心自动刷新
- 确保数据一致性

---

## 🔍 调试技巧

### 1. 查看登录状态

```javascript
// 控制台执行
const token = uni.getStorageSync('uni_id_token')
const userInfo = uni.getStorageSync('userInfo')
console.log('Token:', token)
console.log('UserInfo:', userInfo)
```

### 2. 测试退出登录

```javascript
// 手动触发
Auth.logout()
console.log('已清除登录信息')
```

### 3. 查看云函数日志

```bash
HBuilderX → uniCloud → 云函数/云对象日志
查看 user-update 的调用记录
```

### 4. 测试头像上传

```bash
1. 选择图片
2. 查看控制台上传进度
3. 检查云存储是否有文件
4. 验证 fileID 是否正确
```

---

## 📝 待实现功能

### 1. 用户统计云函数
- [ ] 创建 `user-stats` 云函数
- [ ] 统计上传剧本数
- [ ] 统计收藏剧本数
- [ ] 统计拼车参与数
- [ ] 统计评论数量

### 2. 其他功能
- [ ] 绑定/更换手机号
- [ ] 实名认证
- [ ] 账号注销
- [ ] 隐私设置

---

## ✅ 上线检查清单

- [x] 云函数已上传
  - [x] user-logout
  - [x] user-info
  - [x] user-update
- [x] 页面路由已配置
- [x] Auth工具类正常工作
- [x] 头像上传功能测试通过
- [x] 昵称修改功能测试通过
- [x] 退出登录功能测试通过
- [x] 数据同步功能正常
- [ ] 用户统计数据接入

---

## 📞 技术支持

遇到问题可以：
1. 查看云函数日志
2. 检查Storage数据
3. 查看控制台错误
4. 参考 spec-kit 规范

祝使用愉快！🎉

