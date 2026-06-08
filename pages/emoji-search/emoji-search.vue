<template>
  <view :class="themeClass" class="emoji-search-page">
    <IosNav title="表情搜索" @leftClick="goBack" />

    <!-- 背景装饰 -->
    <view class="ambient-bg">
      <view class="glow-orb orb-1"></view>
      <view class="glow-orb orb-2"></view>
    </view>

    <view class="container">
      <!-- 搜索栏 -->
      <view class="search-section animate-fade-in">
        <view class="search-bar-wrapper">
          <view class="search-icon">🔍</view>
          <input 
            class="search-input" 
            type="text" 
            v-model="searchQuery" 
            placeholder="搜索表情，如 '笑'、'火'..."
            placeholder-class="search-placeholder"
          />
          <view v-if="searchQuery" class="clear-btn" @click="searchQuery = ''">✕</view>
        </view>
      </view>

      <!-- 表情网格 -->
      <scroll-view scroll-y class="emoji-scroll">
        <view class="emoji-grid">
          <view 
            v-for="(emoji, index) in filteredEmojis" 
            :key="emoji.char"
            class="emoji-item animate-pop-in"
            :style="{ 'animation-delay': (index % 20 * 0.02) + 's' }"
            @click="copyEmoji(emoji.char)"
          >
            <text class="emoji-char">{{ emoji.char }}</text>
            <text class="emoji-name">{{ emoji.name }}</text>
          </view>
        </view>
        
        <!-- 空状态 -->
        <view v-if="filteredEmojis.length === 0" class="empty-state animate-fade-in">
          <text class="empty-icon">🔍</text>
          <text class="empty-text">没找到相关表情，换个词试试？</text>
        </view>
        
        <view class="bottom-padding"></view>
      </scroll-view>
    </view>

    <!-- 复制提示 -->
    <view v-if="showToast" class="toast-overlay">
      <view class="toast-content animate-pop-in">
        <text class="toast-icon">✨</text>
        <text class="toast-text">已复制 {{ lastCopied }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { useAppTheme } from '@/common/themes/useAppTheme.js'
const { themeClass, primaryColor, softColor, theme } = useAppTheme()

import { ref, computed } from 'vue';
import IosNav from '../../components/nav/ios-nav.vue';

const searchQuery = ref('');
const showToast = ref(false);
const lastCopied = ref('');

const emojiList = [
  { char: '😀', name: '微笑', tags: ['smile', 'happy', '笑', '开心'] },
  { char: '😃', name: '大笑', tags: ['smile', 'happy', '笑', '开心'] },
  { char: '😄', name: '眯眼笑', tags: ['smile', 'happy', '笑', '开心'] },
  { char: '😁', name: '露齿笑', tags: ['smile', 'happy', '笑', '开心'] },
  { char: '😅', name: '流汗笑', tags: ['smile', 'happy', '笑', '尴尬'] },
  { char: '😂', name: '笑哭', tags: ['laugh', 'joy', '哭笑', '有趣'] },
  { char: '🤣', name: '满地打滚', tags: ['laugh', 'joy', '哭笑', '有趣'] },
  { char: '😊', name: '羞涩笑', tags: ['smile', 'happy', '笑', '开心'] },
  { char: '😇', name: '天使', tags: ['angel', 'good', '善良'] },
  { char: '🥰', name: '爱慕', tags: ['love', 'heart', '爱', '喜欢'] },
  { char: '😍', name: '色眯眯', tags: ['love', 'heart', '爱', '喜欢'] },
  { char: '🤩', name: '星眼', tags: ['wow', 'star', '厉害', '崇拜'] },
  { char: '😘', name: '飞吻', tags: ['love', 'kiss', '爱', '亲亲'] },
  { char: '😗', name: '亲亲', tags: ['kiss', '亲亲'] },
  { char: '😚', name: '闭眼亲', tags: ['kiss', '亲亲'] },
  { char: '😋', name: '好吃', tags: ['yum', 'food', '美味'] },
  { char: '😛', name: '吐舌', tags: ['tongue', 'playful', '调皮'] },
  { char: '😜', name: '眨眼吐舌', tags: ['tongue', 'playful', '调皮'] },
  { char: '🤪', name: '搞怪', tags: ['crazy', 'funny', '滑稽'] },
  { char: '😝', name: '闭眼吐舌', tags: ['tongue', 'playful', '调皮'] },
  { char: '🤑', name: '发财', tags: ['money', 'rich', '钱'] },
  { char: '🤗', name: '拥抱', tags: ['hug', 'warm', '抱抱'] },
  { char: '🤭', name: '捂嘴笑', tags: ['laugh', 'shy', '偷笑'] },
  { char: '🤫', name: '嘘', tags: ['shh', 'quiet', '安静'] },
  { char: '🤔', name: '思考', tags: ['think', 'ponder', '想', '疑惑'] },
  { char: '🤐', name: '闭嘴', tags: ['shutup', 'secret', '秘密'] },
  { char: '🤨', name: '挑眉', tags: ['suspicious', 'hmm', '怀疑'] },
  { char: '😐', name: '冷淡', tags: ['neutral', 'flat', '无语'] },
  { char: '😑', name: '无语', tags: ['neutral', 'flat', '无语'] },
  { char: '😶', name: '沉默', tags: ['silent', 'no mouth', '没话说'] },
  { char: '😏', name: '得意', tags: ['smirk', 'cool', '歪嘴'] },
  { char: '😒', name: '不屑', tags: ['unhappy', 'whatever', '翻白眼'] },
  { char: '🙄', name: '翻白眼', tags: ['rolling eyes', 'whatever', '无语'] },
  { char: '😬', name: '尴尬', tags: ['awkward', 'teeth', '牙疼'] },
  { char: '🤥', name: '撒谎', tags: ['lie', 'nose', '匹诺曹'] },
  { char: '😌', name: '松口气', tags: ['relieved', 'calm', '舒坦'] },
  { char: '😔', name: '忧郁', tags: ['sad', 'pensive', '难过'] },
  { char: '😪', name: '困', tags: ['sleepy', 'tired', '想睡'] },
  { char: '🤤', name: '流口水', tags: ['drool', 'want', '馋'] },
  { char: '😴', name: '睡觉', tags: ['sleep', 'night', '晚安'] },
  { char: '😷', name: '口罩', tags: ['mask', 'sick', '生病'] },
  { char: '🤒', name: '发烧', tags: ['sick', 'fever', '生病'] },
  { char: '🤕', name: '受伤', tags: ['sick', 'hurt', '生病'] },
  { char: '🤢', name: '恶心', tags: ['sick', 'vomit', '想吐'] },
  { char: '🤮', name: '呕吐', tags: ['sick', 'vomit', '吐了'] },
  { char: '🤧', name: '感冒', tags: ['sick', 'sneeze', '喷嚏'] },
  { char: '🥵', name: '热', tags: ['hot', 'summer', '热死'] },
  { char: '🥶', name: '冷', tags: ['cold', 'winter', '冻死'] },
  { char: '🥴', name: '迷糊', tags: ['drunk', 'dizzy', '晕'] },
  { char: '😵', name: '晕厥', tags: ['dizzy', 'dead', '晕'] },
  { char: '🤯', name: '爆炸', tags: ['mind blown', 'wow', '炸了'] },
  { char: '🤠', name: '牛仔', tags: ['cowboy', 'hat', '帅气'] },
  { char: '🥳', name: '派对', tags: ['party', 'celebrate', '开心'] },
  { char: '😎', name: '酷', tags: ['cool', 'sunglasses', '帅', '装逼'] },
  { char: '🤓', name: '学霸', tags: ['nerd', 'geek', '眼镜'] },
  { char: '🧐', name: '单片镜', tags: ['monocle', 'smart', '观察'] },
  { char: '😕', name: '困惑', tags: ['confused', 'sad', '纠结'] },
  { char: '😟', name: '担心', tags: ['worried', 'sad', '愁'] },
  { char: '🙁', name: '微难过', tags: ['sad', 'frown', '不开心'] },
  { char: '😮', name: '惊讶', tags: ['wow', 'surprise', '哇'] },
  { char: '😯', name: '吃惊', tags: ['wow', 'surprise', '哦'] },
  { char: '😲', name: '震惊', tags: ['wow', 'surprise', '天哪'] },
  { char: '😳', name: '脸红', tags: ['blush', 'shy', '害羞'] },
  { char: '🥺', name: '恳求', tags: ['please', 'sad', '委屈'] },
  { char: '😦', name: '惊恐', tags: ['scared', 'wow', '吓到'] },
  { char: '😧', name: '焦虑', tags: ['scared', 'worried', '慌'] },
  { char: '😨', name: '害怕', tags: ['scared', 'fear', '怕'] },
  { char: '😰', name: '冷汗', tags: ['scared', 'sweat', '慌张'] },
  { char: '😥', name: '失望', tags: ['sad', 'sweat', '难受'] },
  { char: '😢', name: '流泪', tags: ['cry', 'sad', '哭'] },
  { char: '😭', name: '大哭', tags: ['cry', 'sad', '爆哭'] },
  { char: '😱', name: '尖叫', tags: ['scared', 'scream', '吓死'] },
  { char: '😖', name: '痛苦', tags: ['pain', 'sad', '难受'] },
  { char: '😣', name: '坚持', tags: ['pain', 'struggle', '忍耐'] },
  { char: '😞', name: '失望', tags: ['sad', 'depressed', '沮丧'] },
  { char: '😓', name: '冷汗', tags: ['sweat', 'sad', '无语'] },
  { char: '😩', name: '疲惫', tags: ['tired', 'weary', '累'] },
  { char: '😫', name: '烦躁', tags: ['tired', 'frustrated', '烦'] },
  { char: '🥱', name: '哈欠', tags: ['yawn', 'tired', '困'] },
  { char: '😤', name: '生气', tags: ['angry', 'proud', '哼'] },
  { char: '😡', name: '愤怒', tags: ['angry', 'mad', '火大'] },
  { char: '😠', name: '恼火', tags: ['angry', 'mad', '生气'] },
  { char: '🤬', name: '咒骂', tags: ['angry', 'curse', '骂人'] },
  { char: '😈', name: '恶魔笑', tags: ['devil', 'evil', '坏笑'] },
  { char: '👿', name: '恶魔怒', tags: ['devil', 'angry', '生气'] },
  { char: '💀', name: '骷髅', tags: ['skull', 'dead', '死'] },
  { char: '💩', name: '大便', tags: ['poop', 'funny', '便便'] },
  { char: '🤡', name: '小丑', tags: ['clown', 'funny', '滑稽'] },
  { char: '👻', name: '幽灵', tags: ['ghost', 'halloween', '鬼'] },
  { char: '👽', name: '外星人', tags: ['alien', 'space', '外星人'] },
  { char: '👾', name: '怪兽', tags: ['monster', 'game', '像素'] },
  { char: '🤖', name: '机器人', tags: ['robot', 'tech', '机械'] },
  { char: '😺', name: '猫笑', tags: ['cat', 'smile', '猫'] },
  { char: '😸', name: '猫大笑', tags: ['cat', 'smile', '猫'] },
  { char: '😻', name: '猫爱慕', tags: ['cat', 'love', '猫'] },
  { char: '😼', name: '猫坏笑', tags: ['cat', 'smirk', '猫'] },
  { char: '😽', name: '猫亲亲', tags: ['cat', 'kiss', '猫'] },
  { char: '🙀', name: '猫震惊', tags: ['cat', 'wow', '猫'] },
  { char: '😿', name: '猫流泪', tags: ['cat', 'cry', '猫'] },
  { char: '😾', name: '猫生气', tags: ['cat', 'angry', '猫'] },
  { char: '🙈', name: '非礼勿视', tags: ['monkey', 'hide', '猴子'] },
  { char: '🙉', name: '非礼勿听', tags: ['monkey', 'hide', '猴子'] },
  { char: '🙊', name: '非礼勿言', tags: ['monkey', 'hide', '猴子'] },
  { char: '💋', name: '唇印', tags: ['kiss', 'love', '亲'] },
  { char: '💌', name: '情书', tags: ['love', 'letter', '信'] },
  { char: '💘', name: '丘比特', tags: ['love', 'heart', '爱'] },
  { char: '💝', name: '礼物心', tags: ['love', 'heart', '爱'] },
  { char: '💖', name: '闪亮心', tags: ['love', 'heart', '爱'] },
  { char: '💗', name: '跳动心', tags: ['love', 'heart', '爱'] },
  { char: '💓', name: '心跳', tags: ['love', 'heart', '爱'] },
  { char: '💞', name: '旋转心', tags: ['love', 'heart', '爱'] },
  { char: '💕', name: '双心', tags: ['love', 'heart', '爱'] },
  { char: '💟', name: '心装饰', tags: ['love', 'heart', '爱'] },
  { char: '❣️', name: '心感叹号', tags: ['love', 'heart', '爱'] },
  { char: '💔', name: '心碎', tags: ['love', 'heart', '碎了'] },
  { char: '❤️', name: '红心', tags: ['love', 'heart', '爱'] },
  { char: '🧡', name: '橙心', tags: ['love', 'heart', '爱'] },
  { char: '💛', name: '黄心', tags: ['love', 'heart', '爱'] },
  { char: '💚', name: '绿心', tags: ['love', 'heart', '爱'] },
  { char: '💙', name: '蓝心', tags: ['love', 'heart', '爱'] },
  { char: '💜', name: '紫心', tags: ['love', 'heart', '爱'] },
  { char: '🤎', name: '棕心', tags: ['love', 'heart', '爱'] },
  { char: '🖤', name: '黑心', tags: ['love', 'heart', '爱'] },
  { char: '🤍', name: '白心', tags: ['love', 'heart', '爱'] },
  { char: '💯', name: '一百分', tags: ['score', 'perfect', '满分'] },
  { char: '💢', name: '青筋', tags: ['angry', 'mad', '生气'] },
  { char: '💥', name: '爆炸', tags: ['boom', 'wow', '炸'] },
  { char: '💫', name: '晕', tags: ['dizzy', 'star', '晕'] },
  { char: '💦', name: '汗水', tags: ['sweat', 'water', '水'] },
  { char: '💨', name: '烟雾', tags: ['smoke', 'fast', '跑'] },
  { char: '🕳️', name: '洞', tags: ['hole', 'dark', '坑'] },
  { char: '💣', name: '炸弹', tags: ['bomb', 'danger', '炸'] },
  { char: '💬', name: '气泡', tags: ['chat', 'talk', '说话'] },
  { char: '👁️‍🗨️', name: '眼睛气泡', tags: ['eye', 'talk', '看'] },
  { char: '🗨️', name: '左气泡', tags: ['chat', 'talk', '说话'] },
  { char: '🗯️', name: '怒气泡', tags: ['chat', 'angry', '骂'] },
  { char: '💭', name: '思考气泡', tags: ['thought', 'think', '想'] },
  { char: '💤', name: '睡觉', tags: ['sleep', 'tired', '困'] },
  { char: '👋', name: '挥手', tags: ['wave', 'hello', '你好'] },
  { char: '🤚', name: '手背', tags: ['hand', 'stop', '手'] },
  { char: '🖐️', name: '五指', tags: ['hand', 'five', '手'] },
  { char: '✋', name: '举手', tags: ['hand', 'stop', '手'] },
  { char: '🖖', name: '瓦肯举手', tags: ['hand', 'spock', '手'] },
  { char: '👌', name: 'OK', tags: ['ok', 'good', '好'] },
  { char: '🤏', name: '一点点', tags: ['little', 'small', '小'] },
  { char: '✌️', name: '耶', tags: ['victory', 'peace', '二'] },
  { char: '🤞', name: '好运', tags: ['luck', 'cross', '保佑'] },
  { char: '🤟', name: '爱你', tags: ['love', 'hand', '爱'] },
  { char: '🤘', name: '摇滚', tags: ['rock', 'cool', '牛'] },
  { char: '🤙', name: '打电话', tags: ['call', 'hand', '六'] },
  { char: '👈', name: '向左指', tags: ['point', 'left', '左'] },
  { char: '👉', name: '向右指', tags: ['point', 'right', '右'] },
  { char: '👆', name: '向上指', tags: ['point', 'up', '上'] },
  { char: '🖕', name: '中指', tags: ['middle finger', 'angry', '骂'] },
  { char: '👇', name: '向下指', tags: ['point', 'down', '下'] },
  { char: '☝️', name: '第一', tags: ['point', 'up', '一'] },
  { char: '👍', name: '点赞', tags: ['like', 'good', '棒'] },
  { char: '👎', name: '差评', tags: ['dislike', 'bad', '烂'] },
  { char: '✊', name: '握拳', tags: ['fist', 'power', '拳'] },
  { char: '👊', name: '出拳', tags: ['fist', 'hit', '打'] },
  { char: '🤛', name: '左拳', tags: ['fist', 'hand', '拳'] },
  { char: '🤜', name: '右拳', tags: ['fist', 'hand', '拳'] },
  { char: '👏', name: '鼓掌', tags: ['clap', 'good', '好'] },
  { char: '🙌', name: '举手庆祝', tags: ['celebrate', 'hands', '万岁'] },
  { char: '👐', name: '张开手', tags: ['hands', 'open', '抱'] },
  { char: '🤲', name: '合十', tags: ['hands', 'pray', '祈祷'] },
  { char: '🤝', name: '握手', tags: ['handshake', 'deal', '合作'] },
  { char: '🙏', name: '祈祷', tags: ['pray', 'please', '拜托'] },
  { char: '✍️', name: '写作', tags: ['write', 'hand', '写'] },
  { char: '💅', name: '美甲', tags: ['nail', 'beauty', '美'] },
  { char: '🤳', name: '自拍', tags: ['selfie', 'phone', '拍'] },
  { char: '💪', name: '肌肉', tags: ['muscle', 'strong', '强'] },
  { char: '🦾', name: '机械臂', tags: ['robot', 'strong', '强'] },
  { char: '🦵', name: '腿', tags: ['leg', 'body', '腿'] },
  { char: '🦿', name: '机械腿', tags: ['robot', 'leg', '腿'] },
  { char: '🦶', name: '脚', tags: ['foot', 'body', '脚'] },
  { char: '👂', name: '耳朵', tags: ['ear', 'listen', '听'] },
  { char: '🦻', name: '助听器', tags: ['ear', 'listen', '听'] },
  { char: '👃', name: '鼻子', tags: ['nose', 'smell', '闻'] },
  { char: '🧠', name: '脑子', tags: ['brain', 'smart', '想'] },
  { char: '🦷', name: '牙齿', tags: ['tooth', 'dentist', '牙'] },
  { char: '🦴', name: '骨头', tags: ['bone', 'dog', '骨'] },
  { char: '👀', name: '眼睛', tags: ['eyes', 'look', '看'] },
  { char: '👁️', name: '单眼', tags: ['eye', 'look', '看'] },
  { char: '👅', name: '舌头', tags: ['tongue', 'mouth', '舌'] },
  { char: '👄', name: '嘴巴', tags: ['mouth', 'lips', '嘴'] },
  { char: '👶', name: '婴儿', tags: ['baby', 'child', '娃'] },
  { char: '🧒', name: '儿童', tags: ['child', 'kid', '孩'] },
  { char: '👦', name: '男孩', tags: ['boy', 'child', '男'] },
  { char: '👧', name: '女孩', tags: ['girl', 'child', '女'] },
  { char: '🔥', name: '火', tags: ['fire', 'hot', '火热', '厉害'] },
  { char: '✨', name: '闪耀', tags: ['sparkles', 'star', '闪亮', '精致'] },
  { char: '🌈', name: '彩虹', tags: ['rainbow', 'color', '美好'] },
  { char: '🚀', name: '火箭', tags: ['rocket', 'fast', '起飞', '进步'] },
  { char: '🎉', name: '庆祝', tags: ['party', 'celebrate', '恭喜'] },
];

const filteredEmojis = computed(() => {
  if (!searchQuery.value) return emojiList;
  const q = searchQuery.value.toLowerCase();
  return emojiList.filter(e => 
    e.name.includes(q) || 
    e.tags.some(t => t.includes(q))
  );
});

const goBack = () => uni.navigateBack();

const copyEmoji = (char) => {
  uni.setClipboardData({
    data: char,
    showToast: false,
    success: () => {
      lastCopied.value = char;
      showToast.value = true;
      setTimeout(() => {
        showToast.value = false;
      }, 1500);
    }
  });
};
</script>

<style scoped>
.emoji-search-page {
  min-height: 100vh;
  background-color: #f8fafc;
  position: relative;
  overflow: hidden;
}

/* 背景装饰 */
.ambient-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.15;
}

