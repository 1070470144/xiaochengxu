'use strict';

/**
 * AdminWiki 云对象 - 百科管理（管理端）
 * 
 * 功能模块：
 * 1. 批量同步百科（wiki-admin-sync-all）
 * 2. 单个同步百科（wiki-admin-sync-single）
 * 3. 角色管理（添加/删除/列表/同步）
 * 4. 同步日志查询
 * 
 * @author BOTC Team
 * @date 2025-11-05
 */

const db = uniCloud.database();
const dbCmd = db.command;
const urlsConfig = require('./urls-config.js');
const parserUtils = require('./parser-utils.js');

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
  
  return true;
}

/**
 * 延迟函数
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 同步单个页面（内部工具）
 */
async function syncSinglePage(url) {
  try {
    console.log('[admin-wiki] 开始抓取:', url);
    
    const response = await uniCloud.httpclient.request(url, {
      method: 'GET',
      timeout: 30000,
      dataType: 'text',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'zh-CN,zh;q=0.9'
      }
    });
    
    if (response.status !== 200) {
      throw new Error('网页加载失败，状态码: ' + response.status);
    }
    
    const html = response.data;
    console.log('[admin-wiki] HTML长度:', html.length);
    
    // 提取标题
    let title = '';
    let titleMatch = html.match(/<h1[^>]*id="firstHeading"[^>]*>(.*?)<\/h1>/is);
    if (titleMatch) {
      title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
    }
    
    if (!title) {
      const urlTitleMatch = url.match(/title=([^&]+)/);
      if (urlTitleMatch) {
        title = decodeURIComponent(urlTitleMatch[1]);
      }
    }
    
    if (!title) {
      throw new Error('无法提取标题');
    }
    
    console.log('[admin-wiki] 标题:', title);
    
    // 提取内容
    const contentMatch = html.match(/<div[^>]*class="mw-parser-output"[^>]*>([\s\S]*?)<div[^>]*class="printfooter"/i);
    let content = contentMatch ? contentMatch[1] : '';
    content = content
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    console.log('[admin-wiki] 内容长度:', content.length);
    
    // 详细内容解析
    let role_detail = null;
    try {
      if (parserUtils && typeof parserUtils.parseRoleDetail === 'function') {
        role_detail = parserUtils.parseRoleDetail(html);
        console.log('[admin-wiki] 详细解析完成');
      }
    } catch (parseError) {
      console.error('[admin-wiki] 详细解析失败:', parseError.message);
    }
    
    // 构建数据
    const pageId = url.match(/title=([^&]+)/)?.[1] || '';
    
    const parsedData = {
      entry_type: 'role',
      title,
      slug: decodeURIComponent(pageId),
      source_url: url,
      source_page_id: pageId,
      source_type: 'official_wiki_cn',
      source_name: '钟楼百科',
      content: {
        text: content.substring(0, 10000),
        sections: [],
        summary: content.substring(0, 200)
      },
      role_info: { team: null, team_name: null, ability: null },
      role_detail: role_detail,
      media: { 
        icon_url: role_detail ? role_detail.icon_url : null,
        character_info: role_detail ? role_detail.character_info : null,
        background_story: role_detail ? role_detail.background_story : null,
        images: [] 
      },
      category: '角色',
      tags: [],
      keywords: [title],
      sync_info: {
        last_synced_at: new Date(),
        sync_source: 'manual',
        sync_status: 'success',
        sync_error: null,
        sync_count: 1
      },
      status: 1,
      updated_at: new Date()
    };
    
    // 保存到数据库
    const existing = await db.collection('wiki_entries')
      .where({ source_url: url })
      .limit(1)
      .get();
    
    if (existing.data && existing.data.length > 0) {
      const existingData = existing.data[0];
      parsedData.sync_info.sync_count = (existingData.sync_info?.sync_count || 0) + 1;
      parsedData.stats = existingData.stats || { view_count: 0, search_count: 0, favorite_count: 0 };
      
      await db.collection('wiki_entries')
        .doc(existingData._id)
        .update(parsedData);
      
      console.log('[admin-wiki] 更新成功');
      return { success: true, _id: existingData._id };
    } else {
      parsedData.created_at = new Date();
      parsedData.stats = { view_count: 0, search_count: 0, favorite_count: 0 };
      parsedData.is_featured = false;
      parsedData.quality_score = 80;
      
      const result = await db.collection('wiki_entries').add(parsedData);
      
      console.log('[admin-wiki] 新增成功');
      return { success: true, _id: result.id };
    }
  } catch (error) {
    console.error('[admin-wiki] 同步失败:', error);
    return { success: false, error: error.message };
  }
}

// ==================== AdminWiki 云对象 ====================

