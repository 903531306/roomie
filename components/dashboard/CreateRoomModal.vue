
<template>
  <view 
    v-if="modelValue" 
    class="modal-mask" 
    :class="[themeClass, { 'mask-closing': isClosing }]"
    @click="handleClose"
  >
    <view 
      class="modal-panel animate-slide-up" 
      :style="{ transform: `translateY(${panelY}px)`, transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.19, 1, 0.22, 1)' }"
      @click.stop
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    >
      <view class="modal-handle"></view>
      
      <!-- 头部标题与进度 -->
      <view class="modal-header">
        <view class="header-left">
          <text class="step-indicator">STEP {{ currentStep }}/2</text>
          <text class="main-title">{{ currentStep === 1 ? '基础信息' : '配置功能模块' }}</text>
        </view>
        <view class="close-btn" @click="handleClose">✕</view>
      </view>

      <!-- 步骤切换容器 -->
      <view class="steps-container">
        <view class="steps-wrapper" :style="{ transform: `translateX(${(currentStep - 1) * -100}%)` }">
          
          <!-- 第一步：名称 + 类型 -->
          <view class="step-page">
            <!-- 房间名称输入 -->
            <view class="input-section">
              <text class="section-label">给空间起个名字</text>
              <view class="room-name-input-box">
                <input 
                  v-model="form.name" 
                  class="room-name-input" 
                  placeholder="例如：温馨小窝、幸福一家人" 
                  maxlength="12"
                  focus
                />
                <view v-if="form.name" class="clear-input" @click="form.name = ''">✕</view>
              </view>
            </view>

            <text class="section-label">所属类型</text>
            <view class="type-grid">
              <view 
                v-for="item in roomTypes" 
                :key="item.id"
                class="type-card"
                :class="{ 'type-active': form.type === item.id }"
                @click="form.type = item.id"
              >
                <view class="type-icon-box" :style="{ background: item.color }">
                  <text class="type-emoji">{{ item.icon }}</text>
                </view>
                <text class="type-label">{{ item.name }}</text>
                <view v-if="form.type === item.id" class="active-dot"></view>
              </view>
            </view>
          </view>

          <!-- 第二步：配置功能 -->
          <view class="step-page">
            <text class="section-label">这个空间需要开启哪些功能？</text>
            <view class="feature-list">
              <view 
                v-for="feat in featureOptions" 
                :key="feat.id"
                class="feature-row"
                :class="{ 'feat-active': form.features.includes(feat.id) }"
                @click="toggleFeature(feat.id)"
              >
                <view class="feat-left">
                  <view class="feat-icon-box" :style="{ background: feat.color }">
                    <text class="feat-emoji">{{ feat.icon }}</text>
                  </view>
                  <view class="feat-info">
                    <text class="feat-name">{{ feat.name }}</text>
                    <text class="feat-sub">{{ feat.desc }}</text>
                  </view>
                </view>
                <view class="feat-check">
                  <view class="check-circle" :class="{ 'checked': form.features.includes(feat.id) }">
                    <text v-if="form.features.includes(feat.id)" class="check-v">✓</text>
                  </view>
                </view>
              </view>
            </view>
          </view>

        </view>
      </view>

      <!-- 底部操作栏 -->
      <view class="modal-footer">
        <view v-if="currentStep === 2" class="back-btn" @click="currentStep = 1">上一步</view>
        <button class="primary-btn" @click="handleNext">
          <text class="btn-txt">{{ currentStep === 1 ? '继续设置功能' : '完成并创建' }}</text>
        </button>
      </view>
      
      <view class="safe-area-bottom"></view>
    </view>
  </view>
</template>

<script setup>
import { useAppTheme } from '@/common/themes/useAppTheme.js'
const { themeClass, primaryColor, softColor, theme } = useAppTheme()

import { ref, reactive, watch } from 'vue';

const props = defineProps({
  modelValue: Boolean
});
const emit = defineEmits(['update:modelValue', 'confirm']);

const currentStep = ref(1);
const panelY = ref(0);
const isSwiping = ref(false);
const isClosing = ref(false);
let startY = 0;

const form = reactive({
  name: '',
  type: 'family',
  features: ['ledger', 'checklist', 'schedule']
});

const roomTypes = [
  { id: 'family', name: '家庭空间', icon: '🏠', color: 'linear-gradient(135deg, var(--primary-soft, #EEF2FF), #E0E7FF)' },
  { id: 'couple', name: '情侣二人', icon: '❤️', color: 'linear-gradient(135deg, #FFF1F2, #FFE4E6)' },
  { id: 'roommate', name: '合租生活', icon: '🏘️', color: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)' },
  { id: 'custom', name: '自定义', icon: '✨', color: 'linear-gradient(135deg, #F8FAFC, #F1F5F9)' },
];

const featureOptions = [
  { id: 'ledger', name: '共享账本', desc: '全家开支一目了然', icon: '🏦', color: 'var(--primary-soft, #EEF2FF)' },
  { id: 'checklist', name: '协作清单', desc: '买菜、打扫不遗漏', icon: '📝', color: '#ECFDF5' },
  { id: 'schedule', name: '家庭日程', desc: '预约、出游不错过', icon: '📅', color: '#FFF7ED' },
  { id: 'combo', name: '组合视图', desc: '多维度聚合看板', icon: '🧩', color: '#F5F3FF' },
];

watch(() => props.modelValue, (val) => {
  if (val) {
    currentStep.value = 1;
    panelY.value = 0;
    isClosing.value = false;
    form.name = '';
    form.type = 'family';
  }
});

