import type { Theme } from '@/types'

// 主题工具函数

/**
 * 获取主题CSS变量对象
 */
export const getThemeCSSVariables = (theme: Theme): Record<string, string> => {
  return {
    '--primary-color': theme.primaryColor,
    '--secondary-color': theme.secondaryColor,
    '--background-color': theme.backgroundColor,
    '--text-color': theme.textColor,
    '--card-background': theme.cardBackground,
    '--border-color': theme.borderColor,
  }
}

/**
 * 应用主题CSS变量到元素
 */
export const applyThemeCSSVariables = (theme: Theme, element?: HTMLElement): void => {
  // 检查是否为H5环境
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return // 小程序环境中不需要设置CSS变量
  }

  const target = element || (document.documentElement as HTMLElement)
  const variables = getThemeCSSVariables(theme)

  Object.entries(variables).forEach(([key, value]) => {
    target.style.setProperty(key, value)
  })
}

/**
 * 生成主题样式对象（用于uni-app组件）
 */
export const generateThemeStyles = (theme: Theme) => {
  return {
    primaryColor: theme.primaryColor,
    secondaryColor: theme.secondaryColor,
    backgroundColor: theme.backgroundColor,
    textColor: theme.textColor,
    cardBackground: theme.cardBackground,
    borderColor: theme.borderColor,
  }
}

/**
 * 计算颜色的亮度
 */
export const getColorBrightness = (color: string): number => {
  const hex = color.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)

  // 使用YIQ公式计算亮度
  return (r * 299 + g * 587 + b * 114) / 1000
}

/**
 * 获取对比色
 */
export const getContrastColor = (color: string): '#ffffff' | '#000000' => {
  const brightness = getColorBrightness(color)
  return brightness > 128 ? '#000000' : '#ffffff'
}

/**
 * 调整颜色亮度
 */
export const adjustColorBrightness = (color: string, amount: number): string => {
  const hex = color.replace('#', '')
  const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount))
  const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount))
  const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount))

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

/**
 * 生成主题变体（浅色/深色版本）
 */
export const generateThemeVariants = (theme: Theme) => {
  const brightness = getColorBrightness(theme.backgroundColor)

  return {
    light: {
      ...theme,
      backgroundColor: adjustColorBrightness(theme.backgroundColor, 20),
      cardBackground: adjustColorBrightness(theme.cardBackground, 15),
    },
    dark: {
      ...theme,
      backgroundColor: adjustColorBrightness(theme.backgroundColor, -30),
      cardBackground: adjustColorBrightness(theme.cardBackground, -20),
      textColor: adjustColorBrightness(theme.textColor, -50),
    }
  }
}

/**
 * 验证主题配置的完整性
 */
export const validateTheme = (theme: Partial<Theme>): { valid: boolean; errors: string[] } => {
  const errors: string[] = []
  const requiredFields: (keyof Theme)[] = [
    'id', 'name', 'primaryColor', 'secondaryColor',
    'backgroundColor', 'textColor', 'cardBackground', 'borderColor'
  ]

  requiredFields.forEach(field => {
    if (!theme[field]) {
      errors.push(`缺少必需字段: ${field}`)
    }
  })

  // 验证颜色格式
  const colorFields: (keyof Theme)[] = ['primaryColor', 'secondaryColor', 'backgroundColor', 'textColor', 'cardBackground', 'borderColor']
  colorFields.forEach(field => {
    const color = theme[field] as string
    if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      errors.push(`颜色格式不正确: ${field} - ${color}`)
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 合并主题配置
 */
export const mergeThemes = (baseTheme: Theme, overrides: Partial<Theme>): Theme => {
  return {
    ...baseTheme,
    ...overrides,
    images: {
      ...baseTheme.images,
      ...overrides.images
    }
  }
}

/**
 * 导出主题配置（用于保存或分享）
 */
export const exportTheme = (theme: Theme): string => {
  return JSON.stringify(theme, null, 2)
}

/**
 * 导入主题配置
 */
export const importTheme = (themeJson: string): Theme | null => {
  try {
    const theme = JSON.parse(themeJson) as Theme
    const validation = validateTheme(theme)

    if (validation.valid) {
      return theme
    } else {
      console.error('主题导入失败:', validation.errors)
      return null
    }
  } catch (error) {
    console.error('主题导入失败:', error)
    return null
  }
}

/**
 * 获取主题预览数据
 */
export const getThemePreview = (theme: Theme) => {
  return {
    name: theme.name,
    colors: {
      primary: theme.primaryColor,
      secondary: theme.secondaryColor,
      background: theme.backgroundColor,
      text: theme.textColor,
      card: theme.cardBackground,
      border: theme.borderColor,
    },
    images: theme.images,
    brightness: getColorBrightness(theme.backgroundColor),
    isDark: getColorBrightness(theme.backgroundColor) < 128
  }
}
