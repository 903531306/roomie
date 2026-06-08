
<template>
  <view :class="['app-shell', themeClass]">
    <!-- 动态展示子 Tab 组件 -->
    <view class="tab-content">
      <HomeView v-if="currentTab === 'home'" />
      <ProfileView v-else-if="currentTab === 'profile'" />
    </view>

    <!-- 灵动悬浮底栏 -->
    <view class="tab-bar-container">
      <view class="tab-bar-pod">
        <!-- 核心：等分三部分的弹性滑块 -->
        <view 
          class="tab-active-pill" 
          :style="{ transform: `translateX(${currentTab === 'home' ? '0%' : '200%'})` }"
        >
          <view class="pill-inner-glow"></view>
        </view>

        <!-- 首页 Tab (占据 1/3) -->
        <view 
          class="tab-item" 
          :class="{ active: currentTab === 'home' }"
          @click="currentTab = 'home'"
        >
          <text class="tab-icon">🏠</text>
          <text class="tab-label">首页</text>
        </view>
        
        <!-- 中间加号锚点 (占据 1/3) -->
        <view class="tab-center-anchor">
          <view class="tab-center-add" @click="goToAddEntry">
            <view class="add-btn-inner">+</view>
            <view class="add-btn-glow"></view>
          </view>
        </view>

        <!-- 我的 Tab (占据 1/3) -->
        <view 
          class="tab-item" 
          :class="{ active: currentTab === 'profile' }"
          @click="currentTab = 'profile'"
        >
          <text class="tab-icon">👤</text>
          <text class="tab-label">我的</text>
        </view>
      </view>
    </view>
	
	   <!-- 多重邀请处理弹窗 -->
	    <MultiInviteModal 
	      v-model="showInviteCenter"
	      :invitations="invitationList"
		  @onJoinAll="handleAcceptAll"
	      @onJoin="handleAcceptInvite"
	      @onReject="handleRejectInvite"
	      @onIgnoreAll="handleIgnoreAll"
	    />
	
    <!-- 受邀加入房间弹窗 -->
    <JoinRoomModal 
      v-model="showJoinModal"
      :roomId="inviteParams.id"
      :roomName="inviteParams.name"
      :roomIcon="inviteParams.icon"
    />
    
    <view class="safe-area-bottom"></view>

    <!-- 主题换肤：挂在 index 顶层，避免被 tabbar 遮挡 -->
    <ThemePickerModal v-model="showThemePicker" />
  </view>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import HomeView from '../../pages/home/home.vue';
import ProfileView from '../../pages/profile/profile.vue';
import JoinRoomModal from '../../components/common/JoinRoomModal.vue';
import MultiInviteModal from '../../components/common/MultiInviteModal.vue';
import ThemePickerModal from '@/components/common/ThemePickerModal.vue';
import { roomApi } from '../../common/api';
import { onLoad,onShow } from "@dcloudio/uni-app";
import dataJson from '/data.json';
import {goToLogin} from '../js/utils.js';
import {useGlobalShare } from '../js/useGlobalShare.js';
import { useAppTheme } from '@/common/themes/useAppTheme.js';

const { themeClass } = useAppTheme();
const showThemePicker = ref(false);
// import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'

  // onShareAppMessage((res) => {})
  
    // onShareTimeline(() => {})
  
useGlobalShare({
  title: ()=>{
	  return getRandomTitle();
  },
  path:()=>{
	 return '/pages/index/index'
  }
  
})

// 分享标题池
const SHARE_TITLES = [
  '我们用这个一起记账，再也没为钱吵过架',
  '钱到底花哪了？我用这个终于看明白了',
  '不记账不知道，一记账吓一跳',
  '这个记账方式，真的比我以前用的都简单',
  '一起把账算清楚，其实没那么难'
]

function getRandomTitle() {
  return SHARE_TITLES[Math.floor(Math.random() * SHARE_TITLES.length)]
}

// 邀请中心状态
const showInviteCenter = ref(false);
const invitationList = ref([]);

// onLoad((e) => {
//   const inviteCode = e?.roomInviteCode
//   if (inviteCode) {
//     uni.setStorageSync(
//       'inviteCode',
//       decodeURIComponent(inviteCode)
//     )
//     console.log('邀请参数', inviteCode)
//   }
// })

onShow(() => {
  const pages = getCurrentPages()
  const current = pages[pages.length - 1]
  const inviteCode = current?.options?.roomInviteCode
  console.log("1223",inviteCode);

  if (inviteCode) {
    uni.setStorageSync('inviteCode', inviteCode)
	console.log("收到了邀请参数",inviteCode);
  }
})




const showJoinModal = ref(false);
const inviteParams = reactive({
  id: '',
  name: '',
  icon: '🏠'
});
const currentTab = ref('home');

