<template>
  <view class="dash-container" :class="themeClass">
    <IosNav :title="isLoading ? '加载中...' : (isError ? '加载失败' : roomName)" @leftClick="goBack" />

    <!-- 成员栏放在 scroll-view 外，避免小程序内点击/弹层异常 -->
    <view v-if="isLoading" class="member-management-bar skeleton-mode">
      <view class="member-list-scroll">
        <view class="avt-content">
          <view v-for="i in 4" :key="i" class="sk-avt-ring shimmer"></view>
        </view>
        <view class="sk-pill shimmer"></view>
      </view>
    </view>
    <view v-else-if="!isError" class="member-management-bar animate-fade-in">
      <view class="member-list-scroll">
        <view class="avt-content">
          <view
            class="avt-item"
            v-for="(member, i) in (roomMembers || [])"
            :key="member.userId || i"
          >
            <view class="avt-ring">
              <image :src="member.avatar || `https://i.pravatar.cc/100?u=dmem${i}`" class="member-avt" />
            </view>
            <view v-if="i === 0" class="admin-crown-badge">
              <text class="crown-icon">👑</text>
            </view>
          </view>
        </view>
        <view class="action-pills-group">
          <view class="action-pill-btn" hover-class="pill-pressed" @tap.stop="handleInvite">
            <view class="pill-inner invite">
              <text class="p-icon">+</text>
              <text class="p-label">邀请</text>
            </view>
          </view>
          <view
            v-if="isRoomOwner"
            class="action-pill-btn"
            hover-class="pill-pressed"
            @tap.stop="openSettings"
          >
            <view class="pill-inner setting">
              <text class="p-icon">⚙️</text>
              <text class="p-label">管理</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 主滚动区域 -->
    <scroll-view scroll-y class="main-body-scroll" :show-scrollbar="false" enable-back-to-top>
      <view class="dash-content-wrapper">
        
        <!-- 1. 骨架屏：精细化布局 -->
        <block v-if="isLoading">
          <view class="tab-switcher-sk-wrap">
            <view class="tab-item-sk shimmer" v-for="i in 4" :key="i"></view>
          </view>
          <view class="dash-content-inner">
            <view v-for="i in 2" :key="i" class="sk-content-card shimmer"></view>
          </view>
        </block>

        <!-- 2. 加载错误视图 -->
        <block v-else-if="isError">
          <view class="error-container animate-fade-in">
            <view class="error-visual">
              <view class="error-pulse"></view>
              <text class="error-emoji">📡</text>
            </view>
            <text class="error-title">数据加载遇到了障碍</text>
            <text class="error-subtitle">这可能是由于网络不稳定导致的，请尝试点击下方按钮重新获取。</text>
            <button class="retry-action-btn" @click="initDashboard">
              <text class="retry-txt">重新尝试加载</text>
            </button>
          </view>
        </block>

        <!-- 3. 正常数据展示 -->
        <block v-else>
          <view v-if="filteredTabs.length >= 2" class="tab-switcher-sticky-wrap">
            <view class="tab-blur-bg"></view>
            <scroll-view scroll-x class="tab-switcher-scroll" :show-scrollbar="false">
              <view class="tab-switcher">
                <view v-for="tab in filteredTabs" :key="tab.id" class="tab-item" :class="{ active: currentTab === tab.code }" @click="currentTab = tab.code">
                  <text class="tab-text">{{ tab.name }}</text>
                  <view v-if="currentTab === tab.code" class="active-line"></view>
                </view>
              </view>
            </scroll-view>
          </view>

          <view class="dash-content-inner">
            <DashboardCombo v-if="currentTab === 'combo'&&roomDetail" :roomId="dashRoomId" />
           <DashboardLedger
             v-else-if="currentTab === 'ledger' && roomDetail"
             :roomId="dashRoomId"
			 :roomDetail="roomDetail"
             :accountId="dashAccountId"
           />

            <DashboardChecklist v-else-if="currentTab === 'checklist'&&roomDetail" :roomId="dashRoomId" :accountId="dashAccountId"/>
            <DashboardSchedule v-else-if="currentTab === 'schedule'&&roomDetail" :roomId="dashRoomId"/>
          </view>
        </block>
      </view>
    </scroll-view>

    <InviteModal 
    		  v-model="showInviteModal" 
    		  :inviteCode="roomDetail?.inviteToken || ''"
    		  :roomName="roomName || '我的空间'"
    		  :roomIcon="roomIcon || '🏠'"
    		  :roomId="dashRoomId"
          :themeColor="primaryColor"
    		  @share="handleShare"
    		/>
    
    <!-- FABs -->
    <view class="fab-primary" @click="onFabClick" v-if="!isLoading && !isError && isCreate && (currentTab === 'ledger' || currentTab === 'combo')">
      <view class="fab-icon-box">+</view>
      <text class="fab-label-txt">{{ currentTab === 'combo' ? '新建生活目标' : '记一笔支出' }}</text>
    </view>

    <view class="fab-multi-container" v-if="!isLoading && !isError && currentTab === 'schedule'">
      <view v-if="isFabOpen" class="fab-overlay-blur" @click="isFabOpen = false"></view>
      <view class="fab-menu-stack" :class="{ 'is-open': isFabOpen }">
        <view class="fab-menu-panel">
          <view class="fab-menu-item" @click="handleScheduleTrigger('daily')">
            <text class="fab-menu-icon">📅</text>
            <text class="fab-menu-text">新建行程安排</text>
          </view>
          <view class="fab-menu-divider"></view>
          <view class="fab-menu-item" @click="handleScheduleTrigger('birthday')">
            <text class="fab-menu-icon">🎂</text>
            <text class="fab-menu-text">录入家人生日</text>
          </view>
        </view>
      </view>
      <view class="fab-main-trigger" :class="{ 'is-active': isFabOpen }" @click="isFabOpen = !isFabOpen">
        <text class="plus-sym">{{ isFabOpen ? '✕' : '+' }}</text>
      </view>
    </view>

    <RoomSettingsModal 
	  @manageMember="handleSeeingMember"
      v-model="showRoomSettings" 
      :roomName="roomName" 
      @save="handleSaveRoomSettings"
      @delete="handleDeleteRoom"
    />

    <!-- 任务详情抽屉 -->
    <ChecklistTaskDrawer
      v-model="isDrawerVisible"
      :initial-task="drawerInitialTask"
      :room-members="roomMembers"
      :room-id="dashRoomId"
      :account-id="dashAccountId"
      @save="handleTaskDrawerSave"
      @delete="handleTaskDrawerDelete"
      @add-ledger="handleDrawerAddLedger"
    />

    <!-- 日程/生日创建 -->
    <ScheduleCreateModal 
      v-model="isScheduleModalVisible"
      :initialType="scheduleModalType"
      :initialDate="scheduleCurrentDate"
      :editRecord="scheduleEditRecord"
      @confirm="handleScheduleConfirm"
      @delete="handleScheduleDelete"
    />

    <!-- 操作选单 -->
    <view v-if="showActionSheet" class="global-fixed-mask" :class="[themeClass, { 'mask-closing': isClosing }]" @click="closeSheet" @touchmove.stop.prevent>
      <view class="global-fixed-action-sheet" :style="{ transform: `translateY(${panelY}px)` }" @click.stop @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd">
        <view class="modal-handle"></view>
        <view class="sheet-header-box"><text class="sheet-top-label">快速操作</text><text class="sheet-task-title">{{ selectedTask?.title }}</text></view>
        <view class="action-card-group">
          <view class="action-cell" @click="handleActionEdit"><view class="cell-icon-wrap blue"><text class="c-emoji">✏️</text></view><view class="cell-text-info"><text class="cell-main-name">编辑任务详情</text><text class="cell-sub-desc">修改标题、备注或经办人</text></view><text class="cell-arrow-icon">›</text></view>
          <view class="action-cell danger" @click="handleActionDelete"><view class="cell-icon-wrap red"><text class="c-emoji">🗑️</text></view><view class="cell-text-info"><text class="cell-main-name red-text">彻底删除任务</text><text class="cell-sub-desc">删除后不可恢复</text></view><text class="cell-arrow-icon red-text">›</text></view>
        </view>
        <view class="sheet-footer"><button class="sheet-cancel-pill" @click="closeSheet">取消</button></view>
      </view>
    </view>

  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { onLoad, onShow } from "@dcloudio/uni-app";
