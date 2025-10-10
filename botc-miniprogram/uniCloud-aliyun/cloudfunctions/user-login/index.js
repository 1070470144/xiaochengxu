'use strict';

/**
 * 手机号验证码登录云函数
 * 功能：验证验证码并登录/注册
 */

const db = uniCloud.database()
const dbCmd = db.command

exports.main = async (event, context) => {
    const { phone, code } = event
    
    // 1. 验证参数
    if (!phone || !code) {
        return {
            code: 400,
            message: '请输入手机号和验证码'
        }
    }
    
    if (!/^1[3-9]\d{9}$/.test(phone)) {
        return {
            code: 400,
            message: '手机号格式不正确'
        }
    }
    
    try {
        // 2. 验证验证码
        const smsCollection = db.collection('sms-codes')
        
        const smsQuery = await smsCollection
            .where({
                phone: phone,
                code: code,
                used: false,
                expires_at: dbCmd.gt(Date.now())  // 未过期
            })
            .orderBy('created_at', 'desc')
            .limit(1)
            .get()
        
        if (smsQuery.data.length === 0) {
            return {
                code: 400,
                message: '验证码错误或已过期'
            }
        }
        
        const smsRecord = smsQuery.data[0]
        
        // 3. 标记验证码已使用
        await smsCollection.doc(smsRecord._id).update({
            used: true,
            used_at: Date.now()
        })
        
        // 4. 查询或创建用户
        const usersCollection = db.collection('uni-id-users')
        
        const userQuery = await usersCollection
            .where({ mobile: phone })
            .get()
        
        let userId
        let userInfo
        let isNewUser = false
        
        if (userQuery.data.length > 0) {
            // 用户已存在，更新登录信息
            const existingUser = userQuery.data[0]
            userId = existingUser._id
            
            await usersCollection.doc(userId).update({
                last_login_date: Date.now(),
                last_login_ip: context.CLIENTIP
            })
            
            userInfo = existingUser
            
        } else {
            // 新用户，创建账户
            isNewUser = true
            
            const newUser = {
                mobile: phone,
                mobile_confirmed: 1,  // 验证码登录的手机号已确认
                nickname: `玩家${phone.substr(-4)}`,  // 默认昵称
                register_date: Date.now(),
                register_ip: context.CLIENTIP,
                last_login_date: Date.now(),
                last_login_ip: context.CLIENTIP,
                status: 0,  // 正常状态
                // 根据 spec-kit 规范添加等级字段
                level: 1,
                exp: 0
            }
            
            const createResult = await usersCollection.add(newUser)
            userId = createResult.id
            userInfo = { ...newUser, _id: userId }
        }
        
        // 5. 生成token（简单实现，生产环境建议使用uni-id）
        const tokenExpired = Date.now() + 7 * 24 * 60 * 60 * 1000  // 7天后过期
        const token = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2)}`
        
        // 6. 返回登录结果
        return {
            code: 0,
            message: isNewUser ? '注册成功' : '登录成功',
            data: {
                token: token,
                tokenExpired: tokenExpired,
                userInfo: {
                    _id: userInfo._id,
                    mobile: userInfo.mobile,
                    nickname: userInfo.nickname,
                    avatar: userInfo.avatar || '',
                    gender: userInfo.gender || 0,
                    level: userInfo.level || 1,
                    exp: userInfo.exp || 0,
                    status: userInfo.status
                },
                isNewUser
            }
        }
        
    } catch (error) {
        console.error('登录失败：', error)
        
        return {
            code: error.code || 500,
            message: error.message || '登录失败，请重试'
        }
    }
}

