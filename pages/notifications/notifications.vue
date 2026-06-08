
<template>
  <view :class="themeClass" class="notif-page">
    <IosNav title="消息中心" @leftClick="goBack" />

    <!-- 顶部全背景修饰 -->
    <view class="notif-ambient-glow"></view>

    <!-- 分类 Tab 切换 -->
    <view class="tab-strip">
      <view 
        v-for="tab in tabs" 
        :key="tab.id"
        class="tab-item"
        :class="{ active: currentTab === tab.id }"
        @click="changeTab(tab.id)"
      >
        <text class="tab-label">{{ tab.label }}</text>
        <view v-if="currentTab === tab.id" class="tab-active-dot"></view>
      </view>
    </view>

    <!-- 主体内容区 -->
    <scroll-view scroll-y class="notif-scroll" :show-scrollbar="false">
      <view class="notif-container">
        
        <!-- 1. 加载中：骨架屏 -->
        <block v-if="isLoading">
          <view 
            v-for="i in 3" 
            :key="'sk-' + i" 
            class="notif-card skeleton-mode"
          >
            <view class="msg-header">
              <view class="sk-item sk-pill shimmer"></view>
              <view class="sk-item sk-time shimmer"></view>
            </view>
            <view class="msg-body">
              <view class="sk-item sk-title shimmer"></view>
              <view class="sk-item sk-desc shimmer"></view>
              <view class="sk-item sk-desc shimmer" style="width: 60%"></view>
            </view>
          </view>
        </block>

        <!-- 2. 网络错误视图 -->
        <block v-else-if="isError">
          <view class="error-view animate-fade-in">
            <view class="error-visual">
              <view class="error-pulse"></view>
              <text class="error-emoji">📡</text>
            </view>
            <text class="error-h">连接服务失败</text>
            <text class="error-p">无法同步最新的家庭消息，请检查网络设置或稍后再试。</text>
            <button class="retry-btn" @click="fetchData">
              <text class="retry-txt">重新尝试加载</text>
            </button>
          </view>
        </block>

        <!-- 3. 正常列表 -->
        <block v-else>
          <view
            v-for="(msg, index) in filteredMessages"
            :key="msg.id"
            class="notif-card animate-stagger-in"
            :class="getCardClass(msg)"
            :style="{ animationDelay: (index * 0.08) + 's' }"
          >
            <!-- 提醒类卡片 -->
            <block v-if="isReminderCard(msg)">
              <view class="reminder-head">
                <view class="reminder-head-left">
                  <text class="reminder-icon">{{ msg.icon || (isBirthdayReminder(msg) ? '🎂' : '🔔') }}</text>
                  <text class="reminder-type-title">{{ msg.title }}</text>
                </view>
                <text class="reminder-time">{{ msg.triggerTimeLabel || formatSmartTime(msg.createdAt) }}</text>
              </view>

              <view class="reminder-body">
                <text class="reminder-main">{{ msg.content || msg.message }}</text>
                <text v-if="msg.subtitle" class="reminder-sub">{{ msg.subtitle }}</text>
              </view>

              <view v-if="isNotificationUnread(msg)" class="action-row reminder-actions" @click.stop>
                <button
                  v-for="action in msg.actions"
                  :key="action"
                  class="btn-action"
                  :class="getReminderActionClass(action)"
                  @click="handleReminderAction(index, msg, action)"
                >
                  {{ getReminderActionLabel(action, msg) }}
                </button>
              </view>

              <view v-else class="handled-status">
                <text class="status-txt">已读</text>
              </view>
            </block>

            <!-- 其他消息 -->
            <block v-else>
              <view class="msg-header">
                <view class="type-pill" :class="msg.type">
                  <text class="type-emoji">{{ getTypeEmoji(msg.type) }}</text>
                  <text class="type-label">{{ getTypeLabel(msg.type) }}</text>
                </view>
                <text class="msg-time">{{ formatSmartTime(msg.createdAt) }}</text>
              </view>

              <view class="msg-body">
                <text class="msg-title">{{ msg.title }}</text>
                <text class="msg-desc">{{ msg.content || msg.message }}</text>
              </view>

              <view v-if="msg.type === 'invitation' && !msg.handled" class="action-row" @click.stop>
                <button class="btn-action reject" @click="handleAction(index, msg, 'reject')">拒绝</button>
                <button class="btn-action accept" @click="handleAction(index, msg, 'accept')">接受</button>
              </view>

              <view v-else-if="getLegacyButton(msg)" class="action-row single" @click.stop>
                <button class="btn-action outline" @click="goToLegacyDetail(msg, index)">{{ getLegacyButtonText(msg) }}</button>
              </view>

              <view v-if="msg.handled" class="handled-status">
                <text class="status-txt">已处理 · {{ msg.handleResult }}</text>
              </view>
            </block>
          </view>

          <!-- 空状态 -->
          <view v-if="filteredMessages.length === 0" class="empty-notif animate-fade-in">
            <view class="empty-icon-wrap">{{ currentTab === 'reminder' ? '🔔' : '📬' }}</view>
            <text class="empty-title">{{ currentTab === 'reminder' ? '暂无提醒' : '一切都很安静' }}</text>
            <text class="empty-desc">{{ currentTab === 'reminder' ? '生日和日程提醒会出现在这里' : '暂无待处理的消息，去休息一下吧' }}</text>
          </view>
        </block>

        <view class="safe-bottom"></view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { useAppTheme } from '@/common/themes/useAppTheme.js'
