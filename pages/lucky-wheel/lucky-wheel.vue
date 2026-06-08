<template>
  <view :class="themeClass" class="wheel-page">
    <IosNav 
      title="灵感决策盘" 
      @leftClick="goBack" 
      :showHome="showHomeBack"
    />

    <!-- 动态背景装饰 -->
    <view class="ambient-mesh">
      <view class="blob blob-1"></view>
      <view class="blob blob-2"></view>
    </view>

    <!-- 1. 加载中状态 -->
    <view v-if="isLoading" class="state-container">
      <view class="skeleton-wheel-wrap">
        <view class="sk-wheel shimmer"></view>
        <view class="sk-hub shimmer"></view>
      </view>
      <view class="sk-header-group">
        <view class="sk-title shimmer"></view>
        <view class="sk-subtitle shimmer"></view>
      </view>
      <view class="sk-btn shimmer"></view>
    </view>

    <!-- 2. 加载失败状态 -->
    <view v-else-if="isError" class="state-container animate-fade-in">
      <view class="error-visual">
        <view class="error-circle">📡</view>
        <view class="error-wave"></view>
      </view>
      <text class="error-title">数据加载遇到了障碍</text>
      <text class="error-desc">请检查您的网络连接并重试</text>
      <button class="retry-btn" @click="getData">重新尝试加载</button>
    </view>

    <!-- 3. 数据为空状态 -->
    <view v-else-if="wheelGroups.length === 0" class="state-container animate-fade-in">
      <view class="empty-visual">
        <text class="empty-emoji">🍃</text>
      </view>
      <text class="empty-title">暂时没有决策方案</text>
      <text class="empty-desc">去创建一个您喜欢的决策盘吧</text>
      <button class="retry-btn" style="margin-top: 20px;" @click="goToCustomize">立即创建</button>
    </view>

    <!-- 4. 正常渲染转盘 -->
    <swiper 
      v-else
      class="wheel-swiper" 
      vertical 
      :current="currentWheelIndex"
      @change="onWheelChange"
      :duration="600"
      easing-function="easeInOutCubic"
    >
      <swiper-item v-for="(wheel, wIdx) in wheelGroups" :key="wheel.id || wIdx">
        <view class="wheel-slice-content">
          
          <view class="hero-header animate-fade-in">
            <view class="title-row-edit">
              <text class="h1">{{ wheel.title }}</text>
            </view>
            <view class="p-wrap">
              <text class="p-dot"></text>
              <text class="p">{{ wheel.subtitle }}</text>
            </view>
          </view>

          <WheelDisk 
            :options="wheel.options" 
            :rotationAngle="rotationAngles[wIdx]" 
            :spinning="spinningStates[wIdx]" 
          />

          <view class="action-zone">
            <view class="spin-btn-wrapper" @click="startSpin(wIdx)">
              <button 
                class="main-spin-btn" 
                :disabled="spinningStates[wIdx]"
                :class="{ 'is-spinning': spinningStates[wIdx] }"
              >
                <text class="btn-label">{{ spinningStates[wIdx] ? '正在寻觅' : '开启旋转' }}</text>
              </button>
              <view class="btn-shadow-aura"></view>
            </view>

            <view class="swipe-hint animate-bounce">
              <text class="hint-icon">↓</text>
              <text class="hint-text">滑动切换其他生活决策</text>
            </view>
          </view>
        </view>
      </swiper-item>
    </swiper>

    <!-- 常驻悬浮创建按钮 (FAB) - 下移位置并更名为自定义 -->
    <view 
      v-if="!isLoading && !isError" 
      class="fab-create animate-pop-in" 
      :class="{ 'is-hidden': isAnySpinning }"
      @click="goToCustomize"
    >
      <view class="fab-inner">
        <text class="fab-icon">+</text>
        <text class="fab-text">自定义</text>
      </view>
    </view>

    <!-- 结果浮层 (组件版) -->
    <ResultModal 
      v-if="showResult" 
      :wheelTitle="currentWheelTitle"
      :resultName="finalResult.name"
      @close="showResult = false"
    />
  </view>
</template>

<script setup>
import { useAppTheme } from '@/common/themes/useAppTheme.js'
const { themeClass, primaryColor, softColor, theme } = useAppTheme()

import { ref, reactive, onMounted, onUnmounted, computed } from 'vue';
import IosNav from '../../components/nav/ios-nav.vue';
import WheelDisk from '../../components/lucky-wheel/WheelDisk.vue';
import ResultModal from '../../components/common/ResultModal.vue';
import { typeApi } from '../../common/api';
import { onLoad } from "@dcloudio/uni-app";

// import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'

import { useGlobalShare } from '../js/useGlobalShare.js';

