
<template>
  <view :class="themeClass" class="wheel-stage">
    <view class="outer-glow-ring"></view>
    <view class="wheel-pointer">
      <view class="pointer-tip"></view>
    </view>

    <view 
      class="wheel-disk"
      :style="{ 
        transform: `rotate(${rotationAngle}deg)`, 
        transition: spinning ? `transform ${duration}ms cubic-bezier(0.15, 0, 0, 1)` : 'none'
      }"
    >
      <!-- 扇形底色 -->
      <view class="color-layer" :style="{ background: calculateGradient(options) }"></view>
      
      <!-- 径向文字层 -->
      <view class="label-layer">
        <view 
          v-for="(item, index) in options" 
          :key="index"
          class="sector-line-container"
          :style="{ transform: `rotate(${index * (360 / options.length) + (360 / options.length / 2)}deg)` }"
        >
          <view class="radial-glass-tube">
            <view class="char-stack">
              <text 
                v-for="(char, cIdx) in (item.name || '').split('')" 
                :key="cIdx"
                class="radial-char"
                :style="{ 
                  opacity: 1 - (cIdx * 0.12),
                  transform: `scale(${1 - (cIdx * 0.04)})`,
                  marginTop: cIdx === 0 ? '0' : '4px'
                }"
              >{{ char }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="frosted-overlay"></view>

      <!-- 中心装饰 -->
      <view class="disk-hub">
        <view class="hub-core"></view>
        <view class="hub-shimmer"></view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { useAppTheme } from '@/common/themes/useAppTheme.js'
const { themeClass, primaryColor, softColor, theme } = useAppTheme()

const props = defineProps({
  options: { type: Array, default: () => [] },
  rotationAngle: { type: Number, default: 0 },
  spinning: { type: Boolean, default: false },
  duration: { type: Number, default: 5000 }
});

const calculateGradient = (options) => {
  if (!options || options.length === 0) return '#F1F5F9';
  const len = options.length;
  const step = 360 / len;
  let g = 'conic-gradient(';
  options.forEach((opt, i) => {
    g += `${opt.color} ${i * step}deg ${(i + 1) * step}deg${i === len - 1 ? '' : ','}`;
  });
  g += ')';
  return g;
};
</script>

<style scoped>
.wheel-stage { position: relative; width: 340px; height: 340px; margin: 0 auto; }
.outer-glow-ring { position: absolute; inset: -15px; border-radius: 50%; background: radial-gradient(circle, rgba(255,255,255,1) 60%, rgba(241, 245, 249, 0.5) 100%); box-shadow: 0 20px 40px rgba(0,0,0,0.03); }
.wheel-pointer { position: absolute; top: -15px; left: 50%; transform: translateX(-50%); z-index: 100; }
.pointer-tip { width: 24px; height: 34px; background: #1E293B; clip-path: polygon(50% 100%, 0 0, 100% 0); filter: drop-shadow(0 4px 10px rgba(0,0,0,0.3)); }

.wheel-disk { width: 100%; height: 100%; border-radius: 50%; position: relative; overflow: hidden; box-shadow: 0 0 0 10px #FFFFFF, 0 40px 100px rgba(15, 23, 42, 0.15); will-change: transform; }
.color-layer { position: absolute; inset: 0; z-index: 1; }
.frosted-overlay { position: absolute; inset: 0; z-index: 5; background: radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.1) 100%); backdrop-filter: blur(1px); }

.label-layer { position: absolute; inset: 0; z-index: 10; }
.sector-line-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
.radial-glass-tube { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -100%); height: 48%; width: 0; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; padding-bottom: 50px; overflow: visible; }
.char-stack { display: flex; flex-direction: column; align-items: center; background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(8px); padding: 12px 10px; border-radius: 100px; border: 1px solid rgba(255, 255, 255, 0.2); width: auto; }
.radial-char { font-size: 12px; font-weight: 700; color: #fff; line-height: 1.1; text-shadow: 0 2px 4px rgba(0,0,0,0.2); text-align: center; }

.disk-hub { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 60px; height: 60px; background: #fff; border-radius: 50%; z-index: 50; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
.hub-core { width: 16px; height: 16px; background: #1E293B; border-radius: 50%; }
.hub-shimmer { position: absolute; inset: 4px; border-radius: 50%; border: 1.5px dashed #E2E8F0; animation: spinSlow 12s linear infinite; }
@keyframes spinSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
