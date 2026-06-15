import http from '@/common/utils/request'
import { API_PATHS } from '@/common/config'
import type { User, Room, Task, Schedule, ApiResponse } from '@/types'

// 用户相关API
export const userApi = {
  // 微信登录
  login: (data:Object): Promise<ApiResponse<{ token: string; user: User }>> => {
    return http.post(API_PATHS.USER_LOGIN, data)
  },
  //获取用户中心的数量
  getUserStatsInfo: (): Promise<ApiResponse<User>> => {

    return http.get(API_PATHS.USER_STATS_INFO)
  },
  // 获取用户信息
  getUserInfo: (): Promise<ApiResponse<User>> => {

    return http.get(API_PATHS.USER_INFO)
  },
  // 获取版本信息
  getVersionInfo: (): Promise<ApiResponse<User>> => {
  
    return http.get(API_PATHS.USER_VERSION)
  },
  // 账号密码登录
  accountLogin: (data:Object): Promise<ApiResponse<User>> => {
  
    return http.post(API_PATHS.USER_ACCOUNT_LOGIN,data)
  },

  // 更新用户信息
  updateUserInfo: (data: Partial<User>): Promise<ApiResponse<User>> => {
    return http.put(API_PATHS.USER_UPDATE, data)
  },
  
  // 更新用户信息
  updateUserAratar: (data: Partial<User>): Promise<ApiResponse<User>> => {
    return http.post(API_PATHS.USER_ARATAR, data)
  }
}

// 同屋相关API
export const roomApi = {
  // 创建同屋
  createRoom: (data:Object,currentUserId:number): Promise<ApiResponse<Room>> => {
    return http.post(`${API_PATHS.ROOM_CREATE}?currentUserId=${currentUserId}`, data)
  },
  //创建记账
  ledgerAdd: (data:Object): Promise<ApiResponse<Room>> => {
    return http.post(API_PATHS.LEDGER_ADD, data)
  },
  //获取记账总汇
  ledgerSummary: (data:Object): Promise<ApiResponse<Room>> => {
    return http.get(API_PATHS.LEDGER_SUMMARY, data)
  },
  //获取记账总汇
  ledgerDetail: (data:Object): Promise<ApiResponse<Room>> => {
    return http.get(API_PATHS.LEDGER_DETAIL, data)
  },
  //获取记账的列表
  ledgerList: (data:Object): Promise<ApiResponse<Room>> => {
    return http.get(API_PATHS.LEDGER_LIST, data)
  },//修改记账
  ledgerUpdate: (data:Object): Promise<ApiResponse<Room>> => {
    return http.post(API_PATHS.LEDGER_UPDATE, data)
  },
  //接受单个邀请
  accecptSigin: (id:String,data:Object): Promise<ApiResponse<Room>> => {
    return http.post(API_PATHS.ROOM_INVITATION_ACCEPT+'?invitationId='+id, data)
  },
  //拒绝单个邀请
  rejectSigin: (id:String,data:Object): Promise<ApiResponse<Room>> => {
    return http.post(API_PATHS.ROOM_INVITATION_REJECT+'?invitationId='+id, data)
  },
  //拒绝所有的邀请
  rejectAll: (data:Object): Promise<ApiResponse<Room>> => {
    return http.post(API_PATHS.ROOM_INVITATION_REJECT_ALL, data)
  },
  //接受所有的邀请
  accecptAll: (data:Object): Promise<ApiResponse<Room>> => {
    return http.post(API_PATHS.ROOM_INVITATION_ACCEPT_ALL, data)
  },
  //获取记账的列表
  inviteList: (data:Object): Promise<ApiResponse<Room>> => {
    return http.get(API_PATHS.ROOM_INVITATION_PENDING, data)
  },
  //修改预算
  updateBudget: (data:Object): Promise<ApiResponse<Room>> => {
    return http.post(API_PATHS.ROOM_UPDATE_BUDGET, data)
  },
  // 加入同屋
  joinRoom: (inviteCode: string): Promise<ApiResponse<Room>> => {
    return http.post(API_PATHS.ROOM_JOIN, { inviteCode })
  },
  
  // 获取同屋信息
  getRoomList: (): Promise<ApiResponse<Room>> => {
    return http.get(API_PATHS.ROOM_LIST)
  },

 // 获取记账的分析图
  getDashBoardList: (data:Object): Promise<ApiResponse<Room>> => {
    return http.get(API_PATHS.ROOM_DASHBOARD,data)
  },
  // 获取同屋信息
  getRoomInfo: (data: Object): Promise<ApiResponse<Room>> => {
    return http.get(API_PATHS.ROOM_INFO,data)
  },
  updateRoomMemberRple: (data: Object): Promise<ApiResponse<Room>> => {
    return http.post(API_PATHS.ROOM_PERMISSION_UPDATE_ROLE,data)
  },
  removeRoomMemberRple: (data: Object): Promise<ApiResponse<Room>> => {
    return http.post(API_PATHS.ROOM_REMOVE_MEMBER,data)
  },
 // 获取这个用户下边的房间列表
  getRoomLists: (data: Object): Promise<ApiResponse<Room>> => {
    return http.get(API_PATHS.ROOM_ROOMS,data)
  },
  // 获取这个用户下边的房间列表下边的成员列表
   getRoomMemberLists: (data: Object): Promise<ApiResponse<Room>> => {
     return http.get(API_PATHS.ROOM_PERMISSION_MEMBER,data)
   },
  // 更新同屋信息
  updateRoom: (roomId:String,name:String,data: Object): Promise<ApiResponse<Room>> => {
    return http.post(`${API_PATHS.ROOM_UPDATE}?roomId=`+roomId+"&name="+name)
  },
  
  // 更新同屋信息
  deleteRoom: (roomId:String): Promise<ApiResponse<Room>> => {
	  console.log(roomId);
    return http.post(`${API_PATHS.ROOM_DELETE}?roomId=`+roomId)
  },

  // 获取同屋成员
  getRoomMembers: (data: Object): Promise<ApiResponse<User[]>> => {
    return http.get(API_PATHS.ROOM_MEMBERS,data)
  },

  // 生成邀请码
  generateInviteCode: (roomId: string): Promise<ApiResponse<{ inviteCode: string }>> => {
    return http.post(`${API_PATHS.ROOM_INVITE}/${roomId}`)
  }
}

