// Chat 云对象 - 私聊功能
// 替换原有的 chat-* 云函数

const db = uniCloud.database()
const dbCmd = db.command

// ==================== 工具函数 ====================

// 解析用户ID
function parseUserId(token) {
  if (!token) return null
  const parts = token.split('_')
  return parts[0] || null
}

// 验证认证
function checkAuth(userId) {
  if (!userId) {
    throw new Error('未登录或token无效')
  }
}

// 统一成功返回
function returnSuccess(data = null, message = 'success') {
  return {
    code: 0,
    message,
    data
  }
}

// 统一错误返回
function returnError(code, message) {
  return {
    code,
    message,
    data: null
  }
}

// 查找或创建会话
async function findOrCreateConversation(userId1, userId2) {
  const collection = db.collection('botc-chat-conversations')
  
  // 查找现有会话
  const result = await collection
    .where(dbCmd.or([
      { user1_id: userId1, user2_id: userId2 },
      { user1_id: userId2, user2_id: userId1 }
    ]))
    .get()
  
  if (result.data && result.data.length > 0) {
    return result.data[0]
  }
  
  // 创建新会话
  const now = new Date()
  const newResult = await collection.add({
    user1_id: userId1,
    user2_id: userId2,
    last_message: '',
    last_message_time: now,
    user1_unread_count: 0,
    user2_unread_count: 0,
    created_at: now,
    updated_at: now
  })
  
  return {
    _id: newResult.id,
    user1_id: userId1,
    user2_id: userId2,
    user1_unread_count: 0,
    user2_unread_count: 0,
    created_at: now,
    updated_at: now
  }
}

// ==================== Chat 云对象 ====================

