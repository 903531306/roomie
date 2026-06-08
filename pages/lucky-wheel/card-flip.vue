<template>
  <view :class="themeClass" class="card-flip-page">
    <IosNav title="幸运翻牌" @leftClick="goBack" />

    <!-- 氛围背景 -->
    <view class="ambient-bg">
      <view class="glow-orb orb-1"></view>
      <view class="glow-orb orb-2"></view>
      <view class="particles">
        <view v-for="i in 20" :key="i" class="particle" :style="particleStyles[i-1]"></view>
      </view>
    </view>

    <view class="content-area">
      <view class="header-section animate-fade-in">
        <text class="h1">命运之选</text>
        <text class="p">闭上眼，听从直觉的召唤</text>
      </view>

      <!-- 卡牌阵列 - 恢复为 2 列，但优化尺寸以确保整体布局紧凑 -->
      <scroll-view scroll-y class="scroll-container">
        <view class="cards-grid" :class="{ 'is-shuffling': isShuffling }">
          <view 
            v-for="(card, index) in cards" 
            :key="card.id"
            class="card-container"
            :style="cardPositions[index]"
            @click="handleCardClick(index)"
          >
            <view class="card-inner" :class="{ 'is-flipped': card.isFlipped }">
              <!-- 卡牌背面 -->
              <view class="card-face card-back">
                <view class="back-design">
                  <view class="ornament top-left"></view>
                  <view class="ornament top-right"></view>
                  <view class="ornament bottom-left"></view>
                  <view class="ornament bottom-right"></view>
                  <view class="center-seal">
                    <view class="seal-ring"></view>
                    <text class="seal-icon">✧</text>
                  </view>
                </view>
                <view class="card-texture"></view>
              </view>
              
              <!-- 卡牌正面 -->
              <view class="card-face card-front">
                <view class="front-design">
                  <view class="ornament top-left"></view>
                  <view class="ornament top-right"></view>
                  <view class="ornament bottom-left"></view>
                  <view class="ornament bottom-right"></view>
                </view>
                <view class="front-glow"></view>
                <view class="front-content">
                  <view class="emoji-box">
                    <text class="front-emoji">{{ card.emoji }}</text>
                  </view>
                  <text class="front-label">{{ card.label }}</text>
                </view>
                <view class="front-footer">
                  <text class="footer-mark">DESTINY</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>

      <!-- 控制区 - 移出 scroll-view，确保在底部始终可见 -->
      <view class="action-zone">
        <view class="spin-btn-wrapper" @click="shuffleCards">
          <button 
            class="main-spin-btn" 
            :disabled="isShuffling || hasFlipped"
            :class="{ 'is-disabled': isShuffling || hasFlipped }"
          >
            <text class="btn-label">{{ isShuffling ? '正在洗牌...' : (hasFlipped ? '已揭晓' : '重新洗牌') }}</text>
          </button>
          <view class="btn-shadow-aura"></view>
        </view>
        
        <view v-if="hasFlipped" class="reset-hint animate-fade-in" @click="resetGame">
          <text class="reset-text">重置并重新洗牌</text>
        </view>
      </view>
    </view>

    <!-- 结果揭晓浮层 (替代原有的 ResultModal) -->
    <view v-if="showResultOverlay" class="result-overlay" @click="closeResult">
      <view class="overlay-backdrop"></view>
      <view class="reveal-card-wrap" @click.stop>
        <view class="reveal-card-inner" :class="{ 'is-flipped': isRevealing }">
          <!-- 背面 -->
          <view class="card-face card-back">
            <view class="back-design">
              <view class="ornament top-left"></view>
              <view class="ornament top-right"></view>
              <view class="ornament bottom-left"></view>
              <view class="ornament bottom-right"></view>
              <view class="center-seal">
                <view class="seal-ring"></view>
                <text class="seal-icon">✧</text>
              </view>
            </view>
          </view>
          <!-- 正面 -->
          <view class="card-face card-front">
            <view class="front-design">
              <view class="ornament top-left"></view>
              <view class="ornament top-right"></view>
              <view class="ornament bottom-left"></view>
              <view class="ornament bottom-right"></view>
            </view>
            <view class="front-glow"></view>
            <view class="front-content">
              <text class="reveal-emoji">{{ finalResult.emoji }}</text>
              <text class="reveal-label">{{ finalResult.label }}</text>
              <view class="result-badge">命运之选</view>
            </view>
            <view class="front-footer">
              <text class="footer-mark">DESTINY REVEALED</text>
            </view>
          </view>
        </view>
        
        <view class="confirm-btn animate-fade-in" @click="closeResult">
          <text class="confirm-text">收下这份灵感</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { useAppTheme } from '@/common/themes/useAppTheme.js'
