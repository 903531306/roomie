<template>
  <view :class="themeClass" class="slot-machine-page">
    <IosNav title="灵感老虎机" @leftClick="goBack" />

    <!-- 氛围背景 -->
    <view class="ambient-bg">
      <view class="glow-circle circle-1"></view>
      <view class="glow-circle circle-2"></view>
    </view>

    <view class="machine-container">
      <!-- 老虎机主体外壳 -->
      <view class="machine-body">
        <!-- 顶部装饰牌 -->
        <view class="machine-header">
          <text class="header-text">LUCKY SLOT</text>
          <view class="header-lights">
            <view v-for="i in 6" :key="i" class="h-light"></view>
          </view>
        </view>

        <!-- 霓虹灯外框 -->
        <view class="neon-frame" :class="{ 'is-active': isRolling }">
          <!-- 滚轮视窗 -->
          <view class="reels-window">
            <view v-for="(reel, rIdx) in reels" :key="rIdx" class="reel-column">
              <view 
                class="reel-strip" 
                :class="{ 'is-blur': reel.isRolling }"
                :style="{ 
                  transform: `translateY(${reel.offset}px)`,
                  transition: reel.isRolling ? 'none' : 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }"
              >
                <!-- 循环渲染选项以实现无限滚动效果 -->
                <view 
                  v-for="(opt, oIdx) in reel.displayOptions" 
                  :key="oIdx" 
                  class="option-item"
                >
                  <text class="opt-emoji">{{ opt.emoji }}</text>
                  <text class="opt-label">{{ opt.label }}</text>
                </view>
              </view>
              <!-- 3D 弧形遮罩 -->
              <view class="reel-3d-mask"></view>
            </view>
            <!-- 玻璃反光层 -->
            <view class="glass-reflection"></view>
            <!-- 居中指示红线 -->
            <view class="center-line"></view>
          </view>
        </view>

        <!-- 底部装饰 -->
        <view class="machine-footer">
          <view class="coin-slot"></view>
          <view class="speaker-grill"></view>
        </view>

        <!-- 侧边拉杆 -->
        <view class="lever-system" @click="handleStart">
          <view class="lever-base-plate"></view>
          <view class="lever-arm-container" :class="{ 'is-pulled': isLeverPulled }">
            <view class="lever-shaft">
              <view class="shaft-highlight"></view>
            </view>
            <view class="lever-head"></view>
          </view>
        </view>
      </view>
    </view>

    <!-- 操作区 -->
    <view class="action-zone">
      <view class="info-card animate-fade-in">
        <text class="info-title">捕捉到的灵感组合</text>
        <view class="result-preview">
          <view v-for="(reel, idx) in reels" :key="idx" class="res-tag">
            {{ isRolling ? '???' : reel.options[reel.currentIndex].label }}
          </view>
        </view>
      </view>

      <view class="spin-btn-wrapper" @click="handleStart">
        <button 
          class="main-spin-btn" 
          :disabled="isRolling"
          :class="{ 'is-spinning': isRolling }"
        >
          <text class="btn-label">{{ isRolling ? '正在寻觅...' : '开启灵感捕捉' }}</text>
        </button>
        <view class="btn-shadow-aura"></view>
      </view>
    </view>

    <!-- 成功粒子效果 -->
    <view v-if="showConfetti" class="confetti-layer">
      <view v-for="i in 30" :key="i" :class="'confetti c-' + i"></view>
    </view>

    <!-- 结果弹窗 -->
    <ResultModal 
      v-if="showResult" 
      wheelTitle="老虎机灵感组合"
      :resultName="finalCombination"
      @close="showResult = false"
    />
  </view>
</template>

<script setup>
import { useAppTheme } from '@/common/themes/useAppTheme.js'
const { themeClass, primaryColor, softColor, theme } = useAppTheme()

import { ref, reactive, onMounted, computed, onUnmounted } from 'vue';
import IosNav from '../../components/nav/ios-nav.vue';
import ResultModal from '../../components/common/ResultModal.vue';

const isRolling = ref(false);
const isLeverPulled = ref(false);
const showResult = ref(false);
const showConfetti = ref(false);

// 选项配置
const cuisineOptions = [
  { label: '川菜', emoji: '🌶️' },
  { label: '粤菜', emoji: '🥟' },
  { label: '日料', emoji: '🍣' },
  { label: '西餐', emoji: '🥩' },
  { label: '火锅', emoji: '🍲' },
  { label: '韩餐', emoji: '🥘' },
  { label: '湘菜', emoji: '🍚' }
];

