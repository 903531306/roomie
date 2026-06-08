<template>
  <view :class="themeClass" class="member-root" :style="themeStyles">
    <view class="page-ambient" aria-hidden="true">
      <view class="ambient-blob blob-primary"></view>
      <view class="ambient-blob blob-secondary"></view>
    </view>
    <IosNav title="协作权限管理" @leftClick="goBack" />

    <!-- 1. 加载中状态 (骨架屏) -->
    <block v-if="isLoading">
      <view class="room-selector-strip skeleton-mode">
        <view class="current-room-card sk-item shimmer"></view>
      </view>
      
      <view class="member-hero-section skeleton-mode">
        <view class="hero-glass-card sk-item shimmer" style="height: 80px;"></view>
      </view>

      <view class="list-content skeleton-mode">
        <view v-for="i in 4" :key="i" class="member-cell sk-item shimmer"></view>
      </view>
    </block>

    <!-- 2. 网络错误状态 -->
    <block v-else-if="isError">
      <view class="error-view animate-fade-in">
        <view class="error-icon-wrap">
          <view class="error-pulse"></view>
          <text class="error-emoji">📡</text>
        </view>
        <text class="error-h">连接服务失败</text>
        <button class="retry-btn" @click="initData">
          <text class="retry-txt">重试加载</text>
        </button>
      </view>
    </block>

    <!-- 3. 正常数据展示 -->
    <block v-else>
      <!-- 房间选择器 -->
      <view class="room-selector-strip animate-fade-in">
        <view class="current-room-card" @click="showRoomPicker = true">
          <view class="cr-left">
            <image v-if="isImageUrl(currentRoom?.icon)" :src="currentRoom.icon" mode="aspectFill" class="cr-icon-img" />
            <text v-else class="cr-emoji">{{ currentRoom?.icon || '🏠' }}</text>
            <text class="cr-name">{{ currentRoom?.name || '选择空间' }}</text>
          </view>
          <view class="cr-right">
            <text class="cr-switch-txt">切换空间</text>
            <text class="cr-switch-icon">⇄</text>
          </view>
        </view>
      </view>

      <!-- 核心状态：极简浅色统计区 -->
      <view class="member-hero-section animate-reveal">
        <view class="hero-glass-card">
          <view class="hero-content-inner">
            <view class="hero-info-group">
              <view class="hero-main-data">
                <text class="hero-num">{{ members.length + (memberInfo ? 1 : 0) }}</text>
                <text class="hero-label">位协作成员</text>
              </view>
              <view class="hero-status-tag">
                <view class="status-dot"></view>
                <text class="status-info">实时同步中</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 成员列表 -->
      <scroll-view scroll-y class="member-scroll" :show-scrollbar="false">
        <view class="list-content">
          <!-- 房主区域 (锁定：任何人都不能修改房主) -->
          <view class="list-section" v-if="memberInfo">
            <text class="section-tag">核心所有者</text>
            <view class="member-cell owner is-locked animate-stagger" style="--delay: 0.05s" @click="showAuthDenyTip(true)">
              <view class="c-left">
                <view class="avatar-box">
                  <image :src="memberInfo.avatar || 'https://i.pravatar.cc/150?u=owner'" class="m-avt" />
                  <view class="crown-badge">👑</view>
                </view>
                <view class="m-meta">
                  <text class="m-nick">{{ memberInfo.nickname }} (主理人)</text>
                  <text class="m-sub">负责空间创建与核心决策</text>
                </view>
              </view>
              <view class="c-right">
                <view class="role-pill owner-gold">房主</view>
                <text class="lock-icon">🔒</text>
              </view>
            </view>
          </view>

          <!-- 协作团队区域 -->
          <view class="list-section">
            <view class="section-header-row">
              <text class="section-tag">协作团队</text>
              <text v-if="members.length > 0" class="section-hint">点击可管理成员权限</text>
            </view>
            
            <block v-if="members.length > 0">
              <view 
                v-for="(m, i) in members" 
                :key="m.id || i" 
                class="member-cell animate-stagger" 
                :class="{ 'is-locked': !canIEdit(m) }"
                :style="{ '--delay': (0.15 + i * 0.08) + 's' }"
                @click="onMemberItemClick(m)"
              >
                <view class="c-left">
                  <view class="avatar-box">
                    <image :src="m.avatar || `https://i.pravatar.cc/150?u=${i}`" class="m-avt" :class="{ 'grayscale': !canIEdit(m) }" />
                  </view>
                  <view class="m-meta">
                    <text class="m-nick">{{ m.nickname }} {{ m.isMe ? '(我)' : '' }}</text>
                    <text class="m-sub">{{ m.lastActive || '刚刚' }} 活跃</text>
                  </view>
                </view>
                <view class="c-right">
                  <view class="role-pill" :class="getRoleClass(m.role)">
                    {{ getRoleLabel(m.role) }}
                  </view>
                  <!-- 移除成员按钮：仅在有管理权限时显示 -->
                  <view v-if="canIEdit(m) && !m.isMe" class="remove-btn" @click.stop="handleRemoveMember(m)">
                    <text class="remove-icon">✕</text>
                  </view>
                  <text v-if="canIEdit(m)" class="cell-arrow">›</text>
                  <text v-else class="lock-icon">🔒</text>
                </view>
              </view>
            </block>

            <!-- 空状态 -->
            <view v-else class="empty-member-box animate-fade-in">
              <text class="empty-icon">🌱</text>
              <text class="empty-title">暂无其他协作成员</text>
              <text class="empty-desc">邀请家人加入，开启高效协作生活</text>
            </view>
          </view>
        </view>
        <view class="scroll-bottom-spacer"></view>
      </scroll-view>

      <!-- 底部操作 -->
      <view class="fixed-footer-action">
        <button class="invite-btn-pro" @click="handleInvite">
          <text class="btn-icon">＋</text>
          <text class="btn-txt">邀请微信成员加入</text>
        </button>
      </view>
    </block>

    <BottomPicker 
      v-if="currentRoom"
      v-model="showRoomPicker" 
      title="切换管理空间" 
      layout="list" 
      :options="roomOptions" 
      :currentSelected="currentRoom.id" 
      @change="onRoomChange"
    />
	
	 <InviteModal 
    		  v-model="showInviteModal" 
    		  :inviteCode="currentRoom?.inviteToken || ''"
    		  :roomName="currentRoom?.name || '我的空间'"
    		  :roomIcon="currentRoom?.icon || '🏠'"
    		  :roomId="currentRoom?.id || ''"
    		  @share="handleShare"
    		/>

    <BottomPicker 
      v-model="showPermissionPicker" 
      title="调整成员权限" 
      subtitle="权限变更将实时同步给该成员"
      layout="list" 
      :options="roleOptions" 
      :currentSelected="selectedMember?.role" 
      @change="onRoleChange"
    />
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAppTheme } from '@/common/themes/useAppTheme.js'

