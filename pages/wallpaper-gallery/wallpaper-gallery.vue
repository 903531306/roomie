<template>
  <view :class="themeClass" class="wallpaper-container">
    <!-- 全屏背景图片层 -->
    <view class="wallpaper-wrapper">
      <transition name="fade-scale">
        <image 
          :key="currentWallpaper.url"
          :src="currentWallpaper.url" 
          mode="aspectFill" 
          class="full-wallpaper"
          referrerPolicy="no-referrer"
        />
      </transition>
      <!-- 渐变遮罩，增强文字可读性 -->
      <view class="vignette-overlay"></view>
    </view>

    <!-- 顶部操作栏 -->
    <view class="top-bar animate-fade-in">
      <view class="back-btn-minimal" @click="goBack">
        <text class="icon">✕</text>
      </view>
      <view class="category-pill">
        <view class="dot"></view>
        <text class="tag-text">{{ currentWallpaper.category || '精选' }}</text>
      </view>
      <view class="placeholder"></view>
    </view>

    <!-- 底部信息与控制区 -->
    <view class="bottom-panel animate-slide-up">
      <view class="wallpaper-info">
        <view class="title-row">
          <text class="title-text">{{ currentWallpaper.title }}</text>
          <view class="res-badge">{{ currentWallpaper.resolution }}</view>
        </view>
        <text class="author-text">by {{ currentWallpaper.author }}</text>
      </view>

      <view class="control-bar">
        <view class="control-btn secondary" @click="saveWallpaper">
          <text class="btn-icon">📥</text>
          <text class="btn-label">保存</text>
        </view>

        <view class="control-btn primary" @click="nextWallpaper">
          <view class="next-inner">
            <text class="next-text">NEXT</text>
            <text class="next-arrow">→</text>
          </view>
        </view>

        <view class="control-btn secondary" @click="toggleFavorite">
          <text class="btn-icon" :class="{ 'is-fav': isFavorite }">{{ isFavorite ? '❤️' : '🤍' }}</text>
          <text class="btn-label">收藏</text>
        </view>
      </view>
    </view>

    <!-- 切换时的闪烁效果层 -->
    <view v-if="isSwitching" class="flash-overlay"></view>
  </view>
</template>

<script setup>
import { useAppTheme } from '@/common/themes/useAppTheme.js'
const { themeClass, primaryColor, softColor, theme } = useAppTheme()

import { ref, computed } from 'vue';

const wallpapers = [
  {
    url: 'https://picsum.photos/seed/wall1/1080/1920',
    title: '极简主义 · 晨曦',
    author: 'Studio Alpha',
    resolution: '4K Ultra HD',
    category: '自然'
  },
  {
    url: 'https://picsum.photos/seed/wall2/1080/1920',
    title: '赛博朋克 · 霓虹',
    author: 'Neon Knight',
    resolution: '2K QHD',
    category: '城市'
  },
  {
    url: 'https://picsum.photos/seed/wall3/1080/1920',
    title: '梦幻星空 · 织女',
    author: 'Cosmos Explorer',
    resolution: '4K Ultra HD',
    category: '星空'
  },
  {
    url: 'https://picsum.photos/seed/wall4/1080/1920',
    title: '深海之蓝 · 寂静',
    author: 'Oceanic',
    resolution: '1080P',
    category: '海洋'
  },
  {
    url: 'https://picsum.photos/seed/wall5/1080/1920',
    title: '沙漠之鹰 · 孤寂',
    author: 'Desert Fox',
    resolution: '4K Ultra HD',
    category: '荒野'
  }
];

const currentIndex = ref(0);
const isFavorite = ref(false);
const isSwitching = ref(false);

const currentWallpaper = computed(() => wallpapers[currentIndex.value]);

const nextWallpaper = () => {
  isSwitching.value = true;
  setTimeout(() => {
    currentIndex.value = (currentIndex.value + 1) % wallpapers.length;
    isFavorite.value = false;
    setTimeout(() => {
      isSwitching.value = false;
    }, 300);
  }, 100);
};

