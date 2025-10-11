# 数据库权限配置修复指南

## 🔧 问题说明

错误信息：`Invalid uni-id config file` 和 `SYSTEM_ERROR`

**原因：**
1. 缺少 uni-id 配置文件
2. 数据库表缺少权限配置

---

## ✅ 已完成的修复

### 1. 创建 uni-id 配置文件
- ✅ 已创建 `cloudfunctions/common/uni-config-center/uni-id/config.json`

### 2. 添加数据库表权限
- ✅ `botc-scripts.schema.json` - 剧本表
- ✅ `botc-carpool-rooms.schema.json` - 拼车房间表
- ✅ 已同步到 botc-admin 管理端

### 权限配置说明

```json
{
  "permission": {
    "read": true,                          // 所有人可读
    "create": "auth.uid != null",         // 登录用户可创建
    "update": "auth.uid == doc.creator_id", // 只有创建者可更新
    "delete": "auth.uid == doc.creator_id"  // 只有创建者可删除
  }
}
```

---

## 📤 必须执行的上传步骤

### 步骤1：上传 uni-id 配置

在 HBuilderX 中：

```
1. 找到文件：
   botc-miniprogram/uniCloud-aliyun/cloudfunctions/common/uni-config-center/

2. 右键点击 "uni-config-center" 目录

3. 选择 "上传配置中心配置"

4. 等待上传成功提示
```

### 步骤2：上传数据库表 Schema

在 HBuilderX 中：

```
1. 找到文件：
   botc-miniprogram/uniCloud-aliyun/database/botc-scripts.schema.json

2. 右键点击文件

3. 选择 "上传 DB Schema 及扩展校验函数"

4. 等待上传成功
```

同样操作以下文件：
- `botc-carpool-rooms.schema.json`
- `botc-posts.schema.json`（如果还没上传）
- `botc-shops.schema.json`（如果还没上传）

---

## 🚀 快速修复流程（推荐）

### 一键上传所有配置

在 HBuilderX 中：

```
1. 右键点击 botc-miniprogram/uniCloud-aliyun 目录

2. 选择 "上传所有云函数、公共模块及配置"

3. 勾选：
   ✅ 上传数据库 Schema
   ✅ 上传配置中心
   
4. 点击确认，等待上传完成
```

---

## 🔍 验证修复

### 方法1：在 HBuilderX 控制台查看

```
1. 停止当前运行
2. 重新运行项目
3. 查看控制台，不应再有以下错误：
   ❌ Invalid uni-id config file
   ❌ SYSTEM_ERROR
```

### 方法2：在 uniCloud Web 控制台查看

```
1. 打开 uniCloud Web 控制台
   https://unicloud.dcloud.net.cn/

2. 选择您的服务空间
   mp-1e0f6630-18c8-400c-99ff-761aea3a4e83

3. 查看数据库 Schema
   - 进入 "数据库" → "表结构"
   - 找到 botc-scripts
   - 查看是否有 "permission" 配置

4. 查看配置中心
   - 进入 "云函数/云对象" → "配置中心"
   - 查看 uni-id 配置是否存在
```

---

## 🎯 常见问题

### Q1: 上传后仍然报错？
**A:** 尝试以下步骤：
1. 完全关闭 HBuilderX
2. 重新打开 HBuilderX
3. 在项目上右键 → "关联云服务空间"
4. 确认服务空间正确
5. 重新运行项目

### Q2: 提示 "uni-id 配置格式错误"？
**A:** 检查 `config.json` 文件：
- 确保是有效的 JSON 格式
- 如果需要使用微信登录，需要填写真实的 appid 和 appsecret

### Q3: 数据库表权限如何修改？
**A:** 权限说明：
- `true` - 所有人（包括未登录用户）
- `false` - 任何人都不可以
- `"auth.uid != null"` - 登录用户
- `"auth.uid == doc.creator_id"` - 仅创建者

---

## 📝 uni-id 配置文件说明

### 最小配置（当前使用）

```json
{
  "passwordSecret": "passwordSecret-demo",  // 密码加密密钥（需修改）
  "tokenSecret": "tokenSecret-demo",        // Token 加密密钥（需修改）
  "tokenExpiresIn": 7200,                   // Token 过期时间（秒）
  "mp-weixin": {
    "oauth": {
      "weixin": {
        "appid": "your-mp-weixin-appid",      // 微信小程序 AppID
        "appsecret": "your-mp-weixin-appsecret" // 微信小程序 AppSecret
      }
    }
  }
}
```

### ⚠️ 安全提示

**生产环境必须修改：**
- `passwordSecret` - 用于密码加密，必须修改为随机字符串
- `tokenSecret` - 用于 Token 签名，必须修改为随机字符串

**建议使用随机字符串生成器：**
- 至少 32 位
- 包含大小写字母、数字、特殊字符

---

## 🔐 推荐配置（生产环境）

```json
{
  "passwordSecret": "your-random-secret-key-at-least-32-chars",
  "tokenSecret": "your-random-token-secret-at-least-32-chars",
  "tokenExpiresIn": 7200,
  "tokenExpiresThreshold": 600,
  "passwordErrorLimit": 6,
  "passwordErrorRetryTime": 3600,
  "mp-weixin": {
    "oauth": {
      "weixin": {
        "appid": "wxxxxxxxxxxxxxxxxxxx",
        "appsecret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      }
    }
  },
  "service": {
    "sms": {
      "name": "your-sms-template-name",
      "codeExpiresIn": 300,
      "smsKey": "your-sms-key",
      "smsSecret": "your-sms-secret"
    }
  }
}
```

---

## ✨ 修复完成检查清单

- [ ] 已上传 uni-id 配置
- [ ] 已上传 botc-scripts.schema.json
- [ ] 已上传 botc-carpool-rooms.schema.json
- [ ] 已重启 HBuilderX
- [ ] 已重新运行项目
- [ ] 控制台无 "Invalid uni-id config file" 错误
- [ ] 剧本列表可以正常加载
- [ ] 拼车列表可以正常加载

---

## 🎉 总结

修复步骤：
1. ✅ 创建 uni-id 配置文件
2. ✅ 添加数据库表权限
3. 📤 **上传配置到云端（必须执行）**
4. 🔄 重启 HBuilderX
5. ✅ 验证修复成功

**完成这些步骤后，错误应该解决！** 🎊

