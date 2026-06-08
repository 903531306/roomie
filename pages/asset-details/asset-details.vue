<template>
  <view :class="themeClass" class="details-container" :style="themeStyles" @click="selectedBar = null">
    <IosNav 
      title="资产数据深度透视" 
      @leftClick="goBack" 
    />

    <!-- 增强版极光氛围背景 -->
    <view class="mesh-bg">
      <view class="blob blob-1 animate-drift-1"></view>
      <view class="blob blob-2 animate-drift-2"></view>
      <view class="blob blob-3 animate-drift-3"></view>
      <view class="noise-overlay"></view>
    </view>

    <!-- 顶部维度切换：重构美化版 -->
 <!--   <view class="period-dock animate-fade-in" @click.stop>
      <view class="period-capsule">

        <view 
          class="period-slider" 
          :style="{ 
            transform: `translateX(${selectedRangeIndex * 100}%)`, 
            width: (100 / rangeOptions.length) + '%' 
          }"
        >
          <view class="slider-inner-glow"></view>
        </view>
        
        <view 
          v-for="(p, i) in rangeOptions" 
          :key="p" 
          class="period-item"
          :class="{ active: selectedRangeIndex === i }"
          @click="onRangeTabChange(i)"
        >
          <text class="period-txt">{{ p }}</text>
        </view>
      </view>
    </view> -->

    <scroll-view 
      scroll-y 
      class="details-scroll" 
      enable-back-to-top
      enhanced
      :show-scrollbar="false"
    >
      <!-- 点击滚动区域内部空白也能关闭气泡 -->
      <view class="scroll-content" @click="selectedBar = null">
        
        <!-- 1. 资产概览 Hero 区域 -->
        <view v-if="isLoading" class="hero-section skeleton-mode">
          <view class="sk-item shimmer" style="width: 120px; height: 12px; margin: 0 auto 16px; border-radius: 4px;"></view>
          <view class="sk-item shimmer" style="width: 240px; height: 48px; margin: 0 auto 24px; border-radius: 12px;"></view>
          <view class="sk-card shimmer" style="height: 100px; border-radius: 36px;"></view>
        </view>
        
        <view v-else class="hero-section animate-spring" @click.stop="selectedBar = null">
          <view class="hero-main-card">
            <text class="hero-label">当前净资产</text>
            <text class="hero-sublabel">{{ rangeOptions[selectedRangeIndex] }}收支统计见下方</text>
            <view class="hero-amount animate-scale-in">
              <text class="amount-symbol">¥</text>
              <text class="amount-val">{{ formatMoney(overView?.asset?.total_balance || '0.00') }}</text>
            </view>
            
            <view class="hero-stats-row">
              <view class="stat-item">
                <text class="stat-label">{{ rangeOptions[selectedRangeIndex] }}收入</text>
                <text class="stat-val income">+¥{{ formatMoney(overView?.asset?.income_total || '0.00') }}</text>
              </view>
              <view class="stat-divider"></view>
              <view class="stat-item">
                <text class="stat-label">阶段支出</text>
                <text class="stat-val expense">-¥{{ formatMoney(overView?.asset?.expense_total || '0.00') }}</text>
              </view>
              <view class="stat-divider"></view>
              <view class="stat-item" :class="activeDiffColor">
                <text class="stat-label">较{{ activeDiffLabel }} </text>
                <text class="badge-txt" >{{ activeDiffValue > 0 ? '+' : '' }}{{ formatMoney(activeDiffValue) }}%</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 2. 双色堆叠图表 (深度重构适配多维度) -->
        <view class="content-card animate-slide-up" style="animation-delay: 0.1s" @click.stop="selectedBar = null">
          <view class="card-header-row">
            <view class="card-header">
              <view class="header-indicator purple"></view>
              <text class="header-title">{{ rangeOptions[selectedRangeIndex] }}收支态势</text>
            </view>
            <view class="chart-legend">
              <view class="legend-item"><view class="l-dot inc"></view><text>收入</text></view>
              <view class="legend-item"><view class="l-dot exp"></view><text>支付</text></view>
            </view>
          </view>
          
          <view v-if="isLoading" class="chart-skeleton">
            <view class="chart-sk-bars">
              <view v-for="i in 7" :key="i" class="chart-sk-bar shimmer"></view>
            </view>
            <view class="chart-sk-labels shimmer"></view>
          </view>

          <view v-else-if="hasTrendData" class="chart-container">
            <view class="chart-bars" :class="['view-' + currentViewCode]">
              <view v-for="(val, i) in trendData" :key="i" class="bar-wrap">
                <view class="bar-val-hint animate-tooltip-in" v-if="selectedBar === i">
                  <view class="hint-line"><text class="h-l">收:</text><text class="h-v">¥{{ (val.income || 0).toFixed(2) }}</text></view>
                  <view class="hint-line"><text class="h-l">支:</text><text class="h-v">¥{{ Math.abs(val.expense || 0).toFixed(2) }}</text></view>
                </view>
                
                <view 
                  class="bar-stack-fill" 
                  :class="{ active: selectedBar === i }"
                  :style="{ height: getMasterHeight(val.income, val.expense) }"
                  @click.stop="selectedBar = i"
                >
                  <view 
                    class="segment income" 
                    :style="{ 
                      height: getSegmentHeight(val.income, val.expense, 'inc'),
                      transitionDelay: (i * (selectedRangeIndex === 1 ? 0.01 : 0.03)) + 's' 
                    }"
                  ></view>
                  <view 
                    class="segment expense" 
                    :style="{ 
                      height: getSegmentHeight(val.income, val.expense, 'exp'),
                      transitionDelay: (i * (selectedRangeIndex === 1 ? 0.01 : 0.03)) + 's' 
                    }"
                  ></view>
                </view>
              </view>
            </view>
            <view class="chart-labels" :class="['labels-' + currentViewCode]">
              <text v-for="d in currentChartLabels" :key="d" class="chart-label">{{ d }}</text>
            </view>
          </view>

          <view v-else-if="!isLoading" class="chart-empty-state animate-inner-pop">
            <view class="ce-visual" aria-hidden="true">
              <view class="ce-bars-row">
                <view
                  v-for="(h, i) in chartEmptyBarHeights"
                  :key="i"
                  class="ce-bar-wrap"
                >
                  <view class="ce-bar" :style="{ height: h }"></view>
                </view>
              </view>
              <view class="ce-axis"></view>
              <view class="ce-labels-row">
                <text v-for="d in currentChartLabels" :key="d" class="ce-day-label">{{ d }}</text>
              </view>
            </view>
            <view class="ce-text-box">
              <text class="ce-title">{{ rangeOptions[selectedRangeIndex] }}暂无收支数据</text>
              <text class="ce-sub">记录收支后，趋势图表将在这里呈现</text>
            </view>
            <view class="ce-legend-hint">
              <view class="legend-item"><view class="l-dot inc"></view><text>收入</text></view>
              <view class="legend-item"><view class="l-dot exp"></view><text>支付</text></view>
            </view>
          </view>
        </view>

        <!-- 3. 资产构成 (现代化卡片网格) -->
        <view  v-if="overView?.asset?.categories?.length > 0"class="section-group animate-slide-up" style="animation-delay: 0.2s" @click.stop="selectedBar = null">
          <view class="group-header">
            <view class="header-indicator blue"></view>
            <text class="group-title">资产分布矩阵</text>
          </view>
          
          <view v-if="overView?.asset?.categories?.length > 0" class="asset-modern-stack">
            <view 
              v-for="(item, idx) in overView.asset.categories" 
              :key="item.label" 
              class="asset-modern-item animate-slide-in"
              :style="{ animationDelay: (0.3 + idx * 0.1) + 's' }"
            >
              <view class="ami-left">
                <view class="ami-icon-box" :style="{ background: item.bgColor + '15' }">
                  <image v-if="isImageUrl(item.icon)" :src="item.icon" mode="aspectFill" class="ami-icon-img" />
                  <text v-else class="ami-emoji">{{ item.icon || '💰' }}</text>
                </view>
                <view class="ami-info">
                  <view class="ami-title-row">
                    <text class="ami-name">{{ item.label }}</text>
                  </view>
                  <view class="ami-progress-track">
                    <view class="ami-progress-fill" :style="{ width: item.percent + '%', background: item.bgColor }">
                      <view class="ami-shimmer"></view>
                    </view>
                  </view>
                </view>
              </view>
              <view class="ami-right">
                <text class="ami-amount">¥{{ formatMoney(item.amount) }}</text>
                <text class="ami-sub" :style="{ color: item.bgColor }">{{ item.percent }}%</text>
              </view>
            </view>
          </view>
         <!-- <view v-else class="mini-empty-state">
            <text class="me-emoji">📂</text>
            <text class="me-txt">暂无资产分类数据</text>
          </view> -->
        </view>

        <!-- 4. 最近记录 -->
        <view class="history-section animate-slide-up" style="animation-delay: 0.4s" @click.stop="selectedBar = null">
          <view class="history-head">
            <text class="history-title">最近变动明细</text>
            <text class="history-all" @click="toLedgerAll">全部流水 ›</text>
          </view>
          
          <view v-if="overView?.recent?.ledgers?.length > 0" class="history-list-card">
            <view v-for="h in overView.recent.ledgers" :key="h.id" class="history-item">
              <view class="h-left">
                <view class="h-icon" :class="h.type">
                  <text>{{ h.type !== 'expense' ? '↗' : '↘' }}</text>
                </view>
                <view class="h-info">
                  <text class="h-name">{{ h.note || h.category }}</text>
                  <text class="h-meta">{{ formatSmartTime(h.entryTime) }} · {{ h.category }}</text>
                </view>
              </view>
              <text class="h-amount" :class="{ positive: h.type === 'income' }">
                {{ h.type === 'expense' ? '-' : '+' }}{{ formatMoney(h.amount) }}
              </text>
            </view>
          </view>

          <view v-else-if="!isLoading" class="history-empty-card animate-inner-pop">
            <view class="he-decoration">
              <view class="he-circle"></view>
              <text class="he-emoji">🍃</text>
            </view>
            <view class="he-text-box">
              <text class="he-main">暂无变动明细</text>
              <text class="he-sub">记录第一笔收支后，这里会展示最近流水</text>
            </view>
          </view>
        </view>

        <view class="spacer"></view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAppTheme } from '@/common/themes/useAppTheme.js'

