<template>
  <view :class="themeClass" class="rooms-stream">
    <view class="section-top">
      <text class="section-title">活跃空间</text>
      <view class="all-btn" @click="$emit('viewAll')">
        <text>管理全部</text>
        <!-- <text class="arrow"> ></text> -->
      </view>
    </view>

    <!-- 1. 加载状态：骨架屏 -->
    <block v-if="loading">
      <view v-for="i in 2" :key="'skeleton-' + i" class="pro-feature-card skeleton-card">
        <view class="skeleton-header">
          <view class="sk-item sk-icon shimmer"></view>
          <view class="sk-info">
            <view class="sk-item sk-title shimmer"></view>
            <view class="sk-item sk-pill shimmer"></view>
          </view>
          <view class="sk-item sk-tag shimmer"></view>
        </view>
        <view class="skeleton-body">
          <view class="sk-item sk-data-block shimmer"></view>
        </view>
        <view class="skeleton-footer">
          <view class="sk-avt-group">
            <view v-for="j in 3" :key="j" class="sk-item sk-circle shimmer"></view>
          </view>
          <view class="sk-item sk-enter-btn shimmer"></view>
        </view>
      </view>
    </block>

    <!-- 2. 错误状态：重试视图 -->
    <block v-else-if="error">
      <view class="error-state animate-fade-in">
        <view class="error-visual">
          <view class="error-orb"></view>
          <text class="error-emoji">📶</text>
        </view>
        <text class="error-title">网络连接似乎断开了</text>
        <text class="error-desc">暂时无法获取最新的家庭空间数据</text>
        <view class="retry-btn-pill" @click="$emit('retry')">
          <text>点击重试</text>
          <text class="retry-icon">↻</text>
        </view>
      </view>
    </block>

    <!-- 3. 正常数据展示 -->
    <block v-else>
      <view 
        v-for="(room, index) in roomsWithMembers.slice(0, 3)" 
        :key="room.id"
        class="pro-feature-card animate-slide-up"
        :class="['theme-' + room.primaryFeature]"
        :style="{ animationDelay: (index * 0.1) + 's' }"
        @click="handleRoomClick(room)"
      >
        <view class="card-glow"></view>
        
        <view class="card-body">
          <view class="card-header-row">
            <view class="room-identity">
              <view class="room-icon-box">
                <image v-if="isImageUrl(room.icon)" :src="room.icon" mode="aspectFill" class="room-icon-img" />
                <text v-else>{{ room.icon }}</text>
              </view>
              <view class="room-names-group">
                <text class="room-name-text">{{ room.name }}</text>
                <view class="feature-pills">
                  <view v-for="f in room.featuresArray" :key="f.name" class="f-pill">
                    <image v-if="isImageUrl(f.icon)" :src="f.icon" mode="aspectFill" class="f-pill-img" />
                    <text v-else>{{ f.icon }}</text>
                    <text class="f-name">{{f.name}}</text>
                  </view>
                </view>
              </view>
            </view>
            <view class="active-tag">
              <text class="active-dot"></text>
              <text class="active-txt">活跃</text>
            </view>
          </view>

          <view v-if="room.primaryFeature === 'ledger'" class="core-data ledger-content">
            <view class="ledger-dual-row">
              <view class="ledger-col">
                <text class="data-label">本月支出</text>
                <view class="price-wrap">
                  <text class="currency">¥</text>
                  <text class="amount-number exp">{{ formatPrice(room.data?.expense || room.monthExpense || '0.00') }}</text>
                </view>
                <text class="col-footer-hint">{{ room.data?.count || room.expenseCount || 0 }} 笔支出记录</text>
              </view>
              <view class="ledger-v-divider"></view>
              <view class="ledger-col">
                <text class="data-label">本月收入</text>
                <view class="price-wrap">
                  <text class="currency inc">¥</text>
                  <text class="amount-number inc">{{ formatPrice(room.data?.income || room.monthIncome || '0.00') }}</text>
                </view>
                <text class="col-footer-hint">资产稳健增长中</text>
              </view>
            </view>
          </view>

          <view v-else-if="room.primaryFeature === 'checklist'" class="core-data checklist-content">
            <text class="cl-stats-line">
              待办 {{ room.checklistStats.pending }} · 紧急 {{ room.checklistStats.urgent }} · 逾期 {{ room.checklistStats.overdue }}
            </text>

            <block v-if="room.previewTasks && room.previewTasks.length > 0">
              <text class="cl-preview-label">待处理</text>
              <view class="cl-preview-list">
                <view
                  v-for="(task, tIdx) in room.previewTasks"
                  :key="'preview-' + room.id + '-' + (task.id != null && task.id !== '' ? task.id : tIdx)"
                  class="cl-preview-row animate-item-pop"
                  :style="{ animationDelay: (index * 0.1 + tIdx * 0.08) + 's' }"
                >
                  <text class="cl-preview-dot">○</text>
                  <view class="cl-preview-title-wrap">
                    <text class="cl-preview-title">{{ task.title }}</text>
                  </view>
                  <text
                    v-if="task.previewMeta"
                    class="cl-preview-meta"
                    :class="{
                      'is-ledger': task.previewMeta.type === 'ledger',
                      'is-urgent': task.previewMeta.type === 'urgent',
                      'is-overdue': task.previewMeta.type === 'overdue'
                    }"
                  >{{ task.previewMeta.text }}</text>
                </view>
              </view>
              <view
                v-if="room.checklistStats.pending > 2"
                class="cl-more-link"
                @click.stop="$emit('openChecklist', room)"
              >
                <text class="cl-more-text">还有 {{ room.checklistStats.pending - 2 }} 条待处理</text>
                <text class="cl-more-arrow">›</text>
              </view>
            </block>
            <view v-else class="cl-empty-hint">
              <text>暂无待处理</text>
            </view>
          </view>

          <!-- 生日/日程空间：提醒式预览 -->
          <view v-else-if="room.primaryFeature === 'schedule'" class="core-data schedule-content">
            <view class="cl-header-row">
              <text class="data-label sch-section-label">即将到来</text>
              <text class="cl-badge-txt">{{ room.schedulePreview.totalCount }}个事件</text>
            </view>

            <block v-if="room.schedulePreview.previewEvents.length > 0">
              <view class="sch-preview-list">
                <view
                  v-for="(item, sIdx) in room.schedulePreview.previewEvents"
                  :key="item.id || sIdx"
                  class="sch-preview-row animate-item-pop"
                  :style="{ animationDelay: (index * 0.1 + sIdx * 0.08) + 's' }"
                >
                  <view class="sch-preview-main">
                    <view class="sch-preview-title-row">
                      <text class="sch-preview-emoji">{{ item.emoji }}</text>
                      <text class="sch-preview-title">{{ item.title }}</text>
                    </view>
                    <text class="sch-preview-sub">{{ item.subline }}</text>
                  </view>
                  <text
                    class="sch-preview-countdown"
                    :class="{ 'is-today': item.daysLeft === 0 }"
                  >{{ item.countdownLabel }}</text>
                </view>
              </view>

              <view
                v-if="room.schedulePreview.hasMore"
                class="cl-more-link"
                @click.stop="handleRoomClick(room)"
              >
                <text class="cl-more-text">还有 {{ room.schedulePreview.moreCount }} 个即将到来</text>
                <text class="cl-more-arrow">›</text>
              </view>
            </block>
            <view v-else class="cl-empty-hint">
              <text>暂无即将到来的事件</text>
            </view>
          </view>

          <view class="card-footer-row">
            <view class="members-area">
              <view class="avt-stack">
                <image v-for="(member, idx) in (room.membersArray || []).slice(0, 3)" :key="member.user_id || idx" :src="member.avatar || `https://i.pravatar.cc/100?u=h${room.id}${idx}`" class="mini-avt" />
                <view class="avt-invite-btn" @click.stop="$emit('invite', room)"><text class="invite-plus">+</text></view>
              </view>
              <text class="member-count-txt">{{(room.membersArray || []).length }} 人协作</text>
            </view>
            <view class="enter-btn-pill"><text>进入</text><text class="p-arrow">→</text></view>
          </view>
        </view>
      </view>

      <view v-if="rooms.length > 3" class="explore-more-card animate-slide-up" @click="$emit('viewAll')" style="animation-delay: 0.2s">
        <view class="explore-glass-overlay"></view>
        <view class="explore-content">
          <view class="explore-left">
            <view class="emoji-cluster">
              <view v-for="(r, idx) in rooms.slice(3, 6)" :key="r.id" class="cluster-icon" :style="{ transform: `translate(${idx * 12}px, ${idx % 2 === 0 ? -4 : 4}px) rotate(${idx * 5}deg)`, zIndex: 5 - idx }">{{ r.icon }}</view>
            </view>
            <view class="explore-info">
              <text class="explore-title">查看更多空间</text>
              <text class="explore-desc">还有 {{ rooms.length - 3 }} 个活跃空间待管理</text>
            </view>
          </view>
          <view class="explore-right">
            <view class="go-btn-pill"><text>浏览</text><text class="go-arrow">›</text></view>
          </view>
        </view>
      </view>
    </block>
  </view>
