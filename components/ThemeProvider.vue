<template>
  <view class="theme-provider" :class="themeClass" :style="pageStyle">
    <slot />
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useThemeStore } from '@/store/theme'

// 使用主题store
const themeStore = useThemeStore()

// 计算当前主题类名
const themeClass = computed(() => `theme-${themeStore.currentThemeInfo?.id || 'default'}`)

// 计算页面样式
const pageStyle = computed(() => ({
  backgroundColor: themeStore.currentThemeInfo?.backgroundColor || '#F5F5F5',
  color: themeStore.currentThemeInfo?.textColor || '#333333'
}))

// 监听全局主题变化事件
const handleThemeChange = (theme: any) => {
  console.log('全局主题变化:', theme.name)
  // 强制重新渲染
  themeStore.state.currentTheme = theme
}

onMounted(() => {
  // 监听uni-app全局事件
  if (typeof uni !== 'undefined') {
    uni.$on('theme-changed', handleThemeChange)
  }

  // 监听H5环境的事件
  if (typeof window !== 'undefined') {
    window.addEventListener('theme-changed', (event: any) => {
      handleThemeChange(event.detail)
    })
  }
})

onUnmounted(() => {
  // 清理事件监听
  if (typeof uni !== 'undefined') {
    uni.$off('theme-changed', handleThemeChange)
  }

  if (typeof window !== 'undefined') {
    window.removeEventListener('theme-changed', handleThemeChange as EventListener)
  }
})
</script>

<style scoped>
.theme-provider {
  min-height: 100vh;
}
</style>
