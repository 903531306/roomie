<template>
  <view 
    v-if="modelValue" 
    class="modal-mask" 
    :class="[themeClass, { 'mask-closing': isClosing }]"
    @click="handleCancel"
    @touchmove.stop.prevent
  >
    <view 
      class="modal-panel animate-slide-up" 
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

      <view class="modal-header">
        <view class="title-area">
          <text class="sub-label">{{ isEdit ? '个人信息管理' : '完善您的资料' }}</text>
          <text class="main-title">{{ isEdit ? '修改资料' : '开启家庭协作' }}</text>
        </view>
      </view>

      <view class="modal-body">
        <!-- 头像上传 -->
		<view class="avatar-upload-section">
			<button class="avatar-button" open-type="chooseAvatar" @chooseavatar="chooseAvatarEvent">
          <view class="avatar-wrapper">
            <image :src="userInfo.avatar || 'https://i.pravatar.cc/150?u=default'" class="preview-avatar" />
            <view class="camera-badge">📸</view>
          </view>
		  </button>
          <text class="upload-tip">点击修改头像</text>
        </view>

        <!-- 昵称输入 -->
        <view class="input-section">
          <text class="input-label">您的昵称</text>
          <view class="nickname-input-box">
            <input 
              @blur="bindblur" @input="handleInputChange" v-model="userInfo.nickname" 
              type="nickname"
              class="nickname-input" 
              placeholder="请输入您的昵称" 
              placeholder-style="color: #CBD5E1"
              maxlength="10"
            />
            <view v-if="userInfo.nickname" class="clear-btn" @click="userInfo.nickname = ''">✕</view>
          </view>
        </view>
      </view>

      <view class="modal-footer">
        <button class="save-btn" @click="handleSave">
          <text class="btn-txt">{{ isEdit ? '保存修改' : '进入 FamilyLink' }}</text>
        </button>
      </view>
      
      <view class="safe-area-bottom"></view>
    </view>
  </view>
</template>

<script setup>
import { useAppTheme } from '@/common/themes/useAppTheme.js'
const { themeClass, primaryColor, softColor, theme } = useAppTheme()

import { ref, watch, reactive, onMounted } from 'vue';
import {base64,getFileExtension} from '../../pages/js/utils.js';
import { userApi } from '@/common/api';

const props = defineProps({
  modelValue: Boolean,
  userInfo:{type:Object,default:null},
  isEdit: { type: Boolean, default: false },
  initialAvatar: { type: String, default: '' },
  initialNickname: { type: String, default: '' }
});

const userInfo = reactive({
  avatar: '',
  nickname: ''
});

const emit = defineEmits(['update:modelValue', 'complete']);

const isClosing = ref(false);
const isSwiping = ref(false);
const panelY = ref(0);
let startY = 0;

// 当弹窗打开时，从props或本地存储初始化用户信息
watch(() => props.modelValue, (val) => {
  if (val) {
    panelY.value = 0;
    isClosing.value = false;

    // 优先使用传入的props.userInfo
    if (props.userInfo && typeof props.userInfo === 'object') {
      userInfo.avatar = props.userInfo.avatar || props.initialAvatar || '';
      userInfo.nickname = props.userInfo.nickname || props.initialNickname || '';
    } else {
      // 尝试从本地存储读取
      try {
        const stored = uni.getStorageSync('userInfo') || {};
        userInfo.avatar = stored.avatar || props.initialAvatar || '';
        userInfo.nickname = stored.nickname || props.initialNickname || '';
      } catch (e) {
        userInfo.avatar = props.initialAvatar || '';
        userInfo.nickname = props.initialNickname || '';
      }
    }
  }
});
const bindblur=(e)=>{
		userInfo.nickname=e.detail.value;
		console.log(e);
	}

// 头像选择
	const chooseAvatarEvent = (e) => {
		userInfo.avatar = e.detail.avatarUrl
	}
	const handleInputChange=(val)=>{
	}


const handleSave = async()=>  {
	console.log(userInfo.nickname+"|"+userInfo.avatar);
  if (!userInfo.nickname.trim()) {
    uni.showToast({ title: '请输入昵称', icon: 'none' });
    return;
  }
  if (!userInfo.avatar.trim()) {
    uni.showToast({ title: '请选择头像', icon: 'none' });
    return;
  }
  uni.showLoading({ title: '处理中...' });
 try{
 	var origin=getFileExtension(userInfo.avatar);
 	var base=await base64(userInfo.avatar, origin);
 	console.log(origin);
	//,
 	// 确保使用有效的用户信息来源（优先props，其次本地存储）
 	let sourceUser = props.userInfo && typeof props.userInfo === 'object' ? props.userInfo : {};
 	if (!sourceUser || Object.keys(sourceUser).length === 0) {
 	  try {
 	    sourceUser = uni.getStorageSync('userInfo') || {};
 	  } catch (e) {
 	    sourceUser = {};
 	  }
 	}
 	console.log('sourceUser:', sourceUser);
 	var data={"randomAccount":1,userId: sourceUser.userId || sourceUser.id || '', userNickname:userInfo.nickname, openid: sourceUser.openid || '', origin:origin, base64:base};
 	if(props.infoType==1&&uni.getStorageSync("code")!=null&&uni.getStorageSync("code")!=undefined){//如果是登录完善信息传递邀请的code
 		data["invited"]=uni.getStorageSync("code");
 		
 	}
 		var res=await userApi.updateUserAratar(data,"提交中...");
		if(res.code==0){
			// 关闭弹窗
			handleCancel();

			// 更新来源用户信息并持久化
			const updatedUser = {
			  ...(sourceUser || {}),
			  userNickname: userInfo.nickname,
			  avatar: res.data.userHeadUrl,
			  email:res.data.email,
			  password:res.data.password,
			  token:res.data.token
			};
			uni.setStorageSync("userInfo", updatedUser);
			emit('complete', updatedUser);
 		}else{
 			uni.showToast({
 				title: res.msg,
 				icon: 'none',
 				mask: true,
 			})
 		}
 	
 }catch(error){
	 uni.hideLoading();
 	console.log(error)
 }
};

