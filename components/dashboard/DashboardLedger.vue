<template>
  <view class="tab-content-ledger">
    
    <!-- 1. 顶部摘要区域加载状态：骨架屏 -->
    <block v-if="isSummaryLoading">
      <view class="ledger-hero-card skeleton-mode">
        <view class="sk-header shimmer"></view>
        <view class="sk-main shimmer"></view>
        <view class="sk-footer shimmer"></view>
      </view>
      <view class="ledger-quick-stats">
        <view v-for="i in 2" :key="i" class="stat-pill sk-pill shimmer"></view>
      </view>
    </block>

    <!-- 1. 顶部摘要区域：正常展示 -->
    <block v-else>
      <!-- 头部资产卡片 -->
      <view class="ledger-hero-card animate-fade-in">
        <view class="hero-ambient" aria-hidden="true">
          <view class="hero-blob"></view>
        </view>
        <view class="card-glass-bg"></view>

        <view class="hero-header">
          <view class="hero-title-group">
            <view
              class="hero-icon-box"
              :class="{
                'is-zero': totalBalance <= 0,
                'is-warning': budgetProgress > 80 && budgetProgress < 100,
                'is-danger': budgetProgress >= 100
              }"
            >
              <text class="hero-icon">¥</text>
            </view>
            <view class="hero-label-info">
              <text class="hero-label">当前净资产</text>
              <text class="hero-scope-hint">累计总额 · 右侧为本月收支</text>
              <view class="hero-status">
                <block v-if="budgetProgress >= 100">
                  <text class="status-dot danger"></text>
                  <text class="status-txt danger">本月预算已用尽 ⚠️</text>
                </block>
                <block v-else-if="todayChange !== 0">
                  <text class="status-dot"></text>
                  <text class="status-txt">今日变动 {{ todayChange > 0 ? '+' : '' }}{{ formatPrice(todayChange) }}</text>
                </block>
                <text v-else class="status-txt zero">下方查看今日流水</text>
              </view>
            </view>
          </view>
          <view class="hero-more-btn" hover-class="hero-more-press" @click="goToAssetDetails">
            <text class="more-btn-txt">统计 ›</text>
          </view>
        </view>

        <view class="hero-main">
          <view class="hero-amount">
            <view class="hero-amount-stack">
              <view class="hero-amount-row">
                <text class="amount-sym">¥</text>
                <text class="amount-val">{{ formatPrice(totalBalance) }}</text>
              </view>
              <text class="amount-caption">累计净资产</text>
            </view>
          </view>
          <view class="hero-stats-mini">
            <view class="mini-stat">
              <text class="mini-label">本月存入</text>
              <text class="mini-val up">¥{{ formatPrice(monthIncome) }}</text>
            </view>
            <view class="mini-stat">
              <text class="mini-label">本月支出</text>
              <text class="mini-val down">¥{{ formatPrice(monthExpense) }}</text>
            </view>
          </view>
        </view>

        <view class="hero-footer">
          <view class="budget-info">
            <view class="budget-label-row">
              <text class="budget-label">本月预算 ¥{{ formatPrice(budgetLimit) }}</text>
              <text class="budget-edit-link" @click="openBudgetEditor">修改</text>
            </view>
            <text
              class="budget-pct"
              :class="{ zero: budgetProgress === 0, warning: budgetProgress > 80, danger: budgetProgress >= 100 }"
            >
              {{ budgetProgress }}%
            </text>
          </view>
          <view class="budget-track" :class="{ 'track-zero': budgetProgress === 0 }">
            <view
              class="budget-bar"
              :class="{
                'bar-warning': budgetProgress > 80 && budgetProgress < 100,
                'bar-danger': budgetProgress >= 100,
                'bar-empty': budgetProgress === 0
              }"
              :style="{ width: budgetProgress === 0 ? '0%' : clampedProgress + '%' }"
            ></view>
          </view>
        </view>
      </view>
      
      <!-- 快捷统计卡片 -->
      <view class="ledger-quick-stats animate-fade-in" style="animation-delay: 0.1s">
        <view class="stat-pill stat-pill-card stat-pill-theme">
          <view class="pill-accent"></view>
          <view class="pill-icon-wrap pill-icon-theme">
            <text class="pill-emoji">🛒</text>
          </view>
          <view class="pill-info">
            <text class="pill-l">本月最大开支</text>
            <text class="pill-v category-txt" :style="{ color: maxExpenseCategory ? primaryColor : '#94A3B8' }">
              {{ maxExpenseCategory || '暂无数据' }}
            </text>
          </view>
        </view>
        <view class="stat-pill stat-pill-card stat-pill-income">
          <view class="pill-accent pill-accent-income"></view>
          <view class="pill-icon-wrap pill-icon-income">
            <text class="pill-emoji">👤</text>
          </view>
          <view class="pill-info">
            <text class="pill-l">本月贡献</text>
            <view class="pill-v contributor-box" >
              <block v-if="topContributor.name">
                <view class="left">
                  <text  class="contributor-name">{{ topContributor.name }}</text>
                </view>
                <view class="right">
                  <text :style="{ color: topContributor.pct ? '#EF4444' : '#94A3B8' }" class="contributor-pct">({{ topContributor.pct }}%)</text>
                </view>
              </block>
              <text v-else>准备开始</text>
            </view>
          </view>
        </view>
      </view>
    </block>

    <view class="section-title-row">
      <view class="section-title-group">
        <text class="section-title">今日收支</text>
        <text class="section-subtitle">仅展示今天 · 更早记录点右侧</text>
      </view>
      <text class="section-more" @click="lefgerAll">全部/历史 ›</text>
    </view>

    <!-- 2. 下方列表区域 -->
    <block v-if="isListLoading">
      <view class="activity-list skeleton-mode">
        <view v-for="i in 3" :key="i" class="act-item sk-item shimmer"></view>
      </view>
    </block>

    <block v-else>
      <view class="activity-container animate-fade-in">
        <view v-if="activities && activities.length > 0" class="activity-list">
          <view 
            v-for="act in activities" 
            :key="act.id" 
            class="act-item"
            :class="{ 'is-locked-item': isLocked(act) }"
            @click="onActivityClick(act)"
          >
            <image :src="act.creatorAvatar || `https://i.pravatar.cc/100?u=${act.creatorNickname}`" class="act-avt" />
            <view class="act-info">
              <view class="act-main">
                <text class="act-user">{{ act.creatorNickname }}</text>
                <text class="act-desc">{{ act.action || act.note || (act.type === 'expense' ? '支出' : '收入') }}</text>
              </view>
              <text class="act-time">{{ formatRelativeTime(act.entryTime) }}</text>
            </view>
            <view class="act-right">
              <text class="act-amount" :class="{ 'exp': act.type === 'expense' }">
                {{ act.type === 'expense' ? '-' : '+' }}{{ formatPrice(act.amount) }}
              </text>
            <image  class="act-more-icon" v-if="!isLocked(act)" src="/static/icon-more.png" style="width: 25px;height: 25px;" />
            </view>

            <!-- 权限遮罩层 -->
        <!--    <view v-if="isLocked(act)" class="item-permission-mask">
              <view class="mask-badge">
                <text class="mb-icon">🔒</text>
                <text class="mb-txt">申请查看权限</text>
              </view>
            </view> -->
          </view>
        </view>

        <view v-else class="empty-state-card">
          <view class="empty-today-badge">
            <text class="empty-today-dot"></text>
            <text class="empty-today-txt">仅展示今日收支</text>
          </view>
          <view class="empty-illustration">
            <view class="icon-blob"></view>
            <text class="emoji">📒</text>
          </view>
          <text class="empty-h1">今日暂无账目</text>
          <text class="empty-p">当天的收支会出现在这里。过了今天的记录，请到「全部/历史」查看。</text>
          <view class="empty-history-btn" hover-class="empty-history-press" @click="lefgerAll">
            <text class="empty-history-btn-txt">查看全部历史</text>
            <text class="empty-history-btn-arrow">›</text>
          </view>
        </view>
      </view>
    </block>

    <!-- 3. 修改预算弹窗组件 -->
    <BudgetEditorModal 
      v-model="showBudgetModal"
      :initialBudget="budgetLimit"
      :currentExpense="monthExpense"
      @confirm="handleSaveBudget"
    />

    <!-- 操作选单 (Action Sheet) -->
    <view 
      v-if="showActionSheet" 
      class="action-sheet-mask"
      :class="[themeClass, { 'mask-fade-out': isSheetClosing }]"
      :style="sheetMaskStyle"
      @click="closeActionSheet"
      @touchmove.stop.prevent
    >
      <view
        class="action-sheet-panel"
        :class="themeClass"
        :style="sheetPanelStyle"
        @click.stop
        @touchstart="onSheetTouchStart"
        @touchmove="onSheetTouchMove"
        @touchend="onSheetTouchEnd"
      >
        <view class="panel-handle" :style="{ background: primaryColor }"></view>
        <view class="panel-header">
          <text class="panel-title">账目操作</text>
          <text class="panel-subtitle">¥{{ formatPrice(selectedActivity?.amount) }} · {{ selectedActivity?.note || '未备注' }}</text>
        </view>
        <view class="panel-options">
          <view class="option-item" @click="handleEdit">
            <text class="opt-icon">✏️</text>
            <text class="opt-txt">编辑此条记录</text>
          </view>
          <view class="option-item danger" @click="handleDelete">
            <text class="opt-icon">🗑️</text>
            <text class="opt-txt">删除此条记录</text>
          </view>
        </view>
        <view class="panel-cancel-btn" hover-class="panel-cancel-press" @click="closeActionSheet">
          <text class="panel-cancel-txt">取消</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, reactive, watch } from 'vue';