// 账单导入 API
export const ledgerImportApi = {
  /** 上传账单文件并预览（不入库） */
  preview: (
    filePath: string,
    roomId: string | number,
    accountId: string | number
  ): Promise<ApiResponse<Record<string, unknown>>> => {
    return http.upload(
      API_PATHS.LEDGER_IMPORT_PREVIEW,
      filePath,
      { roomId: String(roomId), accountId: String(accountId) },
      { showLoading: true, showError: false }
    )
  },

  /** 确认导入勾选的行 */
  confirm: (data: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> => {
    return http.post(API_PATHS.LEDGER_IMPORT_CONFIRM, data, { showLoading: true, showError: false })
  },

  /** 分类树（按 income/expense） */
  getCategoryTree: (type: 'income' | 'expense'): Promise<ApiResponse<unknown[]>> => {
    return http.get(API_PATHS.LEDGER_CATEGORY_TREE, { type }, { showError: false })
  },

  /** 支付方式列表 */
  getPayMethods: (): Promise<ApiResponse<unknown[]>> => {
    return http.get(API_PATHS.LEDGER_CATEOGER_LIST, { type: 'transfer' })
  }
}

//类型相关
export const typeApi={
	// 获取所有系统功能
	getAllFeatures: (): Promise<ApiResponse<Room>> => {
	  return http.get(API_PATHS.ROOM_ALL_FEATURE)
	},
	// 获取房间类型
	getAllTemplates: (): Promise<ApiResponse<Room>> => {
	  return http.get(API_PATHS.ROOM_ALL_TEMPLATE)
	},// 获取房间类型
	getAllIcons: (): Promise<ApiResponse<Room>> => {
	  return http.get(API_PATHS.ROOM_ALL_ICON)
	},
	getWheelList:(id:String) :Promise<ApiResponse<Room>> => {
	  return http.get(API_PATHS.WHEEL_LIST+"?priorityId="+id)
	},
}

// 任务相关API
export const taskApi = {
  // 获取任务列表
  getTaskList: (params?: {
    roomId?: string
    status?: string
    assigneeId?: string
    page?: number
    pageSize?: number
  }): Promise<ApiResponse<{ list: Task[]; total: number }>> => {
    return http.get(API_PATHS.TASK_LIST, params)
  },

  // 创建任务
  createTask: (data: Object): Promise<ApiResponse<Task>> => {
    return http.post(API_PATHS.TASK_CREATE, data)
  },
  // 创建日程
  createSchedule: (data: Object): Promise<ApiResponse<Task>> => {
    return http.post(API_PATHS.SCHEDULE_CREATE, data)
  },
  // 日程列表
  scheduleList: (data: Object): Promise<ApiResponse<Task>> => {
    return http.get(API_PATHS.SCHEDULE_LIST, data)
  },
  // 更新日程
  updateSchedule: (data: Object): Promise<ApiResponse<Task>> => {
    const id = (data as { id?: string | number }).id
    return http.put(`${API_PATHS.SCHEDULE_UPDATE}/${id}`, data)
  },
  // 删除日程
  deleteSchedule: (id: String, roomId: String): Promise<ApiResponse<null>> => {
    return http.delete(`${API_PATHS.SCHEDULE_DELETE}/${id}?roomId=${roomId}`)
  },
  //获取支付分类
  getcategoryList: (data: Object): Promise<ApiResponse<Task>> => {
    return http.get(API_PATHS.LEDGER_CATEOGER_LIST, data)
  },
  //获取记账周的分组数据
  getLedgerWeekList: (data: Object,requestType:String): Promise<ApiResponse<Task>> => {
	  console.log("打印request",requestType);
   var url="";
     if(requestType==='week'){//本周分组
   	  url=API_PATHS.LEDGER_WEEK_LIST;
     }else if(requestType==='today'){//今日
   	  url=API_PATHS.LEDGER_DAY_LIST;
     }else if(requestType==='month'){//本月
   	  url=API_PATHS.LEDGER_MONTH_LIST;
     }else if(requestType==='year'){//本年
   	  url=API_PATHS.LEDGER_YEAR_LIST;
     }
   return http.get(url, data)
  },
 // 按需获取分类下边的列表明细
  getGroupLedgers: ( data: Partial<Task>): Promise<ApiResponse<Task>> => {
    return http.get(API_PATHS.LEDGER_GRADP, data)
  },
  // 更新任务
  updateTask: ( data: Partial<Task>): Promise<ApiResponse<Task>> => {
    return http.post(API_PATHS.TASK_UPDATE, data)
  },
  //删除流水
  deleteLedger: (id:String,roomId:String): Promise<ApiResponse<Task>> => {
    return http.post(`${API_PATHS.LEDGER_DELETE}?id=`+id+"&roomId="+roomId)
  },
  
  // 任务完成
  complateTask: (id: number): Promise<ApiResponse<Task>> => {
    return http.post(`${API_PATHS.TASK_COMPLATE}?id=${id}`)
  },
  // 已完成任务恢复为待办
  resetTask: (id: number): Promise<ApiResponse<Task>> => {
    return http.post(`${API_PATHS.TASK_RESET}?id=${id}`)
  },
  // 任务完成列表
  complateTaskLIst: ( data: Partial<Task>): Promise<ApiResponse<Task>> => {
    return http.get(API_PATHS.TASK_COMPLATE_LIST, data)
  },
  // 任务提醒列表
  notificationList: ( data: Partial<Task>): Promise<ApiResponse<Task>> => {
    return http.get(API_PATHS.NOTIFICATION_LIST, data)
  },
   // 任务全部列表
    taskAllList: ( data: Partial<Task>): Promise<ApiResponse<Task>> => {
      return http.get(API_PATHS.TASK_ALL_LIST, data)
    },
  // 清单关联记账汇总
  taskLedgerSummary: (params?: {
    roomId?: string | number
    listId?: string | number
    taskId?: string | number
  }): Promise<ApiResponse<{
    recordCount: number
    netExpense: number
    totalExpense: number
    totalIncome: number
  }>> => {
    return http.get(API_PATHS.TASK_LEDGER_SUMMARY, params)
  },
  // 清单关联记账明细
  taskLedgerRecords: (params?: {
    roomId?: string | number
    listId?: string | number
    taskId?: string | number
    page?: number
    pageSize?: number
  }): Promise<ApiResponse<{ total: number; rows: Record<string, unknown>[] }>> => {
    return http.get(API_PATHS.TASK_LEDGER_RECORDS, params)
  },
  // 任务提醒已读
  notificationRead: ( data: Partial<Task>): Promise<ApiResponse<Task>> => {
    return http.post(API_PATHS.NOTIFICATION_READ, data)
  },

 // 删除任务
   deleteTask: (taskId: String,roomId:String): Promise<ApiResponse<null>> => {
     return http.post(`${API_PATHS.TASK_DELETE}?id=`+taskId+"&roomId="+roomId)
   },

  // 分配任务
  assignTask: (taskId: string, assigneeId: string): Promise<ApiResponse<Task>> => {
    return http.post(`${API_PATHS.TASK_ASSIGN}/${taskId}`, { assigneeId })
  }
}

// 日程相关API
export const scheduleApi = {
  // 获取日程列表
  getScheduleList: (params?: {
    roomId?: string
    startDate?: string
    endDate?: string
    type?: string
    page?: number
    pageSize?: number
  }): Promise<ApiResponse<{ list: Schedule[]; total: number }>> => {
    return http.get(API_PATHS.SCHEDULE_LIST, params)
  },

  // 创建日程
  createSchedule: (data: Omit<Schedule, 'id' | 'createTime' | 'updateTime'>): Promise<ApiResponse<Schedule>> => {
    return http.post(API_PATHS.SCHEDULE_CREATE, data)
  },

  // 更新日程
  updateSchedule: (scheduleId: string, data: Partial<Schedule>): Promise<ApiResponse<Schedule>> => {
    return http.put(`${API_PATHS.SCHEDULE_UPDATE}/${scheduleId}`, data)
  },

  // 删除日程
  deleteSchedule: (scheduleId: string): Promise<ApiResponse<null>> => {
    return http.delete(`${API_PATHS.SCHEDULE_DELETE}/${scheduleId}`)
  }
}

// 动态相关API
export const feedApi = {
  // 获取动态列表
  getFeedList: (params?: {
    roomId?: string
    page?: number
    pageSize?: number
  }): Promise<ApiResponse<{ list: any[]; total: number }>> => {
    return http.get(API_PATHS.FEED_LIST, params)
  },

  // 发布动态
  createFeed: (data: {
    roomId: string
    content: string
    images?: string[]
    type: 'text' | 'image' | 'task_complete' | 'schedule_create'
  }): Promise<ApiResponse<any>> => {
    return http.post(API_PATHS.FEED_CREATE, data)
  },

  // 点赞动态
  likeFeed: (feedId: string): Promise<ApiResponse<null>> => {
    return http.post(`${API_PATHS.FEED_LIKE}/${feedId}`)
  }
}

// 文件上传API
export const uploadApi = {
  // 上传图片
  uploadImage: (filePath: string, type: 'avatar' | 'feed' | 'room'): Promise<ApiResponse<{ url: string }>> => {
    return http.upload(API_PATHS.UPLOAD_IMAGE || '/upload/image', filePath, { type })
  },

  // 上传文件
  uploadFile: (filePath: string, type: string): Promise<ApiResponse<{ url: string }>> => {
    return http.upload(API_PATHS.UPLOAD_FILE || '/upload/file', filePath, { type })
  }
}

//消息API
const buildMarkAsReadUrl = (params: {
  id?: string | number
  targetId?: string | number
  targetType?: string
}) => {
  const query: string[] = []
  if (params.id != null && params.id !== '') {
    query.push(`id=${encodeURIComponent(String(params.id))}`)
  }
  if (params.targetId != null && params.targetId !== '') {
    query.push(`targetId=${encodeURIComponent(String(params.targetId))}`)
  }
  if (params.targetType) {
    query.push(`targetType=${encodeURIComponent(params.targetType)}`)
  }
  return `${API_PATHS.NOTIFICATION_ALER_READ}?${query.join('&')}`
}

export interface WechatSubscribeTemplates {
  birthdayTemplateId?: string
  birthday_template_id?: string
  scheduleTemplateId?: string
  schedule_template_id?: string
}

export const notificationsApi={
	// 获取微信订阅消息模板 ID
	getWechatSubscribeTemplates: (): Promise<ApiResponse<WechatSubscribeTemplates>> => {
	  return http.get(API_PATHS.WECHAT_SUBSCRIBE_TEMPLATES, undefined, { showError: false })
	},
	// 获取消息列表
	getNotificationList: (): Promise<ApiResponse<null>> => {
	  return http.get(`${API_PATHS.NOTIFICATION_LISTS}`)
	},
	// 获取消息数量
	getNotificationReadCount: (): Promise<ApiResponse<null>> => {
	  return http.get(`${API_PATHS.NOTIFICATION_UNREAD_COUNT}`)
	},
	// 已读消息（支持 notification id / targetId + targetType）
	markNotificationRead: (params: {
	  id?: string | number
	  targetId?: string | number
	  targetType?: string
	}): Promise<ApiResponse<null>> => {
	  return http.post(buildMarkAsReadUrl(params))
	},
	getNotificationRead: (targetId: string | number, targetType: string): Promise<ApiResponse<null>> => {
	  return http.post(buildMarkAsReadUrl({ targetId, targetType }))
	},
}

// API统一导出
export const api = {
  user: userApi,
  room: roomApi,
  task: taskApi,
  schedule: scheduleApi,
  feed: feedApi,
  upload: uploadApi,
  type:typeApi,
  notifications:notificationsApi,
  ledgerImport: ledgerImportApi
}

export default api
