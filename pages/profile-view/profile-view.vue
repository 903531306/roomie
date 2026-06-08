
<template>
  <view :class="themeClass" class="profile-tab-container">
    <view class="profile-header">
      <!-- 用户主卡片 -->
      <view class="profile-main-card">
        <view class="user-card-top">
          <view class="avatar-container">
            <image src="https://i.pravatar.cc/100?u=me" class="profile-avatar" />
            <view class="avatar-edit">✏️</view>
          </view>
          <view class="profile-text">
            <text class="profile-name">王先生</text>
            <view class="profile-badge-row">
              <view class="id-badge">ID: 8888 6666</view>
              <view class="vip-badge">
                <text class="vip-icon">💎</text>
                <text class="vip-label">Premium</text>
              </view>
            </view>
          </view>
        </view>
        
        <view class="profile-stats-grid">
          <view class="stat-box">
            <text class="stat-n">12</text>
            <text class="stat-l">活跃天数</text>
          </view>
          <view class="stat-v-line"></view>
          <view class="stat-box">
            <text class="stat-n">03</text>
            <text class="stat-l">空间数量</text>
          </view>
          <view class="stat-v-line"></view>
          <view class="stat-box">
            <text class="stat-n">58</text>
            <text class="stat-l">凭证记录</text>
          </view>
        </view>
      </view>
    </view>

    <view class="profile-content">
      <view class="menu-group">
        <text class="group-title">账户与偏好</text>
        <view class="menu-card">
          <view class="menu-item" v-for="item in menuItems" :key="item.title">
            <view class="menu-item-left">
              <view class="menu-icon-bg" :style="{ backgroundColor: item.color }">
                <text class="menu-emoji">{{ item.icon }}</text>
              </view>
              <view class="menu-text-box">
                <text class="menu-item-label">{{ item.title }}</text>
                <text class="menu-item-sub">{{ item.sub }}</text>
              </view>
            </view>
            <view class="menu-item-right">
              <text class="menu-chevron">›</text>
            </view>
          </view>
        </view>
      </view>

      <view class="menu-group">
        <text class="group-title">系统与支持</text>
        <view class="menu-card">
          <view class="menu-item">
            <view class="menu-item-left">
              <view class="menu-icon-bg gray">
                <text class="menu-emoji">🛡️</text>
              </view>
              <view class="menu-text-box">
                <text class="menu-item-label">隐私中心</text>
                <text class="menu-item-sub">管理个人数据与权限</text>
              </view>
            </view>
            <text class="menu-chevron">›</text>
          </view>
          <view class="menu-item">
            <view class="menu-item-left">
              <view class="menu-icon-bg gray">
                <text class="menu-emoji">✨</text>
              </view>
              <view class="menu-text-box">
                <text class="menu-item-label">关于 FamilyLink</text>
                <text class="menu-item-sub">当前版本 {{ appVersionLabel }}</text>
              </view>
            </view>
            <text class="menu-chevron">›</text>
          </view>
        </view>
      </view>

      <view class="logout-btn-wrap">
        <button class="logout-btn">退出当前账户</button>
      </view>
    </view>
    
    <view class="home-spacer"></view>
  </view>
</template>

<script setup>
import { useAppTheme } from '@/common/themes/useAppTheme.js'
import { formatAppVersion } from '@/common/config'

const { themeClass, primaryColor, softColor, theme } = useAppTheme()
const appVersionLabel = formatAppVersion()

const menuItems = [
  { title: '消息提醒', sub: '通知中心与推送设置', icon: '🔔', color: 'var(--primary-glow, rgba(79, 70, 229, 0.08))' },
  { title: '家庭成员', sub: '管理共同记账的好友', icon: '👥', color: 'rgba(16, 185, 129, 0.08)' },
  { title: '资产导出', sub: '生成 Excel 或 PDF 报表', icon: '💳', color: 'rgba(244, 63, 94, 0.08)' },
];
</script>

<style scoped>
.profile-tab-container { min-height: 100vh; background-color: #F8FAFC; }

.profile-header { padding: 70px 24px 20px; background: linear-gradient(to bottom, #fff 0%, #F8FAFC 100%); }
.profile-main-card { background: #fff; border-radius: 40px; padding: 28px; box-shadow: 0 20px 50px rgba(0,0,0,0.03); border: 1px solid #F1F5F9; }

.user-card-top { display: flex; align-items: center; margin-bottom: 32px; }
.avatar-container { position: relative; margin-right: 20px; }
.profile-avatar { width: 72px; height: 72px; border-radius: 24px; border: 4px solid #F8FAFC; box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
.avatar-edit {
  position: absolute; bottom: -6px; right: -6px; width: 28px; height: 28px;
  background: #fff; /* 可以保留背景色或根据需要修改 */
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px;
  box-shadow: none; /* 移除阴影 */
  border: none; /* 移除边框线 */
}

.profile-name { font-size: 22px; font-weight: 900; color: #1E293B; letter-spacing: -0.5px; }
.profile-badge-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
.id-badge { font-size: 11px; font-weight: 800; color: #94A3B8; background: #F8FAFC; padding: 4px 10px; border-radius: 8px; }
.vip-badge { background: var(--primary-color, #4F46E5); padding: 4px 10px; border-radius: 8px; display: flex; align-items: center; gap: 4px; box-shadow: 0 4px 10px var(--primary-glow, rgba(79, 70, 229, 0.2)); }
.vip-icon { font-size: 10px; }
.vip-label { font-size: 10px; font-weight: 900; color: #fff; text-transform: uppercase; letter-spacing: 0.5px; }

.profile-stats-grid { display: flex; align-items: center; justify-content: space-around; background: #F8FAFC; border-radius: 24px; padding: 18px 0; }
.stat-box { text-align: center; flex: 1; }
.stat-n { font-size: 22px; font-weight: 900; color: #1E293B; letter-spacing: -1px; display: block; }
.stat-l { font-size: 10px; font-weight: 800; color: #94A3B8; margin-top: 2px; text-transform: uppercase; }
.stat-v-line { width: 1px; height: 24px; background: #E2E8F0; }

.profile-content { padding: 10px 24px 40px; }
.menu-group { margin-bottom: 28px; }
.group-title { font-size: 12px; font-weight: 900; color: #CBD5E1; text-transform: uppercase; letter-spacing: 1.5px; margin-left: 10px; margin-bottom: 14px; display: block; }
.menu-card { background: #fff; border-radius: 36px; border: 1px solid #F1F5F9; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.01); }

.menu-item { padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #F8FAFC; }
.menu-item:last-child { border-bottom: none; }
.menu-item:active { background: #F8FAFC; }
.menu-item-left { display: flex; align-items: center; gap: 16px; }
.menu-icon-bg { width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
.menu-icon-bg.gray { background: #F8FAFC; }
.menu-emoji { font-size: 18px; }
.menu-text-box { display: flex; flex-direction: column; }
.menu-item-label { font-size: 15px; font-weight: 800; color: #1E293B; }
.menu-item-sub { font-size: 11px; font-weight: 700; color: #94A3B8; margin-top: 2px; }
.menu-chevron { font-size: 20px; color: #CBD5E1; font-weight: bold; }

.logout-btn-wrap { margin-top: 10px; padding: 0 10px; }
.logout-btn { background: #fff; color: #EF4444; height: 60px; border-radius: 20px; font-size: 15px; font-weight: 800; border: 1px solid #FEE2E2; display: flex; align-items: center; justify-content: center; }

.home-spacer { height: 120px; }
</style>
