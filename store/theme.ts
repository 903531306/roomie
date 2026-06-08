import { defineStore } from 'pinia'
import { reactive, computed } from 'vue'
import type { Theme } from '@/types'
import { themeManager } from '@/common/themes'
import { generateThemeStyles, getThemePreview } from '@/common/themes/utils'

interface ThemeState {
  currentTheme: Theme
  availableThemes: Theme[]
  customThemes: Theme[]
}

export const useThemeStore = defineStore('theme', () => {
  // 响应式状态
  const state = reactive<ThemeState>({
    currentTheme: themeManager.getCurrentTheme(),
    availableThemes: themeManager.getAllThemes(),
    customThemes: []
  })

  // 计算属性
  const currentThemeInfo = computed(() => state.currentTheme)
  const themeStyles = computed(() => generateThemeStyles(state.currentTheme))
  const themePreview = computed(() => getThemePreview(state.currentTheme))
  const allThemes = computed(() => [...state.availableThemes, ...state.customThemes])

  // 切换主题
  const switchTheme = (themeId: string) => {
    const success = themeManager.switchTheme(themeId)
    if (success) {
      state.currentTheme = themeManager.getCurrentTheme()
      return true
    }
    return false
  }

  // 创建自定义主题
  const createCustomTheme = (themeData: Omit<Theme, 'id'>) => {
    const newTheme = themeManager.createCustomTheme(themeData)
    state.customThemes.push(newTheme)
    return newTheme
  }

  // 删除自定义主题
  const deleteCustomTheme = (themeId: string) => {
    const success = themeManager.deleteCustomTheme(themeId)
    if (success) {
      state.customThemes = state.customThemes.filter(theme => theme.id !== themeId)
      // 如果删除的是当前主题，更新状态
      if (state.currentTheme.id === themeId) {
        state.currentTheme = themeManager.getCurrentTheme()
      }
    }
    return success
  }

  // 更新自定义主题
  const updateCustomTheme = (themeId: string, updates: Partial<Theme>) => {
    const success = themeManager.updateCustomTheme(themeId, updates)
    if (success) {
      // 更新本地状态
      const themeIndex = state.customThemes.findIndex(theme => theme.id === themeId)
      if (themeIndex > -1) {
        state.customThemes[themeIndex] = { ...state.customThemes[themeIndex], ...updates }
      }
      // 如果更新的是当前主题
      if (state.currentTheme.id === themeId) {
        state.currentTheme = themeManager.getCurrentTheme()
      }
    }
    return success
  }

  // 订阅主题变化
  const subscribeThemeChange = (callback: (theme: Theme) => void) => {
    return themeManager.subscribe((theme) => {
      state.currentTheme = theme
      callback(theme)
    })
  }

  // 获取主题分类
  const getThemesByCategory = () => {
    const presets = state.availableThemes.filter(theme => !theme.id.startsWith('custom_'))
    const customs = state.customThemes

    return {
      presets,
      customs,
      all: allThemes.value
    }
  }

  // 搜索主题
  const searchThemes = (keyword: string) => {
    const lowerKeyword = keyword.toLowerCase()
    return allThemes.value.filter(theme =>
      theme.name.toLowerCase().includes(lowerKeyword) ||
      theme.id.toLowerCase().includes(lowerKeyword)
    )
  }

  // 重置为默认主题
  const resetToDefault = () => {
    return switchTheme('default')
  }

  // 随机切换主题
  const switchToRandomTheme = () => {
    const themes = allThemes.value
    if (themes.length <= 1) return false

    const currentIndex = themes.findIndex(theme => theme.id === state.currentTheme.id)
    let randomIndex
    do {
      randomIndex = Math.floor(Math.random() * themes.length)
    } while (randomIndex === currentIndex)

    return switchTheme(themes[randomIndex].id)
  }

  return {
    // 状态
    state,

    // 计算属性
    currentThemeInfo,
    themeStyles,
    themePreview,
    allThemes,
    customThemes: computed(() => state.customThemes),

    // 方法
    switchTheme,
    createCustomTheme,
    deleteCustomTheme,
    updateCustomTheme,
    subscribeThemeChange,
    getThemesByCategory,
    searchThemes,
    resetToDefault,
    switchToRandomTheme
  }
})