const handleClose = () => {
  isClosing.value = true;
  panelY.value = 800;
  setTimeout(() => {
    emit('update:modelValue', false);
    isClosing.value = false;
  }, 300);
};

const toggleFeature = (id) => {
  const idx = form.features.indexOf(id);
  if (idx > -1) form.features.splice(idx, 1);
  else form.features.push(id);
};

const handleNext = () => {
  if (currentStep.value === 1) {
    if (!form.name.trim()) {
      uni.showToast({ title: '请输入房间名称', icon: 'none' });
      return;
    }
    currentStep.value = 2;
  } else {
    emit('confirm', { ...form });
    handleClose();
  }
};

const onTouchStart = (e) => { startY = e.touches[0].clientY; isSwiping.value = true; };
const onTouchMove = (e) => {
  const diff = e.touches[0].clientY - startY;
  if (diff > 0) panelY.value = diff;
};
const onTouchEnd = () => {
  isSwiping.value = false;
  if (panelY.value > 150) handleClose();
  else panelY.value = 0;
};
</script>

<style scoped>
.modal-mask {
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(20px); z-index: 5000; display: flex; align-items: flex-end;
  transition: opacity 0.3s;
}
.mask-closing { opacity: 0; }

.modal-panel {
  width: 100%; background: #fff; border-radius: 44px 44px 0 0; padding: 20px 24px;
  box-shadow: 0 -20px 60px rgba(0, 0, 0, 0.1); will-change: transform;
}
.modal-handle { width: 42px; height: 5px; background: #F1F5F9; border-radius: 10px; margin: 0 auto 24px; }

.modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.step-indicator { font-size: 10px; font-weight: 900; color: var(--primary-color, #4F46E5); background: var(--primary-soft, #EEF2FF); padding: 2px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 1px; }
.main-title { font-size: 20px; font-weight: 900; color: #1E293B; display: block; margin-top: 8px; }
.close-btn { width: 36px; height: 36px; background: #F8FAFC; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #CBD5E1; font-weight: bold; }

.steps-container { width: 100%; overflow: hidden; }
.steps-wrapper { display: flex; width: 200%; transition: transform 0.4s cubic-bezier(0.19, 1, 0.22, 1); }
.step-page { width: 50%; padding-bottom: 20px; }

.section-label { font-size: 12px; font-weight: 900; color: #CBD5E1; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 16px; display: block; }

/* 第一步：名称输入样式 */
.input-section { margin-bottom: 32px; }
.room-name-input-box { 
  background: #F8FAFC; border-radius: 24px; padding: 0 24px; height: 72px; 
  display: flex; align-items: center; border: 2px solid #F1F5F9; transition: all 0.2s;
}
.room-name-input { flex: 1; font-size: 20px; font-weight: 800; color: #1E293B; }
.clear-input { 
  width: 24px; height: 24px; background: #E2E8F0; border-radius: 50%; 
  display: flex; align-items: center; justify-content: center; font-size: 10px; color: #fff;
}

/* 第一步：类型网格 */
.type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.type-card {
  height: 120px; border-radius: 24px; background: #F8FAFC; display: flex; flex-direction: column; 
  align-items: center; justify-content: center; border: 2.5px solid transparent; transition: all 0.2s; position: relative;
}
.type-icon-box { width: 48px; height: 48px; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; }
.type-emoji { font-size: 24px; }
.type-label { font-size: 14px; font-weight: 800; color: #64748B; }
.type-active { border-color: var(--primary-color, #4F46E5); background: #fff; transform: scale(1.02); box-shadow: 0 10px 20px var(--primary-glow, rgba(79, 70, 229, 0.05)); }
.type-active .type-label { color: var(--primary-color, #4F46E5); }
.active-dot { position: absolute; top: 12px; right: 12px; width: 8px; height: 8px; background: var(--primary-color, #4F46E5); border-radius: 50%; }

/* 第二步：功能列表 */
.feature-list { display: flex; flex-direction: column; gap: 12px; }
.feature-row {
  background: #F8FAFC; padding: 18px 20px; border-radius: 24px; display: flex; 
  justify-content: space-between; align-items: center; border: 2.5px solid transparent; transition: all 0.2s;
}
.feat-left { display: flex; align-items: center; gap: 16px; }
.feat-icon-box { width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
.feat-info { display: flex; flex-direction: column; }
.feat-name { font-size: 15px; font-weight: 800; color: #1E293B; }
.feat-sub { font-size: 11px; font-weight: 700; color: #94A3B8; margin-top: 1px; }
.check-circle { width: 22px; height: 22px; border: 2px solid #E2E8F0; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.check-circle.checked { background: var(--primary-color, #4F46E5); border-color: var(--primary-color, #4F46E5); }
.check-v { color: #fff; font-size: 11px; font-weight: bold; }
.feat-active { background: #fff; border-color: var(--primary-color, #4F46E5); }

/* 底部操作 */
.modal-footer { margin-top: 32px; display: flex; gap: 12px; align-items: center; }
.back-btn { font-size: 14px; font-weight: 800; color: #94A3B8; padding: 0 16px; }
.primary-btn { flex: 1; height: 64px; background: var(--primary-color, #4F46E5); border-radius: 22px; display: flex; align-items: center; justify-content: center; border: none; box-shadow: 0 10px 25px var(--primary-glow, rgba(79, 70, 229, 0.2)); }
.primary-btn:active { transform: scale(0.96); }
.btn-txt { font-size: 16px; font-weight: 900; color: #fff; }

.safe-area-bottom { height: env(safe-area-inset-bottom); margin-top: 10px; }

.animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.19, 1, 0.22, 1); }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
</style>
