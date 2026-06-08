import { notificationsApi } from '../api/index.ts';
import {
  REMIND_CHANNEL_IN_APP,
  REMIND_CHANNEL_WECHAT,
  hasMultipleRemindOffsets,
  hasWechatRemindChannel,
  normalizeRemindChannels,
  parseRemindChannels,
  sanitizeRemindChannelsForType as sanitizeRemindChannelsBase
} from './remindChannels.js';
import { coalesce } from './coalesce.js';

export {
  REMIND_CHANNEL_IN_APP,
  REMIND_CHANNEL_WECHAT,
  hasMultipleRemindOffsets,
  hasWechatRemindChannel,
  normalizeRemindChannels,
  parseRemindChannels
};

const templateState = {
  loaded: false,
  loading: null,
  birthdayTemplateId: '',
  scheduleTemplateId: ''
};

function applyTemplatePayload(data = {}) {
  templateState.birthdayTemplateId = String(
    coalesce(data.birthdayTemplateId, data.birthday_template_id, data.birthdayTemplate, '')
  ).trim();
  templateState.scheduleTemplateId = String(
    coalesce(data.scheduleTemplateId, data.schedule_template_id, data.scheduleTemplate, '')
  ).trim();
}

export function getWechatTemplateState() {
  return {
    loaded: templateState.loaded,
    birthdayTemplateId: templateState.birthdayTemplateId,
    scheduleTemplateId: templateState.scheduleTemplateId
  };
}

export function isWechatSubscribeTemplatesLoaded() {
  return templateState.loaded;
}

/** 从后台拉取微信订阅模板 ID，结果会缓存在内存中 */
export async function ensureWechatSubscribeTemplates(force = false) {
  if (templateState.loaded && !force) {
    return getWechatTemplateState();
  }

  if (templateState.loading && !force) {
    return templateState.loading;
  }

  templateState.loading = (async () => {
    try {
      const res = await notificationsApi.getWechatSubscribeTemplates();
      if (res && res.code === 0 && res.data) {
        applyTemplatePayload(res.data);
      }
    } catch (e) {
      // 模板配置获取失败时保持空值，由保存流程降级为站内提醒
    } finally {
      templateState.loaded = true;
      templateState.loading = null;
    }

    return getWechatTemplateState();
  })();

  return templateState.loading;
}

export function getBirthdayWechatTemplateId() {
  return templateState.birthdayTemplateId || '';
}

export function getScheduleWechatTemplateId() {
  return templateState.scheduleTemplateId || '';
}

/** @deprecated 使用 getBirthdayWechatTemplateId */
export function getWechatReminderTemplateId() {
  return getBirthdayWechatTemplateId();
}

function canRequestSubscribeMessage() {
  // #ifdef MP-WEIXIN
  if (typeof wx !== 'undefined' && typeof wx.requestSubscribeMessage === 'function') {
    return true;
  }
  if (typeof uni !== 'undefined' && typeof uni.requestSubscribeMessage === 'function') {
    return true;
  }
  // #endif
  return false;
}

/** 第二期：生日表单里是否展示「微信生日提醒」选项 */
export function shouldShowBirthdayWechatChannel(type = 'daily') {
  return type === 'birthday';
}

/** 是否可真正发起微信订阅授权（模板 ID + 小程序环境） */
export function isBirthdayWechatSubscribeReady() {
  return isBirthdayWechatSubscribeSupported();
}

/** @deprecated 使用 shouldShowBirthdayWechatChannel + isBirthdayWechatSubscribeReady */
export function isBirthdayWechatSubscribeSupported() {
  return !!getBirthdayWechatTemplateId() && canRequestSubscribeMessage();
}

export function getBirthdayWechatUnavailableHint() {
  if (!canRequestSubscribeMessage()) {
    return '微信订阅授权需在微信小程序中使用';
  }
  if (!isWechatSubscribeTemplatesLoaded()) {
    return '正在获取微信模板配置';
  }
  if (!getBirthdayWechatTemplateId()) {
    return '微信生日模板尚未就绪，暂时无法发起授权';
  }
  return '';
}

