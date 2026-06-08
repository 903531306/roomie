import { formatSolarDateLunar } from './lunarDisplay.js';
import { normalizeBirthdayMeta, startOfDay } from './birthdayRules.js';

const PREVIEW_LIMIT = 2;
export const SCHEDULE_REFRESH_KEY = 'schedule_board_dirty_room';

export function markScheduleHomeDirty(roomId) {
  if (roomId == null || roomId === '') return;
  uni.setStorageSync(SCHEDULE_REFRESH_KEY, String(roomId));
  uni.$emit('schedule_board_refresh');
}

const parseTimestamp = (ts) => {
  if (!ts) return { date: '', time: '00:00' };
  const d = new Date(Number(ts));
  if (isNaN(d.getTime())) return { date: '', time: '00:00' };
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

const formatShortDate = (dateStr) => {
  const parts = (dateStr || '').split('-');
  if (parts.length < 3) return '';
  return `${parts[1]}-${parts[2]}`;
};

const enrichBirthday = (item, today) => {
  const meta = normalizeBirthdayMeta(item, today);
  if (!meta.birthdayMonth || !meta.birthdayDay) return null;

  return {
    id: item.id,
    title: item.title || '生日',
    isBirthday: true,
    isLunar: meta.isLunar,
    sourceDate: meta.birthdayOriginalDate,
    eventDate: meta.nextDate,
    daysLeft: meta.daysLeft,
    lunarText: meta.lunarText,
    time: '00:00'
  };
};

const enrichSchedule = (item, today) => {
  const parsed = parseTimestamp(item.startTime);
  if (!parsed.date) return null;

  const eventDay = startOfDay(new Date(parsed.date));
  if (isNaN(eventDay.getTime())) return null;
  if (eventDay < today) return null;

  const daysLeft = Math.round((eventDay - today) / 86400000);
  return {
    id: item.id,
    title: item.title || '日程',
    isBirthday: false,
    isLunar: false,
    sourceDate: parsed.date,
    eventDate: parsed.date,
    daysLeft,
    time: parsed.time
  };
};

const buildSubline = (item) => {
  const mmdd = formatShortDate(item.eventDate);
  if (item.isBirthday) {
    if (item.daysLeft === 0) {
      return `${mmdd} · ${item.isLunar ? '农历' : '公历'} · 准备中`;
    }
    if (item.isLunar) {
      return `${item.lunarText} · 公历 ${mmdd}`;
    }
    const lunarText = formatSolarDateLunar(item.eventDate);
    return lunarText ? `${lunarText} · ${mmdd}` : `${mmdd} · 公历`;
  }

  if (item.daysLeft === 0) {
    return item.time && item.time !== '00:00'
      ? `${mmdd} · ${item.time} · 准备中`
      : `${mmdd} · 日程 · 准备中`;
  }
  return `${mmdd} · 日程 · 准备中`;
};

const normalizeScheduleList = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export function buildHomeSchedulePreview(schedulesRaw) {
  const today = startOfDay(new Date());
  const list = normalizeScheduleList(schedulesRaw);

  const upcoming = list
    .map(item => {
      const type = item.scheduleType || item.type || '';
      if (type === 'birthday' || item.lunar === 1 || item.lunar === true) {
        return enrichBirthday(item, today);
      }
      return enrichSchedule(item, today);
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.daysLeft !== b.daysLeft) return a.daysLeft - b.daysLeft;
      return String(a.title).localeCompare(String(b.title));
    })
    .map(item => ({
      ...item,
      emoji: item.isBirthday ? '🎂' : '📅',
      countdownLabel: item.daysLeft === 0 ? '今天' : `${item.daysLeft}天`,
      subline: buildSubline(item)
    }));

  return {
    schedulePreview: {
      totalCount: upcoming.length,
      previewEvents: upcoming.slice(0, PREVIEW_LIMIT),
      hasMore: upcoming.length > PREVIEW_LIMIT,
      moreCount: Math.max(upcoming.length - PREVIEW_LIMIT, 0)
    }
  };
}
