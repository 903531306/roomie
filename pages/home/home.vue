
<template>
  <view :class="themeClass" class="home-tab-container">
    <!-- 全局背景氛围 -->
    <view class="home-ambient-bg">
      <view class="blob blob-primary"></view>
      <view class="blob blob-secondary"></view>
    </view>
    
    <view class="home-content">
      <!-- 首页头部 -->
      <view class="home-header">
        <view class="header-left">
          <text class="date-label">{{ todayDateLabel }}</text>
          <view class="welcome-box">
            <text class="welcome-text">{{ isLoggedIn ? '你好, ' + user.userNickname : '开启数字家庭生活' }}</text>
            <text class="hand-emoji">{{ isLoggedIn ? '👋' : '✨' }}</text>
          </view>
        </view>
        
        <!-- 修改：头部右侧操作区 -->
        <view class="header-right">
          <view class="msg-entry" @click="goToNotifications">
            <view class="msg-btn-bg">
              <text class="msg-icon">🔔</text>
            </view>
            <view v-if="messageCount>0" class="msg-badge-dot animate-pulse"></view>
          </view>
          <view class="avatar-box" @click="handleAvatarClick">
            <image :src="isLoggedIn ? user.userHeadUrl : 'https://i.pravatar.cc/100?u=guest'" class="main-avatar" />
            <view class="status-badge" :class="{ 'online': isLoggedIn }"></view>
          </view>
        </view>
      </view>

      <!-- 状态分支 1: 未登录 (Guest) - 极光引力卡片 -->
      <view v-if="!isLoggedIn" class="guest-state">
        <view class="aurora-gravity-card" @click="goToLogin">
          <!-- 动态流光背景层 -->
          <view class="aurora-bg">
            <view class="aurora-item aurora-1"></view>
            <view class="aurora-item aurora-2"></view>
            <view class="aurora-item aurora-3"></view>
            <view class="star-dots"></view>
          </view>
          
          <view class="card-inner-content">
            <!-- 悬浮图标区 -->
            <view class="floating-hero">
              <view class="hero-icon-3d">
                <text class="inner-emoji">🏠</text>
                <view class="glow-ring"></view>
              </view>
            </view>
            
            <view class="text-info-center">
              <text class="hero-title-gradient">连接每一位家人</text>
              <text class="hero-subtitle">共享账本 · 协作清单 · 家庭日程</text>
            </view>

            <view class="action-footer">
              <view class="glass-login-btn">
                <text class="btn-text">立即启程</text>
                <view class="btn-arrow">→</view>
              </view>
              <view class="trust-badge">
                <text class="trust-icon">🛡️</text>
                <text class="trust-text">银行级数据加密保护</text>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 模糊预览区 -->
        <view class="preview-section">
          <text class="section-hint">核心功能预览</text>
          <view class="locked-preview-stack">
            <view class="locked-card blur-item">
              <view class="l-card-head">
                <view class="l-icon">💰</view>
                <view class="l-title-placeholder"></view>
              </view>
              <view class="lock-overlay">
                <text class="lock-icon">🔒</text>
                <text class="lock-tip">登录后查看空间数据</text>
              </view>
            </view>
          </view>
        </view>
      </view>


      <!-- 状态分支 2: 已登录且接口确认无房间 (Empty) -->
      <view v-else-if="roomsReady && user.roomsCount === 0" class="empty-state">
        <view class="empty-hero">
          <view class="empty-icon-box">
            <text class="empty-emoji">🍃</text>
          </view>
          <text class="empty-title">空间还是空的</text>
          <text class="empty-desc">这里将展示您最近活跃的协作房间，现在就去创建一个吧！</text>
        </view>
        <button class="create-first-btn" @click="createNewRoom">
          <text class="btn-plus">+</text>
          <text>创建第一个协作空间</text>
        </button>
      </view>

      <!-- 状态分支 3: 已登录 — 首屏骨架，拉取完成后展示列表 -->
      <view v-else class="active-stream">
        <HomeRoomList 
          :loading="!roomsReady || loading"
          :rooms="rooms" 
          :error="isError"
          @select="goToDashboard"
          @openChecklist="goToChecklistCenter"
          @viewAll="goToListAll"
          @invite="triggerInvite"
          @retry="getRoomList"
        />
        
        <!-- 底部创建入口 -->
        <view class="create-room-trigger" @click="createNewRoom">
          <view class="plus-icon-box">+</view>
          <text class="create-txt">开启新的共享空间</text>
        </view>
      </view>
    </view>
    
    <!-- 统一邀请弹窗 -->
    <InviteModal 
      v-model="inviteModalVisible"
      :roomName="activeRoom.name"
      :roomIcon="activeRoom.icon"
      :roomId="activeRoom.id"
    />

    <view class="safe-spacer"></view>
  </view>
