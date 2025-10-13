# 剧本评价功能修复

## 🐛 问题原因

**提交剧本评价失败的原因：**

1. ❌ 前端调用 `comment-add` 云函数，但该云函数不存在
2. ❌ 现有的 `comment-create` 云函数是用于社区帖子，不适用于剧本评价
3. ❌ 缺少剧本评价的数据表 `botc-script-reviews`

---

## ✅ 已完成的修复

### **1. 创建剧本评价云函数**

```
botc-miniprogram/uniCloud-aliyun/cloudfunctions/script-review-create/
├── index.js       ✅ 云函数实现
└── package.json   ✅ 配置文件
```

**功能：**
- ✅ 验证用户登录状态
- ✅ 验证评分（1-5星）
- ✅ 验证评价内容
- ✅ 检查用户是否已评价过（防止重复评价）
- ✅ 自动计算并更新剧本的平均评分
- ✅ 返回用户信息

### **2. 创建数据库Schema**

```
botc-miniprogram/uniCloud-aliyun/database/botc-script-reviews.schema.json
```

**表结构：**
- `script_id` - 剧本ID
- `user_id` - 用户ID
- `content` - 评价内容
- `rating` - 评分（1-5星）
- `like_count` - 点赞数
- `status` - 状态（0-待审核，1-已发布，2-已隐藏）
- `created_at` - 创建时间
- `updated_at` - 更新时间

**权限配置：**
- `read: true` - 所有人可读
- `create: auth.uid != null` - 登录用户可创建
- `update: auth.uid == doc.user_id` - 只有作者可更新
- `delete: auth.uid == doc.user_id` - 只有作者可删除

### **3. 修改前端代码**

**修改文件：**
`botc-miniprogram/pages/script/detail/detail.vue`

**提交评价：**
```javascript
// 改为调用 script-review-create
const result = await uniCloud.callFunction({
  name: 'script-review-create',
  data: {
    scriptId: this.scriptId,
    content: this.commentContent.trim(),
    rating: this.commentRating,
    token: Auth.getToken()  // 传递登录token
  }
})
```

**加载评价列表：**
```javascript
// 使用 JQL 联表查询
const result = await db.collection('botc-script-reviews,uni-id-users')
  .where(`botc-script-reviews.script_id == "${this.scriptId}" && botc-script-reviews.status == 1`)
  .field('botc-script-reviews.*,uni-id-users.nickname as user_nickname,uni-id-users.avatar as user_avatar')
  .orderBy('created_at', 'desc')
  .limit(20)
  .get()
```

---

## 🚀 现在请操作（3步）

### **步骤1：上传云函数** ⭐

```
1. 在 HBuilderX 中展开：
   botc-miniprogram
     └─ uniCloud-aliyun
         └─ cloudfunctions
             └─ script-review-create

2. 右键点击 script-review-create 文件夹

3. 选择："上传部署"

4. 等待上传成功
```

### **步骤2：上传数据库Schema**

```
1. 找到文件：
   botc-miniprogram/uniCloud-aliyun/database/botc-script-reviews.schema.json

2. 右键点击

3. 选择："上传Schema扩展Js的配置"

4. 等待上传成功
```

### **步骤3：重新运行小程序测试**

```
1. 刷新浏览器（F5）

2. 登录小程序

3. 进入任意剧本详情页

4. 点击"写评价"按钮

5. 选择星级评分（1-5星）

6. 输入评价内容

7. 点击"提交评价"

8. 应该提示"评价成功" ✅
```

---

## 🎯 功能说明

### **评价流程**

```
1. 用户点击"写评价"
   ↓
2. 选择星级评分（1-5星）
   ↓
3. 输入评价内容
   ↓
4. 点击"提交评价"
   ↓
5. 云函数验证：
   - ✅ 是否登录
   - ✅ 评分是否有效（1-5）
   - ✅ 内容是否为空
   - ✅ 是否已评价过
   ↓
6. 保存评价到数据库
   ↓
7. 更新剧本的平均评分
   ↓
8. 返回成功，刷新评价列表
```

