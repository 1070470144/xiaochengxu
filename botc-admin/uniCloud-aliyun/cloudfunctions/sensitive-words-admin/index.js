'use strict';

/**
 * 云函数：敏感词管理（管理端）
 * 功能：增删改查、批量导入、启用/禁用
 */

const db = uniCloud.database()
const dbCmd = db.command

exports.main = async (event, context) => {
  const { action, wordId, wordData, pageNo = 1, pageSize = 20, keyword, type, status } = event
  
  try {
    // 获取敏感词列表
    if (action === 'list') {
      const where = {}
      
      // 关键词搜索
      if (keyword) {
        where.word = new RegExp(keyword)
      }
      
      // 类型筛选
      if (type) {
        where.type = type
      }
      
      // 状态筛选
      if (status) {
        where.status = status
      }
      
      // 查询总数
      const countRes = await db.collection('botc-sensitive-words')
        .where(where)
        .count()
      
      // 查询列表
      const listRes = await db.collection('botc-sensitive-words')
        .where(where)
        .orderBy('created_at', 'desc')
        .skip((pageNo - 1) * pageSize)
        .limit(pageSize)
        .get()
      
      return {
        code: 0,
        message: '获取成功',
        data: {
          list: listRes.data,
          total: countRes.total,
          pageNo,
          pageSize
        }
      }
    }
    
    // 添加敏感词
    if (action === 'add') {
      if (!wordData || !wordData.word) {
        return { code: 400, message: '请输入敏感词' }
      }
      
      // 检查是否已存在
      const existRes = await db.collection('botc-sensitive-words')
        .where({ word: wordData.word })
        .get()
      
      if (existRes.data.length > 0) {
        return { code: 400, message: '该敏感词已存在' }
      }
      
      // 添加记录
      await db.collection('botc-sensitive-words').add({
        word: wordData.word,
        type: wordData.type || 'other',
        level: wordData.level || 2,
        status: wordData.status || 'enabled',
        replacement: wordData.replacement || '',
        remark: wordData.remark || '',
        created_at: Date.now(),
        updated_at: Date.now()
      })
      
      return {
        code: 0,
        message: '添加成功'
      }
    }
    
    // 编辑敏感词
    if (action === 'edit') {
      if (!wordId) {
        return { code: 400, message: '缺少敏感词ID' }
      }
      
      if (!wordData) {
        return { code: 400, message: '缺少更新数据' }
      }
      
      // 更新记录
      await db.collection('botc-sensitive-words')
        .doc(wordId)
        .update({
          ...wordData,
          updated_at: Date.now()
        })
      
      return {
        code: 0,
        message: '更新成功'
      }
    }
    
    // 删除敏感词
    if (action === 'delete') {
      if (!wordId) {
        return { code: 400, message: '缺少敏感词ID' }
      }
      
      await db.collection('botc-sensitive-words')
        .doc(wordId)
        .remove()
      
      return {
        code: 0,
        message: '删除成功'
      }
    }
    
    // 批量导入
    if (action === 'import') {
      const { words } = event
      
      if (!words || !Array.isArray(words) || words.length === 0) {
        return { code: 400, message: '请提供敏感词列表' }
      }
      
      let successCount = 0
      let failCount = 0
      
      for (const word of words) {
        try {
          // 检查是否已存在
          const existRes = await db.collection('botc-sensitive-words')
            .where({ word: word.word })
            .get()
          
          if (existRes.data.length === 0) {
            await db.collection('botc-sensitive-words').add({
              word: word.word,
              type: word.type || 'other',
              level: word.level || 2,
              status: 'enabled',
              replacement: word.replacement || '',
              remark: word.remark || '',
              created_at: Date.now(),
              updated_at: Date.now()
            })
            successCount++
          } else {
            failCount++
          }
        } catch (error) {
          failCount++
          console.error('导入失败：', word, error)
        }
      }
      
      return {
        code: 0,
        message: `导入完成：成功${successCount}个，失败${failCount}个`,
        data: { successCount, failCount }
      }
    }
    
    // 启用/禁用
    if (action === 'toggleStatus') {
      if (!wordId) {
        return { code: 400, message: '缺少敏感词ID' }
      }
      
      const { status } = event
      
      await db.collection('botc-sensitive-words')
        .doc(wordId)
        .update({
          status: status,
          updated_at: Date.now()
        })
      
      return {
        code: 0,
        message: status === 'enabled' ? '已启用' : '已禁用'
      }
    }
    
    return {
      code: 400,
      message: '未知操作'
    }
    
  } catch (error) {
    console.error('敏感词管理失败：', error)
    return {
      code: 500,
      message: '操作失败：' + error.message
    }
  }
}

