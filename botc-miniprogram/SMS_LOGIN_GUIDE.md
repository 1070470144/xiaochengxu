# 手机验证码登录配置指南

## 📋 实现方案概述

**方案A - 手机验证码登录**
- ✅ 支持任意手机号登录
- ✅ 短信验证码验证
- ✅ 自动注册/登录
- ✅ 开发模式（无需真实短信）

---

## 🚀 快速开始（开发模式）

### 步骤1：初始化数据库表（5分钟）

在 uniCloud Web 控制台创建集合：

```bash
1. 登录 https://unicloud.dcloud.net.cn
2. 进入你的云服务空间
3. 点击"云数据库" → "新建集合"
4. 创建 sms-codes 表
```

**sms-codes 表结构：**
```json
{
  "phone": "手机号",
  "code": "验证码",
  "type": "类型（login/register）",
  "expires_at": "过期时间（时间戳）",
  "created_at": "创建时间（时间戳）",
  "used": "是否已使用（布尔值）",
  "used_at": "使用时间（时间戳）"
}
```

### 步骤2：上传云函数（3分钟）

在 HBuilderX 中：

```bash
1. 右键 uniCloud-aliyun/cloudfunctions/user-send-sms
   → 点击"上传部署"

2. 右键 uniCloud-aliyun/cloudfunctions/user-login
   → 点击"上传部署"

3. 等待上传成功提示
```

### 步骤3：运行测试（2分钟）

```bash
1. HBuilderX: 运行 → 运行到浏览器 / 运行到小程序模拟器
2. 访问登录页：pages/login/sms-login
3. 输入手机号（任意11位数字）
4. 点击"获取验证码"
5. 控制台会显示：【开发模式】验证码：123456
6. 输入验证码并登录
```

---

## 🔧 开发模式说明

### 当前配置（开发阶段）

云函数 `user-send-sms/index.js` 第49行：

```javascript
// 开发模式：直接返回验证码（上线前必须删除）
const isDev = process.env.NODE_ENV === 'development' || true  // ← 当前启用
```

**开发模式特点：**
- ✅ 不发送真实短信
- ✅ 直接返回验证码用于测试
- ✅ 页面显示验证码（仅开发）
- ✅ 控制台打印验证码

---

## 📱 生产部署配置

### 步骤1：开通短信服务（阿里云/腾讯云）

#### 选项A：阿里云短信

```bash
1. 登录 https://www.aliyun.com/product/sms
2. 开通短信服务
3. 申请签名和模板
4. 获取 AccessKey 和 SecretKey
```

**短信模板示例：**
```
您的验证码是：${code}，${minutes}分钟内有效。
```

#### 选项B：腾讯云短信

```bash
1. 登录 https://console.cloud.tencent.com/smsv2
2. 开通短信服务
3. 申请签名和模板
4. 获取 SecretId 和 SecretKey
```

### 步骤2：配置云函数环境变量

在 uniCloud Web 控制台：

```bash
1. 进入云服务空间
2. 云函数 → user-send-sms → 详情
3. 配置 → 环境变量
4. 添加以下变量：
   - SMS_PROVIDER: aliyun 或 tencent
   - SMS_ACCESS_KEY: 你的AccessKey
   - SMS_SECRET_KEY: 你的SecretKey
   - SMS_TEMPLATE_ID: 模板ID
   - SMS_SIGN_NAME: 签名名称
```

### 步骤3：修改云函数代码

修改 `user-send-sms/index.js` 第49行：

```javascript
// 关闭开发模式
const isDev = process.env.NODE_ENV === 'development' || false  // ← 改为 false
```

解除注释第59-73行的真实短信发送代码：

```javascript
// 生产模式：调用短信服务
const smsResult = await uniCloud.sendSms({
    phoneNumber: phone,
    templateId: process.env.SMS_TEMPLATE_ID,
    data: {
        code: code
    }
})

if (!smsResult.success) {
    throw new Error('短信发送失败')
}
```

### 步骤4：修改登录页面

修改 `pages/login/sms-login.vue` 第20行：

```javascript
devMode: false,  // ← 改为 false，隐藏验证码显示
```

---

## 💰 短信成本估算

### 阿里云短信价格
| 发送量 | 单价 | 月成本（1000用户） |
|--------|------|-------------------|
| 0-10万条 | 0.045元/条 | 45元 |
| 10-30万条 | 0.040元/条 | 40元 |
| 30万条以上 | 0.035元/条 | 35元 |

### 腾讯云短信价格
| 发送量 | 单价 | 月成本（1000用户） |
|--------|------|-------------------|
| 0-10万条 | 0.055元/条 | 55元 |
| 10-30万条 | 0.052元/条 | 52元 |
| 30万条以上 | 0.050元/条 | 50元 |

**估算说明：**
- 假设每用户每月登录2次
- 1000用户 × 2次 = 2000条短信
- 成本：约 90-110元/月

---

## 🧪 测试清单

### 功能测试
- [ ] 手机号格式验证
- [ ] 验证码发送成功
- [ ] 验证码倒计时正常
- [ ] 验证码验证正确性
- [ ] 验证码过期处理
- [ ] 登录成功保存token
- [ ] 新用户自动注册
- [ ] 老用户直接登录

