
<template>
  <view class="bomb-page" :class="[themeClass, { 'is-danger': rangeDiff < 10, 'is-not-my-turn': !isMyTurn }]">
    <IosNav title="面对面·数字炸弹" @leftClick="goBack" />

    <!-- 1. 玩家状态栏：显示谁在场，谁在动 -->
    <view class="player-orchestra">
      <view 
        v-for="(p, index) in players" 
        :key="p.id" 
        class="player-pod"
        :class="{ 'is-active': currentIdx === index, 'is-eliminated': p.isDead }"
      >
        <view class="pod-inner">
          <image :src="p.avatar" class="p-avt" />
          <view class="turn-halo" v-if="currentIdx === index"></view>
          <view class="death-x" v-if="p.isDead">💥</view>
        </view>
        <text class="p-name">{{ p.name }}</text>
        <!-- 个人倒计时微型环 -->
        <view v-if="currentIdx === index && !isGameOver" class="pod-timer">
          <text class="t-sec">{{ timeLeft }}s</text>
        </view>
      </view>
    </view>

    <view class="game-core">
      <!-- 2. 范围展示区 -->
      <view class="range-display animate-fade-in">
        <view class="range-box">
          <view class="num-wrapper" :key="'min-' + min">
            <text class="r-num">{{ min }}</text>
          </view>
          <text class="r-sep"></text>
          <view class="target-zone">
            <text class="r-target">?</text>
            <view class="pulse-aura"></view>
          </view>
          <text class="r-sep"></text>
          <view class="num-wrapper" :key="'max-' + max">
            <text class="r-num">{{ max }}</text>
          </view>
        </view>
        
        <view class="range-visual-track">
          <view class="track-active" :style="{ left: min + '%', right: (100 - max) + '%' }"></view>
        </view>
        
        <view class="turn-announcer">
          <text class="announcer-txt" v-if="!isGameOver">
            轮到 <text class="highlight">{{ players[currentIdx].name }}</text> 拆弹
          </text>
          <text class="announcer-txt danger" v-else>游戏已结束</text>
        </view>
      </view>

      <!-- 3. 炸弹视觉 -->
      <view class="bomb-visual" :class="{ 'exploding': isGameOver, 'shaking': currentInput.length > 0 }">
        <view class="bomb-body">
           <text class="bomb-emoji">{{ isGameOver ? '💥' : '💣' }}</text>
           <view v-if="!isGameOver" class="fuse-spark"></view>
        </view>
      </view>

      <!-- 4. 输入回显 -->
      <view class="input-echo-area">
        <view class="input-echo" :class="{ 'has-val': currentInput.length > 0, 'invalid': !isValidInput && currentInput.length > 0 }">
          <text class="echo-txt">{{ currentInput || (isMyTurn ? '请输入' : '等待对方...') }}</text>
          <view class="cursor" v-if="isMyTurn && !isGameOver"></view>
        </view>
      </view>
    </view>

    <!-- 5. 交互键盘：非自己回合时显示禁用遮罩 -->
    <view class="keypad-container">
      <!-- 禁用遮罩层 -->
      <view v-if="!isMyTurn && !isGameOver" class="disabled-overlay animate-fade-in">
        <view class="lock-card">
          <text class="lock-emoji">⏳</text>
          <text class="lock-msg">请等待 {{ players[currentIdx].name }} 操作</text>
        </view>
      </view>

      <view class="custom-keypad">
        <view class="key-grid">
          <view v-for="n in [1,2,3,4,5,6,7,8,9]" :key="n" class="key" @click="pressKey(n)">{{ n }}</view>
          <view class="key clear" @click="currentInput = ''">C</view>
          <view class="key" @click="pressKey(0)">0</view>
          <view class="key back" @click="backspace">←</view>
        </view>
        <button 
          class="submit-btn" 
          :disabled="!isValidInput || isGameOver || !currentInput" 
          :class="{ 'can-submit': isValidInput && currentInput }"
          @click="handleGuess"
        >
          <text>确认数字</text>
        </button>
      </view>
    </view>

    <!-- 结果弹窗 -->
    <view v-if="isGameOver" class="result-mask animate-fade-in" @click="reset">
      <view class="result-card animate-pop">
         <image :src="players[currentIdx].avatar" class="winner-avt" />
         <text class="res-h">{{ players[currentIdx].name }} 踩中了！</text>
         <text class="res-n">{{ bombNumber }}</text>
         <button class="retry-btn" @click.stop="reset">重新开始</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { useAppTheme } from '@/common/themes/useAppTheme.js'
