
<template>
  <view :class="themeClass" class="combo-root animate-fade-in">
    <!-- 顶部引言 -->
    <view class="combo-intro">
      <text class="intro-main">让协作围绕目标展开</text>
      <text class="intro-sub">组合 = 跨功能的组织方式</text>
    </view>

    <!-- 组合目标列表 -->
    <view class="goal-stack">
      <view v-for="goal in localGoals" :key="goal.id" class="goal-card" @click="selectGoal(goal)">
        <!-- 卡片头部：状态与时间 -->
        <view class="card-top">
          <view class="goal-status-badge" :style="{ background: goal.progress === 100 ? '#10B98115' : goal.themeColor + '15' }">
            <view class="status-dot" :style="{ background: goal.progress === 100 ? '#10B981' : goal.themeColor }"></view>
            <text class="status-txt" :style="{ color: goal.progress === 100 ? '#10B981' : goal.themeColor }">
              {{ goal.progress === 100 ? '已达成' : goal.status }}
            </text>
          </view>
          <view class="time-countdown">
            <text class="clock-emoji">⏳</text>
            <text class="countdown-txt">{{ goal.timeLeft }}</text>
          </view>
        </view>

        <!-- 目标主体 -->
        <view class="goal-main">
          <view class="goal-icon-box" :style="{ background: goal.themeColor }">
            <text class="goal-emoji">{{ goal.icon }}</text>
          </view>
          <view class="goal-text">
            <text class="goal-title">{{ goal.title }}</text>
            <view class="goal-progress-bar">
              <view 
                class="progress-inner" 
                :class="{ 'glow-finish': goal.progress === 100 }"
                :style="{ width: goal.progress + '%', background: goal.progress === 100 ? '#10B981' : goal.themeColor }"
              ></view>
            </view>
          </view>
          <view class="goal-pct-box">
            <text class="pct-num" :class="{ 'text-done': goal.progress === 100 }">{{ goal.progress }}%</text>
          </view>
        </view>

        <!-- 三位一体功能透视 (Bento Layout) -->
        <view class="feature-grid">
          <view class="bento-item ledger">
            <text class="bento-label">账本</text>
            <text class="bento-val">¥{{ goal.ledgerItems.reduce((s, i) => s + i.amount, 0).toLocaleString() }}</text>
            <text class="bento-sub">累计支出</text>
          </view>
          <view class="bento-item checklist">
            <text class="bento-label">清单</text>
            <text class="bento-val">{{ goal.tasks.filter(t => !t.done).length }}项</text>
            <text class="bento-sub">待处理任务</text>
          </view>
          <view class="bento-item schedule">
            <text class="bento-label">日程</text>
            <text class="bento-val">{{ goal.schedules[0]?.time || '无安排' }}</text>
            <text class="bento-sub">下一节点</text>
          </view>
        </view>

        <!-- 协作成员 -->
        <view class="card-footer">
          <view class="avt-stack">
            <image v-for="i in 3" :key="i" :src="`https://i.pravatar.cc/100?u=combomem${goal.id}${i}`" class="mini-avt" />
          </view>
          <text class="update-hint">最后更新：刚刚</text>
        </view>
      </view>
    </view>

    <!-- 详情抽屉 (目标透视面板) -->
    <view v-if="selectedGoal" class="goal-drawer-mask" @click="selectedGoal = null">
      <view class="goal-drawer animate-panel-up" @click.stop>
        <view class="drawer-handle"></view>
        <view class="drawer-head">
          <view class="d-icon" :style="{ background: selectedGoal.themeColor }">{{ selectedGoal.icon }}</view>
          <view class="d-titles">
            <text class="d-title">{{ selectedGoal.title }}</text>
            <text class="d-sub">目标导向型协作面板</text>
          </view>
          <view class="d-close" @click="selectedGoal = null">✕</view>
        </view>

        <scroll-view scroll-y class="drawer-body">
          <!-- 关联清单 -->
          <view class="nested-section">
            <view class="section-title">关联清单 · 点击勾选完成</view>
            <view class="mini-list">
              <view 
                v-for="task in selectedGoal.tasks" 
                :key="task.id" 
                class="mini-item task-link animate-slide-in"
                :class="{ 'is-done': task.done }"
                @click="toggleNestedTask(task)"
              >
                <view class="mi-check" :class="{ 'checked': task.done }" :style="{ borderColor: task.done ? '#10B981' : '#E2E8F0', background: task.done ? '#10B981' : 'transparent' }">
                  <text v-if="task.done" class="v-icon">✓</text>
                </view>
                <text class="mi-title" :class="{ 'strike': task.done }">{{ task.title }}</text>
              </view>
              
              <view class="quick-add-row">
                <input v-model="quickTaskTitle" class="quick-input" placeholder="快速添加任务..." @confirm="addQuickTask" />
                <view class="quick-btn" @click="addQuickTask">+</view>
              </view>
            </view>
          </view>

          <!-- 关联账目 -->
          <view class="nested-section">
            <view class="section-title">关联账本记录</view>
            <view class="mini-list">
              <view class="mini-item animate-slide-in" v-for="item in selectedGoal.ledgerItems" :key="item.id">
                <text class="mi-icon">💰</text>
                <text class="mi-title">{{ item.title }}</text>
                <text class="mi-price">-¥{{ item.amount.toLocaleString() }}</text>
              </view>
              <view v-if="selectedGoal.ledgerItems.length === 0" class="mini-empty">暂无关联开支</view>
            </view>
          </view>

          <!-- 关联日程 -->
          <view class="nested-section">
            <view class="section-title">关联日程安排</view>
            <view class="mini-list">
              <view class="mini-item animate-slide-in" v-for="sch in selectedGoal.schedules" :key="sch.id">
                <text class="mi-icon">📅</text>
                <text class="mi-title">{{ sch.title }}</text>
                <text class="mi-time">{{ sch.time }}</text>
              </view>
              <view v-if="selectedGoal.schedules.length === 0" class="mini-empty">暂无关联日程</view>
            </view>
          </view>
        </scroll-view>

        <view class="drawer-footer">
          <view class="multi-action-row">
            <button class="action-btn outline" @click="openQuickSub('ledger')">记笔账</button>
            <button class="action-btn" :style="{ background: selectedGoal.themeColor }" @click="openQuickSub('schedule')">定日程</button>
          </view>
        </view>
        <view class="safe-bottom"></view>

        <!-- 次级快速输入面板 (改进：修复遮挡问题) -->
        <view v-if="quickSub" class="quick-sub-overlay animate-fade-in" @click="quickSub = null">
          <view class="quick-sub-card animate-panel-up" @click.stop>
             <view class="qs-header">
               <text class="qs-title">{{ quickSub === 'ledger' ? '快速记账' : '快捷日程' }}</text>
               <text class="qs-tag" :style="{ color: selectedGoal.themeColor }">关联至：{{ selectedGoal.title }}</text>
             </view>
             
             <view class="qs-form">
               <view class="qs-input-group">
                 <text class="qs-input-label">内容描述</text>
                 <input v-model="subForm.title" class="qs-input" :placeholder="quickSub === 'ledger' ? '买了什么？' : '要做什么？'" />
               </view>

               <view v-if="quickSub === 'ledger'" class="qs-input-group">
                 <text class="qs-input-label">消费金额</text>
                 <view class="qs-amount-box">
                   <text class="qs-sym">¥</text>
                   <input 
                    v-model="subForm.amount" 
                    type="digit" 
                    class="qs-amount-input" 
                    placeholder="0.00" 
                    placeholder-style="color: #CBD5E1"
                    focus 
                   />
                 </view>
               </view>
               
               <view v-else class="qs-input-group">
                  <text class="qs-input-label">设定时间</text>
                  <picker mode="time" @change="subForm.time = $event.detail.value">
                    <view class="qs-picker-trigger">
                      <text class="qsp-label">点击选择</text>
                      <text class="qsp-val">{{ subForm.time }}</text>
                    </view>
                  </picker>
               </view>
             </view>

             <view class="qs-actions">
               <button class="qs-cancel" @click="quickSub = null">取消</button>
               <button class="qs-save" :style="{ background: selectedGoal.themeColor }" @click="handleSubSave">保存记录</button>
             </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { useAppTheme } from '@/common/themes/useAppTheme.js'