onMounted(() => {
  uni.$on('open_theme_picker', () => {
    showThemePicker.value = true;
  });

  const launchOptions = uni.getLaunchOptionsSync();
  let query = launchOptions.query || {};

  if (query.id && query.name) {
    inviteParams.id = query.id;
    inviteParams.name = decodeURIComponent(query.name);
    
    if (inviteParams.name.includes('装修')) inviteParams.icon = '🛠️';
    else if (inviteParams.name.includes('养老')) inviteParams.icon = '❤️';
    else if (inviteParams.name.includes('采购') || inviteParams.name.includes('超市')) inviteParams.icon = '🛒';
    
    // setTimeout(() => {
    //   showJoinModal.value = true;
    // }, 800);
	
  }
  getInviteList();
  uni.$on('user_login', (data) => {
  	if(data){
  		getInviteList();
  	}
  });


  
    // 模拟延迟 1秒 后弹出邀请
  //   setTimeout(() => {
  //     invitationList.value = mockInvites;
  //     showInviteCenter.value = true;
  //   }, 1200);
  
  //   // 原有的逻辑处理（来自 LaunchOptions）
  //   if (query.id && query.name) {
  //     // 如果是通过单个链接进入的，也可以 push 到列表中
  //     const singleInvite = {
  //       roomId: query.id,
  //       roomName: decodeURIComponent(query.name),
  //       roomIcon: '🏠',
  //       inviterName: '家人',
  //       memberCount: 1
  //     };
  //     // 避免重复
  //     if (!invitationList.value.find(i => i.roomId === singleInvite.roomId)) {
  //       invitationList.value.push(singleInvite);
  //       showInviteCenter.value = true;
  //     }
    // }
});

onUnmounted(() => {
  uni.$off('open_theme_picker');
});

  // 模拟从后台或启动参数获取多个邀请
    // 实际开发中，这里可以是通过 API 获取到的列表
    const mockInvites =ref( [
      // { roomId: 'R101', roomName: '装修基金', roomIcon: '🛠️', inviterName: '王先生', inviterAvatar: 'https://i.pravatar.cc/100?u=1', memberCount: 3 },
      // { roomId: 'R102', roomName: '周末采购', roomIcon: '🛒', inviterName: '李太太', inviterAvatar: 'https://i.pravatar.cc/100?u=2', memberCount: 2 },
      // { roomId: 'R103', roomName: '爸妈养老', roomIcon: '❤️', inviterName: '张姐姐', inviterAvatar: 'https://i.pravatar.cc/100?u=3', memberCount: 4 }
    ]);

  const getInviteList=async()=>{
	  if(!dataJson.isLogin)return;
	  var res=await roomApi.inviteList({});
	  if(res.code==0){
		  invitationList.value = res.data;
		  showInviteCenter.value = true;
	  }
  }
  

//单个加入
const handleAcceptInvite = async(invite) => {
	try{
		uni.showLoading({ title: '正在加入...' });
		var res=await roomApi.accecptSigin(invite.id,{});
		uni.hideLoading();
		if(res.code===0){
			  
			  uni.showToast({ title: '已加入 ' + invite.roomName, icon: 'success' });
			  uni.$emit('refresh_room_data');
			  
			  const localInviteCode = uni.getStorageSync('inviteCode');
			  console.log(localInviteCode);
			  
			  if (localInviteCode) {
			    const stillExists = invitationList.value.some(
			      item => item.inviteCode === localInviteCode
			      // 或 item.code === localInviteCode
			    );
			    console.log("打印是否",stillExists);
			  
			    // 如果列表中已经没有这个邀请码了 → 删除本地缓存
			    if (stillExists) {
			      uni.removeStorageSync('inviteCode');
			    }
			  }
			  // 从列表中移除已处理的项
			  invitationList.value = invitationList.value.filter(i => i.roomId !== invite.roomId);
			  
			  // 如果处理完了，关闭中心
			  if (invitationList.value.length === 0) {
			    showInviteCenter.value = false;
			  }
			


			  
		}else{
			  uni.showToast({
			  	title:res.msg,
			  	icon:'none'
			  })
		}
	}catch(e){
		uni.hideLoading();
	}
  // 模拟 API 请求
  // setTimeout(() => {
  
    
  //   // 跳转到对应的看板
  //   uni.navigateTo({ url: `/pages/dashboard/dashboard?roomId=${invite.roomId}&name=${invite.roomName}` });
  // }, 800);
};
//单个拒绝
const handleRejectInvite = async(invite) => {
	try{
		uni.showLoading({ title: '加载中...' });
		var res=await roomApi.rejectSigin(invite.id,{});
		uni.hideLoading();
		if(res.code===0){
			const localInviteCode = uni.getStorageSync('inviteCode');
			
			if (localInviteCode) {
			  const stillExists = invitationList.value.some(
			    item => item.inviteCode === localInviteCode
			    // 或 item.code === localInviteCode
			  );
			
			  // 如果列表中已经没有这个邀请码了 → 删除本地缓存
			  if (stillExists) {
			    uni.removeStorageSync('inviteCode');
			  }
			}
			  invitationList.value = invitationList.value.filter(i => i.roomId !== invite.roomId);
			  if (invitationList.value.length === 0) {
			    showInviteCenter.value = false;
			  }
		

		}else{
			uni.showToast({
				title:res.msg,
				icon:'none'
			})
		}
	}catch(e){
		uni.hideLoading();
	}
};
//忽略所有请修
const handleIgnoreAll = async() => {
	try{
		uni.showLoading({ title: '加载中...' });
		var res=await roomApi.rejectAll({});
		invitationList.value = [];
		showInviteCenter.value = false;
		uni.hideLoading();
		if(res.code!=0){
			uni.showToast({
				title:res.msg,
				icon:'none'
			})
		}
	}catch(e){
		uni.hideLoading();
	}
 
};