const handleCancel = () => {
  isClosing.value = true;
  panelY.value = 800;
  setTimeout(() => {
    emit('update:modelValue', false);
    isClosing.value = false;
  }, 300);
};

/* --- 手势逻辑 --- */
const onTouchStart = (e) => { startY = e.touches[0].clientY; isSwiping.value = true; };
const onTouchMove = (e) => {
  const diff = e.touches[0].clientY - startY;
  if (diff > 0) panelY.value = diff;
};
const onTouchEnd = () => {
  isSwiping.value = false;
  if (panelY.value > 150) handleCancel();
  else panelY.value = 0;
};
</script>

<style scoped>
.modal-mask {
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(20px); z-index: 9999; display: flex; align-items: flex-end;
  transition: opacity 0.3s;
}
.mask-closing { opacity: 0; }

.modal-panel {
  width: 100%; background: #fff; border-radius: 44px 44px 0 0; padding: 20px 24px;
  box-shadow: 0 -20px 60px rgba(0, 0, 0, 0.1); will-change: transform;
}

.modal-handle { width: 42px; height: 5px; background: #F1F5F9; border-radius: 10px; margin: 0 auto 32px; }

.modal-header { margin-bottom: 32px; }
.sub-label { font-size: 11px; font-weight: 900; color: #94A3B8; text-transform: uppercase; letter-spacing: 2px; }
.main-title { font-size: 24px; font-weight: 900; color: #1E293B; margin-top: 4px; display: block; }

.modal-body { display: flex; flex-direction: column; align-items: center; }

.avatar-upload-section { display: flex; flex-direction: column; align-items: center; gap: 12px; margin-bottom: 40px; }
/* 头像按钮样式 - 完全移除视觉效果 */
.avatar-button {
  /* 移除所有背景相关样式 */
  background: none !important;
  background-color: transparent !important;

  /* 移除所有边框相关样式 */
  border: none !important;
  border-width: 0 !important;
  border-style: none !important;
  border-color: transparent !important;

  /* 移除内边距和外边距 */
  padding: 0 !important;
  margin: 0 !important;

  /* 移除轮廓和阴影 */
  outline: none !important;
  box-shadow: none !important;

  /* 确保在所有状态下都没有样式 */
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}
.avatar-wrapper { position: relative; width: 100px; height: 100px; overflow: hidden; }
.preview-avatar { 
  width: 100%; 
  height: 100%; 
  border-radius: 35px; 
  border: none !important; 
  box-shadow: none !important; 
  display: block;
}
.camera-badge { 
  position: absolute; bottom: -8px; right: -8px; width: 32px; height: 32px; 
  background: #fff; border-radius: 50%; display: flex; align-items: center; 
  justify-content: center; font-size: 14px; box-shadow: none !important; border: none !important;
}
.upload-tip { font-size: 12px; font-weight: 800; color: #CBD5E1; }

.input-section { width: 100%; margin-bottom: 32px; }
.input-label { font-size: 11px; font-weight: 900; color: #94A3B8; text-transform: uppercase; margin-bottom: 12px; display: block; }
.nickname-input-box { 
  background: #F8FAFC; height: 64px; border-radius: 20px; border: 1px solid #F1F5F9; 
  padding: 0 20px; display: flex; align-items: center; gap: 12px;
}
.nickname-input { flex: 1; font-size: 17px; font-weight: 800; color: #1E293B; }
.clear-btn { width: 20px; height: 20px; background: #E2E8F0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #fff; }

.save-btn { 
  width: 100%; height: 64px; background: var(--primary-color, #4F46E5); border-radius: 22px; 
  display: flex; align-items: center; justify-content: center; border: none;
  box-shadow: 0 10px 25px var(--primary-glow, rgba(79, 70, 229, 0.2));
}
.save-btn:active { transform: scale(0.96); opacity: 0.9; }
.btn-txt { color: #fff; font-size: 16px; font-weight: 900; }

.safe-area-bottom { height: env(safe-area-inset-bottom); margin-top: 10px; }

.animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.19, 1, 0.22, 1); }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
</style>