export const REMIND_CHANNEL_IN_APP = 'in_app';
export const REMIND_CHANNEL_WECHAT = 'wechat';

export function parseRemindChannels(value) {
  let channels = value;
  if (typeof channels === 'string' && channels) {
    try {
      channels = JSON.parse(channels);
    } catch (e) {
      channels = channels.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }
  if (!Array.isArray(channels) || !channels.length) {
    return [REMIND_CHANNEL_IN_APP];
  }
  return [...new Set(channels)];
}

export function normalizeRemindChannels(channels = []) {
  const list = parseRemindChannels(channels);
  if (!list.includes(REMIND_CHANNEL_IN_APP)) {
    return [REMIND_CHANNEL_IN_APP, ...list.filter((item) => item !== REMIND_CHANNEL_IN_APP)];
  }
  return list;
}

export function sanitizeRemindChannelsForType(type = 'daily', channels = [], options = {}) {
  const { allowWechat = type === 'birthday' } = options;
  let list = normalizeRemindChannels(channels);
  if (type !== 'birthday' || !allowWechat) {
    list = list.filter((item) => item !== REMIND_CHANNEL_WECHAT);
  }
  if (!list.length) {
    list = [REMIND_CHANNEL_IN_APP];
  }
  return list;
}

export function hasWechatRemindChannel(channels = []) {
  return parseRemindChannels(channels).includes(REMIND_CHANNEL_WECHAT);
}

export function hasMultipleRemindOffsets(remindOffsets = []) {
  const list = Array.isArray(remindOffsets) ? remindOffsets : [];
  return list.length > 1;
}
