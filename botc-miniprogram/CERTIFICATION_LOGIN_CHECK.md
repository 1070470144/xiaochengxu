# 🔐 认证页面登录检查

## ✅ 功能已添加

已在认证页面添加登录状态检查，未登录用户会自动跳转到登录页。

---

## 🎯 功能说明

### 检查时机

**页面加载时**：
- `onLoad()` - 页面首次加载
- `onShow()` - 页面显示/返回时

**检查内容**：
- 检查本地是否有 `uni_id_token`
- 有token → 正常加载认证信息
- 无token → 跳转到登录页

---

## 🔧 实现逻辑

### 核心代码

```javascript
import Auth from '@/utils/auth.js'

checkLogin() {
  if (!Auth.isLogin()) {
    Auth.toLogin()
    return false
  }
  
  // 已登录，加载认证信息
  this.loadCertificationInfo()
  return true
}
```

### Auth.isLogin() 的优势

**完整的登录检查**：
```javascript
static isLogin() {
  const token = uni.getStorageSync('uni_id_token')
  const tokenExpired = uni.getStorageSync('uni_id_token_expired')
  
  if (!token) {
    return false
  }
  
  // 检查token是否过期
  if (tokenExpired && tokenExpired < Date.now()) {
    this.logout()
    return false
  }
  
  return true
}
```

**优点**：
- ✅ 检查token存在性
- ✅ 检查token过期时间
- ✅ 自动清理过期token
- ✅ 与其他页面保持一致

### 流程图

```
用户进入认证页面
    ↓
调用 Auth.isLogin()
    ↓
检查 token 存在性
    ↓
检查 token 过期时间
    ↓
登录有效？
├─ 是 → 加载认证信息 → 正常显示页面
└─ 否 → 调用 Auth.toLogin() → 跳转到登录页
```

---

## 📱 用户体验

### 未登录用户

**之前**：
```
进入认证页面 
   ↓
显示空白或错误
   ↓
用户困惑
```

**现在**：
```
进入认证页面
   ↓
Auth.isLogin() 检查登录
   ↓
自动跳转到登录页 ✅
   ↓
登录后可以继续申请
```

### 已登录用户

**流程不变**：
```
进入认证页面
   ↓
直接显示认证内容 ✅
```

---

## 🎨 交互细节

### 提示信息

**Toast提示**：
- 内容："请先登录"
- 图标：无（none）
- 时长：2秒

### 跳转方式

**使用 `uni.reLaunch`**：
- 关闭所有页面
- 打开登录页
- 防止用户返回到认证页（因为没登录）

**延迟跳转**：
- 延迟500毫秒
- 让用户看到提示信息
- 体验更流畅

---

## 🔄 登录后返回

### 场景

用户从认证页面被跳转到登录页面，登录成功后想继续申请认证。

### 解决方案

**方法1：手动导航**
```
登录成功后
   ↓
进入"我的"页面
   ↓
点击"说书人认证"
   ↓
继续申请
```

**方法2：优化跳转（可选）**

如果需要登录后自动返回认证页，可以修改跳转逻辑：

```javascript
// 保存来源页面
setTimeout(() => {
  uni.reLaunch({
    url: '/pages/login/sms-login?redirect=/pages/user/certification/certification'
  })
}, 500)

// 在登录页面登录成功后读取 redirect 参数并跳转
```

---

## 📊 修改文件

### certification.vue

**修改位置**：
- 导入 Auth 工具类
- `onLoad()` - 调用 checkLogin
- `onShow()` - 调用 checkLogin
- `methods` - 新增 checkLogin 方法（使用 Auth.isLogin()）

**代码行数**：+14行（简化后）

---

## ✅ 测试场景

### 测试1：未登录访问

**步骤**：
1. 退出登录（清除token）
2. 进入"我的" → "说书人认证"

**预期**：
- ✅ 显示"请先登录"提示
- ✅ 自动跳转到登录页
- ✅ 不显示认证表单

### 测试2：已登录访问

**步骤**：
1. 正常登录
2. 进入"我的" → "说书人认证"

**预期**：
- ✅ 直接显示认证页面
- ✅ 加载当前认证状态
- ✅ 可以正常申请

### 测试3：登录过期

**步骤**：
1. Token过期
2. 进入认证页面

**预期**：
- ✅ 检测到无有效token
- ✅ 跳转到登录页
- ✅ 重新登录后可继续

---

## 🔐 安全性

### Token检查

**检查内容**：
- 本地是否存储 `uni_id_token`
- 这是基础检查

**注意**：
- 云函数会再次验证token有效性
- 双重保障，确保安全

### 防止绕过

使用 `uni.reLaunch`：
- 关闭所有页面
- 用户无法通过返回键回到认证页
- 必须登录后才能访问

---

## 📋 相关页面

### 其他需要登录的页面

建议在以下页面也添加类似检查：

```javascript
// 我的帖子、我的拼车、我的收藏等
onLoad() {
  this.checkLogin()
}

checkLogin() {
  const token = uni.getStorageSync('uni_id_token')
  if (!token) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/login/sms-login' })
    }, 500)
    return false
  }
  return true
}
```

---

## 🎯 优化建议

### 短期

- [x] ✅ 添加登录检查
- [ ] 记录来源页面，登录后自动返回
- [ ] 统一登录检查逻辑（提取为mixin）

### 中期

- [ ] Token自动刷新机制
- [ ] 登录过期提醒
- [ ] 一键重新登录

### 长期

- [ ] 免密登录（生物识别）
- [ ] 多端登录状态同步
- [ ] 会话管理优化

---

## 🎉 总结

### 核心改进

✅ **自动检查** - 页面加载时检查登录状态  
✅ **友好提示** - 明确告知需要登录  
✅ **自动跳转** - 引导用户去登录  
✅ **防止错误** - 避免未登录调用云函数报错  

### 用户价值

**更好的引导**：明确告知需要登录  
**更少的困惑**：自动跳转，不用思考  
**更高的转化**：顺畅的流程提升认证率  

---

**修改完成时间**：2025-10-27  
**状态**：✅ 已完成  
**代码质量**：✅ 0错误

**未登录用户现在会自动跳转到登录页！** 🔐✅