import IosNav from '../../components/nav/ios-nav.vue';
import InviteModal from '../../components/common/InviteModal.vue';
import ScheduleCreateModal from '../../components/common/ScheduleCreateModal.vue';
import RoomSettingsModal from '../../components/common/RoomSettingsModal.vue';
import DashboardLedger from '../../components/dashboard/DashboardLedger.vue';
import DashboardChecklist from '../../components/dashboard/DashboardChecklist.vue';
import DashboardSchedule from '../../components/dashboard/DashboardSchedule.vue';
import DashboardCombo from '../../components/dashboard/DashboardCombo.vue';
import ChecklistTaskDrawer from '../../components/checklist/ChecklistTaskDrawer.vue';
import { roomApi, taskApi } from '../../common/api';
import dataJson from '/data.json';
import { getTimeStr, getDateStr } from '../js/utils.js';
import {useGlobalShare } from '../js/useGlobalShare.js';
import { useAppTheme } from '@/common/themes/useAppTheme.js';
import { getScheduleSaveToast } from '@/common/utils/wechatSubscribe.js';
import { coalesce } from '@/common/utils/coalesce.js';

const { themeClass, primaryColor } = useAppTheme();


// onShareAppMessage((res) => {
//   // 1️⃣ 弹窗按钮触发
//   if (res.from === 'button') {
//     return {
//       title: '邀请你加入我的账本',
//       path: `/pages/index/index?roomInviteCode=${roomDetail.value.inviteToken}`,
//       imageUrl: '/static/share-imag.png'
//     }
//   }

