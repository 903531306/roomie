
<template>
  <view :class="themeClass" class="story-root" @click="handleScreenTap">
    <!-- 动态背景 -->
    <view class="story-bg-layer" :style="{ background: currentSlide.bg }">
      <view class="golden-orb orb-1 animate-drift-1"></view>
      <view class="golden-orb orb-2 animate-drift-2"></view>
      <view class="noise-overlay"></view>
    </view>

    <!-- 顶部进度条 - 更细更精致 -->
    <view class="story-progress">
      <view v-for="(s, i) in slides" :key="i" class="track">
        <view 
          class="fill" 
          :style="{ 
            width: activeIndex > i ? '100%' : (activeIndex === i ? progressWidth + '%' : '0%'),
            transition: activeIndex === i ? 'none' : 'width 0.3s ease'
          }"
        ></view>
      </view>
    </view>

    <!-- 极简顶栏 -->
    <view class="header-nav">
      <view class="nav-left">
        <text class="brand-mini">FAMILYLINK</text>
        <text class="divider">|</text>
        <text class="month-pill">11月报告</text>
      </view>
      <view class="close-btn" @click.stop="goBack">✕</view>
    </view>

    <!-- 内容舞台 - 确保单屏且不溢出 -->
    <view class="main-stage">
      
      <!-- Slide 0: 封面 - 紧凑奢华 -->
      <view v-if="activeIndex === 0" class="page-wrap animate-fade-in">
        <view class="intro-group">
          <text class="year-label">NOVEMBER 2024</text>
          <view class="title-row">
            <text class="h-main">月度</text>
            <text class="h-italic">INSIGHT</text>
          </view>
        </view>
        
        <view class="hero-center-box animate-scale-in">
          <view class="glass-orb-bg"></view>
          <text class="data-label">本月家庭总支出</text>
          <view class="price-display">
            <text class="p-sym">¥</text>
            <text class="p-int">12,850</text>
            <text class="p-dec">.20</text>
          </view>
          <view class="data-badge">
            <text class="badge-txt">数据已由 AI 加密汇总</text>
          </view>
        </view>

        <view class="footer-hint">
          <text class="hint-txt">点击右侧继续 ›</text>
        </view>
      </view>

      <!-- Slide 1: 趋势对比 - 左右结构更省空间 -->
      <view v-if="activeIndex === 1" class="page-wrap animate-fade-in">
        <view class="page-header">
          <text class="ph-sub">TRENDS</text>
          <text class="ph-main">收支波动趋势</text>
        </view>

        <view class="trend-compact-card animate-slide-up">
          <view class="tc-side">
            <view class="tc-val-box">
              <text class="tc-percent">-8.5%</text>
              <text class="tc-label">较上月支出</text>
            </view>
          </view>
          <view class="tc-main">
            <text class="tc-quote">“本月我们在餐饮上表现出色，累计节省了近 1,200 元开支。”</text>
            <view class="tc-footer">
              <view class="mini-tag">理性消费</view>
            </view>
          </view>
        </view>
      </view>

      <!-- Slide 2: 消费矩阵 - 紧凑 Bento -->
      <view v-if="activeIndex === 2" class="page-wrap animate-fade-in">
        <view class="page-header">
          <text class="ph-sub">CATEGORIES</text>
          <text class="ph-main">资金流向图谱</text>
        </view>

        <view class="compact-bento-grid">
          <view class="bento-cell main animate-pop" style="animation-delay: 0.1s">
            <text class="bc-emoji">🏢</text>
            <view class="bc-info">
              <text class="bc-label">房租/物业</text>
              <text class="bc-val">¥5,500</text>
            </view>
            <view class="bc-progress-bar"><view class="bc-fill" style="width: 60%"></view></view>
          </view>
          <view class="bento-cell sub animate-pop" style="animation-delay: 0.2s">
            <text class="bc-emoji">🍱</text>
            <text class="bc-label">餐饮</text>
            <text class="bc-val">¥3,200</text>
          </view>
          <view class="bento-cell sub animate-pop" style="animation-delay: 0.3s">
            <text class="bc-emoji">🚗</text>
            <text class="bc-label">出行</text>
            <text class="bc-val">¥1,140</text>
          </view>
        </view>
      </view>

      <!-- Slide 3: 成员 MVP - 勋章风格 -->
      <view v-if="activeIndex === 3" class="page-wrap center-all">
        <view class="mvp-badge-card animate-scale-in">
          <view class="mvp-shine"></view>
          <view class="mvp-content">
            <view class="mvp-avt-box">
              <image src="https://i.pravatar.cc/200?u=mom" class="mvp-img" />
              <view class="mvp-crown">👑</view>
            </view>
            <view class="mvp-texts">
              <text class="mvp-name">李太太</text>
              <view class="mvp-honor-pill">首席记账能手</view>
              <text class="mvp-desc">本月记录 42 笔明细，为家庭财务透明化做出巨大贡献！</text>
            </view>
          </view>
        </view>
      </view>

      <!-- Slide 4: AI 建议与结语 -->
      <view v-if="activeIndex === 4" class="page-wrap center-all">
        <view class="ai-compact-bubble animate-spring-up">
          <view class="ai-head">
            <text class="ai-spark">✨</text>
            <text class="ai-title">AI 财务建议</text>
          </view>
          <text class="ai-msg">“11月财务状态评分为 92。建议将本月节省的 ¥1,200 投入家庭教育基金，以保持长期的资产增值。”</text>
        </view>
        
        <view class="action-footer animate-slide-up" style="animation-delay: 0.3s">
          <button class="btn-primary" @click.stop="onShare">生成月度纪念海报</button>
          <button class="btn-outline" @click.stop="goBack">完成回顾</button>
        </view>
      </view>

    </view>

    <!-- 固定页脚 -->
    <view class="footer-brand-info">
      <text>INSIGHT REPORT 2024</text>
    </view>
  </view>
