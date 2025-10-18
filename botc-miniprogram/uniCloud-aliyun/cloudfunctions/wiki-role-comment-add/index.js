'use strict';

/**
 * 云函数：发表角色评论
 */
exports.main = async (event, context) => {
  const { role_id, content } = event;
  const clientInfo = context.CLIENTUA ? await uniCloud.getClientInfo(context) : {};
  const uid = clientInfo.uid || null;
  
  if (!uid) {
    return {
      code: 401,
      message: '请先登录'
    };
  }
  
  if (!role_id || !content) {
    return {
      code: 400,
      message: '缺少必要参数'
    };
  }
  
  if (content.trim().length === 0) {
    return {
      code: 400,
      message: '评论内容不能为空'
    };
  }
  
  if (content.length > 500) {
    return {
      code: 400,
      message: '评论内容不能超过500字'
    };
  }
  
  const db = uniCloud.database();
  const dbCmd = db.command;
  
  try {
    // 获取用户信息
    const userRes = await db.collection('uni-id-users')
      .doc(uid)
      .field({
        nickname: true,
        avatar_file: true
      })
      .get();
    
    const userData = userRes.data && userRes.data[0];
    const nickname = userData?.nickname || '匿名用户';
    const avatar = userData?.avatar_file?.url || '';
    
    // 插入评论
    const commentRes = await db.collection('wiki_role_comments').add({
      user_id: uid,
      user_nickname: nickname,
      user_avatar: avatar,
      role_id: role_id,
      content: content.trim(),
      like_count: 0,
      status: 1,
      created_at: Date.now(),
      updated_at: Date.now()
    });
    
    // 增加角色评论数
    await db.collection('wiki_entries')
      .doc(role_id)
      .update({
        'stats.comment_count': dbCmd.inc(1)
      });
    
    return {
      code: 0,
      message: '评论成功',
      data: {
        comment_id: commentRes.id
      }
    };
  } catch (error) {
    console.error('[wiki-role-comment-add] 错误:', error);
    return {
      code: 500,
      message: '评论失败: ' + error.message
    };
  }
};