//   // 2️⃣ 右上角菜单触发
//   return {
//     title: '记账本',
//     path: '/pages/index/index',
//     imageUrl: '/static/share-imag.png'
//   }
// })
// 只注册一次（在 setup）
useGlobalShare({
  inviteCode: () => {
    return roomDetail && roomDetail.value
      ? roomDetail.value.inviteToken || ''
      : ''
  }
})


const isLoading = ref(true);
const isError = ref(false); // 新增错误状态
const roomIcon = ref('🏠');
const currentTab = ref('');
const showInviteModal = ref(false);
const showRoomSettings = ref(false); 
const roomId = ref(null);
const roomName = ref(null);
const roomDetail = ref(null);
const allPossibleTabs = ref([]);

const isDrawerVisible = ref(false);
const drawerInitialTask = ref(null);
const isScheduleModalVisible = ref(false); 
const scheduleModalType = ref('daily');
const scheduleEditRecord = ref(null);
const showActionSheet = ref(false);
const isClosing = ref(false);
const isSwiping = ref(false);
const panelY = ref(0);
let startY = 0;
const isCreate = ref(false);

const isFabOpen = ref(false);
const scheduleCurrentDate = ref(getDateStr(new Date()));
const pendingTab = ref('');
const pendingScheduleDate = ref('');

const selectedTask = ref(null);

const roomMembers = ref([]);
const filteredTabs = computed(() => allPossibleTabs.value || []);

const getMemberAvatar = (member) => {
  if (!member) return '';
  return member.avatar || member.userHeadUrl || member.headUrl || member.userAvatar || '';
};

const normalizeRoomMember = (member) => ({
  ...member,
  label: member.nickname,
  id: member.userId,
  avatar: getMemberAvatar(member)
});

const dashRoomId = computed(() => {
  const id = coalesce(roomDetail.value && roomDetail.value.id, roomId.value);
  return id != null && id !== '' ? String(id) : '';
});

const dashAccountId = computed(() => {
  const id = roomDetail.value?.accountsList?.[0]?.id;
  return id != null && id !== '' ? String(id) : '';
});

const isRoomOwner = computed(() => {
  const detail = roomDetail.value;
  if (!detail) return false;
  if (detail.userRole === 'owner') return true;
  const uid = dataJson.userInfo?.userId;
  if (uid == null || detail.ownerId == null) return false;
  return String(detail.ownerId) === String(uid);
});

const syncUserInfo = () => {
  if (!dataJson.userInfo) {
    const saved = uni.getStorageSync('userInfo');
    if (saved) dataJson.userInfo = saved;
  }
};

onLoad((e) => { 
  roomId.value = e.roomId; 
  roomName.value = e.name;
  if (e.tab) pendingTab.value = e.tab;
  if (e.date) pendingScheduleDate.value = e.date;
});

const CHECKLIST_REFRESH_KEY = 'checklist_board_dirty_room'

onShow(() => {
  const dirtyRoomId = uni.getStorageSync(CHECKLIST_REFRESH_KEY)
  if (!dirtyRoomId || String(dirtyRoomId) !== String(coalesce(roomId.value, ''))) return
  uni.removeStorageSync(CHECKLIST_REFRESH_KEY)
  uni.$emit('checklist_board_refresh')
});



onMounted(() => {
  syncUserInfo();
  initDashboard();
  
  uni.$on('open_room_settings', () => openSettings());
  uni.$on('dashboard_date_changed', (date) => { scheduleCurrentDate.value = date; });

  uni.$on('open_checklist_drawer', (task) => {
    drawerInitialTask.value = task;
    openDrawerCommn();
    isDrawerVisible.value = true;
  });

  uni.$on('open_schedule_drawer', (payload) => {
    scheduleModalType.value = payload.type;
    scheduleCurrentDate.value = payload.date;
    scheduleEditRecord.value = null;
    openDrawerCommn();
    isScheduleModalVisible.value = true;
  });

  uni.$on('open_schedule_edit', (record) => {
    if (!record?.id) return;
    scheduleEditRecord.value = record;
    scheduleModalType.value = record.isBirthday ? 'birthday' : 'daily';
    openDrawerCommn();
    isScheduleModalVisible.value = true;
  });

  uni.$on('open_checklist_sheet', (task) => {
    selectedTask.value = task;
    openDrawerCommn();
    showActionSheet.value = true;
  });
  
  
});

