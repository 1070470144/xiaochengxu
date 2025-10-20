# JSON链接功能 - 简化方案

## 🎯 目标
生成一个HTTP URL，在浏览器中打开后**直接显示JSON内容**，不触发下载。

## ✅ 解决方案

使用云函数返回JSON内容，设置响应头 `content-disposition: inline`

---

## 📝 完整代码

### 前端（简化版generateJsonUrl方法）

```javascript
// 生成JSON链接
async generateJsonUrl() {
  this.generatingUrl = true;
  
  try {
    if (!this.scriptId) {
      uni.showToast({ title: '剧本ID不存在', icon: 'none' });
      this.generatingUrl = false;
      return;
    }
    
    // 生成云函数HTTP URL
    const spaceInfo = uniCloud.config.provider.find(item => item.provider === 'aliyun');
    const spaceId = spaceInfo ? spaceInfo.spaceId : '';
    const jsonUrl = `https://${spaceId}.bja.bspapp.com/http/script-json-get?script_id=${this.scriptId}`;
    
    // 复制URL
    uni.setClipboardData({
      data: jsonUrl,
      success: () => {
        this.copiedUrl = true;
        uni.showModal({
          title: '✅ JSON链接已生成',
          content: `${jsonUrl}\n\n链接已复制，在浏览器中打开可查看JSON`,
          confirmText: '打开',
          success: (res) => {
            if (res.confirm) {
              // #ifdef H5
              window.open(jsonUrl, '_blank');
              // #endif
            }
          }
        });
        setTimeout(() => { this.copiedUrl = false; }, 3000);
      }
    });
  } catch (error) {
    console.error(error);
    uni.showToast({ title: '生成失败', icon: 'none' });
  } finally {
    this.generatingUrl = false;
  }
}
```

---

## 🚀 部署步骤

### 1. 上传云函数
```
右键 script-json-get → 上传部署
```

### 2. 启用HTTP访问
uniCloud控制台 → script-json-get → HTTP访问 → 启用

### 3. 测试
点击"生成JSON链接" → 在浏览器打开 → 直接显示JSON

---

完成！