import { roomApi, taskApi } from '../../common/api';
import { formatRelativeTime, formatPrice } from '../../pages/js/utils.js';
import BudgetEditorModal from '../common/BudgetEditorModal.vue';
import { useAppTheme } from '@/common/themes/useAppTheme.js';

const { themeClass, primaryColor } = useAppTheme();

const props = defineProps({
  roomId: { type: [String, Number], default: '' },
  accountId: { type: [String, Number], default: '' },
  roomDetail:{
	  currentUserId:{type:String,default:''},
	  userRole:{type:String,default:''}
  }
});

// --- 权限相关模拟逻辑 ---
const isRestricted = ref(true); // 模拟当前房间开启了隐私保护
const isLocked = (act) => {
  const { userRole, currentUserId } = props.roomDetail;
  
  // owner 和 admin 不锁定
  if (userRole === 'owner' || userRole === 'admin') return false;
  
  // observer 锁定所有
  if (userRole === 'observer') return true;
  
  // member 锁定他人的记录（只能编辑/删除自己创建的）
  if (userRole === 'member') return currentUserId !== act.createdBy;
  
  // 默认锁定（安全起见）
  return true;
};

const handleRequestAccess = () => {
  uni.showModal({
    title: '权限申请',
    content: '该记录由其他成员发布并受隐私保护，是否向其申请查看权限？',
    confirmText: '发起申请',
    confirmColor: primaryColor.value,
    success: (res) => {
      if (res.confirm) uni.showToast({ title: '申请已发送', icon: 'success' });
    }
  });
};
// ----------------------