/** 日程微信提醒暂未接入 */
export function isScheduleWechatSubscribeSupported() {
  return !!getScheduleWechatTemplateId() && canRequestSubscribeMessage();
}

/** @deprecated 使用 isBirthdayWechatSubscribeSupported */
export function isWechatSubscribeSupported() {
  return isBirthdayWechatSubscribeSupported();
}

export function supportsWechatRemindForType(type = 'daily') {
  if (type === 'birthday') return isBirthdayWechatSubscribeSupported();
  if (type === 'daily') return isScheduleWechatSubscribeSupported();
  return false;
}

export function sanitizeRemindChannelsForType(type = 'daily', channels = []) {
  return sanitizeRemindChannelsBase(type, channels, {
    allowWechat: type === 'birthday'
  });
}

export function requestBirthdayWechatSubscribe() {
  const templateId = getBirthdayWechatTemplateId();

  return new Promise((resolve) => {
    if (!templateId || !isBirthdayWechatSubscribeSupported()) {
      resolve({
        accepted: false,
        templateId,
        templateType: 'birthday',
        error: 'unsupported'
      });
      return;
    }

    const handleResult = (accepted, extra = {}) => {
      resolve({
        accepted: !!accepted,
        templateId,
        templateType: 'birthday',
        ...extra
      });
    };

    // #ifdef MP-WEIXIN
    const requestSubscribe = (typeof uni !== 'undefined' && uni.requestSubscribeMessage)
      ? uni.requestSubscribeMessage.bind(uni)
      : wx.requestSubscribeMessage.bind(wx);

    requestSubscribe({
      tmplIds: [templateId],
      success(res) {
        handleResult(res && res[templateId] === 'accept', { raw: res });
      },
      fail(err) {
        handleResult(false, { error: err });
      }
    });
    return;
    // #endif

    handleResult(false, { error: 'unsupported' });
  });
}

/** @deprecated 使用 requestBirthdayWechatSubscribe */
export function requestWechatReminderSubscribe() {
  return requestBirthdayWechatSubscribe();
}

export async function resolveRemindChannelsOnSave({
  remindEnabled = false,
  selectedChannels = [],
  type = 'daily'
} = {}) {
  if (!remindEnabled) {
    return {
      remindChannels: [],
      wechatSubscribe: null,
      wechatRequested: false
    };
  }

  let remindChannels = sanitizeRemindChannelsForType(type, selectedChannels);
  const wechatRequested = type === 'birthday'
    && remindChannels.includes(REMIND_CHANNEL_WECHAT);

  if (!wechatRequested) {
    return {
      remindChannels,
      wechatSubscribe: null,
      wechatRequested: false
    };
  }

  await ensureWechatSubscribeTemplates();

  if (!isBirthdayWechatSubscribeReady()) {
    remindChannels = remindChannels.filter((item) => item !== REMIND_CHANNEL_WECHAT);
    if (!remindChannels.length) {
      remindChannels = [REMIND_CHANNEL_IN_APP];
    }
    return {
      remindChannels,
      wechatSubscribe: {
        accepted: false,
        templateId: getBirthdayWechatTemplateId(),
        templateType: 'birthday',
        error: 'not_ready'
      },
      wechatRequested: true,
      wechatNotReady: true
    };
  }

  const wechatSubscribe = await confirmBirthdayWechatSubscribe();
  if (!wechatSubscribe.accepted) {
    remindChannels = remindChannels.filter((item) => item !== REMIND_CHANNEL_WECHAT);
  }

  if (!remindChannels.length) {
    remindChannels = [REMIND_CHANNEL_IN_APP];
  }

  return {
    remindChannels,
    wechatSubscribe,
    wechatRequested: true
  };
}

