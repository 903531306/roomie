<template>
  <view class="compose-bar field-shell" :class="{ 'field-shell-focus': isInputFocus }">
    <view class="compose-main">
      <input
        :value="modelValue"
        class="compose-input"
        :disabled="loading"
        :placeholder="placeholder"
        confirm-type="done"
        @input="$emit('update:modelValue', $event.detail.value)"
        @confirm="$emit('submit')"
        @focus="isInputFocus = true"
        @blur="isInputFocus = false"
      />
      <view class="compose-add" :class="{ on: modelValue.trim() && !loading }" @tap="$emit('submit')">
        <text v-if="!loading" class="add-icon">+</text>
        <view v-else class="mini-spinner dark"></view>
      </view>
    </view>
    <scroll-view scroll-x class="chip-scroll" :show-scrollbar="false" enable-flex>
      <view class="chip-inner">
        <view class="chip" :class="{ on: quickToday }" @tap.stop="$emit('update:quickToday', !quickToday)">
          <text class="chip-label">今天</text>
        </view>
        <view class="chip chip-urgent" :class="{ on: quickUrgent }" @tap.stop="$emit('update:quickUrgent', !quickUrgent)">
          <text class="chip-label">紧急</text>
        </view>
        <view class="chip" :class="{ on: !!quickAssignee }" @tap.stop="$emit('pickAssignee')">
          <text class="chip-label">{{ assigneeLabel }}</text>
        </view>
        <view v-if="modelValue.trim() && showMoreChip" class="chip chip-ghost" @tap.stop="$emit('more')">
          <text class="chip-label">更多</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  modelValue: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  quickToday: { type: Boolean, default: true },
  quickUrgent: { type: Boolean, default: false },
  quickAssignee: { type: Object, default: null },
  assigneeLabel: { type: String, default: '经办人' },
  placeholder: { type: String, default: '记一条待办…' },
  showMoreChip: { type: Boolean, default: true }
})

defineEmits([
  'update:modelValue',
  'update:quickToday',
  'update:quickUrgent',
  'submit',
  'more',
  'pickAssignee'
])

const isInputFocus = ref(false)
</script>

<style scoped>
.field-shell {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #f1f5f9;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
  box-sizing: border-box;
}
.field-shell-focus {
  border-color: var(--primary-color, #4f46e5);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.08);
}
.compose-bar {
  padding: 10px 12px 8px;
  margin-bottom: 10px;
}
.compose-main {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.compose-input {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  height: 36px;
}
.compose-add {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.compose-add.on { background: var(--primary-color, #4f46e5); }
.add-icon { font-size: 20px; font-weight: 300; color: #94a3b8; line-height: 1; }
.compose-add.on .add-icon { color: #fff; }
.mini-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(79, 70, 229, 0.2);
  border-top-color: var(--primary-color, #4f46e5);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.chip-scroll { width: 100%; white-space: nowrap; }
.chip-inner { display: flex; align-items: center; gap: 6px; padding-bottom: 2px; }
.chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 26px;
  padding: 0 12px;
  border-radius: 999px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  flex-shrink: 0;
  box-sizing: border-box;
}
.chip-label {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  line-height: 1;
  display: block;
}
.chip.on { background: var(--primary-soft, #eef2ff); border-color: var(--primary-color, #4f46e5); }
.chip.on .chip-label { color: var(--primary-color, #4f46e5); }
.chip-urgent.on { background: #fff1f2; border-color: #fecdd3; }
.chip-urgent.on .chip-label { color: #f43f5e; }
.chip-ghost { background: transparent; border-style: dashed; }
</style>