const flavorOptions = [
  { label: '麻辣', emoji: '🔥' },
  { label: '清淡', emoji: '🥣' },
  { label: '酸甜', emoji: '🍯' },
  { label: '咸鲜', emoji: '🧂' },
  { label: '浓郁', emoji: '🧈' },
  { label: '劲爽', emoji: '🧊' }
];

const methodOptions = [
  { label: '外卖', emoji: '🛵' },
  { label: '堂食', emoji: '🏢' },
  { label: '自己做', emoji: '🍳' },
  { label: '去蹭饭', emoji: '🏠' },
  { label: '路边摊', emoji: '🍢' }
];

const itemHeight = 100; // 每个选项的高度 (px)
const windowHeight = 140; // 视窗高度 (px)
const centerOffset = (windowHeight - itemHeight) / 2; // 居中偏移量 (px)

const reels = reactive([
  { 
    options: cuisineOptions, 
    displayOptions: [], 
    currentIndex: 0, 
    offset: 0, 
    isRolling: false,
    timer: null
  },
  { 
    options: flavorOptions, 
    displayOptions: [], 
    currentIndex: 0, 
    offset: 0, 
    isRolling: false,
    timer: null
  },
  { 
    options: methodOptions, 
    displayOptions: [], 
    currentIndex: 0, 
    offset: 0, 
    isRolling: false,
    timer: null
  }
]);

const finalCombination = computed(() => {
  return reels.map(r => r.options[r.currentIndex].label).join(' + ');
});

const goBack = () => uni.navigateBack();

onMounted(() => {
  // 初始化显示列表，为了实现无缝滚动，我们需要复制几份选项
  reels.forEach(reel => {
    reel.displayOptions = [...reel.options, ...reel.options, ...reel.options];
    updateReelOffset(reel, 0);
  });
});

onUnmounted(() => {
  reels.forEach(reel => {
    if (reel.timer) clearInterval(reel.timer);
  });
});

const updateReelOffset = (reel, index) => {
  // 居中显示第 index 个选项
  // 视窗高度 windowHeight，要让选项居中，它的 top 应该是 centerOffset
  const baseOffset = -reel.options.length * itemHeight;
  reel.offset = baseOffset - (index * itemHeight) + centerOffset;
};

const handleStart = () => {
  if (isRolling.value) return;

  isRolling.value = true;
  isLeverPulled.value = true;
  showConfetti.value = false;
  showResult.value = false;

  // 取消震动代码
  // uni.vibrateShort({ type: 'medium' });

  setTimeout(() => {
    isLeverPulled.value = false;
  }, 400);

  // 依次启动滚轮
  reels.forEach((reel, idx) => {
    setTimeout(() => {
      startRolling(idx);
    }, idx * 150);
  });
};

const startRolling = (idx) => {
  const reel = reels[idx];
  reel.isRolling = true;
  
  let speed = 12;
  const maxSpeed = 35;
  const acceleration = 0.8;
  
  if (reel.timer) clearInterval(reel.timer);
  
  reel.timer = setInterval(() => {
    if (!reel.isRolling) {
      clearInterval(reel.timer);
      reel.timer = null;
      return;
    }
    
    reel.offset += speed;
    if (speed < maxSpeed) speed += acceleration;

    // 循环逻辑：当滚动超过一组选项时，重置位置
    const groupHeight = reel.options.length * itemHeight;
    if (reel.offset > 0) {
      reel.offset -= groupHeight;
    }
  }, 16); // 约 60fps

  // 随机停止时间
  const stopDelay = 2500 + (idx * 1000);
  setTimeout(() => {
    stopRolling(idx);
  }, stopDelay);
};

const stopRolling = (idx) => {
  const reel = reels[idx];
  reel.isRolling = false;

  // 随机选择一个目标索引
  const targetIndex = Math.floor(Math.random() * reel.options.length);
  reel.currentIndex = targetIndex;

  // 平滑对齐到目标位置
  updateReelOffset(reel, targetIndex);
  
  // 取消震动代码
  // uni.vibrateShort({ type: 'light' });

  // 检查是否全部停止
  if (idx === reels.length - 1) {
    setTimeout(() => {
      isRolling.value = false;
      showConfetti.value = true;
      // 取消震动代码
      // uni.vibrateLong();
      
      setTimeout(() => {
        showResult.value = true;
      }, 500);
    }, 800);
  }
};
</script>

<style scoped>
.slot-machine-page {
  height: 100vh;
  background-color: #0F172A;
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

.glow-circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.15;
}