const { themeClass, primaryColor, softColor, theme } = useAppTheme()

import { ref, reactive, onMounted, computed, onUnmounted } from 'vue';
import IosNav from '../../components/nav/ios-nav.vue';
import ResultModal from '../../components/common/ResultModal.vue';

const isShuffling = ref(false);
const hasFlipped = ref(false);
const showResultOverlay = ref(false);
const isRevealing = ref(false);
const finalResult = ref({});

const options = [
  { label: '洗碗一次', emoji: '🧼' },
  { label: '扫地拖地', emoji: '🧹' },
  { label: '买奶茶', emoji: '🧋' },
  { label: '免除惩罚', emoji: '✨' },
  { label: '真心话', emoji: '💬' },
  { label: '大冒险', emoji: '🏃' }
];

const cards = ref([]);
const cardPositions = ref([]);

const goBack = () => uni.navigateBack();

const particleStyles = Array.from({ length: 20 }).map(() => ({
  left: Math.random() * 100 + '%',
  top: Math.random() * 100 + '%',
  animationDelay: Math.random() * 5 + 's',
  opacity: Math.random() * 0.4 + 0.1,
  transform: `scale(${Math.random() * 0.5 + 0.5})`
}));

onMounted(() => {
  initCards();
  // 自动开始第一次洗牌
  setTimeout(() => {
    shuffleCards();
  }, 800);
});

const initCards = () => {
  const shuffledOptions = [...options].sort(() => Math.random() - 0.5);
  cards.value = shuffledOptions.map((opt, index) => ({
    ...opt,
    id: index,
    isFlipped: false
  }));
  resetPositions();
};

const resetPositions = () => {
  cardPositions.value = cards.value.map(() => ({
    transform: 'translate(0, 0) rotate(0deg)',
    transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
  }));
};

const shuffleCards = () => {
  if (isShuffling.value || hasFlipped.value) return;
  
  isShuffling.value = true;
  
  // 1. 聚拢并缩小
  cardPositions.value = cards.value.map(() => ({
    transform: 'translate(0, 0) scale(0.4) rotate(720deg)',
    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
  }));

  // 2. 疯狂乱序
  setTimeout(() => {
    cardPositions.value = cards.value.map(() => ({
      transform: `translate(${(Math.random() - 0.5) * 150}px, ${(Math.random() - 0.5) * 150}px) rotate(${(Math.random() - 0.5) * 360}deg) scale(0.6)`,
      transition: 'all 0.3s ease-in-out'
    }));
  }, 500);

  // 3. 再次乱序
  setTimeout(() => {
    cardPositions.value = cards.value.map(() => ({
      transform: `translate(${(Math.random() - 0.5) * 200}px, ${(Math.random() - 0.5) * 200}px) rotate(${(Math.random() - 0.5) * 720}deg) scale(0.5)`,
      transition: 'all 0.3s ease-in-out'
    }));
  }, 800);

  // 4. 优雅归位
  setTimeout(() => {
    resetPositions();
    isShuffling.value = false;
    // 重新打乱数据顺序
    const currentOptions = cards.value.map(c => ({ label: c.label, emoji: c.emoji }));
    currentOptions.sort(() => Math.random() - 0.5);
    cards.value.forEach((card, i) => {
      card.label = currentOptions[i].label;
      card.emoji = currentOptions[i].emoji;
      card.isFlipped = false;
    });
  }, 1300);
};

const handleCardClick = (index) => {
  if (isShuffling.value || hasFlipped.value || cards.value[index].isFlipped) return;
  
  // 记录点击的索引
  cards.value[index].isFlipped = true;
  hasFlipped.value = true;
  finalResult.value = cards.value[index];
  
  // 延迟一点点显示浮层，让原卡片的翻转动画先开始一点点，产生衔接感
  setTimeout(() => {
    showResultOverlay.value = true;
    // 这里的动画会从中心放大，配合原卡片的翻转，视觉上像是在飞向屏幕
    setTimeout(() => {
      isRevealing.value = true;
    }, 50);
  }, 150);
};

