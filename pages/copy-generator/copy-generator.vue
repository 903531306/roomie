<template>
  <view :class="themeClass" class="copy-generator-page">
    <IosNav title="灵感文案" @leftClick="goBack" />

    <!-- 背景装饰 -->
    <view class="ambient-bg">
      <view class="glow-orb orb-1"></view>
      <view class="glow-orb orb-2"></view>
    </view>

    <scroll-view scroll-y class="content-scroll">
      <view class="container">
        <!-- 头部引导 -->
        <view class="header-section animate-fade-in">
          <text class="h1">灵感工作室</text>
          <text class="p">选择一个分类，让 AI 为你捕捉瞬间的灵感</text>
        </view>

        <!-- 分类选择器 (水平滚动样式) -->
        <view class="category-section animate-fade-in-up">
          <view class="section-header">
            <text class="section-title">灵感分类</text>
            <text class="section-subtitle">左右滑动切换</text>
          </view>
          
          <scroll-view 
            scroll-x 
            class="tag-scroll-view" 
            :show-scrollbar="false"
            enhanced
            :enable-flex="true"
          >
            <view class="tag-container">
              <view 
                v-for="(cat, index) in categories" 
                :key="cat.id"
                class="tag-item"
                :class="{ 'active': selectedCategory === cat.id }"
                :style="{ 'animation-delay': (index * 0.05) + 's' }"
                @click="selectCategory(cat.id)"
              >
                <text class="tag-name">{{ cat.name }}</text>
                <view class="tag-active-bar" v-if="selectedCategory === cat.id"></view>
              </view>
            </view>
          </scroll-view>
        </view>

        <!-- 生成按钮区 -->
        <view class="action-section animate-fade-in-up" style="animation-delay: 0.1s;">
          <view class="generate-btn-wrapper" @click="generateCopy">
            <button 
              class="generate-btn" 
              :disabled="isGenerating"
              :class="{ 'is-loading': isGenerating, 'has-result': generatedText && !isGenerating }"
            >
              <view v-if="isGenerating" class="loading-spinner"></view>
              <text class="btn-text">{{ isGenerating ? '正在捕捉灵感...' : (generatedText ? '换一个灵感' : '获取文案') }}</text>
            </button>
            <view class="btn-shadow"></view>
          </view>
        </view>

        <!-- 结果展示区 -->
        <view 
          class="result-container" 
          :class="{ 'show': generatedText || isGenerating }"
        >
          <view class="result-card" :class="{ 'pulse-loading': isGenerating }">
            <view class="card-header">
              <view class="header-left">
                <view class="quote-icon">“</view>
                <text class="card-tag">{{ currentCategoryName }}</text>
              </view>
              <view v-if="generatedText && !isGenerating" class="copy-action" @click="copyToClipboard">
                <text class="copy-icon">📋</text>
                <text class="copy-label">复制</text>
              </view>
            </view>

            <view class="card-body">
              <view v-if="isGenerating" class="skeleton-lines">
                <view class="sk-line w-full"></view>
                <view class="sk-line w-75"></view>
                <view class="sk-line w-50"></view>
              </view>
              <text v-else-if="displayedText" class="generated-content">{{ displayedText }}</text>
              <view v-else class="empty-state">
                <text class="empty-hint">点击上方按钮，开启灵感之旅</text>
              </view>
            </view>

            <view class="card-footer" v-if="generatedText && !isGenerating">
              <text class="footer-hint">灵感由 AI 实时生成，仅供参考</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 复制成功提示 -->
    <view v-if="showToast" class="toast-overlay">
      <view class="toast-content animate-pop-in">
        <text class="toast-icon">✅</text>
        <text class="toast-text">已复制到剪贴板</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { useAppTheme } from '@/common/themes/useAppTheme.js'
const { themeClass, primaryColor, softColor, theme } = useAppTheme()

import { ref, computed } from 'vue';
import IosNav from '../../components/nav/ios-nav.vue';

const categories = [
  { id: 'daily', name: '朋友圈日常', prompt: '写一段适合发朋友圈的日常生活感悟文案，要温柔、有质感、带点小确幸。' },
  { id: 'mood', name: '深夜心情', prompt: '写一段深夜心情文案，要深邃、感性、能引起共鸣，不要太丧。' },
  { id: 'work', name: '职场励志', prompt: '写一段职场励志文案，要充满动力、专业、积极向上。' },
  { id: 'love', name: '浪漫告白', prompt: '写一段浪漫的告白文案，要真诚、动人、不落俗套。' },
  { id: 'travel', name: '旅行足迹', prompt: '写一段旅行文案，要自由、洒脱、充满对世界的好奇。' },
  { id: 'food', name: '美食探店', prompt: '写一段美食文案，要让人垂涎欲滴、生动、有趣。' },
  { id: 'fitness', name: '运动打卡', prompt: '写一段运动健身打卡文案，要充满力量感、自律、热血。' },
  { id: 'book', name: '读书笔记', prompt: '写一段读书感悟文案，要文艺、深邃、富有哲理。' },
  { id: 'coffee', name: '午后咖啡', prompt: '写一段关于咖啡或下午茶的悠闲文案，要慵懒、精致、有生活气息。' },
  { id: 'tech', name: '科技数码', prompt: '写一段关于科技产品或极客生活的文案，要硬核、前卫、有未来感。' }
];

