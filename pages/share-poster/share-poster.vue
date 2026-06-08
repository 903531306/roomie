
<template>
  <view :class="themeClass" class="home-tab-container">
    <!-- 全局背景氛围 -->
    <view class="home-ambient-bg">
      <view class="blob blob-indigo"></view>
      <view class="blob blob-blue"></view>
    </view>
    
    <!-- 全封装容器：自动处理下拉/上拉/手势 -->
    <FluidRefresh 
      :isRefreshing="isRefreshing"
      :isLoadingMore="isLoadingMore"
      :hasMore="hasMore"
      @refresh="onPullDownRefresh"
      @loadMore="onReachBottom"
    >
      <view class="home-content">
        <!-- 首页头部 -->
        <view class="home-header">
          <view class="header-left">
            <text class="date-label">11月21日 · 星期四</text>
            <view class="welcome-box">
              <text class="welcome-text">{{ isLoggedIn ? '你好, ' + user.userNickname : '开启数字家庭生活' }}</text>
              <text class="hand-emoji">{{ isLoggedIn ? '👋' : '✨' }}</text>
            </view>
          </view>
          
          <view class="header-right-actions">
            <!-- 新增：分享名片入口 -->
            <view class="action-btn-circle" @click="goToShare">
              <text class="btn-emoji">🖼️</text>
              <view class="btn-badge-dot"></view>
            </view>
            
            <view class="avatar-box" @click="handleAvatarClick">
              <image :src="isLoggedIn ? user.avatar : 'https://i.pravatar.cc/100?u=guest'" class="main-avatar" />
              <view class="status-badge" :class="{ 'online': isLoggedIn }"></view>
            </view>
          </view>
        </view>

        <!-- 已登录状态房间列表 -->
        <view v-if="isLoggedIn && (rooms.length > 0 || loading)" class="active-stream">
   <!--       <HomeRoomList 
            :loading="loading"
            :rooms="rooms" 
            @select="goToDashboard"
            @viewAll="goToListAll"
            @invite="triggerInvite"
          />
          <view class="create-room-trigger" @click="createNewRoom">
            <view class="plus-icon-box">+</view>
            <text class="create-txt">开启新的共享空间</text>
          </view> -->
        </view>

        <!-- 未登录状态卡片 -->
        <view v-else-if="!isLoggedIn" class="guest-state animate-fade-in">
          <view class="aurora-gravity-card" @click="goToLogin">
             <view class="card-inner-content">
               <text class="hero-title-gradient">连接每一位家人</text>
               <view class="glass-login-btn"><text class="btn-text">立即启程</text></view>
             </view>
          </view>
        </view>
      </view>
    </FluidRefresh>
    
    <InviteModal 
      v-model="inviteModalVisible"
      :roomName="activeRoom.name"
      :roomIcon="activeRoom.icon"
      :roomId="activeRoom.id"
    />
  </view>
</template>

<script setup>
import { useAppTheme } from '@/common/themes/useAppTheme.js'
const { themeClass, primaryColor, softColor, theme } = useAppTheme()

import { ref, onMounted, onUnmounted } from 'vue';
import FluidRefresh from '../../components/common/FluidRefresh.vue';
import InviteModal from '../../components/common/InviteModal.vue';
import { roomApi } from '../../common/api';
import dataJson from '/data.json';

const isLoggedIn = ref(false);
const user = ref({ userNickname: '', avatar: '' });
const rooms = ref([]);
const loading = ref(false);

const isRefreshing = ref(false);
const isLoadingMore = ref(false);
const hasMore = ref(true);

onMounted(() => {
  const savedUser = uni.getStorageSync('userInfo');
  if (savedUser) {
    isLoggedIn.value = true;
    user.value = savedUser;
    getRoomList();
    uni.$on('refresh_room_data', () => getRoomList());
  }
});

onUnmounted(() => uni.$off('refresh_room_data'));

const getRoomList = async (append = false) => {
  if (!dataJson.isLogin) return;
  if (append) isLoadingMore.value = true;
  else loading.value = true;

  try {
    const res = await roomApi.getRoomList();
    if (res.code == 0) {
      if (append) {
        rooms.value = [...rooms.value, ...res.data];
        if (rooms.value.length > 20) hasMore.value = false;
      } else {
        rooms.value = res.data;
        hasMore.value = true;
      }
    }
  } finally {
    loading.value = false;
    isRefreshing.value = false;
    isLoadingMore.value = false;
  }
};

