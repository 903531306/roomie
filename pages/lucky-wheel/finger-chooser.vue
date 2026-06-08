
<template>
  <view :class="themeClass" class="chooser-container" @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd" @touchcancel="onTouchEnd">
    <IosNav title="指尖选择" @leftClick="goBack" />

    <!-- 动态背景 -->
    <view class="nebula-bg">
      <view class="star" v-for="i in 20" :key="i" :style="starStyles[i-1]"></view>
    </view>

    <!-- 引导文字 -->
    <view class="guide-layer" :class="{ 'is-active': isAnyFinger }">
      <view class="guide-content">
        <text class="g-title">{{ isAnyFinger ? '按住别松开...' : '多人按住屏幕' }}</text>
        <text class="g-sub">{{ isAnyFinger ? '等待奇迹发生' : '每个玩家伸出一根手指' }}</text>
      </view>
    </view>

    <!-- 指尖交互层 -->
    <view class="touch-points-layer">
      <view 
        v-for="(touch, id) in touches" 
        :key="id"
        class="touch-indicator"
        :class="{ 'is-winner': winnerId === id, 'is-counting': countdown > 0 }"
        :style="{ 
          left: touch.x + 'px', 
          top: touch.y + 'px',
          '--color': touch.color 
        }"
      >
        <view class="pulse-ring-1"></view>
        <view class="pulse-ring-2"></view>
        <view class="center-dot"></view>
        
        <!-- 进度环 -->
        <svg class="progress-ring" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" :stroke="touch.color" stroke-width="5" :stroke-dasharray="283" :stroke-dashoffset="dashOffset" />
        </svg>

        <view v-if="winnerId === id" class="winner-label animate-pop">
           <text class="w-txt">是你！</text>
           <view class="w-spark"></view>
        </view>
      </view>
    </view>

    <!-- 结果浮层按钮 -->
    <view v-if="winnerId" class="reset-dock animate-panel-up">
      <button class="reset-btn" @click="reset">重新开始</button>
    </view>
  </view>
</template>

<script setup>
import { useAppTheme } from '@/common/themes/useAppTheme.js'
const { themeClass, primaryColor, softColor, theme } = useAppTheme()

import { ref, reactive, onMounted, computed } from 'vue';
import IosNav from '../../components/nav/ios-nav.vue';

const touches = reactive({});
const winnerId = ref(null);
const countdown = ref(0);
const totalTime = 2000; // 2秒
let timer = null;

const colors = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#F43F5E'];

const starStyles = Array.from({ length: 20 }).map(() => ({
  left: Math.random() * 100 + '%',
  top: Math.random() * 100 + '%',
  animationDelay: Math.random() * 5 + 's'
}));

const isAnyFinger = computed(() => Object.keys(touches).length > 0);
const dashOffset = computed(() => 283 * (1 - countdown.value / totalTime));

const goBack = () => uni.navigateBack();

const onTouchStart = (e) => {
  if (winnerId.value) return;
  
  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];
    touches[t.identifier] = {
      x: t.pageX,
      y: t.pageY,
      color: colors[Object.keys(touches).length % colors.length]
    };
  }
  checkAndStart();
};

const onTouchMove = (e) => {
  if (winnerId.value) return;
  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];
    if (touches[t.identifier]) {
      touches[t.identifier].x = t.pageX;
      touches[t.identifier].y = t.pageY;
    }
  }
};

const onTouchEnd = (e) => {
  if (winnerId.value) return;
  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];
    delete touches[t.identifier];
  }
  cancelCountdown();
};

const checkAndStart = () => {
  const count = Object.keys(touches).length;
  if (count >= 2) {
    startCountdown();
  }
};

const startCountdown = () => {
  if (timer) return;
  countdown.value = 0;
  const start = Date.now();
  
  timer = setInterval(() => {
    const elapsed = Date.now() - start;
    countdown.value = elapsed;
    
    if (elapsed % 100 < 20) uni.vibrateShort();

    if (elapsed >= totalTime) {
      clearInterval(timer);
      timer = null;
      selectWinner();
    }
  }, 16);
};

const cancelCountdown = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
    countdown.value = 0;
  }
};

const selectWinner = () => {
  const ids = Object.keys(touches);
  if (ids.length === 0) return;
  const randomIndex = Math.floor(Math.random() * ids.length);
  winnerId.value = ids[randomIndex];
  uni.vibrateLong();
};

const reset = () => {
  Object.keys(touches).forEach(id => delete touches[id]);
  winnerId.value = null;
  countdown.value = 0;
};
</script>

<style scoped>
.chooser-container { height: 100vh; background: #000; overflow: hidden; position: relative; }

.nebula-bg { position: absolute; inset: 0; overflow: hidden; }
.star { position: absolute; width: 2px; height: 2px; background: #fff; border-radius: 50%; opacity: 0.3; animation: pulse 3s infinite; }
@keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.5); } }

.guide-layer { position: absolute; top: 20%; left: 0; right: 0; text-align: center; transition: all 0.5s; pointer-events: none; }
.guide-layer.is-active { opacity: 0.3; transform: scale(0.9); }
.g-title { font-size: 24px; font-weight: 900; color: #fff; letter-spacing: 2px; display: block; }
.g-sub { font-size: 14px; font-weight: 700; color: #94A3B8; margin-top: 10px; display: block; }

.touch-indicator { position: absolute; width: 80px; height: 80px; transform: translate(-50%, -50%); transition: transform 0.1s linear; pointer-events: none; }
.center-dot { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 20px; height: 20px; background: #fff; border-radius: 50%; box-shadow: 0 0 20px var(--color); z-index: 10; }

.pulse-ring-1, .pulse-ring-2 { position: absolute; inset: 0; border: 2px solid var(--color); border-radius: 50%; animation: ringExpand 2s infinite ease-out; opacity: 0; }
.pulse-ring-2 { animation-delay: 1s; }

@keyframes ringExpand { from { transform: scale(0.5); opacity: 0.8; } to { transform: scale(2.5); opacity: 0; } }

.progress-ring { position: absolute; inset: -10px; width: 100px; height: 100px; transform: rotate(-90deg); }

.is-winner { transform: translate(-50%, -50%) scale(1.5); }
.is-winner .pulse-ring-1 { border-width: 10px; animation: winnerGlow 1s infinite alternate; }
@keyframes winnerGlow { from { opacity: 0.5; transform: scale(1); } to { opacity: 1; transform: scale(1.3); } }

.winner-label { position: absolute; top: -60px; left: 50%; transform: translateX(-50%); background: #fff; padding: 6px 16px; border-radius: 12px; }
.w-txt { font-size: 14px; font-weight: 900; color: #000; }

.reset-dock { position: fixed; bottom: 60px; left: 0; right: 0; display: flex; justify-content: center; }
.reset-btn { background: #fff; color: #000; border-radius: 100px; padding: 0 40px; height: 54px; font-weight: 900; font-size: 15px; border: none; }

.animate-panel-up { animation: panelUp 0.5s cubic-bezier(0.19, 1, 0.22, 1) both; }
@keyframes panelUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
</style>
