export const APP_THEME_STORAGE_KEY = 'app_theme'
/** 用户是否在换肤弹窗中主动选择过主题 */
export const APP_THEME_USER_SET_KEY = 'app_theme_user_set'

export interface AppThemePreset {
  id: string
  name: string
  primary: string
  soft: string
}

/** 换肤弹窗展示用；实际颜色以 App.vue 中 CSS 变量为准 */
export const APP_THEME_PRESETS: AppThemePreset[] = [
  { id: 'indigo', name: '经典靛蓝', primary: '#4F46E5', soft: '#EEF2FF' },
  { id: 'emerald', name: '清新翡翠', primary: '#10B981', soft: '#ECFDF5' },
  { id: 'rose', name: '浪漫玫瑰', primary: '#F43F5E', soft: '#FFF1F2' },
  { id: 'amber', name: '温暖琥珀', primary: '#F59E0B', soft: '#FFFBEB' },
  { id: 'midnight', name: '极客之夜', primary: '#1E293B', soft: '#F1F5F9' },
  { id: 'violet', name: '幻紫星云', primary: '#8B5CF6', soft: '#F5F3FF' }
]

export const DEFAULT_APP_THEME_ID = APP_THEME_PRESETS[0].id

export function isValidAppThemeId(id: unknown): id is string {
  return typeof id === 'string' && APP_THEME_PRESETS.some((t) => t.id === id)
}

export function getAppThemeById(id?: string): AppThemePreset {
  return APP_THEME_PRESETS.find((t) => t.id === id) || APP_THEME_PRESETS[0]
}

/**
 * 应用启动时解析主题：
 * - 用户主动选过 / 旧版已写入合法 app_theme → 保留
 * - 从未设置 → 第一个预设（不写 user_set，避免误判为已选过）
 */
export function initAppThemeOnLaunch(): string {
  const userSet = !!uni.getStorageSync(APP_THEME_USER_SET_KEY)
  const stored = uni.getStorageSync(APP_THEME_STORAGE_KEY)

  if (userSet && isValidAppThemeId(stored)) {
    return stored
  }

  // 升级迁移：新版本前已在换肤里保存过 app_theme
  if (isValidAppThemeId(stored)) {
    uni.setStorageSync(APP_THEME_USER_SET_KEY, true)
    return stored
  }

  return DEFAULT_APP_THEME_ID
}

export function getStoredAppThemeId(): string {
  const userSet = !!uni.getStorageSync(APP_THEME_USER_SET_KEY)
  const stored = uni.getStorageSync(APP_THEME_STORAGE_KEY)

  if (userSet && isValidAppThemeId(stored)) {
    return stored
  }

  return DEFAULT_APP_THEME_ID
}

export function hasUserSetAppTheme(): boolean {
  return !!uni.getStorageSync(APP_THEME_USER_SET_KEY)
}

export function setAppThemeId(id: string, options?: { emit?: boolean }): AppThemePreset {
  const theme = getAppThemeById(id)
  uni.setStorageSync(APP_THEME_STORAGE_KEY, theme.id)
  uni.setStorageSync(APP_THEME_USER_SET_KEY, true)
  if (options?.emit !== false) {
    uni.$emit('update_theme', theme.id)
  }
  return theme
}
