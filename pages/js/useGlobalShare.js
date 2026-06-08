import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import { getCurrentInstance } from 'vue'



export function useGlobalShare(options = {}) {
  const instance = getCurrentInstance()
  console.log("分享打印:",instance);
  if (!instance) return

  // 页面级随机一次（重要）
  // const fixedRandomTitle = getRandomTitle()

  /* ================= 分享给好友 ================= */
  onShareAppMessage((res) => {
    const title =
      typeof options.title === 'function'
        ? options.title()
        : options.title

    const path =
      typeof options.path === 'function'
        ? options.path()
        : options.path

    const inviteCode =
      typeof options.inviteCode === 'function'
        ? options.inviteCode()
        : options.inviteCode

    // 按钮分享（邀请）
    if (res.from === 'button' && inviteCode) {
      return {
        title: title || '',
        path: `/pages/index/index?roomInviteCode=${inviteCode}&from=share`,
        imageUrl: options.imageUrl || '/static/share-image.png'
      }
    }

    // 右上角菜单分享
    return {
      title: title || '',
      path: (path || '/pages/index/index') + '?from=share',
      imageUrl: options.imageUrl || ''
    }
  })

  /* ================= 分享到朋友圈 ================= */
  onShareTimeline(() => {
    const title =
      typeof options.title === 'function'
        ? options.title()
        : options.title

    const path =
      typeof options.path === 'function'
        ? options.path()
        : options.path

    const inviteCode =
      typeof options.inviteCode === 'function'
        ? options.inviteCode()
        : options.inviteCode

    // 朋友圈没有 path，只有 query
    let query = 'from=timeline'

    if (inviteCode) {
      query += `&roomInviteCode=${inviteCode}`
    }

    return {
      title: title || '',
      query,
      imageUrl: options.imageUrl || '/static/share-image.png'
    }
  })
}