const { themeClass, primaryColor, softColor, theme } = useAppTheme()
const themeStyles = computed(() => ({
  backgroundColor: softColor.value
}))
import { onLoad } from "@dcloudio/uni-app";
import IosNav from '../../components/nav/ios-nav.vue';
import { roomApi } from '../../common/api';
import { formatSmartTime, formatMoney } from '../../pages/js/utils.js';
import { coalesce } from '@/common/utils/coalesce.js';

const isLoading = ref(true);
const overView = ref(null);
const roomId = ref(null);
const accountId=ref(null);
const selectedBar = ref(null);
const rangeOptions = ['本周', '本月'];
const selectedRangeIndex = ref(0);

const isImageUrl = (val) => {
  if (typeof val !== 'string') return false;
  const v = val.toLowerCase();
  return v.startsWith('http') || v.startsWith('/') || v.startsWith('data:image') || v.includes('.png') || v.includes('.jpg') || v.includes('.jpeg') || v.includes('.webp');
};

onLoad((e) => { 
  roomId.value = e.roomId; 
  accountId.value = e.accountId;
});
onMounted(() => { getAllList(); });

const getAllList = async () => {
  isLoading.value = true;
  try {
    const res = await roomApi.getDashBoardList({"roomId": roomId.value,type:getType()});
    if (res && res.code == 0) {
      overView.value = res.data;
    }
  } finally {
    setTimeout(() => { isLoading.value = false; }, 800);
  }
}

