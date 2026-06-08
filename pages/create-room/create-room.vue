<template>
  <view :class="themeClass" class="create-room-page" :style="themeStyles">
    <!-- 固定导航栏 -->
    <IosNav title="新建空间" @leftClick="goBack" />

    <scroll-view scroll-y class="content-scroll" :show-scrollbar="false">
      <!-- 页面装饰：动态迷散色块 -->
      <view class="decor-blob-top"></view>
      <view class="decor-blob-bottom"></view>

      <view class="page-inner">
        <!-- 第一部分：房间名称 -->
        <view class="form-section animate-slide-up">
          <text class="section-label">空间名称</text>
          <view class="name-input-group">
            <view class="input-card" :class="{ 'is-focus': isNameInputFocused }">
              <view class="input-prefix">🏷️</view>
              <input 
                v-model="roomName" 
                class="ios-input" 
                placeholder="例如：王先生的温馨小窝" 
                placeholder-style="color: #CBD5E1; font-weight: 600;"
                maxlength="12"
                focus
                @focus="isNameInputFocused = true"
                @blur="isNameInputFocused = false"
              />
              <view v-if="roomName" class="clear-btn" @click="roomName = ''">✕</view>
            </view>
            <text class="input-tip">好的名字是幸福生活的开始</text>
          </view>
        </view>

        <!-- 第二部分：空间类型 -->
        <view class="form-section animate-slide-up" style="animation-delay: 0.1s;">
          <text class="section-label">空间类型</text>
          
          <!-- 骨架屏：空间类型 -->
          <view v-if="isLoading" class="type-grid">
            <view v-for="i in 4" :key="'sk-type-'+i" class="type-card skeleton-item">
              <view class="sk-circle shimmer" style="width: 56px; height: 56px; border-radius: 20px; margin-bottom: 14px;"></view>
              <view class="sk-line shimmer" style="width: 50%; height: 14px; border-radius: 4px;"></view>
            </view>
          </view>

          <!-- 真实数据：空间类型 -->
          <view v-else class="type-grid">
            <view 
              v-for="item in roomTemplates" 
              :key="item.id"
              class="type-card"
              :class="{ 'type-active': selectedType === item.code }"
              @click="handleTypeSelect(item)"
            >
              <view class="type-icon-box" :style="{ background: item.color }">
                <image 
                  v-if="isImageUrl((item.code === 'custom' && isCustomConfigured) ? customIcon : item.icon)" 
                  :src="(item.code === 'custom' && isCustomConfigured) ? customIcon : item.icon" 
                  mode="aspectFill" 
                  class="type-icon-img" 
                />
                <text v-else class="type-emoji">{{ (item.code === 'custom' && isCustomConfigured) ? customIcon : item.icon }}</text>
              </view>
              <text class="type-name">{{ (item.code === 'custom' && isCustomConfigured) ? customName : item.label }}</text>
              <view v-if="selectedType === item.code" class="active-dot"></view>
            </view>
          </view>
        </view>

        <!-- 第四部分：功能配置 -->
        <view class="form-section animate-slide-up" style="animation-delay: 0.3s;">
          <text class="section-label">进阶配置</text>
          
          <!-- 骨架屏：进阶配置 -->
          <view v-if="isLoading" class="glass-config-card skeleton-item" style="border-color: transparent;">
            <view class="card-left">
              <view class="sk-circle shimmer" style="width: 52px; height: 52px; border-radius: 18px;"></view>
              <view class="info-text">
                <view class="sk-line shimmer" style="width: 80px; height: 16px; margin-bottom: 8px; border-radius: 4px;"></view>
                <view class="sk-line shimmer" style="width: 140px; height: 11px; border-radius: 3px;"></view>
              </view>
            </view>
            <view class="sk-line shimmer" style="width: 24px; height: 24px; border-radius: 8px;"></view>
          </view>

          <!-- 真实数据：进阶配置 -->
          <view v-else class="glass-config-card" @click="openFeaturePicker">
            <view class="card-left">
              <view class="icon-circle" :style="{ background: softColor }">
                <text class="emoji">🧩</text>
              </view>
              <view class="info-text">
                <text class="title">功能模块</text>
                <text class="subtitle">点击配置房间核心组件</text>
              </view>
            </view>
            <view class="card-right">
              <view v-if="selectedFeatures.length > 0" class="feature-stack">
                <view 
                  v-for="(f, fidx) in selectedFeatures" 
                  :key="f.id" 
                  class="feat-stack-item"
                  :style="{ 
                    zIndex: 10 - fidx, 
                    marginLeft: fidx === 0 ? '0' : '-14px',
                    background: f.bgColor || softColor
                  }"
                >
                  <image v-if="isImageUrl(f.icon)" :src="f.icon" mode="aspectFill" class="feat-stack-img" />
                  <text v-else class="feat-stack-emoji">{{ f.icon }}</text>
                </view>
                <view v-if="selectedFeatures.length > 4" class="stack-more">
                  <text class="more-txt">+{{ selectedFeatures.length - 4 }}</text>
                </view>
              </view>
              <text v-else class="placeholder-txt">未选择功能</text>
              <text class="arrow">›</text>
            </view>
          </view>
        </view>

        <view class="bottom-padding-spacer"></view>
      </view>
    </scroll-view>

    <!-- 底部固定操作栏 -->
    <view class="fixed-footer-action">
      <view class="footer-blur-bg"></view>
      <button class="primary-create-btn" @click="handleCreate">
        <text class="btn-main-txt">立即创建空间</text>
      </button>
      <view class="safe-area-bottom"></view>
    </view>

    <!-- 自定义风格选择器 -->
    <BottomPicker 
      v-model="showCustomEditor"
      title="自定义风格"
      subtitle="选择一个最能代表该空间的图标"
      layout="grid"
      :currentSelected="selectedCustom"
      :options="customIconOptions"
      @change="onCustomIconSelected"
    />

    <BottomPicker 
      v-if="featureOptions"
      v-model="showFeaturePicker"
      title="配置功能模块"
      subtitle="选择您在这个房间需要的工具"
      layout="grid"
      :multiple="false"
      :options="featureOptions"
      :currentSelected="selectedFeatures"
      @change="onFeaturesConfirmed"
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
import { typeApi, userApi, roomApi } from '@/common/api';
import dataJson from '/data.json';

