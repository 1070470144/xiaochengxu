# 🚀 血染百科 v2.1 部署指南

## ✅ v2.1 已完成！

**完整的结构化内容解析功能已开发完成！**

---

## 📦 更新内容

### botc-admin（管理后台）
1. ✅ `wiki-admin-sync-all/parser-utils.js` - 新增解析工具库
2. ✅ `wiki-admin-sync-all/index.js` - 集成详细解析
3. ✅ `wiki-admin-sync-single/index.obj.js` - 集成详细解析
4. ✅ `wiki_entries.schema.json` - 添加role_detail字段
5. ✅ `pages/botc/wiki/detail.vue` - 新增详情查看页面
6. ✅ `pages.json` - 添加detail路由

### botc-miniprogram（小程序）
7. ✅ `pages/tools/wiki/detail.vue` - 优化展示

---

## 🚀 部署步骤（10分钟）

### Step 1: 部署 botc-admin（5分钟）

#### 1.1 上传云函数
```bash
HBuilderX botc-admin 项目：

1. 右键 wiki-admin-sync-all → 上传部署
   （会自动上传 parser-utils.js）
   
2. 右键 wiki-admin-sync-single → 上传部署

3. 等待上传成功
```

#### 1.2 上传Schema
```bash
1. 右键 database/wiki_entries.schema.json
2. 选择"上传DB Schema"
3. 等待成功
```

#### 1.3 重新编译管理后台
```bash
1. 停止运行
2. 重新运行到浏览器
3. 等待编译完成
```

---

### Step 2: 测试解析（3分钟）

#### 2.1 清除旧数据
```bash
1. uniCloud控制台 → wiki_entries
2. 删除"洗衣妇"（如果存在）
```

#### 2.2 重新同步
```bash
1. 管理后台 → 百科同步
2. 单个同步输入：
   https://clocktower-wiki.gstonegames.com/index.php?title=洗衣妇
3. 点击"同步"
4. 等待完成
```

#### 2.3 查看数据
```bash
1. uniCloud控制台 → wiki_entries
2. 点击"洗衣妇"记录
3. 查看 role_detail 字段
4. 应该包含：
   - background_story ✅
   - ability ✅
   - introduction ✅
   - examples ✅
   - mechanics ✅
   - reminder_tokens ✅
   - rule_details ✅
   - tips_and_tricks ✅
   - bluff_tips ✅
   - character_info ✅
```

---

### Step 3: 查看展示效果（2分钟）

#### 3.1 管理后台查看
```bash
1. 百科管理 → 找到"洗衣妇"
2. 点击"查看"按钮
3. 进入详情页
4. 应该看到所有结构化内容
```

#### 3.2 小程序查看
```bash
1. 运行小程序
2. 工具 → 血染百科 → 洗衣妇
3. 查看详情
4. 应该看到10个内容卡片
5. 测试折叠/展开功能
```

---

## ✅ 验证清单

### 数据验证
- [ ] role_detail 字段存在
- [ ] background_story 有内容
- [ ] ability 有内容
- [ ] introduction 是数组且有多条
- [ ] examples 是数组且有多条
- [ ] mechanics 是数组且有多条
- [ ] reminder_tokens 是数组且有结构
- [ ] rule_details 是数组
- [ ] tips_and_tricks 是数组
- [ ] bluff_tips 是数组
- [ ] character_info 是对象且有字段

### 展示验证
- [ ] 管理后台详情页能打开
- [ ] 所有章节卡片显示正常
- [ ] 小程序详情页显示正常
- [ ] 折叠/展开功能正常
- [ ] UI美观大方

---

## 🎯 批量同步所有角色

验证单个角色成功后，可以批量同步：

```bash
1. 管理后台 → 百科同步
2. 点击"仅同步角色"
3. 等待5-10分钟
4. 同步24个角色
5. 所有角色都有详细内容
```

---

## 📊 v2.1 vs v2.0 对比

### 数据对比

**v2.0 数据**：
```json
{
  "title": "洗衣妇",
  "content": {
    "text": "所有内容混在一起...",
    "summary": "前300字..."
  }
}
```

**v2.1 数据**：
```json
{
  "title": "洗衣妇",
  "content": {...},
  "role_detail": {
    "background_story": "晚礼服上的血渍？...",
    "ability": "在你的首个夜晚...",
    "introduction": ["段落1", "段落2", "段落3"],
    "examples": [{scenario: "...", result: "..."}],
    "mechanics": ["步骤1", "步骤2"],
    "reminder_tokens": [{name: "镇民", details: [...]}],
    "rule_details": ["规则1", "规则2"],
    "tips_and_tricks": ["技巧1", "技巧2"],
    "bluff_tips": ["方法1", "方法2"],
    "character_info": {
      "english_name": "Washerwoman",
      "character_type": "镇民",
      "belongs_to_scripts": ["暗流涌动"],
      "ability_categories": ["获取信息", "进场能力"]
    }
  }
}
```

---

## 🎊 v2.1 完成！

**现在您拥有的是：**
- ✅ 最完整的角色内容解析
- ✅ 最详细的数据结构
- ✅ 最专业的展示页面
- ✅ 媲美官方百科的体验

**立即部署，享受完整的百科系统！** 🎉

---

**版本**: v2.1.0  
**功能**: 详细内容结构化解析  
**状态**: ✅ 开发完成，可立即部署  
**完成时间**: 2025年10月17日