const getType=()=>{
	if(selectedRangeIndex.value==0){
		return "week";
	}else if(selectedRangeIndex.value==1){
		return "month";
	}else{
		return "";
	}
}

const onRangeTabChange = (i) => {
  if (selectedRangeIndex.value === i) return;
  selectedRangeIndex.value = i;
  selectedBar.value = null;
  getAllList();
};

const currentViewCode = computed(() => ['week', 'month'][selectedRangeIndex.value]);

const getSegmentHeight = (inc, exp, type) => {
  const i = Math.abs(inc || 0);
  const e = Math.abs(exp || 0);
  const sum = i + e;
  if (sum === 0) return '0%';
  return type === 'inc' ? `${(i / sum) * 100}%` : `${(e / sum) * 100}%`;
};

const maxTotalValue = computed(() => {
  const data = trendData.value;
  if (!data || data.length === 0) return 1;
  const totals = data.map(v => Math.abs(v.income || 0) + Math.abs(v.expense || 0));
  const max = Math.max(...totals);
  return max > 0 ? max : 1;
});

const getMasterHeight = (inc, exp) => {
  const i = Math.abs(inc || 0);
  const e = Math.abs(exp || 0);
  const currentTotal = i + e;
  if (currentTotal === 0) return '0%';
  const val = (currentTotal / maxTotalValue.value) * 90;
  return val < 10 ? '10%' : `${Math.min(val, 100)}%`;
};

