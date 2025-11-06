<template>
  <view class="container">
    <uni-card>
      <text class="uni-card-title">敏感词管理</text>
      
      <!-- 操作栏 -->
      <view class="action-bar">
        <view class="search-box">
          <input
            v-model="searchKeyword"
            placeholder="搜索敏感词"
            @confirm="handleSearch"
            class="search-input"
          />
          <button type="primary" size="mini" @click="handleSearch">搜索</button>
        </view>
        
        <view class="filter-box">
          <uni-data-select
            v-model="queryParams.type"
            :localdata="typeOptions"
            placeholder="类型筛选"
            @change="onFilterChange"
            style="width: 150px; margin-right: 10px;"
          ></uni-data-select>
          
          <uni-data-select
            v-model="queryParams.status"
            :localdata="statusOptions"
            placeholder="状态筛选"
            @change="onFilterChange"
            style="width: 150px; margin-right: 10px;"
          ></uni-data-select>
          
          <button type="primary" size="mini" @click="showAddDialog">添加敏感词</button>
          <button type="default" size="mini" @click="showImportDialog" style="margin-left: 5px;">批量导入</button>
        </view>
      </view>
      
      <!-- 敏感词列表 -->
      <uni-table :loading="loading" border stripe emptyText="暂无数据">
        <uni-tr>
          <uni-th width="200">敏感词</uni-th>
          <uni-th width="100">类型</uni-th>
          <uni-th width="80">级别</uni-th>
          <uni-th width="150">替换词</uni-th>
          <uni-th width="200">备注</uni-th>
          <uni-th width="80">状态</uni-th>
          <uni-th width="150">创建时间</uni-th>
          <uni-th width="150">操作</uni-th>
        </uni-tr>
        
        <uni-tr v-for="item in dataList" :key="item._id">
          <uni-td>
            <text class="word-text">{{ item.word }}</text>
          </uni-td>
          <uni-td>
            <uni-tag :text="getTypeText(item.type)" :type="getTypeColor(item.type)" size="mini"></uni-tag>
          </uni-td>
          <uni-td>
            <uni-tag :text="getLevelText(item.level)" :type="getLevelColor(item.level)" size="mini"></uni-tag>
          </uni-td>
          <uni-td>{{ item.replacement || '-' }}</uni-td>
          <uni-td>
            <text class="remark-text">{{ item.remark || '-' }}</text>
          </uni-td>
          <uni-td>
            <uni-tag
              :text="item.status === 'enabled' ? '启用' : '禁用'"
              :type="item.status === 'enabled' ? 'success' : 'error'"
              size="mini"
            ></uni-tag>
          </uni-td>
          <uni-td>{{ formatTime(item.created_at) }}</uni-td>
          <uni-td>
            <view class="action-buttons">
              <button type="default" size="mini" @click="handleEdit(item)">编辑</button>
              <button
                :type="item.status === 'enabled' ? 'warn' : 'primary'"
                size="mini"
                @click="toggleStatus(item)"
                style="margin-left: 5px;"
              >
                {{ item.status === 'enabled' ? '禁用' : '启用' }}
              </button>
              <button
                type="warn"
                size="mini"
                @click="handleDelete(item)"
                style="margin-left: 5px;"
              >
                删除
              </button>
            </view>
          </uni-td>
        </uni-tr>
      </uni-table>
      
      <!-- 分页 -->
      <view class="pagination">
        <uni-pagination
          :current="pagination.current"
          :total="pagination.total"
          :pageSize="pagination.pageSize"
          @change="onPageChange"
        />
      </view>
    </uni-card>
    
    <!-- 添加/编辑弹窗 -->
    <uni-popup ref="formPopup" type="center">
      <view class="form-popup">
        <view class="form-title">{{ isEdit ? '编辑敏感词' : '添加敏感词' }}</view>
        <uni-forms ref="form" :modelValue="formData" :rules="rules">
          <uni-forms-item label="敏感词" name="word" required>
            <input v-model="formData.word" placeholder="请输入敏感词" :disabled="isEdit" />
          </uni-forms-item>
          
          <uni-forms-item label="类型" name="type" required>
            <uni-data-select
              v-model="formData.type"
              :localdata="typeOptions"
              placeholder="请选择类型"
            ></uni-data-select>
          </uni-forms-item>
          
          <uni-forms-item label="级别" name="level" required>
            <uni-data-select
              v-model="formData.level"
              :localdata="levelOptions"
              placeholder="请选择级别"
            ></uni-data-select>
          </uni-forms-item>
          
          <uni-forms-item label="替换词" name="replacement">
            <input v-model="formData.replacement" placeholder="可选，用于自动替换" />
          </uni-forms-item>
          
          <uni-forms-item label="备注" name="remark">
            <textarea v-model="formData.remark" placeholder="备注说明" maxlength="200"></textarea>
          </uni-forms-item>
          
          <uni-forms-item label="状态" name="status">
            <uni-data-select
              v-model="formData.status"
              :localdata="statusOptions"
            ></uni-data-select>
          </uni-forms-item>
        </uni-forms>
        
        <view class="form-footer">
          <button type="default" size="mini" @click="closeFormPopup">取消</button>
          <button type="primary" size="mini" @click="handleSubmit" style="margin-left: 10px;">确定</button>
        </view>
      </view>
    </uni-popup>
    
    <!-- 批量导入弹窗 -->
    <uni-popup ref="importPopup" type="center">
      <view class="import-popup">
        <view class="import-title">批量导入敏感词</view>
        <view class="import-tips">
          <text>格式说明：每行一个敏感词，可选格式：</text>
          <text>1. 敏感词</text>
          <text>2. 敏感词,类型,级别,替换词,备注</text>
          <text>类型：politics/violence/porn/abuse/illegal/other</text>
          <text>级别：1/2/3</text>
        </view>
        <textarea
          v-model="importText"
          placeholder="请输入敏感词，每行一个"
          class="import-textarea"
        ></textarea>
        <view class="import-footer">
          <button type="default" size="mini" @click="closeImportPopup">取消</button>
          <button type="primary" size="mini" @click="handleImport" style="margin-left: 10px;">导入</button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
