
<template>
  <view :class="themeClass" class="fluid-refresh-wrapper">
    <!-- 顶部视觉层：独立于内容流 -->
    <view 
      v-if="enablePullDown"
      class="refresh-fixed-layer" 
      :style="{ 
        opacity: isRefreshing ? 1 : Math.min(pullDistance / 40, 1),
        height: isRefreshing ? '80px' : (pullDistance + 10) + 'px'
      }"
    >
      <view class="visual-wrapper">
        <!-- 1. 下拉阶段：引力坍缩阵列 (Gravity Collapse Array) -->
        <view 
          v-if="!isRefreshing" 
          class="gravity-array-container"
          :style="{ 
            transform: `translateY(${pullDistance * 0.25}px) rotate(${pullDistance * 2}deg)`,
            opacity: Math.min(pullDistance / 60, 1)
          }"
        >
          <!-- 中心核心点 -->
          <view class="core-point" :style="{ 
            transform: `scale(${0.4 + pullDistance * 0.005})`,
            background: pullDistance > 110 ? 'var(--primary-color, #4F46E5)' : '#CBD5E1'
          }"></view>
          
          <!-- 旋转卫星点 -->
          <view 
            v-for="i in 3" 
            :key="i" 
            class="satellite-point"
            :style="{
              transform: `rotate(${i * 120}deg) translateY(-${Math.min(pullDistance * 0.35, 28)}px) scale(${0.3 + pullDistance * 0.003})`,
              background: pullDistance > 110 ? 'var(--primary-color, #4F46E5)' : '#E2E8F0'
            }"
          ></view>
        </view>

        <!-- 2. 刷新阶段：210px 极简扁平胶囊 -->
        <view v-else class="modern-loading-capsule animate-pop-in">
          <view class="capsule-flat-bg"></view>
          <view class="capsule-content">
            <view class="progress-track">
              <view class="progress-fill-anim"></view>
            </view>
            <text class="loading-label">正在同步数据</text>
            <view class="dot-loader">
              <view class="d-item"></view>
              <view class="d-item"></view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 主滚动容器：封装所有手势逻辑 -->
    <scroll-view 
      scroll-y 
      class="refresh-scroll-view"
      :show-scrollbar="false"
      :style="{ transform: `translate3d(0, ${isRefreshing ? 75 : pullDistance * 0.6}px, 0)` }"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
      @scrolltolower="handleScrollToLower"
    >
      <slot />

      <!-- 3. 上拉加载：列表底部 -->
      <view 
        v-if="enablePullUp && (isLoadingMore || hasMore)" 
        class="load-more-footer"
      >
        <view class="mini-dots" v-if="isLoadingMore">
          <view class="dot"></view><view class="dot"></view><view class="dot"></view>
        </view>
        <text class="load-more-txt">{{ isLoadingMore ? '正在同步数据...' : '上拉查看更多' }}</text>
      </view>
      <view class="safe-bottom-placeholder"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { useAppTheme } from '@/common/themes/useAppTheme.js'
const { themeClass, primaryColor, softColor, theme } = useAppTheme()

import { ref } from 'vue';

const props = defineProps({
  isRefreshing: Boolean,
  isLoadingMore: Boolean,
  hasMore: { type: Boolean, default: true },
  enablePullDown: { type: Boolean, default: true },
  enablePullUp: { type: Boolean, default: true }
});

const emit = defineEmits(['refresh', 'loadMore']);

const pullDistance = ref(0);
let startY = 0;
let isPulling = false;

/**
 * 核心逻辑：手势监听
 */
const handleTouchStart = (e) => {
  if (props.isRefreshing) return;
  startY = e.touches[0].clientY;
  isPulling = true;
};

