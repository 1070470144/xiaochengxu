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
  }
}

