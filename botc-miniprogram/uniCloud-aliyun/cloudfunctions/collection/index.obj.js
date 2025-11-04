// Collection 云对象 - 收藏和浏览历史管理
'use strict';

const db = uniCloud.database();
const dbCmd = db.command;

// ==================== 工具函数 ====================

/**
 * 解析 token 获取用户ID
 */
function parseUserId(token) {
  if (!token) return null;
  const parts = token.split('_');
  return parts[0] || null;
}

/**
 * 验证用户认证
 */
function checkAuth(userId) {
  if (!userId) {
    throw new Error('请先登录');
  }
}

/**
 * 验证目标类型（收藏）
 */
function validateFavoriteType(targetType) {
  const validTypes = ['script', 'post'];
  if (!validTypes.includes(targetType)) {
    throw new Error('无效的目标类型，仅支持: script, post');
  }
}

/**
 * 验证目标类型（历史）
 */
function validateHistoryType(targetType) {
  const validTypes = ['script', 'post', 'carpool'];
  if (!validTypes.includes(targetType)) {
    throw new Error('无效的目标类型，仅支持: script, post, carpool');
  }
}

/**
 * 返回成功结果
 */
function returnSuccess(message, data = null) {
  const result = {
    code: 0,
    message: message || 'success'
  };
  if (data !== null) {
    result.data = data;
  }
  return result;
}

// ==================== 云对象定义 ====================

