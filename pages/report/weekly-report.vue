
<template>
  <view :class="themeClass" class="report-root" @click="handleScreenTap">
    <!-- 动态高级背景层 -->
    <view class="ambient-bg" :style="{ background: slides[activeIndex].bgTheme }">
      <view class="mesh-orb orb-1"></view>
      <view class="mesh-orb orb-2"></view>
      <view class="mesh-orb orb-3"></view>
      <view class="noise-mask"></view>
    </view>

    <!-- 顶部进度条 -->
    <view class="story-progress-bar">
      <view v-for="(s, i) in slides" :key="i" class="progress-track">
        <view 
          class="progress-fill" 
          :style="{ 
            width: activeIndex > i ? '100%' : (activeIndex === i ? '100%' : '0%'),
            transition: 'width 0.4s cubic-bezier(0.23, 1, 0.32, 1)'
          }"
        ></view>
      </view>
    </view>

    <!-- 固定页眉 -->
    <view class="report-header">
      <view class="header-left">
        <text class="main-title">本周账单</text>
        <text class="cycle-text">2024.11.18 — 2024.11.24</text>
        <text class="gen-time">生成时间：2024.11.25 09:00</text>
      </view>
      <view class="header-right">
        <view class="export-btn" @click.stop="onExport">
          <text class="export-emoji">📥</text>
        </view>
        <view class="close-btn-circle" @click.stop="goBack">✕</view>
      </view>
    </view>

    <!-- 内容舞台 -->
    <view class="stage-container">
      
      <!-- 第一屏｜核心汇总 -->
      <view v-if="activeIndex === 0" class="page-content animate-fade-in">
        <view class="section-label">SUMMARY</view>
        <view class="summary-hero">
          <text class="hero-label">本周支出</text>
          <view class="hero-amount-row">
            <text class="h-sym">¥</text>
            <text class="h-val">2,480.00</text>
          </view>
        </view>
        
        <view class="metrics-grid">
          <view class="m-item animate-spring" style="animation-delay: 0.1s">
            <text class="m-label">本周收入</text>
            <text class="m-val">¥3,200.00</text>
          </view>
          <view class="m-item animate-spring" style="animation-delay: 0.2s">
            <text class="m-label">本周结余</text>
            <text class="m-val">¥720.00</text>
          </view>
          <view class="m-item animate-spring" style="animation-delay: 0.3s">
            <text class="m-label">较上周变化</text>
            <view class="m-val-row trend-up">
              <text class="t-icon">↑</text>
              <text class="t-val">12.4%</text>
            </view>
          </view>
        </view>

        <view class="summary-footer-hint animate-fade-in" style="animation-delay: 0.5s">
           <text class="tip-glow">💡 本周支出较上周有所变化，储蓄率有所提升</text>
        </view>
      </view>

      <!-- 第二屏｜本周总结 (结论先行) -->
      <view v-if="activeIndex === 1" class="page-content center-mode animate-fade-in">
        <view class="insight-hero">
          <view class="insight-icon-box">✨</view>
          <view class="insight-text-wrap">
            <text class="insight-main">
              本周整体支出<text class="highlight red">上涨</text>，
              主要由于<text class="highlight indigo">餐饮支出</text>增加。
            </text>
            <text class="insight-sub">
              周五的家庭聚餐是主要的波动来源，其余时间表现非常克制。
            </text>
          </view>
        </view>
      </view>

      <!-- 第三屏｜支出趋势 (7天) -->
      <view v-if="activeIndex === 2" class="page-content animate-fade-in">
        <view class="section-label">TRENDS</view>
        <text class="section-h1">7天支出波动</text>

        <view class="trend-visual-card animate-scale-in">
          <view class="chart-main">
             <view v-for="(v, i) in trendData" :key="i" class="chart-col">
               <view class="bar-wrap">
                 <view class="bar-fill" :style="{ height: v.expPct + '%' }">
                   <view class="bar-glow"></view>
                 </view>
               </view>
               <text class="col-label">{{ v.day }}</text>
             </view>
          </view>
        </view>
        
        <view class="chart-caption animate-slide-up">
           <text class="cap-icon">📈</text>
           <text class="cap-txt">本周支出高峰出现在 <text class="bold">周五</text></text>
        </view>
      </view>

      <!-- 第四屏｜分类分析 -->
      <view v-if="activeIndex === 3" class="page-content animate-fade-in">
        <view class="section-label">CATEGORIES</view>
        <text class="section-h1">消费结构透视</text>

        <view class="category-visual-row animate-pop">
          <view class="ring-box">
             <view class="ring-gradient-core">
                <text class="rg-label">TOP</text>
                <text class="rg-val">餐饮</text>
             </view>
          </view>
        </view>

        <scroll-view scroll-y class="cat-list-scroll animate-slide-up">
           <view v-for="(c, i) in categories" :key="c.name" class="cat-line-item" :style="{ animationDelay: (i*0.08)+'s' }">
             <view class="cl-left">
               <view class="cl-dot" :style="{ background: c.color }"></view>
               <text class="cl-name">{{ c.name }}</text>
             </view>
             <view class="cl-right">
               <text class="cl-amount">¥{{ c.amount }}</text>
               <text class="cl-pct">{{ c.pct }}%</text>
               <text class="cl-trend" :class="c.trendUp ? 'up' : 'down'">
                 {{ c.trendUp ? '↑' : '↓' }}
               </text>
             </view>
           </view>
        </scroll-view>
      </view>

      <!-- 第五屏｜成员支出分布 -->
      <view v-if="activeIndex === 4" class="page-content animate-fade-in">
        <view class="section-label">CONTRIBUTION</view>
        <text class="section-h1">成员支出分布</text>

        <view class="member-ranking-stack">
          <view v-for="(m, i) in members" :key="i" class="member-rank-card animate-slide-in" :style="{ animationDelay: (i*0.15) + 's' }">
            <view class="mr-info">
              <image :src="m.avatar" class="mr-avt" />
              <text class="mr-name">{{ m.name }}</text>
            </view>
            <view class="mr-data">
              <view class="mr-bar-bg">
                <view class="mr-bar-fill" :style="{ width: m.pct + '%', background: m.color }"></view>
              </view>
              <text class="mr-pct">{{ m.pct }}%</text>
            </view>
          </view>
        </view>

        <view class="disclaimer-box animate-fade-in">
          <text class="dis-txt">⚠️ 仅展示支出占比，不代表责任划分</text>
        </view>

        <view class="final-actions animate-slide-up">
          <button class="btn-primary-glass" @click.stop="onExport">导出完整报告</button>
          <button class="btn-outline-glass" @click.stop="goBack">返回空间首页</button>
        </view>
      </view>

    </view>

    <!-- 操作提示 -->
    <view class="tap-hint" v-if="activeIndex === 0">
      <text>点击右侧继续回顾本周</text>
      <view class="hint-arrow-anim"></view>
    </view>
  </view>
