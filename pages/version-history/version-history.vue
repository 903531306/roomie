<template>
  <view :class="themeClass" class="version-root">
    <!-- 氛围底色 -->
    <view class="aurora-bg">
      <view class="orb orb-1"></view>
      <view class="orb orb-2"></view>
    </view>

    <IosNav title="进化历程" @leftClick="goBack" />

    <scroll-view scroll-y class="history-scroll" :show-scrollbar="false">
      <view class="history-container">
        
        <!-- 1. 加载中：骨架屏 -->
        <block v-if="isLoading">
          <view class="current-hero skeleton-mode">
            <view class="sk-item shimmer" style="width: 40%; height: 20px; border-radius: 10px; margin-bottom: 20px;"></view>
            <view class="sk-item shimmer" style="width: 70%; height: 50px; border-radius: 14px;"></view>
          </view>
          <view class="timeline-wrapper skeleton-mode">
            <view v-for="i in 3" :key="i" class="log-entry" style="margin-bottom: 30px;">
              <view class="track-area">
                <view class="gradient-line" style="background: #E2E8F0"></view>
                <view class="node-outer" style="border-color: #E2E8F0"></view>
              </view>
              <view class="log-card shimmer" style="height: 180px;"></view>
            </view>
          </view>
        </block>

        <!-- 2. 加载错误视图 -->
        <block v-else-if="isError">
          <view class="error-state animate-fade-in">
            <view class="error-icon-box">
              <view class="error-pulse"></view>
              <text class="error-emoji">📡</text>
            </view>
            <text class="error-title">同步失败</text>
            <text class="error-desc">无法连接至进化节点，请检查网络</text>
            <button class="retry-btn" @click="getVersionList">
              <text class="retry-txt">重新连接</text>
            </button>
          </view>
        </block>

        <!-- 3. 正常内容展示 -->
        <block v-else-if="updateLogs.length > 0">
          <!-- 头部：当前版本玻璃卡片 -->
          <view class="current-hero animate-pop-in">
            <view class="glass-layer"></view>
            <view class="hero-content" v-if="currentVersion">
              <view class="hero-top">
                <view class="live-indicator">
                  <view class="dot-ripple"></view>
                  <text class="live-txt">当前运行中</text>
                </view>
                <text class="v-date-top">发布日期 {{currentVersion.releaseDate}}</text>
              </view>
              <view class="hero-main">
                <text class="v-label">版本</text>
                <text class="v-num">{{currentVersion.versionNumber}}</text>
                <view class="stable-badge">稳定版</view>
              </view>
            </view>
            <!-- 卡片右侧装饰图标 -->
            <view class="hero-deco-icon">🚀</view>
          </view>

          <!-- 垂直时间轴 -->
          <view class="timeline-wrapper">
            <view 
              v-for="(item, index) in updateLogs" 
              :key="item.version" 
              class="log-entry animate-slide-up-fancy"
              :style="{ animationDelay: (index * 0.12) + 's' }"
            >
              <!-- 时间轴轨道 -->
              <view class="track-area">
                <view class="gradient-line" :class="{ 'line-last': index === updateLogs.length - 1 }"></view>
                <view class="node-outer" :class="{ 'node-latest': index === 0 }">
                  <view class="node-inner"></view>
                </view>
              </view>

              <!-- 更新内容卡片 -->
              <view class="log-card">
                <view class="card-header">
                  <text class="v-card-num">{{ item.version }}</text>
                  <text class="v-card-date">{{ item.date }}</text>
                </view>
                
                <view class="log-groups">
                  <view v-if="item.features.length > 0" class="log-group">
                    <view class="group-pill new">
                      <text class="pill-emoji">✨</text>
                      <text class="pill-label">新功能</text>
                    </view>
                    <view class="log-items">
                      <view v-for="(feat, fIdx) in item.features" :key="fIdx" class="item-row">
                        <view class="item-bullet"></view>
                        <text class="item-text">{{ feat }}</text>
                      </view>
                    </view>
                  </view>

                  <view v-if="item.fixes.length > 0" class="log-group">
                    <view class="group-pill fix">
                      <text class="pill-emoji">🐞</text>
                      <text class="pill-label">问题修复</text>
                    </view>
                    <view class="log-items">
                      <view v-for="(fix, fixIdx) in item.fixes" :key="fixIdx" class="item-row">
                        <view class="item-bullet fix-bullet"></view>
                        <text class="item-text">{{ fix }}</text>
                      </view>
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </view>

          <view class="footer-note">
            <text class="note-txt">进化从未停止</text>
            <view class="note-line"></view>
          </view>
        </block>

        <!-- 4. 暂无数据视图 -->
        <block v-else>
          <view class="empty-state animate-fade-in">
            <view class="empty-icon-box">
              <text class="empty-emoji">📭</text>
            </view>
            <text class="empty-title">暂无记录</text>
            <text class="empty-desc">FamilyLink 正在蓄势待发，敬请期待</text>
          </view>
        </block>
        
        <view class="safe-area-bottom"></view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { useAppTheme } from '@/common/themes/useAppTheme.js'