const isSummaryLoading = ref(true);
const isListLoading = ref(true);

const activities = ref(null);
const totalBalance = ref(0);
const todayChange = ref(0);
const monthIncome = ref(0);
const monthExpense = ref(0);
const budgetLimit = ref(0);
const maxExpenseCategory = ref("");
const topContributor = reactive({ name: '', pct: 0 });

const showActionSheet = ref(false);
const selectedActivity = ref(null);
const showBudgetModal = ref(false);

const sheetPanelY = ref(0);
const isSheetSwiping = ref(false);
const isSheetClosing = ref(false);
let sheetStartY = 0;

watch(showActionSheet, (val) => {
  if (val) {
    sheetPanelY.value = 0;
    isSheetSwiping.value = false;
    isSheetClosing.value = false;
  }
});

const sheetMaskStyle = computed(() => {
  const base = 0.4;
  if (!isSheetSwiping.value && sheetPanelY.value === 0) {
    return { backgroundColor: `rgba(15, 23, 42, ${base})` };
  }
  return {
    backgroundColor: `rgba(15, 23, 42, ${Math.max(0.08, base - sheetPanelY.value / 900)})`
  };
});

const sheetPanelStyle = computed(() => ({
  transform: `translateY(${sheetPanelY.value}px)`,
  transition: isSheetSwiping.value ? 'none' : 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)'
}));

