import App from './App'

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
  ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
import pinia from './store'

// 微信小程序依赖分析：显式引入清单组件，避免被「无依赖文件过滤」忽略
// #ifdef MP-WEIXIN
// import '@/components/checklist/ChecklistTaskDrawer.vue'
// import '@/components/checklist/ChecklistQuickAdd.vue'
// import '@/components/checklist/ChecklistTaskLine.vue'
// #endif

export function createApp() {
  const app = createSSRApp(App)

  // 使用Pinia状态管理
  app.use(pinia)

  return {
    app
  }
}
// #endif