'use strict';

/**
 * 云函数：说书人认证管理（管理端）
 * 功能：获取认证列表、审核通过、拒绝
 */

const db = uniCloud.database()
const dbCmd = db.command

exports.main = async (event, context) => {
  const { action, certId, rejectReason, pageNo = 1, pageSize = 20, status } = event
  
  try {
    // 获取认证列表
    if (action === 'list') {
      const where = {}
      
      // 状态筛选
      if (status) {
        where.status = status
      }
      
      // 查询总数
      const countRes = await db.collection('botc-certifications')
        .where(where)
        .count()
      
      // 查询列表
      const listRes = await db.collection('botc-certifications')
        .where(where)
        .orderBy('created_at', 'desc')
        .skip((pageNo - 1) * pageSize)
        .limit(pageSize)
        .get()
      
      return {
        code: 0,
        message: '获取成功',
        data: {
          list: listRes.data,
          total: countRes.total,
          pageNo,
          pageSize
        }
      }
    }
    
    // 审核通过
    if (action === 'approve') {
      if (!certId) {
        return { code: 400, message: '缺少认证ID' }
      }
      
      // 获取认证信息
      const certRes = await db.collection('botc-certifications')
        .doc(certId)
        .get()
      
      if (!certRes.data || certRes.data.length === 0) {
        return { code: 404, message: '认证记录不存在' }
      }
      
      const cert = certRes.data[0]
      
      if (cert.status !== 'pending') {
        return { code: 400, message: '该申请已处理' }
      }
      
      // 更新认证状态
      await db.collection('botc-certifications')
        .doc(certId)
        .update({
          status: 'approved',
          approved_at: Date.now(),
          updated_at: Date.now()
        })
      
      // 更新用户认证信息
      await db.collection('uni-id-users')
        .doc(cert.user_id)
        .update({
          storyteller_level: cert.level,
          storyteller_certified: true
        })
      
      return {
        code: 0,
        message: '审核通过'
      }
    }
    
    // 拒绝认证
    if (action === 'reject') {
      if (!certId) {
        return { code: 400, message: '缺少认证ID' }
      }
      
      if (!rejectReason) {
        return { code: 400, message: '请填写拒绝原因' }
      }
      
      // 获取认证信息
      const certRes = await db.collection('botc-certifications')
        .doc(certId)
        .get()
      
      if (!certRes.data || certRes.data.length === 0) {
        return { code: 404, message: '认证记录不存在' }
      }
      
      const cert = certRes.data[0]
      
      if (cert.status !== 'pending') {
        return { code: 400, message: '该申请已处理' }
      }
      
      // 更新认证状态
      await db.collection('botc-certifications')
        .doc(certId)
        .update({
          status: 'rejected',
          reject_reason: rejectReason,
          updated_at: Date.now()
        })
      
      return {
        code: 0,
        message: '已拒绝'
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

