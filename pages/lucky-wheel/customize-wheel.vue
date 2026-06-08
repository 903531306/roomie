
<template>
  <view :class="themeClass" class="customize-page">

	<IosNav
	   :title="hasData ? '管理决策盘' : '创建新决策'" 
	  @leftClick="goBack" 
	  :showHome="showHomeBack"
	/>

    <!-- 氛围背景装饰 -->
    <view class="ambient-mesh">
      <view class="blob blob-1"></view>
      <view class="blob blob-2"></view>
    </view>

    <!-- 1. 空状态视图 -->
    <view v-if="!hasData" class="empty-state-container animate-fade-in">
      <view class="empty-visual-hero">
        <view class="hero-circle-glow"></view>
        <text class="hero-emoji">🎡</text>
      </view>
      <view class="empty-text-group">
        <text class="empty-h1">开启您的第一个灵感盘</text>
        <text class="empty-p">定制专属选项，让生活多一点惊喜与果断</text>
      </view>
      <button class="create-trigger-btn" @click="openEditor">
        <view class="btn-glow-layer"></view>
        <text class="btn-icon">＋</text>
        <text class="btn-txt">立即创建自定义轮盘</text>
      </button>
    </view>

    <!-- 2. 已有数据视图 -->
    <scroll-view v-else scroll-y class="main-scroll animate-fade-in">
      <view class="scroll-inner">
        <!-- 实时预览区 -->
        <view class="preview-card">
          <view class="card-header-row">
            <view class="card-tag">当前决策配置</view>
            <view v-if="!isPreviewSpinning" class="test-spin-hint">点击轮盘测试效果</view>
          </view>
          
          <view class="wheel-preview-outer">
            <view class="wheel-preview-wrap" @click="handleTestSpin">
              <view class="wheel-shadow"></view>
              <WheelDisk 
                :options="wheelData.options" 
                :rotationAngle="previewAngle" 
                :spinning="isPreviewSpinning" 
              />
            </view>
          </view>

          <view class="preview-text">
            <text class="p-title">{{ wheelData.title }}</text>
            <text class="p-sub">{{ wheelData.subtitle }}</text>
            <!-- 动态显示必中目标的文字 -->
            <view v-if="hasTargetOption" class="target-badge-anim">
              <text class="tb-txt">✨ 必中目标：{{ targetOptionName }}</text>
            </view>
          </view>
          
          <view class="card-action-bar">
            <view class="spin-btn-wrapper" @click="handleTestSpin">
              <button 
                class="main-spin-btn" 
                :disabled="isPreviewSpinning" 
                :class="{ 'is-spinning': isPreviewSpinning }"
              >
                <view class="btn-shine" v-if="!isPreviewSpinning"></view>
                <text class="btn-label">{{ isPreviewSpinning ? '正在寻觅...' : '测试一次旋转' }}</text>
              </button>
            </view>
          </view>
        </view>

        <!-- 选项列表明细 -->
        <view class="list-section">
          <view class="section-head">
            <text class="section-label">选项清单 ({{ wheelData.options.length }})</text>
            <view class="add-inline-btn" @click="openEditor">
              <text>修改配置</text>
            </view>
          </view>
          
          <view class="options-grid">
            <view 
              v-for="(item, index) in wheelData.options" 
              :key="index" 
              class="opt-pill animate-slide-up"
              :class="{ 'is-active-target': item.isTarget }"
              :style="{ animationDelay: (index * 0.05) + 's' }"
            >
              <view class="opt-color" :style="{ background: item.color }"></view>
              <text class="opt-name">{{ item.name }}</text>
              <text v-if="item.isTarget" class="star-mini">★</text>
            </view>
          </view>
        </view>

        <view class="safe-bottom-spacer"></view>
      </view>
    </scroll-view>

    <!-- 4. 结果浮层 -->
