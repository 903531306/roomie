
<template>
  <view class="add-container" :class="[themeClass, 'type-' + transactionType]">
    <!-- 顶部导航 -->
    <IosNav 
      title="记一笔" 
      @leftClick="goBack" 
    />

    <scroll-view 
      scroll-y 
      class="add-scroll" 
      enable-back-to-top
      :show-scrollbar="false"
    >
      <view class="add-content-inner">
        
        <!-- 1. 流水类型切换器 (更紧凑) -->
        <view class="type-switcher-container" v-if="!id">
          <view class="type-switcher-bg">
            <view 
              class="type-slider" 
              :style="{ transform: `translateX(${typeIndex * 100}%)` }"
            ></view>
            <view 
              class="type-tab" 
              :class="{ active: transactionType === 'expense' }"
              @click="handleTypeChange('expense')"
            >
              <text class="tab-txt">支出</text>
            </view>
            <view 
              class="type-tab" 
              :class="{ active: transactionType === 'income' }"
              @click="handleTypeChange('income')"
            >
              <text class="tab-txt">收入</text>
            </view>
            <view 
              class="type-tab" 
              :class="{ active: transactionType === 'transfer' }"
              @click="handleTypeChange('transfer')"
            >
              <text class="tab-txt">转账</text>
            </view>
          </view>
        </view>

        <!-- 2. 金额输入卡片 (高度大幅压缩) -->
        <view class="amount-hero-card" :class="{ 'is-amount-focused': isAmountFocused }">
          <view
            class="amount-card-inner"
            :class="{ 'is-focus': isAmountFocused }"
            :style="amountFocusBorderStyle"
          >
            <view class="amount-label-row">
              <text class="amount-card-label">交易金额</text>
              <view class="amount-tag">CNY</view>
            </view>
            <view class="amount-input-container">
              <text class="amount-symbol">¥</text>
              <input 
                type="digit" 
                :value="amount"
                @input="onAmountInput"
                class="amount-input-field" 
                placeholder="0.00" 
                placeholder-style="color: #CBD5E1; font-weight: 700;"
                :cursor-color="themeColor"
                focus
                @focus="isAmountFocused = true"
                @blur="isAmountFocused = false"
              />
            </view>
          </view>
        </view>

        <!-- 3. 详情信息卡片 (紧凑型) -->
        <view class="add-details">
          <!-- 分类选择 -->
          <view class="add-row" @click="onCategoryRowClick">
            <view class="add-row-left">
              <view class="add-row-icon g" :style="{ backgroundColor: themeColor + '10', color: themeColor }">
                <image v-if="isImageUrl(currentCategoryIcon)" :src="currentCategoryIcon" mode="aspectFill" class="row-icon-img" />
                <text v-else>{{ currentCategoryIcon }}</text>
              </view>
              <text class="add-row-label">{{ transactionType === 'transfer' ? '转账方向' : '交易分类' }}</text>
            </view>
            <view class="add-row-right">
              <view class="category-path" v-if="transactionType === 'expense' && parentCategoryDisplay">
                <text class="path-parent">{{ parentCategoryDisplay }}</text>
                <text class="path-sep">/</text>
              </view>
              <text class="add-row-val">{{ category || '点击选择' }}</text>
              <text class="add-row-arrow"> ›</text>
            </view>
          </view>

          <!-- 成员选择 -->
          <view class="add-row" @click="showMemberPicker = true">
            <view class="add-row-left">
              <view class="add-row-icon b">👤</view>
              <text class="add-row-label">经办成员</text>
            </view>
            <view class="add-row-right member-display">
              <view class="member-preview-stack" v-if="memberInfo">
                <view class="mini-avatar-item">
                  <image :src="memberInfo.icon || memberInfo.avatar || 'https://i.pravatar.cc/100?u=default'" mode="aspectFill" class="mini-img" />
                </view>
              </view>
              <text class="add-row-val ml-1">{{ member || '请选择' }}</text>
              <text class="add-row-arrow ml-1">›</text>
            </view>
          </view>
          
          <view class="add-row">
            <view class="add-row-left">
              <view class="add-row-icon p">📅</view>
              <text class="add-row-label">交易日期</text>
            </view>
            <picker :end="todayStr" mode="date" @change="onDateChange">
              <view class="add-row-right">
                <text class="add-row-val">{{ date }}</text>
                <text class="add-row-arrow">›</text>
              </view>
            </picker>
          </view>
		  
		  <view v-if="transactionType != 'transfer'" class="add-row" @click="showPayPicker = true">
		    <view class="add-row-left">
		      <view class="add-row-icon g" :style="{ backgroundColor: themeColor + '10', color: themeColor }">
		        <image v-if="isImageUrl(currentPayIcon)" :src="currentPayIcon" mode="aspectFill" class="row-icon-img" />
            <text v-else>{{ currentPayIcon }}</text>
		      </view>
		      <text class="add-row-label">支付方式</text>
		    </view>
		    <view class="add-row-right">
		      <text class="add-row-val">{{ pay || '请选择' }}</text>
		      <text class="add-row-arrow">›</text>
		    </view>
		  </view>

          <!-- 4. 备注区 (重构美化：全宽便签布局) -->
          <view class="memo-compact-section">
            <view class="memo-header-line">
              <text class="memo-tiny-label">备注说明</text>
              <view class="memo-tiny-icon">✎</view>
            </view>
            <view
              class="memo-input-container"
              :class="{ 'is-focus': isMemoFocused }"
              :style="memoFocusBorderStyle"
            >
              <textarea 
                v-model="note" 
                class="add-textarea-memo" 
                placeholder="记录这一刻的碎碎念..."
                @focus="isMemoFocused = true"
                @blur="isMemoFocused = false" 
                placeholder-style="color:#CBD5E1; font-weight: 500;" 
                auto-height
              />
            </view>
          </view>
        </view>

        <!-- 底部占位 -->
        <view class="add-footer-placeholder"></view>
      </view>
    </scroll-view>

    <!-- 悬浮保存栏 -->
    <view class="fixed-save-container">
      <view class="floating-save-dock animate-island-in">
        <view class="dock-content">
          <view class="dock-info">
            <text class="dock-label">确认保存金额</text>
            <view class="dock-amount-row">
              <text class="dock-sym" :style="{ color: !amount || parseFloat(amount) <= 0 ? '#CBD5E1' : themeColor }">¥</text>
              <text class="dock-val" :style="{ color: !amount || parseFloat(amount) <= 0 ? '#94A3B8' : themeColor }">
                {{ amount || '0.00' }}
              </text>
            </view>
          </view>
          
          <button
            plain
            class="save-pill-btn"
            @click="saveEntry"
            :class="{ 'btn-disabled': !canSave, 'btn-ready': canSave }"
            :style="canSave ? saveBtnActiveStyle : disabledBtnStyle"
          >
            <text class="save-txt">确认保存</text>
            <text v-if="canSave" class="save-arrow"> →</text>
          </button>
        </view>
      </view>
      <view class="safe-area-bottom"></view>
    </view>

    <!-- 弹窗组件 -->
    <CategoryPicker 
      v-model="showCategoryPicker"
      :title="'选择' + typeLabel + '分类'"
      :options="categories"
      :transactionType="transactionType"
      :currentSelected="category"
      :themeColor="themeColor"
      @change="onCategorySelected"
    />

    <BottomPicker 
      v-model="showSingleCategoryPicker"
      :title="'选择' + typeLabel + '分类'"
      layout="grid"
      :cols="3"
      :options="flatCategories"
      :currentSelected="category"
      @change="onCategorySelected"
    />
	
	<BottomPicker
	  v-model="showPayPicker"
	  title="选择支付方式"
	  layout="grid"
	  :cols="3"
	  :options="filteredPay"
	  :currentSelected="pay"
	  @change="onPaySelected"
	/>

    <BottomPicker 
      v-model="showMemberPicker"
      title="选择经办成员"
      layout="list"
      :options="memberOptions"
      :currentSelected="member"
      @change="onMemberSelected"
    />
  </view>
