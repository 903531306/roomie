import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useThemeStore } from '@/store/theme'
import type { Theme } from '@/types'

// 主题响应式组合式函数
export function useTheme() {
  const themeStore = useThemeStore()

  // 响应式主题数据
  const currentTheme = computed(() => themeStore.currentThemeInfo)
  const themeStyles = computed(() => themeStore.themeStyles)

  // 主题切换方法
  const switchTheme = (themeId: string) => {
    return themeStore.switchTheme(themeId)
  }

  // 生成动态样式对象（用于小程序组件）
  const getThemeStyle = (property: keyof Theme) => {
    return computed(() => ({
      [property]: currentTheme.value?.[property] || ''
    }))
  }

  // 获取主题类名（用于CSS类切换）
  const themeClass = computed(() => `theme-${currentTheme.value?.id || 'default'}`)

  // 监听主题变化（主要用于小程序环境）
  const themeChangeListener = (theme: Theme) => {
    // 强制更新组件
    console.log('主题变化:', theme.name)
  }

  onMounted(() => {
    // 订阅主题变化
    const unsubscribe = themeStore.subscribeThemeChange(themeChangeListener)

    onUnmounted(() => {
      unsubscribe()
    })
  })

  return {
    currentTheme,
    themeStyles,
    themeClass,
    switchTheme,
    getThemeStyle
  }
}

// 便捷的主题样式生成器
export function useThemeStyles() {
  const { currentTheme } = useTheme()

  const primaryColor = computed(() => currentTheme.value?.primaryColor || '#007AFF')
  const secondaryColor = computed(() => currentTheme.value?.secondaryColor || '#5AC8FA')
  const backgroundColor = computed(() => currentTheme.value?.backgroundColor || '#F5F5F5')
  const textColor = computed(() => currentTheme.value?.textColor || '#333333')
  const cardBackground = computed(() => currentTheme.value?.cardBackground || '#FFFFFF')
  const borderColor = computed(() => currentTheme.value?.borderColor || '#E5E5E5')

  return {
    primaryColor,
    secondaryColor,
    backgroundColor,
    textColor,
    cardBackground,
    borderColor
  }
}
