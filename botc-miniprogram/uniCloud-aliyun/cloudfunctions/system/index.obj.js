'use strict';

// ==================== 工具函数（外部） ====================

/**
 * 解析用户ID
 */
function parseUserId(clientInfo) {
  try {
    if (!clientInfo || !clientInfo.uniIdToken) {
      return null;
    }
    
    const tokenParts = clientInfo.uniIdToken.split('_');
    return tokenParts[0] || null;
  } catch (error) {
    console.error('[system] 解析用户ID失败:', error);
    return null;
  }
}

/**
 * 成功返回
 */
function returnSuccess(data = {}, message = 'success') {
  return {
    code: 0,
    message,
    data
  };
}

/**
 * 错误返回
 */
function returnError(code = -1, message = '操作失败', data = null) {
  return {
    code,
    message,
    data
  };
}

// ==================== 云对象主体 ====================

module.exports = {
  
  /**
   * 前置钩子
   */
  _before() {
    this.db = uniCloud.database();
    this.dbCmd = this.db.command;
    this.clientInfo = this.getClientInfo();
    
    // 需要认证的方法
    const authMethods = [
      'getSystemMessages',
      'deleteSystemMessage',
      'createComment',
      'manageCertification'
    ];
    
    const methodName = this.getMethodName();
    
    if (authMethods.includes(methodName)) {
      this.currentUserId = parseUserId(this.clientInfo);
      if (!this.currentUserId) {
        throw new Error('请先登录');
      }
    }
    
    console.log(`[system] 调用方法: ${methodName}, 用户ID: ${this.currentUserId || '未登录'}`);
  },
  
  /**
   * 1. 获取首页数据
   */
  async getHomeData() {
    try {
      // 1. 获取统计数据
      const [scriptCount, carpoolCount, userCount] = await Promise.all([
        // 剧本总数
        this.db.collection('botc-scripts')
          .where({
            status: this.dbCmd.eq(1)
          })
          .count(),
        
        // 活跃拼车数（招募中）
        this.db.collection('botc-carpool-rooms')
          .where({
            status: this.dbCmd.in([1, 2]), // 招募中或已满员
            deleted_at: this.dbCmd.exists(false)
          })
          .count(),
        
        // 用户总数
        this.db.collection('uni-id-users')
          .count()
      ]);
      
      // 2. 获取热门剧本（按评分和浏览量排序）
      const hotScriptsRes = await this.db.collection('botc-scripts')
        .where({
          status: this.dbCmd.eq(1)
        })
        .orderBy('rating', 'desc')
        .orderBy('view_count', 'desc')
        .limit(6)
        .field({
          _id: true,
          title: true,
          rating: true,
          view_count: true,
          download_count: true
        })
        .get();
      
      // 3. 获取最新拼车
      const latestCarpoolsRes = await this.db.collection('botc-carpool-rooms')
        .where({
          status: this.dbCmd.in([1, 2]), // 招募中或已满员
          deleted_at: this.dbCmd.exists(false)
        })
        .orderBy('created_at', 'desc')
        .limit(3)
        .field({
          _id: true,
          title: true,
          location: true,
          current_players: true,
          max_players: true,
          game_time: true,
          status: true
        })
        .get();
      
      // 4. 格式化数据
      const hotScripts = hotScriptsRes.data.map(script => ({
        id: script._id,
        name: script.title,
        rating: script.rating || 0
      }));
      
      const latestCarpools = latestCarpoolsRes.data.map(carpool => ({
        id: carpool._id,
        title: carpool.title,
        location: carpool.location || '未知地点',
        currentPlayers: carpool.current_players || 0,
        maxPlayers: carpool.max_players || 0,
        status: carpool.status
      }));
      
      console.log('[system] getHomeData 成功');
      
      return returnSuccess({
        stats: {
          scriptCount: scriptCount.total || 0,
          carpoolCount: carpoolCount.total || 0,
          userCount: userCount.total || 0
        },
        hotScripts,
        latestCarpools
      }, '获取首页数据成功');
      
    } catch (error) {
      console.error('[system] getHomeData 失败:', error);
      return returnError(-1, '获取首页数据失败：' + error.message, {
        stats: {
          scriptCount: 0,
          carpoolCount: 0,
          userCount: 0
        },
        hotScripts: [],
        latestCarpools: []
      });
    }
  },
  
  /**
   * 2. 获取系统消息
   * @param {Number} page - 页码
   * @param {Number} pageSize - 每页数量
   * @param {String} messageId - 消息ID（可选，查看单条）
   */
  async getSystemMessages(page = 1, pageSize = 20, messageId = null) {
    const userId = this.currentUserId;
    
    // 如果提供了 messageId，查询单条消息详情
    if (messageId) {
      try {
        console.log('[system] 查询消息详情:', messageId);
        
        const res = await this.db.collection('botc-system-messages')
          .doc(messageId)
          .get();
        
        if (!res.data || res.data.length === 0) {
          return returnError(404, '消息不存在');
        }
        
        const message = res.data[0];
        
        // 验证消息是否属于该用户
        if (message.user_id !== userId) {
          return returnError(403, '无权访问该消息');
        }
        
        // 如果消息未读，标记为已读
        if (!message.is_read) {
          await this.db.collection('botc-system-messages')
            .doc(messageId)
            .update({
              is_read: true,
              read_at: Date.now()
            });
          
          message.is_read = true;
          message.read_at = Date.now();
        }
        
        return returnSuccess(message, '查询成功');
        
      } catch (error) {
        console.error('[system] getSystemMessages 单条失败:', error);
        return returnError(500, '查询失败: ' + error.message);
      }
    }
    
    // 查询消息列表
    try {
      console.log(`[system] 查询消息列表: page=${page}, pageSize=${pageSize}`);
      
      const res = await this.db.collection('botc-system-messages')
        .where({
          user_id: userId
        })
        .orderBy('created_at', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get();
      
      // 查询未读数量
      const unreadRes = await this.db.collection('botc-system-messages')
        .where({
          user_id: userId,
          is_read: false
        })
        .count();
      
      console.log(`[system] 查询成功: ${res.data.length}条, 未读${unreadRes.total}条`);
      
      return returnSuccess({
        list: res.data || [],
        total: res.data ? res.data.length : 0,
        unreadCount: unreadRes.total || 0,
        page,
        pageSize
      }, '查询成功');
      
    } catch (error) {
      console.error('[system] getSystemMessages 列表失败:', error);
      return returnError(500, '查询失败: ' + error.message);
    }
  },
  
  /**
   * 3. 删除系统消息
   * @param {String} messageId - 消息ID（可选）
   * @param {Boolean} deleteAll - 是否删除全部（可选）
   */
  async deleteSystemMessage(messageId = null, deleteAll = false) {
    const userId = this.currentUserId;
    
    try {
      if (deleteAll) {
        // 删除该用户的所有消息
        console.log('[system] 删除所有消息:', userId);
        
        const result = await this.db.collection('botc-system-messages')
          .where({
            user_id: userId
          })
          .remove();
        
        console.log(`[system] 删除成功: ${result.deleted}条`);
        
        return returnSuccess({
          deleted: result.deleted
        }, '删除成功');
        
      } else if (messageId) {
        // 删除单条消息
        console.log('[system] 删除单条消息:', messageId);
        
        // 先查询消息，验证是否属于该用户
        const checkRes = await this.db.collection('botc-system-messages')
          .doc(messageId)
          .get();
        
        if (!checkRes.data || checkRes.data.length === 0) {
          return returnError(404, '消息不存在');
        }
        
        const message = checkRes.data[0];
        if (message.user_id !== userId) {
          return returnError(403, '无权删除该消息');
        }
        
        // 删除消息
        await this.db.collection('botc-system-messages')
          .doc(messageId)
          .remove();
        
        console.log('[system] 删除成功');
        
        return returnSuccess({ deleted: 1 }, '删除成功');
        
      } else {
        return returnError(400, '缺少参数：messageId 或 deleteAll');
      }
      
    } catch (error) {
      console.error('[system] deleteSystemMessage 失败:', error);
      return returnError(500, '删除失败: ' + error.message);
    }
  },
  
  /**
   * 4. 创建评论
   * @param {Object} commentData - 评论数据
   */
  async createComment(commentData) {
    const {
      postId,
      content,
      replyToId,       // 回复的评论ID（二级评论）
      replyToUserId    // 回复的用户ID
    } = commentData;
    
    if (!postId || !content) {
      return returnError(400, '帖子ID和评论内容不能为空');
    }
    
    if (content.trim().length === 0) {
      return returnError(400, '评论内容不能为空');
    }
    
    if (content.length > 500) {
      return returnError(400, '评论内容不能超过500字');
    }
    
    const userId = this.currentUserId;
    
    try {
      // 检查帖子是否存在
      const postResult = await this.db.collection('botc-posts')
        .doc(postId)
        .get();
      
      if (postResult.data.length === 0) {
        return returnError(404, '帖子不存在');
      }
      
      // 创建评论
      const newCommentData = {
        post_id: postId,
        user_id: userId,
        content: content.trim(),
        like_count: 0,
        status: 1,
        created_at: new Date()
      };
      
      // 如果是回复评论
      if (replyToId) {
        newCommentData.reply_to_id = replyToId;
      }
      
      if (replyToUserId) {
        newCommentData.reply_to_user_id = replyToUserId;
      }
      
      const commentResult = await this.db.collection('botc-post-comments')
        .add(newCommentData);
      
      // 增加帖子的评论数
      await this.db.collection('botc-posts')
        .doc(postId)
        .update({
          comment_count: this.dbCmd.inc(1)
        });
      
      // 获取用户信息
      const userResult = await this.db.collection('uni-id-users')
        .doc(userId)
        .get();
      
      const userInfo = userResult.data.length > 0 ? {
        _id: userResult.data[0]._id,
        nickname: userResult.data[0].nickname,
        avatar: userResult.data[0].avatar,
        level: userResult.data[0].level
      } : null;
      
      console.log('[system] createComment 成功');
      
      return returnSuccess({
        comment_id: commentResult.id,
        comment: {
          _id: commentResult.id,
          content: newCommentData.content,
          like_count: 0,
          created_at: newCommentData.created_at,
          user: userInfo
        }
      }, '评论成功');
      
    } catch (error) {
      console.error('[system] createComment 失败:', error);
      return returnError(500, '评论失败，请重试');
    }
  },
  
  /**
   * 5. 内容过滤
   * @param {String} content - 要检查的内容
   */
  async filterContent(content) {
    if (!content) {
      return returnError(400, '内容不能为空');
    }
    
    try {
      // 获取所有启用的敏感词
      const wordsRes = await this.db.collection('botc-sensitive-words')
        .where({
          status: 'enabled'
        })
        .get();
      
      console.log(`[system] 敏感词库数量: ${wordsRes.data.length}`);
      
      const sensitiveWords = wordsRes.data;
      
      if (sensitiveWords.length === 0) {
        return returnSuccess({
          pass: true,
          filteredContent: content
        }, '检查通过');
      }
      
      // 检查敏感词
      let filteredContent = content;
      let foundWords = [];
      
      for (let wordItem of sensitiveWords) {
        const word = wordItem.word;
        
        // 检查是否包含敏感词（不区分大小写）
        const regex = new RegExp(word, 'gi');
        
        if (regex.test(filteredContent)) {
          console.log(`[system] 发现敏感词: ${word}`);
          
          foundWords.push({
            word: word,
            type: wordItem.type
          });
          
          // 如果有替换词，则替换
          if (wordItem.replacement) {
            filteredContent = filteredContent.replace(regex, wordItem.replacement);
          } else {
            // 默认替换为 ***
            filteredContent = filteredContent.replace(regex, '***');
          }
        }
      }
      
      // 如果发现敏感词
      if (foundWords.length > 0) {
        console.log(`[system] 内容被拦截: ${foundWords.length}个敏感词`);
        return returnError(40001, '内容包含敏感词，请修改后重试', {
          pass: false,
          foundWords: foundWords,
          filteredContent: filteredContent
        });
      }
      
      // 额外的规则检查
      // 1. 检查手机号
      const phoneRegex = /1[3-9]\d{9}/g;
      if (phoneRegex.test(content)) {
        return returnError(40002, '请勿发布手机号等联系方式', {
          pass: false,
          reason: 'phone_number'
        });
      }
      
      // 2. 检查QQ号
      const qqRegex = /[1-9]\d{4,10}/g;
      const qqKeywords = ['qq', 'QQ', 'q q', 'Q Q', '扣扣', 'ＱＱ'];
      for (let keyword of qqKeywords) {
        if (content.includes(keyword) && qqRegex.test(content)) {
          return returnError(40002, '请勿发布QQ等联系方式', {
            pass: false,
            reason: 'qq_number'
          });
        }
      }
      
      // 3. 检查微信
      const wechatKeywords = ['微信', 'vx', 'VX', 'Vx', 'v信', 'V信', 'wx', 'WX', 'Wx', 'weixin', 'wechat'];
      for (let keyword of wechatKeywords) {
        if (content.toLowerCase().includes(keyword.toLowerCase())) {
          return returnError(40002, '请勿发布微信等联系方式', {
            pass: false,
            reason: 'wechat'
          });
        }
      }
      
      // 4. 检查重复字符（刷屏）
      const repeatRegex = /(.)\1{9,}/g;
      if (repeatRegex.test(content)) {
        return returnError(40003, '请勿发布重复内容', {
          pass: false,
          reason: 'repeat_content'
        });
      }
      
      // 通过检查
      console.log('[system] 内容检查通过');
      
      return returnSuccess({
        pass: true,
        filteredContent: content
      }, '检查通过');
      
    } catch (error) {
      console.error('[system] filterContent 失败:', error);
      return returnError(500, '内容检查失败');
    }
  },
  
  /**
   * 6. 认证管理
   * @param {String} action - 操作类型：get/apply/revoke
   * @param {Object} data - 认证数据
   */
  async manageCertification(action, data = {}) {
    const userId = this.currentUserId;
    
    try {
      // 获取认证信息
      if (action === 'get') {
        const certRes = await this.db.collection('botc-certifications')
          .where({ user_id: userId })
          .orderBy('created_at', 'desc')
          .limit(1)
          .get();
        
        return returnSuccess(certRes.data[0] || null, '查询成功');
      }
      
      // 提交认证申请
      if (action === 'apply') {
        const { level, images, description } = data;
        
        // 验证参数
        if (!level || ![1, 2].includes(level)) {
          return returnError(400, '请选择认证级别');
        }
        
        if (!images || images.length === 0) {
          return returnError(400, '请上传证明材料');
        }
        
        // 检查是否已有未完成的申请
        const existingRes = await this.db.collection('botc-certifications')
          .where({
            user_id: userId,
            status: this.dbCmd.in(['pending', 'approved'])
          })
          .get();
        
        if (existingRes.data.length > 0) {
          const existing = existingRes.data[0];
          if (existing.status === 'pending') {
            return returnError(400, '您已有待审核的申请');
          }
          if (existing.status === 'approved') {
            return returnError(400, '您已通过认证');
          }
        }
        
        // 获取用户信息
        const userRes = await this.db.collection('uni-id-users')
          .doc(userId)
          .field({ nickname: true, mobile: true })
          .get();
        
        const userInfo = userRes.data[0] || {};
        
        // 创建认证申请
        const certDoc = {
          user_id: userId,
          user_nickname: userInfo.nickname || '',
          user_mobile: userInfo.mobile || '',
          level: level,
          images: images,
          description: description || '',
          status: 'pending',
          created_at: Date.now(),
          updated_at: Date.now()
        };
        
        await this.db.collection('botc-certifications').add(certDoc);
        
        console.log('[system] 认证申请提交成功');
        
        return returnSuccess({}, '申请提交成功');
      }
      
      // 撤销认证（包括取消申请）
      if (action === 'revoke') {
        const certRes = await this.db.collection('botc-certifications')
          .where({
            user_id: userId,
            status: this.dbCmd.in(['pending', 'approved'])
          })
          .get();
        
        if (certRes.data.length === 0) {
          return returnError(400, '没有可撤销的认证');
        }
        
        const certId = certRes.data[0]._id;
        
        // 删除认证记录
        await this.db.collection('botc-certifications')
          .doc(certId)
          .remove();
        
        // 更新用户认证字段
        await this.db.collection('uni-id-users')
          .doc(userId)
          .update({
            storyteller_level: 0,
            storyteller_certified: false
          });
        
        console.log('[system] 认证已撤销');
        
        return returnSuccess({}, '已撤销认证');
      }
      
      return returnError(400, '未知操作');
      
    } catch (error) {
      console.error('[system] manageCertification 失败:', error);
      return returnError(500, '操作失败：' + error.message);
    }
  }
};