const onPullDownRefresh = () => {
  isRefreshing.value = true;
  getRoomList();
};

const onReachBottom = () => {
  if (!isLoggedIn.value || isLoadingMore.value || !hasMore.value) return;
  getRoomList(true);
};

const handleAvatarClick = () => isLoggedIn.value ? uni.navigateTo({ url: '/pages/profile-settings/profile-settings' }) : goToLogin();
const goToLogin = () => uni.navigateTo({ url: '/pages/login/login' });

// 跳转至分享名片页
const goToShare = () => uni.navigateTo({ url: '/pages/share-poster/share-poster' });

const inviteModalVisible = ref(false);
const activeRoom = ref({});
const triggerInvite = (room) => { activeRoom.value = room; inviteModalVisible.value = true; };
const goToDashboard = (room) => uni.navigateTo({ url: `/pages/dashboard/dashboard?name=${room.name}&roomId=${room.id}` });
const goToListAll = () => uni.navigateTo({ url: `/pages/room-list/room-list` });
const createNewRoom = () => isLoggedIn.value ? uni.navigateTo({ url: '/pages/create-room/create-room' }) : goToLogin();
</script>

<style scoped>
.home-tab-container { height: 100vh; background-color: #F8FAFC; position: relative; overflow: hidden; }

.home-ambient-bg { position: absolute; inset: 0; pointer-events: none; }
.blob { position: absolute; border-radius: 50%; filter: blur(120px); opacity: 0.12; }
.blob-indigo { top: -40px; right: -40px; width: 300px; height: 300px; background: var(--primary-color, #4F46E5); }
.blob-blue { bottom: 20%; left: -60px; width: 260px; height: 260px; background: #38BDF8; }

.home-content { position: relative; z-index: 1; padding: 64px 24px 0; }
.home-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.date-label { font-size: 11px; font-weight: 900; color: #94A3B8; text-transform: uppercase; letter-spacing: 2px; }
.welcome-text { font-size: 26px; font-weight: 900; color: #1E293B; margin-top: 6px; letter-spacing: -1px; }

.header-right-actions { display: flex; align-items: center; gap: 16px; }

/* 分享入口按钮 */
.action-btn-circle {
  width: 44px; height: 44px; background: #fff; border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 8px 15px rgba(0,0,0,0.03); border: 1px solid #F1F5F9;
  position: relative; transition: all 0.2s;
}
.action-btn-circle:active { transform: scale(0.92); background: #F8FAFC; }
.btn-emoji { font-size: 20px; }
.btn-badge-dot { 
  position: absolute; top: -2px; right: -2px; width: 10px; height: 10px;
  background: #F43F5E; border: 2px solid #fff; border-radius: 50%;
}

.avatar-box { position: relative; }
.main-avatar { width: 54px; height: 54px; border-radius: 18px; border: 3px solid #fff; box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
.status-badge { position: absolute; bottom: -2px; right: -2px; width: 14px; height: 14px; background: #CBD5E1; border: 3px solid #fff; border-radius: 50%; }
.status-badge.online { background: #10B981; }

.aurora-gravity-card { position: relative; height: 260px; border-radius: 40px; background: #0F172A; overflow: hidden; display: flex; align-items: center; justify-content: center; }
.hero-title-gradient { font-size: 24px; font-weight: 900; color: #fff; }
.glass-login-btn { margin-top: 20px; background: #fff; padding: 12px 30px; border-radius: 100px; }
.btn-text { font-weight: 900; color: #0F172A; }

.create-room-trigger { height: 64px; border-radius: 24px; border: 2px dashed #E2E8F0; display: flex; align-items: center; justify-content: center; gap: 12px; color: #94A3B8; margin-top: 24px; margin-bottom: 40px; }
.plus-icon-box { width: 28px; height: 28px; border-radius: 8px; background: #F1F5F9; display: flex; align-items: center; justify-content: center; font-size: 18px; }

.animate-fade-in { animation: fadeIn 0.5s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>