</template>

<script setup>
import { useAppTheme } from '@/common/themes/useAppTheme.js'
const { themeClass, primaryColor, softColor, theme } = useAppTheme()

import { ref, onMounted, computed, watch, getCurrentInstance } from 'vue';
import IosNav from '../../components/nav/ios-nav.vue';
import BottomPicker from '../../components/common/BottomPicker.vue';
import CategoryPicker from '../../components/common/CategoryPicker.vue';
import { roomApi, taskApi } from '../../common/api';
import { onLoad } from "@dcloudio/uni-app";
import dataJson from '/data.json';
import { formatDate, dateToTimestamp } from '../../pages/js/utils.js';

const TASK_LEDGER_NEEDS_REFRESH = 'task_ledger_needs_refresh'
const CHECKLIST_REFRESH_KEY = 'checklist_board_dirty_room'

let openerEventChannel = null

// 基础状态逻辑保持不变
const amount = ref('');
const isAmountFocused = ref(true);
const isMemoFocused = ref(false);
const transactionType = ref('expense'); 
const category = ref('');       
const categoryInfo = ref(null);
const member = ref(null);
const memberInfo = ref(null);
const date = ref(new Date().toISOString().split('T')[0]);
const todayStr = ref(new Date().toISOString().split('T')[0]);
const note = ref('');
const roomId = ref(null);
const accountId = ref(null);
const id = ref(null);
const taskId = ref(null);

