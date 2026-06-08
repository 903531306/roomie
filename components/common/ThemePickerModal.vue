
<template>
  <view 
    class="picker-mask" 
    v-show="modelValue"
    :class="{ 'mask-active': modelValue, 'mask-closing': isClosing }"
    @click="handleClose"
    @touchmove.stop.prevent
  >
    <view 
      class="picker-panel" 
      :class="{ 'panel-active': modelValue }"
      :style="{ transform: `translateY(${panelY}px)`, transition: isSwiping ? 'none' : 'transform 0.5s cubic-bezier(0.2, 1, 0.2, 1)' }"
      @click.stop
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    >
      <view class="picker-handle" :style="{ background: primaryColor }"></view>
      
      <view class="picker-header">
        <view class="header-icon-wrap">
          <text class="header-icon">🎨</text>
        </view>
        <text class="main-title">个性空间换肤</text>
        <text class="sub-label">精选配色，一键切换您的家庭氛围</text>
      </view>

      <scroll-view scroll-y class="theme-scroll" :show-scrollbar="false">
        <view class="theme-grid">
          <view 
            v-for="(t, index) in themes" 
            :key="t.id"
            class="theme-item"
            hover-class="theme-item-press"
            :class="{ 'active': currentSelected === t.id, 'item-animate': modelValue }"
            :style="[
              { '--delay': index * 0.06 + 's' },
              currentSelected === t.id ? { '--ring-color': t.primary } : {}
            ]"
            @click="selectTheme(t.id)"
          >
            <view class="swatch-card">
              <view class="swatch-preview" :style="{ background: t.soft }">
                <view class="preview-top" :style="{ background: t.primary }"></view>
                <view class="preview-body">
                  <view class="preview-chip" :style="{ background: t.primary, opacity: 0.85 }"></view>
                  <view class="preview-line"></view>
                  <view class="preview-line preview-line-short"></view>
                </view>
              </view>
              <view
                v-if="currentSelected === t.id"
                class="selected-badge"
                :style="{ background: t.primary, boxShadow: `0 4px 12px ${t.primary}55` }"
              >
                <text class="check-icon">✓</text>
              </view>
            </view>
            <text class="theme-name">{{ t.name }}</text>
          </view>
        </view>
      </scroll-view>

    <!--  <view class="action-footer">
        <button class="done-btn" @click="handleClose">完成设置</button>
      </view> -->
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { useAppTheme } from '@/common/themes/useAppTheme.js';
import { getStoredAppThemeId, setAppThemeId } from '@/common/themes/appTheme';

const { primaryColor } = useAppTheme();

const props = defineProps({
  modelValue: Boolean
});
const emit = defineEmits(['update:modelValue']);

const currentSelected = ref(getStoredAppThemeId());
const isClosing = ref(false);
const isSwiping = ref(false);
const panelY = ref(0);
let startY = 0;

const themes = [
  { id: 'indigo', name: '经典靛蓝', primary: '#4F46E5', soft: '#EEF2FF' },
  { id: 'emerald', name: '清新翡翠', primary: '#10B981', soft: '#ECFDF5' },
  { id: 'rose', name: '浪漫玫瑰', primary: '#F43F5E', soft: '#FFF1F2' },
  { id: 'amber', name: '温暖琥珀', primary: '#F59E0B', soft: '#FFFBEB' },
  { id: 'midnight', name: '极客之夜', primary: '#1E293B', soft: '#F1F5F9' },
  { id: 'violet', name: '幻紫星云', primary: '#8B5CF6', soft: '#F5F3FF' },
];

const selectTheme = (id) => {
  if (currentSelected.value === id) return;
  currentSelected.value = id;
  setAppThemeId(id);
  handleClose();
};

const handleClose = () => {
  isClosing.value = true;
  panelY.value = 1000;
  setTimeout(() => {
    emit('update:modelValue', false);
    isClosing.value = false;
    panelY.value = 0;
  }, 300);
};

const onTouchStart = (e) => { startY = e.touches[0].clientY; isSwiping.value = true; };
const onTouchMove = (e) => {
  const diff = e.touches[0].clientY - startY;
  if (diff > 0) panelY.value = diff * 0.8;
};
const onTouchEnd = () => {
  isSwiping.value = false;
  if (panelY.value > 120) handleClose();
  else panelY.value = 0;
};
</script>

