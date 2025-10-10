'use strict';

/**
 * 获取用户信息云函数
 * 功能：获取当前登录用户的详细信息
 */

const db = uniCloud.database()

exports.main = async (event, context) => {
    try {
        // 获取token（从clientInfo或event中）
        const token = event.token || context.token
        
        if (!token) {
            return {
                code: 401,
                message: '未登录或登录已过期'
            }
        }
        
        // 解析token获取userId（简单实现）
        const userId = token.split('_')[0]
        
        if (!userId) {
            return {
                code: 401,
                message: 'Token无效'
            }
        }
        
        // 获取用户信息
        const userResult = await db.collection('uni-id-users')
            .doc(userId)
            .get()
        
        if (!userResult.data || userResult.data.length === 0) {
            return {
                code: 404,
                message: '用户不存在'
            }
        }
        
        const userInfo = userResult.data[0]
        
        // 返回用户信息（过滤敏感字段）
        return {
            code: 0,
            message: '获取成功',
            data: {
                _id: userInfo._id,
                mobile: userInfo.mobile,
                nickname: userInfo.nickname,
                avatar: userInfo.avatar || '',
                gender: userInfo.gender || 0,
                level: userInfo.level || 1,
                exp: userInfo.exp || 0,
                status: userInfo.status,
                register_date: userInfo.register_date,
                last_login_date: userInfo.last_login_date
            }
        }
        
    } catch (error) {
        console.error('获取用户信息失败：', error)
        
        return {
            code: error.code || 500,
            message: error.message || '获取失败'
        }
    }
}

