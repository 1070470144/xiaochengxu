# 后台添加角色名称功能方案

## 🎯 需求

在管理后台通过**输入角色名称**来添加角色，自动：
1. 生成钟楼百科URL
2. 抓取并解析
3. 保存到数据库

---

## 💻 实现方案

### 功能设计

#### 页面：百科同步（sync.vue）

**新增区域**：角色名称批量添加

```
┌─────────────────────────────────────┐
│  📝 批量添加角色（通过名称）          │
├─────────────────────────────────────┤
│                                      │
│  角色名称（每行一个）：               │
│  ┌────────────────────────────────┐ │
│  │ 哲学家                          │ │
│  │ 送茶侍者                        │ │
│  │ 祖母                            │ │
│  │ 水手                            │ │
│  │ ...                             │ │
│  └────────────────────────────────┘ │
│                                      │
│  [ 生成URL预览 ]  [ 开始同步 ]      │
└─────────────────────────────────────┘
```

---

## 🔧 技术实现

### 1. URL生成规则

```javascript
// 角色名称 → URL
function generateRoleUrl(roleName) {
  // 中文名称直接拼接
  return `https://clocktower-wiki.gstonegames.com/index.php?title=${roleName}`;
  
  // URL会自动编码，例如：
  // 哲学家 → title=%E5%93%B2%E5%AD%A6%E5%AE%B6
}
```

**示例**：
```
输入：哲学家
生成：https://clocktower-wiki.gstonegames.com/index.php?title=哲学家
```

---

### 2. 前端界面（sync.vue）

添加新区域：

```vue
<view class="batch-add-section card">
  <view class="section-title">批量添加角色（通过名称）</view>
  
  <textarea 
    class="role-names-input"
    v-model="roleNames"
    placeholder="每行输入一个角色名称&#10;例如：&#10;哲学家&#10;送茶侍者&#10;祖母"
    rows="10"
  />
  
  <view class="button-group">
    <button class="preview-btn" @click="previewUrls">
      生成URL预览
    </button>
    <button 
      class="sync-btn"
      :loading="batchSyncing"
      @click="batchSyncByNames"
    >
      开始同步
    </button>
  </view>
  
  <!-- URL预览 -->
  <view v-if="previewUrls.length > 0" class="url-preview">
    <view class="preview-title">将同步以下{{ previewUrls.length }}个角色：</view>
    <view v-for="(url, idx) in previewUrls" :key="idx" class="preview-item">
      {{ idx + 1 }}. {{ url }}
    </view>
  </view>
</view>
```

---

### 3. JavaScript逻辑

```javascript
data() {
  return {
    roleNames: '',
    previewUrls: [],
    batchSyncing: false
  }
},

methods: {
  // 生成URL预览
  previewUrls() {
    const names = this.roleNames
      .split('\n')
      .map(n => n.trim())
      .filter(n => n);
    
    this.previewUrls = names.map(name => {
      return `https://clocktower-wiki.gstonegames.com/index.php?title=${encodeURIComponent(name)}`;
    });
    
    uni.showToast({
      title: `生成${this.previewUrls.length}个URL`,
      icon: 'success'
    });
  },
  
  // 批量同步
  async batchSyncByNames() {
    if (this.previewUrls.length === 0) {
      return uni.showToast({
        title: '请先生成URL预览',
        icon: 'none'
      });
    }
    
    uni.showModal({
      title: '确认同步',
      content: `确定要同步${this.previewUrls.length}个角色吗？`,
      success: async (res) => {
        if (res.confirm) {
          await this.executeBatchSync();
        }
      }
    });
  },
  
  async executeBatchSync() {
    this.batchSyncing = true;
    
    let success = 0;
    let failed = 0;
    const errors = [];
    
    uni.showLoading({ title: '同步中...', mask: true });
    
    // 每次同步1个，避免并发问题
    for (let i = 0; i < this.previewUrls.length; i++) {
      const url = this.previewUrls[i];
      
      try {
        const res = await uniCloud.callFunction({
          name: 'wiki-admin-sync-single',
          data: { url }
        });
        
        if (res.result.code === 0) {
          success++;
        } else {
          failed++;
          errors.push({ url, error: res.result.message });
        }
      } catch (error) {
        failed++;
        errors.push({ url, error: error.message });
      }
      
      // 更新进度
      uni.showLoading({
        title: `同步中 ${i+1}/${this.previewUrls.length}`,
        mask: true
      });
    }
    
    uni.hideLoading();
    
    // 显示结果
    uni.showModal({
      title: '同步完成',
      content: `成功：${success}\n失败：${failed}`,
      showCancel: false
    });
    
    this.batchSyncing = false;
    this.roleNames = '';
    this.previewUrls = [];
    
    // 刷新统计
    this.loadStats();
  }
}
```

---

## 📋 使用流程

### 用户操作

```
1. 进入"百科同步"页面

2. 在"批量添加角色"区域，输入角色名称：
   哲学家
   送茶侍者
   祖母

3. 点击"生成URL预览"
   → 显示3个URL

4. 确认无误后，点击"开始同步"
   → 逐个同步

5. 查看同步结果
   → 成功：3个
```

---

## ⏱️ 开发时间

- **新增界面**：1小时
- **逻辑开发**：1小时
- **测试优化**：0.5小时

**总计：2.5小时**

---

## 🎊 优势

1. ✅ **简单**：只需输入角色名称
2. ✅ **灵活**：想加多少加多少
3. ✅ **实时**：立即同步
4. ✅ **可控**：预览后再同步

---

## 🚀 要我开始开发吗？

回复 **/implement** 我将立即：
1. 修改 sync.vue 添加新功能
2. 添加批量同步逻辑
3. 完整测试

---

**功能版本**: v2.2.0  
**功能名称**: 通过角色名称批量添加
**开发时间**: 2.5小时

