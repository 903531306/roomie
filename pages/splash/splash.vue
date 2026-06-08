<template>
  <view :class="themeClass" class="splash-container" :style="themeStyles">
    <!-- 背景 -->
    <view class="background">
      <image
        class="bg-image"
        src="/static/logo.png"
        mode="aspectFill"
      />
      <view class="bg-overlay"></view>
    </view>

    <!-- 内容区域 -->
    <view class="content">
      <!-- Logo区域 -->
      <view class="logo-section">
        <image
          class="logo"
          src="/static/logo.png"
          mode="aspectFit"
        />
        <text class="app-name" :style="{ color: primaryColor }">Roomie</text>
        <text class="app-desc">让家庭事务不再分散</text>
      </view>

      <!-- 加载动画 -->
      <view class="loading-section">
        <view class="loading-spinner">
          <view class="spinner" :style="{ borderColor: primaryColor }"></view>
        </view>
        <text class="loading-text">正在初始化...</text>
      </view>

      <!-- 底部信息 -->
      <view class="footer">
        <text class="version">v{{ version }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAppTheme } from '@/common/themes/useAppTheme.js'
import { APP_VERSION } from '@/common/config'

const { themeClass, primaryColor, softColor } = useAppTheme()

// 响应式数据
const version = ref(APP_VERSION)
const isInitializing = ref(true)

const themeStyles = computed(() => ({
  backgroundColor: softColor.value
}))

// 页面加载完成
onMounted(async () => {
  try {
    // 模拟初始化过程
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 检查登录状态
    const isLoggedIn = !!uni.getStorageSync('roomie_user_info')

    // if (isLoggedIn) {
      // 已登录，跳转到主页
      // uni.switchTab({
      //   url: '/pages/index/index'
      // })
	  uni.navigateTo({ url: `/pages/index/index` })
    // } else {
    //   // 未登录，跳转到登录页
    //   uni.reLaunch({
    //     url: '/pages/login/login'
    //   })
    // }
  } catch (error) {
    console.error('启动页初始化失败:', error)
    // 出错时也跳转到登录页
    // uni.reLaunch({
    //   url: '/pages/login/login'
    // })
  } finally {
    isInitializing.value = false
  }
})
</script>

<style scoped>
.splash-container {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.bg-image {
  width: 100%;
  height: 100%;
}

.bg-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
}

.content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx;
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 80rpx;
}

.logo {
  width: 120rpx;
  height: 120rpx;
  margin-bottom: 20rpx;
  border-radius: 20rpx;
}

.app-name {
  font-size: 48rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
  text-shadow: 0 2rpx 4rpx rgba(0,0,0,0.1);
}

.app-desc {
  font-size: 28rpx;
  color: rgba(255,255,255,0.8);
  text-shadow: 0 1rpx 2rpx rgba(0,0,0,0.1);
}

.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 60rpx;
}

.loading-spinner {
  margin-bottom: 20rpx;
}

.spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid rgba(255,255,255,0.3);
  border-top: 4rpx solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 28rpx;
  color: rgba(255,255,255,0.8);
  text-shadow: 0 1rpx 2rpx rgba(0,0,0,0.1);
}

.footer {
  position: absolute;
  bottom: 40rpx;
  left: 0;
  right: 0;
  text-align: center;
}

.version {
  font-size: 24rpx;
  color: rgba(255,255,255,0.6);
}

/* 适配不同屏幕 */
@media screen and (min-height: 800px) {
  .logo {
    width: 140rpx;
    height: 140rpx;
  }

  .app-name {
    font-size: 56rpx;
  }

  .app-desc {
    font-size: 32rpx;
  }
}
</style>
