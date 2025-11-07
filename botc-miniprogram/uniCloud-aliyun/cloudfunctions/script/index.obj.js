'use strict';

/**
 * Script 云对象
 * 剧本相关功能的统一云对象
 * 阶段1：核心功能（5个方法）
 */

const db = uniCloud.database()
const dbCmd = db.command

// 导入预览图生成器
const { generateScriptPreviewSVG, extractScriptInfo } = require('./preview-generator')

// ==================== 工具函数 ====================

/**
 * 统一成功返回
 */
function returnSuccess(data = null, message = 'success') {
  return {
    code: 0,
    message,
    data
  }
}

/**
 * 从token解析用户ID
 */
function parseUserId(token) {
  if (!token) {
    return null
  }
  const userId = token.split('_')[0]
  return userId || null
}

/**
 * 检查是否登录
 */
function checkAuth(userId) {
  if (!userId) {
    throw new Error('请先登录')
  }
}

/**
 * 验证剧本数据
 */
function validateScriptData(data) {
  const { title, author, json } = data
  
  if (!title || !title.trim()) {
    throw new Error('剧本标题不能为空')
  }
  
  if (!author || !author.trim()) {
    throw new Error('剧本作者不能为空')
  }
  
  if (!json) {
    throw new Error('剧本JSON数据不能为空')
  }
  
  // 验证user_images（如果有）
  if (data.user_images !== undefined && data.user_images !== null) {
    if (!Array.isArray(data.user_images)) {
      throw new Error('user_images必须是数组格式')
    }
    
    if (data.user_images.length > 3) {
      throw new Error('最多上传3张图片')
    }
    
    // 验证每个URL
    for (let i = 0; i < data.user_images.length; i++) {
      const url = data.user_images[i]
      if (typeof url !== 'string') {
        throw new Error(`图片${i + 1}的URL格式错误`)
      }
      if (!url.startsWith('https://') && !url.startsWith('http://') && !url.startsWith('data:image/')) {
        throw new Error(`图片${i + 1}的URL无效，必须是HTTPS地址`)
      }
      if (url.startsWith('blob:')) {
        throw new Error(`图片${i + 1}不能使用临时Blob地址，请上传到云存储`)
      }
    }
  }
}

/**
 * 生成唯一的剧本ID
 */
function generateScriptId() {
  return 'script_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9)
}

/**
 * 检查是否为剧本创建者
 */
async function checkScriptOwner(scriptId, userId) {
  const script = await db.collection('botc-scripts').doc(scriptId).get()
  
  if (!script.data || script.data.length === 0) {
    throw new Error('剧本不存在')
  }
  
  if (script.data[0].creator_id !== userId) {
    throw new Error('无权操作他人的剧本')
  }
  
  return script.data[0]
}

/**
 * 获取剧本热度分数
 * 热度计算规则：
 * - 帖子数 × 10
 * - 评价数 × 5
 * - 帖子点赞数 × 2
 * - 帖子评论数 × 3
 * - 浏览数 × 0.1
 * - 下载数 × 1
 * - 新剧本加成（30天内）
 */
async function getScriptHeat(scriptId) {
  try {
    // 1. 获取帖子统计
    const postsResult = await db.collection('botc-posts')
      .where({
        script_id: scriptId,
        status: 1
      })
      .get()
    
    const posts = postsResult.data || []
    const postCount = posts.length
    const postLikeCount = posts.reduce((sum, post) => sum + (post.like_count || 0), 0)
    const postCommentCount = posts.reduce((sum, post) => sum + (post.comment_count || 0), 0)
    
    // 2. 获取评价数
    const reviewsResult = await db.collection('botc-script-reviews')
      .where({
        script_id: scriptId,
        status: 1
      })
      .count()
    
    const reviewCount = reviewsResult.total || 0
    
    // 3. 获取剧本自身数据
    const scriptResult = await db.collection('botc-scripts')
      .doc(scriptId)
      .field({
        view_count: true,
        download_count: true,
        created_at: true
      })
      .get()
    
    const script = scriptResult.data && scriptResult.data.length > 0 ? scriptResult.data[0] : {}
    const viewCount = script.view_count || 0
    const downloadCount = script.download_count || 0
    
    // 4. 计算热度分数
    let heatScore = 
      (postCount * 10) +
      (reviewCount * 5) +
      (postLikeCount * 2) +
      (postCommentCount * 3) +
      (viewCount * 0.1) +
      (downloadCount * 1)
    
    // 5. 添加时间衰减（新剧本加成）
    if (script.created_at) {
      const daysSinceCreated = (Date.now() - script.created_at) / (1000 * 60 * 60 * 24)
      if (daysSinceCreated < 30) {
        const newBonus = Math.max(0, 100 * (1 - daysSinceCreated / 30))
        heatScore += newBonus
      }
    }
    
    return Math.round(heatScore)
  } catch (error) {
    console.error('获取剧本热度失败:', error)
    return 0
  }
}