.orb-1 {
  width: 600rpx;
  height: 600rpx;
  background: #6366f1;
  top: -100rpx;
  right: -100rpx;
}

.orb-2 {
  width: 500rpx;
  height: 500rpx;
  background: #ec4899;
  bottom: 100rpx;
  left: -100rpx;
}

.container {
  position: relative;
  z-index: 1;
  padding: 0 40rpx;
  height: calc(100vh - 180rpx); /* 减去导航栏高度 */
  display: flex;
  flex-direction: column;
}

/* 搜索栏 */
.search-section {
  margin-top: 20rpx;
  margin-bottom: 40rpx;
}

.search-bar-wrapper {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border-radius: 32rpx;
  padding: 24rpx 32rpx;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.03);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.search-bar-wrapper:focus-within {
  background: #ffffff;
  border-color: #6366f1;
  box-shadow: 0 12rpx 40rpx rgba(99, 102, 241, 0.1);
  transform: translateY(-2rpx);
}

.search-icon {
  font-size: 32rpx;
  margin-right: 20rpx;
  opacity: 0.6;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: #1e293b;
  font-weight: 600;
}

.search-placeholder {
  color: #94a3b8;
  font-weight: 400;
}

.clear-btn {
  padding: 10rpx;
  font-size: 24rpx;
  color: #94a3b8;
  cursor: pointer;
}

/* 表情网格 */
.emoji-scroll {
  flex: 1;
  overflow: hidden;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24rpx;
  padding: 10rpx 0;
}

.emoji-item {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 28rpx;
  padding: 30rpx 10rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.5);
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
  cursor: pointer;
}

.emoji-item:active {
  transform: scale(0.9);
  background: #f1f5f9;
}

.emoji-char {
  font-size: 56rpx;
  margin-bottom: 12rpx;
}

.emoji-name {
  font-size: 20rpx;
  color: #64748b;
  font-weight: 500;
  text-align: center;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;
}

.empty-icon {
  font-size: 100rpx;
  margin-bottom: 40rpx;
  opacity: 0.2;
}

.empty-text {
  font-size: 28rpx;
  color: #94a3b8;
  font-weight: 500;
}

.bottom-padding {
  height: 100rpx;
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

/* 动画 */
.animate-fade-in {
  animation: fadeIn 0.6s ease-out both;
}

.animate-pop-in {
  animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10rpx); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes popIn {
  from { opacity: 0; transform: scale(0.8) translateY(20rpx); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
</style>
