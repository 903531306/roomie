<template>
  <GlobalDrawer 
    :model-value="modelValue" 
    title="空间管理" 
    subtitle="管理空间信息与成员权限"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <view :class="themeClass" class="settings-center-wrap">
      
      <!-- 空间名称 -->
      <view class="settings-section animate-reveal">
        <text class="section-title">基本信息</text>
        <view class="main-config-card">
          <view class="input-header">
            <text class="input-label">空间显示名称</text>
            <view class="label-icon-wrap">
              <text class="input-emoji">🏠</text>
            </view>
          </view>
          <view class="input-body" :class="{ 'is-active': isFocused }">
            <input 
              v-model="localRoomName" 
              class="premium-input" 
              placeholder="输入新的空间名称" 
              @focus="isFocused = true"
              @blur="isFocused = false"
            />
            <view v-if="localRoomName" class="clear-tap" @tap.stop="localRoomName = ''">
              <text class="clear-icon">✕</text>
            </view>
          </view>
          <text class="hint-text">修改后，所有成员将在下次刷新时看到新名称</text>
        </view>
      </view>

      <!-- 成员权限 -->
      <view class="settings-section animate-reveal" style="animation-delay: 0.06s">
        <text class="section-title">成员与权限</text>
        <view class="permission-entry-card" hover-class="entry-press" @tap="handleMemberManage">
          <view class="entry-left">
            <view class="entry-icon-box">
              <text class="entry-emoji">🛡️</text>
            </view>
            <view class="entry-info">
              <text class="entry-title">成员权限设置</text>
              <text class="entry-sub">管理空间成员及其操作权限</text>
            </view>
          </view>
          <view class="entry-chevron">
            <text class="entry-arrow">›</text>
          </view>
        </view>
      </view>

    </view>

    <template #footer>
      <view class="footer-dual-actions">
        <button class="action-btn dissolve-btn" @click="$emit('delete')">
          <text class="btn-icon">🗑️</text>
          <text class="btn-txt">解散空间</text>
        </button>
        <button class="action-btn modify-btn" @click="handleSave">
          <text class="btn-txt">保存修改</text>
        </button>
      </view>
    </template>
  </GlobalDrawer>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useAppTheme } from '@/common/themes/useAppTheme.js';
import GlobalDrawer from './GlobalDrawer.vue';

const { themeClass } = useAppTheme();

const props = defineProps({
  modelValue: Boolean,
  roomName: String
});

const emit = defineEmits(['update:modelValue', 'save', 'delete', 'manageMember']);

const localRoomName = ref('');
const isFocused = ref(false);

watch(() => props.modelValue, (val) => {
  if (val) {
    localRoomName.value = props.roomName || '';
  }
});

const handleSave = () => {
  if (!localRoomName.value.trim()) {
    uni.showToast({ title: '名称不能为空', icon: 'none' });
    return;
  }
  emit('save', localRoomName.value.trim());
};

const handleMemberManage = () => {
  emit('manageMember');
  emit('update:modelValue', false);
};
</script>

<style scoped>
.settings-center-wrap {
  padding: 8rpx 0 24rpx;
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.section-title {
  font-size: 22rpx;
  font-weight: 800;
  color: #94a3b8;
  letter-spacing: 1rpx;
  padding-left: 8rpx;
}

.main-config-card {
  background: #fff;
  border-radius: 32rpx;
  padding: 32rpx;
  border: 1px solid #f1f5f9;
  box-shadow: 0 8rpx 32rpx rgba(15, 23, 42, 0.04);
}

.input-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.input-label {
  font-size: 26rpx;
  font-weight: 800;
  color: #64748b;
}

.label-icon-wrap {
  width: 56rpx;
  height: 56rpx;
  border-radius: 16rpx;
  background: var(--primary-soft, #eef2ff);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.35s ease;
}

.input-emoji { font-size: 28rpx; }

.input-body {
  min-height: 96rpx;
  background: #f8fafc;
  border-radius: 24rpx;
  padding: 0 28rpx;
  display: flex;
  align-items: center;
  border: 2rpx solid #e2e8f0;
  transition: all 0.25s ease;
}

.is-active {
  background: #fff;
  border-color: var(--primary-color, #4f46e5);
  box-shadow: 0 8rpx 28rpx var(--primary-glow, rgba(79, 70, 229, 0.12));
}

.premium-input {
  flex: 1;
  font-size: 32rpx;
  font-weight: 800;
  color: #0f172a;
  height: 96rpx;
}

.clear-tap {
  width: 48rpx;
  height: 48rpx;
  background: #e2e8f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 16rpx;
  flex-shrink: 0;
}

.clear-icon {
  font-size: 20rpx;
  color: #fff;
  font-weight: 700;
  line-height: 1;
}

.hint-text {
  font-size: 22rpx;
  font-weight: 600;
  color: #94a3b8;
  margin-top: 20rpx;
  line-height: 1.5;
  display: block;
}

.permission-entry-card {
  background: #fff;
  border-radius: 28rpx;
  padding: 28rpx 32rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #f1f5f9;
  box-shadow: 0 8rpx 32rpx rgba(15, 23, 42, 0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.entry-press {
  transform: scale(0.98);
  opacity: 0.92;
}

.entry-left {
  display: flex;
  align-items: center;
  gap: 24rpx;
  flex: 1;
  min-width: 0;
}

.entry-icon-box {
  width: 80rpx;
  height: 80rpx;
  background: var(--primary-soft, #eef2ff);
  border-radius: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.35s ease;
}

.entry-emoji { font-size: 36rpx; }

.entry-info {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  min-width: 0;
}

.entry-title {
  font-size: 30rpx;
  font-weight: 900;
  color: #0f172a;
}

.entry-sub {
  font-size: 24rpx;
  font-weight: 600;
  color: #94a3b8;
}

.entry-chevron {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-left: 16rpx;
}

.entry-arrow {
  font-size: 32rpx;
  color: #cbd5e1;
  font-weight: 400;
  line-height: 1;
}

.footer-dual-actions {
  display: flex;
  gap: 20rpx;
}

.action-btn {
  height: 96rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.action-btn::after { border: none; }

.dissolve-btn {
  flex: 1;
  background: #fff;
  border: 2rpx solid #fecdd3 !important;
}

.dissolve-btn:active {
  background: #fff1f2;
  transform: scale(0.97);
}

.dissolve-btn .btn-txt {
  color: #f43f5e;
  font-size: 28rpx;
  font-weight: 800;
}

.btn-icon {
  margin-right: 8rpx;
  font-size: 28rpx;
}

.modify-btn {
  flex: 1.6;
  background: var(--primary-color, #4f46e5);
  box-shadow: 0 12rpx 32rpx var(--primary-glow, rgba(79, 70, 229, 0.25));
  transition: background 0.35s ease, box-shadow 0.35s ease;
}

.modify-btn:active {
  transform: scale(0.97);
  opacity: 0.92;
}

.modify-btn .btn-txt {
  color: #fff;
  font-size: 30rpx;
  font-weight: 900;
}

.animate-reveal {
  animation: revealIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes revealIn {
  from { opacity: 0; transform: translateY(20rpx); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
