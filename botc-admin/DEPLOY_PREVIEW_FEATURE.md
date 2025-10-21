# 🚀 预览图自动生成功能 - 部署指南

## ✅ 功能说明

管理端添加/批量导入剧本时，自动生成SVG预览图并保存到数据库的 `preview_image` 字段。

---

## 📋 部署步骤

### 步骤1：上传数据库Schema（重要！）

#### 管理端Schema
```bash
在 HBuilderX 中：
右键：botc-admin/uniCloud-aliyun/database/botc-scripts.schema.json
选择：「上传Schema」或「上传DB Schema」
等待上传成功
```

#### 用户端Schema（如果两个项目共用数据库）
```bash
右键：botc-miniprogram/uniCloud-aliyun/database/botc-scripts.schema.json
选择：「上传Schema」
等待上传成功
```

### 步骤2：上传云函数

#### 上传 script-generate-preview（新建）
```bash
右键：botc-admin/uniCloud-aliyun/cloudfunctions/script-generate-preview
选择：「上传部署」
等待提示「上传成功」
```

#### 重新上传 script-batch-import（修改）
```bash
右键：botc-admin/uniCloud-aliyun/cloudfunctions/script-batch-import
选择：「上传部署」
等待提示「上传成功」
```

---

## 🧪 测试步骤

### 测试1：单个上传生成预览图

```bash
1. 刷新管理后台页面
2. 进入「剧本管理」→「添加剧本」
3. 点击「📁 选择JSON文件」
4. 选择一个JSON文件
5. 填写必填信息（剧本类型）
6. 点击「保存」
7. 观察loading提示：
   ✅ 显示"生成预览图..."
   ✅ 显示"保存中..."
8. 保存成功后回到列表
9. 点击「预览」查看该剧本
10. ✅ 应该能看到预览图
```

### 测试2：批量导入生成预览图

```bash
1. 在剧本列表页点击「📁 批量导入JSON」
2. 点击「📄 选择文件」或「📂 选择文件夹」
3. 选择多个JSON文件
4. 点击「开始导入」
5. 观察导入进度和日志
6. 导入完成后查看列表
7. 点击任意剧本的「预览」按钮
8. ✅ 应该能看到预览图
```

### 测试3：在用户端查看

```bash
1. 打开小程序
2. 进入剧本列表
3. 找到刚才上传的剧本
4. 进入详情页
5. ✅ 应该显示预览图
6. 可以点击放大查看
```

---

## 🔍 验证数据库

### 在 uniCloud 控制台验证：

```bash
1. 登录 uniCloud Web控制台
2. 进入「云数据库」
3. 打开 botc-scripts 集合
4. 找到刚上传的剧本记录
5. 查看字段：
   ✅ json_data: [...] (数组数据)
   ✅ preview_image: "data:image/svg+xml;base64,..." (预览图)
```

---

## 📊 预览图示例

### 生成的preview_image格式：
```
data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTIwIiBoZWlnaHQ9IjgwMCIgdmlld0JveD0iMCAwIDUyMCA4MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+...
```

### 包含内容：
- 剧本标题
- 作者名称
- 所有角色（按队伍分类）
- 角色名称和能力
- 角色头像（如果有）
- 精美的背景和边框

---

## ⚠️ 重要提醒

### 必须先上传Schema！
如果不上传Schema，保存时会报错：
```
数据库验证失败：提交的字段["preview_image"]在本地数据表的schema文件中不存在
```

### 上传顺序：
1. ✅ 先上传Schema
2. ✅ 再上传云函数
3. ✅ 最后测试功能

---

## 🎉 完成清单

### 部署清单
- [ ] 上传管理端Schema
- [ ] 上传用户端Schema（如果共用数据库）
- [ ] 上传 script-generate-preview 云函数
- [ ] 重新上传 script-batch-import 云函数

### 测试清单
- [ ] 单个上传生成预览图
- [ ] 批量导入生成预览图
- [ ] 数据库中有preview_image字段
- [ ] 用户端可以查看预览图

---

**现在按顺序执行部署步骤吧！** 🚀

**第一步：上传Schema（最重要！）**