<!--    <view v-if="showResult" class="result-overlay" @click="showResult = false">
      <view class="result-card animate-pop">
        <view class="res-top-tag">测试结果</view>
        <view class="res-visual">
           <view class="res-orb"></view>
           <text class="res-main">{{ finalResult.name }}</text>
        </view>
        <view class="res-divider"></view>
        <button class="res-btn primary" @click.stop="showResult = false">确定</button>
      </view>
    </view> -->
	
	<!-- 结果浮层 (组件版) -->
	<ResultModal 
	  v-if="showResult" 
	  :wheelTitle="wheelData.title"
	  :resultName="finalResult.name"
	  @close="showResult = false"
	/>

    <!-- 5. 编辑模态框 -->
    <view 
      v-if="showModal" 
      class="modal-mask" 
      :class="{ 'mask-closing': isClosing }"
      @click="closeModal" 
      @touchmove.stop.prevent
    >
      <view 
        class="modal-panel animate-slide-up" 
        :class="{ 'panel-closing': isClosing }"
        :style="{ 
          transform: `translateY(${panelY}px)`, 
          transition: isSwiping ? 'none' : 'transform 0.4s cubic-bezier(0.19, 1, 0.22, 1)' 
        }"
        @click.stop
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
      >
        <view class="modal-handle"></view>
        <view class="drawer-header">
          <view class="header-main">
            <text class="drawer-title">{{ hasData ? '修改配置' : '新建配置' }}</text>
            <text class="drawer-subtitle">WHEEL CONFIGURATION</text>
          </view>
          <view class="drawer-close" @click="closeModal">✕</view>
        </view>

        <scroll-view scroll-y class="drawer-scroll">
          <view class="form-group">
            <text class="f-label">轮盘主题</text>
            <view class="f-input-wrap">
              <input v-model="form.title" class="f-input" placeholder="例如：晚饭吃什么" />
            </view>
          </view>
          
          <view class="form-group">
            <text class="f-label">描述/副标题</text>
            <view class="f-input-wrap">
              <input v-model="form.subtitle" class="f-input" placeholder="纠结者的救星" />
            </view>
          </view>

          <view class="form-group">
            <view class="f-label-row">
              <text class="f-label">选项配置 (限5字内，点击 ★ 必中)</text>
              <text class="f-add-opt" @click="addOption">+ 添加新选项</text>
            </view>
            
            <view class="form-options-stack">
              <view 
                v-for="(opt, oIdx) in form.options" 
                :key="oIdx" 
                class="opt-form-row"
                :class="{ 'row-target': opt.isTarget }"
              >
                <view class="opt-color-dot" :style="{ background: opt.color }" @click="cycleColor(oIdx)"></view>
                <input 
                  v-model="opt.name" 
                  class="opt-input" 
                  placeholder="输入选项" 
                  maxlength="5"
                />
                <view class="opt-right-actions">
                  <view class="target-toggle" :class="{ 'active': opt.isTarget }" @click="toggleTarget(oIdx)">
                    <text class="star-icon">★</text>
                  </view>
                  <view class="opt-del" @click="removeOption(oIdx)">✕</view>
                </view>
              </view>
              <view v-if="form.options.length === 0" class="empty-list-hint">
                <text class="elh-txt">点击上方“添加新选项”开始</text>
              </view>
            </view>
          </view>
        </scroll-view>

        <view class="drawer-footer">
          <button 
            class="confirm-btn" 
            :class="{ 'is-disabled': isConfirmDisabled }"
            :disabled="isConfirmDisabled"
            @click="handleSaveToLocal"
          >
            <text>{{ confirmBtnText }}</text>
          </button>
        </view>
        <view class="safe-area-bottom"></view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { useAppTheme } from '@/common/themes/useAppTheme.js'
const { themeClass, primaryColor, softColor, theme } = useAppTheme()

import { ref, reactive, onMounted, computed } from 'vue';
import { onLoad } from "@dcloudio/uni-app";
import IosNav from '../../components/nav/ios-nav.vue';
import WheelDisk from '../../components/lucky-wheel/WheelDisk.vue';

