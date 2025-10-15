# 工具页面设置指南

## ✅ 完成的修改

### 1. 创建工具页面
**文件**: `botc-miniprogram/pages/tools/index/index.vue`

**页面结构**:
```
工具箱
└── 5个功能入口
    ├── 🚗 拼车组局（已实现）
    ├── 📄 剧本上传（待开发）
    ├── 📚 血染百科（待开发）
    ├── 🎭 说书人（已实现）
    └── 🏪 血染店铺（已实现）
```

### 2. 修改 TabBar 配置
**文件**: `botc-miniprogram/pages.json`

**修改内容**:
```json
// TabBar 配置
{
  "pagePath": "pages/tools/index/index",  // ← 从 pages/carpool/list/list 改为工具页面
  "iconPath": "static/tabbar/carpool.png",
  "selectedIconPath": "static/tabbar/carpool_active.png",
  "text": "工具"  // ← 从"拼车"改为"工具"
}
```

### 3. 注册页面路由
**文件**: `botc-miniprogram/pages.json`

**新增路由**:
```json
{
  "path": "pages/tools/index/index",
  "style": {
    "navigationBarTitleText": "工具箱",
    "navigationBarBackgroundColor": "#8B4513",
    "navigationBarTextStyle": "white"
  }
}
```

## 🎯 功能说明

### 已实现功能

#### 1. 拼车组局 🚗
- **状态**: ✅ 已实现
- **跳转**: `/pages/carpool/list/list`
- **说明**: 原来的拼车功能，现在作为工具的子功能

#### 2. 说书人 🎭
- **状态**: ✅ 已实现
- **跳转**: `/pages/storyteller/list/list`
- **说明**: 查找和联系说书人

#### 3. 血染店铺 🏪
- **状态**: ✅ 已实现
- **跳转**: `/pages/shop/list/list`
- **说明**: 查看附近的血染店铺

### 待开发功能

#### 1. 剧本上传 📄
- **状态**: ⏳ 待开发
- **当前**: 点击显示"功能开发中"
- **目标**: 
  - 创建 `pages/tools/upload-json/upload-json.vue`
  - 实现JSON文件上传功能
  - 表单填写剧本信息
  - 提交审核

#### 2. 血染百科 📚
- **状态**: ⏳ 待开发
- **当前**: 点击显示"功能开发中"
- **目标**: 
  - 创建 `pages/tools/wiki/wiki.vue`
  - 角色大全
  - 游戏规则
  - 新手指南
  - 进阶技巧

## 🎨 设计特点

### 参考来源
- 基于**拼车列表页面**的成功经验
- 使用相同的代码结构和样式类
- 确保点击事件能正常工作

### 视觉设计
- **头部**: 血染钟楼主题色渐变背景
- **卡片**: 白色卡片，圆角阴影
- **图标**: 每个功能使用不同的渐变色背景
- **交互**: 点击缩放 + 透明度反馈

### 颜色方案
```
拼车组局: #667eea → #764ba2 (紫色)
剧本上传: #f093fb → #f5576c (粉色)
血染百科: #4facfe → #00f2fe (蓝色)
说书人:   #fa709a → #fee140 (橙粉)
血染店铺: #30cfd0 → #330867 (青紫)
```

## 🧪 测试步骤

1. **编译项目**
   ```
   在微信开发者工具中点击"编译"
   ```

2. **查看 TabBar**
   ```
   底部应该显示: 首页 | 剧本 | 工具 | 社区 | 我的
                                   ↑
                            原来是"拼车"
   ```

3. **点击工具Tab**
   ```
   应该显示工具箱页面，包含5个功能卡片
   ```

4. **测试功能跳转**
   - ✅ 拼车组局 → 跳转到拼车列表
   - ⏳ 剧本上传 → 显示"功能开发中"
   - ⏳ 血染百科 → 显示"功能开发中"
   - ✅ 说书人 → 跳转到说书人列表
   - ✅ 血染店铺 → 跳转到店铺列表

## 📝 后续开发

### 开发"剧本上传"功能

1. **创建页面**
   ```
   pages/tools/upload-json/upload-json.vue
   ```

2. **注册路由** (在 pages.json)
   ```json
   {
     "path": "pages/tools/upload-json/upload-json",
     "style": {
       "navigationBarTitleText": "剧本上传"
     }
   }
   ```

3. **修改跳转方法**
   ```javascript
   goToUploadJson() {
     uni.navigateTo({
       url: '/pages/tools/upload-json/upload-json'
     })
   }
   ```

### 开发"血染百科"功能

1. **创建页面**
   ```
   pages/tools/wiki/wiki.vue
   ```

2. **注册路由** (在 pages.json)
   ```json
   {
     "path": "pages/tools/wiki/wiki",
     "style": {
       "navigationBarTitleText": "血染百科"
     }
   }
   ```

3. **修改跳转方法**
   ```javascript
   goToWiki() {
     uni.navigateTo({
       url: '/pages/tools/wiki/wiki'
     })
   }
   ```

## 🔧 代码说明

### 为什么这个版本能工作？

1. **使用 `@click` 事件**
   - 与首页、拼车页面保持一致
   - uni-app 会自动处理

2. **简单的 DOM 结构**
   - 不过度嵌套
   - 清晰的语义化

3. **标准的跳转方式**
   - 非 tabBar 页面用 `uni.navigateTo`
   - 简洁直接

4. **参考成功案例**
   - 基于能正常工作的拼车页面
   - 使用相同的代码模式

## 📊 文件清单

- ✅ `pages/tools/index/index.vue` - 工具主页面
- ✅ `pages.json` - 路由和TabBar配置
- ✅ `pages/tools/SETUP_GUIDE.md` - 本文档

## ⚠️ 注意事项

1. **TabBar 页面限制**
   - TabBar 页面不能被其他页面 `navigateTo`
   - 只能通过 `switchTab` 或点击 TabBar 切换

2. **路由注册顺序**
   - TabBar 页面必须在 pages 数组中注册
   - 顺序不影响功能，但建议放在前面

3. **图标替换**
   - 当前使用拼车图标，后续可替换为工具箱图标
   - 图标路径: `static/tabbar/carpool.png`

## 🎉 完成状态

- [x] 创建工具页面
- [x] 修改 TabBar 配置
- [x] 注册页面路由
- [x] 5个功能入口
- [x] 3个功能可用（拼车、说书人、店铺）
- [x] 2个功能待开发（上传、百科）

---

**创建日期**: 2025年10月15日  
**状态**: ✅ 可用  
**版本**: v1.0.0