### 安全测试
- [ ] 验证码有效期（3分钟）
- [ ] 验证码只能使用一次
- [ ] 手机号格式严格验证
- [ ] 防止频繁发送验证码
- [ ] token安全存储

### 体验测试
- [ ] 页面响应速度快
- [ ] 错误提示友好
- [ ] 开发模式验证码可见
- [ ] 生产模式验证码隐藏

---

## 🔍 测试流程

### 开发环境测试

```bash
1. 访问登录页：pages/login/sms-login
2. 输入手机号：13800138000
3. 点击"获取验证码"
4. 查看控制台或页面显示的验证码
5. 输入验证码
6. 点击"登录"
7. 验证登录成功
```

### 生产环境测试

```bash
1. 上传配置好的云函数
2. 访问登录页
3. 输入真实手机号
4. 点击"获取验证码"
5. 检查手机是否收到短信
6. 输入验证码并登录
7. 验证登录成功
```

---

## 📊 数据库查看

### 查看验证码记录

```bash
1. uniCloud Web 控制台
2. 云数据库 → sms-codes
3. 查看验证码发送记录
```

### 查看用户记录

```bash
1. uniCloud Web 控制台
2. 云数据库 → uni-id-users
3. 查看新注册的用户
```

---

## 🛠️ 常见问题

### 问题1：验证码发送失败

**原因：**
- 云函数未上传
- 数据库表未创建
- 手机号格式错误

**解决：**
```bash
1. 检查云函数是否上传成功
2. 检查 sms-codes 表是否存在
3. 检查手机号是否11位数字
4. 查看云函数日志
```

### 问题2：验证码验证失败

**原因：**
- 验证码过期（3分钟）
- 验证码已使用
- 输入错误

**解决：**
```bash
1. 重新获取验证码
2. 在3分钟内使用
3. 仔细核对验证码
```

### 问题3：登录成功但没保存信息

**原因：**
- Storage 保存失败
- 数据格式错误

**解决：**
```javascript
// 在登录成功后添加日志
console.log('Token:', token)
console.log('UserInfo:', userInfo)

// 检查 Storage
const savedToken = uni.getStorageSync('uni_id_token')
console.log('Saved Token:', savedToken)
```

### 问题4：生产环境短信发送失败

**原因：**
- 短信服务未配置
- AccessKey 错误
- 模板未审核通过
- 账户余额不足

**解决：**
```bash
1. 检查环境变量配置
2. 验证 AccessKey 正确性
3. 确认模板状态为"已审核"
4. 充值短信账户
```

---

## 🎯 使用示例

### 在页面中使用

```vue
<template>
  <button @click="createCarpool">发起拼车</button>
</template>

<script>
import Auth from '@/utils/auth.js'

export default {
  methods: {
    createCarpool() {
      Auth.requireLogin(() => {
        // 已登录，执行业务逻辑
        uni.navigateTo({
          url: '/pages/carpool/create/create'
        })
      })
    }
  }
}
</script>
```

### 在云函数中验证token

```javascript
// 需要鉴权的云函数
exports.main = async (event, context) => {
    // 验证token
    const payload = await uniCloud.verifyToken(context.TOKEN)
    
    if (!payload || !payload.uid) {
        return {
            code: 401,
            message: '未登录或登录已过期'
        }
    }
    
    const userId = payload.uid
    
    // 业务逻辑...
}
```

---

## 📈 性能优化

### 1. 防止频繁发送

在云函数中添加限制：

```javascript
// 检查60秒内是否已发送
const recentSms = await smsCollection
    .where({
        phone: phone,
        created_at: dbCmd.gt(Date.now() - 60000)
    })
    .count()

if (recentSms.total > 0) {
    return {
        code: 429,
        message: '请求过于频繁，请稍后再试'
    }
}
```

### 2. 验证码缓存优化

使用 Redis 缓存验证码（如果有）：

```javascript
// 设置验证码
await redis.set(`sms:${phone}`, code, 'EX', 180)

// 验证
const cachedCode = await redis.get(`sms:${phone}`)
if (cachedCode !== code) {
    throw new Error('验证码错误')
}
```

---

## 🔒 安全建议

1. **生产环境必须关闭开发模式**
2. **验证码只能使用一次**
3. **设置合理的发送频率限制**
4. **手机号严格格式验证**
5. **token 定期刷新**
6. **敏感信息加密存储**

---

## 📝 上线检查清单

- [ ] 开发模式已关闭（`isDev = false`）
- [ ] 短信服务已配置（AccessKey等）
- [ ] 环境变量已设置
- [ ] 短信模板已审核通过
- [ ] 云函数已上传最新版本
- [ ] 数据库表已创建
- [ ] 真机测试通过
- [ ] 短信余额充足

---

## 🎉 完成标准

✅ 开发环境测试通过  
✅ 验证码收发正常  
✅ 登录流程顺畅  
✅ 数据正确保存  
✅ 安全措施到位  

---

## 📞 技术支持

遇到问题可以：
1. 查看云函数日志
2. 检查数据库数据
3. 参考 spec-kit 规范
4. 查看官方文档

祝部署顺利！🚀

