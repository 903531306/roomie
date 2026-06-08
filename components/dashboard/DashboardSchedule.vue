
<template>
  <view :class="themeClass" class="tab-content-schedule animate-fade-in">
    <!-- 本月概览 -->
    <view class="month-overview-card">
      <text class="overview-text">
        {{ monthOverview.month }}月 · {{ monthOverview.count }}个生日
        <text v-if="monthOverview.todayCount > 0" class="overview-highlight"> · {{ monthOverview.todayCount }}个今天</text>
      </text>
    </view>

    <!-- 日期导航：默认周视图 -->
    <view
      class="calendar-card"
      :class="{ 'is-expanded': isExpanded }"
      @touchstart="onTouchStart"
      @touchmove.stop.prevent="onTouchMove"
      @touchend="onTouchEnd"
    >
      <view class="calendar-nav-bar">
        <view class="nav-arrow-btn" @click.stop="shiftPeriod(-1)">
          <text class="arrow-sym">‹</text>
        </view>
        <picker mode="date" fields="month" :value="selectedDate" @change="onMonthPickerChange">
          <view class="month-selector">
            <text class="current-month-txt">{{ displayMonth }}</text>
          </view>
        </picker>
        <view class="nav-arrow-btn" @click.stop="shiftPeriod(1)">
          <text class="arrow-sym">›</text>
        </view>
      </view>

      <view class="weekday-header">
        <text v-for="w in ['日', '一', '二', '三', '四', '五', '六']" :key="w" class="weekday-txt">{{ w }}</text>
      </view>

      <view class="calendar-grid-container" :class="{ 'is-month-mode': isExpanded, 'is-week-mode': !isExpanded }">
        <view class="calendar-grid" :class="{ 'month-grid': isExpanded }">
          <view
            v-for="(day, index) in displayDays"
            :key="day.fullDate + index"
            class="day-cell"
            :class="{
              'is-today': day.isToday,
              'is-other-month': day.isOtherMonth && isExpanded
            }"
            @click="handleDateSelect(day)"
          >
            <view class="day-num-box" :class="{ 'is-active': day.fullDate === selectedDate }">
              <text class="day-num">{{ day.date }}</text>
            </view>
            <text v-if="isExpanded" class="lunar-txt">{{ day.lunar }}</text>
            <view v-if="day.events.length > 0" class="day-dots">
              <view
                v-for="(ev, ei) in day.events.slice(0, isExpanded ? 2 : 3)"
                :key="ei"
                class="mini-dot"
                :class="ev.isBirthday ? 'dot-birthday' : 'dot-task'"
              ></view>
            </view>
            <text v-if="day.isToday && !isExpanded" class="today-strip-label">今天</text>
          </view>
        </view>
      </view>

      <view class="expand-text-btn" @click="toggleExpand">
        <text>{{ isExpanded ? '收起月历' : '展开月历' }}</text>
      </view>
    </view>

    <!-- 事件列表：选中日期 + 即将到来（两层） -->
    <view class="schedule-stream">
      <!-- 第一块：随选中日期切换 -->
      <view class="stream-section">
        <view class="section-head">
          <text class="section-title">{{ selectedDateSectionTitle }}</text>
        </view>

        <view
          v-for="(b, idx) in selectedBirthdays"
          :key="'b-' + b.id"
          class="birthday-card"
          :style="{ animationDelay: (idx * 0.06) + 's' }"
          @click="handleEventClick(b)"
        >
          <view class="b-main">
            <view class="b-title-row">
              <text class="b-emoji">🎂</text>
              <text class="b-name">{{ b.title }}</text>
            </view>
            <text v-if="isSelectedToday && b.daysLeft === 0" class="b-status today-status">今天</text>
            <text v-else class="b-date-hint">{{ formatBirthdayHintForDate(b, selectedDate) }}</text>
            <text class="remind-status" :class="{ 'remind-status-action': !b.remindEnabled }">
              {{ formatRemindStatus(b) }}<text v-if="!b.remindEnabled"> · 点击设置</text>
            </text>
            <view
              v-if="showWechatReauthAction(b)"
              class="wechat-reauth-btn"
              @click.stop="handleWechatReauthorize(b, $event)"
            >
              <text class="wechat-reauth-btn-text">补授权微信提醒</text>
            </view>
          </view>
        </view>

        <view
          v-for="(item, idx) in selectedSchedules"
          :key="'s-' + item.id"
          class="event-detail-card"
          :style="{ animationDelay: ((selectedBirthdays.length + idx) * 0.06) + 's' }"
          @click="handleEventClick(item)"
        >
          <text class="detail-title">{{ item.title }}</text>
          <text class="detail-meta">{{ item.time }}</text>
          <text class="remind-status" :class="{ 'remind-status-action': !item.remindEnabled }">
            {{ formatRemindStatus(item) }}<text v-if="!item.remindEnabled"> · 点击设置</text>
          </text>
        </view>

        <view v-if="!hasSelectedDateEvents" class="empty-inline">
          <text>暂无事件</text>
        </view>
      </view>

      <!-- 第二块：始终展示，天数按选中日期计算 -->
      <view v-if="upcomingBirthdays.length > 0" class="stream-section">
        <view class="section-head">
          <text class="section-title">即将到来</text>
        </view>
        <view
          v-for="(b, idx) in upcomingBirthdays"
          :key="b.id"
          class="birthday-card"
          :style="{ animationDelay: (0.1 + idx * 0.06) + 's' }"
          @click="handleEventClick(b)"
        >
          <view class="b-main">
            <view class="b-title-row">
              <text class="b-emoji">🎂</text>
              <text class="b-name">{{ b.title }}</text>
            </view>
            <text class="b-date-hint">{{ formatBirthdayHintForDate(b, b.upcomingDate) }}</text>
            <text class="remind-status" :class="{ 'remind-status-action': !b.remindEnabled }">
              {{ formatRemindStatus(b) }}<text v-if="!b.remindEnabled"> · 点击设置</text>
            </text>
            <view
              v-if="showWechatReauthAction(b)"
              class="wechat-reauth-btn"
              @click.stop="handleWechatReauthorize(b, $event)"
            >
              <text class="wechat-reauth-btn-text">补授权微信提醒</text>
            </view>
          </view>
          <text class="b-days-right">{{ b.daysFromSelected }}天</text>
        </view>
      </view>

      <!-- 全局空状态：没有任何生日数据 -->
      <view
        v-if="enrichedBirthdays.length === 0 && normalizedSchedules.length === 0"
        class="empty-state"
      >
        <text class="empty-emoji">🎈</text>
        <text class="empty-title">还没有录入生日</text>
        <text class="empty-sub">点右下角 + 添加家人生日，到期前会在这里提醒</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { useAppTheme } from '@/common/themes/useAppTheme.js'