// import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import { useGlobalShare } from '../js/useGlobalShare.js';

import ResultModal from '../../components/common/ResultModal.vue';

const hasData = ref(false);
const showModal = ref(false);
const wheelData = reactive({ title: '', subtitle: '', options: [] });
const form = reactive({ title: '', subtitle: '', options: [] });
const showHomeBack = ref(false);

useGlobalShare({
  title: () => wheelData.title || '灵感决策盘',
  path: () =>  '/pages/lucky-wheel/customize-wheel?from=share'
});

onLoad((options) => { 
	if(options && options.id){
		newsId.value = options.id;
	}
	const isShareByParam = options.from === 'share';
	let isShareByScene = false;
	// #ifdef MP-WEIXIN
	const { scene } = wx.getLaunchOptionsSync();
	isShareByScene = scene === 1007 || scene === 1008;
	// #endif
	showHomeBack.value = (isShareByParam || isShareByScene);
});


const previewAngle = ref(0);
const isPreviewSpinning = ref(false);
const showResult = ref(false);
const finalResult = ref({});

const isClosing = ref(false);
const isSwiping = ref(false);
const panelY = ref(0);
let startY = 0;

useGlobalShare({
  title: () => title.value || '灵感决策盘',
  path: () =>  '/pages/customize-wheel/customize-wheel?from=share'
});

