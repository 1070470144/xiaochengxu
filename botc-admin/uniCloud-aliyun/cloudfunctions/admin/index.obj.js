'use strict';

/**
 * Admin 云对象 - 管理端核心功能
 * 
 * 功能模块：
 * 1. 认证管理（Certification）- 说书人认证审核
 * 2. 举报管理（Reports）- 用户举报处理
 * 3. 系统消息（SystemMessage）- 发送系统通知
 * 4. 敏感词管理（SensitiveWords）- 内容过滤
 * 
 * @author BOTC Team
 * @date 2025-11-05
 */

const db = uniCloud.database();
const dbCmd = db.command;

// ==================== 工具函数（外部） ====================

/**
 * 统一成功返回
 */
function returnSuccess(data = null, message = '操作成功') {
  return {
    code: 0,
    message,
    data
  };
}

/**
 * 统一错误返回
 */
function returnError(code, message) {
  return {
    code,
    message
  };
}

/**
 * 管理员权限验证
 */
async function checkAdminAuth(context) {
  const { TOKEN, ADMIN_TOKEN } = context;
  
  // 简化版：检查是否有管理员token
  if (!TOKEN && !ADMIN_TOKEN) {
    throw new Error('未登录');
  }
  
  // TODO: 可以添加更严格的管理员权限验证
  // 例如：查询用户表，检查 role 字段是否为 'admin'
  
  return true;
}

/**
 * 获取内容类型中文名称
 */
function getContentTypeName(contentType) {
  const typeMap = {
    'post': '帖子',
    'comment': '评论',
    'script': '剧本',
    'review': '评价',
    'user': '用户资料'
  };
  return typeMap[contentType] || '内容';
}

/**
 * 从内容中获取用户ID
 */
async function getUserIdFromContent(contentType, contentId) {
  const collectionMap = {
    'post': 'botc-posts',
    'comment': 'botc-post-comments',
    'script': 'botc-scripts',
    'review': 'botc-script-reviews'
  };
  
  const collection = collectionMap[contentType];
  if (!collection) {
    return null;
  }
  
  try {
    const res = await db.collection(collection)
      .doc(contentId)
      .field({ user_id: true })
      .get();
    
    if (res.data && res.data.length > 0) {
      return res.data[0].user_id;
    }
  } catch (error) {
    console.error('[admin] 获取用户ID失败:', error);
  }
  
  return null;
}

/**
 * 发送系统消息（内部工具）
 */
async function sendSystemMessageInternal({ userId, type, title, content, relatedType, relatedId }) {
  try {
    await db.collection('botc-system-messages').add({
      user_id: userId,
      type: type || 'system',
      title: title,
      content: content,
      related_type: relatedType || '',
      related_id: relatedId || '',
      is_read: false,
      created_at: Date.now()
    });
    console.log(`[admin] 已发送系统消息给用户 ${userId}`);
    return true;
  } catch (error) {
    console.error('[admin] 发送系统消息失败:', error);
    return false;
  }
}

/**
 * 删除被举报内容
 */
async function deleteContent(contentType, contentId) {
  const collectionMap = {
    'post': 'botc-posts',
    'comment': 'botc-post-comments',
    'script': 'botc-scripts',
    'review': 'botc-script-reviews'
  };
  
  const collection = collectionMap[contentType];
  if (collection) {
    try {
      // 先获取内容信息（用于通知）
      const contentRes = await db.collection(collection).doc(contentId).get();
      const content = contentRes.data && contentRes.data.length > 0 ? contentRes.data[0] : null;
      
      // 删除内容
      await db.collection(collection).doc(contentId).remove();
      console.log(`[admin] 已删除${contentType}: ${contentId}`);
      
      // 发送系统消息给内容作者
      if (content && content.user_id) {
        await sendSystemMessageInternal({
          userId: content.user_id,
          type: 'warning',
          title: '内容违规通知',
          content: `您发布的${getContentTypeName(contentType)}因违反社区规范已被删除。请遵守社区规则，文明发言。`,
          relatedType: contentType,
          relatedId: contentId
        });
      }
      
      return true;
    } catch (error) {
      console.error('[admin] 删除内容失败:', error);
      return false;
    }
  }
  return false;
}

