import { getStoredAppThemeId, getAppThemeById } from './appTheme'

/**
 * 全局页面/组件 mixin：模板中可直接使用 themeClass、primaryColor、softColor
 * 根节点示例：<view class="page-root" :class="themeClass">
 */
export const pageThemeMixin = {
  data() {
    return {
      __appThemeId: getStoredAppThemeId()
    }
  },
  computed: {
    themeClass() {
      return `theme-${this.__appThemeId}`
    },
    primaryColor() {
      return getAppThemeById(this.__appThemeId).primary
    },
    softColor() {
      return getAppThemeById(this.__appThemeId).soft
    },
    theme() {
      return getAppThemeById(this.__appThemeId)
    }
  },
  mounted() {
    this.__onThemeUpdate = (id) => {
      this.__appThemeId = id
    }
    uni.$on('update_theme', this.__onThemeUpdate)
  },
  beforeUnmount() {
    if (this.__onThemeUpdate) {
      uni.$off('update_theme', this.__onThemeUpdate)
    }
  }
}
