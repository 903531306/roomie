<template>
  <view :class="themeClass" class="list-container">
    <view class="page-ambient" aria-hidden="true">
      <view class="ambient-blob blob-primary"></view>
      <view class="ambient-blob blob-secondary"></view>
    </view>
    <IosNav 
      title="我的所有空间" 
      @leftClick="goBack" 
      @rightClick="onAddRoom" 
      rightIcon="+" 
    />

    <!-- 搜索区域 -->
    <view class="search-section">
      <view class="search-bar">
        <text class="search-icon">🔍</text>
        <input class="search-input" placeholder="输入房间名称搜索..." placeholder-style="color: #94A3B8" />
      </view>
    </view>

    <!-- 列表区域：增加左右内边距 -->
    <scroll-view scroll-y class="list-scroll-view" :show-scrollbar="false">
      <view class="room-cards-stack">
        <view 
          v-for="(room, index) in roomsWithMembers" 
          :key="room.id" 
          class="modern-room-card animate-fade-in"
          :style="{ animationDelay: (index * 0.08) + 's' }"
          @click="goToDashboard(room)"
        >
          <!-- 卡片上部：核心信息 -->
          <view class="card-upper">
            <view class="room-identity">
              <view class="room-icon-outer" :style="{ background: room.bgColor }">
                <image v-if="isImageUrl(room.icon)" :src="room.icon" mode="aspectFill" class="room-icon-img" />
                <text v-else class="room-emoji">{{ room.icon }}</text>
              </view>
              <view class="room-text">
                <text class="room-name">{{ room.name }}</text>
                <view class="room-status-row">
                  <view class="pulse-dot"></view>
                  <text class="status-txt">活跃中</text>
                </view>
              </view>
            </view>
            <view class="arrow-btn">›</view>
          </view>

          <!-- 分割线 -->
          <view class="card-divider"></view>

          <!-- 卡片下部：成员与时间 (确保头像有独立空间) -->
          <view class="card-lower">
            <view class="member-preview">
              <view class="avatar-stack">
                <view 
                  v-for="(member, idx) in (room.membersArray || []).slice(0, 3)"
                  :key="idx" 
                  class="avt-item"
                  :style="{ marginLeft: idx === 0 ? '0' : '-16rpx', zIndex: 10 - idx }"
                >
                  <image :src="member.avatar || `https://i.pravatar.cc/100?u=h${room.id}${idx}`" class="avt-img" />
                </view>
                <view v-if="room.membersArray && room.membersArray.length > 3" class="avt-more">
                  <text class="more-txt">+{{ room.membersArray.length - 3 }}</text>
                </view>
              </view>
              <text class="member-count-label">{{ (room.membersArray || []).length }} 位家庭成员</text>
            </view>
            
            <view class="update-info">
              <text class="update-label">最后更新</text>
              <text class="update-time">{{ formatRelativeTime(room.updateAt) }}</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 底部安全区域占位 -->
      <view class="safe-bottom-spacer"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { useAppTheme } from '@/common/themes/useAppTheme.js'
const { themeClass, primaryColor, softColor, theme } = useAppTheme()

import { ref, onMounted, computed } from 'vue';
import IosNav from '../../components/nav/ios-nav.vue';
import { roomApi } from '../../common/api';
import { formatRelativeTime } from '../../pages/js/utils.js';

const rooms = ref([]);

const isImageUrl = (val) => {
  if (typeof val !== 'string') return false;
  const v = val.toLowerCase();
  return v.startsWith('http') || v.startsWith('/') || v.startsWith('data:image') || v.includes('.png') || v.includes('.jpg') || v.includes('.jpeg') || v.includes('.webp');
};

onMounted(() => {
  getRoomList();
});

const getRoomList = async () => {
  var res = await roomApi.getRoomList();
  if (res.code == 0) {
    rooms.value = res.data;
  }
}

const roomsWithMembers = computed(() => {
  return (rooms.value || []).map(room => {
    const membersRaw = room.members
    let membersArray = []
    if (!membersRaw) membersArray = []
    else if (Array.isArray(membersRaw)) membersArray = membersRaw
    else {
      try { membersArray = JSON.parse(membersRaw) }
      catch { membersArray = [] }
    }

    return {
      ...room,
      membersArray,
      // 如果后端没返回 bgColor，默认给个浅灰色
      bgColor: room.bgColor || '#F8FAFC'
    }
  })
})

