<template>
  <view :class="themeClass" class="profile-root">
    <!-- 1. 极致纯净的背景氛围 -->
    <view class="nebula-canvas">
      <view class="whisper-orb orb-primary"></view>
      <view class="whisper-orb orb-secondary"></view>
      <view class="noise-grain"></view>
    </view>

    <scroll-view scroll-y class="profile-scroll" :show-scrollbar="false">
      <!-- 2. 用户核心区 (入场动画 1) -->
      <view class="hero-zone animate-in" style="--delay: 0.1s" @click="!isLoggedIn && goToLogin()">
        <view class="user-display-box">
          <view class="avatar-wrap">
            <view class="avatar-glow-ring" :class="{ 'is-guest': !isLoggedIn }"></view>
            <image 
              :src="isLoggedIn ? user.userHeadUrl : 'https://i.pravatar.cc/100?u=guest_family'" 
              class="user-main-avt" 
              :class="{ 'guest-filter': !isLoggedIn }"
            />
          </view>
          
          <view class="user-meta-info">
            <view class="name-row">
              <text class="user-nick">{{ isLoggedIn ? user.userNickname : '点击登录空间' }}</text>
              <!-- <view v-if="isLoggedIn" class="pro-badge">PRO</view> -->
            </view>
            <view class="status-pill">
              <view class="status-dot-mini" :class="{ 'offline': !isLoggedIn }"></view>
              <text class="status-txt">{{ isLoggedIn ? '安全协作中' : '离线状态' }}</text>
            </view>
          </view>
        </view>

        <!-- 3. 极简横向数据面板 (入场动画 2) -->
        <view class="flat-dashboard animate-in" style="--delay: 0.2s" :class="{ 'is-locked': !isLoggedIn }">
          <view class="dashboard-inner">
            <view class="dash-item">
              <text class="dash-val">{{ isLoggedIn && userStatsInfo ? userStatsInfo.active_days : '--' }}</text>
              <text class="dash-label">活跃天数</text>
            </view>
            <view class="dash-divider"></view>
            <view class="dash-item">
              <text class="dash-val">{{ isLoggedIn && userStatsInfo ? userStatsInfo.room_count : '--' }}</text>
              <text class="dash-label">协作空间</text>
            </view>
            <view class="dash-divider"></view>
            <view class="dash-item highlight">
              <view class="price-row">
                <text class="currency">¥</text>
                <text class="dash-val">{{ isLoggedIn && userStatsInfo ? userStatsInfo.month_ledger_total : '0' }}</text>
              </view>
              <text class="dash-label">本月支出</text>
            </view>
          </view>

          <!-- 锁定态遮罩 -->
          <view v-if="!isLoggedIn" class="dash-lock-layer">
            <view class="lock-pill">
              <text class="lock-emoji">🔒</text>
              <text class="lock-txt">登录同步数据</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 4. 菜单矩阵 (入场动画 3) -->
      <view class="menu-container animate-in" style="--delay: 0.3s">
        <view class="group-header">
          <text class="group-title">功能与设置</text>
        </view>
        
        <view class="flat-menu-list">
          <view class="menu-item" hover-class="menu-hover" @click="handleMenuClick('member')">
            <view class="item-l">
              <view class="item-icon-box bg-indigo">
                <text class="icon-e">🔐️</text>
              </view>
              <text class="item-name">空间权限管理</text>
            </view>
            <view class="item-r">
              <text class="item-arrow">›</text>
            </view>
          </view>

          <view class="menu-item" hover-class="menu-hover" @click="openThemePicker">
            <view class="item-l">
              <view class="item-icon-box bg-theme-soft">
                <text class="icon-e">🎨</text>
              </view>
              <text class="item-name">个性换肤</text>
            </view>
            <view class="item-r">
              <text class="item-val theme-name-val">{{ theme.name }}</text>
              <text class="item-arrow">›</text>
            </view>
          </view>

          <view class="menu-item" hover-class="menu-hover" @click="goToVersionHistory">
            <view class="item-l">
              <view class="item-icon-box bg-blue">
                <text class="icon-e">🔔</text>
              </view>
              <text class="item-name">更新日志</text>
            </view>
            <view class="item-r">
              <text class="item-val">{{ appVersionLabel }}</text>
              <text class="item-arrow">›</text>
            </view>
          </view>
		  
		  <view v-if="false" class="menu-item" hover-class="menu-hover" @click="goToLucky">
		    <view class="item-l">
		      <view class="item-icon-box bg-blue">
		        <text class="icon-e">🎡</text>
		      </view>
		      <text class="item-name">灵感决策盘</text>
		    </view>
		    <view class="item-r">
		      <!-- <text class="item-val">v1.0.0</text> -->
		      <text class="item-arrow">›</text>
		    </view>
		  </view>
        </view>

        <!-- 5. 增强版退出按钮 (入场动画 4) -->
        <view class="auth-zone animate-in" style="--delay: 0.4s">
          <block v-if="isLoggedIn">
            <view class="logout-action-box" @click="handleLogout">
              <view class="logout-btn-premium">
                <!-- <text class="logout-icon">🚪</text> -->
                <text class="logout-text">退出当前账号</text>
              </view>
              <view class="btn-shadow"></view>
            </view>
            <!-- <text class="sec-tip">数据已通过云端加密保护</text> -->
          </block>
          
          <block v-else>
            <button class="login-action-btn" @click="goToLogin">
              <text class="login-btn-txt">立即开启协作</text>
              <view class="btn-shine"></view>
            </button>
            <!-- <text class="sec-tip">已有 2,400+ 家庭正在使用</text> -->
          </block>
        </view>
      </view>

      <view class="bottom-safe-fill"></view>
    </scroll-view>

  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { userApi } from '../../common/api';