### **防止重复评价**

```
每个用户对同一个剧本只能评价一次！

云函数会检查：
- 如果已评价 → 返回"您已经评价过这个剧本了"
- 如果未评价 → 允许提交
```

### **评分计算**

```
自动计算平均评分：

总评分 = 所有评价的评分之和
评价数量 = 所有评价的数量
平均评分 = 总评分 / 评价数量

示例：
- 用户A：5星
- 用户B：4星
- 用户C：5星
平均评分 = (5+4+5) / 3 = 4.7星
```

---

## 🎨 显示效果

### **评价列表**

```
┌─────────────────────────────────┐
│  用户评价          [写评价]      │
├─────────────────────────────────┤
│  张三             ⭐⭐⭐⭐⭐     │
│  剧本很好玩，推理很烧脑...        │
│  1小时前                         │
├─────────────────────────────────┤
│  李四             ⭐⭐⭐⭐       │
│  适合新手，机制简单...            │
│  3小时前                         │
└─────────────────────────────────┘
```

### **评价表单**

```
┌─────────────────────────────────┐
│  写评价                      ×   │
├─────────────────────────────────┤
│  评分：⭐⭐⭐⭐☆               │
│                                  │
│  ┌─────────────────────────┐   │
│  │ 说说你的想法...          │   │
│  │                          │   │
│  │                          │   │
│  └─────────────────────────┘   │
│                                  │
│          [提交评价]              │
└─────────────────────────────────┘
```

---

## ⚠️ 注意事项

### **1. 必须登录**

```
未登录状态 → 提示"请先登录"
登录后 → 可以提交评价
```

### **2. 评分必选**

```
未选择评分 → 提示"请选择评分"
选择评分后 → 可以提交
```

### **3. 内容必填**

```
内容为空 → 提示"请输入评价内容"
填写内容后 → 可以提交
```

### **4. 防止重复**

```
已评价过 → 提示"您已经评价过这个剧本了"
未评价过 → 可以提交
```

---

## 📊 数据库示例

### **botc-script-reviews 表**

```json
{
  "_id": "review_001",
  "script_id": "script_001",
  "user_id": "user_001",
  "content": "剧本很好玩，推理很烧脑，适合老手",
  "rating": 5,
  "like_count": 0,
  "status": 1,
  "created_at": 1760097600000,
  "updated_at": 1760097600000
}
```

### **botc-scripts 表（评分字段）**

```json
{
  "_id": "script_001",
  "title": "暗流涌动",
  "rating": 4.7,          // 平均评分
  "rating_count": 15,     // 评价数量
  // ... 其他字段
}
```

---

## 🆘 如果遇到问题

### **问题1：上传云函数失败**

```
解决方法：
1. 重启 HBuilderX
2. 检查网络连接
3. 重新关联服务空间
4. 再次上传
```

### **问题2：提交评价时报错"请先登录"**

```
解决方法：
1. 确认已登录
2. 检查 token 是否有效
3. 重新登录后尝试
```

### **问题3：评价列表加载失败**

```
解决方法：
1. 确认 Schema 已上传
2. 检查数据库权限配置
3. 查看控制台错误信息
```

---

## ✅ 验证清单

上传完成后，请验证以下功能：

- [ ] 云函数 script-review-create 已上传成功
- [ ] Schema botc-script-reviews.schema.json 已上传
- [ ] 小程序端可以打开评价弹窗
- [ ] 可以选择星级评分
- [ ] 可以输入评价内容
- [ ] 点击"提交评价"后提示成功
- [ ] 评价列表自动刷新
- [ ] 可以看到自己刚提交的评价
- [ ] 剧本的平均评分已更新
- [ ] 再次提交时提示"已评价过"

---

**现在请立即上传云函数和Schema，然后测试评价功能！** 🚀

