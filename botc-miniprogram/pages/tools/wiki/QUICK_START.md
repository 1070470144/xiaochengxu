# 血染百科功能 - 快速开始

## ⚡ 5分钟快速部署

### 步骤1：上传云函数（2分钟）

打开 HBuilderX：

```bash
1. 展开 uniCloud-aliyun/cloudfunctions
2. 右键 wiki-parse-url → 上传部署 ✅
3. 右键 wiki-search → 上传部署 ✅
4. 右键 wiki-detail → 上传部署 ✅
```

**等待上传完成**（首次需要安装依赖，约1-2分钟）

---

### 步骤2：创建数据库（2分钟）

打开 uniCloud Web控制台：

```bash
1. 访问 https://unicloud.dcloud.net.cn
2. 选择你的云服务空间
3. 点击"云数据库"
4. 点击"新建集合"，创建以下3个集合：
   - wiki_entries ✅
   - wiki_favorites ✅
   - wiki_search_history ✅
```

**导入 Schema**：
- 在每个集合中点击"DB Schema"
- 复制对应的 .schema.json 文件内容
- 粘贴并保存

---

### 步骤3：运行测试（1分钟）

在微信开发者工具中：

```bash
1. 运行小程序
2. 进入：工具 → 血染百科
3. 点击"导入百科链接"
4. 粘贴测试URL：
   https://clocktower-wiki.gstonegames.com/index.php?title=洗衣妇
5. 点击"开始导入"
6. 等待解析完成
7. 查看详情页 ✅
```

---

## ✅ 部署完成！

现在你可以：
- ✅ 导入任何钟楼百科页面
- ✅ 搜索已导入的词条
- ✅ 收藏常用词条
- ✅ 查看详细内容

---

## 🎯 测试URL清单

### 快速测试这些URL：

#### 角色
```
洗衣妇：
https://clocktower-wiki.gstonegames.com/index.php?title=洗衣妇

厨师：
https://clocktower-wiki.gstonegames.com/index.php?title=厨师

小恶魔：
https://clocktower-wiki.gstonegames.com/index.php?title=小恶魔
```

#### 规则
```
规则概要：
https://clocktower-wiki.gstonegames.com/index.php?title=规则概要
```

#### 剧本
```
暗流涌动：
https://clocktower-wiki.gstonegames.com/index.php?title=暗流涌动
```

---

## 💡 使用技巧

### 技巧1：批量导入
```
1. 在浏览器打开钟楼百科
2. 浏览感兴趣的页面
3. 复制URL
4. 在小程序中导入
5. 重复步骤2-4
```

### 技巧2：快速访问
```
- 导入后的词条会显示在"最近导入"
- 常用词条可以收藏
- 使用搜索快速查找
```

### 技巧3：离线查看
```
- 导入过的词条会缓存
- 没有网络也能查看已缓存的内容
```

---

## ⚠️ 注意事项

### 1. URL 必须是钟楼百科
只支持 `clocktower-wiki.gstonegames.com` 域名的页面

### 2. 首次导入需要等待
第一次导入需要3-5秒，请耐心等待

### 3. 图片加载可能较慢
图片来自百科网站，加载速度取决于网络

### 4. 定期清理缓存
缓存会在7天后自动过期，也可以手动刷新

---

## 🆘 遇到问题？

### 导入失败
1. 检查URL是否正确
2. 检查网络连接
3. 查看云函数日志
4. 重试导入

### 显示异常
1. 刷新页面
2. 清除缓存
3. 重新导入

### 云函数报错
1. 查看 uniCloud 控制台日志
2. 检查依赖是否安装
3. 验证数据库配置

---

## 📞 获取帮助

- 查看详细文档：`WIKI_IMPLEMENTATION_GUIDE.md`
- 查看测试用例：`TEST_CASES.md`
- 查看部署指南：`DEPLOYMENT_GUIDE.md`

---

**文档版本**: v1.0.0  
**创建时间**: 2025年10月17日

