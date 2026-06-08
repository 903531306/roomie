
<template>
  <view :class="themeClass" class="stats-root">
    <!-- 动态量子背景 -->
    <view class="quantum-bg">
      <view class="scan-line"></view>
      <view class="glow-orb orb-1"></view>
      <view class="glow-orb orb-2"></view>
      <view class="data-particles">
        <view v-for="i in 15" :key="i" class="particle" :style="particleStyles[i-1]"></view>
      </view>
    </view>

    <IosNav title="财富量子透视" @leftClick="goBack" />

    <!-- 顶部极简切换器 -->
    <view class="top-nav-fixed">
      <view class="period-switcher">
        <view 
          v-for="p in ['月度', '季度', '年度']" 
          :key="p" 
          class="switch-btn" 
          :class="{ active: currentPeriod === p }"
          @click="changePeriod(p)"
        >
          <text class="btn-txt">{{ p }}报告</text>
          <view v-if="currentPeriod === p" class="btn-glow"></view>
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="stats-scroll" :show-scrollbar="false">
      <view class="stats-main">
        
        <!-- 1. 资产频谱卡片 (代替 Path 曲线) -->
        <view class="spectrum-card animate-pop-in">
          <view class="card-header">
            <view>
              <text class="c-label">NET ASSET MATRIX</text>
              <text class="c-val">¥ {{ activeData.total }}</text>
            </view>
            <view class="trend-tag" :class="activeData.trend > 0 ? 'up' : 'down'">
              {{ activeData.trend > 0 ? '+' : '' }}{{ activeData.trend }}%
            </view>
          </view>
          
          <!-- 频谱柱阵列 -->
          <view class="spectrum-visualizer">
            <view 
              v-for="(h, i) in activeData.spectrum" 
              :key="i" 
              class="spectrum-bar"
              :style="{ 
                height: h + '%', 
                animationDelay: (i * 0.05) + 's',
                background: `linear-gradient(to top, var(--primary-glow, rgba(79, 70, 229, 0.1)), ${activeData.healthColor})`
              }"
            ></view>
          </view>
          <view class="spectrum-labels">
            <text v-for="l in activeData.labels" :key="l">{{ l }}</text>
          </view>
        </view>

        <!-- 2. 分布与指标 Bento Grid -->
        <view class="bento-grid">
          
          <!-- 核心分布 - 磁力环 -->
          <view class="bento-card span-2 animate-slide-up" style="animation-delay: 0.1s">
            <view class="card-title-row">
              <text class="b-title">资源分配权重</text>
              <view class="ai-chip">NEURAL AI</view>
            </view>
            <view class="ring-analysis">
              <view class="magnetic-ring" :style="{ background: activeData.conicGradient }">
                <view class="ring-core">
                  <text class="core-num">{{ activeData.categories[0].pct }}%</text>
                  <text class="core-lab">核心支出</text>
                </view>
              </view>
              <view class="ring-legend">
                <view v-for="c in activeData.categories" :key="c.name" class="leg-item">
                  <view class="leg-dot" :style="{ background: c.color }"></view>
                  <text class="leg-n">{{ c.name }}</text>
                  <text class="leg-p">{{ c.pct }}%</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 评分仪表盘 -->
          <view class="bento-card animate-slide-up" style="animation-delay: 0.2s">
            <text class="b-title">健康度</text>
            <view class="score-radial">
              <view class="radial-bg">
                <view class="radial-fill" :style="{ transform: `rotate(${activeData.healthScore * 3.6}deg)`, borderColor: activeData.healthColor }"></view>
              </view>
              <text class="score-val" :style="{ color: activeData.healthColor }">{{ activeData.healthScore }}</text>
            </view>
            <text class="b-sub">评估：{{ activeData.healthLabel }}</text>
          </view>

          <!-- 预算负荷 -->
          <view class="bento-card animate-slide-up" style="animation-delay: 0.25s">
            <text class="b-title">预算负荷</text>
            <view class="load-bar-container">
              <view class="load-track">
                <view class="load-fill" :style="{ height: activeData.budgetPct + '%', background: activeData.budgetPct > 80 ? '#F43F5E' : 'var(--primary-color, #4F46E5)' }">
                  <view class="load-glow"></view>
                </view>
              </view>
              <text class="load-num">{{ activeData.budgetPct }}%</text>
            </view>
            <text class="b-sub">余 ¥{{ activeData.budgetLeft }}</text>
          </view>

          <!-- 协作热力矩阵 -->
          <view class="bento-card span-2 animate-slide-up" style="animation-delay: 0.3s">
            <text class="b-title">协作贡献矩阵</text>
            <view class="member-pills">
              <view v-for="m in activeData.members" :key="m.name" class="m-pill-box">
                <view class="m-pill-track">
                  <view class="m-pill-fill" :style="{ height: m.pct + '%', background: m.color }">
                    <image :src="m.avatar" class="m-avt-mini" />
                  </view>
                </view>
                <text class="m-name">{{ m.name }}</text>
              </view>
            </view>
          </view>
        </view>

        <button class="ai-gen-btn" @click="generateAIReport">
          <view class="btn-ripple"></view>
          <text>深度扫描并生成财务策略</text>
        </button>

        <view class="footer-spacer"></view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { useAppTheme } from '@/common/themes/useAppTheme.js'
