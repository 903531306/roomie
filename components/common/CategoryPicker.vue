<template>
  <view
    v-if="modelValue"
    class="picker-mask"
    :class="[themeClass, { 'mask-fade-out': isClosing }]"
    :style="maskLayerStyle"
    @tap.stop="handleClose"
    @touchmove.stop.prevent
    @wheel.stop.prevent
  >
    <view
      class="picker-panel"
      :class="themeClass"
      :style="panelStyle"
      @tap.stop
    >
      <!-- 【顶部手柄感应区】仅在此区域滑动会触发弹窗关闭 -->
      <view 
        class="drag-handle-zone"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
      >
        <view class="picker-handle"></view>
        <view class="picker-header">
          <view class="header-main">
            <text class="picker-title">{{ title }}</text>
            <text class="picker-subtitle">SELECT CATEGORY</text>
          </view>
          <view class="picker-close" @tap.stop="handleClose">✕</view>
        </view>
      </view>
      
      <!-- 【中部列表区】强制不响应外层手势，高度锁定，内部独立滚动 -->
      <view class="dual-body">
        <!-- 左侧一级导航 -->
        <scroll-view 
          scroll-y 
          class="side-nav" 
          @touchmove.stop
          :show-scrollbar="false"
          enhanced
        >
          <view class="side-nav-inner">
            <view 
              v-for="item in level1Options" 
              :key="item.id" 
              class="side-item"
              :class="{ active: parentCategory === item.label }"
              @tap="onLevel1Click(item)"
            >
              <view v-if="parentCategory === item.label" class="side-active-indicator" :style="{ background: accentColor }"></view>
              <image v-if="isImageUrl(item.icon)" :src="item.icon" mode="aspectFill" class="side-icon-img" />
              <text v-else class="side-emoji">{{ item.icon }}</text>
              <text class="side-label" :class="{ 'active-label': parentCategory === item.label }">{{ item.label }}</text>
            </view>
          </view>
        </scroll-view>

        <!-- 右侧二级内容 -->
        <scroll-view 
          scroll-y 
          class="main-content-list" 
          :scroll-top="scrollTop"
          @touchmove.stop
          :show-scrollbar="false"
          enhanced
        >
          <view class="sub-list-stack" :key="parentCategory">
            <view 
              v-for="(sub, sIdx) in level2Options" 
              :key="sub.id" 
              class="sub-list-item animate-stagger"
              :class="{ 'sub-active': isItemSelected(sub) }"
              :style="{ 
                '--delay': (sIdx * 0.05) + 's',
                'border-color': isItemSelected(sub) ? accentColor : '#F1F5F9'
              }"
              @tap="onLevel2Click(sub)"
            >
              <view class="sub-item-left">
                <view class="sub-icon-circle" :style="{ backgroundColor: isItemSelected(sub) ? accentColor + '1a' : '#F8FAFC' }">
                  <image v-if="isImageUrl(sub.icon)" :src="sub.icon" mode="aspectFill" class="sub-icon-img" />
                  <text v-else class="sub-emoji-mini">{{ sub.icon }}</text>
                </view>
                <text class="sub-label-txt" :class="{ 'sub-label-active': isItemSelected(sub) }">{{ sub.label }}</text>
              </view>
              <view class="sub-right-slot">
                <view v-if="isItemSelected(sub)" class="sub-checkmark-box" :style="{ backgroundColor: accentColor }">
                  <text class="v-icon">✓</text>
                </view>
                <text v-else class="sub-arrow">›</text>
              </view>
            </view>
            
            <view v-if="level2Options.length === 0" class="empty-hint">
              <text>该类目下暂无更多细分</text>
            </view>
          </view>
        </scroll-view>
      </view>
      <view class="safe-area-bottom"></view>
    </view>
  </view>
</template>

<script setup>
import { useAppTheme } from '@/common/themes/useAppTheme.js'
const { themeClass, primaryColor, softColor, theme } = useAppTheme()

import { ref, computed, watch } from 'vue';

const props = defineProps({
  modelValue: Boolean,
  title: { type: String, default: '选择分类' },
  options: { type: Array, default: () => [] },
  transactionType: { type: String, default: 'expense' },
  currentSelected: [String, Number], // 支持 ID (Number) 或名称 (String)
  themeColor: { type: String, default: '' }
});

