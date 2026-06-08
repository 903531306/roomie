import type { AppConfig, Theme } from '@/types'

/** 应用版本号（UI 展示与业务逻辑统一从此读取） */
export const APP_VERSION = '2.0.0'

/** 带 v 前缀的版本文案，如 v2.0.0 */
export function formatAppVersion(withPrefix = true) {
  return withPrefix ? `v${APP_VERSION}` : APP_VERSION
}

// 应用配置
export const appConfig: AppConfig = {
  apiBaseUrl: 'https://naughty-kid-ys.cn/QuestionBank1/', // 生产环境替换为实际API地址
  appId: 'wx1234567890abcdef', // 微信小程序AppID
  version: APP_VERSION
}

// 默认主题配置
export const defaultTheme: Theme = {
  id: 'default',
  name: '默认主题',
  primaryColor: '#007AFF',
  secondaryColor: '#5AC8FA',
  backgroundColor: '#F5F5F5',
  textColor: '#333333',
  cardBackground: '#FFFFFF',
  borderColor: '#E5E5E5',
  images: {
    logo: '/static/logo.png'
  }
}

// 深色主题
export const darkTheme: Theme = {
  id: 'dark',
  name: '深色主题',
  primaryColor: '#0EA5E9',
  secondaryColor: '#38BDF8',
  backgroundColor: '#0F172A',
  textColor: '#F8FAFC',
  cardBackground: '#1E293B',
  borderColor: '#334155',
  images: {
    logo: '/static/logo-dark.png'
  }
}

// 清新绿意主题
export const greenTheme: Theme = {
  id: 'green',
  name: '清新绿意',
  primaryColor: '#10B981',
  secondaryColor: '#34D399',
  backgroundColor: '#F0FDF4',
  textColor: '#064E3B',
  cardBackground: '#FFFFFF',
  borderColor: '#D1FAE5',
  images: {
    logo: '/static/logo-green.png'
  }
}

// 温暖橙色主题
export const orangeTheme: Theme = {
  id: 'orange',
  name: '温暖橙色',
  primaryColor: '#F97316',
  secondaryColor: '#FB923C',
  backgroundColor: '#FFF7ED',
  textColor: '#9A3412',
  cardBackground: '#FFFFFF',
  borderColor: '#FED7AA',
  images: {
    logo: '/static/logo-orange.png'
  }
}

// 浪漫紫色主题
export const purpleTheme: Theme = {
  id: 'purple',
  name: '浪漫紫色',
  primaryColor: '#8B5CF6',
  secondaryColor: '#A78BFA',
  backgroundColor: '#FAF5FF',
  textColor: '#581C87',
  cardBackground: '#FFFFFF',
  borderColor: '#DDD6FE',
  images: {
    logo: '/static/logo-purple.png'
  }
}

// 活力粉色主题
export const pinkTheme: Theme = {
  id: 'pink',
  name: '活力粉色',
  primaryColor: '#EC4899',
  secondaryColor: '#F472B6',
  backgroundColor: '#FDF2F8',
  textColor: '#831843',
  cardBackground: '#FFFFFF',
  borderColor: '#FBCFE8',
  images: {
    logo: '/static/logo-pink.png'
  }
}

// 商务蓝色主题
export const blueTheme: Theme = {
  id: 'blue',
  name: '商务蓝色',
  primaryColor: '#2563EB',
  secondaryColor: '#3B82F6',
  backgroundColor: '#EFF6FF',
  textColor: '#1E3A8A',
  cardBackground: '#FFFFFF',
  borderColor: '#BFDBFE',
  images: {
    logo: '/static/logo-blue.png'
  }
}

// 预设主题列表
export const themes: Theme[] = [
  defaultTheme,
  darkTheme,
  greenTheme,
  orangeTheme,
  purpleTheme,
  pinkTheme,
  blueTheme
]

