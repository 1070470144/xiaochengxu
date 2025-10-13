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
    // 查询用户的收藏记录
    const favoritesResult = await db.collection('botc-favorites')
      .where({
        user_id: userId
      })
      .orderBy('created_at', 'desc')
      .skip((page - 1) * page_size)
      .limit(page_size)
      .get();
    
    const favorites = favoritesResult.data || [];
    
    if (favorites.length === 0) {
      return {
        code: 0,
        message: 'success',
        data: {
          list: [],
          total: 0
        }
      };
    }
    
    // 按类型分组收藏项
    const scriptIds = favorites.filter(f => f.target_type === 'script').map(f => f.target_id);
    const postIds = favorites.filter(f => f.target_type === 'post').map(f => f.target_id);
    
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
          type: fav.target_type
        };
      } else if (fav.target_type === 'post') {
        const post = postsMap[fav.target_id] || {};
        targetData = {
          id: post._id,
          content: post.content,
          images: post.images,
          type: fav.target_type
        };
      }
      
      return {
        favorite_id: fav._id,
        target_type: fav.target_type,
        target_data: targetData,
        created_at: fav.created_at
      };
    });
    
    // 获取总数
    const countResult = await db.collection('botc-favorites')
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
    console.error('查询收藏列表失败：', error);
    return {
      code: 500,
      message: '查询失败：' + error.message
    };
  }
};