</template>

<script setup>
import { useAppTheme } from '@/common/themes/useAppTheme.js'
const { themeClass, primaryColor, softColor, theme } = useAppTheme()

import { ref, onMounted, onUnmounted } from 'vue';

const activeIndex = ref(0);
const progressWidth = ref(0);
let timer = null;

const slides = [
  { id: 0, bgTheme: 'radial-gradient(circle at top right, #4338CA, #1E1B4B)' },
  { id: 1, bgTheme: 'radial-gradient(circle at top right, #312E81, #000000)' },
  { id: 2, bgTheme: 'radial-gradient(circle at top right, #065F46, #064E3B)' },
  { id: 3, bgTheme: 'radial-gradient(circle at top right, #7C3AED, #4C1D95)' },
  { id: 4, bgTheme: 'radial-gradient(circle at top right, #1E293B, #0F172A)' }
];

const trendData = [
  { day: '一', expPct: 40 }, { day: '二', expPct: 30 },
  { day: '三', expPct: 45 }, { day: '四', expPct: 20 },
  { day: '五', expPct: 90 }, { day: '六', expPct: 60 },
  { day: '日', expPct: 35 }
];

const categories = [
  { name: '餐饮美食', pct: 48, amount: '1,200.00', color: '#6366F1', trendUp: true },
  { name: '日常购物', pct: 24, amount: '600.00', color: '#10B981', trendUp: false },
  { name: '交通出行', pct: 12, amount: '300.00', color: '#F59E0B', trendUp: true },
  { name: '休闲娱乐', pct: 10, amount: '250.00', color: '#EC4899', trendUp: false },
  { name: '其他', pct: 6, amount: '130.00', color: '#94A3B8', trendUp: true }
];

