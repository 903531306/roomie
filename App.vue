<template>
  <!-- uni-app 应用壳：页面由 pages.json 路由，此处仅满足组件模板要求 -->
  <view class="app-root" />
</template>

<script>
import { ref, provide } from 'vue'
import { useUserStore } from '@/store/user'
import data from '@/data.json'
import { initAppThemeOnLaunch, setAppThemeId } from '@/common/themes/appTheme'

const globalData = ref({
  data,
  isPlatfrom: ''
})

provide('globalData', globalData)

if (uni.getStorageSync('userInfo')) {
  globalData.value.data.userInfo = uni.getStorageSync('userInfo')
  globalData.value.data.isLogin = true
}

export default {
  onLaunch() {
    console.log('App Launch')

    const userStore = useUserStore()
    userStore.initUser()

    const themeId = initAppThemeOnLaunch()
    uni.$emit('update_theme', themeId)

    uni.$on('update_theme', (id) => {
      setAppThemeId(id, { emit: false })
    })

    // #ifdef MP-WEIXIN
    if (typeof wx !== 'undefined' && wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager()

      updateManager.onCheckForUpdate((res) => {
        console.log('是否有新版本：', res.hasUpdate)
      })

      updateManager.onUpdateReady(() => {
        uni.showModal({
          title: '更新提示',
          content: '新版本已经准备好，是否立即重启应用？',
          showCancel: false,
          success: () => {
            updateManager.applyUpdate()
          }
        })
      })

      updateManager.onUpdateFailed(() => {
        uni.showModal({
          title: '更新失败',
          content: '新版本下载失败，请检查网络后重试',
          showCancel: false
        })
      })
    }
    // #endif
  },

  onShow() {
    console.log('App Show')
  },

  onHide() {
    console.log('App Hide')
  }
}
</script>

<style>
/* --- 主题变量定义池（与 ThemePickerModal 的 id 对应）--- */

:root,
.theme-indigo {
  --primary-color: #4F46E5;
  --primary-soft: #EEF2FF;
  --primary-glow: rgba(79, 70, 229, 0.2);
  --secondary-color: #7C3AED;
}

.theme-emerald {
  --primary-color: #10B981;
  --primary-soft: #ECFDF5;
  --primary-glow: rgba(16, 185, 129, 0.2);
  --secondary-color: #059669;
}

.theme-rose {
  --primary-color: #F43F5E;
  --primary-soft: #FFF1F2;
  --primary-glow: rgba(244, 63, 94, 0.2);
  --secondary-color: #E11D48;
}

.theme-amber {
  --primary-color: #F59E0B;
  --primary-soft: #FFFBEB;
  --primary-glow: rgba(245, 158, 11, 0.2);
  --secondary-color: #D97706;
}

.theme-midnight {
  --primary-color: #1E293B;
  --primary-soft: #F1F5F9;
  --primary-glow: rgba(30, 41, 59, 0.2);
  --secondary-color: #0F172A;
}

.theme-violet {
  --primary-color: #8B5CF6;
  --primary-soft: #F5F3FF;
  --primary-glow: rgba(139, 92, 246, 0.2);
  --secondary-color: #7C3AED;
}

.app-root {
  display: none;
}

/* --- 全局基础样式 --- */
page {
  background-color: #F8FAFC;
  color: #1E293B;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