const { themeClass } = useAppTheme()

import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { taskApi } from '../../common/api';
import { toTimestamp } from '../../pages/js/utils.js';
import { markScheduleHomeDirty } from '../../common/utils/scheduleHomePreview.js';
import {
  formatSolarDateLunar,
  formatLunarDayShort
} from '../../common/utils/lunarDisplay.js';
import { formatRemindStatus, normalizeRemindFields } from '../../common/utils/reminderDisplay.js';
import {
  getBirthdayUpcomingMeta,
  isBirthdayOnDate,
  normalizeBirthdayMeta,
  startOfDay
} from '../../common/utils/birthdayRules.js';
import {
  REMIND_CHANNEL_WECHAT,
  confirmBirthdayWechatSubscribe,
  ensureWechatSubscribeTemplates,
  getWechatReauthorizeToast,
  isBirthdayWechatSubscribeReady,
  parseRemindChannels,
  sanitizeRemindChannelsForType,
  shouldShowWechatReauthorize
} from '../../common/utils/wechatSubscribe.js';

const props = defineProps({
  roomId: { type: [String, Number], default: '' }
});

const isExpanded = ref(false);
const selectedDate = ref(new Date().toISOString().split('T')[0]);
const viewDate = ref(new Date());
const todayStr = ref(new Date().toISOString().split('T')[0]);

const rawSchedules = ref([]);
const rawBirthdays = ref([]);
const wechatSubscribeReady = ref(false);

const parseTimestamp = (ts) => {
  if (!ts) return { date: '', time: '09:00' };
  const d = new Date(Number(ts));
  if (isNaN(d.getTime())) return { date: '', time: '09:00' };
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return {
    date: `${year}-${month}-${date}`,
    time: `${hour}:${min}`
  };
};

const formatDate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
};

