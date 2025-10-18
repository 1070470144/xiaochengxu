'use strict';

/**
 * 云函数：角色点赞/取消点赞
 */
exports.main = async (event, context) => {
  const { role_id } = event;
  const { uid } = context.CLIENTUA ? await uniCloud.getClientInfo(context) : { uid: null };
  
  if (!uid) {
    return {
      code: 401,
      message: '请先登录'
    };
  }
  
  if (!role_id) {
    return {
      code: 400,
      message: '缺少角色ID'
    };
  }
  
  const db = uniCloud.database();
  const dbCmd = db.command;
  
  try {
    // 检查是否已点赞
    const likeRes = await db.collection('wiki_role_likes')
      .where({
        user_id: uid,
        role_id: role_id
      })
      .count();
    
    const hasLiked = (likeRes.total || 0) > 0;
    
    if (hasLiked) {
      // 取消点赞
      await db.collection('wiki_role_likes')
        .where({
          user_id: uid,
          role_id: role_id
        })
        .remove();
      
      // 减少点赞数
      await db.collection('wiki_entries')
        .doc(role_id)
        .update({
          'stats.like_count': dbCmd.inc(-1)
        });
      
      return {
        code: 0,
        message: '已取消点赞',
        data: {
          is_liked: false
        }
      };
    } else {
      // 添加点赞
      await db.collection('wiki_role_likes').add({
        user_id: uid,
        role_id: role_id,
        created_at: Date.now()
      });
      
      // 增加点赞数
      await db.collection('wiki_entries')
        .doc(role_id)
        .update({
          'stats.like_count': dbCmd.inc(1)
        });
      
      return {
        code: 0,
        message: '点赞成功',
        data: {
          is_liked: true
        }
      };
    }
  } catch (error) {
    console.error('[wiki-role-toggle-like] 错误:', error);
    return {
      code: 500,
      message: '操作失败: ' + error.message
    };
  }
};

