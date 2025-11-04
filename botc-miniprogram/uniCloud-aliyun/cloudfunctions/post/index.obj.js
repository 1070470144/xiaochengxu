'use strict';

/**
 * Post 云对象 - 帖子管理
 * 包含：列表、发布、详情、点赞、举报、删除
 */

// ==================== 工具函数（外部） ====================

/**
 * 解析用户ID
 */
function parseUserId(token) {
  if (!token) return ''
  return token.split('_')[0] || ''
}

/**
 * 返回成功
 */
function returnSuccess(message = 'success', data = null) {
  return {
    code: 0,
    message,
    data
  }
}

/**
 * 返回错误
 */
function returnError(code, message) {
  return {
    code,
    message
  }
}

/**
 * 验证帖子内容
 */
function validatePostContent(content) {
  if (!content || typeof content !== 'string') {
    return '帖子内容不能为空'
  }
  
  const trimmedContent = content.trim()
  
  if (trimmedContent.length === 0) {
    return '帖子内容不能为空'
  }
  
  if (trimmedContent.length > 5000) {
    return '帖子内容不能超过5000字'
  }
  
  return null
}

/**
 * 验证图片数组
 */
function validateImages(images) {
  if (!images) return null
  
  if (!Array.isArray(images)) {
    return '图片格式错误'
  }
  
  if (images.length > 9) {
    return '最多上传9张图片'
  }
  
  return null
}

// ==================== Post 云对象 ====================