const enrichBirthday = (item) => {
  const birthdayMeta = normalizeBirthdayMeta(item, new Date());
  const thisYearOccurrence = startOfDay(new Date(birthdayMeta.nextDate));
  const today = startOfDay(new Date());
  const passedThisYear = thisYearOccurrence < today && birthdayMeta.daysLeft > 0;

  return {
    ...item,
    ...normalizeRemindFields({ ...item, scheduleType: 'birthday' }),
    ...birthdayMeta,
    remindChannels: parseRemindChannels(item.remindChannels || item.remind_channels),
    passedThisYear,
    isBirthday: true
  };
};

const normalizedSchedules = computed(() => {
  return (rawSchedules.value || []).map(item => {
    const parsed = parseTimestamp(item.startTime);
    return {
      ...item,
      ...normalizeRemindFields({ ...item, scheduleType: 'schedule' }),
      date: parsed.date,
      time: parsed.time,
      isBirthday: false
    };
  });
});

const enrichedBirthdays = computed(() => {
  return (rawBirthdays.value || []).map(enrichBirthday);
});

const todayBirthdays = computed(() =>
  enrichedBirthdays.value.filter(b => b.daysLeft === 0).sort((a, b) => a.title.localeCompare(b.title))
);

const upcomingBirthdays = computed(() => {
  const selected = selectedDate.value;
  return enrichedBirthdays.value
    .map((b) => {
      const meta = getBirthdayUpcomingMeta(b, selected);
      if (!meta || meta.daysFromSelected <= 0) return null;
      return {
        ...b,
        upcomingDate: formatDate(meta.occurrence),
        daysFromSelected: meta.daysFromSelected,
        isNextYear: meta.isNextYear
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.daysFromSelected - b.daysFromSelected);
});

const monthOverview = computed(() => {
  const month = viewDate.value.getMonth() + 1;
  const count = enrichedBirthdays.value.filter((b) => {
    const nextParts = (b.nextDate || '').split('-');
    return parseInt(nextParts[1], 10) === month;
  }).length;
  const todayCount = todayBirthdays.value.length;
  return { month, count, todayCount };
});

const isSelectedToday = computed(() => selectedDate.value === todayStr.value);

const selectedDateSectionTitle = computed(() =>
  isSelectedToday.value ? '今日' : selectedDateTitle.value
);

const selectedDateTitle = computed(() => {
  const parts = (selectedDate.value || '').split('-');
  if (parts.length < 3) return '';
  return `${parseInt(parts[1], 10)}月${parseInt(parts[2], 10)}日`;
});

const selectedBirthdays = computed(() =>
  enrichedBirthdays.value
    .filter((b) => isBirthdayOnDate(b, selectedDate.value))
    .sort((a, b) => a.title.localeCompare(b.title))
);

const selectedSchedules = computed(() =>
  normalizedSchedules.value
    .filter(item => item.date === selectedDate.value)
    .sort((a, b) => a.time.localeCompare(b.time))
);

const hasSelectedDateEvents = computed(() =>
  selectedBirthdays.value.length > 0 || selectedSchedules.value.length > 0
);

const formatBirthdayHint = (b) => {
  if (b.isLunar) {
    return `${b.lunarText} · 下次 ${b.nextDate}`;
  }
  return `公历 ${b.nextDate} · ${formatSolarDateLunar(b.nextDate)}`;
};

const formatBirthdayHintForDate = (b, dateStr) => {
  if (b.isLunar) {
    return `${b.lunarText} · 公历 ${dateStr}`;
  }
  return `公历 ${dateStr} · ${formatSolarDateLunar(dateStr)}`;
};

/** 补授权：仅后端标记 need_reauthorize / wechatReauthorizeRequired 时展示 */
const showWechatReauthAction = (birthday = {}) =>
  wechatSubscribeReady.value && shouldShowWechatReauthorize(birthday);

const handleWechatReauthorize = async (birthday, event) => {
  event?.stopPropagation?.();
  if (!birthday?.id) return;

  const result = await confirmBirthdayWechatSubscribe();
  if (result.cancelled) return;

  const remindChannels = result.accepted
    ? sanitizeRemindChannelsForType('birthday', [...parseRemindChannels(birthday.remindChannels), REMIND_CHANNEL_WECHAT])
    : sanitizeRemindChannelsForType('birthday', birthday.remindChannels);

  try {
    uni.showLoading({ title: '保存授权...' });
    const res = await taskApi.updateSchedule({
      id: birthday.id,
      roomId: props.roomId,
      scheduleType: 'birthday',
      remindChannels,
      wechatSubscribe: result
    });
    if (res.code == 0) {
      markScheduleHomeDirty(props.roomId);
      getScheduleList('birthday');
      uni.showToast({
        title: getWechatReauthorizeToast(result.accepted),
        icon: 'none'
      });
    }
  } finally {
    uni.hideLoading();
  }
};

const buildSchedulePayload = (payload) => {
  const data = payload.data || {};
  const map = {
    roomId: props.roomId,
    title: data.title,
    date: data.date,
    remindEnabled: data.remindEnabled,
    remindTime: data.remindTime,
    remindOffsets: Array.isArray(data.remindOffsets) ? data.remindOffsets : [],
    remindChannels: Array.isArray(data.remindChannels) ? data.remindChannels : [],
    wechatSubscribe: data.wechatSubscribe || null,
    repeatType: data.repeatType
  };
  if (data.id) map.id = data.id;
  if (payload.type === 'daily') {
    map.scheduleType = 'schedule';
    map.time = data.remindTime || data.time;
    map.startTime = toTimestamp(data.date, data.remindTime || data.time);
  } else {
    map.lunar = data.lunar != null ? data.lunar : (data.isLunar ? 1 : 0);
    map.scheduleType = 'birthday';
    map.birthdayCalendar = data.birthdayCalendar;
    map.birthdayOriginalDate = data.birthdayOriginalDate || '';
    map.birthdayMonth = data.birthdayMonth;
    map.birthdayDay = data.birthdayDay;
    map.birthdayLeapMonth = data.birthdayLeapMonth ? 1 : 0;
    const refDate = data.birthdayCalendar === 'lunar'
      ? ''
      : (data.birthdayOriginalDate || data.date);
    map.date = refDate || '';
    if (refDate) {
      map.startTime = toTimestamp(refDate, '00:00');
    }
  }
  return map;
};

onMounted(() => {
  ensureWechatSubscribeTemplates().then(() => {
    wechatSubscribeReady.value = isBirthdayWechatSubscribeReady();
  });
  uni.$on('schedule_item_saved', (payload) => {
    addTask(buildSchedulePayload(payload), payload.type);
  });
  uni.$on('schedule_item_updated', (payload) => {
    updateTask(buildSchedulePayload(payload), payload.type);
  });
  uni.$on('schedule_item_deleted', (payload) => {
    deleteTask(payload.id, payload.type);
  });
  uni.$on('dashboard_set_schedule_date', (date) => {
    if (date) selectedDate.value = date;
  });
  watch(selectedDate, (newVal) => { uni.$emit('dashboard_date_changed', newVal); }, { immediate: true });
  getScheduleList('schedule');
  getScheduleList('birthday');
});

const addTask = async (map, type) => {
  const res = await taskApi.createSchedule(map);
  if (res.code == 0) {
    markScheduleHomeDirty(props.roomId);
    getScheduleList(type === 'daily' ? 'schedule' : 'birthday');
  }
};

const updateTask = async (map, type) => {
  const res = await taskApi.updateSchedule(map);
  if (res.code == 0) {
    markScheduleHomeDirty(props.roomId);
    getScheduleList(type === 'daily' ? 'schedule' : 'birthday');
  }
};

const deleteTask = async (id, type) => {
  const res = await taskApi.deleteSchedule(id, props.roomId);
  if (res.code == 0) {
    markScheduleHomeDirty(props.roomId);
    getScheduleList(type === 'daily' ? 'schedule' : 'birthday');
  }
};

const getScheduleList = async (scheduleType) => {
  try {
    const res = await taskApi.scheduleList({ roomId: props.roomId, scheduleType });
    if (res.code == 0 && res.data) {
      if (scheduleType === 'schedule') rawSchedules.value = res.data.rows || [];
      else rawBirthdays.value = res.data.rows || [];
    }
  } catch (e) {}
};

onUnmounted(() => {
  uni.$off('schedule_item_saved');
  uni.$off('schedule_item_updated');
  uni.$off('schedule_item_deleted');
  uni.$off('dashboard_set_schedule_date');
});

const displayMonth = computed(() => {
  const d = new Date(viewDate.value);
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
});

const buildDayEvents = (ds) => [
  ...normalizedSchedules.value.filter(s => s.date === ds).map(v => ({ ...v, isBirthday: false })),
  ...enrichedBirthdays.value.filter(b => isBirthdayOnDate(b, ds)).map(v => ({ ...v, isBirthday: true }))
];

const allMonthDays = computed(() => {
  const d = new Date(viewDate.value);
  const currentYear = d.getFullYear();
  const currentMonth = d.getMonth();
  const firstDay = new Date(currentYear, currentMonth, 1);
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - firstDay.getDay());

  const result = [];
  for (let i = 0; i < 42; i++) {
    const temp = new Date(startDate);
    temp.setDate(startDate.getDate() + i);
    const ds = formatDate(temp);
    result.push({
      fullDate: ds,
      date: temp.getDate(),
      lunar: formatLunarDayShort(ds),
      isToday: ds === todayStr.value,
      isOtherMonth: temp.getMonth() !== currentMonth,
      events: buildDayEvents(ds)
    });
  }
  return result;
});

const displayDays = computed(() => {
  if (isExpanded.value) return allMonthDays.value;
  const selected = new Date(selectedDate.value);
  const startOfWeek = new Date(selected);
  startOfWeek.setDate(selected.getDate() - selected.getDay());
  const result = [];
  for (let i = 0; i < 7; i++) {
    const temp = new Date(startOfWeek);
    temp.setDate(startOfWeek.getDate() + i);
    const ds = formatDate(temp);
    result.push({
      fullDate: ds,
      date: temp.getDate(),
      lunar: formatLunarDayShort(ds),
      isToday: ds === todayStr.value,
      isOtherMonth: false,
      events: buildDayEvents(ds)
    });
  }
  return result;
});

const handleDateSelect = (day) => {
  selectedDate.value = day.fullDate;
  const d = new Date(day.fullDate);
  if (d.getMonth() !== viewDate.value.getMonth() || d.getFullYear() !== viewDate.value.getFullYear()) {
    viewDate.value = new Date(d.getFullYear(), d.getMonth(), 1);
  }
};

const handleEventClick = (ev) => {
  uni.$emit('open_schedule_edit', ev);
};
const toggleExpand = () => { isExpanded.value = !isExpanded.value; };

const shiftPeriod = (dir) => {
  if (isExpanded.value) {
    const current = new Date(viewDate.value);
    current.setMonth(current.getMonth() + dir);
    viewDate.value = current;
    return;
  }
  const current = new Date(selectedDate.value);
  current.setDate(current.getDate() + (dir * 7));
  selectedDate.value = formatDate(current);
  viewDate.value = new Date(current.getFullYear(), current.getMonth(), 1);
};

const onMonthPickerChange = (e) => {
  const d = new Date(e.detail.value + '-01');
  viewDate.value = d;
  selectedDate.value = formatDate(d);
};

let touchStartX = 0;
let touchStartY = 0;
const onTouchStart = (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
};
const onTouchMove = () => {};
const onTouchEnd = (e) => {
  const deltaX = e.changedTouches[0].clientX - touchStartX;
  const deltaY = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 60) {
    shiftPeriod(deltaX > 0 ? -1 : 1);
  }
};
</script>