const goBack = () => uni.navigateBack();

const saveWallpaper = () => {
  uni.showToast({
    title: '已保存至相册',
    icon: 'success'
  });
};

const toggleFavorite = () => {
  isFavorite.value = !isFavorite.value;
  if (isFavorite.value) {
    uni.showToast({ title: '已加入收藏', icon: 'none' });
  }
};
</script>

<style scoped>
.wallpaper-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  background-color: #000;
  overflow: hidden;
}

/* 背景图片 */
.wallpaper-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.full-wallpaper {
  width: 100%;
  height: 100%;
  transition: transform 1.2s cubic-bezier(0.2, 0, 0.2, 1);
}

.vignette-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.6) 100%),
              linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.8) 100%);
}

/* 顶部栏 */
.top-bar {
  position: absolute;
  top: 80rpx;
  left: 0;
  width: 100%;
  padding: 0 40rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10;
  box-sizing: border-box;
}

.back-btn-minimal {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 24rpx;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.back-btn-minimal .icon {
  color: #fff;
  font-size: 32rpx;
  font-weight: 300;
}

.category-pill {
  display: flex;
  align-items: center;
  gap: 12rpx;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 12rpx 32rpx;
  border-radius: 100rpx;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.category-pill .dot {
  width: 8rpx;
  height: 8rpx;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 0 10rpx #fff;
}

.tag-text {
  color: #fff;
  font-size: 22rpx;
  font-weight: 600;
  letter-spacing: 4rpx;
  text-transform: uppercase;
}

/* 底部面板 */
.bottom-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 60rpx 40rpx calc(60rpx + env(safe-area-inset-bottom));
  z-index: 10;
  box-sizing: border-box;
}

.wallpaper-info {
  margin-bottom: 48rpx;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 8rpx;
}

.title-text {
  color: #fff;
  font-size: 44rpx;
  font-weight: 600;
  letter-spacing: -1rpx;
}

.res-badge {
  font-size: 18rpx;
  color: rgba(255, 255, 255, 0.6);
  padding: 4rpx 12rpx;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8rpx;
  text-transform: uppercase;
  font-weight: 700;
}

.author-text {
  color: rgba(255, 255, 255, 0.5);
  font-size: 24rpx;
  font-weight: 400;
}

.control-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  padding: 24rpx;
  border-radius: 48rpx;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-sizing: border-box;
}

.control-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.control-btn.secondary {
  width: 120rpx;
  height: 120rpx;
  border-radius: 36rpx;
}

.btn-icon {
  font-size: 40rpx;
  margin-bottom: 4rpx;
  transition: transform 0.3s ease;
}

.btn-icon.is-fav {
  transform: scale(1.2);
  filter: drop-shadow(0 0 10rpx rgba(255, 59, 48, 0.5));
}

.btn-label {
  font-size: 18rpx;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 600;
}

.control-btn.primary {
  flex: 1;
  margin: 0 24rpx;
  height: 120rpx;
  background: #fff;
  border-radius: 36rpx;
  box-shadow: 0 12rpx 32rpx rgba(255, 255, 255, 0.15);
}

.next-inner {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.next-text {
  color: #000;
  font-size: 28rpx;
  font-weight: 800;
  letter-spacing: 2rpx;
}

.next-arrow {
  color: #000;
  font-size: 32rpx;
  font-weight: 300;
}

.control-btn:active {
  transform: scale(0.94);
  opacity: 0.8;
}

.control-btn.primary:active {
  background: rgba(255, 255, 255, 0.9);
}

/* 动画 */
.animate-fade-in {
  animation: fadeIn 1s ease-out forwards;
}

.animate-slide-up {
  animation: slideUp 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(100rpx); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* 切换过渡 */
.fade-scale-enter-active, .fade-scale-leave-active {
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-scale-enter-from {
  opacity: 0;
  transform: scale(1.15);
}

.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.92);
}

.flash-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #fff;
  z-index: 100;
  animation: flash 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes flash {
  0% { opacity: 0.4; }
  100% { opacity: 0; }
}
</style>
