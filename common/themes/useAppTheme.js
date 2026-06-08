import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getAppThemeById, getStoredAppThemeId, APP_THEME_PRESETS } from './appTheme'

/**
 * 订阅全局主题（App.vue onLaunch + ThemePickerModal 触发 update_theme）
 * 页面根节点加 :class="themeClass" 后，子组件可用 var(--primary-color) 等 CSS 变量
 */
export function useAppTheme() {
  const themeId = ref(getStoredAppThemeId())
  const theme = computed(() => getAppThemeById(themeId.value))
  const themeClass = computed(() => `theme-${themeId.value}`)
  const primaryColor = computed(() => theme.value.primary)
  const softColor = computed(() => theme.value.soft)
  const themeStyles = computed(() => ({
    backgroundColor: softColor.value
  }))

  const onThemeUpdate = (id) => {
    themeId.value = id
  }

  const syncTheme = () => {
    themeId.value = getStoredAppThemeId()
  }

  onMounted(() => {
    syncTheme()
    uni.$on('update_theme', onThemeUpdate)
  })

  onShow(() => {
    syncTheme()
  })

  onUnmounted(() => {
    uni.$off('update_theme', onThemeUpdate)
  })

  return {
    themeId,
    theme,
    themeClass,
    primaryColor,
    softColor,
    themeStyles,
    APP_THEME_PRESETS
  }
}
