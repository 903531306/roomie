<template>
  <view :class="themeClass" class="room-select-container" :style="themeStyles">
    <!-- 顶部导航栏 -->
    <view class="custom-nav-bar" :style="{ backgroundColor: '#fff' }">
      <view class="nav-content">
        <text class="nav-title">选择同屋</text>
        <view class="nav-actions">
          <button class="create-btn" @click="createRoom">创建</button>
        </view>
      </view>
    </view>

    <!-- 内容区域 -->
    <scroll-view class="content" scroll-y="true">
      <!-- 欢迎区域 -->
      <view class="welcome-section">
        <text class="welcome-title">欢迎回来，体验用户</text>
        <text class="welcome-subtitle">请选择或创建一个同屋空间</text>
      </view>

      <!-- 同屋列表 -->
      <view class="rooms-section">
        <text class="section-title">我的同屋</text>

        <view v-if="rooms.length === 0" class="empty-state">
          <view class="empty-icon">🏠</view>
          <text class="empty-text">还没有加入任何同屋</text>
          <text class="empty-desc">创建或加入一个同屋，开始家庭协作吧</text>
        </view>

        <view v-else class="rooms-list">
          <view
            v-for="room in rooms"
            :key="room.id"
            class="room-card"
            :style="{ backgroundColor: '#fff', borderColor: '#F1F5F9' }"
            @click="selectRoom(room)"
          >
            <view class="room-header">
              <image
                v-if="room.avatar"
                class="room-avatar"
                :src="room.avatar"
                mode="aspectFill"
              />
              <view
                v-else
                class="room-avatar-placeholder"
                :style="{ backgroundColor: primaryColor }"
              >
                <text class="avatar-text">{{ room.name.charAt(0) }}</text>
              </view>
              <view class="room-info">
                <text class="room-name">{{ room.name }}</text>
                <text class="room-desc">{{ room.description || '暂无描述' }}</text>
              </view>
            </view>

            <view class="room-stats">
              <text class="stat-item">成员 {{ room.members?.length || 0 }}</text>
              <text class="stat-item">任务 {{ room.taskCount || 0 }}</text>
            </view>

            <view class="room-actions">
              <button
                class="action-btn primary"
                :style="{ backgroundColor: primaryColor }"
                @click.stop="selectRoom(room)"
              >
                进入
              </button>
            </view>
          </view>
        </view>
      </view>

      <!-- 加入同屋区域 -->
      <view class="join-section">
        <text class="section-title">加入同屋</text>
        <view class="join-card" :style="{ backgroundColor: '#fff', borderColor: '#F1F5F9' }">
          <view class="join-input-group">
            <input
              v-model="inviteCode"
              class="join-input"
              placeholder="输入邀请码"
              :style="{ borderColor: '#F1F5F9' }"
            />
            <button
              class="join-btn"
              :style="{ backgroundColor: primaryColor }"
              :disabled="!inviteCode.trim()"
              @click="joinRoom"
            >
              加入
            </button>
          </view>
          <text class="join-desc">通过邀请码加入已存在的同屋</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useAppTheme } from '@/common/themes/useAppTheme.js'
import type { Room } from '@/types'

const { themeClass, primaryColor, softColor } = useAppTheme()

// 响应式数据
const inviteCode = ref('')
const rooms = ref<Room[]>([])

// 新建同屋数据
const newRoom = reactive({
  name: '',
  description: ''
})

const themeStyles = computed(() => ({
  backgroundColor: softColor.value
}))

// 选择同屋
const selectRoom = async (room: Room) => {
  try {
    userStore.setCurrentRoom(room)

    // 跳转到主页
    uni.switchTab({
      url: '/pages/home/home'
    })
  } catch (error) {
    console.error('选择同屋失败:', error)
    uni.showToast({
      title: '选择同屋失败',
      icon: 'none'
    })
  }
}

// 创建同屋
const createRoom = async () => {
  const roomName = await new Promise<string>((resolve) => {
    uni.showModal({
      title: '创建同屋',
      editable: true,
      placeholderText: '请输入同屋名称',
      success: (res) => {
        if (res.confirm && res.content) {
          resolve(res.content)
        }
      }
    })
  })

  if (roomName) {
    // 模拟创建成功
    const mockRoom: Room = {
      id: `room_${Date.now()}`,
      name: roomName,
      description: '新创建的同屋',
      avatar: '',
      inviteCode: `INVITE${Date.now()}`,
      members: [{
        id: 'user_demo',
        nickname: '体验用户',
        avatar: '',
        role: 'member' as const,
        joinTime: new Date().toISOString()
      }],
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    }

    rooms.value.unshift(mockRoom)

    uni.showToast({
      title: '创建成功',
      icon: 'success'
    })

    // 自动选择刚创建的同屋
    selectRoom(mockRoom)
  }
}