const closeActionSheet = () => {
  isSheetClosing.value = true;
  sheetPanelY.value = 800;
  setTimeout(() => {
    showActionSheet.value = false;
    isSheetClosing.value = false;
    sheetPanelY.value = 0;
  }, 300);
};

const onSheetTouchStart = (e) => {
  sheetStartY = e.touches[0].clientY;
  isSheetSwiping.value = true;
};

const onSheetTouchMove = (e) => {
  const diff = e.touches[0].clientY - sheetStartY;
  if (diff > 0) sheetPanelY.value = diff;
};

const onSheetTouchEnd = () => {
  isSheetSwiping.value = false;
  if (sheetPanelY.value > 120) {
    closeActionSheet();
  } else {
    sheetPanelY.value = 0;
  }
};

const lefgerAll = () => {
  uni.navigateTo({
    url: '/pages/ledger-all/ledger-all?roomId=' + props.roomId+"&accountId="+props.accountId
  })
}

const budgetProgress = computed(() => {
  if (budgetLimit.value <= 0) return 0;
  return Math.round((monthExpense.value / budgetLimit.value) * 100);
});

const clampedProgress = computed(() => Math.min(budgetProgress.value, 100));

const refreshAllData = () => {
  getLedgersummary();
  getLedgerList();
};

onMounted(() => {
  refreshAllData();
  uni.$on('refresh_ledger_data', () => {
    refreshAllData();
  });
});

onUnmounted(() => {
  uni.$off('refresh_ledger_data');
});

const getLedgerList = async () => {
  isListLoading.value = true;
  try {
    const res = await roomApi.ledgerList({ "roomId": props.roomId });
    if (res.code == 0) activities.value = res.data.rows;
  } finally { isListLoading.value = false; }
};

const getLedgersummary = async () => {
  isSummaryLoading.value = true;
  try {
    const res = await roomApi.ledgerSummary({ "roomId": props.roomId });
    if (res.code == 0) {
      const d = res.data;
      monthIncome.value = d.total_income || 0;
      monthExpense.value = d.total_expense || 0;
	  budgetLimit.value=d.budget|| 3000;
      totalBalance.value = d.net_amount || 0;
      maxExpenseCategory.value = d.max_category || "";
      if (d.top_contributor) {
        topContributor.name = d.top_contributor.nickname || "";
        topContributor.pct = d.top_contributor.pct || 0;
      }
      if (d.budget_limit) budgetLimit.value = d.budget_limit;
    }
  } finally { isSummaryLoading.value = false; }
};

const goToAssetDetails = () => {
  uni.navigateTo({ url: '/pages/asset-details/asset-details?roomId=' + props.roomId +"&accountId="+props.accountId});
};

const openBudgetEditor = () => {
  showBudgetModal.value = true;
};

const handleSaveBudget = async (newVal) => {
  uni.showLoading({ title: '正在保存...' });
  try {
    const res = await roomApi.updateBudget({roomId:props.roomId, budget:newVal});
    if (res.code === 0) {
      budgetLimit.value = newVal;
      uni.showToast({ title: '预算已更新', icon: 'none' });
      refreshAllData();
    }
  } catch (e) {
    budgetLimit.value = newVal;
  } finally { uni.hideLoading(); }
};