<style scoped>
.tab-content-schedule {
  display: flex;
  flex-direction: column;
  padding: 0 16px 140px;
  background: #F4F7FF;
  min-height: 100%;
}

/* 本月概览 */
.month-overview-card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 14px 16px;
  margin-bottom: 12px;
  border: 1px solid #EEF2F7;
}
.overview-text {
  font-size: 14px;
  font-weight: 600;
  color: #1F2937;
}
.overview-highlight {
  color: #635BFF;
  font-weight: 700;
}

/* 日历导航卡片 */
.calendar-card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 10px 10px 2px;
  margin-bottom: 16px;
  border: 1px solid #EEF2F7;
  overflow: hidden;
}
.calendar-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  padding: 0 4px;
}
.nav-arrow-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.arrow-sym {
  font-size: 20px;
  color: #94A3B8;
  font-weight: 600;
}
.current-month-txt {
  font-size: 15px;
  font-weight: 700;
  color: #1F2937;
}
.weekday-header {
  display: flex;
  margin-bottom: 2px;
}
.weekday-txt {
  flex: 1;
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: #94A3B8;
}

.calendar-grid-container {
  overflow: hidden;
  transition: max-height 0.35s ease;
}
.calendar-grid-container.is-week-mode {
  height: auto;
}
.calendar-grid-container.is-month-mode {
  max-height: 280px;
  height: auto;
  overflow: hidden;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  width: 100%;
}
.month-grid {
  row-gap: 2px;
}

