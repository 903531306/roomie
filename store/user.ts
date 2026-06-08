import { defineStore } from 'pinia'
import { reactive, computed } from 'vue'
import type { User } from '@/types'
import { STORAGE_KEYS } from '@/common/config'

interface UserState {
  currentUser: User | null
  isLoggedIn: boolean
}

export const useUserStore = defineStore('user', () => {
  // 响应式状态
  const state = reactive<UserState>({
    currentUser: null,
    isLoggedIn: false
  })

  // 计算属性
  const userInfo = computed(() => state.currentUser)
  const isAuthenticated = computed(() => state.isLoggedIn)

  // 初始化用户状态
  const initUser = () => {
    try {
      const userInfo = uni.getStorageSync(STORAGE_KEYS.USER_INFO)
      if (userInfo) {
        state.currentUser = userInfo
        state.isLoggedIn = true
      }
    } catch (error) {
      console.error('初始化用户状态失败:', error)
      clearUserData()
    }
  }

  // 登录（模拟）
  const login = async (userData: Partial<User>) => {
    try {
      // 模拟登录成功
      const user: User = {
        id: userData.id || `user_${Date.now()}`,
        nickname: userData.nickname || '体验用户',
        avatar: userData.avatar || '',
        role: userData.role || 'member',
        joinTime: userData.joinTime || new Date().toISOString()
      }

      // 保存到状态
      state.currentUser = user
      state.isLoggedIn = true

      // 保存到本地存储
      uni.setStorageSync(STORAGE_KEYS.USER_INFO, user)

      return { success: true, user }
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    }
  }

  // 退出登录
  const logout = () => {
    clearUserData()
  }

  // 更新用户信息
  const updateUserInfo = (userData: Partial<User>) => {
    if (state.currentUser) {
      state.currentUser = { ...state.currentUser, ...userData }
      // 保存到本地存储
      uni.setStorageSync(STORAGE_KEYS.USER_INFO, state.currentUser)
    }
  }

  // 清除用户数据
  const clearUserData = () => {
    state.currentUser = null
    state.isLoggedIn = false

    // 清除本地存储
    try {
      uni.removeStorageSync(STORAGE_KEYS.USER_INFO)
    } catch (error) {
      console.error('清除本地存储失败:', error)
    }
  }

  // 检查登录状态
  const checkLoginStatus = (): boolean => {
    return state.isLoggedIn && !!state.currentUser
  }

  return {
    // 状态
    state,

    // 直接暴露状态属性
    currentUser: state.currentUser,
    isLoggedIn: state.isLoggedIn,

    // 计算属性
    userInfo,
    isAuthenticated,

    // 方法
    initUser,
    login,
    logout,
    updateUserInfo,
    clearUserData,
    checkLoginStatus
  }
})
