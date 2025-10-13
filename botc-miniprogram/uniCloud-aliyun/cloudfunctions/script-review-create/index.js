'use strict';

/**
 * 提交剧本评价云函数
 */
exports.main = async (event, context) => {
  console.log('提交剧本评价，参数：', event)
  
  const {
    scriptId,
    content,
    rating,
    token
  } = event
  
  // 参数验证
  if (!scriptId) {
    return {
      code: 400,
      message: '剧本ID不能为空'
    }
  }
  
  if (!rating || rating < 1 || rating > 5) {
    return {
      code: 400,
      message: '请选择1-5星评分'
    }
  }
  
  if (!content || content.trim().length === 0) {
    return {
      code: 400,
      message: '评价内容不能为空'
    }
  }
  
  if (content.length > 500) {
    return {
      code: 400,
      message: '评价内容不能超过500字'
    }
  }
  
  // 验证token并获取用户ID
  if (!token) {
    return {
      code: 401,
      message: '请先登录'
    }
  }
  
  const userId = token.split('_')[0]
  
  if (!userId) {
    return {
      code: 401,
      message: 'Token无效'
    }
  }
  
  const db = uniCloud.database()
  const dbCmd = db.command
  
  try {
    // 检查剧本是否存在
    const scriptResult = await db.collection('botc-scripts').doc(scriptId).get()
    
    if (scriptResult.data.length === 0) {
      return {
        code: 404,
        message: '剧本不存在'
      }
    }
    
    // 检查用户是否已经评价过
    const existingReview = await db.collection('botc-script-reviews')
      .where({
        script_id: scriptId,
        user_id: userId
      })
      .get()
    
    if (existingReview.data.length > 0) {
      return {
        code: 400,
        message: '您已经评价过这个剧本了'
      }
    }
    
    // 创建评价记录
    const reviewData = {
      script_id: scriptId,
      user_id: userId,
      content: content.trim(),
      rating: rating,
      like_count: 0,
      status: 1,
      created_at: Date.now(),
      updated_at: Date.now()
    }
    
    const reviewResult = await db.collection('botc-script-reviews').add(reviewData)
    
    // 更新剧本的评分统计
    const allReviews = await db.collection('botc-script-reviews')
      .where({
        script_id: scriptId,
        status: 1
      })
      .get()
    
    const reviews = allReviews.data
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
    const avgRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0
    
    await db.collection('botc-scripts').doc(scriptId).update({
      rating: parseFloat(avgRating),
      rating_count: reviews.length
    })
    
    // 获取用户信息
    const userResult = await db.collection('uni-id-users').doc(userId).get()
    
    const userInfo = userResult.data.length > 0 ? {
      _id: userResult.data[0]._id,
      nickname: userResult.data[0].nickname || '匿名用户',
      avatar: userResult.data[0].avatar || ''
    } : {
      _id: userId,
      nickname: '匿名用户',
      avatar: ''
    }
    
    return {
      code: 0,
      message: '评价成功',
      data: {
        review_id: reviewResult.id,
        review: {
          _id: reviewResult.id,
          content: reviewData.content,
          rating: reviewData.rating,
          like_count: 0,
          created_at: reviewData.created_at,
          user: userInfo
        },
        script_rating: {
          rating: parseFloat(avgRating),
          rating_count: reviews.length
        }
      }
    }
    
  } catch (error) {
    console.error('提交评价失败：', error)
    return {
      code: 500,
      message: '评价失败：' + error.message
    }
  }
}

