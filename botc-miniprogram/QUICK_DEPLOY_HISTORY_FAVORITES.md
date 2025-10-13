# 🚀 快速部署浏览历史和收藏功能

## ⚠️ 重要提示

如果浏览历史没有记录，请按照以下步骤**依次**完成部署。

---

## 📝 部署清单

### ✅ 第一步：上传数据库 Schema（2个表）

#### 方法1：HBuilderX 上传（推荐）

1. 在 HBuilderX 项目管理器中找到：
   ```
   botc-miniprogram
     └─ uniCloud-aliyun
        └─ database
           ├─ botc-browse-history.schema.json
           └─ botc-favorites.schema.json
   ```

2. **右键** `botc-browse-history.schema.json` → 点击 **"上传DB Schema及扩展校验函数"**

3. **右键** `botc-favorites.schema.json` → 点击 **"上传DB Schema及扩展校验函数"**

4. 等待上传成功提示

#### 方法2：Web 控制台手动创建

如果上传失败，可以在 uniCloud Web 控制台手动创建表（参见本文档末尾）。

---

### ✅ 第二步：上传云函数（6个）

**必须上传的云函数**：

1. **`history-add`** - 记录浏览历史（⭐最关键）
   - 右键 `uniCloud-aliyun/cloudfunctions/history-add` → **上传部署**

2. **`history-list`** - 查询浏览历史
   - 右键 `uniCloud-aliyun/cloudfunctions/history-list` → **上传部署**

3. **`favorite-add`** - 添加收藏
   - 右键 `uniCloud-aliyun/cloudfunctions/favorite-add` → **上传部署**

4. **`favorite-remove`** - 取消收藏
   - 右键 `uniCloud-aliyun/cloudfunctions/favorite-remove` → **上传部署**

5. **`favorites-list`** - 查询收藏列表
   - 右键 `uniCloud-aliyun/cloudfunctions/favorites-list` → **上传部署**

6. **`user-stats`** - 用户统计（更新）
   - 右键 `uniCloud-aliyun/cloudfunctions/user-stats` → **上传部署**

**等待所有云函数上传成功**。

---

### ✅ 第三步：重启项目

1. 停止当前运行的项目（HBuilderX 顶部的红色停止按钮）

2. 重新运行项目：
   ```
   运行 → 运行到浏览器 → Chrome
   ```

3. 清除浏览器缓存（Ctrl+Shift+Delete）或使用无痕模式

---

### ✅ 第四步：测试

#### 测试步骤：

1. **登录账号**（必须登录）

2. **打开浏览器控制台**（F12）

3. **访问任意剧本详情页**

4. **查看控制台输出**，应该看到：
   ```
   ✅ 浏览历史记录成功
   ```

5. **进入"我的 → 浏览历史"**，应该能看到刚才浏览的剧本

---

## 🔍 调试指南

### 如果控制台显示错误：

#### 错误1：`找不到云函数 history-add`
**原因**：云函数没有上传
**解决**：重新上传 `history-add` 云函数

#### 错误2：`Collection 'botc-browse-history' does not exist`
**原因**：数据库表没有创建
**解决**：上传 `botc-browse-history.schema.json` 或手动创建表

#### 错误3：`Token无效`
**原因**：未登录或登录过期
**解决**：退出登录，重新登录

#### 错误4：没有任何错误，但历史中没有数据
**原因**：可能是数据权限问题
**解决**：
1. 检查 schema 中的 `permission.create` 是否正确
2. 在 Web 控制台手动插入一条测试数据

---

## 📊 手动创建数据库表（备用方案）

如果 Schema 上传失败，可以在 uniCloud Web 控制台手动创建：

### 1. 访问 uniCloud Web 控制台

```
https://unicloud.dcloud.net.cn
```

### 2. 选择服务空间

选择 `mp-1e0f6630-18c8-400c-99ff-761aea3a4e83`

### 3. 创建 `botc-browse-history` 表

1. 点击左侧 **"云数据库"**
2. 点击 **"新建数据表"**
3. 表名：`botc-browse-history`
4. 点击 **"新建"**

5. 点击表名 → **"表结构"** → **"编辑"**

6. 粘贴以下 JSON：

