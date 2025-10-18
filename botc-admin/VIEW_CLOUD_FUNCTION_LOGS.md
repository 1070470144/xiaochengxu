# 📋 查看云函数日志的方法

## 方法1：通过 uniCloud Web控制台（推荐）✅

### 步骤：

```bash
1. 打开浏览器，访问：
   https://unicloud.dcloud.net.cn

2. 登录您的DCloud账号

3. 选择您的云服务空间

4. 左侧菜单 → 云函数

5. 找到 wiki-admin-sync-single

6. 点击进入

7. 点击"日志"标签

8. 选择时间范围（最近1小时）

9. 点击"查询"

10. 查看最新的日志记录
```

**这是最可靠的方法！**

---

## 方法2：在 HBuilderX 中运行云函数

### 步骤：

```bash
1. HBuilderX → botc-admin 项目

2. 找到 uniCloud-aliyun/cloudfunctions/wiki-admin-sync-single

3. 右键 → 运行-云端

4. 在弹出的界面中：
   - 选择方法：syncPage
   - 输入参数：
     "https://clocktower-wiki.gstonegames.com/index.php?title=洗衣妇"

5. 点击"运行"

6. 在下方的"运行日志"区域查看输出
```

**这样可以直接看到日志！**

---

## 方法3：在管理后台浏览器控制台查看

### 步骤：

```bash
1. 管理后台 → 百科同步

2. 按 F12 打开开发者工具

3. 切换到 Console 标签

4. 进行同步操作

5. 查看控制台输出的日志
```

**但这个可能看不到云函数内部的日志**

---

## 🎯 我推荐您使用

### 👉 方法2：直接在 HBuilderX 运行云函数

这是最直接的！

#### 详细步骤：

```bash
1. HBuilderX 中展开项目：
   botc-admin
   └── uniCloud-aliyun
       └── cloudfunctions
           └── wiki-admin-sync-single

2. 右键点击 wiki-admin-sync-single 文件夹

3. 选择"运行-云端"（或"运行云函数到云端"）

4. 弹出窗口中：
   - 在"云对象方法"下拉框选择：syncPage
   - 在参数输入框输入：
     "https://clocktower-wiki.gstonegames.com/index.php?title=洗衣妇"

5. 点击"运行"按钮

6. 在下方查看：
   - 运行结果
   - 运行日志
   - 控制台输出
```

**所有 console.log 都会显示在这里！**

---

## 📝 您应该看到的日志

### 成功的情况：
```
[sync] HTML长度: 123456
[sync] 提取到标题: 洗衣妇
[sync] parserUtils存在: true
[sync] parseRoleDetail函数存在: function
[parseRoleDetail] 开始详细解析
[sync] 详细解析完成
[sync] background_story: true
[sync] ability: true
[sync] 最终数据包含role_detail: true
```

### 失败的情况：
```
[sync] parserUtils存在: false
或
[sync] 详细解析失败: Error: Cannot find module...
```

---

## 🎯 现在请尝试

**方法2最简单**：

1. 右键 wiki-admin-sync-single
2. 运行-云端
3. 选择 syncPage 方法
4. 输入URL参数
5. 点击运行
6. 查看日志输出

**把看到的日志发给我！** 🔧

---

**查看日志指南**: 2025年10月17日

