'use strict';

/**
 * 用户登出云函数
 * 功能：清除token，记录登出日志
 */

const db = uniCloud.database()

exports.main = async (event, context) => {
    try {
        // 获取token
        const token = event.token || context.token
        
        if (!token) {
            return {
                code: 401,
                message: '未登录'
            }
        }
        
        // 解析token获取userId
        const userId = token.split('_')[0]
        
        if (!userId) {
            return {
                code: 401,
                message: 'Token无效'
            }
        }
        
        // 记录登出时间（可选）
        await db.collection('uni-id-users')
            .doc(userId)
            .update({
                last_logout_date: Date.now()
            })
        
        // 清除token（uniCloud会自动处理）
        return {
            code: 0,
            message: '登出成功'
        }
        
    } catch (error) {
        console.error('登出失败：', error)
        
        return {
            code: error.code || 500,
            message: error.message || '登出失败'
        }
    }
}

