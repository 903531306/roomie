
<template>
  <view :class="themeClass" class="ledger-all-root" :style="themeStyles">
    <view class="page-ambient" aria-hidden="true">
      <view class="ambient-blob blob-primary"></view>
      <view class="ambient-blob blob-secondary"></view>
    </view>
    <IosNav title="收支流水" @leftClick="goBack" :rightText="isLocked() ? '' : '导入'" @rightClick="goToImport" />

    <!-- 顶部固定筛选与汇总区 -->
    <view class="sticky-header">
      <view class="filter-capsule-row">
        <scroll-view scroll-x class="filter-scroll" :show-scrollbar="false">
          <view class="filter-flex">
            <view 
              v-for="p in periods" 
              :key="p.code" 
              class="filter-pill"
              :class="{ active: currentPeriod === p.code }"
              @click="onPeriodChange(p.code)"
            >
              <text class="pill-txt">{{ p.name }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 动态汇总视窗 -->
      <view class="summary-viewport">
        <block v-if="isLoadingSummary">
          <view class="sum-card sk-item shimmer" v-for="i in 2" :key="'sk-sum-'+i"></view>
        </block>
        <block v-else>
          <view class="sum-card income animate-fade-in">
            <text class="sum-label">期间收入</text>
            <view class="sum-val-row">
              <text class="sum-sym">¥</text>
              <text class="sum-val">{{ formatPrice(summaryData?.income || 0.00) }}</text>
            </view>
            <view class="sum-bg-icon">↗</view>
          </view>
          <view class="sum-card expense animate-fade-in">
            <text class="sum-label">期间支出</text>
            <view class="sum-val-row">
              <text class="sum-sym">¥</text>
              <text class="sum-val">{{ formatPrice(summaryData?.expense || 0.00) }}</text>
            </view>
            <view class="sum-bg-icon">↘</view>
          </view>
        </block>
      </view>
    </view>

    <!-- 滚动列表 -->
    <scroll-view scroll-y class="main-list-scroll" :show-scrollbar="false" enable-back-to-top>
      <view class="list-inner">
        
        <!-- 1. 初始加载骨架屏 -->
        <view v-if="isLoadingGroups" class="skeleton-stack">
          <view v-for="g in 3" :key="'sk-g-'+g" class="sk-group">
            <view class="sk-header shimmer"></view>
          </view>
        </view>

        <!-- 2. 精美空状态 -->
        <view v-else-if="groupedData.length === 0" class="premium-empty-view animate-fade-in">
          <view class="empty-graphic-wrap">
            <view class="magic-blob-1"></view>
            <view class="magic-blob-2"></view>
            <view class="main-icon-circle">
              <text class="emoji-hero">🌱</text>
            </view>
          </view>
          
          <view class="empty-text-group">
            <text class="empty-title">流水账本空空如也</text>
            <text class="empty-subtitle">每一个伟大的家庭财务计划，都从记录第一笔细小的支出开始。</text>
          </view>
          
          <button v-if="!isLocked()" class="empty-primary-btn" @click="goToAdd">
            <text class="btn-icon">+</text>
            <text class="btn-text">立即记一笔</text>
          </button>
          
          <view class="empty-ambient-light"></view>
        </view>

        <template v-else>
        <!-- 左滑引导（仅首次；无可见明细时用示意卡片） -->
        <view
          v-if="showSwipeGuide && swipeGuideMode === 'standalone'"
          class="swipe-coach-standalone animate-fade-in"
        >
          <view class="swipe-coach-mock">
            <view class="swipe-coach-actions">
              <view class="swipe-coach-btn edit">修改</view>
              <view class="swipe-coach-btn delete">删除</view>
            </view>
            <view class="swipe-coach-cell">
              <view class="swipe-coach-cell-left">
                <view class="swipe-coach-icon">💰</view>
                <view class="swipe-coach-lines">
                  <view class="swipe-coach-line w1"></view>
                  <view class="swipe-coach-line w2"></view>
                </view>
              </view>
              <text class="swipe-coach-amt">-¥0.00</text>
            </view>
            <view class="swipe-coach-hand" aria-hidden="true">
              <text class="swipe-coach-hand-icon">👆</text>
            </view>
          </view>
          <text class="swipe-coach-title">向左滑动账目</text>
          <text class="swipe-coach-sub">可修改或删除记录，试试看吧</text>
          <view class="swipe-coach-dismiss" @click.stop="dismissSwipeGuide">
            <text>知道了</text>
          </view>
        </view>

        <!-- 3. 分组显示 -->
        <view v-for="(group, gIdx) in groupedData" :key="gIdx" class="day-group">
          
          <!-- 情况A：今日数据 -->
          <block v-if="group.date === '今日'">
            <view
              class="item-stack today-direct-stack animate-fade-in"
              :class="{ 'coach-guide-active': groupHasCoachTarget(group) }"
            >
              <view v-if="group.isLoading && (!group.ledgers || group.ledgers.length === 0)" class="inner-loading">
                <view class="spinner-dot"></view>
                <text class="loading-txt">正在拉取今日明细...</text>
              </view>

              <view 
                v-for="(item, iIdx) in group.ledgers" 
                :key="item.id" 
                class="swipe-cell-container"
                :class="{ 'coach-swipe-open': isCoachTarget(group, item) }"
              >
                <!-- 底层操作按钮 -->
                <view class="cell-actions-back" v-if="!isLocked() && !item.isDeleted && item.status !== 'void'">
                  <view class="swipe-btn edit" @click.stop="onEdit(item)">
                    <text class="sb-icon">✏️</text>
                    <text class="sb-txt">修改</text>
                  </view>
                  <view class="swipe-btn delete" @click.stop="onDelete(item)">
                    <text class="sb-icon">🗑️</text>
                    <text class="sb-txt">删除</text>
                  </view>
                </view>

                <!-- 表层内容区 -->
                <view 
                  class="transaction-cell"
                  :class="{ 
                    'is-locked-item': isLocked(item), 
                    'is-voided': item.isDeleted || item.status === 'void',
                    'is-swiped': activeSwipeId === getSwipeKey(group, item),
                    'coach-swipe-demo': isCoachTarget(group, item)
                  }"
                  :style="getCellTransform(group, item)"
                  @touchstart="onTouchStart($event, item, group)"
                  @touchmove="onTouchMove($event, item, group)"
                  @touchend="onTouchEnd($event, item, group)"
                  @click="onItemClick(item, group)"
                >
                  <view class="cell-left">
                    <view class="category-icon" :style="{ background: item.type === 'income' ? incomeIconBg : expenseIconBg }">
                      <image v-if="isImageUrl(item.categoryIcon)" :src="item.categoryIcon" mode="aspectFill" class="cell-icon-img" />
                      <text v-else class="emoji">{{ item.categoryIcon || '💰' }}</text>
                    </view>
                    <view class="cell-info">
                      <view class="cell-top">
                        <view class="cell-title-row">
                          <text class="cell-title">{{ item.category }}</text>
                          <text v-if="item.isModified" class="mod-tag">已修改</text>
                          <text v-if="item.creatorNickname" class="meta-user">{{ item.creatorNickname }}</text>
                        </view>
                        <text class="cell-amount" :class="item.type">
                          {{ item.type === 'income' ? '+' : '-' }}{{ formatPrice(item.amount) }}
                        </text>
                      </view>
                      <view class="cell-sub">
                        <text class="meta-time">{{ formatDate(item.entryTime,'MM/dd HH:mm') }}</text>
                        <view v-if="item.note" class="cell-note-wrap">
                          <text class="cell-note">{{ item.note }}</text>
                        </view>
                      </view>
                    </view>
                  </view>

                  <!-- 作废印章 -->
                  <view v-if="item.status=='void' || item.isDeleted" class="void-badge">
                    <text class="vb-txt">已作废</text>
                  </view>
                </view>

                <view v-if="isCoachTarget(group, item)" class="swipe-guide-float" @click.stop="dismissSwipeGuide">
                  <view class="swipe-guide-hand" aria-hidden="true">
                    <text class="swipe-guide-hand-icon">👆</text>
                  </view>
                  <text class="swipe-guide-txt">向左滑动 · 修改 / 删除</text>
                  <text class="swipe-guide-skip">知道了</text>
                </view>
              </view>

              <!-- 分组内加载更多 -->
              <view v-if="group.hasMore" class="group-load-more" @click.stop="loadMoreInGroup(gIdx, group)">
                <text v-if="!group.isLoading" class="lm-txt">查看更多今日记录</text>
                <view v-else class="mini-spinner"></view>
              </view>

              <!-- 空状态 -->
              <view v-if="!group.isLoading && (!group.ledgers || group.ledgers.length === 0)" class="inner-premium-empty animate-inner-pop">
                <view class="ie-decoration">
                   <view class="ie-circle"></view>
                   <text class="ie-emoji">🍃</text>
                </view>
                <view class="ie-text-box">
                   <text class="ie-main">今日暂无明细</text>
                   <text class="ie-sub">让每一笔消费都有迹可循</text>
                </view>
              </view>
            </view>
          </block>

          <!-- 情况B：非今日数据 -->
          <block v-else>
            <view 
              class="sticky-day-header"
              :class="{ 'header-active': !collapsedGroups[gIdx] }"
              @click="toggleGroup(gIdx, group)"
            >
              <view class="header-blur-bg"></view>
              <view class="header-content">
                <view class="day-left">
                  <view class="collapse-arrow" :class="{ 'rotated': !collapsedGroups[gIdx] }">›</view>
                  <text class="day-title">{{ group.date }}</text>
                  <text v-if="group.day_name" class="day-sub">{{ group.day_name }}</text>
                </view>
                <view class="day-right">
                  <text class="day-sum">支 {{ group.total_expense }} / 收 {{ group.total_income }}</text>
                </view>
              </view>
            </view>

            <view 
              class="collapsible-wrapper" 
              :style="{ 
                maxHeight: collapsedGroups[gIdx] ? '0px' : '5000px',
                opacity: collapsedGroups[gIdx] ? '0' : '1',
                marginBottom: collapsedGroups[gIdx] ? '0px' : '0px'
              }"
            >
              <view class="item-stack" :class="{ 'coach-guide-active': groupHasCoachTarget(group) }">
                <view v-if="group.isLoading && (!group.ledgers || group.ledgers.length === 0)" class="inner-loading">
                  <view class="spinner-dot"></view>
                  <text class="loading-txt">正在拉取明细...</text>
                </view>

                <view 
                  v-for="(item, iIdx) in group.ledgers" 
                  :key="item.id" 
                  class="swipe-cell-container"
                  :class="{ 'coach-swipe-open': isCoachTarget(group, item) }"
                >
                  <!-- 底层操作按钮 -->
                  <view class="cell-actions-back" v-if="!isLocked() && !item.isDeleted && item.status !== 'void'">
                    <view class="swipe-btn edit" @click.stop="onEdit(item)">
                      <text class="sb-icon">✏️</text>
                      <text class="sb-txt">修改</text>
                    </view>
                    <view class="swipe-btn delete" @click.stop="onDelete(item)">
                      <text class="sb-icon">🗑️</text>
                      <text class="sb-txt">删除</text>
                    </view>
                  </view>

                  <view 
                    class="transaction-cell"
                    :class="{ 
                      'is-locked-item': isLocked(item), 
                      'is-voided': item.isDeleted || item.status === 'void',
                      'is-swiped': activeSwipeId === getSwipeKey(group, item),
                      'coach-swipe-demo': isCoachTarget(group, item)
                    }"
                    :style="getCellTransform(group, item)"
                    @touchstart="onTouchStart($event, item, group)"
                    @touchmove="onTouchMove($event, item, group)"
                    @touchend="onTouchEnd($event, item, group)"
                    @click="onItemClick(item, group)"
                  >
                    <view class="cell-left">
                      <view class="category-icon" :style="{ background: item.type === 'income' ? incomeIconBg : expenseIconBg }">
                        <image v-if="isImageUrl(item.categoryIcon)" :src="item.categoryIcon" mode="aspectFill" class="cell-icon-img" />
                        <text v-else class="emoji">{{ item.categoryIcon || '💰' }}</text>
                      </view>
                      <view class="cell-info">
                        <view class="cell-top">
                          <view class="cell-title-row">
                            <text class="cell-title">{{ item.category }}</text>
                            <text v-if="item.isModified" class="mod-tag">已修改</text>
                            <text v-if="item.creatorNickname" class="meta-user">{{ item.creatorNickname }}</text>
                          </view>
                          <text class="cell-amount" :class="item.type">
                            {{ item.type === 'income' ? '+' : '-' }}{{ formatPrice(item.amount) }}
                          </text>
                        </view>
                        <view class="cell-sub">
                          <text class="meta-time">{{ formatDate(item.entryTime,'MM/dd HH:mm') }}</text>
                          <view v-if="item.note" class="cell-note-wrap">
                            <text class="cell-note">{{ item.note }}</text>
                          </view>
                        </view>
                      </view>
                    </view>

                    <!-- 作废印章 -->
                    <view v-if="item.isDeleted || item.status === 'void'" class="void-badge">
                      <text class="vb-txt">已作废</text>
                    </view>
                  </view>

                  <view v-if="isCoachTarget(group, item)" class="swipe-guide-float" @click.stop="dismissSwipeGuide">
                    <view class="swipe-guide-hand" aria-hidden="true">
                      <text class="swipe-guide-hand-icon">👆</text>
                    </view>
                    <text class="swipe-guide-txt">向左滑动 · 修改 / 删除</text>
                    <text class="swipe-guide-skip">知道了</text>
                  </view>
                </view>

                <view v-if="group.hasMore" class="group-load-more" @click.stop="loadMoreInGroup(gIdx, group)">
                  <text v-if="!group.isLoading" class="lm-txt">查看更多 {{ group.date }} 的记录</text>
                  <view v-else class="mini-spinner"></view>
                </view>

                <view v-if="!group.isLoading && (!group.ledgers || group.ledgers.length === 0)" class="inner-premium-empty animate-inner-pop">
                  <view class="ie-decoration">
                     <view class="ie-circle"></view>
                     <text class="ie-emoji">🍃</text>
                  </view>
                  <view class="ie-text-box">
                     <text class="ie-main">暂无交易明细</text>
                     <text class="ie-sub">该时段未产生收支流水记录</text>
                  </view>
                </view>
              </view>
            </view>
          </block>
        </view>
        </template>

        <view v-if="!isLoadingGroups && groupedData.length > 0" class="list-end">
          <view class="end-line"></view>
          <text class="end-txt">END OF RECORDS</text>
          <view class="end-line"></view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部悬浮按钮 -->
    <view v-if="!isLocked()" class="floating-fab animate-pop-in" @click="goToAdd">
      <view class="fab-inner">
        <text class="fab-plus">+</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, reactive, onUnmounted, nextTick } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useAppTheme } from '@/common/themes/useAppTheme.js';