const selectedCategory = ref('daily');
const isGenerating = ref(false);
const generatedText = ref('');
const displayedText = ref('');
const showToast = ref(false);

const currentCategoryName = computed(() => {
  return categories.find(c => c.id === selectedCategory.value)?.name || '灵感';
});

const goBack = () => uni.navigateBack();

const selectCategory = (id) => {
  if (isGenerating.value) return;
  selectedCategory.value = id;
  // 切换分类时清空旧文案，引导用户重新生成
  generatedText.value = '';
  displayedText.value = '';
};

let typeTimer = null;
const typeWriter = (text) => {
  if (typeTimer) clearInterval(typeTimer);
  displayedText.value = '';
  let i = 0;
  const speed = 30; // 字符出现速度
  
  typeTimer = setInterval(() => {
    if (i < text.length) {
      displayedText.value += text.charAt(i);
      i++;
    } else {
      clearInterval(typeTimer);
      typeTimer = null;
    }
  }, speed);
};

const generateCopy = async () => {
  if (isGenerating.value) return;
  
  isGenerating.value = true;
  generatedText.value = '';
  displayedText.value = '';

  try {
    const category = categories.find(c => c.id === selectedCategory.value);
    
    // 使用用户自己的 API 进行请求
    // 请根据您的实际 API 接口修改 URL 和参数
    const res = await uni.request({
      url: '/api/generate-copy', // 替换为您的实际 API 地址
      method: 'POST',
      data: {
        category: category.id,
        prompt: category.prompt
      },
      header: {
        'Content-Type': 'application/json'
      }
    });

    if (res.statusCode === 200 && res.data && res.data.text) {
      generatedText.value = res.data.text;
      typeWriter(res.data.text);
      isGenerating.value = false;
    } else {
      throw new Error('API 请求失败');
    }
  } catch (error) {
    console.error('Generation error:', error);
    // 模拟生成，方便用户测试界面效果（实际使用时请删除模拟逻辑）
    setTimeout(() => {
      const category = categories.find(c => c.id === selectedCategory.value);
      const mockText = `在生活的细碎里，寻找那些闪闪发光的瞬间。关于“${category.name}”，总有一些温柔值得被记录。`;
      generatedText.value = mockText;
      typeWriter(mockText);
      isGenerating.value = false;
    }, 1500);
  }
};

const copyToClipboard = () => {
  if (!generatedText.value) return;
  
  uni.setClipboardData({
    data: generatedText.value,
    showToast: false,
    success: () => {
      showToast.value = true;
      setTimeout(() => {
        showToast.value = false;
      }, 2000);
    }
  });
};
</script>

<style scoped>
.copy-generator-page {
  height: 100vh;
  background-color: #f8fafc;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.ambient-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.1;
}