// ==================== 云对象定义 ====================

module.exports = {
  /**
   * 前置处理 - 统一初始化
   */
  _before: function() {
    this.db = db
    this.dbCmd = dbCmd
    
    // 获取客户端信息
    this.clientInfo = this.getClientInfo()
    
    // 尝试获取 token
    this.token = this.clientInfo.uniIdToken || this.getUniIdToken()
    
    // 解析用户ID
    if (this.token) {
      this.currentUserId = parseUserId(this.token)
    }
    
    console.log('🎬 script 云对象调用:', {
      method: this.getMethodName(),
      userId: this.currentUserId || '未登录',
      clientIP: this.clientInfo.clientIP
    })
  },
  
  /**
   * 后置处理 - 统一错误处理
   */
  _after: function(error, result) {
    if (error) {
      console.error('❌ script 云对象错误:', {
        method: this.getMethodName(),
        error: error.message,
        stack: error.stack
      })
      
      return {
        code: 500,
        message: error.message || '操作失败',
        data: null
      }
    }
    return result
  },
  
  // ==================== 核心方法（阶段1） ====================
  
  /**
   * 1. 获取剧本列表
   * @param {Object} options - 查询选项
   * @returns {Object} 剧本列表
   */
  async getList(options = {}) {
    const {
      page = 1,
      pageSize = 20,
      keyword = '',
      type = 'all',
      difficulty = 0,
      playerCount = '',
      tags = []
    } = options
    
    try {
      const collection = this.db.collection('botc-scripts')
      
      // 构建查询条件
      let whereCondition = {
        status: 1 // 只查询已发布的剧本
      }
      
      // 关键词搜索
      if (keyword) {
        const keywordRegex = new RegExp(keyword, 'i')
        whereCondition.$or = [
          { title: keywordRegex },
          { author: keywordRegex },
          { description: keywordRegex }
        ]
      }
      
      // 难度筛选
      if (difficulty > 0) {
        whereCondition.difficulty = difficulty
      }
      
      // 人数筛选
      if (playerCount) {
        whereCondition.player_count = new RegExp(playerCount, 'i')
      }
      
      // 标签筛选
      if (tags.length > 0) {
        whereCondition.tags = this.dbCmd.in(tags)
      }
      
      // 构建聚合查询（关联创建者信息）
      let query = collection.aggregate()
        .match(whereCondition)
        .lookup({
          from: 'uni-id-users',
          localField: 'creator_id',
          foreignField: '_id',
          as: 'creator'
        })
        .addFields({
          creator: {
            $arrayElemAt: ['$creator', 0]
          }
        })
      
      // 排序规则
      let sortCondition = { created_at: -1 } // 默认按创建时间倒序
      switch (type) {
        case 'hot':
          sortCondition = { view_count: -1, rating: -1 }
          break
        case 'rating':
          sortCondition = { rating: -1, rating_count: -1 }
          break
        case 'download':
          sortCondition = { download_count: -1 }
          break
        case 'new':
          sortCondition = { published_at: -1 }
          break
      }
      
      query = query.sort(sortCondition)
      
      // 分页
      const skip = (page - 1) * pageSize
      query = query.skip(skip).limit(pageSize)
      
      // 执行查询
      const listResult = await query.end()
      
      // 获取总数
      const countResult = await collection.where(whereCondition).count()
      
      // 处理返回数据，隐藏敏感信息
      const processedList = listResult.data.map(script => ({
        ...script,
        creator: script.creator ? {
          _id: script.creator._id,
          nickname: script.creator.nickname,
          avatar: script.creator.avatar
        } : null,
        // 不返回完整的json_data，节省带宽
        json_data: undefined
      }))
      
      return returnSuccess({
        list: processedList,
        total: countResult.total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        hasNext: page * pageSize < countResult.total
      })
      
    } catch (error) {
      console.error('❌ 获取剧本列表失败:', error)
      throw new Error('获取剧本列表失败')
    }
  },
  
  /**
   * 2. 获取剧本详情
   * @param {String} scriptId - 剧本ID
   * @returns {Object} 剧本详情
   */
  async getDetail(scriptId) {
    if (!scriptId) {
      throw new Error('剧本ID不能为空')
    }
    
    try {
      const collection = this.db.collection('botc-scripts')
      
      // 查询剧本基本信息
      const scriptRes = await collection.doc(scriptId).get()
      
      if (!scriptRes.data || scriptRes.data.length === 0) {
        throw new Error('剧本不存在')
      }
      
      const script = scriptRes.data[0]
      
      // 权限判断
      const isPublished = script.status === 1
      const isOwner = this.currentUserId && script.creator_id === this.currentUserId
      
      if (!isPublished && !isOwner) {
        throw new Error('该剧本暂未发布')
      }
      
      // 关联创建者信息
      let creator = null
      if (script.creator_id) {
        const userRes = await this.db.collection('uni-id-users').doc(script.creator_id).get()
        if (userRes.data && userRes.data.length > 0) {
          const user = userRes.data[0]
          creator = {
            _id: user._id,
            nickname: user.nickname,
            avatar: user.avatar
          }
        }
      }
      
      // 增加浏览量（仅对已发布的剧本，异步执行）
      if (isPublished) {
        collection.doc(scriptId).update({
          view_count: this.dbCmd.inc(1)
        }).catch(err => {
          console.error('更新浏览量失败：', err)
        })
      }
      
      // 处理返回数据
      const processedScript = {
        ...script,
        creator: creator
      }
      
      return returnSuccess(processedScript, '获取成功')
      
    } catch (error) {
      console.error('❌ 获取剧本详情失败:', error)
      throw error
    }
  },
  
  /**
   * 3. 上传剧本
   * @param {Object} data - 剧本数据
   * @returns {Object} 上传结果
   */
  async upload(data) {
    // 检查登录
    checkAuth(this.currentUserId)
    
    // 验证数据
    validateScriptData(data)
    
    try {
      const { title, author, description, json, user_images } = data
      
      // 解析JSON
      let parsedJson
      try {
        parsedJson = typeof json === 'string' ? JSON.parse(json) : json
      } catch (error) {
        throw new Error('JSON格式错误')
      }
      
      // 生成剧本预览图SVG
      const scriptData = {
        id: generateScriptId(),
        title,
        author,
        json: parsedJson
      }
      
      console.log('📝 生成预览图:', title)
      const svgContent = generateScriptPreviewSVG(scriptData)
      
      // 将SVG转为base64
      const svgBase64 = Buffer.from(svgContent, 'utf-8').toString('base64')
      const previewDataUrl = `data:image/svg+xml;base64,${svgBase64}`
      
      // 提取剧本信息
      const scriptInfo = extractScriptInfo(scriptData)
      
      // 构建剧本文档
      const scriptDoc = {
        title,
        author,
        description: description || scriptInfo.description || '',
        json_data: parsedJson,
        preview_image: previewDataUrl,
        user_images: user_images || [],
        player_count: scriptInfo.playerCount,
        total_characters: scriptInfo.totalCharacters,
        difficulty: scriptInfo.difficulty,
        script_type: scriptInfo.scriptType,
        tags: scriptInfo.tags || [],
        creator_id: this.currentUserId,
        status: 0, // 0-待审核
        view_count: 0,
        download_count: 0,
        favorite_count: 0,
        comment_count: 0,
        rating: 0,
        rating_count: 0,
        created_at: Date.now(),
        updated_at: Date.now()
      }
      
      console.log('💾 保存剧本:', {
        title: scriptDoc.title,
        author: scriptDoc.author,
        user_images_count: scriptDoc.user_images.length
      })
      
      const insertRes = await this.db.collection('botc-scripts').add(scriptDoc)
      
      // 更新说书人统计
      const usersCollection = this.db.collection('uni-id-users')
      const userDoc = await usersCollection.doc(this.currentUserId).get()
      const user = userDoc.data && userDoc.data.length > 0 ? userDoc.data[0] : {}
      
      if (user.storyteller_certified && user.storyteller_stats) {
        const currentScriptCount = user.storyteller_stats.script_count || 0
        await usersCollection.doc(this.currentUserId).update({
          'storyteller_stats.script_count': currentScriptCount + 1
        })
        console.log('✅ 更新说书人剧本数:', currentScriptCount + 1)
      }
      
      return returnSuccess({
        scriptId: insertRes.id,
        previewGenerated: true,
        previewImage: previewDataUrl
      }, '上传成功')
      
    } catch (error) {
      console.error('❌ 上传剧本失败:', error)
      throw error
    }
  },
  
  /**
   * 4. 获取我上传的剧本
   * @param {Number} page - 页码
   * @param {Number} pageSize - 每页数量
   * @returns {Object} 我的剧本列表
   */
  async getMyUploads(page = 1, pageSize = 10) {
    // 检查登录
    checkAuth(this.currentUserId)
    
    try {
      const scriptsCollection = this.db.collection('botc-scripts')
      
      // 构建查询条件：只查询未删除的记录
      const whereCondition = {
        creator_id: this.currentUserId,
        deleted_at: this.dbCmd.or(
          this.dbCmd.eq(null),
          this.dbCmd.not(this.dbCmd.exists(true))
        )
      }
      
      // 获取总数
      const countRes = await scriptsCollection
        .where(whereCondition)
        .count()
      
      const total = countRes.total
      
      // 分页查询
      const listRes = await scriptsCollection
        .where(whereCondition)
        .orderBy('created_at', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get()
      
      const hasMore = page * pageSize < total
      
      return returnSuccess({
        list: listRes.data,
        total,
        page,
        pageSize,
        hasMore
      })
      
    } catch (error) {
      console.error('❌ 查询我的剧本失败:', error)
      throw new Error('查询失败')
    }
  },
  
  /**
   * 5. 删除剧本
   * @param {String} scriptId - 剧本ID
   * @returns {Object} 删除结果
   */
  async delete(scriptId) {
    if (!scriptId) {
      throw new Error('剧本ID不能为空')
    }
    
    // 检查登录
    checkAuth(this.currentUserId)
    
    try {
      const scriptsCollection = this.db.collection('botc-scripts')
      
      // 查询剧本并验证权限
      const scriptRes = await scriptsCollection.doc(scriptId).get()
      
      if (!scriptRes.data || scriptRes.data.length === 0) {
        throw new Error('剧本不存在')
      }
      
      const script = scriptRes.data[0]
      
      // 验证是否是本人上传的
      if (script.creator_id !== this.currentUserId) {
        throw new Error('无权删除他人上传的剧本')
      }
      
      // 如果已发布，不允许直接删除
      if (script.status === 1) {
        throw new Error('已发布的剧本无法删除，请联系管理员')
      }
      
      // 执行软删除
      await scriptsCollection.doc(scriptId).update({
        deleted_at: Date.now(),
        status: -1 // -1表示已删除
      })
      
      // 更新说书人统计
      const usersCollection = this.db.collection('uni-id-users')
      const userDoc = await usersCollection.doc(this.currentUserId).get()
      const user = userDoc.data && userDoc.data.length > 0 ? userDoc.data[0] : {}
      
      if (user.storyteller_certified && user.storyteller_stats) {
        const currentScriptCount = user.storyteller_stats.script_count || 0
        await usersCollection.doc(this.currentUserId).update({
          'storyteller_stats.script_count': Math.max(0, currentScriptCount - 1)
        })
        console.log('✅ 更新说书人剧本数:', Math.max(0, currentScriptCount - 1))
      }
      
      return returnSuccess(null, '删除成功')
      
    } catch (error) {
      console.error('❌ 删除剧本失败:', error)
      throw error
    }
  },
  
  // ==================== 阶段2：评价功能（2个方法）====================
  
  /**
   * 6. 创建剧本评价
   * @param {string} scriptId - 剧本ID
   * @param {string} content - 评价内容
   * @param {number} rating - 评分(1-5)
   */
  async createReview(scriptId, content, rating) {
    checkAuth(this.currentUserId)
    
    // 参数验证
    if (!scriptId) {
      throw new Error('剧本ID不能为空')
    }
    
    if (!rating || rating < 1 || rating > 5) {
      throw new Error('请选择1-5星评分')
    }
    
    if (!content || content.trim().length === 0) {
      throw new Error('评价内容不能为空')
    }
    
    if (content.length > 500) {
      throw new Error('评价内容不能超过500字')
    }
    
    try {
      // 检查剧本是否存在
      const scriptResult = await this.db.collection('botc-scripts').doc(scriptId).get()
      
      if (scriptResult.data.length === 0) {
        throw new Error('剧本不存在')
      }
      
      // 检查用户是否已经评价过
      const existingReview = await this.db.collection('botc-script-reviews')
        .where({
          script_id: scriptId,
          user_id: this.currentUserId
        })
        .get()
      
      if (existingReview.data.length > 0) {
        throw new Error('您已经评价过这个剧本了')
      }
      
      // 创建评价记录
      const reviewData = {
        script_id: scriptId,
        user_id: this.currentUserId,
        content: content.trim(),
        rating: rating,
        like_count: 0,
        status: 1,
        created_at: Date.now(),
        updated_at: Date.now()
      }
      
      const reviewResult = await this.db.collection('botc-script-reviews').add(reviewData)
      
      // 更新剧本的评分统计
      const allReviews = await this.db.collection('botc-script-reviews')
        .where({
          script_id: scriptId,
          status: 1
        })
        .get()
      
      const reviews = allReviews.data
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
      const avgRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0
      
      await this.db.collection('botc-scripts').doc(scriptId).update({
        rating: parseFloat(avgRating),
        rating_count: reviews.length
      })
      
      // 获取用户信息
      const userResult = await this.db.collection('uni-id-users').doc(this.currentUserId).get()
      
      const userInfo = userResult.data.length > 0 ? {
        _id: userResult.data[0]._id,
        nickname: userResult.data[0].nickname || '匿名用户',
        avatar: userResult.data[0].avatar || ''
      } : {
        _id: this.currentUserId,
        nickname: '匿名用户',
        avatar: ''
      }
      
      console.log(`✅ 评价创建成功: ${reviewResult.id}`)
      
      return returnSuccess({
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
      }, '评价成功')
      
    } catch (error) {
      console.error('❌ 创建评价失败:', error)
      throw error
    }
  },
  
  /**
   * 7. 评分剧本
   * @param {string} scriptId - 剧本ID
   * @param {number} rating - 评分(1-5)
   * @param {string} comment - 评分备注(可选)
   */
  async rate(scriptId, rating, comment = '') {
    checkAuth(this.currentUserId)
    
    if (!scriptId || !rating) {
      throw new Error('缺少必要参数')
    }
    
    if (rating < 1 || rating > 5) {
      throw new Error('评分必须在1-5之间')
    }
    
    try {
      // 检查是否已经评分过
      const existingRating = await this.db.collection('botc-script-ratings')
        .where({
          user_id: this.currentUserId,
          script_id: scriptId
        })
        .get()
      
      const now = Date.now()
      let isNew = false
      let ratingId = null
      
      if (existingRating.data.length > 0) {
        // 更新评分
        ratingId = existingRating.data[0]._id
        await this.db.collection('botc-script-ratings')
          .doc(ratingId)
          .update({
            rating,
            comment: comment || '',
            updated_at: now
          })
      } else {
        // 新增评分
        const result = await this.db.collection('botc-script-ratings')
          .add({
            user_id: this.currentUserId,
            script_id: scriptId,
            rating,
            comment: comment || '',
            created_at: now,
            updated_at: now
          })
        ratingId = result.id
        isNew = true
      }
      
      // 重新计算剧本平均分
      const allRatings = await this.db.collection('botc-script-ratings')
        .where({ script_id: scriptId })
        .get()
      
      if (allRatings.data.length > 0) {
        const totalRating = allRatings.data.reduce((sum, item) => sum + item.rating, 0)
        const averageRating = (totalRating / allRatings.data.length).toFixed(1)
        
        await this.db.collection('botc-scripts')
          .doc(scriptId)
          .update({
            average_rating: parseFloat(averageRating),
            rating_count: allRatings.data.length
          })
      }
      
      console.log(`✅ 评分${isNew ? '成功' : '已更新'}: ${ratingId}`)
      
      return returnSuccess({
        rating_id: ratingId,
        is_new: isNew
      }, isNew ? '评分成功' : '评分已更新')
      
    } catch (error) {
      console.error('❌ 评分失败:', error)
      throw error
    }
  },
  
  /**
   * 获取用户对某个剧本的评分
   * @param {string} scriptId - 剧本ID
   */
  async getUserRating(scriptId) {
    if (!scriptId) {
      throw new Error('剧本ID不能为空')
    }
    
    // 如果未登录，返回 null
    if (!this.currentUserId) {
      console.log(`ℹ️ 未登录用户，返回空评分`)
      return returnSuccess(null, '未登录')
    }
    
    try {
      const result = await this.db.collection('botc-script-ratings')
        .where({
          user_id: this.currentUserId,
          script_id: scriptId
        })
        .get()
      
      if (result.data && result.data.length > 0) {
        console.log(`✅ 获取用户评分成功: ${scriptId}`)
        return returnSuccess(result.data[0])
      } else {
        console.log(`ℹ️ 用户未评分: ${scriptId}`)
        return returnSuccess(null, '用户未评分')
      }
      
    } catch (error) {
      console.error('❌ 获取用户评分失败:', error)
      throw error
    }
  },
  
  // ==================== 阶段3：查询功能（5个方法）====================
  
  /**
   * 8. 获取剧本JSON数据
   * @param {string} scriptId - 剧本ID
   */
  async getJson(scriptId) {
    if (!scriptId) {
      throw new Error('剧本ID不能为空')
    }
    
    try {
      const scriptRes = await this.db.collection('botc-scripts')
        .doc(scriptId)
        .field({
          title: true,
          json_data: true,
          status: true,
          uploader_id: true
        })
        .get()
      
      if (!scriptRes.data || scriptRes.data.length === 0) {
        throw new Error('剧本不存在')
      }
      
      const script = scriptRes.data[0]
      
      // 检查权限：已发布的可以查看，未发布的只有创建者可以查看
      if (script.status !== 1 && script.uploader_id !== this.currentUserId) {
        throw new Error('该剧本暂未发布')
      }
      
      if (!script.json_data) {
        throw new Error('该剧本暂无JSON数据')
      }
      
      console.log(`✅ 获取剧本JSON成功: ${scriptId}`)
      
      return returnSuccess({
        title: script.title,
        json_data: script.json_data
      })
      
    } catch (error) {
      console.error('❌ 获取JSON失败:', error)
      throw error
    }
  },
  
  /**
   * 9. 获取热门排行榜
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   * @param {string} period - 时间范围(all/weekly/monthly)
   */
  async getRankingHot(page = 1, pageSize = 20, period = 'all') {
    try {
      // 计算时间范围
      let timeFilter = {}
      const now = Date.now()
      
      if (period === 'weekly') {
        // 最近7天
        const weekAgo = now - 7 * 24 * 60 * 60 * 1000
        timeFilter = {
          created_at: this.dbCmd.gte(weekAgo)
        }
      } else if (period === 'monthly') {
        // 最近30天
        const monthAgo = now - 30 * 24 * 60 * 60 * 1000
        timeFilter = {
          created_at: this.dbCmd.gte(monthAgo)
        }
      }
      
      // 查询已发布的剧本
      const where = {
        status: 1,
        ...timeFilter
      }
      
      // 获取总数
      const countRes = await this.db.collection('botc-scripts')
        .where(where)
        .count()
      
      // 查询剧本列表
      const res = await this.db.collection('botc-scripts')
        .where(where)
        .field({
          title: true,
          author: true,
          cover_image: true,
          player_count: true,
          duration: true,
          difficulty: true,
          rating: true,
          rating_count: true,
          view_count: true,
          download_count: true,
          favorite_count: true,
          script_type: true,
          created_at: true,
          heat_score: true
        })
        .orderBy('heat_score', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get()
      
      // 计算热度分数（如果没有预计算）
      const scripts = res.data.map((script, index) => {
        const viewCount = script.view_count || 0
        const downloadCount = script.download_count || 0
        const rating = script.rating || 0
        const favoriteCount = script.favorite_count || 0
        
        // 热度算法
        const heatScore = (
          viewCount * 0.3 + 
          downloadCount * 0.4 + 
          rating * 20 + 
          favoriteCount * 0.3
        )
        
        return {
          ...script,
          calculated_heat: Math.round(heatScore * 100) / 100,
          rank: (page - 1) * pageSize + index + 1
        }
      })
      
      // 按计算的热度重新排序
      scripts.sort((a, b) => b.calculated_heat - a.calculated_heat)
      
      // 更新排名
      scripts.forEach((script, index) => {
        script.rank = (page - 1) * pageSize + index + 1
      })
      
      console.log(`✅ 获取热门排行成功，共 ${scripts.length} 条`)
      
      return returnSuccess({
        list: scripts,
        total: countRes.total,
        page,
        pageSize,
        hasNext: page * pageSize < countRes.total
      })
      
    } catch (error) {
      console.error('❌ 获取热门排行失败:', error)
      throw error
    }
  },
  
  /**
   * 10. 获取最新排行榜
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   */
  async getRankingNew(page = 1, pageSize = 20) {
    try {
      const where = { status: 1 }
      
      // 获取总数
      const countRes = await this.db.collection('botc-scripts')
        .where(where)
        .count()
      
      // 查询剧本列表，按创建时间倒序
      const res = await this.db.collection('botc-scripts')
        .where(where)
        .field({
          title: true,
          author: true,
          cover_image: true,
          player_count: true,
          duration: true,
          difficulty: true,
          rating: true,
          rating_count: true,
          view_count: true,
          download_count: true,
          favorite_count: true,
          script_type: true,
          created_at: true,
          published_at: true
        })
        .orderBy('created_at', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get()
      
      // 添加排名
      const scripts = res.data.map((script, index) => ({
        ...script,
        rank: (page - 1) * pageSize + index + 1
      }))
      
      console.log(`✅ 获取最新排行成功，共 ${scripts.length} 条`)
      
      return returnSuccess({
        list: scripts,
        total: countRes.total,
        page,
        pageSize,
        hasNext: page * pageSize < countRes.total
      })
      
    } catch (error) {
      console.error('❌ 获取最新排行失败:', error)
      throw error
    }
  },
  
  /**
   * 11. 获取评分排行榜
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   * @param {number} minRatingCount - 最少评分数
   */
  async getRankingRating(page = 1, pageSize = 20, minRatingCount = 5) {
    try {
      const where = {
        status: 1,
        rating_count: this.dbCmd.gte(minRatingCount)
      }
      
      // 获取总数
      const countRes = await this.db.collection('botc-scripts')
        .where(where)
        .count()
      
      // 查询剧本列表，按评分倒序
      const res = await this.db.collection('botc-scripts')
        .where(where)
        .field({
          title: true,
          author: true,
          cover_image: true,
          player_count: true,
          duration: true,
          difficulty: true,
          rating: true,
          rating_count: true,
          view_count: true,
          download_count: true,
          favorite_count: true,
          script_type: true,
          created_at: true
        })
        .orderBy('rating', 'desc')
        .orderBy('rating_count', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get()
      
      // 添加排名
      const scripts = res.data.map((script, index) => ({
        ...script,
        rank: (page - 1) * pageSize + index + 1
      }))
      
      console.log(`✅ 获取评分排行成功，共 ${scripts.length} 条`)
      
      return returnSuccess({
        list: scripts,
        total: countRes.total,
        page,
        pageSize,
        hasNext: page * pageSize < countRes.total
      })
      
    } catch (error) {
      console.error('❌ 获取评分排行失败:', error)
      throw error
    }
  },
  
  /**
   * 12. 获取下载量排行榜
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   * @param {string} period - 时间范围(all/weekly/monthly)
   */
  async getRankingDownload(page = 1, pageSize = 20, period = 'all') {
    try {
      // 计算时间范围
      let timeFilter = {}
      const now = Date.now()
      
      if (period === 'weekly') {
        const weekAgo = now - 7 * 24 * 60 * 60 * 1000
        timeFilter = {
          created_at: this.dbCmd.gte(weekAgo)
        }
      } else if (period === 'monthly') {
        const monthAgo = now - 30 * 24 * 60 * 60 * 1000
        timeFilter = {
          created_at: this.dbCmd.gte(monthAgo)
        }
      }
      
      const where = {
        status: 1,
        download_count: this.dbCmd.gt(0),
        ...timeFilter
      }
      
      // 获取总数
      const countRes = await this.db.collection('botc-scripts')
        .where(where)
        .count()
      
      // 查询剧本列表，按下载量倒序
      const res = await this.db.collection('botc-scripts')
        .where(where)
        .field({
          title: true,
          author: true,
          cover_image: true,
          player_count: true,
          duration: true,
          difficulty: true,
          rating: true,
          rating_count: true,
          view_count: true,
          download_count: true,
          favorite_count: true,
          script_type: true,
          created_at: true
        })
        .orderBy('download_count', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get()
      
      // 添加排名
      const scripts = res.data.map((script, index) => ({
        ...script,
        rank: (page - 1) * pageSize + index + 1
      }))
      
      console.log(`✅ 获取下载排行成功，共 ${scripts.length} 条`)
      
      return returnSuccess({
        list: scripts,
        total: countRes.total,
        page,
        pageSize,
        hasNext: page * pageSize < countRes.total
      })
      
    } catch (error) {
      console.error('❌ 获取下载排行失败:', error)
      throw error
    }
  },
  
  // ==================== 阶段4：系统功能（2个方法）====================
  
  /**
   * 13. 计算剧本热度
   * @param {string} scriptId - 剧本ID(可选，不传则计算所有)
   */
  async calculateHeat(scriptId = null) {
    try {
      if (scriptId) {
        // 计算单个剧本热度
        const heat = await getScriptHeat(scriptId)
        
        await this.db.collection('botc-scripts').doc(scriptId).update({
          heat_score: heat,
          heat_updated_at: Date.now()
        })
        
        console.log(`✅ 计算剧本热度成功: ${scriptId} = ${heat}`)
        
        return returnSuccess({
          script_id: scriptId,
          heat_score: heat
        }, '计算成功')
      } else {
        // 计算所有剧本热度（管理员功能）
        checkAuth(this.currentUserId)
        
        const scriptsResult = await this.db.collection('botc-scripts')
          .field('_id')
          .get()
        
        const scripts = scriptsResult.data || []
        let updated = 0
        let failed = 0
        
        for (const script of scripts) {
          try {
            const heat = await getScriptHeat(script._id)
            
            await this.db.collection('botc-scripts').doc(script._id).update({
              heat_score: heat,
              heat_updated_at: Date.now()
            })
            
            updated++
          } catch (error) {
            console.error(`计算剧本 ${script._id} 热度失败：`, error)
            failed++
          }
        }
        
        console.log(`✅ 批量计算完成: 总数${scripts.length}, 成功${updated}, 失败${failed}`)
        
        return returnSuccess({
          total: scripts.length,
          updated,
          failed
        }, '批量计算完成')
      }
    } catch (error) {
      console.error('❌ 计算热度失败:', error)
      throw error
    }
  },
  
  /**
   * 14. 生成剧本JSON访问链接
   * @param {string} scriptId - 剧本ID
   */
  async generateJsonUrl(scriptId) {
    if (!scriptId) {
      return {
        code: 400,
        message: '剧本ID不能为空',
        data: null
      }
    }
    
    try {
      const scriptRes = await this.db.collection('botc-scripts')
        .doc(scriptId)
        .field({
          title: true,
          json_data: true,
          json_url: true,
          status: true
        })
        .get()
      
      if (!scriptRes.data || scriptRes.data.length === 0) {
        return {
          code: 404,
          message: '剧本不存在',
          data: null
        }
      }
      
      const script = scriptRes.data[0]
      
      if (!script.json_data) {
        return {
          code: 400,
          message: '该剧本暂无JSON数据',
          data: null
        }
      }
      
      // 注意：URL化访问需要在HBuilderX中配置 script-generate-json-url 云函数
      // 如果未配置，可以使用 script.getJson() 方法直接获取JSON数据
      const cloudFunctionUrl = `https://fc-mp-1e0f6630-18c8-400c-99ff-761aea3a4e83.next.bspapp.com/script-generate-json-url?scriptId=${scriptId}`
      
      console.log(`✅ 生成JSON链接: ${scriptId}`)
      
      return {
        code: 0,
        message: 'success',
        data: {
          url: cloudFunctionUrl,
          type: 'cloud_function',
          cors: true,
          note: '需要在HBuilderX中配置script-generate-json-url云函数的URL化访问',
          alternative: '或使用 script.getJson() 方法直接获取JSON数据'
        }
      }
      
    } catch (error) {
      console.error('❌ 生成链接失败:', error)
      return {
        code: 500,
        message: '生成链接失败: ' + error.message,
        data: null
      }
    }
  }
}
