'use strict';

const db = uniCloud.database()
const dbCmd = db.command

exports.main = async (event, context) => {
  const { action, level, images, description, token } = event
  
  // 验证token
  if (!token) {
    return {
      code: 401,
      message: '请先登录'
    }
  }
  
  // 简化的token验证，从token获取用户ID
  const uid = token.split('_')[0]
  
  if (!uid) {
    return {
      code: 401,
      message: 'Token无效'
    }
  }
  
  try {
    // 获取认证信息
    if (action === 'get') {
      const certRes = await db.collection('botc-certifications')
        .where({ user_id: uid })
        .orderBy('created_at', 'desc')
        .limit(1)
        .get()
      
      return {
        code: 0,
        data: certRes.data[0] || null
      }
    }
    
    // 提交认证申请
    if (action === 'apply') {
      // 验证参数
      if (!level || ![1, 2].includes(level)) {
        return { code: 400, message: '请选择认证级别' }
      }
      
      if (!images || images.length === 0) {
        return { code: 400, message: '请上传证明材料' }
      }
      
      // 检查是否已有未完成的申请
      const existingRes = await db.collection('botc-certifications')
        .where({
          user_id: uid,
          status: dbCmd.in(['pending', 'approved'])
        })
        .get()
      
      if (existingRes.data.length > 0) {
        const existing = existingRes.data[0]
        if (existing.status === 'pending') {
          return { code: 400, message: '您已有待审核的申请' }
        }
        if (existing.status === 'approved') {
          return { code: 400, message: '您已通过认证' }
        }
      }
      
      // 二星认证可以直接申请，无需一星前置条件
      
      // 获取用户信息
      const userRes = await db.collection('uni-id-users')
        .doc(uid)
        .field({ nickname: true, mobile: true })
        .get()
      
      const userInfo = userRes.data[0] || {}
      
      // 创建认证申请
      const certDoc = {
        user_id: uid,
        user_nickname: userInfo.nickname || '',
        user_mobile: userInfo.mobile || '',
        level: level,
        images: images,
        description: description || '',
        status: 'pending',
        created_at: Date.now(),
        updated_at: Date.now()
      }
      
      await db.collection('botc-certifications').add(certDoc)
      
      return {
        code: 0,
        message: '申请提交成功'
      }
    }
    
    // 撤销认证（包括取消申请）
    if (action === 'revoke') {
      const certRes = await db.collection('botc-certifications')
        .where({
          user_id: uid,
          status: dbCmd.in(['pending', 'approved'])
        })
        .get()
      
      if (certRes.data.length === 0) {
        return { code: 400, message: '没有可撤销的认证' }
      }
      
      const certId = certRes.data[0]._id
      
      // 删除认证记录
      await db.collection('botc-certifications').doc(certId).remove()
      
      // 更新用户认证字段
      await db.collection('uni-id-users').doc(uid).update({
        storyteller_level: 0,
        storyteller_certified: false
      })
      
      return {
        code: 0,
        message: '已撤销认证'
      }
    }
    
    return {
      code: 400,
      message: '未知操作'
    }
    
  } catch (error) {
    console.error('认证管理失败：', error)
    return {
      code: 500,
      message: '操作失败：' + error.message
    }
  }
}

