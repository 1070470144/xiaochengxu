'use strict';

/**
 * 获取店铺详情云函数
 */
exports.main = async (event, context) => {
  console.log('获取店铺详情，参数：', event)
  
  const { shopId } = event
  
  if (!shopId) {
    return {
      code: 400,
      message: '店铺ID不能为空'
    }
  }
  
  const db = uniCloud.database()
  const shopsCollection = db.collection('botc-shops')
  const reviewsCollection = db.collection('botc-shop-reviews')
  
  try {
    // 获取店铺详情（关联店主信息）
    const shopResult = await shopsCollection.aggregate()
      .match({ _id: shopId })
      .lookup({
        from: 'uni-id-users',
        localField: 'owner_id',
        foreignField: '_id',
        as: 'owner'
      })
      .addFields({
        owner: { $arrayElemAt: ['$owner', 0] }
      })
      .end()
    
    if (shopResult.data.length === 0) {
      return {
        code: 404,
        message: '店铺不存在'
      }
    }
    
    const shop = shopResult.data[0]
    
    // 增加浏览数
    await shopsCollection.doc(shopId).update({
      view_count: db.command.inc(1)
    })
    
    // 获取评价列表（最新5条）
    const reviewsResult = await reviewsCollection.aggregate()
      .match({
        shop_id: shopId,
        status: 1
      })
      .lookup({
        from: 'uni-id-users',
        localField: 'user_id',
        foreignField: '_id',
        as: 'user'
      })
      .addFields({
        user: { $arrayElemAt: ['$user', 0] }
      })
      .sort({ created_at: -1 })
      .limit(5)
      .end()
    
    // 处理评价数据
    const processedReviews = reviewsResult.data.map(review => ({
      _id: review._id,
      rating: review.rating,
      content: review.content,
      images: review.images || [],
      tags: review.tags || [],
      like_count: review.like_count || 0,
      reply: review.reply || '',
      reply_time: review.reply_time,
      created_at: review.created_at,
      user: review.user ? {
        _id: review.user._id,
        nickname: review.user.nickname,
        avatar: review.user.avatar
      } : null
    }))
    
    // 处理店铺数据
    const processedShop = {
      _id: shop._id,
      shop_name: shop.shop_name,
      shop_logo: shop.shop_logo,
      shop_images: shop.shop_images || [],
      province: shop.province,
      city: shop.city,
      district: shop.district,
      address: shop.address,
      location: shop.location,
      contact_person: shop.contact_person,
      contact_phone: shop.contact_phone,
      contact_wechat: shop.contact_wechat,
      business_hours: shop.business_hours,
      description: shop.description,
      facilities: shop.facilities || [],
      table_count: shop.table_count || 0,
      avg_price: shop.avg_price || 0,
      rating: shop.rating || 5,
      view_count: shop.view_count + 1,
      favorite_count: shop.favorite_count || 0,
      review_count: shop.review_count || 0,
      verify_status: shop.verify_status,
      status: shop.status,
      is_recommend: shop.is_recommend || false,
      owner: shop.owner ? {
        _id: shop.owner._id,
        nickname: shop.owner.nickname,
        avatar: shop.owner.avatar
      } : null,
      reviews: processedReviews
    }
    
    return {
      code: 0,
      message: 'success',
      data: processedShop
    }
    
  } catch (error) {
    console.error('获取店铺详情失败：', error)
    return {
      code: 500,
      message: '获取店铺详情失败'
    }
  }
}

