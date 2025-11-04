<template>
  <view class="test-page">
    <view class="header">
      <text class="title">云对象测试中心</text>
      <text class="status" :class="isLogin ? 'logged' : 'not-logged'">
        {{ isLogin ? '✅ 已登录' : '❌ 未登录' }}
      </text>
    </view>

    <!-- 页签切换 -->
    <view class="tabs">
      <view 
        v-for="tab in tabs" 
        :key="tab.value"
        :class="['tab-item', currentTab === tab.value ? 'active' : '']"
        @click="switchTab(tab.value)"
      >
        <text class="tab-icon">{{ tab.icon }}</text>
        <text class="tab-label">{{ tab.label }}</text>
      </view>
    </view>

    <!-- 测试结果展示区 -->
    <view class="result-panel" v-if="lastResult">
      <view class="result-header">
        <text class="result-title">最后测试结果</text>
        <view class="result-status" :class="lastResult.success ? 'success' : 'fail'">
          {{ lastResult.success ? '✅ 成功' : '❌ 失败' }}
        </view>
      </view>
      <view class="result-content">
        <text class="result-text">{{ lastResult.message }}</text>
        <view class="result-data" v-if="lastResult.data">
          <text class="data-label">返回数据（部分）：</text>
          <text class="data-content">{{ formatData(lastResult.data) }}</text>
        </view>
      </view>
    </view>

    <!-- Script 测试内容 -->
    <scroll-view class="test-sections" scroll-y v-if="currentTab === 'script'">
      <!-- 1. 剧本列表 -->
      <view class="section">
        <view class="section-title">1️⃣ 剧本列表 (getList)</view>
        
        <view class="test-group">
          <text class="group-title">基础列表查询</text>
          <view class="input-row">
            <input 
              class="input input-half" 
              v-model.number="listOptions.page" 
              placeholder="页码"
              type="number"
            />
            <input 
              class="input input-half" 
              v-model.number="listOptions.pageSize" 
              placeholder="每页数量"
              type="number"
            />
          </view>
          <input class="input" v-model="listOptions.keyword" placeholder="搜索关键词（可选）" />
          <picker mode="selector" :range="typeOptions" range-key="label" @change="onTypeChange">
            <view class="picker">
              <text>排序：{{ typeOptions.find(t => t.value === listOptions.type).label }}</text>
              <text class="arrow">></text>
            </view>
          </picker>
          <button class="btn btn-primary" @click="testGetList">获取剧本列表</button>
        </view>
      </view>

      <!-- 2. 剧本详情 -->
      <view class="section">
        <view class="section-title">2️⃣ 剧本详情 (getDetail)</view>
        
        <view class="test-group">
          <text class="group-title">查看剧本详情</text>
          <input 
            class="input" 
            v-model="testData.scriptId" 
            placeholder="请输入剧本ID"
          />
          <button class="btn btn-success" @click="testGetDetail">查看详情</button>
        </view>
      </view>

      <!-- 3. 上传剧本 -->
      <view class="section">
        <view class="section-title">3️⃣ 上传剧本 (upload)</view>
        
        <view class="test-group">
          <text class="group-title">上传测试剧本</text>
          <text class="hint">⚠️ 需要登录</text>
          <input class="input" v-model="uploadData.title" placeholder="剧本标题" maxlength="50" />
          <input class="input" v-model="uploadData.author" placeholder="作者" maxlength="30" />
          <textarea 
            class="textarea" 
            v-model="uploadData.description" 
            placeholder="剧本描述（可选）"
            maxlength="200"
          />
          <view class="json-input">
            <text class="input-label">剧本JSON（使用测试数据）</text>
            <view class="checkbox-row">
              <checkbox :checked="useTestJson" @click="toggleTestJson" />
              <text>使用测试JSON数据</text>
            </view>
          </view>
          <button class="btn btn-warning" @click="testUpload" :disabled="!isLogin">
            上传剧本
          </button>
        </view>
      </view>

      <!-- 4. 我的剧本 -->
      <view class="section">
        <view class="section-title">4️⃣ 我的剧本 (getMyUploads)</view>
        
        <view class="test-group">
          <text class="group-title">查看我上传的剧本</text>
          <text class="hint">⚠️ 需要登录</text>
          <view class="input-row">
            <input 
              class="input input-half" 
              v-model.number="myUploadsPage" 
              placeholder="页码"
              type="number"
            />
            <input 
              class="input input-half" 
              v-model.number="myUploadsPageSize" 
              placeholder="每页数量"
              type="number"
            />
          </view>
          <button class="btn btn-info" @click="testGetMyUploads" :disabled="!isLogin">
            获取我的剧本
          </button>
        </view>
      </view>

      <!-- 5. 删除剧本 -->
      <view class="section">
        <view class="section-title">5️⃣ 删除剧本 (delete)</view>
        
        <view class="test-group">
          <text class="group-title">删除剧本</text>
          <text class="hint">⚠️ 只能删除自己的、未发布的剧本</text>
          <input 
            class="input" 
            v-model="testData.deleteScriptId" 
            placeholder="要删除的剧本ID"
          />
          <button class="btn btn-danger" @click="testDelete" :disabled="!isLogin">
            删除剧本
          </button>
        </view>
      </view>

      <!-- 6. 创建评价 -->
      <view class="section">
        <view class="section-title">6️⃣ 创建评价 (createReview)</view>
        
        <view class="test-group">
          <text class="group-title">提交剧本评价</text>
          <text class="hint">⚠️ 需要登录</text>
          <input class="input" v-model="reviewData.scriptId" placeholder="剧本ID" />
          <picker mode="selector" :range="ratingOptions" @change="onReviewRatingChange">
            <view class="picker">
              <text>评分：{{ reviewData.rating }}星</text>
              <text class="arrow">></text>
            </view>
          </picker>
          <textarea 
            class="textarea" 
            v-model="reviewData.content" 
            placeholder="评价内容（必填）"
            maxlength="500"
          />
          <button class="btn btn-warning" @click="testCreateReview" :disabled="!isLogin">
            提交评价
          </button>
        </view>
      </view>

      <!-- 7. 评分 -->
      <view class="section">
        <view class="section-title">7️⃣ 评分 (rate)</view>
        
        <view class="test-group">
          <text class="group-title">快速评分（无评价）</text>
          <text class="hint">⚠️ 需要登录</text>
          <input class="input" v-model="rateData.scriptId" placeholder="剧本ID" />
          <picker mode="selector" :range="ratingOptions" @change="onRateChange">
            <view class="picker">
              <text>评分：{{ rateData.rating }}星</text>
              <text class="arrow">></text>
            </view>
          </picker>
          <input class="input" v-model="rateData.comment" placeholder="备注（可选）" maxlength="100" />
          <button class="btn btn-success" @click="testRate" :disabled="!isLogin">
            提交评分
          </button>
        </view>
      </view>

      <!-- 8. 获取JSON -->
      <view class="section">
        <view class="section-title">8️⃣ 获取JSON (getJson)</view>
        
        <view class="test-group">
          <text class="group-title">获取剧本JSON数据</text>
          <input class="input" v-model="testData.jsonScriptId" placeholder="剧本ID" />
          <button class="btn btn-info" @click="testGetJson">获取JSON</button>
        </view>
      </view>

      <!-- 9-12. 排行榜 -->
      <view class="section">
        <view class="section-title">9️⃣-1️⃣2️⃣ 排行榜</view>
        
        <view class="test-group">
          <text class="group-title">热门排行 (getRankingHot)</text>
          <view class="input-row">
            <input class="input input-half" v-model.number="rankingPage" placeholder="页码" type="number" />
            <input class="input input-half" v-model.number="rankingPageSize" placeholder="每页" type="number" />
          </view>
          <picker mode="selector" :range="periodOptions" range-key="label" @change="onPeriodChange">
            <view class="picker">
              <text>时间范围：{{ periodOptions.find(p => p.value === rankingPeriod).label }}</text>
              <text class="arrow">></text>
            </view>
          </picker>
          <button class="btn btn-primary" @click="testGetRankingHot">热门排行</button>
        </view>

        <view class="test-group">
          <text class="group-title">最新排行 (getRankingNew)</text>
          <button class="btn btn-success" @click="testGetRankingNew">最新排行</button>
        </view>

        <view class="test-group">
          <text class="group-title">评分排行 (getRankingRating)</text>
          <input class="input" v-model.number="minRatingCount" placeholder="最少评分数" type="number" />
          <button class="btn btn-warning" @click="testGetRankingRating">评分排行</button>
        </view>

        <view class="test-group">
          <text class="group-title">下载排行 (getRankingDownload)</text>
          <button class="btn btn-info" @click="testGetRankingDownload">下载排行</button>
        </view>
      </view>

      <!-- 13. 计算热度 -->
      <view class="section">
        <view class="section-title">1️⃣3️⃣ 计算热度 (calculateHeat)</view>
        
        <view class="test-group">
          <text class="group-title">计算剧本热度</text>
          <input class="input" v-model="testData.heatScriptId" placeholder="剧本ID（空=全部）" />
          <button class="btn btn-danger" @click="testCalculateHeat" :disabled="!testData.heatScriptId && !isLogin">
            计算热度
          </button>
        </view>
      </view>

      <!-- 14. 生成JSON链接 -->
      <view class="section">
        <view class="section-title">1️⃣4️⃣ 生成JSON链接 (generateJsonUrl)</view>
        
        <view class="test-group">
          <text class="group-title">生成JSON访问链接</text>
          <input class="input" v-model="testData.urlScriptId" placeholder="剧本ID" />
          <button class="btn btn-primary" @click="testGenerateJsonUrl">生成链接</button>
          <text class="hint">💡 生成可在浏览器直接访问的JSON链接（支持CORS）</text>
        </view>
      </view>

      <!-- 底部间距 -->
      <view class="bottom-space"></view>
    </scroll-view>

    <!-- Carpool 测试内容 -->
    <scroll-view class="test-sections" scroll-y v-if="currentTab === 'carpool'">
      <!-- 1. 创建拼车 -->
      <view class="section">
        <view class="section-title">1️⃣ 创建拼车 (create)</view>
        
        <view class="test-group">
          <text class="group-title">创建拼车房间</text>
          <text class="hint">⚠️ 需要登录</text>
          <input class="input" v-model="carpoolData.title" placeholder="拼车标题" maxlength="50" />
          <input class="input" v-model="carpoolData.script_id" placeholder="剧本ID（可选）" />
          <input class="input" v-model="carpoolData.game_time" placeholder="游戏时间 (2025-11-10 14:00)" />
          <input class="input" v-model="carpoolData.location" placeholder="地点" />
          <input class="input" v-model="carpoolData.location_detail" placeholder="详细地址（可选）" />
          <input class="input" v-model.number="carpoolData.max_players" placeholder="最大人数" type="number" />
          <textarea 
            class="textarea" 
            v-model="carpoolData.description" 
            placeholder="描述（可选）"
            maxlength="200"
          />
          <input class="input" v-model="carpoolData.contact_wechat" placeholder="联系微信（可选）" />
          <button class="btn btn-primary" @click="testCreateCarpool" :disabled="!isLogin">
            创建拼车
          </button>
        </view>
      </view>

      <!-- 2. 拼车列表 -->
      <view class="section">
        <view class="section-title">2️⃣ 拼车列表 (getList)</view>
        
        <view class="test-group">
          <text class="group-title">查询拼车列表</text>
          <view class="input-row">
            <input 
              class="input input-half" 
              v-model.number="carpoolListOptions.page" 
              placeholder="页码"
              type="number"
            />
            <input 
              class="input input-half" 
              v-model.number="carpoolListOptions.pageSize" 
              placeholder="每页数量"
              type="number"
            />
          </view>
          <input class="input" v-model="carpoolListOptions.location" placeholder="地点筛选（可选）" />
          <picker mode="selector" :range="carpoolTypeOptions" range-key="label" @change="onCarpoolTypeChange">
            <view class="picker">
              <text>排序：{{ carpoolTypeOptions.find(t => t.value === carpoolListOptions.type).label }}</text>
              <text class="arrow">></text>
            </view>
          </picker>
          <picker mode="selector" :range="dateFilterOptions" range-key="label" @change="onDateFilterChange">
            <view class="picker">
              <text>时间：{{ dateFilterOptions.find(t => t.value === carpoolListOptions.dateFilter).label }}</text>
              <text class="arrow">></text>
            </view>
          </picker>
          <button class="btn btn-success" @click="testGetCarpoolList">获取拼车列表</button>
        </view>
      </view>

      <!-- 3. 拼车详情 -->
      <view class="section">
        <view class="section-title">3️⃣ 拼车详情 (getDetail)</view>
        
        <view class="test-group">
          <text class="group-title">查看拼车详情</text>
          <input 
            class="input" 
            v-model="testData.roomId" 
            placeholder="请输入拼车ID"
          />
          <button class="btn btn-info" @click="testGetCarpoolDetail">查看详情</button>
        </view>
      </view>

      <!-- 4. 申请加入 -->
      <view class="section">
        <view class="section-title">4️⃣ 申请加入 (apply)</view>
        
        <view class="test-group">
          <text class="group-title">申请加入拼车</text>
          <text class="hint">⚠️ 需要登录</text>
          <input 
            class="input" 
            v-model="testData.applyRoomId" 
            placeholder="拼车ID"
          />
          <textarea 
            class="textarea" 
            v-model="testData.applyMessage" 
            placeholder="申请留言（可选）"
            maxlength="100"
          />
          <button class="btn btn-warning" @click="testApplyCarpool" :disabled="!isLogin">
            申请加入
          </button>
        </view>
      </view>

      <!-- 5. 我的申请 -->
      <view class="section">
        <view class="section-title">5️⃣ 我的申请 (getMyApplications)</view>
        
        <view class="test-group">
          <text class="group-title">查看我的申请列表</text>
          <text class="hint">⚠️ 需要登录</text>
          <view class="input-row">
            <input 
              class="input input-half" 
              v-model.number="testData.applyPage" 
              placeholder="页码"
              type="number"
            />
            <input 
              class="input input-half" 
              v-model.number="testData.applyPageSize" 
              placeholder="每页数量"
              type="number"
            />
          </view>
          <button class="btn btn-primary" @click="testGetMyApplications" :disabled="!isLogin">
            查看我的申请
          </button>
        </view>
      </view>

      <!-- 6. 取消申请 -->
      <view class="section">
        <view class="section-title">6️⃣ 取消申请 (cancelApply)</view>
        
        <view class="test-group">
          <text class="group-title">取消拼车申请</text>
          <text class="hint">⚠️ 需要登录</text>
          <input 
            class="input" 
            v-model="testData.cancelRoomId" 
            placeholder="拼车ID"
          />
          <button class="btn btn-danger" @click="testCancelApply" :disabled="!isLogin">
            取消申请
          </button>
        </view>
      </view>

      <!-- 7. 确认成员 -->
      <view class="section">
        <view class="section-title">7️⃣ 确认成员 (confirmMember)</view>
        
        <view class="test-group">
          <text class="group-title">确认成员（车主操作）</text>
          <text class="hint">⚠️ 需要是车主</text>
          <input 
            class="input" 
            v-model="testData.confirmRoomId" 
            placeholder="拼车ID"
          />
          <input 
            class="input" 
            v-model="testData.confirmUserId" 
            placeholder="用户ID"
          />
          <button class="btn btn-success" @click="testConfirmMember" :disabled="!isLogin">
            确认成员
          </button>
        </view>
      </view>

      <!-- 8. 移除成员 -->
      <view class="section">
        <view class="section-title">8️⃣ 移除成员 (removeMember)</view>
        
        <view class="test-group">
          <text class="group-title">移除成员（车主操作）</text>
          <text class="hint">⚠️ 需要是车主</text>
          <input 
            class="input" 
            v-model="testData.removeRoomId" 
            placeholder="拼车ID"
          />
          <input 
            class="input" 
            v-model="testData.removeUserId" 
            placeholder="用户ID"
          />
          <button class="btn btn-danger" @click="testRemoveMember" :disabled="!isLogin">
            移除成员
          </button>
        </view>
      </view>

      <!-- 9. 更新状态 -->
      <view class="section">
        <view class="section-title">9️⃣ 更新状态 (updateStatus)</view>
        
        <view class="test-group">
          <text class="group-title">更新拼车状态（车主操作）</text>
          <text class="hint">⚠️ 需要是车主</text>
          <input 
            class="input" 
            v-model="testData.statusRoomId" 
            placeholder="拼车ID"
          />
          <picker mode="selector" :range="statusOptions" range-key="label" @change="onStatusChange">
            <view class="picker">
              <text>状态：{{ statusOptions.find(t => t.value === testData.newStatus)?.label || '选择状态' }}</text>
              <text class="arrow">></text>
            </view>
          </picker>
          <button class="btn btn-warning" @click="testUpdateStatus" :disabled="!isLogin">
            更新状态
          </button>
        </view>
      </view>

      <!-- 底部间距 -->
      <view class="bottom-space"></view>
    </scroll-view>

    <!-- Chat 测试内容 -->
    <scroll-view class="test-sections" scroll-y v-if="currentTab === 'chat'">
      <!-- 1. 发送消息 -->
      <view class="section">
        <view class="section-title">1️⃣ 发送消息 (sendMessage)</view>
        
        <view class="test-group">
          <text class="group-title">发送私聊消息</text>
          <text class="hint">⚠️ 需要登录</text>
          <input 
            class="input" 
            v-model="chatData.receiverId" 
            placeholder="接收者用户ID"
          />
          <textarea 
            class="textarea" 
            v-model="chatData.content" 
            placeholder="消息内容"
            maxlength="1000"
          />
          <view class="input-row">
            <text class="label">消息类型：</text>
            <input 
              class="input input-half" 
              v-model.number="chatData.messageType" 
              placeholder="1-文本"
              type="number"
            />
          </view>
          <button class="btn btn-primary" @click="testSendMessage">发送消息</button>
        </view>
      </view>

      <!-- 2. 获取会话列表 -->
      <view class="section">
        <view class="section-title">2️⃣ 获取会话列表 (getConversations)</view>
        
        <view class="test-group">
          <text class="group-title">查看我的会话</text>
          <text class="hint">⚠️ 需要登录</text>
          <view class="input-row">
            <input 
              class="input input-half" 
              v-model.number="conversationsPage" 
              placeholder="页码"
              type="number"
            />
            <input 
              class="input input-half" 
              v-model.number="conversationsPageSize" 
              placeholder="每页数量"
              type="number"
            />
          </view>
          <button class="btn btn-success" @click="testGetConversations">获取会话列表</button>
        </view>
      </view>

      <!-- 3. 获取聊天消息 -->
      <view class="section">
        <view class="section-title">3️⃣ 获取聊天消息 (getMessages)</view>
        
        <view class="test-group">
          <text class="group-title">查看聊天记录</text>
          <text class="hint">⚠️ 需要登录</text>
          <input 
            class="input" 
            v-model="chatUserId" 
            placeholder="对方用户ID"
          />
          <view class="input-row">
            <input 
              class="input input-half" 
              v-model.number="messagesPage" 
              placeholder="页码"
              type="number"
            />
            <input 
              class="input input-half" 
              v-model.number="messagesPageSize" 
              placeholder="每页数量"
              type="number"
            />
          </view>
          <button class="btn btn-info" @click="testGetMessages">获取聊天消息</button>
        </view>
      </view>

      <!-- 4. 标记已读 -->
      <view class="section">
        <view class="section-title">4️⃣ 标记已读 (markRead)</view>
        
        <view class="test-group">
          <text class="group-title">标记消息为已读</text>
          <text class="hint">⚠️ 需要登录</text>
          <input 
            class="input" 
            v-model="chatUserId" 
            placeholder="对方用户ID"
          />
          <input 
            class="input" 
            v-model="chatConversationId" 
            placeholder="会话ID（可选）"
          />
          <button class="btn btn-warning" @click="testMarkRead">标记已读</button>
        </view>
      </view>

      <!-- 5. 删除会话 -->
      <view class="section">
        <view class="section-title">5️⃣ 删除会话 (deleteConversation)</view>
        
        <view class="test-group">
          <text class="group-title">删除会话（软删除）</text>
          <text class="hint">⚠️ 需要登录</text>
          <input 
            class="input" 
            v-model="chatConversationId" 
            placeholder="会话ID"
          />
          <button class="btn btn-danger" @click="testDeleteConversation">删除会话</button>
        </view>
      </view>

      <!-- 6. 获取未读总数 -->
      <view class="section">
        <view class="section-title">6️⃣ 获取未读总数 (getUnreadCount)</view>
        
        <view class="test-group">
          <text class="group-title">获取所有会话的未读消息总数</text>
          <text class="hint">⚠️ 需要登录</text>
          <button class="btn btn-primary" @click="testGetUnreadCount">获取未读总数</button>
        </view>
      </view>

      <!-- 底部间距 -->
      <view class="bottom-space"></view>
    </scroll-view>

    <!-- Post 测试内容 -->
    <scroll-view class="test-sections" scroll-y v-if="currentTab === 'post'">
      <!-- 1. 获取帖子列表 -->
      <view class="section">
        <view class="section-title">1️⃣ 获取帖子列表 (getList)</view>
        
        <view class="test-group">
          <text class="group-title">列表查询选项</text>
          <view class="input-row">
            <input 
              class="input input-half" 
              v-model.number="postListOptions.page" 
              placeholder="页码"
              type="number"
            />
            <input 
              class="input input-half" 
              v-model.number="postListOptions.pageSize" 
              placeholder="每页数量"
              type="number"
            />
          </view>
          
          <input 
            class="input" 
            v-model="postListOptions.userId" 
            placeholder="用户ID（可选，查看某用户的帖子）"
          />
          
          <picker mode="selector" :range="postTypeOptions" range-key="label" @change="onPostTypeChange">
            <view class="picker">
              <text>帖子类型：{{ postTypeOptions.find(t => t.value === postListOptions.type)?.label || '全部' }}</text>
              <text class="arrow">></text>
            </view>
          </picker>
          
          <picker mode="selector" :range="postSortOptions" range-key="label" @change="onPostSortChange">
            <view class="picker">
              <text>排序方式：{{ postSortOptions.find(s => s.value === postListOptions.sortBy).label }}</text>
              <text class="arrow">></text>
            </view>
          </picker>
          
          <button class="btn btn-primary" @click="testGetPostList">获取帖子列表</button>
        </view>
      </view>

      <!-- 2. 发布帖子 -->
      <view class="section">
        <view class="section-title">2️⃣ 发布帖子 (create)</view>
        
        <view class="test-group">
          <text class="group-title">发布测试帖子</text>
          <text class="hint">⚠️ 需要登录</text>
          
          <input 
            class="input" 
            v-model="postData.scriptId" 
            placeholder="剧本ID（必填）"
          />
          
          <textarea 
            class="textarea" 
            v-model="postData.content" 
            placeholder="帖子内容（必填，1-5000字）"
            maxlength="5000"
          />
          
          <input 
            class="input" 
            v-model="postData.tags" 
            placeholder="标签（用逗号分隔，最多5个）"
          />
          
          <input 
            class="input" 
            v-model="postData.location" 
            placeholder="位置（可选）"
          />
          
          <picker mode="selector" :range="postCreateTypeOptions" range-key="label" @change="onPostCreateTypeChange">
            <view class="picker">
              <text>帖子类型：{{ postCreateTypeOptions.find(t => t.value === postData.type).label }}</text>
              <text class="arrow">></text>
            </view>
          </picker>
          
          <button class="btn btn-success" @click="testCreatePost">发布帖子</button>
        </view>
      </view>

      <!-- 3. 获取帖子详情 -->
      <view class="section">
        <view class="section-title">3️⃣ 获取帖子详情 (getDetail)</view>
        
        <view class="test-group">
          <text class="group-title">查看帖子详情（包含评论）</text>
          <input 
            class="input" 
            v-model="postDetailId" 
            placeholder="帖子ID"
          />
          <button class="btn btn-info" @click="testGetPostDetail">获取详情</button>
        </view>
      </view>

      <!-- 4. 点赞/取消点赞 -->
      <view class="section">
        <view class="section-title">4️⃣ 点赞/取消点赞 (toggleLike)</view>
        
        <view class="test-group">
          <text class="group-title">切换点赞状态</text>
          <text class="hint">⚠️ 需要登录</text>
          <input 
            class="input" 
            v-model="postLikeId" 
            placeholder="帖子ID"
          />
          <button class="btn btn-warning" @click="testToggleLike">点赞/取消</button>
        </view>
      </view>

      <!-- 5. 举报帖子 -->
      <view class="section">
        <view class="section-title">5️⃣ 举报帖子 (report)</view>
        
        <view class="test-group">
          <text class="group-title">举报违规内容</text>
          <text class="hint">⚠️ 需要登录</text>
          
          <input 
            class="input" 
            v-model="postReportData.contentId" 
            placeholder="帖子ID"
          />
          
          <picker mode="selector" :range="reportReasonOptions" range-key="label" @change="onReportReasonChange">
            <view class="picker">
              <text>举报原因：{{ reportReasonOptions.find(r => r.value === postReportData.reason)?.label || '请选择' }}</text>
              <text class="arrow">></text>
            </view>
          </picker>
          
          <textarea 
            class="textarea" 
            v-model="postReportData.description" 
            placeholder="详细描述（可选）"
          />
          
          <button class="btn btn-danger" @click="testReportPost">提交举报</button>
        </view>
      </view>

      <!-- 6. 删除帖子 -->
      <view class="section">
        <view class="section-title">6️⃣ 删除帖子 (delete)</view>
        
        <view class="test-group">
          <text class="group-title">删除自己的帖子</text>
          <text class="hint">⚠️ 需要登录，只能删除自己的帖子</text>
          <input 
            class="input" 
            v-model="postDeleteId" 
            placeholder="帖子ID"
          />
          <button class="btn btn-danger" @click="testDeletePost">删除帖子</button>
        </view>
      </view>

      <!-- 底部间距 -->
      <view class="bottom-space"></view>
    </scroll-view>

    <!-- Collection 测试内容 -->
    <scroll-view class="test-sections" scroll-y v-if="currentTab === 'collection'">
      <!-- 1. 添加收藏 -->
      <view class="section">
        <view class="section-title">1️⃣ 添加收藏 (addFavorite)</view>
        
        <view class="test-group">
          <text class="group-title">添加收藏</text>
          <view class="input-row">
            <picker
              class="input input-half"
              mode="selector"
              :range="targetTypeOptions"
              range-key="label"
              :value="targetTypeOptions.findIndex(t => t.value === collectionData.favoriteTargetType)"
              @change="onFavoriteTypeChange"
            >
              <view class="picker-view">
                目标类型: {{ targetTypeOptions.find(t => t.value === collectionData.favoriteTargetType)?.label }}
              </view>
            </picker>
            <input 
              class="input input-half" 
              v-model="collectionData.favoriteTargetId"
              placeholder="目标ID"
            />
          </view>
          <button class="btn btn-primary" @click="testAddFavorite">添加收藏</button>
        </view>
      </view>

      <!-- 2. 取消收藏 -->
      <view class="section">
        <view class="section-title">2️⃣ 取消收藏 (removeFavorite)</view>
        
        <view class="test-group">
          <text class="group-title">取消收藏</text>
          <view class="input-row">
            <picker
              class="input input-half"
              mode="selector"
              :range="targetTypeOptions"
              range-key="label"
              :value="targetTypeOptions.findIndex(t => t.value === collectionData.favoriteTargetType)"
              @change="onFavoriteTypeChange"
            >
              <view class="picker-view">
                目标类型: {{ targetTypeOptions.find(t => t.value === collectionData.favoriteTargetType)?.label }}
              </view>
            </picker>
            <input 
              class="input input-half" 
              v-model="collectionData.favoriteTargetId"
              placeholder="目标ID"
            />
          </view>
          <button class="btn btn-danger" @click="testRemoveFavorite">取消收藏</button>
        </view>
      </view>

      <!-- 3. 获取收藏列表 -->
      <view class="section">
        <view class="section-title">3️⃣ 获取收藏列表 (getFavorites)</view>
        
        <view class="test-group">
          <text class="group-title">收藏列表查询</text>
          <view class="input-row">
            <input 
              class="input input-third" 
              v-model.number="collectionData.favoriteListPage"
              placeholder="页码"
              type="number"
            />
            <input 
              class="input input-third" 
              v-model.number="collectionData.favoriteListPageSize"
              placeholder="每页数量"
              type="number"
            />
            <picker
              class="input input-third"
              mode="selector"
              :range="[{value:'',label:'全部'}, ...targetTypeOptions]"
              range-key="label"
              :value="[{value:'',label:'全部'}, ...targetTypeOptions].findIndex(t => t.value === collectionData.favoriteListType)"
              @change="onFavoriteListTypeChange"
            >
              <view class="picker-view">
                类型: {{ [{value:'',label:'全部'}, ...targetTypeOptions].find(t => t.value === collectionData.favoriteListType)?.label }}
              </view>
            </picker>
          </view>
          <button class="btn btn-primary" @click="testGetFavorites">获取收藏列表</button>
        </view>
      </view>

      <!-- 4. 检查收藏状态 -->
      <view class="section">
        <view class="section-title">4️⃣ 检查收藏状态 (checkFavoriteStatus)</view>
        
        <view class="test-group">
          <text class="group-title">检查是否已收藏</text>
          <view class="input-row">
            <picker
              class="input input-half"
              mode="selector"
              :range="targetTypeOptions"
              range-key="label"
              :value="targetTypeOptions.findIndex(t => t.value === collectionData.checkTargetType)"
              @change="onCheckTypeChange"
            >
              <view class="picker-view">
                目标类型: {{ targetTypeOptions.find(t => t.value === collectionData.checkTargetType)?.label }}
              </view>
            </picker>
            <input 
              class="input input-half" 
              v-model="collectionData.checkTargetId"
              placeholder="目标ID"
            />
          </view>
          <button class="btn btn-info" @click="testCheckFavoriteStatus">检查收藏状态</button>
        </view>
      </view>

      <!-- 5. 添加浏览历史 -->
      <view class="section">
        <view class="section-title">5️⃣ 添加浏览历史 (addHistory)</view>
        
        <view class="test-group">
          <text class="group-title">记录浏览历史</text>
          <view class="input-row">
            <picker
              class="input input-half"
              mode="selector"
              :range="historyTypeOptions"
              range-key="label"
              :value="historyTypeOptions.findIndex(t => t.value === collectionData.historyTargetType)"
              @change="onHistoryTypeChange"
            >
              <view class="picker-view">
                目标类型: {{ historyTypeOptions.find(t => t.value === collectionData.historyTargetType)?.label }}
              </view>
            </picker>
            <input 
              class="input input-half" 
              v-model="collectionData.historyTargetId"
              placeholder="目标ID"
            />
          </view>
          <button class="btn btn-primary" @click="testAddHistory">添加浏览历史</button>
        </view>
      </view>

      <!-- 6. 获取浏览历史 -->
      <view class="section">
        <view class="section-title">6️⃣ 获取浏览历史 (getHistory)</view>
        
        <view class="test-group">
          <text class="group-title">历史记录查询</text>
          <view class="input-row">
            <input 
              class="input input-third" 
              v-model.number="collectionData.historyListPage"
              placeholder="页码"
              type="number"
            />
            <input 
              class="input input-third" 
              v-model.number="collectionData.historyListPageSize"
              placeholder="每页数量"
              type="number"
            />
            <picker
              class="input input-third"
              mode="selector"
              :range="[{value:'',label:'全部'}, ...historyTypeOptions]"
              range-key="label"
              :value="[{value:'',label:'全部'}, ...historyTypeOptions].findIndex(t => t.value === collectionData.historyListType)"
              @change="onHistoryListTypeChange"
            >
              <view class="picker-view">
                类型: {{ [{value:'',label:'全部'}, ...historyTypeOptions].find(t => t.value === collectionData.historyListType)?.label }}
              </view>
            </picker>
          </view>
          <button class="btn btn-primary" @click="testGetHistory">获取浏览历史</button>
        </view>
      </view>

      <!-- 底部间距 -->
      <view class="bottom-space"></view>
    </scroll-view>

    <!-- Shop 测试内容 -->
    <scroll-view class="test-sections" scroll-y v-if="currentTab === 'shop'">
      <!-- 1. 店铺列表 -->
      <view class="section">
        <view class="section-title">1️⃣ 店铺列表 (getList)</view>
        
        <view class="test-group">
          <text class="group-title">查询店铺列表</text>
          <view class="input-row">
            <input 
              class="input input-half" 
              v-model.number="shopData.listPage"
              placeholder="页码"
              type="number"
            />
            <input 
              class="input input-half" 
              v-model.number="shopData.listPageSize"
              placeholder="每页数量"
              type="number"
            />
          </view>
          <input 
            class="input" 
            v-model="shopData.listCity"
            placeholder="城市筛选（可选）"
          />
          <picker
            mode="selector"
            :range="shopSortOptions"
            range-key="label"
            :value="shopSortOptions.findIndex(s => s.value === shopData.listSortBy)"
            @change="onShopSortChange"
          >
            <view class="picker">
              <text>排序：{{ shopSortOptions.find(s => s.value === shopData.listSortBy)?.label }}</text>
              <text class="arrow">></text>
            </view>
          </picker>
          <button class="btn btn-primary" @click="testGetShopList">获取店铺列表</button>
        </view>
      </view>

      <!-- 2. 店铺详情 -->
      <view class="section">
        <view class="section-title">2️⃣ 店铺详情 (getDetail)</view>
        
        <view class="test-group">
          <text class="group-title">查看店铺详情</text>
          <input 
            class="input" 
            v-model="shopData.detailShopId"
            placeholder="请输入店铺ID"
          />
          <button class="btn btn-success" @click="testGetShopDetail">查看详情</button>
        </view>
      </view>

      <!-- 3. 店铺申请 -->
      <view class="section">
        <view class="section-title">3️⃣ 店铺申请 (apply)</view>
        
        <view class="test-group">
          <text class="group-title">提交店铺认证申请</text>
          <text class="hint">⚠️ 需要登录</text>
          
          <input 
            class="input" 
            v-model="shopData.applyData.shopName"
            placeholder="店铺名称"
          />
          <input 
            class="input" 
            v-model="shopData.applyData.contactPhone"
            placeholder="联系电话"
          />
          <input 
            class="input" 
            v-model="shopData.applyData.contactPerson"
            placeholder="联系人"
          />
          <input 
            class="input" 
            v-model="shopData.applyData.contactWechat"
            placeholder="微信号"
          />
          
          <view class="input-row">
            <input 
              class="input input-third" 
              v-model="shopData.applyData.province"
              placeholder="省份"
            />
            <input 
              class="input input-third" 
              v-model="shopData.applyData.city"
              placeholder="城市"
            />
            <input 
              class="input input-third" 
              v-model="shopData.applyData.district"
              placeholder="区县"
            />
          </view>
          
          <input 
            class="input" 
            v-model="shopData.applyData.address"
            placeholder="详细地址"
          />
          <input 
            class="input" 
            v-model="shopData.applyData.businessHours"
            placeholder="营业时间"
          />
          
          <view class="input-row">
            <input 
              class="input input-half" 
              v-model.number="shopData.applyData.tableCount"
              placeholder="桌数"
              type="number"
            />
            <input 
              class="input input-half" 
              v-model.number="shopData.applyData.avgPrice"
              placeholder="人均消费"
              type="number"
            />
          </view>
          
          <textarea 
            class="textarea" 
            v-model="shopData.applyData.description"
            placeholder="店铺描述"
            maxlength="500"
          />
          
          <input 
            class="input" 
            v-model="shopData.applyData.licenseImage"
            placeholder="营业执照图片URL"
          />
          <input 
            class="input" 
            v-model="shopData.applyData.licenseNumber"
            placeholder="营业执照编号"
          />
          
          <button class="btn btn-warning" @click="testShopApply">提交申请</button>
        </view>
      </view>

      <!-- 底部间距 -->
      <view class="bottom-space"></view>
    </scroll-view>

    <!-- Storyteller 测试内容 -->
    <scroll-view class="test-sections" scroll-y v-if="currentTab === 'storyteller'">
      <!-- 1. 说书人列表 -->
      <view class="section">
        <view class="section-title">1️⃣ 说书人列表 (getList)</view>
        
        <view class="test-group">
          <text class="group-title">查询说书人列表</text>
          <view class="input-row">
            <input 
              class="input input-half" 
              v-model.number="storytellerData.listPage"
              placeholder="页码"
              type="number"
            />
            <input 
              class="input input-half" 
              v-model.number="storytellerData.listPageSize"
              placeholder="每页数量"
              type="number"
            />
          </view>
          <input 
            class="input" 
            v-model="storytellerData.listKeyword"
            placeholder="搜索关键词（可选）"
          />
          <picker
            mode="selector"
            :range="storytellerFilterOptions"
            range-key="label"
            :value="storytellerFilterOptions.findIndex(f => f.value === storytellerData.listFilter)"
            @change="onStorytellerFilterChange"
          >
            <view class="picker">
              <text>筛选：{{ storytellerFilterOptions.find(f => f.value === storytellerData.listFilter)?.label }}</text>
              <text class="arrow">></text>
            </view>
          </picker>
          <button class="btn btn-primary" @click="testGetStorytellerList">获取说书人列表</button>
        </view>
      </view>

      <!-- 2. 说书人详情 -->
      <view class="section">
        <view class="section-title">2️⃣ 说书人详情 (getDetail)</view>
        
        <view class="test-group">
          <text class="group-title">查看说书人详情</text>
          <input 
            class="input" 
            v-model="storytellerData.detailStoryId"
            placeholder="请输入说书人ID"
          />
          <button class="btn btn-success" @click="testGetStorytellerDetail">查看详情</button>
        </view>
      </view>

      <!-- 3. 评价列表 -->
      <view class="section">
        <view class="section-title">3️⃣ 评价列表 (getReviews)</view>
        
        <view class="test-group">
          <text class="group-title">查看说书人评价</text>
          <input 
            class="input" 
            v-model="storytellerData.reviewsStoryId"
            placeholder="说书人ID"
          />
          <view class="input-row">
            <input 
              class="input input-half" 
              v-model.number="storytellerData.reviewsPage"
              placeholder="页码"
              type="number"
            />
            <input 
              class="input input-half" 
              v-model.number="storytellerData.reviewsPageSize"
              placeholder="每页数量"
              type="number"
            />
          </view>
          <button class="btn btn-info" @click="testGetStorytellerReviews">获取评价列表</button>
        </view>
      </view>

      <!-- 4. 计算热度 -->
      <view class="section">
        <view class="section-title">4️⃣ 计算热度 (calculateHeat)</view>
        
        <view class="test-group">
          <text class="group-title">计算说书人热度分数</text>
          <text class="hint">⚠️ 留空则计算所有认证说书人</text>
          <input 
            class="input" 
            v-model="storytellerData.heatUserId"
            placeholder="用户ID（可选）"
          />
          <button class="btn btn-warning" @click="testCalculateHeat">开始计算</button>
        </view>
      </view>

      <!-- 底部间距 -->
      <view class="bottom-space"></view>
    </scroll-view>
  </view>
