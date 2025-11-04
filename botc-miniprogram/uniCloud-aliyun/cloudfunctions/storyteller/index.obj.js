'use strict';

// ==================== 工具函数（外部） ====================

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
    
    const methodName = this.getMethodName();
    console.log(`[storyteller] 调用方法: ${methodName}`);
  },
  
  /**
   * 1. 获取说书人列表
   * @param {Object} options - 查询选项
   * @param {Number} options.page - 页码
   * @param {Number} options.pageSize - 每页数量
   * @param {String} options.filter - 筛选条件：all/certified/high_rating/nearby
   * @param {String} options.keyword - 搜索关键词
   */
  async getList(options = {}) {
    const {
      page = 1,
      pageSize = 10,
      filter = 'all',
      keyword = ''
    } = options;
    
    try {
      // 构建查询条件
      let whereCondition = {
        status: this.dbCmd.eq(1), // 状态正常
        deleted_at: this.dbCmd.exists(false)
      };
      
      // 关键词搜索（注意：原云函数这里搜索的是 user.nickname，这在单集合查询中不可行）
      // 我们改为搜索 introduction 字段
      if (keyword) {
        whereCondition.introduction = new RegExp(keyword, 'i');
      }
      
      // 筛选条件
      switch (filter) {
        case 'certified':
          // 认证说书人
          whereCondition.is_certified = this.dbCmd.eq(true);
          break;
        case 'high_rating':
          // 高评分（4.5分以上）
          whereCondition.rating = this.dbCmd.gte(4.5);
          break;
        case 'nearby':
          // 附近（需要用户位置，这里暂时按地区）
          // 实际应用中可以基于地理位置查询
          break;
      }
      
      // 查询说书人列表
      const result = await this.db.collection('botc-storyteller-profiles')
        .where(whereCondition)
        .field({
          _id: true,
          user_id: true,
          introduction: true,
          is_certified: true,
          rating: true,
          review_count: true,
          game_count: true,
          specialties: true,
          location: true,
          tags: true,
          created_at: true
        })
        .orderBy('is_certified', 'desc')
        .orderBy('rating', 'desc')
        .orderBy('game_count', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get();
      
      // 获取用户信息
      const userIds = result.data.map(item => item.user_id);
      
      let userMap = {};
      if (userIds.length > 0) {
        const usersResult = await this.db.collection('uni-id-users')
          .where({
            _id: this.dbCmd.in(userIds)
          })
          .field({
            _id: true,
            nickname: true,
            avatar: true
          })
          .get();
        
        // 组装用户信息映射
        usersResult.data.forEach(user => {
          userMap[user._id] = user;
        });
      }
      
      // 组装数据
      const list = result.data.map(storyteller => ({
        ...storyteller,
        user: userMap[storyteller.user_id] || {}
      }));
      
      console.log(`[storyteller] getList 成功，找到 ${list.length} 条记录`);
      
      return returnSuccess({
        list,
        total: list.length,
        page,
        pageSize
      }, '获取说书人列表成功');
      
    } catch (error) {
      console.error('[storyteller] getList 失败:', error);
      return returnError(-1, '获取说书人列表失败：' + error.message, {
        list: [],
        total: 0,
        page,
        pageSize
      });
    }
  },
  
  /**
   * 2. 获取说书人详情
   * @param {String} storytellerId - 说书人ID
   */
  async getDetail(storytellerId) {
    if (!storytellerId) {
      return returnError(-1, '缺少说书人ID');
    }
    
    try {
      // 获取说书人信息
      const storytellerRes = await this.db.collection('botc-storyteller-profiles')
        .where({
          _id: storytellerId,
          status: 1,
          deleted_at: this.dbCmd.exists(false)
        })
        .get();
      
      if (storytellerRes.data.length === 0) {
        return returnError(-1, '说书人不存在');
      }
      
      const storyteller = storytellerRes.data[0];
      
      // 获取用户信息
      const userRes = await this.db.collection('uni-id-users')
        .where({
          _id: storyteller.user_id
        })
        .field({
          _id: true,
          nickname: true,
          avatar: true
        })
        .get();
      
      const user = userRes.data[0] || {};
      
      // 组装数据
      const detail = {
        ...storyteller,
        user
      };
      
      console.log('[storyteller] getDetail 成功');
      
      return returnSuccess(detail, '获取说书人详情成功');
      
    } catch (error) {
      console.error('[storyteller] getDetail 失败:', error);
      return returnError(-1, '获取说书人详情失败：' + error.message);
    }
  },
  
  /**
   * 3. 获取评价列表
   * @param {String} storytellerId - 说书人ID
   * @param {Number} page - 页码
   * @param {Number} pageSize - 每页数量
   */
  async getReviews(storytellerId, page = 1, pageSize = 10) {
    if (!storytellerId) {
      return returnError(-1, '缺少说书人ID', { list: [], total: 0 });
    }
    
    try {
      // 获取评价列表
      const reviewsRes = await this.db.collection('botc-storyteller-reviews')
        .where({
          storyteller_id: storytellerId,
          deleted_at: this.dbCmd.exists(false)
        })
        .orderBy('created_at', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get();
      
      // 获取评价用户信息
      const userIds = reviewsRes.data.map(item => item.user_id);
      
      let userMap = {};
      if (userIds.length > 0) {
        const usersRes = await this.db.collection('uni-id-users')
          .where({
            _id: this.dbCmd.in(userIds)
          })
          .field({
            _id: true,
            nickname: true,
            avatar: true
          })
          .get();
        
        // 组装用户信息映射
        usersRes.data.forEach(user => {
          userMap[user._id] = user;
        });
      }
      
      // 组装数据
      const list = reviewsRes.data.map(review => ({
        ...review,
        user: userMap[review.user_id] || {}
      }));
      
      console.log(`[storyteller] getReviews 成功，找到 ${list.length} 条记录`);
      
      return returnSuccess({
        list,
        total: list.length,
        page,
        pageSize
      }, '获取评价列表成功');
      
    } catch (error) {
      console.error('[storyteller] getReviews 失败:', error);
      return returnError(-1, '获取评价列表失败：' + error.message, { list: [], total: 0 });
    }
  },
  
  /**
   * 4. 计算热度分数
   * @param {String} userId - 用户ID（可选，不传则计算所有认证说书人）
   */
  async calculateHeat(userId = null) {
    try {
      console.log('=== 开始计算说书人热度 ===');
      
      // 查询需要计算热度的用户
      let whereCondition = { storyteller_certified: true };
      if (userId) {
        whereCondition._id = userId;
      }
      
      const usersRes = await this.db.collection('uni-id-users')
        .where(whereCondition)
        .field({
          _id: true,
          nickname: true,
          followers_count: true,
          storyteller_stats: true
        })
        .get();
      
      const users = usersRes.data || [];
      console.log(`找到 ${users.length} 个认证说书人`);
      
      if (users.length === 0) {
        return returnSuccess({ count: 0 }, '没有需要计算的说书人');
      }
      
      // 逐个计算热度
      const updatePromises = users.map(async (user) => {
        try {
          // 获取该说书人的剧本统计
          const scriptsRes = await this.db.collection('botc-scripts')
            .where({
              creator_id: user._id,
              status: 1  // 只统计已发布的剧本
            })
            .field({
              download_count: true,
              rating: true,
              rating_count: true
            })
            .get();
          
          const scripts = scriptsRes.data || [];
          
          // 计算总下载量和总评分
          let totalDownloads = 0;
          let totalRating = 0;
          
          scripts.forEach(script => {
            totalDownloads += script.download_count || 0;
            if (script.rating_count > 0) {
              totalRating += (script.rating || 0) * (script.rating_count || 0);
            }
          });
          
          // 计算热度分数
          const fansCount = user.followers_count || 0;
          const scriptCount = scripts.length;
          
          const heatScore = 
            fansCount * 10 +       // 每个粉丝 10 分
            scriptCount * 50 +     // 每个剧本 50 分
            totalDownloads * 1 +   // 每次下载 1 分
            totalRating * 20;      // 每个评分 20 分
          
          console.log(`${user.nickname}: 粉丝${fansCount} 剧本${scriptCount} 下载${totalDownloads} 评分${totalRating.toFixed(1)} = 热度${heatScore}`);
          
          // 更新热度分数
          await this.db.collection('uni-id-users')
            .doc(user._id)
            .update({
              'storyteller_stats.heat_score': Math.round(heatScore)
            });
          
          return {
            user_id: user._id,
            nickname: user.nickname,
            heat_score: Math.round(heatScore)
          };
          
        } catch (error) {
          console.error(`计算 ${user.nickname} 的热度失败:`, error);
          return null;
        }
      });
      
      const results = await Promise.all(updatePromises);
      const successCount = results.filter(r => r !== null).length;
      
      console.log(`=== 计算完成：成功 ${successCount}/${users.length} ===`);
      
      return returnSuccess({
        count: successCount,
        results: results.filter(r => r !== null)
      }, `成功计算 ${successCount} 个说书人的热度`);
      
    } catch (error) {
      console.error('[storyteller] calculateHeat 失败:', error);
      return returnError(500, '计算失败：' + error.message);
    }
  }
};