.day-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2px 0;
  position: relative;
}
.is-week-mode .day-cell {
  min-height: 0;
  padding: 1px 0 0;
}
.is-expanded .day-cell {
  min-height: 38px;
  padding: 2px 0;
}

.day-num-box {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}
.is-active {
  background: #635BFF;
}
.is-active .day-num {
  color: #fff !important;
}
.day-num {
  font-size: 14px;
  font-weight: 700;
  color: #1F2937;
}
.is-today .day-num {
  color: #635BFF;
}
.is-other-month .day-num {
  color: #CBD5E1;
}

.lunar-txt {
  font-size: 8px;
  font-weight: 500;
  color: #CBD5E1;
  line-height: 1;
  margin-top: 1px;
}

.day-dots {
  display: flex;
  gap: 3px;
  align-items: center;
  margin-top: 1px;
  min-height: 4px;
}
.mini-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
}
.dot-task { background: #635BFF; }
.dot-birthday { background: #7C3AED; }

.today-strip-label {
  font-size: 9px;
  font-weight: 700;
  color: #635BFF;
  margin-top: 0;
  line-height: 1;
}

.expand-text-btn {
  display: flex;
  justify-content: center;
  padding: 4px 0 2px;
}
.expand-text-btn text {
  font-size: 12px;
  font-weight: 500;
  color: #94A3B8;
}

/* 事件列表 */
.schedule-stream {
  flex: 1;
}

.stream-section {
  margin-bottom: 20px;
}

.section-head {
  margin-bottom: 10px;
  padding: 0 2px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.section-head-main {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}
.section-title {
  font-size: 15px;
  font-weight: 700;
  color: #1F2937;
}
.section-sub {
  font-size: 12px;
  color: #94A3B8;
  font-weight: 500;
}
.section-badge {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 700;
  color: #635BFF;
}
.section-badge.muted {
  color: #94A3B8;
  font-weight: 600;
}
.section-title.muted {
  color: #94A3B8;
}

/* 生日卡片 */
.birthday-card {
  background: #FFFFFF;
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #EEF2F7;
  animation: slideUp 0.4s ease both;
}
.birthday-card.is-passed {
  opacity: 0.72;
}

.b-main {
  flex: 1;
  min-width: 0;
}
.b-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.b-emoji {
  font-size: 16px;
  line-height: 1;
}
.b-name {
  font-size: 16px;
  font-weight: 700;
  color: #1F2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.b-status {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #7C3AED;
  margin-bottom: 4px;
}
.b-status.today-status {
  color: #635BFF;
}
.b-status.passed-status {
  color: #94A3B8;
}
.b-date-hint {
  display: block;
  font-size: 12px;
  color: #94A3B8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.b-days-right {
  flex-shrink: 0;
  margin-left: 12px;
  font-size: 14px;
  font-weight: 700;
  color: #7C3AED;
}
.b-days-right.today-days {
  color: #635BFF;
}
.b-days-right.passed-days {
  color: #94A3B8;
  font-weight: 600;
}

/* 选中日期事件 */
.event-detail-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 8px;
  border: 1px solid #EEF2F7;
}
.detail-title {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 4px;
}
.detail-meta {
  font-size: 12px;
  color: #94A3B8;
}

.remind-status {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  color: #A78BFA;
  font-weight: 600;
}

.remind-status-action {
  color: #94A3B8;
}

.wechat-reauth-btn {
  display: inline-flex;
  margin-top: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  background: #ECFDF5;
  border: 1px solid #A7F3D0;
}

.wechat-reauth-btn-text {
  font-size: 11px;
  font-weight: 700;
  color: #059669;
}

/* 空状态 */
.empty-state {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 40px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px dashed #EEF2F7;
}
.empty-emoji {
  font-size: 32px;
  margin-bottom: 12px;
}
.empty-title {
  font-size: 15px;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 6px;
}
.empty-sub {
  font-size: 13px;
  color: #94A3B8;
  text-align: center;
  line-height: 1.5;
}
.empty-state.compact {
  padding: 28px 20px;
  margin-top: 4px;
}
.empty-inline {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px 16px;
  border: 1px solid #EEF2F7;
  text-align: center;
}
.empty-inline text {
  font-size: 14px;
  color: #94A3B8;
  font-weight: 500;
}

.animate-fade-in { animation: fadeIn 0.4s ease-out both; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