const closeResult = () => {
  showResultOverlay.value = false;
  isRevealing.value = false;
};

const resetGame = () => {
  hasFlipped.value = false;
  showResultOverlay.value = false;
  isRevealing.value = false;
  initCards();
  setTimeout(() => {
    shuffleCards();
  }, 100);
};
</script>

<style scoped>
.card-flip-page {
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
  opacity: 0.2;
}

.orb-1 { top: -10%; left: -10%; width: 500px; height: 500px; background: #1e1b4b; }
.orb-2 { bottom: -10%; right: -10%; width: 400px; height: 400px; background: #312e81; }

.particle {
  position: absolute;
  width: 4rpx;
  height: 4rpx;
  background: #fff;
  border-radius: 50%;
  animation: float 6s infinite ease-in-out;
}

@keyframes float {
  0%, 100% { transform: translateY(0) translateX(0); }
  50% { transform: translateY(-30px) translateX(15px); }
}

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  z-index: 1;
  height: 0; /* 允许 flex 增长 */
}

.header-section {
  text-align: center;
  padding: 20rpx 0 10rpx;
}

.h1 {
  font-size: 24px;
  font-weight: 900;
  color: #fff;
  letter-spacing: 2px;
  text-shadow: 0 0 20px rgba(255,255,255,0.2);
}

.p {
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  margin-top: 8px;
  letter-spacing: 1px;
}

.scroll-container {
  flex: 1;
  height: 0;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
  padding: 20rpx 40rpx;
  perspective: 1200px;
}

.card-container {
  aspect-ratio: 5/7;
  position: relative;
  cursor: pointer;
}

.card-inner {
  width: 100%;
  height: 100%;
  position: relative;
  transition: transform 1.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-style: preserve-3d;
}

.card-inner.is-flipped {
  transform: rotateY(540deg);
}

.card-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}

/* 卡牌背面 - 塔罗风格 */
.card-back {
  background: #1e1b4b;
  border: 4rpx solid #312e81;
  transform: translateZ(1px); /* 确保在 3D 空间中的层级 */
}

.back-design {
  position: absolute;
  inset: 20rpx;
  border: 2rpx solid rgba(99, 102, 241, 0.3);
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ornament {
  position: absolute;
  width: 30rpx;
  height: 30rpx;
  border: 2rpx solid rgba(99, 102, 241, 0.5);
}
.top-left { top: 10rpx; left: 10rpx; border-right: none; border-bottom: none; }
.top-right { top: 10rpx; right: 10rpx; border-left: none; border-bottom: none; }
.bottom-left { bottom: 10rpx; left: 10rpx; border-right: none; border-top: none; }
.bottom-right { bottom: 10rpx; right: 10rpx; border-left: none; border-top: none; }

.center-seal {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.seal-ring {
  width: 100rpx;
  height: 100rpx;
  border: 1rpx solid rgba(99, 102, 241, 0.4);
  border-radius: 50%;
  animation: rotate 10s linear infinite;
}

@keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.seal-icon {
  position: absolute;
  font-size: 48rpx;
  color: #6366f1;
  text-shadow: 0 0 15px rgba(99, 102, 241, 0.8);
}

.card-texture {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0);
  background-size: 10px 10px;
  pointer-events: none;
}

/* 卡牌正面 - 极简高级 */
.card-front {
  background: #ffffff;
  border: 4rpx solid #312e81; /* 使用与背面一致的深蓝边框 */
  transform: rotateY(180deg) translateZ(1px); /* 确保在 3D 空间中的层级 */
  flex-direction: column;
  justify-content: space-between;
  padding: 40rpx 20rpx;
}

.front-design {
  position: absolute;
  inset: 12rpx;
  border: 1rpx solid rgba(99, 102, 241, 0.2);
  border-radius: 24rpx;
  pointer-events: none;
}

.front-design .ornament {
  border-color: rgba(99, 102, 241, 0.3);
}

.front-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.1) 0%, transparent 70%);
  pointer-events: none;
}

.front-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 30rpx;
}

.emoji-box {
  width: 100rpx;
  height: 100rpx;
  background: #f8fafc;
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10rpx 20rpx rgba(0,0,0,0.05);
}

