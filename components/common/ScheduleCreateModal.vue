
<template>
  <GlobalDrawer
    :model-value="modelValue"
    :title="drawerTitle"
    :subtitle="drawerSubtitle"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <view :class="themeClass" class="schedule-form-body">
      <view class="modal-input-group">
        <text class="modal-label">{{ form.type === 'daily' ? '日程内容' : '家人称呼' }}</text>
        <view class="field-shell title-input-card" :class="{ 'field-shell-focus': titleInputFocus }">
          <textarea
            v-model="form.title"
            class="title-textarea-flat"
            :placeholder="form.type === 'daily' ? '要做什么？' : '家人的称呼（如：妈妈）'"
            auto-height
            @focus="titleInputFocus = true"
            @blur="titleInputFocus = false"
          />
        </view>
      </view>

      <block v-if="form.type === 'daily'">
        <view class="modal-input-group">
          <text class="modal-label">执行日期</text>
          <picker mode="date" :start="todayStr" :value="pickerDate" @change="onDateChange">
            <view class="picker-card-option">
              <view class="pc-left">
                <text class="pc-emoji">📅</text>
                <text class="pc-label">设定日期</text>
              </view>
              <text class="pc-val">{{ pickerDate }}</text>
            </view>
          </picker>
        </view>
      </block>

      <block v-else>
        <view class="modal-input-group">
          <text class="modal-label">生日类型</text>
          <view class="calendar-type-row">
            <view
              class="calendar-type-chip"
              :class="{ active: form.birthdayCalendar === 'solar' }"
              @click="setBirthdayCalendar('solar')"
            >
              <text class="calendar-type-icon">☀️</text>
              <text class="calendar-type-text">公历生日</text>
            </view>
            <view
              class="calendar-type-chip"
              :class="{ active: form.birthdayCalendar === 'lunar' }"
              @click="setBirthdayCalendar('lunar')"
            >
              <text class="calendar-type-icon">🌙</text>
              <text class="calendar-type-text">农历生日</text>
            </view>
          </view>
        </view>

        <view class="modal-input-group">
          <text class="modal-label">{{ form.birthdayCalendar === 'lunar' ? '农历生日' : '生日日期' }}</text>

          <picker
            v-if="form.birthdayCalendar === 'solar'"
            mode="date"
            :value="solarPickerDate"
            @change="onSolarDateChange"
          >
            <view class="birthday-picker-card">
              <view class="birthday-picker-left">
                <text class="birthday-picker-emoji">📅</text>
                <view class="birthday-picker-copy">
                  <text class="birthday-picker-title">选择日期</text>
                  <text class="birthday-picker-sub">按公历记录</text>
                </view>
              </view>
              <view class="birthday-picker-right">
                <text class="birthday-picker-value">{{ solarBirthdayLabel }}</text>
                <text class="birthday-picker-arrow">›</text>
              </view>
            </view>
          </picker>

          <block v-else>
            <picker
              mode="multiSelector"
              :range="lunarPickerRange"
              :value="lunarPickerIndex"
              @change="onLunarPickerChange"
            >
              <view class="birthday-picker-card lunar-card">
                <view class="birthday-picker-left">
                  <text class="birthday-picker-emoji">🌙</text>
                  <view class="birthday-picker-copy">
                    <text class="birthday-picker-title">选择农历生日</text>
                    <text class="birthday-picker-sub">按农历月日记录</text>
                  </view>
                </view>
                <view class="birthday-picker-right">
                  <text class="birthday-picker-value">{{ lunarBirthdayLabel }}</text>
                  <text class="birthday-picker-arrow">›</text>
                </view>
              </view>
            </picker>

            <view
              class="leap-month-chip"
              :class="{ active: form.birthdayLeapMonth }"
              @click="toggleLeapMonth"
            >
              <text class="leap-month-chip-text">闰月</text>
            </view>
          </block>
        </view>

        <view class="birthday-record-card" :class="`birthday-record-${form.birthdayCalendar}`">
          <text class="birthday-record-label">当前记录为</text>
          <text class="birthday-record-value">{{ birthdayRecordPreview.recordText }}</text>
          <text class="birthday-record-hint">{{ birthdayRecordPreview.hintText }}</text>
        </view>
      </block>

      <view class="remind-section" :class="{ 'remind-section-off': !form.remindEnabled }">
        <view class="remind-head">
          <view class="remind-head-left">
            <text class="remind-icon">🔔</text>
            <view>
              <text class="remind-title">提醒设置</text>
              <text class="remind-sub">开启后会在通知中心提醒你</text>
            </view>
          </view>
          <switch
            :checked="form.remindEnabled"
            :color="primaryColor"
            scale="0.7"
            @change="onRemindEnabledChange"
          />
        </view>

        <view class="remind-body" :class="{ disabled: !form.remindEnabled }">
          <view class="modal-input-group remind-field">
            <text class="modal-label">提醒时间</text>
            <picker
              mode="time"
              :value="form.remindTime"
              :disabled="!form.remindEnabled"
              @change="form.remindTime = $event.detail.value"
            >
              <view class="picker-card-option">
                <view class="pc-left">
                  <text class="pc-emoji">⏰</text>
                  <text class="pc-label">提醒时间</text>
                </view>
                <text class="pc-val">{{ form.remindTime }}</text>
              </view>
            </picker>
          </view>

          <view class="modal-input-group remind-field">
            <text class="modal-label">提前提醒</text>
            <view class="offset-chip-row">
              <view
                v-for="opt in REMIND_OFFSET_OPTIONS"
                :key="opt.value"
                class="offset-chip"
                :class="{ active: isOffsetSelected(opt.value), disabled: !form.remindEnabled }"
                @click="toggleOffset(opt.value)"
              >
                <text>{{ opt.label }}</text>
              </view>
            </view>
          </view>

          <text class="remind-preview">{{ remindPreviewText }}</text>

          <view v-if="form.remindEnabled" class="channel-section">
            <text class="modal-label channel-label">提醒方式</text>

            <view
              class="channel-row"
              :class="{ active: inAppChannelSelected }"
              @click="toggleRemindChannel(REMIND_CHANNEL_IN_APP)"
            >
              <view class="channel-check" :class="{ checked: inAppChannelSelected }">
                <text v-if="inAppChannelSelected" class="channel-check-icon">✓</text>
              </view>
              <view class="channel-copy">
                <text class="channel-title">小程序内提醒</text>
                <text class="channel-desc">到时间后在消息中心提醒你</text>
              </view>
            </view>

            <view
              v-if="showBirthdayWechatChannel"
              class="channel-row wechat-row"
              :class="{
                active: wechatChannelSelected,
                disabled: !wechatChannelReady
              }"
              @click="toggleRemindChannel(REMIND_CHANNEL_WECHAT)"
            >
              <view class="channel-check" :class="{ checked: wechatChannelSelected }">
                <text v-if="wechatChannelSelected" class="channel-check-icon">✓</text>
              </view>
              <view class="channel-copy">
                <text class="channel-title">微信生日提醒</text>
                <text class="channel-desc">
                  {{ wechatChannelReady
                    ? '保存时将说明授权规则，并请求微信订阅授权'
                    : '可先勾选；后台模板就绪后保存时才会真正发起微信授权' }}
                </text>
              </view>
            </view>

            <text
              v-if="showBirthdayWechatChannel && wechatChannelUnavailableHint"
              class="channel-hint channel-hint-warn"
            >
              {{ wechatChannelUnavailableHint }}
            </text>

            <text v-if="showWechatSubscribeHint" class="channel-hint channel-hint-accent">
              {{ wechatSubscribeHint }}
            </text>

            <text v-if="form.type === 'daily'" class="channel-hint">
              日程提醒第二期暂仅支持小程序内提醒；待申请「日程/待办提醒」模板后再接入微信提醒
            </text>

            <text v-if="showWechatLimitHint" class="channel-hint">
              若设置了多个提前提醒点，本次微信授权仅用于最近 1 次到期提醒
            </text>
          </view>
        </view>
      </view>
    </view>

    <template #footer>
      <view class="footer-actions">
        <button v-if="isEditMode" class="delete-btn" @click="handleDelete">
          <text class="delete-btn-txt">删除</text>
        </button>
        <button class="confirm-save-btn" :class="{ 'confirm-save-btn-compact': isEditMode }" :disabled="isSaving" @click="handleConfirm">
          <text class="btn-txt">{{ isSaving ? '保存中...' : (isEditMode ? '保存修改' : '确认保存记录') }}</text>
        </button>
      </view>
    </template>
  </GlobalDrawer>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue';