const goBack = () => uni.navigateBack();
const onAddRoom = () => uni.navigateTo({ url: '/pages/create-room/create-room' });
const goToDashboard = (room) => uni.navigateTo({ url: `/pages/dashboard/dashboard?name=${room.name}&roomId=${room.id}` });
</script>

<style scoped>
.list-container { 
  background-color: var(--primary-soft, #EEF2FF);
  height: 100vh; 
  display: flex; 
  flex-direction: column; 
  overflow: hidden;
  position: relative;
  transition: background-color 0.35s ease;
}

.page-ambient { position: absolute; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
.ambient-blob { position: absolute; border-radius: 50%; filter: blur(120px); opacity: 0.12; transition: background 0.35s ease; }
.blob-primary { top: -40px; right: -40px; width: 280px; height: 280px; background: var(--primary-color, #4F46E5); }
.blob-secondary { bottom: 15%; left: -60px; width: 240px; height: 240px; background: var(--secondary-color, #7C3AED); }

.search-section { 
  padding: 16px 20px; 
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(20px);
  position: relative;
  z-index: 1;
}
.search-bar { 
  background: var(--primary-soft, #EEF2FF); 
  height: 48px; 
  border-radius: 14px; 
  display: flex; 
  align-items: center; 
  padding: 0 16px; 
  gap: 12px; 
}
.search-icon { font-size: 14px; opacity: 0.3; }
.search-input { flex: 1; font-size: 14px; font-weight: 600; color: #1E293B; }

.list-scroll-view { 
  flex: 1; 
  height: 0;
  position: relative;
  z-index: 1;
}

.room-cards-stack { 
  padding: 20px; 
  display: flex; 
  flex-direction: column; 
}

/* 现代化卡片重构 */
.modern-room-card {
  background: #fff;
  border-radius: 32px;
  padding: 15px 20px;
  margin-bottom: 20px;
  border: 1px solid #F1F5F9;
  box-shadow: 0 4px 20px var(--primary-glow, rgba(0,0,0,0.01));
  display: flex;
  flex-direction: column;
  transition: border-color 0.35s ease, box-shadow 0.35s ease;
}

.modern-room-card:active {
  transform: scale(0.98);
  background: #FAFAFA;
  border-color: var(--primary-color, #4F46E5);
}

.card-upper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.room-identity {
  display: flex;
  align-items: center;
  gap: 16px;
}

.room-icon-outer {
  width: 52px;
  height: 52px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.room-emoji { font-size: 24px; }
.room-icon-img { width: 32px; height: 32px; border-radius: 8px; }

.room-text {
  display: flex;
  flex-direction: column;
}
.room-name {
  font-size: 17px;
  font-weight: 900;
  color: #1E293B;
  letter-spacing: -0.5px;
}
.room-status-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}
.pulse-dot {
  width: 6px;
  height: 6px;
  background: #10B981;
  border-radius: 50%;
}
.status-txt {
  font-size: 11px;
  font-weight: 800;
  color: #94A3B8;
  text-transform: uppercase;
}

.arrow-btn {
  font-size: 24px;
  color: var(--primary-color, #4F46E5);
  font-weight: 300;
  opacity: 0.7;
}

.card-divider {
  height: 1px;
  background: #F8FAFC;
  width: 100%;
  margin-bottom: 10px;
}

.card-lower {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.member-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.avatar-stack {
  display: flex;
  align-items: center;
}
.avt-item {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 4rpx solid #fff;
  overflow: hidden;
  background: #F1F5F9;
}
.avt-img { width: 100%; height: 100%; }

.avt-more {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #F8FAFC;
  border: 4rpx solid #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: -16rpx;
  z-index: 1;
}
.more-txt { font-size: 10px; font-weight: 900; color: #94A3B8; }

.member-count-label {
  font-size: 11px;
  font-weight: 800;
  color: #CBD5E1;
}

.update-info {
  text-align: right;
  display: flex;
  flex-direction: column;
}
.update-label {
  font-size: 10px;
  font-weight: 800;
  color: #CBD5E1;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.update-time {
  font-size: 13px;
  font-weight: 800;
  color: #94A3B8;
  margin-top: 2px;
}

.safe-bottom-spacer {
  height: calc(100px + env(safe-area-inset-bottom));
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out both;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>