module.exports = {
  /**
   * 前置处理
   */
  async _before() {
    // 初始化数据库
    this.db = uniCloud.database()
    this.dbCmd = this.db.command
    
    // 获取客户端信息
    this.clientInfo = this.getClientInfo()
    
    // 获取token
    this.token = this.clientInfo.uniIdToken || ''
    this.currentUserId = ''
    
    // 解析用户ID
    if (this.token) {
      this.currentUserId = parseUserId(this.token)
    }
    
    // 需要登录的方法
    const requireAuthMethods = ['create', 'toggleLike', 'report', 'delete']
    const methodName = this.getMethodName()
    
    if (requireAuthMethods.includes(methodName) && !this.currentUserId) {
      throw new Error('请先登录')
    }
  },
  
  /**
   * 1. 获取帖子列表
   * @param {Object} options - 查询选项
   * @param {Number} options.page - 页码
   * @param {Number} options.pageSize - 每页数量
   * @param {Number} options.type - 帖子类型筛选
   * @param {String} options.userId - 用户ID筛选
   * @param {String} options.sortBy - 排序方式：time|hot|following
   */
  async getList(options = {}) {
    const {
      page = 1,
      pageSize = 10,
      type,
      userId,
      sortBy = 'time'
    } = options
    
    try {
      // 构建查询条件
      const whereCondition = {
        status: 1  // 只显示正常状态的帖子
      }
      
      if (type) {
        whereCondition.type = type
      }
      
      if (userId) {
        whereCondition.user_id = userId
      }
      
      // 如果是关注列表，需要获取当前用户关注的人
      if (sortBy === 'following') {
        if (!this.currentUserId) {
          return returnError(401, '请先登录查看关注动态')
        }
        
        // 获取关注列表
        const followsResult = await this.db.collection('botc-user-follows')
          .where({
            follower_id: this.currentUserId,
            status: 1
          })
          .field({ following_id: true })
          .get()
        
        const followingIds = followsResult.data.map(item => item.following_id)
        
        if (followingIds.length === 0) {
          // 没有关注任何人
          return returnSuccess('success', {
            list: [],
            total: 0,
            page: page,
            pageSize: pageSize,
            hasMore: false
          })
        }
        
        // 只查询关注的人发布的帖子
        whereCondition.user_id = this.dbCmd.in(followingIds)
      }
      
      // 排序规则
      let sortRule = {}
      if (sortBy === 'hot') {
        // 热度排序：置顶 > 热门 > 点赞数 > 评论数 > 时间
        sortRule = {
          is_top: -1,
          is_hot: -1,
          like_count: -1,
          comment_count: -1,
          created_at: -1
        }
      } else {
        // 时间排序：置顶 > 时间
        sortRule = {
          is_top: -1,
          created_at: -1
        }
      }
      
      // 分页查询
      const skip = (page - 1) * pageSize
      
      // 获取帖子列表（关联用户信息）
      const postsCollection = this.db.collection('botc-posts')
      const result = await postsCollection.aggregate()
        .match(whereCondition)
        .sort(sortRule)
        .skip(skip)
        .limit(pageSize)
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
      
      // 获取总数
      const countResult = await postsCollection.where(whereCondition).count()
      
      // 处理返回数据
      const processedPosts = result.data.map(post => ({
        _id: post._id,
        user_id: post.user_id,
        content: post.content,
        images: post.images || [],
        type: post.type,
        tags: post.tags || [],
        location: post.location || '',
        view_count: post.view_count || 0,
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
        } : null
      }))
      
      return returnSuccess('success', {
        list: processedPosts,
        total: countResult.total,
        page: page,
        pageSize: pageSize,
        hasMore: skip + processedPosts.length < countResult.total
      })
      
    } catch (error) {
      console.error('获取帖子列表失败：', error)
      return returnError(500, '获取帖子列表失败')
    }
  },
  
  /**
   * 2. 发布帖子
   * @param {Object} postData - 帖子数据
   * @param {String} postData.scriptId - 剧本ID（必填）
   * @param {String} postData.content - 内容（必填）
   * @param {Array} postData.images - 图片数组
   * @param {Number} postData.type - 类型
   * @param {Array} postData.tags - 标签
   * @param {String} postData.location - 位置
   * @param {String} postData.relatedId - 关联ID
   */
  async create(postData) {
    const {
      scriptId,
      content,
      images = [],
      type = 1,
      tags = [],
      location = '',
      relatedId
    } = postData
    
    try {
      // 验证剧本ID
      if (!scriptId) {
        return returnError(400, '必须选择一个剧本')
      }
      
      // 验证内容
      const contentError = validatePostContent(content)
      if (contentError) {
        return returnError(400, contentError)
      }
      
      // 验证图片
      const imagesError = validateImages(images)
      if (imagesError) {
        return returnError(400, imagesError)
      }
      
      // 🛡️ 内容过滤检查
      const systemObj = uniCloud.importObject('system')
      const filterResult = await systemObj.filterContent(content)
      
      if (filterResult.code !== 0) {
        // 内容包含敏感词或违规内容
        return {
          code: filterResult.code,
          message: filterResult.message,
          data: filterResult.data
        }
      }
      
      // 验证剧本是否存在
      const scriptsCollection = this.db.collection('botc-scripts')
      const scriptCheck = await scriptsCollection.doc(scriptId).get()
      
      if (!scriptCheck.data || scriptCheck.data.length === 0) {
        return returnError(400, '选择的剧本不存在')
      }
      
      // 创建帖子
      const newPostData = {
        user_id: this.currentUserId,
        script_id: scriptId,
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
      
      // 如果有关联ID
      if (relatedId) {
        newPostData.related_id = relatedId
      }
      
      const postsCollection = this.db.collection('botc-posts')
      const result = await postsCollection.add(newPostData)
      
      return returnSuccess('发布成功', {
        post_id: result.id,
        created_at: newPostData.created_at
      })
      
    } catch (error) {
      console.error('发布帖子失败：', error)
      return returnError(500, '发布失败，请重试')
    }
  },
  
  /**
   * 3. 获取帖子详情
   * @param {String} postId - 帖子ID
   */
  async getDetail(postId) {
    if (!postId) {
      return returnError(400, '帖子ID不能为空')
    }
    
    try {
      const postsCollection = this.db.collection('botc-posts')
      const commentsCollection = this.db.collection('botc-post-comments')
      const likesCollection = this.db.collection('botc-post-likes')
      
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
        return returnError(404, '帖子不存在')
      }
      
      const post = postResult.data[0]
      
      // 检查是否已删除
      if (post.status === 0 || post.status === -1) {
        return returnError(404, '帖子已删除')
      }
      
      // 增加浏览数
      await postsCollection.doc(postId).update({
        view_count: this.dbCmd.inc(1)
      })
      
      // 获取评论列表（关联用户信息）
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
        user_id: comment.user_id,
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
      if (this.currentUserId) {
        const likeResult = await likesCollection.where({
          post_id: postId,
          user_id: this.currentUserId,
          type: 1
        }).count()
        
        isLiked = likeResult.total > 0
      }
      
      // 处理帖子数据
      const processedPost = {
        _id: post._id,
        user_id: post.user_id,
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
      
      return returnSuccess('success', processedPost)
      
    } catch (error) {
      console.error('获取帖子详情失败：', error)
      return returnError(500, '获取帖子详情失败')
    }
  },
  
  /**
   * 4. 点赞/取消点赞
   * @param {String} postId - 帖子ID
   */
  async toggleLike(postId) {
    if (!postId) {
      return returnError(400, '帖子ID不能为空')
    }
    
    try {
      const postsCollection = this.db.collection('botc-posts')
      const likesCollection = this.db.collection('botc-post-likes')
      
      // 检查帖子是否存在
      const postResult = await postsCollection.doc(postId).get()
      
      if (postResult.data.length === 0) {
        return returnError(404, '帖子不存在')
      }
      
      // 检查是否已点赞
      const likeResult = await likesCollection.where({
        post_id: postId,
        user_id: this.currentUserId,
        type: 1
      }).get()
      
      let isLiked = false
      let likeCount = postResult.data[0].like_count || 0
      
      if (likeResult.data.length > 0) {
        // 已点赞，执行取消点赞
        await likesCollection.doc(likeResult.data[0]._id).remove()
        
        // 减少点赞数
        await postsCollection.doc(postId).update({
          like_count: this.dbCmd.inc(-1)
        })
        
        isLiked = false
        likeCount = Math.max(0, likeCount - 1)
        
        return returnSuccess('已取消点赞', {
          isLiked: isLiked,
          likeCount: likeCount
        })
        
      } else {
        // 未点赞，执行点赞
        await likesCollection.add({
          post_id: postId,
          user_id: this.currentUserId,
          type: 1,
          created_at: new Date()
        })
        
        // 增加点赞数
        await postsCollection.doc(postId).update({
          like_count: this.dbCmd.inc(1)
        })
        
        isLiked = true
        likeCount = likeCount + 1
        
        return returnSuccess('点赞成功', {
          isLiked: isLiked,
          likeCount: likeCount
        })
      }
      
    } catch (error) {
      console.error('点赞操作失败：', error)
      return returnError(500, '操作失败，请重试')
    }
  },
  
  /**
   * 5. 举报帖子
   * @param {Object} reportData - 举报数据
   * @param {String} reportData.contentId - 内容ID
   * @param {String} reportData.contentType - 内容类型
   * @param {String} reportData.reason - 举报原因
   * @param {String} reportData.description - 详细描述
   * @param {Array} reportData.images - 截图
   */
  async report(reportData) {
    const {
      contentId,
      contentType,
      reason,
      description = '',
      images = []
    } = reportData
    
    // 验证参数
    if (!contentId || !contentType || !reason) {
      return returnError(400, '参数不完整')
    }
    
    try {
      // 获取举报人信息
      const userRes = await this.db.collection('uni-id-users')
        .doc(this.currentUserId)
        .field({ nickname: true })
        .get()
      
      const reporterNickname = userRes.data && userRes.data.length > 0 
        ? userRes.data[0].nickname 
        : '匿名用户'
      
      // 检查是否已经举报过
      const reportsCollection = this.db.collection('botc-reports')
      const existCheck = await reportsCollection.where({
        content_id: contentId,
        reporter_id: this.currentUserId
      }).get()
      
      if (existCheck.data.length > 0) {
        return returnError(400, '您已经举报过该内容')
      }
      
      // 创建举报记录
      await reportsCollection.add({
        reporter_id: this.currentUserId,
        reporter_nickname: reporterNickname,
        content_type: contentType,
        content_id: contentId,
        content_title: '',
        reported_user_id: '',
        reported_user_nickname: '',
        reason: reason,
        description: description,
        images: images,
        status: 'pending',
        created_at: Date.now()
      })
      
      // 统计该内容的举报次数
      const reportCount = await reportsCollection.where({
        content_id: contentId,
        status: 'pending'
      }).count()
      
      // 自动处理规则
      if (reportCount.total >= 3 && contentType === 'post') {
        // 3次举报自动隐藏帖子
        await this.db.collection('botc-posts').doc(contentId).update({
          status: 0,
          updated_at: Date.now()
        })
        
        console.log(`帖子 ${contentId} 因被举报${reportCount.total}次自动隐藏`)
      }
      
      if (reportCount.total >= 5 && contentType === 'post') {
        // 5次举报永久封禁
        await this.db.collection('botc-posts').doc(contentId).update({
          status: -1,
          updated_at: Date.now()
        })
        
        console.log(`帖子 ${contentId} 因被举报${reportCount.total}次永久封禁`)
      }
      
      return returnSuccess('举报成功，我们会尽快处理', {
        report_count: reportCount.total
      })
      
    } catch (error) {
      console.error('举报失败：', error)
      return returnError(500, '举报失败，请重试')
    }
  },
  
  /**
   * 6. 删除帖子
   * @param {String} postId - 帖子ID
   */
  async delete(postId) {
    if (!postId) {
      return returnError(400, '帖子ID不能为空')
    }
    
    try {
      const postsCollection = this.db.collection('botc-posts')
      
      // 查询帖子信息
      const postResult = await postsCollection.doc(postId).get()
      
      if (postResult.data.length === 0) {
        return returnError(404, '帖子不存在')
      }
      
      const post = postResult.data[0]
      
      // 检查权限（只能删除自己的帖子）
      if (post.user_id !== this.currentUserId) {
        return returnError(403, '您没有权限删除该帖子')
      }
      
      // 软删除
      await postsCollection.doc(postId).update({
        status: 0,
        updated_at: new Date()
      })
      
      return returnSuccess('删除成功', {
        success: true
      })
      
    } catch (error) {
      console.error('删除帖子失败：', error)
      return returnError(500, '删除失败，请重试')
    }
  }
}