const presetColors = ['var(--primary-color, #4F46E5)', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

// 计算是否存在必中目标
const hasTargetOption = computed(() => wheelData.options.some(o => o.isTarget));

// 获取选中的必中目标文字内容
const targetOptionName = computed(() => {
  const target = wheelData.options.find(o => o.isTarget);
  return target ? target.name : '';
});

const isConfirmDisabled = computed(() => {
  if (form.options.length < 2) return true;
  return form.options.some(o => !o.name.trim() || o.name.length > 5);
});

const confirmBtnText = computed(() => {
  if (form.options.length < 2) return '请先添加至少 2 个选项';
  if (form.options.some(o => !o.name.trim())) return '请填写完整的选项内容';
  if (form.options.some(o => o.name.length > 5)) return '选项文字限5字以内';
  return '保存配置';
});

onMounted(() => {
  const saved = uni.getStorageSync('editing_wheel');
  if (saved && saved.options && saved.options.length > 0) {
    Object.assign(wheelData, JSON.parse(JSON.stringify(saved)));
    hasData.value = true;
  }
});

const goBack = () => uni.navigateBack();

const onTouchStart = (e) => {
  startY = e.touches[0].clientY;
  isSwiping.value = true;
};

const onTouchMove = (e) => {
  const currentY = e.touches[0].clientY;
  const diff = currentY - startY;
  if (diff > 0) panelY.value = diff;
};

const onTouchEnd = () => {
  isSwiping.value = false;
  if (panelY.value > 150) closeModal();
  else panelY.value = 0;
};

const handleTestSpin = () => {
  if (isPreviewSpinning.value) return;
  isPreviewSpinning.value = true;
  showResult.value = false;

  const options = wheelData.options;
  const sectorAngle = 360 / options.length;
  const forcedIdx = options.findIndex(o => o.isTarget);
  const targetIndex = forcedIdx !== -1 ? forcedIdx : Math.floor(Math.random() * options.length);
  const extraRounds = 5 + Math.floor(Math.random() * 3); 
  const targetOffset = (targetIndex * sectorAngle) + (sectorAngle / 2);
  const baseAngle = previewAngle.value - (previewAngle.value % 360);
  previewAngle.value = baseAngle + (extraRounds * 360) + (360 - targetOffset);

  setTimeout(() => {
    isPreviewSpinning.value = false;
    finalResult.value = options[targetIndex];
    showResult.value = true;
  }, 5000); 
};

const openEditor = () => {
  panelY.value = 0;
  isClosing.value = false;
  if (hasData.value) {
    Object.assign(form, JSON.parse(JSON.stringify(wheelData)));
  } else {
    form.title = '';
    form.subtitle = '';
    form.options = [];
  }
  showModal.value = true;
};

const closeModal = () => {
  isClosing.value = true;
  panelY.value = 800;
  setTimeout(() => {
    showModal.value = false;
    isClosing.value = false;
    panelY.value = 0;
  }, 300);
};

const toggleTarget = (idx) => {
  const currentState = form.options[idx].isTarget;
  form.options.forEach(o => o.isTarget = false);
  if (!currentState) {
    form.options[idx].isTarget = true;
  }
};

const addOption = () => {
  if (form.options.length > 0) {
    const lastOpt = form.options[form.options.length - 1];
    if (!lastOpt.name.trim()) {
      uni.showToast({ title: '请先输入当前选项内容', icon: 'none' });
      return;
    }
    if (lastOpt.name.length > 5) {
      uni.showToast({ title: '选项不能超过5个字', icon: 'none' });
      return;
    }
  }

  const nextColor = presetColors[form.options.length % presetColors.length];
  form.options.push({ name: '', color: nextColor, isTarget: false });
};

const removeOption = (idx) => {
  form.options.splice(idx, 1);
};

const cycleColor = (idx) => {
  const current = form.options[idx].color;
  const cIdx = presetColors.indexOf(current);
  form.options[idx].color = presetColors[(cIdx + 1) % presetColors.length];
};

const handleSaveToLocal = () => {
  if (!form.title.trim()) {
    uni.showToast({ title: '请输入轮盘标题', icon: 'none' });
    return;
  }
  
  uni.showLoading({ title: '同步配置中' });
  
  setTimeout(() => {
    Object.assign(wheelData, JSON.parse(JSON.stringify(form)));
    hasData.value = true;
    uni.setStorageSync('editing_wheel', JSON.parse(JSON.stringify(wheelData)));
    uni.hideLoading();
    closeModal();
  }, 500);
};
</script>

<style scoped>
.customize-page { height: 100vh; background: #F8FAFC; display: flex; flex-direction: column; overflow: hidden; position: relative; }
.ambient-mesh { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
.blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.08; }
.blob-1 { top: -5%; right: -5%; width: 300px; height: 300px; background: var(--primary-color, #4F46E5); }
.blob-2 { bottom: 10%; left: -5%; width: 250px; height: 250px; background: #7C3AED; }

.main-scroll { flex: 1; height: 0; z-index: 1; }
.scroll-inner { padding: 20px; }

.empty-state-container { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 100px 40px; text-align: center; }
.empty-visual-hero { position: relative; width: 140px; height: 140px; display: flex; align-items: center; justify-content: center; margin-bottom: 40px; }
.hero-circle-glow { position: absolute; inset: 0; background: radial-gradient(circle, var(--primary-glow, rgba(79, 70, 229, 0.15)) 0%, transparent 70%); border-radius: 50%; animation: pulseGlow 3s infinite alternate; }
.hero-emoji { font-size: 70px; position: relative; z-index: 2; }
@keyframes pulseGlow { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(1.3); opacity: 0.8; } }

.empty-text-group { margin-bottom: 60px; }
.empty-h1 { font-size: 22px; font-weight: 900; color: #1E293B; margin-bottom: 12px; display: block; }
.empty-p { font-size: 14px; font-weight: 700; color: #94A3B8; line-height: 1.6; }

.create-trigger-btn { position: relative; width: 240px; height: 74px; background: #1E293B; border-radius: 26px; display: flex; align-items: center; justify-content: center; gap: 12px; border: none; overflow: hidden; box-shadow: 0 15px 30px rgba(0,0,0,0.1); }
.create-trigger-btn:active { transform: scale(0.96); opacity: 0.9; }
.btn-glow-layer { position: absolute; inset: 0; background: linear-gradient(135deg, var(--primary-glow, rgba(79, 70, 229, 0.1)), transparent); }
.btn-icon { color: #fff; font-size: 24px; font-weight: 300; }
.btn-txt { color: #fff; font-size: 15px; font-weight: 900; }

.preview-card { background: #fff; border-radius: 40px; padding: 32px; border: 1px solid #F1F5F9; box-shadow: 0 10px 30px rgba(0,0,0,0.02); margin-bottom: 24px; text-align: center; overflow: hidden; }
.card-header-row { display: flex; justify-content: space-between; align-items: center;  }
.card-tag { font-size: 10px; font-weight: 900; color: var(--primary-color, #4F46E5); text-transform: uppercase; letter-spacing: 2px; }
.test-spin-hint { font-size: 10px; font-weight: 800; color: #CBD5E1; }

.wheel-preview-outer { display: flex; justify-content: center; width: 100%; overflow: visible; }
.wheel-preview-wrap { display: flex; justify-content: center; align-items: center; position: relative; margin-bottom: 20px; padding: 10px 0; transform: scale(0.82); width: 340px; }
.wheel-shadow { position: absolute; width: 280px; height: 20px; background: rgba(0,0,0,0.03); bottom: -10px; border-radius: 50%; filter: blur(10px); }

.preview-text { display: flex; flex-direction: column; gap: 6px; margin-bottom: 24px; align-items: center; }
.p-title { font-size: 24px; font-weight: 900; color: #1E293B; }
.p-sub { font-size: 13px; font-weight: 700; color: #94A3B8; }
.target-badge-anim {display: flex; background: #F59E0B; padding: 6px 16px; border-radius: 100px;  animation: targetPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.tb-txt { color: #fff; font-size: 11px; font-weight: 900; }

.main-spin-btn { width: 100%; height: 68px; background: #1E293B; border-radius: 32px; border: none; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1); box-shadow: 0 20px 40px rgba(30, 41, 59, 0.25); }
.main-spin-btn.is-spinning { background: #475569; opacity: 0.8; box-shadow: none; }
.btn-shine { position: absolute; top: 0; left: -100%; width: 50%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); transform: skewX(-25deg); animation: shine 3s infinite; }
@keyframes shine { from { left: -100%; } to { left: 200%; } }
.btn-label { color: #fff; font-size: 17px; font-weight: 900; letter-spacing: 2px; }

.result-overlay { position: fixed; inset: 0; z-index: 2000; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(20px); display: flex; align-items: center; justify-content: center; padding: 40px; }
.result-card { width: 100%; max-width: 320px; background: #1E293B; border-radius: 48px; padding: 44px 40px; display: flex; flex-direction: column; align-items: center; box-shadow: 0 40px 120px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.08); }
.res-top-tag { font-size: 10px; font-weight: 900; color: #818CF8; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 24px; }
.res-orb { position: absolute; inset: -20px; background: radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%); filter: blur(10px); z-index: -1; }
.res-main { font-size: 40px; font-weight: 900; color: #fff; text-align: center; line-height: 1.1; letter-spacing: -1px; }
.res-divider { width: 36px; height: 4px; background: rgba(255,255,255,0.1); border-radius: 10px; margin: 36px 0; }
.res-btn { width: 100%; height: 60px; border-radius: 20px; font-size: 15px; font-weight: 900; display: flex; align-items: center; justify-content: center; transition: all 0.2s; border: none; }
.res-btn.primary { background: #fff; color: #1E293B; }

.list-section { padding: 0 10px; }
.section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.section-label { font-size: 11px; font-weight: 900; color: #CBD5E1; text-transform: uppercase; letter-spacing: 2px; }
.add-inline-btn { background: var(--primary-soft, #EEF2FF); padding: 6px 14px; border-radius: 100px; }
.add-inline-btn text { font-size: 12px; font-weight: 900; color: var(--primary-color, #4F46E5); }

.options-grid { display: flex; flex-wrap: wrap; gap: 10px; }
.opt-pill { background: #fff; padding: 10px 18px; border-radius: 100px; border: 1px solid #F1F5F9; display: flex; align-items: center; gap: 8px; position: relative; }
.opt-pill.is-active-target { border-color: #F59E0B; background: #FFFBEB; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.1); }
.opt-color { width: 10px; height: 10px; border-radius: 50%; }
.opt-name { font-size: 14px; font-weight: 800; color: #475569; }
.star-mini { color: #F59E0B; font-size: 14px; }

.modal-mask { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); z-index: 9000; display: flex; align-items: flex-end; transition: opacity 0.3s; }
.mask-closing { opacity: 0; }
.modal-panel { width: 100%; background: #fff; border-radius: 44px 44px 0 0; padding: 20px 24px; box-shadow: 0 -20px 60px rgba(0, 0, 0, 0.1); will-change: transform; }
.panel-closing { transform: translateY(100%); }
.modal-handle { width: 42px; height: 5px; background: #E2E8F0; border-radius: 10px; margin: 0 auto 32px; }

.drawer-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; padding: 0 8px; flex-shrink: 0; }
.header-main { display: flex; flex-direction: column; gap: 2px; }
.drawer-title { font-size: 20px; font-weight: 900; color: #1E293B; }
.drawer-subtitle { font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 1.5px; }
.drawer-close { width: 36px; height: 36px; background: #F8FAFC; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #CBD5E1; font-weight: bold; }

.drawer-scroll { max-height: 50vh; margin-bottom: 24px; }
.form-group { margin-bottom: 28px; }
.f-label { font-size: 11px; font-weight: 900; color: #CBD5E1; text-transform: uppercase; margin-bottom: 12px; display: block; letter-spacing: 1.5px; }
.f-label-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.f-add-opt { font-size: 12px; font-weight: 900; color: var(--primary-color, #4F46E5); }
.f-input-wrap { background: #F8FAFC; height: 60px; border-radius: 18px; padding: 0 20px; border: 1px solid #F1F5F9; display: flex; align-items: center; }
.f-input { flex: 1; font-size: 16px; font-weight: 800; color: #1E293B; }

.form-options-stack { display: flex; flex-direction: column; gap: 12px; }
.opt-form-row { background: #F8FAFC; height: 64px; border-radius: 20px; padding: 0 16px; display: flex; align-items: center; border: 2px solid transparent; transition: all 0.3s; }
.row-target { background: #FFFBEB; border-color: #F59E0B; }
.opt-color-dot { width: 28px; height: 28px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.05); flex-shrink: 0; }
.opt-input { flex: 1; margin: 0 14px; font-size: 14px; font-weight: 800; color: #334155; }
.opt-right-actions { display: flex; align-items: center; gap: 10px; }
.target-toggle { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: #fff; border-radius: 12px; border: 1px solid #F1F5F9; }
.target-toggle.active { background: #F59E0B; border-color: #F59E0B; }
.star-icon { font-size: 18px; color: #CBD5E1; }
.active .star-icon { color: #fff; }
.opt-del { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; color: #F43F5E; opacity: 0.4; }

.empty-list-hint { padding: 40px 0; text-align: center; border: 2px dashed #F1F5F9; border-radius: 24px; }
.elh-txt { font-size: 12px; font-weight: 700; color: #CBD5E1; }

.confirm-btn {display: flex;align-items: center; justify-content: center; background: var(--primary-color, #4F46E5); height: 64px; border-radius: 22px; color: #fff; font-size: 16px; font-weight: 900; border: none; box-shadow: 0 10px 25px var(--primary-glow, rgba(79, 70, 229, 0.2)); transition: all 0.3s; }
.confirm-btn.is-disabled { background: #F1F5F9; color: #CBD5E1; box-shadow: none; }

.safe-bottom-spacer { height: 140px; }
.safe-area-bottom { height: env(safe-area-inset-bottom); margin-top: 12px; }

.animate-fade-in { animation: fadeIn 0.8s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-pop { animation: pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) both; }
@keyframes pop { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
.animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.19, 1, 0.22, 1); }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
</style>
