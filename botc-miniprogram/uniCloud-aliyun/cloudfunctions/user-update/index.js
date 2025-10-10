'use strict';

/**
 * 更新用户信息云函数
 * 功能：更新头像、昵称等用户信息
 */

const db = uniCloud.database()

exports.main = async (event, context) => {
    const { nickname, avatar, gender, token } = event
    
    try {
        // 获取token
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
        
        // 构建更新数据
        const updateData = {}
        
        if (nickname !== undefined) {
            // 验证昵称
            if (!nickname || nickname.trim().length === 0) {
                return {
                    code: 400,
                    message: '昵称不能为空'
                }
            }
            
            if (nickname.length > 20) {
                return {
                    code: 400,
                    message: '昵称不能超过20个字符'
                }
            }
            
            updateData.nickname = nickname.trim()
        }
        
        if (avatar !== undefined) {
            updateData.avatar = avatar
        }
        
        if (gender !== undefined) {
            // 性别：0-未知，1-男，2-女
            if (![0, 1, 2].includes(gender)) {
                return {
                    code: 400,
                    message: '性别参数错误'
                }
            }
            updateData.gender = gender
        }
        
        // 如果没有要更新的数据
        if (Object.keys(updateData).length === 0) {
            return {
                code: 400,
                message: '没有要更新的数据'
            }
        }
        
        // 更新用户信息
        await db.collection('uni-id-users')
            .doc(userId)
            .update(updateData)
        
        // 获取更新后的用户信息
        const userResult = await db.collection('uni-id-users')
            .doc(userId)
            .get()
        
        const userInfo = userResult.data[0]
        
        return {
            code: 0,
            message: '更新成功',
            data: {
                _id: userInfo._id,
                mobile: userInfo.mobile,
                nickname: userInfo.nickname,
                avatar: userInfo.avatar || '',
                gender: userInfo.gender || 0,
                level: userInfo.level || 1,
                exp: userInfo.exp || 0,
                status: userInfo.status
            }
        }
        
    } catch (error) {
        console.error('更新用户信息失败：', error)
        
        return {
            code: error.code || 500,
            message: error.message || '更新失败'
        }
    }
}