</template>

<script setup>
import { useAppTheme } from '@/common/themes/useAppTheme.js'
const { themeClass, primaryColor, softColor, theme } = useAppTheme()

import { computed } from 'vue'
import { formatPrice } from '../../pages/js/utils.js'
import { buildHomeChecklistPreview, normalizeRoomTasksList } from '../../common/utils/checklistTaskDisplay.js'
import { buildHomeSchedulePreview } from '../../common/utils/scheduleHomePreview.js'

const props = defineProps({
  rooms: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: Boolean, default: false }
})

const isImageUrl = (val) => {
  if (typeof val !== 'string') return false;
  const v = val.toLowerCase();
  return v.startsWith('http') || v.startsWith('/') || v.startsWith('data:image') || v.includes('.png') || v.includes('.jpg') || v.includes('.jpeg') || v.includes('.webp');
};

const roomsWithMembers = computed(() => {
  return (props.rooms || []).map(room => {
    const membersRaw = room.members
    let membersArray = []
    if (!membersRaw) membersArray = []
    else if (Array.isArray(membersRaw)) membersArray = membersRaw
    else { try { membersArray = JSON.parse(membersRaw) } catch { membersArray = [] } }

    const featsRaw = room.enabled_features || room.enabledFeatures
    let featuresArray = []
    if (!featsRaw) featuresArray = []
    else if (Array.isArray(featsRaw)) featuresArray = featuresArray
    else {
      try { featuresArray = JSON.parse(featsRaw) }
      catch {
        if (typeof featsRaw === 'string') {
          featuresArray = featsRaw.split(',').map(code => ({
            code: code.trim(),
            name: code === 'ledger' ? '记账' : code === 'checklist' ? '清单' : code === 'schedule' ? '日程' : code,
            icon: '✨'
          }))
        } else featuresArray = []
      }
    }

    const tasksRaw = room.homeChecklistTasks || room.tasksJson || room.tasks || room.taskList
    const tasksArray = normalizeRoomTasksList(tasksRaw)
    const schedulesRaw = room.schedulesJson || room.schedules

    let primaryFeature = room.primaryFeature || ''
    if (!primaryFeature && featuresArray.length > 0) primaryFeature = featuresArray[0].code || 'ledger'

    const checklistRoomData = primaryFeature === 'checklist'
      ? buildHomeChecklistPreview(tasksArray)
      : { checklistStats: { pending: 0, urgent: 0, overdue: 0 }, previewTasks: [] }

    const scheduleRoomData = primaryFeature === 'schedule'
      ? buildHomeSchedulePreview(schedulesRaw)
      : { schedulePreview: { totalCount: 0, previewEvents: [], hasMore: false, moreCount: 0 } }

    return {
      ...room,
      membersArray,
      featuresArray,
      tasksArray,
      primaryFeature,
      ...checklistRoomData,
      ...scheduleRoomData
    }
  })
})