/**
 * 警告用户
 */
async function warnUser(userId, contentType) {
  if (!userId) {
    console.log('[admin] 用户ID为空，无法发送警告');
    return false;
  }
  
  try {
    // 发送警告消息
    await sendSystemMessageInternal({
      userId: userId,
      type: 'warning',
      title: '违规警告',
      content: `您发布的${getContentTypeName(contentType)}存在违规行为，已被管理员警告。请注意遵守社区规范，多次违规将被封禁账号。`,
      relatedType: contentType,
      relatedId: ''
    });
    
    // 记录警告次数
    await db.collection('uni-id-users')
      .doc(userId)
      .update({
        warning_count: dbCmd.inc(1),
        last_warning_at: Date.now()
      });
    
    console.log(`[admin] 已警告用户 ${userId}`);
    return true;
  } catch (error) {
    console.error('[admin] 警告用户失败:', error);
    return false;
  }
}

/**
 * 封禁用户
 */
async function banUser(userId, reason) {
  if (!userId) {
    console.log('[admin] 用户ID为空，无法封禁');
    return false;
  }
  
  try {
    // 发送封禁通知
    await sendSystemMessageInternal({
      userId: userId,
      type: 'warning',
      title: '账号封禁通知',
      content: `您的账号因违反社区规范已被封禁。封禁原因：${reason || '多次违规'}。如有疑问，请联系客服。`,
      relatedType: 'user',
      relatedId: userId
    });
    
    // 封禁用户
    await db.collection('uni-id-users')
      .doc(userId)
      .update({
        status: 1, // 1表示禁用
        ban_reason: reason,
        banned_at: Date.now()
      });
    
    console.log(`[admin] 已封禁用户：${userId}`);
    return true;
  } catch (error) {
    console.error('[admin] 封禁用户失败:', error);
    return false;
  }
}

// ==================== Admin 云对象 ====================

