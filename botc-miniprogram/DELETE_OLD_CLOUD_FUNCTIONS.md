# 🗑️ 删除旧云函数清单

## 📋 待删除的云函数

### Script 相关云函数（11个）

| # | 云函数名 | 替换为 | 状态 |
|---|---------|--------|------|
| 1 | `script-list` | `scriptObj.getList()` | 待删除 |
| 2 | `script-detail` | `scriptObj.getDetail()` | 待删除 |
| 3 | `script-upload` | `scriptObj.upload()` | 待删除 |
| 4 | `script-my-uploads` | `scriptObj.getMyUploads()` | 待删除 |
| 5 | `script-delete` | `scriptObj.delete()` | 待删除 |
| 6 | `script-review-create` | `scriptObj.createReview()` | 待删除 |
| 7 | `script-rating` | `scriptObj.rate()` | 待删除 |
| 8 | `script-json-get` | `scriptObj.getJson()` | 待删除 |
| 9 | `script-ranking-hot` | `scriptObj.getRankingHot()` | 待删除 |
| 10 | `script-ranking-new` | `scriptObj.getRankingNew()` | 待删除 |
| 11 | `script-ranking-rating` | `scriptObj.getRankingRating()` | 待删除 |
| 12 | `script-ranking-download` | `scriptObj.getRankingDownload()` | 待删除 |
| 13 | `script-calculate-heat` | `scriptObj.calculateHeat()` | 待删除 |

**⚠️ 保留：** `script-generate-json-url` - 用于外部 URL 访问，需要保留

---

### Carpool 相关云函数（9个）

| # | 云函数名 | 替换为 | 状态 |
|---|---------|--------|------|
| 1 | `carpool-create` | `carpoolObj.create()` | 待删除 |
| 2 | `carpool-list` | `carpoolObj.getList()` | 待删除 |
| 3 | `carpool-detail` | `carpoolObj.getDetail()` | 待删除 |
| 4 | `carpool-apply` | `carpoolObj.apply()` | 待删除 |
| 5 | `carpool-applied-list` | `carpoolObj.getMyApplications()` | 待删除 |
| 6 | `carpool-cancel-apply` | `carpoolObj.cancelApply()` | 待删除 |
| 7 | `carpool-confirm-member` | `carpoolObj.confirmMember()` | 待删除 |
| 8 | `carpool-remove-member` | `carpoolObj.removeMember()` | 待删除 |
| 9 | `carpool-update-status` | `carpoolObj.updateStatus()` | 待删除 |

---

## 🔍 已验证的云函数

### 保留的特殊云函数

1. **script-generate-json-url** ✅ 保留
   - 原因：需要支持外部 URL 访问
   - 功能：为外部系统提供 HTTP 可访问的剧本 JSON 接口
   - 配置：需要在 uniCloud 控制台配置 URL 化访问

---

## 📊 删除统计

- **Script 云函数：** 13 个待删除，1 个保留
- **Carpool 云函数：** 9 个待删除
- **总计：** 22 个云函数待删除

---

## 🚀 删除步骤

### 步骤 1: 本地删除

#### Windows PowerShell 方式：

运行批处理脚本：
```powershell
.\删除Script和Carpool旧云函数.bat
```

或手动执行：
```powershell
# 删除 Script 相关云函数
Remove-Item -Recurse -Force "uniCloud-aliyun/cloudfunctions/script-list"
Remove-Item -Recurse -Force "uniCloud-aliyun/cloudfunctions/script-detail"
Remove-Item -Recurse -Force "uniCloud-aliyun/cloudfunctions/script-upload"
Remove-Item -Recurse -Force "uniCloud-aliyun/cloudfunctions/script-my-uploads"
Remove-Item -Recurse -Force "uniCloud-aliyun/cloudfunctions/script-delete"
Remove-Item -Recurse -Force "uniCloud-aliyun/cloudfunctions/script-review-create"
Remove-Item -Recurse -Force "uniCloud-aliyun/cloudfunctions/script-rating"
Remove-Item -Recurse -Force "uniCloud-aliyun/cloudfunctions/script-json-get"
Remove-Item -Recurse -Force "uniCloud-aliyun/cloudfunctions/script-ranking-hot"
Remove-Item -Recurse -Force "uniCloud-aliyun/cloudfunctions/script-ranking-new"
Remove-Item -Recurse -Force "uniCloud-aliyun/cloudfunctions/script-ranking-rating"
Remove-Item -Recurse -Force "uniCloud-aliyun/cloudfunctions/script-ranking-download"
Remove-Item -Recurse -Force "uniCloud-aliyun/cloudfunctions/script-calculate-heat"

# 删除 Carpool 相关云函数
Remove-Item -Recurse -Force "uniCloud-aliyun/cloudfunctions/carpool-create"
Remove-Item -Recurse -Force "uniCloud-aliyun/cloudfunctions/carpool-list"
Remove-Item -Recurse -Force "uniCloud-aliyun/cloudfunctions/carpool-detail"
Remove-Item -Recurse -Force "uniCloud-aliyun/cloudfunctions/carpool-apply"
Remove-Item -Recurse -Force "uniCloud-aliyun/cloudfunctions/carpool-applied-list"
Remove-Item -Recurse -Force "uniCloud-aliyun/cloudfunctions/carpool-cancel-apply"
Remove-Item -Recurse -Force "uniCloud-aliyun/cloudfunctions/carpool-confirm-member"
Remove-Item -Recurse -Force "uniCloud-aliyun/cloudfunctions/carpool-remove-member"
Remove-Item -Recurse -Force "uniCloud-aliyun/cloudfunctions/carpool-update-status"
```

