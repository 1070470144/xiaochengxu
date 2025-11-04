<template>
  <view class="page">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-container">
      <uni-load-more status="loading"></uni-load-more>
    </view>

    <!-- 剧本详情 -->
    <view v-else-if="scriptDetail" class="script-detail">
      <!-- 头部信息 -->
      <view class="script-header">
        <view class="header-content">
          <text class="script-title">{{ scriptDetail.title }}</text>
          <text v-if="scriptDetail.subtitle" class="script-subtitle">{{ scriptDetail.subtitle }}</text>
          
          <view class="script-rating flex-center">
            <text class="rating-score">⭐{{ (scriptDetail.average_rating || 0).toFixed(1) }}</text>
            <text class="rating-count">({{ scriptDetail.rating_count || 0 }}人评价)</text>
          </view>
        </view>
      </view>

      <!-- 基础信息卡片 -->
      <view class="info-card card">
        <view class="card-body">
          <view class="info-row">
            <text class="info-label">作者：</text>
            <text class="info-value">{{ scriptDetail.author || '未知' }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">人数：</text>
            <text class="info-value">{{ scriptDetail.player_count || '未知' }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">难度：</text>
            <text class="info-value difficulty" :class="getDifficultyClass(scriptDetail.difficulty)">
              {{ getDifficultyText(scriptDetail.difficulty) }}
            </text>
          </view>
          <view class="info-row">
            <text class="info-label">统计：</text>
            <text class="info-value">
              {{ scriptDetail.view_count || 0 }}次浏览 · {{ scriptDetail.download_count || 0 }}次下载
            </text>
          </view>
        </view>
      </view>

      <!-- 剧本预览图 -->
      <view v-if="scriptDetail.preview_image" class="preview-card card">
        <view class="card-header">
          <text class="card-title">🤖 自动生成的预览图</text>
          <text class="ai-badge">AI生成</text>
        </view>
        <view class="card-body">
          <image 
            class="preview-image" 
            :src="scriptDetail.preview_image" 
            mode="widthFix"
            @click="previewImage"
          />
          
          <!-- 下载按钮 -->
          <view class="preview-actions">
            <button class="action-btn btn-download-normal" @click="downloadPreviewNormal">
              <text class="btn-icon">📥</text>
              <text class="btn-text">普通下载</text>
            </button>
            <button class="action-btn btn-download-hd" @click="downloadPreviewHD">
              <text class="btn-icon">🖼️</text>
              <text class="btn-text">超高清</text>
            </button>
          </view>
        </view>
      </view>

      <!-- 用户上传的图片 -->
      <view v-if="scriptDetail.user_images && scriptDetail.user_images.length > 0" class="user-images-card card">
        <view class="card-header">
          <text class="card-title">👤 用户上传的图片</text>
          <text class="user-badge">{{ scriptDetail.user_images.length }}张</text>
        </view>
        <view class="card-body">
          <view class="user-images-grid">
            <view 
              v-for="(img, index) in scriptDetail.user_images" 
              :key="index"
              class="grid-item"
              @click="previewUserImages(index)"
            >
              <image 
                class="grid-image" 
                :src="img" 
                mode="aspectFill"
              />
              <view class="image-overlay">
                <text class="overlay-icon">🔍</text>
              </view>
            </view>
          </view>
          <view class="image-tip">
            <text class="tip-text">💡 点击图片可放大查看，长按保存到相册</text>
          </view>
        </view>
      </view>

      <!-- 剧本描述 -->
      <view class="desc-card card">
        <view class="card-header">
          <text class="card-title">剧本介绍</text>
        </view>
        <view class="card-body">
          <text class="script-desc">{{ scriptDetail.description || '暂无介绍' }}</text>
        </view>
      </view>

      <!-- 标签 -->
      <view v-if="scriptDetail.tags && scriptDetail.tags.length > 0" class="tags-card card">
        <view class="card-header">
          <text class="card-title">标签</text>
        </view>
        <view class="card-body">
          <view class="tags">
            <text v-for="tag in scriptDetail.tags" :key="tag" class="tag">{{ tag }}</text>
          </view>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-bar">
        <button class="action-btn btn-favorite" :class="{ 'is-favorite': isFavorite }" @click="favoriteScript">
          <text class="btn-icon">{{ isFavorite ? '❤️' : '🤍' }}</text>
          <text class="btn-text">{{ isFavorite ? '已收藏' : '收藏' }}</text>
        </button>
        
        <button class="action-btn btn-json" @click="copyJsonToClipboard" :disabled="copyingJson">
          <text class="btn-icon">{{ copyingJson ? '⏳' : '🔗' }}</text>
          <text class="btn-text">{{ copyingJson ? '生成中...' : '复制JSON' }}</text>
        </button>
      </view>

      <!-- 相关帖子 -->
      <view class="posts-section">
        <view class="section-header">
          <text class="section-title">💬 相关讨论</text>
          <view class="more-btn" @click="goToCreatePost">
            <text>发帖</text>
            <uni-icons type="right" size="14" color="#8B4513" />
          </view>
        </view>
        
        <view v-if="relatedPosts.length > 0" class="posts-list">
          <view 
            v-for="post in relatedPosts" 
            :key="post._id"
            class="post-item"
            @click="goToPostDetail(post._id)"
          >
            <view class="post-user">
              <text 
                class="post-username clickable" 
                @click.stop="handleUserClick(post.user_id, post.user)"
              >
                {{ post.user ? post.user.nickname : '匿名用户' }}
              </text>
              <text class="post-time">{{ formatTime(post.created_at) }}</text>
            </view>
            <text class="post-content">{{ post.content }}</text>
            <view class="post-stats">
              <text class="stat-item">👁 {{ post.view_count || 0 }}</text>
              <text class="stat-item">❤️ {{ post.like_count || 0 }}</text>
              <text class="stat-item">💬 {{ post.comment_count || 0 }}</text>
            </view>
          </view>
        </view>
        
        <view v-else class="no-posts">
          <text>暂无相关讨论，快来发表第一个帖子吧~</text>
        </view>
      </view>

    </view>

    <!-- 错误状态 -->
    <view v-else class="error-state">
      <text class="error-text">剧本加载失败</text>
      <button class="retry-btn btn-primary" @click="loadScriptDetail">重新加载</button>
    </view>

    <!-- 底部评分按钮 -->
    <view v-if="scriptDetail && isLoggedIn" class="bottom-action-bar">
      <button class="btn-rate" @click="showRatingPopup">
        <text class="btn-icon">⭐</text>
        <text class="btn-text">{{ userRating ? '修改评分' : '给剧本打分' }}</text>
      </button>
    </view>

    <!-- 评分弹出层 -->
    <view v-if="ratingPopupVisible" class="rating-popup-mask" @click="hideRatingPopup">
      <view class="rating-popup" :class="{ 'rating-popup-show': ratingPopupShow }" @click.stop>
        <!-- 拖动条 -->
        <view class="popup-drag-bar"></view>
        
        <!-- 标题 -->
        <view class="popup-header">
          <text class="popup-title">{{ userRating ? '修改评分' : '给剧本打分' }}</text>
          <text class="popup-close" @click="hideRatingPopup">✕</text>
        </view>

        <!-- 剧本信息 -->
        <view class="popup-script-info">
          <text class="script-name">{{ scriptDetail.title }}</text>
          <text class="script-author" v-if="scriptDetail.author">{{ scriptDetail.author }}</text>
        </view>

        <!-- 评分区域 -->
        <view class="popup-rating-section">
          <text class="rating-label">点击星星评分</text>
          <view class="star-group-large">
            <view
              v-for="star in 5"
              :key="star"
              class="star-item-large"
              :class="{ active: star <= selectedRating }"
              @click="selectRating(star)"
            >
              <text class="star-icon">{{ star <= selectedRating ? '⭐' : '☆' }}</text>
              <text class="star-number">{{ star }}</text>
            </view>
          </view>
          <text v-if="selectedRating > 0" class="rating-desc">{{ getRatingDesc(selectedRating) }}</text>
        </view>

        <!-- 提交按钮 -->
        <view class="popup-actions">
          <button 
            class="btn-submit-popup" 
            :disabled="!selectedRating || submitting"
            @click="submitRating"
          >
            {{ submitting ? '提交中...' : '提交评分' }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import Auth from '@/utils/auth.js'
import UserAction from '@/utils/user-action.js'

export default {
  name: 'ScriptDetail',
  
  data() {
    return {
      scriptId: '',
      scriptDetail: null,
      loading: false,
      isFavorite: false,
      generatingUrl: false,
      copiedUrl: false,
      copyingJson: false,
      downloadingJson: false,
      currentUserId: '',    // 当前用户ID
      
      // 相关帖子
      relatedPosts: [],
      
      // 评分相关
      isLoggedIn: false,
      userRating: null,       // 用户当前评分
      selectedRating: 0,      // 选中的评分
      submitting: false,      // 提交中
      ratingPopupVisible: false,  // 弹出层可见
      ratingPopupShow: false      // 弹出层显示动画
    }
  },

  computed: {
    // ... existing computed properties
  },

  onLoad(options) {
    // 初始化 script 云对象
    this.scriptObj = uniCloud.importObject('script', {
      customUI: true
    })
    
    if (options.id) {
      this.scriptId = options.id
      
      // 获取当前用户ID
      const userInfo = Auth.getUserInfo()
      console.log('📱 完整的 userInfo：', userInfo)
      
      if (userInfo) {
        // 尝试多种可能的字段
        this.currentUserId = userInfo.uid || userInfo._id || userInfo.id || userInfo.userId
        this.isLoggedIn = true
        console.log('✅ 当前用户ID：', this.currentUserId)
      } else {
        console.log('❌ userInfo 为空')
      }
      
      this.loadScriptDetail()
      this.loadRelatedPosts()
      
      // 记录浏览历史
      console.log('🔍 检查登录状态，Auth.isLogin():', Auth.isLogin())
      console.log('🔍 scriptId:', this.scriptId)
      if (Auth.isLogin()) {
        console.log('✅ 已登录，开始记录浏览历史')
        this.recordHistory()
        this.checkFavoriteStatus()
      } else {
        console.log('❌ 未登录，跳过浏览历史记录')
      }
    }
  },

  methods: {
    // 加载剧本详情
    async loadScriptDetail() {
      this.loading = true
      
      try {
        const result = await this.scriptObj.getDetail(this.scriptId)

        if (result.code === 0) {
          this.scriptDetail = result.data
          
          // 设置页面标题
          uni.setNavigationBarTitle({
            title: this.scriptDetail.title
          })
          
          // 加载用户评分
          if (this.isLoggedIn) {
            this.loadUserRating()
          }
        } else {
          throw new Error(result.result.message)
        }
        
      } catch (error) {
        console.error('加载剧本详情失败：', error)
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },
    
    // 加载相关帖子
    async loadRelatedPosts() {
      try {
        const db = uniCloud.database()
        
        // 第一步：查询帖子列表
        const postsResult = await db.collection('botc-posts')
          .where({
            script_id: this.scriptId,
            status: 1
          })
          .orderBy('created_at', 'desc')
          .limit(5)
          .get()
        
        const posts = postsResult.result?.data || postsResult.data || []
        
        if (posts.length === 0) {
          this.relatedPosts = []
          return
        }
        
        // 第二步：获取所有用户ID
        const userIds = [...new Set(posts.map(p => p.user_id).filter(id => id))]
        
        if (userIds.length === 0) {
          this.relatedPosts = posts
          return
        }
        
        // 第三步：查询用户信息
        const usersResult = await db.collection('uni-id-users')
          .where({
            _id: db.command.in(userIds)
          })
          .field('_id,nickname,avatar')
          .get()
        
        const users = usersResult.result?.data || usersResult.data || []
        
        const usersMap = {}
        users.forEach(user => {
          usersMap[user._id] = user
        })
        
        // 第四步：合并数据
        this.relatedPosts = posts.map(post => ({
          ...post,
          user: usersMap[post.user_id] || {
            nickname: '匿名用户',
            avatar: ''
          }
        }))
      } catch (error) {
        console.error('加载相关帖子失败：', error)
        this.relatedPosts = []
      }
    },
    
    // 发帖
    goToCreatePost() {
      uni.navigateTo({
        url: '/pages/community/create/create'
      })
    },
    
    // 查看帖子详情
    goToPostDetail(postId) {
      uni.navigateTo({
        url: `/pages/community/detail/detail?id=${postId}`
      })
    },

    // 下载剧本
    // 预览自动生成的图片（点击放大）
    previewImage() {
      if (!this.scriptDetail.preview_image) return
      
      uni.previewImage({
        urls: [this.scriptDetail.preview_image],
        current: this.scriptDetail.preview_image,
        longPressActions: {
          itemList: ['保存图片'],
          success: (data) => {
            if (data.tapIndex === 0) {
              this.saveImageToAlbum(this.scriptDetail.preview_image)
            }
          }
        }
      })
    },
    
    // 预览用户上传的图片（支持多图浏览）
    previewUserImages(index) {
      if (!this.scriptDetail.user_images || this.scriptDetail.user_images.length === 0) return
      
      uni.previewImage({
        urls: this.scriptDetail.user_images,
        current: index,
        longPressActions: {
          itemList: ['保存图片'],
          success: (data) => {
            if (data.tapIndex === 0) {
              this.saveImageToAlbum(this.scriptDetail.user_images[data.index || index])
            }
          }
        }
      })
    },
    
    // 下载预览图（普通版）
    async downloadPreviewNormal() {
      console.log('=== 点击普通下载按钮 ===')
      console.log('剧本数据:', this.scriptDetail ? '存在' : '不存在')
      console.log('预览图:', this.scriptDetail?.preview_image ? '存在' : '不存在')
      
      if (!this.scriptDetail.preview_image) {
        console.log('❌ 没有预览图，退出')
        return
      }
      
      console.log('✅ 开始下载流程')
      uni.showLoading({ title: '准备下载...' })
      
      try {
        const previewImage = this.scriptDetail.preview_image
        console.log('预览图格式:', previewImage.substring(0, 50) + '...')
        
        // #ifdef H5
        console.log('🌐 当前平台: H5')
        console.log('开始将SVG转换为PNG...')
        
        // H5端：将SVG转换为PNG后下载
        const fileName = `${this.scriptDetail.title || '剧本预览图'}.png`
        console.log('目标文件名:', fileName)
        
        if (previewImage.startsWith('data:image/svg+xml;base64,')) {
          console.log('✅ SVG格式验证通过')
          
          try {
            // 创建Image元素加载SVG
            const img = new Image()
            
            img.onload = () => {
              console.log('✅ SVG图片加载成功')
              console.log('图片尺寸:', img.width, 'x', img.height)
              
              // 创建Canvas
              const canvas = document.createElement('canvas')
              canvas.width = img.width || 800
              canvas.height = img.height || 600
              console.log('Canvas尺寸:', canvas.width, 'x', canvas.height)
              
              const ctx = canvas.getContext('2d')
              // 白色背景
              ctx.fillStyle = 'white'
              ctx.fillRect(0, 0, canvas.width, canvas.height)
              // 绘制SVG
              ctx.drawImage(img, 0, 0)
              console.log('✅ SVG已绘制到Canvas')
              
              // 转换为PNG
              canvas.toBlob((blob) => {
                if (!blob) {
                  console.error('❌ PNG转换失败')
                  uni.hideLoading()
                  uni.showToast({ title: 'PNG转换失败', icon: 'none' })
                  return
                }
                
                console.log('✅ PNG转换成功，大小:', (blob.size / 1024).toFixed(2), 'KB')
                
                // 创建下载链接
                const url = URL.createObjectURL(blob)
                console.log('PNG Blob URL:', url)
                console.log('💾 下载位置: C:\\Users\\Administrator\\Downloads\\')
                console.log('💡 快捷键: 按 Ctrl+J 查看下载管理器')
                
                const a = document.createElement('a')
                a.href = url
                a.download = fileName
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                
                console.log('✅ PNG下载已触发！')
                console.log('文件名:', fileName)
                
                URL.revokeObjectURL(url)
                console.log('Blob URL已释放')
                
                uni.hideLoading()
        uni.showToast({
                  title: 'PNG图片已下载',
                  icon: 'success',
                  duration: 2000
                })
                
                console.log('=== H5 PNG下载完成 ===')
              }, 'image/png', 1.0)
            }
            
            img.onerror = (err) => {
              console.error('❌ SVG图片加载失败:', err)
              uni.hideLoading()
              uni.showToast({
                title: 'SVG加载失败',
                icon: 'none'
              })
            }
            
            console.log('开始加载SVG图片...')
            img.src = previewImage
            
          } catch (h5Error) {
            console.error('❌ H5下载过程出错:', h5Error)
            uni.hideLoading()
            throw h5Error
          }
        } else {
          console.log('❌ 图片格式不是SVG base64')
          throw new Error('图片格式不支持')
        }
        // #endif
        
        // #ifndef H5
        console.log('📱 当前平台: 小程序/APP')
        // 小程序端：保存到相册
        try {
          console.log('调用 saveImageToAlbum...')
          await this.saveImageToAlbum(previewImage)
          console.log('saveImageToAlbum 执行完成')
          uni.hideLoading()
          uni.showToast({
            title: '预览图已保存到相册',
          icon: 'success'
        })
        } catch (saveError) {
          // 如果保存相册失败，尝试其他方式
          console.error('保存到相册失败:', saveError)
          uni.hideLoading()
          
          // 提供复制base64的降级方案
          uni.showModal({
            title: '保存失败',
            content: '当前环境不支持保存到相册，是否复制图片数据？',
            success: (res) => {
              if (res.confirm) {
                uni.setClipboardData({
                  data: previewImage,
                  success: () => {
                    uni.showToast({
                      title: '图片数据已复制',
                      icon: 'success'
                    })
                  }
                })
              }
            }
          })
        }
        // #endif
        
      } catch (error) {
        console.error('下载失败:', error)
        uni.hideLoading()
        uni.showToast({
          title: '下载失败',
          icon: 'none'
        })
      }
    },
    
    // 下载预览图（超高清打印版）
    async downloadPreviewHD() {
      console.log('=== 点击超高清按钮 ===')
      console.log('剧本数据:', this.scriptDetail ? '存在' : '不存在')
      console.log('预览图:', this.scriptDetail?.preview_image ? '存在' : '不存在')
      
      if (!this.scriptDetail.preview_image) {
        console.log('❌ 没有预览图，退出')
        return
      }
      
      console.log('✅ 开始超高清下载流程')
      uni.showLoading({ title: '准备下载...' })
      
      try {
        const previewImage = this.scriptDetail.preview_image
        console.log('预览图格式:', previewImage.substring(0, 50) + '...')
        
        // #ifdef H5
        console.log('🌐 当前平台: H5')
        console.log('开始将SVG转换为超高清PNG...')
        
        // H5端：将SVG转换为高清PNG后下载
        const fileName = `${this.scriptDetail.title || '剧本预览图'}-超高清.png`
        console.log('目标文件名:', fileName)
        
        if (previewImage.startsWith('data:image/svg+xml;base64,')) {
          console.log('✅ SVG格式验证通过')
          
          try {
            // 创建Image元素加载SVG
            const img = new Image()
            
            img.onload = () => {
              console.log('✅ SVG图片加载成功')
              console.log('原始尺寸:', img.width, 'x', img.height)
              
              // 创建高清Canvas（2倍分辨率）
              const canvas = document.createElement('canvas')
              const scale = 2  // 2倍超高清
              canvas.width = (img.width || 800) * scale
              canvas.height = (img.height || 600) * scale
              console.log('超高清Canvas尺寸:', canvas.width, 'x', canvas.height, '(2倍分辨率)')
              
              const ctx = canvas.getContext('2d')
              ctx.scale(scale, scale)
              // 白色背景
              ctx.fillStyle = 'white'
              ctx.fillRect(0, 0, canvas.width, canvas.height)
              // 绘制SVG
              ctx.drawImage(img, 0, 0)
              console.log('✅ SVG已绘制到超高清Canvas')
              
              // 转换为高质量PNG
              canvas.toBlob((blob) => {
                if (!blob) {
                  console.error('❌ PNG转换失败')
                  uni.hideLoading()
                  uni.showToast({ title: 'PNG转换失败', icon: 'none' })
                  return
                }
                
                console.log('✅ 超高清PNG转换成功，大小:', (blob.size / 1024).toFixed(2), 'KB')
                
                // 创建下载链接
                const url = URL.createObjectURL(blob)
                console.log('PNG Blob URL:', url)
                console.log('💾 下载位置: C:\\Users\\Administrator\\Downloads\\')
                console.log('💡 快捷键: 按 Ctrl+J 查看下载管理器')
                
                const a = document.createElement('a')
                a.href = url
                a.download = fileName
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                
                console.log('✅ 超高清PNG下载已触发！')
                console.log('文件名:', fileName)
                
                URL.revokeObjectURL(url)
                console.log('Blob URL已释放')
                
                uni.hideLoading()
                uni.showToast({
                  title: '超高清PNG已下载',
                  icon: 'success',
                  duration: 2000
                })
                
                console.log('=== H5超高清PNG下载完成 ===')
                
                // 提示用户
                setTimeout(() => {
                  uni.showModal({
                    title: '💡 打印提示',
                    content: 'PNG格式已转换为2倍超高清\n适合打印使用\n可获得最佳打印效果',
                    showCancel: false
                  })
                }, 2000)
              }, 'image/png', 1.0)
            }
            
            img.onerror = (err) => {
              console.error('❌ SVG图片加载失败:', err)
              uni.hideLoading()
          uni.showToast({
                title: 'SVG加载失败',
                icon: 'none'
              })
            }
            
            console.log('开始加载SVG图片...')
            img.src = previewImage
            
          } catch (h5Error) {
            console.error('❌ H5下载过程出错:', h5Error)
            uni.hideLoading()
            throw h5Error
          }
        } else {
          console.log('❌ 图片格式不是SVG base64')
          throw new Error('图片格式不支持')
        }
        // #endif
        
        // #ifndef H5
        // 小程序端：保存到相册
        try {
          await this.saveImageToAlbum(previewImage)
          uni.hideLoading()
          uni.showToast({
            title: '超高清版已保存',
            icon: 'success',
            duration: 2000
          })
          
          // 提示用户
          setTimeout(() => {
        uni.showModal({
              title: '💡 打印提示',
              content: 'SVG格式支持无损缩放\n从相册打开后可获得最佳打印效果',
              showCancel: false
            })
          }, 2000)
        } catch (saveError) {
          console.error('保存失败:', saveError)
          uni.hideLoading()
          
          // 降级方案：复制数据
          uni.showModal({
            title: '保存失败',
            content: '当前环境不支持保存到相册，是否复制图片数据？',
          success: (res) => {
            if (res.confirm) {
                uni.setClipboardData({
                  data: previewImage,
                  success: () => {
                    uni.showToast({
                      title: '图片数据已复制',
                      icon: 'success'
                    })
                  }
                })
              }
            }
          })
        }
        // #endif
        
      } catch (error) {
        console.error('下载失败:', error)
        uni.hideLoading()
        uni.showToast({
          title: '下载失败: ' + (error.message || '未知错误'),
          icon: 'none'
        })
      }
    },
    
    // 保存图片到相册
    async saveImageToAlbum(imageUrl) {
      return new Promise((resolve, reject) => {
        console.log('[保存图片] 开始，URL前缀:', imageUrl.substring(0, 50))
        
        // SVG base64需要转换为PNG
        if (imageUrl.startsWith('data:image/svg+xml;base64,')) {
          console.log('[保存图片] SVG格式，需要转换为PNG')
          
          // 使用canvas将SVG转为PNG
          const img = new Image()
          img.onload = () => {
            console.log('[保存图片] SVG图片加载成功，尺寸:', img.width, 'x', img.height)
            
            // 创建canvas
            const canvas = document.createElement('canvas')
            canvas.width = img.width || 800
            canvas.height = img.height || 600
            
            const ctx = canvas.getContext('2d')
            ctx.fillStyle = 'white'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(img, 0, 0)
            
            // 转为PNG base64
            const pngDataUrl = canvas.toDataURL('image/png', 1.0)
            console.log('[保存图片] 转换为PNG成功，大小:', (pngDataUrl.length / 1024).toFixed(2), 'KB')
            
            // 保存PNG到相册
            uni.saveImageToPhotosAlbum({
              filePath: pngDataUrl,
              success: () => {
                console.log('[保存图片] ✅ PNG已保存到相册')
                console.log('[保存图片] 💡 位置: 手机相册/图库')
                resolve()
              },
              fail: (err) => {
                console.error('[保存图片] ❌ 保存失败:', err)
                reject(err)
              }
            })
          }
          
          img.onerror = (err) => {
            console.error('[保存图片] ❌ SVG加载失败:', err)
            reject(new Error('SVG图片加载失败'))
          }
          
          img.src = imageUrl
          
        } else if (imageUrl.startsWith('data:image')) {
          // 其他base64图片（PNG/JPG）
          console.log('[保存图片] 普通base64格式，直接保存')
          uni.saveImageToPhotosAlbum({
            filePath: imageUrl,
            success: () => {
              console.log('[保存图片] ✅ 已保存到相册')
              resolve()
            },
            fail: (err) => {
              console.error('[保存图片] ❌ 保存失败:', err)
              reject(err)
            }
          })
        } else {
          // 网络图片先下载再保存
          console.log('[保存图片] 网络URL，先下载...')
          uni.downloadFile({
            url: imageUrl,
            success: (downloadRes) => {
              console.log('[保存图片] 下载成功，临时路径:', downloadRes.tempFilePath)
              uni.saveImageToPhotosAlbum({
                filePath: downloadRes.tempFilePath,
                success: () => {
                  console.log('[保存图片] ✅ 已保存到相册')
                  resolve()
                },
                fail: (err) => {
                  console.error('[保存图片] ❌ 保存失败:', err)
                  reject(err)
                }
              })
            },
            fail: (err) => {
              console.error('[保存图片] ❌ 下载失败:', err)
              reject(err)
            }
          })
        }
      })
    },
    
    // 复制JSON URL到剪贴板
    async copyJsonToClipboard() {
      this.copyingJson = true
      
      try {
        console.log('[copyJsonToClipboard] 开始生成JSON URL，剧本ID:', this.scriptId)
        
        // 检查剧本数据
        if (!this.scriptDetail) {
          uni.showToast({
            title: '剧本数据不存在',
            icon: 'none'
          })
          this.copyingJson = false
          return
        }
        
        // 优先使用 json_url（如果存在）
        if (this.scriptDetail.json_url) {
          console.log('[copyJsonToClipboard] 使用现有的 json_url:', this.scriptDetail.json_url)
          
          uni.setClipboardData({
            data: this.scriptDetail.json_url,
            success: () => {
              console.log('[copyJsonToClipboard] JSON URL 复制成功')
              uni.showToast({
                title: '✅ JSON链接已复制',
                icon: 'success',
                duration: 2000
              })
            },
            fail: (err) => {
              console.error('[copyJsonToClipboard] 复制失败:', err)
              uni.showToast({
                title: '复制失败',
                icon: 'none'
              })
            }
          })
          
          this.copyingJson = false
          return
        }
        
        // 如果没有 json_url，但有 json_data，则生成临时云存储URL
        if (!this.scriptDetail.json_data) {
          uni.showToast({
            title: '该剧本暂无JSON数据',
            icon: 'none',
            duration: 2000
          })
          this.copyingJson = false
          return
        }
        
        // 调用云对象生成临时URL
        console.log('[copyJsonToClipboard] 调用云对象生成临时URL')
        const result = await this.scriptObj.generateJsonUrl(this.scriptId)
        
        if (result.code === 0) {
          const jsonUrl = result.data.url
          console.log('[copyJsonToClipboard] 临时URL生成成功:', jsonUrl)
          
          // 复制URL到剪贴板
          uni.setClipboardData({
            data: jsonUrl,
            success: () => {
              uni.showToast({
                title: '✅ JSON链接已复制',
                icon: 'success',
                duration: 2000
              })
              
              // 显示提示信息
              setTimeout(() => {
                uni.showModal({
                  title: '链接已复制',
                  content: '临时链接有效期7天，可在浏览器中打开查看JSON内容',
                  showCancel: false,
                  confirmText: '知道了'
                })
              }, 2000)
            },
            fail: (err) => {
              console.error('[copyJsonToClipboard] 复制失败:', err)
              uni.showToast({
                title: '复制失败',
                icon: 'none'
              })
            }
          })
        } else {
          throw new Error(result.result.message || '生成链接失败')
        }
        
      } catch (error) {
        console.error('[copyJsonToClipboard] 生成JSON URL失败:', error)
        uni.showToast({
          title: '生成链接失败: ' + (error.message || '未知错误'),
          icon: 'none',
          duration: 2000
        })
      } finally {
        this.copyingJson = false
      }
    },
    
    // 生成JSON链接
    async generateJsonUrl() {
      this.generatingUrl = true;
      
      try {
        console.log('[generateJsonUrl] 开始生成链接，剧本ID:', this.scriptId);
        
        if (!this.scriptId) {
          uni.showToast({
            title: '剧本ID不存在',
            icon: 'none'
          });
          this.generatingUrl = false;
          return;
        }
        
        // 检查JSON数据
        if (!this.scriptDetail || !this.scriptDetail.json_data) {
          uni.showToast({
            title: 'JSON数据不存在',
            icon: 'none'
          });
          this.generatingUrl = false;
          return;
        }
        
        // 生成Data URL（无需服务器，直接在浏览器中打开）
        // 将JSON对象转换为格式化字符串
        const jsonString = JSON.stringify(this.scriptDetail.json_data, null, 2);
        
        // 创建Data URL（浏览器可以直接打开）
        const dataUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonString);
        
        console.log('[generateJsonUrl] Data URL长度:', dataUrl.length);
        console.log('[generateJsonUrl] Data URL前100字符:', dataUrl.substring(0, 100));
        
        // 复制Data URL到剪贴板
        uni.setClipboardData({
          data: dataUrl,
          success: () => {
            this.copiedUrl = true;
            
            uni.showModal({
              title: '✅ JSON链接已生成',
              content: `链接已复制到剪贴板\n\n链接较长，在浏览器地址栏中粘贴即可直接查看JSON内容\n\n提示：\n• H5端可点击"在新窗口打开"\n• 小程序端请复制到浏览器打开`,
              confirmText: '在新窗口打开',
              cancelText: '关闭',
              success: (res) => {
                if (res.confirm) {
                  // #ifdef H5
                  window.open(dataUrl, '_blank');
                  // #endif
                  
                  // #ifndef H5
                  uni.showToast({
                    title: '请在浏览器中粘贴链接',
                    icon: 'none',
                    duration: 2000
                  });
                  // #endif
                }
              }
            });
            
            // 3秒后恢复按钮状态
            setTimeout(() => {
              this.copiedUrl = false;
            }, 3000);
          },
          fail: () => {
            uni.showToast({
              title: '复制失败',
              icon: 'none'
            });
          }
        });
      } catch (error) {
        console.error('[generateJsonUrl] 生成链接失败:', error);
        uni.showToast({
          title: '生成失败: ' + error.message,
          icon: 'none'
        });
      } finally {
        this.generatingUrl = false;
      }
    },
    
    async downloadScript() {
      try {
        uni.showLoading({ title: '准备下载...' })
        
        const result = await uniCloud.callFunction({
          name: 'script-download',
          data: { id: this.scriptId }
        })

        if (result.result.code === 0) {
          const { json_url, json_data } = result.result.data
          
          if (json_url) {
            // 如果有文件URL，直接下载文件
            uni.downloadFile({
              url: json_url,
              success: (res) => {
                uni.showToast({
                  title: '下载成功',
                  icon: 'success'
                })
              }
            })
          } else if (json_data) {
            // 如果有JSON数据，保存到本地
            const jsonString = JSON.stringify(json_data, null, 2)
            uni.setClipboardData({
              data: jsonString,
              success: () => {
                uni.showToast({
                  title: '剧本数据已复制到剪贴板',
                  icon: 'success'
                })
              }
            })
          }
        }
      } catch (error) {
        console.error('下载失败：', error)
        uni.showToast({
          title: '下载失败',
          icon: 'none'
        })
      } finally {
        uni.hideLoading()
      }
    },

    // 分享剧本
    shareScript() {
      // 小程序分享功能会自动调用onShareAppMessage
    },

    // 记录浏览历史
    async recordHistory() {
      console.log('📝 开始记录浏览历史...')
      console.log('📝 target_type: script')
      console.log('📝 target_id:', this.scriptId)
      console.log('📝 token:', Auth.getToken())
      
      try {
        const result = await uniCloud.callFunction({
          name: 'history-add',
          data: {
            target_type: 'script',
            target_id: this.scriptId,
            token: Auth.getToken()
          }
        })
        console.log('✅ 浏览历史记录成功，返回结果：', result)
      } catch (error) {
        console.error('❌ 记录浏览历史失败：', error)
      }
    },

    // 检查收藏状态
    async checkFavoriteStatus() {
      try {
        const db = uniCloud.database()
        const result = await db.collection('botc-favorites')
          .where({
            user_id: this.currentUserId,
            target_type: 'script',
            target_id: this.scriptId
          })
          .get()
        
        this.isFavorite = result.data && result.data.length > 0
        console.log('✅ 收藏状态：', this.isFavorite)
      } catch (error) {
        console.error('检查收藏状态失败：', error)
      }
    },

    // 收藏剧本
    async favoriteScript() {
      // 检查登录
      if (!Auth.isLogin()) {
        Auth.toLogin()
        return
      }

      try {
        const functionName = this.isFavorite ? 'favorite-remove' : 'favorite-add'
        
        const result = await uniCloud.callFunction({
          name: functionName,
          data: { 
            target_type: 'script',
            target_id: this.scriptId,
            token: Auth.getToken()
          }
        })

        if (result.result.code === 0) {
          this.isFavorite = !this.isFavorite
          uni.showToast({
            title: this.isFavorite ? '收藏成功' : '取消收藏',
            icon: 'success'
          })
        } else {
          throw new Error(result.result.message)
        }
      } catch (error) {
        console.error('收藏操作失败：', error)
        uni.showToast({
          title: error.message || '操作失败',
          icon: 'none'
        })
      }
    },

    // 工具方法
    formatTime(timestamp) {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      return `${date.getMonth() + 1}/${date.getDate()}`
    },

    getDifficultyClass(difficulty) {
      const classMap = {
        1: 'difficulty-easy',
        2: 'difficulty-normal',
        3: 'difficulty-hard',
        4: 'difficulty-expert'
      }
      return classMap[difficulty] || 'difficulty-unknown'
    },

    getDifficultyText(difficulty) {
      const textMap = {
        1: '简单',
        2: '中等',
        3: '困难',
        4: '专家'
      }
      return textMap[difficulty] || '未知'
    },
    
    // 处理用户点击事件
    handleUserClick(userId, userInfo = {}) {
      console.log('handleUserClick triggered:', userId, userInfo)
      if (!userId) {
        console.warn('userId is empty in handleUserClick')
        return
      }
      UserAction.showUserMenu(userId, userInfo)
    },
    
    // ========== 评分相关方法 ==========
    
    // 加载用户评分
    async loadUserRating() {
      try {
        const result = await uniCloud.callFunction({
          name: 'script-rating',
          data: {
            action: 'getUserRating',
            user_id: this.currentUserId,
            script_id: this.scriptId
          }
        })
        
        if (result.result.code === 0 && result.result.data) {
          this.userRating = result.result.data
          this.selectedRating = this.userRating.rating
          console.log('✅ 用户评分加载成功:', this.userRating)
        }
      } catch (error) {
        console.error('加载用户评分失败:', error)
      }
    },
    
    // 选择评分
    selectRating(star) {
      this.selectedRating = star
    },
    
    // 提交评分
    async submitRating() {
      if (!this.selectedRating) {
        uni.showToast({
          title: '请选择评分',
          icon: 'none'
        })
        return
      }
      
      this.submitting = true
      
      try {
        const result = await uniCloud.callFunction({
          name: 'script-rating',
          data: {
            action: 'submit',
            user_id: this.currentUserId,
            script_id: this.scriptId,
            rating: this.selectedRating
          }
        })
        
        if (result.result.code === 0) {
          // 关闭弹出层
          this.hideRatingPopup()
          
          uni.showToast({
            title: result.result.data.is_new ? '评分成功' : '评分已更新',
            icon: 'success'
          })
          
          // 重新加载用户评分和剧本详情
          await this.loadUserRating()
          await this.loadScriptDetail()
        } else {
          throw new Error(result.result.message)
        }
      } catch (error) {
        console.error('提交评分失败:', error)
        uni.showToast({
          title: '提交失败',
          icon: 'none'
        })
      } finally {
        this.submitting = false
      }
    },
    
    // 跳转到登录
    goToLogin() {
      uni.navigateTo({
        url: '/pages/login/sms-login'
      })
    },
    
    // 显示评分弹出层
    showRatingPopup() {
      this.ratingPopupVisible = true
      // 使用nextTick确保DOM渲染后再触发动画
      this.$nextTick(() => {
        setTimeout(() => {
          this.ratingPopupShow = true
        }, 50)
      })
    },
    
    // 隐藏评分弹出层
    hideRatingPopup() {
      this.ratingPopupShow = false
      setTimeout(() => {
        this.ratingPopupVisible = false
      }, 300) // 等待动画结束
    },
    
    // 获取评分描述
    getRatingDesc(rating) {
      const descMap = {
        1: '很差',
        2: '不太好',
        3: '还可以',
        4: '很不错',
        5: '非常棒'
      }
      return descMap[rating] || ''
    }
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: this.scriptDetail ? `血染钟楼剧本：${this.scriptDetail.title}` : '血染钟楼剧本分享',
      path: `/pages/script/detail/detail?id=${this.scriptId}`
    }
  }
}
</script>

<style scoped>
/* 页面背景 */
.page {
  background: linear-gradient(180deg, #f5f5f5 0%, #ffffff 100%);
  min-height: 100vh;
}

/* 头部区域 - 立体渐变卡片 */
.script-header {
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 50%, #D2691E 100%);
  color: white;
  padding: 50rpx 30rpx;
  text-align: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8rpx 24rpx rgba(139, 69, 19, 0.3);
}

.script-header::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  animation: shine 3s infinite;
}

@keyframes shine {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(10%, 10%); }
}

.script-title {
  display: block;
  font-size: 40rpx;
  font-weight: bold;
  margin-bottom: 15rpx;
  text-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
}

.script-subtitle {
  display: block;
  font-size: 28rpx;
  opacity: 0.95;
  margin-bottom: 25rpx;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
  position: relative;
  z-index: 1;
}

.script-rating {
  margin-top: 25rpx;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10rpx);
  padding: 20rpx 30rpx;
  border-radius: 50rpx;
  display: inline-block;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.15);
  position: relative;
  z-index: 1;
}