const { themeClass, primaryColor, softColor, theme } = useAppTheme()

import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import IosNav from '../../components/nav/ios-nav.vue';

// 模拟面对面玩家数据
const players = reactive([
  { id: 1, name: '王先生', avatar: 'https://i.pravatar.cc/150?u=1', isDead: false },
  { id: 2, name: '李太太', avatar: 'https://i.pravatar.cc/150?u=2', isDead: false },
  { id: 3, name: '小王', avatar: 'https://i.pravatar.cc/150?u=3', isDead: false }
]);

const currentIdx = ref(0);
const min = ref(0);
const max = ref(100);
const bombNumber = ref(0);
const currentInput = ref('');
const isGameOver = ref(false);
const timeLeft = ref(10);
let timer = null;

const rangeDiff = computed(() => max.value - min.value);
// 这里模拟“我的回合”判断。在真实 WebSocket 中，通过 userId 匹配。
// 在面对面模式下，我们可以默认“当前正在操作的人”就是“我”，UI 负责提醒传给下一个人。
const isMyTurn = computed(() => !isGameOver.value); 

const isValidInput = computed(() => {
  const val = parseInt(currentInput.value);
  return val > min.value && val < max.value;
});

const goBack = () => uni.navigateBack();

onMounted(() => reset());
onUnmounted(() => stopTimer());

const reset = () => {
  min.value = 0;
  max.value = 100;
  bombNumber.value = Math.floor(Math.random() * 98) + 1;
  currentInput.value = '';
  isGameOver.value = false;
  currentIdx.value = 0;
  players.forEach(p => p.isDead = false);
  startTurn();
};

const startTurn = () => {
  stopTimer();
  timeLeft.value = 10;
  uni.vibrateShort({ type: 'medium' });
  timer = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--;
    } else {
      autoGuess();
    }
  }, 1000);
};

const stopTimer = () => {
  if (timer) clearInterval(timer);
};

// 超时自动猜一个有效数字
const autoGuess = () => {
  currentInput.value = (min.value + 1).toString();
  handleGuess();
};

const pressKey = (n) => {
  if (isGameOver.value || currentInput.value.length >= 3) return;
  currentInput.value += n;
  uni.vibrateShort({ type: 'light' });
};

const backspace = () => {
  currentInput.value = currentInput.value.slice(0, -1);
};

const handleGuess = () => {
  const val = parseInt(currentInput.value);
  if (val === bombNumber.value) {
    isGameOver.value = true;
    players[currentIdx.value].isDead = true;
    stopTimer();
    uni.vibrateLong();
  } else {
    // 缩小范围
    if (val > bombNumber.value) max.value = val;
    else min.value = val;
    
    currentInput.value = '';
    // 轮到下一位
    currentIdx.value = (currentIdx.value + 1) % players.length;
    startTurn();
  }
};
</script>

