'use strict';

/**
 * 获取店铺列表云函数
 */
exports.main = async (event, context) => {
  console.log('获取店铺列表，参数：', event)
  
  const {
    page = 1,
    pageSize = 10,
    city,           // 城市筛选
    sortBy = 'recommend'  // 排序方式：recommend-推荐 rating-评分 newest-最新
  } = event
  
  const db = uniCloud.database()
  const dbCmd = db.command
  const shopsCollection = db.collection('botc-shops')
  
  try {
    // 构建查询条件
    const whereCondition = {
      verify_status: 1,  // 只显示已认证通过的店铺
      status: 1          // 只显示正常营业的店铺
    }
    
    if (city) {
      whereCondition.city = city
    }
    
    // 排序规则
    let sortRule = {}
    if (sortBy === 'recommend') {
      sortRule = {
        is_recommend: -1,
        rating: -1,
        view_count: -1
      }
    } else if (sortBy === 'rating') {
      sortRule = {
        rating: -1,
        review_count: -1
      }
    } else if (sortBy === 'newest') {
      sortRule = {
        created_at: -1
      }
    }
    
    // 分页查询
    const skip = (page - 1) * pageSize
    
    // 获取店铺列表（关联店主信息）
    const result = await shopsCollection.aggregate()
      .match(whereCondition)
      .sort(sortRule)
      .skip(skip)
      .limit(pageSize)
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
    
    // 获取总数
    const countResult = await shopsCollection.where(whereCondition).count()
    
    // 处理返回数据
    const processedShops = result.data.map(shop => ({
      _id: shop._id,
      shop_name: shop.shop_name,
      shop_logo: shop.shop_logo,
      shop_images: shop.shop_images || [],
      province: shop.province,
      city: shop.city,
      district: shop.district,
      address: shop.address,
      contact_phone: shop.contact_phone,
      contact_wechat: shop.contact_wechat,
      business_hours: shop.business_hours,
      description: shop.description,
      facilities: shop.facilities || [],
      table_count: shop.table_count || 0,
      avg_price: shop.avg_price || 0,
      rating: shop.rating || 5,
      view_count: shop.view_count || 0,
      favorite_count: shop.favorite_count || 0,
      review_count: shop.review_count || 0,
      is_recommend: shop.is_recommend || false,
      owner: shop.owner ? {
        _id: shop.owner._id,
        nickname: shop.owner.nickname
      } : null
    }))
    
    return {
      code: 0,
      message: 'success',
      data: {
        list: processedShops,
        total: countResult.total,
        page: page,
        pageSize: pageSize,
        hasMore: skip + processedShops.length < countResult.total
      }
    }
    
  } catch (error) {
    console.error('获取店铺列表失败：', error)
    return {
      code: 500,
      message: '获取店铺列表失败'
    }
  }
}

