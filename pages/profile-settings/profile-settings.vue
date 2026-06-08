<template>
  <view :class="themeClass" class="settings-container">
    <IosNav title="个人资料" @leftClick="goBack" />

    <scroll-view scroll-y class="settings-scroll">
      <view class="settings-inner">
        <!-- 头部 Hero -->
        <view class="hero-card" @click="showEditModal = true">
          <view class="avatar-box">
            <image :src="user.avatar" class="user-avatar" />
            <view class="edit-badge">✏️</view>
          </view>
          <view class="user-info">
            <text class="user-nickname">{{ user.nickname }}</text>
            <text class="user-id">Family ID: 88886666</text>
          </view>
          <text class="chevron">›</text>
        </view>

        <!-- 设置项分组 -->
        <view class="menu-group">
          <text class="group-label">账户安全</text>
          <view class="menu-card">
            <view class="menu-item">
              <view class="menu-left">
                <view class="menu-icon-bg green">
                  <text class="menu-emoji">📱</text>
                </view>
                <text class="menu-label">绑定手机号</text>
              </view>
              <view class="menu-right">
                <text class="menu-val">138****8888</text>
                <text class="menu-arrow">›</text>
              </view>
            </view>
            <view class="menu-item">
              <view class="menu-left">
                <view class="menu-icon-bg indigo">
                  <text class="menu-emoji">🛡️</text>
                </view>
                <text class="menu-label">账号注销</text>
              </view>
              <view class="menu-right">
                <text class="menu-arrow">›</text>
              </view>
            </view>
          </view>
        </view>

        <view class="menu-group">
          <text class="group-label">通用</text>
          <view class="menu-card">
            <view class="menu-item" @click="handleClearCache">
              <view class="menu-left">
                <view class="menu-icon-bg blue">
                  <text class="menu-emoji">🧹</text>
                </view>
                <text class="menu-label">清除缓存</text>
              </view>
              <view class="menu-right">
                <text class="menu-val">128 MB</text>
                <text class="menu-arrow">›</text>
              </view>
            </view>
            <view class="menu-item">
              <view class="menu-left">
                <view class="menu-icon-bg gray">
                  <text class="menu-emoji">📄</text>
                </view>
                <text class="menu-label">服务协议</text>
              </view>
              <view class="menu-right">
                <text class="menu-arrow">›</text>
              </view>
            </view>
          </view>
        </view>

        <view class="logout-wrap">
          <button class="logout-btn" @click="handleLogout">退出登录</button>
        </view>
      </view>
    </scroll-view>

    <!-- 资料编辑弹窗 -->
    <ProfileEditModal 
      v-model="showEditModal" 
      :isEdit="true"
      :initialAvatar="user.avatar"
      :initialNickname="user.nickname"
      @complete="onUpdateComplete"
    />
  </view>
</template>

<script setup>
import { useAppTheme } from '@/common/themes/useAppTheme.js'
const { themeClass, primaryColor, softColor, theme } = useAppTheme()

import { ref, reactive } from 'vue';
import IosNav from '../../components/nav/ios-nav.vue';
import ProfileEditModal from '../../components/common/ProfileEditModal.vue';
import { goToLogin } from '../js/utils';

const showEditModal = ref(false);
const user = reactive({
  avatar: 'https://i.pravatar.cc/150?u=me',
  nickname: '王先生'
});

const goBack = () => uni.navigateBack();

const onUpdateComplete = (data) => {
  user.avatar = data.avatar;
  user.nickname = data.nickname;
  uni.showToast({ title: '修改成功', icon: 'success' });
};

const handleClearCache = () => {
  uni.showLoading({ title: '清理中' });
  setTimeout(() => {
    uni.hideLoading();
    uni.showToast({ title: '清理完成', icon: 'success' });
  }, 1000);
};

const handleLogout = () => {
  uni.showModal({
    title: '退出登录',
    content: '确定要退出当前账号吗？',
    success: (res) => {
      if (res.confirm) {
       goToLogin();
      }
    }
  });
};
</script>

<style scoped>
.settings-container { height: 100vh; background: #F8FAFC; display: flex; flex-direction: column; overflow: hidden; }
.settings-scroll { flex: 1; height: 0; }
.settings-inner { padding: 20px; }

.hero-card { 
  background: #fff; border-radius: 40px; padding: 28px; 
  display: flex; align-items: center; border: 1px solid #F1F5F9; 
  box-shadow: 0 8px 30px rgba(0,0,0,0.02); margin-bottom: 32px;
}
.avatar-box { position: relative; width: 64px; height: 64px; margin-right: 18px; }
.user-avatar { width: 100%; height: 100%; border-radius: 22px; border: 3px solid #F8FAFC; }
.edit-badge { 
  position: absolute; bottom: -4px; right: -4px; width: 22px; height: 22px; 
  background: #fff; border-radius: 50%; display: flex; align-items: center; 
  justify-content: center; font-size: 10px; border: 1px solid #F1F5F9;
}
.user-info { flex: 1; display: flex; flex-direction: column; }
.user-nickname { font-size: 20px; font-weight: 900; color: #1E293B; letter-spacing: -0.5px; }
.user-id { font-size: 11px; font-weight: 800; color: #94A3B8; margin-top: 2px; text-transform: uppercase; }
.chevron { font-size: 24px; color: #CBD5E1; }

.menu-group { margin-bottom: 32px; }
.group-label { font-size: 11px; font-weight: 900; color: #CBD5E1; text-transform: uppercase; letter-spacing: 1.5px; margin-left: 12px; margin-bottom: 14px; display: block; }
.menu-card { background: #fff; border-radius: 34px; border: 1px solid #F1F5F9; overflow: hidden; }

.menu-item { padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #F8FAFC; }
.menu-item:last-child { border-bottom: none; }
.menu-item:active { background: #F8FAFC; }
.menu-left { display: flex; align-items: center; gap: 16px; }
.menu-icon-bg { width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
.menu-icon-bg.green { background: #ECFDF5; color: #10B981; }
.menu-icon-bg.indigo { background: var(--primary-soft, #EEF2FF); color: var(--primary-color, #4F46E5); }
.menu-icon-bg.blue { background: #F0F9FF; color: #0EA5E9; }
.menu-icon-bg.gray { background: #F8FAFC; color: #64748B; }
.menu-emoji { font-size: 18px; }
.menu-label { font-size: 15px; font-weight: 800; color: #1E293B; }
.menu-right { display: flex; align-items: center; gap: 8px; }
.menu-val { font-size: 14px; font-weight: 700; color: #94A3B8; }
.menu-arrow { font-size: 20px; color: #CBD5E1; font-weight: bold; }

.logout-wrap { margin-top: 10px; }
.logout-btn { 
  background: #fff; color: #EF4444; height: 64px; border-radius: 22px; 
  font-size: 15px; font-weight: 800; border: 1px solid #FEE2E2; 
  display: flex; align-items: center; justify-content: center;
}
.logout-btn:active { background: #FEF2F2; opacity: 0.9; }
</style>