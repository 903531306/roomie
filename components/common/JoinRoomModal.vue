<template>
  <view 
    v-if="modelValue" 
    class="join-mask" 
    :class="[themeClass, { 'mask-closing': isClosing }]"
    @click="handleCancel"
    @touchmove.stop.prevent
  >
    <view 
      class="join-panel animate-slide-up" 
      :class="{ 'panel-closing': isClosing }"
      :style="{ 
        transform: `translateY(${panelY}px)`, 
        transition: isSwiping ? 'none' : 'transform 0.4s cubic-bezier(0.19, 1, 0.22, 1)' 
      }"
      @click.stop
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    >
      <!-- 顶部手柄：增加可感知度 -->
      <view class="panel-handle"></view>

      <view class="join-header">
        <view class="header-main">
          <view class="room-icon-tag">{{ roomIcon }}</view>
          <view class="title-area">
            <text class="invite-label">收到一个新的加入邀请</text>
            <text class="room-name">{{ roomName }}</text>
          </view>
        </view>
      </view>

      <view class="join-body">
        <text class="description-text">
          你的家人邀请你加入此协作空间。加入后，你可以查看共享账本、管理清单任务并同步家庭日程。
        </text>

        <!-- 极简预览条：横向呼吸感布局 -->
        <view class="preview-strip">
          <view class="preview-item">
            <text class="p-label">当前成员</text>
            <view class="p-content">
              <view class="avatar-group">
                <image v-for="i in 3" :key="i" :src="`https://i.pravatar.cc/100?u=join${i}`" class="mini-avt" />
                <view class="avt-plus">+2</view>
              </view>
            </view>
          </view>
          
          <view class="v-divider"></view>

          <view class="preview-item">
            <text class="p-label">包含模块</text>
            <view class="p-content">
              <text class="feat-icons">💰 📝 📅</text>
              <text class="feat-more">等3项</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 全扁平化操作区 -->
      <view class="join-footer">
        <button class="btn-cancel" @click="handleCancel">
          <text class="btn-cancel-txt">暂时忽略</text>
        </button>
        <button class="btn-confirm" @click="handleJoin">
          <text class="btn-confirm-txt">接受并加入</text>
        </button>
      </view>
      
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
  roomName: { type: String, default: '我们的家' },
  roomId: { type: String, default: '' },
  roomIcon: { type: String, default: '🏠' }
});

const emit = defineEmits(['update:modelValue', 'join']);

const isClosing = ref(false);
const isSwiping = ref(false);
const panelY = ref(0);
let startY = 0;

// 监听打开状态，重置交互值
watch(() => props.modelValue, (val) => {
  if (val) {
    panelY.value = 0;
    isClosing.value = false;
  }
});

const handleJoin = () => {
  uni.showLoading({ title: '正在加入...' });
  setTimeout(() => {
    uni.hideLoading();
    uni.showToast({ title: '欢迎加入', icon: 'success' });
    closeWithAnim();
    setTimeout(() => {
      uni.navigateTo({ url: `/pages/dashboard/dashboard?id=${props.roomId}&name=${props.roomName}` });
    }, 300);
  }, 800);
};

const handleCancel = () => {
  closeWithAnim();
};

const closeWithAnim = () => {
  isClosing.value = true;
  panelY.value = 800;
  setTimeout(() => {
    emit('update:modelValue', false);
    isClosing.value = false;
  }, 300);
};

/* --- 滑动关闭逻辑 --- */
const onTouchStart = (e) => {
  startY = e.touches[0].clientY;
  isSwiping.value = true;
};

const onTouchMove = (e) => {
  const currentY = e.touches[0].clientY;
  const diff = currentY - startY;
  // 仅允许向下拖动
  if (diff > 0) {
    panelY.value = diff;
  }
};

const onTouchEnd = () => {
  isSwiping.value = false;
  // 下滑超过 150px 则关闭，否则回弹
  if (panelY.value > 150) {
    handleCancel();
  } else {
    panelY.value = 0;
  }
};
</script>

<style scoped>
.join-mask {
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  z-index: 9999; display: flex; align-items: flex-end;
  transition: opacity 0.3s;
}
.mask-closing { opacity: 0; }

.join-panel {
  width: 100%; background: #fff; border-radius: 44px 44px 0 0; padding: 20px 24px;
  box-shadow: 0 -20px 60px rgba(0, 0, 0, 0.1);
  will-change: transform;
}

.panel-handle { 
  width: 42px; height: 5px; background: #E2E8F0; border-radius: 10px; 
  margin: 0 auto 32px; 
}

.join-header { margin-bottom: 24px; }
.header-main { display: flex; align-items: center; gap: 18px; }
.room-icon-tag { 
  width: 64px; height: 64px; background: #F8FAFC; border-radius: 20px; 
  display: flex; align-items: center; justify-content: center; font-size: 32px;
  border: 1px solid #F1F5F9;
}
.title-area { display: flex; flex-direction: column; gap: 4px; }
.invite-label { font-size: 11px; font-weight: 900; color: #94A3B8; text-transform: uppercase; letter-spacing: 1.5px; }
.room-name { font-size: 22px; font-weight: 900; color: #1E293B; letter-spacing: -0.5px; }

.join-body { margin-bottom: 36px; }
.description-text { 
  font-size: 15px; font-weight: 600; color: #64748B; 
  line-height: 1.6; margin-bottom: 28px; display: block; 
}

/* 预览条：更通透的设计 */
.preview-strip { 
  background: #F8FAFC; border-radius: 28px; padding: 18px 24px; 
  display: flex; align-items: center; justify-content: space-between;
  border: 1px solid #F1F5F9;
}
.preview-item { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.p-label { font-size: 10px; font-weight: 900; color: #CBD5E1; text-transform: uppercase; letter-spacing: 1px; }
.p-content { display: flex; align-items: center; gap: 10px; }

.v-divider { width: 1px; height: 36px; background: #E2E8F0; margin: 0 24px; }

.avatar-group { display: flex; align-items: center; }
.mini-avt { width: 28px; height: 28px; border-radius: 50%; border: 3px solid #fff; margin-right: -10px; background: #eee; }
.avt-plus { 
  font-size: 10px; font-weight: 900; color: #94A3B8; margin-left: 14px;
}

.feat-icons { font-size: 16px; }
.feat-more { font-size: 12px; font-weight: 800; color: #64748B; }

/* 扁平化按钮组 */
.join-footer { display: flex; gap: 14px; margin-bottom: 10px; }
.btn-confirm { 
  flex: 2; height: 64px; background: var(--primary-color, #4F46E5); border-radius: 22px; 
  display: flex; align-items: center; justify-content: center; border: none;
  box-shadow: 0 10px 25px var(--primary-glow, rgba(79, 70, 229, 0.2));
}
.btn-confirm:active { transform: scale(0.96); opacity: 0.9; }
.btn-confirm-txt { color: #fff; font-size: 16px; font-weight: 900; }

.btn-cancel { 
  flex: 1; height: 64px; background: #F8FAFC; border-radius: 22px; 
  display: flex; align-items: center; justify-content: center; border: none;
}
.btn-cancel:active { background: #F1F5F9; transform: scale(0.96); }
.btn-cancel-txt { color: #94A3B8; font-size: 16px; font-weight: 800; }

.safe-area-bottom { height: env(safe-area-inset-bottom); margin-top: 12px; }

/* 动画效果：参考 BottomPicker */
.animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.19, 1, 0.22, 1); }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
</style>