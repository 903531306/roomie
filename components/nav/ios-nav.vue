<template>
  <view :class="themeClass" class="ios-nav-container">
    <view class="ios-nav-bar">
      <!-- 左侧区域：正常态与分享态自动切换 -->
      <view class="nav-side left">
        <slot name="left">
          <!-- 情况A：仅显示图片返回 (正常导航状态) -->
          <view 
            v-if="showBack && !showHome" 
            class="single-back-btn animate-fade-in" 
            @click="handleBack"
          >
            <image src="../../static/back/icon_back.png" class="back-img-only" />
          </view>

          <!-- 情况B：显示返回+返回首页 (从分享或深层链接进入) -->
          <view v-if="showBack && showHome" class="nav-capsule-wrap animate-fade-in">
            <!-- 返回上一页 -->
       <!--     <view class="capsule-btn back-btn" @click="$emit('leftClick')">
              <image src="../../static/back/icon_back.png" class="back-img-small" />
            </view>

            <view class="capsule-divider"></view> -->

            <!-- 返回首页 -->
            <view class="capsule-btn home-btn" @click="handleHomeClick">
              <image src="../../static/back/icon_back.png" class="back-img-small" />
              <text class="btn-label">返回首页</text>
            </view>
          </view>
        </slot>
      </view>

      <!-- 中间标题 -->
      <view class="nav-center">
        <text class="nav-title">{{ title }}</text>
      </view>

      <!-- 右侧区域 -->
      <view class="nav-side right" @click="$emit('rightClick')">
        <slot name="right">
          <view v-if="rightText" class="nav-text-btn">
            <text class="nav-text">{{ rightText }}</text>
          </view>
          <view v-else-if="rightIcon" class="flat-action-btn">
            <text class="nav-icon-emoji">{{ rightIcon }}</text>
          </view>
        </slot>
      </view>
    </view>
    <!-- 占位块 -->
    <view class="nav-placeholder"></view>
  </view>
</template>

<script setup>
import { useAppTheme } from '@/common/themes/useAppTheme.js'
const { themeClass, primaryColor, softColor, theme } = useAppTheme()

const props = defineProps({
  title: { type: String, default: '' },
  showBack: { type: Boolean, default: true },
  showHome: { type: Boolean, default: false }, // 控制是否显示“返回首页”组合
  rightText: { type: String, default: '' },
  rightIcon: { type: String, default: '' }
});

const emit = defineEmits(['leftClick', 'rightClick', 'homeClick']);

const handleHomeClick = () => {
  if (emit('homeClick')) {
    emit('homeClick');
  } else {
    // 默认回首页逻辑
    uni.reLaunch({ url: '/pages/index/index' });
  }
};

const handleBack=()=>{
	if(emit('leftClick')){
		emit('leftClick')
	}else{
		// uni.navigateBack();
	}
}

</script>

<style scoped>
.ios-nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 48px;
  padding-top: 44px; /* 适配状态栏 */
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 16px;
  padding-right: 16px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(25px) saturate(180%);
  -webkit-backdrop-filter: blur(25px) saturate(180%);
  z-index: 1000;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.03);
}

.nav-side {
  min-width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  z-index: 10;
}

/* 正常态：单按钮 */
.single-back-btn {
  width: 36px;
  height: 36px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.single-back-btn:active {
  transform: scale(0.9);
  background: rgba(0, 0, 0, 0.08);
}
.back-img-only {
  width: 22px;
  height: 22px;
}

/* 分享态：灵动胶囊 */
.nav-capsule-wrap {
  display: flex;
  align-items: center;
  background: rgba(241, 245, 249, 0.7);
  border: 1.5rpx solid rgba(255, 255, 255, 0.8);
  border-radius: 100px;
  padding: 4px;
  height: 36px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
}

.capsule-btn {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 12px;
  border-radius: 100px;
  transition: all 0.2s cubic-bezier(0.23, 1, 0.32, 1);
}
.capsule-btn:active {
  background: rgba(0, 0, 0, 0.05);
  transform: scale(0.95);
}

.back-img-small {
  width: 18px;
  height: 18px;
}

.btn-label {
  font-size: 13px;
  font-weight: 900;
  color: #334155;
  margin-left: 6px;
  white-space: nowrap;
}

.capsule-divider {
  width: 1.5rpx;
  height: 18px;
  background: rgba(0, 0, 0, 0.08);
  margin: 0 2px;
}

.nav-center {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.nav-title {
  font-size: 17px;
  font-weight: 900;
  color: #1E293B;
  letter-spacing: -0.5px;
}

.nav-side.right {
  justify-content: flex-end;
}

.flat-action-btn {
  width: 36px;
  height: 36px;
  background: var(--primary-soft, #EEF2FF);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.35s ease;
}
.nav-icon-emoji { font-size: 18px; color: var(--primary-color, #4F46E5); font-weight: 900; }

.nav-text {
  font-size: 15px;
  font-weight: 800;
  color: var(--primary-color, #4F46E5);
}

.nav-placeholder {
  height: 92px; /* 48 + 44状态栏 */
  width: 100%;
}

.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}
</style>