import IosNav from '../../components/nav/ios-nav.vue';
import { taskApi } from '../../common/api';
import { formatDate, formatPrice } from '../../pages/js/utils.js';
import dataJson from '/data.json';

const { themeClass, themeStyles } = useAppTheme();
const incomeIconBg = '#FFF1F2';
const expenseIconBg = '#ECFDF5';

const roomId = ref(null);
const accountId=ref(null);
const isLoadingSummary = ref(true);
const isLoadingGroups = ref(true);
const currentPeriod = ref('today');
const summaryData = ref({ income: 0, expense: 0,currentUserId:0,currentUserRole:'' });
const groupedData = ref([]);
const collapsedGroups = reactive({});

// 判断是否为图片 URL 的辅助函数
const isImageUrl = (val) => {
  if (typeof val !== 'string') return false;
  const v = val.toLowerCase();
  return v.startsWith('http') || v.startsWith('/') || v.startsWith('data:image') || v.includes('.png') || v.includes('.jpg') || v.includes('.jpeg') || v.includes('.webp');
};

// --- 左滑交互逻辑 ---
const LEDGER_SWIPE_GUIDE_KEY = 'ledger_swipe_guide_done';
const activeSwipeId = ref(null);
const showSwipeGuide = ref(false);
const swipeGuideMode = ref('none'); // 'row' | 'standalone' | 'none'
const coachTargetKey = ref(null);
let startX = 0;
let currentX = 0;
let coachAutoTimer = null;

