'use strict';

// ==================== 工具函数（外部） ====================

/**
 * 解析用户ID
 */
function parseUserId(clientInfo) {
  try {
    if (!clientInfo || !clientInfo.uniIdToken) {
      return null;
    }
    
    const tokenParts = clientInfo.uniIdToken.split('_');
    return tokenParts[0] || null;
  } catch (error) {
    console.error('[shop] 解析用户ID失败:', error);
    return null;
  }
}

/**
 * 成功返回
 */
function returnSuccess(data = {}, message = 'success') {
  return {
    code: 0,
    message,
    data
  };
}

/**
 * 错误返回
 */
function returnError(code = 500, message = '操作失败') {
  return {
    code,
    message
  };
}

/**
 * 验证手机号
 */
function validatePhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone);
}

// ==================== 云对象主体 ====================

module.exports = {
  
  /**
   * 前置钩子
   */
  _before() {
    this.db = uniCloud.database();
    this.dbCmd = this.db.command;
    this.clientInfo = this.getClientInfo();
    
    // Token 验证（仅 apply 方法需要）
    const methodName = this.getMethodName();
    if (methodName === 'apply') {
      this.currentUserId = parseUserId(this.clientInfo);
      if (!this.currentUserId) {
        throw new Error('请先登录');
      }
    }
    
    console.log(`[shop] 调用方法: ${methodName}, 用户ID: ${this.currentUserId || '未登录'}`);
  },
  
  /**
   * 1. 获取店铺列表
   * @param {Object} options - 查询选项
   * @param {Number} options.page - 页码
   * @param {Number} options.pageSize - 每页数量
   * @param {String} options.city - 城市筛选
   * @param {String} options.sortBy - 排序方式：recommend/rating/newest
   */
  async getList(options = {}) {
    const {
      page = 1,
      pageSize = 10,
      city = null,
      sortBy = 'recommend'
    } = options;
    
    try {
      // 构建查询条件
      const whereCondition = {
        verify_status: 1,  // 只显示已认证通过的店铺
        status: 1          // 只显示正常营业的店铺
      };
      
      if (city) {
        whereCondition.city = city;
      }
      
      // 排序规则
      let sortRule = {};
      if (sortBy === 'recommend') {
        sortRule = {
          is_recommend: -1,
          rating: -1,
          view_count: -1
        };
      } else if (sortBy === 'rating') {
        sortRule = {
          rating: -1,
          review_count: -1
        };
      } else if (sortBy === 'newest') {
        sortRule = {
          created_at: -1
        };
      }
      
      // 分页计算
      const skip = (page - 1) * pageSize;
      
      // 获取店铺列表（关联店主信息）
      const result = await this.db.collection('botc-shops')
        .aggregate()
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
        .end();
      
      // 获取总数
      const countResult = await this.db.collection('botc-shops')
        .where(whereCondition)
        .count();
      
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
      }));
      
      console.log(`[shop] getList 成功，找到 ${processedShops.length} 条记录`);
      
      return returnSuccess({
        list: processedShops,
        total: countResult.total,
        page: page,
        pageSize: pageSize,
        hasMore: skip + processedShops.length < countResult.total
      }, '获取成功');
      
    } catch (error) {
      console.error('[shop] getList 失败:', error);
      return returnError(500, '获取店铺列表失败');
    }
  },
  
  /**
   * 2. 获取店铺详情
   * @param {String} shopId - 店铺ID
   */
  async getDetail(shopId) {
    if (!shopId) {
      return returnError(400, '店铺ID不能为空');
    }
    
    try {
      // 获取店铺详情（关联店主信息）
      const shopResult = await this.db.collection('botc-shops')
        .aggregate()
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
        .end();
      
      if (shopResult.data.length === 0) {
        return returnError(404, '店铺不存在');
      }
      
      const shop = shopResult.data[0];
      
      // 增加浏览数
      try {
        await this.db.collection('botc-shops')
          .doc(shopId)
          .update({
            view_count: this.dbCmd.inc(1)
          });
      } catch (err) {
        console.error('[shop] 更新浏览数失败:', err);
      }
      
      // 获取评价列表（最新5条）
      const reviewsResult = await this.db.collection('botc-shop-reviews')
        .aggregate()
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
        .end();
      
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
      }));
      
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
        view_count: (shop.view_count || 0) + 1,
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
      };
      
      console.log('[shop] getDetail 成功');
      
      return returnSuccess(processedShop, '获取成功');
      
    } catch (error) {
      console.error('[shop] getDetail 失败:', error);
      return returnError(500, '获取店铺详情失败');
    }
  },
  
  /**
   * 3. 店铺认证申请
   * @param {Object} shopData - 店铺信息
   */
  async apply(shopData) {
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
      licenseNumber
    } = shopData;
    
    // 验证必填项
    if (!shopName || !contactPhone || !province || !address || !licenseImage) {
      return returnError(400, '请填写完整信息');
    }
    
    // 验证手机号
    if (!validatePhone(contactPhone)) {
      return returnError(400, '请输入正确的手机号');
    }
    
    const userId = this.currentUserId;
    
    try {
      // 检查是否已有店铺申请
      const existingShop = await this.db.collection('botc-shops')
        .where({
          owner_id: userId
        })
        .get();
      
      if (existingShop.data.length > 0) {
        // 已有店铺，更新信息
        const shop = existingShop.data[0];
        
        // 如果已通过认证，不允许修改关键信息
        if (shop.verify_status === 1) {
          return returnError(400, '店铺已通过认证，如需修改请联系客服');
        }
        
        // 更新店铺信息
        await this.db.collection('botc-shops')
          .doc(shop._id)
          .update({
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
          });
        
        console.log('[shop] apply 更新成功');
        
        return returnSuccess({
          shop_id: shop._id
        }, '重新提交成功，请等待审核');
        
      } else {
        // 新建店铺
        const newShopData = {
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
        };
        
        const result = await this.db.collection('botc-shops')
          .add(newShopData);
        
        console.log('[shop] apply 创建成功');
        
        return returnSuccess({
          shop_id: result.id
        }, '提交成功，请等待审核');
      }
      
    } catch (error) {
      console.error('[shop] apply 失败:', error);
      return returnError(500, '提交失败，请重试');
    }
  }
};