const { themeClass, primaryColor, softColor, theme } = useAppTheme()

import { ref, reactive } from 'vue';

const quickTaskTitle = ref('');
const quickSub = ref(null); // 'ledger' | 'schedule'
const subForm = reactive({ title: '', amount: '', time: '09:00' });

const localGoals = ref([
  {
    id: 1,
    title: '新房装修',
    icon: '🏠',
    themeColor: 'var(--primary-color, #4F46E5)',
    progress: 40,
    status: '进行中',
    timeLeft: '剩余 45 天',
    tasks: [
      { id: 101, title: '确认水电改造方案', done: true },
      { id: 102, title: '预定客厅地砖', done: false },
      { id: 103, title: '挑选橱柜款式', done: false }
    ],
    ledgerItems: [{ id: 201, title: '定金支付', amount: 5000 }],
    schedules: [{ id: 301, title: '瓦工入场', time: '11-28 09:00' }]
  },
  {
    id: 2,
    title: '春节准备',
    icon: '🧧',
    themeColor: '#EF4444',
    progress: 0,
    status: '规划中',
    timeLeft: '剩余 62 天',
    tasks: [{ id: 401, title: '预定往返机票', done: false }],
    ledgerItems: [],
    schedules: []
  }
]);

const selectedGoal = ref(null);
const selectGoal = (goal) => { selectedGoal.value = goal; };

