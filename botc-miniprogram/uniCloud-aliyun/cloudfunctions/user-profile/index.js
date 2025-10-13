'use strict';
const db = uniCloud.database();
const $ = db.command;

exports.main = async (event, context) => {
  const { user_id, token } = event;
  
  // 验证参数
  if (!user_id) {
    return {
      code: 400,
      message: '用户ID不能为空'
    };
  }
  
  // 获取当前登录用户ID（如果已登录）
  let currentUserId = null;
  if (token) {
    currentUserId = token.split('_')[0];
  }
  
  try {
    // 1. 获取用户基本信息
    const userResult = await db.collection('uni-id-users')
      .doc(user_id)
      .field({
        _id: true,
        nickname: true,
        avatar: true,
        gender: true,
        level: true,
        exp: true,
        register_date: true,
        followers_count: true,
        following_count: true,
        background_image: true
      })
      .get();
    
    if (!userResult.data || userResult.data.length === 0) {
      return {
        code: 404,
        message: '用户不存在'
      };
    }
    
    const userInfo = userResult.data[0];
    
    console.log('🔍 查询到用户基本信息：', {
      _id: userInfo._id,
      nickname: userInfo.nickname,
      background_image: userInfo.background_image
    });
    
    // 2. 统计用户数据
    // 帖子数量
    const postsCountResult = await db.collection('botc-posts')
      .where({
        user_id: user_id,
        status: 1
      })
      .count();
    
    // 剧本评价数量
    const reviewsCountResult = await db.collection('botc-script-reviews')
      .where({
        user_id: user_id,
        status: 1
      })
      .count();
    
    // 拼车数量
    const carpoolCountResult = await db.collection('botc-carpool-rooms')
      .where({
        host_id: user_id,
        status: $.neq(0)
      })
      .count();
    
    // 获赞数量（帖子点赞）
    const likesCountResult = await db.collection('botc-post-likes')
      .where({
        target_user_id: user_id,
        type: 1
      })
      .count();
    
    // 3. 如果当前用户已登录，获取关注状态
    let isFollowing = false;
    let isMutual = false;
    
    if (currentUserId && currentUserId !== user_id) {
      // 检查是否已关注
      const followResult = await db.collection('botc-user-follows')
        .where({
          follower_id: currentUserId,
          following_id: user_id
        })
        .count();
      
      isFollowing = followResult.total > 0;
      
      // 检查是否互关
      if (isFollowing) {
        const mutualResult = await db.collection('botc-user-follows')
          .where({
            follower_id: user_id,
            following_id: currentUserId
          })
          .count();
        
        isMutual = mutualResult.total > 0;
      }
    }
    
    // 4. 获取最近发布的帖子（3条）
    const recentPostsResult = await db.collection('botc-posts')
      .where({
        user_id: user_id,
        status: 1
      })
      .orderBy('created_at', 'desc')
      .limit(3)
      .field({
        _id: true,
        content: true,
        images: true,
        like_count: true,
        comment_count: true,
        created_at: true
      })
      .get();
    
    // 5. 获取最近评价的剧本（3条）
    const recentReviewsResult = await db.collection('botc-script-reviews')
      .aggregate()
      .match({
        user_id: user_id,
        status: 1
      })
      .sort({ created_at: -1 })
      .limit(3)
      .lookup({
        from: 'botc-scripts',
        localField: 'script_id',
        foreignField: '_id',
        as: 'script'
      })
      .addFields({
        script: { $arrayElemAt: ['$script', 0] }
      })
      .end();
    
    const processedReviews = (recentReviewsResult.data || []).map(review => ({
      _id: review._id,
      script_id: review.script_id,
      script_name: review.script?.title || '未知剧本',
      script_cover: review.script?.cover_image || '',
      rating: review.rating,
      content: review.content,
      created_at: review.created_at
    }));
    
    // 组合返回数据
    const responseData = {
      user: {
        _id: userInfo._id,
        nickname: userInfo.nickname || '未知用户',
        avatar: userInfo.avatar || '',
        gender: userInfo.gender || 0,
        level: userInfo.level || 1,
        exp: userInfo.exp || 0,
        register_date: userInfo.register_date,
        followers_count: userInfo.followers_count || 0,
        following_count: userInfo.following_count || 0,
        background_image: userInfo.background_image || ''
      },
      stats: {
        posts_count: postsCountResult.total || 0,
        reviews_count: reviewsCountResult.total || 0,
        carpool_count: carpoolCountResult.total || 0,
        likes_count: likesCountResult.total || 0
      },
      follow_status: {
        is_following: isFollowing,
        is_mutual: isMutual,
        is_self: currentUserId === user_id
      },
      recent_posts: recentPostsResult.data || [],
      recent_reviews: processedReviews
    };
    
    console.log('✅ 返回用户主页数据，背景图片：', responseData.user.background_image);
    
    return {
      code: 0,
      message: 'success',
      data: responseData
    };
    
  } catch (error) {
    console.error('获取用户主页失败：', error);
    return {
      code: 500,
      message: '获取用户主页失败：' + error.message
    };
  }
};

