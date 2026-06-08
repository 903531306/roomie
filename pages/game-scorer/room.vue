<template>
  <view :class="themeClass" class="room-container">
    <!-- 顶部状态栏 -->
    <view class="top-bar">
      <view class="back-btn" @click="handleExit">
        <text class="icon">←</text>
      </view>
      <view class="room-info">
        <text class="room-title">房间号: {{ roomId }}</text>
        <text class="game-type">麻将算账</text>
      </view>
      <view class="menu-btn" @click="showHistory = true">
        <text class="icon">📋</text>
      </view>
    </view>

    <!-- 牌桌区域 -->
    <view class="table-area">
      <view class="felt-surface">
        <view class="table-inner-glow"></view>
        
        <!-- 玩家座位 -->
        <view 
          v-for="player in players" 
          :key="player.id"
          :class="['player-seat', player.position, { 'is-me': player.id === myId }]"
        >
          <view class="player-card">
            <view class="player-avatar">
              <text class="avatar-emoji">{{ getAvatarEmoji(player.position) }}</text>
            </view>
            <view class="player-meta">
              <text class="player-name">{{ player.name }}</text>
              <text class="player-score" :class="{ 'positive': player.totalScore > 0, 'negative': player.totalScore < 0 }">
                {{ player.totalScore > 0 ? '+' : '' }}{{ player.totalScore }}
              </text>
            </view>
            <text v-if="player.id === myId" class="me-badge">我</text>
          </view>
        </view>

        <!-- 空位提示 -->
        <view v-if="players.length < 4" class="waiting-hint">
          <text class="hint-text">等待好友加入 ({{ players.length }}/4)</text>
          <view class="pulse-dot"></view>
        </view>

        <!-- 中心操作区 -->
        <view class="center-actions">
          <view class="score-btn" @click="openScoreModal">
            <text class="btn-label">记一局</text>
            <text class="btn-plus">+</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部结算预览 -->
    <view class="bottom-panel" v-if="players.length > 0">
      <view class="panel-header">
        <view>
          <text class="panel-title">当前结算</text>
          <text class="my-total" :class="{ 'pos': myTotalScore > 0, 'neg': myTotalScore < 0 }">
            (我的总计: {{ myTotalScore > 0 ? '+' : '' }}{{ myTotalScore }})
          </text>
        </view>
        <text class="reset-btn" @click="handleReset">重置</text>
      </view>
      
      <scroll-view scroll-y class="settlement-list">
        <view v-for="(item, index) in settlement" :key="index" class="settlement-item">
          <text class="debtor">{{ item.from }}</text>
          <text class="arrow">支付给</text>
          <text class="creditor">{{ item.to }}</text>
          <text class="amount">¥{{ item.amount }}</text>
        </view>
        <view v-if="settlement.length === 0" class="empty-hint">
          暂无欠账，大家都很平衡
        </view>
      </scroll-view>
    </view>

    <!-- 记分弹窗 -->
    <view v-if="showScoreModal" class="modal-mask" @click="showScoreModal = false">
      <view class="score-modal" @click.stop>
        <view class="modal-header">
          <text class="modal-title">本局得分</text>
          <text class="close-icon" @click="showScoreModal = false">×</text>
        </view>
        
        <view class="score-input-area">
          <!-- 玩家选择 -->
          <view class="player-selector">
            <view 
              v-for="player in players" 
              :key="player.id" 
              class="selector-item"
              :class="{ 'active': selectedPlayerId === player.id }"
              @click="selectedPlayerId = player.id"
            >
              <text class="selector-emoji">{{ getAvatarEmoji(player.position) }}</text>
              <text class="selector-name">{{ player.name }}</text>
            </view>
          </view>

          <view class="current-value" :class="{ 'pos': tempScore > 0, 'neg': tempScore < 0 }">
            {{ tempScore > 0 ? '+' : '' }}{{ tempScore }}
          </view>
          
          <view class="numpad">
            <view v-for="n in [1, 2, 5, 10, 20, 50]" :key="n" class="num-btn pos" @click="adjustScore(n)">
              +{{ n }}
            </view>
            <view v-for="n in [1, 2, 5, 10, 20, 50]" :key="n" class="num-btn neg" @click="adjustScore(-n)">
              -{{ n }}
            </view>
            <view class="num-btn clear" @click="tempScore = 0">重置</view>
          </view>
        </view>

        <button class="confirm-btn" @click="submitScore">确认提交</button>
      </view>
    </view>

    <!-- 历史记录弹窗 -->
    <view v-if="showHistory" class="modal-mask" @click="showHistory = false">
      <view class="history-modal" @click.stop>
        <view class="modal-header">
          <text class="modal-title">对局历史</text>
          <text class="close-icon" @click="showHistory = false">×</text>
        </view>
        <scroll-view scroll-y class="history-list">
          <view v-for="(round, idx) in rounds" :key="idx" class="history-item">
            <text class="round-num">第 {{ rounds.length - idx }} 局</text>
            <view class="round-scores">
              <view v-for="(score, pid) in round.scores" :key="pid" class="p-score">
                <text class="p-name">{{ getPlayerName(pid) }}:</text>
                <text :class="score >= 0 ? 'pos' : 'neg'">{{ score > 0 ? '+' : '' }}{{ score }}</text>
              </view>
            </view>
          </view>
          <view v-if="rounds.length === 0" class="empty-history">
            还没有对局记录
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { useAppTheme } from '@/common/themes/useAppTheme.js'
const { themeClass, primaryColor, softColor, theme } = useAppTheme()

