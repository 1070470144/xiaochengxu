'use strict';

exports.main = async (event, context) => {
  const db = uniCloud.database()
  const { scripts } = event
  
  if (!scripts || !Array.isArray(scripts)) {
    return {
      code: 400,
      message: '参数错误：需要提供 scripts 数组'
    }
  }
  
  const results = {
    success: 0,
    failed: 0,
    details: []
  }
  
  for (const script of scripts) {
    try {
      // 直接插入数据库，绕过客户端Schema验证
      const res = await db.collection('botc-scripts').add(script)
      
      results.success++
      results.details.push({
        success: true,
        title: script.title,
        id: res.id
      })
      
      console.log(`✅ 导入成功：${script.title}`)
    } catch (error) {
      results.failed++
      results.details.push({
        success: false,
        title: script.title,
        error: error.message
      })
      
      console.error(`❌ 导入失败：${script.title}`, error)
    }
  }
  
  return {
    code: 0,
    message: '批量导入完成',
    data: results
  }
}

