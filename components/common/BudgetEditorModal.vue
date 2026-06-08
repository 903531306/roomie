<template>
  <GlobalDrawer 
    :model-value="modelValue" 
    title="修改预算额度" 
    subtitle=""
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <!-- 主体输入区 -->
    <view :class="themeClass" class="budget-input-content">
      <view class="amount-field-wrap">
        <text class="currency-label">¥</text>
        <input 
          v-model="tempBudget" 
          type="digit" 
          class="main-budget-input" 
          placeholder="0.00" 
          :focus="true"
          placeholder-style="color: #E2E8F0"
        />
      </view>
      <view class="input-focus-line"></view>
      
      <view class="helper-text-row">
        <text class="helper-info">当前已用 ¥{{ currentExpense.toFixed(2) }}</text>
        <text class="helper-hint">建议根据月均收入设定</text>
      </view>
    </view>

    <!-- 底部操作区 -->
    <template #footer>
      <button class="confirm-save-btn" @click="handleSave">
        <text class="btn-txt">保存预算设置</text>
      </button>
    </template>
  </GlobalDrawer>
</template>

<script setup>
import { useAppTheme } from '@/common/themes/useAppTheme.js'
const { themeClass, primaryColor, softColor, theme } = useAppTheme()

import { ref, watch } from 'vue';
import GlobalDrawer from './GlobalDrawer.vue';

const props = defineProps({
  modelValue: Boolean,
  initialBudget: [Number, String],
  currentExpense: { type: Number, default: 0 }
});

const emit = defineEmits(['update:modelValue', 'confirm']);

const tempBudget = ref('');

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    tempBudget.value = props.initialBudget?.toString() || '';
  }
});

const handleSave = () => {
  const newVal = parseFloat(tempBudget.value);
  if (isNaN(newVal) || newVal < 0) {
    uni.showToast({ title: '请输入有效金额', icon: 'none' });
    return;
  }
  emit('confirm', newVal);
  emit('update:modelValue', false);
};
</script>

<style scoped>
.budget-input-content { padding-top: 8px; }
.amount-field-wrap { display: flex; align-items: baseline; gap: 12px; }
.currency-label { font-size: 24px; font-weight: 900; color: var(--primary-color, #4F46E5); }
.main-budget-input { 
  flex: 1; height: 60px; font-size: 40px; font-weight: 900; color: #1E293B; 
  letter-spacing: -1px;
}

.input-focus-line { 
  height: 3px; background: #F1F5F9; border-radius: 10px; margin-top: 4px; position: relative; 
}
.input-focus-line::after {
  content: ''; position: absolute; left: 0; top: 0; width: 30%; height: 100%; 
  background: var(--primary-color, #4F46E5); border-radius: 10px; opacity: 0.8;
}

.helper-text-row { display: flex; justify-content: space-between; margin-top: 16px; }
.helper-info { font-size: 12px; font-weight: 800; color: #64748B; }
.helper-hint { font-size: 11px; font-weight: 600; color: #CBD5E1; }

.confirm-save-btn {
  width: 100%; height: 64px;
  background: var(--primary-color, #1E293B);
  border-radius: 20px;
  display: flex; align-items: center; justify-content: center; border: none;
  box-shadow: 0 10px 25px var(--primary-glow, rgba(30, 41, 59, 0.15));
  transition: background 0.35s ease, box-shadow 0.35s ease;
}
.confirm-save-btn:active { transform: scale(0.98); opacity: 0.9; }
.btn-txt { color: #fff; font-size: 16px; font-weight: 900; letter-spacing: 0.5px; }
</style>