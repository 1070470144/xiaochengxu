# 🧪 Script 前端适配测试指南

## 📋 测试清单

### ✅ 必测项目（核心功能）

---

## 1. 剧本详情页测试

### 📍 测试路径
```
首页 → 剧本列表 → 点击任意剧本
或
直接访问: #/pages/script/detail/detail?id=剧本ID
```

### ✅ 测试点
- [ ] **基本信息显示**
  - 剧本标题、作者、人数、难度
  - 评分和评价人数
  - 浏览次数、下载次数
  
- [ ] **预览图显示**
  - 预览图正常加载
  - 点击可以放大查看

- [ ] **复制 JSON 链接**
  - 点击"复制 JSON 链接"按钮
  - 检查是否弹出"复制成功"提示
  - 在浏览器中粘贴 URL，验证可以访问

- [ ] **错误处理**
  - 访问不存在的剧本 ID
  - 检查是否显示友好的错误提示

### 📸 预期结果
```javascript
// getDetail 返回格式
{
  code: 0,
  message: "success",
  data: {
    _id: "剧本ID",
    title: "剧本标题",
    author: "作者",
    player_count: "7人",
    difficulty: "进阶",
    preview_image: "预览图URL",
    average_rating: 4.5,
    rating_count: 10,
    view_count: 100,
    download_count: 50
  }
}

// generateJsonUrl 返回格式
{
  code: 0,
  message: "success",
  data: {
    url: "https://fc-mp-xxx.next.bspapp.com/script-generate-json-url?scriptId=xxx",
    type: "cloud_function",
    cors: true
  }
}
```

---

## 2. 我的上传页测试

### 📍 测试路径
```
我的 → 我的上传
或
直接访问: #/pages/user/my-uploads/my-uploads
```

### ✅ 测试点
- [ ] **列表加载**
  - 正常显示我的上传列表
  - 显示剧本状态（待审核/已通过/已拒绝）
  - 分页加载正常

- [ ] **筛选功能**
  - 点击"全部"筛选
  - 点击"待审核"筛选
  - 点击"已通过"筛选
  - 点击"已拒绝"筛选

- [ ] **删除功能**
  - 点击剧本卡片的删除按钮
  - 确认删除提示
  - 确认后剧本从列表中消失

- [ ] **空状态**
  - 如果没有上传，显示空状态提示
  - "立即上传"按钮可跳转

### 📸 预期结果
```javascript
// getMyUploads 返回格式
{
  code: 0,
  message: "success",
  data: {
    list: [
      {
        _id: "剧本ID",
        title: "剧本标题",
        author: "作者",
        status: "pending",  // pending/approved/rejected
        created_at: 1730707200000,
        preview_image: "预览图URL"
      }
    ],
    total: 10,
    page: 1,
    pageSize: 10
  }
}

// delete 返回格式
{
  code: 0,
  message: "删除成功"
}
```

---

## 3. 上传剧本页测试

### 📍 测试路径
```
工具 → 上传剧本
或
直接访问: #/pages/tools/upload-json/upload-json
```

### ✅ 测试点
- [ ] **文件上传模式**
  - 点击"选择 JSON 文件"
  - 选择本地 JSON 文件
  - 文件内容正常解析

- [ ] **粘贴 JSON 模式**
  - 切换到"粘贴 JSON"
  - 粘贴 JSON 内容
  - 内容正常解析

- [ ] **信息确认**
  - 显示解析出的标题、作者
  - 可以修改标题、作者
  - 可以添加描述

- [ ] **图片上传**
  - 上传用户图片
  - 图片预览正常
  - 可以删除图片

- [ ] **提交上传**
  - 点击"提交审核"
  - 显示上传进度
  - 上传成功显示预览图
  - 显示成功提示

### 📸 预期结果
```javascript
// upload 返回格式
{
  code: 0,
  message: "上传成功",
  data: {
    scriptId: "生成的剧本ID",
    previewImage: "预览图URL",
    status: "pending"
  }
}
```

---

## 4. 拼车创建页测试

### 📍 测试路径
```
拼车 → 创建拼车
或
直接访问: #/pages/carpool/create/create
```

### ✅ 测试点
- [ ] **剧本选项加载**
  - 打开拼车创建页
  - "选择剧本"下拉框有选项
  - 选项显示剧本标题和人数
  - 选项按热度排序

- [ ] **创建拼车**
  - 选择剧本
  - 填写其他信息（时间、地点等）
  - 提交创建
  - 检查创建成功

### 📸 预期结果
```javascript
// getList 返回格式
{
  code: 0,
  message: "success",
  data: {
    list: [
      {
        _id: "剧本ID",
        title: "剧本标题",
        player_count: "7人",
        heat_score: 100
      }
    ],
    total: 50
  }
}
```

---

## 🔧 测试工具页面

### 使用测试页面快速验证
```
访问: http://localhost:5173/#/pages/test/script-test
```

**测试步骤：**
1. 输入测试剧本 ID
2. 点击各个测试按钮
3. 查看返回结果
4. 验证功能正常

---

## ⚠️ 常见问题

### 1. "Method[xxx] was not found in index.obj.js"
**原因：** 云对象未上传或云端缓存
**解决：**
```bash
# 重新上传云对象
右键 script 文件夹 → 上传云函数
# 等待 1-2 分钟
```

### 2. "无法连接uniCloud本地调试服务"
**原因：** 本地调试开启
**解决：**
```javascript
// 在 onLoad 中明确设置
this.scriptObj = uniCloud.importObject('script', {
  customUI: true,
  debugFunction: false  // 禁用本地调试
})
```

### 3. "token invalid"
**原因：** 未登录或 token 过期
**解决：**
```javascript
// 先登录
// 云对象会自动处理 token
```

### 4. 返回数据格式不对
**检查：**
```javascript
// 旧云函数: result.result.data
// 新云对象: result.data

// ❌ 错误
if (result.result.code === 0) {
  this.data = result.result.data
}

// ✅ 正确
if (result.code === 0) {
  this.data = result.data
}
```

---

## 📊 测试报告模板

### 测试环境
- **测试时间：** 2025-11-04
- **测试人员：** 
- **测试设备：** 
- **HBuilderX 版本：** 4.76

### 测试结果
| 页面 | 功能点 | 状态 | 备注 |
|-----|--------|------|------|
| 剧本详情页 | 基本信息显示 | ✅ |  |
| 剧本详情页 | 复制 JSON 链接 | ✅ |  |
| 我的上传页 | 列表加载 | ✅ |  |
| 我的上传页 | 删除功能 | ✅ |  |
| 上传剧本页 | 文件上传 | ✅ |  |
| 上传剧本页 | 提交审核 | ✅ |  |
| 拼车创建页 | 剧本选项加载 | ✅ |  |

### 发现问题
1. 
2. 
3. 

### 总体评价
- [ ] 全部通过，可以上线
- [ ] 部分通过，需要修复
- [ ] 不通过，需要重新开发

---

## 🚀 测试通过后的步骤

1. **删除旧云函数**
```bash
# 本地删除
script-detail/
script-my-uploads/
script-delete/
script-upload/
script-list/
script-generate-json-url/

# 云端删除（在 uniCloud Web 控制台）
```

2. **更新文档**
- 更新 API 文档
- 更新开发指南

3. **通知团队**
- 告知前端开发者新的调用方式
- 提供迁移指南

---

_测试指南创建时间：2025-11-04_  
_状态：等待测试_  
_下一步：执行测试计划_

