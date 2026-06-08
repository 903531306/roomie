// 主题系统统一导出

export { default as themeManager, ThemeManager } from './manager'
export * from './utils'
export * from './composables'

// 便捷的主题切换函数
export const switchTheme = (themeId: string) => {
  return themeManager.switchTheme(themeId)
}

// 获取当前主题
export const getCurrentTheme = () => {
  return themeManager.getCurrentTheme()
}

// 订阅主题变化
export const subscribeTheme = (callback: (theme: any) => void) => {
  return themeManager.subscribe(callback)
}