.circle-1 { top: 10%; left: -10%; width: 400px; height: 400px; background: var(--primary-color, #4F46E5); }
.circle-2 { bottom: 10%; right: -10%; width: 300px; height: 300px; background: #7C3AED; }

.machine-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 80rpx 0 40rpx; /* 增加右侧间距为滑杆留出空间 */
  position: relative;
  z-index: 1;
  box-sizing: border-box;
}

/* 老虎机主体外壳 */
.machine-body {
  background: #1E293B;
  border-radius: 48rpx;
  padding: 30rpx;
  border: 8rpx solid #334155;
  box-shadow: 
    0 30px 60px rgba(0,0,0,0.6),
    inset 0 4px 8px rgba(255,255,255,0.1);
  position: relative;
  width: 100%;
  max-width: 500rpx; /* 进一步缩小宽度以适配小屏 */
}

.machine-header {
  height: 80rpx;
  background: #0F172A;
  border-radius: 20rpx;
  margin-bottom: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border: 2rpx solid #334155;
}

.header-text {
  color: #FACC15;
  font-size: 28rpx;
  font-weight: 900;
  letter-spacing: 4rpx;
  text-shadow: 0 0 10rpx rgba(250, 204, 21, 0.5);
}

.header-lights {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: space-between;
  padding: 0 20rpx;
  align-items: center;
  pointer-events: none;
}

.h-light {
  width: 8rpx;
  height: 8rpx;
  background: #FACC15;
  border-radius: 50%;
  box-shadow: 0 0 10rpx #FACC15;
  animation: blink 0.5s infinite alternate;
}

.h-light:nth-child(even) { animation-delay: 0.25s; }

@keyframes blink { from { opacity: 0.3; } to { opacity: 1; } }

.neon-frame {
  background: #0F172A;
  border-radius: 32rpx;
  padding: 16rpx;
  border: 4rpx solid #334155;
  position: relative;
  transition: all 0.3s;
}

.neon-frame.is-active {
  border-color: var(--primary-color, #4F46E5);
  box-shadow: 0 0 30rpx var(--primary-glow, rgba(79, 70, 229, 0.4));
}

.reels-window {
  display: flex;
  background: #fff;
  border-radius: 20rpx;
  height: 140px; /* 显著降低高度，只突出显示中间项 */
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 10px 20px rgba(0,0,0,0.2);
}

.reel-column {
  flex: 1;
  height: 100%;
  position: relative;
  border-right: 2rpx solid #E2E8F0;
}

.reel-column:last-child { border-right: none; }

.reel-strip {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.reel-strip.is-blur {
  filter: blur(6px);
}

.option-item {
  height: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
}

.opt-emoji { font-size: 56rpx; }
.opt-label { font-size: 22rpx; font-weight: 800; color: #64748B; }

/* 3D 弧形遮罩 - 强化虚化和遮挡效果 */
.reel-3d-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, 
    rgba(0,0,0,0.95) 0%, 
    rgba(0,0,0,0.6) 15%, 
    transparent 40%, 
    transparent 60%, 
    rgba(0,0,0,0.6) 85%, 
    rgba(0,0,0,0.95) 100%
  );
  pointer-events: none;
  z-index: 4;
}

.glass-reflection {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, 
    rgba(255,255,255,0.15) 0%, 
    transparent 40%, 
    transparent 60%, 
    rgba(255,255,255,0.05) 100%
  );
  pointer-events: none;
  z-index: 5;
}

.center-line {
  position: absolute;
  top: 68px; /* 居中于 140px 视窗 */
  left: 0;
  right: 0;
  height: 4rpx;
  background: rgba(244, 63, 94, 0.6);
  box-shadow: 0 0 15rpx rgba(244, 63, 94, 0.4);
  z-index: 10;
  pointer-events: none;
}

.machine-footer {
  height: 60rpx;
  margin-top: 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20rpx;
}

.coin-slot {
  width: 60rpx;
  height: 12rpx;
  background: #0F172A;
  border-radius: 6rpx;
  border: 2rpx solid #334155;
}

.speaker-grill {
  width: 100rpx;
  height: 20rpx;
  background-image: radial-gradient(#334155 20%, transparent 20%);
  background-size: 8rpx 8rpx;
}

/* 重新设计的拉杆系统 */
.lever-system {
  position: absolute;
  right: -40rpx; /* 稍微向内移动一点 */
  top: 50%;
  transform: translateY(-50%);
  width: 80rpx;
  height: 300rpx;
  z-index: 10;
}

.lever-base-plate {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 30rpx;
  height: 100rpx;
  background: linear-gradient(to right, #334155, #1E293B);
  border-radius: 0 12rpx 12rpx 0;
  border: 2rpx solid #475569;
}

.lever-arm-container {
  position: absolute;
  left: 15rpx;
  top: 50%;
  transform-origin: left center;
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  transform: rotate(-40deg);
}

.lever-arm-container.is-pulled {
  transform: rotate(50deg);
}

.lever-shaft {
  width: 120rpx;
  height: 16rpx;
  background: #94A3B8;
  border-radius: 8rpx;
  position: relative;
  box-shadow: 0 4rpx 8rpx rgba(0,0,0,0.3);
}

.shaft-highlight {
  position: absolute;
  top: 2rpx;
  left: 0;
  right: 0;
  height: 4rpx;
  background: rgba(255,255,255,0.4);
  border-radius: 2rpx;
}

.lever-head {
  position: absolute;
  right: -30rpx;
  top: -22rpx;
  width: 60rpx;
  height: 60rpx;
  background: radial-gradient(circle at 30% 30%, #EF4444, #991B1B);
  border-radius: 50%;
  box-shadow: 
    0 8rpx 16rpx rgba(0,0,0,0.4),
    inset -4rpx -4rpx 8rpx rgba(0,0,0,0.3);
  border: 2rpx solid rgba(255,255,255,0.1);
}

.action-zone {
  padding: 40rpx;
  display: flex;
  flex-direction: column;
  gap: 30rpx;
  z-index: 1;
  align-items: center;
}

.info-card {
  background: rgba(255,255,255,0.03);
  border-radius: 32rpx;
  padding: 30rpx;
  border: 1px solid rgba(255,255,255,0.05);
  text-align: center;
  width: 100%;
}

.info-title {
  font-size: 24rpx;
  font-weight: 700;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 2rpx;
  margin-bottom: 20rpx;
  display: block;
}

.result-preview {
  display: flex;
  justify-content: center;
  gap: 16rpx;
}

.res-tag {
  background: #1E293B;
  color: #fff;
  padding: 8rpx 20rpx;
  border-radius: 12rpx;
  font-size: 24rpx;
  font-weight: 800;
  border: 1px solid rgba(255,255,255,0.1);
}

/* 按钮样式 */
.spin-btn-wrapper { position: relative; width: 280px; margin-top: 10px; }
.main-spin-btn { 
  width: 100%; height: 80px; background: #1E293B; border-radius: 32px; border: none; 
  display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  z-index: 2;
}
.main-spin-btn:active:not(:disabled) { transform: scale(0.95); background: #0F172A; }
.main-spin-btn.is-spinning { background: #475569; opacity: 0.8; transform: scale(0.98); }
.btn-label { color: #fff; font-size: 19px; font-weight: 900; letter-spacing: 2px; }

.btn-shadow-aura {
  position: absolute; inset: 10px; background: var(--primary-color, #4F46E5); filter: blur(30px); opacity: 0.2; z-index: 1;
  transition: all 0.4s;
}
.is-spinning + .btn-shadow-aura { opacity: 0.1; transform: scale(0.9); }

/* Confetti */
.confetti-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 100;
}

.confetti {
  position: absolute;
  width: 10rpx;
  height: 20rpx;
  background: #818CF8;
  top: -20rpx;
  opacity: 0;
}

.c-1 { left: 10%; animation: fall 3s infinite 0.1s; background: #F43F5E; }
.c-2 { left: 20%; animation: fall 3.5s infinite 0.5s; background: #10B981; }
.c-3 { left: 30%; animation: fall 2.8s infinite 0.2s; background: #F59E0B; }
.c-4 { left: 40%; animation: fall 4s infinite 0.8s; background: #6366F1; }
.c-5 { left: 50%; animation: fall 3.2s infinite 0.3s; background: #EC4899; }
.c-6 { left: 60%; animation: fall 3.8s infinite 0.6s; background: #06B6D4; }
.c-7 { left: 70%; animation: fall 3s infinite 0.4s; background: #8B5CF6; }
.c-8 { left: 80%; animation: fall 3.6s infinite 0.7s; background: #10B981; }
.c-9 { left: 90%; animation: fall 3.1s infinite 0.2s; background: #F43F5E; }

@keyframes fall {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}

.animate-fade-in { animation: fadeIn 0.8s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10rpx); } to { opacity: 1; transform: translateY(0); } }
</style>