// API接口路径
export const API_PATHS = {
  // 用户相关
  USER_LOGIN: '/user/wxEmoteLogin',//授权登录
  USER_INFO: '/user/info',
  USER_ACCOUNT_LOGIN:'/user/login',
  USER_UPDATE: '/user/update',
  USER_VERSION:'/version/list',//获取更新版本
  USER_STATS_INFO:'/user/stats/info',//获取用户中心的数量
  USER_ARATAR:'/user/updateEmoteUserName',//修改头像和昵称

  // 同屋相关
  ROOM_CREATE: '/room/createRoom',//房间创建
  ROOM_UPDATE_BUDGET:'/room/updateBudget',//修改预算
  ROOM_INVITATION_PENDING:'/room/invitation/pending',//获取邀请列表
  ROOM_INVITATION_ACCEPT_ALL:'/room/invitation/acceptAll',//接受所有的邀请
  ROOM_INVITATION_REJECT_ALL:'/room/invitation/rejectAll',//忽略所有的邀请
  ROOM_INVITATION_REJECT:'/room/invitation/reject',//拒绝单个邀请
  ROOM_INVITATION_ACCEPT:'/room/invitation/accept',//接受单个邀请
  LEDGER_ADD: '/ledger/add',//流水添加
  LEDGER_DETAIL:'/ledger/detail',//根据id查询详情
  LEDGER_DELETE: '/ledger/delete',//流水删除
  LEDGER_UPDATE: '/ledger/update',//修改流水
  LEDGER_WEEK_LIST:'/ledger/week',//本周分组的数据
  LEDGER_DAY_LIST:'/ledger/today',//今天记账明细数据
  LEDGER_MONTH_LIST:'/ledger/month',//本月记账明细数据
  LEDGER_YEAR_LIST:'/ledger/year',//本年记账明细数据
  LEDGER_GRADP:'/ledger/groupLedgers',//下旬分类下边的明细
  LEDGER_CATEOGER_LIST:'/ledger/category/list',//获取支付分类
  ROOM_LIST:'/room/rooms',//房间列表
  ROOM_JOIN: '/room/join',
  ROOM_ROOMS:'/room/permission/rooms',//room/permission/rooms 获取房间列表
  ROOM_PERMISSION_MEMBER:'/room/permission/detail',//room/permission/detail//获取房间的成员列表
  ROOM_PERMISSION_UPDATE_ROLE:'/room/permission/updateRole',//room/permission/updateRole //修改成员权限
  ROOM_REMOVE_MEMBER:'/roomNumber/removeMember',//移除房间成员
  ROOM_DASHBOARD:'/room/dashboard/overview', //dashboard
  ROOM_INFO: '/roomDetail/detail',//房间详情
  ROOM_UPDATE: '/room/updateName',//修改房间名称
  ROOM_DELETE: '/room/delete',//删除房间
  ROOM_MEMBERS: '/roomDetail/members',//获取成员列表
  ROOM_INVITE: '/room/invite',
  LEDGER_SUMMARY: '/ledger/summary',//记账的卡片金额总汇
  LEDGER_LIST: '/ledger/list',//记账的记录

  // 任务相关
  TASK_LIST: '/task/list',//任务列表
  TASK_CREATE: '/task/add',//任务添加
  TASK_UPDATE: '/task/update',//任务修改
  TASK_DELETE: '/task/delete',//任务删除
  TASK_ASSIGN: '/task/assign',
  TASK_COMPLATE:"/task/complete",//任务完成
  TASK_RESET: '/task/reset',//任务恢复为待办
  TASK_ALL_LIST:'/task/allStatus',//任务全部列表
  TASK_LEDGER_SUMMARY: '/taskLedger/summary',//清单关联记账汇总
  TASK_LEDGER_RECORDS: '/taskLedger/records',//清单关联记账明细
  TASK_COMPLATE_LIST:"/task/completedList",//获取完成列表
  NOTIFICATION_LIST:"/notifications/unread", //获取任务提醒
  NOTIFICATION_READ:"/notifications/markRead",
  // SCHEDULE_ADD:"/schedule/add",//添加日程
  // SCHEDULE_LIST:"/schedule/list",//添加日程
  //INSERT INTO task_notifications 

  // 日程相关
  SCHEDULE_LIST: '/schedule/list',
  SCHEDULE_CREATE: '/schedule/add',
  SCHEDULE_UPDATE: '/schedule/update',
  SCHEDULE_DELETE: '/schedule/delete',

  // 动态相关
  FEED_LIST: '/feed/list',
  FEED_CREATE: '/feed/create',
  FEED_LIKE: '/feed/like',
  
  //类型相关
  ROOM_ALL_ICON:"/roomIcon//all",
  ROOM_ALL_TEMPLATE:"/roomTemplate/all",
  ROOM_ALL_FEATURE:"/roomFeature/all",
  
  //消息类的 notifications unreadCount
  NOTIFICATION_LISTS:'/notifications/list',//获取消息列表
  NOTIFICATION_UNREAD_COUNT:'/notifications/unreadCount',//获取消息数字
  NOTIFICATION_ALER_READ:'/notifications/markAsRead',//已读
  /** 微信订阅消息模板 ID（生日/日程），由后台下发 */
  WECHAT_SUBSCRIBE_TEMPLATES: '/wechat/subscribe/templates',
  
  WHEEL_LIST:'/decisionWheel/list'
}

// 本地存储键名
export const STORAGE_KEYS = {
  TOKEN: 'roomie_token',
  USER_INFO: 'roomie_user_info',
  CURRENT_ROOM: 'roomie_current_room',
  THEME: 'roomie_theme',
  SETTINGS: 'roomie_settings'
}

// 常量定义
export const CONSTANTS = {
  PAGE_SIZE: 20,
  MAX_ROOM_MEMBERS: 20,
  MAX_TASK_TITLE_LENGTH: 50,
  MAX_TASK_DESC_LENGTH: 200,
  REQUEST_TIMEOUT: 30000
}