const toggleNestedTask = (task) => {
  task.done = !task.done;
  if (task.done);
  recalcProgress();
};

const addQuickTask = () => {
  if (!quickTaskTitle.value.trim() || !selectedGoal.value) return;
  selectedGoal.value.tasks.push({ id: Date.now(), title: quickTaskTitle.value, done: false });
  quickTaskTitle.value = '';
  recalcProgress();
};

const openQuickSub = (type) => {
  quickSub.value = type;
  subForm.title = '';
  subForm.amount = '';
  subForm.time = '09:00';
};

const handleSubSave = () => {
  if (!subForm.title.trim()) return;
  
  if (quickSub.value === 'ledger') {
    selectedGoal.value.ledgerItems.push({
      id: Date.now(),
      title: subForm.title,
      amount: parseFloat(subForm.amount) || 0
    });
  } else {
    selectedGoal.value.schedules.push({
      id: Date.now(),
      title: subForm.title,
      time: subForm.time
    });
  }
  
  quickSub.value = null;
  uni.showToast({ title: '保存成功', icon: 'success' });
};

const recalcProgress = () => {
  if (selectedGoal.value) {
    const total = selectedGoal.value.tasks.length;
    const done = selectedGoal.value.tasks.filter(t => t.done).length;
    selectedGoal.value.progress = total > 0 ? Math.round((done / total) * 100) : 0;
  }
};
</script>

