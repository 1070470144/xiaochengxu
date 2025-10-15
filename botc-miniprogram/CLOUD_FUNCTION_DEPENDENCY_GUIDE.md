# HBuilderX云函数依赖安装指南

## 🎯 问题说明

**错误信息**: `Cannot find module 'uni-id-common'`

**原因**: 云函数缺少依赖模块

---

## ✅ 解决方法（HBuilderX操作）

### 方法1: 使用HBuilderX自动安装（推荐）

#### 步骤 1: 打开云函数目录
```
在HBuilderX左侧项目管理器中：
uniCloud-aliyun
  └── cloudfunctions
      └── script-upload  ← 右键这个文件夹
```

#### 步骤 2: 安装依赖
```
右键 script-upload 文件夹
  ↓
选择"使用命令行窗口打开所在目录"
  ↓
在打开的命令行窗口中输入：
npm install
  ↓
回车，等待安装完成
```

#### 步骤 3: 重新上传云函数
```
右键 script-upload 文件夹
  ↓
选择"上传并运行"
  ↓
等待上传完成
```

---

### 方法2: 手动创建node_modules（如果方法1不行）

#### 步骤 1: 在HBuilderX中打开终端
```
菜单栏：工具 → 打开终端 → 新建终端
```

#### 步骤 2: 进入云函数目录
```powershell
cd botc-miniprogram/uniCloud-aliyun/cloudfunctions/script-upload
```

#### 步骤 3: 安装依赖
```powershell
npm install
```

#### 步骤 4: 验证安装
```
查看 script-upload 文件夹下是否出现：
└── node_modules  ← 这个文件夹
    └── uni-id-common
```

---

### 方法3: 使用HBuilderX内置功能（最简单）

#### 步骤 1: 右键云函数
```
在项目管理器中：
右键 script-upload 文件夹
```

#### 步骤 2: 选择管理依赖
```
选择"管理公共模块或扩展库依赖"
  ↓
在弹出的对话框中选择
  ↓
勾选 "uni-id-common"
  ↓
点击"确定"
```

---

## 🔧 其他云函数也需要安装

您有3个云函数都需要安装依赖：

### 1. script-upload
```
cd botc-miniprogram/uniCloud-aliyun/cloudfunctions/script-upload
npm install
```

### 2. script-my-uploads
```
cd botc-miniprogram/uniCloud-aliyun/cloudfunctions/script-my-uploads
npm install
```

### 3. script-delete
```
cd botc-miniprogram/uniCloud-aliyun/cloudfunctions/script-delete
npm install
```

---

## 🚀 快速批量安装（推荐）

### 在项目根目录执行：

```powershell
# 进入script-upload并安装
cd botc-miniprogram/uniCloud-aliyun/cloudfunctions/script-upload
npm install
cd ..

# 进入script-my-uploads并安装
cd script-my-uploads
npm install
cd ..

# 进入script-delete并安装
cd script-delete
npm install
```

---

## 📋 验证安装成功

### 检查文件结构

安装成功后，每个云函数目录下应该有：

```
script-upload/
├── index.js
├── preview-generator.js
├── package.json
└── node_modules/          ← 新增这个文件夹
    └── uni-id-common/     ← 依赖模块
```

### 上传云函数

```
在HBuilderX中：
1. 右键 script-upload
2. 选择"上传并运行"
3. 查看控制台输出
4. 应该显示"上传成功"
5. 不再报错"Cannot find module"
```

---

## 🎯 完整部署流程

### 1. 安装依赖
```
script-upload → npm install
script-my-uploads → npm install
script-delete → npm install
```

### 2. 上传云函数
```
script-upload → 右键 → 上传并运行
script-my-uploads → 右键 → 上传并运行
script-delete → 右键 → 上传并运行
```

### 3. 验证部署
```
在HBuilderX控制台查看：
✅ 云函数上传成功
✅ 云端运行正常
```

---

## 💡 常见问题

### Q1: npm install 很慢或失败？
**A**: 
```
使用国内镜像：
npm install --registry=https://registry.npmmirror.com
```

### Q2: 提示找不到npm命令？
**A**: 
```
需要先安装Node.js：
1. 下载：https://nodejs.org/
2. 安装Node.js
3. 重启HBuilderX
4. 重新执行npm install
```

### Q3: 安装后还是报错？
**A**: 
```
1. 删除node_modules文件夹
2. 删除package-lock.json（如果有）
3. 重新npm install
4. 重新上传云函数
```

### Q4: HBuilderX找不到"管理依赖"选项？
**A**: 
```
使用命令行方式：
1. 打开HBuilderX内置终端
2. cd到云函数目录
3. npm install
4. 重新上传
```

---

## 📝 package.json说明

每个云函数的`package.json`已经配置好了：

```json
{
  "name": "script-upload",
  "dependencies": {
    "uni-id-common": "^1.0.0"  ← 这个依赖
  }
}
```

**npm install**会根据这个文件自动安装`uni-id-common`模块。

---

## ✅ 完成后

安装依赖并上传后，您就可以：

1. ✅ 测试剧本上传功能
2. ✅ 云函数正常运行
3. ✅ 自动生成预览图
4. ✅ 保存到数据库
5. ✅ 在"我的上传"中查看

---

**创建日期**: 2025年10月15日  
**问题**: Cannot find module 'uni-id-common'  
**解决**: npm install 安装依赖  
**状态**: 📖 待执行