</template>

<script setup>
import { useAppTheme } from '@/common/themes/useAppTheme.js'
const { themeClass, primaryColor, softColor, theme } = useAppTheme()

import { ref, onMounted, onUnmounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import InviteModal from '../../components/common/InviteModal.vue';
import HomeRoomList from './HomeRoomList.vue';
import { notificationsApi, roomApi, taskApi } from '../../common/api';
import { mergePendingTaskLists } from '../../common/utils/checklistTaskDisplay.js';
import { coalesce, pickApiList } from '@/common/utils/coalesce.js';
import { SCHEDULE_REFRESH_KEY } from '../../common/utils/scheduleHomePreview.js';
import dataJson from '/data.json';
import { goToLogin, getHomeHeaderDateLabel } from '../js/utils.js';

import {useGlobalShare } from '../js/useGlobalShare.js';

/** 同步读取本地会话，避免首帧先渲染未登录再闪变 */
function readStoredUser() {
  try {
    const u = uni.getStorageSync('userInfo');
    return u && typeof u === 'object' ? u : null;
  } catch {
    return null;
  }
}

const storedUser = readStoredUser() || dataJson.userInfo;
if (storedUser) {
  dataJson.userInfo = storedUser;
  dataJson.isLogin = true;
}

const isLoggedIn = ref(!!(storedUser && dataJson.isLogin));
const user = ref(
  storedUser || { nickname: '', avatar: '', userNickname: '', userHeadUrl: '', roomsCount: 0 }
);
const rooms = ref([]);
const loading = ref(isLoggedIn.value);
const roomsReady = ref(false);
const isError = ref(false);
const todayDateLabel = ref(getHomeHeaderDateLabel());

const refreshTodayDateLabel = () => {
  todayDateLabel.value = getHomeHeaderDateLabel();
};

const applyLogoutState = () => {
  isLoggedIn.value = false;
  user.value = { nickname: '', avatar: '', userNickname: '', userHeadUrl: '', roomsCount: 0 };
  rooms.value = [];
  roomsReady.value = false;
  loading.value = false;
  isError.value = false;
  dataJson.userInfo = null;
  dataJson.isLogin = false;
};

onMounted(() => {
  refreshTodayDateLabel();
  if (isLoggedIn.value) {
    getData();
  }
  uni.$on('refresh_room_data', (data) => {
    if (data) {
      const roomId = Number(data.roomId);
      const room = rooms.value.find((r) => r.id === roomId);
      if (!room) return;
      room.name = data.roomName;
    } else {
      getRoomList();
    }
  });
  uni.$on('checklist_board_refresh', () => {
    if (isLoggedIn.value) getRoomList();
  });
  uni.$on('schedule_board_refresh', () => {
    if (isLoggedIn.value) getRoomList();
  });
  uni.$on('task_ledger_refresh', () => {
    if (isLoggedIn.value) getRoomList();
  });
  uni.$on('user_login', (data) => {
    if (data) {
      isLoggedIn.value = true;
      user.value = dataJson.userInfo || readStoredUser() || user.value;
      roomsReady.value = false;
      loading.value = true;
      getData();
    } else {
      applyLogoutState();
    }
  });
  uni.$on('refresh_notification_count', getMessageCount);
});

onShow(() => {
  refreshTodayDateLabel();
  const saved = readStoredUser();
  if (saved && !isLoggedIn.value) {
    isLoggedIn.value = true;
    user.value = saved;
    dataJson.userInfo = saved;
    dataJson.isLogin = true;
    roomsReady.value = false;
    loading.value = true;
    getData();
    return;
  }

  if (isLoggedIn.value && (uni.getStorageSync(CHECKLIST_REFRESH_KEY) || uni.getStorageSync(SCHEDULE_REFRESH_KEY))) {
    uni.removeStorageSync(CHECKLIST_REFRESH_KEY);
    uni.removeStorageSync(SCHEDULE_REFRESH_KEY);
    getRoomList();
  }
});

const getData=()=>{
	getRoomList();
	getMessageCount();
}

const messageCount=ref(0);
const CHECKLIST_REFRESH_KEY = 'checklist_board_dirty_room';

const getMessageCount=async()=>{
	var res=await notificationsApi.getNotificationReadCount();
	if(res.code==0){
		messageCount.value=res.data.total;
	}
}

onUnmounted(() => {
  uni.$off('refresh_room_data');
  uni.$off('checklist_board_refresh');
  uni.$off('schedule_board_refresh');
  uni.$off('task_ledger_refresh');
  uni.$off('refresh_notification_count');
});

const resolveRoomPrimaryFeature = (room = {}) => {
  if (room.primaryFeature) return room.primaryFeature;
  const featsRaw = room.enabled_features || room.enabledFeatures;
  if (Array.isArray(featsRaw) && featsRaw.length) {
    const first = featsRaw[0];
    return typeof first === 'string' ? first : (first.code || first.name || '');
  }
  if (typeof featsRaw === 'string') {
    try {
      const parsed = JSON.parse(featsRaw);
      if (Array.isArray(parsed) && parsed.length) {
        const first = parsed[0];
        return typeof first === 'string' ? first : (first.code || first.name || '');
      }
    } catch {
      return featsRaw.split(',')[0]?.trim() || '';
    }
  }
  return '';
};

const enrichChecklistRoomTasks = async (roomList = []) => {
  const targets = roomList.slice(0, 3).filter((room) => resolveRoomPrimaryFeature(room) === 'checklist');
  if (!targets.length) return roomList;

  await Promise.all(targets.map(async (room) => {
    try {
      const res = await taskApi.taskAllList({ roomId: room.id });
      if (res?.code != 0) return;
      const pending = pickApiList(res.data, 'pending');
      const overdue = pickApiList(res.data, 'overdue');
      room.homeChecklistTasks = mergePendingTaskLists(pending, overdue);
    } catch (_) {}
  }));

  return roomList;
};

const enrichScheduleRooms = async (roomList = []) => {
  const targets = roomList.slice(0, 3).filter((room) => resolveRoomPrimaryFeature(room) === 'schedule');
  if (!targets.length) return roomList;

  await Promise.all(targets.map(async (room) => {
    try {
      const [scheduleRes, birthdayRes] = await Promise.all([
        taskApi.scheduleList({ roomId: room.id, scheduleType: 'schedule' }),
        taskApi.scheduleList({ roomId: room.id, scheduleType: 'birthday' })
      ]);
      const rows = [
        ...(scheduleRes?.code === 0 ? scheduleRes.data?.rows || [] : []),
        ...(birthdayRes?.code === 0 ? birthdayRes.data?.rows || [] : [])
      ];
      room.schedules = rows;
      room.schedulesJson = rows;
    } catch (_) {}
  }));

  return roomList;
};

const getRoomList = async () => {
  if (!dataJson.isLogin) return;
  loading.value = true;
  isError.value = false;
  try {
    const res = await roomApi.getRoomList();
    if (res.code === 0) {
      const list = res.data || [];
      await enrichChecklistRoomTasks(list);
      await enrichScheduleRooms(list);
      rooms.value = list;
    }
    const count = rooms.value?.length || 0;
    user.value.roomsCount = count;
    if (dataJson.userInfo) {
      dataJson.userInfo.roomsCount = count;
      uni.setStorageSync('userInfo', dataJson.userInfo);
    }
  } catch (e) {
    isError.value = true;
  } finally {
    loading.value = false;
    roomsReady.value = true;
  }
};

const goToNotifications = () => {
  uni.navigateTo({ url: '/pages/notifications/notifications' });
};

const handleAvatarClick = () => {
  if (isLoggedIn.value) {
    // uni.navigateTo({ url: '/pages/profile-settings/profile-settings' });
  } else {
    goToLogin();
  }
};

// const goToLogin = () => uni.navigateTo({ url: '/pages/login/login' });

const inviteModalVisible = ref(false);
const activeRoom = ref({});
const triggerInvite = (room) => {
  activeRoom.value = room;
  // inviteModalVisible.value = true;
   uni.navigateTo({ url: `/pages/dashboard/dashboard?name=${room.name}&roomId=${room.id}` })
};

const resolveRoomAccountId = (room = {}) => {
  if (room.accountId != null && room.accountId !== '') return room.accountId;
  let accounts = room.accountsList || room.accounts;
  if (typeof accounts === 'string') {
    try { accounts = JSON.parse(accounts); } catch { accounts = []; }
  }
  if (Array.isArray(accounts) && accounts.length) {
    const first = accounts[0];
    return coalesce(first && first.id, 0);
  }
  return 0;
};

const goToChecklistCenter = (room) => {
  const accountId = resolveRoomAccountId(room);
  uni.navigateTo({
    url: `/pages/checklist-center/checklist-center?roomId=${room.id}&accountId=${accountId}`
  });
};

const goToDashboard = (room) => uni.navigateTo({ url: `/pages/dashboard/dashboard?name=${room.name}&roomId=${room.id}` });
const goToListAll = () => uni.navigateTo({ url: `/pages/room-list/room-list` });
const createNewRoom = () => {
  if (!goToLogin()) {
    return;
  }
  uni.navigateTo({ url: '/pages/create-room/create-room' });
};
</script>

<style scoped>
.home-tab-container {
  min-height: 100vh;
  position: relative;
  background-color: var(--primary-soft, #EEF2FF);
  transition: background-color 0.35s ease;
}
.home-ambient-bg { position: absolute; inset: 0; pointer-events: none; }
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.12;
  transition: background 0.35s ease;
}
.blob-primary {
  top: -40px;
  right: -40px;
  width: 300px;
  height: 300px;
  background: var(--primary-color, #4F46E5);
}
.blob-secondary {
  bottom: 20%;
  left: -60px;
  width: 260px;
  height: 260px;
  background: var(--secondary-color, #7C3AED);
}

.home-content { position: relative; z-index: 1; padding: 80px 24px 0; }
.home-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
.date-label { font-size: 11px; font-weight: 900; color: #94A3B8; text-transform: uppercase; letter-spacing: 2px; }
.welcome-text { font-size: 26px; font-weight: 900; color: #1E293B; margin-top: 6px; letter-spacing: -1px; }

/* 头部右侧操作区 */
.header-right { display: flex; align-items: center; gap: 14px; }
.msg-entry { position: relative; }
.msg-btn-bg { 
  width: 48px; height: 48px; background: rgba(255, 255, 255, 0.6); 
  backdrop-filter: blur(10px); border-radius: 16px; 
  display: flex; align-items: center; justify-content: center; 
  border: 1px solid rgba(255, 255, 255, 0.8);
}
.msg-btn-bg:active { transform: scale(0.92); }
.msg-icon { font-size: 20px; }
.msg-badge-dot { 
  position: absolute; top: 10px; right: 10px; width: 8px; height: 8px; 
  background: #F43F5E; border-radius: 50%; border: 2px solid #fff; 
}

.avatar-box { position: relative; }
.main-avatar { width: 54px; height: 54px; border-radius: 18px; border: 3px solid #fff; box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
.status-badge { position: absolute; bottom: -2px; right: -2px; width: 14px; height: 14px; background: #CBD5E1; border: 3px solid #fff; border-radius: 50%; }
.status-badge.online { background: #10B981; }

/* 极光引力卡片 - 跟随主题色 */
.aurora-gravity-card {
  position: relative;
  height: 380px;
  border-radius: 50px;
  overflow: hidden;
  background: linear-gradient(
    155deg,
    var(--primary-color, #4f46e5) 0%,
    var(--secondary-color, #7c3aed) 100%
  );
  box-shadow: 0 28px 64px var(--primary-glow, rgba(79, 70, 229, 0.28));
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  flex-direction: column;
  animation: floatCard 6s ease-in-out infinite;
  transition: background 0.35s ease, box-shadow 0.35s ease;
}
@keyframes floatCard { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

.aurora-bg { position: absolute; inset: 0; overflow: hidden; }
.aurora-item {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.45;
  transition: background 0.35s ease;
}
.aurora-1 {
  width: 300px;
  height: 300px;
  background: var(--primary-color, #4f46e5);
  top: -100px;
  left: -100px;
  animation: moveAurora1 20s linear infinite;
}
.aurora-2 {
  width: 350px;
  height: 350px;
  background: var(--secondary-color, #7c3aed);
  bottom: -100px;
  right: -50px;
  animation: moveAurora2 25s linear infinite;
}
.aurora-3 {
  width: 250px;
  height: 250px;
  background: #fff;
  opacity: 0.18;
  top: 10%;
  right: -80px;
  animation: moveAurora1 15s linear reverse infinite;
}

@keyframes moveAurora1 { 0% { transform: translate(0,0) scale(1); } 50% { transform: translate(40px, 30px) scale(1.1); } 100% { transform: translate(0,0) scale(1); } }
@keyframes moveAurora2 { 0% { transform: translate(0,0) rotate(0); } 100% { transform: translate(-20px, -40px) rotate(360deg); } }

.star-dots { 
  position: absolute; inset: 0; 
  background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0);
  background-size: 24px 24px;
}

.card-inner-content {
  position: relative; z-index: 2; height: 100%;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 40px;
}

.floating-hero { margin-bottom: 30px; }
.hero-icon-3d {
  width: 100px; height: 100px; background: rgba(255,255,255,0.08);
  border-radius: 35px; border: 1px solid rgba(255,255,255,0.2);
  display: flex; align-items: center; justify-content: center;
  position: relative; backdrop-filter: blur(10px);
}
.inner-emoji { font-size: 54px; text-shadow: 0 10px 20px rgba(0,0,0,0.3); }
.glow-ring {
  position: absolute;
  inset: -10px;
  border: 2px solid rgba(255, 255, 255, 0.45);
  border-radius: 42px;
  animation: pulseGlow 3s ease-in-out infinite;
  box-shadow: 0 0 24px var(--primary-glow, rgba(79, 70, 229, 0.35));
}
@keyframes pulseGlow { 0% { transform: scale(0.9); opacity: 0; } 50% { transform: scale(1.05); opacity: 0.5; } 100% { transform: scale(1.15); opacity: 0; } }

.text-info-center { text-align: center; margin-bottom: 40px; }
.hero-title-gradient {
  font-size: 28px; font-weight: 900; letter-spacing: -1px; display: block;
  background: linear-gradient(to right, #fff, #CBD5E1); -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.hero-subtitle { font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.5); margin-top: 10px; letter-spacing: 1px; text-transform: uppercase; }

.action-footer { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 20px; }
.glass-login-btn {
  width: 100%;
  height: 68px;
  background: #fff;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.glass-login-btn:active { transform: scale(0.96); opacity: 0.95; }
.btn-text {
  font-size: 17px;
  font-weight: 900;
  color: var(--primary-color, #4f46e5);
  transition: color 0.35s ease;
}
.btn-arrow {
  font-size: 20px;
  font-weight: 900;
  color: var(--primary-color, #4f46e5);
  transition: color 0.35s ease;
}

.trust-badge { display: flex; align-items: center; gap: 8px; }
.trust-icon { font-size: 14px; }
.trust-text { font-size: 11px; font-weight: 800; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.5px; }

/* 预览区 */
.preview-section { margin-top: 40px; }
.section-hint {
  font-size: 11px;
  font-weight: 900;
  color: var(--primary-color, #4f46e5);
  opacity: 0.45;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 16px;
  display: block;
  text-align: center;
  transition: color 0.35s ease;
}
.locked-card {
  background: #fff;
  height: 120px;
  border-radius: 36px;
  padding: 24px;
  border: 1.5px dashed var(--primary-soft, #eef2ff);
  position: relative;
  overflow: hidden;
  filter: grayscale(0.2);
  opacity: 0.85;
  box-shadow: 0 8px 24px var(--primary-glow, rgba(79, 70, 229, 0.06));
  transition: border-color 0.35s ease, box-shadow 0.35s ease;
}
.lock-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(8px);
}
.lock-icon { font-size: 20px; opacity: 0.55; }
.lock-tip {
  font-size: 12px;
  font-weight: 900;
  color: var(--primary-color, #4f46e5);
  opacity: 0.75;
  transition: color 0.35s ease;
}

/* 空状态 */
.empty-state { text-align: center; padding: 40px 20px; }
.empty-icon-box { width: 100px; height: 100px; background: #fff; border-radius: 35px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.03); }
.empty-emoji { font-size: 50px; }
.empty-title { font-size: 20px; font-weight: 900; color: #1E293B; display: block; margin-bottom: 12px; }
.empty-desc { font-size: 14px; font-weight: 600; color: #94A3B8; line-height: 1.6; }
.create-first-btn {
  margin-top: 10px;
  background: var(--primary-color, #4F46E5);
  color: #fff;
  height: 64px;
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 16px;
  font-weight: 900;
  box-shadow: 0 10px 25px var(--primary-glow, rgba(79, 70, 229, 0.2));
  transition: background 0.35s ease, box-shadow 0.35s ease;
}

/* 创建按钮：白底 + 主题色描边，避免与 soft 背景融在一起 */
.create-room-trigger {
  height: 60px;
  border-radius: 28px;
  border: 2px dashed var(--primary-color, #4F46E5);
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 24px;
  margin-bottom: 40px;
  box-shadow: 0 8px 24px var(--primary-glow, rgba(79, 70, 229, 0.14));
  transition: border-color 0.35s ease, box-shadow 0.35s ease, transform 0.2s ease;
}
.create-room-trigger:active { transform: scale(0.98); opacity: 0.92; }
.plus-icon-box {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--primary-soft, #EEF2FF);
  color: var(--primary-color, #4F46E5);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 900;
  transition: background 0.35s ease, color 0.35s ease;
}
.create-txt {
  font-size: 14px;
  font-weight: 800;
  color: var(--primary-color, #4F46E5);
  transition: color 0.35s ease;
}

.animate-fade-in { animation: fadeIn 0.5s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.safe-spacer { height: 100px; }
</style>