export function getScheduleSaveToast({
  isEdit = false,
  remindEnabled = false,
  wechatRequested = false,
  wechatAccepted = false,
  wechatNotReady = false,
  type = 'daily'
} = {}) {
  const created = isEdit ? '已更新' : '已创建';

  if (!remindEnabled || !wechatRequested || type !== 'birthday') {
    return isEdit ? '已更新' : '已记录';
  }

  if (wechatNotReady) {
    return `${created}，微信模板未就绪，已仅保留站内提醒`;
  }

  if (wechatAccepted) {
    return `${created}，已授权 1 次微信生日提醒`;
  }

  return `${created}，微信生日提醒未开启`;
}

/** 勾选微信提醒时的说明文案 */
export function getWechatSubscribeChannelHint() {
  return '微信订阅为「一次授权、一次提醒」，本次授权仅用于下一次生日微信通知；之后可在生日列表再次授权。';
}

/** 保存前弹窗说明（再调起微信授权面板） */
export function getWechatSubscribeAuthModalCopy() {
  return {
    title: '微信生日提醒授权',
    content: '微信订阅消息为「一次授权、一次提醒」。\n\n本次授权仅用于发送 1 次生日微信通知。若之后还需要微信提醒，可在生日列表点击「补授权微信提醒」再次授权。\n\n站内提醒不受此限制，仍会按设置多次提醒。'
  };
}

export async function confirmBirthdayWechatSubscribe() {
  await ensureWechatSubscribeTemplates();

  const templateId = getBirthdayWechatTemplateId();

  return new Promise((resolve) => {
    if (!templateId || !isBirthdayWechatSubscribeSupported()) {
      resolve({
        accepted: false,
        templateId,
        templateType: 'birthday',
        error: 'unsupported'
      });
      return;
    }

    const { title, content } = getWechatSubscribeAuthModalCopy();
    uni.showModal({
      title,
      content,
      confirmText: '去授权',
      cancelText: '暂不',
      success: async (modalRes) => {
        if (!modalRes.confirm) {
          resolve({
            accepted: false,
            cancelled: true,
            templateId,
            templateType: 'birthday'
          });
          return;
        }
        const subscribeResult = await requestBirthdayWechatSubscribe();
        resolve(subscribeResult);
      },
      fail: () => {
        resolve({
          accepted: false,
          cancelled: true,
          templateId,
          templateType: 'birthday'
        });
      }
    });
  });
}

/**
 * 是否展示「补授权微信提醒」（以列表接口为准）
 * 优先 wechatReauthorizeRequired；兼容 wechatSubscribeStatus === need_reauthorize
 */
export function shouldShowWechatReauthorize(item = {}) {
  if (!item || item.remindEnabled === false || item.remindEnabled === 0) {
    return false;
  }
  const channels = parseRemindChannels(item.remindChannels || item.remind_channels);
  if (!hasWechatRemindChannel(channels)) {
    return false;
  }
  if (item.wechatReauthorizeRequired === true || item.wechat_reauthorize_required === true) {
    return true;
  }
  const status = String(item.wechatSubscribeStatus || item.wechat_subscribe_status || '').trim();
  return status === 'need_reauthorize';
}

/** 列表项微信订阅状态文案（可选，用于调试或副标题） */
export function formatWechatSubscribeStatusHint(item = {}) {
  const status = String(item.wechatSubscribeStatus || item.wechat_subscribe_status || '').trim();
  const map = {
    ready: '微信提醒已授权，待发送',
    need_reauthorize: '微信提醒已使用，可补授权',
    not_authorized: '微信提醒未授权',
    template_not_ready: '微信模板未就绪',
    none: ''
  };
  return map[status] || '';
}

export function getWechatReauthorizeToast(accepted = false) {
  if (accepted) return '已补授权 1 次微信生日提醒';
  return '授权未完成，微信生日提醒未开启';
}