export default {
  data() {
    return {
      adminObj: null, // Admin云对象实例
      loading: false,
      dataList: [],
      searchKeyword: '',
      queryParams: {
        type: '',
        status: ''
      },
      pagination: {
        current: 1,
        total: 0,
        pageSize: 20
      },
      typeOptions: [
        { value: '', text: '全部类型' },
        { value: 'politics', text: '政治敏感' },
        { value: 'violence', text: '暴力血腥' },
        { value: 'porn', text: '色情低俗' },
        { value: 'abuse', text: '辱骂攻击' },
        { value: 'illegal', text: '违法违规' },
        { value: 'other', text: '其他' }
      ],
      levelOptions: [
        { value: 1, text: '轻度（提示）' },
        { value: 2, text: '中度（审核）' },
        { value: 3, text: '重度（拦截）' }
      ],
      statusOptions: [
        { value: '', text: '全部状态' },
        { value: 'enabled', text: '启用' },
        { value: 'disabled', text: '禁用' }
      ],
      isEdit: false,
      formData: {
        word: '',
        type: 'other',
        level: 2,
        replacement: '',
        remark: '',
        status: 'enabled'
      },
      rules: {
        word: {
          rules: [{ required: true, errorMessage: '请输入敏感词' }]
        },
        type: {
          rules: [{ required: true, errorMessage: '请选择类型' }]
        },
        level: {
          rules: [{ required: true, errorMessage: '请选择级别' }]
        }
      },
      importText: ''
    }
  },
  
  onLoad() {
    // 初始化云对象
    this.adminObj = uniCloud.importObject('admin', { customUI: true })
    this.loadData()
  },
  
  methods: {
    async loadData() {
      this.loading = true
      try {
        const result = await this.adminObj.getSensitiveWords({
          pageNo: this.pagination.current,
          pageSize: this.pagination.pageSize,
          keyword: this.searchKeyword || undefined,
          type: this.queryParams.type || undefined,
          status: this.queryParams.status || undefined
        })
        
        if (result.code === 0) {
          this.dataList = result.data.list
          this.pagination.total = result.data.total
        } else {
          uni.showToast({
            title: result.message,
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('加载数据失败：', error)
        uni.showToast({
          title: error.message || '加载失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },
    
    handleSearch() {
      this.pagination.current = 1
      this.loadData()
    },
    
    onFilterChange() {
      this.pagination.current = 1
      this.loadData()
    },
    
    onPageChange(e) {
      this.pagination.current = e.current
      this.loadData()
    },
    
    showAddDialog() {
      this.isEdit = false
      this.formData = {
        word: '',
        type: 'other',
        level: 2,
        replacement: '',
        remark: '',
        status: 'enabled'
      }
      this.$refs.formPopup.open()
    },
    
    handleEdit(item) {
      this.isEdit = true
      this.formData = { ...item }
      this.$refs.formPopup.open()
    },
    
    async handleSubmit() {
      try {
        await this.$refs.form.validate()
      } catch (error) {
        return
      }
      
      uni.showLoading({ title: '提交中...' })
      try {
        let result
        if (this.isEdit) {
          result = await this.adminObj.editSensitiveWord(this.formData._id, this.formData)
        } else {
          result = await this.adminObj.addSensitiveWord(this.formData)
        }
        
        if (result.code === 0) {
          uni.showToast({
            title: this.isEdit ? '更新成功' : '添加成功',
            icon: 'success'
          })
          this.closeFormPopup()
          this.loadData()
        } else {
          uni.showToast({
            title: result.message,
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('提交失败：', error)
        uni.showToast({
          title: error.message || '操作失败',
          icon: 'none'
        })
      } finally {
        uni.hideLoading()
      }
    },
    
    closeFormPopup() {
      this.$refs.formPopup.close()
    },
    
    toggleStatus(item) {
      const newStatus = item.status === 'enabled' ? 'disabled' : 'enabled'
      uni.showModal({
        title: '确认操作',
        content: `确认${newStatus === 'enabled' ? '启用' : '禁用'}该敏感词？`,
        success: async (res) => {
          if (res.confirm) {
            await this.updateStatus(item._id, newStatus)
          }
        }
      })
    },
    
    async updateStatus(wordId, status) {
      uni.showLoading({ title: '处理中...' })
      try {
        const result = await this.adminObj.toggleSensitiveWordStatus(wordId, status)
        
        if (result.code === 0) {
          uni.showToast({
            title: result.message,
            icon: 'success'
          })
          this.loadData()
        } else {
          uni.showToast({
            title: result.message,
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('操作失败：', error)
        uni.showToast({
          title: error.message || '操作失败',
          icon: 'none'
        })
      } finally {
        uni.hideLoading()
      }
    },
    
    handleDelete(item) {
      uni.showModal({
        title: '确认删除',
        content: `确认删除敏感词"${item.word}"？`,
        success: async (res) => {
          if (res.confirm) {
            await this.deleteWord(item._id)
          }
        }
      })
    },
    
    async deleteWord(wordId) {
      uni.showLoading({ title: '删除中...' })
      try {
        const result = await this.adminObj.deleteSensitiveWord(wordId)
        
        if (result.code === 0) {
          uni.showToast({
            title: '删除成功',
            icon: 'success'
          })
          this.loadData()
        } else {
          uni.showToast({
            title: result.message,
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('删除失败：', error)
        uni.showToast({
          title: error.message || '删除失败',
          icon: 'none'
        })
      } finally {
        uni.hideLoading()
      }
    },
    
    showImportDialog() {
      this.importText = ''
      this.$refs.importPopup.open()
    },
    
    async handleImport() {
      if (!this.importText.trim()) {
        uni.showToast({
          title: '请输入敏感词',
          icon: 'none'
        })
        return
      }
      
      const lines = this.importText.trim().split('\n')
      const words = lines.map(line => {
        const parts = line.split(',')
        return {
          word: parts[0].trim(),
          type: parts[1]?.trim() || 'other',
          level: parseInt(parts[2]) || 2,
          replacement: parts[3]?.trim() || '',
          remark: parts[4]?.trim() || ''
        }
      }).filter(w => w.word)
      
      if (words.length === 0) {
        uni.showToast({
          title: '没有有效的敏感词',
          icon: 'none'
        })
        return
      }
      
      uni.showLoading({ title: '导入中...' })
      try {
        const result = await this.adminObj.importSensitiveWords(words)
        
        if (result.code === 0) {
          uni.showToast({
            title: result.message,
            icon: 'success',
            duration: 3000
          })
          this.closeImportPopup()
          this.loadData()
        } else {
          uni.showToast({
            title: result.message,
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('导入失败：', error)
        uni.showToast({
          title: error.message || '导入失败',
          icon: 'none'
        })
      } finally {
        uni.hideLoading()
      }
    },
    
    closeImportPopup() {
      this.$refs.importPopup.close()
    },
    
    formatTime(timestamp) {
      if (!timestamp) return '-'
      const date = new Date(timestamp)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    },
    
    getTypeText(type) {
      const map = {
        politics: '政治敏感',
        violence: '暴力血腥',
        porn: '色情低俗',
        abuse: '辱骂攻击',
        illegal: '违法违规',
        other: '其他'
      }
      return map[type] || type
    },
    
    getTypeColor(type) {
      const map = {
        politics: 'error',
        violence: 'warning',
        porn: 'error',
        abuse: 'warning',
        illegal: 'error',
        other: 'default'
      }
      return map[type] || 'default'
    },
    
    getLevelText(level) {
      const map = {
        1: '轻度',
        2: '中度',
        3: '重度'
      }
      return map[level] || level
    },
    
    getLevelColor(level) {
      const map = {
        1: 'primary',
        2: 'warning',
        3: 'error'
      }
      return map[level] || 'default'
    }
  }
}
</script>

<style scoped>
.container {
  padding: 20px;
}

.uni-card-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 15px;
}

.action-bar {
  margin-bottom: 15px;
}

.search-box {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.search-input {
  flex: 1;
  max-width: 300px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 5px 10px;
  margin-right: 10px;
}

.filter-box {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.word-text {
  font-weight: 500;
  color: #303133;
}

.remark-text {
  font-size: 12px;
  color: #909399;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* 弹窗样式 */
.form-popup {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.form-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 20px;
  text-align: center;
}

.form-footer {
  margin-top: 20px;
  text-align: center;
}

.import-popup {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  width: 600px;
}

.import-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
}

.import-tips {
  background-color: #f4f4f5;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  font-size: 12px;
  color: #606266;
  line-height: 1.8;
}

.import-tips text {
  display: block;
}

.import-textarea {
  width: 100%;
  height: 300px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 10px;
  font-size: 14px;
  line-height: 1.5;
}

.import-footer {
  margin-top: 15px;
  text-align: center;
}
</style>

