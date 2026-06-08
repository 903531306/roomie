<template>
  <view :class="themeClass" class="lobby-container">
    <view class="ambient-bg">
      <view class="blob blob-1"></view>
      <view class="blob blob-2"></view>
    </view>

    <view class="content">
      <view class="header">
        <text class="title">游戏计分器</text>
        <text class="subtitle">麻将 · 扑克 · 棋牌</text>
      </view>

      <view class="card join-card">
        <view class="input-group">
          <text class="label">输入房间号</text>
          <input 
            class="room-input" 
            type="number" 
            placeholder="例如: 2381" 
            v-model="roomId"
            maxlength="6"
          />
        </view>
        
        <view class="input-group">
          <text class="label">你的昵称</text>
          <input 
            class="room-input" 
            type="text" 
            placeholder="输入你的大名" 
            v-model="playerName"
          />
        </view>

        <button class="primary-btn" @click="handleJoin">
          <text class="btn-text">进入房间</text>
          <view class="btn-glow"></view>
        </button>
      </view>

      <view class="quick-actions">
        <view class="action-item" @click="generateRoomId">
          <text class="action-icon">🎲</text>
          <text class="action-label">随机房间</text>
        </view>
        <view class="action-item" @click="goBack">
          <text class="action-icon">🏠</text>
          <text class="action-label">返回首页</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { useAppTheme } from '@/common/themes/useAppTheme.js'
const { themeClass, primaryColor, softColor, theme } = useAppTheme()

import { ref } from 'vue';

const roomId = ref('');
const playerName = ref(uni.getStorageSync('userInfo')?.userNickname || '');

const handleJoin = () => {
  if (!roomId.value) {
    uni.showToast({ title: '请输入房间号', icon: 'none' });
    return;
  }
  if (!playerName.value) {
    uni.showToast({ title: '请输入昵称', icon: 'none' });
    return;
  }

  uni.navigateTo({
    url: `/pages/game-scorer/room?roomId=${roomId.value}&name=${playerName.value}`
  });
};

const generateRoomId = () => {
  roomId.value = Math.floor(1000 + Math.random() * 9000).toString();
};

const goBack = () => {
  uni.navigateBack();
};
</script>

<style scoped>
.lobby-container {
  min-height: 100vh;
  background-color: #0F172A;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
}

.ambient-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.2;
}

.blob-1 {
  top: -100rpx;
  right: -100rpx;
  width: 400rpx;
  height: 400rpx;
  background: var(--primary-color, #4F46E5);
}

.blob-2 {
  bottom: -100rpx;
  left: -100rpx;
  width: 500rpx;
  height: 500rpx;
  background: #06B6D4;
}

.content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 600rpx;
}

.header {
  text-align: center;
  margin-bottom: 80rpx;
}

.title {
  display: block;
  font-size: 64rpx;
  font-weight: 900;
  color: #FFFFFF;
  letter-spacing: -2rpx;
  margin-bottom: 16rpx;
}

.subtitle {
  font-size: 28rpx;
  color: #94A3B8;
  letter-spacing: 8rpx;
  text-transform: uppercase;
}

.join-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-radius: 48rpx;
  padding: 60rpx;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
}

.input-group {
  margin-bottom: 40rpx;
}

.label {
  display: block;
  font-size: 24rpx;
  color: #64748B;
  margin-bottom: 16rpx;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2rpx;
}

.room-input {
  width: 100%;
  height: 100rpx;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 24rpx;
  padding: 0 32rpx;
  color: #FFFFFF;
  font-size: 36rpx;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-sizing: border-box;
}

.primary-btn {
  width: 100%;
  height: 110rpx;
  background: var(--primary-color, #4F46E5);
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  border: none;
  margin-top: 20rpx;
}

.btn-text {
  color: #FFFFFF;
  font-size: 32rpx;
  font-weight: 700;
  z-index: 2;
}

.btn-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transform: translateX(-100%);
  animation: sweep 3s infinite;
}

@keyframes sweep {
  100% { transform: translateX(100%); }
}

.quick-actions {
  display: flex;
  justify-content: center;
  gap: 60rpx;
  margin-top: 60rpx;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.action-icon {
  font-size: 48rpx;
}

.action-label {
  font-size: 22rpx;
  color: #64748B;
  font-weight: 600;
}
</style>
