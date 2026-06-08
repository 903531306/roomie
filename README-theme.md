# Roomie 主题系统使用指南

## 概述

Roomie 应用实现了完整的全局主题切换系统，支持多种预设主题和自定义主题功能。系统基于 Pinia 状态管理和组合式 API 构建，支持 H5 和小程序等多端平台。

## 核心特性

- 🎨 7种预设主题（默认、深色、清新绿意、温暖橙色、浪漫紫色、活力粉色、商务蓝色）
- 🔧 自定义主题创建和编辑
- 📱 跨平台支持（H5、小程序）
- ⚡ 响应式主题切换
- 💾 本地主题持久化存储

## 架构组成

### 1. 主题配置 (`common/config/index.ts`)
定义所有预设主题的颜色配置。

### 2. 主题管理器 (`common/themes/manager.ts`)
核心主题切换逻辑，负责：
- 主题的存储和加载
- 主题的平台适配应用
- 主题变化通知

### 3. 主题状态管理 (`store/theme.ts`)
基于 Pinia 的响应式状态管理，提供：
- 主题切换 API
- 自定义主题管理
- 主题搜索和分类

### 4. 主题工具函数 (`common/themes/utils.ts`)
提供主题相关的工具函数：
- 颜色处理
- 主题验证
- 样式生成

### 5. 组合式函数 (`common/themes/composables.ts`)
Vue 3 组合式 API，方便组件使用主题功能。

## 使用方法

### 1. 在组件中使用主题

```vue
<template>
  <view class="component" :style="componentStyle">
    <text :style="{ color: primaryColor }">主题文字</text>
  </view>
</template>

<script setup>
import { useThemeStyles } from '@/common/themes'

const { primaryColor, backgroundColor, textColor } = useThemeStyles()

const componentStyle = computed(() => ({
  backgroundColor: backgroundColor.value,
  color: textColor.value
}))
</script>
```

### 2. 切换主题

```vue
<script setup>
import { useThemeStore } from '@/store/theme'

const themeStore = useThemeStore()

const switchToDark = () => {
  themeStore.switchTheme('dark')
}
</script>
```

### 3. 使用主题选择器

```vue
<template>
  <ThemeSelector v-if="showThemePicker" @close="showThemePicker = false" />
</template>

<script setup>
import ThemeSelector from '@/components/ThemeSelector.uvue'
</script>
```

## 主题数据结构

```typescript
interface Theme {
  id: string
  name: string
  primaryColor: string      // 主色调
  secondaryColor: string    // 辅助色
  backgroundColor: string   // 背景色
  textColor: string         // 文字色
  cardBackground: string    // 卡片背景色
  borderColor: string       // 边框色
  images?: {
    logo?: string
    background?: string
    iconSet?: string[]
  }
}
```

## 平台适配

### H5 平台
- 使用 CSS 变量实现主题切换
- 支持动态样式更新
- 通过自定义事件通知组件更新

### 小程序平台
- 使用 `uni.setBackgroundColor()` 设置页面背景
- 使用 `uni.setNavigationBarColor()` 设置导航栏
- 使用 `uni.setTabBarStyle()` 设置底部 TabBar
- 通过全局事件 `$emit` 通知组件更新

## 扩展主题

### 添加预设主题

在 `common/config/index.ts` 中添加新的主题配置：

```typescript
export const newTheme: Theme = {
  id: 'new-theme',
  name: '新主题',
  primaryColor: '#FF6B35',
  secondaryColor: '#F7931E',
  backgroundColor: '#FFF8F0',
  textColor: '#2D3748',
  cardBackground: '#FFFFFF',
  borderColor: '#E2E8F0'
}
```

### 自定义主题

用户可以通过主题选择器创建自定义主题，支持：
- 颜色自定义
- 主题名称设置
- 主题导出/导入

## 最佳实践

1. **统一使用组合式函数**: 在组件中使用 `useThemeStyles()` 获取主题样式
2. **避免直接操作DOM**: 让主题系统处理样式应用
3. **使用语义化颜色**: 优先使用主题提供的颜色变量
4. **测试多端兼容**: 确保主题在 H5 和小程序中都能正常工作

## 故障排除

### 主题切换后样式不生效
- 检查组件是否使用了响应式的主题数据
- 确认主题数据已正确更新到 store 中

### 小程序端主题切换延迟
- 小程序平台可能有样式更新延迟，使用 `$nextTick` 确保更新完成

### 自定义主题丢失
- 检查本地存储是否可用
- 确认主题数据格式正确