import { ref, onMounted, onUnmounted, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useSocket } from "@/pages/js/useSocket.js"


const roomId = ref('8888');
const url = `ws://localhost:8889/QuestionBank-test/ws?roomId=${encodeURIComponent(roomId.value)}`
const { connect, send, close, isOpen } = useSocket(url)

const myName = ref('我');
const myId = ref('p1');
const players = ref([
  { id: 'p1', name: '我', position: 'bottom', totalScore: 125 },
  { id: 'p2', name: '隔壁老王', position: 'top', totalScore: -45 },
  { id: 'p3', name: '李大妈', position: 'left', totalScore: -80 },
  { id: 'p4', name: '小张', position: 'right', totalScore: 0 }
]);
const rounds = ref([
  { scores: { 'p1': 50, 'p2': -20, 'p3': -30, 'p4': 0 }, timestamp: Date.now() - 100000 },
  { scores: { 'p1': 75, 'p2': -25, 'p3': -50, 'p4': 0 }, timestamp: Date.now() - 200000 }
]);
const socket = ref(null);

const showScoreModal = ref(false);
const showHistory = ref(false);
const tempScore = ref(0);
const selectedPlayerId = ref('');

onLoad((options) => {
  if (options.roomId) roomId.value = options.roomId;
  if (options.name) myName.value = options.name;
  myId.value = uni.getStorageSync('playerId') || 'p1';
  selectedPlayerId.value = myId.value;
  uni.setStorageSync('playerId', myId.value);
});

onMounted(() => {
  // connectSocket();
  connect();
});

onUnmounted(() => {
  if (socket.value) {
    socket.value.close();
  }
  onUnmounted(() => {
    close()
  })
});

// function sendMsg() {

//   send({
//     type: "chat",
//     msg: "hello server"
//   })

// }

// const connectSocket = () => {
//   // Use the current origin for WebSocket, replacing http with ws
//   const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
//   const wsUrl = `${protocol}//${window.location.host}`;
  
//   socket.value = uni.connectSocket({
//     url: wsUrl,
//     complete: () => {}
//   });

//   uni.onSocketOpen(() => {
//     console.log('WebSocket connected');
//     sendToSocket({
//       type: 'JOIN_ROOM',
//       roomId: roomId.value,
//       playerName: myName.value,
//       playerId: myId.value
//     });
//   });

//   uni.onSocketMessage((res) => {
//     const data = JSON.parse(res.data);
//     if (data.type === 'ROOM_UPDATE') {
//       players.value = data.room.players;
//       rounds.value = data.room.rounds.reverse(); // Show latest first
//     }
//   });

//   uni.onSocketError((err) => {
//     console.error('WebSocket error', err);
//     uni.showToast({ title: '连接失败，正在重试', icon: 'none' });
//   });
// };

const sendToSocket = (data) => {
  if (socket.value) {
    uni.sendSocketMessage({
      data: JSON.stringify(data)
    });
  }
};

const openScoreModal = () => {
  tempScore.value = 0;
  selectedPlayerId.value = myId.value;
  showScoreModal.value = true;
};

const adjustScore = (val) => {
  tempScore.value += val;
};

const submitScore = () => {
  if (tempScore.value === 0) {
    uni.showToast({ title: '请输入分数', icon: 'none' });
    return;
  }
  
  sendToSocket({
    type: 'SUBMIT_SCORE',
    roomId: roomId.value,
    playerId: selectedPlayerId.value,
    score: tempScore.value
  });
  
  showScoreModal.value = false;
  uni.showToast({ title: '提交成功', icon: 'success' });
};

const handleReset = () => {
  uni.showModal({
    title: '重置游戏',
    content: '确定要清空所有分数吗？',
    success: (res) => {
      if (res.confirm) {
        sendToSocket({
          type: 'RESET_GAME',
          roomId: roomId.value
        });
      }
    }
  });
};