<style scoped>
.combo-root { padding-bottom: 40px; }
.combo-intro { margin-bottom: 24px; padding-left: 8px; }
.intro-main { font-size: 20px; font-weight: 900; color: #1E293B; display: block; }
.intro-sub { font-size: 13px; font-weight: 700; color: #94A3B8; margin-top: 4px; display: block; }

.goal-stack { display: flex; flex-direction: column; gap: 24px; }
.goal-card { 
  background: #fff; border-radius: 36px; padding: 28px;
  border: 1px solid #F1F5F9; box-shadow: 0 10px 30px rgba(0,0,0,0.02);
  transition: all 0.2s;
}
.goal-card:active { transform: scale(0.97); background: #FAFAFA; }

.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.goal-status-badge { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 12px; }
.status-dot { width: 6px; height: 6px; border-radius: 50%; }
.status-txt { font-size: 11px; font-weight: 900; }
.time-countdown { display: flex; align-items: center; gap: 6px; }
.countdown-txt { font-size: 12px; font-weight: 800; color: #94A3B8; }

.goal-main { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
.goal-icon-box { width: 60px; height: 60px; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 30px; }
.goal-text { flex: 1; display: flex; flex-direction: column; gap: 10px; }
.goal-title { font-size: 19px; font-weight: 900; color: #1E293B; }
.goal-progress-bar { height: 8px; background: #F1F5F9; border-radius: 10px; overflow: hidden; }
.progress-inner { height: 100%; border-radius: 10px; transition: width 0.6s cubic-bezier(0.2, 0.8, 0.2, 1); }
.glow-finish { box-shadow: 0 0 15px rgba(16, 185, 129, 0.5); }
.goal-pct-box { padding: 8px 12px; background: #F8FAFC; border-radius: 12px; }
.pct-num { font-size: 14px; font-weight: 900; color: #475569; }
.text-done { color: #10B981; }

.feature-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 24px; }
.bento-item { background: #F8FAFC; border-radius: 22px; padding: 16px 12px; display: flex; flex-direction: column; gap: 4px; }
.bento-label { font-size: 9px; font-weight: 900; color: #CBD5E1; text-transform: uppercase; letter-spacing: 1px; }
.bento-val { font-size: 15px; font-weight: 900; color: #334155; }
.bento-sub { font-size: 9px; font-weight: 700; color: #94A3B8; }

.card-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #F8FAFC; padding-top: 16px; }
.avt-stack { display: flex; align-items: center; }
.mini-avt { width: 28px; height: 28px; border-radius: 50%; border: 3px solid #fff; margin-right: -10px; background: #eee; }
.update-hint { font-size: 10px; font-weight: 700; color: #CBD5E1; }

/* 抽屉 UI */
.goal-drawer-mask { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(15px); z-index: 2000; }
.goal-drawer { position: absolute; bottom: 0; left: 0; right: 0; background: #fff; border-radius: 44px 44px 0 0; padding: 24px; max-height: 85vh; display: flex; flex-direction: column; }
.drawer-handle { width: 40px; height: 5px; background: #F1F5F9; border-radius: 10px; margin: 0 auto 20px; }
.drawer-head { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; }
.d-icon { width: 48px; height: 48px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
.d-titles { flex: 1; display: flex; flex-direction: column; }
.d-title { font-size: 20px; font-weight: 900; color: #1E293B; }
.d-sub { font-size: 11px; font-weight: 800; color: #94A3B8; }
.d-close { width: 36px; height: 36px; background: #F8FAFC; border-radius: 50%; display: flex; align-items: center; justify-content: center; }

.drawer-body { flex: 1; height: 0; }
.nested-section { margin-bottom: 28px; }
.section-title { font-size: 11px; font-weight: 900; color: #CBD5E1; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 16px; padding-left: 4px; }

.mini-list { display: flex; flex-direction: column; gap: 10px; }
.mini-item { background: #F8FAFC; padding: 18px; border-radius: 20px; display: flex; align-items: center; gap: 12px; }
.task-link.is-done { opacity: 0.5; transform: scale(0.98); }
.mi-title { flex: 1; font-size: 14px; font-weight: 800; color: #334155; }
.mi-title.strike { text-decoration: line-through; color: #94A3B8; }
.mi-price { font-size: 14px; font-weight: 900; color: #1E293B; }
.mi-check { width: 22px; height: 22px; border: 2px solid #E2E8F0; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.checked { background: #10B981; border-color: #10B981 !important; }
.v-icon { color: #fff; font-size: 11px; }

.quick-add-row { display: flex; gap: 10px; margin-top: 4px; }
.quick-input { flex: 1; background: #fff; height: 54px; border-radius: 18px; border: 1.5px dashed #E2E8F0; padding: 0 16px; font-size: 14px; }
.quick-btn { width: 54px; height: 54px; background: #F1F5F9; border-radius: 18px; display: flex; align-items: center; justify-content: center; color: var(--primary-color, #4F46E5); }

.drawer-footer { padding-top: 20px; }
.multi-action-row { display: flex; gap: 12px; }
.action-btn { flex: 1; height: 60px; border-radius: 20px; font-weight: 900; }
.action-btn.outline { background: #fff; border: 2px solid #F1F5F9; color: var(--primary-color, #4F46E5); }

/* 次级面板 UI：针对遮挡修复 */
.quick-sub-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(10px); z-index: 3000; display: flex; align-items: flex-end; }
.quick-sub-card { 
  width: 100%; background: #fff; border-radius: 40px 40px 0 0; padding: 32px; 
  box-shadow: 0 -20px 50px rgba(0,0,0,0.1); 
}
.qs-header { margin-bottom: 24px; }
.qs-title { font-size: 22px; font-weight: 900; color: #1E293B; display: block; }
.qs-tag { font-size: 11px; font-weight: 800; margin-top: 4px; display: block; }

.qs-form { display: flex; flex-direction: column; gap: 20px; }
.qs-input-group { display: flex; flex-direction: column; gap: 8px; }
.qs-input-label { font-size: 10px; font-weight: 900; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px; padding-left: 4px; }

.qs-input { background: #F8FAFC; height: 64px; border-radius: 18px; padding: 0 20px; font-size: 16px; font-weight: 700; border: 1px solid #F1F5F9; }

/* 关键修复：增加金额输入框高度并优化内边距，防止文字裁剪 */
.qs-amount-box { 
  background: #F8FAFC; 
  min-height: 90px; /* 增加高度 */
  border-radius: 22px; 
  display: flex; 
  align-items: center; 
  padding: 0 24px; 
  border: 1.5px solid #F1F5F9;
}
.qs-sym { font-size: 24px; font-weight: 900; color: var(--primary-color, #4F46E5); margin-right: 12px; }
.qs-amount-input { 
  font-size: 38px; /* 稍微增大字号以显高端 */
  font-weight: 900; 
  color: #1E293B; 
  flex: 1; 
  height: 80px; /* 显式设置高度，确保文字基线对齐不被裁切 */
  line-height: normal;
}

.qs-time-box { background: #F8FAFC; border-radius: 20px; }
.qs-picker-trigger { height: 64px; display: flex; justify-content: space-between; align-items: center; padding: 0 20px; background: #F8FAFC; border-radius: 18px; border: 1px solid #F1F5F9; }
.qsp-label { font-size: 14px; font-weight: 800; color: #CBD5E1; }
.qsp-val { font-size: 16px; font-weight: 900; color: #1E293B; }

.qs-actions { display: flex; gap: 16px; margin-top: 32px; padding-bottom: calc(20px + env(safe-area-inset-bottom)); }
.qs-cancel { flex: 1; height: 64px; border-radius: 20px; font-weight: 900; background: #F8FAFC; color: #94A3B8; }
.qs-save { flex: 2; height: 64px; border-radius: 20px; font-weight: 900; color: #fff; box-shadow: 0 10px 20px rgba(0,0,0,0.1); }

.animate-slide-in { animation: slideIn 0.3s ease-out both; }
@keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
.animate-panel-up { animation: panelUp 0.4s cubic-bezier(0.19, 1, 0.22, 1); }
@keyframes panelUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
</style>
