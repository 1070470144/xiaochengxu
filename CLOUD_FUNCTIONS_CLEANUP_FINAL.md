# 云函数清理 - 最终方案

## ⚠️ 当前问题
云函数数量已达上限，需要删除不使用的云函数。

---

## ✅ 实际使用的云函数（通过代码搜索确认）

### Wiki相关（4个 - 必须保留）
- `wiki-role-toggle-like` ✅ 在 detail.vue 中使用
- `wiki-role-comment-add` ✅ 在 detail.vue 中使用
- `wiki-role-comment-list` ✅ 在 detail.vue 中使用
- `wiki-ranking-storytellers` ✅ 在 ranking/index.vue 中使用

### Script相关（必须保留）
- `script-detail` ✅ 剧本详情
- `script-download` ✅ 下载剧本（复制JSON、下载JSON功能）
- `script-generate-hd-preview` ✅ 生成预览图
- `script-my-uploads` ✅ 我的上传
- `script-delete` ✅ 删除剧本
- `script-review-create` ✅ 创建评论
- `script-list` ✅ 剧本列表
- `script-upload` ✅ 上传剧本
- `script-calculate-heat` ✅ 计算热度

### Carpool相关（拼车功能）
- `carpool-list`
- `carpool-detail`
- `carpool-create`
- `carpool-apply`
- `carpool-cancel-apply`
- `carpool-applied-list`

### Post/Community相关（社区功能）
- `post-list`
- `post-detail`
- `post-create`
- `post-like`
- `comment-create`

### User相关
- `user-login`
- `user-logout`
- `user-info`
- `user-profile`
- `user-update`
- `user-stats`
- `user-send-sms`
- `user-follow`
- `user-follow-sync`
- `user-followers-list`
- `user-following-list`

### Favorite/History相关
- `favorite-add`
- `favorite-remove`
- `favorites-list`
- `history-add`
- `history-list`

### Shop相关（店铺功能）
- `shop-list`
- `shop-detail`
- `shop-apply`

### Storyteller相关
- `storyteller-list`
- `storyteller-detail`
- `storyteller-reviews`

### Home相关
- `home-data`

---

## 🗑️ 可以删除的云函数（共15个）

### 1. Wiki旧版本（8个）
```
✅ wiki-check-favorite      - 空文件夹
✅ wiki-recent-imports      - 空文件夹  
✅ wiki-toggle-favorite     - 空文件夹
✅ wiki-parse-url          - 旧版导入功能
✅ wiki-search             - 旧版搜索（改为直接查询数据库）
✅ wiki-categories         - 不再使用
✅ wiki-list               - 直接查询数据库
✅ wiki-detail             - 直接查询数据库
```

### 2. Chat功能（如果不用聊天）
```
❓ chat-conversation-list  - 聊天列表
❓ chat-conversations      - 聊天对话
❓ chat-mark-read         - 标记已读
❓ chat-send              - 发送消息
❓ chat-send-message      - 发送消息（与chat-send重复？）
```

### 3. 系统功能（慎重）
```
❓ uni-stat-cron          - 统计定时任务
❓ uni-stat-receiver      - 统计数据接收
❓ uni-analyse-searchhot  - 搜索热词分析
❓ uni-upgrade-center     - 应用升级中心
❓ uni-portal             - 门户网站
❓ uni-sms-co             - 短信服务
```

---

## 🎯 推荐删除方案

### 方案A: 保守删除（释放8个空间）
只删除确定不用的Wiki旧云函数：
```
1. wiki-check-favorite
2. wiki-recent-imports  
3. wiki-toggle-favorite
4. wiki-parse-url
5. wiki-search
6. wiki-categories
7. wiki-list
8. wiki-detail
```

### 方案B: 激进删除（释放13-18个空间）
如果确定不需要聊天功能，额外删除：
```
9. chat-conversation-list
10. chat-conversations
11. chat-mark-read
12. chat-send
13. chat-send-message
```

### 方案C: 最大清理（释放18+个空间）
如果确定不需要某些系统功能，再删除：
```
14. uni-analyse-searchhot  （如果不需要搜索热词分析）
15. uni-upgrade-center     （如果不需要应用升级功能）
16. uni-portal             （如果不需要门户网站）
```

---

## 📝 删除操作步骤

### HBuilderX中删除本地文件夹
```bash
1. 展开 botc-miniprogram/uniCloud-aliyun/cloudfunctions/
2. 找到要删除的云函数文件夹
3. 右键 → 删除
4. 确认删除
```

### uniCloud控制台删除云端
```bash
1. 登录 uniCloud Web控制台
2. 进入"云函数/云对象"
3. 找到要删除的云函数
4. 点击"删除"按钮
5. 确认删除
```

---

## ⚡ 快速清理命令（推荐）

### 第一批：删除空文件夹（本地）
```
右键删除以下文件夹：
- wiki-check-favorite
- wiki-recent-imports  
- wiki-toggle-favorite
```

### 第二批：从云端删除不用的（控制台）
```
在控制台删除：
- wiki-parse-url
- wiki-search
- wiki-categories
- wiki-list
- wiki-detail
```

### 第三批：如果还不够，删除聊天相关（可选）
```
如果你的app不需要聊天功能：
- chat-conversation-list
- chat-conversations
- chat-mark-read
- chat-send
- chat-send-message
```

---

## 🔍 如何确认云函数是否在用

### 方法1: 全局搜索
```
Ctrl+Shift+F → 搜索云函数名称 → 查看是否有调用
```

### 方法2: 查看调用日志
```
uniCloud控制台 → 云函数 → 点击函数名 → 查看"调用日志"
如果最近30天没有调用 → 可能不再使用
```

### 方法3: 临时禁用测试
```
1. 在控制台禁用云函数
2. 测试app功能
3. 如果没有报错 → 可以删除
4. 如果有报错 → 需要保留
```

---

## 🎊 清理后效果

### 删除8个wiki旧云函数后：
- ✅ 释放8个云函数空间
- ✅ 可以上传新的4个wiki v3.0云函数
- ✅ 还剩4个空间备用

### 如果再删除5个chat云函数：
- ✅ 释放13个云函数空间
- ✅ 足够未来扩展使用

---

## 📞 需要确认

请告诉我：
1. **聊天功能是否还需要？** 如果不需要，可以删除5个chat云函数
2. **统计分析功能是否需要？** uni-stat-*、uni-analyse-*
3. **应用升级功能是否需要？** uni-upgrade-center

根据你的回答，我可以给出更精确的删除建议！