</template>

<script>
import Auth from '@/utils/auth.js'

export default {
  name: 'ScriptTest',
  
  data() {
    return {
      // 页签
      currentTab: 'script',
      tabs: [
        { value: 'script', label: 'Script', icon: '🎬' },
        { value: 'carpool', label: 'Carpool', icon: '🚗' },
        { value: 'chat', label: 'Chat', icon: '💬' },
        { value: 'post', label: 'Post', icon: '📝' },
        { value: 'collection', label: 'Collection', icon: '⭐' },
        { value: 'shop', label: 'Shop', icon: '🏪' },
        { value: 'storyteller', label: 'Storyteller', icon: '🎭' }
      ],
      
      // 云对象
      scriptObj: null,
      carpoolObj: null,
      chatObj: null,
      postObj: null,
      collectionObj: null,
      shopObj: null,
      storytellerObj: null,
      isLogin: false,
      lastResult: null,
      
      // 列表查询选项
      listOptions: {
        page: 1,
        pageSize: 10,
        keyword: '',
        type: 'all'
      },
      
      typeOptions: [
        { value: 'all', label: '最新' },
        { value: 'hot', label: '热门' },
        { value: 'rating', label: '高分' },
        { value: 'download', label: '下载量' },
        { value: 'new', label: '最新发布' }
      ],
      
      // 测试数据
      testData: {
        scriptId: '',
        deleteScriptId: '',
        jsonScriptId: '',
        heatScriptId: '',
        urlScriptId: ''
      },
      
      // 上传数据
      uploadData: {
        title: '测试剧本',
        author: '测试作者',
        description: '这是一个测试剧本'
      },
      useTestJson: true,
      
      // 我的剧本分页
      myUploadsPage: 1,
      myUploadsPageSize: 10,
      
      // 评价数据
      reviewData: {
        scriptId: '',
        content: '',
        rating: 5
      },
      
      ratingOptions: [1, 2, 3, 4, 5],
      
      // 评分数据
      rateData: {
        scriptId: '',
        rating: 5,
        comment: ''
      },
      
      // 排行榜数据
      rankingPage: 1,
      rankingPageSize: 10,
      rankingPeriod: 'all',
      minRatingCount: 5,
      
      periodOptions: [
        { value: 'all', label: '总榜' },
        { value: 'weekly', label: '周榜' },
        { value: 'monthly', label: '月榜' }
      ],
      
      // Carpool 相关数据
      carpoolData: {
        title: '周末拼车',
        script_id: '',
        game_time: '2025-11-10 14:00',
        location: '上海市',
        location_detail: '',
        max_players: 7,
        description: '',
        contact_wechat: ''
      },
      
      carpoolListOptions: {
        page: 1,
        pageSize: 20,
        type: 'latest',
        location: '',
        dateFilter: ''
      },
      
      carpoolTypeOptions: [
        { value: 'latest', label: '最新' },
        { value: 'urgent', label: '即将开始' },
        { value: 'hot', label: '最热门' }
      ],
      
      dateFilterOptions: [
        { value: '', label: '全部' },
        { value: 'today', label: '今天' },
        { value: 'week', label: '本周' }
      ],
      
      statusOptions: [
        { value: 1, label: '招募中' },
        { value: 2, label: '已满员' },
        { value: 3, label: '已完成' },
        { value: 4, label: '已取消' }
      ],
      
      // Chat 相关数据
      chatData: {
        receiverId: '',
        content: '你好，在吗？',
        messageType: 1
      },
      
      chatUserId: '',  // 用于获取聊天记录
      chatConversationId: '',  // 用于标记已读和删除
      
      conversationsPage: 1,
      conversationsPageSize: 20,
      
      messagesPage: 1,
      messagesPageSize: 50,
      
      // Post 相关数据
      postListOptions: {
        page: 1,
        pageSize: 10,
        type: null,
        userId: '',
        sortBy: 'time'
      },
      
      postTypeOptions: [
        { value: null, label: '全部' },
        { value: 1, label: '普通帖子' },
        { value: 2, label: '活动帖子' },
        { value: 3, label: '求助帖子' }
      ],
      
      postSortOptions: [
        { value: 'time', label: '最新发布' },
        { value: 'hot', label: '热门排序' },
        { value: 'following', label: '关注动态' }
      ],
      
      postData: {
        scriptId: '',
        content: '这是一条测试帖子，用于测试 Post 云对象的 create 方法。',
        tags: '测试,云对象',
        location: '',
        type: 1
      },
      
      postCreateTypeOptions: [
        { value: 1, label: '普通帖子' },
        { value: 2, label: '活动帖子' },
        { value: 3, label: '求助帖子' }
      ],
      
      postDetailId: '',
      postLikeId: '',
      postDeleteId: '',
      
      postReportData: {
        contentId: '',
        contentType: 'post',
        reason: '',
        description: ''
      },
      
      reportReasonOptions: [
        { value: 'spam', label: '垃圾广告' },
        { value: 'illegal', label: '违法违规' },
        { value: 'abuse', label: '辱骂攻击' },
        { value: 'porn', label: '色情低俗' },
        { value: 'other', label: '其他' }
      ],
      
      // ========== Collection 相关数据 ==========
      collectionData: {
        // 收藏功能
        favoriteTargetType: 'script',
        favoriteTargetId: '',
        favoriteListPage: 1,
        favoriteListPageSize: 10,
        favoriteListType: '',
        
        // 历史记录功能
        historyTargetType: 'script',
        historyTargetId: '',
        historyListPage: 1,
        historyListPageSize: 10,
        historyListType: '',
        
        // 检查收藏状态
        checkTargetType: 'script',
        checkTargetId: ''
      },
      
      targetTypeOptions: [
        { value: 'script', label: '剧本' },
        { value: 'post', label: '帖子' }
      ],
      
      historyTypeOptions: [
        { value: 'script', label: '剧本' },
        { value: 'post', label: '帖子' },
        { value: 'carpool', label: '拼车' }
      ],
      
      // ========== Shop 数据 ==========
      shopData: {
        // 店铺列表
        listPage: 1,
        listPageSize: 10,
        listCity: '',
        listSortBy: 'recommend',
        
        // 店铺详情
        detailShopId: '',
        
        // 店铺申请
        applyData: {
          shopName: '测试店铺',
          shopLogo: '',
          shopImages: [],
          contactPhone: '13800138000',
          contactPerson: '测试联系人',
          contactWechat: 'test_wechat',
          province: '广东省',
          city: '深圳市',
          district: '南山区',
          address: '科技园路1号',
          businessHours: '9:00-22:00',
          tableCount: 10,
          avgPrice: 100,
          facilities: ['wifi', 'parking'],
          description: '这是一家测试店铺',
          licenseImage: 'test_license.jpg',
          licenseNumber: '123456789'
        }
      },
      
      shopSortOptions: [
        { value: 'recommend', label: '推荐' },
        { value: 'rating', label: '评分' },
        { value: 'newest', label: '最新' }
      ],
      
      // ========== Storyteller 数据 ==========
      storytellerData: {
        // 列表
        listPage: 1,
        listPageSize: 10,
        listFilter: 'all',
        listKeyword: '',
        
        // 详情
        detailStoryId: '',
        
        // 评价列表
        reviewsStoryId: '',
        reviewsPage: 1,
        reviewsPageSize: 10,
        
        // 计算热度
        heatUserId: ''
      },
      
      storytellerFilterOptions: [
        { value: 'all', label: '全部' },
        { value: 'certified', label: '认证' },
        { value: 'high_rating', label: '高评分' },
        { value: 'nearby', label: '附近' }
      ]
    }
  },
  
  onLoad() {
    console.log('📱 云对象测试中心加载')
    // 初始化 Script 云对象
    this.scriptObj = uniCloud.importObject('script', {
      customUI: true,
      debugFunction: false
    })
    // 初始化 Carpool 云对象
    this.carpoolObj = uniCloud.importObject('carpool', {
      customUI: true,
      debugFunction: false
    })
    // 初始化 Chat 云对象
    this.chatObj = uniCloud.importObject('chat', {
      customUI: true,
      debugFunction: false
    })
    
    // 初始化 Post 云对象
    this.postObj = uniCloud.importObject('post', {
      customUI: true,
      debugFunction: false
    })
    
    // 初始化 Collection 云对象
    this.collectionObj = uniCloud.importObject('collection', {
      customUI: true,
      debugFunction: false
    })
    
    // 初始化 Shop 云对象
    this.shopObj = uniCloud.importObject('shop', {
      customUI: true,
      debugFunction: false
    })
    
    // 初始化 Storyteller 云对象
    this.storytellerObj = uniCloud.importObject('storyteller', {
      customUI: true,
      debugFunction: false
    })
    
    this.checkLoginStatus()
  },
  
  methods: {
    // 检查登录状态
    checkLoginStatus() {
      this.isLogin = Auth.isLogin()
      if (this.isLogin) {
        const userInfo = Auth.getUserInfo()
        console.log('✅ 当前已登录:', userInfo.nickname)
      }
    },
    
    // 显示测试结果
    showResult(success, message, data = null) {
      this.lastResult = { success, message, data }
      
      uni.showToast({
        title: message,
        icon: success ? 'success' : 'none',
        duration: 2000
      })
      
      console.log(success ? '✅' : '❌', message, data)
    },
    
    // 格式化数据（截断过长的内容）
    formatData(data) {
      const str = JSON.stringify(data, null, 2)
      if (str.length > 500) {
        return str.substring(0, 500) + '\n...(数据过长，已截断)'
      }
      return str
    },
    
    // 1. 测试获取剧本列表
    async testGetList() {
      try {
        uni.showLoading({ title: '加载中...' })
        
        const result = await this.scriptObj.getList(this.listOptions)
        
        uni.hideLoading()
        
        if (result.code === 0) {
          this.showResult(true, `获取成功，共${result.data.total}个剧本`, {
            total: result.data.total,
            page: result.data.page,
            listCount: result.data.list.length,
            firstScript: result.data.list[0] ? {
              _id: result.data.list[0]._id,
              title: result.data.list[0].title,
              author: result.data.list[0].author
            } : null
          })
          
          // 自动填充第一个剧本ID
          if (result.data.list.length > 0) {
            this.testData.scriptId = result.data.list[0]._id
          }
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '获取失败')
      }
    },
    
    // 2. 测试获取剧本详情
    async testGetDetail() {
      if (!this.testData.scriptId) {
        return this.showResult(false, '请输入剧本ID')
      }
      
      try {
        uni.showLoading({ title: '加载中...' })
        
        const result = await this.scriptObj.getDetail(this.testData.scriptId)
        
        uni.hideLoading()
        
        if (result.code === 0) {
          this.showResult(true, '获取成功', {
            _id: result.data._id,
            title: result.data.title,
            author: result.data.author,
            view_count: result.data.view_count,
            status: result.data.status,
            creator: result.data.creator
          })
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '获取失败')
      }
    },
    
    // 3. 测试上传剧本
    async testUpload() {
      if (!this.uploadData.title || !this.uploadData.author) {
        return this.showResult(false, '请填写标题和作者')
      }
      
      try {
        uni.showLoading({ title: '上传中...' })
        
        // 测试JSON数据
        const testJson = {
          meta: [
            { id: 1, name: "恶魔", team: "恶魔", ability: "测试能力" },
            { id: 2, name: "爪牙", team: "爪牙", ability: "测试能力" },
            { id: 3, name: "外来者", team: "外来者", ability: "测试能力" },
            { id: 4, name: "镇民", team: "镇民", ability: "测试能力" }
          ],
          name: this.uploadData.title
        }
        
        const result = await this.scriptObj.upload({
          title: this.uploadData.title,
          author: this.uploadData.author,
          description: this.uploadData.description,
          json: this.useTestJson ? testJson : {},
          user_images: []
        })
        
        uni.hideLoading()
        
        if (result.code === 0) {
          this.showResult(true, '上传成功！', {
            scriptId: result.data.scriptId,
            previewGenerated: result.data.previewGenerated
          })
          
          // 自动填充到删除测试
          this.testData.deleteScriptId = result.data.scriptId
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '上传失败')
      }
    },
    
    // 4. 测试获取我的剧本
    async testGetMyUploads() {
      try {
        uni.showLoading({ title: '加载中...' })
        
        const result = await this.scriptObj.getMyUploads(
          this.myUploadsPage,
          this.myUploadsPageSize
        )
        
        uni.hideLoading()
        
        if (result.code === 0) {
          this.showResult(true, `获取成功，共${result.data.total}个剧本`, {
            total: result.data.total,
            listCount: result.data.list.length,
            scripts: result.data.list.map(s => ({
              _id: s._id,
              title: s.title,
              status: s.status
            }))
          })
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '获取失败')
      }
    },
    
    // 5. 测试删除剧本
    async testDelete() {
      if (!this.testData.deleteScriptId) {
        return this.showResult(false, '请输入要删除的剧本ID')
      }
      
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这个剧本吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              uni.showLoading({ title: '删除中...' })
              
              const result = await this.scriptObj.delete(this.testData.deleteScriptId)
              
              uni.hideLoading()
              
              if (result.code === 0) {
                this.showResult(true, '删除成功')
                this.testData.deleteScriptId = ''
              } else {
                this.showResult(false, result.message)
              }
            } catch (error) {
              uni.hideLoading()
              this.showResult(false, error.message || '删除失败')
            }
          }
        }
      })
    },
    
    // 排序类型改变
    onTypeChange(e) {
      this.listOptions.type = this.typeOptions[e.detail.value].value
    },
    
    // 切换测试JSON
    toggleTestJson() {
      this.useTestJson = !this.useTestJson
    },
    
    // 6. 测试创建评价
    async testCreateReview() {
      if (!this.reviewData.scriptId) {
        return this.showResult(false, '请输入剧本ID')
      }
      
      if (!this.reviewData.content) {
        return this.showResult(false, '请输入评价内容')
      }
      
      try {
        uni.showLoading({ title: '提交中...' })
        
        const result = await this.scriptObj.createReview(
          this.reviewData.scriptId,
          this.reviewData.content,
          this.reviewData.rating
        )
        
        uni.hideLoading()
        
        if (result.code === 0) {
          this.showResult(true, '评价成功', {
            review_id: result.data.review_id,
            new_rating: result.data.script_rating
          })
          
          // 清空表单
          this.reviewData.content = ''
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '评价失败')
      }
    },
    
    // 7. 测试评分
    async testRate() {
      if (!this.rateData.scriptId) {
        return this.showResult(false, '请输入剧本ID')
      }
      
      try {
        uni.showLoading({ title: '评分中...' })
        
        const result = await this.scriptObj.rate(
          this.rateData.scriptId,
          this.rateData.rating,
          this.rateData.comment
        )
        
        uni.hideLoading()
        
        if (result.code === 0) {
          this.showResult(true, result.message, result.data)
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '评分失败')
      }
    },
    
    // 8. 测试获取JSON
    async testGetJson() {
      if (!this.testData.jsonScriptId) {
        return this.showResult(false, '请输入剧本ID')
      }
      
      try {
        uni.showLoading({ title: '加载中...' })
        
        const result = await this.scriptObj.getJson(this.testData.jsonScriptId)
        
        uni.hideLoading()
        
        if (result.code === 0) {
          this.showResult(true, '获取成功', {
            title: result.data.title,
            json_length: JSON.stringify(result.data.json_data).length
          })
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '获取失败')
      }
    },
    
    // 9. 测试热门排行
    async testGetRankingHot() {
      try {
        uni.showLoading({ title: '加载中...' })
        
        const result = await this.scriptObj.getRankingHot(
          this.rankingPage,
          this.rankingPageSize,
          this.rankingPeriod
        )
        
        uni.hideLoading()
        
        if (result.code === 0) {
          this.showResult(true, `获取成功，共${result.data.total}个`, {
            total: result.data.total,
            listCount: result.data.list.length,
            topScript: result.data.list[0]
          })
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '获取失败')
      }
    },
    
    // 10. 测试最新排行
    async testGetRankingNew() {
      try {
        uni.showLoading({ title: '加载中...' })
        
        const result = await this.scriptObj.getRankingNew(
          this.rankingPage,
          this.rankingPageSize
        )
        
        uni.hideLoading()
        
        if (result.code === 0) {
          this.showResult(true, `获取成功，共${result.data.total}个`, {
            total: result.data.total,
            listCount: result.data.list.length,
            newestScript: result.data.list[0]
          })
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '获取失败')
      }
    },
    
    // 11. 测试评分排行
    async testGetRankingRating() {
      try {
        uni.showLoading({ title: '加载中...' })
        
        const result = await this.scriptObj.getRankingRating(
          this.rankingPage,
          this.rankingPageSize,
          this.minRatingCount
        )
        
        uni.hideLoading()
        
        if (result.code === 0) {
          this.showResult(true, `获取成功，共${result.data.total}个`, {
            total: result.data.total,
            listCount: result.data.list.length,
            topScript: result.data.list[0]
          })
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '获取失败')
      }
    },
    
    // 12. 测试下载排行
    async testGetRankingDownload() {
      try {
        uni.showLoading({ title: '加载中...' })
        
        const result = await this.scriptObj.getRankingDownload(
          this.rankingPage,
          this.rankingPageSize,
          this.rankingPeriod
        )
        
        uni.hideLoading()
        
        if (result.code === 0) {
          this.showResult(true, `获取成功，共${result.data.total}个`, {
            total: result.data.total,
            listCount: result.data.list.length,
            topScript: result.data.list[0]
          })
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '获取失败')
      }
    },
    
    // 13. 测试计算热度
    async testCalculateHeat() {
      try {
        uni.showLoading({ title: '计算中...' })
        
        const result = await this.scriptObj.calculateHeat(
          this.testData.heatScriptId || null
        )
        
        uni.hideLoading()
        
        if (result.code === 0) {
          this.showResult(true, result.message, result.data)
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '计算失败')
      }
    },
    
    // 14. 测试生成JSON链接
    async testGenerateJsonUrl() {
      if (!this.testData.urlScriptId) {
        return this.showResult(false, '请输入剧本ID')
      }
      
      try {
        uni.showLoading({ title: '生成中...' })
        
        const result = await this.scriptObj.generateJsonUrl(this.testData.urlScriptId)
        
        uni.hideLoading()
        
        if (result.code === 0) {
          const displayData = {
            url: result.data.url,
            type: result.data.type,
            cors: result.data.cors ? '✅ 支持' : '❌ 不支持'
          }
          
          // 如果有提示信息，添加到显示数据中
          if (result.data.note) {
            displayData.note = result.data.note
          }
          if (result.data.alternative) {
            displayData.alternative = result.data.alternative
          }
          
          this.showResult(true, '生成成功', displayData)
          
          // 复制链接到剪贴板
          uni.setClipboardData({
            data: result.data.url,
            success: () => {
              console.log('✅ 链接已复制到剪贴板')
              uni.showToast({
                title: '链接已复制',
                icon: 'success',
                duration: 2000
              })
            }
          })
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '生成失败')
      }
    },
    
    // Picker 事件
    onReviewRatingChange(e) {
      this.reviewData.rating = this.ratingOptions[e.detail.value]
    },
    
    onRateChange(e) {
      this.rateData.rating = this.ratingOptions[e.detail.value]
    },
    
    onPeriodChange(e) {
      this.rankingPeriod = this.periodOptions[e.detail.value].value
    },
    
    // ========== 页签切换 ==========
    switchTab(tab) {
      this.currentTab = tab
      console.log('📑 切换到:', tab)
    },
    
    // ========== Carpool 测试方法 ==========
    
    // 1. 创建拼车
    async testCreateCarpool() {
      if (!this.carpoolData.title || !this.carpoolData.game_time || !this.carpoolData.location) {
        uni.showToast({
          title: '请填写必填项',
          icon: 'none'
        })
        return
      }
      
      try {
        uni.showLoading({ title: '创建中...' })
        
        const result = await this.carpoolObj.create(this.carpoolData)
        
        uni.hideLoading()
        
        if (result.code === 0) {
          this.showResult(true, '创建成功', result.data)
          // 清空部分表单
          this.carpoolData.title = '周末拼车'
          this.carpoolData.description = ''
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '创建失败')
      }
    },
    
    // 2. 获取拼车列表
    async testGetCarpoolList() {
      try {
        uni.showLoading({ title: '加载中...' })
        
        const result = await this.carpoolObj.getList(this.carpoolListOptions)
        
        uni.hideLoading()
        
        if (result.code === 0) {
          this.showResult(true, `获取成功，共 ${result.data.total} 条`, {
            total: result.data.total,
            count: result.data.list.length,
            hasNext: result.data.hasNext,
            sample: result.data.list[0]
          })
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '获取失败')
      }
    },
    
    // 3. 获取拼车详情
    async testGetCarpoolDetail() {
      if (!this.testData.roomId) {
        uni.showToast({
          title: '请输入拼车ID',
          icon: 'none'
        })
        return
      }
      
      try {
        uni.showLoading({ title: '加载中...' })
        
        const result = await this.carpoolObj.getDetail(this.testData.roomId)
        
        uni.hideLoading()
        
        if (result.code === 0) {
          this.showResult(true, '获取成功', {
            title: result.data.title,
            location: result.data.location,
            game_time: result.data.game_time,
            current_players: result.data.current_players,
            max_players: result.data.max_players,
            status: result.data.status,
            members_count: result.data.members?.length || 0
          })
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '获取失败')
      }
    },
    
    // 4. 申请加入拼车
    async testApplyCarpool() {
      if (!this.testData.applyRoomId) {
        uni.showToast({
          title: '请输入拼车ID',
          icon: 'none'
        })
        return
      }
      
      try {
        uni.showLoading({ title: '申请中...' })
        
        const result = await this.carpoolObj.apply(
          this.testData.applyRoomId,
          this.testData.applyMessage
        )
        
        uni.hideLoading()
        
        if (result.code === 0) {
          this.showResult(true, result.message, result.data)
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '申请失败')
      }
    },
    
    // 5. 获取我的申请列表
    async testGetMyApplications() {
      try {
        uni.showLoading({ title: '加载中...' })
        
        const result = await this.carpoolObj.getMyApplications(
          this.testData.applyPage || 1,
          this.testData.applyPageSize || 10
        )
        
        uni.hideLoading()
        
        if (result.code === 0) {
          this.showResult(true, `获取成功，共 ${result.data.total} 条`, {
            total: result.data.total,
            count: result.data.list.length,
            sample: result.data.list[0]
          })
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '获取失败')
      }
    },
    
    // 6. 取消申请
    async testCancelApply() {
      if (!this.testData.cancelRoomId) {
        uni.showToast({
          title: '请输入拼车ID',
          icon: 'none'
        })
        return
      }
      
      try {
        uni.showLoading({ title: '取消中...' })
        
        const result = await this.carpoolObj.cancelApply(this.testData.cancelRoomId)
        
        uni.hideLoading()
        
        if (result.code === 0) {
          this.showResult(true, result.message)
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '取消失败')
      }
    },
    
    // 7. 确认成员
    async testConfirmMember() {
      if (!this.testData.confirmRoomId || !this.testData.confirmUserId) {
        uni.showToast({
          title: '请填写完整信息',
          icon: 'none'
        })
        return
      }
      
      try {
        uni.showLoading({ title: '确认中...' })
        
        const result = await this.carpoolObj.confirmMember(
          this.testData.confirmRoomId,
          this.testData.confirmUserId
        )
        
        uni.hideLoading()
        
        if (result.code === 0) {
          this.showResult(true, result.message)
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '确认失败')
      }
    },
    
    // 8. 移除成员
    async testRemoveMember() {
      if (!this.testData.removeRoomId || !this.testData.removeUserId) {
        uni.showToast({
          title: '请填写完整信息',
          icon: 'none'
        })
        return
      }
      
      try {
        uni.showLoading({ title: '移除中...' })
        
        const result = await this.carpoolObj.removeMember(
          this.testData.removeRoomId,
          this.testData.removeUserId
        )
        
        uni.hideLoading()
        
        if (result.code === 0) {
          this.showResult(true, result.message)
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '移除失败')
      }
    },
    
    // 9. 更新状态
    async testUpdateStatus() {
      if (!this.testData.statusRoomId || this.testData.newStatus === undefined) {
        uni.showToast({
          title: '请填写完整信息',
          icon: 'none'
        })
        return
      }
      
      try {
        uni.showLoading({ title: '更新中...' })
        
        const result = await this.carpoolObj.updateStatus(
          this.testData.statusRoomId,
          this.testData.newStatus
        )
        
        uni.hideLoading()
        
        if (result.code === 0) {
          this.showResult(true, result.message)
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '更新失败')
      }
    },
    
    // Carpool Picker 事件
    onCarpoolTypeChange(e) {
      this.carpoolListOptions.type = this.carpoolTypeOptions[e.detail.value].value
    },
    
    onDateFilterChange(e) {
      this.carpoolListOptions.dateFilter = this.dateFilterOptions[e.detail.value].value
    },
    
    onStatusChange(e) {
      this.testData.newStatus = this.statusOptions[e.detail.value].value
    },
    
    // ========== Chat 测试方法 ==========
    
    // 1. 发送消息
    async testSendMessage() {
      if (!this.chatData.receiverId || !this.chatData.content) {
        uni.showToast({
          title: '请填写完整信息',
          icon: 'none'
        })
        return
      }
      
      try {
        uni.showLoading({ title: '发送中...' })
        
        const result = await this.chatObj.sendMessage(
          this.chatData.receiverId,
          this.chatData.content,
          this.chatData.messageType
        )
        
        uni.hideLoading()
        
        if (result.code === 0) {
          this.showResult(true, `消息发送成功！会话ID: ${result.data.conversation_id}`, result.data)
          // 清空输入
          this.chatData.content = '你好，在吗？'
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '发送失败')
      }
    },
    
    // 2. 获取会话列表
    async testGetConversations() {
      try {
        uni.showLoading({ title: '加载中...' })
        
        const result = await this.chatObj.getConversations(
          this.conversationsPage,
          this.conversationsPageSize
        )
        
        uni.hideLoading()
        
        if (result.code === 0) {
          const count = result.data.list.length
          this.showResult(true, `获取成功！共 ${count} 个会话，总计 ${result.data.total} 个`, result.data)
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '获取失败')
      }
    },
    
    // 3. 获取聊天消息
    async testGetMessages() {
      if (!this.chatUserId) {
        uni.showToast({
          title: '请输入用户ID',
          icon: 'none'
        })
        return
      }
      
      try {
        uni.showLoading({ title: '加载中...' })
        
        const result = await this.chatObj.getMessages(
          this.chatUserId,
          this.messagesPage,
          this.messagesPageSize
        )
        
        uni.hideLoading()
        
        if (result.code === 0) {
          const count = result.data.list.length
          this.showResult(true, `获取成功！共 ${count} 条消息，总计 ${result.data.total} 条`, result.data)
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '获取失败')
      }
    },
    
    // 4. 标记已读
    async testMarkRead() {
      if (!this.chatUserId && !this.chatConversationId) {
        uni.showToast({
          title: '请输入用户ID或会话ID',
          icon: 'none'
        })
        return
      }
      
      try {
        uni.showLoading({ title: '标记中...' })
        
        const result = await this.chatObj.markRead(
          this.chatUserId,
          this.chatConversationId || null
        )
        
        uni.hideLoading()
        
        if (result.code === 0) {
          this.showResult(true, `标记成功！共标记 ${result.data.marked_count} 条消息`, result.data)
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '标记失败')
      }
    },
    
    // 5. 删除会话
    async testDeleteConversation() {
      if (!this.chatConversationId) {
        uni.showToast({
          title: '请输入会话ID',
          icon: 'none'
        })
        return
      }
      
      try {
        uni.showLoading({ title: '删除中...' })
        
        const result = await this.chatObj.deleteConversation(this.chatConversationId)
        
        uni.hideLoading()
        
        if (result.code === 0) {
          this.showResult(true, '会话删除成功！', result.data)
          // 清空输入
          this.chatConversationId = ''
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '删除失败')
      }
    },
    
    // 6. 获取未读总数
    async testGetUnreadCount() {
      try {
        uni.showLoading({ title: '加载中...' })
        
        const result = await this.chatObj.getUnreadCount()
        
        uni.hideLoading()
        
        if (result.code === 0) {
          this.showResult(true, `未读消息总数: ${result.data.total_unread} 条`, result.data)
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '获取失败')
      }
    },
    
    // ==================== Post 测试方法 ====================
    
    /**
     * 1. 测试获取帖子列表
     */
    async testGetPostList() {
      try {
        uni.showLoading({ title: '加载中...' })
        
        const options = {
          page: this.postListOptions.page,
          pageSize: this.postListOptions.pageSize
        }
        
        if (this.postListOptions.type !== null) {
          options.type = this.postListOptions.type
        }
        
        if (this.postListOptions.userId) {
          options.userId = this.postListOptions.userId
        }
        
        if (this.postListOptions.sortBy) {
          options.sortBy = this.postListOptions.sortBy
        }
        
        const result = await this.postObj.getList(options)
        
        uni.hideLoading()
        
        if (result.code === 0) {
          this.showResult(true, `获取成功！共 ${result.data.total} 条帖子`, result.data)
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '获取失败')
      }
    },
    
    /**
     * 2. 测试发布帖子
     */
    async testCreatePost() {
      try {
        if (!this.postData.scriptId) {
          this.showResult(false, '请输入剧本ID')
          return
        }
        
        if (!this.postData.content.trim()) {
          this.showResult(false, '请输入帖子内容')
          return
        }
        
        uni.showLoading({ title: '发布中...' })
        
        const postData = {
          scriptId: this.postData.scriptId,
          content: this.postData.content,
          type: this.postData.type
        }
        
        // 处理标签
        if (this.postData.tags) {
          postData.tags = this.postData.tags.split(',').map(t => t.trim()).filter(t => t)
        }
        
        if (this.postData.location) {
          postData.location = this.postData.location
        }
        
        const result = await this.postObj.create(postData)
        
        uni.hideLoading()
        
        if (result.code === 0) {
          this.showResult(true, '发布成功！', result.data)
          // 可以记录帖子ID以便测试其他功能
          this.postDetailId = result.data.post_id
          this.postLikeId = result.data.post_id
        } else {
          this.showResult(false, result.message, result.data)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '发布失败')
      }
    },
    
    /**
     * 3. 测试获取帖子详情
     */
    async testGetPostDetail() {
      try {
        if (!this.postDetailId) {
          this.showResult(false, '请输入帖子ID')
          return
        }
        
        uni.showLoading({ title: '加载中...' })
        
        const result = await this.postObj.getDetail(this.postDetailId)
        
        uni.hideLoading()
        
        if (result.code === 0) {
          const post = result.data
          this.showResult(
            true, 
            `详情加载成功！\n浏览：${post.view_count} 点赞：${post.like_count} 评论：${post.comment_count}\n已点赞：${post.isLiked ? '是' : '否'}`, 
            post
          )
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '获取失败')
      }
    },
    
    /**
     * 4. 测试点赞/取消点赞
     */
    async testToggleLike() {
      try {
        if (!this.postLikeId) {
          this.showResult(false, '请输入帖子ID')
          return
        }
        
        uni.showLoading({ title: '处理中...' })
        
        const result = await this.postObj.toggleLike(this.postLikeId)
        
        uni.hideLoading()
        
        if (result.code === 0) {
          this.showResult(
            true, 
            `${result.message}\n当前点赞数：${result.data.likeCount}`, 
            result.data
          )
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '操作失败')
      }
    },
    
    /**
     * 5. 测试举报帖子
     */
    async testReportPost() {
      try {
        if (!this.postReportData.contentId) {
          this.showResult(false, '请输入帖子ID')
          return
        }
        
        if (!this.postReportData.reason) {
          this.showResult(false, '请选择举报原因')
          return
        }
        
        uni.showLoading({ title: '提交中...' })
        
        const result = await this.postObj.report({
          contentId: this.postReportData.contentId,
          contentType: this.postReportData.contentType,
          reason: this.postReportData.reason,
          description: this.postReportData.description
        })
        
        uni.hideLoading()
        
        if (result.code === 0) {
          this.showResult(
            true, 
            `${result.message}\n当前举报次数：${result.data.report_count}`, 
            result.data
          )
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '举报失败')
      }
    },
    
    /**
     * 6. 测试删除帖子
     */
    async testDeletePost() {
      try {
        if (!this.postDeleteId) {
          this.showResult(false, '请输入帖子ID')
          return
        }
        
        uni.showLoading({ title: '删除中...' })
        
        const result = await this.postObj.delete(this.postDeleteId)
        
        uni.hideLoading()
        
        if (result.code === 0) {
          this.showResult(true, '删除成功！', result.data)
          this.postDeleteId = ''
        } else {
          this.showResult(false, result.message)
        }
      } catch (error) {
        uni.hideLoading()
        this.showResult(false, error.message || '删除失败')
      }
    },
    
    // Post Picker 事件处理
    onPostTypeChange(e) {
      this.postListOptions.type = this.postTypeOptions[e.detail.value].value
    },
    
    onPostSortChange(e) {
      this.postListOptions.sortBy = this.postSortOptions[e.detail.value].value
    },
    
    onPostCreateTypeChange(e) {
      this.postData.type = this.postCreateTypeOptions[e.detail.value].value
    },
    
    onReportReasonChange(e) {
      this.postReportData.reason = this.reportReasonOptions[e.detail.value].value
    },
    
    // ========== Collection 测试方法 ==========
    
    // Picker事件处理
    onFavoriteTypeChange(e) {
      this.collectionData.favoriteTargetType = this.targetTypeOptions[e.detail.value].value
    },
    
    onFavoriteListTypeChange(e) {
      const options = [{value:'',label:'全部'}, ...this.targetTypeOptions]
      this.collectionData.favoriteListType = options[e.detail.value].value
    },
    
    onCheckTypeChange(e) {
      this.collectionData.checkTargetType = this.targetTypeOptions[e.detail.value].value
    },
    
    onHistoryTypeChange(e) {
      this.collectionData.historyTargetType = this.historyTypeOptions[e.detail.value].value
    },
    
    onHistoryListTypeChange(e) {
      const options = [{value:'',label:'全部'}, ...this.historyTypeOptions]
      this.collectionData.historyListType = options[e.detail.value].value
    },
    
    // 1. 添加收藏
    async testAddFavorite() {
      try {
        console.log('测试添加收藏:', this.collectionData.favoriteTargetType, this.collectionData.favoriteTargetId)
        
        if (!this.collectionData.favoriteTargetId) {
          uni.showToast({ title: '请输入目标ID', icon: 'none' })
          return
        }
        
        uni.showLoading({ title: '添加中...' })
        
        const result = await this.collectionObj.addFavorite(
          this.collectionData.favoriteTargetType,
          this.collectionData.favoriteTargetId
        )
        
        uni.hideLoading()
        
        console.log('添加收藏结果:', result)
        
        this.lastResult = {
          success: result.code === 0,
          message: `${result.message} (favoriteId: ${result.data?.favoriteId || 'N/A'})`,
          data: result
        }
        
        if (result.code === 0) {
          uni.showToast({ title: '添加成功', icon: 'success' })
        } else {
          uni.showToast({ title: result.message, icon: 'none' })
        }
      } catch (error) {
        uni.hideLoading()
        console.error('添加收藏失败:', error)
        this.lastResult = {
          success: false,
          message: error.message,
          data: null
        }
        uni.showToast({ title: error.message, icon: 'none' })
      }
    },
    
    // 2. 取消收藏
    async testRemoveFavorite() {
      try {
        console.log('测试取消收藏:', this.collectionData.favoriteTargetType, this.collectionData.favoriteTargetId)
        
        if (!this.collectionData.favoriteTargetId) {
          uni.showToast({ title: '请输入目标ID', icon: 'none' })
          return
        }
        
        uni.showLoading({ title: '取消中...' })
        
        const result = await this.collectionObj.removeFavorite(
          this.collectionData.favoriteTargetType,
          this.collectionData.favoriteTargetId
        )
        
        uni.hideLoading()
        
        console.log('取消收藏结果:', result)
        
        this.lastResult = {
          success: result.code === 0,
          message: result.message,
          data: result
        }
        
        if (result.code === 0) {
          uni.showToast({ title: '取消成功', icon: 'success' })
        } else {
          uni.showToast({ title: result.message, icon: 'none' })
        }
      } catch (error) {
        uni.hideLoading()
        console.error('取消收藏失败:', error)
        this.lastResult = {
          success: false,
          message: error.message,
          data: null
        }
        uni.showToast({ title: error.message, icon: 'none' })
      }
    },
    
    // 3. 获取收藏列表
    async testGetFavorites() {
      try {
        console.log('测试获取收藏列表:', {
          page: this.collectionData.favoriteListPage,
          pageSize: this.collectionData.favoriteListPageSize,
          targetType: this.collectionData.favoriteListType
        })
        
        uni.showLoading({ title: '加载中...' })
        
        const options = {
          page: this.collectionData.favoriteListPage,
          pageSize: this.collectionData.favoriteListPageSize
        }
        
        if (this.collectionData.favoriteListType) {
          options.targetType = this.collectionData.favoriteListType
        }
        
        const result = await this.collectionObj.getFavorites(options)
        
        uni.hideLoading()
        
        console.log('收藏列表结果:', result)
        
        this.lastResult = {
          success: result.code === 0,
          message: `查询成功！共${result.data?.total || 0}条，当前${result.data?.list?.length || 0}条`,
          data: result
        }
        
        if (result.code === 0) {
          uni.showToast({ title: `查询成功: ${result.data.list.length}条`, icon: 'success' })
        } else {
          uni.showToast({ title: result.message, icon: 'none' })
        }
      } catch (error) {
        uni.hideLoading()
        console.error('获取收藏列表失败:', error)
        this.lastResult = {
          success: false,
          message: error.message,
          data: null
        }
        uni.showToast({ title: error.message, icon: 'none' })
      }
    },
    
    // 4. 检查收藏状态
    async testCheckFavoriteStatus() {
      try {
        console.log('测试检查收藏状态:', this.collectionData.checkTargetType, this.collectionData.checkTargetId)
        
        if (!this.collectionData.checkTargetId) {
          uni.showToast({ title: '请输入目标ID', icon: 'none' })
          return
        }
        
        uni.showLoading({ title: '检查中...' })
        
        const result = await this.collectionObj.checkFavoriteStatus(
          this.collectionData.checkTargetType,
          this.collectionData.checkTargetId
        )
        
        uni.hideLoading()
        
        console.log('收藏状态结果:', result)
        
        const isFavorited = result.data?.isFavorited
        
        this.lastResult = {
          success: result.code === 0,
          message: `收藏状态: ${isFavorited ? '✅ 已收藏' : '❌ 未收藏'}`,
          data: result
        }
        
        if (result.code === 0) {
          uni.showToast({ 
            title: isFavorited ? '已收藏' : '未收藏',
            icon: isFavorited ? 'success' : 'none'
          })
        } else {
          uni.showToast({ title: result.message, icon: 'none' })
        }
      } catch (error) {
        uni.hideLoading()
        console.error('检查收藏状态失败:', error)
        this.lastResult = {
          success: false,
          message: error.message,
          data: null
        }
        uni.showToast({ title: error.message, icon: 'none' })
      }
    },
    
    // 5. 添加浏览历史
    async testAddHistory() {
      try {
        console.log('测试添加浏览历史:', this.collectionData.historyTargetType, this.collectionData.historyTargetId)
        
        if (!this.collectionData.historyTargetId) {
          uni.showToast({ title: '请输入目标ID', icon: 'none' })
          return
        }
        
        uni.showLoading({ title: '记录中...' })
        
        const result = await this.collectionObj.addHistory(
          this.collectionData.historyTargetType,
          this.collectionData.historyTargetId
        )
        
        uni.hideLoading()
        
        console.log('添加历史结果:', result)
        
        this.lastResult = {
          success: result.code === 0,
          message: result.message,
          data: result
        }
        
        if (result.code === 0) {
          uni.showToast({ title: '记录成功', icon: 'success' })
        } else {
          uni.showToast({ title: result.message, icon: 'none' })
        }
      } catch (error) {
        uni.hideLoading()
        console.error('添加浏览历史失败:', error)
        this.lastResult = {
          success: false,
          message: error.message,
          data: null
        }
        uni.showToast({ title: error.message, icon: 'none' })
      }
    },
    
    // 6. 获取浏览历史
    async testGetHistory() {
      try {
        console.log('测试获取浏览历史:', {
          page: this.collectionData.historyListPage,
          pageSize: this.collectionData.historyListPageSize,
          targetType: this.collectionData.historyListType
        })
        
        uni.showLoading({ title: '加载中...' })
        
        const options = {
          page: this.collectionData.historyListPage,
          pageSize: this.collectionData.historyListPageSize
        }
        
        if (this.collectionData.historyListType) {
          options.targetType = this.collectionData.historyListType
        }
        
        const result = await this.collectionObj.getHistory(options)
        
        uni.hideLoading()
        
        console.log('浏览历史结果:', result)
        
        this.lastResult = {
          success: result.code === 0,
          message: `查询成功！共${result.data?.total || 0}条，当前${result.data?.list?.length || 0}条`,
          data: result
        }
        
        if (result.code === 0) {
          uni.showToast({ title: `查询成功: ${result.data.list.length}条`, icon: 'success' })
        } else {
          uni.showToast({ title: result.message, icon: 'none' })
        }
      } catch (error) {
        uni.hideLoading()
        console.error('获取浏览历史失败:', error)
        this.lastResult = {
          success: false,
          message: error.message,
          data: null
        }
        uni.showToast({ title: error.message, icon: 'none' })
      }
    },
    
    // ==================== Shop 测试方法 ====================
    
    /**
     * 测试获取店铺列表
     */
    async testGetShopList() {
      try {
        console.log('测试获取店铺列表:', {
          page: this.shopData.listPage,
          pageSize: this.shopData.listPageSize,
          city: this.shopData.listCity,
          sortBy: this.shopData.listSortBy
        })
        
        uni.showLoading({ title: '加载中...' })
        
        const options = {
          page: this.shopData.listPage,
          pageSize: this.shopData.listPageSize,
          sortBy: this.shopData.listSortBy
        }
        
        if (this.shopData.listCity) {
          options.city = this.shopData.listCity
        }
        
        const result = await this.shopObj.getList(options)
        
        uni.hideLoading()
        
        console.log('店铺列表结果:', result)
        
        this.lastResult = {
          success: result.code === 0,
          message: `查询成功！共${result.data?.total || 0}条，当前${result.data?.list?.length || 0}条`,
          data: result
        }
        
        if (result.code === 0) {
          uni.showToast({ title: `查询成功: ${result.data.list.length}条`, icon: 'success' })
        } else {
          uni.showToast({ title: result.message, icon: 'none' })
        }
      } catch (error) {
        uni.hideLoading()
        console.error('获取店铺列表失败:', error)
        this.lastResult = {
          success: false,
          message: error.message,
          data: null
        }
        uni.showToast({ title: error.message, icon: 'none' })
      }
    },
    
    /**
     * 测试获取店铺详情
     */
    async testGetShopDetail() {
      if (!this.shopData.detailShopId) {
        uni.showToast({ title: '请输入店铺ID', icon: 'none' })
        return
      }
      
      try {
        console.log('测试获取店铺详情:', this.shopData.detailShopId)
        
        uni.showLoading({ title: '加载中...' })
        
        const result = await this.shopObj.getDetail(this.shopData.detailShopId)
        
        uni.hideLoading()
        
        console.log('店铺详情结果:', result)
        
        this.lastResult = {
          success: result.code === 0,
          message: result.message,
          data: result
        }
        
        if (result.code === 0) {
          uni.showToast({ 
            title: `获取成功: ${result.data.shop_name}`, 
            icon: 'success' 
          })
        } else {
          uni.showToast({ title: result.message, icon: 'none' })
        }
      } catch (error) {
        uni.hideLoading()
        console.error('获取店铺详情失败:', error)
        this.lastResult = {
          success: false,
          message: error.message,
          data: null
        }
        uni.showToast({ title: error.message, icon: 'none' })
      }
    },
    
    /**
     * 测试店铺申请
     */
    async testShopApply() {
      if (!this.isLogin) {
        uni.showToast({ title: '请先登录', icon: 'none' })
        return
      }
      
      try {
        console.log('测试店铺申请:', this.shopData.applyData)
        
        uni.showLoading({ title: '提交中...' })
        
        const result = await this.shopObj.apply(this.shopData.applyData)
        
        uni.hideLoading()
        
        console.log('店铺申请结果:', result)
        
        this.lastResult = {
          success: result.code === 0,
          message: result.message,
          data: result
        }
        
        if (result.code === 0) {
          uni.showToast({ 
            title: result.message, 
            icon: 'success' 
          })
        } else {
          uni.showToast({ title: result.message, icon: 'none' })
        }
      } catch (error) {
        uni.hideLoading()
        console.error('店铺申请失败:', error)
        this.lastResult = {
          success: false,
          message: error.message,
          data: null
        }
        uni.showToast({ title: error.message, icon: 'none' })
      }
    },
    
    /**
     * Shop 排序选择器
     */
    onShopSortChange(e) {
      const index = e.detail.value
      this.shopData.listSortBy = this.shopSortOptions[index].value
      console.log('选择排序方式:', this.shopData.listSortBy)
    },
    
    // ==================== Storyteller 测试方法 ====================
    
    /**
     * 测试获取说书人列表
     */
    async testGetStorytellerList() {
      try {
        console.log('测试获取说书人列表:', {
          page: this.storytellerData.listPage,
          pageSize: this.storytellerData.listPageSize,
          filter: this.storytellerData.listFilter,
          keyword: this.storytellerData.listKeyword
        })
        
        uni.showLoading({ title: '加载中...' })
        
        const options = {
          page: this.storytellerData.listPage,
          pageSize: this.storytellerData.listPageSize,
          filter: this.storytellerData.listFilter
        }
        
        if (this.storytellerData.listKeyword) {
          options.keyword = this.storytellerData.listKeyword
        }
        
        const result = await this.storytellerObj.getList(options)
        
        uni.hideLoading()
        
        console.log('说书人列表结果:', result)
        
        this.lastResult = {
          success: result.code === 0,
          message: `查询成功！共${result.data?.total || 0}条`,
          data: result
        }
        
        if (result.code === 0) {
          uni.showToast({ title: `查询成功: ${result.data.list.length}条`, icon: 'success' })
        } else {
          uni.showToast({ title: result.message, icon: 'none' })
        }
      } catch (error) {
        uni.hideLoading()
        console.error('获取说书人列表失败:', error)
        this.lastResult = {
          success: false,
          message: error.message,
          data: null
        }
        uni.showToast({ title: error.message, icon: 'none' })
      }
    },
    
    /**
     * 测试获取说书人详情
     */
    async testGetStorytellerDetail() {
      if (!this.storytellerData.detailStoryId) {
        uni.showToast({ title: '请输入说书人ID', icon: 'none' })
        return
      }
      
      try {
        console.log('测试获取说书人详情:', this.storytellerData.detailStoryId)
        
        uni.showLoading({ title: '加载中...' })
        
        const result = await this.storytellerObj.getDetail(this.storytellerData.detailStoryId)
        
        uni.hideLoading()
        
        console.log('说书人详情结果:', result)
        
        this.lastResult = {
          success: result.code === 0,
          message: result.message,
          data: result
        }
        
        if (result.code === 0) {
          uni.showToast({ 
            title: `获取成功: ${result.data.user?.nickname || '说书人'}`, 
            icon: 'success' 
          })
        } else {
          uni.showToast({ title: result.message, icon: 'none' })
        }
      } catch (error) {
        uni.hideLoading()
        console.error('获取说书人详情失败:', error)
        this.lastResult = {
          success: false,
          message: error.message,
          data: null
        }
        uni.showToast({ title: error.message, icon: 'none' })
      }
    },
    
    /**
     * 测试获取评价列表
     */
    async testGetStorytellerReviews() {
      if (!this.storytellerData.reviewsStoryId) {
        uni.showToast({ title: '请输入说书人ID', icon: 'none' })
        return
      }
      
      try {
        console.log('测试获取评价列表:', {
          storytellerId: this.storytellerData.reviewsStoryId,
          page: this.storytellerData.reviewsPage,
          pageSize: this.storytellerData.reviewsPageSize
        })
        
        uni.showLoading({ title: '加载中...' })
        
        const result = await this.storytellerObj.getReviews(
          this.storytellerData.reviewsStoryId,
          this.storytellerData.reviewsPage,
          this.storytellerData.reviewsPageSize
        )
        
        uni.hideLoading()
        
        console.log('评价列表结果:', result)
        
        this.lastResult = {
          success: result.code === 0,
          message: `查询成功！共${result.data?.total || 0}条`,
          data: result
        }
        
        if (result.code === 0) {
          uni.showToast({ title: `查询成功: ${result.data.list.length}条`, icon: 'success' })
        } else {
          uni.showToast({ title: result.message, icon: 'none' })
        }
      } catch (error) {
        uni.hideLoading()
        console.error('获取评价列表失败:', error)
        this.lastResult = {
          success: false,
          message: error.message,
          data: null
        }
        uni.showToast({ title: error.message, icon: 'none' })
      }
    },
    
    /**
     * 测试计算热度
     */
    async testCalculateHeat() {
      try {
        console.log('测试计算热度:', this.storytellerData.heatUserId || '全部认证说书人')
        
        uni.showLoading({ title: '计算中...' })
        
        const userId = this.storytellerData.heatUserId || null
        const result = await this.storytellerObj.calculateHeat(userId)
        
        uni.hideLoading()
        
        console.log('计算热度结果:', result)
        
        this.lastResult = {
          success: result.code === 0,
          message: result.message,
          data: result
        }
        
        if (result.code === 0) {
          uni.showToast({ 
            title: `计算成功: ${result.data.count}个说书人`, 
            icon: 'success',
            duration: 2000
          })
        } else {
          uni.showToast({ title: result.message, icon: 'none' })
        }
      } catch (error) {
        uni.hideLoading()
        console.error('计算热度失败:', error)
        this.lastResult = {
          success: false,
          message: error.message,
          data: null
        }
        uni.showToast({ title: error.message, icon: 'none' })
      }
    },
    
    /**
     * Storyteller 筛选选择器
     */
    onStorytellerFilterChange(e) {
      const index = e.detail.value
      this.storytellerData.listFilter = this.storytellerFilterOptions[index].value
      console.log('选择筛选方式:', this.storytellerData.listFilter)
    }
  }
}
</script>

