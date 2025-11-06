<template>
  <view class="page">
    <view class="page-title">百科同步管理</view>
    
    <view class="stats-container">
      <view class="stat-card primary">
        <text class="stat-value">{{ stats.total }}</text>
        <text class="stat-label">总词条数</text>
        <text class="stat-desc">已同步的所有词条</text>
      </view>
      <view class="stat-card highlight">
        <text class="stat-value">{{ stats.role }}</text>
        <text class="stat-label">角色数量</text>
        <text class="stat-desc">已同步的角色词条</text>
      </view>
    </view>
    
    <!-- 角色管理区域 -->
    <view class="role-management-section card">
      <view class="section-title">角色管理</view>
      
      <!-- 添加角色 -->
      <view class="add-role-area">
        <view class="input-label">添加角色（多个角色用逗号或换行分隔）</view>
        <textarea 
          class="role-textarea"
          v-model="roleInput"
          placeholder="请输入角色名称，例如：&#10;图书管理员&#10;哲学家&#10;洗衣妇"
          maxlength="1000"
        />
        <view class="button-row">
          <button 
            class="add-role-btn"
            :loading="addingRoles"
            :disabled="!roleInput.trim()"
            @click="addRoles"
          >
            保存角色
          </button>
          <button 
            class="clear-btn"
            @click="roleInput = ''"
          >
            清空
          </button>
        </view>
      </view>
      
      <!-- 搜索和筛选 -->
      <view class="search-filter-area">
        <view class="search-row">
          <input 
            class="search-input"
            v-model="searchKeyword"
            placeholder="搜索角色名称"
            @input="searchRoles"
          />
          <picker 
            mode="selector" 
            :value="statusFilterIndex" 
            :range="statusOptions"
            range-key="label"
            @change="onStatusFilterChange"
          >
            <button class="filter-btn">
              {{ statusOptions[statusFilterIndex].label }}
            </button>
          </picker>
        </view>
      </view>
      
      <!-- 角色列表 -->
      <view class="role-list-area">
        <view class="list-header">
          <view class="list-info">
            <text class="list-title">已保存的角色</text>
            <text class="list-stats">
              当前显示：{{ roleList.length }} 个 | 
              总计：{{ totalRoles }} 个
              <text v-if="totalPages > 1" class="page-indicator">
                | 第 {{ currentPage }} / {{ totalPages }} 页
              </text>
            </text>
          </view>
          <view class="batch-actions">
            <button 
              class="batch-btn"
              :disabled="selectedRoles.length === 0"
              @click="batchSync"
            >
              批量同步（{{ selectedRoles.length }}）
            </button>
            <button 
              class="batch-btn delete"
              :disabled="selectedRoles.length === 0"
              @click="batchDelete"
            >
              批量删除（{{ selectedRoles.length }}）
            </button>
          </view>
        </view>
        
        <view v-if="loadingRoles" class="loading-area">
          <text>加载中...</text>
        </view>
        
        <view v-else-if="roleList.length === 0" class="empty-area">
          <text class="empty-text">暂无角色，请先添加角色</text>
        </view>
        
        <view v-else class="role-table">
          <view class="table-header">
            <view class="col-checkbox">
              <checkbox 
                :checked="allSelected" 
                @click="toggleSelectAll"
              />
            </view>
            <view class="col-name">角色名称</view>
            <view class="col-status">状态</view>
            <view class="col-time">最后同步时间</view>
            <view class="col-actions">操作</view>
          </view>
          
          <view 
            v-for="role in roleList" 
            :key="role._id" 
            class="table-row"
            :class="{ 'row-selected': selectedRoles.includes(role._id) }"
          >
            <view class="col-checkbox">
              <checkbox 
                :value="role._id"
                :checked="selectedRoles.includes(role._id)"
                @click="toggleSelect(role._id)"
              />
            </view>
            <view class="col-name">
              <text class="role-name">{{ role.role_name }}</text>
            </view>
            <view class="col-status">
              <view 
                class="status-tag"
                :class="'status-' + role.sync_status"
              >
                {{ getStatusText(role.sync_status) }}
              </view>
            </view>
            <view class="col-time">
              <text class="time-text">{{ formatTime(role.last_sync_time) }}</text>
            </view>
            <view class="col-actions">
              <button 
                class="action-btn sync-btn"
                :loading="syncingRole === role._id"
                @click="syncSingleRole(role)"
              >
                同步
              </button>
              <button 
                class="action-btn delete-btn"
                @click="deleteRole(role)"
              >
                删除
              </button>
            </view>
          </view>
        </view>
        
        <!-- 分页 -->
        <view v-if="totalRoles > pageSize" class="pagination">
          <button 
            class="page-btn"
            :disabled="currentPage === 1"
            @click="changePage(currentPage - 1)"
          >
            <text class="page-btn-text">← 上一页</text>
          </button>
          
          <view class="page-info-box">
            <text class="page-current">第 {{ currentPage }} 页</text>
            <text class="page-separator">/</text>
            <text class="page-total">共 {{ totalPages }} 页</text>
          </view>
          
          <button 
            class="page-btn"
            :disabled="currentPage === totalPages"
            @click="changePage(currentPage + 1)"
          >
            <text class="page-btn-text">下一页 →</text>
          </button>
        </view>
        
        <view v-if="totalRoles > pageSize" class="pagination-summary">
          <text class="summary-text">
            显示 {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, totalRoles) }} 条，
            共 {{ totalRoles }} 条记录
          </text>
        </view>
      </view>
    </view>
    
    <view v-if="lastSync" class="last-sync-section card">
      <view class="section-title">
        最后同步
        <text class="sync-type-badge" :class="'badge-' + lastSync.sync_type">
          {{ getSyncTypeText(lastSync.sync_type) }}
        </text>
      </view>
      <view class="sync-info">
        <view class="info-row">
          <text class="info-label">同步时间</text>
          <text class="info-value">{{ formatTime(lastSync.start_time) }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">同步数量</text>
          <text class="info-value">共 {{ lastSync.total_count || 0 }} 个</text>
        </view>
        <view class="info-row">
          <text class="info-label">同步结果</text>
          <view class="result-badges">
            <text class="result-badge success">✓ 成功 {{ lastSync.success_count || 0 }}</text>
            <text v-if="lastSync.failed_count > 0" class="result-badge failed">✗ 失败 {{ lastSync.failed_count }}</text>
          </view>
        </view>
        <view class="info-row">
          <text class="info-label">耗时</text>
          <text class="info-value">{{ lastSync.duration || 0 }} 秒</text>
        </view>
      </view>
    </view>
    
    <view v-else class="last-sync-section card empty-state">
      <view class="empty-icon">📋</view>
      <text class="empty-text">暂无同步记录</text>
      <text class="empty-hint">请先添加并同步角色</text>
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
      adminWikiObj: null, // AdminWiki云对象实例
      stats: { total: 0, role: 0 },
      syncing: false,
      syncType: '',
      syncingSingle: false,
      singleUrl: '',
      lastSync: null,
      syncLogs: [],
      
      // 角色管理相关
      roleInput: '',
      addingRoles: false,
      searchKeyword: '',
      statusFilterIndex: 0,
      statusOptions: [
        { label: '全部状态', value: 'all' },
        { label: '已同步', value: 'synced' },
        { label: '未同步', value: 'unsynced' },
        { label: '同步失败', value: 'failed' }
      ],
      roleList: [],
      totalRoles: 0,
      loadingRoles: false,
      selectedRoles: [],
      syncingRole: null,
      currentPage: 1,
      pageSize: 20
    }
  },
  
  computed: {
    allSelected() {
      return this.roleList.length > 0 && this.selectedRoles.length === this.roleList.length;
    },
    totalPages() {
      return Math.ceil(this.totalRoles / this.pageSize);
    }
  },
  
  onLoad() {
    console.log('[WikiSync] 页面加载');
    // 初始化云对象
    this.adminWikiObj = uniCloud.importObject('admin-wiki', { customUI: true });
    this.loadStats();
    this.loadSyncLogs();
    this.loadRoleList();
  },
  
  onShow() {
    console.log('[WikiSync] 页面显示');
  },
  
  methods: {
    async loadStats() {
      try {
        const db = uniCloud.database();
        
        // 查询总词条数
        const totalRes = await db.collection('wiki_entries')
          .where({ status: 1 })
          .count();
        this.stats.total = totalRes.result?.total || totalRes.total || 0;
        
        // 查询角色数量
        const roleRes = await db.collection('wiki_entries')
          .where({ entry_type: 'role', status: 1 })
          .count();
        this.stats.role = roleRes.result?.total || roleRes.total || 0;
        
        console.log('[loadStats] 统计完成 - 总词条:', this.stats.total, '角色:', this.stats.role);
      } catch (error) {
        console.error('[loadStats] 加载统计失败:', error);
      }
    },
    
    async loadSyncLogs() {
      try {
        const db = uniCloud.database();
        const res = await db.collection('wiki_sync_logs')
          .orderBy('created_at', 'desc')
          .limit(10)
          .get();
        
        console.log('[loadSyncLogs] 同步日志原始结果:', res);
        
        // 兼容不同的返回格式
        const data = res.result?.data || res.data || [];
        console.log('[loadSyncLogs] 获取到', data.length, '条日志');
        
        this.syncLogs = data;
        if (this.syncLogs.length > 0) {
          this.lastSync = this.syncLogs[0];
          console.log('[loadSyncLogs] 最后一次同步:', {
            type: this.lastSync.sync_type,
            time: this.formatTime(this.lastSync.start_time),
            success: this.lastSync.success_count,
            failed: this.lastSync.failed_count
          });
        } else {
          this.lastSync = null;
          console.log('[loadSyncLogs] 暂无同步日志');
        }
      } catch (error) {
        console.error('[loadSyncLogs] 加载日志失败:', error);
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
        
        const res = await this.adminWikiObj.syncAll(type, 5);
        
        uni.hideLoading();
        
        if (res.code === 0) {
          const result = res.data;
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
          uni.showToast({ title: '同步失败: ' + res.message, icon: 'none', duration: 3000 });
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
        
        const res = await this.adminWikiObj.syncSingle(this.singleUrl.trim());
        
        console.log('[syncSingle] 云函数调用结果:', res);
        
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
      if (!status) return '未同步';
      const map = { 
        success: '已同步', 
        partial_success: '部分成功', 
        failed: '失败', 
        running: '运行中',
        pending: '未同步'
      };
      return map[status] || status;
    },
    
    // ========== 角色管理相关方法 ==========
    
    // 添加角色
    async addRoles() {
      const input = this.roleInput.trim();
      if (!input) {
        return uni.showToast({ title: '请输入角色名称', icon: 'none' });
      }
      
      // 分割角色名称（支持逗号、换行、分号分隔）
      const roleNames = input
        .split(/[,，\n;；]/)
        .map(name => name.trim())
        .filter(name => name.length > 0);
      
      if (roleNames.length === 0) {
        return uni.showToast({ title: '请输入有效的角色名称', icon: 'none' });
      }
      
      this.addingRoles = true;
      
      try {
        uni.showLoading({ title: '添加中...' });
        
        const res = await this.adminWikiObj.addRoles(roleNames);
        
        uni.hideLoading();
        
        console.log('[addRoles] 添加结果:', res);
        
        if (res.code === 0) {
          const data = res.data;
          let message = res.message;
          
          if (data.duplicate.length > 0) {
            message += `\n重复角色：${data.duplicate.join('、')}`;
          }
          
          if (data.failed.length > 0) {
            message += `\n失败角色：${data.failed.map(f => f.role_name).join('、')}`;
          }
          
          uni.showModal({
            title: '添加完成',
            content: message,
            showCancel: false,
            success: () => {
              this.roleInput = '';
              this.loadRoleList();
            }
          });
        } else {
          uni.showToast({ 
            title: res.message, 
            icon: 'none',
            duration: 2000
          });
        }
      } catch (error) {
        uni.hideLoading();
        console.error('[addRoles] 添加失败:', error);
        uni.showToast({ 
          title: '添加失败: ' + error.message, 
          icon: 'none',
          duration: 2000
        });
      } finally {
        this.addingRoles = false;
      }
    },
    
    // 加载角色列表
    async loadRoleList() {
      this.loadingRoles = true;
      
      try {
        const res = await this.adminWikiObj.getRoles({
          keyword: this.searchKeyword,
            sync_status: this.statusOptions[this.statusFilterIndex].value,
          page: this.currentPage,
          page_size: this.pageSize
        });
        
        console.log('[loadRoleList] 加载结果:', res);
        
        if (res.code === 0) {
          this.roleList = res.data.list;
          this.totalRoles = res.data.total;
        } else {
          uni.showToast({ 
            title: '加载失败: ' + res.message, 
            icon: 'none' 
          });
        }
      } catch (error) {
        console.error('[loadRoleList] 加载失败:', error);
        uni.showToast({ 
          title: '加载失败: ' + error.message, 
          icon: 'none' 
        });
      } finally {
        this.loadingRoles = false;
      }
    },
    
    // 搜索角色
    searchRoles() {
      // 防抖处理
      clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => {
        this.currentPage = 1;
        this.loadRoleList();
      }, 500);
    },
    
    // 状态筛选变化
    onStatusFilterChange(e) {
      this.statusFilterIndex = e.detail.value;
      this.currentPage = 1;
      this.loadRoleList();
    },
    
    // 切换选择
    toggleSelect(roleId) {
      const index = this.selectedRoles.indexOf(roleId);
      if (index > -1) {
        this.selectedRoles.splice(index, 1);
      } else {
        this.selectedRoles.push(roleId);
      }
    },
    
    // 全选/取消全选
    toggleSelectAll() {
      if (this.allSelected) {
        this.selectedRoles = [];
      } else {
        this.selectedRoles = this.roleList.map(role => role._id);
      }
    },
    
    // 同步单个角色
    async syncSingleRole(role) {
      uni.showModal({
        title: '确认同步',
        content: `确定要同步角色 "${role.role_name}" 吗？`,
        success: async (res) => {
          if (res.confirm) {
            await this.executeSyncRoles([role._id]);
          }
        }
      });
    },
    
    // 批量同步
    async batchSync() {
      if (this.selectedRoles.length === 0) {
        return uni.showToast({ title: '请先选择角色', icon: 'none' });
      }
      
      uni.showModal({
        title: '确认批量同步',
        content: `确定要同步选中的 ${this.selectedRoles.length} 个角色吗？`,
        success: async (res) => {
          if (res.confirm) {
            await this.executeSyncRoles(this.selectedRoles);
          }
        }
      });
    },
    
    // 执行同步角色
    async executeSyncRoles(roleIds) {
      this.syncing = true;
      
      try {
        uni.showLoading({ title: '同步中...', mask: true });
        
        const res = await this.adminWikiObj.syncRoles(roleIds);
        
        uni.hideLoading();
        
        console.log('[executeSyncRoles] 同步结果:', res);
        
        if (res.code === 0) {
          const data = res.data;
          let content = `总数: ${data.total_count}\n成功: ${data.success_count}\n失败: ${data.failed_count}\n耗时: ${data.duration}秒`;
          
          if (data.failed.length > 0) {
            content += `\n\n失败角色：\n${data.failed.map(f => `${f.role_name}: ${f.reason}`).join('\n')}`;
          }
          
          uni.showModal({
            title: '同步完成',
            content: content,
            showCancel: false,
            success: () => {
              this.selectedRoles = [];
              this.loadRoleList();
              this.loadStats();
              this.loadSyncLogs();  // 刷新同步日志
            }
          });
        } else {
          uni.showToast({ 
            title: '同步失败: ' + res.message, 
            icon: 'none',
            duration: 3000
          });
        }
      } catch (error) {
        uni.hideLoading();
        console.error('[executeSyncRoles] 同步失败:', error);
        uni.showToast({ 
          title: '同步失败: ' + error.message, 
          icon: 'none',
          duration: 2000
        });
      } finally {
        this.syncing = false;
        this.syncingRole = null;
      }
    },
    
    // 删除角色
    async deleteRole(role) {
      uni.showModal({
        title: '确认删除',
        content: `确定要删除角色 "${role.role_name}" 吗？`,
        success: async (res) => {
          if (res.confirm) {
            await this.executeDeleteRoles([role._id]);
          }
        }
      });
    },
    
    // 批量删除
    async batchDelete() {
      if (this.selectedRoles.length === 0) {
        return uni.showToast({ title: '请先选择角色', icon: 'none' });
      }
      
      uni.showModal({
        title: '确认批量删除',
        content: `确定要删除选中的 ${this.selectedRoles.length} 个角色吗？删除后无法恢复。`,
        success: async (res) => {
          if (res.confirm) {
            await this.executeDeleteRoles(this.selectedRoles);
          }
        }
      });
    },
    
    // 执行删除角色
    async executeDeleteRoles(roleIds) {
      try {
        uni.showLoading({ title: '删除中...' });
        
        const res = await this.adminWikiObj.deleteRoles(roleIds);
        
        uni.hideLoading();
        
        console.log('[executeDeleteRoles] 删除结果:', res);
        
        if (res.code === 0) {
          uni.showToast({ 
            title: res.message, 
            icon: 'success' 
          });
          this.selectedRoles = [];
          this.loadRoleList();
        } else {
          uni.showToast({ 
            title: '删除失败: ' + res.message, 
            icon: 'none',
            duration: 2000
          });
        }
      } catch (error) {
        uni.hideLoading();
        console.error('[executeDeleteRoles] 删除失败:', error);
        uni.showToast({ 
          title: '删除失败: ' + error.message, 
          icon: 'none',
          duration: 2000
        });
      }
    },
    
    // 切换页码
    changePage(page) {
      this.currentPage = page;
      this.selectedRoles = [];
      this.loadRoleList();
    }
  }
}
</script>