const onActivityClick = (act) => {
  if (isLocked(act)) {
    // handleRequestAccess();
    return;
  }
  selectedActivity.value = act;
  sheetPanelY.value = 0;
  isSheetClosing.value = false;
  showActionSheet.value = true;
};

const handleEdit = () => {
  closeActionSheet();
  uni.navigateTo({ url: `/pages/add-entry/add-entry?id=${selectedActivity.value.id}&roomId=${props.roomId}&accountId=${props.accountId}` });
};

const handleDelete = () => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这条账目吗？',
    confirmColor: '#EF4444',
    success: async (res) => {
      if (res.confirm) {
        closeActionSheet();
        uni.showLoading({ title: '正在删除...' });
        const deleteRes = await taskApi.deleteLedger(selectedActivity.value.id, props.roomId);
        if (deleteRes.code === 0) {
          uni.showToast({ title: '已删除', icon: 'success' });
          refreshAllData();
        }
      }
    }
  });
};
</script>

<style scoped>
/* 贡献者盒子终极修正方案：强制对等分配 */
.contributor-box {
  display: flex !important;
  width: 100% !important;
  align-items: center;
  box-sizing: border-box;
}

.left,
.right {
  flex: 1 !important;    /* 🔥 核心：强制分配剩余空间 */
  width: 0 !important;   /* 🔥 核心：忽略内容宽度，确保严格 50% */
  min-width: 0;
  display: flex;
  align-items: center;
}

.left {
  justify-content: flex-start;
}

.right {
  justify-content: flex-end; /* 百分比强制靠最右 */
}

.contributor-name {
  display: block;
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis; /* 名字太长自动打点，不撑开容器 */
}

.contributor-pct {
  white-space: nowrap;
  text-align: right;
}

/* --- 权限遮罩样式 --- */
.act-item { position: relative; overflow: hidden; }