.orb-1 { top: -10%; right: -10%; width: 400px; height: 400px; background: #6366f1; }
.orb-2 { bottom: 10%; left: -10%; width: 300px; height: 300px; background: #ec4899; }

.content-scroll {
  flex: 1;
  z-index: 1;
}

.container {
  padding: 40rpx 40rpx 100rpx;
}

.header-section {
  margin-bottom: 60rpx;
}

.h1 {
  font-size: 32px;
  font-weight: 900;
  color: #1e293b;
  letter-spacing: -1px;
}

.p {
  font-size: 14px;
  color: #64748b;
  margin-top: 12rpx;
}

/* 分类标签样式 */
.category-section {
  margin-bottom: 60rpx;
  padding: 20rpx 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
  padding: 0 40rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 800;
  color: #1e293b;
  letter-spacing: 1rpx;
}

.section-subtitle {
  font-size: 22rpx;
  color: #94a3b8;
  font-weight: 500;
}

.tag-scroll-view {
  width: 100%;
  white-space: nowrap;
}

.tag-container {
  display: inline-flex;
  padding: 10rpx 40rpx 30rpx;
  gap: 24rpx;
}

.tag-item {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24rpx 48rpx;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 32rpx;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 12rpx rgba(0, 0, 0, 0.03);
  transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
  cursor: pointer;
  position: relative;
  animation: tagEntrance 0.6s cubic-bezier(0.23, 1, 0.32, 1) both;
}

@keyframes tagEntrance {
  from { opacity: 0; transform: translateX(30rpx); }
  to { opacity: 1; transform: translateX(0); }
}

.tag-item:active {
  transform: scale(0.95);
}

.tag-item.active {
  background: #1e293b;
  border-color: #1e293b;
  box-shadow: 0 12rpx 32rpx rgba(30, 41, 59, 0.2);
  transform: translateY(-4rpx);
}

.tag-active-bar {
  width: 32rpx;
  height: 6rpx;
  background: #6366f1;
  border-radius: 100rpx;
  position: absolute;
  bottom: 12rpx;
  left: 50%;
  transform: translateX(-50%);
  animation: barExpand 0.3s ease-out;
}

@keyframes barExpand {
  from { width: 0; opacity: 0; }
  to { width: 32rpx; opacity: 1; }
}

.tag-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #64748b;
  transition: all 0.3s;
}

.active .tag-name {
  color: #ffffff;
  font-weight: 700;
}

/* 按钮区 */
.action-section {
  display: flex;
  justify-content: center;
  margin-bottom: 60rpx;
}

.generate-btn-wrapper {
  position: relative;
  width: 100%;
  max-width: 440rpx;
}

.generate-btn {
  width: 100%;
  height: 110rpx;
  background: #1e293b;
  border-radius: 55rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  z-index: 2;
  position: relative;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.generate-btn.has-result {
  background: #6366f1;
}

.generate-btn:active:not(:disabled) {
  transform: scale(0.96);
}

.generate-btn.is-loading {
  background: #334155;
}

.btn-text {
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 900;
}

.btn-shadow {
  position: absolute;
  inset: 10rpx;
  background: #1e293b;
  filter: blur(25px);
  opacity: 0.2;
  z-index: 1;
}

.loading-spinner {
  width: 32rpx;
  height: 32rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 结果卡片 */
.result-container {
  opacity: 0;
  transform: translateY(40rpx);
  transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
  pointer-events: none;
}

.result-container.show {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.result-card {
  background: #ffffff;
  border-radius: 48rpx;
  padding: 48rpx;
  border: 1px solid #f1f5f9;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40rpx;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.quote-icon {
  font-size: 60rpx;
  color: #f1f5f9;
  font-family: serif;
  line-height: 1;
  margin-top: 20rpx;
}

.card-tag {
  font-size: 20rpx;
  font-weight: 900;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 2rpx;
  background: #f8fafc;
  padding: 8rpx 20rpx;
  border-radius: 100rpx;
}

.copy-action {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 24rpx;
  background: #f1f5f9;
  border-radius: 100rpx;
  transition: all 0.2s;
}

.copy-action:active {
  background: #e2e8f0;
  transform: scale(0.95);
}

.copy-icon { font-size: 24rpx; }
.copy-label { font-size: 22rpx; font-weight: 800; color: #475569; }

.card-body {
  min-height: 200rpx;
}

.generated-content {
  font-size: 34rpx;
  color: #1e293b;
  line-height: 1.8;
  font-weight: 500;
  display: block;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200rpx;
}

.empty-hint {
  font-size: 28rpx;
  color: #cbd5e1;
  font-style: italic;
}

.card-footer {
  margin-top: 40rpx;
  padding-top: 32rpx;
  border-top: 1px solid #f8fafc;
}

.footer-hint {
  font-size: 20rpx;
  color: #cbd5e1;
}

/* 骨架屏动画 */
.skeleton-lines {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.sk-line {
  height: 32rpx;
  background: #f1f5f9;
  border-radius: 16rpx;
  position: relative;
  overflow: hidden;
}

.sk-line::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  from { transform: translateX(-100%); }
  to { transform: translateX(100%); }
}

.pulse-loading {
  animation: cardPulse 2s infinite ease-in-out;
}

@keyframes cardPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(0.99); opacity: 0.9; }
}

/* Toast */
.toast-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.toast-content {
  background: rgba(30, 41, 59, 0.9);
  backdrop-filter: blur(10px);
  padding: 32rpx 48rpx;
  border-radius: 100rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.toast-icon { font-size: 32rpx; }
.toast-text { color: #ffffff; font-size: 28rpx; font-weight: 800; }

.animate-pop-in {
  animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes popIn {
  from { opacity: 0; transform: scale(0.8) translateY(20rpx); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

/* 通用动画 */
.animate-fade-in {
  animation: fadeIn 0.8s ease-out both;
}

.animate-fade-in-up {
  animation: fadeInUp 0.8s cubic-bezier(0.23, 1, 0.32, 1) both;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30rpx); }
  to { opacity: 1; transform: translateY(0); }
}

.w-full { width: 100%; }
.w-75 { width: 75%; }
.w-50 { width: 50%; }
</style>