import { getTimeStr, getDateStr } from '../../pages/js/utils.js';
import { useAppTheme } from '@/common/themes/useAppTheme.js';
import GlobalDrawer from './GlobalDrawer.vue';
import {
  REMIND_OFFSET_OPTIONS,
  buildRemindPreview,
  buildScheduleEditForm,
  getDefaultRemindOffsets,
  toggleRemindOffset
} from '@/common/utils/reminderDisplay.js';
import {
  buildBirthdayApiFields,
  buildBirthdayFormFromRecord,
  buildBirthdayRecordPreview,
  formatLunarBirthdayLabel,
  formatSolarBirthdayLabel,
  getDefaultLunarBirthdayParts,
  getDefaultSolarBirthdayDate,
  getLunarDayOptions,
  getLunarMonthOptions,
  parseDateParts
} from '@/common/utils/birthdayRules.js';

import {
  REMIND_CHANNEL_IN_APP,
  REMIND_CHANNEL_WECHAT,
  ensureWechatSubscribeTemplates,
  getBirthdayWechatUnavailableHint,
  getWechatSubscribeChannelHint,
  hasMultipleRemindOffsets,
  isBirthdayWechatSubscribeReady,
  resolveRemindChannelsOnSave,
  sanitizeRemindChannelsForType,
  shouldShowBirthdayWechatChannel
} from '@/common/utils/wechatSubscribe.js';

