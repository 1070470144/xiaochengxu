'use strict';

// 上传剧本云函数
exports.main = async (event, context) => {
  console.log('上传剧本，参数：', event)
  
  const { 
    title, 
    subtitle = '',
    author = '',
    description = '',
    playerCount = '',
    difficulty = 2,
    duration = 0,
    tags = [],
    jsonData = null,
    jsonUrl = ''
  } = event
  
  if (!title) {
    return {
      code: 400,
      message: '剧本标题不能为空',
      data: null
    }
  }
  
  // 获取当前用户ID
  const uniIdCommon = require('uni-id-common')
  const { uid } = await uniIdCommon.checkToken(event.uniIdToken)
  
  if (!uid) {
    return {
      code: 401,
      message: '请先登录',
      data: null
    }
  }
  
  const db = uniCloud.database()
  const collection = db.collection('botc-scripts')
  
  try {
    // 检查标题是否重复
    const existingScript = await collection.where({
      title: title.trim(),
      status: db.command.neq(-1) // 排除已删除的
    }).get()
    
    if (existingScript.data.length > 0) {
      return {
        code: 400,
        message: '剧本标题已存在，请换一个标题',
        data: null
      }
    }
    
    // 创建剧本数据
    const scriptData = {
      title: title.trim(),
      subtitle: subtitle.trim(),
      author: author.trim(),
      description: description.trim(),
      player_count: playerCount.trim(),
      difficulty: parseInt(difficulty),
      duration: parseInt(duration) || null,
      tags: tags.filter(tag => tag.trim()),
      json_url: jsonUrl.trim(),
      json_data: jsonData,
      creator_id: uid,
      status: 0, // 待审核
      view_count: 0,
      download_count: 0,
      share_count: 0,
      favorite_count: 0,
      comment_count: 0,
      rating: 0,
      rating_count: 0,
      is_featured: false,
      created_at: new Date()
    }
    
    const result = await collection.add(scriptData)
    
    // 增加用户经验值（上传剧本）
    try {
      await uniCloud.callFunction({
        name: 'user-add-exp',
        data: {
          userId: uid,
          expType: 'UPLOAD_SCRIPT',
          amount: 20
        }
      })
    } catch (error) {
      console.error('增加经验值失败：', error)
      // 不影响主流程
    }
    
    return {
      code: 0,
      message: '剧本上传成功，等待审核',
      data: {
        script_id: result.id,
        status: 0
      }
    }
    
  } catch (error) {
    console.error('上传剧本失败：', error)
    return {
      code: 500,
      message: '上传失败，请重试',
      data: null
    }
  }
}