const { themeClass, primaryColor, softColor, theme } = useAppTheme()

import { ref, computed } from 'vue';
import IosNav from '../../components/nav/ios-nav.vue';

const goBack = () => uni.navigateBack();
const currentPeriod = ref('月度');

// 随机背景粒子样式
const particleStyles = Array.from({ length: 15 }).map(() => ({
  left: Math.random() * 100 + '%',
  top: Math.random() * 100 + '%',
  animationDelay: Math.random() * 5 + 's',
  transform: `scale(${0.5 + Math.random()})`
}));

const periodData = {
  '月度': {
    total: '42,850.20', trend: 12.4, budgetPct: 68, budgetLeft: '1,540',
    healthScore: 88, healthLabel: '极佳', healthColor: '#818CF8',
    spectrum: [40, 60, 45, 80, 55, 90, 70, 85, 60, 75, 50, 65, 95, 80, 60, 45, 70, 85],
    labels: ['W1', 'W2', 'W3', 'W4'],
    conicGradient: 'conic-gradient(#6366F1 0% 62%, #C084FC 62% 82%, #475569 82% 100%)',
    categories: [
      { name: '日常支出', pct: 62, color: '#6366F1' },
      { name: '娱乐生活', pct: 20, color: '#C084FC' },
      { name: '其它杂项', pct: 18, color: '#475569' }
    ],
    members: [
      { name: '妈妈', pct: 85, avatar: 'https://i.pravatar.cc/100?u=mom', color: '#6366F1' },
      { name: '爸爸', pct: 45, avatar: 'https://i.pravatar.cc/100?u=dad', color: '#C084FC' },
      { name: '其它', pct: 20, avatar: 'https://i.pravatar.cc/100?u=oth', color: '#475569' }
    ]
  },
  '季度': {
    total: '128,450.00', trend: 8.2, budgetPct: 42, budgetLeft: '12,400',
    healthScore: 94, healthLabel: '稳健', healthColor: '#10B981',
    spectrum: [70, 50, 90, 60, 40, 80, 55, 75, 45, 65, 85, 50, 70, 90, 60, 40, 80, 100],
    labels: ['OCT', 'NOV', 'DEC'],
    conicGradient: 'conic-gradient(#10B981 0% 45%, #3B82F6 45% 80%, #475569 80% 100%)',
    categories: [
      { name: '教育成长', pct: 45, color: '#10B981' },
      { name: '医疗储备', pct: 35, color: '#3B82F6' },
      { name: '行政开支', pct: 20, color: '#475569' }
    ],
    members: [
      { name: '妈妈', pct: 60, avatar: 'https://i.pravatar.cc/100?u=mom', color: '#10B981' },
      { name: '爸爸', pct: 75, avatar: 'https://i.pravatar.cc/100?u=dad', color: '#3B82F6' },
      { name: '其它', pct: 15, avatar: 'https://i.pravatar.cc/100?u=oth', color: '#475569' }
    ]
  },
  '年度': {
    total: '512,200.50', trend: -2.1, budgetPct: 92, budgetLeft: '5,200',
    healthScore: 76, healthLabel: '需注意', healthColor: '#F59E0B',
    spectrum: [30, 40, 50, 45, 60, 70, 65, 80, 75, 90, 85, 100, 95, 80, 70, 60, 50, 40],
    labels: ['2023', 'Q1', 'Q2', 'Q3', 'Q4'],
    conicGradient: 'conic-gradient(#F59E0B 0% 55%, var(--primary-color, #4F46E5) 55% 80%, #475569 80% 100%)',
    categories: [
      { name: '房产贷款', pct: 55, color: '#F59E0B' },
      { name: '保险投入', pct: 25, color: 'var(--primary-color, #4F46E5)' },
      { name: '年度旅行', pct: 20, color: '#475569' }
    ],
    members: [
      { name: '妈妈', pct: 50, avatar: 'https://i.pravatar.cc/100?u=mom', color: '#F59E0B' },
      { name: '爸爸', pct: 90, avatar: 'https://i.pravatar.cc/100?u=dad', color: 'var(--primary-color, #4F46E5)' },
      { name: '其它', pct: 30, avatar: 'https://i.pravatar.cc/100?u=oth', color: '#475569' }
    ]
  }
};

