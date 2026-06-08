import { formatLunarMonthDay, formatLunarDayName, getLunarPartsFromSolarDate } from './lunarDisplay.js';
import { coalesce } from './coalesce.js';

const pad2 = (n) => String(n).padStart(2, '0');

export const LUNAR_MONTH_OPTIONS = [
  '正月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '冬月', '腊月'
];

export const normalizeDateStr = (dateStr) => {
  if (!dateStr) return '';
  const parts = String(dateStr).split('-');
  if (parts.length < 3) return String(dateStr);
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (!year || !month || !day) return String(dateStr);
  return `${year}-${pad2(month)}-${pad2(day)}`;
};

export const parseDateParts = (dateStr) => {
  const normalized = normalizeDateStr(dateStr);
  const parts = normalized.split('-');
  return {
    year: parseInt(parts[0], 10) || 0,
    month: parseInt(parts[1], 10) || 0,
    day: parseInt(parts[2], 10) || 0
  };
};

export const formatYmd = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const parseTimestamp = (ts) => {
  if (!ts) return { date: '', time: '00:00' };
  const d = new Date(Number(ts));
  if (isNaN(d.getTime())) return { date: '', time: '00:00' };
  return {
    date: formatYmd(d),
    time: `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
  };
};

export const isLunarBirthdayRecord = (item = {}) =>
  item.birthdayCalendar === 'lunar'
  || item.lunar === 1
  || item.lunar === true
  || item.isLunar === true;

export function getDefaultSolarBirthdayDate(referenceDate = '') {
  return normalizeDateStr(referenceDate) || formatYmd(new Date());
}

export function getDefaultLunarBirthdayParts(referenceDate = '') {
  const solarDate = normalizeDateStr(referenceDate) || formatYmd(new Date());
  const lunar = getLunarPartsFromSolarDate(solarDate);
  if (lunar) {
    return {
      birthdayMonth: lunar.month,
      birthdayDay: lunar.day,
      birthdayLeapMonth: !!lunar.isLeap
    };
  }
  return {
    birthdayMonth: 1,
    birthdayDay: 1,
    birthdayLeapMonth: false
  };
}

export function getLunarMonthOptions() {
  return LUNAR_MONTH_OPTIONS.map((label, index) => ({
    value: index + 1,
    label
  }));
}

export function getLunarDayOptions() {
  return Array.from({ length: 30 }, (_, index) => {
    const value = index + 1;
    return {
      value,
      label: formatLunarDayName(value)
    };
  });
}

export function formatSolarBirthdayLabel(month, day) {
  const m = parseInt(month, 10);
  const d = parseInt(day, 10);
  if (!m || !d) return '请选择日期';
  return `${m}月${d}日`;
}

export function formatSolarBirthdayRecord(month, day) {
  return `公历 ${formatSolarBirthdayLabel(month, day)}`;
}

export function formatLunarBirthdayLabel(month, day, isLeap = false) {
  const text = formatLunarMonthDay(month, day, isLeap);
  return text || '请选择农历生日';
}

export function formatLunarBirthdayRecord(month, day, isLeap = false) {
  const text = formatLunarBirthdayLabel(month, day, isLeap);
  return text === '请选择农历生日' ? text : `农历 ${text}`;
}

export function buildBirthdayFormFromRecord(record = {}) {
  const calendar = record.birthdayCalendar
    || record.birthday_calendar
    || (isLunarBirthdayRecord(record) ? 'lunar' : 'solar');
  const solarDate = normalizeDateStr(
    record.birthdayOriginalDate || record.birthday_original_date || record.date || ''
  );
  const solarParts = parseDateParts(solarDate);
  let birthdayMonth = coalesce(record.birthdayMonth, record.birthday_month);
  let birthdayDay = coalesce(record.birthdayDay, record.birthday_day);
  const birthdayLeapMonth = !!coalesce(record.birthdayLeapMonth, record.birthday_leap_month);

  if (calendar === 'lunar') {
    const defaults = getDefaultLunarBirthdayParts(solarDate);
    return {
      birthdayCalendar: 'lunar',
      solarDate: '',
      birthdayMonth: parseInt(birthdayMonth, 10) || defaults.birthdayMonth,
      birthdayDay: parseInt(birthdayDay, 10) || defaults.birthdayDay,
      birthdayLeapMonth,
      isLunar: true
    };
  }

  const resolvedSolarDate = solarDate || getDefaultSolarBirthdayDate();
  const parts = parseDateParts(resolvedSolarDate);
  return {
    birthdayCalendar: 'solar',
    solarDate: resolvedSolarDate,
    birthdayMonth: parseInt(birthdayMonth, 10) || parts.month,
    birthdayDay: parseInt(birthdayDay, 10) || parts.day,
    birthdayLeapMonth: false,
    isLunar: false
  };
}

export function buildBirthdayRecordPreview(form = {}) {
  const calendar = form.birthdayCalendar || (form.isLunar ? 'lunar' : 'solar');

  if (calendar === 'lunar') {
    const lunarText = formatLunarMonthDay(
      form.birthdayMonth,
      form.birthdayDay,
      form.birthdayLeapMonth
    );
    return {
      recordText: formatLunarBirthdayRecord(form.birthdayMonth, form.birthdayDay, form.birthdayLeapMonth),
      hintText: lunarText
        ? `每年按农历${lunarText}提醒，系统会自动换算到对应公历日期`
        : '请选择农历月日'
    };
  }

  const parts = parseDateParts(form.solarDate || form.date);
  const month = form.birthdayMonth || parts.month;
  const day = form.birthdayDay || parts.day;
  return {
    recordText: formatSolarBirthdayRecord(month, day),
    hintText: `每年按公历 ${month}月${day}日 提醒`
  };
}

export function buildBirthdayApiFields(form = {}) {
  const calendar = form.birthdayCalendar || (form.isLunar ? 'lunar' : 'solar');

  if (calendar === 'lunar') {
    const birthdayMonth = parseInt(form.birthdayMonth, 10);
    const birthdayDay = parseInt(form.birthdayDay, 10);
    return {
      birthdayCalendar: 'lunar',
      birthdayOriginalDate: '',
      birthdayMonth,
      birthdayDay,
      birthdayLeapMonth: !!form.birthdayLeapMonth,
      lunar: 1,
      isLunar: true
    };
  }

  const birthdayOriginalDate = normalizeDateStr(form.solarDate || form.date);
  const { month, day } = parseDateParts(birthdayOriginalDate);
  return {
    birthdayCalendar: 'solar',
    birthdayOriginalDate,
    birthdayMonth: month,
    birthdayDay: day,
    birthdayLeapMonth: false,
    lunar: 0,
    isLunar: false
  };
}

/** @deprecated 使用 buildBirthdayRecordPreview */
export function buildBirthdayRulePreview(date, isLunar) {
  if (!date && !isLunar) return '';
  return buildBirthdayRecordPreview({
    birthdayCalendar: isLunar ? 'lunar' : 'solar',
    solarDate: date,
    birthdayMonth: parseDateParts(date).month,
    birthdayDay: parseDateParts(date).day,
    isLunar
  }).recordText;
}

function computeSolarNextOccurrence(month, day, today = new Date()) {
  if (!month || !day) return '';
  const base = startOfDay(today);
  const year = base.getFullYear();
  let occurrence = startOfDay(new Date(year, month - 1, day));
  if (occurrence < base) {
    occurrence = startOfDay(new Date(year + 1, month - 1, day));
  }
  return formatYmd(occurrence);
}

function resolveBirthdayParts(item = {}, parsed = { date: '' }) {
  const isLunar = isLunarBirthdayRecord(item);
  const original = normalizeDateStr(
    item.birthdayOriginalDate || item.birthday_original_date || parsed.date
  );
  const fallback = parseDateParts(original);

  let month = coalesce(item.birthdayMonth, item.birthday_month);
  let day = coalesce(item.birthdayDay, item.birthday_day);

  if (month == null || month === '') month = fallback.month;
  if (day == null || day === '') day = fallback.day;

  if (isLunar && (!item.birthdayDay && !item.birthday_day) && original) {
    const lunar = getLunarPartsFromSolarDate(original);
    if (lunar && !item.birthdayMonth && !item.birthday_month) {
      month = lunar.month;
      day = lunar.day;
    }
  }

  return {
    month: parseInt(month, 10) || 0,
    day: parseInt(day, 10) || 0
  };
}

export function normalizeBirthdayMeta(item = {}, today = new Date()) {
  const parsed = parseTimestamp(item.startTime);
  const isLunar = isLunarBirthdayRecord(item);
  const { month: birthdayMonth, day: birthdayDay } = resolveBirthdayParts(item, parsed);
  const birthdayOriginalDate = normalizeDateStr(
    item.birthdayOriginalDate || item.birthday_original_date || parsed.date
  );
  const birthdayLeapMonth = !!coalesce(item.birthdayLeapMonth, item.birthday_leap_month);
  const birthdayCalendar = item.birthdayCalendar || item.birthday_calendar || (isLunar ? 'lunar' : 'solar');

  let nextDate = normalizeDateStr(item.nextOccurrenceDate || item.next_occurrence_date);
  if (!nextDate) {
    nextDate = isLunar
      ? normalizeDateStr(parsed.date)
      : computeSolarNextOccurrence(birthdayMonth, birthdayDay, today);
  }

  const nextOccurrence = startOfDay(new Date(nextDate));
  const todayStart = startOfDay(today);
  const daysLeft = Math.round((nextOccurrence - todayStart) / 86400000);

  const lunarText = isLunar
    ? formatLunarMonthDay(birthdayMonth, birthdayDay, birthdayLeapMonth)
    : '';

  return {
    birthdayCalendar,
    birthdayOriginalDate,
    birthdayMonth,
    birthdayDay,
    birthdayLeapMonth,
    isLunar,
    date: birthdayOriginalDate,
    nextDate,
    daysLeft,
    lunarText,
    time: parsed.time
  };
}

export function getBirthdayUpcomingMeta(birthday, selectedDateStr) {
  const selected = startOfDay(new Date(selectedDateStr));
  const nextDate = normalizeDateStr(birthday.nextDate);
  if (!nextDate || isNaN(selected.getTime())) return null;

  const occurrence = startOfDay(new Date(nextDate));
  if (occurrence.getTime() === selected.getTime()) return null;

  if (occurrence > selected) {
    return {
      occurrence,
      daysFromSelected: Math.round((occurrence - selected) / 86400000),
      isNextYear: occurrence.getFullYear() > selected.getFullYear()
    };
  }

  const nextYearOcc = startOfDay(new Date(
    selected.getFullYear() + 1,
    occurrence.getMonth(),
    occurrence.getDate()
  ));
  return {
    occurrence: nextYearOcc,
    daysFromSelected: Math.round((nextYearOcc - selected) / 86400000),
    isNextYear: true
  };
}

export function isBirthdayOnDate(birthday, dateStr) {
  return normalizeDateStr(birthday.nextDate) === normalizeDateStr(dateStr);
}