module.exports = {
  _before: async function() {
    // 统一权限验证
    try {
      await checkAdminAuth(this.getClientInfo());
    } catch (error) {
      throw new Error('权限验证失败: ' + error.message);
    }
  },
  
  // ==================== 1. 批量同步百科 ====================
  
  /**
   * 批量同步百科条目
   * @param {String} sync_type - 同步类型（all/roles/mechanics/etc）
   * @param {Number} batch_size - 批次大小
   * @returns {Object} 同步结果
   */
  async syncAll({ sync_type = 'all', batch_size = 5 } = {}) {
    console.log('[admin-wiki] 开始批量同步，类型:', sync_type);
    
    const startTime = new Date();
    const urlsToSync = urlsConfig.getUrlsByType(sync_type);
    console.log('[admin-wiki] 需要同步', urlsToSync.length, '个页面');
    
    const syncResult = {
      sync_type,
      start_time: startTime,
      total_count: urlsToSync.length,
      success_count: 0,
      failed_count: 0,
      error_list: [],
      status: 'running'
    };
    
    // 创建同步日志
    let logId;
    try {
      const logRes = await db.collection('wiki_sync_logs').add(syncResult);
      logId = logRes.id;
    } catch (err) {
      console.error('[admin-wiki] 创建日志失败:', err);
    }
    
    try {
      // 分批同步
      for (let i = 0; i < urlsToSync.length; i += batch_size) {
        const batch = urlsToSync.slice(i, i + batch_size);
        console.log(`[admin-wiki] 处理批次 ${Math.floor(i/batch_size) + 1}/${Math.ceil(urlsToSync.length/batch_size)}`);
        
        await Promise.all(batch.map(async (url) => {
          try {
            const result = await syncSinglePage(url);
            if (result.success) {
              syncResult.success_count++;
              console.log('[admin-wiki] 成功:', url);
            } else {
              syncResult.failed_count++;
              syncResult.error_list.push({ url, error: result.error });
              console.error('[admin-wiki] 失败:', url, result.error);
            }
          } catch (error) {
            syncResult.failed_count++;
            syncResult.error_list.push({ url, error: error.message });
            console.error('[admin-wiki] 异常:', url, error);
          }
        }));
        
        // 批次间延迟
        if (i + batch_size < urlsToSync.length) {
          await sleep(1000);
        }
      }
      
      const endTime = new Date();
      syncResult.end_time = endTime;
      syncResult.duration = Math.round((endTime - startTime) / 1000);
      syncResult.status = syncResult.failed_count === 0 ? 'success' : 'partial_success';
      
      // 更新同步日志
      if (logId) {
        try {
          await db.collection('wiki_sync_logs').doc(logId).update(syncResult);
        } catch (err) {
          console.error('[admin-wiki] 更新日志失败:', err);
        }
      }
      
      console.log('[admin-wiki] 同步完成:', syncResult);
      
      return returnSuccess(syncResult, `同步完成！成功: ${syncResult.success_count}, 失败: ${syncResult.failed_count}`);
      
    } catch (error) {
      console.error('[admin-wiki] 批量同步失败:', error);
      return returnError(500, '批量同步失败: ' + error.message);
    }
  },
  
  /**
   * 同步单个百科条目
   * @param {String} url - 百科URL
   * @returns {Object} 同步结果
   */
  async syncSingle(url) {
    if (!url) {
      return returnError(400, '缺少URL参数');
    }
    
    if (!url.includes('clocktower-wiki.gstonegames.com')) {
      return returnError(400, '请输入钟楼百科的页面链接');
    }
    
    try {
      const result = await syncSinglePage(url);
      
      if (result.success) {
        return returnSuccess({ _id: result._id }, '同步成功');
      } else {
        return returnError(500, '同步失败: ' + result.error);
      }
    } catch (error) {
      console.error('[admin-wiki] 同步单个条目失败:', error);
      return returnError(500, '同步失败: ' + error.message);
    }
  },
  
  // ==================== 2. 角色管理 ====================
  
  /**
   * 获取角色列表
   * @param {String} keyword - 搜索关键词
   * @param {String} sync_status - 状态筛选（all/synced/unsynced/failed）
   * @param {Number} page - 页码
   * @param {Number} page_size - 每页数量
   */
  async getRoles({ keyword = '', sync_status = 'all', page = 1, page_size = 20 } = {}) {
    try {
      const collection = db.collection('wiki_role_list');
      
      // 构建查询条件
      let where = {};
      
      // 搜索条件
      if (keyword && keyword.trim()) {
        where.role_name = new RegExp(keyword.trim(), 'i');
      }
      
      // 状态筛选
      if (sync_status === 'synced') {
        where.is_synced = true;
        where.sync_status = 'success';
      } else if (sync_status === 'unsynced') {
        where.is_synced = false;
      } else if (sync_status === 'failed') {
        where.sync_status = 'failed';
      }
      
      console.log('[admin-wiki] 查询角色列表，条件:', where);
      
      // 查询总数
      const countRes = await collection.where(where).count();
      const total = countRes.total || 0;
      
      // 查询列表
      const listRes = await collection
        .where(where)
        .orderBy('created_at', 'desc')
        .skip((page - 1) * page_size)
        .limit(page_size)
        .get();
      
      const list = listRes.data || [];
      
      console.log(`[admin-wiki] 查询成功，共 ${total} 条，返回 ${list.length} 条`);
      
      return returnSuccess({
        list: list,
        total: total,
        page: page,
        page_size: page_size
      }, '查询成功');
      
    } catch (error) {
      console.error('[admin-wiki] 获取角色列表失败:', error);
      return returnError(500, '查询失败: ' + error.message);
    }
  },
  
  /**
   * 添加角色到同步列表
   * @param {Array} role_names - 角色名称数组
   */
  async addRoles(role_names) {
    if (!role_names || !Array.isArray(role_names) || role_names.length === 0) {
      return returnError(400, '请提供角色名称数组');
    }
    
    const collection = db.collection('wiki_role_list');
    
    try {
      const results = {
        success: [],
        failed: [],
        duplicate: []
      };
      
      for (const role_name of role_names) {
        const trimmedName = role_name.trim();
        
        if (!trimmedName) {
          results.failed.push({ role_name, reason: '角色名称不能为空' });
          continue;
        }
        
        // 检查是否已存在
        const existRes = await collection.where({ role_name: trimmedName }).count();
        const count = existRes.total || 0;
        
        if (count > 0) {
          results.duplicate.push(trimmedName);
          continue;
        }
        
        // 生成URL
        const role_url = `https://clocktower-wiki.gstonegames.com/index.php?title=${trimmedName}`;
        
        // 插入数据库
        const addRes = await collection.add({
          role_name: trimmedName,
          role_url: role_url,
          is_synced: false,
          sync_status: 'pending',
          created_at: Date.now(),
          updated_at: Date.now()
        });
        
        console.log('[admin-wiki] 插入结果:', addRes);
        
        if (addRes.id) {
          results.success.push(trimmedName);
        } else {
          results.failed.push({ role_name: trimmedName, reason: '数据库插入失败' });
        }
      }
      
      const message = `成功添加 ${results.success.length} 个角色` +
        (results.duplicate.length > 0 ? `，${results.duplicate.length} 个重复` : '') +
        (results.failed.length > 0 ? `，${results.failed.length} 个失败` : '');
      
      return returnSuccess(results, message);
      
    } catch (error) {
      console.error('[admin-wiki] 添加角色失败:', error);
      return returnError(500, '添加失败: ' + error.message);
    }
  },
  
  /**
   * 删除角色
   * @param {Array} role_ids - 角色ID数组
   */
  async deleteRoles(role_ids) {
    if (!role_ids || !Array.isArray(role_ids) || role_ids.length === 0) {
      return returnError(400, '请提供要删除的角色ID数组');
    }
    
    const collection = db.collection('wiki_role_list');
    
    try {
      const results = {
        success: [],
        failed: []
      };
      
      for (const role_id of role_ids) {
        try {
          const deleteRes = await collection.doc(role_id).remove();
          
          console.log('[admin-wiki] 删除结果:', deleteRes);
          
          if (deleteRes.deleted > 0) {
            results.success.push(role_id);
          } else {
            results.failed.push({ role_id, reason: '未找到该角色' });
          }
        } catch (err) {
          console.error('[admin-wiki] 删除失败:', err);
          results.failed.push({ role_id, reason: err.message });
        }
      }
      
      const message = `成功删除 ${results.success.length} 个角色` +
        (results.failed.length > 0 ? `，${results.failed.length} 个失败` : '');
      
      return returnSuccess(results, message);
      
    } catch (error) {
      console.error('[admin-wiki] 删除角色失败:', error);
      return returnError(500, '删除失败: ' + error.message);
    }
  },
  
  /**
   * 同步角色（批量）
   * @param {Array} role_ids - 角色ID数组
   */
  async syncRoles(role_ids) {
    if (!role_ids || !Array.isArray(role_ids) || role_ids.length === 0) {
      return returnError(400, '请提供要同步的角色ID数组');
    }
    
    const collection = db.collection('wiki_role_list');
    const start_time = Date.now();
    
    const results = {
      success: [],
      failed: []
    };
    
    try {
      for (const role_id of role_ids) {
        try {
          // 查询角色信息
          const roleRes = await collection.doc(role_id).get();
          
          if (!roleRes.data || roleRes.data.length === 0) {
            results.failed.push({ 
              role_id, 
              role_name: '未知',
              reason: '角色不存在' 
            });
            continue;
          }
          
          const role = roleRes.data[0];
          console.log(`[admin-wiki] 开始同步角色: ${role.role_name}`);
          
          // 调用内部同步方法
          const syncRes = await syncSinglePage(role.role_url);
          
          console.log(`[admin-wiki] 同步结果:`, syncRes);
          
          // 更新角色状态
          if (syncRes.success) {
            await collection.doc(role_id).update({
              is_synced: true,
              sync_status: 'success',
              last_sync_time: Date.now(),
              sync_error: dbCmd.remove(),
              updated_at: Date.now()
            });
            
            results.success.push({
              role_id,
              role_name: role.role_name
            });
            
            console.log(`[admin-wiki] ✓ ${role.role_name} 同步成功`);
          } else {
            await collection.doc(role_id).update({
              is_synced: false,
              sync_status: 'failed',
              last_sync_time: Date.now(),
              sync_error: syncRes.error,
              updated_at: Date.now()
            });
            
            results.failed.push({
              role_id,
              role_name: role.role_name,
              reason: syncRes.error
            });
            
            console.log(`[admin-wiki] ✗ ${role.role_name} 同步失败: ${syncRes.error}`);
          }
          
        } catch (err) {
          console.error('[admin-wiki] 同步角色失败:', err);
          results.failed.push({
            role_id,
            role_name: '未知',
            reason: err.message
          });
        }
      }
      
      const end_time = Date.now();
      const duration = Math.round((end_time - start_time) / 1000);
      
      // 写入同步日志
      try {
        const logCollection = db.collection('wiki_sync_logs');
        await logCollection.add({
          sync_type: 'roles',
          start_time: start_time,
          end_time: end_time,
          duration: duration,
          total_count: role_ids.length,
          success_count: results.success.length,
          failed_count: results.failed.length,
          status: results.failed.length === 0 ? 'success' : (results.success.length > 0 ? 'partial_success' : 'failed'),
          created_at: Date.now()
        });
        console.log('[admin-wiki] 同步日志已写入');
      } catch (logError) {
        console.error('[admin-wiki] 写入日志失败:', logError);
      }
      
      const message = `同步完成：成功 ${results.success.length} 个，失败 ${results.failed.length} 个，耗时 ${duration} 秒`;
      
      return returnSuccess({
        total_count: role_ids.length,
        success_count: results.success.length,
        failed_count: results.failed.length,
        duration: duration,
        success: results.success,
        failed: results.failed
      }, message);
      
    } catch (error) {
      console.error('[admin-wiki] 同步角色失败:', error);
      return returnError(500, '同步失败: ' + error.message);
    }
  },
  
  // ==================== 3. 同步日志 ====================
  
  /**
   * 获取同步日志列表
   * @param {Number} page - 页码
   * @param {Number} page_size - 每页数量
   */
  async getSyncLogs({ page = 1, page_size = 20 } = {}) {
    try {
      const collection = db.collection('wiki_sync_logs');
      
      // 查询总数
      const countRes = await collection.count();
      const total = countRes.total || 0;
      
      // 查询列表
      const listRes = await collection
        .orderBy('start_time', 'desc')
        .skip((page - 1) * page_size)
        .limit(page_size)
        .get();
      
      const list = listRes.data || [];
      
      return returnSuccess({
        list: list,
        total: total,
        page: page,
        page_size: page_size
      }, '查询成功');
      
    } catch (error) {
      console.error('[admin-wiki] 获取同步日志失败:', error);
      return returnError(500, '查询失败: ' + error.message);
    }
  },
  
  /**
   * 获取百科统计
   */
  async getWikiStats() {
    try {
      const [entriesRes, rolesRes, syncedRes, failedRes] = await Promise.all([
        db.collection('wiki_entries').count(),
        db.collection('wiki_role_list').count(),
        db.collection('wiki_role_list').where({ is_synced: true }).count(),
        db.collection('wiki_role_list').where({ sync_status: 'failed' }).count()
      ]);
      
      return returnSuccess({
        total_entries: entriesRes.total,
        total_roles: rolesRes.total,
        synced_roles: syncedRes.total,
        failed_roles: failedRes.total,
        pending_roles: rolesRes.total - syncedRes.total - failedRes.total
      });
      
    } catch (error) {
      console.error('[admin-wiki] 获取百科统计失败:', error);
      return returnError(500, '获取失败: ' + error.message);
    }
  }
};