// 状态管理
const isLoading = ref(true);
const roomName = ref('');
const isNameInputFocused = ref(true);
const selectedType = ref('family');
const showMemberPicker = ref(false);
const showFeaturePicker = ref(false);
const showCustomEditor = ref(false);

const isCustomConfigured = ref(false);
const customIcon = ref('✨');
const customName = ref('自定义');

const roomTemplates = ref([]);
const customIconOptions = ref([]);
const featureOptions = ref([]);
const selectedCustom = ref([]);
const selectedFeatures = ref([]);

const features = ref(null);
const template = ref(null);

const isImageUrl = (val) => {
  if (typeof val !== 'string') return false;
  const v = val.toLowerCase();
  return v.startsWith('http') || v.startsWith('/') || v.startsWith('data:image') || v.includes('.png') || v.includes('.jpg') || v.includes('.jpeg') || v.includes('.webp');
};

onMounted(() => {
  getData();
});

const getData = async () => {
  isLoading.value = true;
  try {
    // 使用 Promise.all 同时发起请求提高效率
    await Promise.all([
      getAllFeatures(),
      getAllTemplates(),
      getAllIcons()
    ]);
  } catch (e) {
    console.error("加载配置失败", e);
  } finally {
    // 延迟一丢丢时间让动画展示更完整，避免闪现
    setTimeout(() => {
      isLoading.value = false;
    }, 600);
  }
}

// 获取房间的功能
const getAllFeatures = async () => {
  const res = await typeApi.getAllFeatures();
  if (res.code == 0) {
    featureOptions.value = res.data;
    if (featureOptions.value.length > 0) {
      selectedFeatures.value = [featureOptions.value[0]];
      features.value = featureOptions.value[0].code;
    }
  }
}

// 获取房间类型
const getAllTemplates = async () => {
  const res = await typeApi.getAllTemplates();
  if (res.code == 0) {
    roomTemplates.value = res.data;
    if (roomTemplates.value.length > 0) {
      template.value = roomTemplates.value[0];
	  customIcon.value=roomTemplates.value[0].icon;
      selectedType.value = roomTemplates.value[0].code;
    }
  }
}

// 获取房间的图标
const getAllIcons = async () => {
  const res = await typeApi.getAllIcons();
  if (res.code == 0) {
    customIconOptions.value = res.data;
  }
}

const goBack = () => uni.navigateBack();

const handleTypeSelect = (item) => {
  selectedType.value = item.code;
  template.value = item;
  if (item.code === 'custom') {
    showCustomEditor.value = true;
  }
};

const onCustomIconSelected = (item) => {
  selectedCustom.value = [item];
  customIcon.value = item.icon;
  customName.value = item.label;
  isCustomConfigured.value = true;
};