const { themeClass, primaryColor, softColor, theme } = useAppTheme()

import IosNav from '../../components/nav/ios-nav.vue';
import { ref, onMounted } from 'vue';
import { userApi } from '../../common/api';

const goBack = () => uni.navigateBack();
const isLoading = ref(true);
const isError = ref(false);
const currentVersion = ref(null);
const updateLogs = ref([]);

onMounted(() => {
 getVersionList();
});

const getVersionList = async () => {
  isLoading.value = true;
  isError.value = false;
  try {
    const res = await userApi.getVersionInfo();
    if (res.code == 0) {
      updateLogs.value = formatVersionList(res.data);
      currentVersion.value = res.data.find(item => item.status === 'current');
    } else {
      isError.value = true;
    }
  } catch (e) {
    console.error(e);
    isError.value = true;
  } finally {
    // 延迟结束加载以获得更好的动画感
    setTimeout(() => {
      isLoading.value = false;
    }, 600);
  }
}

/**
 * 将接口版本数据转换为前端展示格式
 */
function formatVersionList(list = []) {
  if (!Array.isArray(list)) return [];

  return list.map(item => {
    const features = [];
    const fixes = [];

    (item.changelogs || []).forEach(log => {
      if (!log || !log.content) return;
      const contents = log.content
        .replace(/^'|'$/g, '')
        .split(/',\s*'/)
        .map(v => v.trim())
        .filter(Boolean);

      if (log.type === 'NEW_FEATURES') features.push(...contents);
      if (log.type === 'FIXED_ISSUES') fixes.push(...contents);
    });

    return {
      version: `v${item.versionNumber || ''}`,
      date: item.releaseDate || '',
      features,
      fixes
    };
  });
};
</script>