<style scoped>
.test-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

/* 头部 */
.header {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  padding: 40rpx 30rpx 30rpx;
  color: white;
}

.title {
  font-size: 40rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 16rpx;
}

.status {
  font-size: 28rpx;
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  display: inline-block;
}

.status.logged {
  background-color: rgba(76, 175, 80, 0.3);
}

.status.not-logged {
  background-color: rgba(244, 67, 54, 0.3);
}

/* 页签 */
.tabs {
  display: flex;
  background-color: white;
  border-bottom: 2rpx solid #eee;
  padding: 0 20rpx;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 25rpx 0;
  position: relative;
  transition: all 0.3s;
}

.tab-item.active {
  color: #ff6b6b;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60rpx;
  height: 6rpx;
  background-color: #ff6b6b;
  border-radius: 3rpx;
}

.tab-icon {
  font-size: 44rpx;
  margin-bottom: 8rpx;
}

.tab-label {
  font-size: 26rpx;
  font-weight: 500;
}

/* 结果面板 */
.result-panel {
  margin: 20rpx 30rpx;
  background-color: white;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.result-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.result-status {
  font-size: 28rpx;
  padding: 6rpx 16rpx;
  border-radius: 16rpx;
}

.result-status.success {
  background-color: #e8f5e9;
  color: #4caf50;
}

.result-status.fail {
  background-color: #ffebee;
  color: #f44336;
}

.result-content {
  border-top: 1px solid #f0f0f0;
  padding-top: 20rpx;
}

.result-text {
  font-size: 28rpx;
  color: #666;
  display: block;
  margin-bottom: 16rpx;
}

.result-data {
  background-color: #f9f9f9;
  padding: 20rpx;
  border-radius: 8rpx;
  margin-top: 16rpx;
}

.data-label {
  font-size: 26rpx;
  color: #999;
  display: block;
  margin-bottom: 12rpx;
}

.data-content {
  font-size: 24rpx;
  color: #333;
  font-family: monospace;
  word-break: break-all;
  white-space: pre-wrap;
  display: block;
}

/* 测试区域 */
.test-sections {
  flex: 1;
  padding: 0 30rpx;
}

.section {
  background-color: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06);
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
  padding-bottom: 16rpx;
  border-bottom: 2px solid #f0f0f0;
}

