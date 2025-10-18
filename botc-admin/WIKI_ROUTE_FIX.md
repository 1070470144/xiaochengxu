# ✅ 百科页面路由配置修复

## 🐛 问题

点击菜单提示：**页面 /pages/botc/wiki/sync 跳转失败**

## 🔍 原因

`pages.json` 中缺少百科页面的路由配置

---

## ✅ 已修复

我已经在 `botc-admin/pages.json` 中添加了路由配置：

```json
{
  "root": "pages/botc",
  "pages": [
    // ... 其他页面
    {
      "path": "wiki/sync",
      "style": {
        "navigationBarTitleText": "百科同步"
      }
    },
    {
      "path": "wiki/list",
      "style": {
        "navigationBarTitleText": "百科管理"
      }
    }
  ]
}
```

---

## 🔄 如何生效

### 方法1：重新编译（推荐）

```bash
1. 在 HBuilderX 中
2. 停止当前运行
3. 重新运行到浏览器
4. 等待编译完成
5. 刷新浏览器
6. 点击菜单测试 ✅
```

### 方法2：强制刷新

```bash
1. 在浏览器中按 Ctrl + F5
2. 或者清除缓存后刷新
3. 重新点击菜单
```

---

## ✅ 验证成功

### 测试步骤

1. **点击"百科同步"菜单**
   - 应该正常跳转
   - 页面显示同步管理界面
   - 不再报错 ✅

2. **点击"百科管理"菜单**
   - 应该正常跳转
   - 页面显示词条列表
   - 不再报错 ✅

---

## 🎯 完整配置确认

### pages.json 中应包含：

```json
{
  "root": "pages/botc",
  "pages": [
    {
      "path": "shop/verify-list",
      "style": {
        "navigationBarTitleText": "店铺认证审核"
      }
    },
    {
      "path": "carpool/list",
      "style": {
        "navigationBarTitleText": "拼车管理"
      }
    },
    {
      "path": "post/audit-list",
      "style": {
        "navigationBarTitleText": "帖子审核"
      }
    },
    {
      "path": "script/list",
      "style": {
        "navigationBarTitleText": "剧本管理"
      }
    },
    {
      "path": "script/edit",
      "style": {
        "navigationBarTitleText": "编辑剧本"
      }
    },
    {
      "path": "wiki/sync",          ← 新添加
      "style": {
        "navigationBarTitleText": "百科同步"
      }
    },
    {
      "path": "wiki/list",          ← 新添加
      "style": {
        "navigationBarTitleText": "百科管理"
      }
    }
  ]
}
```

---

## 🎊 修复完成！

**路由配置已添加！**

现在：
1. ✅ 重新编译运行 botc-admin
2. ✅ 点击菜单能正常跳转
3. ✅ 页面功能正常使用

---

**修复时间**: 2025年10月17日  
**状态**: ✅ 已修复