module.exports = {
  _before: async function() {
    // 统一权限验证
    try {
      await checkAdminAuth(this.getClientInfo());
    } catch (error) {
      throw new Error('权限验证失败: ' + error.message);
    }
  },
  
  // ==================== 1. 认证管理 ====================
  
  /**
   * 获取认证列表
   * @param {Number} pageNo - 页码
   * @param {Number} pageSize - 每页数量
   * @param {String} status - 状态筛选（pending/approved/rejected）
   */
  async getCertifications({ pageNo = 1, pageSize = 20, status } = {}) {
    try {
      const where = {};
      
      // 状态筛选
      if (status) {
        where.status = status;
      }
      
      // 查询总数
      const countRes = await db.collection('botc-certifications')
        .where(where)
        .count();
      
      // 查询列表（聚合用户信息）
      const listRes = await db.collection('botc-certifications')
        .aggregate()
        .match(where)
        .lookup({
          from: 'uni-id-users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user_info'
        })
        .unwind('$user_info')
        .project({
          _id: 1,
          user_id: 1,
          level: 1,
          real_name: 1,
          id_card: 1,
          phone: 1,
          experience: 1,
          status: 1,
          reject_reason: 1,
          created_at: 1,
          approved_at: 1,
          updated_at: 1,
          'user_info.nickname': 1,
          'user_info.avatar': 1
        })
        .sort({ created_at: -1 })
        .skip((pageNo - 1) * pageSize)
        .limit(pageSize)
        .end();
      
      return returnSuccess({
        list: listRes.data,
        total: countRes.total,
        pageNo,
        pageSize
      }, '获取成功');
      
    } catch (error) {
      console.error('[admin] 获取认证列表失败:', error);
      return returnError(500, '获取失败: ' + error.message);
    }
  },
  
  /**
   * 审核通过认证
   * @param {String} certId - 认证ID
   */
  async approveCertification(certId) {
    if (!certId) {
      return returnError(400, '缺少认证ID');
    }
    
    try {
      // 获取认证信息
      const certRes = await db.collection('botc-certifications')
        .doc(certId)
        .get();
      
      if (!certRes.data || certRes.data.length === 0) {
        return returnError(404, '认证记录不存在');
      }
      
      const cert = certRes.data[0];
      
      if (cert.status !== 'pending') {
        return returnError(400, '该申请已处理');
      }
      
      // 更新认证状态
      await db.collection('botc-certifications')
        .doc(certId)
        .update({
          status: 'approved',
          approved_at: Date.now(),
          updated_at: Date.now()
        });
      
      // 获取用户当前信息
      const userRes = await db.collection('uni-id-users')
        .doc(cert.user_id)
        .field({
          storyteller_stats: true,
          followers_count: true
        })
        .get();
      
      const user = userRes.data && userRes.data.length > 0 ? userRes.data[0] : {};
      
      // 初始化或保留 storyteller_stats
      const storyteller_stats = user.storyteller_stats || {
        fans_count: user.followers_count || 0,
        script_count: 0,
        heat_score: 0
      };
      
      // 更新用户认证信息
      await db.collection('uni-id-users')
        .doc(cert.user_id)
        .update({
          storyteller_level: cert.level,
          storyteller_certified: true,
          storyteller_stats: storyteller_stats
        });
      
      // 发送系统消息
      await sendSystemMessageInternal({
        userId: cert.user_id,
        type: 'system',
        title: '认证通过通知',
        content: `恭喜您的说书人认证已通过审核！认证等级：${cert.level}`,
        relatedType: 'certification',
        relatedId: certId
      });
      
      return returnSuccess(null, '审核通过');
      
    } catch (error) {
      console.error('[admin] 审核通过失败:', error);
      return returnError(500, '操作失败: ' + error.message);
    }
  },
  
  /**
   * 拒绝认证
   * @param {String} certId - 认证ID
   * @param {String} rejectReason - 拒绝原因
   */
  async rejectCertification(certId, rejectReason) {
    if (!certId) {
      return returnError(400, '缺少认证ID');
    }
    
    if (!rejectReason) {
      return returnError(400, '请填写拒绝原因');
    }
    
    try {
      // 获取认证信息
      const certRes = await db.collection('botc-certifications')
        .doc(certId)
        .get();
      
      if (!certRes.data || certRes.data.length === 0) {
        return returnError(404, '认证记录不存在');
      }
      
      const cert = certRes.data[0];
      
      if (cert.status !== 'pending') {
        return returnError(400, '该申请已处理');
      }
      
      // 更新认证状态
      await db.collection('botc-certifications')
        .doc(certId)
        .update({
          status: 'rejected',
          reject_reason: rejectReason,
          updated_at: Date.now()
        });
      
      // 发送系统消息
      await sendSystemMessageInternal({
        userId: cert.user_id,
        type: 'system',
        title: '认证未通过通知',
        content: `很抱歉，您的说书人认证未通过审核。原因：${rejectReason}`,
        relatedType: 'certification',
        relatedId: certId
      });
      
      return returnSuccess(null, '已拒绝');
      
    } catch (error) {
      console.error('[admin] 拒绝认证失败:', error);
      return returnError(500, '操作失败: ' + error.message);
    }
  },
  
  // ==================== 2. 举报管理 ====================
  
  /**
   * 获取举报列表
   * @param {Number} pageNo - 页码
   * @param {Number} pageSize - 每页数量
   * @param {String} status - 状态筛选
   * @param {String} contentType - 内容类型筛选
   * @param {String} reason - 举报原因筛选
   */
  async getReports({ pageNo = 1, pageSize = 20, status, contentType, reason } = {}) {
    try {
      const where = {};
      
      // 状态筛选
      if (status) {
        where.status = status;
      }
      
      // 内容类型筛选
      if (contentType) {
        where.content_type = contentType;
      }
      
      // 原因筛选
      if (reason) {
        where.reason = reason;
      }
      
      // 查询总数
      const countRes = await db.collection('botc-reports')
        .where(where)
        .count();
      
      // 查询列表（聚合举报人信息）
      const listRes = await db.collection('botc-reports')
        .aggregate()
        .match(where)
        .lookup({
          from: 'uni-id-users',
          localField: 'reporter_user_id',
          foreignField: '_id',
          as: 'reporter_info'
        })
        .unwind({
          path: '$reporter_info',
          preserveNullAndEmptyArrays: true
        })
        .lookup({
          from: 'uni-id-users',
          localField: 'reported_user_id',
          foreignField: '_id',
          as: 'reported_info'
        })
        .unwind({
          path: '$reported_info',
          preserveNullAndEmptyArrays: true
        })
        .project({
          _id: 1,
          content_type: 1,
          content_id: 1,
          target_type: 1,
          target_id: 1,
          reason: 1,
          description: 1,
          status: 1,
          handle_result: 1,
          handle_remark: 1,
          created_at: 1,
          handled_at: 1,
          'reporter_info.nickname': 1,
          'reporter_info.avatar': 1,
          'reported_info.nickname': 1,
          'reported_info.avatar': 1
        })
        .sort({ created_at: -1 })
        .skip((pageNo - 1) * pageSize)
        .limit(pageSize)
        .end();
      
      return returnSuccess({
        list: listRes.data,
        total: countRes.total,
        pageNo,
        pageSize
      }, '获取成功');
      
    } catch (error) {
      console.error('[admin] 获取举报列表失败:', error);
      return returnError(500, '获取失败: ' + error.message);
    }
  },
  
  /**
   * 处理举报
   * @param {String} reportId - 举报ID
   * @param {String} handleResult - 处理结果（delete/warn/ban/ignore）
   * @param {String} handleRemark - 处理备注
   */
  async handleReport(reportId, handleResult, handleRemark = '') {
    if (!reportId) {
      return returnError(400, '缺少举报ID');
    }
    
    if (!handleResult) {
      return returnError(400, '请选择处理结果');
    }
    
    try {
      // 获取举报信息
      const reportRes = await db.collection('botc-reports')
        .doc(reportId)
        .get();
      
      if (!reportRes.data || reportRes.data.length === 0) {
        return returnError(404, '举报记录不存在');
      }
      
      const report = reportRes.data[0];
      
      // 更新举报状态
      await db.collection('botc-reports')
        .doc(reportId)
        .update({
          status: 'resolved',
          handle_result: handleResult,
          handle_remark: handleRemark,
          handled_at: Date.now(),
          updated_at: Date.now()
        });
      
      // 根据处理结果执行相应操作
      const contentType = report.content_type || report.target_type;
      const contentId = report.content_id || report.target_id;
      let reportedUserId = report.reported_user_id;
      
      // 如果没有被举报用户ID，尝试从内容中获取
      if (!reportedUserId && contentId) {
        reportedUserId = await getUserIdFromContent(contentType, contentId);
      }
      
      if (handleResult === 'delete') {
        // 删除被举报内容
        await deleteContent(contentType, contentId);
      } else if (handleResult === 'warn') {
        // 警告用户
        if (reportedUserId) {
          await warnUser(reportedUserId, contentType);
        } else {
          console.log('[admin] 警告失败：未找到被举报用户ID');
        }
      } else if (handleResult === 'ban') {
        // 封禁用户
        if (reportedUserId) {
          await banUser(reportedUserId, handleRemark);
        } else {
          console.log('[admin] 封禁失败：未找到被举报用户ID');
        }
      }
      
      return returnSuccess(null, '处理成功');
      
    } catch (error) {
      console.error('[admin] 处理举报失败:', error);
      return returnError(500, '操作失败: ' + error.message);
    }
  },
  
  /**
   * 驳回举报
   * @param {String} reportId - 举报ID
   * @param {String} rejectRemark - 驳回备注
   */
  async rejectReport(reportId, rejectRemark = '') {
    if (!reportId) {
      return returnError(400, '缺少举报ID');
    }
    
    try {
      await db.collection('botc-reports')
        .doc(reportId)
        .update({
          status: 'rejected',
          handle_remark: rejectRemark,
          handled_at: Date.now(),
          updated_at: Date.now()
        });
      
      return returnSuccess(null, '已驳回举报');
      
    } catch (error) {
      console.error('[admin] 驳回举报失败:', error);
      return returnError(500, '操作失败: ' + error.message);
    }
  },
  
  /**
   * 获取举报统计
   */
  async getReportStats() {
    try {
      const [pendingRes, processingRes, resolvedRes, rejectedRes] = await Promise.all([
        db.collection('botc-reports').where({ status: 'pending' }).count(),
        db.collection('botc-reports').where({ status: 'processing' }).count(),
        db.collection('botc-reports').where({ status: 'resolved' }).count(),
        db.collection('botc-reports').where({ status: 'rejected' }).count()
      ]);
      
      return returnSuccess({
        pending: pendingRes.total,
        processing: processingRes.total,
        resolved: resolvedRes.total,
        rejected: rejectedRes.total,
        total: pendingRes.total + processingRes.total + resolvedRes.total + rejectedRes.total
      });
      
    } catch (error) {
      console.error('[admin] 获取举报统计失败:', error);
      return returnError(500, '获取失败: ' + error.message);
    }
  },
  
  // ==================== 3. 系统消息 ====================
  
  /**
   * 发送系统消息
   * @param {String} userId - 用户ID（必填）
   * @param {String} type - 消息类型（system/warning/notification）
   * @param {String} title - 标题
   * @param {String} content - 内容
   * @param {String} relatedType - 关联类型
   * @param {String} relatedId - 关联ID
   */
  async sendSystemMessage({ userId, type = 'system', title, content, relatedType = '', relatedId = '' }) {
    // 参数验证
    if (!userId) {
      return returnError(400, '缺少用户ID');
    }
    
    if (!title || !content) {
      return returnError(400, '缺少标题或内容');
    }
    
    try {
      console.log('[admin] === 发送系统消息 ===');
      console.log('[admin] 目标用户ID:', userId);
      console.log('[admin] 消息类型:', type);
      console.log('[admin] 标题:', title);
      console.log('[admin] 内容:', content);
      
      // 写入数据库
      const result = await db.collection('botc-system-messages').add({
        user_id: userId,
        type: type,
        title: title,
        content: content,
        related_type: relatedType,
        related_id: relatedId,
        is_read: false,
        created_at: Date.now()
      });
      
      console.log('[admin] 写入结果:', result);
      
      if (result.id) {
        console.log('[admin] ✅ 系统消息发送成功，ID:', result.id);
        
        return returnSuccess({
          messageId: result.id
        }, '发送成功');
      } else {
        console.error('[admin] ❌ 写入失败，没有返回ID');
        return returnError(500, '发送失败');
      }
      
    } catch (error) {
      console.error('[admin] 发送系统消息失败:', error);
      return returnError(500, '发送失败: ' + error.message);
    }
  },
  
  // ==================== 4. 敏感词管理 ====================
  
  /**
   * 获取敏感词列表
   * @param {Number} pageNo - 页码
   * @param {Number} pageSize - 每页数量
   * @param {String} keyword - 关键词搜索
   * @param {String} type - 类型筛选
   * @param {String} status - 状态筛选
   */
  async getSensitiveWords({ pageNo = 1, pageSize = 20, keyword, type, status } = {}) {
    try {
      const where = {};
      
      // 关键词搜索
      if (keyword) {
        where.word = new RegExp(keyword);
      }
      
      // 类型筛选
      if (type) {
        where.type = type;
      }
      
      // 状态筛选
      if (status) {
        where.status = status;
      }
      
      // 查询总数
      const countRes = await db.collection('botc-sensitive-words')
        .where(where)
        .count();
      
      // 查询列表
      const listRes = await db.collection('botc-sensitive-words')
        .where(where)
        .orderBy('created_at', 'desc')
        .skip((pageNo - 1) * pageSize)
        .limit(pageSize)
        .get();
      
      return returnSuccess({
        list: listRes.data,
        total: countRes.total,
        pageNo,
        pageSize
      }, '获取成功');
      
    } catch (error) {
      console.error('[admin] 获取敏感词列表失败:', error);
      return returnError(500, '获取失败: ' + error.message);
    }
  },
  
  /**
   * 添加敏感词
   * @param {Object} wordData - 敏感词数据
   */
  async addSensitiveWord(wordData) {
    if (!wordData || !wordData.word) {
      return returnError(400, '请输入敏感词');
    }
    
    try {
      // 检查是否已存在
      const existRes = await db.collection('botc-sensitive-words')
        .where({ word: wordData.word })
        .get();
      
      if (existRes.data.length > 0) {
        return returnError(400, '该敏感词已存在');
      }
      
      // 添加记录
      await db.collection('botc-sensitive-words').add({
        word: wordData.word,
        type: wordData.type || 'other',
        level: wordData.level || 2,
        status: wordData.status || 'enabled',
        replacement: wordData.replacement || '',
        remark: wordData.remark || '',
        created_at: Date.now(),
        updated_at: Date.now()
      });
      
      return returnSuccess(null, '添加成功');
      
    } catch (error) {
      console.error('[admin] 添加敏感词失败:', error);
      return returnError(500, '添加失败: ' + error.message);
    }
  },
  
  /**
   * 编辑敏感词
   * @param {String} wordId - 敏感词ID
   * @param {Object} wordData - 更新数据
   */
  async editSensitiveWord(wordId, wordData) {
    if (!wordId) {
      return returnError(400, '缺少敏感词ID');
    }
    
    if (!wordData) {
      return returnError(400, '缺少更新数据');
    }
    
    try {
      // 更新记录
      await db.collection('botc-sensitive-words')
        .doc(wordId)
        .update({
          ...wordData,
          updated_at: Date.now()
        });
      
      return returnSuccess(null, '更新成功');
      
    } catch (error) {
      console.error('[admin] 更新敏感词失败:', error);
      return returnError(500, '更新失败: ' + error.message);
    }
  },
  
  /**
   * 删除敏感词
   * @param {String} wordId - 敏感词ID
   */
  async deleteSensitiveWord(wordId) {
    if (!wordId) {
      return returnError(400, '缺少敏感词ID');
    }
    
    try {
      await db.collection('botc-sensitive-words')
        .doc(wordId)
        .remove();
      
      return returnSuccess(null, '删除成功');
      
    } catch (error) {
      console.error('[admin] 删除敏感词失败:', error);
      return returnError(500, '删除失败: ' + error.message);
    }
  },
  
  /**
   * 批量导入敏感词
   * @param {Array} words - 敏感词列表
   */
  async importSensitiveWords(words) {
    if (!words || !Array.isArray(words) || words.length === 0) {
      return returnError(400, '请提供敏感词列表');
    }
    
    try {
      let successCount = 0;
      let failCount = 0;
      
      for (const word of words) {
        try {
          // 检查是否已存在
          const existRes = await db.collection('botc-sensitive-words')
            .where({ word: word.word })
            .get();
          
          if (existRes.data.length === 0) {
            await db.collection('botc-sensitive-words').add({
              word: word.word,
              type: word.type || 'other',
              level: word.level || 2,
              status: 'enabled',
              replacement: word.replacement || '',
              remark: word.remark || '',
              created_at: Date.now(),
              updated_at: Date.now()
            });
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
          console.error('[admin] 导入失败：', word, error);
        }
      }
      
      return returnSuccess(
        { successCount, failCount },
        `导入完成：成功${successCount}个，失败${failCount}个`
      );
      
    } catch (error) {
      console.error('[admin] 批量导入敏感词失败:', error);
      return returnError(500, '导入失败: ' + error.message);
    }
  },
  
  /**
   * 启用/禁用敏感词
   * @param {String} wordId - 敏感词ID
   * @param {String} status - 状态（enabled/disabled）
   */
  async toggleSensitiveWordStatus(wordId, status) {
    if (!wordId) {
      return returnError(400, '缺少敏感词ID');
    }
    
    try {
      await db.collection('botc-sensitive-words')
        .doc(wordId)
        .update({
          status: status,
          updated_at: Date.now()
        });
      
      return returnSuccess(null, status === 'enabled' ? '已启用' : '已禁用');
      
    } catch (error) {
      console.error('[admin] 切换敏感词状态失败:', error);
      return returnError(500, '操作失败: ' + error.message);
    }
  }
};

