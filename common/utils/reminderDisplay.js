import { sanitizeRemindChannelsForType } from './remindChannels.js';
import { coalesce } from './coalesce.js';

export const REMIND_OFFSET_OPTIONS = [
  { label: '当天', value: 0 },
  { label: '提前1天', value: -1 },
  { label: '提前3天', value: -3 },
  { label: '提前7天', value: -7 }
];

const OFFSET_LABEL_MAP = {
  0: '当天',
  '-1': '提前1天',
  '-3': '提前3天',
  '-7': '提前7天'
};

export function getDefaultRemindOffsets(type) {
  return type === 'birthday' ? [0, -1, -7] : [0];
}

export function parseRemindOffsets(val) {
  if (Array.isArray(val)) return [...val];
  if (typeof val === 'string' && val) {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [0];
    } catch (e) {
      return [0];
    }
  }
  return [0];
}

export function toggleRemindOffset(offsets, value) {
  const list = [...parseRemindOffsets(offsets)];
  const idx = list.indexOf(value);
  if (idx >= 0) {
    list.splice(idx, 1);
    return list.length ? list.sort((a, b) => b - a) : [0];
  }
  list.push(value);
  return list.sort((a, b) => b - a);
}

export function formatRemindOffsetLabels(offsets) {
  return parseRemindOffsets(offsets)
    .map((o) => OFFSET_LABEL_MAP[String(o)] || `提前${Math.abs(o)}天`)
    .join('、');
}

export function isRemindEnabled(item) {
  if (!item) return false;
  return item.remindEnabled !== false && item.remindEnabled !== 0 && item.remindEnabled !== '0';
}

export function normalizeRemindFields(item = {}) {
  const scheduleType = item.scheduleType || (item.isBirthday ? 'birthday' : 'schedule');
  const hasConfig = item.remindEnabled != null
    || item.remindOffsets != null
    || item.remindTime != null
    || item.repeatType != null;

  return {
    remindEnabled: hasConfig ? isRemindEnabled(item) : false,
    remindTime: item.remindTime || item.time || '09:00',
    remindOffsets: parseRemindOffsets(item.remindOffsets),
    repeatType: item.repeatType || (scheduleType === 'birthday' ? 'yearly' : 'none'),
    hasRemindConfig: hasConfig
  };
}

