<template>
  <view :class="themeClass" class="login-wrapper">
    <!-- 增加：悬浮返回按钮 -->
    <view class="floating-back-btn animate-fade-in" @click="goBack">
      <image src="../../static/back/icon_back.png" style="height: 20px;width: 20px;"/>
    </view>

    <!-- 1. 增强版动态背景 -->
    <view class="liquid-bg-container">
      <view class="bg-white-base"></view>
      <view class="liquid-orb orb-primary"></view>
      <view class="liquid-orb orb-secondary"></view>
      <view class="liquid-orb orb-tertiary"></view>
      <!-- 动态质感层 -->
      <view class="grain-overlay"></view>
    </view>

    <!-- 2. 全屏流式内容 -->
    <scroll-view scroll-y class="login-scroll-view" :show-scrollbar="false">
      <view class="content-container">
        
        <!-- 品牌区 -->
        <view class="brand-section animate-slide-down">
          <view class="brand-logo-wrap">
            <view class="logo-aura"></view>
            <text class="logo-text">🏠</text>
          </view>
          <view class="brand-titles">
            <text class="app-name"></text>
            <text class="app-motto">记录点滴，连接家庭</text>
          </view>
        </view>

        <!-- 交互表单区 -->
        <view class="form-area animate-fade-in">
          <!-- 微信登录视图 -->
          <view v-if="loginMode === 'wechat'" class="mode-view animate-pop">
            <view class="welcome-text">
              <text class="h1">欢迎加入</text>
              <!-- <text class="p">与 24,000+ 家庭一起高效管理生活</text> -->
            </view>
            
            <button class="btn-main btn-wx" @click="handleWechatLogin">
              <text class="btn-emoji"></text>
              <text class="btn-txt">微信一键登录</text>
            </button>
            <!-- <text class="security-hint">🔒 加密传输 · 隐私受法律保护</text> -->
          </view>

          <!-- 账号密码视图 -->
          <view v-else class="mode-view animate-fade-in">
            <view class="input-stack">
              <view class="field-item" :class="{ 'is-focus': focused === 'u' }">
                <text class="f-icon">👤</text>
                <input v-model="credentials.account" class="f-input" placeholder="手机号 / 用户名" placeholder-style="color: #CBD5E1" @focus="focused='u'" @blur="focused=''" />
              </view>
              <view class="field-item" :class="{ 'is-focus': focused === 'p' }">
                <text class="f-icon">🔒</text>
                <input v-model="credentials.password" type="password" class="f-input" placeholder="请输入登录密码" placeholder-style="color: #CBD5E1" @focus="focused='p'" @blur="focused=''" />
              </view>
            </view>
            
            <button class="btn-main btn-login" @click="handlePasswordLogin">
              <text class="btn-txt">登 录</text>
            </button>
            
            <!-- <view class="form-links">
              <text class="link-txt">找回密码</text>
              <text class="link-txt">新用户注册</text>
            </view> -->
          </view>
        </view>

        <!-- 模式切换触发器 -->
        <view class="switcher-zone animate-fade-in">
          <view class="line-divider">
            <view class="l-line"></view>
            <text class="l-txt">更多登录方式</text>
            <view class="l-line"></view>
          </view>
          
          <view class="mode-toggle-btn" @click="toggleLoginMode">
            <view class="toggle-icon-bg">
              <text class="t-icon">{{ loginMode === 'wechat' ? '🔑' : '📲' }}</text>
            </view>
            <text class="t-label">{{ loginMode === 'wechat' ? '账号密码登录' : '返回微信一键登录' }}</text>
          </view>
        </view>

        <!-- 3. 协议区：流式排版，避免重叠 -->
       <!-- <view class="agreement-footer animate-fade-in" :class="{ 'shake-active': showShake }">
          <view class="check-box-outer" @click="isAgreed = !isAgreed">
            <view class="check-box-inner" :class="{ 'is-checked': isAgreed }">
              <text v-if="isAgreed" class="check-v">✓</text>
            </view>
          </view>
         <view class="agreement-content">
            <text class="ag-gray">我已阅读并同意</text>
            <text class="ag-blue" @click.stop="openDoc('user')">《用户协议》</text>
            <text class="ag-gray">与</text>
            <text class="ag-blue" @click.stop="openDoc('privacy')">《隐私政策》</text>
          </view>
        </view> -->
        
        <view class="bottom-safe-area"></view>
      </view>
    </scroll-view>

    <!-- 资料完善弹窗 -->
    <ProfileEditModal 
      v-if="pendingUserInfo"
      v-model="showEditModal" 
      @complete="onLoginComplete"
      :userInfo="pendingUserInfo"
    />
	  <!-- 弹窗 2：凭证提醒（账号密码生成） -->
	    <CredentialReminderModal 
	      v-model="showCredentialModal"
	      :username="generatedCreds.account"
	      :password="generatedCreds.password"
	      @confirm="enterHome"
	    />
  </view>
