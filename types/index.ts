// 全局类型定义
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface User {
  id: string
  nickname: string
  avatar: string
  role: 'admin' | 'member'
  joinTime: string
}

export interface Room {
  id: string
  name: string
  description: string
  avatar: string
  inviteCode: string
  members: User[]
  createTime: string
  updateTime: string
}

export interface Task {
  id: string
  title: string
  description?: string
  assigneeId: string
  assignee?: User
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  dueDate?: string
  createTime: string
  updateTime: string
  roomId: string
}

export interface Schedule {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  isAllDay: boolean
  type: 'personal' | 'family'
  creatorId: string
  creator?: User
  roomId: string
  createTime: string
  updateTime: string
}

export interface Theme {
  id: string
  name: string
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  textColor: string
  cardBackground: string
  borderColor: string
  images: {
    logo?: string
    background?: string
    iconSet?: string[]
  }
}

export interface AppConfig {
  apiBaseUrl: string
  appId: string
  version: string
}