/**
 * 
 * 
  案一：灵感老虎机 (Slot Machine)
玩法概念：
模仿经典的老虎机（拉霸机）形式。界面上有三个或更多滚轮，每个滚轮上都有不同的选项（比如：主食、口味、餐厅）。
趣味点： 极高的视觉期待感。用户点击“拉杆”或“开始”，滚轮快速滚动并伴随机械音效，最后依次停下凑成一个“决策组合”。
适用场景： 解决复杂的决策。例如“今天吃什么？”：
滚轮1：川菜 / 粤菜 / 日料 / 西餐
滚轮2：麻辣 / 清淡 / 酸甜 / 咸鲜
滚轮3：外卖 / 堂食 / 自己做
视觉效果： 霓虹灯边框、滚轮滚动的物理模糊效果、中奖时的粒子喷发



方案二：翻牌子 (Card Flip / Mystery Cards)
玩法概念：
屏幕上整齐排列着几张背面朝上的精美卡牌。用户根据直觉点击其中一张，卡牌翻转并展示背后的决策结果。
趣味点： 带有“翻牌”的仪式感和神秘感，类似塔罗牌或抽签。可以设置“洗牌”动画，让用户觉得结果是随机且公平的。
适用场景： 惩罚游戏、真心话大冒险、或者分配任务。
卡牌内容可以是：洗碗、扫地、买奶茶、免除惩罚等。
视觉效果： 3D 翻转动画、卡牌背面的精致纹理、翻开时的圣光或烟雾特效。

摇骰子”、“抽签桶”

 */

const newsId = ref(null);
const showHomeBack = ref(false);
const isLoading = ref(true);
const isError = ref(false);
const wheelGroups = ref([]);
const currentWheelIndex = ref(0);
const rotationAngles = reactive([]);
const spinningStates = reactive([]);
const showResult = ref(false);
const finalResult = ref({});
const duration = 5000;

const isAnySpinning = computed(() => spinningStates.some(s => s));
const currentWheelTitle = computed(() => wheelGroups.value[currentWheelIndex.value]?.title || '决策方案');

onLoad((options) => { 
	if(options && options.id){
		newsId.value = options.id;
	}
	const isShareByParam = options.from === 'share';
	let isShareByScene = false;
	// #ifdef MP-WEIXIN
	const { scene } = wx.getLaunchOptionsSync();
	isShareByScene = scene === 1007 || scene === 1008;
	// #endif
	showHomeBack.value = (isShareByParam || isShareByScene);
});

useGlobalShare({
  title: () => title.value || '灵感决策盘',
  path: () => wheelId.value ? `/pages/lucky-wheel/lucky-wheel?id=${wheelId.value}&from=share` : '/pages/lucky-wheel/lucky-wheel?from=share'
});

onMounted(() => {
  getData();
  uni.$on('wheel_updated', () => getData());
});

onUnmounted(() => uni.$off('wheel_updated'));

const getData = async () => {
  isLoading.value = true;
  isError.value = false;
  try {
    const res = await typeApi.getWheelList(newsId.value);
    if (res && res.code == 0) {
      wheelGroups.value = res.data || [];
	  title.value = wheelGroups.value[0].title;
	  wheelId.value = wheelGroups.value[0].id;
      initStates();
    } else {
      isError.value = true;
    }
  } catch (e) {
    isError.value = true;
  } finally {
    setTimeout(() => {
      isLoading.value = false;
    }, 800);
  }
};

const onShare=()=>{
	setTimeout(() => {
	  showResult.value=false;
	}, 2000);
}

const initStates = () => {
  rotationAngles.length = 0;
  spinningStates.length = 0;
  wheelGroups.value.forEach(() => {
    rotationAngles.push(0);
    spinningStates.push(false);
  });
};

const goBack = () => {
	if(showHomeBack.value) uni.reLaunch({ url:'/pages/index/index' });
	else uni.navigateBack();
};

const onWheelChange = (e) => {
  currentWheelIndex.value = e.detail.current;
  title.value = wheelGroups.value[currentWheelIndex.value].title;
  wheelId.value = wheelGroups.value[currentWheelIndex.value].id;
};

const title = ref(null);
const wheelId = ref(null);

const startSpin = (idx) => {
  if (spinningStates[idx]) return;
  
  title.value = wheelGroups.value[idx].title;
  wheelId.value = wheelGroups.value[idx].id;
  spinningStates[idx] = true;
  showResult.value = false;

  const options = wheelGroups.value[idx].options;
  const sectorAngle = 360 / options.length;
  const targetIndex = Math.floor(Math.random() * options.length);
  const extraRounds = 8 + Math.floor(Math.random() * 4); 
  const targetOffset = (targetIndex * sectorAngle) + (sectorAngle / 2);
  
  const baseAngle = rotationAngles[idx] - (rotationAngles[idx] % 360);
  const newAngle = baseAngle + (extraRounds * 360) + (360 - targetOffset);
  
  rotationAngles[idx] = newAngle;

  setTimeout(() => {
    spinningStates[idx] = false;
    finalResult.value = options[targetIndex];
    showResult.value = true;
  }, duration);
};