const openFeaturePicker = () => { if (!isLoading.value) showFeaturePicker.value = true; };

const onFeaturesConfirmed = (val) => {
  features.value = val.code;
  selectedFeatures.value = [val];
}

const handleCreate = async () => {
  if (!roomName.value.trim()) {
    uni.showToast({ title: '请输入空间名称', icon: 'none' });
    return;
  }
  if (!features.value || !template.value) return;
  
  try {
    const map = {
      "name": roomName.value,
      "icon": customIcon.value,
      "templateId": template.value.id,
      "featuresId": selectedFeatures.value[0].id // 根据 API 结构调整
    };
    uni.showLoading({ title: '正在建立空间...' });
    const res = await roomApi.createRoom(map, dataJson.userInfo.userId);
    if (res.code == 0) {
		uni.$emit('refresh_room_data');
      uni.showToast({ title: '空间已就绪', icon: 'success' });
	  dataJson.userInfo.roomCount += 1;
	  uni.setStorageSync("userInfo", dataJson.userInfo);
      setTimeout(() => {
        uni.hideLoading();
        uni.navigateBack();
      }, 1000);
    } else {
      uni.hideLoading();
    }
  } catch (e) {
    uni.hideLoading();
  }
};
</script>

<style scoped>
.create-room-page { 
  height: 100vh; 
  background-color: var(--primary-soft, #EEF2FF);
  display: flex; 
  flex-direction: column; 
  overflow: hidden; 
  position: relative;
  transition: background-color 0.35s ease;
}

/* 装饰背景 */
.decor-blob-top { position: absolute; top: -100px; right: -80px; width: 300px; height: 300px; background: var(--primary-color, #4F46E5); filter: blur(120px); opacity: 0.08; border-radius: 50%; pointer-events: none; }
.decor-blob-bottom { position: absolute; bottom: 10%; left: -50px; width: 200px; height: 200px; background: var(--secondary-color, #7C3AED); filter: blur(100px); opacity: 0.05; border-radius: 50%; pointer-events: none; }

.content-scroll { 
  flex: 1; 
  height: 0; 
  z-index: 1; 
}
.page-inner { padding: 24px 20px; }

.form-section { margin-bottom: 10px; }
.section-label { 
  font-size: 11px; font-weight: 900; color: #94A3B8; 
  text-transform: uppercase; letter-spacing: 2px; 
  margin-bottom: 8px; display: block; padding-left: 6px; 
}

/* 骨架屏通用流光动画 */
.skeleton-item { border-color: transparent !important; pointer-events: none; }
.shimmer {
  position: relative;
  background: #F1F5F9 !important;
  overflow: hidden;
}
.shimmer::after {
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
  transform: translateX(-100%);
  background-image: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0,
    rgba(255, 255, 255, 0.4) 20%,
    rgba(255, 255, 255, 0.7) 60%,
    rgba(255, 255, 255, 0)
  );
  animation: shimmerAnim 2s infinite;
  content: '';
}
@keyframes shimmerAnim {
  100% { transform: translateX(100%); }
}

/* 输入框样式 */
.name-input-group { display: flex; flex-direction: column; gap: 8px; }
.input-card {
  background: #fff;
  height: 60px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  border: 1.5px solid var(--primary-soft, #eef2ff);
  box-shadow: 0 8px 30px var(--primary-glow, rgba(79, 70, 229, 0.06));
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}
.input-card.is-focus {
  border-color: var(--primary-color, #4f46e5);
  border-width: 2px;
  padding: 0 23px;
  box-shadow: 0 8px 32px var(--primary-glow, rgba(79, 70, 229, 0.18));
}
.input-prefix { font-size: 24px; margin-right: 16px; }
.ios-input { flex: 1; font-size: 20px; font-weight: 800; color: #1E293B; }
.clear-btn {
  width: 22px; height: 22px;
  background: var(--primary-soft, #EEF2FF);
  color: var(--primary-color, #4F46E5);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: bold;
  opacity: 0.85;
  transition: background 0.35s ease, color 0.35s ease;
}
.input-tip { font-size: 11px; font-weight: 700; color: #CBD5E1; padding-left: 20px; }

/* 类型网格 */
.type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.type-card { 
  background: #fff; height: 120px; border-radius: 34px; 
  display: flex; flex-direction: column; align-items: center; justify-content: center; 
  position: relative; border: 2.5px solid var(--primary-soft, #EEF2FF);
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), border-color 0.35s ease, box-shadow 0.35s ease;
  box-shadow: 0 4px 15px var(--primary-glow, rgba(79, 70, 229, 0.04));
}
.type-icon-box { width: 56px; height: 56px; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin-bottom: 14px; overflow: hidden; }
.type-emoji { font-size: 28px; }
.type-icon-img { width: 32px; height: 32px; border-radius: 8px; }
.type-name { font-size: 14px; font-weight: 800; color: #64748B; }
.type-active { border-color: var(--primary-color, #4F46E5); transform: scale(1.03); background: #fff; box-shadow: 0 15px 35px var(--primary-glow, rgba(79, 70, 229, 0.2)); }
.type-active .type-name { color: var(--primary-color, #4F46E5); }
.active-dot { position: absolute; top: 12px; right: 12px; width: 10px; height: 10px; background: var(--primary-color, #4F46E5); border-radius: 50%; border: 2px solid #fff; }

/* 配置卡片 */
.glass-config-card { 
  background: #fff; border-radius: 34px; padding: 24px; 
  display: flex; justify-content: space-between; align-items: center; 
  border: 1.5px solid var(--primary-soft, #EEF2FF);
  transition: all 0.2s, border-color 0.35s ease, box-shadow 0.35s ease;
  box-shadow: 0 4px 20px var(--primary-glow, rgba(79, 70, 229, 0.05));
}
.glass-config-card:active { transform: scale(0.97); background: var(--primary-soft, #EEF2FF); }
.card-left { display: flex; align-items: center; gap: 18px; }
.icon-circle { width: 52px; height: 52px; border-radius: 18px; display: flex; align-items: center; justify-content: center; }
.emoji { font-size: 26px; }
.info-text { display: flex; flex-direction: column; }
.title { font-size: 16px; font-weight: 800; color: #1E293B; }
.subtitle { font-size: 11px; font-weight: 700; color: #94A3B8; margin-top: 2px; }

.card-right { display: flex; align-items: center; gap: 14px; }
.placeholder-txt { font-size: 13px; font-weight: 800; color: #CBD5E1; }
.arrow { font-size: 22px; color: var(--primary-color, #4F46E5); font-weight: bold; opacity: 0.35; transition: color 0.35s ease, opacity 0.35s ease; }
.glass-config-card:active .arrow { opacity: 0.7; }

/* 堆叠样式 */
.avatar-stack, .feature-stack { display: flex; align-items: center; }
.feat-stack-item { 
  width: 34px; height: 34px; border-radius: 14px; 
  border: 3px solid #fff; overflow: hidden; 
  box-shadow: 4px 0 10px rgba(0,0,0,0.05); 
  display: flex; align-items: center; justify-content: center;
}
.feat-stack-emoji { font-size: 16px; }
.feat-stack-img { width: 20px; height: 20px; border-radius: 4px; }

.stack-more { 
  width: 34px; height: 34px; border-radius: 50%;
  background: var(--primary-soft, #EEF2FF);
  display: flex; align-items: center; justify-content: center; 
  border: 3px solid #fff; margin-left: -14px; z-index: 1;
  transition: background 0.35s ease;
}
.more-txt { font-size: 10px; font-weight: 900; color: var(--primary-color, #4F46E5); opacity: 0.6; }

.bottom-padding-spacer { height: 180px; }

/* 固定底部栏 */
.fixed-footer-action { 
  position: fixed; 
  bottom: 0; left: 0; right: 0; 
  padding: 24px; 
  z-index: 100; 
  display: flex;
  flex-direction: column;
}
.footer-blur-bg { 
  position: absolute; inset: 0; 
  background: rgba(255, 255, 255, 0.85); 
  backdrop-filter: blur(25px); 
  -webkit-backdrop-filter: blur(25px);
  z-index: -1;
  border-top: 1px solid rgba(0,0,0,0.03);
}

.primary-create-btn { 
  width: 100%;
  background: var(--primary-color, #4F46E5);
  height: 72px;
  border-radius: 26px; 
  display: flex; align-items: center; justify-content: center; 
  box-shadow: 0 15px 35px var(--primary-glow, rgba(79, 70, 229, 0.25)); 
  border: none;
  transition: background 0.35s ease, box-shadow 0.35s ease;
}
.primary-create-btn:active { transform: scale(0.96); opacity: 0.9; }
.btn-main-txt { font-size: 17px; font-weight: 900; color: #fff; letter-spacing: 1px; }
.safe-area-bottom { height: env(safe-area-inset-bottom); }

/* 动画 */
.animate-slide-up { animation: slideUp 0.6s cubic-bezier(0.19, 1, 0.22, 1) both; }
@keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
</style>
