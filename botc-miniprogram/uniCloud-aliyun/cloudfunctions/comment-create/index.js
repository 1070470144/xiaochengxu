'use strict';

/**
 * 发表评论云函数
 */
exports.main = async (event, context) => {
  console.log('发表评论，参数：', event)
  
  const {
    postId,
    content,
    replyToId,        // 回复的评论ID（二级评论）
    replyToUserId,    // 回复的用户ID
    token
  } = event
  
  if (!postId || !content) {
    return {
      code: 400,
      message: '帖子ID和评论内容不能为空'
    }
  }
  
  if (content.trim().length === 0) {
    return {
      code: 400,
      message: '评论内容不能为空'
    }
  }
  
  if (content.length > 500) {
    return {
      code: 400,
      message: '评论内容不能超过500字'
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
  const postsCollection = db.collection('botc-posts')
  const commentsCollection = db.collection('botc-post-comments')
  
  try {
    // 检查帖子是否存在
    const postResult = await postsCollection.doc(postId).get()
    
    if (postResult.data.length === 0) {
      return {
        code: 404,
        message: '帖子不存在'
      }
    }
    
    // 创建评论
    const commentData = {
      post_id: postId,
      user_id: userId,
      content: content.trim(),
      like_count: 0,
      status: 1,
      created_at: new Date()
    }
    
    // 如果是回复评论
    if (replyToId) {
      commentData.reply_to_id = replyToId
    }
    
    if (replyToUserId) {
      commentData.reply_to_user_id = replyToUserId
    }
    
    const commentResult = await commentsCollection.add(commentData)
    
    // 增加帖子的评论数
    await postsCollection.doc(postId).update({
      comment_count: db.command.inc(1)
    })
    
    // 获取用户信息
    const usersCollection = db.collection('uni-id-users')
    const userResult = await usersCollection.doc(userId).get()
    
    const userInfo = userResult.data.length > 0 ? {
      _id: userResult.data[0]._id,
      nickname: userResult.data[0].nickname,
      avatar: userResult.data[0].avatar,
      level: userResult.data[0].level
    } : null
    
    return {
      code: 0,
      message: '评论成功',
      data: {
        comment_id: commentResult.id,
        comment: {
          _id: commentResult.id,
          content: commentData.content,
          like_count: 0,
          created_at: commentData.created_at,
          user: userInfo
        }
      }
    }
    
  } catch (error) {
    console.error('发表评论失败：', error)
    return {
      code: 500,
      message: '评论失败，请重试'
    }
  }
}