<style scoped>
.version-root {
  height: 100vh;
  background-color: var(--primary-soft, #EEF2FF);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: background-color 0.35s ease;
}

/* 动态背景 */
.aurora-bg { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
.orb { position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.12; }
.orb-1 { top: -100px; right: -50px; width: 350px; height: 350px; background: var(--primary-color, #4F46E5); animation: drift 20s infinite alternate; }
.orb-2 { bottom: 10%; left: -80px; width: 300px; height: 300px; background: var(--secondary-color, #8B5CF6); animation: drift 25s infinite alternate-reverse; transition: background 0.35s ease; }
@keyframes drift { from { transform: translate(0,0); } to { transform: translate(40px, 30px); } }

.history-scroll { flex: 1; height: 0; position: relative; z-index: 1; }
.history-container { padding: 30px 20px; }

/* Hero 卡片 */
.current-hero {
  position: relative; height: 180px; border-radius: 40px; margin-bottom: 50px;
  overflow: hidden; display: flex; flex-direction: column; justify-content: center; padding: 0 34px;
  box-shadow: 0 25px 50px var(--primary-glow, rgba(79, 70, 229, 0.15));
}
.glass-layer { 
  position: absolute; inset: 0;
  background: linear-gradient(135deg, var(--primary-color, #4F46E5) 0%, var(--secondary-color, #0F172A) 100%);
  transition: background 0.35s ease;
}
.hero-content { position: relative; z-index: 2; flex: 1; display: flex; flex-direction: column; justify-content: center; }
.hero-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.live-indicator { display: flex; align-items: center; gap: 8px; background: rgba(16, 185, 129, 0.15); padding: 4px 10px; border-radius: 100px; }
.dot-ripple { width: 6px; height: 6px; background: #10B981; border-radius: 50%; position: relative; }
.dot-ripple::after { content: ''; position: absolute; inset: -4px; border: 1px solid #10B981; border-radius: 50%; animation: ripple 1.5s infinite; }
@keyframes ripple { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(2.5); opacity: 0; } }
.live-txt { font-size: 10px; font-weight: 900; color: #10B981; text-transform: uppercase; letter-spacing: 0.5px; }
.v-date-top { font-size: 11px; font-weight: 700; color: rgba(255, 255, 255, 0.65); }

.hero-main { display: flex; align-items: baseline; gap: 10px; }
.v-label { font-size: 12px; font-weight: 800; color: rgba(255, 255, 255, 0.75); letter-spacing: 2px; }
.v-num { font-size: 48px; font-weight: 900; color: #fff; letter-spacing: -2px; line-height: 1; }
.stable-badge { background: #fff; color: var(--primary-color, #4F46E5); font-size: 9px; font-weight: 900; padding: 2px 8px; border-radius: 6px; margin-left: 6px; transform: translateY(-12px); }
.hero-deco-icon { position: absolute; right: -10px; bottom: -20px; font-size: 120px; opacity: 0.05; transform: rotate(-15deg); pointer-events: none; }

/* 时间轴 */
.timeline-wrapper { padding-left: 10px; }
.log-entry { display: flex; gap: 28px; margin-bottom: 8px; }

.track-area { position: relative; width: 24px; display: flex; flex-direction: column; align-items: center; }
.gradient-line { width: 1.5px; flex: 1; background: linear-gradient(to bottom, var(--primary-color, #4F46E5), #E2E8F0 40%, #E2E8F0); }
.line-last { background: linear-gradient(to bottom, #E2E8F0, transparent); }

.node-outer { 
  width: 14px; height: 14px; border-radius: 50%; background: #fff; 
  border: 3px solid #E2E8F0; position: absolute; top: 10px; z-index: 5; 
}
.node-latest { border-color: var(--primary-color, #4F46E5); box-shadow: 0 0 15px var(--primary-glow, rgba(79, 70, 229, 0.3)); }
.node-inner { width: 100%; height: 100%; border-radius: 50%; background: transparent; transition: all 0.3s; }
.node-latest .node-inner { background: var(--primary-color, #4F46E5); }

/* 卡片 */
.log-card {
  flex: 1; background: #fff; border-radius: 32px; padding: 28px;
  border: 1px solid rgba(241, 245, 249, 0.8); box-shadow: 0 10px 30px rgba(0,0,0,0.02);
  margin-bottom: 34px; transition: transform 0.3s ease;
}
.log-card:active { transform: scale(0.985); }

.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.v-card-num { font-size: 20px; font-weight: 900; color: #1E293B; }
.v-card-date { font-size: 12px; font-weight: 800; color: #CBD5E1; }

.log-groups { display: flex; flex-direction: column; gap: 24px; }
.log-group { display: flex; flex-direction: column; gap: 14px; }

.group-pill { 
  align-self: flex-start; display: flex; align-items: center; gap: 8px; 
  padding: 6px 14px; border-radius: 100px;
}
.group-pill.new { background: var(--primary-soft, #EEF2FF); }
.group-pill.fix { background: #FFF1F2; }

.pill-emoji { font-size: 14px; }
.pill-label { font-size: 9px; font-weight: 900; letter-spacing: 1px; }
.new .pill-label { color: var(--primary-color, #4F46E5); }
.fix .pill-label { color: #F43F5E; }

.log-items { display: flex; flex-direction: column; gap: 10px; }
.item-row { display: flex; align-items: flex-start; gap: 12px; }
.item-bullet { width: 5px; height: 5px; border-radius: 50%; background: var(--primary-color, #4F46E5); margin-top: 8px; flex-shrink: 0; opacity: 0.3; }
.fix-bullet { background: #F43F5E; }
.item-text { font-size: 14px; font-weight: 600; color: #475569; line-height: 1.5; }

.footer-note { padding: 60px 0; display: flex; flex-direction: column; align-items: center; gap: 16px; }
.note-txt { font-size: 11px; font-weight: 900; color: #CBD5E1; letter-spacing: 3px; }
.note-line { width: 40px; height: 2px; background: #F1F5F9; border-radius: 10px; }

/* 骨架屏与空状态 */
.skeleton-mode { pointer-events: none; }
.shimmer { position: relative; overflow: hidden; background: #F1F5F9 !important; border: none !important; }
.shimmer::after { position: absolute; inset: 0; transform: translateX(-100%); background-image: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent); animation: shimmerAnim 2s infinite; content: ''; }
@keyframes shimmerAnim { 100% { transform: translateX(100%); } }

.empty-state { padding: 100px 40px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.empty-icon-box { width: 100px; height: 100px; background: #fff; border-radius: 35px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.03); }
.empty-emoji { font-size: 48px; }
.empty-title { font-size: 18px; font-weight: 900; color: #1E293B; margin-bottom: 8px; }
.empty-desc { font-size: 13px; font-weight: 600; color: #94A3B8; }

/* 错误视图样式 */
.error-state { padding: 120px 40px; text-align: center; display: flex; flex-direction: column; align-items: center; }
.error-icon-box { position: relative; width: 100px; height: 100px; background: #fff; border-radius: 35px; display: flex; align-items: center; justify-content: center; margin-bottom: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.03); }
.error-emoji { font-size: 48px; position: relative; z-index: 2; }
.error-pulse { position: absolute; inset: 0; background: #FEE2E2; border-radius: 35px; animation: errorPulse 2s infinite; }
@keyframes errorPulse { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(1.4); opacity: 0; } }
.error-title { font-size: 18px; font-weight: 900; color: #1E293B; margin-bottom: 8px; }
.error-desc { font-size: 13px; font-weight: 600; color: #94A3B8; margin-bottom: 40px; }
.retry-btn {
  background: var(--primary-color, #4F46E5);
  padding: 12px 36px;
  border-radius: 100px;
  border: none;
  box-shadow: 0 10px 25px var(--primary-glow, rgba(79, 70, 229, 0.25));
  transition: background 0.35s ease, box-shadow 0.35s ease;
}
.retry-btn:active { transform: scale(0.95); }
.retry-txt { color: #fff; font-size: 14px; font-weight: 800; }

.safe-area-bottom { height: env(safe-area-inset-bottom); margin-top: 20px; }

/* 进场动画 */
.animate-pop-in { animation: popIn 0.8s cubic-bezier(0.19, 1, 0.22, 1) both; }
@keyframes popIn { from { opacity: 0; transform: scale(0.9) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }

.animate-slide-up-fancy { animation: slideUpFancy 0.7s cubic-bezier(0.19, 1, 0.22, 1) both; }
@keyframes slideUpFancy { from { opacity: 0; transform: translateY(40px) scale(0.98) rotateX(-10deg); } to { opacity: 1; transform: translateY(0) scale(1) rotateX(0); } }
.animate-fade-in { animation: fadeIn 0.6s ease-out both; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>