const trendData = computed(() => {
  if (selectedRangeIndex.value === 0|| selectedRangeIndex.value==1) {
    return overView?.value?.trend?.points||[];
  }else{
	  return Array(30).fill(0).map(() => ({
	    income: Math.random() * 80, 
	    expense: -(Math.random() * 60) 
	  }));
  }
});

const hasTrendData = computed(() => {
  const data = trendData.value;
  if (!data || data.length === 0) return false;
  return data.some(
    (v) => Math.abs(Number(v.income) || 0) > 0 || Math.abs(Number(v.expense) || 0) > 0
  );
});

const chartEmptyBarHeights = computed(() => {
  if (selectedRangeIndex.value === 1) {
    return ['32rpx', '48rpx', '40rpx', '56rpx'];
  }
  return ['28rpx', '44rpx', '36rpx', '52rpx', '40rpx', '48rpx', '32rpx'];
});

const currentChartLabels = computed(() => {
  if (selectedRangeIndex.value === 0) return ['一','二','三','四','五','六','日'];
  return ['1号','10号','20号','30号']; 
});

const activeDiffLabel = computed(() => ['昨日', '上月'][selectedRangeIndex.value]);
const activeDiffValue = computed(() => {
  if (selectedRangeIndex.value === 0) {
    const asset = overView.value && overView.value.asset;
    return Number(coalesce(asset && asset.day_change_amount, 0));
  }
  const asset = overView.value && overView.value.asset;
  return Number(coalesce(asset && asset.week_change_percent, 0));
});
const activeDiffColor = computed(() => activeDiffValue.value > 0 ? 'up' : (activeDiffValue.value < 0 ? 'down' : 'secondary'));

const goBack = () => uni.navigateBack();
const toLedgerAll = () => uni.navigateTo({ url: '/pages/ledger-all/ledger-all?roomId=' + roomId.value + "&accountId=" + accountId.value });
</script>

