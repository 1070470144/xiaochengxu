<template>
  <view class="page">
    <view class="page-header">
      <text class="page-title">百科词条管理</text>
      <button class="add-btn" @click="goToSync">同步管理</button>
    </view>
    
    <view class="filter-bar card">
      <view class="filter-item">
        <text class="filter-label">类型：</text>
        <picker :range="typeOptions" range-key="label" @change="onTypeChange">
          <view class="picker">{{ currentTypeLabel }}</view>
        </picker>
      </view>
      
      <view class="filter-item search">
        <input 
          class="search-input"
          v-model="searchKeyword"
          placeholder="搜索标题..."
          @confirm="handleSearch"
        />
        <button class="search-btn" @click="handleSearch">搜索</button>
      </view>
    </view>
    
    <view class="entries-section card">
      <uni-table :data="entryList" border stripe :loading="loading">
        <uni-tr>
          <uni-th width="60">ID</uni-th>
          <uni-th width="200">标题</uni-th>
          <uni-th width="80">类型</uni-th>
          <uni-th width="100">阵营</uni-th>
          <uni-th width="80">浏览量</uni-th>
          <uni-th width="100">同步时间</uni-th>
          <uni-th width="150">操作</uni-th>
        </uni-tr>
        <uni-tr v-for="(entry, index) in entryList" :key="entry._id">
          <uni-td>{{ index + 1 + (page - 1) * pageSize }}</uni-td>
          <uni-td>{{ entry.title }}</uni-td>
          <uni-td>{{ getTypeText(entry.entry_type) }}</uni-td>
          <uni-td>{{ entry.role_info?.team_name || '-' }}</uni-td>
          <uni-td>{{ entry.stats?.view_count || 0 }}</uni-td>
          <uni-td>{{ formatTime(entry.sync_info?.last_synced_at) }}</uni-td>
          <uni-td>
            <button class="action-btn" @click="viewEntry(entry)">查看</button>
            <button class="action-btn danger" @click="deleteEntry(entry)">删除</button>
          </uni-td>
        </uni-tr>
      </uni-table>
      
      <view class="pagination">
        <button class="page-btn" :disabled="page === 1" @click="prevPage">上一页</button>
        <text class="page-info">第 {{ page }} 页</text>
        <button class="page-btn" :disabled="!hasNext" @click="nextPage">下一页</button>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'WikiList',
  data() {
    return {
      entryList: [],
      loading: false,
      page: 1,
      pageSize: 20,
      hasNext: true,
      searchKeyword: '',
      currentType: null,
      typeOptions: [
        { label: '全部类型', value: null },
        { label: '角色', value: 'role' },
        { label: '剧本', value: 'script' },
        { label: '规则', value: 'rule' }
      ]
    }
  },
  
  computed: {
    currentTypeLabel() {
      const option = this.typeOptions.find(o => o.value === this.currentType);
      return option ? option.label : '全部类型';
    }
  },
  
  onLoad() {
    console.log('[WikiList] 页面加载');
    this.loadEntries();
  },
  
  onShow() {
    console.log('[WikiList] 页面显示');
  },
  
  methods: {
    async loadEntries() {
      this.loading = true;
      
      try {
        const db = uniCloud.database();
        
        // 先查询所有数据（不加条件）
        const allRes = await db.collection('wiki_entries')
          .orderBy('created_at', 'desc')
          .limit(100)
          .get();
        
        console.log('查询原始结果:', allRes);
        console.log('allRes.result:', allRes.result);
        console.log('allRes.data:', allRes.data);
        
        // 兼容不同的返回格式
        const data = allRes.result?.data || allRes.data || [];
        console.log('实际数据:', data);
        
        this.entryList = data;
        this.hasNext = false;
        
        if (this.entryList.length > 0) {
          uni.showToast({ 
            title: `加载成功，共${this.entryList.length}条`, 
            icon: 'success' 
          });
        } else {
          uni.showToast({ 
            title: '暂无数据', 
            icon: 'none' 
          });
        }
      } catch (error) {
        console.error('加载失败详情:', error);
        uni.showToast({ 
          title: '加载失败: ' + (error.message || error), 
          icon: 'none',
          duration: 3000
        });
      } finally {
        this.loading = false;
      }
    },
    
    onTypeChange(e) {
      this.currentType = this.typeOptions[e.detail.value].value;
      this.page = 1;
      this.loadEntries();
    },
    
    handleSearch() {
      this.page = 1;
      this.loadEntries();
    },
    
    prevPage() {
      if (this.page > 1) {
        this.page--;
        this.loadEntries();
      }
    },
    
    nextPage() {
      if (this.hasNext) {
        this.page++;
        this.loadEntries();
      }
    },
    
    viewEntry(entry) {
      // 跳转到详情页查看
      uni.navigateTo({
        url: '/pages/botc/wiki/detail?id=' + entry._id
      });
    },
    
    deleteEntry(entry) {
      uni.showModal({
        title: '确认删除',
        content: `确定要删除"${entry.title}"吗？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              const db = uniCloud.database();
              await db.collection('wiki_entries').doc(entry._id).remove();
              uni.showToast({ title: '删除成功', icon: 'success' });
              this.loadEntries();
            } catch (error) {
              uni.showToast({ title: '删除失败', icon: 'none' });
            }
          }
        }
      });
    },
    
    goToSync() {
      uni.navigateTo({ url: '/pages/botc/wiki/sync' });
    },
    
    formatTime(time) {
      if (!time) return '-';
      const d = new Date(time);
      return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
    },
    
    getTypeText(type) {
      const map = { role: '角色', script: '剧本', rule: '规则', guide: '指南', term: '术语' };
      return map[type] || type;
    }
  }
}
</script>

<style scoped>
.page { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-title { font-size: 24px; font-weight: bold; }
.add-btn { height: 40px; padding: 0 20px; background: #4facfe; color: white; border: none; border-radius: 6px; cursor: pointer; }
.card { background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.filter-bar { display: flex; gap: 20px; flex-wrap: wrap; }
.filter-item { display: flex; align-items: center; }
.filter-item.search { flex: 1; justify-content: flex-end; }
.filter-label { font-size: 14px; color: #666; margin-right: 8px; }
.picker { min-width: 120px; height: 32px; line-height: 32px; padding: 0 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }
.search-input { width: 200px; height: 32px; padding: 0 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }
.search-btn { height: 32px; padding: 0 16px; background: #4facfe; color: white; border: none; border-radius: 4px; font-size: 14px; margin-left: 8px; }
.action-btn { padding: 4px 12px; background: #f0f0f0; color: #666; border: none; border-radius: 4px; font-size: 12px; margin-right: 8px; cursor: pointer; }
.action-btn.danger { background: #ffebee; color: #f5222d; }
.pagination { display: flex; justify-content: center; align-items: center; gap: 20px; margin-top: 20px; }
.page-btn { height: 32px; padding: 0 16px; background: #f0f0f0; border: none; border-radius: 4px; cursor: pointer; }
.page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.page-info { font-size: 14px; color: #666; }
</style>