const { themeClass, primaryColor } = useAppTheme();

const props = defineProps({
  modelValue: Boolean,
  initialType: { type: String, default: 'daily' },
  initialDate: { type: String, default: '' },
  editRecord: { type: Object, default: null }
});

const emit = defineEmits(['update:modelValue', 'confirm', 'delete']);

const titleInputFocus = ref(false);
const isSaving = ref(false);

const showBirthdayWechatChannel = computed(() =>
  shouldShowBirthdayWechatChannel(form.type)
);

const wechatChannelUnavailableHint = computed(() => {
  if (form.type !== 'birthday') return '';
  return getBirthdayWechatUnavailableHint();
});

const wechatChannelReady = ref(false);

const refreshWechatTemplateReady = async () => {
  await ensureWechatSubscribeTemplates();
  wechatChannelReady.value = isBirthdayWechatSubscribeReady();
};

const form = reactive({
  id: null,
  type: 'daily',
  title: '',
  date: '',
  birthdayCalendar: 'solar',
  solarDate: '',
  birthdayMonth: 1,
  birthdayDay: 1,
  birthdayLeapMonth: false,
  isLunar: false,
  remindEnabled: true,
  remindTime: '09:00',
  remindOffsets: [0],
  remindChannels: [REMIND_CHANNEL_IN_APP]
});

const lunarMonthOptions = getLunarMonthOptions();
const lunarDayOptions = getLunarDayOptions();

const birthdayCache = reactive({
  solarDate: '',
  solarMonth: 1,
  solarDay: 1,
  lunarMonth: 0,
  lunarDay: 0,
  lunarLeapMonth: false
});

const isEditMode = computed(() => !!form.id);

const drawerTitle = computed(() => {
  if (isEditMode.value) {
    return form.type === 'daily' ? '编辑行程安排' : '编辑家人生日';
  }
  return form.type === 'daily' ? '新建行程安排' : '录入家人生日';
});

const drawerSubtitle = computed(() => {
  if (isEditMode.value) {
    return form.type === 'daily' ? 'EDIT SCHEDULE' : 'EDIT BIRTHDAY';
  }
  return form.type === 'daily' ? 'NEW SCHEDULE' : 'NEW BIRTHDAY';
});

const todayAnchor = ref(getDateStr(new Date()));

