<template>
  <view class="page">
    <view class="title">百科数据测试</view>
    
    <button class="test-btn" @click="testQuery">测试查询数据</button>
    
    <view v-if="testResult" class="result">
      <text class="result-title">查询结果：</text>
      <text class="result-text">总数：{{ testResult.total }}</text>
      <text class="result-text">数据：{{ JSON.stringify(testResult.data, null, 2) }}</text>
    </view>
    
    <view class="data-list">
      <view v-for="(item, index) in dataList" :key="index" class="data-item">
        <text class="item-title">{{ item.title }}</text>
        <text class="item-type">{{ item.entry_type }}</text>
        <text class="item-status">status: {{ item.status }}</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      testResult: null,
      dataList: []
    }
  },
  
  onLoad() {
    this.testQuery();
  },
  
  methods: {
    async testQuery() {
      try {
        const db = uniCloud.database();
        
        // 查询所有数据
        const res = await db.collection('wiki_entries')
          .get();
        
        console.log('查询结果:', res);
        
        this.testResult = {
          total: res.data.length,
          data: res.data
        };
        
        this.dataList = res.data || [];
        
        uni.showToast({
          title: `查询成功：${res.data.length}条`,
          icon: 'success'
        });
      } catch (error) {
        console.error('查询失败:', error);
        uni.showToast({
          title: '查询失败: ' + error.message,
          icon: 'none',
          duration: 3000
        });
      }
    }
  }
}
</script>

<style scoped>
.page {
  padding: 20px;
}

.title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
}

.test-btn {
  height: 44px;
  background: #4facfe;
  color: white;
  border: none;
  border-radius: 6px;
  margin-bottom: 20px;
}

.result {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.result-title {
  display: block;
  font-weight: bold;
  margin-bottom: 10px;
}

.result-text {
  display: block;
  font-size: 12px;
  margin-bottom: 5px;
  word-break: break-all;
}

.data-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.data-item {
  background: white;
  padding: 15px;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.item-title {
  display: block;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 5px;
}

.item-type {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 3px;
}

.item-status {
  display: block;
  font-size: 12px;
  color: #999;
}
</style>