</template>

<script setup>
import { useAppTheme } from '@/common/themes/useAppTheme.js'
const { themeClass, primaryColor, softColor, theme } = useAppTheme()

import { ref, reactive } from 'vue';
import ProfileEditModal from '../../components/common/ProfileEditModal.vue';
import CredentialReminderModal from '../../components/common/CredentialReminderModal.vue';
import { userApi } from '@/common/api';
import { useUserStore } from '@/store/user';
import dataJson from '/data.json';
import { onLoad } from "@dcloudio/uni-app";

const userStore = useUserStore();
const loginMode = ref('wechat'); 
const isAgreed = ref(false);
const showEditModal = ref(false);
const showShake = ref(false);
const pendingUserInfo = ref(null);
const focused = ref('');
const showCredentialModal = ref(false);
const inviteCode=ref(null);

const generatedCreds = ref({
  account: '',
  password: ''
});

onLoad((e)=>{
	if(e&&e.inviteCode){
		inviteCode.value=e.inviteCode;
	}
})

const credentials = reactive({ account: '', password: '' });

// 增加：返回上一级逻辑
const goBack = () => {
  uni.navigateBack({
    fail: () => {
      uni.reLaunch({ url: '/pages/index/index' });
    }
  });
};

const toggleLoginMode = () => {
  loginMode.value = loginMode.value === 'wechat' ? 'password' : 'wechat';
};

const triggerShake = () => {
  showShake.value = true;
  setTimeout(() => { showShake.value = false; }, 500);
};

const handleWechatLogin = async () => {
  // if (!isAgreed.value) { triggerShake(); return; }
  uni.showLoading({ title: '安全连接中' });
  try {
    const providerRes = await uni.getProvider({ service: 'oauth' });
    if (!providerRes.provider.includes('weixin')) throw new Error('环境不支持');
    const loginRes = await uni.login({ provider: 'weixin', onlyAuthorize: true });
	console.log("打印",loginRes);
    const loginResult = await userApi.login({code:loginRes.code,invitedCode:inviteCode.value});
    if (loginResult.code === 0) processLoginSuccess(loginResult.data,true);
    else if (loginResult.code === 333) {
      pendingUserInfo.value = loginResult.data;
      showEditModal.value = true;
      uni.hideLoading();
    }
  } catch (e) { 
	  uni.hideLoading(); 
  	console.log("打印",e);
	}
};

const handlePasswordLogin = async() => {
	if(!credentials.account){
		uni.showToast({
			title:"请输入用户名",
			icon:'none'
		})
		return ;
	}
	if(!credentials.password){
		uni.showToast({
			title:"请输入密码",
			icon:'none'
		})
		return ;
	}
  // if (!isAgreed.value) { triggerShake(); return; }
  console.log(credentials);
  try {
	  uni.showLoading({ title: '安全连接中' });
	  console.log("的地点的",inviteCode.value);
	  if(inviteCode.value){
		  credentials.invitedCode=inviteCode.value;
	  }
	   var res=await userApi.accountLogin(credentials);
	  if (res.code === 0) processLoginSuccess(res.data,true);
	   // uni.showToast({ title: '正在演示账号登录', icon: 'none' });
  }catch(e){
	 uni.hideLoading(); 
  }
 
};
const enterHome = () => {
	loginIndex();
};
const processLoginSuccess = (userData,isBack) => {
  uni.hideLoading();
  	console.log("1111");
  userStore.state.currentUser = userData;
  userStore.state.isLoggedIn = true;
  dataJson.userInfo=userData;
  dataJson.isLogin=true;
  uni.setStorageSync('userInfo', userData);
  // const inviteCode = uni.getStorageSync('inviteCode')
  // if (inviteCode) {
  //   uni.removeStorageSync('inviteCode')
  // }

  if(isBack){
	  uni.showToast({ title: '欢迎回家', icon: 'success' });
	    	console.log("0000");
	  loginIndex();
  }
};

