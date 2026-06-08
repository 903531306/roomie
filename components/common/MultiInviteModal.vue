
<template>
  <view
    v-if="modelValue && invitations.length > 0"
    class="invite-mask"
    :class="[themeClass, { 'mask-closing': isClosing }]"
    @click="handleSimpleClose"
    @touchmove.stop.prevent
  >
    <view 
      class="invite-panel animate-panel-up" 
      :style="{ 
        transform: `translateY(${panelY}px)`, 
        transition: isSwiping ? 'none' : 'transform 0.4s cubic-bezier(0.19, 1, 0.22, 1)' 
      }"
      @click.stop
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    >
      <view class="panel-handle"></view>

      <view class="invite-header">
        <view class="header-main-group">
          <view class="title-group">
            <text class="main-title">新成员邀请</text>
            <text class="count-tag">{{ invitations.length }}</text>
          </view>
          <text class="ignore-all-text" @click="handleIgnoreAll">全部忽略</text>
        </view>
        
        <!-- 新增：右上角关闭按钮 -->
        <view class="close-btn-circle" @click="handleSimpleClose">
          <text class="close-icon-x">✕</text>
        </view>
      </view>

      <scroll-view 
        scroll-y 
        class="invite-list-scroll" 
        :show-scrollbar="false"
      >
        <view class="rows-container">
          <view 
            v-for="(invite, index) in invitations" 
            :key="invite.roomId"
            class="invite-row-wrapper"
            :class="{ 'leaving': leavingId === invite.roomId }"
          >
            <view class="invite-row">
              <view class="row-left">
                <view class="room-symbol">{{ invite.roomIcon || '🏠' }}</view>
                <view class="row-meta">
                  <text class="row-room-name">{{ invite.roomName }}</text>
                  <text class="row-inviter-txt">{{ invite.inviterName }} 邀请您</text>
                </view>
              </view>
              <view class="row-actions">
                <view class="btn-sm reject" @click="handleReject(invite)">拒绝</view>
                <view class="btn-sm join" @click="handleJoin(invite)">加入</view>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>

      <!-- 全选操作区 -->
      <view class="footer-sticky-action">
        <button class="accept-all-btn" @click="handleAcceptAll">
          <text class="btn-main-txt">接受所有邀请</text>
          <view class="btn-light-sweep"></view>
        </button>
      </view>
       <text class="btn-sub-txt">开启家庭协作之旅</text>
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
  invitations: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:modelValue', 'onJoin', 'onReject', 'onJoinAll', 'onIgnoreAll']);

const isClosing = ref(false);
const isSwiping = ref(false);
const panelY = ref(0);
const leavingId = ref(null);
let startY = 0;

watch(() => props.modelValue, (val) => {
  if (val) {
    panelY.value = 0;
    isClosing.value = false;
    leavingId.value = null;
  }
});

const handleJoin = (invite) => {
  leavingId.value = invite.roomId;
  setTimeout(() => {
    emit('onJoin', invite);
    leavingId.value = null;
  }, 300);
};

const handleReject = (invite) => {
  leavingId.value = invite.roomId;
  setTimeout(() => {
    emit('onReject', invite);
    leavingId.value = null;
  }, 300);
};

const handleAcceptAll = () => {
  uni.vibrateShort({ type: 'medium' });
  emit('onJoinAll');
};

const handleIgnoreAll = () => {
  isClosing.value = true;
  panelY.value = 800;
  setTimeout(() => {
    emit('onIgnoreAll');
    emit('update:modelValue', false);
    isClosing.value = false;
  }, 300);
};

// 仅关闭，不处理业务逻辑
const handleSimpleClose = () => {
  isClosing.value = true;
  panelY.value = 800;
  setTimeout(() => {
    emit('update:modelValue', false);
    isClosing.value = false;
  }, 300);
};

const onTouchStart = (e) => { startY = e.touches[0].clientY; isSwiping.value = true; };
const onTouchMove = (e) => {
  const currentY = e.touches[0].clientY;
  const diff = currentY - startY;
  if (diff > 0) panelY.value = diff;
};
const onTouchEnd = () => {
  isSwiping.value = false;
  if (panelY.value > 150) handleSimpleClose();
  else panelY.value = 0;
};
</script>