module.exports = {
  _before() {
    // 初始化数据库和用户信息
    this.db = db
    this.dbCmd = dbCmd
    this.clientInfo = this.getClientInfo()
    this.token = this.clientInfo.uniIdToken
    this.currentUserId = parseUserId(this.token)
  },
  
  /**
   * 1. 发送消息
   * @param {String} receiverId - 接收者ID
   * @param {String} content - 消息内容
   * @param {Number} messageType - 消息类型，默认1（文本）
   */
  async sendMessage(receiverId, content, messageType = 1) {
    try {
      // 验证认证
      checkAuth(this.currentUserId)
      
      // 验证参数
      if (!receiverId) {
        return returnError(400, '接收者ID不能为空')
      }
      
      if (!content || content.trim().length === 0) {
        return returnError(400, '消息内容不能为空')
      }
      
      if (content.length > 1000) {
        return returnError(400, '消息内容不能超过1000字')
      }
      
      // 不能给自己发消息
      if (this.currentUserId === receiverId) {
        return returnError(400, '不能给自己发消息')
      }
      
      // 1. 查找或创建会话
      const conversation = await findOrCreateConversation(this.currentUserId, receiverId)
      
      // 2. 创建消息记录
      const messageResult = await this.db.collection('botc-chat-messages').add({
        conversation_id: conversation._id,
        sender_id: this.currentUserId,
        receiver_id: receiverId,
        content: content.trim(),
        message_type: parseInt(messageType),
        is_read: false,
        created_at: new Date()
      })
      
      // 3. 更新会话信息
      const now = new Date()
      const updateData = {
        last_message: content.trim().substring(0, 200),
        last_message_time: now,
        updated_at: now
      }
      
      // 更新接收方的未读数
      if (conversation.user1_id === receiverId) {
        updateData.user1_unread_count = (conversation.user1_unread_count || 0) + 1
      } else {
        updateData.user2_unread_count = (conversation.user2_unread_count || 0) + 1
      }
      
      await this.db.collection('botc-chat-conversations')
        .doc(conversation._id)
        .update(updateData)
      
      return returnSuccess({
        message_id: messageResult.id,
        conversation_id: conversation._id,
        created_at: now
      }, '发送成功')
      
    } catch (error) {
      console.error('发送消息失败：', error)
      return returnError(500, error.message || '发送失败，请重试')
    }
  },
  
  /**
   * 2. 获取会话列表
   * @param {Number} page - 页码，默认1
   * @param {Number} pageSize - 每页数量，默认20
   */
  async getConversations(page = 1, pageSize = 20) {
    try {
      // 验证认证
      checkAuth(this.currentUserId)
      
      // 查询当前用户的所有会话
      const conversationsResult = await this.db.collection('botc-chat-conversations')
        .where(this.dbCmd.or([
          { user1_id: this.currentUserId },
          { user2_id: this.currentUserId }
        ]))
        .orderBy('last_message_time', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get()
      
      const conversations = conversationsResult.data || []
      
      if (conversations.length === 0) {
        return returnSuccess({
          list: [],
          total: 0,
          page: page,
          pageSize: pageSize,
          hasNext: false
        }, '获取成功')
      }
      
      // 获取所有对方用户ID
      const otherUserIds = conversations.map(conv => {
        return conv.user1_id === this.currentUserId ? conv.user2_id : conv.user1_id
      })
      
      // 查询对方用户信息
      const usersResult = await this.db.collection('uni-id-users')
        .where({
          _id: this.dbCmd.in(otherUserIds)
        })
        .field({
          _id: true,
          nickname: true,
          avatar: true
        })
        .get()
      
      const users = usersResult.data || []
      const usersMap = {}
      users.forEach(user => {
        usersMap[user._id] = user
      })
      
      // 组装会话列表数据
      const list = conversations.map(conv => {
        const otherUserId = conv.user1_id === this.currentUserId ? conv.user2_id : conv.user1_id
        const unreadCount = conv.user1_id === this.currentUserId 
          ? conv.user1_unread_count 
          : conv.user2_unread_count
        
        return {
          conversation_id: conv._id,
          other_user: usersMap[otherUserId] || {
            _id: otherUserId,
            nickname: '未知用户',
            avatar: ''
          },
          last_message: conv.last_message,
          last_message_time: conv.last_message_time,
          unread_count: unreadCount || 0
        }
      })
      
      // 获取总数
      const countResult = await this.db.collection('botc-chat-conversations')
        .where(this.dbCmd.or([
          { user1_id: this.currentUserId },
          { user2_id: this.currentUserId }
        ]))
        .count()
      
      const total = countResult.total || 0
      const hasNext = page * pageSize < total
      
      return returnSuccess({
        list: list,
        total: total,
        page: page,
        pageSize: pageSize,
        hasNext: hasNext
      }, '获取成功')
      
    } catch (error) {
      console.error('获取会话列表失败：', error)
      return returnError(500, error.message || '获取失败，请重试')
    }
  },
  
  /**
   * 3. 获取聊天消息
   * @param {String} userId - 对方用户ID
   * @param {Number} page - 页码，默认1
   * @param {Number} pageSize - 每页数量，默认50
   */
  async getMessages(userId, page = 1, pageSize = 50) {
    try {
      // 验证认证
      checkAuth(this.currentUserId)
      
      if (!userId) {
        return returnError(400, '用户ID不能为空')
      }
      
      // 1. 查找会话
      const conversation = await findOrCreateConversation(this.currentUserId, userId)
      
      // 2. 获取消息列表
      const messagesResult = await this.db.collection('botc-chat-messages')
        .where({
          conversation_id: conversation._id
        })
        .orderBy('created_at', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get()
      
      const messages = messagesResult.data || []
      
      // 3. 格式化消息数据
      const list = messages.map(msg => ({
        message_id: msg._id,
        sender_id: msg.sender_id,
        receiver_id: msg.receiver_id,
        content: msg.content,
        message_type: msg.message_type,
        is_read: msg.is_read,
        created_at: msg.created_at,
        is_mine: msg.sender_id === this.currentUserId
      }))
      
      // 4. 获取总数
      const countResult = await this.db.collection('botc-chat-messages')
        .where({
          conversation_id: conversation._id
        })
        .count()
      
      const total = countResult.total || 0
      const hasNext = page * pageSize < total
      
      return returnSuccess({
        list: list,
        conversation_id: conversation._id,
        total: total,
        page: page,
        pageSize: pageSize,
        hasNext: hasNext
      }, '获取成功')
      
    } catch (error) {
      console.error('获取消息失败：', error)
      return returnError(500, error.message || '获取失败，请重试')
    }
  },
  
  /**
   * 4. 标记消息为已读
   * @param {String} userId - 对方用户ID
   * @param {String} conversationId - 会话ID（可选）
   */
  async markRead(userId, conversationId = null) {
    try {
      // 验证认证
      checkAuth(this.currentUserId)
      
      if (!userId && !conversationId) {
        return returnError(400, '用户ID或会话ID不能同时为空')
      }
      
      let conversation
      
      // 1. 查找或获取会话
      if (conversationId) {
        const result = await this.db.collection('botc-chat-conversations')
          .doc(conversationId)
          .get()
        
        if (result.data && result.data.length > 0) {
          conversation = result.data[0]
        }
      } else {
        const result = await this.db.collection('botc-chat-conversations')
          .where(this.dbCmd.or([
            {
              user1_id: this.currentUserId,
              user2_id: userId
            },
            {
              user1_id: userId,
              user2_id: this.currentUserId
            }
          ]))
          .get()
        
        if (result.data && result.data.length > 0) {
          conversation = result.data[0]
        }
      }
      
      if (!conversation) {
        return returnError(404, '会话不存在')
      }
      
      const actualConversationId = conversation._id
      
      // 2. 将该会话中接收到的消息标记为已读
      const messagesUpdateResult = await this.db.collection('botc-chat-messages')
        .where({
          conversation_id: actualConversationId,
          receiver_id: this.currentUserId,
          is_read: false
        })
        .update({
          is_read: true
        })
      
      console.log(`标记了 ${messagesUpdateResult.updated} 条消息为已读`)
      
      // 3. 更新会话的未读数量
      const updateData = {}
      
      if (conversation.user1_id === this.currentUserId) {
        updateData.user1_unread_count = 0
      } else {
        updateData.user2_unread_count = 0
      }
      
      await this.db.collection('botc-chat-conversations')
        .doc(actualConversationId)
        .update(updateData)
      
      return returnSuccess({
        conversation_id: actualConversationId,
        marked_count: messagesUpdateResult.updated || 0
      }, '标记成功')
      
    } catch (error) {
      console.error('标记消息失败：', error)
      return returnError(500, error.message || '标记失败，请重试')
    }
  },
  
  /**
   * 5. 删除会话（软删除）
   * @param {String} conversationId - 会话ID
   */
  async deleteConversation(conversationId) {
    try {
      // 验证认证
      checkAuth(this.currentUserId)
      
      if (!conversationId) {
        return returnError(400, '会话ID不能为空')
      }
      
      // 查询会话
      const convResult = await this.db.collection('botc-chat-conversations')
        .doc(conversationId)
        .get()
      
      if (!convResult.data || convResult.data.length === 0) {
        return returnError(404, '会话不存在')
      }
      
      const conversation = convResult.data[0]
      
      // 验证权限
      if (conversation.user1_id !== this.currentUserId && 
          conversation.user2_id !== this.currentUserId) {
        return returnError(403, '无权删除此会话')
      }
      
      // 软删除：为当前用户添加删除标记
      const updateData = {}
      if (conversation.user1_id === this.currentUserId) {
        updateData.user1_deleted = true
      } else {
        updateData.user2_deleted = true
      }
      
      await this.db.collection('botc-chat-conversations')
        .doc(conversationId)
        .update(updateData)
      
      return returnSuccess({
        conversation_id: conversationId
      }, '删除成功')
      
    } catch (error) {
      console.error('删除会话失败：', error)
      return returnError(500, error.message || '删除失败，请重试')
    }
  },
  
  /**
   * 6. 获取未读消息总数
   */
  async getUnreadCount() {
    try {
      // 验证认证
      checkAuth(this.currentUserId)
      
      // 查询所有会话
      const conversationsResult = await this.db.collection('botc-chat-conversations')
        .where(this.dbCmd.or([
          { user1_id: this.currentUserId },
          { user2_id: this.currentUserId }
        ]))
        .get()
      
      const conversations = conversationsResult.data || []
      
      // 计算总未读数
      let totalUnread = 0
      conversations.forEach(conv => {
        if (conv.user1_id === this.currentUserId) {
          totalUnread += conv.user1_unread_count || 0
        } else {
          totalUnread += conv.user2_unread_count || 0
        }
      })
      
      return returnSuccess({
        total_unread: totalUnread
      }, '获取成功')
      
    } catch (error) {
      console.error('获取未读数失败：', error)
      return returnError(500, error.message || '获取失败，请重试')
    }
  }
}