.front-emoji {
  font-size: 64rpx;
}

.front-label {
  font-size: 28rpx;
  font-weight: 900;
  color: #0f172a;
  text-align: center;
}

.front-footer {
  padding-bottom: 10rpx;
}

.footer-mark {
  font-size: 18rpx;
  font-weight: 800;
  color: #cbd5e1;
  letter-spacing: 4rpx;
}

.action-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx 0 40rpx;
  background: linear-gradient(to top, #020617 80%, transparent);
}

.spin-btn-wrapper { position: relative; width: 240px; }
.main-spin-btn { 
  width: 100%; height: 68px; background: #ffffff; border-radius: 34px; border: none; 
  display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  z-index: 2;
}
.main-spin-btn:active:not(:disabled) { transform: scale(0.96); background: #f1f5f9; }
.main-spin-btn.is-disabled { background: #1e293b; opacity: 0.6; transform: scale(0.98); }
.btn-label { color: #020617; font-size: 20px; font-weight: 900; letter-spacing: 2px; }

.btn-shadow-aura {
  position: absolute; inset: 10px; background: #6366f1; filter: blur(40px); opacity: 0.3; z-index: 1;
  transition: all 0.4s;
}

.reset-hint {
  padding: 20rpx;
}

.reset-text {
  font-size: 15px;
  font-weight: 700;
  color: #64748b;
  text-decoration: underline;
  text-underline-offset: 6px;
}

.animate-fade-in { animation: fadeIn 0.8s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10rpx); } to { opacity: 1; transform: translateY(0); } }

/* 结果揭晓浮层样式 */
.result-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 2000px;
}

.overlay-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(2, 6, 23, 0.85);
  backdrop-filter: blur(25px) saturate(150%);
  animation: fadeInBackdrop 0.6s ease-out both;
}

@keyframes fadeInBackdrop {
  from { opacity: 0; backdrop-filter: blur(0px); }
  to { opacity: 1; backdrop-filter: blur(25px); }
}

.reveal-card-wrap {
  width: 460rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40rpx;
  z-index: 10;
  animation: cardEntrance 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes cardEntrance {
  from { opacity: 0; transform: scale(0.3) translateY(100px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.reveal-card-inner {
  width: 100%;
  aspect-ratio: 5/7;
  position: relative;
  transition: transform 2.2s cubic-bezier(0.19, 1, 0.22, 1);
  transform-style: preserve-3d;
}

.reveal-card-inner.is-flipped {
  transform: rotateY(900deg) scale(1.0);
}

/* 强化卡牌正面的设计感 */
.reveal-card-inner .card-front {
  background: linear-gradient(165deg, #ffffff 0%, #f1f5f9 100%);
  border: 4rpx solid #312e81; /* 统一使用深蓝边框 */
  box-shadow: 
    0 40px 80px rgba(0,0,0,0.5),
    inset 0 0 60px rgba(99, 102, 241, 0.08);
  z-index: 2; /* 确保翻转后在上层 */
}

.reveal-card-inner .card-back {
  z-index: 1;
}

.reveal-emoji {
  font-size: 100rpx;
  margin-bottom: 20rpx;
  filter: drop-shadow(0 10px 20px rgba(0,0,0,0.1));
  animation: emojiPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 1.8s both;
}

@keyframes emojiPop {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.reveal-label {
  font-size: 40rpx;
  font-weight: 900;
  color: #0f172a; /* Fallback color */
  text-align: center;
  margin-bottom: 20rpx;
  letter-spacing: 2rpx;
  background: linear-gradient(to bottom, #1e293b, #0f172a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.result-badge {
  padding: 12rpx 36rpx;
  background: #1e1b4b;
  color: #a5b4fc;
  font-size: 22rpx;
  font-weight: 900;
  border-radius: 100px;
  letter-spacing: 6rpx;
  text-transform: uppercase;
  box-shadow: 0 4px 15rpx rgba(0,0,0,0.2);
}

.confirm-btn {
  padding: 34rpx 100rpx;
  background: #ffffff;
  border-radius: 100px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.5);
  transition: all 0.3s;
}

.confirm-btn:active {
  transform: scale(0.95);
  background: #f1f5f9;
}

.confirm-text {
  color: #020617;
  font-size: 34rpx;
  font-weight: 900;
  letter-spacing: 4rpx;
}
</style>