const pay = ref('');
const payInfo = ref(null);
const playType = ref('transfer');

const showMemberPicker = ref(false);
const showCategoryPicker = ref(false); 
const showSingleCategoryPicker = ref(false); 
const showPayPicker = ref(false);

const categories = ref([]); 
const memberOptions = ref([]);

const isImageUrl = (val) => {
  if (typeof val !== 'string') return false;
  const v = val.toLowerCase();
  return v.startsWith('http') || v.startsWith('/') || v.startsWith('data:image') || v.includes('.png') || v.includes('.jpg') || v.includes('.jpeg') || v.includes('.webp');
};

const typeLabel = computed(() => {
  if (transactionType.value === 'expense') return '支出';
  if (transactionType.value === 'income') return '收入';
  return '转账';
});

const parentCategoryDisplay = computed(() => {
  if (!category.value) return '';
  const current = categories.value.find(c => c.label === category.value);
  if (current && current.parentId) {
    const parent = categories.value.find(p => p.id === current.parentId);
    return parent ? parent.label : '';
  }
  return '';
});

const flatCategories = computed(() => {
  return categories.value.filter(cat => cat.type === transactionType.value);
});

const filteredPay = computed(() =>
  categories.value.filter(cat => cat.type === playType.value)
);

const currentCategoryIcon = computed(() => {
  const found = categories.value.find(c => c.label === category.value);
  return found ? found.icon : '✨';
});

const currentPayIcon = computed(() => {
  const list = filteredPay.value || [];
  const found = list.find(c => c.label === pay.value);
  return found ? found.icon : '✨';
});

const onCategoryRowClick = () => {
  if (transactionType.value === 'expense') {
    showCategoryPicker.value = true;
  } else {
    showSingleCategoryPicker.value = true;
  }
};

const onCategorySelected = (item) => {
  category.value = item.label;
  categoryInfo.value = item;
};

const typeIndex = computed(() => ({ expense: 0, income: 1, transfer: 2 }[transactionType.value]));
const canSave = computed(() => amount.value && parseFloat(amount.value) > 0);

const themeColor = computed(() => {
  if (transactionType.value === 'income') return '#10B981';
  if (transactionType.value === 'transfer') return '#F59E0B';
  return primaryColor.value;
});

const hexWithAlpha = (hex, alpha) => {
  if (!hex || typeof hex !== 'string') return `rgba(79, 70, 229, ${alpha})`;
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return hex;
  const a = Math.round(alpha * 255).toString(16).padStart(2, '0');
  return `#${normalized}${a}`;
};

const saveBtnActiveStyle = computed(() => ({
  backgroundColor: themeColor.value,
  border: 'none',
  boxShadow: 'none'
}));

const amountFocusBorderStyle = computed(() => {
  if (!isAmountFocused.value) return {};
  const c = themeColor.value;
  return {
    borderColor: c,
    boxShadow: `0 8px 28px ${hexWithAlpha(c, 0.16)}`
  };
});

const memoFocusBorderStyle = computed(() => {
  if (!isMemoFocused.value) return {};
  const c = themeColor.value;
  return {
    borderColor: c,
    boxShadow: `0 6px 20px ${hexWithAlpha(c, 0.1)}`
  };
});