//接受所有的邀请
const handleAcceptAll=async()=>{
	try{
		uni.showLoading({ title: '加载中...' });
		var res=await roomApi.accecptAll({});
		uni.hideLoading();
		invitationList.value = [];
		showInviteCenter.value = false;
		if(res.code==0){//接受成功刷新首页列表
			uni.$emit('refresh_room_data');
		}else{
			uni.showToast({
				title:res.msg,
				icon:'none'
			})
		}
	}catch(e){
		uni.hideLoading();
	}
}

const goToAddEntry = () => {
	if(!goToLogin()){
		return;
	}
  uni.navigateTo({ url: '/pages/create-room/create-room' });
};
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  position: relative;
  background-color: var(--primary-soft, #EEF2FF);
  transition: background-color 0.35s ease;
}
.tab-content { height: 100vh; padding-bottom: 0; }

/* 悬浮底栏容器 */
.tab-bar-container {
  position: fixed;
  bottom: 34px; 
  left: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  justify-content: center;
  pointer-events: none; 
}

/* 胶囊主体：优化内边距和背景模糊 */
.tab-bar-pod {
  pointer-events: auto;
  position: relative;
  width: 100%;
  max-width: 340px;
  height: 64px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border-radius: 32px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
  padding: 0 6px; /* 减小内间距以适应等分 */
}

/* 弹性滑块指示器：等分 1/3 */
.tab-active-pill {
  position: absolute;
  width: calc(100% / 3 - 8px); /* 精确三等分并减去微调 */
  height: 52px;
  z-index: 1;
  left: 10px;
  transition: transform 0.6s cubic-bezier(0.68, -0.6, 0.32, 1.6); /* 弹性曲线 */
  will-change: transform;
}

/* 滑块内部质感层 */
.pill-inner-glow {
  width: 100%;
  height: 100%;
  background: #FFFFFF;
  border-radius: 26px;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.04),
    inset 0 0 8px var(--primary-glow, rgba(79, 70, 229, 0.05));
}

/* Tab 选项 */
.tab-item {
  position: relative;
  z-index: 2;
  flex: 1; /* 核心：平分空间 */
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.tab-icon {
  font-size: 19px;
  margin-bottom: 2px;
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.tab-label {
  font-size: 10px;
  font-weight: 800;
  color: #94A3B8;
  opacity: 0.6;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
}

/* 激活状态动效：更明显的跳跃和变色 */
.active .tab-icon {
  transform: translateY(-2px) scale(1.15);
}
.active .tab-label {
  color: var(--primary-color, #4F46E5);
  opacity: 1;
  font-weight: 900;
  transform: scale(1.05);
}

/* 中间突出的加号区域 */
.tab-center-anchor {
  position: relative;
  flex: 1; /* 核心：占据中间 1/3 */
  height: 100%;
  display: flex;
  justify-content: center;
  z-index: 5;
}

.tab-center-add {
  position: absolute;
  top: -22px;
  width: 54px;
  height: 54px;
  background: var(--primary-color, #4F46E5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px solid #fff;
  box-shadow: 0 10px 20px var(--primary-glow, rgba(79, 70, 229, 0.25));
  transition: background 0.35s ease, box-shadow 0.35s ease;
}

.tab-center-add:active {
  transform: scale(0.8) rotate(45deg);
}

.add-btn-inner {
  color: #fff;
  font-size: 28px;
  font-weight: 300;
  line-height: 1;
}

.add-btn-glow {
  position: absolute;
  inset: -1px;
  border-radius: 50%;
  background: var(--primary-color, #4F46E5);
  opacity: 0.2;
  filter: blur(6px);
  z-index: -1;
  animation: heartBeat 3s infinite;
  transition: background 0.35s ease;
}

@keyframes heartBeat {
  0%, 100% { transform: scale(1); opacity: 0.1; }
  50% { transform: scale(1.15); opacity: 0.2; }
}

.safe-area-bottom { 
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: env(safe-area-inset-bottom);
}
</style>