const loginIndex = () => {
  uni.navigateBack({
    success() {
      // 页面已经返回，再通知
      uni.$emit('user_login', true)
    }
  })
}


const onLoginComplete = (userData)=>{
	showCredentialModal.value=true;
	generatedCreds.value.account=userData.email;
	generatedCreds.value.password=userData.password;
	console.log(generatedCreds.value);
	 processLoginSuccess(userData,false);
};
const openDoc = (t) => uni.showToast({ title: '协议加载中...', icon: 'none' });
</script>

<style scoped>
.login-wrapper {
  position: fixed;
  inset: 0;
  background: var(--primary-soft, #ffffff);
  overflow: hidden;
  transition: background-color 0.35s ease;
}

/* 增加：悬浮返回按钮样式 */
.floating-back-btn {
  position: fixed;
  top: 54px; /* 适配灵动岛下方 */
  left: 24px;
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  border: 1px solid rgba(241, 245, 249, 0.5);
  box-shadow: 0 8px 24px rgba(0,0,0,0.04);
  transition: transform 0.2s;
}
.floating-back-btn:active { transform: scale(0.9); }
.back-arrow { font-size: 32px; color: #1E293B; font-weight: 300; margin-top: -4px; margin-right: 2px; }

/* 1. 流光动效背景 */
.liquid-bg-container { position: absolute; inset: 0; z-index: 0; }
.bg-white-base { position: absolute; inset: 0; background: #FFFFFF; }

.liquid-orb { position: absolute; border-radius: 50%; filter: blur(120px); opacity: 0.12; }
.orb-primary { 
  width: 500px; height: 500px; background: var(--primary-color, #4F46E5); 
  top: -150px; left: -100px; animation: driftOrb 25s infinite alternate linear;
}
.orb-secondary {
  width: 450px;
  height: 450px;
  background: var(--secondary-color, #7c3aed);
  bottom: -100px;
  right: -80px;
  animation: driftOrb 30s infinite alternate-reverse linear;
  transition: background 0.35s ease;
}
.orb-tertiary {
  width: 300px;
  height: 300px;
  background: var(--primary-color, #4f46e5);
  opacity: 0.1;
  top: 40%;
  left: 30%;
  animation: driftOrb 20s infinite alternate ease-in-out;
  transition: background 0.35s ease;
}

@keyframes driftOrb {
  0% { transform: translate(0, 0) scale(1) rotate(0deg); }
  50% { transform: translate(50px, 80px) scale(1.1) rotate(45deg); }
  100% { transform: translate(-30px, -50px) scale(0.9) rotate(-30deg); }
}

.grain-overlay {
  position: absolute; inset: 0; opacity: 0.04; pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  animation: grainShift 8s steps(10) infinite;
}
@keyframes grainShift {
  0%, 100% { transform: translate(0,0); }
  10% { transform: translate(-2%,-1%); }
  30% { transform: translate(1%,-3%); }
  50% { transform: translate(-1%,2%); }
  70% { transform: translate(2%,1%); }
  90% { transform: translate(-1%,-2%); }
}

/* 2. 布局逻辑 */
.login-scroll-view { position: relative; z-index: 10; height: 100%; }
.content-container { 
  min-height: 100%; display: flex; flex-direction: column; 
  padding: 0 44px;
}

/* 品牌区 */
.brand-section { padding-top: 100px; margin-bottom: 50px; display: flex; flex-direction: column; align-items: center; }
.brand-logo-wrap { 
  position: relative; width: 90px; height: 90px; background: #fff; 
  border-radius: 34px; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.03); border: 1px solid rgba(241, 245, 249, 0.5);
}
.logo-aura { position: absolute; inset: -15px; background: var(--primary-color, #4F46E5); opacity: 0.06; filter: blur(20px); border-radius: 50%; }
.logo-text { font-size: 48px; z-index: 2; }

.brand-titles { text-align: center; margin-top: 24px; }
.app-name { font-size: 34px; font-weight: 900; color: #1E293B; letter-spacing: -1.5px; }
.app-motto { font-size: 14px; font-weight: 700; color: #94A3B8; margin-top: 8px; display: block; letter-spacing: 1px; }

/* 交互区 */
.form-area { margin-top: 20px; margin-bottom: 20px; }
.welcome-text { text-align: center; margin-bottom: 44px; }
.h1 { font-size: 26px; font-weight: 800; color: #1E293B; display: block; }
.p { font-size: 14px; font-weight: 600; color: #94A3B8; margin-top: 12px; display: block; }

.btn-main {
  width: 100%;
  height: 72px;
  border-radius: 26px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  background: var(--primary-color, #4f46e5);
  box-shadow: 0 14px 36px var(--primary-glow, rgba(79, 70, 229, 0.32));
  transition: transform 0.25s ease, background 0.35s ease, box-shadow 0.35s ease;
}
.btn-main::after { border: none; }
.btn-main:active { transform: scale(0.97); opacity: 0.92; }
.btn-wx,
.btn-login {
  background: var(--primary-color, #4f46e5);
}
.btn-emoji { font-size: 24px; }
.btn-txt { font-size: 17px; font-weight: 900; color: #FFFFFF; letter-spacing: 0.5px; }

.security-hint { font-size: 11px; font-weight: 800; color: #CBD5E1; text-align: center; display: block; margin-top: 24px; text-transform: uppercase; }

/* 账号密码模式 */
.input-stack { display: flex; flex-direction: column; gap: 18px; margin-bottom: 32px; }
.field-item { 
  background: rgba(248, 250, 252, 0.6); border: 1.5px solid #F1F5F9; 
  height: 68px; border-radius: 22px; padding: 0 24px; 
  display: flex; align-items: center; gap: 16px; transition: all 0.3s;
}
.field-item.is-focus { border-color: var(--primary-color, #4F46E5); background: #fff; box-shadow: 0 10px 30px var(--primary-glow, rgba(79, 70, 229, 0.05)); }
.f-icon { font-size: 18px; opacity: 0.3; }
.f-input { flex: 1; font-size: 16px; font-weight: 700; color: #1E293B; }

.form-links { display: flex; justify-content: space-between; padding: 0 10px; margin-top: 10px; }
.link-txt { font-size: 13px; font-weight: 800; color: #94A3B8; }

/* 切换区 */
.switcher-zone { margin-bottom: 40px; }
.line-divider { display: flex; align-items: center; gap: 16px; margin-bottom: 10px; }
.l-line { flex: 1; height: 1rpx; background: rgba(226, 232, 240, 0.8); }
.l-txt { font-size: 11px; font-weight: 800; color: #CBD5E1; text-transform: uppercase; letter-spacing: 1.5px; }

.mode-toggle-btn { display: flex; align-items: center; justify-content: center; gap: 14px; padding: 10px; }
.toggle-icon-bg {
  width: 40px;
  height: 40px;
  background: var(--primary-soft, #eef2ff);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  border: 1px solid transparent;
  transition: background 0.35s ease;
}
.t-label { font-size: 15px; font-weight: 800; color: var(--primary-color, #4F46E5); }

/* 协议区 - 底部流式锚定 */
.agreement-footer { 
  margin-top: auto; padding-bottom: 30px; 
  display: flex; align-items: flex-start; justify-content: center; gap: 12px;
}
.check-box-outer { padding-top: 2px; }
.check-box-inner { 
  width: 20px; height: 20px; border-radius: 7px; border: 2px solid #E2E8F0;
  display: flex; align-items: center; justify-content: center; transition: all 0.2s;
  background: #FFFFFF;
}
.check-box-inner.is-checked { background: var(--primary-color, #4F46E5); border-color: var(--primary-color, #4F46E5); }
.check-v { color: #fff; font-size: 12px; font-weight: bold; }

.agreement-content { font-size: 12px; font-weight: 700; line-height: 1.6; }
.ag-gray { color: #94A3B8; }
.ag-blue { color: #1E293B; border-bottom: 1px solid #F1F5F9; margin: 0 4px; }

.bottom-safe-area { height: env(safe-area-inset-bottom); margin-top: 10px; }

/* 动画库 */
.animate-slide-down { animation: slideDown 0.8s cubic-bezier(0.19, 1, 0.22, 1) both; }
@keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }

.animate-fade-in { animation: fadeIn 0.8s ease-out both; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.animate-pop { margin-top: 40px;animation: pop 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
@keyframes pop { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

.shake-active { animation: shake 0.5s both; }
@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  30%, 70% { transform: translate3d(-3px, 0, 0); }
  50% { transform: translate3d(2px, 0, 0); }
}
</style>