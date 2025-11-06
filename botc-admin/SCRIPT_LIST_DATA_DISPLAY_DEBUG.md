# 剧本列表数据显示问题诊断

## 问题描述
从用户截图看到，剧本"大校在蓝v4"的以下字段在列表中显示为空（显示"-"）：
- 类型（script_type）
- 难度（difficulty）
- 玩家人数（player_count）
- 时长（duration）
- 状态（status）

## 可能的原因分析

### 1. 数据库字段名称不匹配 ❌
**检查结果**：字段名称正确
- 编辑页面使用的字段名：`script_type`, `difficulty`, `player_count`, `duration`, `status`
- 列表页面使用的字段名：`script_type`, `difficulty`, `player_count`, `duration`, `status`
- ✅ 字段名称一致

### 2. 数据库中该记录的字段值为空 ⚠️
**最可能的原因**：这条记录可能是通过旧版本导入或手动创建的，某些字段没有赋值

**如何验证**：
在 uniCloud Web控制台中查询这条记录：
```javascript
db.collection('botc-scripts')
  .where({
    _id: '9c98e9...' // 这条记录的完整ID
  })
  .get()
```

### 3. 数据类型不匹配 ⚠️
**可能情况**：
- `script_type` 应该是数字 1 或 2，但可能存储为字符串 "1"、"2" 或其他值
- `difficulty` 应该是数字 1-4，但可能存储为字符串或其他值
- `status` 应该是数字 0/1/2，但可能存储为字符串或其他值

**验证方法**：
```javascript
console.log('数据类型检查：')
console.log('script_type:', typeof item.script_type, item.script_type)
console.log('difficulty:', typeof item.difficulty, item.difficulty)
console.log('status:', typeof item.status, item.status)
```

### 4. 查询字段选择问题 ⚠️
**检查代码**：第495-500行
```javascript
const res = await db.collection('botc-scripts')
  .where(whereCondition)
  .orderBy('created_at', 'desc')
  .skip((this.pagination.current - 1) * this.pagination.pageSize)
  .limit(this.pagination.pageSize)
  .get()
```

**问题**：没有使用 `.field()` 指定要查询的字段，应该返回所有字段

### 5. 显示逻辑问题 ❌
**检查结果**：显示逻辑正确
```vue
<uni-td>
  <uni-tag :type="item.script_type === 1 ? 'primary' : 'success'" size="small">
    {{ getTypeText(item.script_type) }}
  </uni-tag>
</uni-td>
<uni-td>
  <uni-tag :type="getDifficultyType(item.difficulty)" size="small">
    {{ getDifficultyText(item.difficulty) }}
  </uni-tag>
</uni-td>
<uni-td>{{ item.player_count || '-' }}</uni-td>
<uni-td>{{ item.duration ? item.duration + '分' : '-' }}</uni-td>
<uni-td>
  <uni-tag :type="getStatusType(item.status)" size="small">
    {{ getStatusText(item.status) }}
  </uni-tag>
</uni-td>
```

## 诊断步骤

### 步骤1：添加调试日志
在 `loadData()` 方法中添加日志输出：

```javascript
async loadData() {
  this.loading = true
  try {
    // ... 查询代码 ...
    
    this.dataList = res.result.data
    
    // 🔍 添加调试日志
    console.log('📊 查询到的数据：', this.dataList)
    if (this.dataList.length > 0) {
      console.log('📝 第一条数据详情：', this.dataList[0])
      console.log('类型字段：', this.dataList[0].script_type, typeof this.dataList[0].script_type)
      console.log('难度字段：', this.dataList[0].difficulty, typeof this.dataList[0].difficulty)
      console.log('人数字段：', this.dataList[0].player_count, typeof this.dataList[0].player_count)
      console.log('时长字段：', this.dataList[0].duration, typeof this.dataList[0].duration)
      console.log('状态字段：', this.dataList[0].status, typeof this.dataList[0].status)
    }

  } catch (error) {
    // ...
  }
}
```

### 步骤2：检查数据库记录
在 uniCloud Web控制台执行查询，查看原始数据：

```javascript
// 查看这条特定记录
db.collection('botc-scripts')
  .where({
    title: '大校在蓝v4'
  })
  .get()
  .then(res => {
    console.log('数据库原始数据：', res.data[0])
  })
```

### 步骤3：修复数据
如果发现数据确实为空，可以通过编辑页面手动补全，或通过数据库批量更新：

```javascript
// 为所有缺少类型的剧本设置默认类型
db.collection('botc-scripts')
  .where({
    script_type: db.command.exists(false)
  })
  .update({
    script_type: 1 // 默认设为推理
  })

// 为所有缺少难度的剧本设置默认难度
db.collection('botc-scripts')
  .where({
    difficulty: db.command.exists(false)
  })
  .update({
    difficulty: 2 // 默认设为中等
  })

// 为所有缺少状态的剧本设置默认状态
db.collection('botc-scripts')
  .where({
    status: db.command.exists(false)
  })
  .update({
    status: 0 // 默认设为待审核
  })
```

## 临时解决方案

在显示逻辑中增加更强的容错性：

```javascript
getTypeText(type) {
  console.log('getTypeText 接收到的值：', type, typeof type)
  if (type === 1 || type === '1') return '推理'
  if (type === 2 || type === '2') return '娱乐'
  return '未设置' // 改为更明确的提示
}

getDifficultyText(difficulty) {
  const map = { 
    1: '简单', 2: '中等', 3: '困难', 4: '专家',
    '1': '简单', '2': '中等', '3': '困难', '4': '专家' // 兼容字符串类型
  }
  return map[difficulty] || '未设置'
}

getStatusText(status) {
  const map = { 
    0: '待审核', 1: '已发布', 2: '已下架',
    '0': '待审核', '1': '已发布', '2': '已下架' // 兼容字符串类型
  }
  return map[status] || '未设置'
}
```

## 推荐解决方案

### 方案A：立即添加调试日志（推荐）
快速定位问题根源，了解数据库中的实际数据情况。

### 方案B：增强字段查询
确保查询返回所有必需字段：

```javascript
const res = await db.collection('botc-scripts')
  .where(whereCondition)
  .field({
    _id: true,
    title: true,
    subtitle: true,
    author: true,
    script_type: true,
    difficulty: true,
    player_count: true,
    duration: true,
    status: true,
    rating: true,
    rating_count: true,
    view_count: true,
    download_count: true,
    published_at: true,
    created_at: true
  })
  .orderBy('created_at', 'desc')
  .skip((this.pagination.current - 1) * this.pagination.pageSize)
  .limit(this.pagination.pageSize)
  .get()
```

### 方案C：数据修复脚本
如果确认是数据问题，可以创建一个数据修复云函数。

## 下一步行动

1. ✅ 创建诊断文档
2. ⏳ 添加调试日志到 loadData 方法
3. ⏳ 在管理端刷新页面，查看控制台输出
4. ⏳ 根据日志结果确定具体原因
5. ⏳ 实施相应的修复方案

