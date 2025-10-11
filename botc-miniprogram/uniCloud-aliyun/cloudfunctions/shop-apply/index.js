'use strict';

/**
 * 店铺认证申请云函数
 */
exports.main = async (event, context) => {
  console.log('店铺认证申请，参数：', event)
  
  const {
    shopName,
    shopLogo,
    shopImages,
    contactPhone,
    contactPerson,
    contactWechat,
    province,
    city,
    district,
    address,
    businessHours,
    tableCount,
    avgPrice,
    facilities,
    description,
    licenseImage,
    licenseNumber,
    token
  } = event
  
  // 验证必填项
  if (!shopName || !contactPhone || !province || !address || !licenseImage) {
    return {
      code: 400,
      message: '请填写完整信息'
    }
  }
  
  // 验证手机号
  if (!/^1[3-9]\d{9}$/.test(contactPhone)) {
    return {
      code: 400,
      message: '请输入正确的手机号'
    }
  }
  
  // 验证token并获取用户ID
  if (!token) {
    return {
      code: 401,
      message: '请先登录'
    }
  }
  
  const userId = token.split('_')[0]
  
  if (!userId) {
    return {
      code: 401,
      message: 'Token无效'
    }
  }
  
  const db = uniCloud.database()
  const shopsCollection = db.collection('botc-shops')
  
  try {
    // 检查是否已有店铺申请
    const existingShop = await shopsCollection.where({
      owner_id: userId
    }).get()
    
    if (existingShop.data.length > 0) {
      // 已有店铺，更新信息
      const shop = existingShop.data[0]
      
      // 如果已通过认证，不允许修改关键信息
      if (shop.verify_status === 1) {
        return {
          code: 400,
          message: '店铺已通过认证，如需修改请联系客服'
        }
      }
      
      // 更新店铺信息
      await shopsCollection.doc(shop._id).update({
        shop_name: shopName,
        shop_logo: shopLogo || '',
        shop_images: shopImages || [],
        province: province,
        city: city,
        district: district || '',
        address: address,
        contact_person: contactPerson || '',
        contact_phone: contactPhone,
        contact_wechat: contactWechat || '',
        business_hours: businessHours || '',
        table_count: tableCount || 0,
        avg_price: avgPrice || 0,
        facilities: facilities || [],
        description: description || '',
        license_image: licenseImage,
        license_number: licenseNumber || '',
        verify_status: 0, // 重新提交后状态变为待审核
        reject_reason: '', // 清空拒绝原因
        updated_at: new Date()
      })
      
      return {
        code: 0,
        message: '重新提交成功，请等待审核',
        data: {
          shop_id: shop._id
        }
      }
      
    } else {
      // 新建店铺
      const shopData = {
        owner_id: userId,
        shop_name: shopName,
        shop_logo: shopLogo || '',
        shop_images: shopImages || [],
        province: province,
        city: city,
        district: district || '',
        address: address,
        contact_person: contactPerson || '',
        contact_phone: contactPhone,
        contact_wechat: contactWechat || '',
        business_hours: businessHours || '',
        table_count: tableCount || 0,
        avg_price: avgPrice || 0,
        facilities: facilities || [],
        description: description || '',
        license_image: licenseImage,
        license_number: licenseNumber || '',
        verify_status: 0, // 待审核
        rating: 5,
        view_count: 0,
        favorite_count: 0,
        review_count: 0,
        status: 1,
        is_recommend: false,
        created_at: new Date()
      }
      
      const result = await shopsCollection.add(shopData)
      
      return {
        code: 0,
        message: '提交成功，请等待审核',
        data: {
          shop_id: result.id
        }
      }
    }
    
  } catch (error) {
    console.error('店铺申请失败：', error)
    return {
      code: 500,
      message: '提交失败，请重试'
    }
  }
}