<style scoped>
.invite-mask {
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px);
  z-index: 10000; display: flex; align-items: flex-end; transition: opacity 0.4s;
}
.mask-closing { opacity: 0; }

.invite-panel {
  width: 100%; background: #FFFFFF; border-radius: 48px 48px 0 0; padding-top: 12px;
  box-shadow: 0 -20px 60px rgba(0, 0, 0, 0.1); will-change: transform;
}

.panel-handle { width: 40px; height: 5px; background: #F1F5F9; border-radius: 10px; margin: 0 auto 30px; }

.invite-header { display: flex; justify-content: space-between; align-items: center; padding: 0 32px; margin-bottom: 24px; }
.header-main-group { flex: 1; display: flex; align-items: baseline; gap: 16px; }

.title-group { display: flex; align-items: center; gap: 10px; }
.main-title { font-size: 20px; font-weight: 900; color: #1E293B; letter-spacing: -0.5px; }
.count-tag { background: var(--primary-soft, #EEF2FF); color: var(--primary-color, #4F46E5); font-size: 11px; font-weight: 900; padding: 2px 8px; border-radius: 6px; }
.ignore-all-text { font-size: 13px; font-weight: 800; color: #94A3B8; }

.close-btn-circle {
  width: 40px; height: 40px; background: #F1F5F9; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.close-btn-circle:active { transform: scale(0.85); background: #E2E8F0; }
.close-icon-x { font-size: 14px; color: #94A3B8; font-weight: bold; }

.invite-list-scroll { max-height: 45vh; }
.rows-container { padding: 0 20px 20px; display: flex; flex-direction: column; gap: 8px; }

.invite-row-wrapper { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); will-change: transform, opacity, max-height; }
.invite-row-wrapper.leaving { opacity: 0; transform: translateX(-20px); max-height: 0; margin-bottom: -8px; pointer-events: none; }

.invite-row {
  height: 84px; background: #F8FAFC; border-radius: 24px; padding: 0 20px;
  display: flex; align-items: center; justify-content: space-between;
}

.row-left { display: flex; align-items: center; gap: 16px; flex: 1; min-width: 0; }
.room-symbol { 
  width: 48px; height: 48px; background: #fff; border-radius: 16px;
  display: flex; align-items: center; justify-content: center; font-size: 24px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.02);
}
.row-meta { display: flex; flex-direction: column; min-width: 0; }
.row-room-name { font-size: 16px; font-weight: 900; color: #1E293B; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.row-inviter-txt { font-size: 11px; font-weight: 700; color: #94A3B8; margin-top: 2px; }

.row-actions { display: flex; align-items: center; gap: 8px; }
.btn-sm { 
  height: 30px; padding: 0 10px; border-radius: 12px; 
  display: flex; align-items: center; justify-content: center; 
  font-size: 13px; font-weight: 800; transition: all 0.2s;
}
.btn-sm.join { background: #1E293B; color: #fff; }
.btn-sm.join:active { transform: scale(0.94); opacity: 0.9; }
.btn-sm.reject { background: #fff; color: #94A3B8; border: 1px solid #F1F5F9; }

.footer-sticky-action { padding: 12px 24px; background: #fff; }
.accept-all-btn {
  height: 60px; background: var(--primary-color, #4F46E5); border-radius: 28px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  border: none; box-shadow: 0 20px 40px var(--primary-glow, rgba(79, 70, 229, 0.25));
  position: relative; overflow: hidden;
}
.accept-all-btn:active { transform: scale(0.97); }

.btn-main-txt { color: #fff; font-size: 17px; font-weight: 900; z-index: 2; }
.btn-sub-txt {margin-bottom: 20px;display: flex;justify-content: center; color: black; font-size: 11px; font-weight: 700; margin-top: 2px; z-index: 2; }

.btn-light-sweep {
  position: absolute; top: 0; left: -100%; width: 50%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  transform: skewX(-25deg);
  animation: sweep 4s infinite linear;
}
@keyframes sweep { 0% { left: -100%; } 20% { left: 200%; } 100% { left: 200%; } }

.safe-area-bottom { height: env(safe-area-inset-bottom); margin-top: 10px; }

.animate-panel-up { animation: panelUp 0.6s cubic-bezier(0.19, 1, 0.22, 1); }
@keyframes panelUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
</style>
