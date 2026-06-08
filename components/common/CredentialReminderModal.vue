<template>
  <view 
    v-if="modelValue" 
    class="credential-mask" 
    :class="[themeClass, { 'mask-closing': isClosing }]"
    @touchmove.stop.prevent
    @click="handleConfirm"
  >
    <view 
      class="credential-drawer animate-drawer-up" 
      @click.stop
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
      :style="{ transform: `translateY(${panelY}px)` }"
    >
      <!-- 顶部拖拽手柄 -->
      <view class="drawer-handle"></view>
      
      <view class="drawer-content">
        <view class="header-section">
          <view class="lock-icon-wrap">
            <text class="lock-emoji">🔐</text>
          </view>
          <text class="title-text">账号已自动生成</text>
          <text class="desc-text">为了您的方便，系统已为您创建了初始凭证</text>
        </view>

        <!-- 凭证展示区：整合账号密码，去除边距，一行显示 -->
        <view class="combined-credential-card">
          <view class="cred-row">
            <view class="cred-field">
              <text class="c-label">账号</text>
              <text class="c-value">{{ username }}</text>
            </view>
            <view class="cred-divider"></view>
            <view class="cred-field">
              <text class="c-label">密码</text>
              <text class="c-value">{{ password }}</text>
            </view>
          </view>
          
          <!-- 全局唯一的一键复制按钮 -->
          <view class="one-click-copy" @click="handleCopyAll">
            <text class="copy-icon">📋</text>
            <text class="copy-text">一键复制凭证</text>
          </view>
        </view>

        <view class="security-notice">
          <text class="notice-emoji">💡</text>
          <text class="notice-txt">提示：您可以稍后在“个人中心-设置”中修改密码</text>
        </view>

        <!-- 确认按钮 -->
        <view class="action-footer">
          <button class="know-btn" @click="handleConfirm">
            <text class="know-txt">我知道了，进入首页</text>
          </button>
        </view>
      </view>
      
      <!-- 适配 iOS 底部安全区 -->
      <view class="safe-area-bottom"></view>
    </view>
  </view>
</template>

<script setup>
import { useAppTheme } from '@/common/themes/useAppTheme.js'
const { themeClass, primaryColor, softColor, theme } = useAppTheme()

import { ref, watch } from 'vue';

const props = defineProps({
  modelValue: Boolean,
  username: { type: String, default: 'Family_8892' },
  password: { type: String, default: 'FL666888' }
});

const emit = defineEmits(['update:modelValue', 'confirm']);

const isClosing = ref(false);
const panelY = ref(0);
let startY = 0;

watch(() => props.modelValue, (val) => {
  if (val) {
    panelY.value = 0;
    isClosing.value = false;
  }
});

const handleCopyAll = () => {
  const content = `账号: ${props.username}\n密码: ${props.password}`;
  uni.setClipboardData({
    data: content,
    success: () => {
      uni.showToast({ title: '凭证已复制', icon: 'success' });
    }
  });
};

const handleConfirm = () => {
  isClosing.value = true;
  panelY.value = 800;
  setTimeout(() => {
    emit('update:modelValue', false);
    emit('confirm');
    isClosing.value = false;
  }, 300);
};

/* --- 抽屉手势交互 --- */
const onTouchStart = (e) => {
  startY = e.touches[0].clientY;
};

const onTouchMove = (e) => {
  const diff = e.touches[0].clientY - startY;
  if (diff > 0) panelY.value = diff;
};

const onTouchEnd = () => {
  if (panelY.value > 150) handleConfirm();
  else panelY.value = 0;
};
</script>

<style scoped>
.credential-mask {
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  z-index: 10001; display: flex; align-items: flex-end;
  transition: opacity 0.3s;
}
.mask-closing { opacity: 0; }

.credential-drawer {
  width: 100%; 
  background: #FFFFFF; 
  border-radius: 40px 40px 0 0;
  padding: 12px 0 0; /* 左右不留边距，内容区域再加 padding */
  box-shadow: 0 -20px 50px rgba(0, 0, 0, 0.1);
  will-change: transform; 
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.drawer-handle { 
  width: 40px; height: 5px; background: #E2E8F0; border-radius: 10px; margin: 0 auto 28px; 
}

.drawer-content {
  padding: 0 32px 24px;
}

.header-section {
  display: flex; flex-direction: column; align-items: center; text-align: center; margin-bottom: 32px;
}
.lock-icon-wrap {
  width: 64px; height: 64px; background: var(--primary-soft, #EEF2FF); border-radius: 22px;
  display: flex; align-items: center; justify-content: center; margin-bottom: 16px;
}
.lock-emoji { font-size: 32px; }
.title-text { font-size: 22px; font-weight: 900; color: #1E293B; letter-spacing: -0.5px; }
.desc-text { font-size: 13px; font-weight: 700; color: #94A3B8; margin-top: 8px; line-height: 1.4; }

/* 核心：账号密码整合展示 */
.combined-credential-card {
  background: #F8FAFC; border-radius: 28px; border: 1.5px solid #F1F5F9;
  padding: 4px; margin-bottom: 24px; overflow: hidden;
}

.cred-row {
  display: flex; align-items: center; padding: 20px 24px;
}

.cred-field {
  flex: 1; display: flex; flex-direction: column; gap: 4px;
}
.c-label { font-size: 10px; font-weight: 900; color: #CBD5E1; text-transform: uppercase; letter-spacing: 1px; }
.c-value { font-size: 16px; font-weight: 800; color: #1E293B; }

.cred-divider {
  width: 1.5px; height: 32px; background: #E2E8F0; margin: 0 20px;
}

/* 一键复制按钮 */
.one-click-copy {
  background: #FFFFFF; height: 56px; margin: 0 4px 4px; border-radius: 22px;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02); transition: all 0.2s;
}
.one-click-copy:active { transform: scale(0.98); background: #F1F5F9; }
.copy-icon { font-size: 16px; }
.copy-text { font-size: 14px; font-weight: 900; color: var(--primary-color, #4F46E5); }

.security-notice {
  display: flex; align-items: center; gap: 10px; padding: 14px 20px;
  background: var(--primary-glow, rgba(79, 70, 229, 0.04)); border-radius: 18px; margin-bottom: 36px;
}
.notice-emoji { font-size: 14px; }
.notice-txt { font-size: 11px; font-weight: 700; color: #6366F1; flex: 1; line-height: 1.5; }

.action-footer { margin-bottom: 8px; }
.know-btn {
  width: 100%; height: 72px; background: #1E293B; border-radius: 26px;
  display: flex; align-items: center; justify-content: center; border: none;
  box-shadow: 0 15px 35px rgba(30, 41, 59, 0.15);
}
.know-btn:active { transform: scale(0.97); opacity: 0.95; }
.know-txt { color: #fff; font-size: 17px; font-weight: 900; letter-spacing: 0.5px; }

.safe-area-bottom { height: env(safe-area-inset-bottom); margin-top: 10px; }

.animate-drawer-up { animation: drawerUp 0.4s cubic-bezier(0.19, 1, 0.22, 1); }
@keyframes drawerUp { 
  from { transform: translateY(100%); } 
  to { transform: translateY(0); } 
}
</style>