const getSwipeKey = (group, item) => `${group.date}_${item.id}`;

const hasSeenSwipeGuide = () => !!uni.getStorageSync(LEDGER_SWIPE_GUIDE_KEY);

const dismissSwipeGuide = () => {
  showSwipeGuide.value = false;
  swipeGuideMode.value = 'none';
  coachTargetKey.value = null;
  if (coachAutoTimer) {
    clearTimeout(coachAutoTimer);
    coachAutoTimer = null;
  }
  uni.setStorageSync(LEDGER_SWIPE_GUIDE_KEY, '1');
};

const markSwipeGuideDone = () => {
  if (!hasSeenSwipeGuide()) dismissSwipeGuide();
};

const findFirstSwipeableItem = () => {
  for (const group of groupedData.value) {
    for (const item of group.ledgers || []) {
      if (!item.isDeleted && item.status !== 'void') {
        return { key: getSwipeKey(group, item) };
      }
    }
  }
  return null;
};

const scheduleSwipeGuide = () => {
  if (hasSeenSwipeGuide() || isLocked()) return;
  nextTick(() => {
    setTimeout(() => {
      if (hasSeenSwipeGuide() || isLocked()) return;
      if (isLoadingGroups.value || groupedData.value.length === 0) return;

      const first = findFirstSwipeableItem();
      if (first) {
        swipeGuideMode.value = 'row';
        coachTargetKey.value = first.key;
      } else {
        swipeGuideMode.value = 'standalone';
        coachTargetKey.value = null;
      }
      showSwipeGuide.value = true;
      if (coachAutoTimer) clearTimeout(coachAutoTimer);
      coachAutoTimer = setTimeout(() => dismissSwipeGuide(), 9000);
    }, 500);
  });
};