</template>

<script setup>
import { useAppTheme } from '@/common/themes/useAppTheme.js'
const { themeClass, primaryColor, softColor, theme } = useAppTheme()

import { ref, onMounted, onUnmounted, computed } from 'vue';

const activeIndex = ref(0);
const progressWidth = ref(0);
const SLIDE_DURATION = 5500;
let timer = null;

const slides = [
  { id: 0, bg: 'radial-gradient(circle at top right, #1A1C1E, #0D0E0F)' },
  { id: 1, bg: 'radial-gradient(circle at top right, #064E3B, #022C22)' },
  { id: 2, bg: 'radial-gradient(circle at top right, #78350F, #451A03)' },
  { id: 3, bg: 'radial-gradient(circle at top right, #1E1B4B, #0F172A)' },
  { id: 4, bg: 'radial-gradient(circle at top right, #0F172A, #000000)' }
];

const currentSlide = computed(() => slides[activeIndex.value]);

onMounted(() => startTimer());
onUnmounted(() => clearInterval(timer));

const startTimer = () => {
  progressWidth.value = 0;
  clearInterval(timer);
  const start = Date.now();
  timer = setInterval(() => {
    const elapsed = Date.now() - start;
    progressWidth.value = (elapsed / SLIDE_DURATION) * 100;
    if (elapsed >= SLIDE_DURATION) next();
  }, 16);
};

const next = () => {
  if (activeIndex.value < slides.length - 1) {
    activeIndex.value++;
    startTimer();
    uni.vibrateShort();
  } else {
    clearInterval(timer);
    progressWidth.value = 100;
  }
};

const prev = () => {
  if (activeIndex.value > 0) {
    activeIndex.value--;
    startTimer();
    uni.vibrateShort();
  }
};

const handleScreenTap = (e) => {
  const { clientX } = e.detail;
  const width = uni.getSystemInfoSync().screenWidth;
  if (clientX < width * 0.3) prev();
  else next();
};

const goBack = () => uni.navigateBack();
const onShare = () => uni.showToast({ title: '正在渲染海报', icon: 'loading' });
</script>