const emit = defineEmits(['update:modelValue', 'change']);

const accentColor = computed(() => props.themeColor || primaryColor.value);

const parentCategory = ref('');
const scrollTop = ref(0);
const isClosing = ref(false);
const modalTranslateY = ref(0);
const isSwiping = ref(false);
let startY = 0;

const isImageUrl = (val) => {
  if (typeof val !== 'string') return false;
  const v = val.toLowerCase();
  return v.startsWith('http') || v.startsWith('/') || v.startsWith('data:image') || v.includes('.png') || v.includes('.jpg') || v.includes('.jpeg') || v.includes('.webp');
};

const maskOpacity = computed(() => {
  if (!isSwiping.value && !isClosing.value) return 0.4;
  if (isClosing.value) return 0;
  return Math.max(0.1, 0.4 - (modalTranslateY.value / 1000));
});

const maskLayerStyle = computed(() => ({
  backgroundColor: `rgba(15, 23, 42, ${maskOpacity.value})`
}));

const panelStyle = computed(() => ({
  transform: `translateY(${modalTranslateY.value}px)`,
  transition: isSwiping.value ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
}));

// 判断二级项是否被选中（兼容 ID 和 Label 匹配）
const isItemSelected = (sub) => {
  return props.currentSelected === sub.id || props.currentSelected === sub.label;
};

const level1Options = computed(() => {
  return props.options.filter(cat => cat.type === props.transactionType && !cat.parentId);
});

const level2Options = computed(() => {
  if (!parentCategory.value) return [];
  const parent = level1Options.value.find(o => o.label === parentCategory.value);
  if (!parent) return [];
  return props.options.filter(cat => cat.parentId === parent.id);
});

// 核心回显逻辑：当弹窗打开时，根据当前选中的 ID 或名称，寻找并展开其父类
watch(() => props.modelValue, (val) => {
  if (val) {
    modalTranslateY.value = 0;
    isClosing.value = false;
    
    if (props.currentSelected) {
      // 1. 在所有选项中找到当前命中的那个对象（匹配 ID 或 Label）
      const current = props.options.find(o => o.id === props.currentSelected || o.label === props.currentSelected);
      
      if (current) {
        if (current.parentId) {
          // 2. 如果是二级分类，找到其父级对象，并设置左侧边栏的选中态
          const parent = props.options.find(p => p.id === current.parentId);
          if (parent) parentCategory.value = parent.label;
        } else {
          // 3. 如果本身就是一级分类，直接设置
          parentCategory.value = current.label;
        }
      }
    } else if (level1Options.value.length > 0) {
      // 默认选中第一个
      parentCategory.value = level1Options.value[0].label;
    }
  }
});

const onLevel1Click = (item) => {
  if (parentCategory.value === item.label) return;
  parentCategory.value = item.label;
  scrollTop.value = Math.random(); 
};

const onLevel2Click = (item) => {
  // 方法：这里直接把整个 item 对象 emit 出去
  // 父组件通过 @change="handler" 接收，在 handler(item) 里访问 item.id 即可
  emit('change', item);
  handleClose();
};

const handleClose = () => {
  isClosing.value = true;
  modalTranslateY.value = 800; 
  setTimeout(() => {
    emit('update:modelValue', false);
    isClosing.value = false;
    modalTranslateY.value = 0;
  }, 300);
};

const onTouchStart = (e) => { 
  startY = e.touches[0].clientY; 
  isSwiping.value = true; 
};

const onTouchMove = (e) => {
  const currentY = e.touches[0].clientY;
  const diff = currentY - startY;
  if (diff > 0) modalTranslateY.value = diff; 
};

const onTouchEnd = () => {
  isSwiping.value = false;
  if (modalTranslateY.value > 150) handleClose();
  else modalTranslateY.value = 0;
};
</script>

<style scoped>
/* 隐藏所有滚动条 */
::-webkit-scrollbar {
  display: none;
  width: 0 !important;
  height: 0 !important;
  -webkit-appearance: none;
  background: transparent;
}

