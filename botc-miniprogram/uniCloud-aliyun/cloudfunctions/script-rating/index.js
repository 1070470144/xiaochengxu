'use strict';

const db = uniCloud.database()
const dbCmd = db.command

exports.main = async (event, context) => {
  const { action, user_id, script_id, rating, comment } = event
  
  console.log('script-rating 云函数调用', { action, user_id, script_id, rating })
  
  try {
    switch (action) {
      // 提交或更新评分
      case 'submit':
        return await submitRating(user_id, script_id, rating, comment)
      
      // 获取用户对某个剧本的评分
      case 'getUserRating':
        return await getUserRating(user_id, script_id)
      
      // 获取剧本的平均分和评分数量
      case 'getScriptStats':
        return await getScriptStats(script_id)
      
      // 获取用户的所有评分
      case 'getUserRatings':
        return await getUserRatings(user_id, event.page, event.limit)
      
      default:
        return {
          code: 400,
          message: '无效的操作类型'
        }
    }
  } catch (error) {
    console.error('script-rating 错误:', error)
    return {
      code: 500,
      message: error.message
    }
  }
}

// 提交或更新评分
async function submitRating(user_id, script_id, rating, comment) {
  if (!user_id || !script_id || !rating) {
    return {
      code: 400,
      message: '缺少必要参数'
    }
  }
  
  if (rating < 1 || rating > 5) {
    return {
      code: 400,
      message: '评分必须在1-5之间'
    }
  }
  
  // 检查是否已经评分过
  const existingRating = await db.collection('botc-script-ratings')
    .where({
      user_id,
      script_id
    })
    .get()
  
  const now = Date.now()
  
  if (existingRating.data.length > 0) {
    // 更新评分
    const ratingId = existingRating.data[0]._id
    await db.collection('botc-script-ratings')
      .doc(ratingId)
      .update({
        rating,
        comment: comment || '',
        updated_at: now
      })
    
    // 重新计算剧本平均分
    await updateScriptAverageRating(script_id)
    
    return {
      code: 0,
      message: '评分已更新',
      data: {
        rating_id: ratingId,
        is_new: false
      }
    }
  } else {
    // 新增评分
    const result = await db.collection('botc-script-ratings')
      .add({
        user_id,
        script_id,
        rating,
        comment: comment || '',
        created_at: now,
        updated_at: now
      })
    
    // 重新计算剧本平均分
    await updateScriptAverageRating(script_id)
    
    return {
      code: 0,
      message: '评分成功',
      data: {
        rating_id: result.id,
        is_new: true
      }
    }
  }
}

// 获取用户对某个剧本的评分
async function getUserRating(user_id, script_id) {
  if (!user_id || !script_id) {
    return {
      code: 400,
      message: '缺少必要参数'
    }
  }
  
  const result = await db.collection('botc-script-ratings')
    .where({
      user_id,
      script_id
    })
    .get()
  
  return {
    code: 0,
    message: 'success',
    data: result.data.length > 0 ? result.data[0] : null
  }
}

// 获取剧本的平均分和评分数量
async function getScriptStats(script_id) {
  if (!script_id) {
    return {
      code: 400,
      message: '缺少剧本ID'
    }
  }
  
  const result = await db.collection('botc-script-ratings')
    .where({
      script_id
    })
    .get()
  
  if (result.data.length === 0) {
    return {
      code: 0,
      message: 'success',
      data: {
        average_rating: 0,
        rating_count: 0
      }
    }
  }
  
  // 计算平均分
  const totalRating = result.data.reduce((sum, item) => sum + item.rating, 0)
  const averageRating = (totalRating / result.data.length).toFixed(1)
  
  return {
    code: 0,
    message: 'success',
    data: {
      average_rating: parseFloat(averageRating),
      rating_count: result.data.length
    }
  }
}

// 获取用户的所有评分（分页）
async function getUserRatings(user_id, page = 1, limit = 20) {
  if (!user_id) {
    return {
      code: 400,
      message: '缺少用户ID'
    }
  }
  
  const skip = (page - 1) * limit
  
  // 使用聚合查询，关联剧本信息
  const result = await db.collection('botc-script-ratings')
    .aggregate()
    .match({
      user_id
    })
    .sort({
      updated_at: -1
    })
    .skip(skip)
    .limit(limit)
    .lookup({
      from: 'botc-scripts',
      localField: 'script_id',
      foreignField: '_id',
      as: 'script_info'
    })
    .unwind('$script_info')
    .project({
      _id: 1,
      script_id: 1,
      rating: 1,
      comment: 1,
      created_at: 1,
      updated_at: 1,
      'script_info._id': 1,
      'script_info.title': 1,
      'script_info.author': 1,
      'script_info.player_count': 1,
      'script_info.user_images': 1,
      'script_info.average_rating': 1
    })
    .end()
  
  // 获取总数
  const countResult = await db.collection('botc-script-ratings')
    .where({
      user_id
    })
    .count()
  
  return {
    code: 0,
    message: 'success',
    data: {
      list: result.data,
      total: countResult.total,
      page,
      limit
    }
  }
}

// 更新剧本的平均分
async function updateScriptAverageRating(script_id) {
  const stats = await getScriptStats(script_id)
  
  if (stats.code === 0) {
    await db.collection('botc-scripts')
      .doc(script_id)
      .update({
        average_rating: stats.data.average_rating,
        rating_count: stats.data.rating_count
      })
  }
}