const normalizeDateStr = (dateStr) => {
  if (!dateStr) return '';
  const parts = String(dateStr).split('-');
  if (parts.length < 3) return String(dateStr);
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (!year || !month || !day) return String(dateStr);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const todayStr = computed(() => normalizeDateStr(todayAnchor.value));

const isBeforeToday = (dateStr) => {
  const normalized = normalizeDateStr(dateStr);
  if (!normalized) return false;
  return normalized < todayStr.value;
};

const clampDateToToday = (dateStr) => {
  const today = todayStr.value;
  const normalized = normalizeDateStr(dateStr);
  if (!normalized || isBeforeToday(normalized)) return today;
  return normalized;
};

const pickerDate = computed(() => {
  if (form.type === 'birthday') {
    return normalizeDateStr(form.solarDate) || todayStr.value;
  }
  return clampDateToToday(form.date);
});

const solarPickerDate = computed(() => pickerDate.value);

const solarBirthdayLabel = computed(() =>
  formatSolarBirthdayLabel(form.birthdayMonth, form.birthdayDay)
);

const lunarBirthdayLabel = computed(() =>
  formatLunarBirthdayLabel(form.birthdayMonth, form.birthdayDay, form.birthdayLeapMonth)
);

const lunarPickerRange = computed(() => [
  lunarMonthOptions.map((item) => item.label),
  lunarDayOptions.map((item) => item.label)
]);

const lunarPickerIndex = computed(() => [
  Math.max(0, Math.min(lunarMonthOptions.length - 1, (form.birthdayMonth || 1) - 1)),
  Math.max(0, Math.min(lunarDayOptions.length - 1, (form.birthdayDay || 1) - 1))
]);

const birthdayRecordPreview = computed(() => buildBirthdayRecordPreview(form));

const showWechatSubscribeHint = computed(() =>
  form.type === 'birthday'
  && form.remindEnabled
  && form.remindChannels.includes(REMIND_CHANNEL_WECHAT)
);

const wechatSubscribeHint = getWechatSubscribeChannelHint();

const showWechatLimitHint = computed(() =>
  form.remindEnabled
  && form.remindChannels.includes(REMIND_CHANNEL_WECHAT)
  && hasMultipleRemindOffsets(form.remindOffsets)
);

const inAppChannelSelected = computed(() =>
  form.remindChannels.includes(REMIND_CHANNEL_IN_APP)
);

const wechatChannelSelected = computed(() =>
  form.remindChannels.includes(REMIND_CHANNEL_WECHAT)
);

const remindPreviewText = computed(() =>
  buildRemindPreview({
    type: form.type === 'daily' ? 'daily' : 'birthday',
    date: form.birthdayCalendar === 'solar' ? solarPickerDate.value : '',
    remindTime: form.remindTime,
    remindOffsets: form.remindOffsets,
    remindEnabled: form.remindEnabled,
    isLunar: form.birthdayCalendar === 'lunar'
  })
);

const resetRemindDefaults = (type) => {
  form.remindEnabled = true;
  form.remindTime = type === 'daily' ? getTimeStr(new Date()) : '09:00';
  form.remindOffsets = getDefaultRemindOffsets(type === 'birthday' ? 'birthday' : 'daily');
  form.remindChannels = sanitizeRemindChannelsForType(type, [REMIND_CHANNEL_IN_APP]);
};

const syncBirthdayCache = () => {
  if (form.birthdayCalendar === 'lunar') {
    birthdayCache.lunarMonth = form.birthdayMonth;
    birthdayCache.lunarDay = form.birthdayDay;
    birthdayCache.lunarLeapMonth = form.birthdayLeapMonth;
    return;
  }
  birthdayCache.solarDate = form.solarDate;
  birthdayCache.solarMonth = form.birthdayMonth;
  birthdayCache.solarDay = form.birthdayDay;
};

const applyBirthdayForm = (birthdayForm = {}) => {
  form.birthdayCalendar = birthdayForm.birthdayCalendar || 'solar';
  form.solarDate = birthdayForm.solarDate || '';
  form.birthdayMonth = birthdayForm.birthdayMonth || 1;
  form.birthdayDay = birthdayForm.birthdayDay || 1;
  form.birthdayLeapMonth = !!birthdayForm.birthdayLeapMonth;
  form.isLunar = form.birthdayCalendar === 'lunar';
  form.date = form.birthdayCalendar === 'solar' ? form.solarDate : '';

  if (form.birthdayCalendar === 'lunar') {
    birthdayCache.lunarMonth = form.birthdayMonth;
    birthdayCache.lunarDay = form.birthdayDay;
    birthdayCache.lunarLeapMonth = form.birthdayLeapMonth;
  } else {
    birthdayCache.solarDate = form.solarDate;
    birthdayCache.solarMonth = form.birthdayMonth;
    birthdayCache.solarDay = form.birthdayDay;
  }
};

const applyEditRecord = (record) => {
  const next = buildScheduleEditForm(record);
  form.id = next.id;
  form.type = next.type;
  form.title = next.title;
  form.remindEnabled = next.remindEnabled;
  form.remindTime = next.remindTime;
  form.remindOffsets = [...next.remindOffsets];
  form.remindChannels = sanitizeRemindChannelsForType(
    next.type,
    next.remindChannels || [REMIND_CHANNEL_IN_APP]
  );
  applyBirthdayForm(buildBirthdayFormFromRecord(record));
};

const resetCreateForm = () => {
  form.id = null;
  form.type = props.initialType;
  form.title = '';
  resetRemindDefaults(form.type);

  if (form.type === 'birthday') {
    const solarDate = getDefaultSolarBirthdayDate(props.initialDate);
    const { month, day } = parseDateParts(solarDate);
    applyBirthdayForm({
      birthdayCalendar: 'solar',
      solarDate,
      birthdayMonth: month,
      birthdayDay: day,
      birthdayLeapMonth: false,
      isLunar: false
    });
    birthdayCache.lunarMonth = 0;
    birthdayCache.lunarDay = 0;
    birthdayCache.lunarLeapMonth = false;
  } else {
    form.date = clampDateToToday(props.initialDate);
  }
};

watch(() => props.modelValue, (val) => {
  if (!val) return;
  todayAnchor.value = getDateStr(new Date());
  titleInputFocus.value = false;

  if (props.editRecord?.id) {
    applyEditRecord(props.editRecord);
  } else {
    resetCreateForm();
  }

  refreshWechatTemplateReady();
});

watch(() => form.type, (type) => {
  if (type === 'birthday' && props.modelValue) {
    refreshWechatTemplateReady();
  }
});

const onDateChange = (e) => {
  const picked = normalizeDateStr(e.detail.value);
  if (form.type === 'daily' && isBeforeToday(picked)) {
    uni.showToast({ title: '不能选择今天之前的日期', icon: 'none' });
    form.date = todayStr.value;
    return;
  }
  form.date = picked;
};

const onSolarDateChange = (e) => {
  form.solarDate = normalizeDateStr(e.detail.value);
  const { month, day } = parseDateParts(form.solarDate);
  form.birthdayMonth = month;
  form.birthdayDay = day;
  form.date = form.solarDate;
  syncBirthdayCache();
};

const onLunarPickerChange = (e) => {
  const [monthIndex, dayIndex] = e.detail.value || [];
  form.birthdayMonth = lunarMonthOptions[monthIndex]?.value || monthIndex + 1;
  form.birthdayDay = lunarDayOptions[dayIndex]?.value || dayIndex + 1;
  syncBirthdayCache();
};

const setBirthdayCalendar = (calendar) => {
  if (form.birthdayCalendar === calendar) return;
  syncBirthdayCache();

  form.birthdayCalendar = calendar;
  form.isLunar = calendar === 'lunar';

  if (calendar === 'solar') {
    form.solarDate = birthdayCache.solarDate || getDefaultSolarBirthdayDate();
    form.birthdayMonth = birthdayCache.solarMonth || parseDateParts(form.solarDate).month;
    form.birthdayDay = birthdayCache.solarDay || parseDateParts(form.solarDate).day;
    form.birthdayLeapMonth = false;
    form.date = form.solarDate;
    return;
  }

  const defaults = getDefaultLunarBirthdayParts(todayStr.value);
  form.birthdayMonth = birthdayCache.lunarMonth || defaults.birthdayMonth;
  form.birthdayDay = birthdayCache.lunarDay || defaults.birthdayDay;
  form.birthdayLeapMonth = birthdayCache.lunarMonth
    ? birthdayCache.lunarLeapMonth
    : defaults.birthdayLeapMonth;
  form.date = '';
};

const toggleLeapMonth = () => {
  form.birthdayLeapMonth = !form.birthdayLeapMonth;
  syncBirthdayCache();
};

const onRemindEnabledChange = (e) => {
  form.remindEnabled = e.detail.value;
  if (form.remindEnabled && !form.remindOffsets.length) {
    form.remindOffsets = getDefaultRemindOffsets(form.type === 'birthday' ? 'birthday' : 'daily');
  }
  if (form.remindEnabled && !form.remindChannels.length) {
    form.remindChannels = [REMIND_CHANNEL_IN_APP];
  }
};

const toggleRemindChannel = (channel) => {
  if (!form.remindEnabled || isSaving.value) return;
  if (channel === REMIND_CHANNEL_WECHAT && form.type !== 'birthday') return;

  if (form.remindChannels.includes(channel)) {
    if (form.remindChannels.length <= 1) {
      uni.showToast({ title: '请至少保留一种提醒方式', icon: 'none' });
      return;
    }
    form.remindChannels = form.remindChannels.filter((item) => item !== channel);
    return;
  }

  form.remindChannels = [...form.remindChannels, channel];
};

const isOffsetSelected = (value) => form.remindOffsets.includes(value);

const toggleOffset = (value) => {
  if (!form.remindEnabled) return;
  form.remindOffsets = toggleRemindOffset(form.remindOffsets, value);
};

const handleConfirm = async () => {
  if (isSaving.value) return;

  if (!form.title.trim()) {
    uni.showToast({ title: '内容不能为空', icon: 'none' });
    return;
  }

  if (form.type === 'daily') {
    form.date = clampDateToToday(form.date);
    if (!form.date) {
      uni.showToast({ title: '请选择日期', icon: 'none' });
      return;
    }
    if (isBeforeToday(form.date)) {
      uni.showToast({ title: '不能选择今天之前的日期', icon: 'none' });
      form.date = todayStr.value;
      return;
    }
  } else {
    if (form.birthdayCalendar === 'solar') {
      form.solarDate = normalizeDateStr(form.solarDate);
      if (!form.solarDate) {
        uni.showToast({ title: '请选择生日日期', icon: 'none' });
        return;
      }
    } else if (!form.birthdayMonth || !form.birthdayDay) {
      uni.showToast({ title: '请选择农历生日', icon: 'none' });
      return;
    }
  }

  if (form.remindEnabled && !form.remindChannels.length) {
    uni.showToast({ title: '请至少选择一种提醒方式', icon: 'none' });
    return;
  }

  isSaving.value = true;
  try {
    const channelResult = await resolveRemindChannelsOnSave({
      remindEnabled: form.remindEnabled,
      selectedChannels: form.remindChannels,
      type: form.type
    });

    const birthdayFields = form.type === 'birthday'
      ? buildBirthdayApiFields(form)
      : null;

    const payload = {
      type: form.type,
      title: form.title.trim(),
      date: form.type === 'birthday'
        ? (birthdayFields?.birthdayOriginalDate || '')
        : form.date,
      birthdayCalendar: birthdayFields?.birthdayCalendar,
      solarDate: form.solarDate,
      birthdayMonth: birthdayFields?.birthdayMonth,
      birthdayDay: birthdayFields?.birthdayDay,
      birthdayLeapMonth: birthdayFields?.birthdayLeapMonth,
      isLunar: birthdayFields?.isLunar || false,
      remindEnabled: form.remindEnabled,
      remindTime: form.remindTime,
      remindOffsets: [...form.remindOffsets],
      remindChannels: channelResult.remindChannels,
      wechatSubscribe: channelResult.wechatSubscribe,
      wechatRequested: channelResult.wechatRequested,
      wechatAccepted: !!channelResult.wechatSubscribe?.accepted,
      wechatNotReady: !!channelResult.wechatNotReady,
      repeatType: form.type === 'birthday' ? 'yearly' : 'none'
    };

    if (form.type === 'birthday' && birthdayFields) {
      Object.assign(payload, birthdayFields);
    }

    if (form.type === 'daily') {
      payload.time = form.remindTime;
    }

    if (isEditMode.value) {
      payload.id = form.id;
      payload.mode = 'edit';
    }

    emit('confirm', payload);
    emit('update:modelValue', false);
  } finally {
    isSaving.value = false;
  }
};

const handleDelete = () => {
  if (!form.id) return;
  uni.showModal({
    title: '确认删除',
    content: form.type === 'birthday' ? '确定删除这条生日记录吗？' : '确定删除这条日程吗？',
    confirmColor: '#F43F5E',
    success: (res) => {
      if (!res.confirm) return;
      emit('delete', { id: form.id, type: form.type });
      emit('update:modelValue', false);
    }
  });
};
</script>

<style scoped>
.schedule-form-body {
  padding-top: 4px;
}

.modal-input-group {
  margin-bottom: 20px;
}

.modal-label {
  font-size: 11px;
  font-weight: 900;
  color: #CBD5E1;
  margin-bottom: 14px;
  display: block;
  text-transform: uppercase;
  letter-spacing: 1.5px;
}

.field-shell {
  background: #fff;
  border-radius: 16px;
  padding: 14px 16px;
  border: 1px solid var(--primary-soft, #eef2ff);
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
  box-sizing: border-box;
}

.field-shell-focus {
  border-color: var(--primary-color, #4f46e5);
  box-shadow: 0 8px 20px var(--primary-glow, rgba(79, 70, 229, 0.1));
}

.title-input-card {
  margin-bottom: 0;
}

.title-textarea-flat {
  width: 100%;
  min-height: 28px;
  font-size: 20px;
  font-weight: 900;
  color: #1E293B;
  line-height: 1.4;
}

.picker-card-option {
  min-height: 72px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  background: #F8FAFC;
  border-radius: 20px;
  border: 1px solid #F1F5F9;
}

.picker-card-option:active {
  background: var(--primary-soft, #eef2ff);
}

.pc-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pc-emoji {
  font-size: 18px;
}

.pc-label {
  font-size: 15px;
  font-weight: 800;
  color: #475569;
}

.pc-val {
  font-size: 15px;
  font-weight: 900;
  color: var(--primary-color, #4F46E5);
}

.calendar-type-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.calendar-type-chip {
  min-height: 72px;
  padding: 14px 16px;
  border-radius: 20px;
  background: #F8FAFC;
  border: 1.5px solid #E2E8F0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  transition: all 0.22s ease;
}

.calendar-type-chip.active {
  background: var(--primary-soft, #eef2ff);
  border-color: var(--primary-color, #4F46E5);
  box-shadow: 0 8px 20px var(--primary-glow, rgba(79, 70, 229, 0.12));
}

.calendar-type-icon {
  font-size: 18px;
  line-height: 1;
}

.calendar-type-text {
  font-size: 15px;
  font-weight: 900;
  color: #475569;
}

.calendar-type-chip.active .calendar-type-text {
  color: var(--primary-color, #4F46E5);
}

.birthday-picker-card {
  min-height: 78px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px;
  background: #F8FAFC;
  border-radius: 20px;
  border: 1px solid #E2E8F0;
}

.birthday-picker-card:active {
  background: var(--primary-soft, #eef2ff);
}

.birthday-picker-card.lunar-card {
  background: linear-gradient(135deg, #FAF5FF 0%, #F8FAFC 100%);
}

.birthday-picker-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.birthday-picker-emoji {
  font-size: 20px;
  line-height: 1;
}

.birthday-picker-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.birthday-picker-title {
  font-size: 15px;
  font-weight: 800;
  color: #334155;
}

.birthday-picker-sub {
  font-size: 12px;
  color: #94A3B8;
}

.birthday-picker-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.birthday-picker-value {
  font-size: 16px;
  font-weight: 900;
  color: var(--primary-color, #4F46E5);
}

.birthday-picker-arrow {
  font-size: 22px;
  line-height: 1;
  color: #CBD5E1;
  font-weight: 300;
}

.leap-month-chip {
  margin-top: 10px;
  align-self: flex-start;
  padding: 8px 14px;
  border-radius: 999px;
  background: #F1F5F9;
  border: 1px solid #E2E8F0;
}

.leap-month-chip.active {
  background: #FAF5FF;
  border-color: #C4B5FD;
}

.leap-month-chip-text {
  font-size: 13px;
  font-weight: 800;
  color: #64748B;
}

.leap-month-chip.active .leap-month-chip-text {
  color: #7C3AED;
}

.birthday-record-card {
  margin-bottom: 20px;
  padding: 16px 18px;
  border-radius: 20px;
  border: 1px solid #E2E8F0;
  background: #FCFCFD;
}

.birthday-record-solar {
  background: linear-gradient(135deg, #EEF2FF 0%, #FCFCFD 100%);
  border-color: #C7D2FE;
}

.birthday-record-lunar {
  background: linear-gradient(135deg, #FAF5FF 0%, #FCFCFD 100%);
  border-color: #DDD6FE;
}

.birthday-record-label {
  display: block;
  font-size: 11px;
  font-weight: 800;
  color: #94A3B8;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.birthday-record-value {
  display: block;
  margin-top: 8px;
  font-size: 18px;
  font-weight: 900;
  color: #1E293B;
}

.birthday-record-hint {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.55;
  color: #64748B;
}

.remind-section {
  background: #F8FAFC;
  border-radius: 20px;
  border: 1px solid #F1F5F9;
  padding: 18px;
  margin-top: 4px;
}

.remind-section-off {
  opacity: 0.92;
}

.remind-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.remind-head-left {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
}

.remind-icon {
  font-size: 18px;
  line-height: 1.2;
}

.remind-title {
  display: block;
  font-size: 15px;
  font-weight: 800;
  color: #334155;
}

.remind-sub {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #94A3B8;
}

.remind-body.disabled {
  opacity: 0.45;
}

.remind-field {
  margin-bottom: 16px;
}

.remind-field .modal-label {
  margin-bottom: 10px;
}

.offset-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.offset-chip {
  padding: 8px 14px;
  border-radius: 999px;
  background: #EEF2F7;
  border: 1px solid transparent;
}

.offset-chip text {
  font-size: 13px;
  font-weight: 700;
  color: #64748B;
}

.offset-chip.active {
  background: var(--primary-soft, #eef2ff);
  border-color: var(--primary-color, #4F46E5);
}

.offset-chip.active text {
  color: var(--primary-color, #4F46E5);
}

.offset-chip.disabled {
  pointer-events: none;
}

.remind-preview {
  display: block;
  font-size: 12px;
  line-height: 1.5;
  color: #94A3B8;
}

.channel-section {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px dashed #E2E8F0;
}

.channel-label {
  margin-bottom: 12px;
}

.channel-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 18px;
  background: #fff;
  border: 1.5px solid #E2E8F0;
  margin-bottom: 10px;
  transition: all 0.22s ease;
}

.channel-row.active {
  background: var(--primary-soft, #eef2ff);
  border-color: rgba(79, 70, 229, 0.25);
}

.channel-row.wechat-row.active {
  background: linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%);
  border-color: #86EFAC;
}

.channel-row.disabled {
  opacity: 0.72;
}

.channel-hint-warn {
  color: #B45309;
  background: #FFFBEB;
  border-radius: 14px;
  padding: 10px 12px;
}

.channel-check {
  width: 22px;
  height: 22px;
  border-radius: 7px;
  border: 1.5px solid #CBD5E1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
  background: #fff;
}

.channel-check.checked {
  background: var(--primary-color, #4F46E5);
  border-color: var(--primary-color, #4F46E5);
}

.wechat-row .channel-check.checked {
  background: #10B981;
  border-color: #10B981;
}

.channel-check-icon {
  color: #fff;
  font-size: 12px;
  font-weight: 900;
  line-height: 1;
}

.channel-copy {
  flex: 1;
  min-width: 0;
}

.channel-title {
  display: block;
  font-size: 15px;
  font-weight: 800;
  color: #334155;
}

.channel-desc {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: #94A3B8;
}

.channel-hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.55;
  color: #64748B;
}

.channel-hint-accent {
  color: #7C3AED;
  background: #FAF5FF;
  border-radius: 14px;
  padding: 10px 12px;
}

.channel-hint-accent + .channel-hint {
  margin-top: 8px;
}

.confirm-save-btn[disabled] {
  opacity: 0.72;
}

.footer-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.delete-btn {
  width: 100%;
  height: 48px;
  margin: 0;
  padding: 0;
  background: #FFF1F2;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #FECDD3;
  line-height: 1;
}

.delete-btn::after {
  border: none;
}

.delete-btn-txt {
  color: #F43F5E;
  font-size: 15px;
  font-weight: 800;
}

.confirm-save-btn {
  width: 100%;
  height: 52px;
  margin: 0;
  padding: 0;
  background: var(--primary-color, #4F46E5);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  line-height: 1;
  box-shadow: 0 8px 20px var(--primary-glow, rgba(79, 70, 229, 0.22));
  transition: background 0.35s ease, box-shadow 0.35s ease, transform 0.2s ease;
}

.confirm-save-btn::after {
  border: none;
}

.confirm-save-btn:active {
  transform: scale(0.98);
  opacity: 0.92;
}

.confirm-save-btn-compact {
  height: 48px;
}

.btn-txt {
  color: #fff;
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 0.5px;
}
</style>