module.exports = {
  /**
   * 前置钩子 - 统一认证和初始化
   */
  _before() {
    // 获取客户端信息
    this.clientInfo = this.getClientInfo();
    
    // 解析用户ID
    const token = this.clientInfo.uniIdToken;
    this.currentUserId = parseUserId(token);
    
    console.log('[Collection] 用户ID:', this.currentUserId);
  },
  
  /**
   * 后置钩子 - 统一返回格式处理
   */
  _after(error, result) {
    if (error) {
      console.error('[Collection] 错误:', error);
      return {
        code: error.code || 500,
        message: error.message || '操作失败'
      };
    }
    return result;
  },
  
  // ==================== 收藏功能 ====================
  
  /**
   * 添加收藏
   * @param {String} targetType - 目标类型：'script' | 'post'
   * @param {String} targetId - 目标ID
   */
  async addFavorite(targetType, targetId) {
    console.log('[Collection] addFavorite:', { targetType, targetId });
    
    try {
      // 验证用户登录
      checkAuth(this.currentUserId);
      
      // 验证参数
      if (!targetType || !targetId) {
        throw new Error('缺少必要参数');
      }
      
      // 验证目标类型
      validateFavoriteType(targetType);
      
      // 查询是否已收藏
      const existingResult = await db.collection('botc-favorites')
        .where({
          user_id: this.currentUserId,
          target_type: targetType,
          target_id: targetId
        })
        .get();
      
      if (existingResult.data && existingResult.data.length > 0) {
        throw new Error('已收藏过了');
      }
      
      // 创建收藏记录
      const addResult = await db.collection('botc-favorites')
        .add({
          user_id: this.currentUserId,
          target_type: targetType,
          target_id: targetId,
          created_at: new Date()
        });
      
      console.log('[Collection] 收藏成功, ID:', addResult.id);
      
      return returnSuccess('收藏成功', {
        favoriteId: addResult.id
      });
      
    } catch (error) {
      console.error('[Collection] addFavorite 失败:', error);
      throw error;
    }
  },
  
  /**
   * 取消收藏
   * @param {String} targetType - 目标类型：'script' | 'post'
   * @param {String} targetId - 目标ID
   */
  async removeFavorite(targetType, targetId) {
    console.log('[Collection] removeFavorite:', { targetType, targetId });
    
    try {
      // 验证用户登录
      checkAuth(this.currentUserId);
      
      // 验证参数
      if (!targetType || !targetId) {
        throw new Error('缺少必要参数');
      }
      
      // 删除收藏记录
      const result = await db.collection('botc-favorites')
        .where({
          user_id: this.currentUserId,
          target_type: targetType,
          target_id: targetId
        })
        .remove();
      
      if (result.deleted > 0) {
        console.log('[Collection] 取消收藏成功');
        return returnSuccess('取消收藏成功');
      } else {
        console.warn('[Collection] 未找到收藏记录');
        throw new Error('未找到收藏记录');
      }
      
    } catch (error) {
      console.error('[Collection] removeFavorite 失败:', error);
      throw error;
    }
  },
  
  /**
   * 获取收藏列表
   * @param {Object} options - 查询选项
   * @param {Number} options.page - 页码，默认1
   * @param {Number} options.pageSize - 每页数量，默认10
   * @param {String} options.targetType - 可选，筛选类型：'script' | 'post'
   */
  async getFavorites(options = {}) {
    console.log('[Collection] getFavorites:', options);
    
    try {
      // 验证用户登录
      checkAuth(this.currentUserId);
      
      const { page = 1, pageSize = 10, targetType } = options;
      
      // 构建查询条件
      const whereCondition = { user_id: this.currentUserId };
      if (targetType) {
        validateFavoriteType(targetType);
        whereCondition.target_type = targetType;
      }
      
      // 查询收藏列表
      const favoritesResult = await db.collection('botc-favorites')
        .where(whereCondition)
        .orderBy('created_at', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get();
      
      const favorites = favoritesResult.data || [];
      console.log('[Collection] 查询到收藏记录数:', favorites.length);
      
      if (favorites.length === 0) {
        return returnSuccess('success', {
          list: [],
          total: 0,
          hasMore: false
        });
      }
      
      // 按类型分组收藏项
      const scriptIds = favorites
        .filter(f => f.target_type === 'script')
        .map(f => f.target_id);
      const postIds = favorites
        .filter(f => f.target_type === 'post')
        .map(f => f.target_id);
      
      // 查询剧本信息
      let scripts = [];
      if (scriptIds.length > 0) {
        const scriptsResult = await db.collection('botc-scripts')
          .where({
            _id: dbCmd.in(scriptIds)
          })
          .field({
            _id: true,
            title: true,
            cover: true,
            author: true,
            player_count: true,
            difficulty: true
          })
          .get();
        scripts = scriptsResult.data || [];
      }
      
      // 查询帖子信息
      let posts = [];
      if (postIds.length > 0) {
        const postsResult = await db.collection('botc-posts')
          .where({
            _id: dbCmd.in(postIds)
          })
          .field({
            _id: true,
            content: true,
            images: true,
            like_count: true,
            comment_count: true
          })
          .get();
        posts = postsResult.data || [];
      }
      
      // 创建映射
      const scriptsMap = {};
      scripts.forEach(script => {
        scriptsMap[script._id] = script;
      });
      
      const postsMap = {};
      posts.forEach(post => {
        postsMap[post._id] = post;
      });
      
      // 组合数据
      const list = favorites.map(fav => {
        let targetData = {};
        
        if (fav.target_type === 'script') {
          const script = scriptsMap[fav.target_id] || {};
          targetData = {
            id: script._id,
            title: script.title,
            cover: script.cover,
            author: script.author,
            playerCount: script.player_count,
            difficulty: script.difficulty
          };
        } else if (fav.target_type === 'post') {
          const post = postsMap[fav.target_id] || {};
          targetData = {
            id: post._id,
            content: post.content,
            images: post.images,
            likeCount: post.like_count,
            commentCount: post.comment_count
          };
        }
        
        return {
          favoriteId: fav._id,
          targetType: fav.target_type,
          targetData: targetData,
          createdAt: fav.created_at
        };
      });
      
      // 获取总数
      const countResult = await db.collection('botc-favorites')
        .where(whereCondition)
        .count();
      
      const total = countResult.total;
      const hasMore = page * pageSize < total;
      
      console.log('[Collection] 返回数据:', { total, hasMore, listLength: list.length });
      
      return returnSuccess('success', {
        list: list,
        total: total,
        hasMore: hasMore
      });
      
    } catch (error) {
      console.error('[Collection] getFavorites 失败:', error);
      throw error;
    }
  },
  
  /**
   * 检查收藏状态
   * @param {String} targetType - 目标类型：'script' | 'post'
   * @param {String} targetId - 目标ID
   */
  async checkFavoriteStatus(targetType, targetId) {
    console.log('[Collection] checkFavoriteStatus:', { targetType, targetId });
    
    try {
      // 验证用户登录
      checkAuth(this.currentUserId);
      
      // 验证参数
      if (!targetType || !targetId) {
        throw new Error('缺少必要参数');
      }
      
      // 验证目标类型
      validateFavoriteType(targetType);
      
      // 查询是否已收藏
      const existingResult = await db.collection('botc-favorites')
        .where({
          user_id: this.currentUserId,
          target_type: targetType,
          target_id: targetId
        })
        .count();
      
      const isFavorited = existingResult.total > 0;
      console.log('[Collection] 收藏状态:', isFavorited);
      
      return returnSuccess('success', {
        isFavorited: isFavorited
      });
      
    } catch (error) {
      console.error('[Collection] checkFavoriteStatus 失败:', error);
      throw error;
    }
  },
  
  // ==================== 浏览历史功能 ====================
  
  /**
   * 添加/更新浏览历史
   * @param {String} targetType - 目标类型：'script' | 'post' | 'carpool'
   * @param {String} targetId - 目标ID
   */
  async addHistory(targetType, targetId) {
    console.log('[Collection] addHistory:', { targetType, targetId });
    
    try {
      // 验证用户登录
      checkAuth(this.currentUserId);
      
      // 验证参数
      if (!targetType || !targetId) {
        throw new Error('缺少必要参数');
      }
      
      // 验证目标类型
      validateHistoryType(targetType);
      
      // 查询是否已存在记录
      const existingResult = await db.collection('botc-browse-history')
        .where({
          user_id: this.currentUserId,
          target_type: targetType,
          target_id: targetId
        })
        .get();
      
      const now = new Date();
      
      if (existingResult.data && existingResult.data.length > 0) {
        // 已存在，更新时间
        console.log('[Collection] 更新历史记录时间');
        await db.collection('botc-browse-history')
          .doc(existingResult.data[0]._id)
          .update({
            updated_at: now
          });
      } else {
        // 不存在，创建新记录
        console.log('[Collection] 创建新历史记录');
        await db.collection('botc-browse-history')
          .add({
            user_id: this.currentUserId,
            target_type: targetType,
            target_id: targetId,
            created_at: now,
            updated_at: now
          });
      }
      
      console.log('[Collection] 历史记录成功');
      return returnSuccess('记录成功');
      
    } catch (error) {
      console.error('[Collection] addHistory 失败:', error);
      throw error;
    }
  },
  
  /**
   * 获取浏览历史列表
   * @param {Object} options - 查询选项
   * @param {Number} options.page - 页码，默认1
   * @param {Number} options.pageSize - 每页数量，默认10
   * @param {String} options.targetType - 可选，筛选类型：'script' | 'post' | 'carpool'
   */
  async getHistory(options = {}) {
    console.log('[Collection] getHistory:', options);
    
    try {
      // 验证用户登录
      checkAuth(this.currentUserId);
      
      const { page = 1, pageSize = 10, targetType } = options;
      
      // 构建查询条件
      const whereCondition = { user_id: this.currentUserId };
      if (targetType) {
        validateHistoryType(targetType);
        whereCondition.target_type = targetType;
      }
      
      // 查询浏览历史
      const historyResult = await db.collection('botc-browse-history')
        .where(whereCondition)
        .orderBy('updated_at', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get();
      
      const history = historyResult.data || [];
      console.log('[Collection] 查询到历史记录数:', history.length);
      
      if (history.length === 0) {
        return returnSuccess('success', {
          list: [],
          total: 0,
          hasMore: false
        });
      }
      
      // 按类型分组历史记录
      const scriptIds = history
        .filter(h => h.target_type === 'script')
        .map(h => h.target_id);
      const postIds = history
        .filter(h => h.target_type === 'post')
        .map(h => h.target_id);
      const carpoolIds = history
        .filter(h => h.target_type === 'carpool')
        .map(h => h.target_id);
      
      // 查询剧本信息
      let scripts = [];
      if (scriptIds.length > 0) {
        const scriptsResult = await db.collection('botc-scripts')
          .where({
            _id: dbCmd.in(scriptIds)
          })
          .field({
            _id: true,
            title: true,
            cover: true,
            author: true,
            player_count: true
          })
          .get();
        scripts = scriptsResult.data || [];
      }
      
      // 查询帖子信息
      let posts = [];
      if (postIds.length > 0) {
        const postsResult = await db.collection('botc-posts')
          .where({
            _id: dbCmd.in(postIds)
          })
          .field({
            _id: true,
            content: true,
            images: true
          })
          .get();
        posts = postsResult.data || [];
      }
      
      // 查询拼车信息
      let carpools = [];
      if (carpoolIds.length > 0) {
        const carpoolsResult = await db.collection('botc-carpool-rooms')
          .where({
            _id: dbCmd.in(carpoolIds)
          })
          .field({
            _id: true,
            title: true,
            game_time: true,
            location: true,
            status: true
          })
          .get();
        carpools = carpoolsResult.data || [];
      }
      
      // 创建映射
      const scriptsMap = {};
      scripts.forEach(script => {
        scriptsMap[script._id] = script;
      });
      
      const postsMap = {};
      posts.forEach(post => {
        postsMap[post._id] = post;
      });
      
      const carpoolsMap = {};
      carpools.forEach(carpool => {
        carpoolsMap[carpool._id] = carpool;
      });
      
      // 组合数据
      const list = history.map(item => {
        let targetData = {};
        
        if (item.target_type === 'script') {
          const script = scriptsMap[item.target_id] || {};
          targetData = {
            id: script._id,
            title: script.title,
            cover: script.cover,
            author: script.author,
            playerCount: script.player_count
          };
        } else if (item.target_type === 'post') {
          const post = postsMap[item.target_id] || {};
          targetData = {
            id: post._id,
            content: post.content,
            images: post.images
          };
        } else if (item.target_type === 'carpool') {
          const carpool = carpoolsMap[item.target_id] || {};
          targetData = {
            id: carpool._id,
            title: carpool.title,
            gameTime: carpool.game_time,
            location: carpool.location,
            status: carpool.status
          };
        }
        
        return {
          historyId: item._id,
          targetType: item.target_type,
          targetData: targetData,
          updatedAt: item.updated_at
        };
      });
      
      // 获取总数
      const countResult = await db.collection('botc-browse-history')
        .where(whereCondition)
        .count();
      
      const total = countResult.total;
      const hasMore = page * pageSize < total;
      
      console.log('[Collection] 返回数据:', { total, hasMore, listLength: list.length });
      
      return returnSuccess('success', {
        list: list,
        total: total,
        hasMore: hasMore
      });
      
    } catch (error) {
      console.error('[Collection] getHistory 失败:', error);
      throw error;
    }
  }
};

