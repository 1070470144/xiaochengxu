# 🚀 快速访问测试页面

## 方法 1：在浏览器控制台直接跳转（最快）

在浏览器 DevTools Console 中运行：

```javascript
uni.navigateTo({ url: '/pages/test/user-test-complete' })
```

---

## 方法 2：在首页添加开发者入口

### 步骤 1：找到首页
打开 `pages/index/index.vue`

### 步骤 2：添加测试按钮（临时）
在首页任意位置添加：

```vue
<!-- 开发测试入口（临时，测试完成后删除） -->
<view style="position: fixed; bottom: 20px; right: 20px; z-index: 9999;">
  <button 
    @click="goToTest" 
    style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 50%; width: 120rpx; height: 120rpx; font-size: 24rpx;">
    🧪 测试
  </button>
</view>
```

### 步骤 3：添加跳转方法
在 methods 中添加：

```javascript
methods: {
  goToTest() {
    uni.navigateTo({
      url: '/pages/test/user-test-complete'
    })
  }
}
```

---

## 方法 3：直接运行测试页面

### 在 HBuilderX 中：
1. 打开 `pages/test/user-test-complete.vue`
2. 点击顶部菜单：运行 → 运行到浏览器 → Chrome
3. 或使用快捷键：`Ctrl + R`

---

## 方法 4：修改启动页（临时）

### 修改 pages.json
将测试页面放到第一个（测试完成后改回来）：

```json
{
  "pages": [
    {
      "path": "pages/test/user-test-complete",
      "style": {
        "navigationStyle": "custom"
      }
    },
    // ... 其他页面
  ]
}
```

---

## 🎯 推荐方式

**开发阶段推荐：方法 1**（控制台跳转）
- 优点：最快，不修改代码
- 缺点：每次刷新需要重新输入

**测试阶段推荐：方法 2**（首页按钮）
- 优点：方便多次访问
- 缺点：需要临时修改首页

**快速启动推荐：方法 3**（直接运行）
- 优点：直接打开测试页面
- 缺点：可能丢失某些全局初始化

---

## 📱 测试页面特点

✅ 自定义导航栏（沉浸式体验）
✅ 渐变色设计（现代美观）
✅ 实时结果展示（方便调试）
✅ 完整功能覆盖（14个方法）
✅ 智能状态管理（自动检测登录）

---

**准备好了吗？开始测试吧！** 🚀

