<template>
  <view :class="themeClass" class="dice-page">
    <IosNav title="幸运摇骰" @leftClick="goBack" />

    <!-- <GameModeSwitcher currentPath="/pages/lucky-wheel/dice" /> -->

    <!-- 氛围背景 -->
    <view class="ambient-bg">
      <view class="glow-orb orb-1"></view>
      <view class="glow-orb orb-2"></view>
    </view>

    <view class="content-area">
      <view class="header-section">
        <text class="h1">掷出好运</text>
        <text class="p">摇晃手机或点击按钮，开启今日运势</text>
      </view>

      <!-- 3D 骰子容器 -->
      <view class="dice-container">
        <view class="dice-platform">
          <view class="platform-glow"></view>
          <view class="dice-wrap" :class="{ 'is-rolling': isRolling }" :style="diceStyle">
            <!-- 骰子六个面 -->
            <view v-for="n in 6" :key="n" :class="['dice-face', 'face-' + n]">
              <view class="dots-container">
                <view v-for="dot in n" :key="dot" class="dot"></view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 结果显示 -->
      <view class="result-section" :class="{ 'show': !isRolling && lastResult > 0 }">
        <view class="result-badge">
          <text class="result-text">点数：{{ lastResult }}</text>
        </view>
        <text class="result-hint">{{ getResultHint(lastResult) }}</text>
      </view>

      <!-- 控制区 -->
      <view class="action-zone">
        <view class="roll-btn-wrapper" @click="rollDice">
          <button 
            class="main-roll-btn" 
            :disabled="isRolling"
            :class="{ 'is-active': isRolling }"
          >
            <text class="btn-label">{{ isRolling ? '正在摇晃...' : '掷骰子' }}</text>
          </button>
          <view class="btn-glow-aura"></view>
        </view>
      </view>
    </view>

    <!-- 结果浮层 -->
    <view v-if="showOverlay" class="result-overlay" @click="closeOverlay">
      <view class="overlay-backdrop"></view>
      <view class="overlay-content animate-pop-in" @click.stop>
        <view class="overlay-dice-icon">
          <view class="mini-dice">
            <view class="mini-dot" v-for="d in lastResult" :key="d"></view>
          </view>
        </view>
        <text class="overlay-title">大吉大利</text>
        <text class="overlay-val">{{ lastResult }} 点</text>
        <text class="overlay-desc">{{ getResultHint(lastResult) }}</text>
        <view class="close-btn" @click="closeOverlay">
          <text class="close-btn-text">收下好运</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { useAppTheme } from '@/common/themes/useAppTheme.js'
const { themeClass, primaryColor, softColor, theme } = useAppTheme()

import { ref, reactive, computed, onMounted } from 'vue';
import IosNav from '../../components/nav/ios-nav.vue';
// import GameModeSwitcher from '../../components/lucky-wheel/GameModeSwitcher.vue';

const isRolling = ref(false);
const lastResult = ref(0);
const showOverlay = ref(false);
const diceRotation = reactive({ x: 0, y: 0, z: 0 });

const goBack = () => uni.navigateBack();

const diceStyle = computed(() => {
  return {
    transform: `rotateX(${diceRotation.x}deg) rotateY(${diceRotation.y}deg) rotateZ(${diceRotation.z}deg)`
  };
});

const getResultHint = (val) => {
  const hints = {
    1: '万物之始，脚踏实地',
    2: '好事成双，缘分将至',
    3: '三阳开泰，灵感爆发',
    4: '四季平安，稳中求进',
    5: '五福临门，活力满满',
    6: '六六大顺，诸事皆宜'
  };
  return hints[val] || '';
};

onMounted(() => {
  // 初始给一个角度，让它看起来是 3D 的
  diceRotation.x = 25;
  diceRotation.y = 45;
});