const isCoachTarget = (group, item) =>
  showSwipeGuide.value &&
  swipeGuideMode.value === 'row' &&
  coachTargetKey.value === getSwipeKey(group, item);

const groupHasCoachTarget = (group) =>
  showSwipeGuide.value &&
  swipeGuideMode.value === 'row' &&
  (group.ledgers || []).some((item) => coachTargetKey.value === getSwipeKey(group, item));

const getCellTransform = (group, item) => {
  if (isCoachTarget(group, item)) return {};
  const key = getSwipeKey(group, item);
  if (activeSwipeId.value === key) return { transform: 'translateX(-160px)' };
  return { transform: 'translateX(0)' };
};

const onTouchStart = (e, item, group) => {
  if (isLocked() || item.isDeleted || item.status === 'void') return;
  startX = e.touches[0].clientX;
};

const onTouchMove = (e, item, group) => {
  if (isLocked() || item.isDeleted || item.status === 'void') return;
  currentX = e.touches[0].clientX;
  const diff = startX - currentX;
  const swipeKey = getSwipeKey(group, item);

  if (diff > 30) {
    if (activeSwipeId.value !== swipeKey) activeSwipeId.value = swipeKey;
    markSwipeGuideDone();
  } else if (diff < -30 && activeSwipeId.value === swipeKey) {
    activeSwipeId.value = null;
  }
};

const onTouchEnd = () => {};
// -------------------

const periods = [
  { name: '今日', code: 'today' },
  { name: '本周', code: 'week' },
  { name: '本月', code: 'month' },
  { name: '本年', code: 'year' }
];

onLoad((e) => { 
  roomId.value = e.roomId; 
  console.log(e);
  accountId.value=e.accountId;
});

onMounted(() => {
  initPage();
  uni.$on('refresh_ledger_data', () => {
    initPage();
  });
});

onUnmounted(() => {
  uni.$off('refresh_ledger_data');
  if (coachAutoTimer) clearTimeout(coachAutoTimer);
});

const isLocked=()=>{
	if(summaryData.value&&summaryData.value.currentUserRole==='observer')return true;
	return false;
}

const initPage = async () => {
  isLoadingGroups.value = true;
  isLoadingSummary.value = true;
  activeSwipeId.value = null;
  showSwipeGuide.value = false;
  swipeGuideMode.value = 'none';
  coachTargetKey.value = null;
  if (coachAutoTimer) {
    clearTimeout(coachAutoTimer);
    coachAutoTimer = null;
  }
  Object.keys(collapsedGroups).forEach(key => delete collapsedGroups[key]);
  
  try {
    const res = await taskApi.getLedgerWeekList({ roomId: roomId.value }, currentPeriod.value);
    if (res.code == 0) {
      summaryData.value = { income: res.data.total_income, expense: res.data.total_expense,currentUserRole:res.data.currentUserRole,currentUserId:res.data.currentUserId };
      
      let rawGroups = [];
      if (currentPeriod.value === 'today') {
       rawGroups = Array.isArray(res.data.ledgers) && res.data.ledgers.length
         ? [{
             date: '今日',
             ledgers: res.data.ledgers,
             isLoaded: true
           }]
         : []
      } else {
        const listField = { week: 'days', month: 'weeks', year: 'months' }[currentPeriod.value];
        rawGroups = (res.data[listField] || []).map(g => ({
          ...g,
          ledgers: [],
          isLoaded: false,
          isLoading: false,
          page: 1,
          hasMore: false
        }));
      }
      
      groupedData.value = rawGroups;
      groupedData.value.forEach((_, idx) => collapsedGroups[idx] = true);
    }
  } finally {
    isLoadingGroups.value = false;
    isLoadingSummary.value = false;
    scheduleSwipeGuide();
  }
};

