'use strict';

/**
 * 发送短信验证码云函数
 * 功能：发送登录/注册验证码
 */

const db = uniCloud.database()

exports.main = async (event, context) => {
    const { phone, type = 'login' } = event
    
    // 1. 验证手机号格式
    if (!phone) {
        return {
            code: 400,
            message: '请输入手机号'
        }
    }
    
    if (!/^1[3-9]\d{9}$/.test(phone)) {
        return {
            code: 400,
            message: '手机号格式不正确'
        }
    }
    
    try {
        // 2. 生成6位验证码
        const code = Math.floor(100000 + Math.random() * 900000).toString()
        
        // 3. 验证码有效期：3分钟
        const expiresAt = Date.now() + 3 * 60 * 1000
        
        // 4. 保存验证码到数据库（用于验证）
        const smsCollection = db.collection('sms-codes')
        
        // 先删除该手机号的旧验证码
        await smsCollection.where({
            phone: phone
        }).remove()
        
        // 保存新验证码
        await smsCollection.add({
            phone: phone,
            code: code,
            type: type,
            expires_at: expiresAt,
            created_at: Date.now(),
            used: false
        })
        
        // 5. 发送短信（开发阶段可以先注释，直接返回验证码用于测试）
        // TODO: 接入阿里云/腾讯云短信服务
        
        // 开发模式：直接返回验证码（上线前必须删除）
        const isDev = process.env.NODE_ENV === 'development' || true
        
        if (isDev) {
            console.log(`【开发模式】验证码：${code}，手机号：${phone}`)
            return {
                code: 0,
                message: '验证码已发送（开发模式）',
                data: {
                    expiresIn: 180,
                    // 开发模式下返回验证码，方便测试
                    devCode: code
                }
            }
        }
        
        // 生产模式：调用短信服务
        /*
        const smsResult = await uniCloud.sendSms({
            phoneNumber: phone,
            templateId: 'SMS_123456789', // 你的短信模板ID
            data: {
                code: code
            }
        })
        
        if (!smsResult.success) {
            throw new Error('短信发送失败')
        }
        */
        
        return {
            code: 0,
            message: '验证码已发送',
            data: {
                expiresIn: 180  // 3分钟有效期
            }
        }
        
    } catch (error) {
        console.error('发送验证码失败：', error)
        
        return {
            code: error.code || 500,
            message: error.message || '验证码发送失败'
        }
    }
}