const activeData = computed(() => periodData[currentPeriod.value]);

const changePeriod = (p) => {
  if (currentPeriod.value === p) return;
  currentPeriod.value = p;
};

const generateAIReport = () => {
  uni.showLoading({ title: '量子加密生成中' });
  setTimeout(() => {
    uni.hideLoading();
    uni.showToast({ title: '报告已准备就绪', icon: 'success' });
  }, 2000);
};
</script>

<style scoped>
.stats-root { height: 100vh; background-color: #030712; display: flex; flex-direction: column; overflow: hidden; position: relative; }

/* 量子背景系统 */
.quantum-bg { position: absolute; inset: 0; z-index: 0; overflow: hidden; }
.scan-line { position: absolute; top: 0; left: 0; right: 0; height: 1px; background: var(--primary-glow, rgba(79, 70, 229, 0.15)); box-shadow: 0 0 15px var(--primary-glow, rgba(79, 70, 229, 0.5)); animation: scanMove 4s linear infinite; }
@keyframes scanMove { from { top: -10%; } to { top: 110%; } }

.glow-orb { position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.1; }
.orb-1 { top: -100px; left: -100px; width: 400px; height: 400px; background: var(--primary-color, #4F46E5); }
.orb-2 { bottom: -100px; right: -100px; width: 350px; height: 350px; background: #9333EA; }

.data-particles { position: absolute; inset: 0; }
.particle { position: absolute; width: 2px; height: 2px; background: #fff; border-radius: 50%; opacity: 0.3; animation: pulseParticle 3s infinite; }
@keyframes pulseParticle { 0%, 100% { opacity: 0.1; } 50% { opacity: 0.5; transform: scale(2); } }

/* 切换器 */
.top-nav-fixed { position: sticky; top: 100px; z-index: 100; padding: 0 24px; margin-bottom: 24px; }
.period-switcher { 
  display: flex; background: rgba(17, 24, 39, 0.7); backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px);
  padding: 5px; border-radius: 100px; border: 1px solid rgba(255,255,255,0.05);
}
.switch-btn { flex: 1; height: 40px; display: flex; align-items: center; justify-content: center; position: relative; }
.btn-txt { font-size: 13px; font-weight: 800; color: #6B7280; transition: color 0.3s; z-index: 2; }
.switch-btn.active .btn-txt { color: #fff; }
.btn-glow { position: absolute; inset: 0; background: var(--primary-color, #4F46E5); border-radius: 100px; z-index: 1; box-shadow: 0 4px 15px var(--primary-glow, rgba(79, 70, 229, 0.4)); }

.stats-scroll { flex: 1; height: 0; z-index: 1; }
.stats-main { padding: 0 20px 60px; }

/* Spectrum Card */
.spectrum-card { 
  background: rgba(17, 24, 39, 0.5); border-radius: 44px; padding: 32px; margin-bottom: 24px;
  border: 1px solid rgba(255,255,255,0.05); position: relative; overflow: hidden;
}
.card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
.c-label { font-size: 10px; font-weight: 900; color: #4B5563; letter-spacing: 2.5px; display: block; }
.c-val { font-size: 38px; font-weight: 900; color: #fff; letter-spacing: -1.5px; display: block; margin-top: 4px; }
.trend-tag { padding: 4px 10px; border-radius: 100px; font-size: 11px; font-weight: 900; }
.trend-tag.up { background: rgba(16, 185, 129, 0.1); color: #10B981; }
.trend-tag.down { background: rgba(244, 63, 94, 0.1); color: #F43F5E; }

.spectrum-visualizer { height: 120px; display: flex; align-items: flex-end; justify-content: space-between; gap: 4px; padding: 0 4px; }
.spectrum-bar { flex: 1; border-radius: 4px 4px 0 0; transition: height 0.8s cubic-bezier(0.19, 1, 0.22, 1); animation: barPulse 2s infinite alternate; }
@keyframes barPulse { from { opacity: 0.7; } to { opacity: 1; } }
.spectrum-labels { display: flex; justify-content: space-between; margin-top: 12px; padding: 0 10px; }
.spectrum-labels text { font-size: 10px; font-weight: 800; color: #374151; }

/* Bento Grid */
.bento-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.bento-card { background: rgba(17, 24, 39, 0.4); border-radius: 36px; padding: 26px; border: 1px solid rgba(255,255,255,0.05); }
.span-2 { grid-column: span 2; }
.card-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.b-title { font-size: 14px; font-weight: 900; color: #9CA3AF; }
.ai-chip { background: var(--primary-color, #4F46E5); color: #fff; font-size: 8px; font-weight: 900; padding: 2px 8px; border-radius: 6px; }

/* Magnetic Ring */
.ring-analysis { display: flex; align-items: center; gap: 30px; }
.magnetic-ring { 
  width: 120px; height: 120px; border-radius: 50%; padding: 18px; 
  box-shadow: inset 0 10px 20px rgba(0,0,0,0.4), 0 15px 30px rgba(0,0,0,0.3);
  transition: all 1s ease;
}
.ring-core { 
  width: 100%; height: 100%; background: #030712; border-radius: 50%; 
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  box-shadow: 0 4px 10px rgba(255,255,255,0.05);
}
.core-num { font-size: 20px; font-weight: 900; color: #fff; }
.core-lab { font-size: 8px; font-weight: 800; color: #4B5563; }
.ring-legend { flex: 1; display: flex; flex-direction: column; gap: 14px; }
.leg-item { display: flex; align-items: center; gap: 8px; }
.leg-dot { width: 8px; height: 8px; border-radius: 50%; }
.leg-n { font-size: 11px; font-weight: 800; color: #6B7280; flex: 1; }
.leg-p { font-size: 11px; font-weight: 900; color: #fff; }

/* Score Radial */
.score-radial { height: 80px; position: relative; display: flex; align-items: center; justify-content: center; margin: 15px 0; }
.radial-bg { width: 80px; height: 80px; border-radius: 50%; border: 8px solid rgba(255,255,255,0.03); }
.radial-fill { position: absolute; width: 80px; height: 80px; border-radius: 50%; border: 8px solid transparent; border-top-color: inherit; transition: transform 1s cubic-bezier(0.19, 1, 0.22, 1); }
.score-val { position: absolute; font-size: 32px; font-weight: 900; letter-spacing: -1px; }
.b-sub { font-size: 10px; font-weight: 800; color: #4B5563; text-align: center; display: block; }

/* Load Bar */
.load-bar-container { height: 80px; display: flex; align-items: center; gap: 15px; margin: 15px 0; }
.load-track { width: 14px; height: 100%; background: rgba(255,255,255,0.03); border-radius: 100px; overflow: hidden; display: flex; align-items: flex-end; }
.load-fill { width: 100%; transition: height 1.2s cubic-bezier(0.19, 1, 0.22, 1); position: relative; }
.load-glow { position: absolute; top: 0; left: 0; right: 0; height: 10px; background: #fff; opacity: 0.5; filter: blur(4px); }
.load-num { font-size: 24px; font-weight: 900; color: #fff; }

/* Member Matrix */
.member-pills { display: flex; justify-content: space-around; padding-top: 10px; }
.m-pill-box { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.m-pill-track { width: 44px; height: 90px; background: rgba(255,255,255,0.03); border-radius: 22px; padding: 4px; display: flex; align-items: flex-end; }
.m-pill-fill { width: 100%; border-radius: 18px; display: flex; align-items: flex-start; justify-content: center; padding-top: 4px; transition: height 1.2s cubic-bezier(0.19, 1, 0.22, 1); }
.m-avt-mini { width: 28px; height: 28px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.2); }
.m-name { font-size: 10px; font-weight: 900; color: #6B7280; }

/* Footer */
.ai-gen-btn { 
  margin-top: 32px; height: 72px; background: linear-gradient(135deg, var(--primary-color, #4F46E5) 0%, #7C3AED 100%); border-radius: 24px;
  display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden;
  border: none; box-shadow: 0 20px 40px var(--primary-glow, rgba(79, 70, 229, 0.3));
}
.ai-gen-btn text { font-size: 15px; font-weight: 900; color: #fff; z-index: 2; }
.btn-ripple { position: absolute; inset: 0; background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%); animation: rippleMove 3s infinite; }
@keyframes rippleMove { 0% { transform: scale(0.5); opacity: 0; } 50% { opacity: 1; } 100% { transform: scale(2); opacity: 0; } }

.footer-spacer { height: env(safe-area-inset-bottom); margin-top: 60px; }

/* 动画库 */
.animate-pop-in { animation: popIn 0.8s cubic-bezier(0.19, 1, 0.22, 1) both; }
@keyframes popIn { from { opacity: 0; transform: scale(0.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
.animate-slide-up { animation: slideUp 0.6s cubic-bezier(0.19, 1, 0.22, 1) both; }
@keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in { animation: fadeIn 0.8s ease-out both; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>