const handleExit = () => {
  uni.showModal({
    title: '退出房间',
    content: '确定要离开吗？',
    success: (res) => {
      if (res.confirm) {
        uni.navigateBack();
      }
    }
  });
};

const getAvatarEmoji = (pos) => {
  const emojis = {
    top: '👨‍🦳',
    bottom: '👦',
    left: '👩',
    right: '👧'
  };
  return emojis[pos] || '👤';
};

const getPlayerName = (id) => {
  const p = players.value.find(p => p.id === id);
  return p ? p.name : '未知玩家';
};

const myTotalScore = computed(() => {
  const me = players.value.find(p => p.id === myId.value);
  return me ? me.totalScore : 0;
});

// Settlement logic: Debt minimization
const settlement = computed(() => {
  if (players.value.length < 2) return [];
  
  const balances = players.value.map(p => ({
    name: p.name,
    balance: p.totalScore
  }));

  const creditors = balances.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance);
  const debtors = balances.filter(b => b.balance < 0).sort((a, b) => a.balance - b.balance);

  const transactions = [];
  let i = 0, j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(Math.abs(debtor.balance), creditor.balance);

    if (amount > 0) {
      transactions.push({
        from: debtor.name,
        to: creditor.name,
        amount: amount
      });
    }

    debtor.balance += amount;
    creditor.balance -= amount;

    if (Math.abs(debtor.balance) < 0.01) i++;
    if (Math.abs(creditor.balance) < 0.01) j++;
  }

  return transactions;
});
</script>

<style scoped>
.room-container {
  min-height: 100vh;
  background-color: #064e3b;
  display: flex;
  flex-direction: column;
}

.top-bar {
  padding: 100rpx 40rpx 40rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0, 0, 0, 0.2);
}

.back-btn, .menu-btn {
  width: 80rpx;
  height: 80rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon {
  color: #fff;
  font-size: 36rpx;
}

.room-info {
  text-align: center;
}

.room-title {
  display: block;
  color: #fff;
  font-size: 32rpx;
  font-weight: 700;
}

.game-type {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 4rpx;
}

.table-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
}

.felt-surface {
  width: 100%;
  aspect-ratio: 1;
  background: radial-gradient(circle at center, #065f46 0%, #064e3b 100%);
  border-radius: 60rpx;
  position: relative;
  box-shadow: inset 0 0 100rpx rgba(0, 0, 0, 0.5), 0 20rpx 50rpx rgba(0, 0, 0, 0.3);
  border: 12rpx solid #047857;
}

.table-inner-glow {
  position: absolute;
  inset: 40rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.05);
  border-radius: 40rpx;
}

