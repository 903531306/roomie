<template>
  <view 
    v-if="modelValue" 
    class="modal-mask" 
    :class="[themeClass, { 'mask-closing': isClosing }]"
    @tap.stop="handleClose"
    @touchmove.stop.prevent
  >
    <view 
      class="modal-panel animate-slide-up" 
      :class="{ 'panel-closing': isClosing }"
      :style="{ 
        transform: `translateY(${panelY}px)`, 
        transition: isSwiping ? 'none' : 'transform 0.4s cubic-bezier(0.19, 1, 0.22, 1)' 
      }"
      @tap.stop
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    >
      <!-- 顶部手柄 -->
      <view class="modal-handle"></view>
      
      <!-- 头部布局：对齐 JoinModal -->
      <view class="invite-header">
        <view class="header-main">
          <view class="room-icon-tag" :style="{ background: themeColorOpacity }">
            <text class="room-emoji">{{ roomIcon }}</text>
          </view>
          <view class="title-area">
            <text class="invite-label">邀请家人共同管理</text>
            <text class="room-name">{{ roomName }}</text>
          </view>
        </view>
      </view>

      <view class="invite-body">
        <text class="description-text">
          将此空间分享给家人，他们点击链接即可直接进入，实时同步账本数据、清单任务与家庭日程。
        </text>

        <!-- 引导条：对齐 JoinModal 的 preview-strip -->
        <view class="guide-strip">
          <view class="guide-item">
            <text class="g-label">第一步</text>
            <view class="g-content">
              <text class="g-txt">发送微信邀请</text>
            </view>
          </view>
          
          <view class="v-divider"></view>

          <view class="guide-item">
            <text class="g-label">第二步</text>
            <view class="g-content">
              <text class="g-txt">对方点击加入</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 全扁平化操作按钮：2:1 比例 -->
      <view class="modal-footer">
        <button class="btn-secondary" @click="handleClose">
          <text class="btn-secondary-txt">取消</text>
        </button>
        <button class="btn-primary" open-type="share" @shareappmessage="handleShareAppMessage">
          <text class="btn-primary-txt">发送微信邀请</text>
        </button>
      </view>
      
      <view class="safe-area-bottom"></view>
    </view>
  </view>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useAppTheme } from '@/common/themes/useAppTheme.js';

const { themeClass, primaryColor } = useAppTheme();


const props = defineProps({
  modelValue: Boolean,
  roomName: String,
  inviteCode:String,
  roomIcon: { type: String, default: '🏠' },
  roomId: { type: String, default: 'FL8892' },
  themeColor: { type: String, default: '' }
});

const emit = defineEmits(['update:modelValue', 'share']);

const accentColor = computed(() => props.themeColor || primaryColor.value);

// 处理分享事件 - 将 inviteCode 传递给父组件
const handleShareAppMessage = (res) => {
  console.log('[InviteModal] 分享来源:', res.from);
  // 将 inviteCode 通过事件传递给父组件处理
  emit('share', {
    from: res.from,
    inviteCode: props.inviteCode,
    roomId: props.roomId,
    roomName: props.roomName,
    roomIcon: props.roomIcon
  });
  
  // 返回分享内容
  return {
    title: `${props.roomName} 邀请你加入`,
    path: `/pages/index/index?roomInviteCode=${props.inviteCode}`,
    imageUrl: '/static/share-imag.png'
  };
}

// 计算属性：弱化背景色
const themeColorOpacity = computed(() => `${accentColor.value}1a`);

// 手势交互状态
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

/* --- 滑动关闭逻辑 --- */
const onTouchStart = (e) => {
  startY = e.touches[0].clientY;
  isSwiping.value = true;
};

const onTouchMove = (e) => {
  const currentY = e.touches[0].clientY;
  const diff = currentY - startY;
  if (diff > 0) {
    panelY.value = diff;
  }
};

const onTouchEnd = () => {
  isSwiping.value = false;
  if (panelY.value > 150) {
    handleClose();
  } else {
    panelY.value = 0;
  }
};