<style scoped>
.story-root { position: fixed; inset: 0; z-index: 1000; overflow: hidden; color: #fff; background: #000; }

/* 动态背景 */
.story-bg-layer { position: absolute; inset: 0; z-index: -1; transition: background 1s ease; }
.golden-orb { position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.15; }
.orb-1 { top: -5%; right: -5%; width: 400px; height: 400px; background: #F59E0B; }
.orb-2 { bottom: 5%; left: -5%; width: 300px; height: 300px; background: #10B981; }
.noise-overlay { position: absolute; inset: 0; opacity: 0.03; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }

@keyframes drift { from { transform: translate(0,0); } to { transform: translate(30px, 30px); } }
.animate-drift-1 { animation: drift 20s infinite alternate; }
.animate-drift-2 { animation: drift 15s infinite alternate-reverse; }

/* 进度条 */
.story-progress { position: absolute; top: 56px; left: 16px; right: 16px; display: flex; gap: 4px; z-index: 100; }
.track { flex: 1; height: 2px; background: rgba(255,255,255,0.15); border-radius: 10px; overflow: hidden; }
.fill { height: 100%; background: #fff; }

/* 顶栏 */
.header-nav { position: absolute; top: 72px; left: 24px; right: 24px; display: flex; justify-content: space-between; align-items: center; z-index: 100; }
.brand-mini { font-size: 10px; font-weight: 900; letter-spacing: 2px; opacity: 0.5; }
.divider { font-size: 10px; margin: 0 8px; opacity: 0.2; }
.month-pill { font-size: 11px; font-weight: 800; background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 100px; }
.close-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.1); border-radius: 50%; font-size: 14px; }

/* 核心容器 - 严格单屏 */
.main-stage { height: 100%; box-sizing: border-box; }
.page-wrap { height: 100%; padding: 130px 28px 100px; display: flex; flex-direction: column; box-sizing: border-box; }
.center-all { justify-content: center; align-items: center; }

/* Slide 0 封面 */
.intro-group { margin-bottom: 20px; }
.year-label { font-size: 11px; font-weight: 900; color: #F59E0B; letter-spacing: 4px; display: block; margin-bottom: 8px; }
.title-row { display: flex; align-items: baseline; gap: 8px; }
.h-main { font-size: 56px; font-weight: 900; letter-spacing: -2px; }
.h-italic { font-size: 40px; font-weight: 300; font-style: italic; opacity: 0.4; }

.hero-center-box { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; position: relative; }
.glass-orb-bg { position: absolute; width: 220px; height: 220px; background: radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%); z-index: -1; animation: pulse 4s infinite; }
@keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.2); opacity: 0.8; } }
.data-label { font-size: 14px; font-weight: 800; color: rgba(255,255,255,0.5); margin-bottom: 12px; }
.price-display { display: flex; align-items: baseline; margin-bottom: 24px; text-shadow: 0 10px 30px rgba(0,0,0,0.3); }
.p-sym { font-size: 24px; font-weight: 900; color: #F59E0B; margin-right: 6px; }
.p-int { font-size: 72px; font-weight: 900; letter-spacing: -3px; }
.p-dec { font-size: 28px; font-weight: 800; opacity: 0.4; }
.data-badge { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); padding: 6px 16px; border-radius: 100px; }
.badge-txt { font-size: 10px; font-weight: 900; color: #F59E0B; text-transform: uppercase; }

.footer-hint { margin-top: auto; padding-bottom: 20px; }
.hint-txt { font-size: 11px; font-weight: 800; opacity: 0.3; letter-spacing: 2px; }

/* 公共标题 */
.ph-sub { font-size: 10px; font-weight: 900; color: #10B981; letter-spacing: 3px; display: block; margin-bottom: 6px; }
.ph-main { font-size: 30px; font-weight: 900; letter-spacing: -1px; margin-bottom: 24px; display: block; }

/* Slide 1 趋势 */
.trend-compact-card { background: rgba(255,255,255,0.08); border-radius: 32px; padding: 24px; border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; gap: 20px; backdrop-filter: blur(20px); }
.tc-side { border-right: 1px solid rgba(255,255,255,0.1); padding-right: 20px; }
.tc-val-box { text-align: center; }
.tc-percent { font-size: 28px; font-weight: 900; color: #10B981; display: block; }
.tc-label { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.4); margin-top: 4px; display: block; }
.tc-main { flex: 1; }
.tc-quote { font-size: 15px; font-weight: 700; line-height: 1.6; color: rgba(255,255,255,0.9); display: block; }
.tc-footer { margin-top: 14px; }
.mini-tag { font-size: 9px; font-weight: 900; background: #10B981; color: #fff; padding: 3px 8px; border-radius: 6px; display: inline-block; }

/* Slide 2 宫格 */
.compact-bento-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.bento-cell { background: rgba(255,255,255,0.06); border-radius: 28px; padding: 20px; border: 1px solid rgba(255,255,255,0.08); }
.main { grid-column: span 2; display: flex; align-items: center; gap: 16px; position: relative; }
.bc-emoji { font-size: 28px; }
.bc-info { flex: 1; }
.bc-label { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.4); display: block; }
.bc-val { font-size: 20px; font-weight: 900; display: block; }
.bc-progress-bar { position: absolute; bottom: 0; left: 20px; right: 20px; height: 3px; background: rgba(255,255,255,0.05); border-radius: 10px; }
.bc-fill { height: 100%; background: #F59E0B; border-radius: 10px; }
.sub { text-align: center; }
.sub .bc-emoji { margin-bottom: 8px; display: block; }

/* Slide 3 MVP */
.mvp-badge-card { width: 100%; background: #fff; border-radius: 40px; padding: 32px; position: relative; overflow: hidden; box-shadow: 0 30px 60px rgba(0,0,0,0.4); }
.mvp-shine { position: absolute; inset: 0; background: linear-gradient(135deg, transparent, rgba(245,158,11,0.05), transparent); }
.mvp-content { display: flex; align-items: center; gap: 24px; position: relative; z-index: 1; }
.mvp-avt-box { position: relative; }
.mvp-img { width: 88px; height: 88px; border-radius: 30px; border: 4px solid #F8FAFC; }
.mvp-crown { position: absolute; top: -12px; right: -12px; font-size: 24px; }
.mvp-texts { flex: 1; }
.mvp-name { font-size: 20px; font-weight: 900; color: #1E293B; }
.mvp-honor-pill { background: #F59E0B; color: #fff; font-size: 10px; font-weight: 900; padding: 4px 12px; border-radius: 100px; display: inline-block; margin: 6px 0 10px; }
.mvp-desc { font-size: 13px; font-weight: 700; color: #64748B; line-height: 1.5; display: block; }

/* Slide 4 AI & Actions */
.ai-compact-bubble { background: rgba(255,255,255,0.08); border-radius: 32px; padding: 28px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 32px; }
.ai-head { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.ai-spark { font-size: 20px; }
.ai-title { font-size: 12px; font-weight: 900; color: #10B981; letter-spacing: 1px; }
.ai-msg { font-size: 16px; font-weight: 700; line-height: 1.6; color: rgba(255,255,255,0.9); }

.action-footer { width: 100%; display: flex; flex-direction: column; gap: 12px; }
.btn-primary { height: 64px; background: #fff; border-radius: 20px; color: #000; font-size: 16px; font-weight: 900; display: flex; align-items: center; justify-content: center; border: none; }
.btn-outline { height: 64px; background: rgba(255,255,255,0.1); border-radius: 20px; color: #fff; font-size: 16px; font-weight: 800; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.1); }

/* 页脚 */
.footer-brand-info { position: absolute; bottom: 40px; width: 100%; text-align: center; }
.footer-brand-info text { font-size: 8px; font-weight: 900; color: rgba(255,255,255,0.2); letter-spacing: 3px; }

/* 动画库 */
.animate-fade-in { animation: fadeIn 0.8s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.animate-scale-in { animation: scaleIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
@keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
.animate-spring-up { animation: springUp 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) both; }
@keyframes springUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
.animate-slide-up { animation: slideUp 0.7s ease-out both; }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.animate-pop { animation: pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) both; }
@keyframes pop { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
</style>