const initDashboard = () => {
  isLoading.value = true;
  isError.value = false;
  Promise.all([getRoomDetail(), getMembers()])
    .catch(() => { isError.value = true; })
    .finally(() => { isLoading.value = false; });
};

const openDrawerCommn = () => { 
  panelY.value = 0; 
  isClosing.value = false; 
  isFabOpen.value = false; 
};

const getMembers = async () => {
  try {
    const res = await roomApi.getRoomMembers({ "roomId": roomId.value });
    if (res.code == 0) { 
      roomMembers.value = res.data.map(normalizeRoomMember);
    }
  } catch (e) {}
}

const handleSeeingMember=()=>{
	uni.navigateTo({
		url:'/pages/member-management/member-management?roomId='+roomId.value
	})
}

onUnmounted(() => {
  uni.$off('open_checklist_drawer');
  uni.$off('open_schedule_drawer');
  uni.$off('open_schedule_edit');
  uni.$off('open_checklist_sheet');
  uni.$off('open_room_settings');
  uni.$off('dashboard_date_changed');
});

const onTouchStart = (e) => { startY = e.touches[0].clientY; isSwiping.value = true; };
const onTouchMove = (e) => {
  const diff = e.touches[0].clientY - startY;
  if (diff > 0) panelY.value = diff; 
};
const onTouchEnd = () => {
  isSwiping.value = false;
  if (panelY.value > 150) closeAll();
  else panelY.value = 0; 
};

const resetDrawerInputFocus = () => {};

const closeDrawer = () => {
  isDrawerVisible.value = false;
  drawerInitialTask.value = null;
};
const closeSheet = () => { showActionSheet.value = false; };
const openSettings = () => { showRoomSettings.value = true; };

const closeAll = () => {
  isClosing.value = true;
  panelY.value = 800; 
  setTimeout(() => {
    isDrawerVisible.value = false;
    drawerInitialTask.value = null;
    isScheduleModalVisible.value = false;
    showActionSheet.value = false;
    isClosing.value = false;
    isFabOpen.value = false;
  }, 300);
};
	 
	  
const getRoomDetail = async () => {
  const res = await roomApi.getRoomInfo({ "roomId": roomId.value });
  if (res.code == 0) {
    roomDetail.value = res.data;
    if (roomDetail.value.featuresList?.length > 0) {
      allPossibleTabs.value = roomDetail.value.featuresList;
      const preferredTab = pendingTab.value;
      const matchedTab = preferredTab
        ? roomDetail.value.featuresList.find((f) => f.code === preferredTab)
        : null;
      currentTab.value = matchedTab ? matchedTab.code : roomDetail.value.featuresList[0].code;
      isCreate.value = isLocked(res.data);

      if (pendingScheduleDate.value) {
        scheduleCurrentDate.value = pendingScheduleDate.value;
        setTimeout(() => {
          uni.$emit('dashboard_set_schedule_date', pendingScheduleDate.value);
        }, 120);
        pendingScheduleDate.value = '';
      }
      pendingTab.value = '';
    }
  } else {
    throw new Error('API Error');
  }
}

const isLocked = (roomDetail) => {
  const { userRole } = roomDetail;
  if (userRole === 'owner' || userRole === 'admin' || userRole === 'member') return true;
  return false;
};

const handleTaskDrawerSave = (form) => {
  uni.$emit('checklist_task_saved', { ...form });
};

const handleTaskDrawerDelete = async (taskId) => {
  try {
    const resp = await taskApi.deleteTask(taskId, roomId.value);
    if (resp.code == 0) {
      uni.$emit('checklist_task_deleted', taskId);
      closeAll();
      uni.showToast({ title: '已删除', icon: 'success' });
    }
  } catch (e) {
    uni.showToast({ title: '删除失败', icon: 'none' });
  }
};

const handleDrawerAddLedger = (task) => {
  const target = task || drawerInitialTask.value;
  if (!target?.id) return;
  isDrawerVisible.value = false;
  let url = `/pages/add-entry/add-entry?roomId=${dashRoomId.value}&accountId=${dashAccountId.value}&taskId=${target.id}`;
  if (target.title) url += `&note=${encodeURIComponent(target.title)}`;
  uni.navigateTo({ url });
};