import dataJson from '/data.json';
import {goToLogin} from '../js/utils.js';
import { useAppTheme } from '@/common/themes/useAppTheme.js';
import { formatAppVersion } from '@/common/config';

const { theme } = useAppTheme();
const appVersionLabel = formatAppVersion();

const isLoggedIn = ref(false);
const isStatsLoading = ref(false);
const user = ref({ userNickname: '', userHeadUrl: '' });
const userStatsInfo = ref(null);

onMounted(() => {
  const savedUser = uni.getStorageSync('userInfo');
  if (savedUser) {
    isLoggedIn.value = true;
    user.value = savedUser;
    getUserStatsInfo();
  }
  
  uni.$on('user_login', (data) => {
    if(data){
      isLoggedIn.value = true;
	  console.log(data);
      user.value = uni.getStorageSync('userInfo');;
      getUserStatsInfo();
    } else {
      isLoggedIn.value = false;
      userStatsInfo.value = null;
    }
  });
});

const getUserStatsInfo = async () => {
  if (!isLoggedIn.value) return;
  isStatsLoading.value = true;
  try {
    const res = await userApi.getUserStatsInfo();
    if (res && res.code === 0) {
      userStatsInfo.value = res.data;
    }
  } catch (e) {
    userStatsInfo.value = null;
  } finally {
    setTimeout(() => {
      isStatsLoading.value = false;
    }, 600);
  }
};


const handleMenuClick = (type) => {
  if ( !goToLogin()) { return; }
  console.log(userStatsInfo.value.room_count );
  if((userStatsInfo.value.room_count)<=0){
	  uni.showToast({
	  	title:'暂无空间',
		icon:'none'
	  })
	  return;
  }
  if (type === 'member') uni.navigateTo({ url: '/pages/member-management/member-management' });
};
const openThemePicker = () => {
  uni.$emit('open_theme_picker');
};

const goToVersionHistory = () => uni.navigateTo({ url: '/pages/version-history/version-history' }); //
const goToLucky = () =>{
	 // if ( !goToLogin()) { return; }
	  uni.navigateTo({ url: '/pages/game-scorer/lobby' });
}


const handleLogout = () => {
  uni.showModal({
    title: '确认登出',
    content: '登出后您将无法实时同步家庭数据',
    confirmText: '确认退出',
    confirmColor: '#F43F5E',
    cancelColor: '#94A3B8',
    success: (res) => {
      if (res.confirm) {
        uni.removeStorageSync('userInfo');
		dataJson.userInfo=null;
		dataJson.isLogin=false;
        isLoggedIn.value = false;
        userStatsInfo.value = null;
		    uni.$emit('user_login', false)
        goToLogin();
      }
    }
  });
};
</script>