.picker-mask { position: fixed; inset: 0; backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); z-index: 10000; display: flex; align-items: flex-end; transition: opacity 0.3s; }
.mask-fade-out { opacity: 0; }

.picker-panel { 
  width: 100%; background: #fff; border-radius: 44px 44px 0 0; padding: 0; 
  box-shadow: 0 -20px 60px rgba(0, 0, 0, 0.1); 
  will-change: transform; display: flex; flex-direction: column; 
  max-height: 80vh; overflow: hidden; 
  overscroll-behavior: contain;
}

.drag-handle-zone { padding: 20px 0 0; flex-shrink: 0; cursor: ns-resize; }
.picker-handle { width: 42px; height: 5px; background: #E2E8F0; border-radius: 10px; margin: 0 auto 24px; }
.picker-header { margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; padding: 0 32px; }

.header-main { display: flex; flex-direction: column; }
.picker-title { font-size: 19px; font-weight: 900; color: #1E293B; }
.picker-subtitle { font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-top: 2px; }
.picker-close { width: 36px; height: 36px; background: #F1F5F9; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #64748B; font-size: 14px; font-weight: bold; }

.dual-body { 
  height: 60vh; /* 修复真机滑不动的核心：提供显式的、不依赖于父级 flex 计算的高度 */
  display: flex; 
  overflow: hidden; 
  border-top: 1px solid #F8FAFC; 
}

/* 左侧导航美化 */
.side-nav { width: 100px; background: #F8FAFC; height: 100%; flex-shrink: 0; }
.side-nav-inner { padding: 12px 0; }
.side-item { position: relative; padding: 24px 10px; display: flex; flex-direction: column; align-items: center; gap: 8px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.side-item.active { background: #FFFFFF; }
.side-active-indicator { position: absolute; left: 0; top: 25%; bottom: 25%; width: 5px; border-radius: 0 10px 10px 0; }
.side-emoji { font-size: 24px; transition: transform 0.3s; }
.active .side-emoji { transform: scale(1.1); }
.side-icon-img { width: 28px; height: 28px; border-radius: 8px; transition: transform 0.3s; }
.active .side-icon-img { transform: scale(1.1); }
.side-label { font-size: 12px; font-weight: 700; color: #94A3B8; text-align: center; }
.active-label { color: #1E293B !important; font-weight: 900; }

/* 右侧列表美化 */
.main-content-list { flex: 1; background: #fff; height: 100%; }
.sub-list-stack { display: flex; flex-direction: column; padding: 16px 18px 60px; }
.sub-list-item { 
  height: 76px; display: flex; align-items: center; justify-content: space-between; 
  padding: 0 20px; margin-bottom: 14px; border-radius: 26px; 
  background: #fff; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); 
  border: 1.5px solid #F1F5F9; 
  box-shadow: 0 4px 10px rgba(0,0,0,0.01); 
}
.sub-list-item:active { transform: scale(0.97); background: #F8FAFC; }
/* 选中态：更现代的视觉效果 */
.sub-active { 
  background: #FFFFFF !important; 
  box-shadow: 0 12px 24px rgba(0,0,0,0.04) !important; 
  transform: translateY(-2px); 
}

.sub-item-left { display: flex; align-items: center; gap: 16px; }
.sub-icon-circle { width: 46px; height: 46px; border-radius: 18px; display: flex; align-items: center; justify-content: center; border: 2.5px solid #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.03); overflow: hidden; }
.sub-emoji-mini { font-size: 22px; }
.sub-icon-img { width: 30px; height: 30px; border-radius: 10px; }
.sub-label-txt { font-size: 15px; font-weight: 800; color: #475569; }
.sub-label-active { color: #1E293B !important; font-weight: 900; }

.sub-right-slot { display: flex; align-items: center; }
.sub-checkmark-box { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 12px rgba(0,0,0,0.08); }
.v-icon { color: #fff; font-size: 12px; font-weight: bold; }
.sub-arrow { font-size: 22px; color: #E2E8F0; font-weight: 300; }

.empty-hint { padding: 80px 0; text-align: center; color: #CBD5E1; font-size: 13px; font-weight: 600; }

.animate-stagger { opacity: 0; transform: translateY(15px); animation: slideUp 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; animation-delay: var(--delay); }
@keyframes slideUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
</style>