const handleScheduleConfirm = (formData) => {
  const data = {
    id: formData.id,
    title: formData.title,
    date: formData.date,
    isLunar: formData.isLunar,
    remindEnabled: formData.remindEnabled,
    remindTime: formData.remindTime,
    remindOffsets: Array.isArray(formData.remindOffsets) ? formData.remindOffsets : [],
    remindChannels: Array.isArray(formData.remindChannels) ? formData.remindChannels : [],
    wechatSubscribe: formData.wechatSubscribe || null,
    wechatNotReady: !!formData.wechatNotReady,
    repeatType: formData.repeatType || (formData.type === 'birthday' ? 'yearly' : 'none'),
    ...(formData.type === 'daily' ? { time: formData.remindTime || formData.time } : {}),
    ...(formData.type === 'birthday' ? {
      birthdayCalendar: formData.birthdayCalendar,
      birthdayOriginalDate: formData.birthdayOriginalDate,
      birthdayMonth: formData.birthdayMonth,
      birthdayDay: formData.birthdayDay,
      birthdayLeapMonth: formData.birthdayLeapMonth,
      lunar: formData.lunar != null ? formData.lunar : (formData.isLunar ? 1 : 0)
    } : {})
  };

  const toastTitle = getScheduleSaveToast({
    isEdit: formData.mode === 'edit' && !!formData.id,
    remindEnabled: formData.remindEnabled,
    wechatRequested: !!formData.wechatRequested,
    wechatAccepted: !!formData.wechatAccepted,
    wechatNotReady: !!formData.wechatNotReady,
    type: formData.type
  });

  if (formData.mode === 'edit' && formData.id) {
    uni.$emit('schedule_item_updated', { type: formData.type, data });
    uni.showToast({ title: toastTitle, icon: 'success' });
    scheduleEditRecord.value = null;
    return;
  }

  uni.$emit('schedule_item_saved', {
    type: formData.type,
    data
  });
  uni.showToast({ title: toastTitle, icon: 'success' });
};

const handleScheduleDelete = ({ id, type }) => {
  if (!id) return;
  uni.$emit('schedule_item_deleted', { id, type });
  scheduleEditRecord.value = null;
  uni.showToast({ title: '已删除', icon: 'success' });
};

watch(isScheduleModalVisible, (visible) => {
  if (!visible) scheduleEditRecord.value = null;
});

const handleSaveRoomSettings = async (newName) => {
  uni.showLoading({ title: '正在保存...' });
  try {
    const res = await roomApi.updateRoom(roomId.value, newName, { roomId: roomId.value, name: newName });
    if (res.code == 0) {
      uni.showToast({ title: '修改成功', icon: 'success' });
      roomName.value = newName;
      showRoomSettings.value = false;
      uni.$emit('refresh_room_data',{"roomId":roomId.value,"roomName": newName });
    }
  } finally { uni.hideLoading(); }
};

const handleScheduleTrigger = (type) => { 
  isFabOpen.value = false; 
  scheduleModalType.value = type;
  scheduleEditRecord.value = null;
  isScheduleModalVisible.value = true;
};

const handleActionEdit = () => {
  showActionSheet.value = false;
  drawerInitialTask.value = selectedTask.value;
  isDrawerVisible.value = true;
};

const handleActionDelete = () => {
  uni.showModal({ title: '确认删除', content: '确定删除此任务？', success: async (res) => {
    if (!res.confirm) return;
    const taskId = selectedTask.value?.id;
    if (!taskId) return;
    try {
      const resp = await taskApi.deleteTask(taskId, roomId.value);
      if (resp.code == 0) {
        uni.$emit('checklist_task_deleted', taskId);
        closeAll();
        uni.showToast({ title: '已删除', icon: 'success' });
      }
    } catch (e) {
      uni.showToast({ title: '删除失败', icon: 'none' });
    }
  }});
};

const handleDeleteRoom = () => {
  uni.showModal({ 
    title: '危险操作', 
    content: '确定要解散并永久删除此空间吗？解散后所有成员将失去访问权限。', 
    confirmText: '确定解散',
    confirmColor: '#F43F5E', 
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '正在注销...' });
        try {
          const resp = await roomApi.deleteRoom(roomId.value);
          if (resp.code === 0) {
            uni.showToast({ title: '空间已解散', icon: 'success' });
            showRoomSettings.value = false;
            uni.$emit('refresh_room_data');
            setTimeout(() => { uni.navigateBack(); }, 1000);
          }
        } catch (err) { uni.hideLoading(); }
      }
    }
  });
};

const goBack = () => uni.navigateBack();
const handleInvite = () => { showInviteModal.value = true; };

// 处理分享事件
const handleShare = (shareData) => {
	console.log('[dashboard] 分享数据:', shareData);
	// 分享数据已经在 InviteModal 中处理了 onShareAppMessage
	// 这里可以做一些额外的处理
};
const onFabClick = () => {
  if (currentTab.value === 'ledger' || currentTab.value === 'combo') {
    var accountId=0;
    if(roomDetail.value?.accountsList?.length > 0) accountId = roomDetail.value.accountsList[0].id;
    uni.navigateTo({ url: `/pages/add-entry/add-entry?roomId=${roomDetail.value.id}&accountId=${accountId}` });
  }
};
</script>

