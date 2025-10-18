# 🔄 重新同步获取v2.1详细内容

## 🎯 问题

管理后台详情页看不到10个详细字段（背景故事、范例等）

## 🔍 原因

当前数据库中的"洗衣妇"数据是用 **v2.0 版本**同步的，只有基础内容，没有 `role_detail` 字段。

需要用 **v2.1 版本**的云函数重新同步！

---

## ✅ 解决方案

### Step 1: 上传v2.1云函数（必须！）

```bash
在 HBuilderX botc-admin 项目：

1. 右键 wiki-admin-sync-all → 上传部署
   ✅ 包含 parser-utils.js 解析库

2. 右键 wiki-admin-sync-single → 上传部署
   ✅ 包含详细解析逻辑

3. 等待上传成功
```

### Step 2: 删除旧数据

```bash
方法A（推荐）：在管理后台删除
1. 百科管理 → 找到"洗衣妇"
2. 点击"删除"按钮
3. 确认删除

方法B：在数据库删除
1. uniCloud控制台 → wiki_entries
2. 找到"洗衣妇"记录
3. 删除
```

### Step 3: 重新同步

```bash
1. 刷新管理后台（Ctrl + F5）

2. 进入"百科同步"

3. 在"单个同步"输入：
   https://clocktower-wiki.gstonegames.com/index.php?title=洗衣妇

4. 点击"同步"

5. 等待10-20秒

6. 应该提示"同步成功（新增）"
```

### Step 4: 验证数据

```bash
1. uniCloud控制台 → wiki_entries

2. 点击"洗衣妇"记录

3. 查看JSON数据，应该包含：
   {
     "title": "洗衣妇",
     "role_detail": {           ← 🆕 新字段
       "background_story": "...", ✅
       "ability": "...",          ✅
       "introduction": [...],     ✅
       "examples": [...],         ✅
       "mechanics": [...],        ✅
       "reminder_tokens": [...],  ✅
       "rule_details": [...],     ✅
       "tips_and_tricks": [...],  ✅
       "bluff_tips": [...],       ✅
       "character_info": {...}    ✅
     }
   }
```

### Step 5: 查看详情页

```bash
1. 管理后台 → 百科管理

2. 点击"洗衣妇"的"查看"按钮

3. 应该看到：
   📖 背景故事
   🎯 角色能力
   📝 角色简介（X段）
   📌 范例（X条）
   ⚙️ 运作方式（X步）
   🏷️ 提示标记（X个）
   📜 规则细节（X条）
   💡 提示与技巧（X条）
   🎭 伪装方法（X条）
   ℹ️ 角色信息
```

---

## 🎯 检查云函数是否包含解析逻辑

### 查看云函数文件

```bash
botc-admin/uniCloud-aliyun/cloudfunctions/wiki-admin-sync-all/
├── index.js ✅ （应该包含 const parserUtils = require('./parser-utils.js')）
├── parser-utils.js ✅ （解析工具库）
└── package.json
```

### 验证代码

在 `index.js` 中应该有：

```javascript
// 引入解析工具
const parserUtils = require('./parser-utils.js');

// 在 parseMediaWikiPage 函数中
if (entryType === 'role') {
  role_detail = parserUtils.parseRoleDetail(html);
}

// 返回数据中包含
return {
  // ...
  role_detail: role_detail  // 🆕 v2.1
};
```

---

## 🐛 如果重新同步后还是没有

### 检查1：查看云函数日志

```bash
HBuilderX：
右键 wiki-admin-sync-single → 云函数日志

查找：
- [parseRoleDetail] 开始详细解析
- 背景故事: ✓
- 角色能力: ✓
- ...

如果看到这些日志，说明解析在执行
```

### 检查2：查看浏览器控制台

```bash
F12 → Console

查找：
- 是否有错误
- parser-utils 是否加载成功
```

### 检查3：手动查看数据库

```bash
uniCloud控制台 → wiki_entries → 洗衣妇

查看原始JSON，是否有 role_detail 字段
```

---

## 💡 快速测试

在管理后台，F12控制台运行：

```javascript
// 查看最新同步的数据
const db = uniCloud.database();
db.collection('wiki_entries')
  .where({ title: '洗衣妇' })
  .get()
  .then(res => {
    const data = res.result?.data || res.data || [];
    if (data[0]) {
      console.log('=== 洗衣妇数据 ===');
      console.log('role_detail存在:', !!data[0].role_detail);
      console.log('role_detail内容:', data[0].role_detail);
    }
  });
```

**看看控制台输出 role_detail 是否存在？**

---

## 🎯 现在请操作

1. ✅ **确认已上传v2.1云函数**（包含parser-utils.js）
2. ✅ **删除旧的"洗衣妇"数据**
3. ✅ **重新同步**
4. ✅ **查看数据库是否有role_detail**
5. ✅ **告诉我结果**

根据结果我会继续帮您调试！🔧

---

**重要提示**: 必须重新同步才能获得详细内容！