const { themeClass, primaryColor, softColor, theme } = useAppTheme()

import { ref, computed, onMounted } from 'vue';
import IosNav from '../../components/nav/ios-nav.vue';
import { notificationsApi, roomApi } from '../../common/api';
import {formatSmartTime} from '../js/utils.js'
import {
  applyLocalNotificationRead,
  buildNotificationMarkReadParams,
  getReminderActionLabel,
  isBirthdayReminder,
  isNotificationUnread,
  isReminderCard,
  isScheduleNotification,
  normalizeNotificationItem
} from '@/common/utils/reminderDisplay.js'

const currentTab = ref('all');
const isLoading = ref(true);
const isError = ref(false);

const tabs = [
  { id: 'all', label: '全部' },
  { id: 'reminder', label: '提醒' },
  { id: 'invitation', label: '邀请' },
  { id: 'system', label: '系统' }
];

const getLegacyButton = (item) => {
  if (isNotificationUnread(item) === false && item.read == 1) return false;
  return item.channel === 'version' || item.channel === 'transaction_details';
};

const getLegacyButtonText = (item) => {
  if (item.channel === 'version') return '查看更多版本信息';
  if (item.channel === 'transaction_details') return '查看账目明细';
  return '';
};

const getCardClass = (msg) => {
  if (!isReminderCard(msg)) return {};
  const tone = isBirthdayReminder(msg) ? 'birthday' : 'schedule';
  return {
    'reminder-card': true,
    [`reminder-card-${tone}`]: true,
    'is-unread': isNotificationUnread(msg)
  };
};

const getReminderActionClass = (action) => {
  if (action === 'view') return 'accept';
  return 'outline';
};

const getList = async () => {
  const res = await notificationsApi.getNotificationList();
  if (res.code == 0) {
    messages.value = (res.data?.rows || []).map(normalizeNotificationItem);
  }
};

const messages = ref([
  // {
  //   id: 1,
  //   type: 'invite',
  //   title: '加入“装修基金”空间',
  //   content: '王先生 邀请你共同管理该账本，加入后可实时查看装修支出。',
  //   time: '2分钟前',
  //   handled: false,
  //   handleResult: ''
  // },
  // {
  //   id: 2,
  //   type: 'alert',
  //   title: '预算超支预警',
  //   content: '“我们家”空间的本月“餐饮”类别已支出 ¥2,400，超出预算限额 20%。',
  //   time: '1小时前',
  //   handled: false,
  //   handleResult: ''
  // },
  // {
  //   id: 3,
  //   type: 'system',
  //   title: '版本更新说明 v2.4.0',
  //   content: '全新 FamilyLink 消息中心上线！现在你可以在此处理所有家庭协作邀请。',
  //   time: '昨日',
  //   handled: true,
  //   handleResult: '已阅读'
  // },
  // {
  //   id: 4,
  //   type: 'invite',
  //   title: '加入“周末采购”空间',
  //   content: '李太太 邀请你参与本周的超市购物清单协作。',
  //   time: '2天前',
  //   handled: true,
  //   handleResult: '已接受'
  // }
]);

const filteredMessages = computed(() => {
  if (currentTab.value === 'all') return messages.value;
  if (currentTab.value === 'reminder') {
    return messages.value.filter((m) => isScheduleNotification(m));
  }
  if (currentTab.value === 'invitation') return messages.value.filter(m => m.type === 'invitation');
  if (currentTab.value === 'system') {
    return messages.value.filter(m => m.type === 'system' || m.type === 'budget_alert');
  }
  return [];
});

