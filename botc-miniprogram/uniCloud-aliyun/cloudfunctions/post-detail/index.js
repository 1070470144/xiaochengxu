'use strict';

/**
 * 获取帖子详情云函数
 */
exports.main = async (event, context) => {
  console.log('获取帖子详情，参数：', event)
  
  const { postId, token } = event
  
  if (!postId) {
    return {
      code: 400,
      message: '帖子ID不能为空'
    }
  }
  
  const db = uniCloud.database()
  const postsCollection = db.collection('botc-posts')
  const commentsCollection = db.collection('botc-post-comments')
  const likesCollection = db.collection('botc-post-likes')
  
  try {
    // 获取帖子详情（关联用户信息）
    const postResult = await postsCollection.aggregate()
      .match({ _id: postId })
      .lookup({
        from: 'uni-id-users',
        localField: 'user_id',
        foreignField: '_id',
        as: 'user'
      })
      .addFields({
        user: { $arrayElemAt: ['$user', 0] }
      })
      .end()
    
    if (postResult.data.length === 0) {
      return {
        code: 404,
        message: '帖子不存在'
      }
    }
    
    const post = postResult.data[0]
    
    // 检查是否已删除
    if (post.status === 0) {
      return {
        code: 404,
        message: '帖子已删除'
      }
    }
    
    // 增加浏览数
    await postsCollection.doc(postId).update({
      view_count: db.command.inc(1)
    })
    
    // 获取评论列表（关联用户信息，按时间排序）
    const commentsResult = await commentsCollection.aggregate()
      .match({
        post_id: postId,
        status: 1
      })
      .lookup({
        from: 'uni-id-users',
        localField: 'user_id',
        foreignField: '_id',
        as: 'user'
      })
      .lookup({
        from: 'uni-id-users',
        localField: 'reply_to_user_id',
        foreignField: '_id',
        as: 'reply_to_user'
      })
      .addFields({
        user: { $arrayElemAt: ['$user', 0] },
        reply_to_user: { $arrayElemAt: ['$reply_to_user', 0] }
      })
      .sort({ created_at: 1 })
      .end()
    
    // 处理评论数据
    const processedComments = commentsResult.data.map(comment => ({
      _id: comment._id,
      user_id: comment.user_id, // 添加 user_id 字段
      content: comment.content,
      like_count: comment.like_count || 0,
      created_at: comment.created_at,
      user: comment.user ? {
        _id: comment.user._id,
        nickname: comment.user.nickname,
        avatar: comment.user.avatar,
        level: comment.user.level
      } : null,
      reply_to_user: comment.reply_to_user ? {
        _id: comment.reply_to_user._id,
        nickname: comment.reply_to_user.nickname
      } : null
    }))
    
    // 如果用户已登录，检查是否已点赞
    let isLiked = false
    if (token) {
      const userId = token.split('_')[0]
      if (userId) {
        const likeResult = await likesCollection.where({
          post_id: postId,
          user_id: userId,
          type: 1
        }).count()
        
        isLiked = likeResult.total > 0
      }
    }
    
    // 处理帖子数据
    const processedPost = {
      _id: post._id,
      user_id: post.user_id, // 添加 user_id 字段
      content: post.content,
      images: post.images || [],
      type: post.type,
      tags: post.tags || [],
      location: post.location || '',
      view_count: post.view_count + 1, // 已增加过1
      like_count: post.like_count || 0,
      comment_count: post.comment_count || 0,
      share_count: post.share_count || 0,
      is_top: post.is_top || false,
      is_hot: post.is_hot || false,
      created_at: post.created_at,
      user: post.user ? {
        _id: post.user._id,
        nickname: post.user.nickname,
        avatar: post.user.avatar,
        level: post.user.level
      } : null,
      comments: processedComments,
      isLiked: isLiked
    }
    
    return {
      code: 0,
      message: 'success',
      data: processedPost
    }
    
  } catch (error) {
    console.error('获取帖子详情失败：', error)
    return {
      code: 500,
      message: '获取帖子详情失败'
    }
  }
}