---

### 步骤 2: 云端删除

#### 在 uniCloud Web 控制台：

1. 访问 uniCloud 控制台：https://unicloud.dcloud.net.cn
2. 选择您的项目空间
3. 进入 **云函数/云对象** 页面
4. 找到以下云函数并逐个删除：

**Script 相关（13个）：**
- [ ] script-list
- [ ] script-detail
- [ ] script-upload
- [ ] script-my-uploads
- [ ] script-delete
- [ ] script-review-create
- [ ] script-rating
- [ ] script-json-get
- [ ] script-ranking-hot
- [ ] script-ranking-new
- [ ] script-ranking-rating
- [ ] script-ranking-download
- [ ] script-calculate-heat

**Carpool 相关（9个）：**
- [ ] carpool-create
- [ ] carpool-list
- [ ] carpool-detail
- [ ] carpool-apply
- [ ] carpool-applied-list
- [ ] carpool-cancel-apply
- [ ] carpool-confirm-member
- [ ] carpool-remove-member
- [ ] carpool-update-status

⚠️ **注意：** 不要删除 `script-generate-json-url`！

---

## ⚠️ 删除前检查清单

### 必须确认的事项：

- [ ] ✅ Script 云对象已上传并测试通过
- [ ] ✅ Carpool 云对象已上传并测试通过
- [ ] ✅ 所有前端页面已适配并测试通过
- [ ] ✅ 测试页面功能正常
- [ ] ✅ 没有其他地方还在调用旧云函数

### 建议的测试流程：

1. **测试 Script 功能**
   - [ ] 剧本列表加载正常
   - [ ] 剧本详情查看正常
   - [ ] 剧本上传功能正常
   - [ ] 我的上传列表正常
   - [ ] 剧本删除功能正常
   - [ ] 评论和评分正常
   - [ ] 排行榜数据正常

2. **测试 Carpool 功能**
   - [ ] 拼车列表加载正常
   - [ ] 创建拼车功能正常
   - [ ] 拼车详情查看正常
   - [ ] 申请加入功能正常
   - [ ] 我的申请列表正常
   - [ ] 取消申请功能正常
   - [ ] 确认/移除成员正常（房主）
   - [ ] 更新状态功能正常（房主）

---

## 🔄 如何回滚（万一需要）

如果删除后发现问题，可以：

### 方案 1: 从 Git 恢复（推荐）
```bash
git checkout HEAD -- uniCloud-aliyun/cloudfunctions/script-*
git checkout HEAD -- uniCloud-aliyun/cloudfunctions/carpool-*
```

### 方案 2: 从云端下载
在 uniCloud 控制台下载云函数代码

### 方案 3: 使用备份
如果之前做了备份，从备份目录恢复

---

## 📝 删除记录

### 删除时间：待执行
### 删除操作人：待执行
### 验证测试：待执行

---

## ✅ 删除完成确认

### 本地删除确认：
- [ ] 22 个云函数文件夹已删除
- [ ] `script-generate-json-url` 保留
- [ ] Git 中查看变更正常

### 云端删除确认：
- [ ] 云端 22 个云函数已删除
- [ ] `script-generate-json-url` 保留
- [ ] 云端云对象列表正常

### 功能验证确认：
- [ ] Script 相关页面功能正常
- [ ] Carpool 相关页面功能正常
- [ ] 测试页面功能正常
- [ ] 无报错信息

---

## 📚 相关文档

- **Script 迁移总结：** `SCRIPT_MIGRATION_COMPLETE.md`
- **Carpool 迁移总结：** `CARPOOL_FRONTEND_COMPLETE.md`
- **项目总进度：** `CLOUD_OBJECT_MIGRATION_PROGRESS.md`
- **部署指南：** `CARPOOL_DEPLOYMENT_GUIDE.md`

---

_创建时间：2025-11-04_  
_状态：准备删除_  
_下一步：执行删除脚本_

