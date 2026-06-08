import { createPinia } from 'pinia'
import { createSSRApp } from 'vue'

// 创建Pinia实例
const pinia = createPinia()

// 配置SSR支持
if (typeof createSSRApp !== 'undefined') {
  // SSR环境下不需要特殊配置
}

// 导出Pinia实例
export default pinia

// 导出类型
export type { Pinia } from 'pinia'