const rollDice = () => {
  if (isRolling.value) return;
  
  isRolling.value = true;
  lastResult.value = 0;
  
  // 随机生成点数 1-6
  const result = Math.floor(Math.random() * 6) + 1;
  
  // 增加旋转圈数以产生神秘感
  const extraSpins = 6 + Math.floor(Math.random() * 4);
  
  // 每个面对应的最终角度
  const faceRotations = {
    1: { x: 0, y: 0 },
    2: { x: 0, y: -90 },
    3: { x: -90, y: 0 },
    4: { x: 90, y: 0 },
    5: { x: 0, y: 90 },
    6: { x: 180, y: 0 }
  };
  
  const target = faceRotations[result];
  
  // 计算最终旋转角度
  diceRotation.x += 360 * extraSpins + target.x;
  diceRotation.y += 360 * extraSpins + target.y;
  diceRotation.z += 360; // 增加 Z 轴旋转

  setTimeout(() => {
    isRolling.value = false;
    lastResult.value = result;
    
    // 延迟显示浮层
    setTimeout(() => {
      showOverlay.value = true;
    }, 600);
  }, 2000); // 动画时长 2s
};

const closeOverlay = () => {
  showOverlay.value = false;
};

const closeResult = () => {
  lastResult.value = 0;
};
</script>

<style scoped>
.dice-page {
  height: 100vh;
  background-color: #020617;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.ambient-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.15;
}

.orb-1 { top: -10%; left: -10%; width: 500px; height: 500px; background: #4338ca; }
.orb-2 { bottom: -10%; right: -10%; width: 400px; height: 400px; background: #6366f1; }

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 1;
  padding-top: 40rpx;
}

.header-section {
  text-align: center;
  margin-bottom: 60rpx;
}

.h1 {
  font-size: 28px;
  font-weight: 900;
  color: #fff;
  letter-spacing: 4rpx;
  text-shadow: 0 0 20px rgba(255,255,255,0.2);
}

.p {
  font-size: 14px;
  color: #94a3b8;
  margin-top: 16rpx;
}

/* 3D 骰子样式 */
.dice-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 1200px;
  width: 100%;
}

.dice-platform {
  position: relative;
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.5s;
}

.dice-platform:has(.is-rolling) {
  animation: diceJump 2s cubic-bezier(0.45, 0.05, 0.55, 0.95);
}

@keyframes diceJump {
  0% { transform: translateY(0) scale(1); }
  20% { transform: translateY(-120px) scale(1.1); }
  40% { transform: translateY(0) scale(1); }
  60% { transform: translateY(-60px) scale(1.05); }
  80% { transform: translateY(0) scale(1); }
  100% { transform: translateY(0) scale(1); }
}

.platform-glow {
  position: absolute;
  width: 240px;
  height: 240px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  transform: rotateX(80deg);
  bottom: -60px;
  filter: blur(20px);
}

.dice-wrap {
  width: 100px;
  height: 100px;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 2s cubic-bezier(0.19, 1, 0.22, 1);
}