onMounted(() => {
  fetchData();
});

const fetchData = async () => {
  isLoading.value = true;
  isError.value = false;
  try {
    await getList();
  } catch (e) {
    isError.value = true;
  } finally {
    isLoading.value = false;
  }
};

const changeTab = (id) => {
  if (currentTab.value === id) return;
  currentTab.value = id;
  // uni.vibrateShort({ type: 'light' });
};

const goBack = () => uni.navigateBack();

const getTypeEmoji = (type) => {
  const map = {
    invitation: '📩',
    budget_alert: '🚨',
    system: '⚙️',
    schedule: '🔔',
    schedule_reminder: '🔔',
    birthday_reminder: '🎂',
    reminder: '🔔'
  };
  return map[type] || '🔔';
};

const getTypeLabel = (type) => {
  const map = {
    invitation: '空间邀请',
    budget_alert: '支出预警',
    system: '系统通知',
    schedule: '提醒',
    schedule_reminder: '日程提醒',
    birthday_reminder: '生日提醒',
    reminder: '提醒'
  };
  return map[type] || '通知';
};

const openReminderTarget = (msg) => {
  if (!msg.roomId) {
    uni.showToast({ title: '缺少空间信息', icon: 'none' });
    return;
  }
  const date = msg.targetDate || '';
  const roomName = msg.roomName ? encodeURIComponent(msg.roomName) : '';
  let url = `/pages/dashboard/dashboard?roomId=${msg.roomId}&tab=schedule`;
  if (roomName) url += `&name=${roomName}`;
  if (date) url += `&date=${date}`;
  uni.navigateTo({ url });
};

const markingReadIds = new Set();

const patchNotificationReadState = (msg) => {
  const idx = messages.value.findIndex(item => item.id === msg.id);
  if (idx === -1) return;
  messages.value[idx] = applyLocalNotificationRead(messages.value[idx]);
};

const markNotificationRead = async (msg) => {
  if (!isNotificationUnread(msg)) return true;

  const params = buildNotificationMarkReadParams(msg);
  if (params.id == null && params.targetId == null) {
    uni.showToast({ title: '缺少通知标识', icon: 'none' });
    return false;
  }
  if (!params.targetType) {
    uni.showToast({ title: '缺少通知类型', icon: 'none' });
    return false;
  }

  const markKey = String(params.id != null ? params.id : `${params.targetType}:${params.targetId}`);
  if (markingReadIds.has(markKey)) return false;
  markingReadIds.add(markKey);

  try {
    const res = await notificationsApi.markNotificationRead(params);
    if (res.code == 0) {
      patchNotificationReadState(msg);
      uni.$emit('refresh_notification_count');
      return true;
    }
    uni.showToast({ title: res.msg || '标记已读失败', icon: 'none' });
    return false;
  } catch (e) {
    uni.showToast({ title: '标记已读失败', icon: 'none' });
    return false;
  } finally {
    markingReadIds.delete(markKey);
  }
};

const handleReminderAction = async (index, msg, action) => {
  if (action === 'view') {
    if (!msg.roomId) {
      uni.showToast({ title: '缺少空间信息', icon: 'none' });
      return;
    }
    openReminderTarget(msg);
    await markNotificationRead(msg);
    return;
  }
  if (action === 'mark_read') {
    const ok = await markNotificationRead(msg);
    if (ok) {
      uni.showToast({ title: '已标为已读', icon: 'none' });
    }
    return;
  }
  if (action === 'snooze') {
    uni.showToast({ title: '稍后提醒你', icon: 'none' });
  }
};

const goToLegacyDetail = async (msg, index) => {
  uni.showToast({ title: '正在跳转详情...', icon: 'none' });
  if (msg.channel === 'version') {
    uni.navigateTo({ url: '/pages/version-history/version-history' });
  } else if (msg.channel === 'transaction_details') {
    uni.navigateTo({
      url: `/pages/ledger-all/ledger-all?roomId=${msg.roomId}&accountId=${msg.accountId}`
    });
  }
  await markNotificationRead(msg);
};

