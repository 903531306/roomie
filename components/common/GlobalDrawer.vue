<template>
  <view
    v-if="modelValue"
    class="drawer-mask"
    :class="[themeClass, { 'mask-fade-out': isClosing }]"
    :style="maskLayerStyle"
    @tap.stop="handleClose"
    @touchmove.stop.prevent
  >
    <view
      class="drawer-panel"
      :style="panelStyle"
      @tap.stop
    >
      <!-- 拖拽关闭区：仅绑定在顶部，避免拦截 scroll-view 的触摸滚动 -->
      <view
        class="drawer-drag-zone"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
      >
        <view class="drawer-handle" :style="{ background: primaryColor }"></view>

        <!-- 标准化头部 -->
        <view class="drawer-header" v-if="title">
          <view class="header-main">
            <text class="header-title">{{ title }}</text>
            <text v-if="subtitle" class="header-subtitle">{{ subtitle }}</text>
          </view>
          <view class="header-right">
            <slot name="header-right">
              <view class="close-icon-btn" @click="handleClose" v-if="showClose">
                <text class="close-txt">✕</text>
              </view>
            </slot>
          </view>
        </view>
      </view>

      <!-- 滚动内容区：真机 scroll-view 需显式高度，不能仅依赖 flex 计算 -->
      <scroll-view
        scroll-y
        :show-scrollbar="false"
        class="drawer-scroll-area"
      >
        <view class="drawer-body-inner">
          <slot></slot>
        </view>
      </scroll-view>

      <!-- 标准化底部 -->
      <view class="drawer-footer">
        <slot name="footer"></slot>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useAppTheme } from '@/common/themes/useAppTheme.js';

const { themeClass, primaryColor } = useAppTheme();

const props = defineProps({
  modelValue: Boolean,
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  showClose: { type: Boolean, default: true }
});

const emit = defineEmits(['update:modelValue', 'close']);

const modalTranslateY = ref(0);
const isSwiping = ref(false);
const isClosing = ref(false);
let startY = 0;

// 动态计算蒙层透明度
const maskOpacity = computed(() => {
  if (!isSwiping.value) return 0.4;
  return Math.max(0.1, 0.4 - (modalTranslateY.value / 1000));
});

const maskLayerStyle = computed(() => ({
  backgroundColor: `rgba(15, 23, 42, ${maskOpacity.value})`
}));

const panelStyle = computed(() => ({
  transform: `translateY(${modalTranslateY.value}px)`,
  transition: isSwiping.value ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
}));

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    modalTranslateY.value = 0;
    isClosing.value = false;
  }
});

const onTouchStart = (e) => {
  startY = e.touches[0].clientY;
  isSwiping.value = true;
};

const onTouchMove = (e) => {
  const diff = e.touches[0].clientY - startY;
  if (diff > 0) modalTranslateY.value = Math.pow(diff, 0.98);
};

const onTouchEnd = () => {
  isSwiping.value = false;
  if (modalTranslateY.value > 150) handleClose();
  else modalTranslateY.value = 0;
};

const handleClose = () => {
  isClosing.value = true;
  modalTranslateY.value = 800; 
  setTimeout(() => {
    emit('update:modelValue', false);
    emit('close');
    isClosing.value = false;
  }, 300);
};
</script>

<style scoped>
.drawer-mask {
  position: fixed; inset: 0; 
  backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px);
  z-index: 9999; display: flex; align-items: flex-end; transition: opacity 0.3s;
}
.mask-fade-out { opacity: 0; }

.drawer-panel {
  width: 100%;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 48rpx 48rpx 0 0;
  padding: 16rpx 0 0;
  box-shadow: 0 -24rpx 80rpx rgba(15, 23, 42, 0.12);
  will-change: transform;
  display: flex;
  flex-direction: column;
  height: 78vh;
  max-height: 85vh;
  overflow: hidden;
  overscroll-behavior: contain;
}

.drawer-drag-zone {
  flex-shrink: 0;
}

.drawer-handle {
  width: 72rpx;
  height: 10rpx;
  background: var(--primary-color, #4f46e5);
  border-radius: 20rpx;
  margin: 0 auto 28rpx;
  flex-shrink: 0;
  opacity: 0.65;
  transition: background 0.35s ease;
}

.drawer-header {
  margin-bottom: 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 32rpx;
  flex-shrink: 0;
}
.header-title { font-size: 36rpx; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; }
.header-subtitle {
  font-size: 22rpx;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  display: block;
  margin-top: 4rpx;
}
.close-icon-btn {
  width: 64rpx;
  height: 64rpx;
  background: #f1f5f9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0;
  transition: background 0.2s ease, transform 0.2s ease;
}
.close-icon-btn:active { background: #e2e8f0; transform: scale(0.94); }
.close-txt { color: #94a3b8; font-size: 24rpx; font-weight: 700; }

.drawer-scroll-area {
  flex: 1;
  height: 0;
  min-height: 0;
  width: 100%;
}
.drawer-body-inner { padding: 0 32rpx 16rpx; box-sizing: border-box; }

.drawer-footer {
  padding: 12rpx 32rpx calc(env(safe-area-inset-bottom) + 12rpx);
  background: #fff;
  flex-shrink: 0;
  border-top: 1px solid #f1f5f9;
}
</style>