const { themeClass, primaryColor, softColor, theme } = useAppTheme()
const themeStyles = computed(() => ({
  backgroundColor: softColor.value
}))
import IosNav from '../../components/nav/ios-nav.vue';
import BottomPicker from '../../components/common/BottomPicker.vue';
import InviteModal from '../../components/common/InviteModal.vue';
import { roomApi } from '../../common/api';
import dataJson from '/data.json';
import {useGlobalShare } from '../js/useGlobalShare.js';


// 只注册一次（在 setup）
useGlobalShare({
  inviteCode: () => {
    return currentRoom && currentRoom.value
      ? currentRoom.value.inviteToken || ''
      : ''
  }
})

const isLoading = ref(true);
const showInviteModal=ref(false);
const isError = ref(false);
const currentRoom = ref(null);
const showRoomPicker = ref(false);
const showPermissionPicker = ref(false);
const selectedMember = ref(null);
const roomOptions = ref([]);
const memberInfo = ref(null); 
const members = ref([]);   

const isImageUrl = (val) => {
  if (typeof val !== 'string') return false;
  const v = val.toLowerCase();
  return v.startsWith('http') || v.startsWith('/') || v.startsWith('data:image') || v.includes('.png') || v.includes('.jpg') || v.includes('.jpeg') || v.includes('.webp');
};

// 模拟当前用户身份
const myRole = ref('member'); 

const roleOptions = [
  { label: '管理员', id: 'admin', icon: '🛡️', subtitle: '可管理内容及协作成员' },
  { label: '普通成员', id: 'member', icon: '👤', subtitle: '可查看全部，管理自己的内容' },
  { label: '观察者', id: 'observer', icon: '👁️', subtitle: '只读权限，无法修改任何数据' }
];

const canIEdit = (targetMember) => {
  if (targetMember.isOwner) return false;
  if (myRole.value === 'admin' || myRole.value === 'owner') {
    if (myRole.value === 'admin' && targetMember.role === 'admin') return false;
    return true;
  }
  return false;
};

