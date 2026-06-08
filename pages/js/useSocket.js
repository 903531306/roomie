import { ref } from "vue"

export function useSocket(url) {

  const socketTask = ref(null)
  const isOpen = ref(false)

  let reconnectTimer = null
  let heartbeatTimer = null

  function connect() {

    console.log("开始连接socket:", url)

    socketTask.value = uni.connectSocket({
      url,
      success() {
        console.log("socket连接请求发送成功")
      },
      fail(err) {
        console.error("socket连接失败", err)
        reconnect()
      }
    })

    socketTask.value.onOpen(() => {
      console.log("socket连接成功")
      isOpen.value = true
      startHeartbeat()
    })

    socketTask.value.onMessage((res) => {
      console.log("收到消息:", res.data)

      try {
        const data = JSON.parse(res.data)
        console.log("解析消息:", data)
      } catch (e) {
        console.warn("非JSON消息:", res.data)
      }
    })

    socketTask.value.onError((err) => {
      console.error("socket错误:", err)
      isOpen.value = false
      reconnect()
    })

    socketTask.value.onClose(() => {
      console.warn("socket关闭")
      isOpen.value = false
      stopHeartbeat()
      reconnect()
    })
  }

  function send(data) {

    if (!isOpen.value) {
      console.warn("socket未连接")
      return
    }

    socketTask.value.send({
      data: JSON.stringify(data),
      success() {
        console.log("消息发送成功",data)
      },
      fail(err) {
        console.error("发送失败:", err)
      }
    })
  }

  function close() {

    if (socketTask.value) {
      socketTask.value.close()
      socketTask.value = null
    }

  }

  function reconnect() {

    if (reconnectTimer) return

    console.log("3秒后重连")

    reconnectTimer = setTimeout(() => {
      connect()
      reconnectTimer = null
    }, 3000)

  }

  function startHeartbeat() {

    heartbeatTimer = setInterval(() => {

      if (isOpen.value) {
        send({
          type: "ping"
        })
      }

    }, 20000)

  }

  function stopHeartbeat() {

    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }

  }

  return {
    connect,
    send,
    close,
    isOpen
  }

}