const members = [
  { name: '王先生', pct: 65, avatar: 'https://i.pravatar.cc/150?u=dad', color: '#6366F1' },
  { name: '李太太', pct: 35, avatar: 'https://i.pravatar.cc/150?u=mom', color: '#10B981' }
];

onMounted(() => {
  // 自动切换计时器（已屏蔽，按需启用）
  // startTimer();
});

const next = () => {
  if (activeIndex.value < slides.length - 1) {
    activeIndex.value++;
    uni.vibrateShort({ type: 'light' });
  }
};

const prev = () => {
  if (activeIndex.value > 0) {
    activeIndex.value--;
    uni.vibrateShort({ type: 'light' });
  }
};

const handleScreenTap = (e) => {
  const width = uni.getSystemInfoSync().screenWidth;
  if (e.detail.clientX < width * 0.35) prev();
  else next();
};

const goBack = () => uni.navigateBack();
const onExport = () => {
  uni.vibrateShort({ type: 'medium' });
  uni.showToast({ title: '正在导出 PDF...', icon: 'loading' });
};
</script>

<style scoped>
.report-root { position: fixed; inset: 0; z-index: 1000; background: #000; color: #fff; overflow: hidden; }

/* 极光动态背景 */
.ambient-bg { position: absolute; inset: 0; z-index: -1; transition: background 1.5s cubic-bezier(0.4, 0, 0.2, 1); overflow: hidden; }
.mesh-orb { position: absolute; border-radius: 50%; filter: blur(120px); opacity: 0.35; pointer-events: none; }
.orb-1 { top: -10%; right: -10%; width: 450px; height: 450px; background: var(--primary-color, #4F46E5); animation: orbit 30s infinite linear; }
.orb-2 { bottom: -10%; left: -10%; width: 400px; height: 400px; background: #EC4899; animation: orbit 25s infinite linear reverse; }
.orb-3 { top: 30%; left: 10%; width: 300px; height: 300px; background: #0EA5E9; opacity: 0.2; animation: drift 20s infinite alternate; }

@keyframes orbit { from { transform: rotate(0deg) translate(60px) rotate(0deg); } to { transform: rotate(360deg) translate(60px) rotate(-360deg); } }
@keyframes drift { from { transform: translate(0, 0) scale(1); } to { transform: translate(60px, 40px) scale(1.15); } }

/* 噪点质感 */
.noise-mask { position: absolute; inset: 0; opacity: 0.04; pointer-events: none; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }

/* 进度条 */
.story-progress-bar { position: absolute; top: 54px; left: 24px; right: 24px; display: flex; gap: 6px; z-index: 100; }
.progress-track { flex: 1; height: 3px; background: rgba(255,255,255,0.15); border-radius: 10px; overflow: hidden; }
.progress-fill { height: 100%; background: #fff; box-shadow: 0 0 10px #fff; }

/* 规范页眉 */
.report-header { position: absolute; top: 76px; left: 28px; right: 28px; display: flex; justify-content: space-between; align-items: flex-start; z-index: 100; }
.main-title { font-size: 24px; font-weight: 900; letter-spacing: -0.5px; display: block; }
.cycle-text { font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.6); margin-top: 4px; display: block; }
.gen-time { font-size: 9px; font-weight: 700; color: rgba(255,255,255,0.3); text-transform: uppercase; margin-top: 4px; display: block; }
.export-btn, .close-btn-circle { width: 40px; height: 40px; background: rgba(255,255,255,0.12); backdrop-filter: blur(10px); border-radius: 50%; display: flex; align-items: center; justify-content: center; }

/* 舞台布局 */
.stage-container { height: 100%; box-sizing: border-box; }
.page-content { height: 100%; padding: 180px 32px 100px; display: flex; flex-direction: column; }
.center-mode { align-items: center; justify-content: center; text-align: center; }

.section-label { font-size: 11px; font-weight: 900; color: rgba(255,255,255,0.3); letter-spacing: 4px; margin-bottom: 12px; }
.section-h1 { font-size: 32px; font-weight: 900; letter-spacing: -1px; margin-bottom: 40px; }

/* 屏1：核心汇总 */
.summary-hero { margin-bottom: 48px; }
.hero-label { font-size: 15px; font-weight: 800; color: rgba(255,255,255,0.5); margin-bottom: 8px; display: block; }
.hero-amount-row { display: flex; align-items: baseline; gap: 8px; }
.h-sym { font-size: 32px; font-weight: 900; color: #fff; opacity: 0.6; }
.h-val { font-size: 72px; font-weight: 900; letter-spacing: -4px; line-height: 1; }

.metrics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.m-item { background: rgba(255,255,255,0.08); padding: 24px; border-radius: 32px; border: 1px solid rgba(255,255,255,0.1); }
.m-label { font-size: 11px; font-weight: 800; color: rgba(255,255,255,0.4); display: block; margin-bottom: 8px; }
.m-val { font-size: 19px; font-weight: 900; display: block; }
.m-val-row { display: flex; align-items: center; gap: 4px; }
.trend-up .t-icon, .trend-up .t-val { color: #10B981; font-weight: 900; }
.summary-footer-hint { margin-top: 40px; padding: 16px 24px; background: rgba(255,255,255,0.05); border-radius: 20px; text-align: center; }
.tip-glow { font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.8); }

/* 屏2：本周总结 */
.insight-hero { padding: 40px 0; }
.insight-icon-box { font-size: 54px; margin-bottom: 32px; }
.insight-main { font-size: 28px; font-weight: 900; line-height: 1.5; color: #fff; display: block; text-shadow: 0 10px 30px rgba(0,0,0,0.5); }
.highlight { padding: 0 4px; border-bottom: 4px solid; }
.highlight.red { color: #F43F5E; border-color: rgba(244, 63, 94, 0.3); }
.highlight.indigo { color: #818CF8; border-color: rgba(129, 140, 248, 0.3); }
.insight-sub { font-size: 15px; font-weight: 700; color: rgba(255,255,255,0.5); margin-top: 24px; display: block; line-height: 1.6; }

/* 屏3：趋势图 */
.trend-visual-card { background: rgba(255,255,255,0.05); border-radius: 40px; padding: 40px 30px; height: 320px; border: 1px solid rgba(255,255,255,0.05); }
.chart-main { height: 100%; display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; }
.chart-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 14px; }
.bar-wrap { width: 14px; height: 220px; background: rgba(255,255,255,0.04); border-radius: 100px; position: relative; display: flex; align-items: flex-end; }
.bar-fill { width: 100%; border-radius: 100px; background: #6366F1; transition: height 1s cubic-bezier(0.19, 1, 0.22, 1); position: relative; }
.bar-glow { position: absolute; top: 0; left: 0; right: 0; height: 14px; background: #fff; border-radius: 50%; opacity: 0.4; filter: blur(4px); }
.col-label { font-size: 11px; font-weight: 900; color: rgba(255,255,255,0.3); }
.chart-caption { margin-top: 32px; display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.06); padding: 12px 24px; border-radius: 100px; align-self: center; }
.cap-txt { font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.8); }
.bold { font-weight: 900; color: #fff; }

/* 屏4：分类 */
.category-visual-row { display: flex; justify-content: center; margin-bottom: 40px; }
.ring-box { width: 160px; height: 160px; border-radius: 50%; background: conic-gradient(#6366F1 0% 48%, #10B981 48% 72%, #F59E0B 72% 84%, #EC4899 84% 94%, #94A3B8 94% 100%); display: flex; align-items: center; justify-content: center; padding: 12px; box-shadow: 0 0 50px rgba(0,0,0,0.3); }
.ring-gradient-core { width: 100%; height: 100%; background: #0D0E0F; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.rg-label { font-size: 10px; font-weight: 900; color: rgba(255,255,255,0.3); letter-spacing: 2px; }
.rg-val { font-size: 22px; font-weight: 900; }

.cat-list-scroll { flex: 1; height: 0; background: rgba(255,255,255,0.04); border-radius: 36px; padding: 8px; }
.cat-line-item { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.cat-line-item:last-child { border: none; }
.cl-left { display: flex; align-items: center; gap: 16px; }
.cl-dot { width: 8px; height: 8px; border-radius: 50%; }
.cl-name { font-size: 15px; font-weight: 800; }
.cl-right { display: flex; align-items: center; gap: 12px; }
.cl-amount { font-size: 15px; font-weight: 900; }
.cl-pct { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.4); }
.cl-trend.up { color: #F43F5E; }
.cl-trend.down { color: #10B981; }

/* 屏5：成员分布 */
.member-ranking-stack { display: flex; flex-direction: column; gap: 16px; margin-bottom: 40px; }
.member-rank-card { background: rgba(255,255,255,0.07); padding: 24px; border-radius: 32px; display: flex; align-items: center; justify-content: space-between; }
.mr-info { display: flex; align-items: center; gap: 16px; }
.mr-avt { width: 50px; height: 50px; border-radius: 18px; border: 2px solid #fff; }
.mr-name { font-size: 16px; font-weight: 900; }
.mr-data { display: flex; align-items: center; gap: 16px; flex: 1; justify-content: flex-end; }
.mr-bar-bg { width: 100px; height: 6px; background: rgba(255,255,255,0.1); border-radius: 10px; overflow: hidden; }
.mr-bar-fill { height: 100%; border-radius: 10px; transition: width 1.2s; }
.mr-pct { font-size: 18px; font-weight: 900; width: 44px; text-align: right; }

.disclaimer-box { padding: 12px 20px; background: rgba(245, 158, 11, 0.08); border-radius: 12px; margin-bottom: 60px; }
.dis-txt { font-size: 11px; font-weight: 800; color: #F59E0B; }

.btn-primary-glass { height: 72px; background: #fff; border-radius: 24px; color: #000; font-size: 16px; font-weight: 900; border: none; box-shadow: 0 15px 35px rgba(255,255,255,0.15); margin-bottom: 16px; }
.btn-outline-glass { height: 72px; background: rgba(255,255,255,0.1); border-radius: 24px; color: #fff; border: 1px solid rgba(255,255,255,0.2); font-size: 16px; font-weight: 800; }

.tap-hint { position: absolute; bottom: 50px; width: 100%; text-align: center; opacity: 0.4; }
.tap-hint text { font-size: 11px; font-weight: 800; letter-spacing: 2px; }

/* 动画库 */
.animate-fade-in { animation: fadeIn 0.8s ease-out both; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }

.animate-spring { animation: springIn 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) both; }
@keyframes springIn { from { opacity: 0; transform: scale(0.8) translateY(30px); } to { opacity: 1; transform: scale(1) translateY(0); } }

.animate-scale-in { animation: scaleIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
@keyframes scaleIn { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }

.animate-slide-up { animation: slideUp 0.8s cubic-bezier(0.19, 1, 0.22, 1) both; }
@keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }

.animate-slide-in { animation: slideIn 0.7s cubic-bezier(0.19, 1, 0.22, 1) both; }
@keyframes slideIn { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }

.animate-pop { animation: pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) both; }
@keyframes pop { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
</style>