const disabledBtnStyle = computed(() => ({
  backgroundColor: softColor.value,
  border: `1.5px solid ${hexWithAlpha(primaryColor.value, 0.28)}`,
  boxShadow: 'none'
}));

onLoad((e) => {
  roomId.value = e.roomId;
  accountId.value = e.accountId;
  id.value = e.id;
  if (e.taskId) taskId.value = e.taskId;
  if (e.note) {
    try {
      note.value = decodeURIComponent(e.note);
    } catch {
      note.value = e.note;
    }
  }
  const instance = getCurrentInstance()
  openerEventChannel = instance?.proxy?.getOpenerEventChannel?.() || null
});

onMounted(() => {
  getMember();
  getCategoriesList();
  if (!openerEventChannel) {
    const instance = getCurrentInstance()
    openerEventChannel = instance?.proxy?.getOpenerEventChannel?.() || null
  }
});

const handleTypeChange = (type) => {
  transactionType.value = type;
};

const getDetail = async (id) => {
  var res = await roomApi.ledgerDetail({ id: id, roomId: roomId.value });
  if (res.code == 0) {
    amount.value = res.data.amount;
    note.value = res.data.note;
    category.value = res.data.category;
    member.value = res.data.creatorNickname;
    transactionType.value = res.data.type;
    pay.value = res.data.payType;
    payInfo.value = {
      ...(payInfo.value || {}),
      id: res.data.payId,
      label: res.data.payType
    }
    date.value = formatDate(res.data.entryTime, "yyyy-MM-dd");
  }
};

const getMember = async () => {
  try {
    const res = await roomApi.getRoomMembers({ roomId: roomId.value });
    if (res.code === 0) {
      memberOptions.value = res.data.map(m => ({
        icon: m.avatar, label: m.nickname, userId: m.userId, id: m.userId
      }));
      if (memberOptions.value.length > 0) {
        if (!member.value) {
          member.value = memberOptions.value[0].label;
          memberInfo.value = memberOptions.value[0];
        } else {
          const target = memberOptions.value.find(item => item.label === member.value);
          if (target) memberInfo.value = target;
        }
      }
    }
  } catch (e) {}
};

const getCategoriesList = async () => {
  try {
    const res = await taskApi.getcategoryList({});
    if (res.code !== 0) return;
    categories.value = res.data || [];
    if (id.value) await getDetail(id.value);
    else initDefaultSelection();
  } catch (e) {}
};

const initDefaultSelection = () => {
  const level1 = categories.value.filter(cat => cat.type === transactionType.value && !cat.parentId);
  if (level1.length > 0) {
    const level2 = categories.value.filter(c => c.parentId === level1[0].id);
    if (level2.length > 0) {
      category.value = level2[0].label;
      categoryInfo.value = level2[0];
    } else {
      category.value = level1[0].label;
      categoryInfo.value = level1[0];
    }
  }
  const payList = filteredPay.value;
  if (payList.length > 0 && !pay.value) {
    pay.value = payList[0].label;
    payInfo.value = payList[0];
  }
};

watch(transactionType, () => {
  if (!id.value) initDefaultSelection();
});

const onAmountInput = (e) => {
  let val = e.detail.value.replace(/[^\d.]/g, "").replace(/\.{2,}/g, ".");
  val = val.replace(".", "$#$").replace(/\./g, "").replace("$#$", ".");
  val = val.replace(/^(\d+)\.(\d\d).*$/, '$1.$2');
  if (val.startsWith('.')) val = '0' + val;
  amount.value = val;
};

const onDateChange = (e) => { date.value = e.detail.value; };
const onMemberSelected = (item) => { memberInfo.value = item; member.value = item.label; };
const onPaySelected = (item) => { pay.value = item.label; payInfo.value = item; };