const toggleGroup = async (index, group) => {
  const isCurrentlyCollapsed = collapsedGroups[index];
  collapsedGroups[index] = !isCurrentlyCollapsed;
  if (isCurrentlyCollapsed && !group.isLoaded) {
    loadGroupData(index, group);
  }
};

const loadGroupData = async (index, group, isMore = false) => {
  if (group.isLoading) return;
  group.isLoading = true;
  try {
    const res = await taskApi.getGroupLedgers({
      roomId: roomId.value,
      period: currentPeriod.value,
      date: group.date,
      page: isMore ? group.page + 1 : 1
    });

    if (res.code === 0) {
      if (isMore) {
        group.ledgers = [...group.ledgers, ...res.data.rows];
        group.page += 1;
      } else {
        group.ledgers = res.data.rows || [];
        group.isLoaded = true;
      }
      group.hasMore = group.ledgers.length < (res.data.total || 0);
    }
  } catch (e) {
    console.error("加载分组失败", e);
  } finally {
    group.isLoading = false;
    if (!isMore) scheduleSwipeGuide();
  }
};

const loadMoreInGroup = (index, group) => {
  loadGroupData(index, group, true);
};

const onPeriodChange = (code) => {
  if (currentPeriod.value === code) return;
  currentPeriod.value = code;
  initPage();
};

const onItemClick = (item, group) => {
  const swipeKey = getSwipeKey(group, item);
  if (activeSwipeId.value === swipeKey) {
    activeSwipeId.value = null;
    return;
  }
};

const onEdit = (item) => {
  activeSwipeId.value = null;
  uni.navigateTo({
    url: `/pages/add-entry/add-entry?roomId=${roomId.value}&accountId=${accountId.value}&id=${item.id}&isEdit=true`
  });
};

const onDelete = (item) => {
  activeSwipeId.value = null;
  uni.showModal({
    title: '作废记录',
    content: '确定要作废这笔收支吗？作废后不可恢复，金额将不再计入总额。',
    confirmText: '确定作废',
    confirmColor: '#F43F5E',
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '正在作废...' });
        try {
          const resp = await taskApi.deleteLedger(item.id, roomId.value);
          if (resp.code === 0) {
            uni.showToast({ title: '已作废', icon: 'success' });
            item.isDeleted = true;
            uni.$emit('refresh_ledger_data');
          }
        } finally {
          uni.hideLoading();
        }
      }
    }
  });
};

const goBack = () => uni.navigateBack();
const goToAdd = () => uni.navigateTo({ url: '/pages/add-entry/add-entry?roomId='+roomId.value+"&accountId="+accountId.value });
const goToImport = () => {
  if (isLocked()) return;
  uni.navigateTo({
    url: `/pages/ledger-import/ledger-import?roomId=${roomId.value}&accountId=${accountId.value}`
  });
};
</script>