const goToCustomize = () => {
  const currentWheel = wheelGroups.value[currentWheelIndex.value];
  if (currentWheel) {
    // uni.setStorageSync('editing_wheel', currentWheel);
    uni.navigateTo({ url: '/pages/lucky-wheel/customize-wheel' });
  }
};
</script>

<style scoped>
.wheel-page { height: 100vh; background-color: #F8FAFC; overflow: hidden; position: relative; display: flex; flex-direction: column; }

/* 氛围背景 */
.ambient-mesh { position: absolute; inset: 0; z-index: 0; }
.blob { position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.1; }
.blob-1 { top: -10%; left: -10%; width: 400px; height: 400px; background: var(--primary-color, #4F46E5); }
.blob-2 { bottom: -5%; right: -5%; width: 300px; height: 300px; background: #7C3AED; }

.fab-create { position: fixed; bottom: 30px; right: 24px; z-index: 1000; transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.fab-create.is-hidden { opacity: 0.3; transform: scale(0.8) translateX(10px); pointer-events: none; }
.fab-inner { height: 60px; padding: 0 24px; background: linear-gradient(135deg, var(--primary-color, #4F46E5) 0%, #7C3AED 100%); border-radius: 30px; display: flex; align-items: center; gap: 10px; box-shadow: 0 15px 35px var(--primary-glow, rgba(79, 70, 229, 0.3)); border: 4px solid rgba(255, 255, 255, 0.2); }
.fab-inner:active { transform: scale(0.92); }
.fab-icon { font-size: 24px; color: #fff; font-weight: 300; }
.fab-text { font-size: 15px; font-weight: 900; color: #fff; letter-spacing: 1px; }

.state-container { flex: 1; height: 80vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; text-align: center; z-index: 10; }
.skeleton-wheel-wrap { position: relative; width: 280px; height: 280px; margin-bottom: 60px; }
.sk-wheel { width: 100%; height: 100%; border-radius: 50%; background: #F1F5F9; border: 10px solid #fff; }
.sk-hub { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 60px; height: 60px; background: #fff; border-radius: 50%; }
.sk-header-group { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 15px; margin-bottom: 50px; }
.sk-title { width: 180px; height: 28px; background: #F1F5F9; border-radius: 8px; }
.sk-subtitle { width: 120px; height: 14px; background: #F1F5F9; border-radius: 4px; }
.sk-btn { width: 240px; height: 74px; background: #F1F5F9; border-radius: 26px; }

.shimmer { position: relative; overflow: hidden; }
.shimmer::after { position: absolute; inset: 0; transform: translateX(-100%); background-image: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent); animation: shimmer 2s infinite; content: ''; }
@keyframes shimmer { 100% { transform: translateX(100%); } }

.error-visual { position: relative; margin-bottom: 40px; }
.error-circle { width: 100px; height: 100px; background: #FFF1F2; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 40px; z-index: 2; position: relative; }
.error-wave { position: absolute; inset: -10px; border: 2px solid #FECACA; border-radius: 50%; animation: errorPulse 2s infinite; }
@keyframes errorPulse { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(1.4); opacity: 0; } }
.error-title { font-size: 20px; font-weight: 900; color: #1E293B; margin-bottom: 12px; }
.error-desc { font-size: 14px; font-weight: 700; color: #94A3B8; margin-bottom: 40px; }
.retry-btn { background: #1E293B; color: #fff; padding: 12px 30px; border-radius: 100px; font-size: 14px; font-weight: 800; border: none; }

.wheel-swiper { width: 100%; flex: 1; z-index: 1; height: 0; }
.wheel-slice-content { height: 100%; display: flex; flex-direction: column; padding: 20rpx 0 40rpx; box-sizing: border-box; }
.hero-header { text-align: center; margin-bottom: 40px; }
.h1 { font-size: 28px; font-weight: 900; color: #0F172A; letter-spacing: -1px; }
.p-wrap { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 8px; }
.p-dot { width: 6px; height: 6px; background: var(--primary-color, #4F46E5); border-radius: 50%; }
.p { font-size: 14px; font-weight: 700; color: #94A3B8; letter-spacing: 0.5px; }

.action-zone { margin-top: 60px; display: flex; flex-direction: column; align-items: center; gap: 30px; }
.spin-btn-wrapper { position: relative; width: 240px; }
.main-spin-btn { width: 100%; height: 74px; background: #1E293B; border-radius: 26px; border: none; display: flex; align-items: center; justify-content: center; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); position: relative; z-index: 2; }
.main-spin-btn:active:not(:disabled) { transform: scale(0.95); background: #0F172A; }
.main-spin-btn.is-spinning { background: #475569; opacity: 0.8; transform: scale(0.98); }
.btn-label { color: #fff; font-size: 18px; font-weight: 900; letter-spacing: 2px; }

.animate-fade-in { animation: fadeIn 0.8s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-pop { animation: pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) both; }
@keyframes pop { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
.animate-bounce { animation: bounce 2.5s infinite; }
@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
.animate-pop-in { animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both; }
@keyframes popIn { from { opacity: 0; transform: scale(0.8) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
</style>
