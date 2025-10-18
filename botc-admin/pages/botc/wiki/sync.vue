<template>
  <view class="page">
    <view class="page-title">百科同步管理</view>
    
    <view class="stats-container">
      <view class="stat-card">
        <text class="stat-value">{{ stats.total }}</text>
        <text class="stat-label">总词条</text>
      </view>
      <view class="stat-card">
        <text class="stat-value">{{ stats.role }}</text>
        <text class="stat-label">角色</text>
      </view>
      <view class="stat-card">
        <text class="stat-value">{{ stats.script }}</text>
        <text class="stat-label">剧本</text>
      </view>
      <view class="stat-card">
        <text class="stat-value">{{ stats.rule }}</text>
        <text class="stat-label">规则</text>
      </view>
    </view>
    
    <view class="sync-section card">
      <view class="section-title">批量同步</view>
      <view class="sync-buttons">
        <button 
          class="sync-btn primary" 
          :loading="syncing && syncType === 'all'"
          @click="startSync('all')"
        >
          同步所有内容
        </button>
        <button 
          class="sync-btn" 
          :loading="syncing && syncType === 'roles'"
          @click="startSync('roles')"
        >
          仅同步角色
        </button>
        <button 
          class="sync-btn" 
          :loading="syncing && syncType === 'scripts'"
          @click="startSync('scripts')"
        >
          仅同步剧本
        </button>
        <button 
          class="sync-btn" 
          :loading="syncing && syncType === 'rules'"
          @click="startSync('rules')"
        >
          仅同步规则
        </button>
      </view>
    </view>
    
    <view class="single-sync-section card">
      <view class="section-title">单个同步</view>
      <view class="input-row">
        <input 
          class="url-input"
          v-model="singleUrl"
          placeholder="输入钟楼百科页面URL"
        />
        <button 
          class="sync-single-btn"
          :loading="syncingSingle"
          :disabled="!singleUrl.trim()"
          @click="syncSingle"
        >
          同步
        </button>
      </view>
    </view>
    
    <view v-if="lastSync" class="last-sync-section card">
      <view class="section-title">最后同步</view>
      <view class="sync-info">
        <view class="info-row">
          <text class="info-label">同步时间：</text>
          <text class="info-value">{{ formatTime(lastSync.start_time) }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">同步类型：</text>
          <text class="info-value">{{ getSyncTypeText(lastSync.sync_type) }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">同步结果：</text>
          <text class="info-value success">成功 {{ lastSync.success_count }}</text>
          <text class="info-value failed">失败 {{ lastSync.failed_count }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">耗时：</text>
          <text class="info-value">{{ lastSync.duration }}秒</text>
        </view>
      </view>
    </view>
    
    <view class="logs-section card">
      <view class="section-title">同步日志</view>
      <uni-table :data="syncLogs" border stripe>
        <uni-tr>
          <uni-th width="180">开始时间</uni-th>
          <uni-th width="100">类型</uni-th>
          <uni-th width="80">总数</uni-th>
          <uni-th width="80">成功</uni-th>
          <uni-th width="80">失败</uni-th>
          <uni-th width="100">耗时</uni-th>
          <uni-th width="100">状态</uni-th>
        </uni-tr>
        <uni-tr v-for="(log, index) in syncLogs" :key="index">
          <uni-td>{{ formatTime(log.start_time) }}</uni-td>
          <uni-td>{{ getSyncTypeText(log.sync_type) }}</uni-td>
          <uni-td>{{ log.total_count }}</uni-td>
          <uni-td>{{ log.success_count }}</uni-td>
          <uni-td>{{ log.failed_count }}</uni-td>
          <uni-td>{{ log.duration }}秒</uni-td>
          <uni-td>
            <text :class="'status-' + log.status">{{ getStatusText(log.status) }}</text>
          </uni-td>
        </uni-tr>
      </uni-table>
    </view>
  </view>
</template>

<script>
export default {
  name: 'WikiSync',
  
  data() {
    return {
      stats: { total: 0, role: 0, script: 0, rule: 0 },
      syncing: false,
      syncType: '',
      syncingSingle: false,
      singleUrl: '',
      lastSync: null,
      syncLogs: []
    }
  },
  
  onLoad() {
    console.log('[WikiSync] 页面加载');
    this.loadStats();
    this.loadSyncLogs();
  },
  
  onShow() {
    console.log('[WikiSync] 页面显示');
  },
  
  methods: {
    async loadStats() {
      try {
        const db = uniCloud.database();
        const types = ['role', 'script', 'rule'];
        let total = 0;
        
        for (const type of types) {
          const res = await db.collection('wiki_entries')
            .where({ entry_type: type, status: 1 })
            .count();
          
          console.log(`统计${type}:`, res);
          
          // 兼容不同返回格式
          const count = res.result?.total || res.total || 0;
          this.stats[type] = count;
          total += count;
        }
        
        this.stats.total = total;
      } catch (error) {
        console.error('加载统计失败', error);
      }
    },
    
    async loadSyncLogs() {
      try {
        const db = uniCloud.database();
        const res = await db.collection('wiki_sync_logs')
          .orderBy('start_time', 'desc')
          .limit(10)
          .get();
        
        console.log('同步日志原始结果:', res);
        console.log('res.result:', res.result);
        console.log('res.data:', res.data);
        
        // 兼容不同的返回格式
        const data = res.result?.data || res.data || [];
        console.log('实际日志数据:', data);
        
        this.syncLogs = data;
        if (this.syncLogs.length > 0) {
          this.lastSync = this.syncLogs[0];
          console.log('最后一次同步:', this.lastSync);
        }
      } catch (error) {
        console.error('加载日志失败', error);
        uni.showToast({
          title: '加载日志失败: ' + error.message,
          icon: 'none'
        });
      }
    },
    
    async startSync(type) {
      const typeText = this.getSyncTypeText(type);
      
      uni.showModal({
        title: '确认同步',
        content: `确定要同步${typeText}吗？这可能需要几分钟时间。`,
        success: async (res) => {
          if (res.confirm) {
            await this.executeSyncAll(type);
          }
        }
      });
    },
    
    async executeSyncAll(type) {
      this.syncing = true;
      this.syncType = type;
      
      try {
        uni.showLoading({ title: '同步中...', mask: true });
        
        const res = await uniCloud.callFunction({
          name: 'wiki-admin-sync-all',
          data: { sync_type: type, batch_size: 5 }
        });
        
        uni.hideLoading();
        
        if (res.result.code === 0) {
          const result = res.result.data;
          uni.showModal({
            title: '同步完成',
            content: `总数: ${result.total_count}\n成功: ${result.success_count}\n失败: ${result.failed_count}\n耗时: ${result.duration}秒`,
            showCancel: false,
            success: () => {
              this.loadStats();
              this.loadSyncLogs();
            }
          });
        } else {
          uni.showToast({ title: '同步失败: ' + res.result.message, icon: 'none', duration: 3000 });
        }
      } catch (error) {
        uni.hideLoading();
        console.error('同步失败', error);
        uni.showToast({ title: '同步失败', icon: 'none' });
      } finally {
        this.syncing = false;
        this.syncType = '';
      }
    },
    
    async syncSingle() {
      if (!this.singleUrl.trim()) {
        return uni.showToast({ title: '请输入URL', icon: 'none' });
      }
      
      if (!this.singleUrl.includes('clocktower-wiki.gstonegames.com')) {
        return uni.showToast({ title: '请输入钟楼百科的链接', icon: 'none', duration: 2000 });
      }
      
      this.syncingSingle = true;
      
      try {
        uni.showLoading({ title: '同步中...' });
        
        // 使用云对象方式调用
        const syncObj = uniCloud.importObject('wiki-admin-sync-single');
        const res = await syncObj.syncPage(this.singleUrl.trim());
        
        uni.hideLoading();
        
        if (res.code === 0) {
          uni.showToast({ title: res.message, icon: 'success' });
          this.singleUrl = '';
          this.loadStats();
        } else {
          uni.showToast({ title: res.message, icon: 'none', duration: 2000 });
        }
      } catch (error) {
        uni.hideLoading();
        console.error('同步失败', error);
        uni.showToast({ title: '同步失败: ' + error.message, icon: 'none', duration: 3000 });
      } finally {
        this.syncingSingle = false;
      }
    },
    
    formatTime(time) {
      if (!time) return '-';
      const d = new Date(time);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    },
    
    getSyncTypeText(type) {
      const map = { all: '所有内容', roles: '角色', scripts: '剧本', rules: '规则' };
      return map[type] || type;
    },
    
    getStatusText(status) {
      const map = { success: '成功', partial_success: '部分成功', failed: '失败', running: '运行中' };
      return map[status] || status;
    }
  }
}
</script>

<style scoped>
.page { padding: 20px; }
.page-title { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
.stats-container { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 20px; }
.stat-card { background: white; border-radius: 8px; padding: 20px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.stat-value { display: block; font-size: 32px; font-weight: bold; color: #4facfe; margin-bottom: 8px; }
.stat-label { display: block; font-size: 14px; color: #666; }
.card { background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.section-title { font-size: 18px; font-weight: bold; margin-bottom: 16px; color: #333; }
.sync-buttons { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.sync-btn { height: 44px; background: #f0f0f0; color: #666; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; }
.sync-btn.primary { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; font-weight: bold; }
.input-row { display: flex; gap: 12px; }
.url-input { flex: 1; height: 40px; padding: 0 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; }
.sync-single-btn { width: 120px; height: 40px; background: #4facfe; color: white; border: none; border-radius: 6px; cursor: pointer; }
.sync-single-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.sync-info { display: flex; flex-direction: column; gap: 12px; }
.info-row { display: flex; align-items: center; font-size: 14px; }
.info-label { color: #666; margin-right: 8px; min-width: 80px; }
.info-value { color: #333; margin-right: 16px; }
.info-value.success { color: #52c41a; }
.info-value.failed { color: #f5222d; }
.status-success { color: #52c41a; }
.status-partial_success { color: #faad14; }
.status-failed { color: #f5222d; }
</style>