function formatHmFromTimestamp(ts) {
  const n = Number(ts);
  if (!n || Number.isNaN(n)) return '';
  const d = new Date(n);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * 列表提醒文案：区分「提醒配置 / 待提醒 / 已通知」
 * 依赖列表接口：hasPendingReminder、nextRemindAt、lastRemindSentAt
 */
export function formatRemindStatus(item) {
  const { remindEnabled, remindOffsets, remindTime } = normalizeRemindFields(item);
  if (!remindEnabled) return '未开启提醒';
  const offsets = parseRemindOffsets(remindOffsets);
  if (!offsets.length) return '未开启提醒';

  const offsetLabel = formatRemindOffsetLabels(offsets);
  const now = Date.now();
  const nextAt = Number(coalesce(item.nextRemindAt, item.next_remind_at, 0));
  const hasPending = item.hasPendingReminder === true
    || item.has_pending_reminder === true
    || (nextAt > now);
  const lastSent = Number(coalesce(item.lastRemindSentAt, item.last_remind_sent_at, 0));

  if (hasPending && nextAt > now) {
    const hm = formatHmFromTimestamp(nextAt) || remindTime || '09:00';
    return `待提醒：${offsetLabel} ${hm}`;
  }
  if (lastSent > 0 && !hasPending) {
    const hm = formatHmFromTimestamp(lastSent) || remindTime || '';
    return hm ? `已通知：${offsetLabel} ${hm}` : `已通知：${offsetLabel}`;
  }
  const hm = remindTime || '09:00';
  return `提醒：${offsetLabel} ${hm}`;
}

const pad2 = (n) => String(n).padStart(2, '0');

const formatYmd = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const formatDisplayDate = (dateStr) => {
  const parts = String(dateStr || '').split('-');
  if (parts.length < 3) return dateStr || '';
  return `${parseInt(parts[1], 10)}月${parseInt(parts[2], 10)}日`;
};

const addDays = (dateStr, days) => {
  const d = new Date(`${dateStr}T12:00:00`);
  if (isNaN(d.getTime())) return dateStr;
  d.setDate(d.getDate() + days);
  return formatYmd(d);
};

export function buildRemindPreview({
  type = 'daily',
  date = '',
  remindTime = '09:00',
  remindOffsets = [0],
  remindEnabled = true,
  isLunar = false
} = {}) {
  if (!remindEnabled) return '关闭提醒后将不会在通知中心收到提醒';

  const offsets = parseRemindOffsets(remindOffsets);
  if (!offsets.length) return '请选择至少一个提前提醒';

  const timeText = remindTime || '09:00';

  if (type === 'birthday') {
    if (isLunar) {
      return `将在：按农历生日计算，${formatRemindOffsetLabels(offsets)} ${timeText} 提醒`;
    }
    const labels = offsets.map((o) =>
      o === 0 ? `每年生日当天 ${timeText}` : `提前${Math.abs(o)}天 ${timeText}`
    );
    return `将在：${labels.join('、')} 提醒`;
  }

  const baseDate = date || formatYmd(new Date());
  const remindDates = [...offsets]
    .sort((a, b) => b - a)
    .map((offset) => `${formatDisplayDate(addDays(baseDate, offset))} ${timeText}`);

  if (remindDates.length <= 2) {
    return `将在：${remindDates.join('、')} 提醒`;
  }
  return `将在：${remindDates.slice(0, 2).join('、')} 等 ${remindDates.length} 次提醒`;
}

export function buildScheduleEditForm(record = {}) {
  const isBirthday = record.isBirthday || record.scheduleType === 'birthday';
  const type = isBirthday ? 'birthday' : 'daily';
  const remind = normalizeRemindFields(record);
  const isLunar = record.birthdayCalendar === 'lunar'
    || record.lunar === 1
    || record.lunar === true
    || record.isLunar === true;

  const date = record.birthdayOriginalDate
    || record.birthday_original_date
    || record.date
    || '';

  let remindChannels = record.remindChannels || record.remind_channels;
  if (typeof remindChannels === 'string' && remindChannels) {
    try {
      remindChannels = JSON.parse(remindChannels);
    } catch (e) {
      remindChannels = remindChannels.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }
  if (!Array.isArray(remindChannels) || !remindChannels.length) {
    remindChannels = ['in_app'];
  }

  const scheduleType = isBirthday ? 'birthday' : 'daily';
  remindChannels = sanitizeRemindChannelsForType(scheduleType, remindChannels);

  return {
    id: record.id,
    type,
    title: record.title || '',
    date,
    isLunar,
    birthdayCalendar: record.birthdayCalendar || record.birthday_calendar || (isLunar ? 'lunar' : 'solar'),
    birthdayOriginalDate: record.birthdayOriginalDate || record.birthday_original_date || date,
    birthdayMonth: coalesce(record.birthdayMonth, record.birthday_month),
    birthdayDay: coalesce(record.birthdayDay, record.birthday_day),
    birthdayLeapMonth: !!coalesce(record.birthdayLeapMonth, record.birthday_leap_month),
    remindEnabled: remind.hasRemindConfig ? remind.remindEnabled : false,
    remindTime: remind.remindTime,
    remindOffsets: remind.hasRemindConfig && remind.remindOffsets.length
      ? remind.remindOffsets
      : getDefaultRemindOffsets(type),
    remindChannels,
    repeatType: remind.repeatType
  };
}

export function isBirthdayReminder(msg = {}) {
  const type = String(msg.type || '').toLowerCase();
  if (type === 'birthday_reminder') return true;
  return String(msg.targetType || msg.target_type || '').toLowerCase() === 'birthday';
}

export function isScheduleReminder(msg = {}) {
  const type = String(msg.type || '').toLowerCase();
  if (type === 'schedule_reminder') return true;
  if (type === 'birthday_reminder') return false;
  const targetType = String(msg.targetType || msg.target_type || '').toLowerCase();
  if (targetType === 'schedule') return true;
  return type === 'schedule';
}

export function isReminderCard(msg = {}) {
  const type = String(msg.type || msg.messageType || msg.notificationType || '').toLowerCase();
  if (type === 'birthday_reminder' || type === 'schedule_reminder') return true;
  if (type === 'schedule' || type === 'reminder') return true;
  if (String(msg.eventType || msg.event_type || '').toLowerCase() === 'reminder') return true;
  return false;
}

/** 提醒 Tab 筛选用，包含生日/日程两类提醒 */
export function isScheduleNotification(msg = {}) {
  return isReminderCard(msg);
}

const extractDatePart = (value) => {
  if (!value) return '';
  const text = String(value);
  if (text.includes(' ')) return text.split(' ')[0];
  if (text.includes('T')) return text.split('T')[0];
  return text.length >= 10 ? text.slice(0, 10) : text;
};

export function isNotificationUnread(msg = {}) {
  const status = String(msg.status || '').toLowerCase();
  if (status === 'unread') return true;
  if (status === 'read') return false;
  return msg.read != 1 && msg.read !== true;
}

export function parseNotificationActions(msg = {}) {
  let actions = msg.actions;
  if (typeof actions === 'string') {
    try {
      actions = JSON.parse(actions);
    } catch (e) {
      actions = [];
    }
  }
  if (Array.isArray(actions) && actions.length) return actions;
  if (isBirthdayReminder(msg)) return ['view', 'snooze'];
  if (isReminderCard(msg)) return ['view', 'mark_read'];
  return [];
}

export function getReminderActionLabel(action, msg = {}) {
  const map = {
    view: isBirthdayReminder(msg) ? '查看生日' : '查看日程',
    mark_read: '标为已读',
    snooze: '稍后提醒'
  };
  return map[action] || action;
}

export function getReminderCardTone(msg = {}) {
  return isBirthdayReminder(msg) ? 'birthday' : 'schedule';
}

export function normalizeNotificationItem(item = {}) {
  const type = String(item.type || item.messageType || item.notificationType || '');
  const content = item.content || item.message || item.body || item.desc || '';
  const subtitle = item.subtitle || item.sub_title || '';
  const title = item.title || (isBirthdayReminder({ ...item, type })
    ? '生日提醒'
    : isReminderCard({ ...item, type })
      ? '日程提醒'
      : '通知');
  const triggerTimeLabel = item.triggerTimeLabel || item.trigger_time_label || '';
  const eventTime = item.eventTime || item.event_time || '';
  const triggerTime = item.triggerTime || item.trigger_time || '';
  const targetType = item.targetType || item.target_type || '';
  const icon = item.icon || (isBirthdayReminder({ ...item, type }) ? '🎂' : isReminderCard({ ...item, type }) ? '🔔' : '');
  const actions = parseNotificationActions({ ...item, type, targetType });
  const unread = isNotificationUnread(item);
  const targetDate = item.targetDate
    || item.target_date
    || item.scheduleDate
    || item.schedule_date
    || item.nextOccurrenceDate
    || item.next_occurrence_date
    || extractDatePart(eventTime)
    || extractDatePart(triggerTime)
    || extractDatePart(item.date);

  return {
    ...item,
    type,
    targetType,
    title,
    content,
    message: content,
    subtitle,
    triggerTimeLabel,
    triggerTime,
    eventTime,
    icon,
    actions,
    eventType: item.eventType || item.event_type || (isReminderCard({ ...item, type }) ? 'reminder' : ''),
    status: item.status || (unread ? 'unread' : 'read'),
    read: unread ? 0 : 1,
    createdAt: item.createdAt || item.createTime || item.created_at || triggerTime || item.time || Date.now(),
    roomId: item.roomId || item.room_id,
    roomName: item.roomName || item.room_name,
    targetId: item.targetId || item.target_id || item.scheduleId || item.schedule_id,
    targetDate
  };
}

/** @deprecated 使用 isScheduleNotification */
export function isReminderNotification(msg = {}) {
  return isScheduleNotification(msg);
}

export function getNotificationMessageText(msg = {}) {
  const normalized = normalizeNotificationItem(msg);
  return normalized.message || normalized.title || '';
}

/** 组装 markAsRead 请求参数，与后端通知表 id / type 对齐 */
export function buildNotificationMarkReadParams(msg = {}) {
  const type = String(msg.type || msg.messageType || msg.notificationType || '').trim();
  const targetType = type
    || (isBirthdayReminder(msg) ? 'birthday_reminder' : '')
    || (isReminderCard(msg) ? 'schedule_reminder' : '')
    || String(msg.targetType || msg.target_type || '').trim();

  const id = coalesce(msg.id, msg.notificationId, msg.notification_id);
  const targetId = coalesce(msg.targetId, msg.target_id, msg.scheduleId, msg.schedule_id);

  return {
    id,
    targetId,
    targetType
  };
}

export function applyLocalNotificationRead(msg = {}) {
  return {
    ...msg,
    handled: true,
    handleResult: '已读',
    read: 1,
    status: 'read'
  };
}