const showAuthDenyTip = (isOwner) => {
  uni.showToast({
    title: isOwner ? '房主权限受系统保护' : '仅管理员可修改他人权限',
    icon: 'none',
    duration: 2000
  });
};

const onMemberItemClick = (m) => {
	if(m.role!=='owner'&&m.userId===dataJson.userInfo.userId){
		uni.showToast({
		  title: '无法修改自己的权限',
		  icon: 'none',
		  duration: 2000
		});
		return;
	}
  if (canIEdit(m)) {
    selectedMember.value = m;
    showPermissionPicker.value = true;
  } else {
    showAuthDenyTip(false);
  }
};

const handleRemoveMember = (member) => {
  uni.showModal({
    title: '移除成员',
    content: `确定要将“${member.nickname}”从本空间移除吗？移除后该成员将失去所有访问权限。`,
    confirmText: '确定移除',
    confirmColor: '#F43F5E',
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '正在处理...' });
        try {
          // 这里假设后端有对应的移除接口
          const resp = await roomApi.removeRoomMemberRple({ 
            userId: member.userId, 
            roomId: currentRoom.value.id,
            action: 'remove' // 或者是特定的角色代码来表示删除
          });
          
          if (resp.code === 0) {
            uni.showToast({ title: '已移除', icon: 'success' });
            getRoomMemberList(currentRoom.value.id); // 刷新列表
          }
        } finally {
          uni.hideLoading();
        }
      }
    }
  });
};



const getRoleLabel = (role) => roleOptions.find(o => o.id === role)?.label || '成员';
const getRoleClass = (role) => {
  if (role === 'admin') return 'admin-blue';
  if (role === 'member') return 'member-indigo';
  return 'viewer-gray';
};

const getRoomsList = async () => {
  try {
    const res = await roomApi.getRoomLists();
    if (res.code == 0) {
      roomOptions.value = (res.data || []).map(item => ({
        label: item.name,
        id: String(item.id),
        icon: item.icon,
        inviteToken: item.inviteToken || '✨',
        bgColor: softColor.value
      }));
      if (roomOptions.value.length > 0 && !currentRoom.value) {
        const first = roomOptions.value[0];
        currentRoom.value = { ...first, name: first.label };
		console.log(currentRoom.value);
		  // useShare({inviteCode: currentRoom.value.inviteToken});
        getRoomMemberList(currentRoom.value.id);
      } else if(currentRoom.value) {
        getRoomMemberList(currentRoom.value.id);
      }
    } else {
      isError.value = true;
    }
  } catch (e) { isError.value = true; }
  finally { isLoading.value = false; }
};

const getRoomMemberList = async (roomId) => {
  try {
    const res = await roomApi.getRoomMemberLists({ roomId: roomId });
    if (res.code == 0) {
      memberInfo.value = { ...res.data.owner, isOwner: true };
      members.value = (res.data.teamMembers || []).map(m => ({
        ...m,
        isMe: m.userId === dataJson?.userInfo?.userId
      }));
      const meInTeam = members.value.find(m => m.isMe);
	  console.log(currentRoom.value)
      if (meInTeam) myRole.value = meInTeam.role;
      if (memberInfo.value.userId === dataJson?.userInfo?.userId) myRole.value = 'owner';
    }
  } catch (e) {}
};

onMounted(() => initData());
const initData = () => { isLoading.value = true; isError.value = false; getRoomsList(); };
const goBack = () => uni.navigateBack();
const onRoomChange = (room) => {
	currentRoom.value = { ...room, name: room.label }; 
	 useShare({inviteCode: currentRoom.value.inviteToken});
	initData(); };

const onRoleChange = (roleObj) => {
  if (selectedMember.value) {
    selectedMember.value.role = roleObj.id;
    uni.showToast({ title: '权限已更新', icon: 'success' });
  }
};

const handleInvite = () => {
	// 确保 currentRoom 有值再打开弹窗
	if (!currentRoom.value) {
		uni.showToast({ title: '请先选择空间', icon: 'none' });
		return;
	}
	showInviteModal.value = true;
};

// 处理分享事件
const handleShare = (shareData) => {
	console.log('[member-management] 分享数据:', shareData);
	// 分享数据已经在 InviteModal 中处理了 onShareAppMessage
	// 这里可以做一些额外的处理，比如统计分享次数等
};
</script>

