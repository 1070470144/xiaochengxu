'use strict';

/**
 * 发布帖子云函数
 */
exports.main = async (event, context) => {
  console.log('发布帖子，参数：', event)
  
  const {
    script_id,
    content,
    images = [],
    type = 1,
    related_id,
    tags = [],
    location = '',
    token
  } = event
  
  // 验证参数
  if (!script_id) {
    return {
      code: 400,
      message: '必须选择一个剧本'
    }
  }
  
  if (!content || content.trim().length === 0) {
    return {
      code: 400,
      message: '帖子内容不能为空'
    }
  }
  
  if (content.length > 5000) {
    return {
      code: 400,
      message: '帖子内容不能超过5000字'
    }
  }
  
  if (images.length > 9) {
    return {
      code: 400,
      message: '最多上传9张图片'
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
  
  try {
    // 验证剧本是否存在
    const scriptsCollection = db.collection('botc-scripts')
    const scriptCheck = await scriptsCollection.doc(script_id).get()
    
    if (!scriptCheck.data || scriptCheck.data.length === 0) {
      return {
        code: 400,
        message: '选择的剧本不存在'
      }
    }
    
    // 创建帖子
    const postData = {
      user_id: userId,
      script_id: script_id,
      content: content.trim(),
      images: images,
      type: type,
      tags: tags.slice(0, 5), // 最多5个标签
      location: location,
      view_count: 0,
      like_count: 0,
      comment_count: 0,
      share_count: 0,
      is_top: false,
      is_hot: false,
      status: 1,
      created_at: new Date()
    }
    
    // 如果有关联ID（比如关联拼车房间等）
    if (related_id) {
      postData.related_id = related_id
    }
    
    const result = await postsCollection.add(postData)
    
    return {
      code: 0,
      message: '发布成功',
      data: {
        post_id: result.id,
        created_at: postData.created_at
      }
    }
    
  } catch (error) {
    console.error('发布帖子失败：', error)
    return {
      code: 500,
      message: '发布失败，请重试'
    }
  }
}

