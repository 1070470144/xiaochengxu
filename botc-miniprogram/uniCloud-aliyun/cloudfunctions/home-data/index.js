'use strict';

/**
 * 首页数据云函数
 * 获取平台统计数据、热门剧本、最新拼车
 */
exports.main = async (event, context) => {
  const db = uniCloud.database();
  const _ = db.command;
  
  try {
    // 1. 获取统计数据
    const [scriptCount, carpoolCount, userCount] = await Promise.all([
      // 剧本总数
      db.collection('botc-scripts')
        .where({
          status: _.eq(1)
        })
        .count(),
      
      // 活跃拼车数（招募中）
      db.collection('botc-carpool-rooms')
        .where({
          status: _.in([1, 2]), // 招募中或已满员
          deleted_at: _.exists(false)
        })
        .count(),
      
      // 用户总数
      db.collection('uni-id-users')
        .count()
    ]);
    
    // 2. 获取热门剧本（按评分和浏览量排序）
    const hotScriptsRes = await db.collection('botc-scripts')
      .where({
        status: _.eq(1)
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
    const latestCarpoolsRes = await db.collection('botc-carpool-rooms')
      .where({
        status: _.in([1, 2]), // 招募中或已满员
        deleted_at: _.exists(false)
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
    
    return {
      code: 0,
      message: '获取首页数据成功',
      data: {
        stats: {
          scriptCount: scriptCount.total || 0,
          carpoolCount: carpoolCount.total || 0,
          userCount: userCount.total || 0
        },
        hotScripts,
        latestCarpools
      }
    };
    
  } catch (error) {
    console.error('获取首页数据失败:', error);
    return {
      code: -1,
      message: '获取首页数据失败：' + error.message,
      data: {
        stats: {
          scriptCount: 0,
          carpoolCount: 0,
          userCount: 0
        },
        hotScripts: [],
        latestCarpools: []
      }
    };
  }
};

