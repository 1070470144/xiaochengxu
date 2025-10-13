'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
  const { page = 1, page_size = 10, token } = event;
  
  // 验证token
  if (!token) {
    return {
      code: 401,
      message: '请先登录'
    };
  }
  
  // 简化的token验证
  const userId = token.split('_')[0];
  if (!userId) {
    return {
      code: 401,
      message: 'Token无效'
    };
  }
  
  try {
    // 查询用户的浏览历史
    const historyResult = await db.collection('botc-browse-history')
      .where({
        user_id: userId
      })
      .orderBy('updated_at', 'desc')
      .skip((page - 1) * page_size)
      .limit(page_size)
      .get();
    
    const history = historyResult.data || [];
    
    if (history.length === 0) {
      return {
        code: 0,
        message: 'success',
        data: {
          list: [],
          total: 0
        }
      };
    }
    
    // 按类型分组历史记录
    const scriptIds = history.filter(h => h.target_type === 'script').map(h => h.target_id);
    const postIds = history.filter(h => h.target_type === 'post').map(h => h.target_id);
    const carpoolIds = history.filter(h => h.target_type === 'carpool').map(h => h.target_id);
    
    // 查询剧本信息
    let scripts = [];
    if (scriptIds.length > 0) {
      const scriptsResult = await db.collection('botc-scripts')
        .where({
          _id: db.command.in(scriptIds)
        })
        .get();
      scripts = scriptsResult.data || [];
    }
    
    // 查询帖子信息
    let posts = [];
    if (postIds.length > 0) {
      const postsResult = await db.collection('botc-posts')
        .where({
          _id: db.command.in(postIds)
        })
        .get();
      posts = postsResult.data || [];
    }
    
    // 查询拼车信息
    let carpools = [];
    if (carpoolIds.length > 0) {
      const carpoolsResult = await db.collection('botc-carpool-rooms')
        .where({
          _id: db.command.in(carpoolIds)
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
          type: item.target_type
        };
      } else if (item.target_type === 'post') {
        const post = postsMap[item.target_id] || {};
        targetData = {
          id: post._id,
          content: post.content,
          images: post.images,
          type: item.target_type
        };
      } else if (item.target_type === 'carpool') {
        const carpool = carpoolsMap[item.target_id] || {};
        targetData = {
          id: carpool._id,
          title: carpool.title,
          game_time: carpool.game_time,
          location: carpool.location,
          type: item.target_type
        };
      }
      
      return {
        history_id: item._id,
        target_type: item.target_type,
        target_data: targetData,
        updated_at: item.updated_at
      };
    });
    
    // 获取总数
    const countResult = await db.collection('botc-browse-history')
      .where({
        user_id: userId
      })
      .count();
    
    return {
      code: 0,
      message: 'success',
      data: {
        list: list,
        total: countResult.total
      }
    };
    
  } catch (error) {
    console.error('查询浏览历史失败：', error);
    return {
      code: 500,
      message: '查询失败：' + error.message
    };
  }
};