<style scoped>
.ledger-all-root {
  height: 100vh;
  background-color: var(--primary-soft, #EEF2FF);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  transition: background-color 0.35s ease;
}

.page-ambient { position: absolute; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
.ambient-blob { position: absolute; border-radius: 50%; filter: blur(120px); opacity: 0.1; transition: background 0.35s ease; }
.blob-primary { top: -50px; right: -40px; width: 280px; height: 280px; background: var(--primary-color, #4F46E5); }
.blob-secondary { bottom: 25%; left: -60px; width: 240px; height: 240px; background: var(--secondary-color, #7C3AED); }

.sticky-header,
.main-list-scroll {
  position: relative;
  z-index: 1;
}

/* 顶部固定区 */
.sticky-header { background: rgba(255, 255, 255, 0.92); padding-bottom: 20px; border-bottom: 1rpx solid var(--primary-soft, #EEF2FF); z-index: 200; backdrop-filter: blur(12px); }
.filter-capsule-row { display: flex; align-items: center; padding: 12px 20px; gap: 12px; }
.filter-scroll { flex: 1; white-space: nowrap; }
.filter-flex { display: flex; gap: 12px; }
.filter-pill {
  height: 36px; padding: 0 20px; display: inline-flex; align-items: center;
  background: var(--primary-soft, #EEF2FF); border-radius: 100px;
  transition: all 0.3s, background 0.35s ease, box-shadow 0.35s ease;
}
.filter-pill.active { background: var(--primary-color, #4F46E5); box-shadow: 0 8px 20px var(--primary-glow, rgba(79, 70, 229, 0.2)); }
.pill-txt { font-size: 13px; font-weight: 800; color: #94A3B8; }
.active .pill-txt { color: #fff; }

.summary-viewport { display: flex; padding: 0 20px; gap: 16px; margin-top: 4px; }
.sum-card { flex: 1;  border-radius: 26px; padding: 14px 20px; position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: center; }
.sum-card.income { background: #FFF1F2; border: 1rpx solid #FFE4E6; }
.sum-card.expense { background: #ECFDF5; border: 1rpx solid #D1FAE5; }
.sum-label { font-size: 10px; font-weight: 900; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px; }
.sum-val-row { display: flex; align-items: baseline; gap: 2px; margin-top: 2px; }
.sum-sym { font-size: 14px; font-weight: 900; }
.sum-val { font-size: 18px; font-weight: 900; }
.income .sum-val, .income .sum-sym { color: #F43F5E; }
.expense .sum-val, .expense .sum-sym { color: #10B981; }
.sum-bg-icon { position: absolute; right: -8px; bottom: -8px; font-size: 54px; font-weight: 900; opacity: 0.04; transform: rotate(-15deg); }

/* 列表滚动区 */
.main-list-scroll { flex: 1; height: 0; }

/* 左滑组件容器 */
.swipe-cell-container {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: #fff;
  flex-shrink: 0;
  transform: translateZ(0);
}

/* 底层按钮 */
.cell-actions-back {
  position: absolute;
  top: 2px;
  right: 0;
  bottom: 2px;
  height: auto;
  display: flex;
  align-items: stretch;
  justify-content: flex-end;
  z-index: 1;
  overflow: hidden;
  box-sizing: border-box;
}
.swipe-btn {
  width: 80px;
  height: 100%;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-sizing: border-box;
}
.swipe-btn.edit { background: var(--primary-color, #4F46E5); }
.swipe-btn.delete { background: #F43F5E; }
.sb-icon { font-size: 18px; color: #fff; margin-bottom: 2px; }
.sb-txt { font-size: 11px; font-weight: 900; color: #fff; }

/* 表层内容卡片 */
.transaction-cell {
  position: relative;
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: #fff;
  z-index: 2;
  box-sizing: border-box;
  transition: transform 0.5s cubic-bezier(0.19, 1, 0.22, 1);
  will-change: transform;
  border-bottom: 1rpx solid #f1f5f9;
  transform: translateZ(0);
}
.transaction-cell::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 3px;
  background: #fff;
  z-index: 3;
  pointer-events: none;
}
.item-stack .swipe-cell-container:last-child .transaction-cell {
  border-bottom: none;
}
.item-stack .swipe-cell-container:last-child .transaction-cell::after {
  height: 4px;
}

.is-swiped {
  box-shadow: -10px 0 30px rgba(0,0,0,0.05);
}

.is-voided { opacity: 0.45; filter: grayscale(1); pointer-events: none; }
.void-badge {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-15deg);
  border: 3rpx solid #F43F5E; padding: 6rpx 20rpx; border-radius: 8rpx;
  background: rgba(255, 255, 255, 0.9); z-index: 5; pointer-events: none;
}
.vb-txt { color: #F43F5E; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 2rpx; }
.mod-tag { font-size: 9px; font-weight: 900; background: var(--primary-soft, #EEF2FF); color: var(--primary-color, #4F46E5); padding: 2rpx 8rpx; border-radius: 4rpx; flex-shrink: 0; }

/* 列表内元素样式 */
.cell-left { display: flex; align-items: flex-start; gap: 16px; flex: 1; min-width: 0; }
.category-icon { width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; margin-top: 1px; }
.cell-icon-img { width: 22px; height: 22px; border-radius: 4px; }
.emoji { font-size: 18px; }
.cell-info { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0; }
.cell-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
}
.cell-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
  flex-wrap: wrap;
}
.cell-title {
  font-size: 15px;
  font-weight: 800;
  color: #334155;
  flex-shrink: 0;
  max-width: 100%;
}
.cell-sub {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  width: 100%;
  overflow: hidden;
}
.meta-time, .meta-user { font-size: 10px; font-weight: 700; color: #CBD5E1; flex-shrink: 0; }
.cell-amount { font-size: 16px; font-weight: 900; flex-shrink: 0; line-height: 1.2; }
.income { color: #F43F5E; }
.expense { color: #10B981; }
.cell-note-wrap {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}
.cell-note {
  display: block;
  width: 100%;
  font-size: 10px;
  font-weight: 700;
  color: #CBD5E1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 分组样式 */
.sticky-day-header { position: sticky; top: 0; z-index: 10; height: 64px; display: flex; align-items: center;  transition: all 0.3s; }
.header-active .header-blur-bg { background: rgba(255, 255, 255, 0.98); }
.header-blur-bg { position: absolute; inset: 0; background: var(--primary-soft, #EEF2FF); opacity: 0.94; backdrop-filter: blur(20px); border-bottom: 1rpx solid rgba(0,0,0,0.03); transition: background 0.35s ease; }
.header-content { position: relative; z-index: 2; width: 100%; display: flex; justify-content: space-between; align-items: flex-end; padding: 0 24px 12px; }
.day-left { display: flex; align-items: baseline; gap: 8px; }
.collapse-arrow { font-size: 18px; color: #CBD5E1; transition: transform 0.4s cubic-bezier(0.23, 1, 0.32, 1); margin-right: 4px; }
.collapse-arrow.rotated { transform: rotate(90deg); color: var(--primary-color, #4F46E5); }
.day-title { font-size: 17px; font-weight: 900; color: #1E293B; }
.day-sub { font-size: 12px; font-weight: 800; color: #94A3B8; }
.day-sum { font-size: 10px; font-weight: 800; color: #CBD5E1; text-transform: uppercase; }

.collapsible-wrapper { overflow: hidden; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); will-change: max-height, opacity, margin-bottom; }
.item-stack {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  box-sizing: border-box;
  background: #fff;
  border: none;
  border-radius: 0;
  overflow: hidden;
  box-shadow: none;
}
.today-direct-stack {
  margin: 0 0 12px;
  width: 100%;
}
.list-inner {
  padding: 0 0 8px;
  width: 100%;
  box-sizing: border-box;
}
.day-group {
  width: 100%;
}

/* 其它样式 */
.inner-premium-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 24px; background: #fff; }
.ie-decoration { position: relative; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
.ie-circle { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(241, 245, 249, 0.6) 0%, rgba(226, 232, 240, 0.4) 100%); border-radius: 20px; transform: rotate(15deg); }
.ie-emoji { font-size: 24px; position: relative; z-index: 1; animation: floatSmall 3s infinite ease-in-out; }
@keyframes floatSmall { 0%, 100% { transform: translateY(0) rotate(15deg); } 50% { transform: translateY(-4px) rotate(10deg); } }
.ie-text-box { text-align: center; }
.ie-main { font-size: 14px; font-weight: 800; color: #64748B; display: block; margin-bottom: 4px; }
.ie-sub { font-size: 10px; font-weight: 600; color: #CBD5E1; text-transform: uppercase; letter-spacing: 0.5px; }
.animate-inner-pop { animation: innerPop 0.5s cubic-bezier(0.19, 1, 0.22, 1) both; }
@keyframes innerPop { from { opacity: 0; transform: translateY(10px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }

.inner-loading { display: flex; flex-direction: column; align-items: center; padding: 40px 0; gap: 12px; }
.spinner-dot { width: 24px; height: 24px; border: 3px solid var(--primary-soft, #EEF2FF); border-top-color: var(--primary-color, #4F46E5); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.loading-txt { font-size: 12px; font-weight: 800; color: #94A3B8; }

.sk-header { width: 180px; height: 28px; background: #F1F5F9; border-radius: 8px; margin: 20px 24px; }
.shimmer { position: relative; overflow: hidden; background: #F1F5F9 !important; }
.shimmer::after { position: absolute; top: 0; right: 0; bottom: 0; left: 0; transform: translateX(-100%); background-image: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent); animation: shimmerAnim 2s infinite; content: ''; }
@keyframes shimmerAnim { 100% { transform: translateX(100%); } }

.list-end { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 40px 0 100px; }
.end-line { width: 30px; height: 1rpx; background: #E2E8F0; }
.end-txt { font-size: 10px; font-weight: 900; color: #CBD5E1; letter-spacing: 2px; }

.floating-fab {
  position: fixed; bottom: 44px; right: 24px; width: 60px; height: 60px;
  background: var(--primary-color, #4F46E5); border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 15px 35px var(--primary-glow, rgba(79, 70, 229, 0.3));
  z-index: 500;
  transition: background 0.35s ease, box-shadow 0.35s ease;
}
.fab-plus { color: #fff; font-size: 32px; font-weight: 300; }

.animate-fade-in { animation: fadeIn 0.6s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* 全局空状态 */
.premium-empty-view { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 40px 120px; text-align: center; position: relative; }
.empty-graphic-wrap { position: relative; width: 180px; height: 180px; margin-bottom: 40px; display: flex; align-items: center; justify-content: center; }
.magic-blob-1, .magic-blob-2 { position: absolute; inset: 0; border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; animation: morphBlob 8s infinite alternate ease-in-out; }
.magic-blob-1 { background: linear-gradient(135deg, var(--primary-soft, #EEF2FF) 0%, #E0E7FF 100%); opacity: 0.6; }
.magic-blob-2 { background: linear-gradient(135deg, var(--primary-glow, rgba(79, 70, 229, 0.1)) 0%, var(--primary-soft, #EEF2FF) 100%); transform: rotate(45deg); animation-delay: -2s; animation-duration: 10s; transition: background 0.35s ease; }
@keyframes morphBlob { 0% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; transform: rotate(0deg) scale(1); } 50% { border-radius: 60% 40% 30% 70% / 50% 30% 70% 50%; transform: rotate(180deg) scale(1.1); } 100% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; transform: rotate(360deg) scale(1); } }
.main-icon-circle { width: 90px; height: 90px; background: #fff; border-radius: 35px; display: flex; align-items: center; justify-content: center; box-shadow: 0 15px 35px var(--primary-glow, rgba(79, 70, 229, 0.1)); z-index: 5; animation: floatEmoji 4s infinite ease-in-out; }
@keyframes floatEmoji { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
.emoji-hero { font-size: 44px; }
.empty-text-group { margin-bottom: 48px; z-index: 2; }
.empty-title { font-size: 22px; font-weight: 900; color: #1E293B; display: block; margin-bottom: 12px; letter-spacing: -0.5px; }
.empty-subtitle { font-size: 14px; font-weight: 600; color: #94A3B8; line-height: 1.6; max-width: 240px; margin: 0 auto; }
.empty-primary-btn {
  background: var(--primary-color, #4F46E5); height: 64px; padding: 0 40px; border-radius: 100px;
  display: flex; align-items: center; justify-content: center; gap: 12px; border: none;
  box-shadow: 0 15px 30px var(--primary-glow, rgba(79, 70, 229, 0.25));
  transition: background 0.35s ease, box-shadow 0.35s ease, transform 0.2s; z-index: 2;
}
.empty-primary-btn:active { transform: scale(0.96); box-shadow: 0 8px 15px var(--primary-glow, rgba(79, 70, 229, 0.2)); }
.btn-icon { color: #fff; font-size: 20px; font-weight: 300; }
.btn-text { color: #fff; font-size: 16px; font-weight: 900; letter-spacing: 0.5px; }
.empty-ambient-light { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 300px; height: 300px; background: radial-gradient(circle, var(--primary-glow, rgba(79, 70, 229, 0.03)) 0%, transparent 70%); pointer-events: none; }

/* 左滑首次引导 */
.swipe-cell-container.coach-swipe-open { overflow: hidden; }
.item-stack.coach-guide-active { overflow: visible; }
.transaction-cell.coach-swipe-demo {
  animation: coachSwipeHint 1.7s cubic-bezier(0.4, 0, 0.2, 1) 0.35s 3;
  z-index: 3;
}
@keyframes coachSwipeHint {
  0%, 100% { transform: translateX(0); }
  38%, 62% { transform: translateX(-88px); }
}

.swipe-guide-float {
  position: absolute;
  left: 0;
  right: 0;
  top: -6px;
  transform: translateY(-100%);
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  pointer-events: auto;
  padding-bottom: 8px;
}
.swipe-guide-hand {
  animation: guideHandSwipe 1.7s ease-in-out 0.35s 3;
}
.swipe-guide-hand-icon {
  font-size: 28px;
  display: block;
  transform: rotate(-90deg);
  filter: drop-shadow(0 4px 8px rgba(15, 23, 42, 0.12));
}
@keyframes guideHandSwipe {
  0%, 100% { transform: translateX(36px); opacity: 0.9; }
  38%, 62% { transform: translateX(-40px); opacity: 1; }
}
.swipe-guide-txt {
  font-size: 12px;
  font-weight: 900;
  color: var(--primary-color, #4f46e5);
  background: #fff;
  padding: 6px 14px;
  border-radius: 100px;
  box-shadow: 0 6px 20px var(--primary-glow, rgba(79, 70, 229, 0.15));
  border: 1px solid var(--primary-soft, #eef2ff);
}
.swipe-guide-skip {
  font-size: 11px;
  font-weight: 800;
  color: #94a3b8;
  padding: 4px 10px;
}

.swipe-coach-standalone {
  margin: 8px 0 20px;
  padding: 20px 18px 16px;
  width: 100%;
  box-sizing: border-box;
  background: #fff;
  border: none;
  border-top: 1px solid var(--primary-soft, #eef2ff);
  border-bottom: 1px solid var(--primary-soft, #eef2ff);
  box-shadow: 0 12px 36px var(--primary-glow, rgba(79, 70, 229, 0.12));
  display: flex;
  flex-direction: column;
  align-items: center;
}
.swipe-coach-mock {
  width: 100%;
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 14px;
  background: #f8fafc;
}
.swipe-coach-actions {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 140px;
  display: flex;
  z-index: 1;
}
.swipe-coach-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 900;
  color: #fff;
}
.swipe-coach-btn.edit { background: var(--primary-color, #4f46e5); }
.swipe-coach-btn.delete { background: #f43f5e; }
.swipe-coach-cell {
  position: relative;
  z-index: 2;
  background: #fff;
  padding: 16px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  animation: coachSwipeHint 1.7s cubic-bezier(0.4, 0, 0.2, 1) 0.2s 3;
  border-bottom: 1rpx solid #f1f5f9;
}
.swipe-coach-cell-left { display: flex; align-items: center; gap: 12px; }
.swipe-coach-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--primary-soft, #eef2ff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}
.swipe-coach-lines { display: flex; flex-direction: column; gap: 6px; }
.swipe-coach-line { height: 8px; background: #f1f5f9; border-radius: 4px; }
.swipe-coach-line.w1 { width: 72px; }
.swipe-coach-line.w2 { width: 48px; }
.swipe-coach-amt { font-size: 15px; font-weight: 900; color: #10b981; }
.swipe-coach-hand {
  position: absolute;
  right: 28%;
  bottom: 8px;
  z-index: 5;
  animation: guideHandSwipe 1.7s ease-in-out 0.2s 3;
  pointer-events: none;
}
.swipe-coach-hand-icon {
  font-size: 32px;
  transform: rotate(-90deg);
  display: block;
}
.swipe-coach-title {
  font-size: 15px;
  font-weight: 900;
  color: #1e293b;
  margin-bottom: 4px;
}
.swipe-coach-sub {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  margin-bottom: 12px;
  text-align: center;
}
.swipe-coach-dismiss {
  padding: 8px 22px;
  border-radius: 100px;
  background: var(--primary-soft, #eef2ff);
}
.swipe-coach-dismiss text {
  font-size: 13px;
  font-weight: 900;
  color: var(--primary-color, #4f46e5);
}
</style>