.player-seat {
  position: absolute;
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.player-seat.bottom { bottom: -40rpx; left: 50%; transform: translateX(-50%); }
.player-seat.top { top: -40rpx; left: 50%; transform: translateX(-50%); }
.player-seat.left { left: -40rpx; top: 50%; transform: translateY(-50%); }
.player-seat.right { right: -40rpx; top: 50%; transform: translateY(-50%); }

.player-seat.left .player-card,
.player-seat.right .player-card {
  flex-direction: column;
  padding: 24rpx 16rpx;
  min-width: 120rpx;
}

.player-seat.left .player-meta,
.player-seat.right .player-meta {
  align-items: center;
  text-align: center;
}

.player-card {
  background: #fff;
  padding: 16rpx 24rpx;
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  box-shadow: 0 10rpx 20rpx rgba(0, 0, 0, 0.2);
  min-width: 180rpx;
  position: relative;
}

.is-me .player-card {
  border: 4rpx solid var(--primary-color, #4F46E5);
}

.player-avatar {
  width: 64rpx;
  height: 64rpx;
  background: #f1f5f9;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
}

.player-meta {
  display: flex;
  flex-direction: column;
}

.player-name {
  font-size: 24rpx;
  font-weight: 700;
  color: #1e293b;
}

.player-score {
  font-size: 28rpx;
  font-weight: 900;
}

.player-score.positive { color: #10b981; }
.player-score.negative { color: #f43f5e; }

.me-badge {
  position: absolute;
  top: -12rpx;
  right: -12rpx;
  background: var(--primary-color, #4F46E5);
  color: #fff;
  font-size: 16rpx;
  padding: 4rpx 10rpx;
  border-radius: 10rpx;
  font-weight: 900;
}

.waiting-hint {
  position: absolute;
  top: 30%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}

.hint-text {
  color: rgba(255, 255, 255, 0.4);
  font-size: 24rpx;
  font-weight: 600;
}

.pulse-dot {
  width: 12rpx;
  height: 12rpx;
  background: #fff;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(3); opacity: 0; }
}

.center-actions {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.score-btn {
  width: 160rpx;
  height: 160rpx;
  background: #fbbf24;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 15rpx 30rpx rgba(0, 0, 0, 0.3), inset 0 5rpx 10rpx rgba(255, 255, 255, 0.5);
  border: 8rpx solid #f59e0b;
  transition: all 0.2s;
}

.score-btn:active {
  transform: scale(0.9);
  box-shadow: 0 5rpx 10rpx rgba(0, 0, 0, 0.3);
}

.btn-label {
  font-size: 24rpx;
  font-weight: 900;
  color: #78350f;
}

.btn-plus {
  font-size: 48rpx;
  font-weight: 300;
  color: #78350f;
}

.bottom-panel {
  background: #fff;
  border-radius: 60rpx 60rpx 0 0;
  padding: 40rpx;
  height: 400rpx;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.panel-title {
  font-size: 32rpx;
  font-weight: 900;
  color: #1e293b;
}

.my-total {
  font-size: 24rpx;
  margin-left: 16rpx;
  font-weight: 600;
}

.my-total.pos { color: #10b981; }
.my-total.neg { color: #f43f5e; }

.reset-btn {
  font-size: 24rpx;
  color: #f43f5e;
  font-weight: 700;
}

.settlement-list {
  flex: 1;
}

.settlement-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1px solid #f1f5f9;
}

.debtor { font-weight: 700; color: #f43f5e; flex: 1; }
.arrow { font-size: 20rpx; color: #94a3b8; margin: 0 20rpx; }
.creditor { font-weight: 700; color: #10b981; flex: 1; text-align: right; }
.amount { font-weight: 900; color: #1e293b; margin-left: 40rpx; min-width: 120rpx; text-align: right; }

.empty-hint {
  text-align: center;
  color: #94a3b8;
  padding-top: 60rpx;
  font-size: 24rpx;
}

/* Modals */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.score-modal, .history-modal {
  width: 100%;
  background: #fff;
  border-radius: 60rpx 60rpx 0 0;
  padding: 40rpx 40rpx calc(40rpx + env(safe-area-inset-bottom));
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40rpx;
}

.modal-title {
  font-size: 36rpx;
  font-weight: 900;
  color: #1e293b;
}

.close-icon {
  font-size: 48rpx;
  color: #94a3b8;
}

.score-input-area {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.current-value {
  font-size: 100rpx;
  font-weight: 900;
  margin-bottom: 40rpx;
}

.player-selector {
  display: flex;
  gap: 20rpx;
  margin-bottom: 40rpx;
  width: 100%;
  overflow-x: auto;
  padding: 10rpx 0;
}

.selector-item {
  flex: 1;
  min-width: 120rpx;
  background: #f1f5f9;
  padding: 20rpx;
  border-radius: 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  border: 4rpx solid transparent;
  transition: all 0.2s;
}

.selector-item.active {
  background: #eef2ff;
  border-color: var(--primary-color, #4F46E5);
}

.selector-emoji {
  font-size: 40rpx;
}

.selector-name {
  font-size: 20rpx;
  font-weight: 700;
  color: #64748b;
  white-space: nowrap;
}

.selector-item.active .selector-name {
  color: var(--primary-color, #4F46E5);
}

.current-value.pos { color: #10b981; }
.current-value.neg { color: #f43f5e; }

.numpad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
  width: 100%;
}

.num-btn {
  height: 100rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 700;
}

.num-btn.pos { background: #ecfdf5; color: #10b981; }
.num-btn.neg { background: #fff1f2; color: #f43f5e; }
.num-btn.clear { background: #f1f5f9; color: #64748b; grid-column: span 3; }

.confirm-btn {
  width: 100%;
  height: 110rpx;
  background: var(--primary-color, #4F46E5);
  color: #fff;
  border-radius: 32rpx;
  margin-top: 40rpx;
  font-weight: 900;
  border: none;
}

.history-list {
  max-height: 60vh;
}

.history-item {
  padding: 30rpx;
  background: #f8fafc;
  border-radius: 24rpx;
  margin-bottom: 20rpx;
}

.round-num {
  font-size: 20rpx;
  font-weight: 900;
  color: #94a3b8;
  text-transform: uppercase;
  margin-bottom: 16rpx;
  display: block;
}

.round-scores {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}

.p-score {
  display: flex;
  justify-content: space-between;
  font-size: 24rpx;
}

.p-name { color: #64748b; }
.p-score .pos { color: #10b981; font-weight: 700; }
.p-score .neg { color: #f43f5e; font-weight: 700; }

.empty-history {
  text-align: center;
  padding: 100rpx 0;
  color: #94a3b8;
}
</style>