// 加入同屋
const joinRoom = async () => {
  if (!inviteCode.value.trim()) {
    uni.showToast({
      title: '请输入邀请码',
      icon: 'none'
    })
    return
  }

  // 模拟加入成功
  const mockRoom: Room = {
    id: `joined_room_${Date.now()}`,
    name: '加入的同屋',
    description: '通过邀请码加入的同屋',
    avatar: '',
    inviteCode: inviteCode.value,
    members: [userStore.userInfo!],
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString()
  }

  rooms.value.push(mockRoom)
  inviteCode.value = ''

  uni.showToast({
    title: '加入成功',
    icon: 'success'
  })

  // 自动选择加入的同屋
  selectRoom(mockRoom)
}

// 加载同屋列表
const loadRooms = async () => {
  try {
    // 这里应该调用API获取同屋列表
    // 暂时使用模拟数据
    rooms.value = []
  } catch (error) {
    console.error('加载同屋列表失败:', error)
  }
}

// 页面加载
onMounted(() => {
  loadRooms()
})
</script>

<style scoped>
.room-select-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.custom-nav-bar {
  height: 88rpx;
  border-bottom: 1rpx solid #E5E5E5;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 30rpx;
}

.nav-title {
  font-size: 32rpx;
  font-weight: 500;
  color: #333333;
}

.create-btn {
  font-size: 28rpx;
  color: #007AFF;
  background: none;
  border: none;
  padding: 0;
}

.content {
  flex: 1;
  padding: 30rpx;
}

.welcome-section {
  margin-bottom: 40rpx;
}

.welcome-title {
  font-size: 36rpx;
  font-weight: 500;
  color: #333333;
  margin-bottom: 8rpx;
}

.welcome-subtitle {
  font-size: 28rpx;
  color: #666666;
}

.section-title {
  font-size: 32rpx;
  font-weight: 500;
  color: #333333;
  margin-bottom: 20rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 40rpx;
  text-align: center;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #333333;
  margin-bottom: 12rpx;
}

.empty-desc {
  font-size: 26rpx;
  color: #999999;
  line-height: 1.4;
}

.rooms-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.room-card {
  padding: 30rpx;
  border-radius: 16rpx;
  border: 1rpx solid;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.1);
}

.room-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.room-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 12rpx;
  margin-right: 20rpx;
}

.room-avatar-placeholder {
  width: 80rpx;
  height: 80rpx;
  border-radius: 12rpx;
  margin-right: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-text {
  color: #FFFFFF;
  font-size: 32rpx;
  font-weight: bold;
}

.room-info {
  flex: 1;
}

.room-name {
  font-size: 32rpx;
  font-weight: 500;
  color: #333333;
  margin-bottom: 6rpx;
}

.room-desc {
  font-size: 26rpx;
  color: #999999;
}

.room-stats {
  display: flex;
  gap: 30rpx;
  margin-bottom: 20rpx;
}

.stat-item {
  font-size: 24rpx;
  color: #666666;
}

.room-actions {
  display: flex;
  justify-content: flex-end;
}

.action-btn {
  padding: 12rpx 30rpx;
  border-radius: 20rpx;
  border: none;
  font-size: 26rpx;
  color: #FFFFFF;
}

.join-section {
  margin-top: 60rpx;
}

.join-card {
  padding: 30rpx;
  border-radius: 16rpx;
  border: 1rpx solid;
}

.join-input-group {
  display: flex;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.join-input {
  flex: 1;
  height: 72rpx;
  padding: 0 20rpx;
  border: 1rpx solid;
  border-radius: 8rpx;
  font-size: 28rpx;
}

.join-btn {
  width: 120rpx;
  height: 72rpx;
  border-radius: 8rpx;
  border: none;
  color: #FFFFFF;
  font-size: 28rpx;
}

.join-desc {
  font-size: 24rpx;
  color: #999999;
}
</style>