<style scoped>
.details-container {
  background-color: var(--primary-soft, #EEF2FF);
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  transition: background-color 0.35s ease;
}

/* 增强背景 */
.mesh-bg { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
.blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.12; transition: background 0.35s ease; }
.blob-1 { top: -10%; left: -10%; width: 300px; height: 300px; background: var(--primary-color, #4F46E5); }
.blob-2 { bottom: 10%; right: -10%; width: 350px; height: 350px; background: var(--secondary-color, #7C3AED); }
.blob-3 { top: 30%; right: 20%; width: 200px; height: 200px; background: var(--primary-color, #4F46E5); opacity: 0.06; }
.noise-overlay { position: absolute; inset: 0; opacity: 0.02; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }

@keyframes drift { from { transform: translate(0,0); } to { transform: translate(30px, 20px); } }
.animate-drift-1 { animation: drift 20s infinite alternate linear; }

/* 维度切换器：重构美化版 */
.period-dock { padding: 16px 24px; z-index: 10; }
.period-capsule { 
  height: 44px; 
  background: rgba(255, 255, 255, 0.5); 
  backdrop-filter: blur(15px); 
  -webkit-backdrop-filter: blur(15px);
  border-radius: 100px; 
  display: flex; 
  position: relative; 
  padding: 4px; 
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
}
.period-item { 
  flex: 1; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  z-index: 2; 
  transition: all 0.3s ease;
}
.period-txt { 
  font-size: 13px; 
  font-weight: 800; 
  color: #94A3B8; 
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.active .period-txt { 
  color: var(--primary-color, #4F46E5);
  transform: scale(1.05);
}
.period-slider { 
  position: absolute; 
  height: calc(100% - 8px); 
  background: #FFFFFF; 
  border-radius: 100px; 
  z-index: 1; 
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06); 
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); 
  overflow: hidden;
}
.slider-inner-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%);
  opacity: 0.8;
}

.details-scroll { flex: 1; height: 0; z-index: 1; }
.scroll-content { padding: 0 24px 24px; }

.hero-section { padding: 8px 0 24px; }
.hero-main-card {
  background: rgba(255,255,255,0.75);
  backdrop-filter: blur(30px);
  border-radius: 44px;
  padding: 15px 20px;
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 25px 60px var(--primary-glow, rgba(79, 70, 229, 0.1));
  text-align: center;
  transition: box-shadow 0.35s ease;
}
.hero-label { font-size: 11px; font-weight: 900; color: #94A3B8; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px; display: block; }
.hero-sublabel { font-size: 11px; font-weight: 700; color: #CBD5E1; display: block; margin-bottom: 8px; }
.hero-amount { display: flex; align-items: baseline; justify-content: center; margin-bottom: 15px; }
.amount-symbol { font-size: 24px; font-weight: 900; color: var(--primary-color, #4F46E5); margin-right: 6px; }
.amount-val { font-size: 52px; font-weight: 900; color: #1E293B; letter-spacing: -2px; }

.hero-stats-row {
  display: flex;
  background: var(--primary-soft, #EEF2FF);
  border-radius: 28px;
  padding: 18px 12px;
  border: 1px solid var(--primary-soft, #EEF2FF);
  transition: background 0.35s ease, border-color 0.35s ease;
}
.stat-item { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.stat-divider { width: 1px; height: 32px; background: #E2E8F0; margin: 0 10px; }
.stat-label { font-size: 9px; font-weight: 800; color: #94A3B8; text-transform: uppercase; }
.stat-val { font-size: 15px; font-weight: 900; }
.income { color: #F43F5E; }
.expense { color: #10B981; }

.badge-txt { font-size: 15px; font-weight: 800; }
.up .badge-txt { color: #F43F5E; }
.down .badge-txt { color: #10B981; }

/* 图表容器 */
.content-card {
  background: #fff;
  border-radius: 40px;
  padding: 28px;
  border: 1px solid var(--primary-soft, #EEF2FF);
  box-shadow: 0 10px 30px var(--primary-glow, rgba(79, 70, 229, 0.05));
  margin-bottom: 32px;
  transition: border-color 0.35s ease, box-shadow 0.35s ease;
}
.card-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.card-header { display: flex; align-items: center; gap: 10px; }
.header-indicator { width: 4px; height: 18px; border-radius: 10px; }
.header-indicator.purple { background: var(--primary-color, #4F46E5); transition: background 0.35s ease; }
.header-indicator.blue { background: var(--secondary-color, #7C3AED); transition: background 0.35s ease; }
.header-title { font-size: 15px; font-weight: 900; color: #1E293B; }

.chart-legend { display: flex; gap: 12px; }
.legend-item { display: flex; align-items: center; gap: 6px; }
.l-dot { width: 8px; height: 8px; border-radius: 50%; }
.l-dot.inc { background: #10B981; }
.l-dot.exp { background: var(--primary-color, #4F46E5); }
.legend-item text { font-size: 10px; font-weight: 800; color: #94A3B8; }

.chart-container { height: 120px; display: flex; flex-direction: column; }

.chart-skeleton {
  height: 120px;
  display: flex;
  flex-direction: column;
  padding: 0 4px;
}
.chart-sk-bars {
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
}
.chart-sk-bar {
  flex: 1;
  height: 55%;
  border-radius: 8px 8px 0 0;
  background: #f1f5f9;
}
.chart-sk-bar:nth-child(odd) { height: 40%; }
.chart-sk-bar:nth-child(3) { height: 70%; }
.chart-sk-labels {
  height: 12px;
  margin-top: 16px;
  border-radius: 6px;
  background: #f1f5f9;
}

.chart-empty-state {
  min-height: 280rpx;
  padding: 32rpx 24rpx 28rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #fff 0%, var(--primary-soft, #eef2ff) 100%);
  border-radius: 28rpx;
  border: 1.5px dashed var(--primary-soft, #e2e8f0);
  transition: background 0.35s ease, border-color 0.35s ease;
}
.ce-visual {
  width: 100%;
  max-width: 520rpx;
  margin-bottom: 28rpx;
}
.ce-bars-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12rpx;
  height: 120rpx;
  padding: 0 8rpx;
}
.ce-bar-wrap {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: var(--primary-soft, #eef2ff);
  border-radius: 12rpx 12rpx 0 0;
  opacity: 0.65;
  transition: background 0.35s ease;
}
.ce-bar {
  width: 72%;
  border-radius: 10rpx 10rpx 0 0;
  background: linear-gradient(
    180deg,
    rgba(203, 213, 225, 0.35) 0%,
    rgba(148, 163, 184, 0.2) 100%
  );
}
.ce-axis {
  height: 2rpx;
  margin-top: 16rpx;
  background: linear-gradient(
    90deg,
    transparent,
    var(--primary-color, #4f46e5) 20%,
    var(--primary-color, #4f46e5) 80%,
    transparent
  );
  opacity: 0.2;
}
.ce-labels-row {
  display: flex;
  justify-content: space-between;
  padding: 12rpx 8rpx 0;
  margin-top: 4rpx;
}
.ce-day-label {
  flex: 1;
  text-align: center;
  font-size: 18rpx;
  font-weight: 800;
  color: #cbd5e1;
}
.ce-text-box {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  margin-bottom: 24rpx;
}
.ce-title {
  font-size: 28rpx;
  font-weight: 900;
  color: #475569;
  letter-spacing: -0.3px;
}
.ce-sub {
  font-size: 24rpx;
  font-weight: 600;
  color: #94a3b8;
  line-height: 1.5;
  max-width: 440rpx;
}
.ce-legend-hint {
  display: flex;
  gap: 24rpx;
  padding: 12rpx 24rpx;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 100rpx;
  border: 1px solid #f1f5f9;
}
.chart-bars { flex: 1; display: flex; align-items: flex-end; justify-content: space-between; padding: 0 4px; gap: 8px; position: relative; }
.bar-wrap {
  flex: 1; position: relative; height: 100%;
  display: flex; flex-direction: column; justify-content: flex-end; align-items: center;
  background-color: var(--primary-soft, #EEF2FF);
  border-radius: 8px 8px 0 0;
  transition: background-color 0.35s ease;
}

/* 维度自适应柱体 */
.view-week .bar-stack-fill { width: 95%; border-radius: 8px 8px 0 0; }
.view-month { gap: 3px; }
.view-month .bar-stack-fill { width: 100%; border-radius: 4px; }

.bar-stack-fill { 
  background: #F1F5F9; 
  position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); 
  overflow: hidden; display: flex; flex-direction: column-reverse; z-index: 2; 
  transition: height 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275), width 0.4s, border-radius 0.4s;
}
.bar-stack-fill.active { transform: translateX(-50%) scaleX(1.3); box-shadow: 0 8px 20px rgba(0,0,0,0.1); }

.segment { width: 100%; transition: height 1s cubic-bezier(0.19, 1, 0.22, 1); }
.segment.income { background: #10B981; }
.segment.expense { background: var(--primary-color, #4F46E5); }

/* 气泡美化 */
.bar-val-hint { 
  position: absolute; top: -50px; left: 50%; transform: translateX(-50%); 
  background: var(--primary-color, #4F46E5);
  padding: 8px 12px; border-radius: 14px; 
  z-index: 100; box-shadow: 0 8px 24px var(--primary-glow, rgba(79, 70, 229, 0.35));
  white-space: nowrap;
  transition: background 0.35s ease, box-shadow 0.35s ease;
}
.bar-val-hint::after {
  content: '';
  position: absolute; bottom: -5px; left: 50%;
  transform: translateX(-50%) rotate(45deg);
  width: 10px; height: 10px;
  background: var(--primary-color, #4F46E5);
}
.hint-line { display: flex; align-items: center; gap: 4px; margin-bottom: 2px; }
.hint-line:last-child { margin-bottom: 0; }
.h-l { color: rgba(255,255,255,0.4); font-size: 9px; font-weight: 800; }
.h-v { color: #fff; font-size: 11px; font-weight: 900; letter-spacing: 0.2px; }

.chart-labels { display: flex; justify-content: space-between; padding: 16px 4px 0; border-top: 1px solid var(--primary-soft, #EEF2FF); }
.chart-label { font-size: 9px; font-weight: 800; color: #CBD5E1; text-align: center; }

/* 资产列表 */
.section-group { margin-bottom: 40px; }
.group-header { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; padding-left: 8px; }
.group-title { font-size: 18px; font-weight: 900; color: #1E293B; }

.asset-modern-stack { display: flex; flex-direction: column; gap: 16px; }
.asset-modern-item { 
  background: #fff; border-radius: 32px; padding: 10px 20px; 
  display: flex; justify-content: space-between; align-items: center;
  border: 1px solid var(--primary-soft, #EEF2FF);
  box-shadow: 0 8px 24px var(--primary-glow, rgba(79, 70, 229, 0.04));
  transition: all 0.3s, border-color 0.35s ease, box-shadow 0.35s ease;
}
.asset-modern-item:active { transform: scale(0.98); background: var(--primary-soft, #EEF2FF); }

.ami-left { display: flex; align-items: center; gap: 20px; flex: 1; }
.ami-icon-box { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.ami-icon-img { width: 24px; height: 24px; border-radius: 6px; }
.ami-emoji { font-size: 24px; }
.ami-info { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.ami-title-row { display: flex; justify-content: space-between; align-items: center; }
.ami-name { font-size: 15px; font-weight: 900; color: #334155; }
.ami-progress-track { height: 7.5px; background: var(--primary-soft, #EEF2FF); border-radius: 100px; overflow: hidden; transition: background 0.35s ease; }
.ami-progress-fill { height: 100%; border-radius: 100px; position: relative; transition: width 1.2s cubic-bezier(0.2, 0.8, 0.2, 1); }
.ami-shimmer { position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent); animation: shimmer 2s infinite; }

.ami-right { text-align: right; }
.ami-amount { font-size: 17px; font-weight: 900; color: #1E293B; display: block; }
.ami-sub { font-size: 12px; font-weight: 900; color: #CBD5E1; letter-spacing: 1px; margin-top: 2px; margin-left: 3px;}

/* 历史列表 */
.history-section { margin-top: 20px; }
.history-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 18px; }
.history-title { font-size: 16px; font-weight: 900; color: #1E293B; }
.history-all { font-size: 12px; font-weight: 800; color: var(--primary-color, #4F46E5); }
.history-list-card {
  background: #fff;
  border-radius: 36px;
  padding: 12px;
  border: 1px solid var(--primary-soft, #EEF2FF);
  box-shadow: 0 8px 24px var(--primary-glow, rgba(79, 70, 229, 0.04));
  transition: border-color 0.35s ease, box-shadow 0.35s ease;
}
.history-item { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--primary-soft, #EEF2FF); }
.history-item:last-child { border-bottom: none; }

.history-empty-card {
  background: #fff;
  border-radius: 36px;
  padding: 48px 32px;
  border: 1.5px dashed var(--primary-soft, #EEF2FF);
  box-shadow: 0 8px 24px var(--primary-glow, rgba(79, 70, 229, 0.04));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  transition: border-color 0.35s ease, box-shadow 0.35s ease;
}
.he-decoration {
  position: relative;
  width: 120rpx;
  height: 120rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
}
.he-circle {
  position: absolute;
  inset: 0;
  background: var(--primary-soft, #EEF2FF);
  border-radius: 32rpx;
  transform: rotate(12deg);
  transition: background 0.35s ease;
}
.he-emoji {
  font-size: 48rpx;
  position: relative;
  z-index: 1;
  opacity: 0.85;
  animation: floatSmall 3s infinite ease-in-out;
}
.he-text-box { display: flex; flex-direction: column; gap: 8rpx; align-items: center; }
.he-main { font-size: 28rpx; font-weight: 900; color: #64748b; }
.he-sub {
  font-size: 24rpx;
  font-weight: 600;
  color: #94a3b8;
  line-height: 1.5;
  max-width: 420rpx;
}

.animate-inner-pop { animation: innerPop 0.5s cubic-bezier(0.19, 1, 0.22, 1) both; }
@keyframes innerPop {
  from { opacity: 0; transform: translateY(20rpx) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes floatSmall {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-6rpx) rotate(-4deg); }
}

.h-left { display: flex; align-items: center; gap: 14px; }
.h-icon { width: 40px; height: 40px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-weight: bold; }
.h-icon.income { background: #FFF1F2; color: #F43F5E }
.h-icon.expense { background: #ECFDF5; color: #10B981; }
.h-info { display: flex; flex-direction: column; }
.h-name { font-size: 14px; font-weight: 800; color: #334155; }
.h-meta { font-size: 10px; font-weight: 700; color: #CBD5E1; }
.h-amount { font-size: 15px; font-weight: 900; color: #1E293B; }
.positive { color: #10B981; }

.animate-fade-in { animation: fadeIn 0.6s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.animate-tooltip-in { animation: tooltipIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) both; }
@keyframes tooltipIn { from { opacity: 0; transform: translateX(-50%) scale(0.8) translateY(10px); } to { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); } }

.animate-spring { animation: springIn 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) both; }
@keyframes springIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
.animate-scale-in { animation: scaleIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
@keyframes scaleIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
.animate-slide-up { animation: slideUp 0.7s cubic-bezier(0.19, 1, 0.22, 1) both; }
@keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
.animate-slide-in { animation: slideIn 0.7s cubic-bezier(0.19, 1, 0.22, 1) both; }
@keyframes slideIn { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }

.shimmer { position: relative; overflow: hidden; background: #F1F5F9 !important; }
.shimmer::after { position: absolute; top: 0; right: 0; bottom: 0; left: 0; transform: translateX(-100%); background-image: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent); animation: shimmerAnim 1.8s infinite; content: ''; }
@keyframes shimmerAnim { 100% { transform: translateX(100%); } }

.skeleton-mode { pointer-events: none; }
</style>