<style scoped>
.dash-container {
  background-color: var(--primary-soft, #F8FAFC);
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: visible;
  transition: background-color 0.35s ease;
}
.main-body-scroll { flex: 1; height: 0; min-height: 0; }
.dash-content-wrapper { display: flex; flex-direction: column; padding-bottom: env(safe-area-inset-bottom); }

/* --- 骨架屏专用样式 --- */
.skeleton-mode { pointer-events: none; }
.sk-avt-ring { width: 44px; height: 44px; border-radius: 16px; background: #F1F5F9; margin-right: 10px; }
.sk-pill { width: 80px; height: 40px; border-radius: 16px; background: #F1F5F9; }
.tab-switcher-sk-wrap { display: flex; padding: 0 20px 16px; gap: 12px; }
.tab-item-sk { height: 44px; width: 80px; border-radius: 14px; background: #F1F5F9; }
.sk-content-card { margin: 0 20px 20px; height: 200px; background: #FFFFFF; border-radius: 32px; border: 1px solid #F1F5F9; }

.shimmer { position: relative; overflow: hidden; background: #F1F5F9 !important; }
.shimmer::after { position: absolute; inset: 0; transform: translateX(-100%); background-image: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent); animation: shimmerAnim 2s infinite; content: ''; }
@keyframes shimmerAnim { 100% { transform: translateX(100%); } }

/* --- 错误视图样式 --- */
.error-container { 
  flex: 1; min-height: 70vh; padding: 100rpx 40rpx; 
  display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
}
.error-visual { position: relative; width: 160rpx; height: 160rpx; display: flex; align-items: center; justify-content: center; margin-bottom: 48rpx; }
.error-emoji { font-size: 80rpx; position: relative; z-index: 2; }
.error-pulse { position: absolute; inset: 0; background: #FEE2E2; border-radius: 50%; animation: errorPulse 2s infinite; opacity: 0.5; }
@keyframes errorPulse { 0% { transform: scale(0.8); opacity: 0.6; } 100% { transform: scale(1.4); opacity: 0; } }

.error-title { font-size: 34rpx; font-weight: 900; color: #1E293B; margin-bottom: 16rpx; }
.error-subtitle { font-size: 26rpx; font-weight: 700; color: #94A3B8; line-height: 1.6; margin-bottom: 60rpx; }
.retry-action-btn { background: #1E293B; height: 100rpx; padding: 0 60rpx; border-radius: 30rpx; display: flex; align-items: center; justify-content: center; box-shadow: 0 12rpx 30rpx rgba(0,0,0,0.1); border: none; }
.retry-action-btn:active { transform: scale(0.96); opacity: 0.9; }
.retry-txt { color: #fff; font-size: 28rpx; font-weight: 900; }

/* 业务 UI 样式 */
.member-management-bar { margin: 16px 20px 24px; padding: 12px 16px; background: #fff; border-radius: 28px; border: 1px solid #F1F5F9; box-shadow: 0 10px 30px rgba(0,0,0,0.02); }
.member-list-scroll { display: flex; align-items: center; justify-content: space-between; }
.avt-content { display: flex; align-items: center; gap: 5px; flex: 1; }
.avt-item { position: relative; width: 44px; height: 44px; }
.avt-ring { width: 100%; height: 100%; border-radius: 16px; overflow: hidden; border: 2.5px solid #F8FAFC; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
.member-avt { width: 100%; height: 100%; }
.admin-crown-badge { position: absolute; top: -8px; right: -8px; width: 22px; height: 22px; background: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.1); z-index: 10; }
.crown-icon { font-size: 12px; }

.action-pills-group { display: flex; align-items: center; gap: 8px; margin-left: 12px; flex-shrink: 0; }
.action-pill-btn { position: relative; z-index: 2; flex-shrink: 0; }
.pill-pressed { opacity: 0.85; transform: scale(0.97); }
.pill-inner { height: 40px; padding: 0 12px; border-radius: 16px; display: flex; align-items: center; gap: 6px; }
.pill-inner.invite { background: var(--primary-glow, rgba(79, 70, 229, 0.05)); border: 1.5px dashed var(--primary-color, #4F46E5); }
.pill-inner.setting { background: #F8FAFC; border: 1.5px solid #F1F5F9; }
.p-icon { font-size: 14px; font-weight: 900; margin-bottom: 2px; }
.invite .p-icon { color: var(--primary-color, #4F46E5); }
.setting .p-icon { font-size: 16px; color: #64748B; }
.p-label { font-size: 11px; font-weight: 900; letter-spacing: 0.5px; }
.invite .p-label { color: var(--primary-color, #4F46E5); }
.setting .p-label { color: #64748B; }

.tab-switcher-sticky-wrap { position: sticky; top: 0; z-index: 100; padding-bottom: 16px; }
.tab-blur-bg { position: absolute; inset: 0; background: rgba(248, 250, 252, 0.85); backdrop-filter: blur(20px); z-index: -1; }
.tab-switcher { display: inline-flex; padding: 0 20px; gap: 12px; }
.tab-item { height: 44px; min-width: 80px; display: flex; align-items: center; justify-content: center; padding: 0 20px; background: #fff; border-radius: 14px; border: 1px solid #F1F5F9; }
.tab-item.active { background: var(--primary-color, #4F46E5); }
.active .tab-text { color: #fff; font-weight: 800; }
.tab-text { font-size: 14px; color: #64748B; font-weight: 700; }

.fab-primary {
  position: fixed; bottom: 34px; right: 24px;
  background: var(--primary-color, #4F46E5);
  height: 60px; padding: 0 24px; border-radius: 30px;
  display: flex; align-items: center; gap: 8px; color: #fff; z-index: 900;
  box-shadow: 0 15px 35px var(--primary-glow, rgba(79, 70, 229, 0.3));
  transition: background 0.35s ease, box-shadow 0.35s ease;
}
.fab-icon-box { font-size: 24px; font-weight: 300; }
.fab-label-txt { font-size: 15px; font-weight: 900; letter-spacing: 0.5px; }

.fab-multi-container { position: fixed; bottom: 40px; right: 24px; z-index: 2000; }
.fab-overlay-blur {
  position: fixed; inset: 0;
  background: rgba(15, 23, 42, 0.16);
  backdrop-filter: blur(6px);
  z-index: -1;
  transition: opacity 0.3s;
}
.fab-main-trigger {
  width: 60px; height: 60px; background: #1E293B; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 12px 30px rgba(0,0,0,0.15);
  transition: all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative; z-index: 10;
}
.fab-main-trigger.is-active {
  transform: none;
  background: #F43F5E;
  box-shadow: 0 0 20px rgba(244, 63, 94, 0.35);
}
.plus-sym { color: #fff; font-size: 28px; font-weight: 400; line-height: 1; }
.fab-menu-stack {
  position: absolute;
  bottom: 76px;
  right: 0;
  opacity: 0;
  transform: translateY(16px) scale(0.96);
  transition: all 0.32s cubic-bezier(0.19, 1, 0.22, 1);
  pointer-events: none;
}
.fab-menu-stack.is-open {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}
.fab-menu-panel {
  min-width: 168px;
  background: #FFFFFF;
  border-radius: 16px;
  border: 1px solid #EEF2F7;
  box-shadow: 0 12px 36px rgba(15, 23, 42, 0.12);
  overflow: hidden;
}
.fab-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 46px;
  padding: 0 16px;
  box-sizing: border-box;
}
.fab-menu-item:active { background: #F8FAFC; }
.fab-menu-divider {
  height: 1px;
  background: #EEF2F7;
  margin: 0 12px;
}
.fab-menu-icon {
  font-size: 18px;
  line-height: 1;
  flex-shrink: 0;
}
.fab-menu-text {
  font-size: 14px;
  font-weight: 600;
  color: #1F2937;
  white-space: nowrap;
  line-height: 1;
}

.global-fixed-mask { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(25px); z-index: 9999; display: flex; align-items: flex-end; transition: opacity 0.3s; }
.mask-closing { opacity: 0; }
.modal-handle {
  width: 42px;
  height: 5px;
  border-radius: 10px;
  margin: 0 auto 20px;
  opacity: 0.85;
  transition: background 0.35s ease;
}
.global-fixed-drawer {
  width: 100%;
  background: #fff;
  border-radius: 44px 44px 0 0;
  height: 65vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -20px 60px var(--primary-glow, rgba(79, 70, 229, 0.15));
  padding-top: 8px;
}
.modal-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 0 24px 24px; }
.modal-subtitle { font-size: 11px; font-weight: 900; color: #94A3B8; text-transform: uppercase; letter-spacing: 2px; }
.modal-title { font-size: 22px; font-weight: 900; color: #1E293B; margin-top: 4px; display: block; }
.modal-delete-btn { font-size: 15px; color: #F43F5E; font-weight: bold; padding: 10px; }

.modal-scroll-body { flex: 1; height: 0; }
.modal-inner-padding { padding: 0 24px 24px; }
.modal-label { font-size: 11px; font-weight: 900; color: #CBD5E1; margin-bottom: 14px; display: block; text-transform: uppercase; letter-spacing: 1.5px; }

/* 与清单看板 compose-bar 聚焦态一致 */
.field-shell {
  background: #fff;
  border-radius: 16px;
  padding: 14px 16px;
  border: 1px solid var(--primary-soft, #eef2ff);
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
  box-sizing: border-box;
}
.field-shell-focus {
  border-color: var(--primary-color, #4f46e5);
  box-shadow: 0 8px 20px var(--primary-glow, rgba(79, 70, 229, 0.1));
}
.title-input-card {
  margin-bottom: 10px;
}
.title-textarea-flat { width: 100%; font-size: 20px; font-weight: 900; color: #1E293B; line-height: 1.4; }

.modal-input-group { margin-bottom: 20px; }
.picker-card-option {
  min-height: 72px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  background: var(--primary-soft, #eef2ff);
  border-radius: 20px;
  border: 1px solid var(--primary-glow, rgba(79, 70, 229, 0.08));
  box-sizing: border-box;
}
.pc-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
.pc-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.pc-emoji { font-size: 18px; }
.pc-label { font-size: 15px; font-weight: 800; color: #475569; }
.pc-val { font-size: 15px; font-weight: 900; color: var(--primary-color, #4F46E5); }
.pc-clear { font-size: 12px; font-weight: 800; color: #94A3B8; padding: 6px 0 6px 8px; }

.modal-config-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0; }
.m-config-card {
  background: var(--primary-soft, #eef2ff);
  border-radius: 20px;
  padding: 14px;
  border: 1px solid var(--primary-glow, rgba(79, 70, 229, 0.08));
  min-height: 72px;
  box-sizing: border-box;
}
.m-config-card.assignee-card:active { opacity: 0.92; }
.mc-label {
  font-size: 10px;
  font-weight: 800;
  color: #94a3b8;
  text-transform: uppercase;
  display: block;
  margin-bottom: 8px;
}
.mc-val-box {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.mc-avt-mini {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 2px solid #fff;
  background: #fff;
}
.mc-avt-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  border: 1px solid var(--primary-glow, rgba(79, 70, 229, 0.12));
}
.mc-val {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 800;
  color: #334155;
}
.mc-val-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mc-arrow {
  font-size: 16px;
  color: var(--primary-color, #4f46e5);
  flex-shrink: 0;
  opacity: 0.5;
}
.urgent-row { justify-content: space-between; align-items: center; width: 100%; }

.remark-box { padding: 12px 16px; }
.remark-textarea { width: 100%; height: 120px; font-size: 15px; font-weight: 600; color: #334155; line-height: 1.5; }

.modal-footer { padding: 12px 24px; }
.modal-primary-btn {
  justify-content: center; align-items: center; display: flex; width: 100%;
  background: var(--primary-color, #4F46E5); color: #fff; height: 72px;
  border-radius: 24px; font-size: 17px; font-weight: 900;
  box-shadow: 0 10px 30px var(--primary-glow, rgba(79, 70, 229, 0.25));
  border: none; transition: background 0.35s ease, box-shadow 0.35s ease;
}

.global-fixed-action-sheet { width: 100%; background: #fff; border-radius: 44px 44px 0 0; padding: 12px 24px 0; box-shadow: 0 -20px 60px rgba(0,0,0,0.1); display: flex; flex-direction: column; }
.sheet-header-box { padding: 12px 0 24px; text-align: center; }
.sheet-top-label { font-size: 11px; font-weight: 900; color: #CBD5E1; text-transform: uppercase; letter-spacing: 2.5px; }
.sheet-task-title { font-size: 16px; font-weight: 800; color: #1E293B; margin-top: 6px; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 0 20px; }
.action-card-group { background: #F8FAFC; border-radius: 32px; overflow: hidden; border: 1px solid #F1F5F9; margin-bottom: 8px; }
.action-cell { display: flex; align-items: center; padding: 22px 24px; border-bottom: 1.5px solid #fff; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
.action-cell:active { background: #fff; transform: scale(0.98); }
.cell-icon-wrap { width: 48px; height: 48px; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin-right: 18px; }
.cell-icon-wrap.blue { background: var(--primary-soft, #EEF2FF); color: var(--primary-color, #4F46E5); }
.cell-icon-wrap.red { background: #FFF1F2; color: #F43F5E; }
.cell-text-info { flex: 1; display: flex; flex-direction: column; }
.cell-main-name { font-size: 15px; font-weight: 800; color: #334155; }
.cell-sub-desc { font-size: 11px; font-weight: 700; color: #94A3B8; margin-top: 2px; }
.sheet-footer { padding: 24px 0 12px; }
.sheet-cancel-pill { height: 68px; background: #F1F5F9; border-radius: 24px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 900; color: #64748B; border: none; }

.red-text { color: #F43F5E; }
.animate-fade-in { animation: fadeIn 0.4s ease-out both; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>