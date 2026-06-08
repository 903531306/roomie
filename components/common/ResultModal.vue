<template>
  <view :class="themeClass" class="result-overlay" @click="$emit('close')">
    <view class="result-card animate-pop" @click.stop>
      <!-- Decorative background elements -->
      <view class="card-glow"></view>
      
      <!-- Header with Title -->
      <view class="modal-header">
        <view class="title-badge">
          <text class="badge-dot"></text>
          <text class="badge-text">{{ wheelTitle }}</text>
        </view>
        <!-- <view class="status-tag">灵感捕捉完成</view> -->
      </view>
      
      <!-- Main Result Display -->
     <view class="result-content">
       <!-- <view class="result-orb-wrap">
          <view class="orb-inner"></view>
          <view class="orb-glow"></view>
          <view class="particles">
            <view v-for="i in 6" :key="i" :class="'particle p-' + i"></view>
          </view>
        </view> -->
        <text class="result-text">{{ resultName }}</text>
      </view>
      
      <view class="divider-line"></view>
      
      <!-- Action Buttons -->
      <view class="actions-container">
        <button class="action-btn share-btn" open-type="share">
          <!-- <text class="btn-icon">📤</text> -->
          <text>分享灵感</text>
        </button>
        <button class="action-btn confirm-btn" @click="$emit('close')">
          确认选择
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { useAppTheme } from '@/common/themes/useAppTheme.js'
const { themeClass, primaryColor, softColor, theme } = useAppTheme()

defineProps({
  wheelTitle: {
    type: String,
    default: '决策方案'
  },
  resultName: {
    type: String,
    default: ''
  }
});

defineEmits(['close']);
</script>

<style scoped>
.result-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px;
}

.result-card {
  width: 100%;
  max-width: 340px;
  background: #1E293B;
  border-radius: 40px;
  padding: 40px 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 30px 60px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.05);
  position: relative;
  overflow: hidden;
}

.card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at center, var(--primary-glow, rgba(79, 70, 229, 0.15)) 0%, transparent 50%);
  pointer-events: none;
}

.modal-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 30px;
  width: 100%;
}

.title-badge {
  background: rgba(255, 255, 255, 0.05);
  padding: 6px 16px;
  border-radius: 100px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.badge-dot {
  width: 6px;
  height: 6px;
  background: #818CF8;
  border-radius: 50%;
  box-shadow: 0 0 8px #818CF8;
}

.badge-text {
  font-size: 12px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 0.5px;
}

.status-tag {
  font-size: 10px;
  font-weight: 900;
  color: #818CF8;
  text-transform: uppercase;
  letter-spacing: 3px;
}

.result-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  width: 100%;
}

.result-orb-wrap {
  position: relative;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.orb-inner {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, var(--primary-color, #4F46E5) 0%, #7C3AED 100%);
  border-radius: 50%;
  box-shadow: 0 10px 30px var(--primary-glow, rgba(79, 70, 229, 0.4));
  z-index: 2;
}

.orb-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(124, 58, 237, 0.3) 0%, transparent 70%);
  filter: blur(15px);
  animation: pulse 3s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.2); opacity: 0.8; }
}

.result-text {
  font-size: 36px;
  font-weight: 900;
  color: #fff;
  text-align: center;
  line-height: 1.2;
  letter-spacing: -1px;
  text-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.divider-line {
  width: 40px;
  height: 4px;
  background: rgba(255,255,255,0.05);
  border-radius: 10px;
  margin-bottom: 30px;
}

.actions-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 12px;
}

.action-btn {
  width: 100%;
  height: 64px;
  border-radius: 22px;
  font-size: 16px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  cursor: pointer;
}

.action-btn:active {
  transform: scale(0.97);
}

.confirm-btn {
  background: #fff;
  color: #1E293B;
  box-shadow: 0 10px 20px rgba(255,255,255,0.1);
}

.share-btn {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  gap: 8px;
}

.btn-icon {
  font-size: 18px;
}

.animate-pop {
  animation: pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
}

@keyframes pop {
  from { opacity: 0; transform: scale(0.9) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

/* Particles */
.particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: #fff;
  border-radius: 50%;
  opacity: 0;
}

.p-1 { top: 10%; left: 20%; animation: float 4s infinite 0.5s; }
.p-2 { top: 30%; right: 10%; animation: float 5s infinite 1.2s; }
.p-3 { bottom: 20%; left: 15%; animation: float 3s infinite 0.8s; }
.p-4 { bottom: 40%; right: 20%; animation: float 6s infinite 2s; }

@keyframes float {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  50% { opacity: 0.5; }
  100% { transform: translateY(-40px) scale(0); opacity: 0; }
}
</style>