.dice-face {
  position: absolute;
  width: 100px;
  height: 100px;
  background: linear-gradient(145deg, #ffffff, #f1f5f9);
  border: 2rpx solid rgba(0,0,0,0.05);
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    inset 0 0 15rpx rgba(0,0,0,0.1),
    0 0 10rpx rgba(255,255,255,0.8);
  backface-visibility: visible;
}

/* 骰子面定位 */
.face-1 { transform: rotateY(0deg) translateZ(50px); }
.face-2 { transform: rotateY(90deg) translateZ(50px); }
.face-3 { transform: rotateX(90deg) translateZ(50px); }
.face-4 { transform: rotateX(-90deg) translateZ(50px); }
.face-5 { transform: rotateY(-90deg) translateZ(50px); }
.face-6 { transform: rotateY(180deg) translateZ(50px); }

/* 骰子点数样式 */
.dots-container {
  width: 70%;
  height: 70%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 4rpx;
}

.dot {
  width: 16rpx;
  height: 16rpx;
  background: #1e293b;
  border-radius: 50%;
  justify-self: center;
  align-self: center;
  box-shadow: inset 0 2rpx 4rpx rgba(0,0,0,0.3);
}

/* 点数布局逻辑 */
.face-1 .dot { grid-area: 2 / 2; }

.face-2 .dot:nth-child(1) { grid-area: 1 / 1; }
.face-2 .dot:nth-child(2) { grid-area: 3 / 3; }

.face-3 .dot:nth-child(1) { grid-area: 1 / 1; }
.face-3 .dot:nth-child(2) { grid-area: 2 / 2; }
.face-3 .dot:nth-child(3) { grid-area: 3 / 3; }

.face-4 .dot:nth-child(1) { grid-area: 1 / 1; }
.face-4 .dot:nth-child(2) { grid-area: 1 / 3; }
.face-4 .dot:nth-child(3) { grid-area: 3 / 1; }
.face-4 .dot:nth-child(4) { grid-area: 3 / 3; }

.face-5 .dot:nth-child(1) { grid-area: 1 / 1; }
.face-5 .dot:nth-child(2) { grid-area: 1 / 3; }
.face-5 .dot:nth-child(3) { grid-area: 2 / 2; }
.face-5 .dot:nth-child(4) { grid-area: 3 / 1; }
.face-5 .dot:nth-child(5) { grid-area: 3 / 3; }

.face-6 .dot:nth-child(1) { grid-area: 1 / 1; }
.face-6 .dot:nth-child(2) { grid-area: 1 / 3; }
.face-6 .dot:nth-child(3) { grid-area: 2 / 1; }
.face-6 .dot:nth-child(4) { grid-area: 2 / 3; }
.face-6 .dot:nth-child(5) { grid-area: 3 / 1; }
.face-6 .dot:nth-child(6) { grid-area: 3 / 3; }

/* 结果显示 */
.result-section {
  opacity: 0;
  transform: translateY(20rpx);
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 80rpx;
}

.result-section.show {
  opacity: 1;
  transform: translateY(0);
}

.result-badge {
  padding: 12rpx 40rpx;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 100px;
  margin-bottom: 20rpx;
}

.result-text {
  color: #818cf8;
  font-size: 20px;
  font-weight: 900;
}

.result-hint {
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
}

/* 控制区 */
.action-zone {
  padding-bottom: 100rpx;
}

.roll-btn-wrapper {
  position: relative;
  width: 240px;
}

.main-roll-btn {
  width: 100%;
  height: 70px;
  background: #ffffff;
  border-radius: 35px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
  transition: all 0.3s;
  z-index: 2;
  position: relative;
}

.main-roll-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.main-roll-btn.is-active {
  background: #f1f5f9;
  opacity: 0.8;
}

.btn-label {
  color: #020617;
  font-size: 20px;
  font-weight: 900;
  letter-spacing: 2rpx;
}

.btn-glow-aura {
  position: absolute;
  inset: 10rpx;
  background: #6366f1;
  filter: blur(40px);
  opacity: 0.3;
  z-index: 1;
}

/* 结果浮层 */
.result-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.overlay-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(2, 6, 23, 0.85);
  backdrop-filter: blur(20px);
}

.overlay-content {
  position: relative;
  width: 540rpx;
  background: #ffffff;
  border-radius: 48rpx;
  padding: 60rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 40px 80px rgba(0,0,0,0.5);
}

.overlay-dice-icon {
  width: 120rpx;
  height: 120rpx;
  background: #f1f5f9;
  border-radius: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40rpx;
}

.mini-dice {
  width: 60rpx;
  height: 60rpx;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 4rpx;
}

.mini-dot {
  width: 10rpx;
  height: 10rpx;
  background: #6366f1;
  border-radius: 50%;
  justify-self: center;
  align-self: center;
}

.overlay-title {
  font-size: 20px;
  font-weight: 900;
  color: #64748b;
  margin-bottom: 10rpx;
}

.overlay-val {
  font-size: 48px;
  font-weight: 900;
  color: #0f172a;
  margin-bottom: 20rpx;
}

.overlay-desc {
  font-size: 16px;
  color: #94a3b8;
  text-align: center;
  margin-bottom: 60rpx;
}

.close-btn {
  width: 100%;
  height: 60px;
  background: #0f172a;
  border-radius: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn-text {
  color: #ffffff;
  font-size: 18px;
  font-weight: 800;
}

.animate-pop-in {
  animation: popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes popIn {
  from { opacity: 0; transform: scale(0.8) translateY(40px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
</style>