const handleAction = async (index, msg, action) => {
  try {
    uni.showLoading({ title: action === 'accept' ? '正在加入...' : '正在处理...' });
    const res = await (action === 'accept'
      ? roomApi.accecptSigin(msg.id, {})
      : roomApi.rejectSigin(msg.id, {}));
    if (res.code === 0) {
      if (action === 'accept') {
        uni.$emit('refresh_room_data');
      }
      const localInviteCode = uni.getStorageSync('inviteCode');
      if (localInviteCode) {
        const stillExists = messages.value.some(
          item => item.inviteCode === localInviteCode
        );
        if (stillExists) {
          uni.removeStorageSync('inviteCode');
        }
      }

      if (index !== -1) {
        messages.value[index] = {
          ...messages.value[index],
          handled: true,
          handleResult: action === 'accept' ? '已接受' : '已拒绝'
        };
      }
      uni.showToast({ title: '操作成功' });
    }
  } catch (e) {
    uni.hideLoading();
  }
};
</script>

<style scoped>
.notif-page {
  height: 100vh;
  background-color: var(--primary-soft, #EEF2FF);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  transition: background-color 0.35s ease;
}

.notif-ambient-glow {
  position: absolute; top: -100px; right: -50px; width: 350px; height: 350px;
  background: radial-gradient(circle, var(--primary-glow, rgba(79, 70, 229, 0.12)) 0%, transparent 70%);
  z-index: 0; pointer-events: none;
  transition: background 0.35s ease;
}

.tab-strip { display: flex; padding: 10px 24px; gap: 24px; background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(20px); z-index: 10; border-bottom: 1rpx solid rgba(0, 0, 0, 0.02); }
.tab-item { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 4px 0; }
.tab-label { font-size: 15px; font-weight: 800; color: #94A3B8; transition: all 0.3s; }
.active .tab-label { color: var(--primary-color, #4F46E5); transform: scale(1.05); font-weight: 900; }
.tab-active-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--primary-color, #4F46E5); box-shadow: 0 0 10px var(--primary-glow, rgba(79, 70, 229, 0.5)); }

.notif-scroll { flex: 1; height: 0; }
.notif-container { padding: 20px 20px 60px; }

.notif-card { 
  background: #fff; border-radius: 32px; padding: 24px; margin-bottom: 16px; 
  border: 1px solid #F1F5F9; box-shadow: 0 10px 30px rgba(0,0,0,0.02);
  transition: transform 0.2s;
}
.notif-card.is-unread {
  border-color: #DDD6FE;
  box-shadow: 0 10px 30px rgba(124, 58, 237, 0.08);
}
.notif-card.reminder-card {
  padding: 22px 22px 20px;
}
.notif-card.reminder-card-schedule.is-unread {
  border-color: #C7D2FE;
  box-shadow: 0 12px 32px rgba(79, 70, 229, 0.08);
}
.notif-card.reminder-card-birthday.is-unread {
  border-color: #F5D0FE;
  box-shadow: 0 12px 32px rgba(192, 38, 211, 0.08);
}
.notif-card:active:not(.skeleton-mode) { transform: scale(0.99); }

.reminder-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.reminder-head-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}
.reminder-icon {
  font-size: 18px;
  line-height: 1;
}
.reminder-type-title {
  font-size: 15px;
  font-weight: 900;
  color: #1E293B;
}
.reminder-time {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 700;
  color: #94A3B8;
}
.reminder-body {
  margin-bottom: 18px;
}
.reminder-main {
  display: block;
  font-size: 18px;
  font-weight: 900;
  color: #1E293B;
  line-height: 1.45;
  letter-spacing: -0.3px;
  margin-bottom: 8px;
}
.reminder-card-birthday .reminder-main {
  color: #86198F;
}
.reminder-card-schedule .reminder-main {
  color: #312E81;
}
.reminder-sub {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: #64748B;
  line-height: 1.5;
}
.reminder-actions {
  padding-top: 2px;
}

/* --- 骨架屏样式 --- */
.skeleton-mode { pointer-events: none; }
.sk-item { background: #F1F5F9; border-radius: 8px; }
.shimmer { 
  position: relative; overflow: hidden; 
}
.shimmer::after {
  content: ""; position: absolute; inset: 0;
  background-image: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
  animation: shimmerAnim 1.8s infinite;
}
@keyframes shimmerAnim { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }

.sk-pill { width: 80px; height: 24px; border-radius: 10px; }
.sk-time { width: 60px; height: 14px; }
.sk-title { width: 70%; height: 20px; margin-bottom: 12px; }
.sk-desc { width: 100%; height: 14px; margin-bottom: 8px; }

/* --- 网络错误视图 --- */
.error-view { 
  display: flex; flex-direction: column; align-items: center; justify-content: center; 
  padding: 100rpx 40rpx; text-align: center;
}
.error-visual { position: relative; width: 160rpx; height: 160rpx; display: flex; align-items: center; justify-content: center; margin-bottom: 48rpx; }
.error-emoji { font-size: 80rpx; position: relative; z-index: 2; }
.error-pulse { position: absolute; inset: 0; background: var(--primary-soft, #EEF2FF); border-radius: 50%; animation: errorPulse 2s infinite; }
@keyframes errorPulse { 0% { transform: scale(0.8); opacity: 0.8; } 100% { transform: scale(1.4); opacity: 0; } }

.error-h { font-size: 34rpx; font-weight: 900; color: #1E293B; margin-bottom: 16rpx; }
.error-p { font-size: 26rpx; font-weight: 700; color: #94A3B8; line-height: 1.6; margin-bottom: 60rpx; }
.retry-btn { 
  background: var(--primary-color, #4F46E5);
  height: 100rpx; padding: 0 60rpx; border-radius: 30rpx; 
  display: flex; align-items: center; justify-content: center; border: none;
  box-shadow: 0 12rpx 30rpx var(--primary-glow, rgba(79, 70, 229, 0.25));
  transition: background 0.35s ease, box-shadow 0.35s ease;
}
.retry-btn:active { transform: scale(0.96); opacity: 0.9; }
.retry-txt { color: #fff; font-size: 28rpx; font-weight: 900; }

.msg-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.type-pill { display: flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 10px; }
.type-pill.invitation { background: var(--primary-soft, #EEF2FF); color: var(--primary-color, #4F46E5); }
.type-pill.budget_alert { background: #FFF1F2; color: #F43F5E; }
.type-pill.reminder,
.type-pill.schedule,
.type-pill.schedule_reminder { background: #F5F3FF; color: #7C3AED; }
.type-pill.birthday_reminder { background: #FDF4FF; color: #C026D3; }
.type-pill.reminder .type-label,
.type-pill.reminder .type-emoji,
.type-pill.schedule .type-label,
.type-pill.schedule .type-emoji,
.type-pill.schedule_reminder .type-label,
.type-pill.schedule_reminder .type-emoji,
.type-pill.birthday_reminder .type-label,
.type-pill.birthday_reminder .type-emoji { color: inherit; }
.type-pill.version { background: var(--primary-soft, #EEF2FF); color: var(--primary-color, #64748B); }
.type-emoji { font-size: 14px; }
.type-label { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }
.msg-time { font-size: 11px; font-weight: 700; color: #CBD5E1; }

.msg-body { margin-bottom: 24px; }
.msg-title { font-size: 17px; font-weight: 900; color: #1E293B; display: block; margin-bottom: 6px; letter-spacing: -0.2px; }
.msg-desc { font-size: 13px; font-weight: 700; color: #64748B; line-height: 1.6; }

.action-row { display: flex; gap: 12px; }
.action-row.single .btn-action { flex: 1; }


/* 🔥 关键在这 */
.btn-action::after {
  border: none;
}

.btn-action { 
  flex: 1; height: 48px; border-radius: 16px; display: flex; align-items: center; justify-content: center; 
  font-size: 14px; font-weight: 900; border: none; transition: all 0.2s;
}
.btn-action:active { transform: scale(0.95); }
.btn-action.accept { background: var(--primary-color, #4F46E5); color: #fff; box-shadow: 0 10px 20px var(--primary-glow, rgba(79, 70, 229, 0.2)); }
.btn-action.reject { background: var(--primary-soft, #EEF2FF); color: #94A3B8; }
.btn-action.outline { background: #fff; color: var(--primary-color, #4F46E5); border: 1.5px solid var(--primary-soft, #EEF2FF); }

.handled-status { display: flex; align-items: center; gap: 6px; padding: 12px 0 0; border-top: 1px dashed #F1F5F9; }
.status-txt { font-size: 11px; font-weight: 800; color: #CBD5E1; text-transform: uppercase; }

.empty-notif { padding: 100px 40px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
.empty-icon-wrap { font-size: 60px; filter: grayscale(1); opacity: 0.3; }
.empty-title { font-size: 20px; font-weight: 900; color: #1E293B; }
.empty-desc { font-size: 14px; font-weight: 700; color: #94A3B8; text-align: center; }

.safe-bottom { height: env(safe-area-inset-bottom); padding-bottom: 20px; }

.animate-stagger-in { animation: staggerIn 0.6s cubic-bezier(0.19, 1, 0.22, 1) both; }
@keyframes staggerIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

.animate-fade-in { animation: fadeIn 0.5s ease-out both; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.animate-pulse { animation: pulseBadge 2s infinite; }
@keyframes pulseBadge { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.3); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }
</style>