const handleClose = () => {
  isClosing.value = true;
  panelY.value = 800; // 模拟下滑消失
  setTimeout(() => {
    emit('update:modelValue', false);
    isClosing.value = false;
  }, 300);
};

const handleShare = () => {
  const sharePath = `pages/dashboard/dashboard?id=${props.roomId}&name=${props.roomName}`;
  uni.showLoading({ title: '正在处理...' });
  
  setTimeout(() => {
    uni.hideLoading();
    uni.showToast({ title: '已生成分享链接', icon: 'success' });
    emit('share', { path: sharePath });
    handleClose();
  }, 600);
};
</script>

<style scoped>
.modal-mask {
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  z-index: 10050; display: flex; align-items: flex-end;
  transition: opacity 0.3s;
}
.mask-closing { opacity: 0; }

.modal-panel {
  width: 100%; background: #fff; border-radius: 44px 44px 0 0; padding: 20px 24px;
  box-shadow: 0 -20px 60px rgba(0, 0, 0, 0.1);
  will-change: transform;
}

.modal-handle { 
  width: 42px; height: 5px; background: #E2E8F0; border-radius: 10px; 
  margin: 0 auto 32px; 
}

.invite-header { margin-bottom: 24px; }
.header-main { display: flex; align-items: center; gap: 18px; }
.room-icon-tag { 
  width: 64px; height: 64px; border-radius: 20px; 
  display: flex; align-items: center; justify-content: center; font-size: 32px;
  border: 1px solid #F1F5F9;
}
.title-area { display: flex; flex-direction: column; gap: 4px; }
.invite-label { font-size: 11px; font-weight: 900; color: #94A3B8; text-transform: uppercase; letter-spacing: 1.5px; }
.room-name { font-size: 22px; font-weight: 900; color: #1E293B; letter-spacing: -0.5px; }

.invite-body { margin-bottom: 36px; }
.description-text { 
  font-size: 15px; font-weight: 600; color: #64748B; 
  line-height: 1.6; margin-bottom: 28px; display: block; 
}

/* 引导条：完全同步 JoinModal 的 preview-strip 样式 */
.guide-strip { 
  background: #F8FAFC; border-radius: 28px; padding: 18px 24px; 
  display: flex; align-items: center; justify-content: space-between;
  border: 1px solid #F1F5F9;
}
.guide-item { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.g-label { font-size: 10px; font-weight: 900; color: #CBD5E1; text-transform: uppercase; letter-spacing: 1px; }
.g-content { display: flex; align-items: center; gap: 10px; }
.g-txt { font-size: 13px; font-weight: 800; color: #475569; }

.v-divider { width: 1px; height: 36px; background: #E2E8F0; margin: 0 24px; }

/* 扁平化操作按钮：2:1 比例 */
.modal-footer { display: flex; gap: 14px; margin-bottom: 10px; }

.btn-primary { 
  flex: 2; height: 60px; background: var(--primary-color, #4F46E5); border-radius: 22px; 
  display: flex; align-items: center; justify-content: center; border: none;
  box-shadow: 0 10px 25px var(--primary-glow, rgba(79, 70, 229, 0.2));
}
.btn-primary:active { transform: scale(0.96); opacity: 0.9; }
.btn-primary-txt { color: #fff; font-size: 16px; font-weight: 900; }

.btn-secondary { 
	  border: none;          /* 去边框 */
	  outline: none;         /* 去焦点框 */
  flex: 1; height: 64px; background: #F8FAFC; border-radius: 22px; 
  display: flex; align-items: center; justify-content: center; border: none;
}
/* 🔥 关键在这 */
.btn-secondary::after {
  border: none;
}
.btn-secondary:active { background: #F1F5F9; transform: scale(0.96); }
.btn-secondary-txt { color: #94A3B8; font-size: 16px; font-weight: 800; }

.safe-area-bottom { height: env(safe-area-inset-bottom); margin-top: 12px; }

/* 动画效果：参考 BottomPicker */
.animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.19, 1, 0.22, 1); }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
</style>