<style scoped>
.page { padding: 20px; }
.page-title { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
.stats-container { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 20px; }
.stat-card { 
  background: white; 
  border-radius: 12px; 
  padding: 30px 24px; 
  text-align: center; 
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
  overflow: hidden;
}
.stat-card:hover { 
  transform: translateY(-2px); 
  box-shadow: 0 6px 16px rgba(0,0,0,0.12); 
}
.stat-card.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.stat-card.highlight {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}
.stat-card.primary .stat-value,
.stat-card.primary .stat-label,
.stat-card.primary .stat-desc,
.stat-card.highlight .stat-value,
.stat-card.highlight .stat-label,
.stat-card.highlight .stat-desc {
  color: white;
}
.stat-value { 
  display: block; 
  font-size: 48px; 
  font-weight: bold; 
  margin-bottom: 8px;
  line-height: 1;
}
.stat-label { 
  display: block; 
  font-size: 16px; 
  font-weight: 500;
  margin-bottom: 4px;
  opacity: 0.95;
}
.stat-desc {
  display: block;
  font-size: 12px;
  opacity: 0.85;
}
.card { background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.section-title { font-size: 18px; font-weight: bold; margin-bottom: 16px; color: #333; }

/* 角色管理样式 */
.role-management-section { }
.add-role-area { margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #e8e8e8; }
.input-label { font-size: 14px; color: #666; margin-bottom: 8px; }
.role-textarea { 
  width: 100%; 
  height: 120px; 
  padding: 12px; 
  border: 1px solid #ddd; 
  border-radius: 6px; 
  font-size: 14px; 
  line-height: 1.6;
  resize: vertical;
}
.button-row { display: flex; gap: 12px; margin-top: 12px; }
.add-role-btn { 
  flex: 1; 
  height: 40px; 
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
  color: white; 
  border: none; 
  border-radius: 6px; 
  font-size: 14px; 
  font-weight: bold;
  cursor: pointer; 
}
.clear-btn { 
  width: 100px; 
  height: 40px; 
  background: #f0f0f0; 
  color: #666; 
  border: none; 
  border-radius: 6px; 
  cursor: pointer; 
}

/* 搜索筛选样式 */
.search-filter-area { margin-bottom: 24px; }
.search-row { display: flex; gap: 12px; align-items: center; }
.search-input { 
  flex: 1; 
  height: 40px; 
  padding: 0 12px; 
  border: 1px solid #ddd; 
  border-radius: 6px; 
  font-size: 14px; 
}
.filter-btn { 
  width: 140px; 
  height: 40px; 
  background: #f0f0f0; 
  color: #666; 
  border: none; 
  border-radius: 6px; 
  font-size: 14px;
  cursor: pointer;
}

/* 列表样式 */
.role-list-area { }
.list-header { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: 16px; 
}
.list-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.list-title { 
  font-size: 16px; 
  font-weight: bold; 
  color: #333; 
}
.list-stats {
  font-size: 13px;
  color: #666;
}
.page-indicator {
  color: #4facfe;
  font-weight: 500;
}
.batch-actions { display: flex; gap: 12px; }
.batch-btn { 
  height: 36px; 
  padding: 0 20px; 
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); 
  color: white; 
  border: none; 
  border-radius: 6px; 
  font-size: 13px;
  cursor: pointer;
}
.batch-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.batch-btn.delete { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }

.loading-area, .empty-area { 
  text-align: center; 
  padding: 60px 20px; 
  color: #999; 
  font-size: 14px; 
}
.empty-text { color: #999; }

/* 表格样式 */
.role-table { border: 1px solid #e8e8e8; border-radius: 6px; overflow: hidden; }
.table-header, .table-row { 
  display: flex; 
  align-items: center; 
  padding: 12px 16px; 
  border-bottom: 1px solid #e8e8e8; 
}
.table-header { 
  background: #fafafa; 
  font-weight: bold; 
  font-size: 14px; 
  color: #333; 
}
.table-row { 
  background: white; 
  transition: background 0.2s; 
}
.table-row:hover { background: #f5f5f5; }
.table-row:last-child { border-bottom: none; }
.table-row.row-selected { background: #e6f7ff; }

.col-checkbox { width: 60px; }
.col-name { flex: 1; min-width: 150px; }
.col-status { width: 120px; }
.col-time { width: 180px; }
.col-actions { width: 180px; display: flex; gap: 8px; }

.role-name { font-size: 14px; color: #333; }
.status-tag { 
  display: inline-block; 
  padding: 4px 12px; 
  border-radius: 12px; 
  font-size: 12px; 
  font-weight: 500;
}
.status-success { background: #f6ffed; color: #52c41a; border: 1px solid #b7eb8f; }
.status-pending { background: #f0f0f0; color: #999; border: 1px solid #d9d9d9; }
.status-failed { background: #fff1f0; color: #f5222d; border: 1px solid #ffa39e; }

.time-text { font-size: 13px; color: #666; }

.action-btn { 
  height: 32px; 
  padding: 0 16px; 
  border: none; 
  border-radius: 4px; 
  font-size: 13px;
  cursor: pointer;
}
.action-btn.sync-btn { background: #4facfe; color: white; }
.action-btn.delete-btn { background: #fff; color: #f5222d; border: 1px solid #f5222d; }

/* 分页样式 */
.pagination { 
  display: flex; 
  justify-content: center; 
  align-items: center; 
  gap: 16px; 
  margin-top: 20px;
  padding: 16px 0;
  border-top: 1px solid #f0f0f0;
}
.page-btn { 
  height: 40px; 
  min-width: 100px;
  padding: 0 24px; 
  background: white; 
  color: #666; 
  border: 1px solid #d9d9d9; 
  border-radius: 6px; 
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}
.page-btn:hover:not(:disabled) { 
  border-color: #4facfe;
  color: #4facfe;
  background: #f0f9ff;
}
.page-btn:disabled { 
  opacity: 0.5; 
  cursor: not-allowed; 
  background: #f5f5f5;
}
.page-btn-text {
  font-size: 14px;
}
.page-info-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  color: white;
}
.page-current {
  font-size: 15px;
  font-weight: bold;
}
.page-separator {
  font-size: 14px;
  opacity: 0.8;
}
.page-total {
  font-size: 14px;
  opacity: 0.95;
}
.pagination-summary {
  text-align: center;
  margin-top: 8px;
}
.summary-text {
  font-size: 13px;
  color: #999;
}

/* 最后同步样式 */
.last-sync-section { }
.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
}
.sync-type-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}
.sync-type-badge.badge-roles {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}
.sync-type-badge.badge-all {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}
.sync-info { 
  display: flex; 
  flex-direction: column; 
  gap: 16px;
  margin-top: 8px;
}
.info-row { 
  display: flex; 
  align-items: center; 
  font-size: 14px;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;
}
.info-row:last-child {
  border-bottom: none;
}
.info-label { 
  color: #999; 
  min-width: 90px;
  font-size: 13px;
}
.info-value { 
  color: #333;
  font-size: 14px;
  font-weight: 500;
}
.result-badges {
  display: flex;
  gap: 8px;
}
.result-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}
.result-badge.success { 
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}
.result-badge.failed { 
  background: #fff1f0;
  color: #f5222d;
  border: 1px solid #ffa39e;
}

/* 空状态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}
.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.6;
}
.empty-text {
  font-size: 16px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}
.empty-hint {
  font-size: 13px;
  color: #999;
}
</style>