const saveEntry = async () => { 
  const parsedAmount = parseFloat(amount.value);
  if (!amount.value || isNaN(parsedAmount) || parsedAmount <= 0) {
    uni.showToast({ title: '请输入有效金额', icon: 'none' });
    return;
  }
  try {
    uni.showLoading({ title: '正在保存' });
    const map = {
      accountId: accountId.value,
      roomId: roomId.value,
      createdBy: dataJson.userInfo.userId,
      amount: amount.value,
      note: note.value,
      type: transactionType.value,
      category: category.value,
      entryTime: dateToTimestamp(date.value),
      categoryId: categoryInfo.value?.id,
      payId: transactionType.value === 'transfer' ? categoryInfo.value?.id : payInfo.value?.id,
      id: id.value
    };
    if (taskId.value && !id.value) map.taskId = taskId.value;
    const res = id.value ? await roomApi.ledgerUpdate(map) : await roomApi.ledgerAdd(map);
    if (res.code == 0) {
      uni.$emit('refresh_ledger_data');
      if (roomId.value) {
        uni.setStorageSync(CHECKLIST_REFRESH_KEY, String(roomId.value));
        uni.setStorageSync(TASK_LEDGER_NEEDS_REFRESH, String(roomId.value));
        uni.$emit('task_ledger_refresh', String(roomId.value));
      }
      uni.hideLoading();
      if (openerEventChannel) {
        openerEventChannel.emit('ledgerUpdated');
        setTimeout(() => uni.navigateBack(), 32);
      } else {
        uni.navigateBack();
      }
    } else {
      uni.showToast({ title: res.msg, icon: 'none' });
    }
  } catch (e) {
    uni.hideLoading();
  }
};
const goBack = () => uni.navigateBack();
</script>