const emit = defineEmits(['select', 'openChecklist', 'viewAll', 'invite', 'retry']);

const handleRoomClick = (room) => {
  if (room.primaryFeature === 'checklist') {
    emit('openChecklist', room)
    return
  }
  emit('select', room)
}
</script>

<style scoped>
.cl-header-row{ display: flex; flex-direction: row; justify-content: space-between; align-content: center; align-items: center; margin-bottom: 12px; }
.cl-badge-txt{ font-size: 10px; font-weight: 900; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px; display: block; }
.rooms-stream { display: flex; flex-direction: column; }
.section-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.section-title { font-size: 19px; font-weight: 900; color: #1E293B; }
.all-btn {
  background: var(--primary-color, #1E293B);
  padding: 6px 12px;
  border-radius: 100px;
  display: flex;
  transition: background 0.35s ease;
}
.all-btn text { font-size: 12px; font-weight: 800; color: #ffffff; }

.pro-feature-card { background: #fff; border-radius: 40px; padding: 20px; margin-bottom: 16px; position: relative; overflow: hidden; border: 1px solid #F1F5F9; box-shadow: 0 12px 40px rgba(0,0,0,0.02); }
.card-glow { position: absolute; top: -50px; right: -50px; width: 160px; height: 160px; border-radius: 50%; filter: blur(50px); opacity: 0.3; }
.theme-ledger .card-glow { background: var(--primary-color, #4F46E5); }
.theme-checklist .card-glow { background: #10B981; }
.theme-schedule .card-glow { background: #F59E0B; }

.card-header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
.room-identity { display: flex; align-items: center; gap: 14px; }
.room-icon-box { width: 48px; height: 48px; background: #F8FAFC; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 24px; overflow: hidden; }
.room-icon-img { width: 32px; height: 32px; border-radius: 16px; }
.room-name-text { font-size: 18px; font-weight: 900; color: #1E293B; }
.feature-pills { display: flex; gap: 6px; margin-top: 4px; }
.f-pill { font-size: 9px; font-weight: 800; color: #94A3B8; background: #F8FAFC; padding: 2px 8px; border-radius: 6px; display: flex; align-items: center; gap: 4px; }
.f-pill-img { width: 12px; height: 12px; border-radius: 2px; }

.active-tag { display: flex; align-items: center; gap: 5px; background: rgba(16, 185, 129, 0.08); padding: 4px 10px; border-radius: 100px; }
.active-dot { width: 6px; height: 6px; background: #10B981; border-radius: 50%; }
.active-txt { font-size: 10px; font-weight: 900; color: #10B981; }

.core-data { margin-bottom: 10px; }
.data-label { font-size: 10px; font-weight: 900; color: #CBD5E1; text-transform: uppercase; letter-spacing: 1.5px;  display: block; }

.ledger-dual-row { display: flex; align-items: flex-start; gap: 4px; }
.ledger-col { flex: 1; display: flex; flex-direction: column; }
.ledger-v-divider { width: 1px; height: 50px; background: #F1F5F9; margin: 10px 16px 0; }
.price-wrap { display: flex; align-items: baseline; gap: 2px; }
.currency { font-size: 14px; font-weight: 900; color: #1E293B; }
.amount-number { font-size: 18px; font-weight: 900; color: #1E293B; letter-spacing: -0.5px; }
.amount-number.inc { color: #F43F5E; }
.amount-number.exp { color: #10B981; }
.col-footer-hint { font-size: 9px; font-weight: 700; color: #CBD5E1; margin-top: 6px; }

.cl-stats-line {
  font-size: 13px;
  font-weight: 800;
  color: #475569;
  margin-bottom: 12px;
  display: block;
  letter-spacing: -0.2px;
}
.cl-preview-label {
  font-size: 10px;
  font-weight: 900;
  color: #CBD5E1;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
  display: block;
}
.cl-preview-list { display: flex; flex-direction: column; gap: 6px; }
.cl-preview-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 0;
  min-width: 0;
}
.cl-preview-dot {
  font-size: 12px;
  color: #CBD5E1;
  flex-shrink: 0;
  line-height: 1;
}
.cl-preview-title-wrap {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}
.cl-preview-title {
  display: block;
  width: 100%;
  font-size: 14px;
  font-weight: 700;
  color: #334155;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cl-preview-meta {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 700;
  color: #94A3B8;
  white-space: nowrap;
  margin-left: 2px;
}
.cl-preview-meta.is-urgent,
.cl-preview-meta.is-overdue { color: #F43F5E; }
.cl-preview-meta.is-ledger { color: #475569; font-weight: 800; }
.cl-more-link {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  padding-top: 2px;
}
.cl-more-text { font-size: 11px; font-weight: 800; color: var(--primary-color, #4F46E5); }
.cl-more-arrow { font-size: 11px; font-weight: 900; color: var(--primary-color, #4F46E5); line-height: 1; }
.cl-empty-hint { padding: 8px 0 2px; }
.cl-empty-hint text { font-size: 12px; font-weight: 700; color: #CBD5E1; }

.premium-mini-list { display: flex; flex-direction: column; gap: 10px; }
.p-mini-item { 
  background: #fff; border-radius: 20px; padding: 16px; 
  display: flex; align-items: center; gap: 14px;
  border: 1px solid #F1F5F9; 
  box-shadow: 0 4px 10px rgba(0,0,0,0.01), inset 0 0 10px rgba(248,250,252,0.5);
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.p-mini-item:active { transform: scale(0.98); background: #F8FAFC; }
.p-status-box { flex-shrink: 0; }
.p-circle-indicator { width: 14px; height: 14px; border: 2.5px solid #E2E8F0; border-radius: 50%; transition: all 0.3s; }
.p-urgent-item { background: #FFF5F5; border-color: #FEE2E2; box-shadow: 0 4px 12px rgba(244, 63, 94, 0.05); }
.p-urgent-item .p-circle-indicator { border-color: #F43F5E; }
@keyframes statusPulse { 0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.4); } 70% { transform: scale(1.1); box-shadow: 0 0 0 8px rgba(244, 63, 94, 0); } 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(244, 63, 94, 0); } }
.urgent-pulse { animation: statusPulse 2s infinite ease-in-out; }
.p-content-box { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.p-title-row { display: flex; align-items: center; gap: 8px; }
.p-task-title { font-size: 14px; font-weight: 800; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.urgent-tag-mini { font-size: 8px; font-weight: 900; color: #F43F5E; background: #FFE4E6; padding: 2px 6px; border-radius: 4px; letter-spacing: 0.5px; }
.p-task-desc { font-size: 11px; font-weight: 600; color: #94A3B8; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.p-time-hint { font-size: 10px; font-weight: 900; color: #CBD5E1; text-transform: uppercase; flex-shrink: 0; }
.p-more-link { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 12px 0 4px; margin-top: 4px; }
.p-more-txt { font-size: 12px; font-weight: 800; color: var(--primary-color, #4F46E5); }
.p-more-arrow { font-size: 16px; color: var(--primary-color, #4F46E5); line-height: 1; }
.p-empty-box { text-align: center; padding: 30px 0; background: #F8FAFC; border-radius: 24px; border: 1.5px dashed #E2E8F0; }
.p-empty-icon { font-size: 24px; margin-bottom: 6px; opacity: 0.5; }
.p-empty-txt { font-size: 12px; font-weight: 800; color: #CBD5E1; }

/* 生日/日程空间：首页提醒预览 */
.sch-section-label {
  font-size: 13px;
  font-weight: 800;
  color: #475569;
  text-transform: none;
  letter-spacing: -0.2px;
}
.sch-preview-list { display: flex; flex-direction: column; gap: 8px; }
.sch-preview-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 2px 0;
  min-width: 0;
}
.sch-preview-main {
  flex: 1;
  min-width: 0;
}
.sch-preview-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.sch-preview-emoji {
  font-size: 14px;
  line-height: 1;
  flex-shrink: 0;
}
.sch-preview-title {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 700;
  color: #1F2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sch-preview-sub {
  display: block;
  margin-top: 3px;
  margin-left: 20px;
  font-size: 11px;
  font-weight: 600;
  color: #94A3B8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sch-preview-countdown {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 700;
  color: #7C3AED;
}
.sch-preview-countdown.is-today {
  color: #635BFF;
}

/* ------------------------------------------------------------------
   通用动画
   ------------------------------------------------------------------ */
@keyframes itemPop { from { opacity: 0; transform: scale(0.9) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
.animate-item-pop { animation: itemPop 0.5s cubic-bezier(0.19, 1, 0.22, 1) both; }

.card-footer-row { display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid #F8FAFC; margin-top: 10px; }
.members-area { display: flex; align-items: center; gap: 12px; }
.avt-stack { display: flex; align-items: center; }
.mini-avt { width: 32px; height: 32px; border-radius: 50%; border: 3px solid #fff; margin-right: -12px; background: #eee; }
.avt-invite-btn { width: 32px; height: 32px; border-radius: 50%; background: #fff; border: 2px dashed #CBD5E1; margin-left: -4px; z-index: 5; display: flex; align-items: center; justify-content: center; }
.invite-plus { font-size: 18px; color: #94A3B8; font-weight: bold; }
.member-count-txt { font-size: 11px; font-weight: 800; color: #94A3B8; margin-left: 4px; }
.enter-btn-pill {
  background: var(--primary-color, #4F46E5);
  color: #fff;
  padding: 8px 16px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 900;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 8px 20px var(--primary-glow, rgba(79, 70, 229, 0.2));
  transition: background 0.35s ease, box-shadow 0.35s ease;
}

.explore-more-card { position: relative; height: 88px; border-radius: 32px; overflow: hidden; background: #fff; border: 1px solid #F1F5F9; box-shadow: 0 10px 30px rgba(0,0,0,0.02); margin-bottom: 20px; transition: transform 0.3s cubic-bezier(0.19, 1, 0.22, 1); }
.explore-glass-overlay { position: absolute; inset: 0; z-index: 1; background: linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.4) 100%); backdrop-filter: blur(10px); }
.explore-content { position: relative; z-index: 2; height: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; }
.explore-left { display: flex; align-items: center; gap: 20px; }
.emoji-cluster { position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; }
.cluster-icon { position: absolute; font-size: 20px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1)); }
.explore-info { display: flex; flex-direction: column; gap: 2px; }
.explore-title { font-size: 15px; font-weight: 900; color: #1E293B; letter-spacing: -0.2px; }
.explore-desc { font-size: 11px; font-weight: 700; color: #94A3B8; }
.go-btn-pill { background: #F1F5F9; padding: 8px 16px; border-radius: 100px; display: flex; align-items: center; gap: 6px; }
.go-btn-pill text { font-size: 12px; font-weight: 900; color: #64748B; }

.animate-slide-up { animation: slideUp 0.6s cubic-bezier(0.19, 1, 0.22, 1) both; }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

.error-state { padding: 60px 40px; display: flex; flex-direction: column; align-items: center; text-align: center; background: #fff; border-radius: 40px; border: 1px solid #F1F5F9; box-shadow: 0 12px 40px rgba(0,0,0,0.01); }
.error-visual { position: relative; width: 100px; height: 100px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; }
.error-orb { position: absolute; inset: 0; background: #F1F5F9; border-radius: 35% 65% 70% 30% / 30% 30% 70% 70%; animation: morphing 8s infinite alternate ease-in-out; }
@keyframes morphing { 0% { border-radius: 35% 65% 70% 30% / 30% 30% 70% 70%; } 100% { border-radius: 70% 30% 30% 70% / 70% 70% 30% 30%; transform: rotate(15deg); } }
.error-emoji { font-size: 44px; position: relative; z-index: 1; animation: pulseShake 2s infinite ease-in-out; }
@keyframes pulseShake { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1) rotate(5deg); } }
.error-title { font-size: 18px; font-weight: 900; color: #1E293B; margin-bottom: 8px; }
.error-desc { font-size: 13px; font-weight: 700; color: #94A3B8; line-height: 1.5; margin-bottom: 30px; }
.retry-btn-pill {
  background: var(--primary-color, #4F46E5);
  padding: 12px 36px;
  border-radius: 100px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 10px 20px var(--primary-glow, rgba(79, 70, 229, 0.2));
  transition: all 0.35s ease;
}
.retry-btn-pill:active { transform: scale(0.95); opacity: 0.9; }
.retry-btn-pill text { color: #fff; font-size: 14px; font-weight: 900; }
.retry-icon { font-size: 16px; margin-bottom: 2px; }

.skeleton-card { pointer-events: none; border-color: rgba(241, 245, 249, 0.5); }
.skeleton-header { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
.sk-icon { width: 44px; height: 44px; border-radius: 14px; }
.sk-info { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.sk-title { width: 40%; height: 16px; border-radius: 4px; }
.sk-pill { width: 20%; height: 10px; border-radius: 4px; }
.sk-tag { width: 48px; height: 20px; border-radius: 100px; }
.skeleton-body { margin-bottom: 24px; }
.sk-data-block { height: 54px; border-radius: 20px; width: 100%; }
.skeleton-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid #F8FAFC; }
.sk-avt-group { display: flex; align-items: center; }
.sk-circle { width: 24px; height: 24px; border-radius: 50%; border: 2px solid #fff; margin-right: -8px; }
.sk-enter-btn { width: 50px; height: 16px; border-radius: 8px; }
.shimmer { position: relative; overflow: hidden; background: #F1F5F9 !important; }
.shimmer::after { position: absolute; top: 0; right: 0; bottom: 0; left: 0; transform: translateX(-100%); background-image: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent); animation: shimmerAnim 2s infinite; content: ''; }
@keyframes shimmerAnim { 100% { transform: translateX(100%); } }
</style>