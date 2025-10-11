'use strict';

/**
 * 帖子点赞/取消点赞云函数
 */
exports.main = async (event, context) => {
  console.log('帖子点赞，参数：', event)
  
  const { postId, token } = event
  
  if (!postId) {
    return {
      code: 400,
      message: '帖子ID不能为空'
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
  const likesCollection = db.collection('botc-post-likes')
  
  try {
    // 检查帖子是否存在
    const postResult = await postsCollection.doc(postId).get()
    
    if (postResult.data.length === 0) {
      return {
        code: 404,
        message: '帖子不存在'
      }
    }
    
    // 检查是否已点赞
    const likeResult = await likesCollection.where({
      post_id: postId,
      user_id: userId,
      type: 1
    }).get()
    
    let isLiked = false
    let likeCount = postResult.data[0].like_count || 0
    
    if (likeResult.data.length > 0) {
      // 已点赞，执行取消点赞
      await likesCollection.doc(likeResult.data[0]._id).remove()
      
      // 减少点赞数
      await postsCollection.doc(postId).update({
        like_count: db.command.inc(-1)
      })
      
      isLiked = false
      likeCount = Math.max(0, likeCount - 1)
      
      return {
        code: 0,
        message: '已取消点赞',
        data: {
          isLiked: isLiked,
          likeCount: likeCount
        }
      }
      
    } else {
      // 未点赞，执行点赞
      await likesCollection.add({
        post_id: postId,
        user_id: userId,
        type: 1,
        created_at: new Date()
      })
      
      // 增加点赞数
      await postsCollection.doc(postId).update({
        like_count: db.command.inc(1)
      })
      
      isLiked = true
      likeCount = likeCount + 1
      
      return {
        code: 0,
        message: '点赞成功',
        data: {
          isLiked: isLiked,
          likeCount: likeCount
        }
      }
    }
    
  } catch (error) {
    console.error('点赞操作失败：', error)
    return {
      code: 500,
      message: '操作失败，请重试'
    }
  }
}