<style scoped>
.picker-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  z-index: 10050;
  display: flex;
  align-items: flex-end;
  opacity: 0;
  transition: opacity 0.35s ease;
  pointer-events: none;
}
.mask-active { opacity: 1; pointer-events: auto; }
.mask-closing { opacity: 0; }

.picker-panel {
  width: 100%;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 48rpx 48rpx 0 0;
  padding: 16rpx 32rpx calc(env(safe-area-inset-bottom) + 28rpx);
  box-shadow: 0 -24rpx 80rpx rgba(15, 23, 42, 0.12);
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

.picker-handle {
  width: 72rpx;
  height: 10rpx;
  background: var(--primary-color, #4f46e5);
  border-radius: 20rpx;
  margin: 0 auto 28rpx;
  flex-shrink: 0;
  opacity: 0.65;
  transition: background 0.35s ease;
}

.picker-header {
  margin-bottom: 32rpx;
  text-align: center;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.header-icon-wrap {
  width: 88rpx;
  height: 88rpx;
  border-radius: 28rpx;
  background: linear-gradient(135deg, #f1f5f9 0%, #fff 100%);
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
  box-shadow: 0 8rpx 24rpx rgba(15, 23, 42, 0.06);
}

.header-icon { font-size: 40rpx; }

.main-title {
  font-size: 36rpx;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -0.5px;
}

.sub-label {
  font-size: 24rpx;
  font-weight: 600;
  color: #94a3b8;
  margin-top: 10rpx;
  display: block;
  line-height: 1.5;
}

.theme-scroll {
  flex-shrink: 0;
  max-height: 56vh;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
  padding: 8rpx 4rpx 24rpx;
}

.theme-item {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 16rpx;
  opacity: 0;
  transform: translateY(24rpx);
}

.item-animate {
  animation: slideUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: var(--delay);
}

@keyframes slideUp {
  to { opacity: 1; transform: translateY(0); }
}

.theme-item-press { opacity: 0.88; transform: scale(0.98); }

.swatch-card {
  position: relative;
  border-radius: 32rpx;
  padding: 6rpx;
  background: #fff;
  border: 2rpx solid #f1f5f9;
  box-shadow: 0 8rpx 28rpx rgba(15, 23, 42, 0.06);
  transition: transform 0.28s cubic-bezier(0.34, 1.2, 0.64, 1), box-shadow 0.28s ease, border-color 0.28s ease;
}

.active .swatch-card {
  border: 3rpx solid var(--ring-color, #4f46e5);
  box-shadow: 0 16rpx 40rpx rgba(15, 23, 42, 0.12);
  transform: translateY(-4rpx);
}

.swatch-preview {
  border-radius: 26rpx;
  overflow: hidden;
  height: 168rpx;
  display: flex;
  flex-direction: column;
}

.preview-top {
  height: 36rpx;
  flex-shrink: 0;
  opacity: 0.95;
}

.preview-body {
  flex: 1;
  padding: 20rpx 20rpx 16rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.preview-chip {
  width: 48rpx;
  height: 12rpx;
  border-radius: 8rpx;
}

.preview-line {
  height: 10rpx;
  border-radius: 6rpx;
  background: rgba(255, 255, 255, 0.75);
  width: 88%;
}

.preview-line-short { width: 56%; opacity: 0.65; }

.selected-badge {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3rpx solid #fff;
  animation: badgePop 0.35s cubic-bezier(0.34, 1.4, 0.64, 1);
}

@keyframes badgePop {
  from { opacity: 0; transform: scale(0.4); }
  to { opacity: 1; transform: scale(1); }
}

.check-icon {
  color: #fff;
  font-size: 22rpx;
  font-weight: 900;
  line-height: 1;
}

.theme-name {
  font-size: 26rpx;
  font-weight: 700;
  color: #64748b;
  text-align: center;
  transition: color 0.25s ease, font-weight 0.25s ease;
}

.active .theme-name {
  color: #0f172a;
  font-weight: 900;
}

.action-footer {
  padding: 10px 0 20px;
}

.done-btn {
  width: 100%;
  height: 56px;
  line-height: 56px;
  border-radius: 20px;
  background: #0f172a;
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
  border: none;
  transition: all 0.3s;
}

.done-btn:active { transform: scale(0.98); opacity: 0.9; }
</style>
