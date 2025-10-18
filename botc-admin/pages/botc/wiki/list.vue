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
          <uni-th width="250">标题</uni-th>
          <uni-th width="120">角色类型</uni-th>
          <uni-th width="150">同步时间</uni-th>
          <uni-th width="150">操作</uni-th>
        </uni-tr>
        <uni-tr v-for="(entry, index) in entryList" :key="entry._id">
          <uni-td>{{ index + 1 + (page - 1) * pageSize }}</uni-td>
          <uni-td>
            <view class="title-cell">
              <text class="entry-title">{{ entry.title }}</text>
              <text v-if="entry.media?.character_info?.english_name" class="english-name">
                {{ entry.media.character_info.english_name }}
              </text>
            </view>
          </uni-td>
          <uni-td>
            <view v-if="entry.entry_type === 'role'" class="character-type-tag" :class="'char-' + getCharacterTypeClass(entry.media?.character_info?.character_type)">
              {{ entry.media?.character_info?.character_type || '-' }}
            </view>
            <text v-else class="text-muted">-</text>
          </uni-td>
          <uni-td>{{ formatTime(entry.sync_info?.last_synced_at) }}</uni-td>
          <uni-td>
            <button class="action-btn view" @click="viewEntry(entry)">查看</button>
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
    
    getCharacterTypeClass(characterType) {
      if (!characterType) return 'unknown';
      
      // 角色类型映射到CSS类名
      const typeMap = {
        '镇民': 'townsfolk',
        '外来者': 'outsider',
        '爪牙': 'minion',
        '恶魔': 'demon',
        '旅行者': 'traveler'
      };
      
      return typeMap[characterType] || 'unknown';
    }
  }
}
</script>

<style scoped>
.page { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-title { font-size: 24px; font-weight: bold; }
.add-btn { 
  height: 40px; 
  padding: 0 20px; 
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white; 
  border: none; 
  border-radius: 6px; 
  cursor: pointer;
  transition: transform 0.2s;
}
.add-btn:hover {
  transform: translateY(-1px);
}
.card { background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.filter-bar { display: flex; gap: 20px; flex-wrap: wrap; align-items: center; }
.filter-item { display: flex; align-items: center; }
.filter-item.search { flex: 1; justify-content: flex-end; }
.filter-label { font-size: 14px; color: #666; margin-right: 8px; }
.picker { min-width: 120px; height: 32px; line-height: 32px; padding: 0 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; background: white; }
.search-input { width: 200px; height: 32px; padding: 0 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }
.search-btn { 
  height: 32px; 
  padding: 0 16px; 
  background: #4facfe; 
  color: white; 
  border: none; 
  border-radius: 4px; 
  font-size: 14px; 
  margin-left: 8px;
  cursor: pointer;
  transition: background 0.2s;
}
.search-btn:hover {
  background: #3d9ce5;
}

/* 标题单元格 */
.title-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.entry-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}
.english-name {
  font-size: 12px;
  color: #999;
  font-style: italic;
}

/* 角色类型标签 */
.character-type-tag {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
}
.character-type-tag.char-townsfolk {
  background: linear-gradient(135deg, #a8e6cf 0%, #56ab2f 100%);
  color: white;
}
.character-type-tag.char-outsider {
  background: linear-gradient(135deg, #ffd89b 0%, #ff6f61 100%);
  color: white;
}
.character-type-tag.char-minion {
  background: linear-gradient(135deg, #dfe9f3 0%, #4b79a1 100%);
  color: white;
}
.character-type-tag.char-demon {
  background: linear-gradient(135deg, #ff758c 0%, #ff4757 100%);
  color: white;
}
.character-type-tag.char-traveler {
  background: linear-gradient(135deg, #fbc2eb 0%, #a18cd1 100%);
  color: white;
}
.character-type-tag.char-unknown {
  background: #f0f0f0;
  color: #999;
}

.text-muted {
  color: #ccc;
  font-size: 13px;
}

/* 操作按钮 */
.action-btn { 
  padding: 6px 14px; 
  border: none; 
  border-radius: 4px; 
  font-size: 12px; 
  margin-right: 8px; 
  cursor: pointer;
  transition: all 0.2s;
}
.action-btn.view {
  background: #e3f2fd;
  color: #1976d2;
}
.action-btn.view:hover {
  background: #bbdefb;
}
.action-btn.danger { 
  background: #ffebee; 
  color: #f5222d; 
}
.action-btn.danger:hover {
  background: #ffcdd2;
}

/* 分页 */
.pagination { 
  display: flex; 
  justify-content: center; 
  align-items: center; 
  gap: 20px; 
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}
.page-btn { 
  height: 36px; 
  padding: 0 20px; 
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 6px; 
  cursor: pointer;
  transition: all 0.2s;
}
.page-btn:hover:not(:disabled) {
  border-color: #4facfe;
  color: #4facfe;
}
.page-btn:disabled { 
  opacity: 0.5; 
  cursor: not-allowed;
  background: #f5f5f5;
}
.page-info { 
  font-size: 14px; 
  color: #666;
  padding: 0 10px;
}
</style>