<style scoped>
.add-container { background-color: #F8FAFC; height: 100%; display: flex; flex-direction: column; overflow: hidden; position: relative; transition: background 0.3s; }
.add-scroll { flex: 1; height: 0; }
.add-content-inner { padding-top: 12px; }

/* 类型切换器 */
.type-switcher-container { padding: 0 20px 16px; }
.type-switcher-bg { height: 44px; background: #F1F5F9; border-radius: 16px; display: flex; position: relative; padding: 4px; }
.type-slider { position: absolute; top: 4px; left: 4px; width: calc((100% - 8px) / 3); height: calc(100% - 8px); background: #fff; border-radius: 12px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05); transition: transform 0.4s cubic-bezier(0.19, 1, 0.22, 1); z-index: 1; }
.type-tab { flex: 1; display: flex; align-items: center; justify-content: center; z-index: 2; }
.tab-txt { font-size: 13px; font-weight: 800; color: #94A3B8; transition: color 0.3s; }
.type-expense .active .tab-txt { color: var(--primary-color, #4F46E5); font-weight: 900; }
.type-income .active .tab-txt { color: #059669; font-weight: 900; }
.type-transfer .active .tab-txt { color: #D97706; font-weight: 900; }
.type-expense .type-slider { box-shadow: 0 4px 14px var(--primary-glow, rgba(79, 70, 229, 0.15)); }
.type-income .type-slider { box-shadow: 0 4px 14px rgba(16, 185, 129, 0.2); }
.type-transfer .type-slider { box-shadow: 0 4px 14px rgba(245, 158, 11, 0.2); }

/* 金额卡片 */
.amount-hero-card { margin: 0 20px 16px; padding: 2px; border-radius: 32px; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
.type-expense .amount-hero-card { background: linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%); }
.type-income .amount-hero-card { background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%); }
.type-transfer .amount-hero-card { background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%); }
.amount-card-inner {
  background: #fff;
  border-radius: 30px;
  padding: 16px 24px;
  border: 1.5px solid transparent;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}
.amount-card-inner.is-focus {
  border-width: 2px;
  padding: 15px 23px;
}
.amount-hero-card.is-amount-focused {
  box-shadow: 0 10px 36px var(--primary-glow, rgba(79, 70, 229, 0.12));
}
.amount-label-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.amount-card-label { font-size: 11px; font-weight: 900; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px; }
.amount-tag { font-size: 10px; font-weight: 900; color: #CBD5E1; }
.amount-input-container { display: flex; align-items: center; gap: 10px; }
.amount-symbol { font-size: 24px; font-weight: 900; color: #1E293B; margin-top: 4px; }
.amount-input-field { flex: 1; font-size: 40px; font-weight: 900; color: #1E293B; height: 50px; }

/* 详情列表 */
.add-details { margin: 0 20px 16px; background: #fff; border-radius: 32px; overflow: hidden; border: 1px solid #F1F5F9; }
.add-row { padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #F8FAFC; transition: all 0.2s; }
.add-row:active { background: #F8FAFC; }
.add-row-left { display: flex; align-items: center; gap: 12px; }
.add-row-icon { width: 34px; height: 34px; border-radius: 11px; display: flex; align-items: center; justify-content: center; font-size: 16px; overflow: hidden; }
.row-icon-img { width: 22px; height: 22px; border-radius: 4px; }
.add-row-label { font-size: 14px; font-weight: 800; color: #475569; }
.add-row-right { display: flex; align-items: center; }
.add-row-val { font-size: 14px; font-weight: 900; color: #1E293B; }
.add-row-arrow { font-size: 16px; color: #CBD5E1; margin-left: 4px; }

/* 备注区 - 重构美化 */
.memo-compact-section { padding: 18px 20px 24px; }
.memo-header-line { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; padding: 0 4px; }
.memo-tiny-label { font-size: 11px; font-weight: 900; color: #CBD5E1; text-transform: uppercase; letter-spacing: 1px; }
.memo-tiny-icon { font-size: 12px; color: #E2E8F0; }

.memo-input-container { 
  background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%); 
  border-radius: 18px; 
  padding: 12px 16px; 
  border: 1px solid #F1F5F9;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
}
.memo-input-container.is-focus {
  background: #fff;
  border-width: 1.5px;
  transform: translateY(-1px);
}
.add-textarea-memo { 
  width: 100%; 
  min-height: 48px; 
  font-size: 14px; 
  font-weight: 600; 
  color: #334155; 
  line-height: 1.6; 
}

.category-path { display: flex; align-items: center; margin-right: 4px; opacity: 0.5; }
.path-parent { font-size: 10px; font-weight: 700; color: #94A3B8; }
.path-sep { font-size: 10px; margin: 0 2px; color: #CBD5E1; }

.mini-avatar-item { width: 22px; height: 22px; border-radius: 50%; border: 2px solid #fff; overflow: hidden; background: #F1F5F9; box-shadow: 0 2px 6px rgba(0,0,0,0.05); margin-right: 4px; }
.mini-img { width: 100%; height: 100%; }

/* 底部保存栏 */
.add-footer-placeholder { height: 140px; } 

.fixed-save-container { 
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 999; 
  background: linear-gradient(to top, rgba(248, 250, 252, 1) 50%, rgba(248, 250, 252, 0) 100%);
  padding: 8px 20px 16px; 
}

.floating-save-dock { 
  height: 84px; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(40px); 
  -webkit-backdrop-filter: blur(40px); border: 1.5px solid rgba(255,255,255,0.7); 
  border-radius: 36px; display: flex; align-items: center; 
  padding: 0 10px 0 24px; box-shadow: 0 15px 40px rgba(0, 0, 0, 0.08);
  overflow: visible;
}

.dock-content { width: 100%; display: flex; align-items: center; justify-content: space-between; overflow: visible; }
.dock-info { flex: 1; display: flex; flex-direction: column; gap: 1px; }
.dock-label { font-size: 9px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px; }
.dock-amount-row { display: flex; align-items: baseline; gap: 3px; }
.dock-sym { font-size: 16px; font-weight: 900; }
.dock-val { font-size: 28px; font-weight: 900; letter-spacing: -1px; }

.save-pill-btn { 
  margin: 0 !important;
  height: 60px;
  padding: 0 32px;
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  box-sizing: border-box;
  flex-shrink: 0;
  overflow: visible;
  line-height: normal;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.save-pill-btn::after {
  border: none !important;
  border-radius: 22px !important;
}
.save-pill-btn:active { transform: scale(0.94); opacity: 0.95; }
.btn-ready { box-shadow: 0 10px 25px var(--primary-glow, rgba(79, 70, 229, 0.2)); animation: pulseBtn 3s infinite; }
.btn-ready .save-txt,
.btn-ready .save-arrow { color: #fff; }
@keyframes pulseBtn { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } }

.btn-disabled {
  animation: none !important;
}
.btn-disabled .save-txt {
  color: var(--primary-color, #4F46E5);
  opacity: 0.5;
}

.save-txt { font-size: 15px; font-weight: 900; }
.save-arrow { font-size: 16px; font-weight: 300; opacity: 0.7; }

.animate-island-in { animation: islandIn 0.7s cubic-bezier(0.19, 1, 0.22, 1) both; }
@keyframes islandIn { from { opacity: 0; transform: translateY(40px) scale(0.95); } to { opacity: 1; transform: translateY(0); } }
</style>
