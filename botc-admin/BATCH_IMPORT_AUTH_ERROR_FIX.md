# 批量导入权限错误处理修复

## ✅ 修复完成时间
2025-11-06

## 🔍 问题描述

用户反馈：批量导入剧本时，如果未登录会报错 `权限验证失败: 未登录`，但前端仍然显示"导入完成！成功：0，失败：X"，而不是跳转到登录页面。

### 错误日志
```
[云对象：admin-script]调用方法：[batchImport]
Error: 权限验证失败: 未登录
    at le._before (admin-script/index.obj.js:65:13)
```

### 用户体验问题
- ❌ 未登录时调用云对象失败
- ❌ 前端没有正确捕获错误
- ❌ 仍然显示"导入完成"弹窗（误导用户）
- ❌ 没有引导用户登录

## 🛠️ 修复方案

### 1. 增强错误捕获

在 `startImport` 方法的 `catch` 块中，增加对权限错误的检测：

```javascript
catch (error) {
  console.error('❌ 批量导入失败:', error)
  this.importProgress.failed += scripts.length
  
  // 🔍 检查是否是权限错误（未登录）
  const errorMsg = error.message || error.errMsg || String(error)
  if (errorMsg.includes('未登录') || 
      errorMsg.includes('权限验证失败') || 
      errorMsg.includes('未授权')) {
    this.importing = false
    this.$refs.batchUploadPopup.close()
    
    uni.showModal({
      title: '未登录',
      content: '您还未登录，请先登录后再进行操作',
      showCancel: false,
      success: () => {
        // 跳转到登录页面
        uni.reLaunch({
          url: '/pages/login/login'
        })
      }
    })
    return  // ⚠️ 重要：提前返回，不再显示"导入完成"弹窗
  }
}
```

### 2. 关键改进点

#### ✅ 错误识别
检测错误信息中是否包含关键词：
- `未登录`
- `权限验证失败`
- `未授权`

#### ✅ 状态重置
```javascript
this.importing = false              // 停止导入状态
this.$refs.batchUploadPopup.close() // 关闭上传弹窗
```

#### ✅ 用户提示
显示明确的"未登录"提示，而不是"导入完成"。

#### ✅ 跳转登录
使用 `uni.reLaunch` 重新加载登录页面，清空页面栈。

#### ✅ 提前返回
使用 `return` 语句阻止后续的"导入完成"弹窗显示。

## 📊 修复效果对比

### 修复前
```
用户操作：未登录 → 批量导入JSON
云对象：❌ 权限验证失败: 未登录
前端显示：✅ 导入完成！成功：0，失败：3
用户感受：😕 为什么显示完成但是没有数据？
```

### 修复后
```
用户操作：未登录 → 批量导入JSON
云对象：❌ 权限验证失败: 未登录
前端检测：🔍 识别到权限错误
前端显示：⚠️ 未登录提示弹窗
用户操作：点击确定
页面跳转：→ 登录页面
用户感受：✅ 明确知道需要登录
```

## 🎯 完整的错误处理流程

```
批量导入开始
    ↓
解析JSON文件 ✅
    ↓
调用云对象 batchImport
    ↓
云对象 _before 钩子检查权限
    ↓
未登录？
    ├─ 是 → 抛出错误 "权限验证失败: 未登录"
    │         ↓
    │     前端 catch 捕获错误
    │         ↓
    │     识别权限错误关键词
    │         ↓
    │     关闭上传弹窗
    │         ↓
    │     显示"未登录"提示
    │         ↓
    │     跳转到登录页面 ✅
    │
    └─ 否 → 继续执行导入逻辑 ✅
              ↓
          显示"导入完成"弹窗
```

## 🔒 云对象权限验证逻辑

在 `admin-script/index.obj.js` 中：

```javascript
module.exports = {
  _before: async function() {
    // 统一权限验证
    try {
      await checkAdminAuth(this.getClientInfo());
    } catch (error) {
      throw new Error('权限验证失败: ' + error.message);
    }
  },
  // ...
}

async function checkAdminAuth(context) {
  const { TOKEN, ADMIN_TOKEN } = context;
  
  // 简化版：检查是否有管理员token
  if (!TOKEN && !ADMIN_TOKEN) {
    throw new Error('未登录');
  }
  
  return true;
}
```

## 📝 其他可能需要类似处理的地方

建议在以下管理端操作中也增加相同的权限错误处理：

1. **剧本审核** (`auditScript`)
2. **剧本删除** (`deleteScript`)
3. **生成预览图** (生成预览时)
4. **Wiki同步** (调用 `admin-wiki` 时)
5. **敏感词管理** (调用 `admin` 云对象时)
6. **举报处理** (调用 `admin` 云对象时)

### 通用错误处理函数（建议）

可以创建一个全局方法：

```javascript
// 在 main.js 或 common 中定义
export function handleCloudError(error) {
  const errorMsg = error.message || error.errMsg || String(error)
  
  // 权限错误
  if (errorMsg.includes('未登录') || 
      errorMsg.includes('权限验证失败') || 
      errorMsg.includes('未授权')) {
    uni.showModal({
      title: '未登录',
      content: '您还未登录，请先登录后再进行操作',
      showCancel: false,
      success: () => {
        uni.reLaunch({
          url: '/pages/login/login'
        })
      }
    })
    return true  // 表示已处理
  }
  
  return false  // 表示未处理，需要业务代码自行处理
}
```

## 📋 测试步骤

### 测试场景1：未登录状态批量导入
1. 清除浏览器缓存（清除登录状态）
2. 刷新管理端页面
3. 进入剧本管理
4. 点击"批量导入JSON"
5. 选择文件并导入
6. **预期结果**：
   - ✅ 显示"未登录"提示
   - ✅ 点击确定后跳转到登录页面
   - ❌ 不再显示"导入完成！成功：0，失败：X"

### 测试场景2：已登录状态批量导入
1. 正常登录管理端
2. 进入剧本管理
3. 批量导入JSON
4. **预期结果**：
   - ✅ 正常导入
   - ✅ 显示"导入完成！成功：X，失败：X"
   - ✅ 数据正常显示在列表中

## 相关文件

- 📄 `botc-admin/pages/botc/script/list.vue` - 已修复
- 📄 `botc-admin/uniCloud-aliyun/cloudfunctions/admin-script/index.obj.js` - 权限验证逻辑
- 📄 `botc-admin/BATCH_IMPORT_AUTH_ERROR_FIX.md` - 本文档

---

**修复完成！现在未登录时批量导入会正确提示并跳转到登录页面。** ✅