.rating-score {
  font-size: 36rpx;
  font-weight: bold;
  margin-right: 15rpx;
  text-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.2);
}

.rating-count {
  font-size: 26rpx;
  opacity: 0.9;
}

/* 信息卡片 - 立体效果 */
.info-card {
  margin: 30rpx 20rpx;
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
  transform: translateZ(0);
  transition: all 0.3s ease;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 25rpx;
  padding: 15rpx;
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
  border-radius: 12rpx;
  border-left: 4rpx solid #8B4513;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: 28rpx;
  color: #666666;
  font-weight: 600;
  width: 120rpx;
  flex-shrink: 0;
}

.info-value {
  font-size: 28rpx;
  color: #333333;
  flex: 1;
  font-weight: 500;
}

/* 难度标签 - 3D效果 */
.difficulty {
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  color: white !important;
  font-weight: bold;
  font-size: 24rpx !important;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2),
              inset 0 -2rpx 4rpx rgba(0, 0, 0, 0.2);
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.3);
}

.difficulty-easy { 
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
}
.difficulty-normal { 
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
}
.difficulty-hard { 
  background: linear-gradient(135deg, #faad14 0%, #ffc53d 100%);
}
.difficulty-expert { 
  background: linear-gradient(135deg, #f5222d 0%, #ff4d4f 100%);
}
.difficulty-unknown { 
  background: linear-gradient(135deg, #d9d9d9 0%, #e8e8e8 100%);
  color: #666666 !important; 
}

/* 描述卡片 */
/* 预览图卡片 */
.preview-card {
  margin: 30rpx 20rpx;
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.preview-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.ai-badge {
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  border-radius: 12rpx;
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
  color: white;
  font-weight: 500;
  box-shadow: 0 2rpx 8rpx rgba(139, 69, 19, 0.2);
}

.download-options {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.download-tip {
  font-size: 24rpx;
  color: #999;
}

/* 用户上传图片卡片 */
.user-images-card {
  margin: 30rpx 20rpx;
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.user-images-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.user-badge {
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  border-radius: 12rpx;
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  color: white;
  font-weight: 500;
  box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.2);
}

/* 用户图片网格 */
.user-images-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.grid-item {
  position: relative;
  width: 100%;
  padding-bottom: 100%;  /* 1:1 比例 */
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
  background: #f5f5f5;
  cursor: pointer;
}

.grid-item:active {
  transform: scale(0.95);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
}

.grid-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.grid-item:active .image-overlay {
  opacity: 1;
}

.overlay-icon {
  font-size: 48rpx;
  color: white;
  filter: drop-shadow(0 2rpx 4rpx rgba(0, 0, 0, 0.3));
}

/* 图片提示 */
.image-tip {
  padding: 16rpx 20rpx;
  background: linear-gradient(135deg, #e6f7ff 0%, #d9f0ff 100%);
  border-radius: 12rpx;
  border: 1rpx solid #91d5ff;
}

.tip-text {
  font-size: 24rpx;
  color: #0050b3;
  line-height: 1.5;
}

.preview-image {
  width: 100%;
  border-radius: 12rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

.desc-card {
  margin: 30rpx 20rpx;
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.script-desc {
  font-size: 28rpx;
  color: #333333;
  line-height: 1.8;
  white-space: pre-line;
}

/* 标签卡片 */
.tags-card {
  margin: 30rpx 20rpx;
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
}

.tag {
  font-size: 24rpx;
  color: #8B4513;
  background: linear-gradient(135deg, rgba(139, 69, 19, 0.1) 0%, rgba(139, 69, 19, 0.15) 100%);
  padding: 12rpx 24rpx;
  border-radius: 20rpx;
  border: 2rpx solid rgba(139, 69, 19, 0.2);
  box-shadow: 0 2rpx 8rpx rgba(139, 69, 19, 0.1);
  transition: all 0.3s ease;
}

/* 操作栏和预览操作区 */
.action-bar,
.preview-actions {
  display: flex;
  padding: 0 20rpx;
  gap: 20rpx;
  margin: 30rpx 0;
}

.preview-actions {
  margin: 24rpx 0 0;
  padding: 0;
}

/* 统一的按钮样式 */
.action-btn {
  flex: 1;
  height: 100rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  border-radius: 16rpx;
  border: none;
  box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.action-btn:active {
  transform: scale(0.95);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

.action-btn .btn-icon {
  font-size: 40rpx;
  line-height: 1;
}

.action-btn .btn-text {
  font-size: 26rpx;
  font-weight: 600;
  line-height: 1;
}

/* 收藏按钮 - 灰色渐变 */
.action-btn.btn-favorite {
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
}

.action-btn.btn-favorite .btn-text {
  color: #666;
}

/* 收藏按钮 - 已收藏时粉红渐变 */
.action-btn.btn-favorite.is-favorite {
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
}

.action-btn.btn-favorite.is-favorite .btn-icon,
.action-btn.btn-favorite.is-favorite .btn-text {
  color: white;
}

/* 复制JSON按钮 - 棕色渐变 */
.action-btn.btn-json {
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
}

.action-btn.btn-json .btn-icon,
.action-btn.btn-json .btn-text {
  color: white;
}

.action-btn.btn-json[disabled] {
  opacity: 0.6;
}

/* 普通下载按钮 - 蓝色渐变 */
.action-btn.btn-download-normal {
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
}

.action-btn.btn-download-normal .btn-icon,
.action-btn.btn-download-normal .btn-text {
  color: white;
}

/* 超高清下载按钮 - 紫色渐变 */
.action-btn.btn-download-hd {
  background: linear-gradient(135deg, #722ed1 0%, #9254de 100%);
}

.action-btn.btn-download-hd .btn-icon,
.action-btn.btn-download-hd .btn-text {
  color: white;
}

/* 相关帖子区 */
.posts-section {
  margin: 30rpx 20rpx;
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.more-btn {
  display: flex;
  align-items: center;
  gap: 5rpx;
  font-size: 26rpx;
  color: #8B4513;
  padding: 8rpx 16rpx;
  background: rgba(139, 69, 19, 0.1);
  border-radius: 20rpx;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.post-item {
  background: linear-gradient(135deg, #fafafa 0%, #ffffff 100%);
  border-radius: 16rpx;
  padding: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
  border-left: 4rpx solid #8B4513;
  transition: all 0.3s ease;
}

.post-item:active {
  transform: translateX(4rpx);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.post-user {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15rpx;
}

.post-username {
  font-size: 26rpx;
  color: #8B4513;
  font-weight: 600;
}

.post-time {
  font-size: 22rpx;
  color: #999;
}

.post-content {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 15rpx;
}

.post-stats {
  display: flex;
  gap: 30rpx;
}

.stat-item {
  font-size: 24rpx;
  color: #666;
}

.no-posts {
  text-align: center;
  padding: 80rpx 0;
  color: #999;
  font-size: 28rpx;
}

/* 评论区 - 立体卡片 */
.comment-section {
  margin: 30rpx 20rpx;
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25rpx;
}

.comment-header .card-title {
  flex: 1;
}

.comment-header .comment-btn {
  margin-left: auto;
  flex-shrink: 0;
}

/* 评价按钮 - 立体按钮 */
.comment-btn {
  font-size: 26rpx;
  padding: 12rpx 24rpx;
  height: auto;
  line-height: auto;
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
  border-radius: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(139, 69, 19, 0.3);
  transition: all 0.3s ease;
}

.comment-btn:active {
  transform: scale(0.95);
}

/* 已评价状态 */
.comment-btn.btn-disabled {
  background: #f5f5f5;
  color: #999999;
  border-color: #e8e8e8;
  box-shadow: none;
  cursor: not-allowed;
}

.comment-btn.btn-disabled:active {
  transform: none;
}

.comment-list {
  margin-top: 25rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

/* 评论卡片 - 3D效果 */
.comment-item {
  background: linear-gradient(135deg, #fafafa 0%, #ffffff 100%);
  border-radius: 16rpx;
  padding: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
  border-left: 4rpx solid #8B4513;
  transition: all 0.3s ease;
}

.comment-item:hover {
  transform: translateX(4rpx);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.comment-header-info {
  margin-bottom: 15rpx;
}

.user-name {
  font-size: 28rpx;
  color: #8B4513;
  font-weight: 600;
}

.clickable {
  cursor: pointer;
  transition: opacity 0.3s;
}

.clickable:active {
  opacity: 0.6;
}

.comment-rating {
  margin-top: 8rpx;
  padding: 4rpx 12rpx;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.2) 100%);
  border-radius: 12rpx;
  display: inline-block;
}

.rating-stars {
  font-size: 22rpx;
}

.comment-time {
  font-size: 24rpx;
  color: #999999;
}

.comment-content {
  font-size: 28rpx;
  color: #333333;
  line-height: 1.6;
  padding: 12rpx 0;
}

.no-comment {
  text-align: center;
  padding: 80rpx 0;
  color: #999999;
  font-size: 28rpx;
}

.no-comment-text {
  display: block;
  margin-bottom: 10rpx;
}

/* 弹窗样式 - 毛玻璃效果 */
.comment-popup {
  background: white;
  border-radius: 32rpx 32rpx 0 0;
  max-height: 80vh;
  box-shadow: 0 -8rpx 32rpx rgba(0, 0, 0, 0.15);
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 35rpx 30rpx;
  border-bottom: none;
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
  color: white;
  border-radius: 32rpx 32rpx 0 0;
}

.popup-title {
  font-size: 34rpx;
  font-weight: bold;
}

.popup-close {
  font-size: 44rpx;
  color: white;
  opacity: 0.9;
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
}

.popup-body {
  padding: 35rpx 30rpx;
}

/* 评分区域 - 立体卡片 */
.rating-section {
  display: flex;
  align-items: center;
  margin-bottom: 35rpx;
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
  padding: 25rpx;
  border-radius: 16rpx;
  border: 2rpx solid rgba(139, 69, 19, 0.1);
}

.rating-label {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-right: 25rpx;
}

/* 输入框 - 3D效果 */
.comment-textarea {
  width: 100%;
  min-height: 240rpx;
  padding: 25rpx;
  border: 2rpx solid #e8e8e8;
  border-radius: 16rpx;
  font-size: 28rpx;
  line-height: 1.6;
  background: white;
  box-shadow: inset 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.comment-textarea:focus {
  border-color: #8B4513;
  box-shadow: 0 0 0 4rpx rgba(139, 69, 19, 0.1),
              inset 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

/* 弹窗底部 */
.popup-footer {
  padding: 25rpx 30rpx 35rpx;
  border-top: none;
  background: linear-gradient(180deg, transparent 0%, #fafafa 100%);
}

/* 提交按钮 - 3D渐变按钮 */
.submit-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 600;
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
  box-shadow: 0 6rpx 20rpx rgba(139, 69, 19, 0.3);
  transition: all 0.3s ease;
}

.submit-btn:active {
  transform: scale(0.98);
  box-shadow: 0 4rpx 12rpx rgba(139, 69, 19, 0.2);
}

/* 加载和错误状态 */
.loading-container, .error-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 60vh;
  gap: 20rpx;
}

.error-text {
  font-size: 28rpx;
  color: #999999;
  margin-bottom: 40rpx;
}

.retry-btn {
  width: 200rpx;
  height: 60rpx;
  line-height: 60rpx;
  font-size: 26rpx;
}

/* 评分统计卡片样式 */
.rating-stats-card {
  margin-bottom: 30rpx;
}

.rating-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16rpx;
  margin-bottom: 20rpx;
}

.stats-main {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.stats-score {
  font-size: 60rpx;
  font-weight: bold;
  color: #fff;
  line-height: 1;
}

.stats-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
  margin-top: 8rpx;
}

.stats-detail {
  text-align: right;
}

.detail-count {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.95);
}

.current-rating {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 24rpx;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 12rpx;
  border: 2rpx solid rgba(102, 126, 234, 0.2);
}

.current-text {
  font-size: 26rpx;
  color: #666;
}

.current-stars {
  font-size: 32rpx;
}

.current-score {
  font-size: 28rpx;
  color: #667eea;
  font-weight: 500;
}

/* 底部评分按钮 */
.bottom-action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16rpx 30rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.95) 20%, #fff 100%);
  backdrop-filter: blur(20rpx);
  z-index: 100;
}

.btn-rate {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 26rpx 0;
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
  color: #fff;
  border: none;
  border-radius: 16rpx;
  font-size: 30rpx;
  font-weight: 600;
  box-shadow: 0 4rpx 16rpx rgba(139, 69, 19, 0.3);
  letter-spacing: 2rpx;
}

.btn-rate::after {
  border: none;
}

.btn-icon {
  font-size: 32rpx;
}

.btn-text {
  font-size: 30rpx;
}

/* 评分弹出层 */
.rating-popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 999;
  display: flex;
  align-items: flex-end;
}

.rating-popup {
  width: 100%;
  max-height: 75vh;
  background: #fffef8;
  border-radius: 32rpx 32rpx 0 0;
  padding: 24rpx 30rpx;
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
  transform: translateY(100%);
  transition: transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 0 -8rpx 32rpx rgba(0, 0, 0, 0.15);
  overflow-y: auto;
}

.rating-popup-show {
  transform: translateY(0);
}

.popup-drag-bar {
  width: 60rpx;
  height: 6rpx;
  background: #d4c5b0;
  border-radius: 3rpx;
  margin: 0 auto 16rpx;
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
  padding-bottom: 16rpx;
  border-bottom: 2rpx solid #f0ebe0;
}

.popup-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #5d3a1a;
  letter-spacing: 1rpx;
}

.popup-close {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #8B4513;
  background: rgba(139, 69, 19, 0.08);
  border-radius: 50%;
}

.popup-script-info {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  padding: 16rpx 20rpx;
  background: rgba(139, 69, 19, 0.05);
  border-radius: 12rpx;
  margin-bottom: 24rpx;
  border: 2rpx solid rgba(139, 69, 19, 0.1);
}

.script-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #3d2810;
  letter-spacing: 1rpx;
}

.script-author {
  font-size: 26rpx;
  color: #8B4513;
  opacity: 0.8;
  font-weight: 500;
}

.popup-rating-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
  margin-bottom: 24rpx;
  padding: 16rpx 0 40rpx;
}

.rating-label {
  font-size: 26rpx;
  color: #8B4513;
  opacity: 0.8;
}

.star-group-large {
  display: flex;
  justify-content: center;
  gap: 20rpx;
  padding: 20rpx 0;
}

.star-item-large {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  position: relative;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 未选中：空心圆 */
.star-item-large {
  background: rgba(255, 255, 255, 0.5);
  border: 4rpx solid #e8dcc8;
  box-shadow: 0 4rpx 12rpx rgba(139, 69, 19, 0.1);
}

.star-item-large:active {
  transform: scale(0.9);
}

/* 选中：实心圆 + 渐变背景 */
.star-item-large.active {
  background: linear-gradient(135deg, #d4af37 0%, #f4d03f 50%, #d4af37 100%);
  border-color: #d4af37;
  box-shadow: 0 6rpx 20rpx rgba(212, 175, 55, 0.4), 
              inset 0 2rpx 4rpx rgba(255, 255, 255, 0.5);
  transform: scale(1.08);
}

/* 星星图标 */
.star-icon {
  font-size: 60rpx;
  line-height: 1;
  transition: all 0.3s ease;
}

/* 未选中：灰色空心星 */
.star-item-large .star-icon {
  color: #d4c5b0;
  text-shadow: none;
}

/* 选中：金色实心星 + 光芒效果 */
.star-item-large.active .star-icon {
  color: #fff;
  text-shadow: 0 0 10rpx rgba(255, 255, 255, 0.8),
               0 0 20rpx rgba(255, 255, 255, 0.5),
               0 2rpx 4rpx rgba(0, 0, 0, 0.2);
  animation: starShine 0.6s ease;
}

@keyframes starShine {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

/* 数字标签：在圆的底部 */
.star-number {
  position: absolute;
  bottom: -32rpx;
  font-size: 24rpx;
  font-weight: 600;
  transition: all 0.3s ease;
}

.star-item-large .star-number {
  color: #8B4513;
  opacity: 0.6;
}

.star-item-large.active .star-number {
  color: #d4af37;
  opacity: 1;
  font-size: 26rpx;
  font-weight: bold;
}

.rating-desc {
  font-size: 32rpx;
  font-weight: bold;
  color: #5d3a1a;
  letter-spacing: 2rpx;
  animation: fadeInUp 0.3s;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.05);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.popup-actions {
  padding-top: 8rpx;
}

.btn-submit-popup {
  width: 100%;
  padding: 24rpx 0;
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
  color: #fff;
  border: none;
  border-radius: 16rpx;
  font-size: 30rpx;
  font-weight: 600;
  letter-spacing: 2rpx;
  box-shadow: 0 4rpx 16rpx rgba(139, 69, 19, 0.3);
}

.btn-submit-popup::after {
  border: none;
}

.btn-submit-popup:disabled {
  background: #d4c5b0;
  box-shadow: none;
  opacity: 0.6;
}
</style>