<style scoped>
.bomb-page { height: 100vh; background-color: #F8FAFC; display: flex; flex-direction: column; overflow: hidden; }
.bomb-page.is-danger { background-color: #FEF2F2; }

/* 玩家头像阵列 */
.player-orchestra {
  display: flex; justify-content: center; gap: 30rpx; padding: 30rpx 0;
  background: #fff; border-bottom: 1rpx solid #F1F5F9;
}
.player-pod { display: flex; flex-direction: column; align-items: center; position: relative; width: 120rpx; transition: all 0.3s; }
.pod-inner { position: relative; width: 90rpx; height: 90rpx; z-index: 2; }
.m-avt { width: 100%; height: 100%; border-radius: 30rpx; border: 4rpx solid #fff; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05); }
.is-active { transform: scale(1.1); }
.is-active .p-name { color: var(--primary-color, #4F46E5); font-weight: 900; }

.turn-halo {
  position: absolute; inset: -10rpx; border-radius: 35rpx;
  border: 4rpx solid var(--primary-color, #4F46E5); animation: rotateHalo 3s linear infinite;
}
@keyframes rotateHalo { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.pod-timer {
  position: absolute; top: -10rpx; right: -10rpx; background: var(--primary-color, #4F46E5);
  width: 40rpx; height: 40rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  border: 4rpx solid #fff; z-index: 10;
}
.t-sec { color: #fff; font-size: 18rpx; font-weight: 900; }

.p-name { font-size: 20rpx; font-weight: 700; color: #94A3B8; margin-top: 10rpx; }

/* 游戏核心区 */
.game-core { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: space-around; padding: 10px 40px; }

.range-display { text-align: center; width: 100%; }
.range-box { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 8px; }
.r-num { font-size: 44rpx; font-weight: 900; color: #1E293B; }
.r-target { font-size: 50rpx; font-weight: 900; color: var(--primary-color, #4F46E5); }

.range-visual-track { width: 100%; height: 8rpx; background: #E2E8F0; border-radius: 10rpx; position: relative; overflow: hidden; margin: 10px 0; }
.track-active { position: absolute; top: 0; bottom: 0; background: var(--primary-color, #4F46E5); transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }

.turn-announcer { padding: 4rpx 20rpx; background: var(--primary-glow, rgba(79, 70, 229, 0.05)); border-radius: 100rpx; }
.announcer-txt { font-size: 22rpx; font-weight: 800; color: #64748B; }
.highlight { color: var(--primary-color, #4F46E5); font-weight: 900; }

.bomb-visual { position: relative; width: 120rpx; height: 120rpx; }
.bomb-emoji { font-size: 90rpx; }

/* 输入反馈 */
.input-echo { height: 80rpx; display: flex; align-items: center; gap: 8rpx; padding: 0 30rpx; background: #fff; border-radius: 100rpx; border: 2rpx solid #F1F5F9; }
.echo-txt { font-size: 28rpx; font-weight: 900; color: #CBD5E1; }
.has-val .echo-txt { color: #1E293B; }
.cursor { width: 4rpx; height: 30rpx; background: var(--primary-color, #4F46E5); border-radius: 100rpx; animation: blink 1s infinite; }

/* 键盘容器与锁定遮罩 */
.keypad-container { position: relative; }
.disabled-overlay {
  position: absolute; inset: 0; z-index: 100;
  background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(4rpx);
  display: flex; align-items: center; justify-content: center;
  border-radius: 40rpx 40rpx 0 0;
}
.lock-card { background: #1E293B; padding: 30rpx 50rpx; border-radius: 30rpx; display: flex; flex-direction: column; align-items: center; gap: 15rpx; box-shadow: 0 10rpx 30rpx rgba(0,0,0,0.1); }
.lock-emoji { font-size: 40rpx; }
.lock-msg { color: #fff; font-size: 24rpx; font-weight: 900; }

.custom-keypad { background: #fff; border-radius: 40rpx 40rpx 0 0; padding: 20px; box-shadow: 0 -10rpx 40rpx rgba(0,0,0,0.05); }
.key-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10rpx; margin-bottom: 15rpx; }
.key { height: 60rpx; background: #F8FAFC; border-radius: 16rpx; display: flex; align-items: center; justify-content: center; font-size: 22rpx; font-weight: 900; color: #334155; }
.key.clear { color: #F43F5E; }

.submit-btn { width: 100%; height: 70rpx; background: #F1F5F9; border-radius: 20rpx; color: #94A3B8; font-size: 24rpx; font-weight: 900; border: none; display: flex; align-items: center; justify-content: center; }
.submit-btn.can-submit { background: #1E293B; color: #fff; }

/* 结果 */
.result-card { background: #fff; border-radius: 50rpx; padding: 50rpx; text-align: center; width: 320px; }
.winner-avt { width: 120rpx; height: 120rpx; border-radius: 40rpx; margin-bottom: 20rpx; border: 6rpx solid #FEE2E2; }
.res-n { font-size: 100rpx; font-weight: 900; color: #F43F5E; margin: 20rpx 0; display: block; }
.retry-btn { background: #1E293B; color: #fff; border-radius: 20rpx; font-weight: 900; width: 100%; height: 80rpx; }

@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
.animate-fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>
