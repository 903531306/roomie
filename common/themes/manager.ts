import { themes, STORAGE_KEYS } from '@/common/config'
import type { Theme } from '@/types'

// 主题管理器类
class ThemeManager {
  private currentTheme: Theme
  private subscribers: Array<(theme: Theme) => void> = []

  constructor() {
    // 从本地存储加载主题
    this.currentTheme = this.loadTheme()
    // 应用当前主题
    this.applyTheme(this.currentTheme)
  }

  // 获取当前主题
  public getCurrentTheme(): Theme {
    return this.currentTheme
  }

  // 获取所有可用主题
  public getAllThemes(): Theme[] {
    return themes
  }

  // 切换主题
  public switchTheme(themeId: string): boolean {
    const theme = themes.find(t => t.id === themeId)
    if (!theme) {
      console.error(`主题 ${themeId} 不存在`)
      return false
    }

    this.currentTheme = theme
    this.applyTheme(theme)
    this.saveTheme(theme)
    this.notifySubscribers(theme)

    return true
  }

  // 订阅主题变化
  public subscribe(callback: (theme: Theme) => void): () => void {
    this.subscribers.push(callback)

    // 返回取消订阅函数
    return () => {
      const index = this.subscribers.indexOf(callback)
      if (index > -1) {
        this.subscribers.splice(index, 1)
      }
    }
  }

  // 应用主题到页面
  private applyTheme(theme: Theme): void {
    // 检查是否为H5环境，如果是则设置CSS变量
    const isH5 = typeof window !== 'undefined' && typeof document !== 'undefined'

    if (isH5) {
      // H5端设置CSS变量
      const root = document.documentElement
      if (root) {
        root.style.setProperty('--primary-color', theme.primaryColor)
        root.style.setProperty('--secondary-color', theme.secondaryColor)
        root.style.setProperty('--background-color', theme.backgroundColor)
        root.style.setProperty('--text-color', theme.textColor)
        root.style.setProperty('--card-background', theme.cardBackground)
        root.style.setProperty('--border-color', theme.borderColor)

        // 设置body背景色
        document.body.style.backgroundColor = theme.backgroundColor

        // 触发页面重新渲染（通过自定义事件）
        window.dispatchEvent(new CustomEvent('theme-changed', { detail: theme }))
      }
    } else if (typeof uni !== 'undefined') {
      // 小程序端通过全局状态和事件来实现主题切换
      try {
        // 设置页面背景色
        uni.setBackgroundColor({
          backgroundColor: theme.backgroundColor
        })

        // 设置导航栏颜色 - 简单判断是否为深色主题
        const isDarkText = theme.id === 'dark'
        uni.setNavigationBarColor({
          backgroundColor: theme.primaryColor,
          frontColor: isDarkText ? '#000000' : '#ffffff'
        })

        // 设置TabBar颜色（如果有的话）
        // if (uni.setTabBarStyle) {
        //   uni.setTabBarStyle({
        //     backgroundColor: theme.cardBackground,
        //     borderStyle: 'white',
        //     color: theme.textColor,
        //     selectedColor: theme.primaryColor
        //   })
        // }
      } catch (error) {
        console.warn('设置小程序主题样式失败:', error)
      }

      // 发送全局事件通知组件更新
      uni.$emit('theme-changed', theme)
    }
  }

  // 获取对比色（用于文字颜色）
  private getContrastColor(color: string): '#ffffff' | '#000000' {
    // 简单的亮度计算
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)

    // 计算亮度 (YIQ公式)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000

    return brightness > 128 ? '#000000' : '#ffffff'
  }

  // 保存主题到本地存储
  private saveTheme(theme: Theme): void {
    try {
      uni.setStorageSync(STORAGE_KEYS.THEME, theme)
    } catch (error) {
      console.error('保存主题失败:', error)
    }
  }

  // 从本地存储加载主题
  private loadTheme(): Theme {
    try {
      const savedTheme = uni.getStorageSync(STORAGE_KEYS.THEME)
      if (savedTheme && savedTheme.id) {
        // 验证主题是否存在
        const theme = themes.find(t => t.id === savedTheme.id)
        if (theme) {
          return { ...theme, ...savedTheme } // 合并保存的自定义设置
        }
      }
    } catch (error) {
      console.error('加载主题失败:', error)
    }

    // 返回默认主题
    return themes[0]
  }

  // 通知订阅者
  private notifySubscribers(theme: Theme): void {
    this.subscribers.forEach(callback => {
      try {
        callback(theme)
      } catch (error) {
        console.error('主题订阅者回调执行失败:', error)
      }
    })
  }

  // 创建自定义主题
  public createCustomTheme(themeData: Omit<Theme, 'id'>): Theme {
    const customTheme: Theme = {
      id: `custom_${Date.now()}`,
      ...themeData
    }

    // 添加到主题列表
    themes.push(customTheme)

    return customTheme
  }

  // 删除自定义主题
  public deleteCustomTheme(themeId: string): boolean {
    const index = themes.findIndex(t => t.id === themeId)
    if (index > -1 && themes[index].id.startsWith('custom_')) {
      themes.splice(index, 1)

      // 如果删除的是当前主题，切换到默认主题
      if (this.currentTheme.id === themeId) {
        this.switchTheme(themes[0].id)
      }

      return true
    }
    return false
  }

  // 更新自定义主题
  public updateCustomTheme(themeId: string, updates: Partial<Theme>): boolean {
    const theme = themes.find(t => t.id === themeId)
    if (theme && theme.id.startsWith('custom_')) {
      Object.assign(theme, updates)

      // 如果更新的是当前主题，重新应用
      if (this.currentTheme.id === themeId) {
        this.applyTheme(theme)
        this.saveTheme(theme)
        this.notifySubscribers(theme)
      }

      return true
    }
    return false
  }
}

// 创建主题管理器实例
const themeManager = new ThemeManager()

export default themeManager
export { ThemeManager }
