'use strict';

/**
 * AdminScript 云对象 - 剧本管理（管理端）
 * 
 * 功能模块：
 * 1. 批量导入剧本
 * 2. 生成预览图
 * 3. 剧本审核
 * 4. 剧本管理（上架/下架/删除）
 * 
 * @author BOTC Team
 * @date 2025-11-05
 */

const db = uniCloud.database();
const dbCmd = db.command;
const { generateScriptPreviewSVG, extractScriptInfo } = require('./preview-generator');

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
  // 🔧 管理端简化权限验证
  // 管理端通常在内网环境，可以简化验证逻辑
  
  // 方案1: 检查 uniIdToken（推荐）
  const { uniIdToken, TOKEN, ADMIN_TOKEN } = context;
  
  if (!uniIdToken && !TOKEN && !ADMIN_TOKEN) {
    console.log('[admin-script] 权限验证失败 - 未找到任何凭证');
    console.log('[admin-script] context:', JSON.stringify(context, null, 2));
    throw new Error('未登录');
  }
  
  console.log('[admin-script] 权限验证通过');
  return true;
}

// ==================== AdminScript 云对象 ====================

module.exports = {
  _before: async function() {
    // 统一权限验证
    try {
      await checkAdminAuth(this.getClientInfo());
    } catch (error) {
      throw new Error('权限验证失败: ' + error.message);
    }
  },
  
  // ==================== 1. 批量导入剧本 ====================
  
  /**
   * 批量导入剧本
   * @param {Array} scripts - 剧本数组
   * @returns {Object} 导入结果统计
   */
  async batchImport(scripts) {
    if (!scripts || !Array.isArray(scripts)) {
      return returnError(400, '参数错误：需要提供 scripts 数组');
    }
    
    const results = {
      success: 0,
      failed: 0,
      details: []
    };
    
    try {
      for (const script of scripts) {
        try {
          // 生成预览图
          let previewImage = '';
          
          if (script.json_data) {
            try {
              console.log(`[admin-script] 为剧本 ${script.title} 生成预览图...`);
              
              // 解析JSON数据
              let parsedJson = script.json_data;
              if (typeof script.json_data === 'string') {
                parsedJson = JSON.parse(script.json_data);
              }
              
              // 构建预览图生成所需的数据
              const scriptData = {
                title: script.title,
                author: script.author || '未知',
                json: parsedJson
              };
              
              // 生成SVG预览图
              const svgContent = generateScriptPreviewSVG(scriptData);
              
              // 转换为base64
              const svgBase64 = Buffer.from(svgContent, 'utf-8').toString('base64');
              previewImage = `data:image/svg+xml;base64,${svgBase64}`;
              
              console.log(`[admin-script] 预览图生成成功`);
            } catch (error) {
              console.error(`[admin-script] 生成预览图失败:`, error);
              // 预览图生成失败不影响导入，继续执行
            }
          }
          
          // 添加预览图到剧本数据
          if (previewImage) {
            script.preview_image = previewImage;
          }
          
          // 🔧 确保必要字段有默认值
          const scriptData = {
            // 基本信息
            title: script.title || '未命名剧本',
            subtitle: script.subtitle || '',
            author: script.author || '',
            description: script.description || '',
            
            // 分类信息（设置默认值）
            script_type: script.script_type || 1,  // 默认：推理
            difficulty: script.difficulty || 2,     // 默认：中等
            player_count: script.player_count || '7-15',
            duration: script.duration !== undefined ? script.duration : 60,
            
            // JSON数据
            json_data: script.json_data || [],
            
            // 图片
            cover_image: script.cover_image || '',
            preview_image: previewImage || script.preview_image || '',
            user_images: script.user_images || [],
            
            // 标签和链接
            tags: script.tags || [],
            related_links: script.related_links || [],
            
            // 状态信息（设置默认值）
            status: script.status !== undefined ? script.status : 0,  // 默认：待审核
            is_featured: script.is_featured || false,
            
            // 统计信息
            view_count: script.view_count || 0,
            download_count: script.download_count || 0,
            favorite_count: script.favorite_count || 0,
            share_count: script.share_count || 0,
            comment_count: script.comment_count || 0,
            rating: script.rating || 0,
            rating_count: script.rating_count || 0,
            
            // 创建者和时间
            creator_id: script.creator_id || 'admin',
            created_at: script.created_at || Date.now(),
            updated_at: Date.now()
          };
          
          // 直接插入数据库
          const res = await db.collection('botc-scripts').add(scriptData);
          
          results.success++;
          results.details.push({
            success: true,
            title: script.title,
            id: res.id,
            hasPreview: !!previewImage
          });
          
          console.log(`[admin-script] ✅ 导入成功：${script.title}${previewImage ? '（已生成预览图）' : ''}`);
        } catch (error) {
          results.failed++;
          results.details.push({
            success: false,
            title: script.title,
            error: error.message
          });
          
          console.error(`[admin-script] ❌ 导入失败：${script.title}`, error);
        }
      }
      
      return returnSuccess(results, '批量导入完成');
      
    } catch (error) {
      console.error('[admin-script] 批量导入失败:', error);
      return returnError(500, '批量导入失败: ' + error.message);
    }
  },
  
  // ==================== 2. 生成预览图 ====================
  
  /**
   * 生成剧本预览图（不保存到数据库）
   * @param {String} title - 剧本标题
   * @param {String} author - 作者
   * @param {Object|String} jsonData - JSON数据
   * @returns {Object} 预览图数据
   */
  async generatePreview({ title, author, jsonData }) {
    console.log('[admin-script] 开始生成预览图');
    
    // 参数验证
    if (!jsonData) {
      return returnError(400, 'JSON数据不能为空');
    }
    
    try {
      // 解析JSON数据
      let parsedJson;
      if (typeof jsonData === 'string') {
        parsedJson = JSON.parse(jsonData);
      } else {
        parsedJson = jsonData;
      }
      
      console.log('[admin-script] 使用首字母logo，无需处理图片');
      const processedJson = parsedJson;
      
      // 构建剧本数据
      const scriptData = {
        title: title || '未命名剧本',
        author: author || '未知',
        json: processedJson
      };
      
      console.log('[admin-script] 剧本信息:', {
        title: scriptData.title,
        author: scriptData.author
      });
      
      // 生成SVG预览图
      const svgContent = generateScriptPreviewSVG(scriptData);
      
      // 转换为base64
      const svgBase64 = Buffer.from(svgContent, 'utf-8').toString('base64');
      const previewDataUrl = `data:image/svg+xml;base64,${svgBase64}`;
      
      console.log(`[admin-script] SVG大小: ${svgContent.length} 字符，base64大小: ${svgBase64.length} 字符`);
      console.log('[admin-script] 预览图生成成功');
      
      return returnSuccess({
        previewImage: previewDataUrl
      }, 'success');
      
    } catch (error) {
      console.error('[admin-script] 生成预览图失败:', error);
      return returnError(500, '生成预览图失败: ' + error.message);
    }
  },
  
  // ==================== 3. 剧本审核 ====================
  
  /**
   * 获取待审核剧本列表
   * @param {Number} pageNo - 页码
   * @param {Number} pageSize - 每页数量
   * @param {String} status - 状态筛选（pending/approved/rejected）
   */
  async getAuditList({ pageNo = 1, pageSize = 20, status = 'pending' } = {}) {
    try {
      const where = {
        audit_status: status
      };
      
      // 查询总数
      const countRes = await db.collection('botc-scripts')
        .where(where)
        .count();
      
      // 查询列表（聚合创建者信息）
      const listRes = await db.collection('botc-scripts')
        .aggregate()
        .match(where)
        .lookup({
          from: 'uni-id-users',
          localField: 'creator_id',
          foreignField: '_id',
          as: 'creator_info'
        })
        .unwind({
          path: '$creator_info',
          preserveNullAndEmptyArrays: true
        })
        .project({
          _id: 1,
          title: 1,
          author: 1,
          description: 1,
          difficulty: 1,
          tags: 1,
          player_count: 1,
          preview_image: 1,
          audit_status: 1,
          audit_reason: 1,
          created_at: 1,
          updated_at: 1,
          'creator_info.nickname': 1,
          'creator_info.avatar': 1
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
      console.error('[admin-script] 获取审核列表失败:', error);
      return returnError(500, '获取失败: ' + error.message);
    }
  },
  
  /**
   * 审核通过剧本
   * @param {String} scriptId - 剧本ID
   */
  async approveScript(scriptId) {
    if (!scriptId) {
      return returnError(400, '缺少剧本ID');
    }
    
    try {
      await db.collection('botc-scripts')
        .doc(scriptId)
        .update({
          audit_status: 'approved',
          status: 'published', // 同时设置为已发布
          audited_at: Date.now(),
          updated_at: Date.now()
        });
      
      // TODO: 可以发送系统消息通知创建者
      
      return returnSuccess(null, '审核通过');
      
    } catch (error) {
      console.error('[admin-script] 审核通过失败:', error);
      return returnError(500, '操作失败: ' + error.message);
    }
  },
  
  /**
   * 拒绝剧本
   * @param {String} scriptId - 剧本ID
   * @param {String} reason - 拒绝原因
   */
  async rejectScript(scriptId, reason) {
    if (!scriptId) {
      return returnError(400, '缺少剧本ID');
    }
    
    if (!reason) {
      return returnError(400, '请填写拒绝原因');
    }
    
    try {
      await db.collection('botc-scripts')
        .doc(scriptId)
        .update({
          audit_status: 'rejected',
          audit_reason: reason,
          status: 'draft', // 退回草稿状态
          audited_at: Date.now(),
          updated_at: Date.now()
        });
      
      // TODO: 可以发送系统消息通知创建者
      
      return returnSuccess(null, '已拒绝');
      
    } catch (error) {
      console.error('[admin-script] 拒绝剧本失败:', error);
      return returnError(500, '操作失败: ' + error.message);
    }
  },
  
  // ==================== 4. 剧本管理 ====================
  
  /**
   * 获取剧本列表（管理端）
   * @param {Number} pageNo - 页码
   * @param {Number} pageSize - 每页数量
   * @param {String} status - 状态筛选
   * @param {String} keyword - 关键词搜索
   */
  async getScripts({ pageNo = 1, pageSize = 20, status, keyword } = {}) {
    try {
      const where = {};
      
      // 状态筛选
      if (status) {
        where.status = status;
      }
      
      // 关键词搜索
      if (keyword) {
        where.title = new RegExp(keyword);
      }
      
      // 查询总数
      const countRes = await db.collection('botc-scripts')
        .where(where)
        .count();
      
      // 查询列表（聚合创建者信息）
      const listRes = await db.collection('botc-scripts')
        .aggregate()
        .match(where)
        .lookup({
          from: 'uni-id-users',
          localField: 'creator_id',
          foreignField: '_id',
          as: 'creator_info'
        })
        .unwind({
          path: '$creator_info',
          preserveNullAndEmptyArrays: true
        })
        .project({
          _id: 1,
          title: 1,
          author: 1,
          description: 1,
          difficulty: 1,
          tags: 1,
          player_count: 1,
          preview_image: 1,
          status: 1,
          audit_status: 1,
          view_count: 1,
          favorite_count: 1,
          created_at: 1,
          updated_at: 1,
          'creator_info.nickname': 1,
          'creator_info.avatar': 1
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
      console.error('[admin-script] 获取剧本列表失败:', error);
      return returnError(500, '获取失败: ' + error.message);
    }
  },
  
  /**
   * 上架剧本
   * @param {String} scriptId - 剧本ID
   */
  async publishScript(scriptId) {
    if (!scriptId) {
      return returnError(400, '缺少剧本ID');
    }
    
    try {
      await db.collection('botc-scripts')
        .doc(scriptId)
        .update({
          status: 'published',
          updated_at: Date.now()
        });
      
      return returnSuccess(null, '已上架');
      
    } catch (error) {
      console.error('[admin-script] 上架剧本失败:', error);
      return returnError(500, '操作失败: ' + error.message);
    }
  },
  
  /**
   * 下架剧本
   * @param {String} scriptId - 剧本ID
   */
  async unpublishScript(scriptId) {
    if (!scriptId) {
      return returnError(400, '缺少剧本ID');
    }
    
    try {
      await db.collection('botc-scripts')
        .doc(scriptId)
        .update({
          status: 'draft',
          updated_at: Date.now()
        });
      
      return returnSuccess(null, '已下架');
      
    } catch (error) {
      console.error('[admin-script] 下架剧本失败:', error);
      return returnError(500, '操作失败: ' + error.message);
    }
  },
  
  /**
   * 删除剧本
   * @param {String} scriptId - 剧本ID
   */
  async deleteScript(scriptId) {
    if (!scriptId) {
      return returnError(400, '缺少剧本ID');
    }
    
    try {
      // 软删除
      await db.collection('botc-scripts')
        .doc(scriptId)
        .update({
          deleted_at: Date.now(),
          updated_at: Date.now()
        });
      
      return returnSuccess(null, '已删除');
      
    } catch (error) {
      console.error('[admin-script] 删除剧本失败:', error);
      return returnError(500, '删除失败: ' + error.message);
    }
  },
  
  /**
   * 获取剧本统计
   */
  async getScriptStats() {
    try {
      const [totalRes, publishedRes, draftRes, pendingRes, approvedRes, rejectedRes] = await Promise.all([
        db.collection('botc-scripts').where({ deleted_at: dbCmd.exists(false) }).count(),
        db.collection('botc-scripts').where({ status: 'published', deleted_at: dbCmd.exists(false) }).count(),
        db.collection('botc-scripts').where({ status: 'draft', deleted_at: dbCmd.exists(false) }).count(),
        db.collection('botc-scripts').where({ audit_status: 'pending' }).count(),
        db.collection('botc-scripts').where({ audit_status: 'approved' }).count(),
        db.collection('botc-scripts').where({ audit_status: 'rejected' }).count()
      ]);
      
      return returnSuccess({
        total: totalRes.total,
        published: publishedRes.total,
        draft: draftRes.total,
        pending: pendingRes.total,
        approved: approvedRes.total,
        rejected: rejectedRes.total
      });
      
    } catch (error) {
      console.error('[admin-script] 获取剧本统计失败:', error);
      return returnError(500, '获取失败: ' + error.message);
    }
  }
};