.item-permission-mask {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mask-badge {
  background: rgba(255, 255, 255, 0.95);
  padding: 8px 16px;
  border-radius: 100px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  border: 1px solid #F1F5F9;
}

.mb-icon { font-size: 14px; }
.mb-txt { font-size: 12px; font-weight: 800; color: #64748B; }

.is-locked-item .act-info, 
.is-locked-item .act-right {
  opacity: 0.3;
  /* filter: grayscale(1); */
}

/* 基础样式保持不变 */
.tab-content-ledger { padding-bottom: 60px; margin-left: 20px; margin-right: 20px; }

.ledger-hero-card {
  position: relative;
  background: #fff;
  border-radius: 28px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow:
    0 10px 32px var(--primary-glow, rgba(79, 70, 229, 0.08)),
    0 2px 10px rgba(15, 23, 42, 0.04);
  border: 1px solid #f1f5f9;
  overflow: hidden;
  transition: box-shadow 0.35s ease;
}

.hero-ambient {
  position: absolute;
  top: -32px;
  right: -16px;
  width: 120px;
  height: 120px;
  pointer-events: none;
  z-index: 0;
}
.hero-blob {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: var(--primary-color, #4f46e5);
  opacity: 0.1;
  filter: blur(32px);
  transition: background 0.35s ease;
}

.card-glass-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: linear-gradient(
    145deg,
    #ffffff 0%,
    var(--primary-soft, #eef2ff) 55%,
    rgba(255, 255, 255, 0.6) 100%
  );
  opacity: 0.85;
}

.hero-header,
.hero-main,
.hero-footer {
  position: relative;
  z-index: 1;
}

.hero-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.hero-title-group { display: flex; align-items: center; gap: 10px; }

.hero-icon-box {
  width: 38px;
  height: 38px;
  background: var(--primary-color, #4f46e5);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 16px var(--primary-glow, rgba(79, 70, 229, 0.22));
  transition: background 0.35s ease, box-shadow 0.35s ease;
  flex-shrink: 0;
}
.hero-icon-box.is-warning {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  box-shadow: 0 10px 24px rgba(245, 158, 11, 0.25);
}
.hero-icon-box.is-danger {
  background: linear-gradient(135deg, #ef4444, #f87171);
  box-shadow: 0 10px 24px rgba(239, 68, 68, 0.25);
}
.hero-icon-box.is-zero {
  background: var(--primary-soft, #eef2ff);
  box-shadow: 0 6px 16px var(--primary-glow, rgba(79, 70, 229, 0.12));
}
.hero-icon {
  color: #fff;
  font-size: 17px;
  font-weight: 900;
  line-height: 1;
}
.hero-icon-box.is-zero .hero-icon {
  color: var(--primary-color, #4f46e5);
}

.hero-label-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.hero-label {
  font-size: 11px;
  font-weight: 800;
  color: #64748b;
  letter-spacing: 0.5px;
}
.hero-scope-hint {
  font-size: 9px;
  font-weight: 700;
  color: #94a3b8;
  line-height: 1.3;
}
.hero-status { display: flex; align-items: center; gap: 4px; margin-top: 2px; }
.status-dot { width: 5px; height: 5px; background: #10b981; border-radius: 50%; flex-shrink: 0; }
.status-dot.danger { background: #ef4444; }
.status-txt { font-size: 10px; font-weight: 700; color: #10b981; }
.status-txt.danger { color: #ef4444; }
.status-txt.zero { color: #94a3b8; font-weight: 600; }

.hero-more-btn {
  background: var(--primary-soft, #eef2ff);
  padding: 6px 12px;
  border-radius: 100px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.hero-more-press { transform: scale(0.96); opacity: 0.88; }
.more-btn-txt {
  font-size: 10px;
  font-weight: 800;
  color: var(--primary-color, #4f46e5);
}

.hero-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.hero-amount {
  display: flex;
  align-items: flex-end;
  min-width: 0;
  flex: 1;
}
.hero-amount-stack {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}
.hero-amount-row {
  display: flex;
  align-items: baseline;
  gap: 2px;
}
.amount-caption {
  font-size: 9px;
  font-weight: 800;
  color: #94a3b8;
  letter-spacing: 0.3px;
}
.amount-sym {
  font-size: 16px;
  font-weight: 900;
  color: var(--primary-color, #4f46e5);
  margin-bottom: 3px;
}
.amount-val {
  font-size: 32px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -1px;
  line-height: 1;
}

.hero-stats-mini {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
}
.mini-stat {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
}
.mini-label {
  font-size: 9px;
  font-weight: 800;
  color: #cbd5e1;
}
.mini-val {
  font-size: 12px;
  font-weight: 900;
  color: #1e293b;
}
.mini-val.up { color: #f43f5e; }
.mini-val.down { color: #10b981; }

.hero-footer {
  border-top: 1px solid #f1f5f9;
  padding-top: 10px;
}
.budget-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.budget-label-row { display: flex; align-items: center; gap: 8px; }
.budget-label { font-size: 10px; font-weight: 700; color: #94a3b8; }

.budget-edit-link {
  font-size: 10px;
  font-weight: 800;
  color: var(--primary-color, #4f46e5);
  padding: 2px 8px;
  background: var(--primary-soft, #eef2ff);
  border-radius: 100px;
}
.budget-edit-link:active { opacity: 0.65; }

.budget-pct { font-size: 11px; font-weight: 900; color: var(--primary-color, #4f46e5); }
.budget-pct.warning { color: #f59e0b; }
.budget-pct.danger { color: #ef4444; }
.budget-pct.zero { color: #94a3b8; }

.budget-track {
  height: 7px;
  background: #dfe5ee;
  border-radius: 100px;
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.08);
  transition: background 0.35s ease;
}
.budget-track.track-zero {
  background: #d8dee8;
  box-shadow: inset 0 1px 3px rgba(15, 23, 42, 0.1);
}
.budget-bar {
  height: 100%;
  min-width: 0;
  background: var(--primary-color, #4f46e5);
  border-radius: 100px;
  transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.35s ease;
}
.budget-bar.bar-empty {
  display: none;
}
.bar-warning { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.bar-danger { background: linear-gradient(90deg, #ef4444, #f87171); }

.ledger-quick-stats { display: flex; gap: 10px; margin-bottom: 12px; }

.stat-pill {
  flex: 1;
  min-height: 56px;
  border-radius: 18px;
  padding: 0 12px 0 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  overflow: hidden;
}

.stat-pill-card {
  background: #fff;
  border: 1px solid rgba(255, 255, 255, 0.95);
  box-shadow:
    0 10px 28px var(--primary-glow, rgba(79, 70, 229, 0.12)),
    0 4px 14px rgba(15, 23, 42, 0.05);
  transition: box-shadow 0.35s ease, border-color 0.35s ease, transform 0.2s ease;
}

.stat-pill-card:active {
  transform: scale(0.98);
}

.pill-accent {
  position: absolute;
  left: 0;
  top: 12px;
  bottom: 12px;
  width: 4px;
  border-radius: 0 6px 6px 0;
  background: var(--primary-color, #4F46E5);
  transition: background 0.35s ease;
}

.pill-accent-income {
  background: #10B981;
}

.pill-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pill-icon-theme {
  background: var(--primary-soft, #EEF2FF);
  transition: background 0.35s ease;
}

.pill-icon-income {
  background: #ECFDF5;
}

.pill-emoji { font-size: 18px; }
.pill-info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.pill-l { font-size: 9px; font-weight: 800; color: #94A3B8; text-transform: uppercase; margin-bottom: 2px; }
.pill-v { font-size: 12px; font-weight: 900; display: flex; align-items: center; }

.section-title-row {
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
  padding: 0 4px;
}
.section-title-group {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  flex: 1;
}
.section-title { font-size: 16px; font-weight: 900; color: #1E293B; }
.section-subtitle {
  font-size: 10px;
  font-weight: 700;
  color: #94A3B8;
  line-height: 1.3;
}
.section-more { font-size: 12px; font-weight: 800; color: var(--primary-color, #4F46E5); }

.activity-list { background: #fff; border-radius: 32px; padding: 8px; border: 1px solid #F1F5F9; }
.act-item { display: flex; align-items: center; padding: 16px; border-bottom: 1px solid #F8FAFC; transition: background 0.2s; }
.act-item:active { background: #F8FAFC; }
.act-item:last-child { border-bottom: none; }
.act-avt { width: 44px; height: 44px; border-radius: 14px; margin-right: 14px; background: #f0f0f0; }
.act-info { flex: 1; display: flex; flex-direction: column; }
.act-main { display: flex; align-items: center; gap: 6px; }
.act-user { font-size: 14px; font-weight: 800; color: #1E293B; }
.act-desc { font-size: 13px; font-weight: 700; color: #94A3B8; }
.act-time { font-size: 10px; font-weight: 800; color: #CBD5E1; margin-top: 2px; }
.act-right { text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.act-amount { font-size: 15px; font-weight: 900; color: #F43F5E; }
.act-amount.exp { color: #10B981; }

.action-sheet-mask {
  position: fixed;
  inset: 0;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  transition: opacity 0.3s ease;
}
.action-sheet-mask.mask-fade-out {
  opacity: 0;
}
.action-sheet-panel {
  width: 100%;
  background: #fff;
  border-radius: 44px 44px 0 0;
  padding: 20px 24px 12px;
  box-shadow: 0 -20px 60px var(--primary-glow, rgba(79, 70, 229, 0.12));
  will-change: transform;
}
.panel-handle {
  width: 40px;
  height: 5px;
  border-radius: 100px;
  margin: 0 auto 20px;
  opacity: 0.85;
  transition: background 0.35s ease;
}
.panel-header { margin-bottom: 20px; padding: 0 4px; }
.panel-title { font-size: 19px; font-weight: 900; color: #1e293b; display: block; }
.panel-subtitle {
  font-size: 12px;
  font-weight: 800;
  color: var(--primary-color, #4f46e5);
  margin-top: 6px;
  display: block;
  opacity: 0.85;
  transition: color 0.35s ease;
}

.panel-options { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
.option-item {
  height: 64px;
  background: var(--primary-soft, #eef2ff);
  border-radius: 20px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 14px;
  transition: background 0.35s ease, transform 0.2s ease;
}
.option-item:active { transform: scale(0.98); opacity: 0.92; }
.opt-icon { font-size: 20px; }
.opt-txt {
  font-size: 15px;
  font-weight: 900;
  color: var(--primary-color, #4f46e5);
  transition: color 0.35s ease;
}
.option-item.danger {
  background: #fff1f2;
}
.option-item.danger .opt-txt { color: #f43f5e; }
.panel-cancel-btn {
  width: 100%;
  height: 56px;
  background: var(--primary-soft, #eef2ff);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: env(safe-area-inset-bottom);
  box-sizing: border-box;
  transition: background 0.35s ease, opacity 0.2s ease;
}
.panel-cancel-txt {
  font-size: 15px;
  font-weight: 900;
  color: var(--primary-color, #4f46e5);
  line-height: 1;
  transition: color 0.35s ease;
}
.panel-cancel-press { opacity: 0.88; }

.empty-state-card {
  background: #fff;
  border-radius: 40px;
  padding: 32px 28px 36px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  border: 1px solid #F1F5F9;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.03);
}
.empty-today-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  margin-bottom: 20px;
  border-radius: 100px;
  background: var(--primary-soft, #eef2ff);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 16px var(--primary-glow, rgba(79, 70, 229, 0.12));
}
.empty-today-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary-color, #4f46e5);
  flex-shrink: 0;
}
.empty-today-txt {
  font-size: 12px;
  font-weight: 900;
  color: var(--primary-color, #4f46e5);
  letter-spacing: 0.5px;
}
.empty-illustration { position: relative; width: 88px; height: 88px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
.icon-blob { position: absolute; inset: 0; background: var(--primary-soft, #EEF2FF); border-radius: 35% 65% 70% 30% / 30% 30% 70% 70%; animation: blobMelt 8s infinite alternate; }
@keyframes blobMelt { to { border-radius: 65% 35% 30% 70% / 70% 70% 30% 30%; transform: rotate(45deg); } }
.empty-illustration .emoji { font-size: 44px; position: relative; z-index: 1; }
.empty-h1 { font-size: 18px; font-weight: 900; color: #1E293B; margin-bottom: 10px; }
.empty-p {
  font-size: 13px;
  font-weight: 700;
  color: #64748B;
  line-height: 1.65;
  max-width: 260px;
}
.empty-history-btn {
  margin-top: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0 22px;
  height: 48px;
  border-radius: 100px;
  background: var(--primary-color, #4f46e5);
  box-shadow: 0 10px 28px var(--primary-glow, rgba(79, 70, 229, 0.28));
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.empty-history-press { transform: scale(0.97); opacity: 0.9; }
.empty-history-btn-txt { font-size: 14px; font-weight: 900; color: #fff; }
.empty-history-btn-arrow { font-size: 18px; font-weight: 300; color: #fff; margin-top: -2px; }

.shimmer { position: relative; overflow: hidden; background: #F1F5F9 !important; }
.shimmer::after { position: absolute; top: 0; right: 0; bottom: 0; left: 0; transform: translateX(-100%); background-image: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent); animation: shimmerAnim 2s infinite; content: ''; }
@keyframes shimmerAnim { 100% { transform: translateX(100%); } }

.animate-fade-in { animation: fadeIn 0.4s ease-out both; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-panel-up { animation: panelUp 0.4s cubic-bezier(0.19, 1, 0.22, 1) both; }
@keyframes panelUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
</style>