.test-group {
  margin-bottom: 40rpx;
}

.test-group:last-child {
  margin-bottom: 0;
}

.group-title {
  font-size: 28rpx;
  color: #666;
  display: block;
  margin-bottom: 20rpx;
  font-weight: 500;
}

.input {
  width: 100%;
  height: 80rpx;
  background-color: #f8f8f8;
  border: 2rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  margin-bottom: 16rpx;
  box-sizing: border-box;
}

.input:focus {
  border-color: #ff6b6b;
  background-color: white;
}

.input-row {
  display: flex;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.input-half {
  flex: 1;
}

.textarea {
  width: 100%;
  min-height: 120rpx;
  background-color: #f8f8f8;
  border: 2rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
  font-size: 28rpx;
  margin-bottom: 16rpx;
  box-sizing: border-box;
}

.picker {
  height: 80rpx;
  background-color: #f8f8f8;
  border: 2rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 0 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.picker text {
  font-size: 28rpx;
  color: #333;
}

.arrow {
  color: #999;
  font-size: 32rpx;
}

.json-input {
  margin-bottom: 16rpx;
}

.input-label {
  font-size: 26rpx;
  color: #666;
  display: block;
  margin-bottom: 12rpx;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 12rpx 0;
}

.checkbox-row text {
  font-size: 28rpx;
  color: #333;
}

.btn {
  width: 100%;
  height: 80rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 16rpx;
  border: none;
}

.btn[disabled] {
  opacity: 0.5;
}

.btn-primary {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
}

.btn-success {
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
}

.btn-warning {
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
}

.btn-danger {
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
}

.btn-info {
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
}

.hint {
  font-size: 24rpx;
  color: #ff9800;
  display: block;
  margin-top: 12rpx;
  padding: 12rpx;
  background-color: #fff3e0;
  border-radius: 8rpx;
}

.bottom-space {
  height: 40rpx;
}
</style>