<style scoped>
.profile-root {
  position: fixed;
  inset: 0;
  background: var(--primary-soft, #FFFFFF);
  overflow: hidden;
  transition: background-color 0.35s ease;
}

/* 背景设计：极致轻量 */
.nebula-canvas { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
.whisper-orb { 
  position: absolute; border-radius: 50%; 
  filter: blur(100px); opacity: 0.12;
  animation: dynamicFlow 25s infinite alternate ease-in-out;
}
.orb-primary {
  top: -5%;
  right: -5%;
  width: 450px;
  height: 450px;
  background: var(--primary-color, #4F46E5);
  transition: background 0.35s ease;
}
.orb-secondary {
  bottom: 10%;
  left: -10%;
  width: 400px;
  height: 400px;
  background: var(--secondary-color, #0EA5E9);
  animation-delay: -5s;
  transition: background 0.35s ease;
}
@keyframes dynamicFlow { 0% { transform: scale(1) translate(0, 0); } 100% { transform: scale(1.1) translate(20px, 30px); } }
.noise-grain { position: absolute; inset: 0; opacity: 0.02; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }

.profile-scroll { position: relative; z-index: 1; height: 100%; }

/* Hero Zone */
.hero-zone { padding: 80px 28px 30px; }
.user-display-box { display: flex; align-items: center; gap: 20px; margin-bottom: 40px; }

.avatar-wrap { position: relative; width: 72px; height: 72px; }
.avatar-glow-ring {
  position: absolute;
  inset: -3px;
  background: linear-gradient(135deg, var(--primary-color, #4F46E5), var(--secondary-color, #0EA5E9));
  border-radius: 26px;
  filter: blur(4px);
  opacity: 0.2;
  transition: background 0.35s ease;
}
.avatar-glow-ring.is-guest {
  background: var(--primary-soft, #eef2ff);
  opacity: 1;
  box-shadow: 0 0 0 1px var(--primary-glow, rgba(79, 70, 229, 0.15));
}

.user-main-avt { 
  position: relative; width: 100%; height: 100%; border-radius: 22px; 
  background: #F1F5F9; border: 2px solid #fff;
}
.guest-filter { filter: grayscale(1); opacity: 0.5; }

.user-meta-info { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.name-row { display: flex; align-items: center; gap: 8px; }
.user-nick { font-size: 24px; font-weight: 900; color: #1E293B; letter-spacing: -0.5px; }
.pro-badge {
  background: var(--primary-color, #4f46e5);
  color: #fff;
  font-size: 9px;
  font-weight: 900;
  padding: 2px 6px;
  border-radius: 4px;
}

.status-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  padding: 4px 10px;
  background: var(--primary-soft, #eef2ff);
  border-radius: 100px;
  transition: background 0.35s ease;
}
.status-dot-mini { width: 5px; height: 5px; background: #10b981; border-radius: 50%; }
.status-dot-mini.offline {
  background: var(--primary-color, #4f46e5);
  opacity: 0.45;
}
.status-txt { font-size: 10px; font-weight: 800; color: #64748b; }
.status-dot-mini.offline + .status-txt {
  color: var(--primary-color, #4f46e5);
  opacity: 0.85;
}

/* Flat Dashboard */
.flat-dashboard { 
  background: rgba(255, 255, 255, 0.7); border-radius: 30px; 
  border: 1px solid rgba(241, 245, 249, 0.8);
  position: relative; overflow: hidden;
}
.dashboard-inner { padding: 24px 0; display: flex; align-items: center; }
.dash-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.dash-divider { width: 1px; height: 32px; background: #F1F5F9; }
.dash-val { font-size: 22px; font-weight: 900; color: #1E293B; }
.dash-label { font-size: 10px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px; }
.highlight .dash-val { color: var(--primary-color, #4F46E5); }
.price-row { display: flex; align-items: baseline; gap: 2px; }
.currency { font-size: 12px; font-weight: 900; color: var(--primary-color, #4F46E5); }
.bg-theme-soft { background: var(--primary-soft, #EEF2FF); }

.dash-lock-layer { 
  position: absolute; inset: 0; background: rgba(255,255,255,0.4);
  backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center;
}
.lock-pill {
  background: var(--primary-color, #4f46e5);
  padding: 10px 20px;
  border-radius: 100px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 8px 22px var(--primary-glow, rgba(79, 70, 229, 0.28));
  transition: background 0.35s ease, box-shadow 0.35s ease;
}
.lock-emoji { font-size: 14px; }
.lock-txt { color: #fff; font-size: 12px; font-weight: 900; }

/* Menu Container */
.menu-container { padding: 30px 28px 60px; }
.group-header { margin-bottom: 16px; padding-left: 10px; }
.group-title { font-size: 12px; font-weight: 900; color: #CBD5E1; text-transform: uppercase; letter-spacing: 2px; }

.flat-menu-list { 
  background: #FFFFFF; border-radius: 28px; border: 1px solid #F1F5F9; overflow: hidden;
}
.menu-item { 
  height: 72px; padding: 0 24px; display: flex; align-items: center; justify-content: space-between;
  border-bottom: 1px solid #F8FAFC; transition: all 0.2s;
}
.menu-item:last-child { border-bottom: none; }
.menu-hover { background: #F8FAFC; }

.item-l { display: flex; align-items: center; gap: 16px; }
.item-icon-box { 
  width: 42px; height: 42px; border-radius: 14px; 
  display: flex; align-items: center; justify-content: center;
}
.bg-indigo { background: var(--primary-soft, #EEF2FF); }
.bg-blue { background: #F0F9FF; }
.icon-e { font-size: 18px; }
.item-name { font-size: 15px; font-weight: 800; color: #334155; }

.item-r { display: flex; align-items: center; gap: 8px; }
.item-val { font-size: 12px; font-weight: 700; color: #CBD5E1; }
.theme-name-val {
  color: var(--primary-color, #4f46e5);
  font-weight: 800;
  transition: color 0.35s ease;
}
.item-arrow { font-size: 22px; color: #E2E8F0; line-height: 1; margin-top: -3px; }

/* Auth Zone */
.auth-zone { margin-top: 40px; text-align: center; }
.sec-tip { font-size: 11px; font-weight: 700; color: #CBD5E1; display: block; margin-top: 16px; }

/* 退出登录按钮 */
.logout-action-box { position: relative; width: 100%; display: flex; justify-content: center; }
.logout-btn-premium {
  width: 100%;
  height: 68px;
  background: var(--primary-soft, #eef2ff);
  border: 1.5px solid var(--primary-color, #4f46e5);
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: transform 0.25s ease, background-color 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease;
  z-index: 2;
  box-shadow: 0 6px 20px var(--primary-glow, rgba(79, 70, 229, 0.08));
}
.logout-btn-premium:active {
  transform: scale(0.96);
  box-shadow: 0 4px 14px var(--primary-glow, rgba(79, 70, 229, 0.12));
  opacity: 0.92;
}
.logout-icon { font-size: 18px; }
.logout-text {
  color: var(--primary-color, #4f46e5);
  font-size: 16px;
  font-weight: 900;
  transition: color 0.35s ease;
}

.login-action-btn {
  width: 100%;
  height: 72px;
  background: var(--primary-color, #4f46e5);
  color: #fff;
  border-radius: 24px;
  border: none;
  font-size: 17px;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 14px 32px var(--primary-glow, rgba(79, 70, 229, 0.32));
  position: relative;
  overflow: hidden;
  transition: background 0.35s ease, box-shadow 0.35s ease;
}
.login-action-btn::after { border: none; }
.login-action-btn:active { transform: scale(0.98); opacity: 0.92; }
.login-btn-txt { color: #fff; position: relative; z-index: 1; }
.btn-shine {
  position: absolute; inset: 0; 
  background: linear-gradient(45deg, transparent, rgba(255,255,255,0.05), transparent);
  transform: translateX(-100%); animation: shine 3s infinite;
}
@keyframes shine { 0% { transform: translateX(-100%) rotate(45deg); } 100% { transform: translateX(200%) rotate(45deg); } }

.bottom-safe-fill { height: 140px; }

/* Staggered Entrance Animations */
.animate-in {
  opacity: 0; transform: translateY(20px);
  animation: slideInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1.1) forwards;
  animation-delay: var(--delay);
}
@keyframes slideInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>