```json
{
  "bsonType": "object",
  "required": ["user_id", "target_type", "target_id"],
  "properties": {
    "_id": {
      "description": "历史记录ID"
    },
    "user_id": {
      "bsonType": "string",
      "description": "用户ID",
      "foreignKey": "uni-id-users._id"
    },
    "target_type": {
      "bsonType": "string",
      "description": "目标类型",
      "enum": ["script", "post", "carpool"]
    },
    "target_id": {
      "bsonType": "string",
      "description": "目标ID"
    },
    "created_at": {
      "bsonType": "timestamp",
      "description": "首次浏览时间",
      "forceDefaultValue": {
        "$env": "now"
      }
    },
    "updated_at": {
      "bsonType": "timestamp",
      "description": "最后浏览时间"
    }
  }
}
```

7. 点击 **"保存"**

### 4. 创建 `botc-favorites` 表

重复步骤3，表名改为 `botc-favorites`，使用以下 JSON：

```json
{
  "bsonType": "object",
  "required": ["user_id", "target_type", "target_id"],
  "properties": {
    "_id": {
      "description": "收藏ID"
    },
    "user_id": {
      "bsonType": "string",
      "description": "用户ID",
      "foreignKey": "uni-id-users._id"
    },
    "target_type": {
      "bsonType": "string",
      "description": "目标类型",
      "enum": ["script", "post"]
    },
    "target_id": {
      "bsonType": "string",
      "description": "目标ID"
    },
    "created_at": {
      "bsonType": "timestamp",
      "description": "收藏时间",
      "forceDefaultValue": {
        "$env": "now"
      }
    }
  }
}
```

---

## 🧪 验证部署成功

### 方法1：控制台验证

打开浏览器控制台（F12），访问剧本详情页，应该看到：

```
📱 完整的 userInfo： {uid: "xxx", ...}
✅ 当前用户ID： xxx
✅ 浏览历史记录成功
```

### 方法2：数据库验证

1. 访问 uniCloud Web 控制台
2. 点击 `botc-browse-history` 表
3. 点击 **"数据"** 标签
4. 应该能看到新增的浏览记录

### 方法3：界面验证

1. 进入"我的"页面
2. 点击"浏览历史"
3. 应该能看到刚才浏览的内容

---

## ⚡ 快速检查清单

在部署前，请确认：

- ✅ 已上传 `botc-browse-history.schema.json`
- ✅ 已上传 `botc-favorites.schema.json`
- ✅ 已上传 `history-add` 云函数
- ✅ 已上传 `history-list` 云函数
- ✅ 已上传 `favorite-add` 云函数
- ✅ 已上传 `favorite-remove` 云函数
- ✅ 已上传 `favorites-list` 云函数
- ✅ 已上传 `user-stats` 云函数
- ✅ 已重启项目
- ✅ 已清除浏览器缓存
- ✅ 已登录账号

---

## 💡 常见问题

### Q1: 为什么我看不到控制台输出？

**A**: 打开浏览器开发者工具（F12），切换到 **"Console"** 标签。

### Q2: 云函数上传后需要等待吗？

**A**: 通常立即生效，但建议等待 10 秒后再测试。

### Q3: 数据库表创建后需要手动创建字段吗？

**A**: 不需要，Schema 会自动创建字段。

### Q4: 如何确认云函数上传成功？

**A**: 在 HBuilderX 底部的控制台会显示 **"云函数上传成功"**。

### Q5: 为什么已经登录了还是没有记录？

**A**: 
1. 检查控制台是否有错误
2. 确认 `Auth.isLogin()` 返回 `true`
3. 检查 `Auth.getToken()` 是否返回有效 token

---

## 🎯 最简单的测试方法

如果你不确定哪里出问题，按照以下步骤一步一步来：

### 步骤1：确认登录状态

打开控制台（F12），输入：

```javascript
uni.getStorageSync('userInfo')
```

应该返回用户信息，而不是空。

### 步骤2：手动调用云函数测试

在控制台输入：

```javascript
uniCloud.callFunction({
  name: 'history-add',
  data: {
    target_type: 'script',
    target_id: 'test_id',
    token: uni.getStorageSync('uni_id_token')
  }
}).then(res => {
  console.log('测试结果：', res)
})
```

如果返回 `{ code: 0, message: '记录成功' }`，说明云函数正常。

### 步骤3：检查数据库

在 uniCloud Web 控制台查看 `botc-browse-history` 表，应该有一条 `target_id` 为 `test_id` 的记录。

---

**如果按照以上步骤还是有问题，请查看控制台的具体错误信息，然后根据错误信息进行修复。** 🔧