<style scoped>
.member-root {
  height: 100vh;
  background-color: var(--primary-soft, #EEF2FF);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  transition: background-color 0.35s ease;
}

.page-ambient { position: absolute; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
.ambient-blob { position: absolute; border-radius: 50%; filter: blur(120px); opacity: 0.1; transition: background 0.35s ease; }
.blob-primary { top: -60px; right: -50px; width: 300px; height: 300px; background: var(--primary-color, #4F46E5); }
.blob-secondary { bottom: 20%; left: -70px; width: 260px; height: 260px; background: var(--secondary-color, #7C3AED); }

/* 骨架屏 */
.skeleton-mode { pointer-events: none; }
.sk-item { background: #E2E8F0 !important; border: none !important; }
.shimmer { position: relative; overflow: hidden; }
.shimmer::after { position: absolute; inset: 0; transform: translateX(-100%); background-image: linear-gradient(90deg, rgba(255,255,255,0) 0, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%); animation: shimmerAnim 1.8s infinite; content: ''; }
@keyframes shimmerAnim { 100% { transform: translateX(100%); } }

/* 顶部房间卡片 */
.room-selector-strip,
.member-hero-section,
.member-scroll,
.error-view,
.fixed-footer-action {
  position: relative;
  z-index: 1;
}
.room-selector-strip { padding: 12px 20px 4px; }
.current-room-card {
  background: #fff; height: 56px; border-radius: 18px; padding: 0 16px;
  display: flex; align-items: center; justify-content: space-between;
  border: 1px solid var(--primary-soft, #EEF2FF);
  box-shadow: 0 4px 12px var(--primary-glow, rgba(79, 70, 229, 0.06));
  transition: border-color 0.35s ease, box-shadow 0.35s ease;
}
.current-room-card:active { border-color: var(--primary-color, #4F46E5); }
.cr-left { display: flex; align-items: center; gap: 10px; }
.cr-emoji { font-size: 20px; }
.cr-icon-img { width: 24px; height: 24px; border-radius: 6px; }
.cr-name { font-size: 15px; font-weight: 800; color: #1E293B; }
.cr-right { display: flex; align-items: center; gap: 6px; }
.cr-switch-txt { font-size: 11px; font-weight: 800; color: var(--primary-color, #4F46E5); }
.cr-switch-icon { color: var(--primary-color, #4F46E5); font-size: 14px; }

/* 极简成员统计 Hero Card (重构) */
.member-hero-section { padding: 12px 20px 24px; }
.hero-glass-card {
  background: #FFFFFF; border-radius: 32px; padding: 10px 32px;
  border: 1px solid #F1F5F9; box-shadow: 0 8px 30px rgba(0,0,0,0.02);
}
.hero-content-inner { display: flex; align-items: center; justify-content: space-between; }
.hero-info-group { display: flex; flex-direction: column; gap: 6px; }

.hero-main-data { display: flex; align-items: baseline; gap: 10px; }
.hero-num { font-size: 44px; font-weight: 900; color: var(--primary-color, #4F46E5); line-height: 1; letter-spacing: -2px; transition: color 0.35s ease; }
.hero-label { font-size: 15px; font-weight: 800; color: #64748B; }

.hero-status-tag { display: flex; align-items: center; gap: 6px; margin-top: 4px; }
.status-dot { width: 8px; height: 8px; background: #10B981; border-radius: 50%; animation: statusBreathe 2s infinite ease-in-out; }
@keyframes statusBreathe { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.5; } }
.status-info { font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px; }

.member-scroll { flex: 1; height: 0; }
.list-content { padding: 0 20px; }
.list-section { margin-bottom: 32px; }
.section-tag { font-size: 11px; font-weight: 900; color: #CBD5E1; text-transform: uppercase; letter-spacing: 2px; display: block; margin-bottom: 16px; margin-left: 8px; }
.section-header-row { display: flex; justify-content: space-between; align-items: baseline; }
.section-hint { font-size: 10px; font-weight: 700; color: #94A3B8; margin-right: 8px; }

.member-cell { 
  background: #FFFFFF; border-radius: 28px; padding: 20px; margin-bottom: 12px; 
  display: flex; align-items: center; justify-content: space-between; 
  border: 1px solid #F1F5F9; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); 
}
.member-cell:active:not(.is-locked) { transform: scale(0.97); background: var(--primary-soft, #EEF2FF); }

.is-locked { opacity: 0.65; }
.is-locked:active { transform: scale(0.99); } 

.owner { border: 2rpx solid #FEF3C7; background: linear-gradient(135deg, #FFFFFF 0%, #FFFDF5 100%); }
.c-left { display: flex; align-items: center; gap: 16px; }
.avatar-box { position: relative; width: 52px; height: 52px; }
.m-avt { width: 100%; height: 100%; border-radius: 18px; background: #F1F5F9; transition: filter 0.3s; }
/* .m-avt.grayscale { filter: grayscale(1); } */

.crown-badge { position: absolute; top: -8px; right: -8px; width: 22px; height: 22px; background: #fff; border-radius: 50%; display: center; align-items: center; justify-content: center; font-size: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
.m-meta { display: flex; flex-direction: column; gap: 4px; }
.m-nick { font-size: 12px; font-weight: 800; color: #1E293B; }
.m-sub { font-size: 11px; font-weight: 700; color: #94A3B8; }

.c-right { display: flex; align-items: center; gap: 10px; }
.role-pill { font-size: 9px; font-weight: 900; padding: 6px 12px; border-radius: 10px; letter-spacing: 0.5px; }
.owner-gold { background: #FFFBEB; color: #D97706; }
.admin-blue { background: var(--primary-soft, #EEF2FF); color: var(--primary-color, #4F46E5); }
.member-indigo { background: var(--primary-soft, #EEF2FF); color: var(--secondary-color, #7C3AED); }
.viewer-gray { background: #F1F5F9; color: #64748B; }

.remove-btn {
  width: 32px; height: 32px; border-radius: 10px;
  background: #FFF1F2; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.remove-btn:active { transform: scale(0.85); background: #FEE2E2; }
.remove-icon { font-size: 14px; color: #F43F5E; font-weight: bold; }

.cell-arrow { font-size: 20px; color: var(--primary-color, #4F46E5); font-weight: 300; opacity: 0.45; }
.lock-icon { font-size: 14px; opacity: 0.4; }

.empty-member-box { padding: 40px 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.empty-icon { font-size: 40px; margin-bottom: 12px; opacity: 0.3; }
.empty-title { font-size: 16px; font-weight: 800; color: #334155; margin-bottom: 4px; }
.empty-desc { font-size: 12px; font-weight: 600; color: #94A3B8; }

.fixed-footer-action {
  position: fixed; bottom: 0; left: 0; right: 0; padding: 24px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px); z-index: 100;
}
.invite-btn-pro {
  height: 72px;
  background: var(--primary-color, #4F46E5);
  border-radius: 26px;
  display: flex; align-items: center; justify-content: center; gap: 12px;
  box-shadow: 0 15px 35px var(--primary-glow, rgba(79, 70, 229, 0.25));
  border: none;
  transition: background 0.35s ease, box-shadow 0.35s ease;
}
.invite-btn-pro:active { transform: scale(0.96); opacity: 0.9; }
.btn-icon { font-size: 22px; color: #fff; font-weight: 300; }
.btn-txt { color: #fff; font-size: 16px; font-weight: 900; letter-spacing: 1px; }

.scroll-bottom-spacer { height: 140px; }

.animate-reveal { animation: revealIn 0.8s cubic-bezier(0.19, 1, 0.22, 1) both; }
.animate-fade-in { animation: fadeIn 0.5s ease-out both; }
.animate-stagger { opacity: 0; transform: translateY(24px); animation: staggerIn 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards; animation-delay: var(--delay); }
@keyframes revealIn { from { opacity: 0; transform: scale(0.96) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes staggerIn { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }

.error-view {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  justify-content: center; text-align: center; padding: 40px 20px;
}
.error-icon-wrap {
  position: relative; width: 80px; height: 80px;
  display: flex; align-items: center; justify-content: center; margin-bottom: 20px;
}
.error-pulse {
  position: absolute; inset: 0;
  background: var(--primary-soft, #EEF2FF);
  border-radius: 50%;
  animation: errorPulse 2s infinite;
}
@keyframes errorPulse { 0% { transform: scale(0.85); opacity: 0.8; } 100% { transform: scale(1.35); opacity: 0; } }
.error-emoji { position: relative; z-index: 1; font-size: 40px; }
.error-h { font-size: 18px; font-weight: 900; color: #1E293B; margin-bottom: 8px; }
.retry-btn {
  margin-top: 20px;
  background: var(--primary-color, #4F46E5);
  padding: 10px 30px;
  border-radius: 12px;
  box-shadow: 0 10px 25px var(--primary-glow, rgba(79, 70, 229, 0.2));
  border: none;
}
.retry-txt { color: #fff; font-size: 14px; font-weight: 800; }
</style>