const handleTouchMove = (e) => {
  if (!isPulling || props.isRefreshing || !props.enablePullDown) return;
  const currentY = e.touches[0].clientY;
  const diff = currentY - startY;
  
  if (diff > 0) {
    // 采用对数阻尼公式，模拟真实的物理张力
    pullDistance.value = Math.min(Math.pow(diff, 0.82) * 2.8, 130);
    
    // 临界点震动 (115px 是触发阈值)
    if (pullDistance.value > 115 && pullDistance.value < 118) {
      // uni.vibrateShort({ type: 'light' });
    }
  }
};

const handleTouchEnd = () => {
  if (!isPulling) return;
  isPulling = false;
  
  if (pullDistance.value > 115) {
    pullDistance.value = 115;
    emit('refresh');
  } else {
    // 回弹动画
    pullDistance.value = 0;
  }
};

const handleScrollToLower = () => {
  if (props.isLoadingMore || !props.hasMore || !props.enablePullUp) return;
  emit('loadMore');
};

// 暴露重置方法给父组件（如果需要手动重置）
defineExpose({
  reset() {
    pullDistance.value = 0;
  }
});
</script>

<style scoped>
.fluid-refresh-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.refresh-scroll-view {
  height: 100%;
  transition: transform 0.4s cubic-bezier(0.23, 1, 0.32, 1);
  will-change: transform;
}

.refresh-fixed-layer {
  position: absolute;
  top: 0; left: 0; right: 0;
  display: flex;
  justify-content: center;
  z-index: 10;
  pointer-events: none;
}

.visual-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

/* --- 下拉态：引力坍缩阵列 --- */
.gravity-array-container {
  position: relative;
  width: 80px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s linear; /* 保证旋转跟随的手感 */
}

.core-point {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  z-index: 5;
  transition: background 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.satellite-point {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  transition: background 0.3s;
}

/* --- 刷新态：210px 超宽扁平胶囊 --- */
.modern-loading-capsule {
  position: relative;
  width: 210px; 
  height: 46px;
  margin-top: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.capsule-flat-bg {
  position: absolute;
  inset: 0;
  background: #1E293B; /* 深邃午夜蓝 */
  border-radius: 23px;
  box-shadow: 0 15px 35px rgba(30, 41, 59, 0.15);
}

.capsule-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0 24px;
}

.progress-track {
  width: 34px;
  height: 3px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
}

.progress-fill-anim {
  width: 100%;
  height: 100%;
  background: var(--primary-color, #4F46E5);
  animation: flowLine 1.5s infinite ease-in-out;
}

.loading-label {
  color: #FFFFFF;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1.5px;
  white-space: nowrap;
  flex: 1;
  text-align: center;
  padding: 0 10px;
}

.dot-loader { display: flex; gap: 4px; flex-shrink: 0; }
.d-item { width: 3px; height: 3px; background: var(--primary-color, #4F46E5); border-radius: 50%; animation: dotFade 0.6s infinite alternate; }
.d-item:nth-child(2) { animation-delay: 0.3s; }

@keyframes flowLine {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@keyframes dotFade { from { opacity: 0.2; } to { opacity: 1; } }

.animate-pop-in { animation: popIn 0.5s cubic-bezier(0.19, 1, 0.22, 1) both; }
@keyframes popIn { 
  from { transform: scale(0.8) translateY(-15px); opacity: 0; } 
  to { transform: scale(1) translateY(0); opacity: 1; } 
}

/* 底部加载样式 */
.load-more-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 0 80px;
}
.load-more-txt { font-size: 12px; color: #94A3B8; font-weight: 800; letter-spacing: 0.5px; }
.mini-dots { display: flex; gap: 4px; }
.dot {
  width: 4px; height: 4px; background: var(--primary-color, #4F46E5); border-radius: 50%;
  animation: dotJump 0.6s infinite alternate;
}
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes dotJump { from { transform: translateY(0); opacity: 0.3; } to { transform: translateY(-4px); opacity: 1; } }

.safe-bottom-placeholder { height: env(safe-area-inset-bottom); }
</style>
